import { decide, readRoute, stepLogger } from "./boot.js";

// Three.js and every reel are big, and only the game screen needs them, so they load in the background (boot step 5).
let Stage = null;
let stageLoading = null;
function loadStage() {
	stageLoading ??= import("./stage.js").then((m) => {
		Stage = m.Stage;
		log("5 stage ready");
	});
	return stageLoading;
}
const log = stepLogger(new URLSearchParams(location.search).has("debug"));

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// --- Identity ------------------------------------------------------------------------------------------------------
const playerId = localStorage.getItem("framed.player") ?? crypto.randomUUID();
localStorage.setItem("framed.player", playerId);

// Your name lives in a year-long cookie, so invite links can seat you without asking again.
const NAME_COOKIE = "framed_name";
function savedName() {
	const match = document.cookie.match(new RegExp(`(?:^|; )${NAME_COOKIE}=([^;]*)`));
	if (match) {
		try {
			return decodeURIComponent(match[1]).trim().slice(0, 18) || null;
		} catch {}
	}
	// Names saved by older versions sat in localStorage. Move them over to the cookie.
	const legacy = localStorage.getItem("framed.name")?.trim();
	if (legacy && !/^Guest \d{3}$/.test(legacy)) {
		rememberName(legacy);
		return legacy;
	}
	return null;
}
function rememberName(name) {
	document.cookie = `${NAME_COOKIE}=${encodeURIComponent(name)}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
	localStorage.removeItem("framed.name");
}

$("nameInput").value = savedName() ?? "";
const route = readRoute(location.pathname, location.search);
const inviteCode = route.kind === "room" ? route.code : null;
if (inviteCode) $("codeInput").value = inviteCode;

let state = null;
let clockOffset = 0;
// Set once you've taken a seat. Reconnects rejoin this room on their own.
let wantRoom = null;
let viewFrame = 0;
let lastGuessCount = -1;
let lastReelKey = "";
let stage = null;

// --- Socket ----------------------------------------------------------------------------------------------------------
let ws;
let retry = 0;
const queue = [];
function connect() {
	ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
	ws.onopen = () => {
		retry = 0;
		$("conn").classList.add("ok");
		$("conn").title = "Connected";
		ws.send(JSON.stringify({ t: "hello", playerId }));
		if (wantRoom) ws.send(JSON.stringify({ t: "join", code: wantRoom, name: currentName() }));
		while (queue.length) ws.send(queue.shift());
	};
	ws.onclose = () => {
		$("conn").classList.remove("ok");
		$("conn").title = "Reconnecting…";
		setTimeout(connect, Math.min(5000, 300 * 2 ** retry++));
	};
	ws.onmessage = (event) => {
		const msg = JSON.parse(event.data);
		if (msg.t === "state") onState(msg);
		else if (msg.t === "error") onError(msg.text);
		else if (msg.t === "guessed") onGuessed(msg);
	};
}
function send(msg) {
	const data = JSON.stringify(msg);
	if (ws?.readyState === WebSocket.OPEN) ws.send(data);
	else queue.push(data);
}
connect();

function onError(text) {
	toast(text);
	$("admitBtn").disabled = false;
	$("continueBtn").disabled = false;
	// A dead invite link: stop retrying it and fall back to the home screen.
	if (!state && wantRoom && /no such room/i.test(text)) {
		wantRoom = null;
		history.replaceState(null, "", "/");
		show("home");
	}
}

function rename(raw) {
	const name = raw.trim().slice(0, 18);
	if (!name || !state || name === state.players.find((p) => p.id === state.me)?.name) return;
	rememberName(name);
	$("nameInput").value = name;
	send({ t: "join", code: state.code, name });
}

// The name you typed on the home screen, else the remembered one. A guest name is a stopgap and is not remembered.
function myName() {
	const typed = $("nameInput").value.trim().slice(0, 18);
	if (typed) {
		rememberName(typed);
		return typed;
	}
	return savedName() ?? `Guest ${Math.floor(Math.random() * 900 + 100)}`;
}

// On a reconnect, keep the name the room already knows you by.
function currentName() {
	return state?.players.find((p) => p.id === state.me)?.name ?? myName();
}

// --- Admission (invite links) ----------------------------------------------------------------------------------------
const ADMIT_STATUS = {
	lobby: "waiting for the host to roll film",
	playing: "a reel is already rolling, so jump right in",
	reveal: "a reel is already rolling, so jump right in",
	over: "the show just wrapped, and the host can start another",
};

// Step 2: ask the server about the room. null = no such room, undefined = lookup failed.
async function lookupRoom(code) {
	try {
		const res = await fetch(`/api/rooms/${code}?player=${encodeURIComponent(playerId)}`);
		return res.status === 404 ? null : await res.json();
	} catch {
		return undefined; // Offline or flaky: still let them type a name. The join will report a dead room.
	}
}

// Runs the boot steps in order. Until a step decides otherwise, the page shows the neutral #boot screen.
async function boot() {
	log("0 route", route);
	if (route.kind === "preview") return bootPreview(route.reel);
	if (route.kind === "home") {
		show("home");
		idle(loadStage);
		return;
	}

	const name = savedName();
	log("1 identity", { playerId, name });
	$("bootCode").textContent = route.code;

	const [room] = await Promise.all([lookupRoom(route.code), wait(BOOT_FIND_MS)]);
	log("2 lookup", room);

	const next = decide(room, name);
	log("3 decide", next);
	if (next.screen === "home") {
		toast(next.toast);
		history.replaceState(null, "", "/");
		show("home");
	} else if (next.screen === "admit") renderAdmit(route.code, next);
	// Already seated: greet them on #boot, join meanwhile, and let the first room state hand off to the real screen (step 4).
	else {
		bootHold = Promise.all([bootLine(`Welcome back, ${next.join}`, "Taking you to your seat…"), wait(BOOT_WELCOME_MS)]);
		enter(route.code, next.join);
	}
	idle(loadStage);
}

function idle(fn) {
	(window.requestIdleCallback ?? setTimeout)(fn);
}

// Pacing for invite links. Long enough to read and feel deliberate, short enough not to stall a reload.
const BOOT_FIND_MS = 1000; // "Finding your screening…" stays at least this long
const BOOT_WELCOME_MS = 900; // "Welcome back" stays at least this long before the lobby
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Resolves when #boot may hand off to the next screen.
let bootHold = null;

// Swap the #boot heading with a short cross-fade.
async function bootLine(title, sub) {
	const box = document.querySelector(".boot");
	box.classList.add("swap");
	if (!reducedMotion) await wait(250);
	$("bootTitle").textContent = title;
	$("bootSub").textContent = sub;
	box.classList.remove("swap");
}

// Step 3, invite link with a free seat: show who's here and ask for (or confirm) a name.
function renderAdmit(code, { ask, name: known, info }) {
	$("admitCode").textContent = code;
	const players = info?.players ?? [];
	$("admitTitle").textContent = info?.host ? `${info.host}'s screening` : `Screening ${code}`;
	const seated = players.length === 1 ? "1 person seated" : `${players.length} people seated`;
	$("admitSub").textContent = info ? `${seated} · ${ADMIT_STATUS[info.status] ?? ""}` : "";
	renderSeats(players);

	// We know a name from an earlier visit: one tap to use it, in case someone else is on this device now.
	$("admitReturning").classList.toggle("hidden", ask !== "continue");
	$("admitForm").classList.toggle("hidden", ask === "continue");
	show("admit").then(() => (ask === "continue" ? $("continueBtn") : $("admitName")).focus());
	if (ask === "continue") {
		$("continueName").textContent = known;
		setYouSeat(known);
	}
}

function renderSeats(players) {
	$("admitSeats").innerHTML =
		players
			.map(
				(p) =>
					`<li class="${p.online ? "" : "offline"}"><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.name)}${p.host ? '<span class="tag">host</span>' : ""}</li>`,
			)
			.join("") + '<li class="you"></li>';
	setYouSeat($("admitName").value.trim());
}
function setYouSeat(name) {
	const you = $("admitSeats").querySelector(".you");
	if (you) you.textContent = name || "you?";
}
$("admitName").addEventListener("input", () => setYouSeat($("admitName").value.trim()));
$("continueBtn").addEventListener("click", () => {
	$("continueBtn").disabled = true;
	enter(inviteCode, $("continueName").textContent);
});
$("notMeBtn").addEventListener("click", () => {
	$("admitReturning").classList.add("hidden");
	$("admitForm").classList.remove("hidden");
	$("admitName").value = "";
	setYouSeat("");
	$("admitName").focus();
});
$("admitForm").addEventListener("submit", (e) => {
	e.preventDefault();
	const name = $("admitName").value.trim().slice(0, 18);
	if (!name) return $("admitName").focus();
	$("admitBtn").disabled = true;
	enter(inviteCode, name);
});

function enter(code, name) {
	rememberName(name);
	$("nameInput").value = name;
	wantRoom = code;
	log("4 join", { code, name });
	// When the socket isn't open yet, onopen sends the join for wantRoom.
	if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: "join", code, name }));
}

// --- Home ------------------------------------------------------------------------------------------------------------
$("createBtn").onclick = () => send({ t: "create", name: myName() });
$("joinBtn").onclick = () => {
	const code = $("codeInput").value.trim().toUpperCase();
	if (!/^[A-Z]{4}$/.test(code)) return toast("Room codes are 4 letters");
	wantRoom = code;
	send({ t: "join", code, name: myName() });
};
$("lobbyName").addEventListener("change", (e) => rename(e.target.value));
$("lobbyName").addEventListener("keydown", (e) => e.key === "Enter" && e.target.blur());
$("scoreboard").addEventListener("click", (e) => {
	if (!e.target.closest("li[data-me]")) return;
	const name = prompt("Your name", currentName());
	if (name !== null) rename(name);
});
$("codeInput").addEventListener("keydown", (e) => e.key === "Enter" && $("joinBtn").click());
$("nameInput").addEventListener("keydown", (e) => e.key === "Enter" && ($("codeInput").value ? $("joinBtn") : $("createBtn")).click());
$("copyLink").onclick = () => {
	navigator.clipboard?.writeText(`${location.origin}/${state.code}`);
	toast("Invite link copied!", true);
};

// --- Lobby -----------------------------------------------------------------------------------------------------------
for (const id of ["rounds", "seconds"]) {
	$(id).addEventListener("input", () => {
		$(`${id}Out`).textContent = $(id).value;
	});
}
$("startBtn").onclick = () => send({ t: "start", rounds: Number($("rounds").value), seconds: Number($("seconds").value) });
document.querySelectorAll("[data-chat]").forEach((form) =>
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const input = form.querySelector("input");
		if (input.value.trim()) send({ t: "chat", text: input.value });
		input.value = "";
	}),
);

// --- Game ------------------------------------------------------------------------------------------------------------
let titles = [];
fetch("/api/titles")
	.then((r) => r.json())
	.then((list) => (titles = list));
const norm = (s) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
let suggestIndex = -1;
function renderSuggest() {
	const q = norm($("guessInput").value);
	const list = $("suggest");
	if (q.length < 2) return list.classList.add("hidden");
	const words = q.split(" ");
	const hits = titles.filter((t) => words.every((w) => norm(t).includes(w))).slice(0, 8);
	if (hits.length === 0) return list.classList.add("hidden");
	suggestIndex = Math.min(suggestIndex, hits.length - 1);
	list.innerHTML = hits.map((t, i) => `<li data-t="${esc(t)}" class="${i === suggestIndex ? "active" : ""}">${esc(t)}</li>`).join("");
	list.classList.remove("hidden");
}
$("guessInput").addEventListener("input", () => {
	suggestIndex = -1;
	renderSuggest();
});
$("guessInput").addEventListener("keydown", (e) => {
	const items = [...$("suggest").querySelectorAll("li")];
	if (e.key === "ArrowDown" || e.key === "ArrowUp") {
		e.preventDefault();
		if (!items.length) return;
		suggestIndex = (suggestIndex + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
		renderSuggest();
	} else if (e.key === "Enter") {
		e.preventDefault();
		if (suggestIndex >= 0 && items[suggestIndex]) $("guessInput").value = items[suggestIndex].dataset.t;
		submitGuess();
	} else if (e.key === "Escape") $("suggest").classList.add("hidden");
});
$("suggest").addEventListener("mousedown", (e) => {
	const li = e.target.closest("li");
	if (!li) return;
	e.preventDefault();
	$("guessInput").value = li.dataset.t;
	$("suggest").classList.add("hidden");
	submitGuess();
});
$("guessInput").addEventListener("blur", () => setTimeout(() => $("suggest").classList.add("hidden"), 120));
function submitGuess() {
	const text = $("guessInput").value.trim();
	if (!text) return;
	send({ t: "guess", text });
	$("guessInput").value = "";
	$("suggest").classList.add("hidden");
}
$("guessBtn").onclick = submitGuess;
$("skipBtn").onclick = () => send({ t: "skip" });
$("hintBtn").onclick = () => send({ t: "hint" });
$("nextBtn").onclick = () => send({ t: "next" });
$("againBtn").onclick = () => send({ t: "lobby" });
const EMOJI = { hit: "🟩", miss: "🟥", skip: "⬛" };
$("shareBtn").onclick = () => {
	const me = state.players.find((p) => p.id === state.me);
	const lines = state.results.map((r) => `🎥 ${[...r.mine.map((m) => EMOJI[m]), ...Array(6 - r.mine.length).fill("⬜")].join("")}`);
	navigator.clipboard?.writeText(`🎞️ Framed 3D · ${me?.score ?? 0} pts\n${lines.join("\n")}\n${location.origin}`);
	toast("Copied!", true);
};

function onGuessed(msg) {
	if (msg.correct) toast(`🎉 Correct! +${msg.points}`, true);
}

// Keyboard: 1-6 to switch frames.
document.addEventListener("keydown", (e) => {
	if (e.target.tagName === "INPUT") return;
	const n = Number(e.key);
	if (n >= 1 && n <= 6 && unlocked() >= n) setFrame(n - 1);
});

function unlocked() {
	if (!state) return 1;
	if (state.status !== "playing") return state.frames;
	if (state.my?.done) return state.frames;
	return Math.min(state.frames, (state.my?.guesses.length ?? 0) + 1);
}

function setFrame(f) {
	viewFrame = f;
	stage?.show(f);
	$("frameTag").textContent = `FRAME ${f + 1}`;
	renderFilmstrip();
}

function renderFilmstrip() {
	const guesses = state?.my?.guesses ?? [];
	const open = unlocked();
	$("filmstrip").innerHTML = Array.from({ length: 6 }, (_, i) => {
		const g = guesses[i];
		const cls = [i === viewFrame ? "current" : "", g ? (g.correct ? "hit" : g.skip ? "skip" : "miss") : ""].join(" ");
		return `<button class="${cls}" data-f="${i}" ${i < open ? "" : "disabled"}>${i < open ? i + 1 : "🔒"}</button>`;
	}).join("");
	$("filmstrip").querySelectorAll("button").forEach((b) => (b.onclick = () => setFrame(Number(b.dataset.f))));
}

// --- Rendering state -------------------------------------------------------------------------------------------------
const SCREENS = ["boot", "home", "admit", "lobby", "game", "over"];
// index.html shows #boot for invite links before first paint, so that is where the page starts.
let currentScreen = document.documentElement.classList.contains("boot-room") ? "boot" : "home";
// While #boot is fading out, later show() calls only update where we're headed.
let pendingScreen = null;
let leaving = null;

// Returns a promise that resolves once the screen is on display.
function show(screen) {
	if (pendingScreen !== null) {
		pendingScreen = screen;
		return leaving;
	}
	if (currentScreen === "boot" && screen !== "boot") {
		pendingScreen = screen;
		leaving = leaveBoot();
		return leaving;
	}
	swapTo(screen);
	return Promise.resolve();
}

async function leaveBoot() {
	await bootHold;
	if (!reducedMotion) {
		$("boot").classList.add("leaving");
		await wait(280);
		$("boot").classList.remove("leaving");
	}
	const screen = pendingScreen;
	pendingScreen = null;
	leaving = null;
	swapTo(screen);
}

function swapTo(screen) {
	const changed = screen !== currentScreen;
	for (const id of SCREENS) $(id).classList.toggle("hidden", id !== screen);
	// From here on show() decides, not the boot-room class from index.html.
	document.documentElement.classList.remove("boot-room");
	currentScreen = screen;
	// The room chip arrives with the room, not while #boot is still greeting you.
	$("roomChip").classList.toggle("hidden", !state || !["lobby", "game", "over"].includes(screen));
	if (changed && !reducedMotion) {
		const el = $(screen);
		el.classList.remove("entering");
		void el.offsetWidth; // restart the animation
		el.classList.add("entering");
		el.addEventListener("animationend", () => el.classList.remove("entering"), { once: true });
	}
}

function onState(s) {
	if (state === null) log("4 first state", s.status);
	const first = state === null || state.code !== s.code;
	state = s;
	clockOffset = s.now - Date.now();
	wantRoom = s.code;
	if (location.pathname !== `/${s.code}`) history.replaceState(null, "", `/${s.code}`);
	$("roomCode").textContent = s.code;
	const isHost = s.hostId === s.me;

	if (s.status === "lobby") {
		show("lobby");
		$("lobbyCode").textContent = s.code;
		$("lobbyPlayers").innerHTML = s.players.map((p) => playerRow(p, s)).join("");
		const mine = s.players.find((p) => p.id === s.me);
		if (mine && document.activeElement !== $("lobbyName")) $("lobbyName").value = mine.name;
		$("hostControls").classList.toggle("hidden", !isHost);
		$("waitHost").classList.toggle("hidden", isHost);
		if (first) {
			$("rounds").value = s.settings.rounds;
			$("seconds").value = s.settings.seconds;
			$("roundsOut").textContent = s.settings.rounds;
			$("secondsOut").textContent = s.settings.seconds;
		}
		renderChat("lobbyChat");
		return;
	}
	if (s.status === "over") {
		show("over");
		renderOver(s, isHost);
		return;
	}

	// A reel needs the 3D stage. If it's still loading, keep the current screen and render once it's here.
	if (!Stage) {
		loadStage().then(() => state && onState(state));
		return;
	}
	show("game");
	if (!stage) stage = new Stage($("stage"));
	const reelKey = `${s.round}:${s.reel}`;
	if (reelKey !== lastReelKey) {
		lastReelKey = reelKey;
		lastGuessCount = -1;
		stage.load(s.reel);
		viewFrame = 0;
		$("dragHint").style.opacity = 1;
		setTimeout(() => ($("dragHint").style.opacity = 0), 6000);
	}
	const count = s.my?.guesses.length ?? 0;
	if (count !== lastGuessCount) {
		// A wrong guess cuts to the newly unlocked frame.
		const target = s.my?.solved ? viewFrame : Math.min(5, count);
		lastGuessCount = count;
		setFrame(target);
	}
	if (s.status === "reveal" && viewFrame !== 5 && !revealShown) setFrame(5);
	revealShown = s.status === "reveal";

	$("reelLabel").textContent = `Reel ${s.round + 1} / ${s.totalRounds}`;
	const playing = s.status === "playing";
	const done = s.my?.done ?? false;
	$("guessArea").classList.toggle("hidden", !playing || done);
	$("hintBtn").classList.toggle("hidden", !s.ai);
	$("hostBar").classList.toggle("hidden", !isHost);
	$("nextBtn").textContent = playing ? "⏹ End reel now" : "⏭ Next reel now";
	$("hintBtn").textContent = `🔦 Hint${s.my?.hints ? ` (${s.my.hints}/2)` : ""}`;

	const status = $("myStatus");
	status.className = "my-status";
	if (s.my?.solved) {
		status.textContent = `🎉 You got it on frame ${s.my.guesses.length}! +${s.my.points}`;
		status.classList.add("win");
	} else if (done) {
		status.textContent = playing ? "Out of frames. Waiting for the others…" : "";
		status.classList.add("lose");
	} else if (playing) status.textContent = `${6 - count} guess${6 - count === 1 ? "" : "es"} left`;
	else status.textContent = "";
	$("myGuesses").innerHTML = (s.my?.guesses ?? [])
		.map((g, i) => `<li class="${g.correct ? "hit" : g.skip ? "skip" : ""}">${i + 1}. ${g.skip ? "Skipped" : esc(g.text)} ${g.correct ? "✅" : g.skip ? "" : "❌"}</li>`)
		.join("");

	$("scoreboard").innerHTML = s.players.map((p) => playerRow(p, s, true)).join("");
	renderChat("gameChat");

	const result = s.status === "reveal" ? s.results[s.results.length - 1] : null;
	$("reveal").classList.toggle("hidden", !result);
	if (result) {
		$("revealKicker").textContent = s.my?.solved ? "You nailed it — it was" : "It was";
		$("revealTitle").textContent = result.title;
		$("revealYear").textContent = result.year;
		$("revealTrivia").textContent = result.trivia;
	}
	renderFilmstrip();
}
let revealShown = false;

function playerRow(p, s, game = false) {
	const marks = game
		? `<span class="marks">${Array.from({ length: 6 }, (_, i) => `<i class="${p.marks[i] ?? ""}"></i>`).join("")}</span>`
		: "";
	const guesses = game && p.guesses && p.id !== s.me && s.status !== "playing" && p.guesses.length ? `<span class="guesses">${p.guesses.map((g) => esc(g || "skip")).join(" · ")}</span>` : "";
	return `<li class="${p.online ? "" : "offline"}"${p.id === s.me ? ' data-me title="Click to change your name"' : ""}><span class="dot" style="color:${p.color};background:${p.color}"></span><span class="name">${esc(p.name)}${p.id === s.me ? " (you)" : ""}${guesses}</span>${marks}${game ? `<span class="score">${p.score}</span>` : ""}${!game && p.id === s.hostId ? '<span class="tag">host</span>' : ""}</li>`;
}

function renderChat(id) {
	const el = $(id);
	const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
	const colors = Object.fromEntries(state.players.map((p) => [p.id, p.color]));
	el.innerHTML = state.chat
		.map((line) => {
			if (line.kind === "system") return `<div class="line system">${esc(line.text)}</div>`;
			if (line.kind === "host") return `<div class="line host"><b>🎞️ Projectionist</b>${esc(line.text)}</div>`;
			return `<div class="line"><b style="color:${colors[line.from] ?? "#ccc"}">${esc(line.name)}</b>${esc(line.text)}</div>`;
		})
		.join("");
	if (atBottom) el.scrollTop = el.scrollHeight;
}

function renderOver(s, isHost) {
	$("podium").innerHTML = s.players
		.map((p, i) => `<li><span>${["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}</span><span class="dot" style="color:${p.color};background:${p.color}"></span>${esc(p.name)}<span class="score">${p.score}</span></li>`)
		.join("");
	$("recap").innerHTML = s.results
		.map((r) => `<li><b>${esc(r.title)}</b> <span class="muted">(${r.year})</span><span class="marks">${Array.from({ length: 6 }, (_, i) => `<i class="${r.mine[i] ?? ""}"></i>`).join("")}</span></li>`)
		.join("");
	$("againBtn").classList.toggle("hidden", !isHost);
	$("waitAgain").classList.toggle("hidden", isHost);
}

// --- Timer -----------------------------------------------------------------------------------------------------------
setInterval(() => {
	if (!state || !state.endsAt || (state.status !== "playing" && state.status !== "reveal")) return;
	const now = Date.now() + clockOffset;
	const left = Math.max(0, state.endsAt - now);
	if (state.status === "playing") {
		const total = state.settings.seconds * 1000;
		$("timerBar").style.transform = `scaleX(${left / total})`;
		const sec = Math.ceil(left / 1000);
		$("timerText").textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
		document.querySelector(".timer").classList.toggle("urgent", sec <= 15);
	} else {
		$("timerBar").style.transform = "scaleX(0)";
		$("timerText").textContent = "";
		const last = state.round + 1 >= state.totalRounds;
		$("revealNext").textContent = `${last ? "Final scores" : "Next reel"} in ${Math.ceil(left / 1000)}s`;
	}
}, 250);

// --- Toast -----------------------------------------------------------------------------------------------------------
let toastTimer;
function toast(text, good = false) {
	const el = $("toast");
	el.textContent = text;
	el.classList.toggle("good", good);
	el.classList.remove("hidden");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => el.classList.add("hidden"), 2800);
}

// --- Dev preview: /?preview=r01 renders one set, keys 1-6 switch frames ---------------------------------------------
async function bootPreview(reel) {
	await loadStage();
	show("game");
	stage = new Stage($("stage"));
	stage.load(reel);
	state = { status: "preview", frames: 6, my: null };
	setFrame(Number(new URLSearchParams(location.search).get("f") ?? 0));
	window.__setFrame = (f) => setFrame(f);
	window.__stage = stage;
}

boot();
