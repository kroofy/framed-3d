// Batch 02: reels r28–r37. Each builds one diorama and returns six shots, cryptic first and obvious last.
import { PI, rng, trees, city } from "../kit.js";

// ----------------------------------------------------------------------------------------------- local helpers

/** Many copies of one shape as a single InstancedMesh. `list` holds [x, y, z, rx, ry, rz, scale]. */
function inst(k, geo, color, list, o = {}) {
	const m = new k.THREE.InstancedMesh(geo, color?.isMaterial ? color : k.mat(color, o), list.length);
	const d = new k.THREE.Object3D();
	list.forEach((p, i) => {
		d.position.set(p[0], p[1], p[2]);
		d.rotation.set(p[3] ?? 0, p[4] ?? 0, p[5] ?? 0);
		const s = p[6] ?? 1;
		Array.isArray(s) ? d.scale.set(...s) : d.scale.setScalar(s);
		d.updateMatrix();
		m.setMatrixAt(i, d.matrix);
	});
	return k.place(m, o);
}

/** Coloured points, e.g. a crowd in the stands. `list` holds [x, y, z, color]. */
function dots(k, list, o = {}) {
	const T = k.THREE;
	const pos = new Float32Array(list.length * 3);
	const col = new Float32Array(list.length * 3);
	const c = new T.Color();
	list.forEach((p, i) => {
		pos.set([p[0], p[1], p[2]], i * 3);
		c.set(p[3]);
		col.set([c.r, c.g, c.b], i * 3);
	});
	const geo = new T.BufferGeometry();
	geo.setAttribute("position", new T.BufferAttribute(pos, 3));
	geo.setAttribute("color", new T.BufferAttribute(col, 3));
	return k.place(new T.Points(geo, new T.PointsMaterial({ size: o.size ?? 0.5, vertexColors: true, fog: o.fog ?? true })), { ...o, shadow: false });
}

/** Attach a mesh to a person's limb pivot (the limb hangs along -y from the pivot). */
const onLimb = (person, limb) => person.userData.limbs[limb];

// ----------------------------------------------------------------------------------------------- reels

export const REELS = {
	// ----------------------------------------------------------------------------------------------- the arena
	r28: (k) => {
		k.fog(0xd8c8a8, 120, 700);
		k.sky(0x4a86c8, 0xf0dcb8, { from: 1 });
		k.light({ sky: 0xfff0d8, ground: 0x8a6a40, hemi: 1.2, sunColor: 0xffe8c0, sunIntensity: 2.4, sunPos: [60, 90, 50], shadowSize: 70 });
		k.ground(700, 0xc8b490, { bump: 0.3, seg: 30 });
		city(k, 120, [-260, 260, -260, 260], { h: 14, w: 10, colors: [0xd8c8a8, 0xc8a888, 0xe0d0b8, 0xb88a6a], avoid: (x, z) => Math.hypot(x, z) < 85 || Math.abs(x) > 250, seed: 28 });
		// The Colosseum: three tiers of arches, an attic, and stands full of people.
		const col = k.group({ s: [1.2, 1, 1] });
		const stone = 0xdcc8a0;
		const N = 40;
		const R = 44;
		const step = (PI * 2) / N;
		for (let i = 0; i < N; i++) {
			const a = i * step;
			for (let t = 0; t < 3; t++) {
				const y0 = t * 9;
				k.box(1.8, 9, 2.4, stone, { x: Math.cos(a) * R, y: y0 + 4.5, z: Math.sin(a) * R, ry: -a - PI / 2, parent: col });
				const b = a + step / 2;
				const rr = R * Math.cos(step / 2);
				k.box(2 * R * Math.sin(step / 2) + 0.1, 1.8, 2.3, stone, { x: Math.cos(b) * rr, y: y0 + 8.1, z: Math.sin(b) * rr, ry: -b - PI / 2, parent: col });
			}
		}
		const ring = (r, h, y, color, o = {}) => k.cyl(r, r, h, color, { y, open: true, side: k.THREE.DoubleSide, seg: N, parent: col, ...o });
		ring(R + 0.2, 5, 29.5, stone);
		ring(R + 1.3, 0.5, 9.2, 0xc8b48c);
		ring(R + 1.3, 0.5, 18.2, 0xc8b48c);
		ring(R + 1.3, 0.6, 32.2, 0xc8b48c);
		ring(R - 3, 27, 13.5, 0x8a7458);
		k.cyl(42, 24, 22, 0xb8a888, { y: 14, open: true, side: k.THREE.DoubleSide, seg: 48, parent: col });
		ring(24, 3, 1.5, 0xc8b490, { seg: 48 });
		k.cyl(24, 24, 0.4, 0xe0c48e, { y: 0.2, seg: 48, parent: col });
		const r = rng(28);
		const crowd = [];
		const cols = [0xf2ece0, 0xe8e0d0, 0xb83a2a, 0xc89a50, 0x5a6aa0, 0x7a5a3a, 0xd8a888, 0x9a3a5a];
		for (let i = 0; i < 30000; i++) {
			const a = r() * PI * 2;
			const h = r();
			if (Math.abs(Math.atan2(Math.sin(a + PI / 2), Math.cos(a + PI / 2))) < 0.18 && h < 0.25) continue;
			const rad = 24.4 + 18 * h;
			crowd.push([Math.cos(a) * rad, 3.5 + 22 * h, Math.sin(a) * rad, cols[Math.floor(r() * cols.length)]]);
		}
		dots(k, crowd, { parent: col, size: 0.42 });
		// The emperor's box, on the north side.
		const box = k.group({ x: 0, y: 3, z: -25.6 });
		k.box(7, 0.5, 3.4, 0xe8dcc0, { y: 0.25, parent: box });
		k.box(7, 0.5, 0.25, 0x6a1a4a, { y: 0.6, z: 1.6, parent: box });
		[-3.2, -1.1, 1.1, 3.2].forEach((x) => k.cyl(0.18, 0.2, 3.4, 0xf0e8d8, { x, y: 2.2, z: 1.4, parent: box }));
		k.box(7.4, 0.4, 3.8, 0xe8dcc0, { y: 4.1, parent: box });
		k.box(7.4, 0.9, 0.1, 0x7a1a52, { y: 3.5, z: 1.9, parent: box });
		k.box(7, 3.4, 0.2, 0x8a2a5a, { y: 2.2, z: -1.6, parent: box });
		const emperor = k.person({ x: 0, y: 0.5, z: 0.4, pose: "point", dress: 0xf0ece4, colors: { shirt: 0xf0ece4, legs: 0xf0ece4, skin: 0xe0b896, hair: 0x2a1a10 }, parent: box, from: 3 });
		k.box(0.24, 0.5, 0.2, 0x6a1a5a, { x: -0.2, y: 1.25, z: 0.12, rz: 0.3, parent: emperor });
		const arm = onLimb(emperor, "armR");
		k.box(0.06, 0.16, 0.06, 0xe0b896, { y: -0.78, z: -0.1, parent: arm });
		[-2.4, 2.4].forEach((x) => k.person({ x, y: 0.5, z: -0.4, colors: { shirt: 0xb83a2a, legs: 0x8a6a40 }, hat: 0xc8a040, parent: box, from: 3 }));
		k.point(0xffe0c0, 6, 12, { x: 0, y: 6.5, z: -22 });
		// The gladiator: arms out, sword in hand, bodies on the sand.
		const hero = k.person({ x: 0, y: 0.4, z: 2, pose: "arms-out", colors: { shirt: 0x5a4030, legs: 0x3a2a1c, skin: 0xc89070, hair: 0x2a1a10, shoes: 0x3a2414 }, from: 5 });
		k.box(0.32, 0.14, 0.36, 0x8a8a90, { x: -0.36, y: 1.58, metal: 0.7, rough: 0.35, parent: hero });
		k.box(0.54, 0.12, 0.32, 0x2a1c12, { y: 0.9, parent: hero });
		for (let i = 0; i < 5; i++) k.box(0.1, 0.3, 0.05, 0x4a3020, { x: -0.2 + i * 0.1, y: 0.72, z: 0.15, parent: hero });
		const sword = onLimb(hero, "armR");
		k.box(0.05, 0.16, 0.05, 0x3a2414, { y: -0.78, parent: sword });
		k.box(0.24, 0.04, 0.06, 0xb89a50, { y: -0.86, parent: sword, metal: 0.8 });
		k.box(0.07, 0.8, 0.02, 0xd8dce0, { y: -1.28, parent: sword, metal: 0.9, rough: 0.2 });
		k.person({ x: -3, y: 0.82, z: 0, rz: PI / 2, ry: 0.4, colors: { shirt: 0x7a5a3a, legs: 0x4a3a2a }, from: 5 });
		k.person({ x: 3.5, y: 0.82, z: -1.5, rz: -PI / 2, ry: 2.2, colors: { shirt: 0x8a8a90, legs: 0x4a3a2a, hair: 0x6a4a2a }, from: 5 });
		// A fallen helmet and a sword in the sand.
		const helm = k.group({ x: 6, y: 0.4, z: 8, rz: 0.5, ry: -0.6, from: 1, until: 1 });
		const metal = { metal: 0.75, rough: 0.35 };
		k.sphere(0.24, 0x9a9488, { y: 0.24, s: [1, 1.05, 1.15], parent: helm, ...metal });
		k.box(0.36, 0.3, 0.06, 0x8a8478, { y: 0.16, z: 0.24, parent: helm, ...metal });
		for (let i = 0; i < 4; i++) k.box(0.3, 0.025, 0.03, 0x2a2420, { y: 0.06 + i * 0.07, z: 0.28, parent: helm });
		k.box(0.06, 0.12, 0.5, 0x6a1a1a, { y: 0.52, parent: helm });
		k.torus(0.28, 0.03, 0x8a8478, { y: 0.06, rx: PI / 2, parent: helm, ...metal });
		k.box(0.07, 1, 0.02, 0xd8dce0, { x: 7.6, y: 0.85, z: 6.4, rz: 0.15, metal: 0.9, rough: 0.2, from: 1, until: 1 });
		k.box(0.26, 0.04, 0.06, 0xb89a50, { x: 7.67, y: 1.36, z: 6.4, rz: 0.15, metal: 0.8, from: 1, until: 1 });
		k.box(0.05, 0.2, 0.05, 0x3a2414, { x: 7.69, y: 1.48, z: 6.4, rz: 0.15, from: 1, until: 1 });
		const petals = [];
		for (let i = 0; i < 30; i++) petals.push([6 + (r() - 0.5) * 3, 0.42, 8 + (r() - 0.5) * 3, -PI / 2, 0, r() * 6, 1]);
		inst(k, new k.THREE.CircleGeometry(0.05, 5), 0xb81a2a, petals, { from: 1, until: 1, side: k.THREE.DoubleSide });

		// Elysium: a hand brushing through wheat.
		const F = -400;
		k.sky(0xf0a858, 0xffe8b8, { x: F, r: 300, tag: "wheatsky", from: 4, until: 4, offset: -0.02 });
		k.ground(200, 0x9a7a38, { x: F, y: 0, bump: 0.2, seg: 20, from: 4, until: 4 });
		const stalks = [];
		const heads = [];
		for (let i = 0; i < 12000; i++) {
			const x = F + (r() - 0.5) * 24;
			const z = -10 + (r() - 0.3) * 24;
			const h = 0.8 + r() * 0.2;
			const tilt = (r() - 0.5) * 0.15;
			stalks.push([x, h / 2, z, tilt, 0, tilt, [1, h, 1]]);
			heads.push([x + Math.sin(tilt) * h * 0.5, h + 0.04, z - Math.sin(tilt) * h * 0.5, tilt + 0.2, r() * 6, tilt, 1]);
		}
		inst(k, new k.THREE.CylinderGeometry(0.006, 0.008, 1, 3), 0xc8a048, stalks, { from: 4, until: 4 });
		inst(k, new k.THREE.CapsuleGeometry(0.014, 0.08, 2, 5), 0xe8c060, heads, { from: 4, until: 4 });
		const hand = k.group({ x: F + 0.18, y: 1.02, z: -0.45, ry: 0.35, rx: 0.1, from: 4, until: 4 });
		const skin = 0xc89070;
		k.capsule(0.045, 0.45, skin, { z: 0.3, rx: PI / 2, parent: hand });
		k.cyl(0.055, 0.055, 0.14, 0x4a3020, { z: 0.18, rx: PI / 2, parent: hand });
		k.box(0.1, 0.03, 0.11, skin, { z: -0.02, parent: hand });
		for (let f = 0; f < 4; f++) k.capsule(0.012, 0.08, skin, { x: -0.04 + f * 0.027, y: -0.012, z: -0.11 - (f === 1 || f === 2 ? 0.01 : 0), rx: PI / 2 + 0.35, parent: hand });
		k.capsule(0.013, 0.06, skin, { x: 0.065, z: -0.03, rz: 0.9, rx: PI / 2, parent: hand });
		k.glow(0xfff0c0, 120, { x: F - 60, y: 18, z: -200, from: 4, until: 4 });

		// Germania: the legion braces as burning arrows fly over the forest.
		const G = 400;
		k.sky(0x4a5a68, 0x9aa4a4, { x: G, r: 300, tag: "gsky", from: 2, until: 2 });
		k.ground(220, 0x3a3e2c, { x: G, bump: 1, seg: 30, from: 2, until: 2 });
		trees(k, 90, [G - 80, G + 80, -110, -25], { color: 0x1e2a22, h: 13, from: 2, seed: 9 });
		for (let row = 0; row < 3; row++)
			for (let i = 0; i < 9; i++) {
				const x = G - 8 + i * 2 + (row % 2) * 0.8;
				const z = 2 + row * 2;
				const sol = k.person({ x, y: 0, z, ry: PI, colors: { shirt: 0xa02a20, legs: 0x5a3a28, skin: 0xc89878 }, from: 2, until: 2 });
				k.sphere(0.23, 0x8a8a8a, { y: 1.8, s: [1, 0.8, 1], parent: sol, metal: 0.6 });
				k.box(0.06, 0.18, 0.4, 0xc02020, { y: 2.05, parent: sol });
				k.box(0.8, 1.2, 0.1, 0xa81c1c, { y: 1.05, z: -0.3, parent: sol });
				k.cyl(0.09, 0.09, 0.05, 0xd8b050, { y: 1.05, z: -0.36, rx: PI / 2, parent: sol, metal: 0.8 });
			}
		const arrows = [];
		for (let i = 0; i < 46; i++) {
			const a = k.group({ from: 2, until: 2 });
			k.cyl(0.03, 0.03, 1.2, 0xffa040, { rx: PI / 2, emissive: 0xff7010, glow: 2, parent: a, shadow: false });
			k.glow(0xff8a20, 1.2 + r(), { z: -0.6, parent: a });
			a.userData.o = [G - 16 + r() * 32, r(), 0.8 + r() * 0.6];
			arrows.push(a);
		}
		k.tick((t) => arrows.forEach((a) => {
			const [x, ph, sp] = a.userData.o;
			const p = (t * 0.25 * sp + ph) % 1;
			const z = 6 - p * 90;
			const y = 3 + Math.sin(p * PI) * 22;
			a.position.set(x, y, z);
			a.rotation.x = Math.atan2(Math.cos(p * PI) * 22 * PI, 90) * 1;
		}));
		for (let i = 0; i < 9; i++) {
			const x = G - 50 + i * 12 + r() * 4;
			const z = -32 - r() * 25;
			k.glow(0xff6a10, 8 + r() * 6, { x, y: 3, z, from: 2, until: 2, fog: false, opacity: 0.8 });
			k.point(0xff7020, 25, 40, { x, y: 4, z: z + 4, from: 2, until: 2 });
		}
		k.particles(600, 0xffb060, { x: G, z: -40, box: [100, 25, 40], speed: 1.5, size: 0.15, opacity: 0.8, from: 2, until: 2 });

		// Maximus's tent: the little carved figures of his family, by lamplight.
		const L = 0;
		const LZ = 520;
		const tent = k.group({ x: L, z: LZ, until: 0 });
		k.box(8, 0.2, 8, 0x3a2a1c, { y: -0.1, parent: tent });
		k.box(8, 4, 0.2, 0x5a3e28, { y: 2, z: -2.2, parent: tent });
		[-2.5, 2.5].forEach((x) => k.box(0.2, 4, 8, 0x4e3624, { x, y: 2, parent: tent }));
		for (let i = 0; i < 7; i++) k.box(0.05, 4, 0.05, 0x2a1a10, { x: -2.4 + i * 0.8, y: 2, z: -2.08, parent: tent });
		k.box(1.6, 0.5, 0.9, 0x6a4a2c, { y: 0.25, z: -0.4, parent: tent });
		k.box(1.64, 0.06, 0.94, 0x4a3018, { y: 0.52, z: -0.4, parent: tent });
		k.box(1.0, 0.012, 0.6, 0x7a2a22, { y: 0.556, z: -0.35, ry: 0.08, parent: tent });
		const wood = [0x8a5a34, 0x9a6a3c, 0x7a4e2c, 0xa87a4a, 0x8a6038];
		[[-0.3, -0.45, 1.1], [-0.12, -0.5, 1], [0.05, -0.42, 0.75], [0.2, -0.48, 0.9], [0.34, -0.38, 0.6]].forEach(([x, z, s], i) => {
			const f = k.group({ x, y: 0.562, z, s, ry: (i - 2) * 0.15, parent: tent });
			k.cyl(0.035, 0.05, 0.16, wood[i], { y: 0.08, seg: 7, parent: f });
			k.sphere(0.03, wood[i], { y: 0.19, seg: 7, rings: 5, parent: f });
			k.cyl(0.05, 0.05, 0.012, wood[i], { y: 0.006, seg: 7, parent: f });
		});
		const lamp = k.group({ x: 0.55, y: 0.56, z: -0.2, parent: tent });
		k.sphere(0.07, 0x8a6a3a, { s: [1.4, 0.5, 1], y: 0.03, parent: lamp, metal: 0.5 });
		k.cone(0.02, 0.08, 0x8a6a3a, { x: 0.1, y: 0.04, rz: -1.2, parent: lamp });
		k.glow(0xffb050, 0.18, { x: 0.13, y: 0.09, parent: lamp });
		k.point(0xffa040, 4, 5, { x: L + 0.6, y: 0.9, z: LZ, until: 0 });
		k.point(0xffd8a0, 3, 8, { x: L + 0.5, y: 2.5, z: LZ + 2, until: 0 });
		k.box(0.3, 0.02, 0.12, 0xc8c0b0, { x: -0.6, y: 0.56, z: -0.15, ry: 0.4, parent: tent });
		return {
			shots: [
				{ pos: [L + 0.5, 0.95, LZ + 0.55], look: [L, 0.64, LZ - 0.42], fov: 42, fog: [0x1a120c, 3, 22], exposure: 1.15 },
				{ pos: [6.9, 0.8, 9.4], look: [6.3, 0.6, 7.9], fov: 45 },
				{ pos: [G - 1, 2.6, 14], look: [G, 6, -30], fov: 55, fog: [0x8a9494, 20, 160], exposure: 1.25 },
				{ pos: [72, 16, 88], look: [0, 16, 0], fov: 50 },
				{ pos: [F + 0.4, 1.22, 0.15], look: [F + 0.05, 0.95, -0.8], fov: 50, filter: "sepia(0.25) saturate(1.2)", hide: ["sky"] },
				{ pos: [0.7, 1.6, 6], look: [0, 2.4, -8], fov: 55 },
			],
		};
	},
	r29: (k) => {
		k.fog(0x1a0e1e, 14, 70);
		k.light({ sky: 0xffd0e8, ground: 0x2a1a2a, hemi: 1.1, sunColor: 0xfff0e0, sunIntensity: 0.9, sunPos: [10, 30, 15], shadowSize: 25 });
		const suit = 0x16161c;
		const dressed = (p) => {
			k.box(0.16, 0.62, 0.02, 0xf4f4f0, { y: 1.22, z: 0.145, parent: p, shadow: false });
			k.box(0.06, 0.48, 0.03, 0x0a0a0a, { y: 1.18, z: 0.158, parent: p, shadow: false });
		};
		const gun = (p) => {
			const arm = onLimb(p, "armR");
			k.box(0.06, 0.3, 0.09, 0x2a2a2e, { y: -0.86, z: 0.02, parent: arm, metal: 0.8, rough: 0.3 });
			k.box(0.05, 0.08, 0.16, 0x2a2a2e, { y: -0.74, z: -0.06, parent: arm, metal: 0.8 });
		};
		// Jack Rabbit Slim's: checkered floor, neon, and car booths round the dance floor.
		const check = k.canvas(256, 256, (g) => {
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
				g.fillStyle = (x + y) % 2 ? "#111" : "#eee";
				g.fillRect(x * 32, y * 32, 32, 32);
			}
		});
		check.wrapS = check.wrapT = k.THREE.RepeatWrapping;
		check.repeat.set(8, 8);
		k.plane(40, 40, k.mat(0xffffff, { map: check, rough: 0.4 }), { y: 0.01, rx: -PI / 2 });
		k.box(40, 9, 0.6, 0x2a1630, { y: 4.5, z: -16 });
		[-16, 16].forEach((x) => k.box(0.6, 9, 40, 0x2a1630, { x, y: 4.5 }));
		k.box(40, 0.4, 40, 0x1a0e1e, { y: 9 });
		const neon = (x, y, z, w, h, d, c) => k.box(w, h, d, c, { x, y, z, emissive: c, glow: 2, shadow: false });
		neon(0, 6.5, -15.6, 30, 0.12, 0.1, 0xff3aa0);
		neon(0, 7.2, -15.6, 30, 0.12, 0.1, 0x3ad0ff);
		[-15.6, 15.6].forEach((x) => {
			neon(x, 6.5, 0, 0.1, 0.12, 30, 0xff3aa0);
			neon(x, 7.2, 0, 0.1, 0.12, 30, 0x3ad0ff);
		});
		const posters = [0xe8c040, 0xd83a3a, 0x3a8ad8, 0x5ac05a, 0xe87a2a];
		for (let i = 0; i < 7; i++) k.box(2, 2.8, 0.1, posters[i % 5], { x: -12 + i * 4, y: 3.6, z: -15.65, emissive: posters[i % 5], glow: 0.25 });
		for (let i = 0; i < 6; i++) [-1, 1].forEach((s) => k.box(0.1, 2.8, 2, posters[(i + 2) % 5], { x: s * 15.65, y: 3.6, z: -12 + i * 4.8, emissive: posters[(i + 2) % 5], glow: 0.25 }));
		[[-8, -8, 0xff3aa0], [8, -8, 0x3ad0ff], [-8, 6, 0x3ad0ff], [8, 6, 0xff3aa0], [0, 0, 0xffe0c0]].forEach(([x, z, c]) => k.point(c, 14, 22, { x, y: 7, z }));
		const car = (x, z, ry, color) => {
			const g = k.group({ x, z, ry });
			k.box(2.3, 0.7, 5, color, { y: 0.6, parent: g, rough: 0.35, metal: 0.3 });
			k.box(2.32, 0.08, 5.02, 0xe8e8ec, { y: 0.75, parent: g, metal: 0.9, rough: 0.2 });
			[-1, 1].forEach((sx) => {
				k.box(0.12, 0.5, 2.2, color, { x: sx * 1.09, y: 1.2, parent: g, rough: 0.35 });
				k.box(0.1, 0.55, 0.9, color, { x: sx * 0.95, y: 1.15, z: -2.3, rx: -0.2, parent: g });
				[-1.6, 1.6].forEach((wz) => {
					k.cyl(0.42, 0.42, 0.25, 0x0a0a0a, { x: sx * 1.12, y: 0.42, z: wz, rz: PI / 2, parent: g });
					k.cyl(0.24, 0.24, 0.26, 0xf0f0f0, { x: sx * 1.12, y: 0.42, z: wz, rz: PI / 2, parent: g });
				});
				k.glow(0xfff4d0, 0.5, { x: sx * 0.75, y: 0.7, z: 2.52, parent: g });
			});
			[-0.85, 0.85].forEach((bz) => {
				k.box(2, 0.3, 0.7, 0xc81a2a, { y: 1.05, z: bz * 1.3, parent: g });
				k.box(2, 0.8, 0.2, 0xc81a2a, { y: 1.45, z: bz * 1.3 + Math.sign(bz) * 0.35, parent: g });
			});
			k.box(1.3, 0.06, 1, 0xf2f0e8, { y: 1.45, parent: g });
			k.cyl(0.06, 0.08, 0.5, 0xc8c8cc, { y: 1.15, parent: g, metal: 0.9 });
			k.box(1.6, 0.4, 0.08, 0x8ab0c8, { y: 1.3, z: 1.95, rx: -0.3, opacity: 0.4, parent: g });
			return g;
		};
		const cars = [0xc8202a, 0x40c0b0, 0xf2f0e8, 0x3a6ad8, 0xe8b830, 0xc8202a];
		const booth = car(-9, -9, PI / 4, cars[0]);
		car(0, -11.5, PI / 2, cars[1]);
		car(9, -9, (3 * PI) / 4, cars[2]);
		car(-11.5, 1, 0, cars[3]);
		car(11.5, 1, 0, cars[4]);
		// The five-dollar shake.
		const shake = k.group({ x: 0.15, y: 1.48, z: 0.1, parent: booth });
		k.cyl(0.09, 0.055, 0.26, 0xe8f0f4, { y: 0.13, opacity: 0.45, rough: 0.05, parent: shake });
		k.cyl(0.085, 0.052, 0.22, 0xf6eedc, { y: 0.12, parent: shake });
		k.cyl(0.05, 0.07, 0.03, 0xe8f0f4, { y: 0.0, opacity: 0.5, parent: shake });
		k.sphere(0.085, 0xfffaf0, { y: 0.27, s: [1, 0.7, 1], parent: shake });
		k.sphere(0.03, 0xc80a1a, { y: 0.34, parent: shake, rough: 0.2 });
		k.cyl(0.008, 0.008, 0.36, 0xe82020, { x: 0.03, y: 0.36, rz: -0.25, parent: shake });
		k.cyl(0.008, 0.008, 0.36, 0xf0f0f0, { x: 0.05, y: 0.36, z: 0.02, rz: -0.2, parent: shake });
		k.cyl(0.04, 0.03, 0.06, 0xd8d8d8, { x: -0.3, y: 1.51, z: 0.15, parent: booth, opacity: 0.6 });
		k.cyl(0.07, 0.06, 0.03, 0x8a8a90, { x: -0.25, y: 1.5, z: -0.2, parent: booth, metal: 0.7 });
		k.cyl(0.007, 0.007, 0.08, 0xf8f8f8, { x: -0.22, y: 1.53, z: -0.2, rz: PI / 2, parent: booth });
		k.glow(0xff7020, 0.04, { x: -0.18, y: 1.53, z: -0.2, parent: booth });
		k.spot(0xfff0e0, 10, { x: -8.5, y: 5, z: -8.5, target: [-9, 1.4, -9], angle: 0.35, distance: 12 });
		// The trophy on the stage.
		k.cyl(3, 3.2, 0.5, 0x5a1a3a, { x: 0, y: 0.25, z: -14 });
		const cup = k.group({ x: 0, y: 0.5, z: -14 });
		k.box(0.6, 0.6, 0.6, 0x1a1a1a, { y: 0.3, parent: cup });
		k.cyl(0.08, 0.14, 0.5, 0xe8b830, { y: 0.85, parent: cup, metal: 1, rough: 0.25 });
		k.cyl(0.35, 0.12, 0.5, 0xe8b830, { y: 1.35, parent: cup, metal: 1, rough: 0.25 });
		[-1, 1].forEach((s) => k.torus(0.14, 0.03, 0xe8b830, { x: s * 0.36, y: 1.4, ry: PI / 2, parent: cup, metal: 1 }));
		// The twist.
		const mia = k.person({ x: -0.7, y: 0, z: 0, ry: 0.9, colors: { shirt: 0xf4f2ec, legs: 0x0a0a0a, skin: 0xf0d0b8, hair: 0x050505, shoes: 0xf0d0b8 }, from: 4 });
		k.box(0.46, 0.22, 0.34, 0x050505, { y: 1.78, z: -0.03, parent: mia });
		k.box(0.46, 0.08, 0.06, 0x050505, { y: 1.88, z: 0.18, parent: mia });
		const vin = k.person({ x: 0.7, y: 0, z: 0.3, ry: -1.1, colors: { shirt: suit, legs: suit, skin: 0xe8c0a0, hair: 0x2a1a10 }, from: 4 });
		dressed(vin);
		k.box(0.42, 0.42, 0.12, 0x2a1a10, { y: 1.68, z: -0.15, parent: vin });
		k.tick((t) => [mia, vin].forEach((p, i) => {
			const l = p.userData.limbs;
			const w = Math.sin(t * 6 + i);
			l.body.rotation.y = w * 0.5;
			l.armL.rotation.set(-0.6, 0, -0.7 - w * 0.3);
			l.armR.rotation.set(-0.6, 0, 0.7 - w * 0.3);
			l.legL.rotation.z = 0.15 + w * 0.1;
			l.legR.rotation.z = -0.15 + w * 0.1;
			l.head.rotation.y = -w * 0.3;
		}));
		k.spot(0xfff4e0, 30, { x: 0, y: 8.5, z: 2, target: [0, 0, 0], angle: 0.35, distance: 16 });

		// The bed: the poster pose, with a paperback and a cigarette.
		const B = -300;
		const room = k.group({ x: B });
		k.box(12, 0.2, 12, 0x3a2a24, { y: -0.1, parent: room });
		k.box(12, 6, 0.2, 0x1e1a1c, { y: 3, z: -3, parent: room });
		k.box(4, 0.5, 5, 0x5a4a3a, { y: 0.25, parent: room });
		k.box(3.9, 0.12, 4.9, 0xece6dc, { y: 0.56, parent: room });
		k.box(3.6, 0.6, 0.15, 0x5a4a3a, { y: 0.9, z: -2.45, parent: room });
		const bed = 0.62;
		const her = k.group({ x: 0, y: bed, z: -0.2, ry: 0.2, parent: room });
		const sk = 0xf0d0b8;
		k.box(0.46, 0.26, 0.72, 0x050505, { y: 0.22, z: 0.05, rx: -0.3, parent: her });
		k.box(0.42, 0.24, 0.4, 0x050505, { y: 0.12, z: -0.48, parent: her });
		[-0.11, 0.11].forEach((x, i) => {
			k.box(0.18, 0.18, 0.8, 0x050505, { x, y: 0.1, z: -1.05, parent: her });
			k.box(0.16, 0.7, 0.16, 0x050505, { x, y: 0.4, z: -1.5, rx: i ? -0.55 : -0.25, parent: her });
			k.box(0.12, 0.12, 0.24, sk, { x, y: 0.76, z: i ? -1.7 : -1.6, rx: i ? -0.55 : -0.25, parent: her });
			k.box(0.13, 0.42, 0.13, 0x050505, { x: x * 2.6, y: 0.3, z: 0.35, rx: -0.3, parent: her });
			k.box(0.12, 0.1, 0.42, sk, { x: x * 2.6, y: 0.06, z: 0.62, ry: -x * 2, parent: her });
		});
		k.sphere(0.19, sk, { y: 0.66, z: 0.42, parent: her });
		k.sphere(0.215, 0x050505, { y: 0.7, z: 0.39, s: [1.08, 1, 1.05], parent: her });
		k.box(0.42, 0.08, 0.12, 0x050505, { y: 0.78, z: 0.55, parent: her });
		k.box(0.42, 0.25, 0.3, 0x050505, { y: 0.6, z: 0.3, parent: her });
		k.box(0.08, 0.025, 0.02, 0xc8101a, { y: 0.56, z: 0.6, parent: her });
		k.cyl(0.008, 0.008, 0.14, 0xf8f8f8, { x: 0.3, y: 0.13, z: 0.86, rx: PI / 2, parent: her });
		k.glow(0xff6a20, 0.06, { x: 0.3, y: 0.13, z: 0.93, parent: her });
		const book = k.group({ x: -0.05, y: 0.02, z: 1.0, ry: 0.3, parent: her });
		k.box(0.36, 0.03, 0.5, 0xe8c838, { parent: book });
		k.box(0.28, 0.035, 0.22, 0xc8302a, { z: 0.06, parent: book });
		k.box(0.38, 0.6, 0.08, 0xf0f0f0, { x: 1.4, y: 0.65, z: -1.9, parent: room });
		k.point(0xffe0c0, 6, 10, { x: B + 1.5, y: 3, z: 3 });
		k.spot(0xfff0e0, 25, { x: B + 2, y: 5, z: 4, target: [B, 0.6, 0], angle: 0.45, distance: 14 });

		// The apartment: the case on the counter, and two men in black suits.
		const A = 300;
		const flat = k.group({ x: A });
		k.box(14, 0.2, 14, 0x8a7a68, { y: -0.1, parent: flat });
		k.box(14, 5, 0.2, 0xd8d0b8, { y: 2.5, z: -5, parent: flat });
		k.box(0.2, 5, 14, 0xd0c8b0, { x: -5, y: 2.5, parent: flat });
		for (let i = 0; i < 10; i++) k.box(2.4, 0.08, 0.05, 0xfff8e8, { x: -1.5, y: 1.6 + i * 0.22, z: -4.88, parent: flat, emissive: 0xfff0d0, glow: 0.8, shadow: false });
		k.box(3, 1, 1, 0x6a5a48, { x: 3, y: 0.5, z: -4, parent: flat });
		k.box(3.1, 0.08, 1.1, 0xe8e0d0, { x: 3, y: 1.04, z: -4, parent: flat });
		const kase = k.group({ x: 2.7, y: 1.08, z: -4, ry: -0.5, parent: flat });
		k.box(0.9, 0.18, 0.6, 0x1a1a1a, { y: 0.09, parent: kase, rough: 0.5 });
		k.box(0.84, 0.02, 0.54, 0x3a2a1a, { y: 0.17, parent: kase });
		const lid = k.group({ y: 0.18, z: -0.3, rx: -1.9, parent: kase });
		k.box(0.9, 0.08, 0.6, 0x1a1a1a, { z: 0.3, y: 0.04, parent: lid, rough: 0.5 });
		k.box(0.82, 0.02, 0.52, 0xd8a840, { z: 0.3, y: -0.005, parent: lid, emissive: 0xc08020, glow: 0.8 });
		[-0.3, 0.3].forEach((x) => k.box(0.08, 0.05, 0.03, 0xd8d8d8, { x, y: 0.15, z: 0.31, parent: kase, metal: 0.9 }));
		k.box(0.12, 0.08, 0.04, 0x1a1a1a, { y: 0.12, z: 0.32, parent: kase });
		k.glow(0xffc040, 1.4, { y: 0.3, parent: kase });
		k.glow(0xffe8a0, 0.6, { y: 0.22, parent: kase });
		k.point(0xffb030, 3, 3, { y: 0.6, z: 0.2, parent: kase });
		k.box(2.6, 0.9, 1, 0x7a3a2a, { x: -3.6, y: 0.45, z: 2, ry: PI / 2, parent: flat });
		const jules = k.person({ x: A - 0.6, y: 0, z: -2, pose: "point", colors: { shirt: suit, legs: suit, skin: 0x5a3a28, hair: 0x120a06 }, from: 3 });
		k.sphere(0.23, 0x120a06, { y: 1.82, z: -0.07, s: [1, 0.85, 0.95], parent: jules });
		k.box(0.2, 0.36, 0.14, 0x120a06, { y: 1.62, z: -0.15, parent: jules });
		const vince = k.person({ x: A + 0.6, y: 0, z: -2.2, pose: "point", colors: { shirt: suit, legs: suit, skin: 0xe8c0a0, hair: 0x2a1a10 }, from: 3 });
		k.box(0.42, 0.42, 0.12, 0x2a1a10, { y: 1.68, z: -0.15, parent: vince });
		[jules, vince].forEach((p) => {
			dressed(p);
			gun(p);
		});
		k.point(0xfff4e0, 10, 14, { x: A, y: 4, z: 2 });
		// Divine intervention: the shots that missed, in the plaster by the bathroom door.
		k.box(1.1, 2.3, 0.08, 0x8a6a4a, { x: -4.88, y: 1.15, z: -2.6, ry: PI / 2, parent: flat });
		[[1.55, -0.6], [1.8, -0.35], [1.35, -0.2], [1.95, -0.85], [1.62, 0.05], [1.25, -0.55]].forEach(([y, z]) => {
			k.cyl(0.035, 0.035, 0.02, 0x1a1410, { x: A - 4.89, y, z, rz: PI / 2 });
			k.cyl(0.07, 0.07, 0.01, 0xb8ae98, { x: A - 4.895, y, z, rz: PI / 2 });
		});
		k.spot(0xfff0d8, 6, { x: A - 2.5, y: 3, z: 0.5, target: [A - 4.9, 1.5, -0.4], angle: 0.5, distance: 8 });
		// Breakfast on the coffee table: a burger, a fast-food cup and a bag.
		const brk = k.group({ x: A - 2.2, z: 1.6, ry: 0.3 });
		k.box(1.6, 0.06, 0.9, 0x5a3a24, { y: 0.45, parent: brk });
		[-0.7, 0.7].forEach((x) => [-0.35, 0.35].forEach((z) => k.box(0.06, 0.45, 0.06, 0x3a2414, { x, y: 0.225, z, parent: brk })));
		k.box(0.36, 0.008, 0.36, 0xf4ecd8, { x: -0.15, y: 0.484, z: 0.05, ry: 0.5, parent: brk });
		const bun = k.group({ x: -0.15, y: 0.49, z: 0.05, parent: brk });
		k.cyl(0.11, 0.1, 0.04, 0xd8a050, { y: 0.02, parent: bun });
		k.cyl(0.115, 0.115, 0.03, 0x5a2e18, { y: 0.055, parent: bun });
		k.cyl(0.12, 0.12, 0.012, 0x6aa83a, { y: 0.075, parent: bun });
		k.cyl(0.118, 0.118, 0.01, 0xf0c030, { y: 0.085, parent: bun });
		k.sphere(0.11, 0xd89a48, { y: 0.09, s: [1, 0.55, 1], parent: bun });
		const soda = k.group({ x: 0.25, y: 0.48, z: -0.15, parent: brk });
		k.cyl(0.07, 0.05, 0.24, 0xf0e8d8, { y: 0.12, parent: soda });
		k.cyl(0.072, 0.072, 0.05, 0x2a8ab0, { y: 0.14, parent: soda });
		k.cyl(0.075, 0.075, 0.015, 0xf8f8f8, { y: 0.245, parent: soda });
		k.cyl(0.008, 0.008, 0.2, 0xe82020, { x: 0.02, y: 0.33, rz: -0.15, parent: soda });
		k.box(0.2, 0.26, 0.12, 0xc89a60, { x: 0.45, y: 0.61, z: 0.15, ry: -0.3, parent: brk });
		k.box(0.18, 0.06, 0.02, 0xd84a2a, { x: 0.43, y: 0.62, z: 0.215, ry: -0.3, parent: brk });
		k.box(0.12, 0.012, 0.05, 0xe8c040, { x: 0.05, y: 0.485, z: 0.3, ry: 0.9, parent: brk });
		for (let i = 0; i < 5; i++) k.box(0.012, 0.012, 0.09, 0xe8b040, { x: 0.04 + (i - 2) * 0.03, y: 0.5, z: 0.3 + (i % 2) * 0.01, ry: 0.9 + i * 0.1, parent: brk });
		k.point(0xfff0d8, 4, 5, { x: A - 1.8, y: 1.8, z: 2.6 });
		return {
			shots: [
				{ pos: [A - 3.2, 1.6, -0.3], look: [A - 4.9, 1.55, -0.45], fov: 40, fog: [0x2a2420, 3, 20] },
				{ pos: [7, 3.2, 9], look: [-2, 1.2, -8], fov: 55, exposure: 1.2 },
				{ pos: [A - 2.65, 1.05, 2.45], look: [A - 2.2, 0.55, 1.6], fov: 42, fog: [0x2a2420, 3, 20] },
				{ pos: [A + 0.1, 1.25, 1.2], look: [A, 1.5, -2.2], fov: 55, fog: [0xd8d0b8, 8, 40] },
				{ pos: [0.6, 1.7, 5.5], look: [0, 1.3, 0], fov: 50, exposure: 1.2 },
				{ pos: [B + 1.9, 1.7, 1.9], look: [B, 0.8, -0.3], fov: 45, fog: [0x1e1a1c, 4, 30] },
			],
		};
	},
	r30: (k) => {
		k.fog(0xcfe4f0, 70, 520);
		k.sky(0x4a90e0, 0xe0f0fa);
		k.light({ sky: 0xf0f8ff, ground: 0x5a7a40, hemi: 1.25, sunColor: 0xfff4dc, sunIntensity: 2.4, sunPos: [30, 60, 40], shadowSize: 30 });
		const r = rng(30);
		// A square in Savannah: grass, a path, live oaks hung with moss.
		k.ground(320, 0x5a9040, { bump: 0.3, seg: 30 });
		k.box(60, 0.06, 3, 0xc8c0b0, { y: 0.03, z: 1.2 });
		const oak = (x, z, s) => {
			const g = k.group({ x, z, s });
			k.cyl(0.6, 0.9, 4, 0x4a3a2c, { y: 2, parent: g });
			for (let i = 0; i < 5; i++) {
				const a = (i / 5) * PI * 2 + r();
				k.cyl(0.25, 0.4, 5, 0x4a3a2c, { x: Math.cos(a) * 2, y: 4.4, z: Math.sin(a) * 2, rz: Math.cos(a) * -1.1, rx: Math.sin(a) * 1.1, parent: g });
				k.sphere(2.6, 0x3a6a2c, { x: Math.cos(a) * 4, y: 6.2, z: Math.sin(a) * 4, s: [1.3, 0.55, 1.3], seg: 8, rings: 6, parent: g });
				for (let m = 0; m < 4; m++) k.cone(0.3, 1.8, 0x8a9a7a, { x: Math.cos(a) * (3 + m * 0.6) + r() - 0.5, y: 4.8, z: Math.sin(a) * (3 + m * 0.6) + r() - 0.5, rx: PI, seg: 4, parent: g });
			}
			k.sphere(3.2, 0x467a34, { y: 7, s: [1.4, 0.6, 1.4], seg: 8, rings: 6, parent: g });
		};
		[[-9, -7, 1], [8, -9, 1.1], [-18, 4, 0.9], [17, 3, 1], [0, -18, 1.2], [-26, -16, 1], [24, -18, 1]].forEach(([x, z, s]) => oak(x, z, s));
		city(k, 30, [-120, 120, -140, -50], { h: 12, w: 10, colors: [0xd8c8b0, 0xc89a80, 0xe8e0d0], seed: 31 });
		// The bench, the stop sign, the suitcase and the box.
		const bench = k.group({ x: 0, z: 0 });
		for (let i = 0; i < 4; i++) k.box(2.4, 0.05, 0.11, 0x8a6040, { y: 0.47, z: -0.2 + i * 0.13, parent: bench });
		for (let i = 0; i < 3; i++) k.box(2.4, 0.11, 0.05, 0x8a6040, { y: 0.66 + i * 0.16, z: -0.33, rx: -0.15, parent: bench });
		[-1.05, 1.05].forEach((x) => {
			k.box(0.08, 0.45, 0.5, 0x2a2a2a, { x, y: 0.225, parent: bench });
			k.box(0.08, 0.6, 0.06, 0x2a2a2a, { x, y: 0.8, z: -0.36, rx: -0.15, parent: bench });
		});
		k.cyl(0.04, 0.04, 2.6, 0x8a8a8a, { x: 1.8, y: 1.3, z: 0.2 });
		k.box(0.5, 0.4, 0.03, 0x2a5aa0, { x: 1.8, y: 2.45, z: 0.2 });
		k.box(0.42, 0.06, 0.035, 0xf0f0f0, { x: 1.8, y: 2.5, z: 0.2 });
		const sit = (o) => {
			const p = k.person({ ...o, pose: "sit" });
			[-0.13, 0.13].forEach((x) => {
				k.box(0.2, 0.6, 0.2, o.colors.legs, { x, y: 0.55, z: 0.78, parent: p });
				k.box(0.22, 0.12, 0.34, o.colors.shoes ?? 0x1a1a1a, { x, y: 0.28, z: 0.86, parent: p });
			});
			return p;
		};
		const fg = sit({ x: -0.15, y: -0.3, z: -0.05, colors: { shirt: 0xf2eee4, legs: 0xf2eee4, skin: 0xe8b896, hair: 0x6a4a2a, shoes: 0xf8f8f8 }, from: 5 });
		k.box(0.16, 0.5, 0.02, 0x7aa0d8, { y: 1.25, z: 0.145, parent: fg });
		[-0.13, 0.13].forEach((x) => k.box(0.04, 0.05, 0.2, 0xd81a1a, { x: x + Math.sign(x) * 0.11, y: 0.29, z: 0.88, parent: fg }));
		fg.userData.limbs.armL.rotation.x = -0.9;
		fg.userData.limbs.armR.rotation.x = -0.9;
		const choc = k.group({ x: -0.15, y: 0.62, z: 0.5, rx: 0.1, from: 5 });
		k.box(0.42, 0.05, 0.3, 0xf0e4c8, { parent: choc });
		k.box(0.44, 0.02, 0.32, 0x7a1a2a, { y: -0.03, parent: choc });
		for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
			k.cyl(0.04, 0.035, 0.03, 0xc8a878, { x: -0.15 + i * 0.1, y: 0.035, z: -0.09 + j * 0.09, parent: choc });
			k.sphere(0.034, [0x3a1e10, 0x5a3420, 0xe8d8c0, 0x2a140a][(i + j) % 4], { x: -0.15 + i * 0.1, y: 0.06, z: -0.09 + j * 0.09, s: [1, 0.7, 1], parent: choc });
		}
		k.box(0.44, 0.02, 0.32, 0x8a1a2e, { x: -0.65, y: 0.5, z: 0.05, ry: 0.4, from: 5 });
		k.box(0.6, 0.45, 0.2, 0x6a4a30, { x: 0.65, y: 0.72, z: -0.05, from: 5 });
		k.box(0.2, 0.05, 0.04, 0x2a1a10, { x: 0.65, y: 0.97, z: -0.05, from: 5 });
		const lady = sit({ x: 0.8, y: -0.3, z: -0.05, s: 0.97, dress: 0x6a8ab0, colors: { shirt: 0x6a8ab0, legs: 0xd8b090, skin: 0xd8b090, hair: 0x9a9088, shoes: 0x2a2a2a }, from: 5 });
		void lady;
				k.sphere(0.03, 0xffffff, { x: 0.5, y: 0.05, z: 1.4, s: [6, 0.3, 1.5], ry: 0.4, from: 5 });

		// The rec room: a ping-pong table mid-rally.
		const P = 300;
		const pong = k.group({ x: P });
		k.box(20, 0.2, 20, 0x8a7a5a, { y: -0.1, parent: pong });
		k.box(20, 5, 0.2, 0x6a7a5a, { y: 2.5, z: -5, parent: pong });
		[-6, 6].forEach((x) => k.box(0.2, 5, 20, 0x6a7a5a, { x, y: 2.5, parent: pong }));
		k.box(20, 0.2, 20, 0xd8d8c8, { y: 5, parent: pong });
		for (let i = 0; i < 3; i++) k.box(1.5, 1, 0.05, 0xf8f8e8, { x: -4 + i * 4, y: 3, z: -4.88, parent: pong, emissive: 0xfff8e0, glow: 0.6 });
		const top = k.canvas(256, 128, (g) => {
			g.fillStyle = "#1e5a3a";
			g.fillRect(0, 0, 256, 128);
			g.strokeStyle = "#f8f8f8";
			g.lineWidth = 4;
			g.strokeRect(2, 2, 252, 124);
			g.beginPath();
			g.moveTo(0, 64);
			g.lineTo(256, 64);
			g.stroke();
		});
		k.box(2.74, 0.06, 1.52, k.mat(0xffffff, { map: top, rough: 0.5 }), { y: 0.76, parent: pong });
		[-1.2, 1.2].forEach((x) => [-0.6, 0.6].forEach((z) => k.box(0.06, 0.73, 0.06, 0x2a2a2a, { x, y: 0.37, z, parent: pong })));
		k.box(0.02, 0.15, 1.7, 0xf0f0f0, { y: 0.865, parent: pong, opacity: 0.8 });
		const paddle = k.group({ x: -1.65, y: 1.05, z: 0.3, rz: 0.4, ry: 0.3, parent: pong });
		k.cyl(0.08, 0.08, 0.015, 0xc81a1a, { rz: PI / 2, parent: paddle });
		k.box(0.03, 0.1, 0.03, 0xc8a070, { y: -0.12, parent: paddle });
		const ball = k.sphere(0.02, 0xffffff, { y: 1, parent: pong, emissive: 0x404040 });
		k.tick((t) => {
			const p = (Math.sin(t * 5) + 1) / 2;
			ball.position.set(-1.4 + p * 2.8, 0.82 + Math.abs(Math.sin(t * 10)) * 0.25, 0.2 - p * 0.4);
		});
		const soldier = k.person({ x: P - 2, y: 0, z: 0.2, ry: PI / 2, pose: "point", colors: { shirt: 0x6a6a3a, legs: 0x5a5a32, skin: 0xe8b896, hair: 0x6a4a2a } });
		void soldier;
		k.point(0xfff0d0, 10, 10, { x: P, y: 3, z: 1 });

		// A shrimping boat with her booms out.
		const S = -300;
		k.water(260, 0x3a7aa0, { x: S, amp: 0.25, seg: 50 });
		const boat = k.group({ x: S, z: 0, ry: 0.6 });
		k.box(3.2, 1.6, 9, 0xf4f0e8, { y: 0.5, parent: boat });
		k.cone(1.6, 3, 0xf4f0e8, { y: 0.5, z: 5.9, rx: PI / 2, s: [1, 1, 0.53], seg: 4, ry: PI / 4, parent: boat });
		k.box(3.25, 0.25, 9.05, 0x2a5aa0, { y: 1.2, parent: boat });
		k.box(2.4, 1.8, 2.6, 0xf8f8f0, { y: 2.2, z: 1.8, parent: boat });
		k.box(2.6, 0.15, 2.9, 0x2a5aa0, { y: 3.15, z: 1.8, parent: boat });
		k.box(2.0, 0.5, 0.05, 0x2a3a4a, { y: 2.5, z: 3.12, parent: boat });
		k.cyl(0.1, 0.12, 7, 0xe8e0d0, { y: 4.5, z: -0.5, parent: boat });
		[-1, 1].forEach((s) => {
			k.cyl(0.07, 0.07, 7.5, 0xe8e0d0, { x: s * 2.8, y: 4.2, z: -0.5, rz: s * 1.0, parent: boat });
			k.cone(1.2, 3.5, 0x6a7a6a, { x: s * 6, y: 0.9, z: -1, rx: PI / 2, parent: boat, opacity: 0.8, seg: 6 });
			k.cyl(0.01, 0.01, 2, 0x333333, { x: s * 5.8, y: 2.2, z: -0.5, parent: boat });
		});
		k.person({ x: 0.4, y: 1.3, z: -2.5, ry: 2.5, colors: { shirt: 0xf2eee4, legs: 0x3a4a6a, hair: 0x6a4a2a }, parent: boat, from: 1 });
		k.tick((t) => {
			boat.position.y = Math.sin(t) * 0.12;
			boat.rotation.z = Math.sin(t * 0.8) * 0.03;
		});
		for (let i = 0; i < 5; i++) {
			const gull = k.group({ x: S + (r() - 0.5) * 16, y: 7 + r() * 4, z: (r() - 0.5) * 10, ry: r() * 6 });
			[-1, 1].forEach((s) => k.box(0.5, 0.03, 0.14, 0xffffff, { x: s * 0.25, rz: s * 0.3, parent: gull }));
			k.capsule(0.05, 0.2, 0xffffff, { rx: PI / 2, parent: gull });
		}

		// Monument Valley: the long road, the beard, the followers.
		const M = -600;
		k.ground(500, 0xc87a4a, { z: M, bump: 0.8, seg: 30 });
		k.box(6, 0.04, 360, 0x3a3a3c, { y: 0.4, z: M + 60 });
		for (let i = 0; i < 40; i++) k.box(0.15, 0.02, 2, 0xf0d040, { y: 0.43, z: M + 230 - i * 6 });
		const butte = (x, z, w, h, d) => {
			k.box(w, h, d, 0xb0583a, { x, y: h / 2, z });
			k.cyl(w * 0.8, w * 1.4, h * 0.25, 0xc06a44, { x, y: h * 0.12, z, seg: 7 });
		};
		butte(-38, M - 170, 26, 60, 18);
		butte(30, M - 200, 16, 75, 14);
		butte(70, M - 160, 30, 50, 22);
		butte(-90, M - 220, 20, 64, 16);
		const runner = k.person({ x: 0.6, y: 0.4, z: M + 160, pose: "run", colors: { shirt: 0xc8b090, legs: 0x8a7a68, skin: 0xd8a888, hair: 0x6a4a2a, shoes: 0xf8f8f8 }, from: 4 });
		k.box(0.36, 0.3, 0.2, 0x6a4a2a, { y: 1.55, z: 0.15, parent: runner });
		k.box(0.44, 0.5, 0.16, 0x6a4a2a, { y: 1.8, z: -0.16, parent: runner });
		k.cyl(0.22, 0.22, 0.1, 0xc81a1a, { y: 1.95, parent: runner });
		k.box(0.3, 0.03, 0.18, 0xc81a1a, { y: 1.91, z: 0.24, parent: runner });
		const crowd = [runner];
		for (let i = 0; i < 9; i++) crowd.push(k.person({ x: -2 + r() * 4, y: 0.4, z: M + 156 - i * 1.6 - r(), pose: "run", s: 0.95, colors: { shirt: [0xd84a3a, 0x3a7ac8, 0xf0f0f0, 0x5aa05a, 0xe8c040][i % 5], legs: 0x3a3a4a, hair: [0x2a1a10, 0xc8a050, 0x6a4a2a][i % 3] }, from: 4 }));
		k.tick((t) => crowd.forEach((p, i) => {
			const l = p.userData.limbs;
			const w = Math.sin(t * 9 + i * 1.3);
			l.legL.rotation.x = w * 0.7;
			l.legR.rotation.x = -w * 0.7;
			l.armL.rotation.x = -w * 0.8;
			l.armR.rotation.x = w * 0.8;
		}));
		// A White House reception: a table of empty soda bottles.
		const Dx = 600;
		const recep = k.group({ x: Dx });
		k.box(14, 0.2, 14, 0x8a2a2a, { y: -0.1, parent: recep });
		k.box(14, 5, 0.2, 0xf0ead8, { y: 2.5, z: -3, parent: recep });
		k.box(14, 1, 0.24, 0xe0d8c0, { y: 0.5, z: -2.96, parent: recep });
		for (let i = 0; i < 4; i++) k.box(0.3, 5, 0.3, 0xf8f4e8, { x: -4.5 + i * 3, y: 2.5, z: -2.85, parent: recep });
		k.box(3, 0.08, 1.2, 0xfafaf6, { y: 0.9, z: -1, parent: recep });
		k.box(3.04, 0.4, 1.24, 0xfafaf6, { y: 0.7, z: -1, parent: recep, opacity: 0.95 });
		[-1.3, 1.3].forEach((x) => [-0.5, 0.5].forEach((z) => k.box(0.06, 0.9, 0.06, 0x6a4a2a, { x, y: 0.45, z: z - 1, parent: recep })));
		const bottle = (x, z, lying) => {
			const g = k.group({ x, y: lying ? 0.98 : 0.94, z, rz: lying ? PI / 2 : 0, ry: lying ? r() * 3 : 0, parent: recep });
			const glass = k.mat(0x3a1a12, { rough: 0.15, opacity: 0.85 });
			k.cyl(0.045, 0.045, 0.18, glass, { y: 0.09, parent: g });
			k.cyl(0.018, 0.045, 0.08, glass, { y: 0.22, parent: g });
			k.cyl(0.016, 0.016, 0.04, glass, { y: 0.28, parent: g });
			k.cyl(0.047, 0.047, 0.07, 0x7a1424, { y: 0.1, parent: g });
			k.cyl(0.048, 0.048, 0.015, 0xf0f0f0, { y: 0.1, parent: g });
		};
		for (let i = 0; i < 15; i++) bottle(-0.9 + (i % 5) * 0.2 + (Math.floor(i / 5) % 2) * 0.1, -1.25 + Math.floor(i / 5) * 0.18, false);
		bottle(0.35, -0.75, true);
		bottle(0.6, -1.0, true);
		k.cyl(0.02, 0.02, 0.01, 0xc8a040, { x: Dx + 0.2, y: 0.945, z: -0.6, metal: 0.8 });
		k.cyl(0.02, 0.02, 0.01, 0xc8a040, { x: Dx + 0.28, y: 0.945, z: -0.68, metal: 0.8 });
		k.point(0xfff4e0, 8, 10, { x: Dx + 1, y: 3, z: 1.5 });
		k.point(0xfff0d8, 4, 10, { x: Dx - 2, y: 3, z: 0 });
		return {
			shots: [
				{ pos: [Dx + 0.9, 1.35, 0.4], look: [Dx - 0.1, 0.95, -1.1], fov: 42, fog: [0xe8e0cc, 6, 30] },
				{ pos: [S + 10, 3.5, 10], look: [S, 2.5, 0], fov: 45 },
				{ pos: [-14, 2.2, 22], look: [0, 1, 0], fov: 50 },
				{ pos: [P + 2.4, 1.7, 2.2], look: [P - 0.4, 1.0, 0], fov: 50 },
				{ pos: [1, 1.5, M + 164.5], look: [0, 4, M + 120], fov: 55 },
				{ pos: [0.5, 1.3, 3.8], look: [0.2, 1.0, 0], fov: 45 },
			],
		};
	},
	r31: (k) => {
		k.fog(0x141814, 8, 60);
		k.light({ sky: 0xd8e0d0, ground: 0x2a2a24, hemi: 1.0, sun: false });
		const r = rng(31);
		const bricks = k.canvas(256, 256, (g) => {
			g.fillStyle = "#4a4e44";
			g.fillRect(0, 0, 256, 256);
			for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
				const v = 80 + Math.floor(Math.random() * 30);
				g.fillStyle = `rgb(${v},${v + 6},${v - 6})`;
				g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28);
			}
		});
		bricks.wrapS = bricks.wrapT = k.THREE.RepeatWrapping;
		bricks.repeat.set(12, 2);
		const wall = k.mat(0xffffff, { map: bricks });
		// The corridor down to the last cell.
		k.box(8, 0.2, 44, 0x3a3a34, { y: -0.1, z: -14 });
		k.box(8, 0.2, 44, 0x2a2a26, { y: 4.1, z: -14 });
		k.box(0.3, 4, 31, wall, { x: -4, y: 2, z: -7.5 });
		k.box(0.3, 4, 7, wall, { x: -4, y: 2, z: -32.5 });
		k.box(0.3, 4, 44, wall, { x: 4, y: 2, z: -14 });
		k.box(8, 4, 0.3, wall, { y: 2, z: -36 });
		for (let i = 0; i < 4; i++) {
			const z = 4 - i * 8;
			k.point(0xe8f0d8, 6, 10, { y: 3.6, z });
			k.box(0.6, 0.1, 0.3, 0xf0f8e0, { y: 4, z, emissive: 0xe8f0d8, glow: 1, shadow: false });
			for (let b = 0; b < 12; b++) k.cyl(0.03, 0.03, 4, 0x2a2a2a, { x: 2.2, y: 2, z: z - 1 - b * 0.35, metal: 0.6 });
		}
		// The cell: glass front, a cot, sketches on the wall, and him.
		const C = { x: -3.9, z: -26 };
		k.box(0.1, 4, 6, 0xc8dce0, { x: C.x + 0.15, y: 2, z: C.z, opacity: 0.18, rough: 0.05 });
		for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) k.cyl(0.02, 0.02, 0.12, 0x101010, { x: C.x + 0.2, y: 1.3 + j * 0.25, z: C.z - 1.2 + i * 0.6, rz: PI / 2 });
		k.box(6, 4, 0.3, wall, { x: C.x - 3, y: 2, z: C.z - 3 });
		k.box(6, 4, 0.3, wall, { x: C.x - 3, y: 2, z: C.z + 3 });
		k.box(0.3, 4, 6, 0xe8e4d8, { x: C.x - 6, y: 2, z: C.z });
		k.box(6, 0.2, 6, 0xb8b4a8, { x: C.x - 3, y: 0.02, z: C.z });
		k.box(1, 0.5, 2.2, 0xd8d4c8, { x: C.x - 5.3, y: 0.25, z: C.z + 1.6 });
		k.box(1.4, 0.8, 0.8, 0x8a8a84, { x: C.x - 5.2, y: 0.4, z: C.z - 2.2 });
		const sketch = k.canvas(256, 256, (g) => {
			g.fillStyle = "#f4f0e4";
			g.fillRect(0, 0, 256, 256);
			g.strokeStyle = "#5a5a58";
			g.lineWidth = 2;
			g.beginPath();
			g.arc(128, 150, 70, PI, 0);
			g.stroke();
			for (let i = 0; i < 9; i++) {
				g.beginPath();
				g.moveTo(58 + i * 17, 150);
				g.lineTo(80 + i * 12, 82);
				g.stroke();
			}
			g.strokeRect(40, 150, 176, 70);
			for (let i = 0; i < 8; i++) g.strokeRect(50 + i * 21, 170, 12, 30);
		});
		for (let i = 0; i < 6; i++) k.plane(0.7, 0.9, k.mat(0xffffff, { map: sketch }), { x: C.x - 5.84, y: 1.6 + (i % 2) * 1.1, z: C.z - 2 + Math.floor(i / 2) * 1.2, ry: PI / 2, rz: (r() - 0.5) * 0.1 });
		k.point(0xfff8e8, 14, 12, { x: C.x - 2, y: 3.6, z: C.z });
		k.point(0xf0f4e8, 8, 8, { x: C.x + 1.5, y: 2.6, z: C.z + 0.5 });
		k.spot(0xffffff, 30, { x: C.x - 2.5, y: 3.9, z: C.z, target: [C.x - 1.5, 1.4, C.z], angle: 0.6, distance: 10 });
		const jump = { shirt: 0xf4f2ea, legs: 0xf4f2ea, skin: 0xe0c0a8, hair: 0x4a3a2c, shoes: 0xd8d4c8 };
		const lec = k.person({ x: C.x - 1.4, y: 0, z: C.z, ry: PI / 2, hair: false, colors: jump, sleeves: 0xf4f2ea, from: 3 });
		k.sphere(0.205, 0x3a2e24, { y: 1.8, z: -0.04, s: [1, 0.85, 1], parent: lec });
		[-0.07, 0.07].forEach((x) => k.sphere(0.022, 0x5a8aaa, { x, y: 1.77, z: 0.18, parent: lec }));
		[-3, 3].forEach((dz) => k.box(0.2, 4, 0.2, 0x5a5a58, { x: C.x + 0.15, y: 2, z: C.z + dz, metal: 0.6 }));
		k.box(0.2, 0.2, 6, 0x5a5a58, { x: C.x + 0.15, y: 3.9, z: C.z, metal: 0.6 });
		// The mask and the trolley, in a hangar.
		const H = 300;
		k.box(40, 0.2, 40, 0x5a5a5a, { x: H, y: -0.1 });
		k.box(40, 14, 0.4, 0x3a4048, { x: H, y: 7, z: -10 });
		for (let i = 0; i < 5; i++) k.glow(0xfff8e0, 2, { x: H - 8 + i * 4, y: 10, z: -8 });
		const dolly = k.group({ x: H, z: 0, rx: -0.12 });
		k.box(0.1, 2.2, 0.1, 0x3a3a3a, { x: -0.38, y: 1.1, z: -0.25, parent: dolly, metal: 0.6 });
		k.box(0.1, 2.2, 0.1, 0x3a3a3a, { x: 0.38, y: 1.1, z: -0.25, parent: dolly, metal: 0.6 });
		k.box(0.9, 0.06, 0.4, 0x3a3a3a, { y: 0.06, z: 0.05, parent: dolly });
		[-0.45, 0.45].forEach((x) => k.cyl(0.18, 0.18, 0.1, 0x111111, { x, y: 0.18, z: -0.25, rz: PI / 2, parent: dolly }));
		for (let i = 0; i < 4; i++) k.box(0.9, 0.08, 0.36, 0x6a4a2a, { y: 0.5 + i * 0.45, z: 0.0, parent: dolly });
		const doc = k.person({ y: 0.1, z: 0.0, hair: false, colors: { ...jump, shirt: 0xf0ece4 }, sleeves: 0xf0ece4, parent: dolly });
		doc.userData.limbs.armL.rotation.set(-0.3, 0, 0.7);
		doc.userData.limbs.armR.rotation.set(-0.3, 0, -0.7);
		const head = doc.userData.limbs.head;
		k.box(0.3, 0.2, 0.08, 0xe8e4dc, { y: -0.06, z: 0.18, parent: head });
		for (let i = 0; i < 5; i++) k.box(0.02, 0.18, 0.03, 0x2a2a2a, { x: -0.1 + i * 0.05, y: -0.06, z: 0.225, parent: head });
		k.box(0.32, 0.03, 0.04, 0x2a2a2a, { y: 0.03, z: 0.22, parent: head });
		[-0.07, 0.07].forEach((x) => k.sphere(0.025, 0x3a6a8a, { x, y: 0.06, z: 0.185, parent: head }));
		[-1, 1].forEach((s) => k.box(0.03, 0.03, 0.4, 0x6a4a2a, { x: s * 0.2, y: 0, z: 0, parent: head }));
		[1.3].forEach((x) => k.person({ x: H + x, z: -0.4, ry: -x * 0.2, colors: { shirt: 0x2a3a5a, legs: 0x2a3a5a }, hat: 0x2a3a5a }));
		k.spot(0xffffff, 40, { x: H + 2, y: 6, z: 5, target: [H, 1.5, 0], angle: 0.4, distance: 16 });
		k.point(0xd8e0ff, 4, 20, { x: H - 3, y: 4, z: 4 });
		// The well in the cellar.
		const W = -300;
		[[-4.7, 0, 6.6, 16], [4.7, 0, 6.6, 16], [0, -4.7, 2.8, 6.6], [0, 4.7, 2.8, 6.6]].forEach(([x, z, w, d]) => k.box(w, 0.2, d, 0x4a3a2a, { x: W + x, y: -0.1, z }));
		k.box(16, 6, 0.3, 0x3a3228, { x: W, y: 3, z: -5 });
		k.cyl(1.4, 1.4, 0.6, 0x7a7468, { x: W, y: 0.3, open: true, side: k.THREE.DoubleSide, seg: 16 });
		k.torus(1.4, 0.12, 0x8a8478, { x: W, y: 0.6, rx: PI / 2, seg: 24 });
		k.cyl(1.32, 1.32, 4, 0x2a2620, { x: W, y: -2, open: true, side: k.THREE.BackSide, seg: 16 });
		k.box(2.6, 0.04, 2.6, 0x1a1612, { x: W, y: -3.6 });
		k.cyl(0.01, 0.01, 3.4, 0xc8b898, { x: W + 0.2, y: -0.4, z: 0.1 });
		const bucket = k.group({ x: W + 0.2, y: -2.2, z: 0.1, rz: 0.05 });
		k.cyl(0.22, 0.17, 0.32, 0xd8d0c0, { parent: bucket, open: true, side: k.THREE.DoubleSide });
		k.torus(0.2, 0.01, 0xa0a0a0, { y: 0.2, parent: bucket, ry: PI / 2, arc: PI });
		k.tick((t) => (bucket.position.y = -2.2 + Math.sin(t * 0.6) * 0.2));
		k.spot(0xf0e0b0, 30, { x: W + 1, y: 6, z: 1, target: [W, -2, 0], angle: 0.35, distance: 16 });
		k.glow(0xffe0a0, 1.2, { x: W + 3, y: 4.5, z: -4.7 });
		k.point(0xffd8a0, 4, 10, { x: W + 3, y: 4, z: -4 });
		// The moth.
		const T = -600;
		k.box(6, 0.2, 6, 0x2a2420, { x: T, y: -0.1 });
		const wingTex = k.canvas(128, 128, (g) => {
			const grad = g.createLinearGradient(0, 0, 128, 128);
			grad.addColorStop(0, "#3a2a1e");
			grad.addColorStop(0.5, "#6a4a30");
			grad.addColorStop(1, "#2a1e16");
			g.fillStyle = grad;
			g.fillRect(0, 0, 128, 128);
			g.strokeStyle = "#c8a878";
			g.lineWidth = 2;
			for (let i = 0; i < 6; i++) {
				g.beginPath();
				g.moveTo(0, 20 + i * 18);
				g.bezierCurveTo(40, 10 + i * 20, 80, 30 + i * 16, 128, 20 + i * 18);
				g.stroke();
			}
		});
		const skull = k.canvas(128, 128, (g) => {
			g.fillStyle = "#1a1410";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#e8d098";
			g.beginPath();
			g.ellipse(64, 56, 36, 38, 0, 0, PI * 2);
			g.fill();
			g.fillRect(44, 80, 40, 22);
			g.fillStyle = "#1a1410";
			g.beginPath();
			g.ellipse(50, 56, 11, 13, 0, 0, PI * 2);
			g.ellipse(78, 56, 11, 13, 0, 0, PI * 2);
			g.fill();
			g.beginPath();
			g.moveTo(64, 70);
			g.lineTo(58, 82);
			g.lineTo(70, 82);
			g.fill();
			for (let i = 0; i < 4; i++) g.fillRect(48 + i * 9, 92, 3, 10);
		});
		const moth = k.group({ x: T, y: 0.05, ry: 0.3 });
		const wing = k.mat(0xffffff, { map: wingTex, side: k.THREE.DoubleSide });
		[-1, 1].forEach((s) => {
			k.mesh(new k.THREE.CircleGeometry(0.5, 3), wing, { x: s * 0.42, y: 0.04, z: 0.05, rx: -PI / 2, rz: s > 0 ? -0.5 : PI + 0.5, s: [1.3, 0.55, 1], parent: moth });
			k.mesh(new k.THREE.CircleGeometry(0.3, 5), k.mat(0xc89a3a, { side: k.THREE.DoubleSide }), { x: s * 0.24, y: 0.03, z: -0.22, rx: -PI / 2, s: [1, 0.7, 1], parent: moth });
		});
		k.capsule(0.11, 0.35, 0x3a2a1c, { rx: PI / 2, y: 0.08, parent: moth });
		for (let i = 0; i < 4; i++) k.torus(0.1 - i * 0.012, 0.025, i % 2 ? 0x1a1410 : 0xe8b830, { z: -0.12 - i * 0.08, y: 0.08, parent: moth });
		k.plane(0.22, 0.22, k.mat(0xffffff, { map: skull }), { y: 0.2, z: 0.12, rx: -PI / 2, parent: moth });
		k.sphere(0.08, 0x2a1e14, { z: 0.32, y: 0.08, parent: moth });
		k.spot(0xfff0d8, 25, { x: T + 1, y: 4, z: 1.5, target: [T, 0, 0], angle: 0.35, distance: 10 });
		// Quantico: a run through the autumn woods.
		const Q = 600;
		k.ground(220, 0x6a5a30, { x: Q, bump: 0.8, seg: 30 });
		k.box(3, 0.05, 200, 0x8a7050, { x: Q, y: 0.2, z: -40 });
		const leaves = [0xd86a1a, 0xe8a030, 0xb83a1a, 0x8a9a3a, 0xc8801a];
		for (let i = 0; i < 90; i++) {
			const x = Q + (r() < 0.5 ? -1 : 1) * (3 + r() * 40);
			const z = 10 - r() * 120;
			const h = 8 + r() * 6;
			k.cyl(0.2, 0.3, h, 0x3a2a1c, { x, y: h / 2, z });
			k.sphere(2 + r() * 1.5, leaves[i % 5], { x, y: h, z, seg: 7, rings: 5, s: [1, 1.3, 1] });
		}
		k.particles(300, 0xe8a030, { x: Q, z: -10, box: [20, 10, 30], speed: 0.8, size: 0.12, drift: 1 });
		const fbi = k.person({ x: Q + 0.3, y: 0.2, z: -6, pose: "run", colors: { shirt: 0x8a8a8a, legs: 0x5a5a62, skin: 0xe8c0a0, hair: 0x6a4a2a, shoes: 0xf0f0f0 } });
		k.tick((t) => {
			const l = fbi.userData.limbs;
			const w = Math.sin(t * 9);
			l.legL.rotation.x = w * 0.7;
			l.legR.rotation.x = -w * 0.7;
			l.armL.rotation.x = -w * 0.8;
			l.armR.rotation.x = w * 0.8;
		});
		k.point(0xfff0d0, 20, 40, { x: Q, y: 10, z: 0 });
		return {
			shots: [
				{ pos: [C.x - 4.3, 2.0, C.z - 0.2], look: [C.x - 5.84, 2.05, C.z - 0.85], fov: 45, fog: [0x2a2a26, 4, 30], exposure: 1.15 },
				{ pos: [Q + 1.5, 1.6, 2], look: [Q, 1.6, -12], fov: 50, fog: [0xd8c8a8, 15, 90], exposure: 1.15 },
				{ pos: [W + 0.6, 2.4, 1.2], look: [W, -1.5, 0], fov: 50, fog: [0x14100c, 2, 30], exposure: 1.3 },
				{ pos: [-0.6, 1.75, C.z], look: [C.x - 1.4, 1.6, C.z], fov: 45, exposure: 1.2 },
				{ pos: [T + 0.15, 1.0, 0.75], look: [T, 0.05, 0.05], fov: 45, fog: [0x0e0a08, 1, 20] },
				{ pos: [H + 0.7, 1.95, 1.7], look: [H, 1.72, 0], fov: 40, fog: [0x2a3038, 10, 60] },
			],
		};
	},
	r32: (k) => {
		k.fog(0x16243a, 40, 380);
		k.sky(0x0a1428, 0x2a3a5a);
		k.stars(1200);
		k.light({ sky: 0x9ab8e8, ground: 0x1a2030, hemi: 1.3, sunColor: 0xc8d8ff, sunIntensity: 1.4, sunPos: [-40, 50, -60], shadowSize: 40 });
		const r = rng(32);
		k.water(500, 0x1a3a5a, { seg: 60, amp: 0.35 });
		k.disc(0xf4f0e0, 40, { x: -120, y: 90, z: -300 });
		k.glow(0xc8d8ff, 160, { x: -120, y: 90, z: -310, opacity: 0.5 });
		const wood = 0x2a1e18;
		const ship = k.group({ x: 0, y: 0, z: 0 });
		k.box(7, 4, 26, wood, { y: 0.8, parent: ship });
		k.box(7.2, 0.4, 26.2, 0x3a2a20, { y: 2.9, parent: ship });
		k.cone(3.5, 8, wood, { y: 1, z: 17, rx: PI / 2, s: [1, 1, 0.55], seg: 4, ry: PI / 4, parent: ship });
		k.box(7, 3, 6, wood, { y: 4.2, z: -10, parent: ship });
		k.box(7.4, 0.3, 6.4, 0x3a2a20, { y: 5.8, z: -10, parent: ship });
		for (let i = 0; i < 6; i++) k.box(0.05, 0.5, 0.6, 0xffc060, { x: 3.53, y: 4.4, z: -12.5 + i, emissive: 0xffa040, glow: 1.2, parent: ship });
		k.box(5, 0.6, 0.1, 0xffc060, { y: 4.4, z: -13.05, emissive: 0xffa040, glow: 1.2, parent: ship });
		for (let i = 0; i < 9; i++) k.box(0.1, 0.8, 0.1, 0x3a2a20, { x: 3.4, y: 3.3, z: -6 + i * 2.2, parent: ship });
		for (let i = 0; i < 9; i++) k.box(0.1, 0.8, 0.1, 0x3a2a20, { x: -3.4, y: 3.3, z: -6 + i * 2.2, parent: ship });
		k.box(0.08, 0.08, 20, 0x3a2a20, { x: 3.4, y: 3.7, z: 3, parent: ship });
		k.box(0.08, 0.08, 20, 0x3a2a20, { x: -3.4, y: 3.7, z: 3, parent: ship });
		const sail = k.mat(0x1a1a1e, { side: k.THREE.DoubleSide, opacity: 0.92 });
		[[6, 22], [-2, 24], [-12.4, 17]].forEach(([z, h]) => {
			k.cyl(0.25, 0.3, h, 0x3a2a20, { y: 3 + h / 2, z, parent: ship });
			for (let j = 0; j < 3; j++) {
				const y = 7 + j * (h / 3.4);
				const w = 9 - j * 1.8;
				k.box(w + 1, 0.15, 0.15, 0x3a2a20, { y: y + h / 4.2, z, parent: ship });
				k.plane(w, h / 4, sail, { y: y + h / 8.4, z: z + 0.2, rx: 0.06, parent: ship, wseg: 4, hseg: 3 });
			}
		});
		k.cyl(0.12, 0.14, 8, 0x3a2a20, { y: 3, z: 19, rx: -1.1, parent: ship });
		const roger = k.canvas(256, 160, (g) => {
			g.fillStyle = "#0a0a0a";
			g.fillRect(0, 0, 256, 160);
			g.fillStyle = "#f0ece0";
			g.beginPath();
			g.ellipse(128, 62, 30, 34, 0, 0, PI * 2);
			g.fill();
			g.fillRect(110, 82, 36, 20);
			g.fillStyle = "#0a0a0a";
			g.beginPath();
			g.ellipse(115, 60, 9, 11, 0, 0, PI * 2);
			g.ellipse(141, 60, 9, 11, 0, 0, PI * 2);
			g.fill();
			g.strokeStyle = "#f0ece0";
			g.lineWidth = 9;
			g.beginPath();
			g.moveTo(60, 140);
			g.lineTo(196, 110);
			g.moveTo(60, 110);
			g.lineTo(196, 140);
			g.stroke();
		});
		const flag = k.plane(4, 2.5, k.mat(0xffffff, { map: roger, side: k.THREE.DoubleSide }), { x: 0, y: 28.6, z: -4.1, ry: PI / 2, parent: ship, wseg: 6 });
		k.tick((t) => (flag.rotation.z = Math.sin(t * 2) * 0.05));
		k.point(0xffb060, 10, 20, { y: 7, z: -10, parent: ship });
		k.point(0xc8d8ff, 20, 60, { x: 18, y: 18, z: 10 });
		// Bones on deck in the moonlight.
		const bone = 0xe8e0c8;
		const skel = (o) => {
			const g = k.group(o);
			const b = { emissive: 0x404858, glow: 0.6 };
			k.sphere(0.2, bone, { y: 1.78, s: [1, 1.1, 1.05], parent: g, ...b });
			k.box(0.22, 0.1, 0.16, bone, { y: 1.6, z: 0.04, parent: g, ...b });
			[-0.07, 0.07].forEach((x) => k.sphere(0.055, 0x050505, { x, y: 1.8, z: 0.16, parent: g }));
			k.cyl(0.04, 0.04, 0.8, bone, { y: 1.2, parent: g, ...b });
			for (let i = 0; i < 4; i++) k.torus(0.17 - i * 0.015, 0.02, bone, { y: 1.45 - i * 0.1, rx: PI / 2, parent: g, ...b });
			k.box(0.36, 0.12, 0.16, bone, { y: 0.85, parent: g, ...b });
			[-1, 1].forEach((s) => {
				k.cyl(0.035, 0.035, 0.85, bone, { x: s * 0.12, y: 0.42, parent: g, ...b });
				k.cyl(0.03, 0.03, 0.65, bone, { x: s * 0.3, y: 1.25, z: 0.12, rx: -0.5, rz: s * 0.25, parent: g, ...b });
			});
			k.box(0.42, 0.3, 0.2, 0x3a2a2a, { y: 1.05, parent: g, opacity: 0.85 });
			k.box(0.04, 0.9, 0.02, 0xc8c8cc, { x: 0.36, y: 1.3, z: 0.55, rx: -0.9, parent: g, metal: 0.8 });
			return g;
		};
		[[1.5, -1, 0.4], [-1.2, 1.5, -0.3], [2.2, 3.5, 2.6], [-2, -3.5, 0.8], [0.2, 5, -2.8]].forEach(([x, z, ry]) => skel({ x, y: 3.0, z, ry, parent: ship, from: 4 }));
		// The captain at the helm.
		const jack = k.person({ x: 0, y: 5.95, z: -10.8, ry: 0, coat: 0x4a3020, colors: { shirt: 0xe8e0cc, legs: 0x3a2a20, skin: 0xc8946a, hair: 0x1a120a, shoes: 0x2a1a10 }, parent: ship, from: 5 });
		const jh = jack.userData.limbs.head;
		k.cyl(0.24, 0.24, 0.1, 0xb8201a, { y: 0.07, parent: jh });
		const hat = k.group({ y: 0.2, parent: jh });
		k.cyl(0.42, 0.42, 0.08, 0x3a2418, { seg: 3, ry: PI / 6, parent: hat });
		k.cyl(0.22, 0.25, 0.22, 0x3a2418, { y: 0.12, parent: hat });
		for (let i = 0; i < 9; i++) {
			const a = PI * 0.15 + (i / 8) * PI * 0.7;
			k.capsule(0.03, 0.4, 0x1a120a, { x: Math.cos(a) * 0.19, y: -0.25, z: -Math.sin(a) * 0.19, parent: jh });
		}
		k.box(0.06, 0.18, 0.04, 0x1a120a, { y: -0.24, z: 0.18, parent: jh });
		k.box(0.14, 0.12, 0.08, 0xa02020, { y: 1.0, z: 0.0, parent: jack });
		const helm = k.group({ x: 0, y: 6.9, z: -9.9, parent: ship, from: 5 });
		k.cyl(0.06, 0.06, 5, 0x3a2a20, { x: 2, y: 8, z: -12.6, parent: ship });
		const flag2 = k.plane(2.4, 1.5, k.mat(0xffffff, { map: roger, side: k.THREE.DoubleSide }), { x: 0.8, y: 9.8, z: -12.6, parent: ship, wseg: 6, from: 5 });
		k.tick((t) => (flag2.rotation.y = Math.sin(t * 2) * 0.15));
		k.torus(0.5, 0.05, 0x5a3a20, { parent: helm });
		for (let i = 0; i < 8; i++) k.box(0.04, 1.3, 0.04, 0x5a3a20, { rz: (i * PI) / 4, parent: helm });
		k.box(0.2, 1, 0.2, 0x3a2a20, { y: -0.6, z: -0.05, parent: helm });
		k.point(0xffc080, 8, 8, { x: 0.8, y: 8.4, z: -8, parent: ship, from: 5 });
		// The cave of cursed gold.
		const X = 300;
		k.ground(80, 0x3a3428, { x: X, bump: 0.6, seg: 20 });
		k.cyl(30, 30, 30, 0x2a2622, { x: X, y: 12, open: true, side: k.THREE.BackSide, seg: 14 });
		k.box(60, 1, 60, 0x2a2622, { x: X, y: 22 });
		for (let i = 0; i < 26; i++) k.cone(0.6 + r(), 3 + r() * 4, 0x4a4238, { x: X + (r() - 0.5) * 40, y: 20, z: (r() - 0.5) * 40, rx: PI, seg: 6 });
		const coinGeo = new k.THREE.CylinderGeometry(0.09, 0.09, 0.015, 10);
		const pile = [];
		for (let i = 0; i < 1400; i++) {
			const a = r() * PI * 2;
			const d = Math.sqrt(r()) * 3;
			pile.push([X + Math.cos(a) * d, Math.max(0.05, 1.1 - d * 0.36 + r() * 0.1), -3 + Math.sin(a) * d, (r() - 0.5) * 1.2, r() * 3, (r() - 0.5) * 1.2]);
		}
		inst(k, coinGeo, k.mat(0xe8b030, { metal: 1, rough: 0.3, emissive: 0x3a2400 }), pile);
		k.cone(3, 1.2, 0xc89020, { x: X, y: 0.5, z: -3, seg: 10, metal: 1, rough: 0.4, emissive: 0x3a2400 });
		const chest = k.group({ x: X + 0.6, y: 1, z: -2.6, ry: -0.3 });
		k.box(1.4, 0.7, 0.9, 0x5a3a20, { y: 0.35, parent: chest });
		k.box(1.45, 0.08, 0.95, 0xa8a8a8, { y: 0.55, parent: chest, metal: 0.8 });
		k.box(1.3, 0.2, 0.8, 0xe8b030, { y: 0.72, parent: chest, metal: 1, rough: 0.3, emissive: 0x3a2400 });
		const clid = k.group({ y: 0.7, z: -0.45, rx: -1.9, parent: chest });
		k.box(1.4, 0.15, 0.9, 0x5a3a20, { z: 0.45, parent: clid });
		for (let i = 0; i < 6; i++) k.sphere(0.07, [0xd81a2a, 0x1a8a4a, 0x2a5ad8][i % 3], { x: -0.5 + i * 0.2, y: 0.85, z: (r() - 0.5) * 0.4, parent: chest, rough: 0.1, emissive: 0x200808 });
		const coin = k.canvas(128, 128, (g) => {
			g.fillStyle = "#d8a030";
			g.fillRect(0, 0, 128, 128);
			g.strokeStyle = "#8a5a10";
			g.lineWidth = 5;
			g.beginPath();
			g.arc(64, 64, 56, 0, PI * 2);
			g.stroke();
			g.lineWidth = 3;
			for (let i = 0; i < 16; i++) {
				const a = (i / 16) * PI * 2;
				g.beginPath();
				g.moveTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44);
				g.lineTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52);
				g.stroke();
			}
			g.fillStyle = "#8a5a10";
			g.beginPath();
			g.ellipse(64, 58, 22, 24, 0, 0, PI * 2);
			g.fill();
			g.fillRect(52, 74, 24, 14);
			g.fillStyle = "#d8a030";
			g.beginPath();
			g.ellipse(56, 56, 6, 7, 0, 0, PI * 2);
			g.ellipse(72, 56, 6, 7, 0, 0, PI * 2);
			g.fill();
			for (let i = 0; i < 4; i++) g.fillRect(55 + i * 5, 80, 2, 8);
		});
		const medal = k.group({ x: X - 3, y: 0.32, z: 3, rz: 0.05 });
		k.cyl(0.25, 0.25, 0.04, k.mat(0xe8b030, { metal: 0.9, rough: 0.35 }), { parent: medal, seg: 24 });
		k.cyl(0.24, 0.24, 0.002, k.mat(0xffffff, { map: coin, metal: 0.6, rough: 0.4 }), { y: 0.021, parent: medal, seg: 24 });
		k.water(14, 0x14303a, { x: X - 6, y: 0.15, z: 5, amp: 0.03, seg: 10 });
		const shaft = new k.THREE.MeshBasicMaterial({ color: 0xc8d8ff, transparent: true, opacity: 0.1, depthWrite: false, blending: k.THREE.AdditiveBlending });
		k.mesh(new k.THREE.CylinderGeometry(1.5, 3.5, 22, 10, 1, true), shaft, { x: X - 0.5, y: 11, z: -2, rz: 0.15, shadow: false });
		k.spot(0xd8e4ff, 60, { x: X + 1, y: 20, z: -2, target: [X, 0, -2], angle: 0.3, distance: 30 });
		k.spot(0xd8e4ff, 30, { x: X - 3, y: 6, z: 4.5, target: [X - 3, 0.3, 3], angle: 0.3, distance: 10 });
		k.point(0xffb050, 10, 14, { x: X + 3, y: 3, z: 2 });
		k.point(0x6a8ab0, 6, 30, { x: X - 6, y: 6, z: 8 });
		// Port Royal by day: a dinghy sinking under its captain.
		const D = -400;
		const day = k.group({ x: D, from: 0, until: 3 });
		k.sky(0x3a90e0, 0xd8f0f8, { x: D, r: 300, tag: "daysky", from: 0, until: 3 });
		k.place(new k.THREE.HemisphereLight(0xffffff, 0x5a8a9a, 1.6), { from: 0, until: 3, tag: "daylight" });
		const sun = new k.THREE.DirectionalLight(0xfff4e0, 2.2);
		sun.position.set(D + 30, 50, 40);
		sun.target.position.set(D, 0, 0);
		k.place(sun, { x: D + 30, y: 50, z: 40, from: 0, until: 3, tag: "daylight" });
		k.scene.add(sun.target);
		k.water(280, 0x2a8ab0, { x: D, amp: 0.2, seg: 40, from: 0, until: 3 });
		k.ground(120, 0x6a9a4a, { x: D - 20, y: 0.5, z: -70, bump: 2, seg: 20, height: (x, z) => Math.max(-3, 6 - Math.hypot(x, z) * 0.15), from: 0, until: 3 });
		const fort = k.group({ x: -25, y: 5, z: -70, parent: day });
		k.box(30, 6, 10, 0xc8b898, { y: 3, parent: fort });
		k.box(8, 10, 8, 0xd8c8a8, { x: -12, y: 5, parent: fort });
		for (let i = 0; i < 7; i++) k.box(1.5, 1, 1.5, 0xc8b898, { x: -12 + i * 4, y: 6.5, z: 4.3, parent: fort });
		for (let i = 0; i < 5; i++) k.cyl(0.18, 0.2, 1.6, 0x2a2a2a, { x: -8 + i * 4, y: 5, z: 5.5, rx: PI / 2, parent: fort });
		k.cyl(0.05, 0.05, 6, 0xf0f0f0, { x: -12, y: 13, parent: fort });
		k.box(2, 1.2, 0.05, 0xc8202a, { x: -11, y: 15.2, parent: fort });
		k.box(14, 1.2, 3, 0x6a4a2a, { x: 10, y: 0.5, z: -10, parent: day });
		for (let i = 0; i < 6; i++) k.cyl(0.15, 0.15, 3, 0x4a3020, { x: 4 + i * 2.4, y: -0.5, z: -8.6, parent: day });
		const dinghy = k.group({ x: 2, y: -0.55, z: 0, ry: 0.4, rx: -0.1, parent: day, tag: "dinghy" });
		k.box(1.4, 0.6, 3.2, 0x8a6a40, { y: 0.1, parent: dinghy });
		k.cyl(0.07, 0.07, 4.2, 0x6a4a2a, { y: 2.3, parent: dinghy });
		k.plane(1.6, 2.2, k.mat(0xe8dcc0, { side: k.THREE.DoubleSide }), { y: 2.5, z: 0.06, parent: dinghy });
		const cap = k.person({ y: 4.4, s: 0.95, ry: -0.4, coat: 0x4a3020, colors: { shirt: 0xe8e0cc, legs: 0x3a2a20, skin: 0xc8946a, hair: 0x1a120a }, parent: dinghy });
		k.cyl(0.32, 0.32, 0.07, 0x3a2418, { y: 1.98, seg: 3, parent: cap });
		k.cyl(0.2, 0.22, 0.2, 0x3a2418, { y: 2.08, parent: cap });
		k.tick((t) => (dinghy.position.y = -0.55 + Math.sin(t * 0.9) * 0.08));
		return {
			shots: [
				{ pos: [D + 16, 3, 14], look: [D - 20, 6, -60], fov: 45, fog: [0xb8e0f0, 60, 280], exposure: 1.1, hide: ["sky", "stars", "dinghy"] },
				{ pos: [X - 5, 2.2, 6], look: [X, 1, -3], fov: 50, fog: [0x0a0e14, 6, 40], exposure: 1.6, hide: ["sky", "stars", "daylight"] },
				{ pos: [X - 2.7, 0.75, 3.35], look: [X - 3, 0.3, 3], fov: 40, fog: [0x0a0e14, 2, 30], exposure: 1.2, hide: ["sky", "stars", "daylight"] },
				{ pos: [D + 12, 1.6, 9], look: [D + 1, 3.5, -2], fov: 45, fog: [0xb8e0f0, 60, 280], exposure: 1.1, hide: ["sky", "stars"] },
				{ pos: [3.5, 4.5, 8], look: [0, 4, 0], fov: 55, exposure: 1.4, hide: ["stars"] },
				{ pos: [1.6, 8.3, -5.4], look: [0.2, 8.2, -11], fov: 45, exposure: 1.35, hide: ["stars"] },
			],
		};
	},
	r33: (k) => {
		k.fog(0x1a2440, 60, 420);
		k.sky(0x0a1024, 0x3a4a70);
		k.stars(1500);
		k.light({ sky: 0xa8b8e8, ground: 0x1a2030, hemi: 1.3, sunColor: 0xc8d4ff, sunIntensity: 1.2, sunPos: [60, 60, 40], shadowSize: 80 });
		const r = rng(33);
		// The castle on its crag above the black lake.
		k.water(500, 0x101c34, { seg: 50, amp: 0.2 });
		k.ground(500, 0x1e2a24, { y: 0.4, bump: 3, seg: 40, height: (x, z) => (z < -60 ? (-z - 60) * 0.4 : -2) + (Math.abs(x) > 120 ? (Math.abs(x) - 120) * 0.5 : 0) });
		k.cyl(28, 40, 26, 0x4a4a4c, { y: 13, z: -50, seg: 9, rough: 1 });
		k.cyl(22, 28, 10, 0x34342e, { x: -20, y: 5, z: -40, seg: 7 });
		for (let i = 0; i < 12; i++) k.ico(5 + r() * 6, 0x3a3a36, { x: -30 + r() * 60, y: 2 + r() * 8, z: -30 - r() * 30, rough: 1 });
		const castle = k.group({ y: 26, z: -50 });
		const stone = 0x8a8a90;
		const slate = 0x2a3448;
		const lit = k.mat(0xffc870, { emissive: 0xffa040, glow: 1.4 });
		const tower = (x, z, rad, h, roof = true) => {
			k.cyl(rad, rad * 1.05, h, stone, { x, y: h / 2, z, seg: 10, parent: castle });
			if (roof) k.cone(rad * 1.25, rad * 3, slate, { x, y: h + rad * 1.5, z, seg: 10, parent: castle });
			for (let i = 0; i < Math.floor(h / 4); i++) if (r() > 0.35) k.box(0.4, 0.8, 0.1, lit, { x: x + Math.sin(i) * 0.3, y: 2 + i * 4, z: z + rad + 0.02, parent: castle, shadow: false });
		};
		const hall = (x, z, w, h, d) => {
			k.box(w, h, d, stone, { x, y: h / 2, z, parent: castle });
			k.cyl(d * 0.72, d * 0.72, w, slate, { x, y: h + d * 0.18, z, rz: PI / 2, seg: 4, parent: castle, s: [1, 1, 0.7] });
			for (let i = 0; i < Math.floor(w / 2.4); i++) k.box(0.7, h * 0.5, 0.1, lit, { x: x - w / 2 + 1.4 + i * 2.4, y: h * 0.5, z: z + d / 2 + 0.03, parent: castle, shadow: false });
		};
		hall(-2, 6, 22, 9, 7);
		hall(14, -4, 14, 8, 6);
		hall(-16, -6, 12, 7, 6);
		tower(10, 8, 2.4, 16);
		tower(-14, 8, 2, 14);
		tower(4, -6, 3.2, 28);
		tower(-6, -12, 2.6, 22);
		tower(20, 6, 1.8, 12);
		tower(-22, 2, 2.2, 18);
		tower(16, -12, 2.4, 20);
		tower(-2, -18, 1.6, 30);
		tower(24, -6, 1.4, 22);
		k.box(40, 5, 3, stone, { y: 2.5, z: 14, parent: castle });
		k.point(0xffb060, 30, 80, { x: 0, y: 40, z: -20 });
		// Boats of first-years with lanterns.
		const boats = [];
		for (let i = 0; i < 9; i++) {
			const b = k.group({ x: -14 + (i % 3) * 6 + r() * 2, z: 30 + Math.floor(i / 3) * 6 + r() * 2, ry: r() * 0.3 });
			k.box(1, 0.4, 2.4, 0x4a3420, { y: 0.1, parent: b });
			k.cyl(0.03, 0.03, 1.4, 0x2a1a10, { y: 0.9, z: 1.1, parent: b });
			k.glow(0xffc060, 1.5, { y: 1.6, z: 1.1, parent: b });
			k.person({ s: 0.55, y: 0.2, z: -0.3, colors: { shirt: 0x111118, legs: 0x111118 }, parent: b });
			k.person({ s: 0.55, y: 0.2, z: 0.4, colors: { shirt: 0x111118, legs: 0x111118, hair: 0xa84a1a }, parent: b });
			boats.push(b);
		}
		k.tick((t) => boats.forEach((b, i) => (b.position.y = Math.sin(t + i) * 0.08)));
		k.point(0xffc060, 8, 30, { x: -8, y: 3, z: 36 });
		k.disc(0xf4f0e0, 26, { x: 150, y: 140, z: -380 });
		k.glow(0xc8d8ff, 110, { x: 150, y: 140, z: -390, opacity: 0.4 });
		// The hallway: a letter on the mat.
		const P = 300;
		const hallway = k.group({ x: P });
		k.box(8, 0.2, 10, 0x6a5040, { y: -0.1, parent: hallway });
		k.box(8, 5, 0.2, 0xe0d4b0, { y: 2.5, z: -3, parent: hallway });
		k.box(1.4, 2.4, 0.1, 0x6a3a2a, { y: 1.2, z: -2.85, parent: hallway });
		k.box(0.5, 0.08, 0.05, 0xc8a040, { y: 1.1, z: -2.78, parent: hallway, metal: 0.9 });
		k.box(1.2, 0.03, 0.7, 0x8a6a40, { y: 0.015, z: -2.2, parent: hallway });
		const ink = k.canvas(256, 160, (g) => {
			g.fillStyle = "#ecdfb8";
			g.fillRect(0, 0, 256, 160);
			g.strokeStyle = "#2a6a3a";
			g.lineWidth = 3;
			for (let i = 0; i < 4; i++) {
				g.beginPath();
				g.moveTo(70, 60 + i * 18);
				for (let x = 70; x < 70 + 120 - i * 18; x += 6) g.lineTo(x, 60 + i * 18 + Math.sin(x * 0.7) * 3);
				g.stroke();
			}
		});
		const env = (o) => {
			const e = k.group(o);
			k.box(0.36, 0.006, 0.24, k.mat(0xffffff, { map: ink }), { parent: e });
			return e;
		};
		env({ x: P + 0.1, y: 0.04, z: -2.1, ry: 0.3 });
		k.cyl(0.035, 0.035, 0.01, 0xa01818, { x: P + 0.06, y: 0.045, z: -2.06, rough: 0.4 });
		k.spot(0xfff0d0, 25, { x: P + 0.5, y: 3, z: 0, target: [P, 0, -2.1], angle: 0.4, distance: 8 });
		k.point(0xffe8c8, 4, 10, { x: P, y: 3, z: 2 });
		// The sitting room, where the letters pour down the chimney.
		const L = 360;
		k.box(10, 0.2, 10, 0x6a5040, { x: L, y: -0.1 });
		[-5, 5].forEach((x) => k.box(0.2, 5, 10, 0xd0c098, { x: L + x, y: 2.5, z: 2 }));
		k.box(10, 5, 0.2, 0xd8c8a0, { x: L, y: 2.5, z: -3 });
		k.box(3, 2, 0.6, 0xe8e4dc, { x: L, y: 1, z: -2.7 });
		k.box(1.6, 1.2, 0.3, 0x1a1210, { x: L, y: 0.7, z: -2.4 });
		k.box(3.4, 0.2, 0.8, 0xe8e4dc, { x: L, y: 2.1, z: -2.6 });
		k.box(2.4, 0.8, 1, 0x8a5a4a, { x: L - 3, y: 0.4, z: 1, ry: 0.6 });
		const flying = [];
		for (let i = 0; i < 70; i++) flying.push([env({ x: L, y: 1, z: -2, from: 2 }), r(), r(), r()]);
		k.tick((t) => flying.forEach(([e, a, b, c]) => {
			const p = (t * 0.2 + a) % 1;
			e.position.set(L + Math.sin(b * 20 + t) * (0.5 + p * 4), 0.6 + p * 4 + Math.sin(c * 9 + t * 2) * 0.3, -2.3 + p * (2 + c * 3));
			e.rotation.set(t * (b - 0.5) * 3, t * c * 2, a * 6 + t);
		}));
		k.point(0xffe8c8, 10, 14, { x: L + 1, y: 3.5, z: 2 });
		// King's Cross: a trolley vanishing into the brick, and the scarlet engine.
		const K = -300;
		const brick = k.canvas(128, 128, (g) => {
			g.fillStyle = "#c8c0b0";
			g.fillRect(0, 0, 128, 128);
			for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
				g.fillStyle = ["#8a3a28", "#9a4430", "#7a3020"][(x + y * 3 + 9) % 3];
				g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14);
			}
		});
		brick.wrapS = brick.wrapT = k.THREE.RepeatWrapping;
		brick.repeat.set(2, 3);
		k.box(40, 0.2, 14, 0x8a8478, { x: K, y: 0.9, z: 2 });
		k.box(40, 1, 10, 0x4a4440, { x: K, y: -0.5, z: -10 });
		k.box(2.4, 6, 1.6, k.mat(0xffffff, { map: brick }), { x: K, y: 4, z: 2 });
		k.box(2.4, 6, 1.6, k.mat(0xffffff, { map: brick }), { x: K - 10, y: 4, z: 2 });
		k.box(40, 0.6, 3, 0x6a6a70, { x: K, y: 7.2, z: 2 });
		k.box(40, 0.5, 30, 0x4a4a50, { x: K, y: 10, z: -4 });
		k.box(40, 10, 0.5, 0x6a5a50, { x: K, y: 5, z: 9 });
		k.box(40, 10, 0.5, 0x6a5a50, { x: K, y: 5, z: -16 });
		// A plain corner of the station: a bench, a bin, a clock.
		const bench = k.group({ x: K - 7.2, y: 1, z: 7.2, ry: 1.1 });
		k.box(2.2, 0.08, 0.5, 0x6a4a2a, { y: 0.5, parent: bench });
		k.box(2.2, 0.5, 0.06, 0x6a4a2a, { y: 0.8, z: -0.25, parent: bench });
		[-1, 1].forEach((x) => k.box(0.06, 0.5, 0.5, 0x2a3a2a, { x, y: 0.25, parent: bench }));
		k.cyl(0.25, 0.22, 0.8, 0x2a3a2a, { x: K - 12.5, y: 1.4, z: 7.2 });
		k.cyl(0.04, 0.04, 1.4, 0x2a2a2a, { x: K - 10, y: 6.3, z: 3.2 });
		k.cyl(0.45, 0.45, 0.15, 0x2a3a2a, { x: K - 10, y: 5.4, z: 3.2, rx: PI / 2, seg: 20 });
		k.cyl(0.4, 0.4, 0.16, 0xf4f0e0, { x: K - 10, y: 5.4, z: 3.2, rx: PI / 2, seg: 20, emissive: 0x302a20 });
		k.box(0.03, 0.3, 0.02, 0x1a1a1a, { x: K - 10, y: 5.5, z: 3.29 });
		k.box(0.22, 0.03, 0.02, 0x1a1a1a, { x: K - 9.92, y: 5.4, z: 3.29 });
		k.box(0.8, 0.6, 0.5, 0x5a3a28, { x: K - 9.2, y: 1.3, z: 6.2, ry: 0.3 });
		k.box(0.6, 0.4, 0.4, 0x3a4a6a, { x: K - 9.2, y: 1.8, z: 6.2, ry: 0.2 });
		const trolley = k.group({ x: K + 1.0, y: 1, z: 2.3, ry: PI / 2, from: 3 });
		k.box(0.7, 0.05, 1.1, 0x5a5a60, { y: 0.3, parent: trolley, metal: 0.7 });
		[-0.3, 0.3].forEach((x) => k.cyl(0.08, 0.08, 0.05, 0x111111, { x, y: 0.08, z: 0.4, rz: PI / 2, parent: trolley }));
		k.box(0.04, 1, 0.04, 0x5a5a60, { x: -0.33, y: 0.8, z: 0.55, parent: trolley, metal: 0.7 });
		k.box(0.04, 1, 0.04, 0x5a5a60, { x: 0.33, y: 0.8, z: 0.55, parent: trolley, metal: 0.7 });
		k.box(0.7, 0.04, 0.04, 0x5a5a60, { y: 1.3, z: 0.55, parent: trolley, metal: 0.7 });
		k.box(0.66, 0.4, 1.0, 0x6a3a1a, { y: 0.55, parent: trolley });
		k.box(0.68, 0.03, 1.02, 0xc8a040, { y: 0.7, parent: trolley, metal: 0.8 });
		const cage = k.group({ y: 1.0, z: 0.1, parent: trolley });
		k.box(0.4, 0.04, 0.4, 0x8a7a40, { parent: cage, metal: 0.8 });
		for (let i = 0; i < 10; i++) k.cyl(0.006, 0.006, 0.5, 0xb8a050, { x: Math.cos((i / 10) * PI * 2) * 0.18, y: 0.25, z: Math.sin((i / 10) * PI * 2) * 0.18, parent: cage, metal: 0.8 });
		k.sphere(0.19, 0xb8a050, { y: 0.5, s: [1, 0.4, 1], parent: cage, metal: 0.8, opacity: 0.6 });
		k.sphere(0.12, 0xfafaf8, { y: 0.16, s: [1, 1.3, 1], parent: cage });
		k.sphere(0.08, 0xfafaf8, { y: 0.34, parent: cage });
		[-0.03, 0.03].forEach((x) => k.sphere(0.018, 0xf0c020, { x, y: 0.35, z: -0.07, parent: cage, emissive: 0x806000 }));
		
		const engine = k.group({ x: K - 2, y: 0.2, z: -9, ry: PI / 2, from: 3 });
		const red = 0xa81818;
		k.box(2.4, 1, 10, 0x1a1a1a, { y: 1, parent: engine });
		k.cyl(1.2, 1.2, 7, red, { y: 2.6, z: 1.5, rx: PI / 2, parent: engine, seg: 16 });
		k.cyl(1.25, 1.25, 0.15, 0xd8b040, { y: 2.6, z: 5, rx: PI / 2, parent: engine, metal: 0.8 });
		k.cyl(0.35, 0.4, 1.4, 0x1a1a1a, { y: 4.3, z: 4, parent: engine });
		k.box(2.6, 3, 3, red, { y: 3, z: -3, parent: engine });
		k.box(2.8, 0.25, 3.4, 0x1a1a1a, { y: 4.6, z: -3, parent: engine });
		[-1, 1].forEach((s) => [-3.5, -1.5, 0.5, 2.5].forEach((z) => k.cyl(0.65, 0.65, 0.2, red, { x: s * 1.2, y: 0.7, z, rz: PI / 2, parent: engine })));
		k.box(2.6, 0.6, 1.2, red, { y: 0.8, z: 5.2, parent: engine });
		k.glow(0xfff0c0, 1, { y: 3.3, z: 5.2, parent: engine });
		for (let i = 0; i < 2; i++) {
			const car = k.group({ x: K - 15 - i * 12.5, y: 0.2, z: -9, ry: PI / 2, from: 3 });
			k.box(2.6, 3, 12, red, { y: 2.3, parent: car });
			k.box(2.8, 0.3, 12, 0x1a1a1a, { y: 3.9, parent: car });
			for (let w = 0; w < 6; w++) k.box(0.05, 0.9, 1.2, lit, { x: 1.32, y: 2.6, z: -5 + w * 2, parent: car });
		}
		const steam = [];
		for (let i = 0; i < 14; i++) steam.push(k.sphere(0.6 + r() * 0.6, 0xf0f0f4, { x: K + 2, y: 5, z: -9, opacity: 0.7, seg: 8, rings: 6, from: 3 }));
		k.tick((t) => steam.forEach((p, i) => {
			const q = (t * 0.2 + i / 14) % 1;
			p.position.set(K + 2 + q * 3, 5 + q * 6, -9 + Math.sin(i) * q * 2);
			p.scale.setScalar(0.5 + q * 2);
		}));
		k.point(0xfff0d8, 20, 30, { x: K, y: 6, z: 3 });
		k.point(0xfff0d8, 14, 30, { x: K - 10, y: 6, z: -4 });
		// The Great Hall: floating candles over the long tables.
		const G = 600;
		k.box(30, 0.2, 60, 0x5a4a3a, { x: G, y: -0.1 });
		[-15, 15].forEach((x) => k.box(0.6, 16, 60, 0x6a6460, { x: G + x, y: 8 }));
		k.box(30, 16, 0.6, 0x6a6460, { x: G, y: 8, z: -30 });
		k.box(30, 0.4, 60, 0x101834, { x: G, y: 16 });
		const ceil = [];
		for (let i = 0; i < 600; i++) ceil.push([G + (r() - 0.5) * 29, 15.7, (r() - 0.5) * 59, r() > 0.8 ? 0xffe8c0 : 0xd8e0ff]);
		dots(k, ceil, { size: 0.12, fog: false });
		[-9, -3, 3, 9].forEach((x) => {
			k.box(2, 0.12, 44, 0x5a3a20, { x: G + x, y: 0.95, z: 2 });
			[-1.4, 1.4].forEach((dx) => k.box(0.5, 0.5, 44, 0x4a3018, { x: G + x + dx, y: 0.25, z: 2 }));
			for (let i = 0; i < 18; i++) [-0.6, 0.6].forEach((dx) => k.cyl(0.18, 0.18, 0.03, 0xd8b040, { x: G + x + dx, y: 1.03, z: -18 + i * 2.4, metal: 0.9, rough: 0.3 }));
		});
		const banners = [0xb81a1a, 0x1a6a3a, 0xd8b020, 0x1a3a8a];
		[-9, -3, 3, 9].forEach((x, i) => k.box(1.8, 5, 0.05, banners[i], { x: G + x, y: 11, z: -29.6 }));
		k.box(24, 1, 2, 0x5a3a20, { x: G, y: 1.4, z: -26 });
		const kids = [];
		[-9, -3, 3, 9].forEach((x) => [-1.4, 1.4].forEach((dx) => { for (let i = 0; i < 14; i++) kids.push([G + x + dx, 0.95, -17 + i * 2.6 + r() * 0.6]); }));
		inst(k, new k.THREE.CapsuleGeometry(0.24, 0.5, 2, 6), 0x15151c, kids);
		inst(k, new k.THREE.SphereGeometry(0.17, 8, 6), 0xe8c4a0, kids.map(([x, y, z]) => [x, y + 0.65, z]));
		k.box(24, 0.6, 6, 0x4a3a2a, { x: G, y: 0.3, z: -26 });
		const candles = [];
		for (let i = 0; i < 110; i++) {
			const x = G + (r() - 0.5) * 26;
			const y = 7 + r() * 5;
			const z = -26 + r() * 52;
			candles.push([x, y, z]);
			k.glow(0xffd080, 0.8, { x, y: y + 0.3, z });
		}
		inst(k, new k.THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), k.mat(0xf8f0e0, { emissive: 0x806040, glow: 0.4 }), candles);
		k.point(0xffc070, 30, 50, { x: G, y: 10, z: 0, decay: 1 });
		k.point(0xffc070, 20, 40, { x: G, y: 10, z: -20, decay: 1 });
		for (let i = 0; i < 4; i++) [-14.6, 14.6].forEach((x) => k.box(0.1, 8, 2.4, 0x8aa0d0, { x: G + x, y: 8, z: -20 + i * 12, emissive: 0x2a3a6a, glow: 0.8 }));
		return {
			shots: [
				{ pos: [K - 2.5, 2.4, 8.2], look: [K - 10, 2.6, 3.5], fov: 50, fog: [0x6a6460, 10, 60], hide: ["sky", "stars"], exposure: 1.2 },
				{ pos: [P + 0.9, 1.5, 0.6], look: [P, 0.35, -2.2], fov: 45, fog: [0x2a2018, 3, 30], hide: ["sky", "stars"] },
				{ pos: [L + 1.5, 1.6, 4], look: [L, 1.8, -2], fov: 55, fog: [0x2a2018, 4, 30], hide: ["sky", "stars"] },
				{ pos: [K + 3.6, 2.1, 5.2], look: [K + 1.1, 1.6, 2.3], fov: 45, fog: [0x6a6460, 10, 60], hide: ["sky", "stars"], exposure: 1.2 },
				{ pos: [G, 3.5, 24], look: [G, 5, -20], fov: 55, fog: [0x1a1410, 30, 120], hide: ["sky", "stars"], exposure: 1.2 },
				{ pos: [5, 9, 34], look: [0, 40, -50], fov: 34, exposure: 1.4 },
			],
		};
	},
	r34: (k) => {
		k.fog(0x081828, 15, 160);
		k.sky(0x06122a, 0x1e4a6a);
		k.light({ sky: 0x6aa8d8, ground: 0x0a1a20, hemi: 1.1, sunColor: 0x8ac0ff, sunIntensity: 0.8, sunPos: [-20, 50, 30], shadowSize: 40 });
		const r = rng(34);
		k.ground(400, 0x10241e, { bump: 0.8, seg: 40 });
		const glowMat = (c, g = 1.5) => k.mat(c, { emissive: c, glow: g });
		// Bioluminescent undergrowth.
		const moss = [];
		for (let i = 0; i < 900; i++) {
			const a = r() * PI * 2;
			const d = 1 + Math.sqrt(r()) * 30;
			moss.push([Math.cos(a) * d, 0.05, Math.sin(a) * d, 0, r() * 6, 0, 0.6 + r()]);
		}
		inst(k, new k.THREE.IcosahedronGeometry(0.12, 0), glowMat(0x2ad8ff, 1), moss);
		const stalks = [];
		const tips = [];
		for (let i = 0; i < 260; i++) {
			const x = (r() - 0.5) * 60;
			const z = (r() - 0.5) * 60;
			if (Math.hypot(x, z) < 2.5) continue;
			const h = 0.5 + r() * 2;
			stalks.push([x, h / 2, z, (r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3, [1, h, 1]]);
			tips.push([x, h, z, 0, 0, 0, 0.8 + r() * 0.6]);
		}
		inst(k, new k.THREE.CylinderGeometry(0.03, 0.05, 1, 4), 0x1a3a3a, stalks);
		inst(k, new k.THREE.SphereGeometry(0.1, 6, 4), glowMat(0xd040ff, 1.8), tips);
		for (let i = 0; i < 40; i++) {
			const x = (r() - 0.5) * 50;
			const z = (r() - 0.5) * 50;
			if (Math.hypot(x, z) < 3) continue;
			const g = k.group({ x, z, ry: r() * 6 });
			for (let j = 0; j < 5; j++) k.cone(0.25, 1.6, glowMat(j % 2 ? 0x3af0c0 : 0x2ab0ff, 0.9), { y: 0.7, rz: (j - 2) * 0.35, rx: (r() - 0.5) * 0.4, s: [1, 1, 0.2], seg: 4, parent: g });
		}
		const mush = (x, z, s, c) => {
			k.cyl(0.08 * s, 0.12 * s, 1.2 * s, 0xd8e8f0, { x, y: 0.6 * s, z });
			k.sphere(0.5 * s, glowMat(c, 1.2), { x, y: 1.2 * s, z, s: [1, 0.4, 1] });
		};
		for (let i = 0; i < 18; i++) {
			const x = (r() - 0.5) * 40;
			const z = (r() - 0.5) * 40;
			if (Math.abs(x) < 4 && z > -12 && z < 4) continue;
			mush(x, z, 0.8 + r() * 1.6, [0x2ad8ff, 0xff5ad8, 0x8aff6a][i % 3]);
		}
		// Footprints that light up, right in front of the camera.
		for (let i = 0; i < 4; i++) k.sphere(0.22, glowMat(0x3ae0ff, 0.9), { x: 0.3 * (i % 2 ? 1 : -1), y: 0.02, z: 1.6 - i * 0.9, s: [0.7, 0.08, 1.3] });
		const trees = (n) => {
			for (let i = 0; i < n; i++) {
				const a = r() * PI * 2;
				const d = 14 + r() * 60;
				const x = Math.cos(a) * d;
				const z = Math.sin(a) * d - 10;
				if (Math.abs(x) < 30 && z < -14) continue;
				const h = 18 + r() * 14;
				k.cyl(0.8, 1.6, h, 0x1a2a28, { x, y: h / 2, z, seg: 7 });
				k.sphere(5 + r() * 3, 0x0e2a22, { x, y: h, z, s: [1.3, 0.6, 1.3], seg: 8, rings: 6 });
				for (let v = 0; v < 3; v++) k.cyl(0.05, 0.05, h * 0.7, glowMat(0x3ae0d0, 0.6), { x: x + (r() - 0.5) * 3, y: h * 0.6, z: z + (r() - 0.5) * 3 });
			}
		};
		trees(36);
		[[0, 2, 0, 0x2ad8ff], [6, 3, -6, 0xd040ff], [-6, 3, -4, 0x2ad8ff], [0, 4, -16, 0x3af0c0]].forEach(([x, y, z, c]) => k.point(c, 14, 20, { x, y, z }));
		// Woodsprites drifting.
		const sprites = [];
		for (let i = 0; i < 24; i++) {
			const g = k.group({ from: 3 });
			k.glow(0xf0f8ff, 0.7, { parent: g });
			for (let j = 0; j < 8; j++) k.cyl(0.004, 0.004, 0.5, glowMat(0xf0f8ff, 2), { x: Math.cos(j) * 0.08, y: -0.2, z: Math.sin(j) * 0.08, rz: Math.cos(j) * 0.3, rx: Math.sin(j) * 0.3, parent: g, shadow: false });
			k.sphere(0.18, glowMat(0xf8fcff, 1.5), { s: [1, 0.6, 1], parent: g });
			g.userData.o = [(r() - 0.5) * 8, 1 + r() * 3, -3 - r() * 8, r() * 6];
			sprites.push(g);
		}
		k.tick((t) => sprites.forEach((g) => {
			const [x, y, z, p] = g.userData.o;
			g.position.set(x + Math.sin(t * 0.3 + p) * 0.8, y + Math.sin(t * 0.5 + p * 2) * 0.4, z + Math.cos(t * 0.25 + p) * 0.8);
			g.rotation.y = t * 0.3 + p;
		}));
		// Hometree.
		const home = k.group({ x: 0, z: -110, from: 3 });
		k.cyl(16, 26, 140, 0x3a5a4a, { y: 70, seg: 9, parent: home, emissive: 0x1a4a3a });
		for (let i = 0; i < 9; i++) {
			const a = (i / 9) * PI * 2;
			k.cyl(3, 6, 50, 0x2a3a30, { x: Math.cos(a) * 26, y: 18, z: Math.sin(a) * 26, rz: Math.cos(a) * 0.7, rx: -Math.sin(a) * 0.7, seg: 6, parent: home });
		}
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * PI * 2;
			k.sphere(26, k.mat(0x2a5a3a, { emissive: 0x0a2a1a }), { x: Math.cos(a) * 26, y: 140 + (i % 2) * 14, z: Math.sin(a) * 26, s: [1.2, 0.5, 1.2], seg: 8, rings: 6, parent: home });
		}
		for (let i = 0; i < 40; i++) k.glow([0x2ad8ff, 0xd040ff, 0x8aff6a][i % 3], 8 + r() * 8, { x: (r() - 0.5) * 50, y: 10 + r() * 120, z: 24 + r() * 6, parent: home, opacity: 0.8 });
		k.point(0x3ad0ff, 120, 160, { x: 0, y: 40, z: -70, decay: 1, from: 3 });
		// The people.
		const navi = (o) => {
			const p = k.person({ s: 1.5, ...o, colors: { shirt: 0x3a7ac8, legs: 0x3a7ac8, skin: 0x4a8ad8, hair: 0x0a0a10, shoes: 0x3a7ac8 }, sleeves: 0x3a7ac8 });
			const h = p.userData.limbs.head;
			[-0.07, 0.07].forEach((x) => k.sphere(0.04, 0xffd040, { x, y: 0.03, z: 0.17, parent: h, emissive: 0xc89000, glow: 1.5 }));
			[-1, 1].forEach((s) => k.cone(0.06, 0.2, 0x4a8ad8, { x: s * 0.2, y: 0.08, rz: -s * 1.1, seg: 4, parent: h }));
			k.box(0.06, 0.12, 0.05, 0x3a7ac8, { y: -0.02, z: 0.2, parent: h });
			for (let i = 0; i < 5; i++) k.box(0.02, 0.05, 0.36, 0x2a5a98, { x: -0.1 + i * 0.05, y: 0.15, z: 0.0, parent: h });
			k.capsule(0.05, 0.9, 0x0a0a10, { y: -0.5, z: -0.2, rx: 0.15, parent: h });
			k.cone(0.06, 1.3, 0x3a7ac8, { y: 0.7, z: -0.4, rx: -2.3, parent: p, seg: 6 });
			k.box(0.52, 0.18, 0.3, 0x6a4a2a, { y: 0.8, parent: p });
			for (let i = 0; i < 6; i++) k.sphere(0.03, glowMat(0x9afcff, 2), { x: -0.2 + i * 0.08, y: 1.1 + (i % 2) * 0.12, z: 0.145, parent: p });
			return p;
		};
		const ney = navi({ x: -0.6, y: 0, z: -5, ry: 0.4, from: 5 });
		k.cyl(0.02, 0.02, 2.4, 0x6a4a2a, { x: 0.45, y: 1.3, z: 0.1, parent: ney });
		navi({ x: 0.6, y: 0, z: -5.2, ry: -0.4, from: 5, hair: true });
		k.point(0x6ad8ff, 10, 8, { x: 0, y: 3.5, z: -2, from: 5 });

		// The floating mountains, by day.
		const M = 500;
		k.sky(0x5aa0d8, 0xe0f0f0, { y: M, r: 400, tag: "daysky", from: 4, until: 4 });
		k.place(new k.THREE.HemisphereLight(0xe0f0ff, 0x3a5a3a, 1.6), { from: 4, until: 4 });
		const sun = new k.THREE.DirectionalLight(0xfff4e0, 2.2);
		sun.target.position.set(0, M, 0);
		k.place(sun, { x: 60, y: M + 80, z: 60, from: 4, until: 4 });
		k.scene.add(sun.target);
		const isle = (x, y, z, s) => {
			const g = k.group({ x, y: M + y, z, s, ry: r() * 6 });
			k.cone(10, 26, 0x6a6a60, { y: -13, rx: PI, seg: 7, parent: g, rough: 1 });
			k.cyl(10.5, 10, 4, 0x6a6a60, { y: 1, seg: 7, parent: g });
			k.sphere(10, 0x3a8a3a, { y: 3, s: [1.05, 0.35, 1.05], seg: 8, rings: 6, parent: g });
			for (let i = 0; i < 6; i++) k.sphere(2.5 + r() * 2, 0x2a7a32, { x: (r() - 0.5) * 12, y: 5 + r() * 2, z: (r() - 0.5) * 12, seg: 7, rings: 5, parent: g });
			for (let i = 0; i < 8; i++) k.cyl(0.08, 0.08, 10 + r() * 14, 0x2a5a2a, { x: Math.cos(i) * 9, y: -8, z: Math.sin(i) * 9, parent: g });
			k.box(1.6, 30, 0.2, 0xe8f4ff, { x: 7, y: -14, z: 7, ry: -0.8, parent: g, opacity: 0.7, emissive: 0x6080a0, glow: 0.3 });
		};
		isle(0, 0, -80, 1.6);
		isle(-60, 20, -140, 2.2);
		isle(55, -10, -120, 1.8);
		isle(-30, -30, -40, 1);
		isle(90, 30, -220, 2.6);
		isle(-120, -5, -220, 2.4);
		isle(30, 40, -30, 0.8);
		for (let i = 0; i < 30; i++) k.sphere(12 + r() * 10, 0xf0f4f4, { x: (r() - 0.5) * 400, y: M - 60 - r() * 20, z: -r() * 300, s: [1.8, 0.4, 1], seg: 8, rings: 6, opacity: 0.85 });
		const ikran = k.group({ x: 6, y: M + 4, z: -30, ry: 0.5, rz: -0.3, from: 4 });
		const bodyC = 0xd84a20;
		k.capsule(0.5, 3, bodyC, { rx: PI / 2, parent: ikran });
		k.cone(0.4, 1.8, 0xe8c040, { z: 2.6, rx: PI / 2, parent: ikran });
		k.cone(0.3, 3, bodyC, { z: -3, rx: -PI / 2, parent: ikran });
		[-1, 1].forEach((s) => {
			const wing = k.group({ x: s * 0.4, parent: ikran });
			k.mesh(new k.THREE.ConeGeometry(2.4, 6, 3), k.mat(0xe86a20, { side: k.THREE.DoubleSide }), { x: s * 3, rz: s * PI / 2, s: [1, 1, 0.08], rx: PI / 2, parent: wing });
			for (let i = 0; i < 4; i++) k.box(1.6, 0.04, 0.3, i % 2 ? 0x1a3a8a : 0xf0d040, { x: s * (1.6 + i * 1.1), y: 0.12, z: -0.4, parent: wing });
			wing.userData.s = s;
			k.tick((t) => (wing.rotation.z = s * Math.sin(t * 2.5) * 0.35));
		});
		const rider = navi({ y: 0.3, z: 0.4, s: 0.7, pose: "sit", parent: ikran });
		void rider;
		k.tick((t) => (ikran.position.y = M + 4 + Math.sin(t) * 0.6));
		// The base: an empty wheelchair by a locker, and the administrator's desk.
		const BX = -300;
		const base = k.group({ x: BX });
		k.box(14, 0.2, 12, 0x4a4e54, { y: -0.1, parent: base, metal: 0.4, rough: 0.5 });
		for (let i = 0; i < 7; i++) k.box(0.04, 0.01, 12, 0x2a2e34, { x: -6 + i * 2, y: 0.005, parent: base });
		k.box(14, 4, 0.2, 0x8a9096, { y: 2, z: -3, parent: base, metal: 0.3 });
		k.box(0.2, 4, 12, 0x7a8086, { x: -4, y: 2, parent: base, metal: 0.3 });
		k.box(14, 0.2, 12, 0x5a5e64, { y: 4, parent: base });
		for (let i = 0; i < 6; i++) k.box(0.05, 3.6, 0.08, 0x5a6066, { x: -3.5 + i * 1.6, y: 2, z: -2.88, parent: base });
		k.box(10, 0.3, 0.1, 0xe8a020, { y: 0.6, z: -2.88, parent: base });
		for (let i = 0; i < 3; i++) k.box(1.4, 0.06, 0.3, 0xf0f8ff, { x: -2 + i * 3, y: 3.88, z: -1, parent: base, emissive: 0xe0f0ff, glow: 1.2, shadow: false });
		[[-2.8, 0x5a6a5a], [-2.2, 0x5a6a5a]].forEach(([x, c]) => {
			k.box(0.58, 2.2, 0.55, c, { x, y: 1.1, z: -2.6, parent: base, metal: 0.4 });
			for (let j = 0; j < 4; j++) k.box(0.3, 0.02, 0.01, 0x2a2a2a, { x, y: 1.8 + j * 0.05, z: -2.32, parent: base });
		});
		k.box(0.3, 0.06, 0.01, 0xf0f0e8, { x: -2.8, y: 1.55, z: -2.32, parent: base });
		const chair = k.group({ x: -2.3, y: 0, z: -1.6, ry: 0.5, parent: base });
		k.box(0.46, 0.05, 0.44, 0x1a1a1e, { y: 0.5, parent: chair });
		k.box(0.46, 0.45, 0.04, 0x1a1a1e, { y: 0.78, z: -0.22, rx: -0.1, parent: chair });
		[-1, 1].forEach((sx) => {
			k.torus(0.3, 0.025, 0x1a1a1a, { x: sx * 0.27, y: 0.31, z: -0.08, ry: PI / 2, parent: chair, seg: 24 });
			k.torus(0.26, 0.01, 0xa8a8b0, { x: sx * 0.3, y: 0.31, z: -0.08, ry: PI / 2, parent: chair, seg: 24, metal: 0.9 });
			k.cyl(0.012, 0.012, 0.5, 0x8a8a90, { x: sx * 0.27, y: 0.31, z: -0.08, rx: PI / 2, parent: chair, metal: 0.8 });
			k.cyl(0.012, 0.012, 0.5, 0x8a8a90, { x: sx * 0.27, y: 0.31, z: -0.08, parent: chair, metal: 0.8 });
			k.cyl(0.06, 0.06, 0.03, 0x1a1a1a, { x: sx * 0.2, y: 0.06, z: 0.26, rz: PI / 2, parent: chair });
			k.box(0.02, 0.5, 0.02, 0xa8a8b0, { x: sx * 0.22, y: 0.3, z: 0.22, parent: chair, metal: 0.8 });
			k.box(0.02, 0.6, 0.02, 0xa8a8b0, { x: sx * 0.22, y: 0.8, z: -0.24, parent: chair, metal: 0.8 });
			k.box(0.03, 0.03, 0.12, 0x1a1a1a, { x: sx * 0.22, y: 1.1, z: -0.3, parent: chair });
		});
		k.box(0.36, 0.02, 0.14, 0x3a3a3e, { y: 0.14, z: 0.34, parent: chair });
		// Selfridge's desk: a putter, a ball, and a grey rock that hovers.
		const desk = k.group({ x: 2, z: -1.8, parent: base });
		k.box(2.4, 0.08, 1.0, 0x3a3e44, { y: 0.8, parent: desk, metal: 0.5, rough: 0.4 });
		[-1.1, 1.1].forEach((x) => k.box(0.08, 0.8, 0.9, 0x2a2e34, { x, y: 0.4, parent: desk }));
		k.cyl(0.1, 0.14, 0.12, 0x2a2e34, { x: -0.3, y: 0.9, parent: desk, metal: 0.7 });
		k.cyl(0.11, 0.11, 0.015, 0x6ac8ff, { x: -0.3, y: 0.965, parent: desk, emissive: 0x3a8ab0, glow: 0.8 });
		const rock = k.ico(0.16, 0x7a7e82, { x: -0.3, y: 1.32, parent: desk, metal: 0.6, rough: 0.35, detail: 1 });
		rock.scale.set(1.2, 0.9, 1);
		k.tick((t) => {
			rock.position.y = 1.32 + Math.sin(t * 1.2) * 0.03;
			rock.rotation.y = t * 0.3;
		});
		k.box(0.5, 0.3, 0.04, 0x1a1e24, { x: 0.6, y: 1.0, z: -0.3, rx: -0.2, parent: desk });
		k.box(0.46, 0.26, 0.01, 0x3a7ab0, { x: 0.6, y: 1.0, z: -0.275, rx: -0.2, parent: desk, emissive: 0x2a5a8a, glow: 0.8 });
		k.cyl(0.035, 0.035, 0.02, 0xc8a040, { x: 0.1, y: 0.85, z: 0.25, parent: desk, metal: 0.8 });
		const putter = k.group({ x: 1.35, y: 0, z: 0.55, rz: 0.12, parent: desk });
		k.cyl(0.012, 0.012, 0.9, 0xa8a8b0, { y: 0.48, parent: putter, metal: 0.9 });
		k.cyl(0.02, 0.02, 0.2, 0x1a1a1a, { y: 0.88, parent: putter });
		k.box(0.12, 0.04, 0.03, 0x8a8a90, { x: 0.04, y: 0.03, parent: putter, metal: 0.9 });
		k.sphere(0.022, 0xffffff, { x: 0.9, y: 0.022, z: 0.9, parent: desk });
		k.cyl(0.055, 0.055, 0.005, 0x1a1a1a, { x: 0.2, y: 0.003, z: 1.6, parent: desk });
		k.point(0xe8f0ff, 10, 12, { x: BX - 1, y: 3.2, z: 1 });
		k.point(0xfff4e0, 8, 8, { x: BX + 2.5, y: 2.8, z: 0.5 });
		return {
			shots: [
				{ pos: [BX - 1.2, 1.3, 0.2], look: [BX - 2.4, 0.6, -1.8], fov: 45, fog: [0x2a3036, 6, 30], exposure: 1.15 },
				{ pos: [BX + 1.2, 1.45, -0.4], look: [BX + 1.75, 1.15, -1.8], fov: 42, fog: [0x2a3036, 6, 30], exposure: 1.15 },
				{ pos: [0.3, 0.9, 3.2], look: [0, 0, 0.6], fov: 50, exposure: 1.3 },
				{ pos: [0, 8, -12], look: [0, 55, -110], fov: 60, exposure: 1.6 },
				{ pos: [13, M + 6, -21], look: [6, M + 4, -30], fov: 50, fog: [0xd8e8ec, 80, 600] },
				{ pos: [0.2, 2.9, -1.4], look: [0, 2.6, -5], fov: 50, exposure: 1.2 },
			],
		};
	},
	r35: (k) => {
		k.fog(0x1a2232, 30, 260);
		k.sky(0x0a1018, 0x34405a);
		k.light({ sky: 0x9aaad0, ground: 0x2a2420, hemi: 1.2, sunColor: 0xb8c8ff, sunIntensity: 0.9, sunPos: [-30, 60, 20], shadowSize: 50 });
		const r = rng(35);
		// Gotham: a wet avenue between towers, sodium lamps.
		k.box(400, 0.2, 400, 0x24262c, { y: -0.1, rough: 0.35, metal: 0.3 });
		k.box(14, 0.02, 400, 0x1a1c22, { y: 0.01, rough: 0.2, metal: 0.4 });
		for (let i = 0; i < 30; i++) k.box(0.2, 0.02, 3, 0xd8c060, { y: 0.03, z: 60 - i * 8 });
		city(k, 160, [-160, 160, -220, 120], { h: 90, w: 14, colors: [0x2a2e38, 0x343844, 0x3a3e48], windows: 0xffd890, seed: 35, avoid: (x) => Math.abs(x) < 16 });
		for (let i = 0; i < 8; i++) [-1, 1].forEach((sx) => {
			const z = 40 - i * 18;
			k.cyl(0.12, 0.15, 7, 0x2a2a2a, { x: sx * 8, y: 3.5, z });
			k.box(1.6, 0.12, 0.3, 0x2a2a2a, { x: sx * 7.3, y: 7, z });
			k.glow(0xffb050, 2, { x: sx * 6.6, y: 6.9, z });
			k.point(0xffa040, 10, 18, { x: sx * 6.6, y: 6.5, z });
		});
		k.particles(1500, 0xa8b8d0, { box: [40, 30, 60], z: 20, speed: 18, size: 0.04, opacity: 0.4 });
		// The flipped truck and the bike.
		const truck = k.group({ x: -1, y: 0, z: -20, ry: 0.2, from: 3 });
		k.box(2.6, 2.8, 13, 0x8a8a90, { y: 1.6, parent: truck, metal: 0.5, rough: 0.4 });
		k.box(2.4, 0.4, 13, 0x2a2a2a, { y: 3.2, parent: truck });
		for (let i = 0; i < 4; i++) [-1, 1].forEach((sx) => k.cyl(0.5, 0.5, 0.4, 0x0a0a0a, { x: sx * 1.1, y: 3.7, z: -5 + i * 1.2, rz: PI / 2, parent: truck }));
		const cab = k.group({ z: 8, ry: 0.4, parent: truck });
		k.box(2.6, 2.6, 3, 0xd8d8d8, { y: 1.3, parent: cab, metal: 0.3 });
		k.box(2.6, 1, 2, 0xd8d8d8, { y: 0.5, z: 2.4, parent: cab });
		k.box(2.2, 1, 0.1, 0x1a2a3a, { y: 1.8, z: 1.52, parent: cab });
		[-1, 1].forEach((sx) => [0, 2.6].forEach((z) => k.cyl(0.5, 0.5, 0.4, 0x0a0a0a, { x: sx * 1.2, y: 2.9, z, rz: PI / 2, parent: cab })));
		for (let i = 0; i < 12; i++) k.box(0.3 + r() * 0.6, 0.1, 0.3 + r() * 0.6, 0x5a5a60, { x: -4 + r() * 8, y: 0.05, z: -14 - r() * 18, ry: r() * 3, from: 3 });
		k.glow(0xff8a30, 6, { x: 1, y: 1, z: -12, from: 3 });
		k.point(0xff8030, 20, 20, { x: 1, y: 2, z: -12, from: 3 });
		k.point(0xd8e0ff, 20, 20, { x: 4, y: 8, z: -16, from: 3 });
		const pod = k.group({ x: 4, y: 0, z: -11, ry: -0.5, from: 3 });
		[-1, 1].forEach((s) => k.cyl(0.55, 0.55, 0.6, 0x0a0a0a, { z: s * 1.1, y: 0.55, rz: PI / 2, parent: pod }));
		k.box(0.5, 0.5, 2, 0x1a1a1e, { y: 0.8, parent: pod, metal: 0.5 });
		k.box(0.4, 0.3, 0.6, 0x1a1a1e, { y: 1.1, z: 0.6, parent: pod, metal: 0.5 });
		k.box(1, 0.08, 0.08, 0x2a2a2a, { y: 1.2, z: 0.9, parent: pod });
		// The mask on the bank floor.
		const B = 300;
		const tile = k.canvas(128, 128, (g) => {
			g.fillStyle = "#d8d0c0";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#3a3a3a";
			g.fillRect(0, 0, 64, 64);
			g.fillRect(64, 64, 64, 64);
		});
		tile.wrapS = tile.wrapT = k.THREE.RepeatWrapping;
		tile.repeat.set(6, 6);
		k.plane(12, 12, k.mat(0xffffff, { map: tile, rough: 0.2 }), { x: B, rx: -PI / 2 });
		const bills = [];
		for (let i = 0; i < 80; i++) bills.push([B + (r() - 0.5) * 4, 0.01 + i * 0.0005, (r() - 0.5) * 4, 0, r() * 6, 0]);
		inst(k, new k.THREE.BoxGeometry(0.16, 0.002, 0.07), 0x9aaa88, bills);
		const mask = k.group({ x: B, y: 0.1, z: 0, rx: -1.3, ry: 0.3, from: 4 });
		k.sphere(0.2, 0xf4f0e8, { s: [1, 1.2, 0.5], parent: mask, flat: false });
		k.sphere(0.04, 0xd81a1a, { z: 0.1, y: -0.02, parent: mask });
		[-1, 1].forEach((s) => {
			k.sphere(0.035, 0x1a3aa8, { x: s * 0.07, y: 0.06, z: 0.085, parent: mask });
			k.sphere(0.06, 0xe86a1a, { x: s * 0.19, y: 0.12, z: -0.02, parent: mask });
		});
		k.torus(0.07, 0.015, 0xd81a1a, { y: -0.1, z: 0.085, arc: PI, rz: PI, parent: mask });
		k.box(0.6, 0.06, 0.1, 0x2a2a2e, { x: B + 0.5, y: 0.05, z: 0.4, ry: 0.8, metal: 0.6 });
		k.spot(0xfff8f0, 25, { x: B + 1, y: 4, z: 1.5, target: [B, 0, 0], angle: 0.4, distance: 10 });
		k.point(0xd8e0f0, 4, 10, { x: B - 2, y: 3, z: 2 });
		// The mountain of money, burning.
		const M = -300;
		k.box(40, 0.2, 40, 0x3a3430, { x: M, y: -0.1 });
		k.box(40, 14, 0.4, 0x2a2826, { x: M, y: 7, z: -12 });
		const cash = [];
		for (let i = 0; i < 1600; i++) {
			const a = r() * PI * 2;
			const d = Math.sqrt(r()) * 5;
			cash.push([M + Math.cos(a) * d, Math.max(0.2, (5 - d) * 1.3 * (0.85 + r() * 0.15)), Math.sin(a) * d - 3, 0, r() * 6, (r() - 0.5) * 0.3]);
		}
		inst(k, new k.THREE.BoxGeometry(0.5, 0.25, 0.3), 0x8aa070, cash);
		k.cone(5, 6.5, 0x6a7a5a, { x: M, y: 3.25, z: -3, seg: 12 });
		for (let i = 0; i < 16; i++) k.glow(i % 2 ? 0xff7010 : 0xffc040, 2 + r() * 3, { x: M + (r() - 0.5) * 8, y: 0.5 + r() * 5, z: -3 + (r() - 0.5) * 4 + 2 });
		k.point(0xff7020, 30, 25, { x: M, y: 4, z: 3 });
		k.particles(300, 0xffa040, { x: M, z: -2, box: [12, 12, 8], speed: 1, size: 0.12 });
		// The clown in purple, the hospital going up behind him.
		const H = 600;
		k.box(80, 0.2, 80, 0x3a3a38, { x: H, y: -0.1 });
		k.box(40, 16, 10, 0xc8c4b8, { x: H, y: 8, z: -30 });
		for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) k.box(2, 1.6, 0.1, 0x2a3040, { x: H - 16 + i * 4, y: 4 + j * 4.5, z: -24.9 });
		const boom = [];
		for (let i = 0; i < 14; i++) boom.push(k.glow(i % 3 ? 0xff6a10 : 0xffd060, 10 + r() * 14, { x: H - 10 + r() * 20, y: 4 + r() * 12, z: -22 + r() * 2 }));
		k.tick((t) => boom.forEach((b, i) => b.scale.setScalar((10 + (i % 5) * 3) * (0.9 + 0.2 * Math.sin(t * 3 + i)))));
		k.point(0xff7020, 60, 60, { x: H, y: 8, z: -18, decay: 1 });
		k.particles(400, 0x5a5048, { x: H, z: -20, box: [40, 25, 10], speed: 1.5, size: 0.4 });
		const joker = k.person({ x: H + 0.4, y: 0, z: -2, ry: -0.3, coat: 0x5a2a6a, colors: { shirt: 0x3a7a3a, legs: 0x4a2a5a, skin: 0xf2eee8, hair: 0x5a8a2a, shoes: 0x2a1a10 }, sleeves: 0x5a2a6a, hair: false });
		const jh = joker.userData.limbs.head;
		k.sphere(0.225, 0x5a8a2a, { y: 0.06, z: -0.03, s: [1.05, 0.9, 1.1], parent: jh });
		for (let i = 0; i < 6; i++) k.cone(0.06, 0.22, 0x5a8a2a, { x: -0.15 + i * 0.06, y: -0.05, z: -0.15, rx: 2.6, parent: jh, seg: 4 });
		[-0.07, 0.07].forEach((x) => k.sphere(0.04, 0x1a1414, { x, y: 0.03, z: 0.16, parent: jh }));
		k.box(0.2, 0.04, 0.04, 0xa8101a, { y: -0.09, z: 0.185, parent: jh });
		[-1, 1].forEach((s) => k.box(0.06, 0.03, 0.03, 0xa8101a, { x: s * 0.11, y: -0.06, z: 0.175, rz: s * 0.6, parent: jh }));
		k.box(0.04, 0.4, 0.03, 0x3a3a8a, { y: 1.3, z: 0.16, parent: joker });
		joker.userData.limbs.armR.rotation.set(-0.2, 0, 0.3);
		k.point(0xffe8d8, 8, 6, { x: H + 1, y: 2.5, z: 1.5 });
		return {
			shots: [
				{ pos: [B + 1.75, 0.75, 1.55], look: [B + 1.0, 0.05, 0.85], fov: 40, fog: [0x1a1a1e, 3, 25] },
				{ pos: [3, 1.7, 52], look: [-1, 5, 10], fov: 50, exposure: 1.7, fog: [0x2a3448, 30, 240] },
				{ pos: [M + 3, 4, 12], look: [M, 3, -3], fov: 50, fog: [0x1a1210, 10, 50], exposure: 1.2 },
				{ pos: [10, 2.6, -6], look: [-1, 1.8, -20], fov: 55, exposure: 1.4 },
				{ pos: [B + 0.5, 0.9, 0.8], look: [B, 0.1, 0], fov: 40, fog: [0x1a1a1e, 3, 25] },
				{ pos: [H + 1.3, 1.6, 1.4], look: [H + 0.1, 2.4, -8], fov: 50, fog: [0x2a2420, 30, 100] },
			],
		};
	},
	r36: (k) => {
		k.fog(0xe0a070, 60, 450);
		k.sky(0x3a8ab0, 0xf0c090, { offset: -0.03 });
		k.light({ sky: 0xffe0b8, ground: 0x9a5a2a, hemi: 1.2, sunColor: 0xfff0d0, sunIntensity: 2.6, sunPos: [40, 70, 30], shadowSize: 50 });
		const r = rng(36);
		k.ground(900, 0xd8884a, { bump: 1.6, seg: 60 });
		const rust = 0x6a3a22;
		// The convoy: the tanker rig, the drums-and-guitar truck, spiked cars, dust.
		const convoy = k.group({ from: 4 });
		const rig = k.group({ x: 0, y: 0, z: 0, parent: convoy });
		k.box(2.8, 2.2, 5, 0x1a1a1a, { y: 1.8, z: 7, parent: rig });
		k.box(2.6, 1.2, 2, 0x2a2a2a, { y: 3.4, z: 6.4, parent: rig });
		k.box(2.4, 0.6, 0.1, 0x3a5a6a, { y: 3.5, z: 7.45, parent: rig, opacity: 0.6 });
		k.box(2.8, 1, 0.3, 0x8a8a8a, { y: 1.2, z: 9.6, parent: rig, metal: 0.8 });
		for (let i = 0; i < 5; i++) k.cone(0.08, 0.4, 0xd8d8d8, { x: -1.2 + i * 0.6, y: 1.3, z: 9.95, rx: PI / 2, parent: rig, metal: 0.8 });
		[-1.6, 1.6].forEach((x) => k.cyl(0.18, 0.18, 4, 0x8a8a8a, { x, y: 4, z: 5, parent: rig, metal: 0.8 }));
		k.cyl(1.5, 1.5, 12, 0xb8b8b8, { y: 2.8, z: -3.5, rx: PI / 2, parent: rig, metal: 0.7, rough: 0.35, seg: 14 });
		k.box(2.4, 0.5, 13, rust, { y: 1, z: -3.5, parent: rig });
		for (let i = 0; i < 5; i++) [-1, 1].forEach((sx) => k.cyl(0.6, 0.6, 0.5, 0x111111, { x: sx * 1.3, y: 0.6, z: 7.5 - i * 3, rz: PI / 2, parent: rig }));
		const doof = k.group({ x: 9, y: 0, z: 6, parent: convoy });
		k.box(3, 1.5, 7, 0x2a2a2a, { y: 1.2, parent: doof });
		for (let i = 0; i < 3; i++) [-1, 1].forEach((sx) => k.cyl(0.65, 0.65, 0.5, 0x111111, { x: sx * 1.5, y: 0.65, z: -2.5 + i * 2.5, rz: PI / 2, parent: doof }));
		for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
			k.box(0.95, 0.95, 0.6, 0x1a1a1a, { x: -1 + j, y: 2.4 + i, z: 2.6, parent: doof });
			k.cyl(0.35, 0.25, 0.05, 0x5a5a5a, { x: -1 + j, y: 2.4 + i, z: 2.92, rx: PI / 2, parent: doof });
		}
		const doofer = k.person({ y: 3.9, z: 3.8, s: 1, colors: { shirt: 0xb81a1a, legs: 0xb81a1a, skin: 0xe8c8b0, hair: 0x1a1a1a }, sleeves: 0xb81a1a, parent: doof });
		k.box(0.32, 0.25, 0.06, 0x111111, { y: 1.68, z: 0.18, parent: doofer });
		const guitar = k.group({ y: 1.1, z: 0.25, rz: -0.5, parent: doofer });
		k.box(0.5, 0.35, 0.1, 0xb81a1a, { parent: guitar, metal: 0.6 });
		k.box(0.6, 0.08, 0.06, 0x8a8a8a, { x: 0.5, parent: guitar, metal: 0.8 });
		[-0.12, 0.12].forEach((y) => k.cyl(0.04, 0.04, 0.5, 0xa8a8a8, { x: 0.9, y, rz: PI / 2, parent: guitar, metal: 0.8 }));
		const flame = k.group({ x: 1.6, parent: guitar });
		for (let i = 0; i < 6; i++) k.glow(i % 2 ? 0xff8020 : 0xffd060, 0.6 + i * 0.4, { x: i * 0.45, y: 0.1 * i, parent: flame });
		k.point(0xff8020, 25, 12, { x: 1.6, parent: guitar });
		k.tick((t) => flame.scale.setScalar(0.8 + 0.3 * Math.sin(t * 12)));
		doofer.userData.limbs.armR.rotation.set(-1.2, 0, 0.4);
		doofer.userData.limbs.armL.rotation.set(-1.0, 0, -0.6);
		for (let i = 0; i < 4; i++) k.cyl(0.5, 0.5, 0.6, 0xd8d0c0, { x: -1 + (i % 2) * 2, y: 2.3, z: -2 - Math.floor(i / 2) * 1.4, parent: doof });
		const pole = (x, z, c) => {
			const g = k.group({ x, z, parent: convoy });
			k.box(2, 0.8, 4, c, { y: 0.8, parent: g });
			[-1, 1].forEach((sx) => [-1.3, 1.3].forEach((wz) => k.cyl(0.45, 0.45, 0.35, 0x111111, { x: sx, y: 0.45, z: wz, rz: PI / 2, parent: g })));
			const arm = k.group({ y: 1.2, parent: g });
			k.cyl(0.06, 0.06, 8, 0x8a8a8a, { y: 4, parent: arm, rz: 0.2 });
			k.person({ x: -0.9, y: 7.6, s: 0.9, colors: { shirt: 0xe8e4dc, legs: 0x2a2a2a, skin: 0xe8e4dc, hair: 0xe8e4dc }, sleeves: 0xe8e4dc, parent: arm, rz: 0.2 });
			k.tick((t) => (arm.rotation.z = Math.sin(t * 0.8 + x) * 0.5));
		};
		pole(-8, -4, 0x5a4a3a);
		pole(-6, 12, 0x6a3a2a);
		const giga = k.group({ x: -10, z: 22, parent: convoy });
		k.box(2.4, 1, 5.5, 0x1a1a1a, { y: 1.1, parent: giga, metal: 0.6 });
		k.box(2.3, 1, 5.3, 0x2a2a2a, { y: 2.2, parent: giga, metal: 0.6 });
		[-1, 1].forEach((sx) => [-1.8, 1.8].forEach((wz) => k.cyl(0.8, 0.8, 0.6, 0x111111, { x: sx * 1.3, y: 0.8, z: wz, rz: PI / 2, parent: giga })));
		k.box(0.6, 0.8, 0.6, 0xa8a8a8, { y: 3.1, z: 1.8, parent: giga, metal: 0.8 });
		for (let i = 0; i < 40; i++) k.sphere(2 + r() * 3, 0xc8905a, { x: -20 + r() * 40, y: 1 + r() * 2, z: -18 - r() * 30, opacity: 0.55, seg: 7, rings: 5, parent: convoy });
		k.particles(500, 0xd8a070, { box: [50, 6, 60], speed: 3, size: 0.2, drift: 3, from: 4 });
		// The cab: a skull-hung wheel.
		const C = -200;
		const cab = k.group({ x: C });
		k.box(3, 0.8, 1.2, 0x2a1e18, { y: 1.2, z: -1, parent: cab });
		k.box(3, 0.1, 1.8, 0x1a1a1a, { y: 0.5, parent: cab });
		const wheel = k.group({ y: 1.65, z: -0.2, rx: -0.45, x: -0.4, parent: cab });
		k.cyl(0.05, 0.05, 1, 0x2a2a2a, { x: -0.4, y: 1.45, z: -0.55, rx: -0.45 - PI / 2 + 0.2, parent: cab });
		k.torus(0.35, 0.035, 0x1a1a1a, { parent: wheel, rough: 0.6 });
		for (let i = 0; i < 3; i++) k.box(0.03, 0.32, 0.03, 0x8a8a8a, { y: 0.16, rz: (i * 2 * PI) / 3, parent: k.group({ rz: (i * 2 * PI) / 3, parent: wheel }) });
		k.cyl(0.08, 0.08, 0.05, 0x8a8a8a, { rx: PI / 2, parent: wheel, metal: 0.9 });
		const skullAt = (o) => {
			const g = k.group(o);
			k.sphere(0.05, 0xe8e0c8, { parent: g });
			k.box(0.05, 0.03, 0.04, 0xe8e0c8, { y: -0.04, z: 0.01, parent: g });
			[-0.018, 0.018].forEach((x) => k.sphere(0.012, 0x111111, { x, y: 0.005, z: 0.042, parent: g }));
		};
		for (let i = 0; i < 8; i++) skullAt({ x: Math.cos((i / 8) * PI * 2) * 0.35, y: Math.sin((i / 8) * PI * 2) * 0.35, z: 0.04, rx: PI / 2, parent: wheel });
		skullAt({ x: 0.5, y: 1.0, z: 0.0, s: 1.5, parent: cab });
		k.cyl(0.02, 0.02, 0.5, 0x8a8a8a, { x: 0.5, y: 0.75, parent: cab, metal: 0.9 });
		k.box(3, 0.1, 0.1, 0x2a2a2a, { y: 2.6, z: -1.4, parent: cab });
		[-1.5, 1.5].forEach((x) => k.box(0.1, 1.4, 0.1, 0x2a2a2a, { x, y: 2, z: -1.4, parent: cab }));
		for (let i = 0; i < 5; i++) k.box(0.08, 0.06, 0.06, 0xd8b040, { x: -1 + i * 0.5, y: 2.5, z: -1.3, parent: cab, metal: 0.9 });
		k.point(0xffe0b0, 6, 6, { x: C, y: 2.4, z: 0.5 });
		// The sandstorm.
		const T = -300;
		const storm = k.group({ z: T + 80, from: 2, until: 2 });
		for (let i = 0; i < 30; i++) k.sphere(30 + r() * 30, i % 3 ? 0x9a5a32 : 0xb8703a, { x: -200 + r() * 400, y: 20 + r() * 80, z: -r() * 60, s: [1.4, 1, 1], opacity: 0.92, seg: 16, rings: 12, flat: false, parent: storm });
		for (let i = 0; i < 4; i++) k.cone(10, 120, 0x5a2e1a, { x: -120 + i * 80, y: 60, z: 30, rx: PI, seg: 8, opacity: 0.8, parent: storm });
		const bolts = [];
		for (let i = 0; i < 3; i++) {
			const b = k.group({ x: -60 + i * 60, y: 0, z: T + 150, from: 2, until: 2 });
			let y = 0;
			for (let j = 0; j < 7; j++) {
				k.box(0.8, 12, 0.8, 0xe0f0ff, { x: Math.sin(j * 2.1 + i) * 4, y: y + 6, rz: Math.sin(j * 1.5) * 0.4, parent: b, emissive: 0xc0e0ff, glow: 3, shadow: false });
				y += 11;
			}
			bolts.push(b);
		}
				k.point(0xc8e0ff, 30, 300, { y: 80, z: T + 40, from: 2, until: 2, decay: 0.5 });
		const car = k.group({ x: 3, z: -36, ry: 0.4, from: 2, until: 2 });
		k.box(2, 1, 4, 0x2a2a2a, { y: 0.9, parent: car });
		[-1, 1].forEach((sx) => [-1.3, 1.3].forEach((wz) => k.cyl(0.45, 0.45, 0.35, 0x111111, { x: sx, y: 0.45, z: wz, rz: PI / 2, parent: car })));
		// The Citadel: three towers of rock, water pouring down to the crowd.
		const W = 400;
		const cit = k.group({ x: W, z: -80 });
		[[-28, 0, 22, 90], [0, -16, 26, 110], [28, 4, 20, 85]].forEach(([x, z, rad, h]) => {
			k.cyl(rad * 0.7, rad, h, 0xb07850, { x, y: h / 2, z, seg: 9, parent: cit, rough: 1 });
			k.cyl(rad * 0.75, rad * 0.7, 6, 0x5a8a3a, { x, y: h + 3, z, seg: 9, parent: cit });
			for (let i = 0; i < 8; i++) k.box(1.2, 1.6, 0.4, 0x2a1a10, { x: x - rad * 0.4 + r() * rad * 0.8, y: h * (0.3 + r() * 0.6), z: z + rad * 0.82, parent: cit });
		});
		[[-8, 60], [8, 68], [0, 75]].forEach(([x, y]) => {
			k.cyl(0.8, 0.8, 4, 0x6a6a6a, { x, y, z: 12, rx: PI / 2, parent: cit, metal: 0.6 });
			k.box(2.5, y, 1.2, 0xc8e8f8, { x, y: y / 2, z: 15, parent: cit, opacity: 0.75, emissive: 0x5a8aa8, glow: 0.4 });
		});
		const crowd = [];
		for (let i = 0; i < 3000; i++) crowd.push([W + (r() - 0.5) * 70, 0.5, -55 + r() * 30, [0x8a6a4a, 0x6a4a3a, 0xa88060, 0x5a4a3a][i % 4]]);
		dots(k, crowd, { size: 0.5 });
		k.particles(300, 0xd8f0ff, { x: W, z: -65, box: [20, 70, 4], speed: 20, size: 0.3 });
		// A two-headed lizard on the cracked earth.
		const LX = -105;
		const LZ = 105;
		const gy = 0.8 * (Math.sin(LX * 0.7) * Math.cos(LZ * 0.6) + Math.sin(LX * 0.23 + LZ * 0.31));
		const crack = k.canvas(256, 256, (g) => {
			g.fillStyle = "#c8804a";
			g.fillRect(0, 0, 256, 256);
			g.strokeStyle = "#7a4424";
			g.lineWidth = 2;
			const rr = rng(5);
			for (let i = 0; i < 40; i++) {
				g.beginPath();
				let x = rr() * 256;
				let y = rr() * 256;
				g.moveTo(x, y);
				for (let j = 0; j < 4; j++) {
					x += (rr() - 0.5) * 60;
					y += (rr() - 0.5) * 60;
					g.lineTo(x, y);
				}
				g.stroke();
			}
		});
		k.plane(4, 4, k.mat(0xffffff, { map: crack }), { x: LX, y: gy + 0.03, z: LZ, rx: -PI / 2 });
		const liz = k.group({ x: LX, y: gy + 0.05, z: LZ, ry: 0.6 });
		const scale = 0x8a7a4a;
		k.capsule(0.05, 0.22, scale, { rz: PI / 2, parent: liz, s: [1, 1, 0.8] });
		k.cone(0.045, 0.4, scale, { x: -0.36, rz: PI / 2, parent: liz, seg: 6 });
		[-1, 1].forEach((sz) => {
			const neck = k.group({ x: 0.15, y: 0.01, z: sz * 0.02, ry: -sz * 0.45, parent: liz });
			k.capsule(0.03, 0.08, scale, { x: 0.06, rz: PI / 2, parent: neck });
			k.sphere(0.04, 0x9a8a5a, { x: 0.14, y: 0.01, s: [1.4, 0.8, 1], parent: neck });
			k.sphere(0.008, 0x111111, { x: 0.15, y: 0.03, z: 0.03, parent: neck });
			k.sphere(0.008, 0x111111, { x: 0.15, y: 0.03, z: -0.03, parent: neck });
		});
		[[0.08, 1], [0.08, -1], [-0.1, 1], [-0.1, -1]].forEach(([x, sz]) => k.box(0.02, 0.02, 0.1, scale, { x, y: -0.03, z: sz * 0.07, ry: sz * 0.3, parent: liz }));
		for (let i = 0; i < 6; i++) k.box(0.02, 0.008, 0.06, 0x5a4a2a, { x: -0.1 + i * 0.04, y: 0.045, parent: liz });
		for (let i = 0; i < 14; i++) k.ico(0.02 + r() * 0.05, 0x9a6a40, { x: LX + (r() - 0.5) * 2, y: gy + 0.04, z: LZ + (r() - 0.5) * 2 });
		return {
			shots: [
				{ pos: [LX + 0.45, gy + 0.45, LZ + 0.55], look: [LX, gy + 0.05, LZ], fov: 40 },
				{ pos: [C - 0.35, 2.05, 0.9], look: [C - 0.2, 1.6, -2.5], fov: 55 },
				{ pos: [0, 2, -24], look: [0, 30, T], fov: 55, fog: [0xb0683a, 30, 520], exposure: 1.1 },
				{ pos: [W + 20, 8, 40], look: [W, 50, -80], fov: 55 },
				{ pos: [-15, 3.5, 14], look: [0, 2.8, 0], fov: 55 },
				{ pos: [13.5, 5, 13], look: [9, 4.8, 9.5], fov: 50 },
			],
		};
	},
	r37: (k) => {
		k.scene.background = new k.THREE.Color(0x000004);
		k.stars(2500, { upper: false, r: 800, size: 1.4 });
		k.light({ sky: 0x6a8ac8, ground: 0x1a2a4a, hemi: 0.7, sunColor: 0xffffff, sunIntensity: 3, sunPos: [80, 40, 60], shadowSize: 30 });
		const r = rng(37);
		// Earth below.
		const earthTex = k.canvas(1024, 512, (g) => {
			g.fillStyle = "#1a4a8a";
			g.fillRect(0, 0, 1024, 512);
			const rr = rng(9);
			for (let i = 0; i < 26; i++) {
				g.fillStyle = ["#5a7a3a", "#8a7a4a", "#4a6a32"][i % 3];
				g.beginPath();
				g.ellipse(rr() * 1024, 120 + rr() * 280, 30 + rr() * 90, 20 + rr() * 60, rr() * 3, 0, PI * 2);
				g.fill();
			}
			for (let i = 0; i < 140; i++) {
				g.fillStyle = `rgba(255,255,255,${0.5 + rr() * 0.4})`;
				g.beginPath();
				g.ellipse(rr() * 1024, rr() * 512, 10 + rr() * 60, 4 + rr() * 14, rr() * 0.6, 0, PI * 2);
				g.fill();
			}
		});
		const earth = k.sphere(600, k.mat(0xffffff, { map: earthTex, rough: 0.8, flat: false }), { y: -650, seg: 96, rings: 64 });
		k.sphere(612, 0x6ab0ff, { y: -650, seg: 96, rings: 64, opacity: 0.18, emissive: 0x3a7ad8, glow: 0.6, flat: false, shadow: false });
		k.tick((t) => (earth.rotation.y = t * 0.004));
		k.glow(0xfff8e0, 90, { x: 400, y: 30, z: -500 });
		k.disc(0xffffff, 10, { x: 400, y: 30, z: -500 });
		// The suit.
		const astro = (o) => {
			const p = k.person({ ...o, hair: false, colors: { shirt: 0xf0f0ec, legs: 0xf0f0ec, skin: 0xf0f0ec, shoes: 0xd8d8d0 }, sleeves: 0xf0f0ec });
			const h = p.userData.limbs.head;
			k.sphere(0.27, 0xf4f4f0, { parent: h });
			k.sphere(0.2, 0xd8a840, { z: 0.1, s: [1, 0.85, 0.8], parent: h, metal: 0.9, rough: 0.15 });
			k.box(0.55, 0.7, 0.3, 0xe8e8e4, { y: 1.25, z: -0.28, parent: p });
			k.box(0.3, 0.2, 0.06, 0x8a8a90, { y: 1.3, z: 0.16, parent: p });
			k.box(0.06, 0.06, 0.06, 0xc81a1a, { x: 0.1, y: 1.3, z: 0.2, parent: p });
			return p;
		};
		// The telescope and the shuttle's arm.
		const hub = k.group({ x: 0, y: 0, z: 0, rz: 0.15, until: 3 });
		k.cyl(2, 2, 9, 0xd8d8dc, { rz: PI / 2, parent: hub, metal: 0.3, rough: 0.4, seg: 16 });
		k.cyl(2.05, 2.05, 3, 0xd8b868, { x: -3, rz: PI / 2, parent: hub, metal: 0.5, rough: 0.3, seg: 16 });
		k.cyl(2, 2, 0.3, 0x1a1a1a, { x: 4.6, rz: PI / 2, parent: hub, seg: 16 });
		[-1, 1].forEach((s) => {
			k.cyl(0.08, 0.08, 4, 0xb8b8b8, { z: s * 3.5, rx: PI / 2, parent: hub });
			const panel = k.box(4, 0.05, 6, 0x3a5ab0, { z: s * 6.5, parent: hub, metal: 0.3, rough: 0.4, emissive: 0x0a1a40 });
			void panel;
			k.box(4.1, 0.06, 0.1, 0xd8b040, { z: s * 6.5, parent: hub, metal: 0.8 });
		});
		const bay = k.group({ x: -4, y: -9, z: 2, rx: 0.1, until: 3 });
		k.box(5, 3, 16, 0xf0f0ec, { parent: bay });
		k.box(4.4, 0.2, 15, 0x9a9a9a, { y: 1.45, parent: bay });
		[-1, 1].forEach((s) => k.box(0.15, 2.4, 15, 0xe8e8e4, { x: s * 3.6, y: 2.8, rz: -s * 0.6, parent: bay }));
		const arm = k.group({ x: 1.5, y: 1.5, z: 4, parent: bay });
		k.cyl(0.15, 0.15, 7, 0xe8e8e4, { y: 3.4, rz: -0.2, parent: arm });
		k.cyl(0.13, 0.13, 5, 0xe8e8e4, { x: 1.6, y: 7.5, rz: -1.1, parent: arm });
		const worker = astro({ x: 1, y: -4.9, z: 3, ry: -0.6, s: 1, until: 3 });
		k.point(0xffffff, 6, 12, { x: 3, y: -3, z: 6 });
		// The debris storm.
		const shardList = [];
		for (let i = 0; i < 200; i++) shardList.push([0, 0, 0, r() * 6, r() * 6, r() * 6, 0.2 + r() * 0.8]);
		const shards = inst(k, new k.THREE.TetrahedronGeometry(1), k.mat(0xb8b8b0, { metal: 0.7, rough: 0.4 }), shardList, { from: 3 });
		const seeds = shardList.map(() => [r(), r(), r(), r()]);
		const d = new k.THREE.Object3D();
		k.tick((t) => {
			seeds.forEach(([a, b, c, e], i) => {
				const p = (t * 0.25 + a) % 1;
				d.position.set(-80 + p * 160, -12 + b * 26, -20 + c * 40);
				d.rotation.set(t * e * 3, t * a * 2, i);
				d.scale.setScalar(0.2 + e * 0.8);
				d.updateMatrix();
				shards.setMatrixAt(i, d.matrix);
			});
			shards.instanceMatrix.needsUpdate = true;
		});
		for (let i = 0; i < 10; i++) k.glow(0xffc070, 2 + r() * 3, { x: -10 + r() * 20, y: -6 + r() * 12, z: -8 + r() * 16, from: 3, until: 3 });
		// Inside the station: curled up in the light from the window.
		const I = 300;
		const mod = k.group({ x: I });
		k.cyl(2.2, 2.2, 12, 0xd8d4c8, { rx: PI / 2, open: true, side: k.THREE.BackSide, parent: mod, seg: 12 });
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * PI * 2;
			k.box(0.9, 0.6, 1.4, [0xc8c4b8, 0xb8b8b0, 0x8a8a84][i % 3], { x: Math.cos(a) * 2.05, y: Math.sin(a) * 2.05, z: -3 + (i % 4) * 1.6, rz: a + PI / 2, parent: mod });
		}
		for (let i = 0; i < 5; i++) k.torus(2.1, 0.06, 0xa8a8a0, { z: -5 + i * 2.5, parent: mod });
		k.cyl(2.25, 2.25, 0.1, 0xb8b4a8, { z: -6.1, rx: PI / 2, parent: mod, seg: 12 });
		k.cyl(1.1, 1.1, 0.1, 0x8ac8ff, { y: 0, z: -6, rx: PI / 2, parent: mod, emissive: 0x6ab0f0, glow: 1.4, seg: 20 });
		k.torus(1.15, 0.12, 0x8a8a8a, { z: -5.95, parent: mod });
		k.spot(0xfff4e0, 40, { x: I, y: 0.5, z: -5.5, target: [I, 0, 0], angle: 0.6, distance: 14 });
		k.point(0xd8e0ff, 5, 10, { x: I + 1, y: 1, z: 3 });
		const roll = k.group({ x: I - 0.25, y: -0.15, z: -1, rz: 0.35, from: 1, until: 1 });
		const skin = 0xe8c0a0;
		k.box(0.3, 0.62, 0.42, 0x3a3a40, { x: 0.12, y: 0.3, rz: -0.45, parent: roll });
		k.box(0.32, 0.22, 0.44, 0x2a2a30, { x: 0.02, y: 0.02, rz: -0.2, parent: roll });
		k.sphere(0.17, skin, { x: 0.42, y: 0.7, parent: roll });
		k.sphere(0.18, 0x5a3a2a, { x: 0.38, y: 0.74, s: [1, 0.9, 1], parent: roll });
		[-0.11, 0.11].forEach((z) => {
			k.box(0.68, 0.19, 0.19, skin, { x: 0.28, y: 0.22, z, rz: 0.69, parent: roll });
			k.box(0.17, 0.66, 0.17, skin, { x: 0.47, y: 0.13, z: z * 1.1, rz: -0.3, parent: roll });
			k.box(0.22, 0.08, 0.1, skin, { x: 0.44, y: -0.2, z, parent: roll });
			k.box(0.12, 0.42, 0.12, skin, { x: 0.45, y: 0.47, z: z * 2.4, rz: -2.36, parent: roll });
			k.box(0.11, 0.36, 0.11, skin, { x: 0.66, y: 0.2, z: z * 2.2, rz: 0.1, parent: roll });
		});
		k.torus(1.0, 0.035, 0xd8d0c0, { x: I - 0.6, y: 0.9, z: -1.4, arc: PI * 0.8, rz: -0.6 });
		k.torus(1.3, 0.035, 0xb8b0a0, { x: I + 0.8, y: -1.2, z: -1.6, arc: PI * 0.7, rz: 1.2 });
		k.point(0xffe8d0, 6, 6, { x: I + 0.5, y: 0.5, z: 1.5 });
		// Loose things drifting in the module: a pen, a washer, beads of water.
		const drift = k.group({ x: I + 0.7, y: 0.3, z: 1.4, until: 0 });
		const pen = k.group({ rz: 0.6, ry: 0.4, parent: drift });
		k.cyl(0.012, 0.012, 0.16, 0x1a3a8a, { parent: pen });
		k.cone(0.012, 0.03, 0xc8c8c8, { y: -0.095, rx: PI, parent: pen, metal: 0.8 });
		k.box(0.006, 0.05, 0.01, 0xc8c8c8, { x: 0.014, y: 0.05, parent: pen, metal: 0.8 });
		k.torus(0.018, 0.006, 0xb8b8b8, { x: 0.12, y: 0.1, z: -0.1, rx: 0.8, parent: drift, metal: 0.9, rough: 0.3 });
		const drops = [];
		for (let i = 0; i < 9; i++) drops.push(k.sphere(0.008 + r() * 0.012, k.mat(0xb8e0ff, { opacity: 0.55, rough: 0.05, flat: false }), { x: -0.15 + r() * 0.3, y: -0.1 + r() * 0.25, z: -0.1 + r() * 0.2, parent: drift }));
		k.tick((t) => {
			drift.position.y = 0.3 + Math.sin(t * 0.4) * 0.03;
			pen.rotation.z = 0.6 + t * 0.15;
		});
		// The station, and two of them on one tether.
		const st = k.group({ x: 40, y: 10, z: -60, ry: 0.5, from: 4 });
		k.box(50, 0.8, 0.8, 0xc8c8c4, { parent: st, metal: 0.6 });
		for (let i = 0; i < 4; i++) [-1, 1].forEach((s) => k.box(4, 0.05, 14, 0xc89a40, { x: -20 + i * 13.3, z: s * 8, parent: st, metal: 0.6, rough: 0.3 }));
		for (let i = 0; i < 4; i++) k.cyl(1.5, 1.5, 6, 0xe8e8e4, { x: -4 + i * 3, y: -1, z: 4, rx: PI / 2, parent: st, metal: 0.5 });
		// Kowalski on the end of the tether, Stone holding on, the station beyond.
		const stone = astro({ x: 5, y: 1.5, z: 6, ry: 0.4, rz: -0.3, pose: "arms-out", from: 4, until: 4 });
		const matt = astro({ x: 9.5, y: 3.6, z: 1.5, ry: -0.5, rz: 0.5, pose: "arms-out", from: 4, until: 4 });
		k.box(0.75, 0.9, 0.5, 0xdcdcd4, { y: 1.2, z: -0.5, parent: matt });
		[-1, 1].forEach((sx) => k.box(0.12, 0.12, 0.6, 0x9a9a98, { x: sx * 0.45, y: 0.85, z: -0.2, parent: matt }));
		void stone;
		const rope = (a, b) => {
			const A = new k.THREE.Vector3(...a), Bv = new k.THREE.Vector3(...b);
			const m = k.cyl(0.025, 0.025, A.distanceTo(Bv), 0xf8f0e0, { from: 4, until: 4, shadow: false });
			m.position.copy(A).add(Bv).multiplyScalar(0.5);
			m.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize());
			return m;
		};
		rope([5.9, 3.1, 5.9], [7.6, 3.9, 3.6]);
		rope([7.6, 3.9, 3.6], [9.1, 4.6, 1.9]);
		k.point(0xffffff, 10, 18, { x: 2, y: 6, z: 10, from: 4, until: 4 });
		// Alone, tumbling.
		const lone = astro({ x: -30, y: 0, z: 60, pose: "arms-out", from: 5 });
		k.tick((t) => lone.rotation.set(t * 0.25, t * 0.1, t * 0.35));
		const bits = [];
		for (let i = 0; i < 30; i++) bits.push([-30 + (r() - 0.5) * 30, (r() - 0.5) * 12, 60 - r() * 30, r() * 6, r() * 6, r() * 6, 0.2 + r() * 0.5]);
		inst(k, new k.THREE.TetrahedronGeometry(1), k.mat(0xb8b8b0, { metal: 0.7, rough: 0.4 }), bits, { from: 5 });
		k.point(0xffffff, 8, 20, { x: -26, y: 3, z: 66, from: 5 });
		return {
			shots: [
				{ pos: [0, -30, 200], look: [300, -48, -400], fov: 45 },
				{ pos: [I + 0.1, 0.25, 1.6], look: [I, 0.1, -1], fov: 55, hide: ["stars"] },
				{ pos: [14, 3, 14], look: [-1, -2, 0], fov: 50 },
				{ pos: [16, 2, 20], look: [-6, 0, 0], fov: 60 },
				{ pos: [1.5, 5.5, 10.5], look: [7.5, 1.5, 3], fov: 55 },
				{ pos: [-27.8, 1, 63.4], look: [-30, 0.2, 60], fov: 50 },
			],
		};
	},
};
