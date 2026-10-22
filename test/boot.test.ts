import assert from "node:assert/strict";
import { test } from "node:test";
import { decide, readRoute, stepLogger } from "../public/boot.js";

test("route: home, invite link, preview", () => {
	assert.deepEqual(readRoute("/"), { kind: "home" });
	assert.deepEqual(readRoute("/bshj"), { kind: "room", code: "BSHJ" });
	assert.deepEqual(readRoute("/BSHJ/"), { kind: "room", code: "BSHJ" });
	assert.deepEqual(readRoute("/BSHJX"), { kind: "home" });
	assert.deepEqual(readRoute("/app.js"), { kind: "home" });
	assert.deepEqual(readRoute("/", "?preview=r07&f=0"), { kind: "preview", reel: "r07" });
});

test("decide: no such room goes home", () => {
	assert.equal(decide(null, "Rikard").screen, "home");
});

test("decide: already seated rejoins without any admission screen", () => {
	const room = { status: "lobby", players: [], host: "Ann", you: "Rikard" };
	assert.deepEqual(decide(room, "Someone else"), { join: "Rikard" });
	assert.deepEqual(decide(room, null), { join: "Rikard" });
});

test("decide: free seat with a remembered name offers Continue", () => {
	const room = { status: "playing", players: [], host: "Ann", you: null };
	assert.deepEqual(decide(room, "Rikard"), { screen: "admit", ask: "continue", name: "Rikard", info: room });
});

test("decide: free seat and no name asks for one", () => {
	const room = { status: "lobby", players: [], host: "Ann", you: null };
	assert.deepEqual(decide(room, null), { screen: "admit", ask: "name", info: room });
});

test("decide: failed lookup still asks, without room info", () => {
	assert.deepEqual(decide(undefined, null), { screen: "admit", ask: "name", info: null });
	assert.deepEqual(decide(undefined, "Rikard"), { screen: "admit", ask: "continue", name: "Rikard", info: null });
});

test("step logger is silent unless enabled", () => {
	const seen = [];
	const original = console.info;
	console.info = (...args) => seen.push(args);
	try {
		stepLogger(false)("0 route");
		stepLogger(true, () => 0)("0 route", { kind: "home" });
	} finally {
		console.info = original;
	}
	assert.equal(seen.length, 1);
	assert.match(seen[0][0], /\[boot\]\s+0ms 0 route/);
});
