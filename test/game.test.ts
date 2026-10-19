import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai/providers/faux";
import type { ConversationId } from "@earendil-works/pi-durable";
import { MemoryStorage } from "@earendil-works/pi-durable";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";
import { Game, Room, type RoomState } from "../server/game.ts";
import { isCorrect, movie } from "../server/movies.ts";

const ctx = BACKGROUND_CONTEXT;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function room(game: Game, code: string): Promise<Readonly<RoomState>> {
	const id = (await game.rooms())[code]!;
	return (await game.harness.snapshot(Room, id as ConversationId, ctx))!;
}

async function until(game: Game, code: string, check: (room: Readonly<RoomState>) => boolean, ms = 5000) {
	const end = Date.now() + ms;
	while (Date.now() < end) {
		const value = await room(game, code);
		if (check(value)) return value;
		await sleep(25);
	}
	throw new Error(`timed out; status ${(await room(game, code)).status}`);
}

test("titles match loosely", () => {
	assert.ok(isCorrect("r03", "2001: a space odyssey"));
	assert.ok(isCorrect("r07", "E.T."));
	assert.ok(isCorrect("r04", "matrix"));
	assert.ok(isCorrect("r14", "Wizard of Oz"));
	assert.ok(!isCorrect("r01", "Jaws 2"));
});

test("a full game: guesses, scoring, early end, durable deadlines", async () => {
	const game = await Game.open({ storage: new MemoryStorage(), models: createModels(), model: undefined, revealMs: 150, minRoundSeconds: 0.3 });
	const code = await game.createRoom();
	await game.join(code, "alice-0001", "Alice");
	await game.join(code, "bob-000001", "Bob");
	game.onlineIn(code).add("alice-0001").add("bob-000001");
	await assert.rejects(game.start(code, "bob-000001", {}), /host/);
	await game.start(code, "alice-0001", { rounds: 2, seconds: 1 });

	let state = await room(game, code);
	const answer = movie(state.deck[0]!);
	assert.equal(state.status, "playing");
	assert.deepEqual(await game.guess(code, "alice-0001", "Casablanca", false), { correct: false, points: 0 });
	const hit = await game.guess(code, "alice-0001", answer.title, false);
	assert.deepEqual(hit, { correct: true, points: 550 }); // frame 2 + first solver
	await assert.rejects(game.chat(code, "bob-000001", answer.title), /Nice try/);
	for (let i = 0; i < 6; i++) await game.guess(code, "bob-000001", "", true);
	state = await room(game, code);
	assert.equal(state.status, "reveal", "everyone online is done, so the round ends early");
	assert.equal(state.results[0]!.title, answer.title);

	// The reveal deadline is a durable task: it rolls the next reel by itself.
	state = await until(game, code, (r) => r.status === "playing" && r.round === 1);
	// Nobody guesses; the round deadline ends it, and the next deadline ends the game.
	state = await until(game, code, (r) => r.status === "over");
	assert.equal(state.players["alice-0001"]!.score, 550);
	await game.close();
});

test("deadlines survive a restart", async () => {
	const file = join(mkdtempSync(join(tmpdir(), "framed-")), "game.sqlite");
	let game = await Game.open({ storage: await openNodeSqliteStorage(file), models: createModels(), model: undefined, revealMs: 100, minRoundSeconds: 0.5 });
	const code = await game.createRoom();
	await game.join(code, "alice-0001", "Alice");
	await game.start(code, "alice-0001", { rounds: 1, seconds: 0.5 });
	await game.close(); // the server "crashes" mid-round

	game = await Game.open({ storage: await openNodeSqliteStorage(file), models: createModels(), model: undefined, revealMs: 100, minRoundSeconds: 0.5 });
	assert.equal((await room(game, code)).status, "playing");
	await until(game, code, (r) => r.status === "over");
	await game.close();
});

test("the Projectionist answers in the chat", async () => {
	const faux = fauxProvider();
	const models = createModels();
	models.setProvider(faux.provider);
	faux.setResponses([fauxAssistantMessage("Think big. Think furry. Think skyscraper.")]);
	const game = await Game.open({ storage: new MemoryStorage(), models, model: { provider: "faux", modelId: "faux-1" }, minRoundSeconds: 0.3 });
	const code = await game.createRoom();
	await game.join(code, "alice-0001", "Alice");
	await game.start(code, "alice-0001", { rounds: 1, seconds: 60 });
	await game.ask(code, "alice-0001", "", true);
	const state = await until(game, code, (r) => r.chat.some((line) => line.kind === "host"));
	assert.match(state.chat.at(-1)!.text, /skyscraper/);
	assert.equal(state.progress["alice-0001"]!.hints, 1);
	assert.deepEqual(state.pendingAsks, []);
	await game.close();
});
