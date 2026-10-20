// Batch 06: animated classics, a kaiju and the apes. See reels.js for conventions.
import { PI, rng, trees, city } from "../kit.js";

// A fuzzy ball: an icosahedron with short spikes.
function fuzz(k, r, color, o = {}) {
	const g = k.group(o);
	k.ico(r, color, { parent: g, detail: 1 });
	const rr = rng(o.seed ?? 3);
	for (let i = 0; i < 10; i++) {
		const a = rr() * PI * 2;
		const b = (rr() - 0.5) * PI;
		k.cone(r * 0.25, r * 0.7, color, { parent: g, seg: 3, x: Math.cos(a) * Math.cos(b) * r, y: Math.sin(b) * r, z: Math.sin(a) * Math.cos(b) * r, rz: -Math.cos(a) * (PI / 2 - b), rx: Math.sin(a) * (PI / 2 - b) });
	}
	return g;
}

// Two eyes looking along +z.
function eyes(k, parent, dx, y, z, r, o = {}) {
	[-dx, dx].forEach((x) => {
		k.sphere(r, o.white ?? 0xffffff, { x, y, z, parent, emissive: o.emissive ?? 0x000000 });
		k.sphere(r * (o.pupil ?? 0.5), o.pupilColor ?? 0x111111, { x: x + (o.px ?? 0), y: y + (o.py ?? 0), z: z + r * 0.7, parent });
	});
}

// An umbrella, canopy centred on the group origin.
function umbrella(k, color, o = {}) {
	const g = k.group(o);
	k.cone(o.r ?? 0.9, (o.r ?? 0.9) * 0.4, color, { parent: g, seg: 8 });
	k.cyl(o.stick ?? 0.025, o.stick ?? 0.025, o.len ?? 1.2, o.stickColor ?? 0x2a2018, { y: -(o.len ?? 1.2) / 2, parent: g });
	return g;
}

export const REELS = {
	// ----------------------------------------------------------------------------------------------- the forest spirit
	r68: (k) => {
		k.fog(0xd8ead0, 80, 420);
		k.sky(0x6aaee8, 0xeaf6e0);
		k.light({ sky: 0xf0fff0, ground: 0x4a6a30, hemi: 1.3, sunPos: [40, 60, 40], sunIntensity: 2.2, shadowSize: 70 });
		k.ground(500, 0x6aa848, { bump: 1.2, seg: 50 });
		// Rice paddies.
		for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) k.box(14, 0.1, 9, 0x8ac0a8, { x: -40 + i * 15, y: 0.35, z: 20 + j * 10, rough: 0.2, metal: 0.2 });
		// The great camphor tree with its rope and a little shrine.
		const tree = k.group({ x: 0, z: -50 });
		k.cyl(3.5, 6, 22, 0x5a4430, { y: 11, parent: tree, seg: 10 });
		[0, 1, 2, 3, 4].forEach((i) => k.box(1.5, 1.2, 8, 0x5a4430, { y: 0.4, rx: 0, ry: (i * PI * 2) / 5, z: 0, x: 0, parent: k.group({ parent: tree, ry: (i * PI * 2) / 5 }) }));
		k.torus(4.6, 0.35, 0xe8dcb0, { y: 9, rx: PI / 2, parent: tree, seg: 24 });
		for (let i = 0; i < 8; i++) k.box(0.4, 1.2, 0.05, 0xffffff, { x: Math.cos(i * 0.8) * 4.7, y: 8.2, z: Math.sin(i * 0.8) * 4.7, ry: -i * 0.8 + PI / 2, parent: tree });
		const crowns = [[0, 30, 0, 16], [-12, 26, 4, 12], [12, 27, -2, 13], [4, 38, -4, 12], [-6, 35, -6, 11], [8, 24, 8, 9], [-9, 22, 9, 8]];
		crowns.forEach(([x, y, z, r], i) => k.ico(r, [0x2f6a2a, 0x3a7a30, 0x2a5a26][i % 3], { x, y, z, detail: 1, parent: tree, s: [1, 0.75, 1] }));
		const torii = k.group({ x: -4, z: -40 });
		[-1.4, 1.4].forEach((x) => k.cyl(0.18, 0.2, 3, 0x9a9a90, { x, y: 1.5, parent: torii }));
		k.box(4, 0.3, 0.4, 0x8a8a80, { y: 3.1, parent: torii });
		k.box(3.4, 0.2, 0.3, 0x8a8a80, { y: 2.5, parent: torii });
		trees(k, 70, [-160, 160, -180, -70], { color: 0x2f6a2a, h: 12, seed: 4 });
		// The old house with its blue-roofed study.
		const house = k.group({ x: 40, z: -14, ry: -0.5, from: 1 });
		k.box(14, 4, 8, 0xe8dcc0, { y: 2, parent: house });
		k.cone(10.5, 4, 0x6a5a48, { y: 6, ry: PI / 4, seg: 4, s: [1.05, 1, 0.62], parent: house });
		k.box(4, 7, 4, 0xf0ece0, { x: 9, y: 3.5, parent: house });
		k.cone(3.3, 2.4, 0x3a6ab0, { x: 9, y: 8.2, ry: PI / 4, seg: 4, parent: house });
		k.box(14, 0.3, 2.4, 0x8a6a48, { y: 0.6, z: 5, parent: house });
		// Acorns on the veranda (vignette).
		const ver = k.group({ x: -300 });
		for (let i = 0; i < 10; i++) k.box(0.5, 0.1, 6, i % 2 ? 0x9a7650 : 0x8a6a46, { x: -2.5 + i * 0.52, y: 0, parent: ver });
		const ar = rng(9);
		for (let i = 0; i < 9; i++) {
			const a = k.group({ x: -1.4 + i * 0.32 + (ar() - 0.5) * 0.1, y: 0.13, z: 0.6 - i * 0.18 + (ar() - 0.5) * 0.2, rz: PI / 2 - 0.2, ry: ar() * 6, parent: ver });
			k.sphere(0.08, 0x9a5a22, { parent: a, s: [1, 1.35, 1], rough: 0.4 });
			k.sphere(0.075, 0x5a3a1a, { y: 0.05, parent: a, s: [1.1, 0.6, 1.1], rough: 1 });
			k.cyl(0.01, 0.01, 0.05, 0x3a2a10, { y: 0.11, parent: a });
		}
		k.point(0xfff0d0, 3, 10, { x: -301, y: 3, z: 2 });
		// Soot sprites in the dark corner of the house (vignette).
		const soot = k.group({ x: 300 });
		k.box(10, 0.2, 10, 0x6a5038, { parent: soot });
		k.box(10, 6, 0.3, 0x8a7458, { y: 3, z: -3, parent: soot });
		k.box(0.3, 6, 10, 0x7a6448, { x: -3, y: 3, parent: soot });
		k.box(0.25, 6, 0.25, 0x4a3420, { x: 0.5, y: 3, z: -2.8, parent: soot });
		const sr = rng(5);
		for (let i = 0; i < 22; i++) {
			const x = -2.6 + sr() * 3.2;
			const y = 0.25 + (i < 15 ? 0 : 0.6 + sr() * 1.2);
			const z = -2.6 + sr() * 2.6;
			const s = fuzz(k, 0.18, 0x111111, { x, y, z, parent: soot, seed: i, ry: 0.4 });
			eyes(k, s, 0.07, 0.04, 0.15, 0.05, { pupil: 0.45 });
		}
		k.spot(0xfff0d0, 40, { x: 303, y: 6, z: 4, target: [298.5, 0.5, -1.5], angle: 0.5, distance: 20 });
		k.point(0xffe8c0, 2, 10, { x: 301, y: 2, z: 2 });
		// The bus stop on a rainy night (vignette).
		const N = 400;
		k.ground(140, 0x2a3a28, { z: N, bump: 0.6, seg: 20 });
		k.box(7, 0.06, 140, 0x5a5444, { x: 0, y: 0.25, z: N });
		trees(k, 90, [-60, 60, N - 60, N + 20], { color: 0x1f3a26, trunk: 0x2a2018, h: 12, seed: 8, avoid: (x, z) => Math.abs(x) < 6 || (Math.abs(x + 5) < 4 && Math.abs(z - N) < 6) });
		k.cyl(0.06, 0.06, 2.6, 0x8a8a80, { x: -4.6, y: 1.3, z: N });
		k.cyl(0.35, 0.35, 0.05, 0xd8d0b0, { x: -4.6, y: 2.5, z: N + 0.05, rx: PI / 2, seg: 20 });
		k.box(0.6, 0.3, 0.04, 0xd8d0b0, { x: -4.6, y: 2.0, z: N + 0.05 });
		k.cyl(0.06, 0.08, 5, 0x5a4a3a, { x: -6.5, y: 2.5, z: N - 1.5 });
		k.glow(0xfff0b0, 1.6, { x: -6.1, y: 4.8, z: N - 1.3 });
		k.point(0xffe8a0, 8, 18, { x: -5.8, y: 4.5, z: N, decay: 1 });
		k.particles(2500, 0xb8c8e0, { box: [30, 20, 30], z: N, speed: 18, size: 0.05, opacity: 0.5 });
		const girl = k.person({ x: -3.6, y: 0.25, z: N + 0.8, ry: 0.3, s: 0.8, dress: 0xd8a830, colors: { shirt: 0xf0e8d0, legs: 0xe0b48f, hair: 0x2a1a10 } });
		girl.userData.limbs.armR.rotation.x = -0.6;
		umbrella(k, 0xc83030, { x: -3.45, y: 2.05, z: N + 1.05, r: 0.75 });
		// The catbus, bounding down the road.
		const bus = k.group({ x: 0.5, y: 0.25, z: N - 18, ry: 0.2, from: 4 });
		const fur = 0xc8883a;
		k.capsule(1.9, 7, fur, { y: 3, rx: PI / 2, parent: bus, s: [1, 1, 1.05] });
		k.box(3.82, 1.2, 6, 0xf0e0a0, { y: 3.4, parent: bus, emissive: 0x806020, glow: 0.6 });
		for (let i = 0; i < 4; i++) [-1, 1].forEach((s) => k.box(0.15, 1.4, 0.2, fur, { x: s * 1.93, y: 3.4, z: -2.4 + i * 1.6, parent: bus }));
		for (let i = 0; i < 6; i++) [-1, 1].forEach((s) => k.cyl(0.3, 0.22, 2.2, fur, { x: s * 1.3, y: 1.1, z: -3.4 + i * 1.4, rx: Math.sin(i * 2) * 0.4, parent: bus }));
		const head = k.group({ y: 4, z: 5.2, parent: bus });
		k.sphere(2, fur, { parent: head, s: [1.1, 0.95, 0.9] });
		[-1, 1].forEach((s) => k.cone(0.7, 1.4, fur, { x: s * 1.2, y: 1.9, parent: head, seg: 4, rz: -s * 0.3 }));
		[-0.9, 0.9].forEach((x) => {
			k.sphere(0.45, 0xfff080, { x, y: 0.5, z: 1.6, parent: head, emissive: 0xffe060, glow: 1.2 });
			k.glow(0xfff0a0, 2, { x, y: 0.5, z: 2.1, parent: head });
		});
		k.box(2.4, 0.5, 0.2, 0xf8f4ea, { y: -0.6, z: 1.75, parent: head });
		k.box(2.6, 0.08, 0.22, 0x3a2010, { y: -0.6, z: 1.76, parent: head });
		[-1, 1].forEach((s) => k.glow(0xfff0a0, 1.5, { x: s * 0.6, y: 5.3, z: 3, parent: bus }));
		k.capsule(0.35, 3, fur, { y: 5, z: -6, rx: -0.6, parent: bus });
		k.spot(0xfff0b0, 60, { x: 0.5, y: 4.5, z: N - 12, target: [-1, 0, N], angle: 0.5, distance: 40 });
		// The big grey spirit beside her, under the black umbrella.
		const tot = k.group({ x: -6.2, y: 0.25, z: N + 1.6, ry: 0.35, from: 5 });
		const grey = 0x6e7682;
		k.sphere(2.3, grey, { y: 2.6, parent: tot, s: [1, 1.2, 0.9], seg: 18 });
		k.sphere(1.8, 0xe8e2cc, { y: 2.2, z: 0.55, parent: tot, s: [1, 1.15, 0.8], seg: 18 });
		for (let row = 0; row < 3; row++) for (let i = -1; i <= 1; i++) {
			if (row === 0 && i !== 0) continue;
			const c = k.group({ x: i * 0.55, y: 3.3 - row * 0.45, z: 2.03 - Math.abs(i) * 0.1, parent: tot });
			[-1, 1].forEach((s) => k.box(0.22, 0.06, 0.06, grey, { x: s * 0.09, rz: s * 0.45, parent: c }));
		}
		[-1, 1].forEach((s) => k.cone(0.4, 1.4, grey, { x: s * 1.1, y: 5.6, rz: -s * 0.15, parent: tot, seg: 8 }));
		eyes(k, tot, 0.8, 4.2, 1.4, 0.26, { pupil: 0.45 });
		k.sphere(0.12, 0x222222, { y: 4.35, z: 1.7, parent: tot, s: [1.6, 0.6, 1] });
		[-1, 1].forEach((s) => [0, 1, 2].forEach((i) => k.box(0.9, 0.03, 0.03, 0x333333, { x: s * 1.55, y: 3.9 - i * 0.15, z: 1.25, rz: s * (0.15 - i * 0.15), parent: tot })));
		k.capsule(0.45, 1.6, grey, { x: -2.1, y: 2.6, rz: 0.25, parent: tot });
		k.capsule(0.45, 1.6, grey, { x: 2.2, y: 4.6, z: 0.3, rz: -0.35, parent: tot });
		[-1, 1].forEach((s) => k.sphere(0.6, grey, { x: s * 0.9, y: 0.3, z: 0.4, parent: tot, s: [1, 0.5, 1.3] }));
		k.box(1, 0.06, 0.6, 0x4a9a3a, { y: 5.2, z: 0.1, rz: 0.2, parent: tot });
		umbrella(k, 0x15151a, { x: 2.65, y: 7.0, z: 0.3, parent: tot, r: 1.4, len: 1.7, stick: 0.07, stickColor: 0x9a8a70 });
		return {
			shots: [
				{ pos: [-299.2, 0.9, 1.6], look: [-300.2, 0.1, 0], fov: 40 },
				{ pos: [14, 2.5, -8], look: [0, 19, -50], fov: 55 },
				{ pos: [301.8, 1.4, 2.5], look: [299, 0.6, -1.2], fov: 45 },
				{ pos: [-0.5, 1.6, N + 7], look: [-4.5, 1.7, N], fov: 45, fog: [0x1e2a38, 8, 70], exposure: 0.95 },
				{ pos: [10, 2.5, N - 6], look: [0.5, 3.2, N - 18], fov: 45, fog: [0x1e2a38, 8, 80], exposure: 1.0 },
				{ pos: [-2, 3.2, N + 10], look: [-5, 4.2, N + 1], fov: 50, fog: [0x1e2a38, 10, 80], exposure: 1.1 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the super family
	r69: (k) => {
		k.fog(0xbfe0f0, 80, 500);
		k.sky(0x3a8ee0, 0xd8f0f8);
		k.light({ sky: 0xf0f8ff, ground: 0x506040, hemi: 1.3, sunPos: [40, 70, 50], sunIntensity: 2.4, shadowSize: 60 });
		k.water(600, 0x1a78a8, { seg: 60, amp: 0.3 });
		// The volcanic island with its hidden base.
		const isle = k.group({ x: 0, z: -120 });
		k.cone(60, 45, 0x4a6a3a, { y: 18, parent: isle, seg: 9, s: [1, 1, 0.8] });
		k.cone(26, 22, 0x5a4a40, { y: 46, parent: isle, seg: 9 });
		k.cyl(9, 9, 1, 0x2a2420, { y: 56.5, parent: isle, seg: 9 });
		k.cyl(66, 70, 4, 0xd8c890, { y: 0, parent: isle, seg: 12, s: [1, 1, 0.8] });
		const ir = rng(4);
		for (let i = 0; i < 40; i++) {
			const a = ir() * PI * 2;
			const r = 40 + ir() * 16;
			k.ico(4 + ir() * 3, 0x2f6a2a, { x: Math.cos(a) * r, y: 10 + ir() * 6, z: Math.sin(a) * r * 0.8, parent: isle });
		}
		k.cyl(1.5, 1.5, 30, 0xd0d4d8, { x: -20, y: 30, z: 30, parent: isle, metal: 0.5 });
		k.cone(1.5, 4, 0xd03020, { x: -20, y: 47, z: 30, parent: isle });
		k.box(4, 30, 4, 0x6a6a70, { x: -24, y: 25, z: 30, parent: isle });
		k.box(60, 1, 2, 0xb0b4b8, { x: 0, y: 14, z: 42, parent: isle, ry: 0.2 });
		// Glasses on the designer's sketches (vignette).
		const desk = k.group({ x: -500 });
		k.box(8, 0.2, 5, 0xf4f4f4, { parent: desk, rough: 0.3 });
		const sketch = k.canvas(256, 340, (g, w, h) => {
			g.fillStyle = "#fbfbf6";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#333";
			g.lineWidth = 3;
			g.beginPath();
			g.arc(128, 60, 22, 0, PI * 2);
			g.moveTo(128, 82);
			g.lineTo(128, 200);
			g.moveTo(80, 110);
			g.lineTo(176, 110);
			g.moveTo(128, 200);
			g.lineTo(96, 300);
			g.moveTo(128, 200);
			g.lineTo(160, 300);
			g.stroke();
			// Fabric swatches pinned beside the figure, no cape.
			[[190, 40, "#3a6ab0"], [190, 90, "#9a9a9a"], [190, 140, "#d8b040"]].forEach(([x, y, c]) => {
				g.fillStyle = c;
				g.fillRect(x, y, 44, 34);
			});
			g.strokeStyle = "#888";
			g.lineWidth = 1;
			for (let i = 0; i < 6; i++) {
				g.beginPath();
				g.moveTo(20, 320 - i * 9);
				g.lineTo(120 + (i % 3) * 30, 320 - i * 9);
				g.stroke();
			}
		});
		k.plane(1.6, 2.1, k.mat(0xffffff, { map: sketch }), { x: -500.3, y: 0.11, z: 0.1, rx: -PI / 2, rz: 0.15 });
		k.plane(1.6, 2.1, 0xf0eee6, { x: -498.8, y: 0.105, z: -0.4, rx: -PI / 2, rz: -0.3 });
		const glasses = k.group({ x: -499.6, y: 0.2, z: 0.6, ry: 0.4 });
		[-0.33, 0.33].forEach((x) => {
			k.torus(0.28, 0.045, 0x0a0a0a, { x, rx: PI / 2 - 0.15, parent: glasses, rough: 0.2 });
			k.cyl(0.27, 0.27, 0.01, 0xcfe8ff, { x, rx: -0.15, parent: glasses, opacity: 0.3, rough: 0.05 });
			k.box(0.04, 0.04, 0.6, 0x0a0a0a, { x: x * 1.9, y: 0.02, z: -0.3, parent: glasses });
		});
		k.box(0.12, 0.04, 0.04, 0x0a0a0a, { y: 0.05, parent: glasses });
		k.cyl(0.03, 0.03, 1.2, 0xf2c230, { x: -501, y: 0.13, z: 0.8, rz: PI / 2, ry: 0.6 });
		k.point(0xffffff, 3, 10, { x: -500, y: 3, z: 2 });
		// The suburban driveway: a big man in a shirt and tie lifts his car (vignette).
		const S = 500;
		k.box(120, 1, 80, 0x6aa848, { x: S, y: -0.5 });
		k.box(5, 0.05, 20, 0x9a9a98, { x: S, y: 0.02, z: 2 });
		k.box(120, 0.05, 8, 0x5a5a5e, { x: S, y: 0.02, z: 16 });
		const home = k.group({ x: S - 2, z: -12 });
		k.box(16, 5, 9, 0xe8d8b8, { y: 2.5, parent: home });
		k.box(6, 3.6, 0.2, 0xf0f0f0, { x: 3, y: 1.8, z: 4.55, parent: home });
		k.cone(11.5, 3, 0x7a4a3a, { y: 6.5, ry: PI / 4, seg: 4, s: [1, 1, 0.6], parent: home });
		k.box(2, 1.5, 0.1, 0x8ab0d0, { x: -4, y: 2.8, z: 4.55, parent: home });
		trees(k, 8, [S - 40, S + 40, -30, -18], { color: 0x3a7a30, h: 9, seed: 2 });
		const bob = k.person({ x: S, y: 0, z: 4, s: 1.3, colors: { shirt: 0xf4f4f4, legs: 0x3a4a6a, hair: 0xd8b048, skin: 0xe8b890 }, from: 2 });
		k.box(0.08, 0.5, 0.03, 0x2a4a9a, { y: 1.3, z: 0.15, parent: bob });
		bob.userData.limbs.armL.rotation.z = -2.95;
		bob.userData.limbs.armR.rotation.z = 2.95;
		bob.userData.limbs.body.scale.set(1.3, 1, 1.2);
		const car = k.group({ x: S, y: 3.05, z: 4, rz: 0.06, from: 2 });
		k.box(4.6, 0.9, 2, 0x6a8a9a, { y: 0.6, parent: car });
		k.box(2.6, 0.8, 1.8, 0x5a7a8a, { x: -0.2, y: 1.4, parent: car });
		k.box(2.4, 0.6, 1.82, 0x9ac0d8, { x: -0.2, y: 1.4, parent: car, opacity: 0.8 });
		[-1.5, 1.5].forEach((x) => [-1, 1].forEach((z) => k.cyl(0.38, 0.38, 0.3, 0x1a1a1a, { x, y: 0.2, z: z * 0.95, rx: PI / 2, parent: car })));
		// Metroville under attack (vignette).
		const C = 600;
		k.box(300, 1, 300, 0x4a4a50, { z: C, y: -0.5 });
		city(k, 120, [-120, 120, C - 140, C + 40], { h: 36, w: 10, colors: [0x8a9ab0, 0x9aa8b8, 0x7a8aa0, 0xc0b8a8], avoid: (x, z) => Math.abs(x) < 26 && z > C - 50, seed: 5 });
		const bot = k.group({ x: 0, y: 0, z: C - 22, from: 2 });
		k.sphere(8, 0x2a2a30, { y: 16, parent: bot, s: [1, 0.75, 1], seg: 16, metal: 0.6, rough: 0.35 });
		k.cyl(4, 6.5, 2, 0x3a3a42, { y: 10, parent: bot, metal: 0.5 });
		k.box(5, 0.6, 0.6, 0xff2a1a, { y: 17, z: 7, rx: -0.3, parent: bot, emissive: 0xff1000 });
		k.glow(0xff3020, 6, { y: 17, z: 7.6, parent: bot });
		for (let i = 0; i < 6; i++) {
			const leg = k.group({ y: 11, ry: (i / 6) * PI * 2 + 0.5, parent: bot });
			k.box(1.6, 1.6, 9, 0x34343c, { y: 3, z: 4.5, rx: -0.5, parent: leg, metal: 0.5 });
			k.sphere(1.3, 0x44444c, { y: 5.2, z: 8.8, parent: leg, metal: 0.5 });
			k.box(1.4, 13, 1.4, 0x34343c, { y: -1.5, z: 9.6, rx: 0.15, parent: leg, metal: 0.5 });
			k.cone(0.8, 2.5, 0x55555c, { y: -9, z: 10.8, rx: PI, parent: leg });
		}
		k.point(0xff6020, 8, 60, { x: 10, y: 6, z: C - 10 });
		// The family, suited up.
		const red = { shirt: 0xc81e1e, legs: 0xc81e1e, shoes: 0x111111, skin: 0xe8b890 };
		const logo = k.canvas(128, 128, (g) => {
			g.fillStyle = "#111";
			g.beginPath();
			g.arc(64, 64, 62, 0, PI * 2);
			g.fill();
			g.fillStyle = "#f29a1a";
			g.beginPath();
			g.arc(64, 64, 50, 0, PI * 2);
			g.fill();
			g.fillStyle = "#111";
			g.beginPath();
			g.arc(66, 36, 9, 0, PI * 2);
			g.fill();
			g.beginPath();
			g.moveTo(52, 52);
			g.lineTo(76, 50);
			g.lineTo(72, 104);
			g.lineTo(58, 106);
			g.closePath();
			g.fill();
		});
		const logoMat = k.mat(0xffffff, { map: logo });
		const fam = [
			{ x: -2.4, s: 1.35, hair: 0xd8b048, w: 1.25 },
			{ x: -0.6, s: 1.1, hair: 0x7a3a1a },
			{ x: 0.9, s: 0.95, hair: 0x111111, long: true },
			{ x: 2.2, s: 0.72, hair: 0xe0b040 },
		];
		fam.forEach((f, i) => {
			const p = k.person({ x: f.x, y: 0, z: C + 4 + Math.abs(f.x) * 0.2, s: f.s, ry: -f.x * 0.06, shades: true, colors: { ...red, hair: f.hair }, from: 4 });
			p.userData.limbs.armL.rotation.z = -0.25;
			p.userData.limbs.armR.rotation.z = 0.25;
			if (f.w) p.userData.limbs.body.scale.set(f.w, 1, 1.1);
			if (f.long) k.box(0.4, 0.5, 0.12, f.hair, { y: 1.62, z: -0.16, parent: p });
			k.box(0.52, 0.12, 0.3, 0x111111, { y: 0.92, parent: p });
			k.plane(0.26, 0.26, logoMat, { y: 1.36, z: 0.15 * (f.w ?? 1) + 0.005, parent: p, from: 5 });
			void i;
		});
		const baby = k.group({ x: -0.6 + 0.3, y: 1.45, z: C + 4.45, from: 4 });
		k.sphere(0.2, 0xc81e1e, { parent: baby, s: [1, 1.2, 1] });
		k.sphere(0.16, 0xe8b890, { y: 0.3, parent: baby });
		k.box(0.25, 0.05, 0.05, 0x111111, { y: 0.33, z: 0.14, parent: baby });
		return {
			shots: [
				{ pos: [40, 8, 30], look: [-5, 25, -120], fov: 45 },
				{ pos: [-499.6, 1.4, 1.6], look: [-499.7, 0.15, 0.4], fov: 40 },
				{ pos: [16, 2, C + 14], look: [0, 12, C - 22], fov: 55 },
				{ pos: [S + 5, 1.6, 11], look: [S, 2.6, 3], fov: 45 },
				{ pos: [4, 1.0, C + 18], look: [0, 6, C], fov: 55 },
				{ pos: [1.5, 1.5, C + 11], look: [-0.3, 2.4, C + 4], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the voyager
	r70: (k) => {
		k.fog(0xf8d8b0, 80, 520);
		k.sky(0x3a90d8, 0xffe0b0, { offset: -0.03 });
		k.light({ sky: 0xfff0d8, ground: 0x305060, hemi: 1.3, sunColor: 0xffd8a0, sunPos: [60, 40, 40], sunIntensity: 2.4, shadowSize: 50 });
		k.water(700, 0x1a8ab0, { seg: 70, amp: 0.45 });
		k.glow(0xffd090, 90, { x: 80, y: 30, z: -380, tag: "sky" });
		// A cairn of stones on the island's peak, the ocean far below (vignette).
		const V = -500;
		k.ground(60, 0x5a9a48, { x: V, bump: 0.5, seg: 24, height: (x, z) => -Math.max(0, Math.hypot(x, z) - 4) * 0.35 });
		const cairnR = rng(12);
		const stones = [[0.75, 0.32], [0.6, 0.28], [0.5, 0.24], [0.38, 0.2], [0.28, 0.16], [0.18, 0.12]];
		let sy = 0;
		stones.forEach(([r, h], i) => {
			k.cyl(r * 0.9, r, h, [0x6a6660, 0x7a756c, 0x5e5a54][i % 3], { x: V + (cairnR() - 0.5) * 0.08, y: sy + h / 2, z: (cairnR() - 0.5) * 0.08, ry: cairnR() * 6, seg: 7, rough: 0.9 });
			sy += h;
		});
		k.ico(0.1, 0xb8b0a0, { x: V, y: sy + 0.08, z: 0, s: [1.2, 0.7, 1] });
		for (let i = 0; i < 14; i++) {
			const a = cairnR() * PI * 2;
			const r = 1.2 + cairnR() * 3;
			k.ico(0.12 + cairnR() * 0.2, 0x6a665e, { x: V + Math.cos(a) * r, y: 0, z: Math.sin(a) * r, ry: cairnR() * 6 });
			k.cone(0.06, 0.4 + cairnR() * 0.3, 0x4a8a3a, { x: V + Math.cos(a + 1) * r, y: 0.15, z: Math.sin(a + 1) * r, seg: 3, rz: (cairnR() - 0.5) * 0.4 });
		}
		// The ocean parts around a path (vignette).
		const P = 500;
		k.ground(80, 0xe0cc98, { x: P, y: -3, bump: 0.3, seg: 20 });
		[-1, 1].forEach((s) => {
			k.box(30, 14, 60, 0x2ab0d0, { x: P + s * 18, y: 3, opacity: 0.75, rough: 0.5 });
			k.box(30, 0.6, 60, 0xdff8ff, { x: P + s * 18, y: 10.2, opacity: 0.85 });
		});
		const fr = rng(2);
		for (let i = 0; i < 26; i++) {
			const s = fr() > 0.5 ? 1 : -1;
			k.cone(0.25, 0.7, [0xf2c230, 0xf06a30, 0x40c0f0][i % 3], { x: P + s * (3.6 + fr() * 2), y: -1 + fr() * 9, z: -20 + fr() * 40, rz: PI / 2, seg: 4, emissive: 0x302000 });
		}
		k.point(0xd0f8ff, 6, 40, { x: P, y: 6, z: 6 });
		// The voyaging canoe.
		const canoe = (o) => {
			const g = k.group(o);
			[-1.3, 1.3].forEach((x) => {
				k.capsule(0.5, 7, 0x6a3e22, { x, y: 0.3, rx: PI / 2, parent: g, s: [1, 1, 0.6] });
				k.cone(0.4, 1.4, 0x6a3e22, { x, y: 1, z: -4, rx: -0.4, parent: g });
			});
			k.box(3.4, 0.2, 4, 0xb08850, { y: 0.75, parent: g });
			k.cyl(0.1, 0.12, 8, 0x5a3a20, { y: 4.6, z: 0.5, rx: -0.12, parent: g });
			const sail = new k.THREE.Shape();
			sail.moveTo(0, 0);
			sail.lineTo(-2.4, 7.4);
			sail.quadraticCurveTo(0.6, 6.4, 3.4, 6.2);
			sail.closePath();
			const sailTex = k.canvas(256, 256, (c) => {
				c.fillStyle = "#e8c890";
				c.fillRect(0, 0, 256, 256);
				c.strokeStyle = "#7a2a18";
				c.lineWidth = 12;
				c.beginPath();
				for (let i = 0; i < 80; i++) {
					const a = -i * 0.2;
					const r = 6 + i * 0.75;
					c.lineTo(128 + Math.cos(a) * r, 90 + Math.sin(a) * r);
				}
				c.stroke();
			});
			const geo = new k.THREE.ShapeGeometry(sail);
			const uv = geo.attributes.uv;
			const pos = geo.attributes.position;
			for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 2.4) / 5.8, pos.getY(i) / 7.4);
			k.mesh(geo, k.mat(0xffffff, { map: sailTex, side: k.THREE.DoubleSide }), { y: 1.2, z: 0.3, ry: PI / 2, parent: g });
			return g;
		};
		const boat = canoe({ x: 0, y: 0, z: 0, ry: -0.6 });
		k.tick((t) => {
			boat.position.y = Math.sin(t * 1.2) * 0.15;
			boat.rotation.z = Math.sin(t * 0.9) * 0.04;
		});
		// The girl, the chicken and the pig aboard.
		const girl = k.person({ x: 0.3, y: 0.85, z: 1.4, ry: 1.2, s: 0.9, dress: 0xe8dcc0, colors: { shirt: 0xc83a2a, legs: 0x8a5a3a, skin: 0x9a6038, hair: 0x1a1210 }, parent: boat, from: 5 });
		k.sphere(0.32, 0x1a1210, { y: 1.6, z: -0.12, parent: girl, s: [1.1, 1.4, 0.9] });
		girl.userData.limbs.armR.rotation.x = -0.9;
		const hen = k.group({ x: -0.6, y: 0.85, z: 2.2, ry: 0.5, parent: boat, from: 5 });
		k.sphere(0.2, 0x6a3018, { y: 0.25, parent: hen, s: [0.9, 1, 1.2] });
		k.sphere(0.11, 0x6a3018, { y: 0.5, z: 0.12, parent: hen });
		k.box(0.04, 0.1, 0.12, 0xd02020, { y: 0.63, z: 0.12, parent: hen });
		k.cone(0.04, 0.12, 0xf2c230, { y: 0.5, z: 0.26, rx: PI / 2, parent: hen });
		[-0.05, 0.05].forEach((x) => k.cyl(0.015, 0.015, 0.12, 0xf2c230, { x, y: 0.06, parent: hen }));
		eyes(k, hen, 0.06, 0.53, 0.18, 0.035, { pupil: 0.3 });
		const pig = k.group({ x: 1, y: 0.85, z: 2.4, parent: boat, from: 5 });
		k.sphere(0.25, 0xf0b0b8, { y: 0.25, parent: pig, s: [1, 0.9, 1.2] });
		k.sphere(0.14, 0xf0b0b8, { y: 0.38, z: 0.27, parent: pig });
		k.sphere(0.07, 0x3a2a2a, { y: 0.28, z: 0.4, parent: pig, s: [1, 1, 0.3] });
		// The demigod on his beach, hook in hand (vignette).
		const B = -300;
		const beach = k.group({ z: B });
		k.ground(120, 0xf0dcae, { parent: beach, y: 0.4, bump: 0.3, seg: 20, height: (x, z) => Math.min(2, -z * 0.06) });
		k.ico(14, 0x6a6058, { x: 18, y: 4, z: -26, parent: beach, s: [1, 1.6, 1] });
		const pr = rng(3);
		for (let i = 0; i < 8; i++) {
			const x = -30 + i * 7;
			const palm = k.group({ x, y: 1, z: -18 - pr() * 10, rz: (pr() - 0.5) * 0.4, parent: beach });
			k.cyl(0.25, 0.35, 8, 0x8a6a40, { y: 4, parent: palm });
			for (let j = 0; j < 6; j++) k.box(0.6, 0.06, 3.6, 0x3a8a2a, { y: 8, ry: (j / 6) * PI * 2, rx: 0.35, parent: k.group({ y: 0, ry: (j / 6) * PI * 2, parent: palm }), z: 1.6 });
		}
		const maui = k.group({ x: 0, y: 0.4, z: B, from: 4 });
		const skin = 0x9a5a30;
		k.box(1.7, 0.9, 1, 0x3a2a1a, { y: 2.1, parent: maui });
		for (let i = 0; i < 12; i++) k.box(0.18, 0.8, 0.08, 0x5a7a2a, { x: Math.cos((i / 12) * PI * 2) * 0.85, y: 1.7, z: Math.sin((i / 12) * PI * 2) * 0.55, ry: -(i / 12) * PI * 2, parent: maui });
		[-0.45, 0.45].forEach((x) => k.box(0.55, 1.6, 0.55, skin, { x, y: 0.8, parent: maui }));
		k.sphere(1.25, skin, { y: 3.3, parent: maui, s: [1.15, 1, 0.75] });
		const ink = 0x1a1410;
		[[0, 3.9], [0, 3.5]].forEach(([x, y]) => k.box(1.9, 0.08, 0.1, ink, { x, y, z: 0.86, parent: maui }));
		for (let i = 0; i < 5; i++) k.cone(0.12, 0.25, ink, { x: -0.6 + i * 0.3, y: 3.15, z: 0.88, rx: PI / 2, rz: PI, seg: 3, parent: maui, s: [1, 1, 0.3] });
		k.box(0.6, 0.6, 0.1, ink, { x: 0.45, y: 2.7, z: 0.8, rz: 0.3, parent: maui });
		k.sphere(0.55, skin, { y: 4.75, z: 0.15, parent: maui, s: [1, 1.05, 1] });
		k.ico(0.8, 0x120c0a, { y: 4.6, z: -0.45, parent: maui, s: [1.25, 1.5, 0.9], detail: 1 });
		k.ico(0.6, 0x120c0a, { y: 5.0, z: -0.05, parent: maui, s: [1.1, 0.7, 1], detail: 1 });
		eyes(k, maui, 0.2, 4.85, 0.62, 0.08, { pupil: 0.6 });
		k.sphere(0.12, 0x7a4220, { y: 4.68, z: 0.7, parent: maui, s: [1.4, 0.8, 1] });
		k.box(0.36, 0.07, 0.05, 0xffffff, { y: 4.48, z: 0.62, parent: maui });
		[-1, 1].forEach((s) => k.capsule(0.32, 1.6, skin, { x: s * 1.55, y: 3.1, rz: s * 0.25, parent: maui }));
		const hook = k.group({ x: 2.3, y: 2.2, z: 0.3, rz: -0.15, parent: maui });
		k.cyl(0.14, 0.18, 6, 0xe8dcc0, { y: 3, parent: hook });
		k.torus(1.1, 0.18, 0xe8dcc0, { x: -1.1, y: 6, arc: PI * 1.1, parent: hook, rz: -0.1 });
		k.cone(0.22, 0.6, 0xe8dcc0, { x: -2.2, y: 5.7, rz: PI, parent: hook });
		k.box(0.42, 0.6, 0.42, 0x6a4a2a, { y: 0.8, parent: hook });
		// Te Ka: the lava demon on her blackened island (vignette).
		const L = 300;
		const lava = k.group({ z: L, x: 500 });
		k.ground(160, 0x1e1614, { parent: lava, bump: 2, seg: 30 });
		const demon = k.group({ x: 500, z: L - 30, from: 2 });
		const crack = k.canvas(128, 128, (g) => {
			g.fillStyle = "#1a120e";
			g.fillRect(0, 0, 128, 128);
			g.strokeStyle = "#ff6a10";
			g.lineWidth = 2.5;
			for (let i = 0; i < 40; i++) {
				g.beginPath();
				let x = Math.random() * 128;
				let y = Math.random() * 128;
				g.moveTo(x, y);
				for (let j = 0; j < 5; j++) g.lineTo((x += (Math.random() - 0.5) * 24), (y += (Math.random() - 0.5) * 24));
				g.stroke();
			}
		});
		const rock = new k.THREE.MeshStandardMaterial({ color: 0x3a2a24, map: crack, emissive: 0xffffff, emissiveMap: crack, emissiveIntensity: 1.6, flatShading: true, roughness: 0.9 });
		k.ico(8, rock, { y: 14, parent: demon, s: [1.1, 1.6, 0.8], detail: 1 });
		k.ico(6, rock, { y: 3, parent: demon, s: [1.6, 0.6, 1.2], detail: 1 });
		k.ico(4.5, rock, { y: 28, parent: demon, detail: 1, s: [1, 1.15, 0.9] });
		[-1, 1].forEach((s) => k.capsule(2.4, 12, rock, { x: s * 11, y: 24, rz: s * 2.3, parent: demon }));
		[-2, 2].forEach((x) => k.glow(0xffe060, 4, { x, y: 29, z: 3.8, parent: demon }));
		k.box(3, 0.8, 1, 0xff8a20, { y: 26, z: 3.6, parent: demon, emissive: 0xff6010, glow: 1.5 });
		const hairR = rng(7);
		for (let i = 0; i < 14; i++) k.cone(1.6, 8 + hairR() * 8, 0xffa020, { x: (hairR() - 0.5) * 7, y: 34 + hairR() * 2, z: -1 - hairR() * 3, rx: -0.3, rz: (hairR() - 0.5) * 0.8, parent: demon, emissive: 0xff4000, glow: 1.2 });
		k.particles(600, 0xff8a30, { x: 500, z: L - 20, box: [60, 40, 40], speed: -3, size: 0.25, opacity: 0.8 });
		k.point(0xff6020, 30, 80, { x: 500, y: 20, z: L - 15, decay: 1 });
		return {
			shots: [
				{ pos: [-497.2, 1.6, 2.6], look: [-500, 0.8, 0], fov: 45 },
				{ pos: [P, 2, 22], look: [P, 2, -10], fov: 55 },
				{ pos: [506, 4, L + 18], look: [500, 21, L - 30], fov: 55, fog: [0x3a1a14, 30, 160], exposure: 1.3 },
				{ pos: [22, 5, 16], look: [0, 3.5, 0], fov: 24 },
				{ pos: [3, 2.6, B + 11], look: [0.5, 4.2, B], fov: 50 },
				{ pos: [5, 2.4, 6.5], look: [0.2, 1.8, 0.5], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the lamp
	r71: (k) => {
		k.fog(0xd89a78, 120, 600);
		k.sky(0x2a3478, 0xf4a46a, { offset: -0.02 });
		k.light({ sky: 0xffe0c0, ground: 0x6a4a30, hemi: 1.3, sunColor: 0xffb070, sunPos: [-60, 30, 40], sunIntensity: 2.2, shadowSize: 90, sunTarget: [0, 0, -40] });
		k.ground(700, 0xd8b078, { bump: 1.5, seg: 60 });
		// Agrabah: flat-roofed houses around the palace.
		const ar = rng(12);
		const sand = [0xe8c898, 0xd8b080, 0xf0dcb0, 0xc89a70];
		for (let i = 0; i < 160; i++) {
			const x = (ar() - 0.5) * 220;
			const z = -40 + (ar() - 0.5) * 200;
			if (Math.hypot(x, (z + 70) * 1.2) < 45) continue;
			const w = 4 + ar() * 5;
			const h = 3 + ar() * 7;
			k.box(w, h, w * (0.7 + ar() * 0.6), sand[i % 4], { x, y: h / 2, z, ry: (ar() - 0.5) * 0.3 });
			if (ar() > 0.85) k.sphere(w * 0.35, 0xf0e8d8, { x, y: h, z, s: [1, 1.2, 1], seg: 10 });
			if (ar() > 0.7) k.box(0.8, 1.2, 0.1, 0x3a2418, { x, y: 1.2, z: z + w * 0.36 });
		}
		// The palace: white onion domes with gold tips.
		const pal = k.group({ x: 0, z: -75 });
		const onion = (x, y, z, r) => {
			k.sphere(r, 0xf8f4ec, { x, y, z, s: [1, 1.15, 1], seg: 16, parent: pal });
			k.cone(r * 0.55, r * 1.3, 0xf8f4ec, { x, y: y + r * 1.25, z, seg: 16, parent: pal });
			k.cyl(0.08 * r, 0.08 * r, r * 0.6, 0xe0b030, { x, y: y + r * 2.1, z, parent: pal, metal: 0.8, rough: 0.3 });
			k.sphere(0.12 * r, 0xe0b030, { x, y: y + r * 2.3, z, parent: pal, metal: 0.8, rough: 0.3 });
		};
		k.box(50, 14, 34, 0xf0e8dc, { y: 7, parent: pal });
		k.cyl(12, 12, 8, 0xf0e8dc, { y: 18, parent: pal, seg: 20 });
		onion(0, 29, 0, 11);
		[[-17, -11], [17, -11], [-17, 11], [17, 11]].forEach(([x, z]) => {
			k.cyl(3.4, 3.6, 22, 0xf0e8dc, { x, y: 11, z, parent: pal, seg: 12 });
			onion(x, 25, z, 4.2);
		});
		[[-30, 18], [30, 18]].forEach(([x, z]) => {
			k.cyl(1.6, 1.8, 40, 0xf0e8dc, { x, y: 20, z, parent: pal, seg: 10 });
			onion(x, 42, z, 2.6);
		});
		for (let i = 0; i < 9; i++) k.box(2, 4, 0.2, 0x3a5a8a, { x: -20 + i * 5, y: 8, z: 17.05, parent: pal, emissive: 0x2a3a6a, glow: 0.3 });
		// The moon for the night ride.
		k.disc(0xfff6dc, 60, { x: -150, y: 110, z: -290, from: 3 });
		k.glow(0xfff0c0, 160, { x: -150, y: 110, z: -292, opacity: 0.5, from: 3 });
		k.stars(800, { from: 4 });
		// The carpet's woven pattern.
		const weave = k.canvas(256, 384, (g, w, h) => {
			g.fillStyle = "#6a2a8a";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#e8b830";
			g.lineWidth = 10;
			g.strokeRect(14, 14, w - 28, h - 28);
			g.fillStyle = "#c83a3a";
			g.fillRect(34, 34, w - 68, h - 68);
			g.fillStyle = "#2a3a8a";
			g.beginPath();
			g.moveTo(w / 2, 60);
			g.lineTo(w - 60, h / 2);
			g.lineTo(w / 2, h - 60);
			g.lineTo(60, h / 2);
			g.closePath();
			g.fill();
			g.fillStyle = "#e8b830";
			for (let i = 0; i < 4; i++) {
				g.beginPath();
				g.arc(w / 2, h / 2, 50 - i * 12, 0, PI * 2);
				g.fillStyle = i % 2 ? "#e8b830" : "#6a2a8a";
				g.fill();
			}
		});
		const carpetMat = k.mat(0xffffff, { map: weave, side: k.THREE.DoubleSide });
		const carpet = (o) => {
			const g = k.group(o);
			k.box(2.4, 0.06, 3.6, carpetMat, { parent: g });
			[-1.2, 1.2].forEach((x) => [-1.8, 1.8].forEach((z) => {
				k.cyl(0.06, 0.12, 0.35, 0xe8b830, { x: x * 1.03, y: -0.05, z: z * 1.05, rx: Math.sign(z) * 1.2, parent: g });
				k.sphere(0.07, 0xe8b830, { x, z, parent: g });
			}));
			return g;
		};
		// A market stall: bread, melons and pots under a striped awning (vignette).
		const V = k.group({ x: -500 });
		k.ground(40, 0xd8b484, { parent: V, bump: 0.2, seg: 20 });
		k.box(40, 6, 0.4, 0xe0c090, { x: -500, y: 3, z: -3.2 });
		k.box(3.6, 0.15, 1.6, 0x8a5a32, { x: -500, y: 1.1, z: -1.2 });
		k.box(3.6, 1, 0.1, 0x7a4a28, { x: -500, y: 0.55, z: -0.42 });
		[-1.7, 1.7].forEach((x) => k.cyl(0.06, 0.06, 2.9, 0x6a4022, { x: -500 + x, y: 1.45, z: -0.45 }));
		const awn = k.canvas(256, 64, (g, w, h) => {
			for (let i = 0; i < 8; i++) {
				g.fillStyle = i % 2 ? "#f0e6d0" : "#c86a2a";
				g.fillRect((i * w) / 8, 0, w / 8 + 1, h);
			}
		});
		k.box(4, 0.06, 2.4, k.mat(0xffffff, { map: awn }), { x: -500, y: 2.95, z: -1.4, rx: 0.22 });
		const sr = rng(31);
		for (let i = 0; i < 9; i++) k.capsule(0.1, 0.32, 0xc8904a, { x: -501.2 + (i % 5) * 0.3, y: 1.3 + Math.floor(i / 5) * 0.12, z: -1.5 + Math.floor(i / 5) * 0.25 + (sr() - 0.5) * 0.1, rz: PI / 2, ry: (sr() - 0.5) * 0.6 });
		[[0.3, -1.4], [0.75, -1.1], [0.55, -1.7]].forEach(([x, z]) => k.sphere(0.24, 0x5a8a3a, { x: -500 + x, y: 1.4, z, s: [1, 0.9, 1.2] }));
		for (let i = 0; i < 6; i++) k.sphere(0.09, 0xc8281a, { x: -498.9 + (i % 3) * 0.18, y: 1.27 + Math.floor(i / 3) * 0.1, z: -1.2 + Math.floor(i / 3) * 0.08, rough: 0.4 });
		[[-2.6, 0.4, 0.5], [-2.2, -0.3, 0.38], [2.5, 0.2, 0.45]].forEach(([x, z, r]) => {
			k.sphere(r, 0xb8683a, { x: -500 + x, y: r, z, s: [1, 1.15, 1] });
			k.cyl(r * 0.35, r * 0.45, r * 0.5, 0xb8683a, { x: -500 + x, y: r * 2.2, z });
		});
		k.point(0xffd8a0, 4, 14, { x: -498, y: 3.5, z: 3 });
		// The treasure cave and the lamp (vignette).
		const T = 500;
		k.ground(80, 0x5a3a2a, { x: T, y: 0, bump: 1, seg: 20 });
		const tr = rng(4);
		for (let i = 0; i < 26; i++) {
			const a = (i / 26) * PI * 2;
			k.ico(8 + tr() * 6, 0x6a4632, { x: T + Math.cos(a) * 26, y: 6, z: Math.sin(a) * 26, s: [1, 2, 1] });
		}
		const gold = { metal: 0.9, rough: 0.3, emissive: 0x4a3000, glow: 0.6 };
		for (let i = 0; i < 9; i++) {
			const x = T + (tr() - 0.5) * 30;
			const z = -8 - tr() * 10;
			k.cone(2 + tr() * 3, 1.5 + tr() * 2, 0xe8b830, { x, y: 0.5, z, seg: 9, ...gold });
		}
		for (let i = 0; i < 70; i++) k.cyl(0.18, 0.18, 0.04, 0xf2c230, { x: T + (tr() - 0.5) * 6, y: 0.4 + tr() * 0.1, z: (tr() - 0.5) * 6, rx: (tr() - 0.5) * 0.8, rz: (tr() - 0.5) * 0.8, ...gold });
		k.cyl(0.9, 1.1, 1.2, 0x7a5a42, { x: T, y: 0.6, z: 0, seg: 7 });
		const lamp = k.group({ x: T, y: 1.35, z: 0, ry: -0.5 });
		const brass = { metal: 0.85, rough: 0.25, emissive: 0x3a2400, glow: 0.8 };
		k.sphere(0.4, 0xd8a838, { parent: lamp, s: [1.5, 0.6, 1], ...brass });
		k.cyl(0.25, 0.3, 0.12, 0xd8a838, { y: -0.25, parent: lamp, ...brass });
		k.cyl(0.18, 0.08, 1, 0xd8a838, { x: 0.85, y: 0.15, rz: -1.15, parent: lamp, ...brass });
		k.torus(0.2, 0.05, 0xd8a838, { x: -0.65, y: 0.05, parent: lamp, ...brass });
		k.cone(0.2, 0.25, 0xd8a838, { y: 0.35, parent: lamp, ...brass });
		k.sphere(0.06, 0xd8a838, { y: 0.5, parent: lamp, ...brass });
		k.spot(0xfff0c0, 80, { x: T + 1, y: 12, z: 3, target: [T, 1, 0], angle: 0.25, distance: 30, cast: true });
		k.point(0xffb050, 6, 40, { x: T - 4, y: 4, z: 6 });
		// The genie pours out of the spout.
		const gen = k.group({ x: T + 2.6, y: 2, z: -0.6, from: 5 });
		const blue = 0x3a7ae8;
		const smoke = [[-1.6, -0.2, 0.5], [-1.1, 0.4, 0.6], [-0.4, 0.9, 0.75], [0.2, 1.6, 0.9], [0.1, 2.5, 1.05]];
		smoke.forEach(([x, y, r]) => k.sphere(r, blue, { x, y, parent: gen, emissive: 0x0a2a6a, glow: 0.5 }));
		k.sphere(1.6, blue, { y: 4, parent: gen, s: [1.3, 1, 0.9] });
		k.box(2.4, 0.4, 1.6, 0xd02a2a, { y: 2.9, parent: gen });
		k.sphere(0.8, blue, { y: 5.7, parent: gen });
		k.cyl(0.12, 0.22, 0.7, 0x111111, { y: 6.7, parent: gen });
		k.capsule(0.12, 1.2, 0x111111, { y: 6.6, z: -0.6, rx: -0.8, parent: gen });
		k.cone(0.22, 0.5, 0x111111, { y: 5.0, z: 0.55, rx: PI - 0.3, parent: gen });
		eyes(k, gen, 0.26, 5.95, 0.65, 0.13, { pupil: 0.5 });
		k.box(0.35, 0.06, 0.08, 0x111111, { x: -0.26, y: 6.2, z: 0.72, rz: 0.2, parent: gen });
		k.box(0.35, 0.06, 0.08, 0x111111, { x: 0.26, y: 6.2, z: 0.72, rz: -0.2, parent: gen });
		k.box(0.5, 0.1, 0.1, 0xffffff, { y: 5.45, z: 0.72, parent: gen });
		[-1, 1].forEach((s) => {
			k.capsule(0.42, 1.8, blue, { x: s * 2.4, y: 5, rz: s * 2.3, parent: gen });
			k.cyl(0.5, 0.5, 0.4, 0xe8b830, { x: s * 3.3, y: 5.9, rz: s * 2.3, parent: gen, ...gold });
		});
		k.point(0x80b0ff, 6, 20, { x: T + 3, y: 6, z: 5 });
		// The tiger-headed cave in the dunes (vignette).
		const D = 500;
		k.ground(300, 0xc8945a, { z: D, x: 0, seg: 50, bump: 0.8, height: (x, z) => Math.min(14, Math.max(0, Math.hypot(x, (z + 15) * 0.8) - 26) * 0.18) * (0.6 + 0.4 * Math.sin(x * 0.07 + z * 0.05)) });
		const cave = k.group({ x: 0, y: -1, z: D - 30, from: 3 });
		const sandy = 0xc8945a;
		k.sphere(14, sandy, { y: 14, parent: cave, s: [1.1, 1, 0.9], seg: 12 });
		[-1, 1].forEach((s) => k.cone(4, 7, sandy, { x: s * 10, y: 26, z: -2, rz: -s * 0.5, parent: cave, seg: 5 }));
		[-1, 1].forEach((s) => {
			k.box(5, 1.2, 1, 0xfff070, { x: s * 5, y: 18, z: 12, rz: s * 0.25, parent: cave, emissive: 0xffd020, glow: 1.5 });
			k.glow(0xffe060, 9, { x: s * 5, y: 18, z: 13.5, parent: cave });
		});
		k.sphere(4.5, sandy, { y: 14, z: 12, parent: cave, s: [1.4, 0.9, 0.8] });
		k.box(14, 7, 6, 0xffa020, { y: 6, z: 10, parent: cave, emissive: 0xff7a10, glow: 1.2 });
		[-1, 1].forEach((s) => k.cone(1, 4, 0xe8d8b0, { x: s * 5.5, y: 7.5, z: 13.5, rx: PI, parent: cave }));
		for (let i = 0; i < 6; i++) k.box(10, 0.6, 1.4, sandy, { y: 0.3 + i * 0.6, z: 20 - i * 1.4, parent: cave });
		k.point(0xff9020, 30, 60, { x: 0, y: 8, z: D - 10, decay: 1 });
		k.particles(800, 0xf0c890, { z: D - 20, box: [80, 30, 60], speed: 2, drift: 4, size: 0.12 });
		const boy = { shirt: 0x6a3a9a, legs: 0xf0ece0, hair: 0x1a1210, skin: 0xc8905a };
		k.person({ x: 1, y: 0, z: D + 4, ry: PI, s: 0.9, colors: boy, from: 3 });
		// The night ride over the palace.
		const ride = carpet({ x: 10, y: 41, z: -30, ry: -1.0, rz: 0.12, from: 4 });
		const al = k.person({ x: 0.5, y: 0.03, z: -0.2, ry: PI / 2 + 0.3, pose: "sit", s: 0.9, colors: boy, sleeves: 0xc8905a, parent: ride });
		al.position.y = -0.7;
		const jas = k.person({ x: -0.5, y: -0.7, z: 0.3, ry: PI / 2 - 0.3, pose: "sit", s: 0.88, colors: { shirt: 0x2ab0a8, legs: 0x2ab0a8, hair: 0x0a0a14, skin: 0xc8905a }, sleeves: 0xc8905a, parent: ride });
		k.box(0.24, 0.9, 0.18, 0x0a0a14, { y: 1.4, z: -0.2, parent: jas });
		k.sphere(0.08, 0xe8b830, { x: 0.2, y: 1.6, parent: jas, metal: 0.8 });
		void al;
		return {
			shots: [
				{ pos: [-496.8, 2.1, 3.6], look: [-500, 1.4, -1.2], fov: 45 },
				{ pos: [-20, 12, 40], look: [60, 3, 52], fov: 50, hide: ["sky"], fog: [0xe8b890, 40, 200] },
				{ pos: [70, 30, 110], look: [0, 12, -60], fov: 45 },
				{ pos: [5, 5, D + 22], look: [0, 12, D - 30], fov: 50, fog: [0x202a5a, 60, 300] },
				{ pos: [13.5, 42.6, -25], look: [8, 43.6, -32], fov: 50, fog: [0x1a2258, 140, 600], hide: ["sky"] },
				{ pos: [T - 3, 3, 12], look: [T + 1.4, 4, -0.6], fov: 50, fog: [0x2a1a10, 10, 70], exposure: 1.15 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the rose
	r72: (k) => {
		k.fog(0x8a88b8, 60, 380);
		k.sky(0x262a62, 0xc0a8d0, { offset: -0.02 });
		k.light({ sky: 0xe0e0ff, ground: 0x6a5a6a, hemi: 1.3, sunColor: 0xffd0b0, sunPos: [-40, 25, 40], sunIntensity: 1.6, shadowSize: 60 });
		k.ground(500, 0xe8eef8, { bump: 1.5, seg: 50, height: (x, z) => Math.max(0, 20 - Math.hypot(x, z + 10) * 0.35) });
		k.particles(2000, 0xffffff, { box: [120, 60, 120], z: 0, speed: 3, size: 0.25, drift: 1.5 });
		// The castle on its crag.
		const cas = k.group({ x: 0, y: 17, z: -10 });
		const stone = 0xb8b0c0;
		const slate = 0x3a4a8a;
		const tower = (x, z, r, h) => {
			k.cyl(r, r * 1.1, h, stone, { x, y: h / 2, z, parent: cas, seg: 10 });
			k.cone(r * 1.35, h * 0.7, slate, { x, y: h + h * 0.35, z, parent: cas, seg: 10 });
			k.box(r * 0.5, r * 0.9, 0.2, 0xffd870, { x, y: h * 0.7, z: z + r * 1.02, parent: cas, emissive: 0xffb040, glow: 1 });
		};
		k.box(22, 14, 14, stone, { y: 7, parent: cas });
		k.cone(15, 8, slate, { y: 18, ry: PI / 4, seg: 4, s: [1, 1, 0.65], parent: cas });
		tower(0, 0, 4, 26);
		tower(-12, 6, 2.8, 20);
		tower(12, 6, 2.8, 20);
		tower(-9, -7, 2.2, 24);
		tower(9, -7, 2.2, 24);
		tower(-16, -2, 1.8, 15);
		tower(16, -2, 1.8, 15);
		for (let i = 0; i < 6; i++) k.box(1.2, 2.4, 0.2, 0xffd870, { x: -8 + i * 3.2, y: 6, z: 7.05, parent: cas, emissive: 0xffb040, glow: 1 });
		k.box(4, 6, 0.3, 0x3a2a2a, { y: 3, z: 7.1, parent: cas });
		trees(k, 70, [-120, 120, -120, 80], { color: 0x2a3a3a, trunk: 0x2a2020, h: 10, seed: 9, avoid: (x, z) => Math.hypot(x, z + 10) < 50 || (Math.abs(x) < 10 && z > 0) });
		// The library: tall shelves and the ladder (vignette).
		const Lx = -500;
		k.box(30, 0.4, 30, 0x6a3a28, { x: Lx, y: -0.2 });
		const br = rng(6);
		const spines = [0x8a2a2a, 0x2a4a7a, 0x3a6a3a, 0x8a6a2a, 0x5a2a5a, 0xa87a4a, 0x2a2a2a];
		[-1, 1].forEach((side) => {
			const zf = side * 3;
			k.box(16, 14, 1, 0x4a2a1a, { x: Lx, y: 7, z: zf + side * 0.6 });
			for (let row = 0; row < 7; row++) {
				k.box(16, 0.18, 1.1, 0x5a3420, { x: Lx, y: row * 2, z: zf });
				let x = Lx - 7.8;
				while (x < Lx + 7.6) {
					const w = 0.18 + br() * 0.16;
					const h = 1.1 + br() * 0.6;
					k.box(w, h, 0.7, spines[Math.floor(br() * spines.length)], { x: x + w / 2, y: row * 2 + 0.1 + h / 2, z: zf + side * 0.1, shadow: false });
					x += w + 0.01;
				}
			}
		});
		k.box(1, 14, 8, 0x4a2a1a, { x: Lx - 8.4, y: 7 });
		const lad = k.group({ x: Lx + 1, y: 0, z: -1.0, rx: -0.13 });
		[-0.4, 0.4].forEach((x) => k.box(0.1, 11, 0.1, 0x8a5a30, { x, y: 5.5, parent: lad }));
		for (let i = 0; i < 18; i++) k.box(0.8, 0.06, 0.08, 0x8a5a30, { y: 0.4 + i * 0.6, parent: lad });
		k.point(0xffe0b0, 8, 30, { x: Lx, y: 8, z: 0 });
		k.particles(200, 0xffe8c0, { x: Lx, box: [12, 12, 4], speed: 0.2, size: 0.04, opacity: 0.6, drift: 0.2 });
		// The enchanted tableware (vignette).
		const Tx = 500;
		k.box(10, 0.2, 6, 0xf0ece0, { x: Tx, y: 0 });
		k.box(10.2, 0.6, 6.2, 0xf0ece0, { x: Tx, y: -0.3 });
		k.box(20, 10, 0.4, 0x5a3a2a, { x: Tx, y: 3, z: -5 });
		const pot = k.group({ x: Tx - 1, y: 0.1, z: 0 });
		const china = 0xf4f4ff;
		k.sphere(0.7, china, { y: 0.6, parent: pot, s: [1, 0.85, 1], rough: 0.3 });
		k.torus(0.62, 0.05, 0x3a5ad0, { y: 0.75, rx: PI / 2, parent: pot });
		k.cyl(0.3, 0.35, 0.12, china, { y: 1.15, parent: pot, rough: 0.3 });
		k.sphere(0.1, 0xe0b030, { y: 1.3, parent: pot, metal: 0.8 });
		k.cyl(0.06, 0.14, 0.8, china, { x: 0.8, y: 0.8, rz: -0.9, parent: pot });
		k.torus(0.28, 0.06, china, { x: -0.72, y: 0.65, parent: pot });
		const cup = k.group({ x: Tx + 0.2, y: 0.1, z: 0.9 });
		k.cyl(0.22, 0.16, 0.36, china, { y: 0.18, parent: cup, rough: 0.3 });
		k.torus(0.1, 0.03, china, { x: 0.24, y: 0.2, parent: cup });
		k.box(0.1, 0.1, 0.12, 0x2a1a14, { x: -0.1, y: 0.33, z: 0.18, parent: cup });
		const cand = k.group({ x: Tx + 1.8, y: 0.1, z: -0.4 });
		const brass = { metal: 0.85, rough: 0.3, emissive: 0x3a2800, glow: 0.6 };
		k.cyl(0.35, 0.45, 0.15, 0xd8a838, { parent: cand, ...brass });
		k.cyl(0.08, 0.1, 1.6, 0xd8a838, { y: 0.8, parent: cand, ...brass });
		[-1, 0, 1].forEach((s) => {
			if (s !== 0) k.torus(0.4, 0.05, 0xd8a838, { x: s * 0.4, y: 1.45, arc: PI, rz: s > 0 ? PI : 0, parent: cand, ...brass });
			const x = s * 0.8;
			const y = s === 0 ? 1.8 : 1.5;
			k.cyl(0.08, 0.08, 0.35, 0xf8f0e0, { x, y: y + 0.2, parent: cand });
			k.cone(0.06, 0.18, 0xffc040, { x, y: y + 0.48, parent: cand, emissive: 0xff9020 });
			k.glow(0xffb040, 0.7, { x, y: y + 0.5, parent: cand });
		});
		const clockFace = k.canvas(128, 128, (g) => {
			g.fillStyle = "#f4ecd8";
			g.beginPath();
			g.arc(64, 64, 60, 0, PI * 2);
			g.fill();
			g.strokeStyle = "#2a1a10";
			g.lineWidth = 4;
			for (let i = 0; i < 12; i++) {
				const a = (i / 12) * PI * 2;
				g.beginPath();
				g.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46);
				g.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54);
				g.stroke();
			}
			g.lineWidth = 6;
			g.beginPath();
			g.moveTo(64, 64);
			g.lineTo(64, 26);
			g.moveTo(64, 64);
			g.lineTo(90, 70);
			g.stroke();
		});
		const clock = k.group({ x: Tx - 2.8, y: 0.1, z: -1 });
		k.box(1, 1.6, 0.6, 0x7a4a24, { y: 0.8, parent: clock });
		k.cone(0.6, 0.5, 0x7a4a24, { y: 1.85, parent: clock, seg: 4, ry: PI / 4 });
		k.box(1.2, 0.15, 0.7, 0xd8a838, { y: 0.08, parent: clock, ...brass });
		k.cyl(0.36, 0.36, 0.05, k.mat(0xffffff, { map: clockFace }), { y: 1.1, z: 0.31, rx: PI / 2, parent: clock, seg: 20 });
		k.torus(0.37, 0.04, 0xd8a838, { y: 1.1, z: 0.33, parent: clock, ...brass });
		k.point(0xffc070, 6, 15, { x: Tx + 1, y: 3, z: 2 });
		k.point(0xffe0c0, 3, 15, { x: Tx - 3, y: 3, z: 3 });
		// The rose under glass in the dark west wing (vignette).
		const R = 500;
		k.box(30, 0.2, 30, 0x2a2030, { z: R, y: 0 });
		k.cyl(0.6, 0.9, 1.6, 0x4a3040, { y: 0.8, z: R, seg: 8 });
		k.cyl(0.9, 0.9, 0.1, 0x6a4a5a, { y: 1.65, z: R, seg: 16 });
		k.cyl(0.55, 0.55, 1.3, 0xd8e8ff, { y: 2.35, z: R, opacity: 0.18, rough: 0.05, seg: 24, shadow: false });
		k.sphere(0.55, 0xd8e8ff, { y: 3, z: R, opacity: 0.18, rough: 0.05, seg: 24, rings: 12, shadow: false });
		k.sphere(0.06, 0xd8e8ff, { y: 3.58, z: R, opacity: 0.5 });
		k.cyl(0.02, 0.02, 0.8, 0x2a6a2a, { y: 2.1, z: R });
		[[0.12, 0], [-0.1, 0.3]].forEach(([x, a]) => k.box(0.12, 0.02, 0.06, 0x2a7a2a, { x, y: 2.1, z: R, rz: a - 0.4 }));
		const rose = k.group({ y: 2.6, z: R });
		for (let i = 0; i < 7; i++) k.sphere(0.1 - i * 0.008, 0xe0204a, { x: Math.cos(i * 2.3) * 0.05, y: i * 0.012, z: Math.sin(i * 2.3) * 0.05, s: [1, 0.8, 1], parent: rose, emissive: 0x900018, glow: 1 });
		k.glow(0xff60a0, 2.2, { y: 2.6, z: R, opacity: 0.8 });
		k.point(0xff5090, 6, 10, { y: 2.8, z: R + 0.5 });
		[[0.25, 0.2], [-0.3, -0.1], [0.05, -0.35]].forEach(([x, z], i) => k.cyl(0.05, 0.05, 0.01, 0xd0183e, { x, y: 1.71, z: R + z, rz: i, s: [1.3, 1, 1], emissive: 0x500010 }));
		k.spot(0xb0a0ff, 25, { x: 3, y: 8, z: R + 4, target: [0, 1.6, R], angle: 0.35, distance: 20 });
		// The village square: a stone fountain, a bakery stall, a few sheep (vignette).
		const Fx = 500;
		const Fz = -500;
		k.box(40, 0.4, 40, 0xa89a88, { x: Fx, y: -0.2, z: Fz });
		[[-8, -9, 0xf0e0c0, 0x8a4a3a], [0, -10, 0xe8d0b0, 0x6a5a8a], [8, -9, 0xf4e8d0, 0x8a5a3a]].forEach(([x, z, wall, roof]) => {
			k.box(7, 7, 5, wall, { x: Fx + x, y: 3.5, z: Fz + z });
			k.cone(5.4, 3.5, roof, { x: Fx + x, y: 8.7, z: Fz + z, ry: PI / 4, seg: 4, s: [1, 1, 0.7] });
			[-1.8, 1.8].forEach((dx) => k.box(1, 1.3, 0.1, 0x8ab0c8, { x: Fx + x + dx, y: 4.5, z: Fz + z + 2.55 }));
			k.box(1.2, 2.2, 0.1, 0x5a3a24, { x: Fx + x, y: 1.1, z: Fz + z + 2.55 });
		});
		k.cyl(2.4, 2.6, 0.8, 0xc8bcaa, { x: Fx, y: 0.4, z: Fz, seg: 12 });
		k.cyl(2.1, 2.1, 0.1, 0x6a9ab8, { x: Fx, y: 0.75, z: Fz, seg: 12, rough: 0.2 });
		k.cyl(0.3, 0.4, 2, 0xc8bcaa, { x: Fx, y: 1.6, z: Fz, seg: 8 });
		k.cyl(1, 0.4, 0.4, 0xc8bcaa, { x: Fx, y: 2.7, z: Fz, seg: 10 });
		k.cyl(0.2, 0.2, 0.6, 0xc8bcaa, { x: Fx, y: 3.2, z: Fz, seg: 8 });
		const sheep = (x, z, ry) => {
			const g = k.group({ x: Fx + x, z: Fz + z, ry });
			k.sphere(0.5, 0xf4f0e8, { y: 0.75, parent: g, s: [0.9, 0.8, 1.3] });
			k.sphere(0.2, 0x2a2420, { y: 0.9, z: 0.65, parent: g, s: [0.9, 1, 1.2] });
			[-0.2, 0.2].forEach((sx) => [-0.35, 0.35].forEach((sz) => k.cyl(0.05, 0.05, 0.5, 0x2a2420, { x: sx, y: 0.25, z: sz, parent: g })));
		};
		sheep(4, 3, -0.6);
		sheep(5.2, 4.5, -1.2);
		k.box(2, 0.1, 1, 0x8a5a32, { x: Fx - 5, y: 1, z: Fz + 2 });
		[-0.9, 0.9].forEach((dx) => k.box(0.1, 1, 0.1, 0x6a4022, { x: Fx - 5 + dx, y: 0.5, z: Fz + 2 }));
		for (let i = 0; i < 6; i++) k.capsule(0.08, 0.5, 0xd8a050, { x: Fx - 5.6 + i * 0.22, y: 1.15, z: Fz + 2, rx: PI / 2, ry: 0.1 * i });
		k.point(0xfff0d8, 10, 40, { x: Fx + 4, y: 8, z: Fz + 8, decay: 1 });
		// The ballroom (vignette).
		const Z = -500;
		const marble = k.canvas(256, 256, (g) => {
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
				g.fillStyle = (x + y) % 2 ? "#e0d0a8" : "#b88c5c";
				g.fillRect(x * 64, y * 64, 64, 64);
			}
		});
		marble.wrapS = marble.wrapT = k.THREE.RepeatWrapping;
		marble.repeat.set(10, 14);
		k.plane(60, 84, k.mat(0xffffff, { map: marble, rough: 0.25, metal: 0.1 }), { y: 0, z: Z, rx: -PI / 2 });
		[-1, 1].forEach((s) => {
			k.box(1, 30, 84, 0xe8dcc0, { x: s * 30, y: 15, z: Z });
			for (let i = 0; i < 6; i++) {
				const z = Z - 35 + i * 14;
				k.cyl(1, 1.2, 22, 0xf0e4c8, { x: s * 26, y: 11, z, seg: 10 });
				k.box(3, 1, 3, 0xd8b048, { x: s * 26, y: 22.5, z, ...brass });
				k.plane(5, 16, 0x3a4aa0, { x: s * 29.4, y: 10, z: z + 7, ry: -s * PI / 2, emissive: 0x2a3a90, glow: 0.8 });
			}
		});
		k.box(60, 30, 1, 0xe8dcc0, { y: 15, z: Z - 42 });
		k.box(60, 1, 84, 0xd8c8a0, { y: 30, z: Z });
		k.cyl(16, 16, 0.2, 0x7aa0d8, { y: 29.4, z: Z, seg: 32, emissive: 0x304878, glow: 0.6 });
		const ch = k.group({ y: 21, z: Z });
		k.cyl(0.08, 0.08, 9, 0xd8b048, { y: 4.5, parent: ch });
		[3.5, 2.5, 1.5].forEach((r, i) => {
			k.torus(r, 0.12, 0xd8b048, { y: -i * 1.2, rx: PI / 2, parent: ch, ...brass });
			for (let j = 0; j < 10 - i * 2; j++) {
				const a = (j / (10 - i * 2)) * PI * 2;
				k.glow(0xfff0c0, 1.2, { x: Math.cos(a) * r, y: -i * 1.2 + 0.3, z: Math.sin(a) * r, parent: ch });
			}
		});
		for (let i = 0; i < 18; i++) k.cone(0.15, 0.6, 0xe8f0ff, { x: Math.cos(i) * 2.8, y: -3.5 - (i % 3) * 0.4, z: Math.sin(i) * 2.8, rx: PI, parent: ch, opacity: 0.7, seg: 4 });
		k.point(0xffe8c0, 30, 70, { y: 18, z: Z, decay: 1 });
		k.point(0xffd8a0, 10, 40, { y: 6, z: Z + 20, decay: 1 });
		// The dancers.
		const belle = k.group({ x: -0.45, y: 0, z: Z + 2, ry: PI / 2 - 0.35, from: 5 });
		const yellow = 0xf2c43a;
		const bp = k.person({ colors: { shirt: yellow, legs: yellow, skin: 0xf0c8a8, hair: 0x6a3a1a }, sleeves: yellow, parent: belle });
		k.cone(1.05, 1.5, yellow, { y: 0.75, parent: belle, seg: 16 });
		k.cyl(0.5, 0.95, 0.15, 0xe8b02a, { y: 0.72, parent: belle, seg: 16 });
		k.torus(0.26, 0.06, yellow, { y: 1.5, rx: PI / 2, parent: belle });
		k.sphere(0.13, 0x6a3a1a, { y: 1.95, z: -0.12, parent: belle });
		k.box(0.2, 0.4, 0.1, 0x6a3a1a, { y: 1.6, z: -0.2, parent: belle });
		bp.userData.limbs.armR.rotation.x = -1.2;
		bp.userData.limbs.armL.rotation.set(-1.0, 0, -0.5);
		const beast = k.group({ x: 0.6, y: 0, z: Z + 2, ry: -PI / 2 + 0.35, s: 1.3, from: 5 });
		const fur = 0x6a4a2a;
		const bb = k.person({ coat: 0x1f3aa0, colors: { shirt: 0x1f3aa0, legs: 0x1a1a22, skin: fur, hair: fur }, sleeves: 0x1f3aa0, parent: beast });
		k.box(0.3, 0.55, 0.05, 0xd8b048, { y: 1.25, z: 0.15, parent: beast, ...brass });
		k.box(0.18, 0.18, 0.06, 0xffffff, { y: 1.5, z: 0.17, parent: beast });
		[-1, 1].forEach((s) => k.box(0.06, 0.9, 0.04, 0xd8b048, { x: s * 0.2, y: 1.1, z: 0.35, ry: s * 0.3, parent: beast }));
		k.ico(0.34, fur, { y: 1.75, z: -0.05, parent: beast, s: [1.2, 1, 1] });
		k.box(0.2, 0.14, 0.18, 0x7a5a3a, { y: 1.7, z: 0.2, parent: beast });
		k.sphere(0.05, 0x111111, { y: 1.75, z: 0.3, parent: beast });
		[-1, 1].forEach((s) => k.cone(0.06, 0.35, 0xe0d8c0, { x: s * 0.24, y: 2.08, z: -0.05, rz: -s * 0.6, parent: beast }));
		eyes(k, beast, 0.1, 1.82, 0.22, 0.04, { white: 0x5aa0e0, pupil: 0.5 });
		bb.userData.limbs.armL.rotation.x = -1.1;
		bb.userData.limbs.armR.rotation.set(-0.8, 0, 0.6);
		return {
			shots: [
				{ pos: [Fx + 7, 2.2, Fz + 10], look: [Fx - 1, 1.6, Fz - 2], fov: 50, fog: [0xc8d8e8, 30, 80] },
				{ pos: [10, 10, 70], look: [0, 30, -10], fov: 45 },
				{ pos: [Lx + 3, 1.2, 1.5], look: [Lx, 9, -2.5], fov: 55, fog: [0x2a1a14, 10, 40], exposure: 1.2 },
				{ pos: [Tx + 0.5, 1.6, 5], look: [Tx - 0.4, 0.8, 0], fov: 45, fog: [0x2a1a14, 10, 40], exposure: 1.15 },
				{ pos: [1.4, 2.8, R + 3], look: [0, 2.5, R], fov: 45, fog: [0x120a1a, 4, 30], exposure: 1.2 },
				{ pos: [0.6, 2.4, Z + 7.8], look: [0.5, 1.7, Z + 2], fov: 45, fog: [0x3a2a18, 60, 200], exposure: 1.15 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- under the sea
	r73: (k) => {
		k.fog(0xf0a888, 100, 520);
		k.sky(0x4a5aa0, 0xffb090, { offset: -0.03 });
		k.light({ sky: 0xfff0e0, ground: 0x305a7a, hemi: 1.35, sunColor: 0xffc090, sunPos: [-60, 25, -40], sunIntensity: 2.2, shadowSize: 60 });
		k.water(800, 0x2a6a9a, { seg: 70, amp: 0.4 });
		k.glow(0xffc080, 100, { x: -120, y: 30, z: -380, tag: "sky" });
		const mermaid = (o) => {
			const g = k.group(o);
			const skin = 0xf4d0b0;
			const tail = 0x2ab070;
			[[0, 0.9, 0, 0.32], [0.05, 0.55, 0.15, 0.3], [0.1, 0.25, 0.4, 0.26], [0.1, 0.05, 0.7, 0.22], [0.08, -0.05, 1.0, 0.17], [0.05, -0.05, 1.25, 0.12]].forEach(([x, y, z, r]) => k.sphere(r, tail, { x, y, z, parent: g, s: [1, 0.9, 1.1] }));
			[-1, 1].forEach((s) => k.cone(0.2, 0.6, 0x3ac080, { x: 0.05 + s * 0.22, y: 0, z: 1.55, rx: PI / 2, rz: s * 0.7, parent: g, s: [1, 1, 0.25] }));
			k.box(0.45, 0.6, 0.28, skin, { y: 1.45, parent: g });
			[-0.12, 0.12].forEach((x) => k.sphere(0.12, 0x8a4ab0, { x, y: 1.55, z: 0.12, parent: g, s: [1, 0.8, 0.6] }));
			k.sphere(0.2, skin, { y: 1.95, parent: g });
			k.ico(0.3, 0xd82a1a, { y: 2.0, z: -0.08, parent: g, s: [1, 1.05, 1], detail: 1 });
			k.ico(0.26, 0xd82a1a, { y: 1.6, z: -0.25, parent: g, s: [1.1, 1.6, 0.7], detail: 1 });
			k.sphere(0.2, skin, { y: 1.93, z: 0.06, parent: g, s: [0.95, 1, 0.9] });
			eyes(k, g, 0.07, 1.97, 0.22, 0.04, { pupil: 0.6, pupilColor: 0x2a6ab0 });
			const arm = (s, rx, rz) => {
				const p = k.group({ x: s * 0.3, y: 1.7, rx, rz, parent: g });
				k.box(0.12, 0.65, 0.12, skin, { y: -0.32, parent: p });
			};
			return { g, arm };
		};
		// Underwater: a reef, kelp and bubbles.
		const U = -400;
		k.ground(220, 0xd8c08a, { y: U, bump: 1.2, seg: 40 });
		const ur = rng(5);
		for (let i = 0; i < 40; i++) k.ico(1 + ur() * 3, [0x6a6a7a, 0x7a6a6a, 0x5a6a6a][i % 3], { x: (ur() - 0.5) * 120, y: U + 0.5, z: (ur() - 0.5) * 120, s: [1, 0.7, 1], ry: ur() * 6 });
		const kelp = [];
		for (let i = 0; i < 50; i++) {
			const x = (ur() - 0.5) * 80;
			const z = (ur() - 0.5) * 80;
			if (Math.hypot(x, z) < 8) continue;
			const h = 5 + ur() * 8;
			kelp.push(k.box(0.5, h, 0.08, 0x3a8a3a, { x, y: U + h / 2, z, ry: ur() * 3 }));
		}
		k.tick((t) => kelp.forEach((m, i) => (m.rotation.z = Math.sin(t + i) * 0.08)));
		const coral = [0xf06a8a, 0xf0a040, 0xb060e0, 0xf04a4a];
		for (let i = 0; i < 30; i++) {
			const x = (ur() - 0.5) * 30;
			const z = -4 - ur() * 14;
			k.cyl(0.1, 0.3, 1 + ur() * 1.5, coral[i % 4], { x, y: U + 0.6, z, rz: (ur() - 0.5) * 0.8, seg: 5 });
			k.sphere(0.5 + ur() * 0.4, coral[(i + 1) % 4], { x: x + 2, y: U + 0.3, z: z + 1, s: [1, 0.6, 1], seg: 6, rings: 4 });
		}
		k.particles(500, 0xe0f8ff, { y: U, box: [40, 25, 40], speed: -1.5, size: 0.12, opacity: 0.6, drift: 0.4 });
		k.point(0xc0f0ff, 12, 80, { x: 4, y: U + 18, z: 8, decay: 1 });
		k.spot(0xe0ffff, 60, { x: 0, y: U + 30, z: 0, target: [0, U, -4], angle: 0.6, distance: 60 });
		// A fork on a rock (on the reef).
		k.ico(1.2, 0x5a6a72, { x: 3, y: U + 0.6, z: 4, s: [1.4, 0.6, 1.2] });
		[[1.5, 2.5], [1.2, 1.8], [4.5, 2.2]].forEach(([x, z]) => k.box(0.4, 4, 0.06, 0x3a8a3a, { x, y: U + 2, z, ry: x }));
		const fork = k.group({ x: 3, y: U + 1.24, z: 4, ry: 0.7, rz: 0.04 });
		const silver = { metal: 0.9, rough: 0.2 };
		k.box(0.08, 0.03, 0.9, 0xd8d8e0, { z: 0.3, parent: fork, ...silver });
		k.box(0.24, 0.03, 0.12, 0xd8d8e0, { z: -0.2, parent: fork, ...silver });
		[-0.09, -0.03, 0.03, 0.09].forEach((x) => k.box(0.03, 0.03, 0.3, 0xd8d8e0, { x, z: -0.4, parent: fork, ...silver }));
		k.point(0xffffff, 3, 6, { x: 4, y: U + 3, z: 5.5 });
		// The red crab and the striped fish.
		const crab = k.group({ x: -2, y: U + 0.6, z: 2, ry: 0.4, from: 4 });
		const crimson = 0xd8281a;
		k.sphere(0.6, crimson, { y: 0.45, parent: crab, s: [1.2, 0.7, 0.9] });
		[-1, 1].forEach((s) => {
			k.cyl(0.05, 0.05, 0.5, crimson, { x: s * 0.2, y: 0.95, z: 0.3, parent: crab });
			k.sphere(0.13, 0xffffff, { x: s * 0.2, y: 1.25, z: 0.32, parent: crab });
			k.sphere(0.06, 0x111111, { x: s * 0.2, y: 1.26, z: 0.43, parent: crab });
			k.box(0.12, 0.12, 0.6, crimson, { x: s * 0.75, y: 0.6, z: 0.35, ry: s * 0.4, parent: crab });
			k.sphere(0.28, crimson, { x: s * 0.95, y: 0.8, z: 0.7, parent: crab, s: [0.8, 1.2, 0.8] });
			k.cone(0.12, 0.35, crimson, { x: s * 0.95, y: 1.1, z: 0.85, rx: 0.4, parent: crab });
			for (let i = 0; i < 3; i++) k.box(0.06, 0.06, 0.5, crimson, { x: s * 0.6, y: 0.2, z: -0.3 + i * 0.25, ry: s * PI / 2, rz: s * 0.5, parent: crab });
		});
		k.box(0.4, 0.06, 0.05, 0x5a1010, { y: 0.55, z: 0.52, parent: crab });
		const fish = k.group({ x: 0.5, y: U + 2.4, z: 2.8, ry: -0.6, from: 4 });
		const stripe = k.canvas(128, 64, (g) => {
			g.fillStyle = "#f8d020";
			g.fillRect(0, 0, 128, 64);
			g.fillStyle = "#2a5ad8";
			[30, 60, 90].forEach((x) => g.fillRect(x, 0, 12, 64));
		});
		k.sphere(0.6, k.mat(0xffffff, { map: stripe }), { parent: fish, s: [0.55, 0.85, 1.2], ry: PI / 2 });
		k.cone(0.45, 0.6, 0x2a5ad8, { z: -0.9, rx: -PI / 2, parent: fish, s: [0.3, 1, 1] });
		k.cone(0.3, 0.5, 0x2a5ad8, { y: 0.6, z: -0.1, parent: fish, s: [0.3, 1, 1] });
		eyes(k, fish, 0.2, 0.15, 0.45, 0.13, { pupil: 0.55 });
		// The grotto of human treasures (vignette).
		const G = 500;
		k.ground(60, 0xb8a888, { x: G, y: U, bump: 0.6, seg: 16 });
		for (let i = 0; i < 12; i++) {
			const a = PI * 1.02 + (i / 11) * PI * 0.96;
			k.ico(5 + (i % 3), 0x3a5a6a, { x: G + Math.cos(a) * 14, y: U + 6 + (i % 2) * 4, z: Math.sin(a) * 10 - 2, s: [1, 2, 1] });
		}
		const eric = k.person({ x: G + 3.2, y: U, z: -5, ry: -0.5, s: 1.2, colors: { shirt: 0xd8dce0, legs: 0xd8dce0, skin: 0xd8dce0, hair: 0xd8dce0, shoes: 0xc8ccd0 }, sleeves: 0xd8dce0, from: 2 });
		eric.userData.limbs.armR.rotation.x = -0.6;
		k.cyl(0.8, 0.9, 0.4, 0xb8bcc0, { x: G + 3.2, y: U + 0.1, z: -5 });
		k.box(14, 9, 1, 0x3a5060, { x: G, y: U + 4.5, z: -8.6 });
		[-4.6, 4.6].forEach((dx) => k.box(0.6, 6, 1.4, 0x4a6070, { x: G + dx, y: U + 3, z: -7.6 }));
		const shelf = (y, z) => k.box(9, 0.25, 1.4, 0x7a6a62, { x: G, y: U + y, z: -7.6 });
		[[1.6, -7], [3.6, -7.4], [5.6, -7.8]].forEach(([y, z]) => shelf(y, z));
		const gr = rng(8);
		const treasures = (y, z) => {
			for (let i = 0; i < 8; i++) {
				const x = G - 3.8 + i * 1.08;
				const kind = Math.floor(gr() * 4);
				const c = [0xd8b040, 0xc8c8d0, 0x8a5a3a, 0x3a8ab0][Math.floor(gr() * 4)];
				const o = { x, y: U + y + 0.12, z: -7.5, metal: 0.6, rough: 0.3, s: 1.6, emissive: c, glow: 0.15 };
				if (kind === 0) {
					k.cyl(0.25, 0.08, 0.4, c, { ...o, y: o.y + 0.55 });
					k.cyl(0.03, 0.03, 0.4, c, { ...o, y: o.y + 0.2 });
				} else if (kind === 1) k.cyl(0.25, 0.25, 0.7, c, { ...o, y: o.y + 0.35 });
				else if (kind === 2) k.box(0.6, 0.15, 0.45, c, { ...o, y: o.y + 0.08, rough: 0.9, metal: 0 });
				else k.sphere(0.3, c, { ...o, y: o.y + 0.3 });
			}
		};
		[[1.6, -7], [3.6, -7.4], [5.6, -7.8]].forEach(([y, z]) => treasures(y, z));
		k.cyl(0.6, 0.8, 0.3, 0x8a6a40, { x: G + 3, y: U + 0.2, z: -2 });
		k.cyl(0.04, 0.04, 2, 0xd8b040, { x: G - 2.5, y: U + 1, z: -3, metal: 0.8 });
		k.torus(0.5, 0.05, 0xd8b040, { x: G - 2.5, y: U + 2, z: -3, metal: 0.8 });
		const shaft = new k.THREE.MeshBasicMaterial({ color: 0xd0f8ff, transparent: true, opacity: 0.15, depthWrite: false, blending: k.THREE.AdditiveBlending });
		k.mesh(new k.THREE.CylinderGeometry(0.6, 2.5, 16, 10, 1, true), shaft, { x: G, y: U + 8, z: -3, shadow: false });
		k.point(0xd0f0ff, 20, 30, { x: G, y: U + 5, z: -3 });
		k.point(0xffe0a0, 8, 15, { x: G + 2, y: U + 3, z: -4 });
		// The sea witch's lair (vignette).
		const W = -500;
		k.ground(60, 0x2a1a30, { x: W, y: U, bump: 0.8, seg: 16 });
		for (let i = 0; i < 14; i++) {
			const a = (i / 14) * PI * 2;
			k.cone(2 + (i % 3), 14, 0x3a2a40, { x: W + Math.cos(a) * 14, y: U + 7, z: Math.sin(a) * 14, seg: 6 });
		}
		const witch = k.group({ x: W, y: U, z: -3, from: 3 });
		const lav = 0xa898d8;
		const ink = 0x1a0a22;
		for (let i = 0; i < 8; i++) {
			const a = PI * 0.1 + (i / 7) * PI * 0.8 + PI;
			const dir = [Math.cos(a), Math.sin(a)];
			for (let j = 0; j < 7; j++) {
				const r = 0.55 - j * 0.06;
				const d = 0.7 + j * 0.55;
				k.sphere(r, ink, { x: -dir[0] * d, y: 0.35 + Math.sin(j * 0.8 + i) * 0.25, z: -dir[1] * d * 0.9, parent: witch, s: [1, 0.7, 1] });
			}
		}
		k.sphere(1.2, ink, { y: 1, parent: witch, s: [1.3, 0.9, 1.2] });
		k.sphere(1.15, lav, { y: 2.6, parent: witch, s: [1.15, 1, 0.9] });
		k.box(2.1, 0.6, 1.5, ink, { y: 2, z: 0.1, parent: witch });
		k.sphere(0.6, lav, { y: 4.1, parent: witch, s: [1, 1.05, 0.95] });
		for (let i = 0; i < 9; i++) k.cone(0.22, 1.1, 0xf4f4f8, { x: (i - 4) * 0.14, y: 4.8, z: -0.15 - Math.abs(i - 4) * 0.05, rz: -(i - 4) * 0.15, parent: witch });
		eyes(k, witch, 0.2, 4.25, 0.48, 0.1, { pupil: 0.5 });
		[-1, 1].forEach((s) => k.box(0.24, 0.05, 0.05, 0x2a6ae0, { x: s * 0.2, y: 4.38, z: 0.55, rz: s * -0.2, parent: witch }));
		k.box(0.3, 0.08, 0.06, 0xd01a2a, { y: 3.85, z: 0.56, parent: witch });
		k.sphere(0.12, 0x111111, { x: 0.25, y: 4.0, z: 0.52, parent: witch });
		[-1, 1].forEach((s) => k.capsule(0.22, 1.4, lav, { x: s * 1.5, y: 3, rz: s * 0.9, parent: witch }));
		k.sphere(0.2, 0xffe080, { y: 2.9, z: 1.15, parent: witch, emissive: 0xffc040, glow: 1.2 });
		[-1, 1].forEach((s) => {
			const eel = k.group({ x: W + s * 4.5, y: U + 2.5, z: -1, ry: -s * 1.2, from: 3 });
			for (let j = 0; j < 6; j++) k.sphere(0.4 - j * 0.04, 0x4a6a5a, { z: -j * 0.55, y: Math.sin(j) * 0.2, parent: eel });
			k.glow(0xfff060, 0.9, { x: 0.22, y: 0.15, z: 0.25, parent: eel });
			k.glow(s > 0 ? 0xfff060 : 0xffffff, 0.9, { x: -0.22, y: 0.15, z: 0.25, parent: eel });
		});
		k.cyl(1, 0.7, 0.8, 0x2a2a30, { x: W, y: U + 0.4, z: 2.5 });
		k.glow(0x60ff80, 3, { x: W, y: U + 1.1, z: 2.5 });
		k.point(0x8a60ff, 14, 30, { x: W + 2, y: U + 6, z: 6 });
		k.point(0x60ff90, 6, 12, { x: W, y: U + 1.5, z: 3 });
		// The prince's ship at sunset, with fireworks.
		const ship = k.group({ x: 40, y: 0, z: -40, ry: 0.4 });
		k.box(5, 3, 18, 0x6a3a1e, { y: 0.8, parent: ship });
		k.cone(2.5, 6, 0x6a3a1e, { y: 0.8, z: 12, rx: PI / 2, parent: ship, seg: 4, s: [1, 1, 0.6] });
		k.box(5, 2, 4, 0x6a3a1e, { y: 3, z: -7, parent: ship });
		k.box(5.1, 0.3, 18.1, 0xe8d090, { y: 2.1, parent: ship });
		[[-4, 15], [3, 18]].forEach(([z, h]) => {
			k.cyl(0.15, 0.2, h, 0x4a2a14, { y: h / 2 + 1, z, parent: ship });
			[0.45, 0.75].forEach((f, i) => k.box(5 - i, h * 0.25, 0.1, 0xf8f4e8, { y: h * f, z, parent: ship }));
		});
		k.box(0.6, 0.3, 0.05, 0xd03030, { y: 19.5, z: 3, parent: ship });
		[[-20, 40, -60, 0xff6080], [10, 46, -70, 0xffe060], [40, 38, -80, 0x80c0ff]].forEach(([x, y, z, c]) => {
			for (let i = 0; i < 16; i++) {
				const a = (i / 16) * PI * 2;
				k.glow(c, 2.4, { x: x + Math.cos(a) * 5, y: y + Math.sin(a) * 5, z, from: 1 });
			}
			k.glow(c, 10, { x, y, z, from: 1, opacity: 0.5 });
		});
		const castle = k.group({ x: -60, z: -160 });
		k.ico(30, 0x6a6a5a, { y: -6, parent: castle, s: [1.4, 0.8, 1] });
		[[-6, 14], [0, 22], [6, 16]].forEach(([x, h]) => {
			k.cyl(2.5, 2.5, h, 0xf0e8e0, { x, y: 14 + h / 2, parent: castle });
			k.cone(3.2, 6, 0x3a5ab0, { x, y: 17 + h, parent: castle });
		});
		// The mermaid on her rock, with the wave breaking behind her.
		k.ico(3, 0x6a6a6a, { x: -14, y: 0.5, z: 22, s: [1.4, 0.8, 1] });
		k.ico(2, 0x5a5a5a, { x: -16.5, y: 0.2, z: 20.5 });
		const m = mermaid({ x: -14, y: 2.4, z: 22.4, ry: 0.3, from: 5 });
		m.arm(-1, -0.4, 0.3);
		m.arm(1, -2.6, -0.2);
		const splash = k.group({ x: -15.8, y: 0, z: 19.8, from: 5 });
		const sr = rng(11);
		for (let i = 0; i < 9; i++) {
			const a = -1 + (i / 8) * 2;
			const h = 5 + sr() * 2.5 - Math.abs(a) * 2;
			for (let j = 0; j < 9; j++) {
				const t = j / 8;
				k.sphere(0.75 - t * 0.4 + sr() * 0.2, 0xf4fbff, { x: Math.sin(a) * t * h * 0.8, y: 0.5 + t * h, z: -0.5 - sr() * 0.8, parent: splash, opacity: 0.5, emissive: 0x506878, seg: 7, rings: 5 });
			}
		}
		return {
			shots: [
				{ pos: [20, 6, 25], look: [30, 14, -50], fov: 50 },
				{ pos: [4.7, U + 1.9, 5.9], look: [2.7, U + 1.4, 3.0], fov: 45, fog: [0x1a6a8a, 3, 22], exposure: 1.0 },
				{ pos: [G - 0.6, U + 3.4, 3], look: [G + 0.4, U + 3.4, -7.6], fov: 50, fog: [0x10506a, 8, 50], exposure: 1.25 },
				{ pos: [W + 1, U + 3.4, 9], look: [W, U + 2.8, -2], fov: 50, fog: [0x1a0a2a, 6, 50], exposure: 1.25 },
				{ pos: [-0.5, U + 1.6, 9], look: [-1, U + 1.4, 2], fov: 45, fog: [0x1a6a8a, 6, 70], exposure: 1.15 },
				{ pos: [-8.5, 3.9, 25], look: [-14.4, 3.6, 21.8], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the apple
	r74: (k) => {
		k.fog(0xd8ecd0, 50, 300);
		k.sky(0x7ab8e8, 0xf0f8e0);
		k.light({ sky: 0xffffff, ground: 0x506a30, hemi: 1.35, sunPos: [30, 50, 40], sunIntensity: 2.2, shadowSize: 40 });
		k.ground(400, 0x6aaa4a, { bump: 0.8, seg: 40 });
		// The cottage in the woods.
		const cot = k.group({ x: 0, z: -10 });
		const stucco = 0xf0e4c8;
		const timber = 0x6a4428;
		k.box(10, 5, 7, stucco, { y: 2.5, parent: cot });
		[-4.9, -1.6, 1.6, 4.9].forEach((x) => k.box(0.3, 5, 0.2, timber, { x, y: 2.5, z: 3.55, parent: cot }));
		k.box(10, 0.3, 0.2, timber, { y: 4.9, z: 3.55, parent: cot });
		k.cone(8.5, 6, 0x8a6a3a, { y: 8, ry: PI / 4, seg: 4, s: [1.05, 1, 0.75], parent: cot });
		k.cone(3, 3, 0x8a6a3a, { x: 2.5, y: 7.2, z: 3.5, seg: 4, ry: PI / 4, rx: 0.2, parent: cot });
		k.box(1.4, 4, 1.4, 0x8a7a6a, { x: -3.5, y: 9, z: -1.5, parent: cot });
		k.box(1.6, 2.6, 0.2, 0x5a3a20, { y: 1.3, z: 3.6, parent: cot });
		[-3.3, 3.3].forEach((x) => {
			k.box(1.4, 1.2, 0.15, 0xf0d890, { x, y: 2.8, z: 3.6, parent: cot, emissive: 0x806020, glow: 0.4 });
			k.box(0.08, 1.2, 0.18, timber, { x, y: 2.8, z: 3.62, parent: cot });
			k.box(1.4, 0.08, 0.18, timber, { x, y: 2.8, z: 3.62, parent: cot });
		});
		for (let i = 0; i < 10; i++) k.sphere(0.5, [0x4a8a3a, 0xe85a8a, 0xf0d040][i % 3], { x: -4.5 + i, y: 0.3, z: 4.4, parent: cot, seg: 6, rings: 4 });
		trees(k, 90, [-80, 80, -90, 40], { h: 13, color: 0x2f6a30, seed: 3, avoid: (x, z) => Math.abs(x) < 16 && z > -24 });
		[[-12, -2], [12, 0], [-9, 12], [11, 14]].forEach(([x, z]) => {
			k.cyl(0.8, 1.2, 9, 0x5a3a24, { x, y: 4.5, z });
			k.ico(5, 0x3a7a30, { x, y: 11, z, detail: 1 });
		});
		k.box(1.4, 0.05, 30, 0xb8a070, { y: 0.05, z: 10 });
		// The seven little ones.
		const hats = [0x8a5a2a, 0xc83a2a, 0x3a6a2a, 0xd88a2a, 0x7a3a9a, 0x2a5a8a, 0x9a8a3a];
		const tunics = [0x8a3a2a, 0x2a6a3a, 0x9a6a2a, 0x6a2a5a, 0x3a5a8a, 0xb84a2a, 0x5a7a3a];
		const dwarf = (i, x, z, ry, from) => {
			const d = k.person({ x, y: 0, z, ry, s: 0.62, colors: { shirt: tunics[i], legs: 0x6a5a3a, skin: 0xf0b898, hair: 0xe8e8e8 }, from });
			d.userData.limbs.body.scale.set(1.25, 1, 1.4);
			const h = d.userData.limbs.head;
			h.scale.setScalar(1.35);
			k.cone(0.23, 0.55, hats[i], { y: 0.28, z: -0.05, rx: -0.4, parent: h });
			if (i !== 4) k.cone(0.17, 0.4, 0xf4f4f4, { y: -0.2, z: 0.12, rx: PI + 0.25, parent: h });
			k.sphere(0.07, 0xf0a090, { y: 0, z: 0.21, parent: h });
			k.box(0.52, 0.08, 0.3, 0x2a1a10, { y: 0.92, parent: d });
			return d;
		};
		for (let i = 0; i < 7; i++) {
			const d = dwarf(i, -1.2 + (i % 2) * 0.3, 26 - i * 1.6, PI, 4);
			const l = d.userData.limbs;
			k.tick((t) => {
				l.legL.rotation.x = Math.sin(t * 6 + i) * 0.5;
				l.legR.rotation.x = -Math.sin(t * 6 + i) * 0.5;
				l.armL.rotation.x = -Math.sin(t * 6 + i) * 0.4;
			});
			l.armR.rotation.x = -2.6;
			const pick = k.group({ x: 0.22, y: 2.3, z: -0.2, rx: 0.5, parent: d });
			k.cyl(0.04, 0.04, 1.3, 0x7a5a3a, { parent: pick });
			k.box(0.9, 0.08, 0.08, 0x8a8a90, { y: 0.6, rz: 0.15, parent: pick, metal: 0.7 });
		}
		// The princess, with the rest of the seven around her.
		const sw = k.group({ x: 0, y: 0, z: 3, from: 5 });
		const swp = k.person({ colors: { shirt: 0x2a4ab0, legs: 0xf8e070, skin: 0xfae0d0, hair: 0x0a0a10 }, sleeves: 0xfae0d0, parent: sw });
		k.cone(0.75, 1.3, 0xf8e070, { y: 0.65, parent: sw, seg: 14 });
		[-1, 1].forEach((s) => {
			k.sphere(0.17, 0x2a4ab0, { x: s * 0.36, y: 1.48, parent: sw, s: [1, 0.9, 1] });
			k.box(0.06, 0.12, 0.13, 0xd02a2a, { x: s * 0.36, y: 1.48, z: 0.1, parent: sw });
		});
		k.cone(0.32, 0.4, 0xf8f8f8, { y: 1.58, z: -0.12, rx: -0.4, parent: sw, seg: 12, open: true, side: k.THREE.DoubleSide });
		k.box(0.3, 0.1, 0.1, 0xd02a2a, { y: 1.97, z: 0, parent: sw });
		k.box(0.42, 0.22, 0.32, 0x0a0a10, { y: 1.72, z: -0.06, parent: sw });
		k.sphere(0.09, 0xd8201a, { x: 0.2, y: 1.2, z: 0.4, parent: sw });
		swp.userData.limbs.armR.rotation.x = -1.1;
		const ring = [[-2.2, 2.4], [-1.6, 4.2], [2.2, 2.6], [1.7, 4.4], [-3, 3.6], [3, 3.6], [0.9, 5.2]];
		ring.forEach(([x, z], i) => dwarf(i, x, z, Math.atan2(-x, 0.8), 5));
		[[-0.6, 2.2], [0.7, 2.0]].forEach(([x, y]) => {
			const b = k.group({ x, y, z: 3.3, from: 5 });
			k.sphere(0.1, 0x5aa0f0, { parent: b, s: [1, 0.9, 1.3] });
			k.box(0.3, 0.02, 0.1, 0x5aa0f0, { parent: b, rz: 0.4 });
		});
		// A wishing well in a castle courtyard (vignette).
		const A = -500;
		k.box(40, 0.4, 40, 0xb8b0a0, { x: A, y: -0.2 });
		k.box(30, 9, 1, 0xc8c0b0, { x: A, y: 4.5, z: -8 });
		for (let i = 0; i < 4; i++) k.box(8 - i * 1.4, 0.4, 1.2, 0xa8a090, { x: A - 6, y: 0.2 + i * 0.4, z: -6.8 + i * 0.01 - i * 0.3 });
		k.box(1.2, 2, 0.3, 0x5a6a8a, { x: A + 6, y: 5, z: -7.45 });
		k.cyl(1.2, 1.3, 1.1, 0x9a948a, { x: A, y: 0.55, z: 0, seg: 12 });
		k.cyl(1.0, 1.0, 0.05, 0x1a2a3a, { x: A, y: 1.08, z: 0, seg: 12 });
		[-1.1, 1.1].forEach((x) => k.box(0.15, 2.4, 0.15, 0x6a4428, { x: A + x, y: 2.2, z: 0 }));
		k.cone(1.8, 1.1, 0x8a5a3a, { x: A, y: 3.9, z: 0, seg: 4, ry: PI / 4, s: [1, 1, 0.7] });
		k.cyl(0.08, 0.08, 2.3, 0x6a4428, { x: A, y: 3.0, z: 0, rz: PI / 2 });
		k.cyl(0.006, 0.006, 1.2, 0xc8b890, { x: A + 0.3, y: 2.4, z: 0 });
		const bucket = k.cyl(0.22, 0.18, 0.35, 0x7a5a3a, { x: A + 0.3, y: 1.65, z: 0 });
		void bucket;
		[[0.9, 1.15, 0.4, 0.4], [-0.6, 1.15, 0.85, -0.9]].forEach(([x, y, z, ry]) => {
			const d = k.group({ x: A + x, y, z, ry });
			k.sphere(0.12, 0xf8f8f8, { parent: d, s: [0.8, 0.8, 1.2] });
			k.sphere(0.07, 0xf8f8f8, { y: 0.1, z: 0.1, parent: d });
			k.cone(0.02, 0.06, 0xe0a040, { y: 0.1, z: 0.18, rx: PI / 2, parent: d });
		});
		k.point(0xfff0d8, 6, 20, { x: A + 3, y: 5, z: 4 });
		// Seven little beds (vignette).
		const Bx = 500;
		k.box(20, 0.2, 10, 0x8a6a48, { x: Bx });
		k.box(20, 6, 0.3, 0xe0d0b0, { x: Bx, y: 3, z: -3 });
		const quilts = [0xc84a3a, 0x3a7ab0, 0x6a9a3a, 0xd8a83a, 0x9a5ab0, 0x3a9a8a, 0xd87a4a];
		for (let i = 0; i < 7; i++) {
			const x = Bx - 6 + i * 2;
			k.box(1.2, 0.5, 2.4, 0x7a5030, { x, y: 0.35, z: -1.6 });
			k.box(1.15, 0.12, 1.9, quilts[i], { x, y: 0.66, z: -1.4 });
			k.box(0.9, 0.15, 0.4, 0xf8f8f0, { x, y: 0.68, z: -2.5 });
			k.box(1.2, 1.4 + (i % 2) * 0.3, 0.12, 0x7a5030, { x, y: 0.8, z: -2.85 });
			k.cone(0.15, 0.3, 0x7a5030, { x, y: 1.6 + (i % 2) * 0.3, z: -2.85, seg: 4 });
		}
		k.point(0xffe0b0, 8, 20, { x: Bx, y: 4, z: 3 });
		// The mine and its jewels (vignette).
		const Mz = 500;
		k.ground(60, 0x4a3a30, { z: Mz, bump: 0.6, seg: 16 });
		const mr = rng(3);
		for (let i = 0; i < 20; i++) {
			const a = PI * 0.05 + (i / 19) * PI * 0.9;
			k.ico(4 + mr() * 2, 0x5a4a40, { x: Math.cos(a) * 10, y: 3 + mr() * 3, z: Mz - Math.sin(a) * 8 });
		}
		const gems = [0xff3a5a, 0x3affa0, 0x4a8aff, 0xffe040, 0xd060ff];
		for (let i = 0; i < 40; i++) {
			const a = PI * 0.1 + mr() * PI * 0.8;
			const c = gems[i % 5];
			const x = Math.cos(a) * (6 + mr() * 1.5);
			const z = Mz - Math.sin(a) * 5;
			const y = 0.5 + mr() * 5;
			k.ico(0.25 + mr() * 0.2, c, { x, y, z, emissive: c, glow: 0.7, rough: 0.2 });
		}
		const cart = k.group({ x: 1, z: Mz - 1 });
		k.box(1.8, 1, 1.2, 0x5a4a3a, { y: 0.8, parent: cart });
		for (let i = 0; i < 8; i++) k.ico(0.25, gems[i % 5], { x: -0.6 + (i % 4) * 0.4, y: 1.35, z: -0.3 + Math.floor(i / 4) * 0.5, parent: cart, emissive: gems[i % 5], glow: 0.7 });
		[-0.6, 0.6].forEach((x) => [-0.5, 0.5].forEach((z) => k.cyl(0.25, 0.25, 0.1, 0x2a2a2a, { x, y: 0.25, z: z * 1.2, rx: PI / 2, parent: cart })));
		[-0.5, 0.5].forEach((x) => k.box(0.1, 0.05, 20, 0x6a6a6a, { x: 1 + x, y: 0.05, z: Mz + 5 }));
		const pickaxe = k.group({ x: -1.5, y: 0.2, z: Mz + 1, rz: PI / 2, ry: 0.4 });
		k.cyl(0.04, 0.04, 1.4, 0x7a5a3a, { parent: pickaxe });
		k.box(0.9, 0.08, 0.08, 0x8a8a90, { y: 0.65, parent: pickaxe, metal: 0.7 });
		k.point(0xffd890, 10, 20, { x: 0, y: 4, z: Mz + 3 });
		k.glow(0xffc060, 1, { x: -3, y: 3, z: Mz - 2 });
		// The magic mirror in the queen's chamber (vignette).
		const Q = -500;
		k.box(20, 0.2, 20, 0x2a2a30, { z: Q });
		k.box(20, 12, 0.4, 0x4a4a58, { y: 6, z: Q - 3 });
		const mirror = k.group({ y: 4, z: Q - 2.75 });
		k.torus(1.6, 0.25, 0xd8b040, { parent: mirror, s: [0.8, 1.15, 1], metal: 0.8, rough: 0.3 });
		k.cyl(1.55, 1.55, 0.05, 0x0a1a12, { rx: PI / 2, parent: mirror, s: [0.8, 1, 1.15], seg: 24 });
		const mask = k.group({ z: 0.1, parent: mirror });
		k.sphere(0.6, 0x60ff90, { parent: mask, s: [0.85, 1.1, 0.25], emissive: 0x20a050, glow: 1.2 });
		[-0.2, 0.2].forEach((x) => k.sphere(0.09, 0x002a10, { x, y: 0.15, z: 0.14, parent: mask }));
		k.box(0.3, 0.06, 0.05, 0x002a10, { y: -0.3, z: 0.14, parent: mask });
		k.glow(0x60ff90, 3, { z: 0.2, parent: mirror, opacity: 0.6 });
		k.point(0x60ff90, 4, 10, { y: 4, z: Q - 1 });
		const queen = k.person({ x: 1.8, y: 0, z: Q, ry: -2.6, s: 1.1, dress: 0x2a1a4a, coat: 0x1a1030, colors: { shirt: 0x5a2a8a, legs: 0x1a1030, skin: 0xf4e0d8, hair: 0x111111 }, from: 3 });
		k.cone(0.45, 0.7, 0x111111, { y: 1.6, z: -0.08, parent: queen, open: true, side: k.THREE.DoubleSide });
		k.cyl(0.18, 0.2, 0.15, 0xd8b040, { y: 2.02, parent: queen, metal: 0.8 });
		k.point(0xd0c0ff, 6, 14, { x: 3, y: 5, z: Q + 4 });
		return {
			shots: [
				{ pos: [A + 3.4, 1.9, 5], look: [A - 0.6, 1.6, -1.5], fov: 50, fog: [0xd8ecd0, 20, 60] },
				{ pos: [0.5, 2.2, Mz + 7], look: [0, 2, Mz - 3], fov: 55, fog: [0x1a1410, 8, 40], exposure: 1.2 },
				{ pos: [Bx + 3, 2.4, 4], look: [Bx - 1, 0.6, -1.8], fov: 50, fog: [0x2a1a10, 10, 40] },
				{ pos: [-2.5, 2.4, Q + 4.5], look: [0.4, 3, Q - 2], fov: 50, fog: [0x0a0a14, 6, 40], exposure: 1.2 },
				{ pos: [7, 3, 28], look: [-1, 1.5, 14], fov: 50 },
				{ pos: [0.3, 1.9, 7.6], look: [0, 1.4, 3], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the puppet
	r75: (k) => {
		k.fog(0x2a1a14, 30, 120);
		k.sky(0x101030, 0x3a2a40);
		k.light({ sky: 0xffe8d0, ground: 0x5a3a20, hemi: 1.4, sunColor: 0xffd8b0, sunPos: [10, 30, 20], sunIntensity: 1.3, shadowSize: 20 });
		// Geppetto's workshop.
		k.box(24, 0.2, 20, 0x8a5a38, { y: -0.1 });
		k.box(24, 10, 0.4, 0xc89a68, { y: 5, z: -6 });
		k.box(0.4, 10, 20, 0xb88a58, { x: -10, y: 5 });
		const wood = 0x9a6a40;
		k.box(7, 0.25, 3, wood, { x: 0, y: 2.2, z: -2 });
		[-3.2, 3.2].forEach((x) => [-3.2, -0.8].forEach((z) => k.box(0.25, 2.1, 0.25, 0x6a4428, { x, y: 1.05, z })));
		k.point(0xffc070, 14, 30, { x: 2, y: 6, z: 3, decay: 1 });
		k.point(0xffd8a0, 6, 20, { x: -6, y: 5, z: 4 });
		const cr = rng(4);
		// Wood shavings and chisels on the bench.
		for (let i = 0; i < 30; i++) k.torus(0.08 + cr() * 0.05, 0.02, 0xe8c890, { x: -2 + cr() * 2, y: 2.36, z: -1.4 + cr() * 0.8, rx: PI / 2 + (cr() - 0.5), rz: cr() * 6, arc: PI * 1.4, seg: 10, rseg: 4 });
		[0, 1, 2].forEach((i) => {
			const c = k.group({ x: -1.4 + i * 0.35, y: 2.37, z: -1.1, ry: 0.3 + i * 0.1 });
			k.cyl(0.04, 0.05, 0.5, 0x6a3a1a, { rx: PI / 2, z: -0.25, parent: c });
			k.box(0.06 + i * 0.03, 0.02, 0.35, 0xb0b0b8, { z: 0.15, parent: c, metal: 0.8, rough: 0.3 });
		});
		k.box(0.5, 0.5, 0.8, 0xd8a870, { x: -0.6, y: 2.58, z: -1.8 });
		// The wall of cuckoo clocks.
		for (let i = 0; i < 12; i++) {
			const x = [-8.6, -7.0, -0.6, 1.0, 2.6, 4.2][i % 6];
			const y = 5 + Math.floor(i / 6) * 2.6;
			const c = k.group({ x, y, z: -5.6 });
			const tone = [0x6a3a1a, 0x8a5a2a, 0x5a2a1a][i % 3];
			k.box(1.2, 1.3, 0.5, tone, { parent: c });
			k.cone(0.95, 0.6, tone, { y: 0.95, seg: 4, ry: PI / 4, s: [1, 1, 0.45], parent: c });
			k.cyl(0.35, 0.35, 0.05, 0xf4ecd8, { z: 0.27, rx: PI / 2, parent: c, seg: 16 });
			k.box(0.04, 0.25, 0.03, 0x111111, { y: 0.1, z: 0.3, parent: c });
			k.box(0.18, 0.04, 0.03, 0x111111, { x: 0.08, z: 0.3, parent: c });
			k.box(0.25, 0.25, 0.05, 0x2a1a10, { y: 0.55, z: 0.26, parent: c });
			const pend = k.group({ y: -0.65, z: 0.1, parent: c });
			k.box(0.03, 0.9, 0.03, 0xd8b040, { y: -0.45, parent: pend });
			k.cyl(0.14, 0.14, 0.04, 0xd8b040, { y: -0.95, rx: PI / 2, parent: pend, metal: 0.8 });
			k.tick((t) => (pend.rotation.z = Math.sin(t * 3 + i) * 0.3));
		}
		// The goldfish bowl and the kitten.
		k.box(2.6, 0.2, 1.6, wood, { x: 6, y: 2.2, z: -4.8 });
		k.box(0.2, 2.2, 0.2, 0x6a4428, { x: 6, y: 1.1, z: -4.8 });
		k.sphere(0.75, 0xd0f0ff, { x: 5.5, y: 3.0, z: -4.6, opacity: 0.25, rough: 0.05, seg: 20, shadow: false });
		k.sphere(0.68, 0x6ab0e0, { x: 5.5, y: 2.9, z: -4.6, opacity: 0.3, seg: 20, shadow: false });
		const cleo = k.group({ x: 5.5, y: 3.0, z: -4.5, ry: 0.4, from: 2 });
		k.sphere(0.18, 0xff8a40, { parent: cleo, s: [0.6, 0.8, 1.1], emissive: 0x401000 });
		k.cone(0.15, 0.3, 0xffffff, { z: -0.28, rx: -PI / 2, parent: cleo, s: [0.4, 1, 1] });
		k.sphere(0.04, 0x111111, { x: 0.08, y: 0.05, z: 0.12, parent: cleo });
		const kit = k.group({ x: 6.6, y: 2.3, z: -4.4, ry: -0.7, from: 2 });
		k.sphere(0.3, 0x111111, { y: 0.28, parent: kit, s: [1, 1, 1.2] });
		k.sphere(0.2, 0xffffff, { y: 0.25, z: 0.18, parent: kit, s: [1, 1.1, 0.8] });
		k.sphere(0.24, 0x111111, { y: 0.65, z: 0.2, parent: kit });
		k.sphere(0.13, 0xffffff, { y: 0.58, z: 0.38, parent: kit, s: [1.2, 0.8, 0.6] });
		[-1, 1].forEach((s) => k.cone(0.09, 0.2, 0x111111, { x: s * 0.13, y: 0.88, z: 0.2, parent: kit, seg: 4 }));
		eyes(k, kit, 0.09, 0.7, 0.4, 0.05, { pupil: 0.5, white: 0x9ae060 });
		k.capsule(0.05, 0.5, 0x111111, { y: 0.3, z: -0.4, rx: -0.9, parent: kit });
		// The window and the wishing star, with the cricket on the sill.
		k.box(3.4, 3.4, 0.1, 0x14183a, { x: -4, y: 6.5, z: -5.75 });
		k.box(3.6, 0.2, 0.6, 0x6a4428, { x: -4, y: 4.7, z: -5.5 });
		k.box(0.12, 3.4, 0.12, 0x6a4428, { x: -4, y: 6.5, z: -5.7 });
		k.box(3.4, 0.12, 0.12, 0x6a4428, { x: -4, y: 6.5, z: -5.7 });
		k.glow(0xfff8e0, 1.4, { x: -3.1, y: 6.9, z: -5.65, from: 4 });
		k.glow(0xc0d8ff, 0.5, { x: -4.8, y: 7.6, z: -5.65 });
		k.glow(0xc0d8ff, 0.3, { x: -3.6, y: 5.6, z: -5.65 });
		const jim = k.group({ x: -3.6, y: 4.8, z: -5.4, ry: 0.4, from: 4 });
		k.capsule(0.06, 0.1, 0x1a1a22, { y: 0.16, parent: jim });
		k.sphere(0.07, 0x7ac05a, { y: 0.32, parent: jim });
		k.cyl(0.05, 0.05, 0.12, 0x2a3a8a, { y: 0.44, parent: jim });
		k.cyl(0.09, 0.09, 0.01, 0x2a3a8a, { y: 0.38, parent: jim });
		[-0.03, 0.03].forEach((x) => k.cyl(0.012, 0.012, 0.12, 0xc8a878, { x, y: 0.06, parent: jim }));
		k.cone(0.12, 0.08, 0xd02a2a, { x: 0.14, y: 0.42, parent: jim, seg: 8 });
		k.cyl(0.008, 0.008, 0.3, 0x2a1a10, { x: 0.14, y: 0.27, parent: jim });
		eyes(k, jim, 0.025, 0.34, 0.05, 0.02, { pupil: 0.5 });
		// The puppet on the bench.
		const pin = k.group({ x: 1.6, y: 2.33, z: -2, ry: -0.35, from: 5 });
		const pine = 0xe8b888;
		[-0.1, 0.1].forEach((x) => {
			k.cyl(0.05, 0.05, 0.55, pine, { x, y: 0.4, parent: pin });
			k.box(0.14, 0.1, 0.24, 0x5a3a20, { x, y: 0.05, z: 0.04, parent: pin });
		});
		k.box(0.36, 0.3, 0.22, 0xd02a2a, { y: 0.78, parent: pin });
		[-0.1, 0.1].forEach((x) => k.box(0.05, 0.36, 0.23, 0x2a3a9a, { x, y: 1.0, parent: pin }));
		k.box(0.34, 0.3, 0.2, 0xf2d070, { y: 1.08, parent: pin });
		k.box(0.14, 0.06, 0.04, 0x2a4ac0, { y: 1.22, z: 0.12, parent: pin });
		[-1, 1].forEach((s) => {
			k.cyl(0.04, 0.04, 0.45, pine, { x: s * 0.24, y: 1.0, rz: s * 0.3, parent: pin });
			k.sphere(0.07, 0xffffff, { x: s * 0.31, y: 0.78, parent: pin });
		});
		k.sphere(0.2, pine, { y: 1.42, parent: pin });
		k.cone(0.035, 0.55, pine, { y: 1.42, z: 0.45, rx: PI / 2, parent: pin });
		k.box(0.1, 0.02, 0.06, 0x4a9a3a, { x: 0.03, y: 1.44, z: 0.68, rz: 0.4, parent: pin });
		eyes(k, pin, 0.08, 1.48, 0.17, 0.05, { pupil: 0.55 });
		k.sphere(0.04, 0xff8070, { x: 0.12, y: 1.36, z: 0.16, parent: pin });
		k.cyl(0.13, 0.22, 0.2, 0xf2c030, { y: 1.65, z: -0.02, rx: -0.15, parent: pin, seg: 10 });
		k.cyl(0.26, 0.26, 0.03, 0xf2c030, { y: 1.57, rx: -0.15, parent: pin, seg: 14 });
		k.box(0.03, 0.3, 0.06, 0xd02a2a, { x: 0.1, y: 1.8, z: -0.12, rx: -0.6, parent: pin });
		for (let i = 0; i < 4; i++) k.cyl(0.004, 0.004, 4, 0xe8e8e8, { x: [-0.3, 0.3, -0.1, 0.1][i], y: 3.2 + (i < 2 ? 0 : -0.3), parent: pin });
		k.box(0.8, 0.06, 0.06, 0x6a4428, { y: 5.2, parent: pin });
		k.spot(0xfff0d0, 30, { x: 2.5, y: 7, z: 3, target: [1.6, 2.6, -2], angle: 0.3, distance: 20 });
		// The whale (vignette).
		const S = 500;
		k.water(300, 0x2a3a50, { x: S, seg: 40, amp: 0.8 });
		const whale = k.group({ x: S, y: -2, z: -30, ry: 0.5, from: 3 });
		const slate = 0x2a2a3a;
		k.sphere(12, slate, { parent: whale, s: [1, 0.85, 2.4], seg: 18 });
		k.box(16, 3, 14, 0xd8d0c8, { y: -7.5, z: 15, parent: whale, rx: 0.15 });
		k.box(18, 7, 10, 0x5a1a1a, { y: -2, z: 22, rx: -0.15, parent: whale });
		for (let i = 0; i < 9; i++) k.cone(0.6, 2, 0xf4f4f0, { x: -7 + i * 1.75, y: 1.2, z: 26.5, rx: PI, parent: whale, seg: 4 });
		[-1, 1].forEach((s) => {
			k.sphere(1.3, 0xffffff, { x: s * 9, y: 5, z: 16, parent: whale });
			k.sphere(0.6, 0x111111, { x: s * 9.3, y: 5.2, z: 17.1, parent: whale });
			k.box(4, 0.6, 1, slate, { x: s * 9, y: 7, z: 16.5, rz: s * 0.4, parent: whale });
		});
		k.cone(6, 10, slate, { z: -30, rx: -PI / 2, parent: whale, s: [1.3, 1, 0.3] });
		const raft = k.group({ x: S - 6, y: 0.2, z: 10, ry: 0.4, from: 3 });
		for (let i = 0; i < 6; i++) k.cyl(0.25, 0.25, 4, 0x8a6a40, { x: -1.25 + i * 0.5, rx: PI / 2, parent: raft });
		k.cyl(0.08, 0.08, 4, 0x6a4a2a, { y: 2, parent: raft });
		k.box(2, 2.4, 0.05, 0xe8e0c8, { y: 2.4, z: 0.1, parent: raft });
		k.particles(1500, 0xc0d0e0, { x: S, box: [80, 40, 80], speed: 20, size: 0.06, opacity: 0.5 });
		k.point(0xd0e0ff, 10, 120, { x: S + 10, y: 40, z: 40, decay: 0.5 });
		return {
			shots: [
				{ pos: [-0.8, 3.1, -0.2], look: [-1.3, 2.35, -1.3], fov: 40 },
				{ pos: [1.2, 5.2, 0.5], look: [0.6, 6.2, -5.6], fov: 55 },
				{ pos: [5.2, 3.6, -1.4], look: [6, 3, -4.6], fov: 45 },
				{ pos: [S - 12, 5, 26], look: [S, 4, -8], fov: 50, fog: [0x3a4a60, 30, 160], exposure: 1.4 },
				{ pos: [-3.2, 5.1, -2.8], look: [-3.6, 5.8, -5.6], fov: 45 },
				{ pos: [2.3, 3.6, 0.6], look: [1.6, 3.2, -2], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the monster from the sea (black & white)
	r76: (k) => {
		k.fog(0x50545c, 60, 340);
		k.sky(0x3e424a, 0x8a8e96);
		k.light({ sky: 0xe0e4f0, ground: 0x404040, hemi: 1.5, sunColor: 0xf0f0ff, sunPos: [-40, 60, 50], sunIntensity: 1.8, shadowSize: 80, sunTarget: [0, 10, -20] });
		const BW = "grayscale(1) contrast(1.25) brightness(1.08)";
		// The beast: a reusable builder, facing +z.
		const skin = 0x4a4a4a;
		const kaiju = (o) => {
			const g = k.group(o);
			[-1, 1].forEach((s) => {
				k.cyl(1.0, 1.3, 4.4, skin, { x: s * 1.4, y: 2.2, parent: g, seg: 9 });
				k.box(1.7, 0.7, 2.4, skin, { x: s * 1.4, y: 0.35, z: 0.4, parent: g });
				[-0.5, 0, 0.5].forEach((dx) => k.cone(0.2, 0.6, 0xb0b0b0, { x: s * 1.4 + dx, y: 0.3, z: 1.7, rx: PI / 2, parent: g, seg: 4 }));
			});
			k.capsule(2.3, 3.6, skin, { y: 6.4, z: -0.4, rx: -0.22, parent: g, seg: 12 });
			k.capsule(1.6, 2.4, 0x5a5a5a, { y: 6, z: 0.8, rx: -0.22, parent: g, seg: 10 });
			k.capsule(1.1, 1.6, skin, { y: 9.8, z: 0.6, rx: 0.4, parent: g });
			const head = k.group({ y: 11, z: 1.6, rx: -0.15, parent: g });
			k.box(1.6, 1.3, 2.2, skin, { parent: head });
			k.box(1.3, 0.8, 1.2, skin, { y: 0.1, z: 1.4, parent: head });
			k.box(1.3, 0.35, 1.9, skin, { y: -0.8, z: 0.9, rx: 0.4, parent: head });
			for (let i = 0; i < 4; i++) [-0.5, 0.5].forEach((x) => k.cone(0.08, 0.25, 0xe0e0e0, { x: x * (1 - i * 0.15), y: -0.4, z: 1.9 - i * 0.3, rx: PI, parent: head, seg: 4 }));
			[-0.62, 0.62].forEach((x) => k.sphere(0.13, 0xe8e8e8, { x, y: 0.35, z: 0.9, parent: head }));
			[-1, 1].forEach((s) => k.capsule(0.42, 1.8, skin, { x: s * 2.2, y: 7.6, z: 1.4, rx: -1.0, rz: s * 0.2, parent: g }));
			const spine = [];
			for (let i = 0; i < 16; i++) {
				const t = i / 15;
				spine.push([Math.sin(t * 2.5) * t * 2.5, 9.8 - t * 8 + t * t * 1.5, 0.2 - t * 18, 1 - t * 0.85]);
			}
			spine.slice(5).forEach(([x, y, z, r], i) => k.sphere(1.9 * r + 0.25, skin, { x, y: y - 1.2, z, parent: g, seg: 10 }));
			spine.forEach(([x, y, z, r], i) => {
				const size = (i < 4 ? 1.4 + i * 0.5 : 3.2 - i * 0.17) * 1.1;
				const yy = i < 5 ? y + 0.6 + (i > 1 ? 0.6 : 0) : y + 1.0 * r - 0.6;
				const zz = i < 5 ? z - 1.4 - i * 0.2 : z;
				k.cone(size * 0.45, size, 0x9a9a9a, { x, y: yy + size * 0.35, z: zz, rx: -0.35, parent: g, seg: 4, s: [0.18, 1, 1] });
				if (i > 1 && i < 12) [-1, 1].forEach((s) => k.cone(size * 0.32, size * 0.7, 0x8a8a8a, { x: x + s * 0.55, y: yy + size * 0.2, z: zz + 0.2, rx: -0.35, rz: -s * 0.35, parent: g, seg: 4, s: [0.18, 1, 1] }));
			});
			return { g, head };
		};
		// Tokyo by night.
		k.box(600, 1, 600, 0x3a3a3c, { y: -0.5 });
		const hole = (x, z) => Math.hypot(x, z + 20) < 36 || (x > 20 && x < 70 && z > 10 && z < 50) || (Math.abs(x + 30) < 14 && z > 6 && z < 40);
		city(k, 260, [-200, 200, -220, 120], { h: 22, w: 9, colors: [0x7a7a7a, 0x8a8a88, 0x6a6a6a, 0x9a9a98], windows: 0xfff0c0, seed: 17, avoid: hole });
		for (let i = 0; i < 10; i++) {
			const x = 22 + (i % 5) * 9;
			const z = 14 + Math.floor(i / 5) * 30;
			const h = 8 + (i * 7) % 10;
			k.box(7, h, 7, 0x7a7a78, { x, y: h / 2, z });
		}
		[[-30, 20, 34], [-36, 32, 28], [-24, 34, 30]].forEach(([x, z, h]) => k.box(8, h, 8, 0x8a8a88, { x, y: h / 2, z }));
		// The clock tower on the corner.
		const tower = k.group({ x: 24, z: -24 });
		k.box(14, 14, 10, 0xa8a8a4, { y: 7, parent: tower });
		k.cyl(5, 5, 16, 0xb0b0ac, { x: -6, y: 8, z: 4, parent: tower, seg: 16 });
		k.cyl(3, 3, 6, 0xb8b8b4, { x: -6, y: 19, z: 4, parent: tower, seg: 16 });
		const face = k.canvas(128, 128, (g) => {
			g.fillStyle = "#f0f0e8";
			g.beginPath();
			g.arc(64, 64, 60, 0, PI * 2);
			g.fill();
			g.strokeStyle = "#222";
			g.lineWidth = 6;
			g.beginPath();
			g.moveTo(64, 64);
			g.lineTo(64, 22);
			g.moveTo(64, 64);
			g.lineTo(94, 76);
			g.stroke();
		});
		k.cyl(1.6, 1.6, 0.1, k.mat(0xffffff, { map: face, emissive: 0x606060, glow: 0.5 }), { x: -6, y: 19.5, z: 7.05, rx: PI / 2, parent: tower, seg: 20 });
		k.cone(3.2, 3, 0x8a8a88, { x: -6, y: 23.5, z: 4, parent: tower, seg: 16 });
		// Pylons and power lines.
		const pylon = (x, z) => {
			const g = k.group({ x, z });
			[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.3, 26, 0.3, 0x2a2a2a, { x: sx * 1.2, y: 13, z: sz * 1.2, rz: -sx * 0.06, rx: sz * 0.06, parent: g })));
			for (let i = 0; i < 6; i++) k.box(2.8 - i * 0.3, 0.2, 0.2, 0x2a2a2a, { y: 4 + i * 4, z: 1.2 - i * 0.12, parent: g, rz: i % 2 ? 0.6 : -0.6 });
			[17, 21, 25].forEach((y, i) => k.box(8 - i * 1.5, 0.3, 0.3, 0x2a2a2a, { y, parent: g }));
			return g;
		};
		pylon(40, 30);
		pylon(-6, 46);
		[17, 21, 25].forEach((y, i) => [-1, 1].forEach((s) => {
			const ax = 40 + s * (4 - i * 0.75);
			const bx = -6 + s * (4 - i * 0.75);
			const len = Math.hypot(ax - bx, 16);
			k.cyl(0.05, 0.05, len, 0x111111, { x: (ax + bx) / 2, y: y - 0.6, z: 38, rz: PI / 2, ry: Math.atan2(16, ax - bx), shadow: false });
		}));
		// Fires and smoke.
		const fr = rng(21);
		for (let i = 0; i < 14; i++) {
			const a = fr() * PI * 2;
			const r = 40 + fr() * 60;
			const x = Math.cos(a) * r;
			const z = -20 + Math.sin(a) * r;
			k.glow(0xffa040, 18 + fr() * 14, { x, y: 8 + fr() * 6, z, opacity: 0.7, fog: true });
			k.point(0xff9040, 6, 60, { x, y: 10, z });
					}
		const fleeing = [[38, 36], [34, 40], [44, 42], [30, 44], [41, 47]];
		fleeing.forEach(([x, z], i) => k.person({ x, y: 0, z, ry: 0.6 + i * 0.1, pose: "run", colors: { shirt: [0x6a6a6a, 0xaaaaaa, 0x3a3a3a][i % 3], legs: 0x2a2a2a } }));
		// The beast in the city.
		const big = kaiju({ x: 0, y: 0, z: -20, ry: PI / 2 - 0.25, s: 3.6, from: 4 });
		const beam = k.group({ x: 0, y: 0, z: 0, from: 5 });
		const mouth = new k.THREE.Vector3(0, 11 - 0.4, 1.6 + 2.2).applyEuler(new k.THREE.Euler(0, PI / 2 - 0.25, 0)).multiplyScalar(3.6).add(new k.THREE.Vector3(0, 0, -20));
		const dir = new k.THREE.Vector3(1, -0.32, 0.2).normalize();
		for (let i = 0; i < 14; i++) {
			const p = mouth.clone().addScaledVector(dir, 4 + i * 4.2);
			k.glow(0xe8f0ff, 7 + i * 0.9, { x: p.x, y: p.y, z: p.z, parent: beam, opacity: 0.9 });
		}
		const beamLen = 60;
		const mid = mouth.clone().addScaledVector(dir, beamLen / 2 + 2);
		const bm = k.cyl(1.4, 0.6, beamLen, 0xffffff, { x: mid.x, y: mid.y, z: mid.z, parent: beam, emissive: 0xe0f0ff, glow: 1.6, seg: 10, shadow: false });
		bm.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, -1, 0), dir);
		k.point(0xe0f0ff, 30, 120, { x: mouth.x + 20, y: mouth.y, z: mouth.z, decay: 1, from: 5 });
		// Odo Island: the footprint, the village and the hill (vignette).
		const O = -500;
		k.ground(220, 0x5e5a54, { x: O, bump: 0.6, seg: 50, height: (x, z) => Math.max(0, 24 - Math.abs(z + 45) * 0.75) - Math.max(0, z - 40) * 0.1 });
		k.water(220, 0x5a646e, { x: O, z: 150, seg: 30, amp: 0.4 });
		const print = k.group({ x: O + 6, y: 0.05, z: 24, ry: 0.4, s: 1.4 });
		k.sphere(3, 0x6a665e, { parent: print, s: [1, 0.05, 1.3], seg: 16 });
		[-1.7, 0, 1.7].forEach((x, i) => k.sphere(1, 0x4a463e, { x: x * 1.1, y: 0.01, z: 4.8 - Math.abs(x) * 0.4, parent: print, s: [0.8, 0.05, 1.5], seg: 12 }));
				const trilo = k.group({ x: O + 6.6, y: 0.18, z: 24.4, ry: 0.8 });
		for (let i = 0; i < 6; i++) k.sphere(0.18 - i * 0.015, 0x4a4238, { z: -i * 0.09, parent: trilo, s: [1.4, 0.4, 0.5] });
		k.sphere(0.2, 0x4a4238, { z: 0.12, parent: trilo, s: [1.2, 0.35, 0.8] });
		k.person({ x: O + 2.2, y: 0, z: 25.5, ry: 1.9, s: 1, colors: { shirt: 0xd8d8d8, legs: 0x3a3a3a, hair: 0x111111 } });
		const hut = (x, z) => {
			const g = k.group({ x: O + x, z });
			k.box(5, 2.6, 4, 0x8a7a6a, { y: 1.3, parent: g });
			k.cone(4.4, 3, 0x6a6050, { y: 4, ry: PI / 4, seg: 4, s: [1.1, 1, 0.9], parent: g });
		};
		[[-14, 4], [-6, 10], [12, 6], [18, -2], [-18, -6]].forEach(([x, z]) => hut(x, z));
		const bell = k.group({ x: O + 4, y: 0, z: -4 });
		[-1, 1].forEach((s) => k.box(0.3, 5, 0.3, 0x5a4a3a, { x: s * 1.2, y: 2.5, parent: bell }));
		k.box(3, 0.3, 0.4, 0x5a4a3a, { y: 5, parent: bell });
		k.cyl(0.4, 0.7, 1.1, 0x6a6a5a, { y: 4.2, parent: bell, metal: 0.6 });
		[[-2, 6], [1, 9], [3, 4], [-4, 12], [6, 8]].forEach(([x, z], i) => k.person({ x: O + x, y: 0, z, ry: PI + (i - 2) * 0.2, pose: i % 2 ? "run" : "point", colors: { shirt: 0xc8c8c8, legs: 0x4a4a4a }, from: 3 }));
		kaiju({ x: O + 4, y: 2, z: -64, ry: 0.15, s: 3.6, from: 3 });
		// The fishing boat and the flash on the sea (vignette).
		const F = 500;
		k.water(300, 0x30363e, { x: F, seg: 40, amp: 0.6 });
		const boat = k.group({ x: F, y: 0, z: 0, ry: -0.7 });
		k.box(3, 2, 9, 0x6a6058, { y: 0.4, parent: boat });
		k.cone(1.5, 3, 0x6a6058, { y: 0.4, z: 6, rx: PI / 2, seg: 4, parent: boat, s: [1, 1, 0.66] });
		k.box(2.4, 2, 2.6, 0xc8c4bc, { y: 2.4, z: -2, parent: boat });
		k.cyl(0.08, 0.08, 7, 0x3a3a3a, { y: 4.5, z: 2, parent: boat });
		k.glow(0xfff0c0, 1.2, { y: 6.5, z: 2, parent: boat });
		k.point(0xfff0d0, 4, 15, { y: 4, z: 0, parent: boat });
		[[0.6, 1.5], [-0.6, 3]].forEach(([x, z]) => k.person({ x, y: 1.4, z, ry: 0.6, s: 0.9, colors: { shirt: 0xe0e0e0, legs: 0x3a3a3a }, parent: boat }));
		k.glow(0xffffff, 90, { x: F + 50, y: 4, z: -110 });
		k.glow(0xffffff, 30, { x: F + 50, y: 2, z: -110 });
		k.point(0xffffff, 40, 200, { x: F + 50, y: 8, z: -100, decay: 0.8 });
		for (let i = 0; i < 20; i++) k.sphere(1 + (i % 4), 0xf0f0f0, { x: F + 50 + Math.sin(i * 2.3) * 9, y: 0.5, z: -110 + Math.cos(i * 1.7) * 6, s: [1, 0.4, 1], emissive: 0x909090, opacity: 0.8 });
		return {
			shots: [
				{ pos: [F - 10, 4, 14], look: [F + 20, 3, -60], fov: 50, filter: BW, fog: [0x2a2e34, 40, 260], exposure: 1.6 },
				{ pos: [54, 2, 18], look: [17, 18, 38], fov: 55, filter: BW, fog: [0x6a6e76, 40, 300], exposure: 1.3 },
				{ pos: [O + 14, 9, 38], look: [O + 6, 0, 26], fov: 45, filter: BW },
				{ pos: [O + 2, 3, 22], look: [O + 3, 24, -40], fov: 42, filter: BW },
				{ pos: [-70, 4, -2], look: [0, 30, -22], fov: 50, filter: BW },
				{ pos: [22, 34, 52], look: [8, 25, -18], fov: 50, filter: BW },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the forbidden zone
	r77: (k) => {
		k.fog(0xe8c8a0, 90, 520);
		k.sky(0x4a8ad0, 0xf4dcb8, { offset: -0.02 });
		k.light({ sky: 0xfff0e0, ground: 0x8a5a3a, hemi: 1.35, sunColor: 0xffe0b8, sunPos: [50, 60, 40], sunIntensity: 2.4, shadowSize: 70 });
		k.ground(800, 0xd09a68, { bump: 1.5, seg: 60, height: (x, z) => (z < -40 ? Math.min(30, (-z - 40) * 0.5) : 0) });
		const cr = rng(9);
		for (let i = 0; i < 40; i++) {
			const rz = -60 - cr() * 200;
			k.ico(4 + cr() * 10, [0xb87a50, 0xa86a44, 0xc88a5a][i % 3], { x: (cr() - 0.5) * 300, y: Math.min(30, (-rz - 40) * 0.5), z: rz, s: [1, 1.5 + cr(), 1], ry: cr() * 6 });
		}
		const ape = (o, fur, face, clothes) => {
			const p = k.person({ ...o, colors: { shirt: clothes, legs: clothes, skin: face, hair: fur, ...o.colors } });
			const h = p.userData.limbs.head;
			k.ico(0.25, fur, { y: 0.02, z: -0.04, parent: h, s: [1.05, 1.05, 1] });
			k.sphere(0.15, face, { y: -0.06, z: 0.15, parent: h, s: [1.1, 0.85, 0.8] });
			k.box(0.36, 0.07, 0.1, fur, { y: 0.09, z: 0.17, parent: h });
			[-0.08, 0.08].forEach((x) => k.sphere(0.03, 0x111111, { x, y: 0.03, z: 0.21, parent: h }));
			[-0.06, 0.06].forEach((x) => k.sphere(0.02, 0x111111, { x, y: -0.04, z: 0.29, parent: h }));
			return p;
		};
		// Scarecrows on the ridge.
		for (let i = 0; i < 7; i++) {
			const x = -24 + i * 8;
			const z = -64 - (i % 2) * 3;
			const y = Math.min(30, (-z - 40) * 0.5);
			const s = k.group({ x, y: y - 0.5, z, rz: (cr() - 0.5) * 0.3 });
			k.box(0.3, 7, 0.3, 0x4a3a28, { y: 3.5, parent: s });
			k.box(4, 0.25, 0.25, 0x4a3a28, { y: 5.4, parent: s, rz: (cr() - 0.5) * 0.3 });
			k.box(1.2, 2.2, 0.5, 0x3a3028, { y: 4.4, parent: s, rz: 0.1 });
			k.sphere(0.45, 0x3a3028, { y: 6.2, parent: s });
			for (let j = 0; j < 4; j++) k.box(0.3, 1.2, 0.1, 0x2a2018, { x: -1.6 + j * 1.1, y: 4.8, parent: s, rz: (cr() - 0.5) * 0.5 });
		}
		// A tiny flag planted in the sand (vignette).
		const A = -500;
		const flagTex = k.canvas(190, 100, (g, w, h) => {
			for (let i = 0; i < 13; i++) {
				g.fillStyle = i % 2 ? "#ffffff" : "#c8202a";
				g.fillRect(0, (i * h) / 13, w, h / 13 + 1);
			}
			g.fillStyle = "#2a3a7a";
			g.fillRect(0, 0, w * 0.4, (h * 7) / 13);
			g.fillStyle = "#fff";
			for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) g.fillRect(6 + x * 12, 5 + y * 10, 3, 3);
		});
		k.ground(40, 0xc89060, { x: A, bump: 0.3, seg: 16 });
		k.cyl(0.015, 0.015, 0.8, 0x8a8a90, { x: A, y: 0.4, z: 0, metal: 0.7 });
		k.plane(0.38, 0.2, k.mat(0xffffff, { map: flagTex, side: k.THREE.DoubleSide }), { x: A + 0.19, y: 0.7, z: 0, ry: -0.2 });
		for (let i = 0; i < 8; i++) k.ico(0.15 + cr() * 0.4, 0x9a6a48, { x: A + (cr() - 0.5) * 4, y: 0.05, z: -1 - cr() * 3 });
		// The ship sinking in the lake (vignette).
		const L = 500;
		k.water(160, 0x3a7a88, { x: L, y: 0.2, seg: 30, amp: 0.2 });
		for (let i = 0; i < 18; i++) {
			const a = (i / 18) * PI * 2;
			k.ico(18 + (i % 3) * 5, [0xb06a40, 0xc07a48][i % 2], { x: L + Math.cos(a) * 70, y: 10, z: Math.sin(a) * 70, s: [1, 2.2, 1] });
		}
		const ship = k.group({ x: L - 8, y: -2, z: -12, rx: -0.9, rz: 0.25 });
		k.cyl(1.2, 4.2, 12, 0xe8e8e8, { y: 6, parent: ship, seg: 10, metal: 0.4, rough: 0.4 });
		k.cone(1.2, 2, 0xe8e8e8, { y: 13, parent: ship, seg: 10 });
		for (let i = 0; i < 3; i++) k.box(0.6, 0.6, 0.2, 0x111111, { x: -0.6 + i * 0.6, y: 10, z: 1.8, rx: -0.2, parent: ship });
		k.box(0.2, 5, 0.2, 0x111111, { y: 6, z: 3.3, rx: -0.25, parent: ship });
		const raft = k.group({ x: L + 4, y: 0.25, z: 6, ry: 0.4 });
		k.torus(1.4, 0.4, 0xf2c030, { rx: PI / 2, parent: raft, s: [1, 1.6, 1] });
		k.box(2.2, 0.1, 3.8, 0xe0a020, { parent: raft });
		[[-0.5, -0.8], [0.5, 0], [-0.3, 1]].forEach(([x, z], i) => k.person({ x, y: -0.6, z, ry: -1 + i, pose: "sit", s: 0.85, colors: { shirt: 0xd8d8d0, legs: 0xd8d8d0, hair: 0x5a3a20 }, parent: raft }));
		// Gorillas on horseback in the corn (vignette).
		const C = 500;
		k.ground(160, 0xb89a50, { z: C, bump: 0.4, seg: 20 });
		const field = new k.THREE.InstancedMesh(new k.THREE.ConeGeometry(0.18, 2.2, 4), k.mat(0xd8b858), 1400);
		const mtx = new k.THREE.Matrix4();
		for (let i = 0; i < 1400; i++) {
			mtx.makeTranslation((cr() - 0.5) * 70, 1.0, C - 10 + (cr() - 0.5) * 50);
			field.setMatrixAt(i, mtx);
		}
		k.place(field, { shadow: false });
		const leather = 0x1e1a18;
		const rider = (x, z, ry) => {
			const g = k.group({ x, z, ry });
			const horse = 0x5a3a24;
			k.box(1.1, 1.2, 3, horse, { y: 2.2, parent: g });
			[-0.4, 0.4].forEach((hx) => [-1.1, 1.1].forEach((hz) => k.box(0.25, 1.8, 0.25, horse, { x: hx, y: 0.9, z: hz, parent: g })));
			k.box(0.6, 1.6, 0.6, horse, { y: 3.2, z: 1.6, rx: 0.5, parent: g });
			k.box(0.5, 0.5, 1.2, horse, { y: 3.9, z: 2.2, parent: g });
			k.box(0.1, 0.8, 1.5, 0x1a1210, { y: 3.4, z: 1.4, rx: 0.5, parent: g });
			const go = ape({ y: 1.5, s: 1.15, pose: "sit", parent: g, colors: { shoes: leather } }, 0x1a1614, 0x2a2420, leather);
			go.userData.limbs.legL.rotation.z = -0.5;
			go.userData.limbs.legR.rotation.z = 0.5;
			go.userData.limbs.armR.rotation.x = -1.2;
			k.box(0.08, 0.1, 1.6, 0x3a2a1a, { x: 0.36, y: 1.0, z: 0.6, parent: go });
			k.box(0.06, 0.06, 0.9, 0x5a5a5a, { x: 0.36, y: 1.05, z: 1.6, parent: go, metal: 0.7 });
			return g;
		};
		rider(-4, C - 8, 1.1).userData.from = 3;
		rider(4, C - 14, 1.3).userData.from = 3;
		rider(10, C - 22, 1.0).userData.from = 3;
		[[-2, C + 2], [3, C + 5], [-7, C + 6]].forEach(([x, z], i) => k.person({ x, y: 0, z, ry: PI + 0.3 * (i - 1), pose: "run", colors: { shirt: 0xc8a888, legs: 0xc8a888, hair: 0x4a3020 }, from: 3 }));
		// The ape city (vignette).
		const V = -500;
		k.ground(200, 0xd8b088, { z: V, bump: 0.6, seg: 20 });
		const vr = rng(14);
		for (let i = 0; i < 16; i++) {
			const x = (vr() - 0.5) * 80;
			const z = V - 10 - vr() * 50;
			if (Math.abs(x) < 6 && z > V - 20) continue;
			const r = 4 + vr() * 4;
			const g = k.group({ x, z });
			k.sphere(r, [0xe0c49a, 0xd4b48a, 0xc8a47a][i % 3], { y: r * 0.5, parent: g, s: [1, 1.5, 1], seg: 9, rings: 7 });
			k.cone(r * 0.4, r * 1.2, 0xd8bc90, { y: r * 2.2, parent: g, seg: 7 });
			k.sphere(r * 0.35, 0x3a2418, { y: r * 0.7, z: r * 0.88, parent: g, s: [1, 1.3, 0.4] });
		}
		const zaius = ape({ x: -1.2, z: V, ry: 0.3, s: 1.05, coat: 0xd8701a, from: 4 }, 0xc8601a, 0xd8a070, 0xd8701a);
		k.cone(0.55, 1.6, 0xd8701a, { y: 0.8, parent: zaius, seg: 10 });
		[[1.2, 0.5, -0.3], [2.6, -1, -0.6], [-3, -2, 0.6]].forEach(([x, z, ry]) => {
			const c = ape({ x, z: V + z, ry, from: 4 }, 0x5a3a20, 0xc8a07a, 0x3a6a3a);
			c.userData.limbs.armR.rotation.x = -0.5;
		});
		// The statue on the beach (vignette).
		const B = 0;
		const Bz = 700;
		k.ground(220, 0xd8bc90, { x: B, z: Bz, bump: 0.4, seg: 30, height: (x, z) => Math.min(0, z * 0.08) });
		k.water(220, 0x3a7a98, { x: B, y: -0.6, z: Bz - 110, seg: 30, amp: 0.3 });
		const lib = k.group({ x: B + 6, y: -4, z: Bz - 6, rz: -0.35, rx: 0.12, ry: -0.5, s: 1.5, from: 5 });
		const copper = 0x6aa890;
		k.cyl(3.2, 4.5, 8, copper, { y: 4, parent: lib, seg: 10 });
		k.box(5, 3, 3, copper, { x: 0.3, y: 7, z: 0.4, rz: 0.1, parent: lib });
		k.cyl(1.2, 1.4, 2, copper, { y: 9, parent: lib });
		k.sphere(1.9, copper, { y: 11.2, parent: lib, s: [0.95, 1.1, 1] });
		k.cyl(2, 2, 0.6, copper, { y: 12.5, parent: lib, seg: 14 });
		for (let i = 0; i < 7; i++) {
			const a = -PI / 2 - 1.3 + (i / 6) * 2.6;
			k.cone(0.35, 2.6, copper, { x: Math.cos(a) * 2, y: 13.4, z: -Math.sin(a) * 2, rz: -Math.cos(a) * 0.9, rx: -Math.sin(a) * 0.9, parent: lib, seg: 4 });
		}
		k.box(1.1, 0.4, 0.2, 0x4a8a72, { y: 11.6, z: 1.75, parent: lib });
		k.cyl(0.9, 1.1, 10, copper, { x: 3.2, y: 13, rz: -0.25, parent: lib });
		k.cyl(1.2, 0.8, 1.4, copper, { x: 4.6, y: 18.5, rz: -0.25, parent: lib });
		k.cone(1, 2, copper, { x: 4.8, y: 20, rz: -0.25, parent: lib, seg: 8 });
		k.box(2.4, 3.4, 0.7, copper, { x: -3.2, y: 6.5, z: 1.2, rz: 0.3, parent: lib });
		const taylor = k.person({ x: B - 6, y: 0, z: Bz + 30, ry: PI - 0.4, colors: { shirt: 0xc8a888, legs: 0x8a6a4a, hair: 0x5a3a20, skin: 0xd8a888 }, sleeves: 0xc8a888, from: 5 });
		taylor.userData.limbs.legL.rotation.x = 1.5;
		taylor.userData.limbs.legR.rotation.x = 1.5;
		taylor.position.y = -0.72;
		taylor.userData.limbs.body.rotation.x = 0.3;
		taylor.userData.limbs.armR.rotation.x = -0.4;
		taylor.userData.limbs.armL.rotation.x = 0.2;
		const steed = k.group({ x: B - 19, y: 0, z: Bz + 24, ry: 0.9, from: 5 });
		k.box(1.1, 1.2, 3, 0x6a4a30, { y: 2.2, parent: steed });
		[-0.4, 0.4].forEach((hx) => [-1.1, 1.1].forEach((hz) => k.box(0.25, 1.8, 0.25, 0x6a4a30, { x: hx, y: 0.9, z: hz, parent: steed })));
		k.box(0.6, 1.6, 0.6, 0x6a4a30, { y: 3.2, z: 1.6, rx: 0.5, parent: steed });
		k.box(0.5, 0.5, 1.2, 0x6a4a30, { y: 3.9, z: 2.2, parent: steed });
		const girl = k.person({ x: B - 16, y: 0, z: Bz + 25, ry: PI - 0.6, colors: { shirt: 0xb89a70, legs: 0xd8a888, hair: 0x1a1210, skin: 0xd8a888 }, from: 5 });
		void girl;
		return {
			shots: [
				{ pos: [-6, 1.8, -20], look: [0, 16, -66], fov: 50 },
				{ pos: [A + 0.7, 0.6, 1.4], look: [A + 0.1, 0.55, 0], fov: 35 },
				{ pos: [L + 9, 3, 16], look: [L - 4, 3, -8], fov: 50 },
				{ pos: [-9, 3.6, C + 2], look: [1, 3, C - 13], fov: 50 },
				{ pos: [3, 2.2, V + 9], look: [0, 2.5, V - 4], fov: 55 },
				{ pos: [B - 9, 2.2, Bz + 41], look: [B, 8, Bz - 4], fov: 50 },
			],
		};
	},
};
