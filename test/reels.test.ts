import assert from "node:assert/strict";
import test from "node:test";
import { MOVIES, normalizeTitle } from "../server/movies.ts";
import { REELS } from "../public/reels.js";

test("every movie has a 3D set and every set has a movie", () => {
	const movies = MOVIES.map((m) => m.reel).sort();
	assert.deepEqual(Object.keys(REELS).sort(), movies);
	assert.equal(new Set(movies).size, movies.length, "reel ids are unique");
});

test("titles and aliases are distinct across movies", () => {
	const owner = new Map<string, string>();
	for (const m of MOVIES) {
		assert.ok(m.trivia.length > 10, `${m.reel} has trivia`);
		assert.ok(m.year > 1900 && m.year < 2030, `${m.reel} has a year`);
		for (const name of [m.title, ...m.aliases]) {
			const key = normalizeTitle(name);
			const prev = owner.get(key);
			assert.ok(prev === undefined || prev === m.reel, `"${name}" is used by both ${prev} and ${m.reel}`);
			owner.set(key, m.reel);
		}
	}
});
