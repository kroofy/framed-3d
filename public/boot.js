// Boot decisions, kept free of DOM and network so each step can be tested on its own.
//
// Startup runs these steps in order, and only `decide` picks the first real screen:
//   0. route   – home, an invite link (/ABCD), or a dev preview (index.html does this before first paint too)
//   1. identity – player id and remembered name (sync)
//   2. lookup  – GET /api/rooms/CODE, invite links only
//   3. decide  – which screen to show, from the route and the lookup
//   4. join    – socket join; the first room state renders lobby, game or over
//   5. stage   – Three.js and the reels load in the background, and before the first reel

export const ROOM_PATH = /^\/([A-Z]{4})\/?$/i;

/** Step 0: what the URL asks for. */
export function readRoute(pathname, search = "") {
	const preview = new URLSearchParams(search).get("preview");
	if (preview) return { kind: "preview", reel: preview };
	const m = ROOM_PATH.exec(pathname);
	if (m) return { kind: "room", code: m[1].toUpperCase() };
	return { kind: "home" };
}

/**
 * Step 3: pick the first screen for an invite link.
 * `room` is the /api/rooms answer: an object, `null` for "no such room", or `undefined` when the lookup failed.
 * Returns one of:
 *   { screen: "home", toast }                       no such room
 *   { join: name }                                  already seated here: rejoin without asking
 *   { screen: "admit", ask: "continue", name, ... } we remember a name: one tap to use it
 *   { screen: "admit", ask: "name", ... }           we need a name first
 */
export function decide(room, savedName) {
	if (room === null) return { screen: "home", toast: "No such room. Check the code?" };
	if (room?.you) return { join: room.you };
	const info = room ?? null; // undefined (offline/flaky): still ask, and the join will report a dead room
	return savedName ? { screen: "admit", ask: "continue", name: savedName, info } : { screen: "admit", ask: "name", info };
}

/** Optional step log: add ?debug to the URL to see each boot step and its timing in the console. */
export function stepLogger(enabled, now = () => performance.now()) {
	const t0 = now();
	return (step, detail) => {
		if (enabled) console.info(`[boot] ${(now() - t0).toFixed(0).padStart(5)}ms ${step}`, detail ?? "");
	};
}
