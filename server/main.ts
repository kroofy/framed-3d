// HTTP + WebSocket front door. Clients send moves; the server commits them to the durable room and pushes each
// player their own view of the room whenever its document changes.
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import type { ConversationId } from "@earendil-works/pi-durable";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { type WebSocket, WebSocketServer } from "ws";
import { FRAMES, Game, GameError, isDone, Room, type RoomState } from "./game.ts";
import { TITLE_CHOICES } from "./movies.ts";

const ctx = BACKGROUND_CONTEXT;
const root = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.env.PORT ?? 8787);
const DATA = process.env.FRAMED_DATA ?? join(root, "data");

// --- Model for the optional AI host ----------------------------------------------------------------------------
const models = createModels();
let model: { provider: string; modelId: string } | undefined;
if (process.env.ANTHROPIC_API_KEY) {
	models.setProvider(anthropicProvider());
	model = { provider: "anthropic", modelId: "claude-haiku-5-5" };
}
if (process.env.OPENAI_API_KEY) {
	models.setProvider(openaiProvider());
	model ??= { provider: "openai", modelId: "gpt-5.4-mini" };
}
if (process.env.FRAMED_MODEL && model !== undefined) {
	const [provider, ...rest] = process.env.FRAMED_MODEL.split("/");
	model = { provider: provider!, modelId: rest.join("/") };
}
if (process.env.FRAMED_AI === "off") model = undefined;

mkdirSync(DATA, { recursive: true });
const game = await Game.open({
	storage: await openNodeSqliteStorage(join(DATA, "framed.sqlite")),
	models,
	model,
	onReport: (error) => console.error("[pi-durable]", error),
});

// --- Per-player projection -------------------------------------------------------------------------------------

type Mark = "hit" | "miss" | "skip";

function view(room: Readonly<RoomState>, me: string) {
	const online = game.onlineIn(room.code);
	const secret = room.status === "playing";
	const players = Object.values(room.players)
		.map((player) => {
			const progress = room.progress[player.id];
			return {
				id: player.id,
				name: player.name,
				color: player.color,
				score: player.score,
				online: online.has(player.id),
				done: isDone(progress),
				hints: progress?.hints ?? 0,
				marks: (progress?.guesses ?? []).map((g): Mark => (g.correct ? "hit" : g.skip ? "skip" : "miss")),
				// Other players' guess texts stay hidden until the reveal.
				guesses: !secret || player.id === me ? (progress?.guesses ?? []).map((g) => g.text) : null,
			};
		})
		.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
	const mine = room.progress[me];
	return {
		t: "state",
		now: Date.now(),
		me,
		ai: game.aiEnabled,
		frames: FRAMES,
		code: room.code,
		hostId: room.hostId,
		status: room.status,
		settings: room.settings,
		round: room.round,
		totalRounds: room.deck.length || room.settings.rounds,
		endsAt: room.endsAt,
		reel: room.status === "lobby" ? null : (room.deck[room.round] ?? null),
		players,
		my: mine === undefined ? null : { guesses: mine.guesses, solved: mine.solvedAt !== null, points: mine.points, hints: mine.hints, done: isDone(mine) },
		results: room.results.map((r) => ({
			reel: r.reel,
			title: r.title,
			year: r.year,
			trivia: r.trivia,
			mine: (r.progress[me]?.guesses ?? []).map((g): Mark => (g.correct ? "hit" : g.skip ? "skip" : "miss")),
		})),
		chat: room.chat,
	};
}

// --- Rooms with listeners ----------------------------------------------------------------------------------------

type Client = { socket: WebSocket; playerId: string; code: string | null };
type Live = { sockets: Set<Client>; dispose: () => void; value: Readonly<RoomState> | null };
const live = new Map<string, Live>();
const opening = new Map<string, Promise<Live | undefined>>();

function push(code: string): void {
	const room = live.get(code);
	if (room?.value == null) return;
	for (const client of room.sockets) send(client.socket, view(room.value, client.playerId));
}

function watch(code: string): Promise<Live | undefined> {
	const existing = live.get(code);
	if (existing !== undefined) return Promise.resolve(existing);
	let pending = opening.get(code);
	if (pending === undefined) {
		pending = (async () => {
			const id = (await game.rooms())[code];
			if (id === undefined) return undefined;
			const state = await game.harness.documentState(Room, id as ConversationId, ctx);
			if (state === undefined) return undefined;
			const entry: Live = { sockets: new Set(), value: state.value ?? null, dispose: () => {} };
			const unsubscribe = state.subscribe((value) => {
				entry.value = value;
				push(code);
				if (value?.status === "reveal" && value.quipRound !== value.round) void game.quip(code).catch(() => {});
			});
			entry.dispose = () => {
				unsubscribe();
				state.dispose();
			};
			live.set(code, entry);
			return entry;
		})().finally(() => opening.delete(code));
		opening.set(code, pending);
	}
	return pending;
}

async function attach(client: Client, code: string): Promise<void> {
	detach(client);
	const room = await watch(code);
	if (room === undefined) throw new GameError("No such room. Check the code?");
	client.code = code;
	room.sockets.add(client);
	game.onlineIn(code).add(client.playerId);
	push(code);
}

function detach(client: Client): void {
	const code = client.code;
	if (code === null) return;
	client.code = null;
	const room = live.get(code);
	if (room === undefined) return;
	room.sockets.delete(client);
	if (![...room.sockets].some((c) => c.playerId === client.playerId)) {
		game.onlineIn(code).delete(client.playerId);
		void game.presenceChanged(code);
	}
	if (room.sockets.size === 0) {
		room.dispose();
		live.delete(code);
	} else push(code);
}

function send(socket: WebSocket, message: unknown): void {
	if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

// --- Protocol ----------------------------------------------------------------------------------------------------

type Message =
	| { t: "hello"; playerId: string }
	| { t: "create"; name: string }
	| { t: "join"; code: string; name: string }
	| { t: "leave" }
	| { t: "start"; rounds?: number; seconds?: number }
	| { t: "guess"; text: string }
	| { t: "skip" }
	| { t: "chat"; text: string }
	| { t: "ask"; text: string }
	| { t: "hint" }
	| { t: "next" }
	| { t: "lobby" }
	| { t: "ping" };

async function handle(client: Client, message: Message): Promise<void> {
	const code = client.code;
	const inRoom = () => {
		if (code === null) throw new GameError("Join a room first");
		return code;
	};
	switch (message.t) {
		case "hello":
			if (/^[a-zA-Z0-9-]{8,64}$/.test(message.playerId)) client.playerId = message.playerId;
			return;
		case "create": {
			const created = await game.createRoom();
			await game.join(created, client.playerId, message.name);
			await attach(client, created);
			return;
		}
		case "join": {
			const wanted = String(message.code ?? "").trim().toUpperCase();
			if ((await game.rooms())[wanted] === undefined) throw new GameError("No such room. Check the code?");
			await game.join(wanted, client.playerId, message.name);
			await attach(client, wanted);
			return;
		}
		case "leave":
			detach(client);
			return;
		case "start":
			return game.start(inRoom(), client.playerId, message);
		case "guess": {
			const result = await game.guess(inRoom(), client.playerId, String(message.text ?? ""), false);
			send(client.socket, { t: "guessed", ...result });
			return;
		}
		case "skip":
			await game.guess(inRoom(), client.playerId, "", true);
			send(client.socket, { t: "guessed", correct: false, points: 0 });
			return;
		case "chat": {
			const text = String(message.text ?? "");
			if (/^@(proj|projectionist|host|ai)\b/i.test(text.trim())) return game.ask(inRoom(), client.playerId, text.trim().replace(/^@\w+\s*/, ""), false);
			return game.chat(inRoom(), client.playerId, text);
		}
		case "ask":
			return game.ask(inRoom(), client.playerId, String(message.text ?? ""), false);
		case "hint":
			return game.ask(inRoom(), client.playerId, "", true);
		case "next":
			return game.next(inRoom(), client.playerId);
		case "lobby":
			return game.lobby(inRoom(), client.playerId);
		case "ping":
			send(client.socket, { t: "pong", now: Date.now() });
			return;
	}
}

// --- HTTP ----------------------------------------------------------------------------------------------------------

const TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
};

const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? "/", "http://local");
	try {
		if (url.pathname === "/api/titles") {
			res.writeHead(200, { "content-type": TYPES[".json"]! });
			res.end(JSON.stringify(TITLE_CHOICES));
			return;
		}
		if (url.pathname === "/api/health") {
			res.writeHead(200, { "content-type": TYPES[".json"]! });
			res.end(JSON.stringify({ ok: true, ai: game.aiEnabled, rooms: Object.keys(await game.rooms()).length }));
			return;
		}
		let base = join(root, "public");
		let path = url.pathname;
		if (path.startsWith("/vendor/")) {
			base = join(root, "node_modules/three/build");
			path = path.slice("/vendor".length);
		} else if (path === "/" || /^\/[A-Z]{4}\/?$/i.test(path)) path = "/index.html"; // /ABCD deep links
		const file = normalize(join(base, path));
		if (!file.startsWith(base)) throw new Error("bad path");
		const body = await readFile(file);
		res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-cache" });
		res.end(body);
	} catch {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end("Not found");
	}
});

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (socket) => {
	const client: Client = { socket, playerId: crypto.randomUUID(), code: null };
	let queue = Promise.resolve();
	socket.on("message", (data) => {
		// One message at a time per socket, so moves from one player apply in order.
		queue = queue.then(async () => {
			let message: Message;
			try {
				message = JSON.parse(String(data));
			} catch {
				return;
			}
			try {
				await handle(client, message);
			} catch (error) {
				const text = error instanceof GameError ? error.message : "Something went wrong";
				if (!(error instanceof GameError)) console.error(error);
				send(socket, { t: "error", text });
			}
		});
	});
	socket.on("close", () => detach(client));
});

server.listen(PORT, "0.0.0.0", () => {
	const addresses = Object.values(networkInterfaces())
		.flat()
		.filter((a) => a && a.family === "IPv4" && !a.internal)
		.map((a) => `http://${a!.address}:${PORT}`);
	console.log(`🎬 Framed 3D on http://localhost:${PORT}  ${addresses.join("  ")}`);
	console.log(`   AI host: ${model ? `${model.provider}/${model.modelId}` : "off (set ANTHROPIC_API_KEY or OPENAI_API_KEY)"}`);
	console.log(`   Durable state: ${join(DATA, "framed.sqlite")}`);
});

async function shutdown(): Promise<void> {
	wss.close();
	server.close();
	await game.close().catch(() => {});
	process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
