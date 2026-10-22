// The game, stored in pi-durable.
//
// Each room is a durable conversation. Its state is the `framed.room` document, and every move is one atomic
// commit. Round deadlines are durable background tasks, so a restarted server finishes rounds on time. An optional
// AI host, "the Projectionist", answers questions and gives hints from the same room conversation.
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import type { Models } from "@earendil-works/pi-ai/models";
import {
	AssistantEntry,
	type Conversation,
	type ConversationId,
	createRegistry,
	defineDoc,
	defineExtension,
	defineTask,
	Harness,
	section,
	type Storage,
	type Tx,
} from "@earendil-works/pi-durable";
import { isCorrect, MOVIES, movie } from "./movies.ts";

const ctx = BACKGROUND_CONTEXT;

export const FRAMES = 6;
let REVEAL_MS = 14_000;
let MIN_SECONDS = 30;
const CHAT_LIMIT = 80;
const HINT_COST = 100;
const COLORS = ["#ffcc4d", "#ff6b6b", "#4dd2ff", "#7cff8a", "#c58bff", "#ff9f43", "#f78fb3", "#2ee6c5", "#e6e14d", "#9aa7ff"];

export type Guess = { text: string; correct: boolean; skip: boolean; at: number };
export type Progress = { guesses: Guess[]; solvedAt: number | null; points: number; hints: number };
export type Player = { id: string; name: string; color: string; score: number; joinedAt: number };
export type ChatLine = { id: number; kind: "chat" | "system" | "host"; from: string | null; name: string; text: string; at: number };
export type RoundResult = {
	reel: string;
	title: string;
	year: number;
	trivia: string;
	progress: Record<string, Progress>;
};
export type RoomState = {
	code: string;
	createdAt: number;
	hostId: string;
	status: "lobby" | "playing" | "reveal" | "over";
	settings: { rounds: number; seconds: number };
	players: Record<string, Player>;
	deck: string[];
	round: number;
	seq: number;
	endsAt: number | null;
	progress: Record<string, Progress>;
	results: RoundResult[];
	chat: ChatLine[];
	chatSeq: number;
	pendingAsks: string[];
	quipRound: number;
};

export const Room = defineDoc<RoomState>({
	kind: "framed.room",
	version: 1,
	scope: "conversation",
	history: "latest",
	fork: "current",
	initial: () => ({
		code: "",
		createdAt: 0,
		hostId: "",
		status: "lobby",
		settings: { rounds: 6, seconds: 120 },
		players: {},
		deck: [],
		round: 0,
		seq: 0,
		endsAt: null,
		progress: {},
		results: [],
		chat: [],
		chatSeq: 0,
		pendingAsks: [],
		quipRound: -1,
	}),
});

// Room code -> conversation id, for the whole Session.
const Directory = defineDoc<{ rooms: Record<string, string> }>({
	kind: "framed.directory",
	version: 1,
	scope: "session",
	initial: () => ({ rooms: {} }),
});

export class GameError extends Error {}

// ---------------------------------------------------------------------------------------------------------------
// Pure rules over a room draft. Each runs inside one commit.

function say(room: RoomState, line: Omit<ChatLine, "id" | "at">, now: number): void {
	room.chatSeq += 1;
	room.chat.push({ ...line, id: room.chatSeq, at: now });
	if (room.chat.length > CHAT_LIMIT) room.chat.splice(0, room.chat.length - CHAT_LIMIT);
}

function progressOf(room: RoomState, playerId: string): Progress {
	let progress = room.progress[playerId];
	if (progress === undefined) {
		room.progress[playerId] = { guesses: [], solvedAt: null, points: 0, hints: 0 };
		progress = room.progress[playerId]!;
	}
	return progress;
}

export function isDone(progress: Progress | undefined): boolean {
	return progress !== undefined && (progress.solvedAt !== null || progress.guesses.length >= FRAMES);
}

function shuffle<T>(items: T[]): T[] {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[items[i], items[j]] = [items[j]!, items[i]!];
	}
	return items;
}

async function scheduleClock(tx: Tx, conversationId: ConversationId, room: RoomState, at: number): Promise<void> {
	room.seq += 1;
	room.endsAt = at;
	// Background: a deadline must not keep the conversation busy, or hold up the AI host's answers.
	await tx.createTask(Clock, { seq: room.seq, at }, { ownership: { kind: "conversation" }, conversationId, background: true });
}

async function startRound(tx: Tx, conversationId: ConversationId, room: RoomState, now: number): Promise<void> {
	room.status = "playing";
	room.progress = {};
	for (const id of Object.keys(room.players)) progressOf(room, id);
	await scheduleClock(tx, conversationId, room, now + room.settings.seconds * 1000);
	say(room, { kind: "system", from: null, name: "", text: `🎬 Reel ${room.round + 1} of ${room.deck.length}. Lights down!` }, now);
}

async function endRound(tx: Tx, conversationId: ConversationId, room: RoomState, now: number): Promise<void> {
	const answer = movie(room.deck[room.round]!);
	room.status = "reveal";
	room.results.push({
		reel: answer.reel,
		title: answer.title,
		year: answer.year,
		trivia: answer.trivia,
		progress: JSON.parse(JSON.stringify(room.progress)),
	});
	const solvers = Object.entries(room.progress).filter(([, p]) => p.solvedAt !== null).length;
	say(room, { kind: "system", from: null, name: "", text: `🍿 It was ${answer.title} (${answer.year}). ${solvers} of ${Object.keys(room.progress).length} got it.` }, now);
	await scheduleClock(tx, conversationId, room, now + REVEAL_MS);
}

async function nextRound(tx: Tx, conversationId: ConversationId, room: RoomState, now: number): Promise<void> {
	if (room.round + 1 >= room.deck.length) {
		room.status = "over";
		room.endsAt = null;
		room.seq += 1;
		const ranking = Object.values(room.players).sort((a, b) => b.score - a.score);
		const winner = ranking[0];
		say(room, { kind: "system", from: null, name: "", text: winner ? `🏆 ${winner.name} wins with ${winner.score} points!` : "That's a wrap." }, now);
		return;
	}
	room.round += 1;
	await startRound(tx, conversationId, room, now);
}

/** Ends the round early once every connected player is finished. */
async function maybeEndEarly(tx: Tx, conversationId: ConversationId, room: RoomState, now: number, online: ReadonlySet<string>): Promise<void> {
	if (room.status !== "playing") return;
	const active = Object.keys(room.players).filter((id) => online.has(id));
	if (active.length > 0 && active.every((id) => isDone(room.progress[id]))) await endRound(tx, conversationId, room, now);
}

// A durable deadline. It sleeps until `at`, then moves the room on, unless something else already did (`seq`).
// After a restart the phase runs again and sleeps for whatever is left.
const Clock = defineTask<{ seq: number; at: number }, { phase: "wait" }, null>({
	name: "framed.clock",
	version: 1,
	initial: () => ({ phase: "wait" }),
	phases: {
		wait: async (task, runtime, context) => {
			if (task.input.at > runtime.now()) await runtime.sleep(task.input.at, context);
			await runtime.commit(async (tx) => {
				const room = await tx.doc(Room, runtime.conversationId);
				if (room.seq === task.input.seq) {
					const now = runtime.now();
					if (room.status === "playing") await endRound(tx, runtime.conversationId, room, now);
					else if (room.status === "reveal") await nextRound(tx, runtime.conversationId, room, now);
				}
				return { status: "terminal", outcome: { status: "completed", result: null } };
			}, context);
		},
	},
	abort: (_task, runtime, context) =>
		runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), context),
});

// ---------------------------------------------------------------------------------------------------------------
// The AI host. Its system prompt is rendered from the room document before each request.

const Projectionist = defineExtension({
	name: "projectionist",
	tasks: [Clock],
	sections: [
		section(
			"preamble",
			() =>
				[
					"You are the Projectionist, the witty host of a multiplayer movie-guessing game called Framed 3D.",
					"Players see six low-poly 3D dioramas of a famous movie scene, one more revealed per wrong guess.",
					"Reply in at most two short sentences. Be playful, like a cinephile at a midnight screening.",
					"While a round is playing, NEVER say the movie's title, its actors, directors, characters, or quote its title.",
					"When asked for a hint, give one cryptic but fair clue that fits how many frames the player has seen: vaguer early, sharper late.",
				].join("\n"),
			{ tag: false },
		),
		section("game", async (input, context) => {
			const room = await input.read.snapshot(Room, input.conversationId, context);
			if (room === undefined) return undefined;
			const lines = [`Status: ${room.status}. Reel ${room.round + 1} of ${room.deck.length || room.settings.rounds}.`];
			const reel = room.deck[room.round];
			if (reel !== undefined && room.status !== "lobby") {
				const answer = movie(reel);
				lines.push(`Current movie (secret while playing): ${answer.title} (${answer.year}).`);
			}
			const scores = Object.values(room.players)
				.map((p) => `${p.name}: ${p.score}`)
				.join(", ");
			if (scores) lines.push(`Scores: ${scores}.`);
			return lines.join("\n");
		}),
	],
});

// ---------------------------------------------------------------------------------------------------------------

export type GameOptions = {
	storage: Storage;
	models: Models;
	model: { provider: string; modelId: string } | undefined;
	onReport?: (error: unknown) => void;
	/** Test knobs. */
	revealMs?: number;
	minRoundSeconds?: number;
};

export class Game {
	readonly harness: Harness;
	readonly aiEnabled: boolean;
	readonly #model: GameOptions["model"];
	readonly #configured = new Set<string>();
	/** Players with an open socket, per room code. Presence is live state, so it is not stored. */
	readonly online = new Map<string, Set<string>>();

	private constructor(harness: Harness, model: GameOptions["model"]) {
		this.harness = harness;
		this.#model = model;
		this.aiEnabled = model !== undefined;
	}

	static async open(options: GameOptions): Promise<Game> {
		if (options.revealMs !== undefined) REVEAL_MS = options.revealMs;
		if (options.minRoundSeconds !== undefined) MIN_SECONDS = options.minRoundSeconds;
		const registry = createRegistry();
		registry.install(Projectionist);
		const harness = await Harness.open(
			options.storage,
			{ models: options.models, registry, onReport: options.onReport, settings: { afterFailedRun: "withdraw" } },
			ctx,
		);
		const game = new Game(harness, options.model);
		harness.resume(); // finishes deadlines the last process left sleeping
		void game.#resumeAsks();
		return game;
	}

	close(): Promise<void> {
		return this.harness.close(ctx);
	}

	onlineIn(code: string): Set<string> {
		let set = this.online.get(code);
		if (set === undefined) {
			set = new Set();
			this.online.set(code, set);
		}
		return set;
	}

	async rooms(): Promise<Record<string, string>> {
		return (await this.harness.snapshot(Directory, ctx))?.rooms ?? {};
	}

	async conversation(code: string): Promise<Conversation | undefined> {
		const id = (await this.rooms())[code.toUpperCase()];
		return id === undefined ? undefined : this.harness.conversation(id as ConversationId, ctx);
	}

	async createRoom(): Promise<string> {
		const conversation = await this.harness.createConversation({ ownership: { kind: "ownerless" } }, ctx);
		const taken = await this.rooms();
		let code = "";
		do code = Array.from({ length: 4 }, () => "BCDFGHJKLMNPQRSTVWXZ"[Math.floor(Math.random() * 20)]).join("");
		while (taken[code] !== undefined);
		await this.harness.commit(async (tx) => {
			(await tx.doc(Directory)).rooms[code] = conversation.id;
			const room = await tx.doc(Room, conversation.id);
			room.code = code;
			room.createdAt = Date.now();
		}, ctx);
		return code;
	}

	/** One atomic move on a room. Throwing a GameError rolls the whole move back. */
	async #move<T>(code: string, change: (room: RoomState, tx: Tx, conversationId: ConversationId) => T | Promise<T>): Promise<T> {
		const conversation = await this.conversation(code);
		if (conversation === undefined) throw new GameError("No such room");
		return conversation.commit(async (tx) => change(await tx.doc(Room, conversation.id), tx, conversation.id), ctx);
	}

	/** A read-only look at a room for the admission screen: who's seated, and whether this player already has a seat. */
	async peek(code: string, playerId: string) {
		const id = (await this.rooms())[code.toUpperCase()];
		if (id === undefined) return undefined;
		const room = await this.harness.snapshot(Room, id as ConversationId, ctx);
		if (room === undefined) return undefined;
		const online = this.onlineIn(room.code);
		const players = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);
		return {
			code: room.code,
			status: room.status,
			host: room.players[room.hostId]?.name ?? null,
			players: players.map((p) => ({ name: p.name, color: p.color, online: online.has(p.id), host: p.id === room.hostId })),
			you: room.players[playerId]?.name ?? null,
		};
	}

	join(code: string, playerId: string, rawName: string): Promise<void> {
		const name = rawName.trim().slice(0, 18) || "Anonymous";
		return this.#move(code, (room) => {
			const now = Date.now();
			const existing = room.players[playerId];
			if (existing !== undefined) {
				if (existing.name !== name) existing.name = name;
				return;
			}
			const used = new Set(Object.values(room.players).map((p) => p.color));
			const color = COLORS.find((c) => !used.has(c)) ?? COLORS[Object.keys(room.players).length % COLORS.length]!;
			room.players[playerId] = { id: playerId, name, color, score: 0, joinedAt: now };
			if (room.hostId === "" || room.players[room.hostId] === undefined) room.hostId = playerId;
			say(room, { kind: "system", from: null, name: "", text: `${name} found a seat.` }, now);
		});
	}

	start(code: string, playerId: string, settings: { rounds?: number; seconds?: number }): Promise<void> {
		return this.#move(code, async (room, tx, id) => {
			if (room.hostId !== playerId) throw new GameError("Only the host can start the show");
			if (room.status === "playing" || room.status === "reveal") throw new GameError("A game is already running");
			const rounds = Math.max(1, Math.min(MOVIES.length, Math.round(settings.rounds ?? room.settings.rounds)));
			const seconds = Math.max(MIN_SECONDS, Math.min(600, Number(settings.seconds ?? room.settings.seconds)));
			room.settings = { rounds, seconds };
			room.deck = shuffle(MOVIES.map((m) => m.reel)).slice(0, rounds);
			room.round = 0;
			room.results = [];
			room.quipRound = -1;
			for (const player of Object.values(room.players)) player.score = 0;
			await startRound(tx, id, room, Date.now());
		});
	}

	guess(code: string, playerId: string, text: string, skip: boolean): Promise<{ correct: boolean; points: number }> {
		return this.#move(code, async (room, tx, id) => {
			if (room.status !== "playing") throw new GameError("No reel is playing");
			if (room.players[playerId] === undefined) throw new GameError("Join the room first");
			const progress = progressOf(room, playerId);
			if (isDone(progress)) throw new GameError("You're done with this reel");
			const now = Date.now();
			const guessText = skip ? "" : text.trim().slice(0, 120);
			if (!skip && guessText === "") throw new GameError("Type a movie title");
			const correct = !skip && isCorrect(room.deck[room.round]!, guessText);
			progress.guesses.push({ text: guessText, correct, skip, at: now });
			let points = 0;
			if (correct) {
				const firstSolver = Object.entries(room.progress).every(([id, p]) => id === playerId || p.solvedAt === null);
				const frame = progress.guesses.length; // 1..6
				points = Math.max(50, (FRAMES + 1 - frame) * 100 + (firstSolver ? 50 : 0) - progress.hints * HINT_COST);
				progress.solvedAt = now;
				progress.points = points;
				room.players[playerId]!.score += points;
				const player = room.players[playerId]!;
				say(room, { kind: "system", from: null, name: "", text: `✅ ${player.name} got it on frame ${frame}${firstSolver ? " — first!" : ""} (+${points})` }, now);
			}
			await maybeEndEarly(tx, id, room, now, this.onlineIn(room.code));
			return { correct, points };
		});
	}

	chat(code: string, playerId: string, text: string): Promise<void> {
		return this.#move(code, (room) => {
			const player = room.players[playerId];
			if (player === undefined) throw new GameError("Join the room first");
			const clean = text.trim().slice(0, 280);
			if (clean === "") return;
			// No spoilers: while playing, a chat line that is the answer is swallowed.
			if (room.status === "playing" && isCorrect(room.deck[room.round]!, clean)) throw new GameError("Nice try. Guess it in the box, not the chat 😉");
			say(room, { kind: "chat", from: playerId, name: player.name, text: clean }, Date.now());
		});
	}

	next(code: string, playerId: string): Promise<void> {
		return this.#move(code, async (room, tx, id) => {
			if (room.hostId !== playerId) throw new GameError("Only the host can roll the next reel");
			const now = Date.now();
			if (room.status === "reveal") await nextRound(tx, id, room, now);
			else if (room.status === "playing") await endRound(tx, id, room, now);
		});
	}

	lobby(code: string, playerId: string): Promise<void> {
		return this.#move(code, (room) => {
			if (room.hostId !== playerId) throw new GameError("Only the host can do that");
			if (room.status !== "over") throw new GameError("The show isn't over yet");
			room.status = "lobby";
			room.seq += 1;
			room.endsAt = null;
		});
	}

	/** A presence change can finish a round: everyone still here may be done. */
	presenceChanged(code: string): Promise<void> {
		return this.#move(code, (room, tx, id) => maybeEndEarly(tx, id, room, Date.now(), this.onlineIn(code))).catch(() => {});
	}

	// --- AI host -------------------------------------------------------------------------------------------------

	/** A question or hint request for the Projectionist. A hint during play costs points on that reel. */
	async ask(code: string, playerId: string, text: string, hint: boolean): Promise<void> {
		if (!this.aiEnabled) throw new GameError("The Projectionist is off tonight (no model API key on the server)");
		const conversation = await this.conversation(code);
		if (conversation === undefined) throw new GameError("No such room");
		const prompt = await this.#move(code, (room) => {
			const player = room.players[playerId];
			if (player === undefined) throw new GameError("Join the room first");
			const now = Date.now();
			const question = text.trim().slice(0, 280) || "Can I get a hint?";
			let context = `status ${room.status}`;
			if (room.status === "playing") {
				const progress = progressOf(room, playerId);
				if (hint) {
					if (isDone(progress)) throw new GameError("You're already done with this reel");
					if (progress.hints >= 2) throw new GameError("Two hints per reel. The Projectionist has standards.");
					progress.hints += 1;
				}
				const wrong = progress.guesses.filter((g) => !g.correct && !g.skip).map((g) => g.text);
				context = `seen ${Math.min(FRAMES, progress.guesses.length + 1)} of ${FRAMES} frames; wrong guesses so far: ${wrong.join("; ") || "none"}`;
			}
			say(room, { kind: "chat", from: playerId, name: player.name, text: hint ? `🔦 asks for a hint (−${HINT_COST})` : `@projectionist ${question}` }, now);
			return `${player.name} (${context}) ${hint ? "asks for a hint." : `says: ${question}`}`;
		});
		await this.#submit(code, conversation, prompt);
	}

	/** Called on each revealed round, once: a quip about how it went. */
	async quip(code: string): Promise<void> {
		if (!this.aiEnabled) return;
		const conversation = await this.conversation(code);
		if (conversation === undefined) return;
		const prompt = await this.#move(code, (room) => {
			if (room.status !== "reveal" || room.quipRound === room.round) return undefined;
			room.quipRound = room.round;
			const result = room.results[room.results.length - 1];
			if (result === undefined) return undefined;
			const lines = Object.entries(result.progress).map(([id, p]) => {
				const name = room.players[id]?.name ?? "someone";
				return p.solvedAt !== null ? `${name} solved it on frame ${p.guesses.length}` : `${name} missed (guesses: ${p.guesses.map((g) => g.text || "skip").join(", ") || "none"})`;
			});
			return `[Round over, the answer is now public: ${result.title}.] ${lines.join("; ")}. React with one quick quip or bit of trivia.`;
		});
		if (prompt !== undefined) await this.#submit(code, conversation, prompt);
	}

	async #submit(code: string, conversation: Conversation, content: string): Promise<void> {
		if (!this.#configured.has(conversation.id)) {
			await conversation.configure({ model: this.#model, thinkingLevel: "minimal" }, ctx);
			this.#configured.add(conversation.id);
		}
		const submission = await conversation.submit(
			{ type: "input", content, requestId: crypto.randomUUID(), entry: { kind: "framed.prompt", data: { content } } },
			ctx,
		);
		await this.#move(code, (room) => void room.pendingAsks.push(submission.id));
		void this.#deliver(code, conversation, submission.id);
	}

	/** Waits for an answer and posts it to the chat. Pending asks are durable, so a restart delivers them too. */
	async #deliver(code: string, conversation: Conversation, submissionId: string): Promise<void> {
		let text = "";
		try {
			const submission = await this.harness.submission(submissionId as never, ctx);
			const settled = submission === undefined ? undefined : await submission.wait(ctx);
			if (settled?.status === "done" && settled.type === "input") {
				const entry = await conversation.commit((tx) => tx.entry(AssistantEntry, settled.answer), ctx);
				const message = entry?.model?.[0];
				if (message !== undefined && message.role === "assistant") {
					text = message.content
						.flatMap((block) => (block.type === "text" ? [block.text] : []))
						.join("")
						.trim();
				}
			} else if (settled !== undefined) {
				text = "🎞️ *the projector jams* (the AI host couldn't answer)";
			}
		} catch (error) {
			text = "🎞️ *the projector jams* (the AI host couldn't answer)";
			console.error("projectionist", error);
		}
		await this.#move(code, (room) => {
			const index = room.pendingAsks.indexOf(submissionId);
			if (index >= 0) room.pendingAsks.splice(index, 1);
			if (text !== "") say(room, { kind: "host", from: null, name: "Projectionist", text: text.slice(0, 600) }, Date.now());
		}).catch((error) => console.error("projectionist", error));
	}

	async #resumeAsks(): Promise<void> {
		for (const [code, id] of Object.entries(await this.rooms())) {
			const room = await this.harness.snapshot(Room, id as ConversationId, ctx);
			const conversation = await this.harness.conversation(id as ConversationId, ctx);
			if (room === undefined || conversation === undefined) continue;
			for (const submissionId of room.pendingAsks) void this.#deliver(code, conversation, submissionId);
		}
	}
}
