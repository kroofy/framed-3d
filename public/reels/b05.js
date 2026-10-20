// Batch 05: r58–r67. Each reel is one shared world with far-off vignettes; shots go cryptic → obvious.
import { PI, rng, trees, city } from "../kit.js";

void trees;
void city;

/** Sets limb rotations on a k.person: { armL: [x, y, z], ... }. */
const limbs = (p, o) => {
	const l = p.userData.limbs;
	for (const key of Object.keys(o)) l[key].rotation.set(...o[key]);
	return p;
};

/** Points a mesh's +y axis along `dir`. */
const orient = (k, m, dir) => {
	m.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, 1, 0), dir.clone().normalize());
	return m;
};

/** A chain of cylinders through `pts` (Vector3s), coloured per segment. */
const chain = (k, pts, radius, color, o = {}) => {
	const out = [];
	for (let i = 0; i < pts.length - 1; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		const d = b.clone().sub(a);
		const rad = typeof radius === "function" ? radius(i / (pts.length - 1)) : radius;
		const m = k.cyl(rad, rad, d.length() * 1.08, typeof color === "function" ? color(i) : color, { ...o, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });
		orient(k, m, d);
		out.push(m);
	}
	return out;
};

/** A smooth curve sampled into n points. */
const curve = (k, pts, n) => new k.THREE.CatmullRomCurve3(pts.map((p) => new k.THREE.Vector3(...p))).getPoints(n);

/** The height of k.ground at (x, z), same formula as the kit. */
const groundY = (x, z, bump, h) => (h ? h(x, z) : 0) + (Math.sin(x * 0.7) * Math.cos(z * 0.6) + Math.sin(x * 0.23 + z * 0.31)) * bump * 0.5;

export const REELS = {
	// ----------------------------------------------------------------------------------------------- the cliffs
	r58: (k) => {
		k.fog(0xbcd2e2, 90, 520);
		k.sky(0x3f7fc4, 0xe4eef4);
		k.light({ sky: 0xeef4ff, ground: 0x5a5040, hemi: 1.3, sunPos: [60, 90, 90], sunIntensity: 2.3, shadowSize: 45, sunTarget: [0, 30, 0] });
		k.water(800, 0x2a6080, { seg: 64, amp: 0.3 });
		const r = rng(58);
		// The cliffs: a sheer face at z = 0, 48 high, with a grassy top.
		k.box(300, 48, 80, 0x6e665c, { y: 24, z: -40, rough: 1 });
		k.box(300, 0.8, 80, 0x5f7a3c, { y: 48.4, z: -40 });
		// Horizontal strata, each ledge sticking out a little.
		const strata = [0x8a7f70, 0x82786a, 0x918676, 0x7c7266, 0x877c6e];
		for (let y = -1, row = 0; y < 47.6; row++) {
			const h = Math.min(2.2 + r() * 1.8, 48 - y);
			for (let x = -110; x < 110; ) {
				const w = 8 + r() * 22;
				const d = 2 + r() * 2;
				let front = -0.4 + r() * 1.4;
				if (Math.abs(x + w / 2) < w / 2 + 2) front = Math.min(front, 0.5);
				k.box(w, h, d, strata[(row + Math.floor(r() * 2)) % 5], { x: x + w / 2, y: y + h / 2, z: front - d / 2, rough: 1 });
				x += w;
			}
			y += h;
		}
		// Ruins on the top, and the duel.
		const stone = 0xb0a692;
		[[-9, -8, 7], [-4, -8, 7], [8, -11, 4], [13, -15, 6], [-14, -18, 5]].forEach(([x, z, h]) => k.box(1.6, h, 1.6, stone, { x, y: 48.8 + h / 2, z, from: 4 }));
		k.box(7, 1.2, 1.8, stone, { x: -6.5, y: 48.8 + 7.6, z: -8, from: 4 });
		const sword = (p) => {
			k.box(0.05, 1.25, 0.05, 0xf0f4f8, { y: -1.3, metal: 0.7, rough: 0.2, parent: p.userData.limbs.armR });
			k.box(0.26, 0.05, 0.08, 0xc8a040, { y: -0.68, metal: 0.8, rough: 0.3, parent: p.userData.limbs.armR });
		};
		const black = { shirt: 0x161616, legs: 0x161616, hair: 0x101010, skin: 0xd8b090 };
		const mib = k.person({ x: -1.25, y: 48.8, z: -4, ry: PI / 2, shades: true, colors: black, from: 4 });
		limbs(mib, { armR: [-1.85, 0, 0], armL: [0.2, 0, -0.9], legL: [-0.35, 0, 0], legR: [0.3, 0, 0] });
		sword(mib);
		const inigo = k.person({ x: 1.25, y: 48.8, z: -4, ry: -PI / 2, colors: { shirt: 0x6a2a24, legs: 0x2a2420, hair: 0x1a1008, skin: 0xc8946a }, sleeves: 0xe8e0d0, from: 4 });
		limbs(inigo, { armR: [-1.25, 0, 0.12], armL: [0, 0, -2.4], legL: [-0.4, 0, 0], legR: [0.3, 0, 0] });
		sword(inigo);
		// The climb: a rope, the giant with two passengers, and the man in black below.
		k.cyl(0.06, 0.06, 47, 0xc8b080, { x: 0, y: 25, z: 1.3, from: 4, until: 4 });
		k.cyl(0.25, 0.25, 1.4, 0x5a4028, { x: 0, y: 49.4, z: -0.8, from: 4, until: 4 });
		const climber = (o, s) => limbs(k.person({ ...o, ry: PI, s, from: 4, until: 4 }), { armL: [PI + 0.15, 0, 0], armR: [PI + 0.35, 0, 0], legL: [-0.5, 0, 0], legR: [0.15, 0, 0] });
		climber({ x: 0, y: 29, z: 1.75, colors: { shirt: 0x8a6a40, legs: 0x5a4430, hair: 0x2a1a10, skin: 0xd0a080 } }, 1.6);
		const rider = (o) => limbs(k.person({ ...o, ry: PI, s: 0.8, from: 4, until: 4 }), { armL: [-1.3, 0, 0.3], armR: [-1.3, 0, -0.3], legL: [-0.4, 0, 0.2], legR: [-0.4, 0, -0.2] });
		rider({ x: -0.25, y: 30.0, z: 2.35, dress: 0xa8303a, colors: { shirt: 0xa8303a, legs: 0xa8303a, hair: 0xc89a50, skin: 0xf0c8a8 } });
		rider({ x: 0.35, y: 31.2, z: 2.3, hair: false, colors: { shirt: 0x3a2a3a, legs: 0x2a2028, skin: 0xd8b090 } });
		climber({ x: 0, y: 21.5, z: 1.65, shades: true, colors: black }, 1);
		// The ship below.
		const ship = k.group({ x: -16, y: 0, z: 22, ry: 0.5, from: 4 });
		k.box(3.2, 1.8, 10, 0x5a3a22, { y: 0.4, parent: ship });
		k.box(3.2, 1.2, 3, 0x6a4a2a, { y: 1.8, z: -3.5, parent: ship });
		k.cyl(0.12, 0.15, 11, 0x4a3020, { y: 6, parent: ship });
		k.box(5.5, 5, 0.12, 0xf0e8d8, { y: 6.5, z: 0.4, parent: ship });
		// Vignette: a battle of wits — two goblets on a cloth.
		const pic = k.group({ x: -300, y: -400 });
		k.ground(80, 0x8a9a5a, { parent: pic, bump: 0.8, seg: 20 });
		k.box(3.4, 1.2, 2.6, 0x8a8478, { y: 0.1, parent: pic, rough: 1 });
		k.box(2.4, 0.03, 1.8, 0xece2c8, { y: 0.715, parent: pic });
		const silver = { metal: 0.85, rough: 0.25 };
		const goblet = (x, z) => {
			const g = k.group({ x, y: 0.73, z, parent: pic });
			k.cyl(0.09, 0.1, 0.02, 0xc8ccd0, { y: 0.01, parent: g, seg: 16, ...silver });
			k.cyl(0.02, 0.03, 0.16, 0xc8ccd0, { y: 0.1, parent: g, ...silver });
			k.cyl(0.1, 0.045, 0.14, 0xc8ccd0, { y: 0.25, parent: g, seg: 16, ...silver });
			k.cyl(0.088, 0.088, 0.01, 0x5a0a18, { y: 0.322, parent: g, seg: 16, rough: 0.2 });
		};
		goblet(-0.22, 0.05);
		goblet(0.24, -0.06);
		k.cyl(0.03, 0.03, 0.1, 0xd8f0e8, { x: 0.02, y: 0.78, z: 0.3, opacity: 0.6, rough: 0.1, parent: pic });
		k.cyl(0.022, 0.022, 0.04, 0x8a6a40, { x: 0.02, y: 0.85, z: 0.3, parent: pic });
		k.capsule(0.08, 0.22, 0xc89050, { x: -0.65, y: 0.8, z: -0.3, rz: PI / 2, ry: 0.4, parent: pic });
		k.cyl(0.07, 0.08, 0.3, 0x1a3a20, { x: 0.7, y: 0.88, z: -0.35, parent: pic, rough: 0.2 });
		k.cyl(0.025, 0.04, 0.14, 0x1a3a20, { x: 0.7, y: 1.1, z: -0.35, parent: pic, rough: 0.2 });
		[[-0.5, 0.35], [-0.38, 0.45], [0.55, 0.2]].forEach(([x, z]) => k.sphere(0.06, 0xb02020, { x, y: 0.79, z, parent: pic }));
		k.point(0xfff0d0, 3, 6, { x: -299, y: -398, z: 1.5 });
		// Vignette: the fire swamp, its flame spurts and its rodents.
		const sw = k.group({ x: 300, y: -400 });
		k.ground(140, 0x4a4a2a, { parent: sw, bump: 0.9, seg: 30 });
		for (let i = 0; i < 50; i++) {
			const x = (r() - 0.5) * 50;
			const z = 4 - r() * 44;
			if (Math.abs(x - 1) < 5 && z > -14) continue;
			const h = 6 + r() * 6;
			const lean = (r() - 0.5) * 0.4;
			k.cyl(0.25, 0.7, h, 0x4a3a2c, { x, y: h / 2 - 0.4, z, rz: lean, parent: sw, seg: 6 });
			k.ico(2 + r() * 1.5, [0x3a4a22, 0x4a5228, 0x2e3a1c][i % 3], { x: x - (lean * h) / 2, y: h - 0.4, z, s: [1.3, 0.6, 1.3], parent: sw });
			for (let j = 0; j < 3; j++) k.box(0.06, 1.5 + r() * 1.5, 0.06, 0x9aa070, { x: x - (lean * h) / 2 + (r() - 0.5) * 2.4, y: h - 1.8, z: z + (r() - 0.5) * 2.4, parent: sw, shadow: false });
		}
		k.cyl(1.4, 1.4, 0.02, 0xd8c8a0, { x: -2.5, y: 0.25, z: -6, parent: sw, seg: 20, rough: 1 });
		const jet = k.group({ x: 2.5, y: 0, z: -9, parent: sw });
		k.cyl(0.6, 0.9, 0.4, 0x2a2018, { y: 0.1, parent: jet });
		const flames = [];
		for (let i = 0; i < 6; i++) flames.push(k.cone(1.3 * (1 - i / 8), 2.0, [0xff4010, 0xff7020, 0xffa030, 0xffc040, 0xffe080, 0xfff0c0][i], { y: 1.0 + i * 0.8, parent: jet, emissive: [0xff3000, 0xff6010, 0xff9020, 0xffb030, 0xffd060, 0xffe8a0][i], glow: 1.4, seg: 7 }));
		k.glow(0xff8a30, 9, { y: 3, parent: jet });
		const flameLight = k.point(0xff7a20, 30, 35, { y: 3, z: 1, parent: jet });
		k.tick((t) => {
			flames.forEach((f, i) => {
				f.scale.set(1 + 0.15 * Math.sin(t * 13 + i), 1 + 0.25 * Math.sin(t * 9 + i * 2), 1);
				f.position.x = Math.sin(t * 7 + i) * 0.08 * i;
			});
			flameLight.intensity = 26 + 6 * Math.sin(t * 17);
		});
		const rat = k.group({ x: -1.2, z: -3.5, ry: 0.55, parent: sw, from: 3 });
		const fur = 0x5a4434;
		k.capsule(0.75, 1.6, fur, { y: 1.05, rx: PI / 2, s: [1, 1, 0.9], parent: rat });
		k.sphere(0.62, fur, { y: 1.35, z: 1.5, parent: rat });
		k.cone(0.42, 1.4, 0x6a5040, { y: 1.18, z: 2.5, rx: PI / 2, parent: rat });
		k.sphere(0.11, 0xc87a80, { y: 1.18, z: 3.2, parent: rat });
		[-1, 1].forEach((s) => [0, 1].forEach((j) => k.box(0.9, 0.015, 0.015, 0xd8d0c0, { x: s * 0.4, y: 1.2 + j * 0.06, z: 3.0, ry: s * 0.3, rz: s * (j - 0.5) * 0.3, parent: rat, shadow: false })));
		[-0.3, 0.3].forEach((x) => {
			k.sphere(0.1, 0xff2010, { x, y: 1.58, z: 1.98, emissive: 0xff2000, glow: 2, parent: rat });
			k.sphere(0.36, 0xa87a70, { x: x * 1.6, y: 2.0, z: 1.2, s: [1, 1, 0.3], parent: rat });
			[-0.9, 0.9].forEach((z) => k.box(0.22, 0.75, 0.3, fur, { x: x * 1.7, y: 0.37, z, parent: rat }));
		});
		k.box(0.16, 0.26, 0.05, 0xf0e8c0, { y: 0.92, z: 2.9, parent: rat });
		chain(k, curve(k, [[0, 0.9, -1.8], [0.4, 0.4, -3], [1.6, 0.25, -4.4], [3.2, 0.25, -4.8], [4.4, 0.3, -4.2]], 14), (t) => 0.12 * (1 - t) + 0.03, 0xc89a90, { parent: rat, seg: 6 });
		k.point(0xffd8a0, 8, 20, { x: 302, y: -396, z: 4 });
		// Vignette: the grandfather reading to his grandson.
		const room = k.group({ x: 0, y: -400, z: 300 });
		k.box(10, 0.2, 10, 0x7a5a3a, { y: -0.1, parent: room });
		k.box(10, 5, 0.2, 0x7a9ab0, { y: 2.5, z: -5, parent: room });
		k.box(0.2, 5, 10, 0x8aa8bc, { x: -5, y: 2.5, parent: room });
		k.box(1.6, 1.8, 0.05, 0x1a2a48, { x: 2, y: 2.6, z: -4.88, parent: room, emissive: 0x101830 });
		k.box(1.8, 0.12, 0.12, 0xf0ece0, { x: 2, y: 3.55, z: -4.85, parent: room });
		k.box(1.8, 0.12, 0.12, 0xf0ece0, { x: 2, y: 1.65, z: -4.85, parent: room });
		k.box(0.1, 1.8, 0.1, 0xf0ece0, { x: 2, y: 2.6, z: -4.84, parent: room });
		// The bed and the boy.
		k.box(2, 0.5, 3.4, 0x8a5a3a, { x: -2.5, y: 0.25, z: -3.2, parent: room });
		k.box(2.2, 1.6, 0.15, 0x6a4028, { x: -2.5, y: 0.8, z: -4.85, parent: room });
		k.box(1.9, 0.25, 3.2, 0xf0ece0, { x: -2.5, y: 0.62, z: -3.2, parent: room });
		k.box(1.4, 0.3, 0.6, 0xffffff, { x: -2.5, y: 0.88, z: -4.4, rx: -0.4, parent: room });
		const boy = k.person({ x: -2.5, y: 0.25, z: -3.95, rx: -0.25, s: 0.7, pose: "sit", colors: { shirt: 0x8ab0d8, legs: 0x8ab0d8, hair: 0x8a5a30, skin: 0xf0c8a8 }, parent: room });
		limbs(boy, { armL: [-0.3, 0, -0.2], armR: [-0.3, 0, 0.2] });
		k.box(2, 0.3, 2.3, 0x3a5a9a, { x: -2.5, y: 0.86, z: -2.3, parent: room });
		k.box(0.8, 0.8, 0.8, 0x6a4028, { x: -0.9, y: 0.4, z: -4.3, parent: room });
		k.cyl(0.08, 0.12, 0.5, 0xd8c8a0, { x: -0.9, y: 1.05, z: -4.3, parent: room });
		k.cyl(0.2, 0.32, 0.35, 0xf0e0b0, { x: -0.9, y: 1.4, z: -4.3, parent: room, emissive: 0x806030, open: true });
		k.point(0xffc880, 6, 10, { x: -0.9, y: -398.5, z: 295.8 });
		// The grandfather's chair, footstool and book.
		const chair = k.group({ x: -0.3, y: 0, z: -2.3, parent: room });
		k.box(1.1, 0.5, 1.1, 0x7a2a2a, { y: 0.25, parent: chair });
		k.box(0.25, 1.4, 1.1, 0x7a2a2a, { x: 0.45, y: 0.95, parent: chair });
		[-0.5, 0.5].forEach((z) => k.box(1.1, 0.35, 0.18, 0x6a2222, { y: 0.65, z, parent: chair }));
		k.box(0.6, 0.45, 0.6, 0x7a2a2a, { x: -0.95, y: 0.22, z: -2.3, parent: room });
		const gramps = k.person({ x: 0.1, y: -0.25, z: -2.3, ry: -PI / 2, pose: "sit", colors: { shirt: 0x8a7a5a, legs: 0x4a4a50, hair: 0xc8c8c8, skin: 0xe0b090 }, parent: room });
		limbs(gramps, { armL: [-1.0, 0, -0.25], armR: [-1.0, 0, 0.25] });
		k.box(0.48, 0.04, 0.34, 0x8a1a1a, { y: 1.22, z: 0.62, rx: 0.5, parent: gramps });
		[-0.11, 0.11].forEach((x) => k.box(0.22, 0.03, 0.32, 0xf4ecd8, { x, y: 1.25, z: 0.62, rx: 0.5, rz: -x, parent: gramps }));
		return {
			shots: [
				// 1: a flame spurt in a dim, mossy wood.
				{ pos: [297.5, -397.8, 6], look: [301.8, -396.3, -8], fov: 50, fog: [0x4a4a30, 6, 55], exposure: 1.25 },
				// 2: two goblets on a picnic cloth.
				{ pos: [-299.05, -398.75, 0.95], look: [-300, -399.15, 0], fov: 40, fog: [0xd8e2d0, 8, 60] },
				// 3: a grandfather reading to a sick boy.
				{ pos: [-3.7, -397.6, 302.6], look: [-1.0, -399, 297.2], fov: 48, fog: [0x2a1c14, 12, 40], exposure: 1.2 },
				// 4: the rodent of unusual size.
				{ pos: [303.8, -398.5, -4.6], look: [299.4, -398.9, -2.6], fov: 50, fog: [0x4a4a30, 6, 50], exposure: 1.25 },
				// 5: the giant climbs the cliffs with a rope.
				{ pos: [-5, 39, 9], look: [0, 26, 2], fov: 55 },
				// 6: the duel on top of the cliffs.
				{ pos: [4.6, 50.5, -9], look: [0, 50.0, -3.6], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the topiary
	r59: (k) => {
		k.fog(0xd2e6f2, 80, 420);
		k.sky(0x5aa0e8, 0xe8f4fa);
		k.light({ sky: 0xf4f8ff, ground: 0x6a8a50, hemi: 1.3, sunPos: [40, 70, 50], sunIntensity: 2.2, shadowSize: 60, sunTarget: [0, 0, -10] });
		k.ground(600, 0x7ac05a, { bump: 0.1, seg: 20 });
		k.box(9, 0.06, 240, 0x6a6e76, { y: 0.03, z: -60 });
		[-5.6, 5.6].forEach((x) => k.box(2.2, 0.1, 240, 0xe0dcd4, { x, y: 0.05, z: -60 }));
		const pastel = [0xa8e0d0, 0xf4b8c8, 0xf8e8a0, 0xa8c8f0, 0xc8b0e8, 0xf8c8a0];
		const house = (x, z, i) => {
			const c = pastel[i % pastel.length];
			const g = k.group({ x, z, ry: x > 0 ? -PI / 2 : PI / 2 });
			k.box(10, 3.6, 8, c, { y: 1.8, parent: g });
			k.cone(7.2, 1.6, 0xf4f0ec, { y: 4.4, ry: PI / 4, seg: 4, s: [1, 1, 0.8], parent: g });
			k.box(3.6, 2.4, 0.1, 0xffffff, { x: 2.8, y: 1.2, z: 4.03, parent: g });
			k.box(1, 2, 0.1, 0xffffff, { x: -1.4, y: 1, z: 4.03, parent: g });
			[-3.6, -0.2].forEach((wx) => k.box(1.2, 1, 0.1, 0x4a6a8a, { x: wx, y: 2.1, z: 4.03, parent: g }));
			k.box(3.6, 0.05, 5, 0xd8d4cc, { x: 2.8, y: 0.03, z: 6.5, parent: g });
			// The same car in every driveway.
			k.box(1.8, 0.7, 3.6, pastel[(i + 3) % pastel.length], { x: 2.8, y: 0.6, z: 7, parent: g });
			k.box(1.6, 0.6, 1.8, 0xe8f0f8, { x: 2.8, y: 1.25, z: 6.8, parent: g, opacity: 0.9 });
			[-0.8, 0.8].forEach((wx) => [-1.2, 1.2].forEach((wz) => k.cyl(0.32, 0.32, 0.2, 0x222222, { x: 2.8 + wx, y: 0.32, z: 7 + wz, rz: PI / 2, parent: g })));
			k.box(10, 0.6, 0.6, 0x3a8a3a, { x: 0, y: 0.3, z: 4.6, parent: g });
		};
		[30, 12, -6, -24, -42, -60, -78, -96].forEach((z, i) => {
			house(17, z, i);
			house(-17, z + 6, i + 2);
		});
		// Topiary animals on one lawn.
		const hedge = 0x2e7a34;
		const leafy = (r, o) => k.ico(r, hedge, { detail: 1, ...o });
		const dino = k.group({ x: 9, z: 7, ry: -0.5, from: 2 });
		leafy(1.1, { y: 1.6, s: [1.6, 1, 1], parent: dino });
		[-0.7, 0.7].forEach((x) => [-0.4, 0.4].forEach((z) => k.box(0.35, 1, 0.35, hedge, { x, y: 0.5, z, parent: dino })));
		chain(k, curve(k, [[1.2, 2, 0], [1.9, 3.2, 0], [2.2, 4.3, 0]], 6), 0.3, hedge, { parent: dino, seg: 8 });
		leafy(0.45, { x: 2.5, y: 4.5, s: [1.4, 0.8, 0.8], parent: dino });
		k.cone(0.7, 2.6, hedge, { x: -2.6, y: 1.4, rz: PI / 2 + 0.3, parent: dino, seg: 8 });
		const bird = k.group({ x: 10.5, z: -1, ry: 0.6, from: 2 });
		leafy(0.9, { y: 1, s: [1.3, 0.8, 0.9], parent: bird });
		chain(k, curve(k, [[0.8, 1.3, 0], [1.2, 2.3, 0], [0.9, 3.1, 0], [1.4, 3.2, 0]], 8), 0.18, hedge, { parent: bird, seg: 8 });
		k.cone(0.9, 1.4, hedge, { x: -1.2, y: 1.6, rz: 0.9, parent: bird, seg: 8 });
		const hand = k.group({ x: 10, z: 14, ry: -0.3, from: 2 });
		k.box(0.6, 1.2, 0.6, hedge, { y: 0.6, parent: hand });
		leafy(0.9, { y: 2, s: [1, 1.1, 0.6], parent: hand });
		[-0.6, -0.2, 0.2, 0.6].forEach((x, i) => k.capsule(0.17, 0.9 + (i % 3) * 0.2, hedge, { x, y: 3.2, parent: hand }));
		k.capsule(0.17, 0.7, hedge, { x: -1, y: 2.2, rz: 0.9, parent: hand });
		k.cone(0.6, 2.4, hedge, { x: 9, y: 1.2, z: -8, seg: 8, from: 2 });
		// The castle on the hill at the end of the street.
		const hill = k.group({ x: 0, z: -175, from: 3 });
		k.sphere(60, 0x34402f, { y: -10, s: [1.4, 1, 1], seg: 18, rings: 12, parent: hill });
		const dark = 0x2a2a32;
		k.box(18, 18, 14, dark, { y: 57, parent: hill });
		k.box(9, 12, 9, dark, { x: -3, y: 72, parent: hill });
		k.cone(6.5, 9, 0x1c1c22, { x: -3, y: 82.5, seg: 4, ry: PI / 4, parent: hill });
		[[-10, 0, 30], [10, 2, 26], [4, -5, 38], [-6, 5, 20], [14, -4, 18]].forEach(([x, z, h]) => {
			k.cyl(2.4, 2.8, h, dark, { x, y: 48 + h / 2, z, seg: 8, parent: hill });
			k.cone(3.2, 8, 0x1c1c22, { x, y: 48 + h + 4, z, seg: 8, parent: hill });
		});
		k.box(1.6, 3.4, 0.2, 0x8a7a50, { y: 60, z: 7.1, parent: hill, emissive: 0x403010 });
		// Vignette: the attic in winter — an ice angel and falling snow.
		const att = k.group({ x: 0, y: -400, z: 0 });
		k.box(30, 0.4, 30, 0x4a4450, { y: -0.2, parent: att });
		k.box(30, 12, 0.4, 0x3a3644, { y: 6, z: -8, parent: att });
		k.box(1.2, 1, 1.2, 0x6a6672, { y: 0.5, parent: att });
		const ice = { emissive: 0x3a7ab0, glow: 0.5, opacity: 0.85, rough: 0.1, metal: 0.1 };
		const angel = k.group({ y: 1, parent: att });
		k.cone(0.55, 1.8, 0xbfe8ff, { y: 0.9, seg: 8, parent: angel, ...ice });
		k.sphere(0.22, 0xbfe8ff, { y: 2.0, parent: angel, flat: false, ...ice });
		[-1, 1].forEach((s) => {
			k.box(0.08, 1.6, 0.8, 0xd0f0ff, { x: s * 0.5, y: 1.9, z: -0.35, rz: s * -0.5, ry: s * 0.3, parent: angel, ...ice });
			k.capsule(0.07, 0.6, 0xbfe8ff, { x: s * 0.22, y: 1.55, z: 0.25, rx: -1.2, rz: s * 0.4, parent: angel, ...ice });
		});
		k.particles(1600, 0xffffff, { x: 0, y: -400, z: 0, box: [18, 10, 18], speed: 1.2, size: 0.045, drift: 0.6, opacity: 0.95 });
		k.spot(0xd8e8ff, 50, { x: 1, y: -392, z: 4, target: [0, -398, 0], angle: 0.6, distance: 30 });
		k.point(0x9ab8ff, 6, 20, { x: -3, y: -397, z: 4 });
		k.point(0xffe0c0, 3, 12, { x: 4, y: -397, z: 3 });
		// The man with scissors for hands.
		const ed = k.person({ x: 1.05, y: 0, z: -0.55, ry: -0.55, colors: { shirt: 0x1a1a1e, legs: 0x1a1a1e, hair: 0x0a0a0a, skin: 0xf2eeea }, from: 4, parent: att });
		limbs(ed, { armR: [-1.75, 0, 0.3], armL: [-1.2, 0, -0.55] });
		const el = ed.userData.limbs;
		[el.armL, el.armR].forEach((arm) => {
			for (let i = 0; i < 4; i++) k.box(0.03, 0.62, 0.015, 0xe0e4ec, { x: (i - 1.5) * 0.06, y: -1.0, rz: (i - 1.5) * 0.35, rx: (i % 2) * 0.3, metal: 0.8, rough: 0.2, parent: arm });
			k.box(0.18, 0.04, 0.18, 0x8a8a90, { y: -0.4, metal: 0.6, parent: arm });
		});
		[1.0, 1.2, 1.4].forEach((y) => k.box(0.52, 0.035, 0.3, 0x6a6a72, { y, metal: 0.6, parent: ed }));
		const hr = rng(9);
		for (let i = 0; i < 18; i++) {
			const d = new k.THREE.Vector3(hr() - 0.5, 0.35 + hr() * 0.8, hr() - 0.75).normalize();
			orient(k, k.cone(0.05, 0.32, 0x0a0a0a, { x: d.x * 0.2, y: d.y * 0.2 + 0.02, z: d.z * 0.2, parent: el.head, seg: 4 }), d);
		}
		[-0.08, 0.08].forEach((x) => k.sphere(0.035, 0x2a2030, { x, y: 0.02, z: 0.18, parent: el.head }));
		const kim = k.person({ x: -2.2, y: 0, z: 1.8, pose: "arms-out", dress: 0xeae6f2, colors: { shirt: 0xeae6f2, legs: 0xf0d0b8, hair: 0xf0d890, skin: 0xf2d0b8 }, from: 5, parent: att });
		limbs(kim, { armL: [0, 0, -2.2], armR: [0, 0, 2.2] });
		k.tick((t) => (kim.rotation.y = t * 1.2));
		// Vignette: a door-to-door saleswoman's cosmetics case, open on a doorstep.
		const av = k.group({ x: 300, y: -400, z: 0 });
		k.box(14, 0.4, 14, 0xd8d4cc, { y: -0.2, parent: av });
		k.box(14, 0.3, 4, 0x7ac05a, { y: -0.1, z: 3.5, parent: av });
		k.box(3.2, 0.25, 1.4, 0xe8e4dc, { y: 0.12, z: -1.2, parent: av });
		k.box(1.6, 0.03, 0.9, 0x8a6a4a, { y: 0.27, z: -1.2, parent: av });
		k.box(14, 6, 0.3, 0xf4b8c8, { y: 3, z: -2.2, parent: av });
		k.box(1.5, 2.6, 0.1, 0xffffff, { y: 1.55, z: -2.0, parent: av });
		k.box(1.2, 2.4, 0.08, 0xa8e0d0, { y: 1.5, z: -1.94, parent: av });
		k.sphere(0.05, 0xd8c070, { x: 0.42, y: 1.3, z: -1.88, metal: 0.8, rough: 0.3, parent: av });
		const cs = k.group({ x: 0.1, y: 0.28, z: -0.6, ry: -0.25, parent: av });
		const lilac = 0xb89ad8;
		k.box(0.9, 0.18, 0.56, lilac, { y: 0.09, parent: cs });
		k.box(0.82, 0.02, 0.48, 0xf4ecf4, { y: 0.17, parent: cs });
		const lid = k.group({ y: 0.18, z: -0.28, rx: -1.9, parent: cs });
		k.box(0.9, 0.04, 0.56, lilac, { z: 0.28, parent: lid });
		k.box(0.8, 0.01, 0.46, 0xd8c8e8, { y: 0.03, z: 0.28, parent: lid });
		k.box(0.3, 0.1, 0.02, 0xf4f0f8, { y: 0.04, z: 0.42, rx: 0.2, parent: lid });
		[-0.3, 0.3].forEach((x) => k.box(0.08, 0.05, 0.03, 0xd8c070, { x, y: 0.12, z: 0.285, metal: 0.8, rough: 0.3, parent: cs }));
		const tips = [0xc8202a, 0xe0507a, 0xa8203a, 0xf07a6a, 0xd83a5a, 0x8a1a2a];
		for (let i = 0; i < 6; i++) {
			k.cyl(0.028, 0.028, 0.1, 0xd8b850, { x: -0.34 + i * 0.07, y: 0.22, z: -0.12, metal: 0.8, rough: 0.3, parent: cs });
			k.cyl(0.02, 0.022, 0.05, tips[i], { x: -0.34 + i * 0.07, y: 0.295, z: -0.12, parent: cs, rough: 0.3 });
		}
		[[0.12, 0.08, 0xf0d8c8], [0.3, 0.06, 0xe8c0b0], [0.21, -0.1, 0x9ab8e0]].forEach(([x, z, c]) => {
			k.cyl(0.075, 0.075, 0.03, 0xd8d0d8, { x, y: 0.19, z, seg: 18, metal: 0.6, rough: 0.3, parent: cs });
			k.cyl(0.06, 0.06, 0.01, c, { x, y: 0.205, z, seg: 18, parent: cs });
		});
		[[-0.32, 0.1], [-0.2, 0.12]].forEach(([x, z], i) => {
			k.box(0.08, 0.12, 0.05, i ? 0xf0c8e0 : 0xc8e8f0, { x, y: 0.24, z, opacity: 0.8, rough: 0.1, parent: cs });
			k.cyl(0.015, 0.015, 0.04, 0xd8b850, { x, y: 0.32, z, metal: 0.8, parent: cs });
		});
		k.cyl(0.14, 0.14, 0.04, 0xf0e0f0, { x: 0.75, y: 0.29, z: -0.55, seg: 18, parent: av });
		k.point(0xfff4e8, 6, 10, { x: 301.5, y: -397.5, z: 1.5 });
		return {
			shots: [
				// 1: an open cosmetics case on a doorstep.
				{ pos: [300.75, -399.05, 0.85], look: [300.1, -399.6, -0.6], fov: 42, fog: [0xe8eef2, 8, 40] },
				{ pos: [-2, 2.4, 40], look: [8, 2, 8], fov: 45 },
				{ pos: [3, 2, 16], look: [10, 1.8, 6], fov: 50 },
				{ pos: [0, 3, 42], look: [0, 30, -190], fov: 38 },
				{ pos: [2.0, -398.05, 1.9], look: [0.85, -398.25, -0.5], fov: 45, fog: [0x1c2848, 6, 40], exposure: 1.3 },
				{ pos: [2.6, -397.7, 6.4], look: [-0.7, -398.5, 0.3], fov: 50, fog: [0x1c2848, 8, 45], exposure: 1.3 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the striped ghost
	r60: (k) => {
		k.fog(0xc8ccc4, 70, 420);
		k.sky(0x7a98b8, 0xe4e2d8);
		k.light({ sky: 0xf0f0e8, ground: 0x5a5a40, hemi: 1.25, sunPos: [50, 60, 70], sunIntensity: 2.1, shadowSize: 70, sunTarget: [0, 0, 0] });
		const hillH = (x, z) => 16 * Math.exp(-(x * x + (z + 60) * (z + 60)) / 1400) - 3.2 * Math.exp(-(((z - 40) / 6) ** 2));
		k.ground(600, 0x6a8a46, { bump: 0.5, seg: 100, height: hillH });
		k.box(600, 0.1, 14, 0x4a7088, { y: -1.5, z: 40, rough: 0.25, metal: 0.1 });
		const r = rng(60);
		const autumn = [0xc85a20, 0xe0a030, 0xa83020, 0x8a9a30, 0xd87a28];
		for (let i = 0; i < 120; i++) {
			const x = (r() - 0.5) * 260;
			const z = (r() - 0.5) * 260 - 30;
			if (Math.abs(z - 40) < 11 || (Math.abs(x) < 14 && z > -80 && z < 60) || Math.hypot(x, z + 60) < 24) continue;
			const y = groundY(x, z, 0.5, hillH);
			const h = 5 + r() * 5;
			k.cyl(0.2, 0.35, h * 0.5, 0x4a3020, { x, y: y + h * 0.25, z });
			k.ico(h * 0.35, autumn[i % autumn.length], { x, y: y + h * 0.65, z, s: [1, 1.2, 1] });
		}
		// The road up the hill and the covered bridge.
		k.box(4, 0.08, 110, 0x8a8478, { y: 0.1, z: -24 });
		const bridge = k.group({ x: 0, z: 40 });
		[-10, 10].forEach((z) => k.box(6, 4, 3, 0x8a8478, { y: -1.4, z, parent: bridge, rough: 1 }));
		k.box(4.6, 0.4, 20, 0x6a4a30, { y: 0.7, parent: bridge });
		[-2.2, 2.2].forEach((x) => k.box(0.25, 3, 20, 0xa83a2a, { x, y: 2.4, parent: bridge }));
		[-2.25, 2.25].forEach((x) => [-1, 1].forEach((s) => k.box(0.28, 0.3, 4, 0xf0ece0, { x, y: 2.6, z: s * 4, parent: bridge })));
		[-1, 1].forEach((s) => k.box(2.8, 0.2, 21, 0x4a3a34, { x: s * 1.1, y: 4.55, rz: -s * 0.6, parent: bridge }));
		[-10, 10].forEach((z) => k.box(4.6, 1.1, 0.25, 0xa83a2a, { y: 4.3, z, parent: bridge }));
		// The Victorian house on the hill.
		const home = k.group({ x: 0, y: 15.2, z: -60, ry: 0.15 });
		const wall = 0xd4ccbe;
		const roof = 0x4a4a52;
		k.box(10, 8, 8, wall, { y: 3, parent: home });
		k.box(6, 4, 6, wall, { x: -2, y: 9, parent: home });
		k.cone(5.8, 5, roof, { y: 9.5, ry: PI / 4, seg: 4, s: [1.15, 1, 1], x: 2.5, parent: home });
		k.cone(4.6, 5, roof, { x: -2, y: 13.5, ry: PI / 4, seg: 4, parent: home });
		k.cyl(1.8, 1.8, 13, wall, { x: 4.5, y: 4.5, z: 3.8, seg: 8, parent: home });
		k.cone(2.3, 5, roof, { x: 4.5, y: 13.5, z: 3.8, seg: 8, parent: home });
		k.box(10.5, 0.3, 2.6, 0xe8e2d8, { y: 2.4, z: 5.2, parent: home });
		[-4.8, -1.5, 1.8].forEach((x) => k.box(0.2, 2.6, 0.2, 0xe8e2d8, { x, y: 1.1, z: 6.3, parent: home }));
		[[-3, 4.2], [0, 4.2], [-3, 1.0], [-2, 9.5]].forEach(([x, y]) => k.box(1, 1.6, 0.1, 0x2a2a34, { x, y, z: y > 8 ? 3.05 : 4.05, parent: home }));
		k.box(1.2, 2.2, 0.1, 0x3a2a24, { x: 0.8, y: 0.1, z: 4.05, parent: home });
		k.box(12, 6, 10, 0x6a6a5a, { y: -3, parent: home });
		// Vignette: the model town in the attic.
		const att = k.group({ x: 0, y: -400, z: 0 });
		k.box(60, 0.4, 60, 0x5a4030, { y: -6, parent: att });
		k.box(24, 1, 14, 0x7a5a3a, { y: -0.5, parent: att });
		[-11, 11].forEach((x) => [-6, 6].forEach((z) => k.box(0.8, 5.5, 0.8, 0x6a4a2a, { x, y: -3.5, z, parent: att })));
		k.box(22, 0.3, 12, 0x6a8a46, { y: 0.15, parent: att });
		k.box(1.4, 0.32, 12, 0x8a8478, { x: 1, y: 0.16, parent: att });
		k.box(22, 0.32, 1.2, 0x4a6a80, { y: 0.17, z: 3.5, parent: att });
		const mini = (x, z, c, ry = 0) => {
			const g = k.group({ x, y: 0.3, z, ry, parent: att });
			k.box(1.2, 0.9, 1, c, { y: 0.45, parent: g });
			k.cone(0.95, 0.7, 0x5a4a44, { y: 1.25, ry: PI / 4, seg: 4, s: [1, 1, 0.85], parent: g });
			k.box(0.25, 0.4, 0.05, 0x3a2a24, { y: 0.2, z: 0.52, parent: g });
		};
		[[-7, -2, 0xe8e0d0], [-4.5, -1, 0xd8a8a0], [-7, 1.5, 0xc8d8e0], [4, -1.5, 0xe8d8a8], [6.5, -0.5, 0xffffff], [4.5, 1.8, 0xd0c0e0], [8.5, 1.4, 0xe0e8c8], [-3.8, 1.8, 0xf0e0c0]].forEach(([x, z, c], i) => mini(x, z, c, (i % 3) * 0.3));
		for (let i = 0; i < 26; i++) {
			const x = (r() - 0.5) * 21;
			const z = -5.5 + r() * 3;
			if (Math.abs(x - 1) < 1.2) continue;
			k.cone(0.3, 0.9, autumn[i % 5], { x, y: 0.75, z, parent: att, seg: 6 });
		}
		const mh = k.group({ x: 1, y: 0.3, z: -4.2, parent: att });
		k.sphere(2.4, 0x6a8a46, { y: -1.2, s: [1.4, 0.8, 1], parent: mh });
		k.box(1.8, 1.4, 1.4, wall, { y: 1.3, parent: mh });
		k.cone(1.3, 1.3, roof, { y: 2.65, ry: PI / 4, seg: 4, parent: mh });
		k.cyl(0.3, 0.3, 2.2, wall, { x: 0.8, y: 1.4, z: 0.6, seg: 8, parent: mh });
		k.cone(0.4, 0.9, roof, { x: 0.8, y: 2.95, z: 0.6, seg: 8, parent: mh });
		const mb = k.group({ x: 1, y: 0.3, z: 3.5, parent: att });
		k.box(1.2, 0.6, 2.4, 0xa83a2a, { y: 0.5, parent: mb });
		k.cone(0.9, 0.5, 0x4a3a34, { y: 1.05, ry: PI / 4, seg: 4, s: [1, 1, 2.2], parent: mb });
		// The model graveyard.
		for (let i = 0; i < 12; i++) k.box(0.22, 0.32, 0.07, 0x9a9a9a, { x: -3.6 + (i % 4) * 0.55 + 7.6, y: 0.46, z: 4.6 + Math.floor(i / 4) * 0.5, parent: att });
		for (let i = 0; i < 12; i++) k.box(0.04, 0.25, 0.04, 0x222222, { x: 3.7 + i * 0.22, y: 0.43, z: 4.3, parent: att });
		// The attic around it.
		k.box(60, 30, 0.5, 0x5a4434, { y: 5, z: -12, parent: att });
		k.cyl(2.2, 2.2, 0.6, 0xd8e0e8, { y: 7, z: -11.6, rx: PI / 2, seg: 20, parent: att, emissive: 0x8090a0 });
		[-1, 1].forEach((s) => k.box(30, 0.5, 30, 0x4a3828, { x: s * 16, y: 12, rz: s * -0.6, parent: att }));
		k.cyl(0.01, 0.01, 5, 0x111111, { y: 8.5, z: 1, parent: att });
		k.glow(0xfff0c0, 1.6, { y: 6, z: 1, parent: att });
		k.point(0xffe0b0, 25, 25, { x: 0, y: -394, z: 1 });
		k.point(0xd0d8ff, 8, 30, { x: 6, y: -396, z: 10 });
		// The ghost in stripes, in his model graveyard.
		const stripes = (n) => {
			const tex = k.canvas(64, 64, (g) => {
				for (let i = 0; i < 8; i++) {
					g.fillStyle = i % 2 ? "#141414" : "#f0eee6";
					g.fillRect(i * 8, 0, 8, 64);
				}
			});
			tex.wrapS = k.THREE.RepeatWrapping;
			tex.repeat.set(n, 1);
			return k.mat(0xffffff, { map: tex });
		};
		const suit = stripes(1.2);
		const thin = stripes(0.5);
		const gh = k.group({ x: 5.6, y: 0.3, z: 5.2, ry: -0.3, from: 5, parent: att });
		[-0.14, 0.14].forEach((x) => k.box(0.22, 0.9, 0.22, thin, { x, y: 0.45, parent: gh }));
		k.box(0.6, 0.8, 0.32, suit, { y: 1.28, parent: gh });
		k.box(0.18, 0.3, 0.02, 0xf0f0e8, { y: 1.52, z: 0.165, parent: gh });
		k.box(0.06, 0.26, 0.02, 0x141414, { y: 1.5, z: 0.18, parent: gh });
		[-1, 1].forEach((s) => {
			const arm = k.group({ x: s * 0.4, y: 1.62, parent: gh, rz: s * 2.2, rx: -0.3 });
			k.box(0.18, 0.72, 0.18, thin, { y: -0.36, parent: arm });
			k.sphere(0.1, 0xd0d4b8, { y: -0.78, parent: arm });
		});
		k.sphere(0.23, 0xd8dcc4, { y: 1.95, s: [0.95, 1.1, 0.95], parent: gh });
		[-0.08, 0.08].forEach((x) => k.sphere(0.06, 0x4a3050, { x, y: 1.99, z: 0.17, s: [1, 0.8, 0.6], parent: gh }));
		k.box(0.16, 0.05, 0.03, 0x3a3a20, { y: 1.85, z: 0.21, parent: gh });
		const hair = rng(3);
		for (let i = 0; i < 20; i++) {
			const d = new k.THREE.Vector3(hair() - 0.5, 0.3 + hair(), hair() - 0.7).normalize();
			orient(k, k.cone(0.07, 0.28, [0xb8c878, 0xa0b860, 0xd0d890][i % 3], { x: d.x * 0.2, y: 1.98 + d.y * 0.2, z: d.z * 0.2, seg: 4, parent: gh }), d);
		}
		// Vignette: the desert with a striped worm.
		const sat = k.group({ y: 400 });
		k.sky(0x3a2a7a, 0xe0a858, { r: 280, y: 400, tag: "dsky", from: 3, until: 4 });
		k.ground(520, 0xe0b058, { parent: sat, bump: 3, seg: 50 });
		k.sphere(26, 0xd890a0, { x: 70, y: 110, z: -200, parent: sat, emissive: 0x6a3040, seg: 24 });
		const ringGeo = new k.THREE.RingGeometry(34, 46, 48);
		k.mesh(ringGeo, k.mat(0xf0d8a0, { side: k.THREE.DoubleSide, emissive: 0x6a5020 }), { x: 70, y: 110, z: -200, rx: -1.2, ry: 0.3, parent: sat, shadow: false });
		k.sphere(10, 0x8ad0c0, { x: -90, y: 70, z: -180, parent: sat, emissive: 0x2a5a50 });
		for (let i = 0; i < 14; i++) {
			const h = 6 + r() * 16;
			const x = (r() - 0.5) * 200;
			const z = -40 - r() * 120;
			k.cyl(1 + r() * 2, 3 + r() * 3, h, [0xc88a48, 0xb87038, 0xd8a058][i % 3], { x, y: h / 2 - 1, z, parent: sat, seg: 7 });
		}
		const wormPts = curve(k, [[-16, -3, -4], [-12, 3, -3], [-8, 4.5, -2], [-4.5, 1.5, -1], [-2.5, -2.5, 0], [0.5, -2.5, 1], [2.5, 2, 2], [3.6, 6, 3.5], [3.8, 8.5, 5], [3.4, 9.6, 6.6]], 46);
		const worm = k.group({ x: 2, z: -18, s: 1.4, from: 4, parent: sat });
		chain(k, wormPts, (t) => 1.1 + t * 0.5, (i) => (Math.floor(i / 2) % 2 ? 0x161616 : 0xf2eee4), { parent: worm, seg: 10 });
		const end = wormPts[wormPts.length - 1];
		const dir = end.clone().sub(wormPts[wormPts.length - 2]).normalize();
		const head = k.group({ x: end.x, y: end.y, z: end.z, parent: worm });
		orient(k, head, dir);
		k.cyl(2.0, 1.6, 1.4, 0xf2eee4, { parent: head, seg: 12 });
		k.cyl(1.6, 1.6, 0.2, 0x8a1020, { y: 0.65, parent: head, seg: 12 });
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * PI * 2;
			orient(k, k.cone(0.2, 0.9, 0xf8f0d8, { x: Math.cos(a) * 1.6, y: 0.95, z: Math.sin(a) * 1.6, parent: head, seg: 4 }), new k.THREE.Vector3(-Math.cos(a), 0.6, -Math.sin(a)));
		}
		k.point(0xfff0d0, 20, 80, { x: 10, y: 412, z: 10 });
		return {
			shots: [
				// 1: a red covered bridge over a river.
				{ pos: [-17, 2.6, 25], look: [0, 1, 40], fov: 50 },
				// 2: a Victorian house on a hill.
				{ pos: [11, 10, -16], look: [0, 19, -60], fov: 45 },
				// 3: the model town in the attic.
				{ pos: [-8.5, -399.2, 5.4], look: [-2, -399.4, -2.5], fov: 45, fog: [0x2a2018, 20, 60] },
				// 4: the desert under a ringed planet.
				{ pos: [-4, 404, 30], look: [20, 420, -120], fov: 50, fog: [0xd8a868, 60, 420], hide: ["sky"] },
				// 5: the striped sandworm.
				{ pos: [20, 403, 12], look: [2, 408, -14], fov: 55, fog: [0xd8a868, 60, 420], hide: ["sky"] },
				// 6: the ghost in stripes in his model graveyard.
				{ pos: [7.6, -397.9, 9.8], look: [5.2, -398.6, 4.4], fov: 45, fog: [0x2a2018, 20, 60], exposure: 1.15 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the chocolate room
	r61: (k) => {
		k.fog(0xf0dcea, 60, 300);
		k.sky(0x8ac8ea, 0xfae4f0);
		k.light({ sky: 0xfff4ff, ground: 0x6a5030, hemi: 1.35, sunPos: [30, 60, 50], sunIntensity: 2.1, shadowSize: 50, sunTarget: [0, 0, 0] });
		const riverZ = (x) => -6 + 3 * Math.sin(x / 12);
		const land = (x, z) => {
			const d = Math.abs(z - riverZ(x));
			return d < 4.5 ? -1.4 : Math.min(0.5, -1.4 + (d - 4.5) * 1.9);
		};
		k.ground(300, 0x6ad04a, { bump: 0.12, seg: 140, height: land });
		const choc = k.water(300, 0x6a3818, { y: 0.2, amp: 0.06, seg: 60 });
		choc.material.roughness = 0.3;
		const r = rng(61);
		// The waterfall pouring out of a pastel rock wall.
		const fx = -36;
		const fz = riverZ(fx);
		const rocks = [0xd8b8a0, 0xc8a890, 0xe0c4b0, 0xb89880];
		for (let i = 0; i < 26; i++) {
			const a = (i / 26) * PI * 1.6 + PI * 0.2 + PI / 2;
			const rad = 7 + r() * 5;
			const x = fx - 4 + Math.cos(a) * rad * 0.6;
			const z = fz + Math.sin(a) * rad * 1.6;
			if (x > fx - 6 && Math.abs(z - fz) < 7) continue;
			k.ico(3 + r() * 4, rocks[i % 4], { x, y: r() * 14, z, s: [1, 1.5, 1], ry: r() * 6, rough: 1 });
		}
		for (let i = 0; i < 18; i++) k.ico(6 + r() * 4, rocks[i % 4], { x: fx - 14 - r() * 8, y: -2 + (i % 3) * 8, z: fz + (i / 17 - 0.5) * 50, s: [1, 1.4, 1], ry: r() * 6, rough: 1 });
		k.ico(7, rocks[1], { x: fx - 8, y: 15, z: fz, s: [1, 0.6, 1.4], rough: 1 });
		const streak = k.canvas(64, 256, (g) => {
			g.fillStyle = "#7a4420";
			g.fillRect(0, 0, 64, 256);
			for (let i = 0; i < 70; i++) {
				g.fillStyle = Math.random() > 0.5 ? "#9a5a2c" : "#5a3014";
				g.fillRect(Math.random() * 64, Math.random() * 256, 2 + Math.random() * 4, 20 + Math.random() * 60);
			}
		});
		streak.wrapT = k.THREE.RepeatWrapping;
		streak.repeat.set(2, 2);
		const fallMat = k.mat(0xffffff, { map: streak, rough: 0.3, emissive: 0x2a1408 });
		k.mesh(new k.THREE.CylinderGeometry(12, 13, 14, 20, 1, true, PI / 2 - 0.45, 0.9), fallMat, { x: fx - 13, y: 6.5, z: fz });
		k.tick((t, dt) => (streak.offset.y += dt * 1.4));
		for (let i = 0; i < 12; i++) k.sphere(0.8 + r() * 0.8, 0x9a6a3e, { x: fx - 0.5 + r() * 3, y: -0.5, z: fz + (r() - 0.5) * 8, s: [1, 0.45, 1] });
		k.particles(300, 0x7a4420, { x: fx, y: -0.5, z: fz, box: [6, 4, 8], speed: 2, size: 0.18 });
		// Candy: lollipops, mushrooms, candy canes, gumdrops.
		const swirl = (a, b) => {
			const tex = k.canvas(128, 128, (g) => {
				g.fillStyle = a;
				g.fillRect(0, 0, 128, 128);
				g.strokeStyle = b;
				g.lineWidth = 9;
				g.beginPath();
				for (let i = 0; i < 300; i++) {
					const ang = i * 0.1;
					g.lineTo(64 + Math.cos(ang) * ang * 2, 64 + Math.sin(ang) * ang * 2);
				}
				g.stroke();
			});
			return k.mat(0xffffff, { map: tex, rough: 0.3 });
		};
		const pops = [swirl("#ff5a8a", "#ffffff"), swirl("#ffd040", "#ff6020"), swirl("#6ad0ff", "#ffffff"), swirl("#a060e0", "#ffd0ff")];
		const lolly = (x, z, h, i) => {
			const y = land(x, z);
			k.cyl(0.18, 0.18, h, 0xf8f4ec, { x, y: y + h / 2, z, from: 1 });
			k.cyl(1.6 + (i % 2) * 0.5, 1.6 + (i % 2) * 0.5, 0.4, pops[i % 4], { x, y: y + h + 1.3, z, rx: PI / 2, ry: (i - 2) * 0.3, seg: 24, from: 1 });
		};
		[[8, -18, 6], [16, -16, 8], [24, -20, 5], [32, -14, 7], [-6, -18, 7], [-16, -16, 5], [-20, 6, 6]].forEach(([x, z, h], i) => lolly(x, z, h, i));
		const shroom = (x, z, s) => {
			const g = k.group({ x, y: land(x, z), z, s, from: 1 });
			k.cyl(0.5, 0.7, 2, 0xf8eed8, { y: 1, parent: g });
			k.sphere(1.6, 0xe82a3a, { y: 2, s: [1, 0.6, 1], parent: g, rough: 0.4 });
			for (let i = 0; i < 9; i++) {
				const a = i * 2.4;
				const ry = 0.4 + (i % 3) * 0.25;
				k.sphere(0.2, 0xffffff, { x: Math.cos(a) * 1.5 * Math.sin(ry * 2), y: 2 + Math.cos(ry * 2) * 0.95, z: Math.sin(a) * 1.5 * Math.sin(ry * 2), s: [1, 0.5, 1], parent: g });
			}
		};
		[[4, -15, 1], [20, -12, 1.3], [34, -18, 1.1], [18, 9, 0.9], [-12, 9, 1.1], [-28, 12, 1.3]].forEach(([x, z, s]) => shroom(x, z, s));
		const cane = (x, z) => {
			const g = k.group({ x, y: land(x, z), z, ry: r() * 6, from: 1 });
			chain(k, curve(k, [[0, 0, 0], [0, 3, 0], [0, 5, 0], [0.6, 5.8, 0], [1.3, 5.4, 0], [1.4, 4.7, 0]], 18), 0.25, (i) => (i % 2 ? 0xffffff : 0xe02030), { parent: g, seg: 10 });
		};
		[[10, -22], [28, -8], [-8, 7], [22, 12], [36, -9], [-2, -16]].forEach(([x, z]) => cane(x, z));
		const gum = [0xff5050, 0x50c0ff, 0xffd040, 0x70e070, 0xff80d0, 0xb070ff];
		for (let i = 0; i < 50; i++) {
			const x = (r() - 0.5) * 90;
			const z = (r() - 0.5) * 50;
			if (Math.abs(z - riverZ(x)) < 7 || (x > -2 && x < 14 && z > 0 && z < 14)) continue;
			k.cone(0.4 + r() * 0.4, 0.7 + r() * 0.5, gum[i % gum.length], { x, y: land(x, z) + 0.3, z, seg: 8, rough: 0.3, from: 1 });
		}
		for (let i = 0; i < 6; i++) {
			const x = -16 + i * 9;
			const z = 20 + (i % 2) * 4;
			k.cyl(0.25, 0.3, 7, 0xd8c8b0, { x, y: 3.5, z, from: 1 });
			k.ico(2.6, 0xffb0d8, { x, y: 8, z, detail: 1, rough: 1, from: 1 });
		}
		// The workers: orange skin, green hair, white trousers.
		const worker = (x, z, ry, from) => {
			const p = k.person({ x, y: land(x, z), z, ry, s: 0.72, dress: 0xf4f2ee, colors: { shirt: 0x6a3a1a, legs: 0xf4f2ee, hair: 0x40c040, skin: 0xe8803a }, from });
			[-0.15, 0.15].forEach((sx) => k.box(0.06, 0.6, 0.3, 0xf4f2ee, { x: sx, y: 1.15, parent: p }));
			p.userData.limbs.head.scale.setScalar(1.25);
			return p;
		};
		[[-1, 2.4, 0.3], [0.8, 2.0, 0.1], [2.6, 2.4, -0.1], [4.4, 2.0, -0.3]].forEach(([x, z, ry]) => worker(x, z, ry, 4));
		// The girl who chewed the gum.
		const vx = 30;
		const vz = 3;
		const vy = land(vx, vz);
		k.sphere(1.8, 0x3a50c8, { x: vx, y: vy + 1.8, z: vz, rough: 0.35, seg: 24, from: 4 });
		k.sphere(0.32, 0x4a60d0, { x: vx, y: vy + 3.85, z: vz + 0.1, from: 4 });
		k.sphere(0.34, 0x5a3a20, { x: vx, y: vy + 3.95, z: vz - 0.02, s: [1, 0.8, 1], from: 4 });
		[-1, 1].forEach((s) => {
			k.capsule(0.12, 0.3, 0x4a60d0, { x: vx + s * 1.7, y: vy + 2.4, z: vz, rz: s * 1.2, from: 4 });
			k.capsule(0.12, 0.25, 0x4a60d0, { x: vx + s * 0.5, y: vy + 0.15, z: vz + 1.3, rx: 1.3, from: 4 });
		});
		[[-2.6, 0.6], [2.6, 0.4]].forEach(([dx, dz]) => {
			const w = worker(vx + dx, vz + dz, 0, 4);
			w.rotation.y = Math.atan2(-dx, -dz);
			limbs(w, { armL: [-1.2, 0, 0], armR: [-1.2, 0, 0] });
		});
		// The chocolatier: plum coat, tan top hat, cane.
		const wonka = k.person({ x: 7, y: land(7, 6), z: 6, ry: 0.6, coat: 0x6a2a8a, hat: 0x9a7a52, colors: { shirt: 0xf0e6d0, legs: 0xc8b490, hair: 0xb08a50, skin: 0xf0c8a8 }, sleeves: 0x6a2a8a, from: 5 });
		limbs(wonka, { armR: [-0.3, 0, 0.35], armL: [0, 0, -0.5] });
		k.box(0.36, 0.08, 0.04, 0x8a5a2a, { y: 1.5, z: 0.16, parent: wonka });
		k.cyl(0.03, 0.03, 1.2, 0x3a2418, { x: 0.62, y: 0.55, z: 0.15, parent: wonka });
		k.sphere(0.07, 0xd8c070, { x: 0.62, y: 1.15, z: 0.15, metal: 0.8, parent: wonka });
		// The paddle boat.
		const boat = k.group({ x: -12, y: -0.4, z: riverZ(-12), ry: PI / 2 + 0.25, from: 5 });
		k.box(2.2, 1, 7, 0xff90c0, { y: 0.4, parent: boat });
		k.cone(1.1, 2.4, 0xff90c0, { y: 0.4, z: 4.6, rx: PI / 2, seg: 4, ry: PI / 4, s: [1.4, 1, 0.7], parent: boat });
		[-1.2, 1.2].forEach((x) => k.cyl(1.2, 1.2, 0.4, 0xffd0e8, { x, y: 1.0, z: -1.5, rz: PI / 2, parent: boat }));
		k.box(1.6, 1.2, 2, 0xffe0f0, { y: 1.5, z: -0.5, parent: boat });
		// Vignette: a bar of chocolate, torn open on a golden flash.
		const bar = k.group({ x: 300, y: -400, z: 0 });
		k.box(10, 0.3, 10, 0x6a4a34, { y: -0.15, parent: bar });
		k.box(2.4, 0.18, 1.2, 0x3a1a0a, { y: 0.09, parent: bar });
		for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) k.box(0.36, 0.08, 0.34, 0x4a2410, { x: -1.0 + i * 0.4, y: 0.21, z: -0.4 + j * 0.4, parent: bar, rough: 0.4 });
		k.box(1.3, 0.22, 1.24, 0xc8d0d8, { x: 0.6, y: 0.11, parent: bar, metal: 0.7, rough: 0.35 });
		k.box(1.0, 0.24, 1.26, 0x8a1a2a, { x: 1.0, y: 0.12, parent: bar });
		k.box(0.3, 0.25, 1.27, 0xe0c060, { x: 1.0, y: 0.12, parent: bar });
		k.box(1.1, 0.01, 0.6, 0xf0c040, { x: -0.3, y: 0.3, z: 0.1, ry: 0.25, rz: 0.06, parent: bar, metal: 1, rough: 0.2, emissive: 0x6a4a00 });
		k.glow(0xffe080, 1.6, { x: -0.3, y: 0.4, z: 0.1, parent: bar, opacity: 0.5 });
		k.spot(0xfff0d0, 25, { x: 301, y: -395, z: 2, target: [300, -400, 0], angle: 0.5, distance: 20 });
		k.point(0xffe8d0, 4, 10, { x: 302, y: -398, z: 3 });
		// Vignette: a nut-sorting floor — a conveyor belt heaped with shelled peanuts.
		const nut = k.group({ x: -300, y: -400, z: 0 });
		k.box(30, 0.3, 30, 0x8a8478, { y: -0.15, parent: nut });
		k.box(30, 8, 0.3, 0xb8ae98, { y: 4, z: -3, parent: nut });
		k.box(30, 0.6, 0.32, 0x5a6a5a, { y: 1.2, z: -2.84, parent: nut });
		k.box(8, 0.12, 1.4, 0x2a2a2a, { y: 0.96, parent: nut, rough: 0.6 });
		[-0.75, 0.75].forEach((z) => k.box(8, 0.3, 0.1, 0x6a7a8a, { y: 0.95, z, parent: nut, metal: 0.6, rough: 0.4 }));
		[-3.5, 0, 3.5].forEach((x) => [-0.6, 0.6].forEach((z) => k.box(0.12, 0.9, 0.12, 0x6a7a8a, { x, y: 0.45, z, parent: nut, metal: 0.6 })));
		for (let i = 0; i < 16; i++) k.cyl(0.06, 0.06, 1.42, 0x8a8a90, { x: -3.75 + i * 0.5, y: 0.88, rx: PI / 2, parent: nut, metal: 0.7 });
		const nr = rng(161);
		const shell = [0xd8b080, 0xc8a070, 0xe0bc8a];
		for (let i = 0; i < 220; i++) {
			const x = (nr() - 0.5) * 7.4;
			const z = (nr() - 0.5) * 1.1;
			const heap = Math.max(0, 0.18 - Math.abs(x % 2.4) * 0.05);
			k.capsule(0.045, 0.09, shell[i % 3], { x, y: 1.06 + nr() * heap, z, rx: nr() * 3, rz: PI / 2 + (nr() - 0.5) * 2, ry: nr() * 6, parent: nut, shadow: false });
		}
		for (let i = 0; i < 40; i++) k.sphere(0.035, 0xe8c89a, { x: (nr() - 0.5) * 7, y: 1.05, z: (nr() - 0.5) * 1.1, s: [1, 0.8, 0.8], parent: nut, shadow: false });
		const sack = (x, z, ry) => {
			k.cyl(0.42, 0.5, 1.0, 0xb89a68, { x, y: 0.5, z, ry, seg: 9, parent: nut, rough: 1 });
			k.cyl(0.3, 0.42, 0.22, 0xa88a58, { x, y: 1.1, z, seg: 9, parent: nut, rough: 1 });
		};
		sack(-2.6, -2.0, 0.3);
		sack(-1.7, -2.2, 1.1);
		k.box(0.9, 0.7, 0.9, 0xa88a5a, { x: 2.8, y: 0.35, z: -2.0, ry: 0.2, parent: nut });
		k.box(0.9, 0.7, 0.9, 0xb0946a, { x: 2.7, y: 1.05, z: -2.1, ry: -0.1, parent: nut });
		k.cyl(0.5, 0.45, 0.5, 0x8a8a90, { x: 0.8, y: 0.25, z: 1.4, seg: 14, parent: nut, metal: 0.5, open: true });
		for (let i = 0; i < 16; i++) k.capsule(0.045, 0.09, shell[i % 3], { x: 0.8 + (nr() - 0.5) * 0.6, y: 0.4, z: 1.4 + (nr() - 0.5) * 0.6, rz: PI / 2, ry: nr() * 6, parent: nut, shadow: false });
		k.point(0xfff0d0, 14, 16, { x: -299, y: -396, z: 2 });
		k.point(0xd8e0ff, 5, 16, { x: -303, y: -397, z: 3 });
		// Vignette: a shabby room with one bed shared by four old people, two at each end.
		const hut = k.group({ x: 0, y: -400, z: 300 });
		k.box(14, 0.2, 14, 0x6a5038, { y: -0.1, parent: hut });
		k.box(14, 5, 0.3, 0x8a8478, { y: 2.5, z: -2.6, parent: hut });
		k.box(0.3, 5, 14, 0x7a746a, { x: -4, y: 2.5, parent: hut });
		k.box(1.0, 1.2, 0.05, 0x9ab0c8, { x: 1.5, y: 2.6, z: -2.43, parent: hut, emissive: 0x304050 });
		k.box(1.1, 0.08, 0.08, 0x5a4a38, { x: 1.5, y: 2.6, z: -2.4, parent: hut });
		k.box(0.08, 1.2, 0.08, 0x5a4a38, { x: 1.5, y: 2.6, z: -2.4, parent: hut });
		k.box(3.4, 0.45, 1.9, 0x5a4030, { y: 0.4, z: -1.2, parent: hut });
		[-1.75, 1.75].forEach((x) => k.box(0.1, 1.4, 1.95, 0x4a3424, { x, y: 0.7, z: -1.2, parent: hut }));
		const quilt = k.canvas(128, 64, (g) => {
			const c = ["#8a5a4a", "#6a7a5a", "#a88a5a", "#5a6a7a", "#9a6a6a"];
			for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) {
				g.fillStyle = c[(x * 3 + y * 2) % 5];
				g.fillRect(x * 16, y * 16, 16, 16);
			}
		});
		k.box(3.0, 0.28, 1.86, k.mat(0xffffff, { map: quilt }), { y: 0.75, z: -1.2, parent: hut });
		const oldie = (x, z, side, hair, cap) => {
			const g = k.group({ x, y: 0.85, z, parent: hut });
			k.box(0.4, 0.18, 0.5, 0xf0ece0, { x: side * 0.08, parent: g });
			k.box(0.4, 0.5, 0.36, 0xd8d0c0, { x: side * -0.12, y: 0.25, rz: side * 0.35, parent: g });
			k.sphere(0.19, 0xe8c0a0, { x: side * -0.02, y: 0.6, parent: g });
			k.sphere(0.2, hair, { x: side * -0.1, y: 0.66, s: [0.7, 0.85, 1.05], parent: g });
			[-0.07, 0.07].forEach((ez) => k.sphere(0.025, 0x2a1a10, { x: side * 0.15, y: 0.62, z: ez, parent: g }));
			if (cap) k.cone(0.17, 0.32, cap, { x: side * 0.08, y: 0.85, rz: side * 0.7, parent: g, seg: 8 });
		};
		oldie(-1.4, -1.65, 1, 0xd8d8d8, 0xe8e0d0);
		oldie(-1.4, -0.75, 1, 0xc8c8c8, null);
		oldie(1.4, -1.65, -1, 0xe0e0e0, 0xa8b8c8);
		oldie(1.4, -0.75, -1, 0xb8b8b8, null);
		k.box(0.6, 0.7, 0.6, 0x4a3424, { x: 2.4, y: 0.35, z: -1.8, parent: hut });
		k.cyl(0.15, 0.1, 0.1, 0xd8d0c0, { x: 2.4, y: 0.75, z: -1.8, parent: hut });
		k.cyl(0.04, 0.05, 0.22, 0xf0e8d0, { x: 2.3, y: 0.81, z: -1.65, parent: hut });
		k.glow(0xffc070, 0.5, { x: 2.3, y: 0.97, z: -1.65, parent: hut });
		k.point(0xffc880, 6, 10, { x: 2.2, y: -398.6, z: 299 });
		k.point(0xd0d8ff, 4, 12, { x: -1, y: -397, z: 303 });
		return {
			shots: [
				// 1: a conveyor belt of peanuts.
				{ pos: [-298.6, -398.1, 2.6], look: [-300.3, -399.0, -0.2], fov: 45, fog: [0x3a3428, 10, 40] },
				// 2: four old people in one bed.
				{ pos: [0.2, -398.0, 303.2], look: [0, -399.2, 298.8], fov: 50, fog: [0x2a2420, 10, 40], exposure: 1.2 },
				// 3: a chocolate bar with a golden ticket.
				{ pos: [301.4, -398.7, 2.1], look: [300, -399.75, 0], fov: 40, fog: [0x2a1a10, 6, 24] },
				// 4: the candy meadow and chocolate river.
				{ pos: [-4, 3, 6], look: [16, 3, -14], fov: 50 },
				// 5: the girl who turned into a blueberry.
				{ pos: [33.5, 3.2, 11], look: [30, 2.2, 3], fov: 50 },
				// 6: the chocolatier in his candy room.
				{ pos: [10.5, 2.3, 10], look: [-8, 3, -6], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the swamp
	r62: (k) => {
		k.fog(0xc8d4b0, 60, 320);
		k.sky(0x8ab8d8, 0xeef2d8);
		k.light({ sky: 0xf4f8e0, ground: 0x4a5a30, hemi: 1.35, sunPos: [40, 60, 60], sunIntensity: 2.2, shadowSize: 40, sunTarget: [0, 0, -6] });
		const pond = (x, z) => Math.hypot((x + 10) / 1.4, z - 6) < 8 ? -1.2 : Math.max(-1.2, 0.3 - Math.max(0, 9 - Math.hypot((x + 10) / 1.4, z - 6)) * 0.4);
		k.ground(600, 0x5a7a34, { bump: 0.3, seg: 100, height: (x, z) => pond(x, z) });
		k.water(600, 0x3e4a26, { y: -0.6, amp: 0.05, seg: 30 });
		const r = rng(62);
		// Twisted swamp trees.
		for (let i = 0; i < 60; i++) {
			const x = (r() - 0.5) * 140;
			const z = -20 - r() * 70 + (i % 3 === 0 ? 70 : 0);
			if (Math.abs(x) < 16 && z > -24 && z < 20) continue;
			const h = 8 + r() * 6;
			const lean = (r() - 0.5) * 0.3;
			k.cyl(0.35, 0.8, h, 0x4a3a28, { x, y: h / 2 - 0.4, z, rz: lean, seg: 6 });
			k.ico(3 + r() * 2, [0x4a7a2a, 0x3a6a24, 0x5a8a30][i % 3], { x: x - (lean * h) / 2, y: h, z, s: [1.3, 0.7, 1.3], detail: 1 });
		}
		// Reeds and cattails round the pond.
		for (let i = 0; i < 70; i++) {
			const a = r() * PI * 2;
			const d = 7.5 + r() * 2.5;
			const x = -10 + Math.cos(a) * d * 1.4;
			const z = 6 + Math.sin(a) * d;
			if (x > -4) continue;
			const h = 1.2 + r() * 1.2;
			k.cyl(0.03, 0.03, h, 0x6a8a3a, { x, y: h / 2 - 0.5, z, rz: (r() - 0.5) * 0.3, shadow: false });
			if (i % 2) k.capsule(0.07, 0.25, 0x5a3a20, { x, y: h - 0.4, z });
		}
		for (let i = 0; i < 8; i++) k.cyl(0.5, 0.5, 0.03, 0x5a9a3a, { x: -10 + (r() - 0.5) * 14, y: -0.52, z: 6 + (r() - 0.5) * 8, seg: 10 });
		// The stump house.
		const hut = k.group({ x: 0, z: -10 });
		const bark = 0x6a4a2e;
		k.cyl(4, 4.8, 7, bark, { y: 3.5, seg: 14, parent: hut, rough: 1 });
		for (let i = 0; i < 14; i++) {
			const a = (i / 14) * PI * 2;
			k.cone(0.7, 1.5 + (i % 3) * 0.6, bark, { x: Math.cos(a) * 3.7, y: 7.5 + (i % 3) * 0.3, z: Math.sin(a) * 3.7, seg: 5, parent: hut });
			k.box(0.8, 2.5, 1.2, 0x5a3e26, { x: Math.cos(a) * 4.9, y: 0.7, z: Math.sin(a) * 4.9, ry: -a, rz: 0.5, parent: hut });
		}
		k.cyl(3.8, 3.8, 0.4, 0x4a6a2a, { y: 6.8, seg: 14, parent: hut });
		k.cyl(0.4, 0.5, 4, 0x5a5a5a, { x: 1.6, y: 9, z: -1, parent: hut });
		const smoke = [0, 1, 2, 3].map((i) => k.sphere(0.4 + i * 0.2, 0xd8d8d0, { x: 1.6, y: 11.6 + i * 1.2, z: -1, opacity: 0.35, parent: hut, shadow: false }));
		k.tick((t) => smoke.forEach((s, i) => {
			const p = (t * 0.25 + i / 4) % 1;
			s.position.set(1.6 + p * 2.5, 11.2 + p * 4, -1 - p);
			s.scale.setScalar(0.6 + p * 1.2);
		}));
		k.box(1.6, 2.6, 0.2, 0x7a5a30, { y: 1.3, z: 4.55, parent: hut });
		k.cyl(0.8, 0.8, 0.2, 0x7a5a30, { y: 2.6, z: 4.55, rx: PI / 2, seg: 14, parent: hut });
		[-1.8, 1.8].forEach((x) => {
			k.box(0.9, 0.9, 0.2, 0xffd890, { x, y: 3.3, z: 4.25, ry: x > 0 ? -0.4 : 0.4, parent: hut, emissive: 0xc08030 });
			k.box(1.1, 0.12, 0.25, 0x4a3420, { x, y: 3.8, z: 4.3, ry: x > 0 ? -0.4 : 0.4, parent: hut });
		});
		k.box(3.4, 0.12, 3, 0x8a6a40, { y: 0.06, z: 6.4, parent: hut });
		// The outhouse.
		const moon = k.canvas(128, 256, (g) => {
			g.fillStyle = "#8a6a40";
			g.fillRect(0, 0, 128, 256);
			g.strokeStyle = "#6a4a28";
			g.lineWidth = 4;
			for (let x = 20; x < 128; x += 26) {
				g.beginPath();
				g.moveTo(x, 0);
				g.lineTo(x, 256);
				g.stroke();
			}
			g.fillStyle = "#1a1008";
			g.beginPath();
			g.arc(64, 50, 22, 0, PI * 2);
			g.fill();
			g.fillStyle = "#8a6a40";
			g.beginPath();
			g.arc(74, 44, 20, 0, PI * 2);
			g.fill();
		});
		const loo = k.group({ x: 9, y: 0.2, z: -4, ry: 0.45, from: 4 });
		k.box(1.7, 2.6, 1.7, 0x7a5a34, { y: 1.3, parent: loo });
		k.plane(1.3, 2.3, k.mat(0xffffff, { map: moon }), { y: 1.2, z: 0.86, parent: loo });
		k.box(2.0, 0.14, 2.2, 0x5a4024, { y: 2.75, rx: 0.2, parent: loo });
		k.box(0.08, 0.3, 0.08, 0x2a2a2a, { x: 0.45, y: 1.2, z: 0.9, parent: loo });
		// The ogre and the donkey.
		const ogre = k.person({ x: 0.4, y: 0, z: -2.6, s: 1.25, ry: 0.15, hair: false, colors: { shirt: 0xe0d0a8, legs: 0x6a5a3a, skin: 0x9ab83a }, from: 5 });
		const ol = ogre.userData.limbs;
		ol.body.scale.set(1.45, 1, 1.5);
		ol.armL.position.x = -0.44;
		ol.armR.position.x = 0.44;
		ol.armL.rotation.z = -0.25;
		ol.armR.rotation.z = 0.25;
		ol.armL.children[0].scale.set(1.3, 1, 1.3);
		ol.armR.children[0].scale.set(1.3, 1, 1.3);
		ol.head.scale.setScalar(1.3);
		ol.head.position.y = 1.83;
		[-1, 1].forEach((s) => {
			k.box(0.22, 0.66, 0.05, 0x5a3a20, { x: s * 0.24, y: 1.22, z: 0.215, parent: ogre });
			k.box(0.18, 0.66, 0.43, 0x5a3a20, { x: s * 0.36, y: 1.22, parent: ogre });
			const ear = k.group({ x: s * 0.2, y: 0.07, parent: ol.head, rz: -s * 1.2 });
			k.cyl(0.025, 0.04, 0.12, 0x9ab83a, { y: 0.06, parent: ear });
			k.cyl(0.06, 0.03, 0.05, 0x8aa830, { y: 0.14, parent: ear, open: true });
		});
		k.box(0.74, 0.1, 0.44, 0x3a2a1a, { y: 0.92, parent: ogre });
		k.sphere(0.08, 0x8aa830, { y: 1.74, z: 0.2, parent: ogre });
		[-0.07, 0.07].forEach((x) => k.sphere(0.03, 0x3a2a10, { x, y: 0.04, z: 0.18, parent: ol.head }));
		const don = k.group({ x: -1.5, y: 0, z: -1.2, ry: 0.7, from: 5 });
		const grey = 0x8a8a92;
		k.capsule(0.38, 0.8, grey, { y: 0.95, rx: PI / 2, parent: don });
		[-0.2, 0.2].forEach((x) => [-0.45, 0.45].forEach((z) => k.box(0.13, 0.75, 0.13, grey, { x, y: 0.37, z, parent: don })));
		k.box(0.28, 0.65, 0.3, grey, { y: 1.45, z: 0.55, rx: 0.4, parent: don });
		k.box(0.36, 0.38, 0.6, grey, { y: 1.78, z: 0.8, parent: don });
		k.box(0.32, 0.26, 0.3, 0xc8c0b8, { y: 1.68, z: 1.15, parent: don });
		k.box(0.24, 0.05, 0.05, 0x3a2a2a, { y: 1.6, z: 1.3, parent: don });
		[-0.12, 0.12].forEach((x) => {
			k.box(0.1, 0.55, 0.06, grey, { x, y: 2.2, z: 0.65, rz: x * 2, rx: -0.3, parent: don });
			k.sphere(0.05, 0xffffff, { x: x * 1.1, y: 1.88, z: 1.06, parent: don });
			k.sphere(0.025, 0x111111, { x: x * 1.1, y: 1.88, z: 1.1, parent: don });
		});
		k.box(0.06, 0.4, 0.4, 0x2a2a2e, { y: 2.0, z: 0.45, rx: 0.4, parent: don });
		k.cyl(0.03, 0.03, 0.6, grey, { y: 0.9, z: -0.85, rx: -0.5, parent: don });
		// Vignette: a gingerbread man on a baking tray.
		const tray = k.group({ x: 0, y: -400, z: 0 });
		k.box(10, 0.4, 10, 0x8a6a48, { y: -0.2, parent: tray });
		k.box(3, 0.06, 2.2, 0xb8bcc4, { y: 0.03, parent: tray, metal: 0.8, rough: 0.35 });
		const gb = k.group({ y: 0.1, ry: 0.2, parent: tray });
		const ginger = 0xb8692a;
		k.cyl(0.32, 0.32, 0.1, ginger, { z: -0.6, seg: 16, parent: gb });
		k.box(0.5, 0.1, 0.6, ginger, { z: 0, parent: gb });
		[-1, 1].forEach((s) => {
			k.capsule(0.12, 0.35, ginger, { x: s * 0.38, z: -0.1, rz: PI / 2, ry: s * 0.4, s: [1, 1, 0.45], parent: gb });
			k.capsule(0.14, 0.4, ginger, { x: s * 0.17, z: 0.55, rx: PI / 2, ry: s * 0.25, s: [1, 1, 0.4], parent: gb });
			k.box(0.04, 0.02, 0.2, 0xffffff, { x: s * 0.6, y: 0.05, z: -0.2, ry: s * 0.4 + PI / 2, parent: gb });
			k.box(0.2, 0.02, 0.04, 0xffffff, { x: s * 0.24, y: 0.05, z: 0.82, parent: gb });
			k.sphere(0.035, 0x1a0a04, { x: s * 0.1, y: 0.06, z: -0.68, parent: gb });
		});
		k.torus(0.13, 0.018, 0xffffff, { y: 0.06, z: -0.55, rx: PI / 2, arc: PI, parent: gb, seg: 12 });
		[0xe02030, 0x30a040, 0xe02030].forEach((c, i) => k.sphere(0.06, c, { y: 0.07, z: -0.18 + i * 0.17, s: [1, 0.7, 1], parent: gb, rough: 0.3 }));
		k.point(0xffe0b0, 6, 10, { x: 1, y: -397, z: 2 });
		// Vignette: the dragon's keep over a lava lake.
		const keep = k.group({ x: 500, y: 0, z: 0 });
		const lava = k.water(400, 0xe04008, { x: 500, y: -30, amp: 0.8, seg: 40 });
		lava.material.emissive.set(0xc02800);
		lava.material.emissiveIntensity = 0.7;
		const lr = rng(5);
		for (let i = 0; i < 40; i++) k.ico(2 + lr() * 4, 0x2a1a14, { x: 500 + (lr() - 0.5) * 160, y: -30, z: -40 + (lr() - 0.5) * 160, s: [1.4, 0.25, 1.2], ry: lr() * 6 });
		for (let i = 0; i < 8; i++) {
			const h = 30 + lr() * 40;
			k.cone(5 + lr() * 6, h, 0x2e201c, { x: 500 + (lr() > 0.5 ? 1 : -1) * (40 + lr() * 60), y: -30 + h / 2, z: -60 - lr() * 80, seg: 6 });
		}
		k.cyl(15, 22, 44, 0x3a2a26, { y: -13, z: -60, parent: keep, seg: 9, rough: 1 });
		for (let i = 0; i < 10; i++) k.ico(4 + (i % 3) * 2, 0x2e221e, { x: Math.cos(i * 0.63) * 19, y: -26 + (i % 4) * 3, z: -60 + Math.sin(i * 0.63) * 19, parent: keep, rough: 1 });
		k.box(60, 40, 30, 0x3a2a26, { y: -20, z: 40, parent: keep, rough: 1 });
		const stoneC = 0x6a6470;
		k.box(16, 18, 14, stoneC, { y: 18, z: -60, parent: keep });
		[[-8, -7, 30], [8, -7, 26], [-8, 7, 24], [8, 7, 28], [0, 0, 42]].forEach(([x, z, h]) => {
			k.cyl(2.6, 3, h, stoneC, { x, y: 9 + h / 2, z: -60 + z, seg: 8, parent: keep });
			k.cone(3.4, 7, 0x3a2a3a, { x, y: 9 + h + 3.5, z: -60 + z, seg: 8, parent: keep });
		});
		const bridgePts = curve(k, [[0, 0, 25], [0, -5, -8], [0, 9, -46]], 40);
		bridgePts.forEach((p, i) => i % 2 === 0 && k.box(2.4, 0.15, 0.6, 0x7a5a38, { x: p.x, y: p.y, z: p.z, parent: keep }));
		[-1.2, 1.2].forEach((x) => chain(k, bridgePts.filter((_, i) => i % 4 === 0).map((p) => p.clone().add(new k.THREE.Vector3(x, 1, 0))), 0.04, 0xc8b080, { parent: keep, seg: 4 }));
		k.point(0xff6020, 40, 120, { x: 500, y: -15, z: -20, decay: 1 });
		k.point(0xffd0b0, 20, 120, { x: 520, y: 30, z: 30, decay: 1 });
		// The dragon, coiled round the keep.
		const dragon = k.group({ x: 9, y: 27, z: -48, ry: -0.6, from: 3, parent: keep });
		const scale = 0xc8304a;
		k.capsule(2.6, 6, scale, { rx: PI / 2 - 0.3, parent: dragon });
		k.capsule(2.2, 4, 0xe87a8a, { y: -0.7, z: 0.4, rx: PI / 2 - 0.3, parent: dragon });
		const neck = curve(k, [[0, 1, 4], [0, 4, 6.5], [0, 7, 7], [0, 8.5, 8.6]], 10);
		chain(k, neck, (t) => 1.4 - t * 0.4, scale, { parent: dragon, seg: 10 });
		const dh = k.group({ y: 9.2, z: 9.6, parent: dragon });
		k.box(2.4, 1.8, 2.6, scale, { parent: dh });
		k.box(1.8, 1.0, 1.8, scale, { y: -0.4, z: 2.0, parent: dh });
		k.box(1.6, 0.25, 1.6, 0x5a1020, { y: -0.95, z: 2.1, parent: dh });
		[-0.7, 0.7].forEach((x) => {
			k.sphere(0.32, 0xfff4c0, { x, y: 0.5, z: 1.2, parent: dh });
			k.sphere(0.18, 0x1a1010, { x, y: 0.5, z: 1.45, parent: dh });
			k.cone(0.3, 1.6, 0x3a1a1a, { x, y: 1.4, z: -0.6, rx: -0.6, parent: dh });
			[0, 1, 2].forEach((j) => k.box(0.06, 0.3, 0.04, 0x1a0a0a, { x: x + (j - 1) * 0.12, y: 0.85, z: 1.4, rz: (j - 1) * 0.3, parent: dh }));
		});
		[-1, 1].forEach((s) => {
			const wing = k.group({ x: s * 2, y: 1.5, z: -1, rz: s * -0.4, parent: dragon });
			k.cone(4, 8, 0x8a2034, { x: s * 4, rz: s * PI / 2, s: [1, 1, 0.08], seg: 3, parent: wing });
		});
		chain(k, curve(k, [[0, -1, -4], [2, -3, -8], [5, -6, -10], [7, -9, -9]], 10), (t) => 1.6 - t * 1.3, scale, { parent: dragon, seg: 8 });
		return {
			shots: [
				// 1: cattails and lily pads on a murky pond.
				{ pos: [-8.5, 0.7, 4.5], look: [-17, -0.2, 8.5], fov: 45 },
				// 2: a castle keep over a lava lake.
				{ pos: [514, 12, 46], look: [500, 6, -50], fov: 55, fog: [0x5a3020, 50, 320], exposure: 1.2 },
				// 3: a gingerbread man on a baking tray.
				{ pos: [0.5, -398.4, 1.3], look: [0, -399.9, -0.1], fov: 40, fog: [0x2a1c10, 6, 30] },
				// 4: the dragon coiled round the keep.
				{ pos: [520, 30, -18], look: [506, 34, -43], fov: 50, fog: [0x5a3020, 50, 320], exposure: 1.2 },
				// 5: the stump house and its outhouse.
				{ pos: [13, 1.5, 4], look: [8.6, 1.4, -4.5], fov: 45 },
				// 6: the ogre and the donkey at home.
				{ pos: [1.7, 2.0, 1.6], look: [0.1, 1.95, -2.6], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the ice palace
	r63: (k) => {
		k.fog(0xdce8f4, 70, 460);
		k.sky(0x3a6ac8, 0xe8f2ff);
		k.light({ sky: 0xf0f6ff, ground: 0x8aa0c0, hemi: 1.35, sunColor: 0xfff4e8, sunPos: [40, 50, 70], sunIntensity: 2.0, shadowSize: 60, sunTarget: [0, 5, -25] });
		const r = rng(63);
		// Two snowy plateaus with a chasm between.
		const rockC = 0x8a98ac;
		k.box(400, 60, 90, rockC, { y: -30, z: 32, rough: 1 });
		k.box(400, 60, 200, rockC, { y: -30, z: -128, rough: 1 });
		k.box(400, 0.6, 90, 0xf4f8fc, { y: 0.1, z: 32 });
		k.box(400, 0.6, 200, 0xf4f8fc, { y: 0.1, z: -128 });
		k.box(400, 1, 30, 0x5a6a80, { y: -45, z: -20 });
		for (let i = 0; i < 60; i++) k.sphere(1 + r() * 2.5, 0xf4f8fc, { x: (r() - 0.5) * 200, y: 0.1, z: (r() > 0.5 ? 10 + r() * 60 : -40 - r() * 80), s: [1.5, 0.35, 1.2] });
		// Mountains all around.
		for (let i = 0; i < 16; i++) {
			const a = (i / 16) * PI * 1.2 + PI * 0.9;
			const d = 220 + r() * 60;
			const h = 90 + r() * 80;
			k.cone(60 + r() * 30, h, i % 2 ? 0xe8eef6 : 0xd0dcea, { x: Math.cos(a) * d * 1.4, y: h / 2 - 5, z: Math.sin(a) * d - 60, seg: 6, rough: 1 });
		}
		// Snowy pines.
		const pine = (x, z, h, from) => {
			k.cyl(0.25, 0.35, h * 0.3, 0x4a3424, { x, y: h * 0.15, z, from });
			k.cone(h * 0.3, h * 0.8, 0x24503a, { x, y: h * 0.55, z, seg: 7, from });
			k.cone(h * 0.18, h * 0.3, 0xf4f8fc, { x, y: h * 0.82, z, seg: 7, from });
		};
		for (let i = 0; i < 60; i++) {
			const x = (r() > 0.5 ? 1 : -1) * (24 + r() * 80);
			const z = -6 - r() * 60 + (i % 2 ? 60 : 0);
			if (Math.abs(z + 20) < 9) continue;
			pine(x, z, 6 + r() * 6, 0);
		}
		// The staircase across the chasm.
		const ice = { emissive: 0x2a6aa0, glow: 0.45, rough: 0.12, metal: 0.25 };
		const iceC = 0xa8e0fa;
		for (let i = 0; i < 22; i++) k.box(2.6, 0.18, 1.05, iceC, { y: 0.35 + i * 0.09, z: -11 - i * 0.95, ...ice, from: 3 });
		chain(k, curve(k, [[0, 0, -11], [0, -2.2, -20], [0, 0, -31]], 16), 0.25, iceC, { ...ice, seg: 6, from: 3 });
		[-1.4, 1.4].forEach((x) => {
			chain(k, curve(k, [[x, 1.3, -10], [x, 1.9, -20], [x, 3.4, -31]], 14), 0.06, 0xd8f4ff, { ...ice, seg: 6, from: 3 });
			k.torus(0.5, 0.07, 0xd8f4ff, { x, y: 1.0, z: -10.2, ry: PI / 2, ...ice, from: 3 });
		});
		// The palace.
		const pal = k.group({ x: 0, z: -48, from: 3 });
		k.cyl(13, 15, 3, iceC, { y: 1.5, seg: 6, parent: pal, ...ice });
		k.cyl(6.5, 7.5, 24, iceC, { y: 15, seg: 6, parent: pal, ...ice });
		k.cone(7, 16, 0xc0ecff, { y: 35, seg: 6, parent: pal, ...ice });
		for (let i = 0; i < 10; i++) {
			const a = (i / 10) * PI * 2 + 0.3;
			const h = 9 + ((i * 7) % 5) * 3;
			const d = 9 + (i % 2) * 2.5;
			k.cyl(1.6, 2, h, iceC, { x: Math.cos(a) * d, y: 3 + h / 2, z: Math.sin(a) * d, seg: 6, parent: pal, ...ice });
			k.cone(1.8, 6, 0xc8f0ff, { x: Math.cos(a) * d, y: 3 + h + 3, z: Math.sin(a) * d, seg: 6, parent: pal, ...ice });
		}
		k.box(8, 0.5, 4, iceC, { y: 14, z: 8, parent: pal, ...ice });
		k.box(4, 8, 0.3, 0x5aa8d8, { y: 7, z: 7.6, parent: pal, emissive: 0x2a7ab0, glow: 0.8 });
		const flakeTex = (bg, fg, w) =>
			k.canvas(1024, 1024, (g) => {
				g.scale(2, 2);
				g.fillStyle = bg;
				g.fillRect(0, 0, 512, 512);
				g.strokeStyle = fg;
				g.lineCap = "round";
				g.translate(256, 256);
				for (let i = 0; i < 6; i++) {
					g.rotate(PI / 3);
					g.lineWidth = w;
					g.beginPath();
					g.moveTo(0, 0);
					g.lineTo(0, -230);
					g.stroke();
					[70, 130, 180].forEach((y, j) => {
						const len = [70, 55, 35][j];
						g.lineWidth = w * 0.7;
						g.beginPath();
						g.moveTo(-len, -y - len);
						g.lineTo(0, -y);
						g.lineTo(len, -y - len);
						g.stroke();
					});
				}
				g.lineWidth = w * 0.6;
				g.beginPath();
				for (let i = 0; i <= 6; i++) g.lineTo(Math.cos((i * PI) / 3) * 50, Math.sin((i * PI) / 3) * 50);
				g.stroke();
			});
		k.cyl(3, 3, 0.2, k.mat(0xffffff, { map: flakeTex("#6ab8e8", "#ffffff", 26), emissive: 0x3a80b0, glow: 0.5 }), { y: 22, z: 6.9, rx: PI / 2, seg: 6, parent: pal });
		k.point(0x9ad8ff, 20, 40, { x: 0, y: 12, z: -36 });
		k.particles(900, 0xffffff, { x: 0, y: 0, z: -10, box: [60, 30, 50], speed: 1.4, size: 0.12, drift: 0.8 });
		// Reindeer and sleigh among the pines.
		const deer = k.group({ x: -40, z: 30, ry: 0.5, from: 1 });
		const fawn = 0x8a6040;
		k.capsule(0.55, 1.4, fawn, { y: 1.6, rx: PI / 2, parent: deer });
		k.capsule(0.45, 0.6, 0xd8c8a8, { y: 1.35, rx: PI / 2, parent: deer });
		[-0.3, 0.3].forEach((x) => [-0.8, 0.8].forEach((z) => k.box(0.18, 1.3, 0.18, 0x6a4a30, { x, y: 0.65, z, parent: deer })));
		k.box(0.4, 1.1, 0.5, fawn, { y: 2.3, z: 1.1, rx: 0.5, parent: deer });
		k.box(0.45, 0.45, 0.85, fawn, { y: 2.85, z: 1.5, parent: deer });
		k.box(0.38, 0.32, 0.3, 0xe8dcc8, { y: 2.75, z: 1.95, parent: deer });
		k.sphere(0.08, 0x1a1a1a, { y: 2.85, z: 2.1, parent: deer });
		[-1, 1].forEach((s) => {
			const ant = k.group({ x: s * 0.18, y: 3.05, z: 1.3, rz: -s * 0.4, parent: deer });
			k.box(0.06, 0.8, 0.06, 0xc8b090, { y: 0.4, parent: ant });
			k.box(0.06, 0.45, 0.06, 0xc8b090, { y: 0.55, z: 0.18, rx: 0.8, parent: ant });
			k.box(0.06, 0.4, 0.06, 0xc8b090, { y: 0.8, x: s * 0.12, rz: -s * 0.6, parent: ant });
			k.box(0.08, 0.2, 0.15, fawn, { x: s * 0.25, y: 3.0, z: 1.2, rz: -s * 0.8, parent: deer });
			k.sphere(0.05, 0x111111, { x: s * 0.2, y: 2.95, z: 1.75, parent: deer });
		});
		const sleigh = k.group({ x: -42, z: 25.5, ry: 0.5, from: 1 });
		k.box(2, 1, 3.2, 0x8a3a2a, { y: 1, parent: sleigh });
		k.box(2.1, 0.12, 3.3, 0xc8a050, { y: 1.5, parent: sleigh });
		k.box(2, 1.3, 0.3, 0x8a3a2a, { y: 1.6, z: -1.5, parent: sleigh });
		[-0.9, 0.9].forEach((x) => {
			k.box(0.1, 0.1, 3.8, 0x3a2a20, { x, y: 0.25, parent: sleigh });
			k.torus(0.4, 0.06, 0x3a2a20, { x, y: 0.65, z: 1.9, ry: PI / 2, arc: PI, rz: 0, parent: sleigh });
			k.box(0.1, 0.4, 0.1, 0x3a2a20, { x, y: 0.5, z: -1, parent: sleigh });
		});
		[-0.6, 0.6].forEach((x) => k.box(0.06, 0.06, 2.2, 0x3a2a20, { x, y: 1.3, z: 2.6, rx: -0.15, parent: sleigh }));
		// The snowman.
		const snow = 0xf8fbff;
		const olaf = k.group({ x: 6, z: 6, ry: 0.2, from: 4 });
		k.sphere(0.45, snow, { y: 0.4, s: [1, 0.85, 0.9], parent: olaf });
		k.sphere(0.3, snow, { y: 0.98, parent: olaf });
		k.sphere(0.33, snow, { y: 1.55, s: [0.95, 1.15, 0.9], parent: olaf });
		k.cone(0.06, 0.3, 0xf08a20, { y: 1.55, z: 0.42, rx: PI / 2, parent: olaf });
		[-0.12, 0.12].forEach((x) => {
			k.sphere(0.06, 0xffffff, { x, y: 1.7, z: 0.27, parent: olaf });
			k.sphere(0.035, 0x111111, { x, y: 1.7, z: 0.32, parent: olaf });
			k.box(0.1, 0.02, 0.02, 0x3a2a20, { x, y: 1.82, z: 0.28, rz: x * 2, parent: olaf });
		});
		k.box(0.3, 0.1, 0.05, 0x3a1a1a, { y: 1.38, z: 0.29, parent: olaf });
		k.box(0.07, 0.07, 0.03, 0xffffff, { y: 1.42, z: 0.31, parent: olaf });
		[[0, 1.08, 0.29], [0, 0.88, 0.29], [0, 0.55, 0.43]].forEach(([x, y, z]) => k.sphere(0.04, 0x1a1a1a, { x, y, z, parent: olaf }));
		[-1, 1].forEach((s) => {
			const arm = k.group({ x: s * 0.28, y: 1.0, rz: -s * 1.0, parent: olaf });
			k.cyl(0.02, 0.025, 0.6, 0x5a3a20, { y: 0.3, parent: arm });
			[-0.4, 0, 0.4].forEach((a) => k.cyl(0.012, 0.012, 0.15, 0x5a3a20, { y: 0.62, x: a * 0.12, rz: a, parent: arm }));
		});
		[-0.08, 0, 0.08].forEach((x) => k.cyl(0.01, 0.01, 0.22, 0x5a3a20, { x, y: 1.95, rz: x * 3, parent: olaf }));
		// The queen.
		const elsa = k.person({ x: 0, y: 0.35, z: -8.6, ry: 0, dress: 0x6ad0f4, colors: { shirt: 0x5ac0ec, legs: 0x8ae0ff, hair: 0xf2e2b0, skin: 0xf8d8c4 }, sleeves: 0xb8ecff, from: 5 });
		limbs(elsa, { armL: [0, 0, -2.3], armR: [0, 0, 2.3] });
		[-0.07, 0.07].forEach((x) => k.sphere(0.03, 0x2a4a7a, { x, y: 0.0, z: 0.18, parent: elsa.userData.limbs.head }));
		k.box(0.07, 0.025, 0.02, 0xc04a6a, { y: -0.1, z: 0.19, parent: elsa.userData.limbs.head });
		k.cyl(0.42, 0.62, 1.3, 0x7ad8f8, { y: 0.55, parent: elsa, emissive: 0x2a6a90, glow: 0.4 });
		chain(k, curve(k, [[-0.12, 1.85, -0.05], [-0.22, 1.6, 0.08], [-0.2, 1.3, 0.16], [-0.16, 1.05, 0.16]], 6), 0.07, 0xf2e2b0, { parent: elsa, seg: 6 });
		k.box(1.0, 1.7, 0.03, 0xc8f0ff, { y: 0.9, z: -0.25, rx: 0.12, opacity: 0.6, parent: elsa });
		const sparkle = [];
		for (let i = 0; i < 14; i++) sparkle.push(k.glow(0xd8f4ff, 0.16, { y: 1, parent: elsa, from: 5 }));
		k.tick((t) => sparkle.forEach((s, i) => {
			const a = t * 1.5 + i * 0.7;
			s.position.set(Math.cos(a) * (1.0 + (i % 3) * 0.3), 1.4 + ((i * 0.37 + t * 0.4) % 1.8), Math.sin(a) * (0.6 + (i % 3) * 0.2) - 0.3);
		}));
		k.point(0xd8f0ff, 12, 12, { x: 1, y: 3, z: -5, from: 5 });
		// Vignette: a valley of mossy round boulders among steaming vents.
		const tv = k.group({ x: 0, y: -400, z: 0 });
		k.ground(80, 0x5a6a48, { parent: tv, bump: 0.6, seg: 30 });
		const tr = rng(163);
		const moss = [0x6a7a4a, 0x7a8a50, 0x5a6a40];
		for (let i = 0; i < 16; i++) {
			const a = (i / 16) * PI * 2 + tr() * 0.3;
			const d = 4 + tr() * 5;
			const rad = 0.5 + tr() * 0.5;
			const x = Math.cos(a) * d;
			const z = Math.sin(a) * d - 3;
			k.ico(rad, 0x7a7068, { x, y: rad * 0.8, z, detail: 1, parent: tv, rough: 1 });
			k.ico(rad * 0.8, moss[i % 3], { x, y: rad * 1.25, z, s: [1.05, 0.55, 1.05], detail: 1, parent: tv, rough: 1 });
		}
		for (let i = 0; i < 40; i++) k.ico(0.15 + tr() * 0.2, [0x6a6a60, 0x8a8478][i % 2], { x: (tr() - 0.5) * 20, y: 0.05, z: (tr() - 0.5) * 16 - 3, parent: tv });
		for (let i = 0; i < 12; i++) k.ico(10 + tr() * 6, 0x4a5a60, { x: (tr() - 0.5) * 70, y: 2, z: -24 - tr() * 10, s: [1, 1.6, 1], parent: tv, rough: 1 });
		const steam = [];
		[[-2, -6], [3, -9], [-6, -10]].forEach(([x, z]) => {
			k.cyl(0.5, 0.7, 0.2, 0x3a3a3a, { x, y: 0.1, z, parent: tv });
			for (let j = 0; j < 4; j++) steam.push([k.sphere(0.5, 0xf0f0f0, { x, y: 1, z, opacity: 0.3, parent: tv, shadow: false }), x, z, j]);
		});
		k.tick((t) => steam.forEach(([m, x, z, j]) => {
			const p = (t * 0.2 + j / 4) % 1;
			m.position.set(x + p * 0.6, 0.4 + p * 4, z);
			m.scale.setScalar(0.5 + p * 1.6);
		}));
		[[1.5, -1], [-1.2, 0.5], [0.4, -4]].forEach(([x, z]) => k.cone(0.12, 0.5, 0xa8e8ff, { x, y: 0.2, z, rz: 0.3, seg: 5, parent: tv, emissive: 0x3a8ab0, glow: 0.6 }));
		k.point(0xffe0b0, 25, 30, { x: 3, y: -394, z: 4 });
		k.point(0x9ab8ff, 8, 30, { x: -5, y: -396, z: 2 });
		// Vignette: the kingdom's fjord, frozen solid round its ships.
		const fj = k.group({ x: 0, y: 400, z: 0 });
		k.sky(0x7a9ac0, 0xd8e2ec, { r: 280, y: 400, tag: "fsky", from: 2, until: 2 });
		k.box(500, 0.4, 500, 0xe4eef6, { y: -0.2, parent: fj, rough: 0.4 });
		for (let i = 0; i < 12; i++) {
			const s = i % 2 ? 1 : -1;
			const h = 50 + r() * 60;
			k.cone(40 + r() * 20, h, i % 3 ? 0xe8eef4 : 0x9aa8b8, { x: s * (70 + r() * 30), y: h / 2 - 2, z: -40 - i * 20, seg: 6, parent: fj });
		}
		const cas = k.group({ x: 0, z: -110, parent: fj });
		k.box(40, 10, 14, 0xd8ccb8, { y: 5, parent: cas });
		k.box(16, 14, 12, 0xe0d4c0, { y: 7, z: -4, parent: cas });
		[[-18, 18], [18, 16], [-6, 24], [6, 22], [0, 30]].forEach(([x, h]) => {
			k.cyl(2.4, 2.8, h, 0xe4d8c4, { x, y: h / 2, z: 2, seg: 8, parent: cas });
			k.cone(3, 7, 0x3a9a7a, { x, y: h + 3.5, z: 2, seg: 8, parent: cas });
		});
		const town = [0xd86a4a, 0xe8c070, 0x6a9ac8, 0xd8a8c0, 0x8ab070];
		for (let i = 0; i < 18; i++) {
			const x = -40 + i * 4.8;
			if (Math.abs(x) < 22) continue;
			k.box(4, 6 + (i % 3), 5, town[i % 5], { x, y: 3, z: -96, parent: fj });
			k.cone(3.4, 3, 0x5a4a4a, { x, y: 7.5 + (i % 3) * 0.5, z: -96, ry: PI / 4, seg: 4, parent: fj });
		}
		const boat = (x, z, ry, tilt) => {
			const g = k.group({ x, z, ry, rz: tilt, parent: fj });
			k.box(4, 3, 16, 0x5a3a24, { y: 0.6, parent: g });
			k.box(4.1, 0.4, 16.1, 0xe8dcc0, { y: 2, parent: g });
			[-4, 3].forEach((mz) => {
				k.cyl(0.18, 0.22, 16, 0x4a3020, { y: 9, z: mz, parent: g });
				[6, 10, 13].forEach((y) => k.cyl(0.3, 0.3, 4.5, 0xf0e8d8, { y, z: mz + 0.3, rz: PI / 2, parent: g }));
			});
			for (let i = 0; i < 6; i++) k.sphere(1.6, 0xf4f8fc, { x: (i % 2 ? 1 : -1) * 2.4, y: 0, z: -6 + i * 2.4, s: [1, 0.4, 1], parent: g });
		};
		boat(-18, -40, 0.3, 0.12);
		boat(14, -55, -0.4, -0.15);
		boat(-4, -75, 1.2, 0.08);
		k.particles(800, 0xffffff, { x: 0, y: 400, z: -20, box: [80, 30, 80], speed: 2, size: 0.15, drift: 1 });
		return {
			shots: [
				// 1: mossy boulders in a steaming valley.
				{ pos: [2.5, -397.6, 5.5], look: [-0.5, -399.2, -3], fov: 50, fog: [0x8a9aa8, 14, 60] },
				// 2: a reindeer and a sleigh among the pines.
				{ pos: [-35, 2.4, 37], look: [-41, 1.8, 27], fov: 50 },
				// 3: a fjord frozen round its ships.
				{ pos: [4, 404, -8], look: [-6, 405, -60], fov: 50, fog: [0xd8e2ec, 60, 420], hide: ["sky"] },
				{ pos: [12, 5, 26], look: [0, 13, -45], fov: 48 },
				{ pos: [6.8, 1.2, 8.6], look: [6, 1.1, 6], fov: 45 },
				{ pos: [1.9, 1.75, -4.5], look: [-0.3, 4.2, -30], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the scare floor
	r64: (k) => {
		k.fog(0x2a3448, 40, 200);
		k.sky(0x1a2030, 0x3a4458);
		k.light({ sky: 0xd8e4ff, ground: 0x5a5a68, hemi: 1.5, sunColor: 0xf0f4ff, sunPos: [10, 40, 30], sunIntensity: 1.5, shadowSize: 40, sunTarget: [0, 0, -4] });
		const hazard = k.canvas(256, 32, (g) => {
			g.fillStyle = "#f2c230";
			g.fillRect(0, 0, 256, 32);
			g.fillStyle = "#1a1a1a";
			for (let x = -32; x < 256; x += 32) {
				g.beginPath();
				g.moveTo(x, 32);
				g.lineTo(x + 16, 32);
				g.lineTo(x + 32, 0);
				g.lineTo(x + 16, 0);
				g.fill();
			}
		});
		hazard.wrapS = k.THREE.RepeatWrapping;
		hazard.repeat.set(20, 1);
		// The hall.
		k.box(120, 0.2, 50, 0x7a7e88, { y: -0.1, z: 0 });
		k.box(120, 18, 0.4, 0x4a5a7a, { y: 9, z: -12 });
		k.box(120, 0.4, 30, 0x3a4458, { y: 14, z: -2 });
		k.plane(110, 0.5, k.mat(0xffffff, { map: hazard }), { y: 0.01, z: -2.6, rx: -PI / 2 });
		for (let i = 0; i < 8; i++) {
			const x = -42 + i * 12;
			k.box(6, 0.3, 1.2, 0xe8f0ff, { x, y: 13.7, z: 2, emissive: 0xc0d0ff, glow: 1 });
			k.point(0xe0e8ff, 10, 26, { x, y: 12, z: 3 });
		}
		// The door stations.
		const doorCols = [0x4a8ad0, 0x6ac06a, 0xe0a040, 0x9a5ac0, 0x40b0b0, 0xd06060, 0xc0c040];
		const flowers = k.canvas(128, 256, (g) => {
			g.fillStyle = "#f0a8c8";
			g.fillRect(0, 0, 128, 256);
			g.strokeStyle = "#d888b0";
			g.lineWidth = 6;
			g.strokeRect(14, 14, 100, 100);
			g.strokeRect(14, 134, 100, 108);
			const fl = (x, y, c) => {
				g.fillStyle = c;
				for (let i = 0; i < 5; i++) {
					g.beginPath();
					g.arc(x + Math.cos((i * PI * 2) / 5) * 9, y + Math.sin((i * PI * 2) / 5) * 9, 7, 0, PI * 2);
					g.fill();
				}
				g.fillStyle = "#f8e060";
				g.beginPath();
				g.arc(x, y, 5, 0, PI * 2);
				g.fill();
			};
			[[40, 50, "#ffffff"], [88, 80, "#a0d8f0"], [60, 170, "#ffffff"], [30, 210, "#f8e060"], [95, 150, "#c0e8a0"], [80, 225, "#ffffff"]].forEach(([x, y, c]) => fl(x, y, c));
		});
		const station = (x, i, opts = {}) => {
			const g = k.group({ x, z: -6 });
			k.box(5, 0.3, 3, 0x5a5e6a, { y: 0.15, parent: g });
			k.box(2.3, 3.3, 0.35, 0x2a2a32, { y: 1.95, parent: g, metal: 0.4 });
			if (opts.boo) k.box(1.7, 2.9, 0.1, k.mat(0xffffff, { map: flowers }), { y: 1.8, z: 0.22, parent: g });
			else k.box(1.7, 2.9, 0.1, doorCols[i % doorCols.length], { y: 1.8, z: 0.22, parent: g });
			k.sphere(0.08, 0xd8c070, { x: 0.6, y: 1.7, z: 0.32, metal: 0.8, parent: g });
			k.cyl(0.25, 0.25, 0.4, opts.on ? 0xff2a1a : 0x6a1a14, { y: 3.85, parent: g, emissive: opts.on ? 0xff1a00 : 0x000000, glow: 2 });
			if (opts.on) {
				k.glow(0xff3020, 2.4, { y: 3.9, z: 0.3, parent: g });
				k.point(0xff3020, 6, 8, { y: 3.6, z: 1.2, parent: g });
			}
			k.box(0.9, 1.3, 0.6, 0x4a5a7a, { x: -2.1, y: 0.95, parent: g });
			[0x30ff60, 0xff4040, 0xffd040].forEach((c, j) => k.sphere(0.06, c, { x: -2.35 + j * 0.25, y: 1.62, z: 0.25, parent: g, emissive: c, glow: 1.5 }));
			k.box(0.5, 1.2, 0.5, 0x5a5e6a, { x: 2.1, y: 0.9, parent: g, metal: 0.5 });
			const can = k.group({ x: 2.1, y: 1.5, parent: g });
			k.cyl(0.28, 0.28, 0.85, 0xf2c230, { y: 0.45, seg: 16, parent: can, rough: 0.4 });
			[0.02, 0.88].forEach((y) => k.cyl(0.3, 0.3, 0.1, 0x9a9ea8, { y, seg: 16, parent: can, metal: 0.8, rough: 0.3 }));
			k.box(0.22, 0.5, 0.05, 0xb8e0ff, { y: 0.45, z: 0.27, parent: can, emissive: 0x4080a0, glow: opts.on ? 1.2 : 0.4 });
			k.cyl(0.08, 0.08, 0.04, 0xf0f0f0, { y: 0.78, z: 0.27, rx: PI / 2, parent: can });
			k.box(0.01, 0.06, 0.01, 0xd02020, { y: 0.79, z: 0.3, rz: 0.6, parent: can });
			k.cyl(0.04, 0.04, 0.2, 0x7a7e88, { y: 1.0, parent: can, metal: 0.8 });
		};
		[-36, -24, -12, 0, 12, 24, 36].forEach((x, i) => station(x, i, { boo: x === 0, on: x === -24 }));
		// The one-eyed one.
		const mike = k.group({ x: 3.0, y: 0, z: -1.0, ry: 0.05, from: 5 });
		const lime = 0x8ad040;
		k.sphere(0.72, lime, { y: 1.15, seg: 20, rings: 14, parent: mike });
		k.sphere(0.36, 0xffffff, { y: 1.35, z: 0.5, parent: mike });
		k.sphere(0.18, 0x40a8a0, { y: 1.35, z: 0.74, parent: mike, s: [1, 1, 0.5] });
		k.sphere(0.09, 0x111111, { y: 1.35, z: 0.81, parent: mike, s: [1, 1, 0.5] });
		k.torus(0.35, 0.04, 0x6aa830, { y: 1.42, z: 0.48, rx: -0.1, arc: PI, parent: mike, seg: 16 });
		k.box(0.6, 0.14, 0.2, 0x4a1418, { y: 0.88, z: 0.62, rx: -0.3, parent: mike });
		k.box(0.5, 0.05, 0.05, 0xffffff, { y: 0.93, z: 0.71, rx: -0.3, parent: mike });
		[-1, 1].forEach((s) => {
			k.cone(0.07, 0.22, 0xe8e8e0, { x: s * 0.32, y: 1.85, z: -0.05, rz: -s * 0.3, parent: mike });
			k.cyl(0.05, 0.05, 0.5, lime, { x: s * 0.28, y: 0.25, parent: mike });
			k.box(0.18, 0.08, 0.3, lime, { x: s * 0.28, y: 0.04, z: 0.06, parent: mike });
			const arm = k.group({ x: s * 0.68, y: 1.1, rz: s * 0.9, parent: mike });
			k.cyl(0.04, 0.04, 0.6, lime, { y: -0.3, parent: arm });
			k.sphere(0.08, lime, { y: -0.62, parent: arm });
		});
		// The big blue one, and the little girl.
		const sul = k.group({ x: -2.6, y: 0, z: -1.6, ry: 0.35, from: 5 });
		const fur = 0x3ab0c8;
		const spot = 0x7a4ab0;
		k.sphere(1.1, fur, { y: 2.0, s: [1.05, 1.35, 0.9], seg: 18, parent: sul });
		k.sphere(0.72, fur, { y: 3.45, z: 0.3, seg: 16, parent: sul });
		const sr = rng(64);
		for (let i = 0; i < 26; i++) {
			const d = new k.THREE.Vector3(sr() - 0.5, sr() - 0.4, sr() - 0.5).normalize();
			k.sphere(0.13 + sr() * 0.1, spot, { x: d.x * 1.155, y: 2.0 + d.y * 1.485, z: d.z * 0.99, parent: sul });
		}
		for (let i = 0; i < 6; i++) {
			const d = new k.THREE.Vector3(sr() - 0.5, sr(), -sr()).normalize();
			k.sphere(0.12, spot, { x: d.x * 0.72, y: 3.45 + d.y * 0.72, z: 0.3 + d.z * 0.72, parent: sul });
		}
		[-1, 1].forEach((s) => {
			k.capsule(0.38, 0.5, fur, { x: s * 0.5, y: 0.55, parent: sul });
			k.box(0.5, 0.2, 0.6, fur, { x: s * 0.5, y: 0.1, z: 0.15, parent: sul });
			k.capsule(0.3, 1.1, fur, { x: s * 1.2, y: 2.0, rz: s * 0.25, parent: sul });
			k.cone(0.13, 0.5, 0xe0d4c0, { x: s * 0.42, y: 4.0, z: 0.2, rz: -s * 0.5, parent: sul });
			k.sphere(0.1, 0xffffff, { x: s * 0.22, y: 3.62, z: 0.92, parent: sul });
			k.sphere(0.055, 0x2a6ab0, { x: s * 0.22, y: 3.62, z: 0.99, parent: sul });
		});
		k.sphere(0.12, 0x1a2a6a, { y: 3.42, z: 1.0, parent: sul });
		k.box(0.6, 0.1, 0.1, 0x2a1020, { y: 3.18, z: 0.92, parent: sul });
		const boo = k.person({ x: -0.3, y: 0, z: 0.6, ry: 0.1, s: 0.55, dress: 0xf0a0c8, colors: { shirt: 0xf0a0c8, legs: 0x8a5ab0, hair: 0x2a1a10, skin: 0xf8d8c0 }, from: 5 });
		limbs(boo, { armR: [0, 0, 2.6], armL: [0, 0, -0.4] });
		boo.userData.limbs.head.scale.setScalar(1.5);
		[-1, 1].forEach((s) => k.sphere(0.08, 0x2a1a10, { x: s * 0.2, y: 0.08, z: -0.02, parent: boo.userData.limbs.head }));
		// Vignette: the vault — endless doors on rails.
		const doorGeo = new k.THREE.BoxGeometry(0.15, 2.6, 1.6);
		const doorMat = new k.THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, flatShading: true });
		const N = 7 * 2 * 46;
		const doors = new k.THREE.InstancedMesh(doorGeo, doorMat, N);
		const m4 = new k.THREE.Matrix4();
		const col = new k.THREE.Color();
		const vr = rng(7);
		const vc = [0x4a8ad0, 0x6ac06a, 0xe0a040, 0x9a5ac0, 0x40b0b0, 0xd06060, 0xc0c040, 0xf0a8c8, 0xe8e0d0, 0x7a5a3a];
		let n = 0;
		for (let tier = 0; tier < 7; tier++)
			[-1, 1].forEach((s) => {
				const y = 6 + tier * 5;
				k.box(0.25, 0.25, 160, 0x6a6e78, { x: s * 5, y, z: -400, metal: 0.6, shadow: false });
				for (let i = 0; i < 46; i++) {
					m4.makeRotationY((vr() - 0.5) * 0.25);
					m4.setPosition(s * 5, y - 1.6, -330 - i * 3.2 + vr());
					doors.setMatrixAt(n, m4);
					doors.setColorAt(n, col.set(vc[Math.floor(vr() * vc.length)]));
					n++;
				}
			});
		k.place(doors, { shadow: false });
		for (let i = 0; i < 6; i++) k.point(0xe0e8ff, 30, 50, { x: 0, y: 22, z: -340 - i * 22 });
		k.box(30, 0.4, 200, 0x3a4050, { y: -14, z: -400 });
		// A child's lost sock on the factory floor.
		const sock = k.group({ x: 16, y: 0, z: 0.4, ry: 0.5, until: 0 });
		const sk = 0xf08a30;
		k.capsule(0.11, 0.42, sk, { y: 0.07, z: -0.1, rx: PI / 2, s: [1, 1, 0.55], parent: sock });
		k.capsule(0.1, 0.18, sk, { x: 0.16, y: 0.065, z: 0.22, rx: PI / 2, ry: 0.9, s: [1, 1, 0.55], parent: sock });
		[-0.25, -0.12].forEach((z) => k.box(0.21, 0.13, 0.04, 0xf8f4ec, { y: 0.07, z, parent: sock }));
		k.box(0.2, 0.03, 0.12, 0xe07a24, { y: 0.02, z: -0.42, parent: sock });
		return {
			shots: [
				// 1: a lone sock on a grey floor.
				{ pos: [17.4, 1.0, 2.0], look: [16.0, 0.05, -0.2], fov: 42 },
				// 2: a yellow canister with a gauge.
				{ pos: [-21.2, 2.25, -4.1], look: [-21.9, 1.95, -6], fov: 40 },
				// 3: a door station with its red light on.
				{ pos: [-19, 2.1, 4], look: [-24, 2.4, -5], fov: 45 },
				// 4: the child's door with flowers.
				{ pos: [1.0, 2.0, 1.6], look: [0, 1.85, -5.6], fov: 45 },
				// 5: the vault of endless doors.
				{ pos: [0.5, 16, -318], look: [0, 22, -420], fov: 55, fog: [0x1a2236, 20, 140] },
				// 6: the big blue one, the one-eyed one and the girl.
				{ pos: [0.6, 2.3, 5.6], look: [-0.2, 2.0, -2.2], fov: 52, exposure: 1.2 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the trash planet
	r65: (k) => {
		k.fog(0xd8a870, 30, 320);
		k.sky(0xa87048, 0xf0c890);
		k.light({ sky: 0xffe0b0, ground: 0x6a4a2a, hemi: 1.35, sunColor: 0xffd8a0, sunPos: [-40, 50, 40], sunIntensity: 2.2, shadowSize: 30 });
		k.ground(600, 0xa88050, { bump: 0.4, seg: 60 });
		const r = rng(65);
		const cubeTex = k.canvas(128, 128, (g) => {
			const tones = ["#7a5a3a", "#8a6a48", "#6a5040", "#9a7a58", "#5a4a40", "#7a7068", "#8a5a3a"];
			for (let y = 0; y < 128; y += 8) for (let x = 0; x < 128; x += 8) {
				g.fillStyle = tones[Math.floor(Math.random() * tones.length)];
				g.fillRect(x, y, 8 + Math.random() * 10, 8);
			}
			for (let i = 0; i < 30; i++) {
				g.fillStyle = ["#4a6a8a", "#a84a3a", "#c8b070", "#3a3a3a"][i % 4];
				g.fillRect(Math.random() * 128, Math.random() * 128, 4 + Math.random() * 10, 3);
			}
			g.strokeStyle = "#3a2a1a";
			g.lineWidth = 4;
			g.strokeRect(0, 0, 128, 128);
		});
		cubeTex.wrapS = cubeTex.wrapT = k.THREE.RepeatWrapping;
		const tower = (x, z, w, h) => {
			const t = cubeTex.clone();
			t.needsUpdate = true;
			t.repeat.set(w / 2, h / 2);
			k.box(w, h, w, k.mat(0xffffff, { map: t }), { x, y: h / 2, z, ry: r() * 0.3 });
		};
		for (let i = 0; i < 40; i++) {
			const x = (r() - 0.5) * 260;
			const z = -30 - r() * 200;
			if (Math.abs(x) < 10 && z > -50) continue;
			tower(x, z, 6 + Math.floor(r() * 3) * 2, 30 + Math.floor(r() * 30) * 2);
		}
		city(k, 30, [-250, 250, -300, -220], { h: 140, w: 14, colors: [0x7a6a5a, 0x8a7a6a, 0x6a5e52], seed: 65 });
		const cubeMat = k.mat(0xffffff, { map: cubeTex });
		const stack = (x, z, n) => {
			for (let i = 0; i < n; i++) k.box(1.2, 1.2, 1.2, cubeMat, { x: x + (r() - 0.5) * 0.15, y: 0.6 + i * 1.2, z: z + (r() - 0.5) * 0.15, ry: (r() - 0.5) * 0.4 });
		};
		[[-5, -3, 3], [6, -4, 2], [-8, 2, 1], [5, 3, 1], [9, 0, 4], [-3, -8, 5], [3, 10, 1], [-11, -6, 2]].forEach(([x, z, n]) => stack(x, z, n));
		for (let i = 0; i < 40; i++) {
			const x = (r() - 0.5) * 40;
			const z = (r() - 0.5) * 30;
			if (Math.abs(x) < 5 && z > -1 && z < 12) continue;
			k.box(0.3 + r() * 0.6, 0.2 + r() * 0.3, 0.3 + r() * 0.6, [0x5a4a3a, 0x7a7068, 0x4a5a6a, 0x8a3a2a][i % 4], { x, y: 0.1, z, ry: r() * 6 });
		}
		k.particles(500, 0xf0d8b0, { y: 0, box: [60, 20, 60], speed: 0.3, size: 0.06, drift: 0.8, opacity: 0.5 });
		// The old boot with a seedling.
		const boot = (o) => {
			const b = k.group(o);
			k.box(0.36, 0.55, 0.4, 0x8a5a34, { y: 0.3, parent: b });
			k.box(0.36, 0.24, 0.4, 0x7a4c2a, { y: 0.12, z: 0.3, parent: b });
			k.capsule(0.12, 0.14, 0x7a4c2a, { y: 0.12, z: 0.5, rz: PI / 2, s: [1, 1.5, 1], parent: b });
			k.box(0.38, 0.06, 0.42, 0x3a2414, { y: 0.03, z: 0.15, parent: b });
			for (let i = 0; i < 3; i++) k.box(0.2, 0.02, 0.02, 0xd8c8a0, { y: 0.32 + i * 0.08, z: 0.21, parent: b });
			k.cyl(0.16, 0.16, 0.02, 0x2a1a10, { y: 0.575, parent: b });
			k.cyl(0.012, 0.012, 0.22, 0x5ab040, { y: 0.68, parent: b });
			[-1, 1].forEach((s) => k.sphere(0.06, 0x6ad040, { x: s * 0.06, y: 0.79, s: [1.4, 0.25, 0.8], rz: s * 0.4, parent: b }));
			return b;
		};
		// The cockroach on a cube.
		k.box(1.2, 1.2, 1.2, cubeMat, { x: 3, y: 0.6, z: 10, ry: 0.2 });
		const roach = k.group({ x: 3, y: 1.21, z: 10, ry: -0.8 });
		k.capsule(0.05, 0.12, 0x4a2a14, { y: 0.04, rx: PI / 2, s: [1.2, 1, 0.6], parent: roach, rough: 0.2 });
		k.sphere(0.035, 0x3a2010, { y: 0.03, z: 0.12, parent: roach });
		[-1, 1].forEach((s) => {
			k.cyl(0.003, 0.003, 0.25, 0x2a1408, { x: s * 0.05, y: 0.06, z: 0.24, rx: 1.2, rz: s * 0.4, parent: roach });
			[-0.05, 0, 0.05].forEach((z) => k.cyl(0.004, 0.004, 0.12, 0x2a1408, { x: s * 0.07, y: 0.02, z, rz: s * 1.2, parent: roach }));
		});
		// EVE, floating.
		const eve = k.group({ x: 2.4, y: 0.6, z: 0.8, ry: -0.4, from: 4 });
		const gloss = { rough: 0.15, metal: 0.1, flat: false };
		k.sphere(0.32, 0xf8f8fa, { y: 0.5, s: [1, 1.6, 1], parent: eve, ...gloss });
		const evh = k.group({ y: 1.18, parent: eve });
		k.sphere(0.27, 0xf8f8fa, { s: [1.15, 0.85, 1], parent: evh, ...gloss });
		k.sphere(0.24, 0x0a0a12, { z: 0.06, s: [1.1, 0.65, 0.95], parent: evh, rough: 0.1 });
		[-0.09, 0.09].forEach((x) => k.sphere(0.05, 0x40a8ff, { x, y: 0.01, z: 0.27, s: [1.3, 0.8, 0.5], parent: evh, emissive: 0x2a90ff, glow: 2 }));
		[-1, 1].forEach((s) => k.sphere(0.1, 0xf8f8fa, { x: s * 0.36, y: 0.6, s: [0.5, 2.4, 0.8], rz: s * 0.15, parent: eve, ...gloss }));
		k.point(0x60b0ff, 2, 3, { y: 1.2, z: 0.6, parent: eve });
		k.tick((t) => (eve.position.y = 0.6 + Math.sin(t * 1.4) * 0.12));
		// WALL-E, holding the boot.
		const wally = k.group({ x: 0, y: 0, z: 1.5, ry: 0.25, from: 5 });
		const rust = 0xd8a038;
		[-1, 1].forEach((s) => {
			k.box(0.3, 0.42, 1.0, 0x3a3a3a, { x: s * 0.55, y: 0.26, parent: wally });
			[-0.42, 0.42].forEach((z) => k.cyl(0.22, 0.22, 0.32, 0x2a2a2a, { x: s * 0.55, y: 0.24, z, rz: PI / 2, parent: wally }));
		});
		k.box(0.88, 0.82, 0.8, rust, { y: 0.9, parent: wally });
		k.box(0.7, 0.5, 0.05, 0xc89a40, { y: 0.88, z: 0.41, parent: wally });
		k.cyl(0.05, 0.05, 0.02, 0xc02020, { x: 0.25, y: 1.12, z: 0.43, rx: PI / 2, parent: wally });
		k.box(0.3, 0.15, 0.81, 0x8a5a28, { x: -0.3, y: 0.6, parent: wally });
		k.cyl(0.04, 0.04, 0.42, 0x6a6a6a, { y: 1.5, parent: wally });
		[-1, 1].forEach((s) => {
			k.cyl(0.13, 0.16, 0.32, 0x8a8a8a, { x: s * 0.15, y: 1.78, z: 0.04, rx: PI / 2, parent: wally, metal: 0.4 });
			k.cyl(0.11, 0.11, 0.02, 0x1a1a24, { x: s * 0.15, y: 1.78, z: 0.21, rx: PI / 2, parent: wally });
			k.sphere(0.03, 0xffffff, { x: s * 0.15 + 0.03, y: 1.8, z: 0.22, parent: wally });
			k.box(0.1, 0.1, 0.48, 0x7a7a7a, { x: s * 0.47, y: 0.95, z: 0.4, rx: 0.3, parent: wally });
			k.box(0.08, 0.16, 0.08, 0x5a5a5a, { x: s * 0.18, y: 0.92, z: 0.7, parent: wally });
		});
		k.box(0.36, 0.08, 0.36, 0x6a6a6a, { y: 1.63, z: 0.02, parent: wally });
		boot({ x: 0, y: 0.72, z: 0.72, s: 0.55, ry: -PI / 2, parent: wally });
		// Space: the cruise ship.
		k.stars(2000, { y: 500, upper: false, r: 500 });
		const sp = k.group({ y: 500 });
		k.sphere(70, 0x3a6ab0, { x: 140, y: -110, z: -300, seg: 32, rings: 24, parent: sp, emissive: 0x0a1a38 });
		k.point(0xffffff, 3, 600, { x: 80, y: 60, z: 80, parent: sp });
		const ax = k.group({ x: 0, y: 0, z: -40, ry: 0.4, rz: -0.08, parent: sp });
		k.capsule(5, 30, 0xf0f2f4, { rz: PI / 2, s: [1, 1, 0.7], parent: ax, rough: 0.3 });
		k.cone(4, 10, 0xe8eaee, { x: 22, rz: -PI / 2, s: [1, 1, 0.7], parent: ax });
		k.cyl(3, 3.6, 3, 0x3a3e48, { x: -21, rz: PI / 2, parent: ax });
		k.glow(0x60c0ff, 14, { x: -23.5, parent: ax });
		k.box(28, 4, 6, 0xe8eaee, { y: 4.5, parent: ax });
		k.box(18, 3, 5, 0xe0e4ea, { y: 8, x: -2, parent: ax });
		k.sphere(3, 0xd8e0ea, { x: 8, y: 10, s: [1.6, 0.8, 1], parent: ax });
		for (let i = 0; i < 18; i++) k.box(1.4, 0.4, 0.1, 0x7ad0ff, { x: -14 + i * 1.6, y: 1 + (i % 2) * 3, z: 3.6, parent: ax, emissive: 0x40b0ff, glow: 1.2 });
		[-2.5, 2.5].forEach((z) => k.glow(0x60c0ff, 6, { x: -21, z, parent: ax }));
		// Vignette: a cutlery tray on a cluttered shelf, a spork laid across the divider.
		const sh = k.group({ x: 300, y: -400, z: 0 });
		k.box(20, 0.2, 20, 0x4a3a2a, { y: -0.1, parent: sh });
		const corr = k.canvas(128, 128, (g) => {
			for (let x = 0; x < 128; x += 8) {
				g.fillStyle = (x / 8) % 2 ? "#7a6a58" : "#8a7a66";
				g.fillRect(x, 0, 8, 128);
			}
		});
		corr.wrapS = corr.wrapT = k.THREE.RepeatWrapping;
		corr.repeat.set(4, 1);
		k.box(20, 8, 0.2, k.mat(0xffffff, { map: corr }), { y: 4, z: -2, parent: sh });
		k.box(6, 0.12, 2.2, 0x6a5a48, { y: 1.2, z: -0.9, parent: sh });
		[-2.8, 2.8].forEach((x) => k.box(0.12, 1.2, 2.2, 0x5a4a3a, { x, y: 0.6, z: -0.9, parent: sh }));
		const tray = k.group({ x: -0.2, y: 1.26, z: -0.7, ry: 0.08, parent: sh });
		const plastic = 0x5a7a9a;
		k.box(2.0, 0.06, 1.3, plastic, { y: 0.03, parent: tray });
		[-1, 1].forEach((s) => k.box(2.0, 0.22, 0.05, plastic, { y: 0.14, z: s * 0.63, parent: tray }));
		[-0.98, -0.33, 0.33, 0.98].forEach((x) => k.box(0.05, 0.22, 1.3, plastic, { x, y: 0.14, parent: tray }));
		const steel = { metal: 0.85, rough: 0.25 };
		const fork = (x, z, ry) => {
			const f = k.group({ x, y: 0.08, z, ry, parent: tray });
			k.box(0.06, 0.02, 0.6, 0xc8ccd4, { z: 0.2, parent: f, ...steel });
			k.box(0.12, 0.02, 0.12, 0xc8ccd4, { z: -0.15, parent: f, ...steel });
			for (let i = 0; i < 4; i++) k.box(0.018, 0.02, 0.2, 0xc8ccd4, { x: -0.045 + i * 0.03, z: -0.3, parent: f, ...steel });
		};
		const spoon = (x, z, ry) => {
			const f = k.group({ x, y: 0.08, z, ry, parent: tray });
			k.box(0.06, 0.02, 0.6, 0xc8ccd4, { z: 0.2, parent: f, ...steel });
			k.sphere(0.1, 0xc8ccd4, { z: -0.22, s: [0.8, 0.25, 1.3], parent: f, ...steel });
		};
		[-0.06, 0.04, 0.12].forEach((dx, i) => fork(-0.66 + dx, 0.02 * i, 0.04 * i));
		[-0.04, 0.06].forEach((dx, i) => spoon(0.66 + dx, 0.02 * i, -0.05 * i));
		const spork = k.group({ x: 0.1, y: 0.26, z: 0.05, ry: PI / 2 - 0.2, rz: 0.06, parent: tray });
		k.box(0.06, 0.02, 0.6, 0xe8e8e0, { z: 0.2, parent: spork });
		k.sphere(0.1, 0xe8e8e0, { z: -0.22, s: [0.8, 0.25, 1.3], parent: spork });
		for (let i = 0; i < 3; i++) k.box(0.02, 0.02, 0.08, 0xe8e8e0, { x: -0.04 + i * 0.04, z: -0.36, parent: spork });
		k.box(0.36, 0.36, 0.36, 0xd83a2a, { x: 2.0, y: 1.44, z: -1.1, ry: 0.5, parent: sh });
		k.box(0.37, 0.12, 0.37, 0xf0d040, { x: 2.0, y: 1.56, z: -1.1, ry: 0.5, parent: sh });
		k.box(0.37, 0.12, 0.37, 0x3a8ad8, { x: 2.0, y: 1.32, z: -1.1, ry: 0.5, parent: sh });
		k.sphere(0.18, 0xf8f4e0, { x: -2.0, y: 1.5, z: -1.2, s: [1, 1.2, 1], opacity: 0.85, rough: 0.1, parent: sh });
		k.cyl(0.08, 0.1, 0.18, 0xa8a8a8, { x: -2.0, y: 1.3, z: -1.2, metal: 0.7, parent: sh });
		for (let i = 0; i < 9; i++) k.glow(0xffd890, 0.4, { x: -2.8 + i * 0.7, y: 2.6 + Math.sin(i * 1.3) * 0.15, z: -1.7, parent: sh });
		k.cyl(0.006, 0.006, 6, 0x2a2a2a, { y: 2.6, z: -1.72, rz: PI / 2, parent: sh });
		k.point(0xffd8a0, 10, 12, { x: 300.5, y: -397.2, z: 1.5 });
		k.point(0xffe8c0, 4, 10, { x: 298, y: -398, z: 2 });
		return {
			shots: [
				// 1: a cutlery tray with a spork.
				{ pos: [300.6, -397.75, 1.3], look: [299.9, -398.65, -0.6], fov: 45, fog: [0x2a2018, 8, 30], hide: ["sky", "stars"] },
				// 2: a cockroach on a cube of trash.
				{ pos: [3.3, 1.42, 10.42], look: [3, 1.24, 10], fov: 40, hide: ["stars"] },
				// 3: towers of compacted trash.
				{ pos: [0, 5, 30], look: [0, 22, -60], fov: 50, hide: ["stars"] },
				// 4: a cruise starship in orbit.
				{ pos: [30, 515, 40], look: [0, 500, -40], fov: 50, fog: [0x000006, 900, 3000] },
				// 5: the white probe robot hovering.
				{ pos: [4.3, 1.8, 5.0], look: [2.4, 1.6, 0.8], fov: 45, hide: ["stars"] },
				// 6: the little trash robot holding the boot.
				{ pos: [1.5, 1.25, 5.4], look: [0.9, 1.25, 1.2], fov: 48, hide: ["stars"] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the rooftops
	r66: (k) => {
		k.fog(0x1c2850, 80, 560);
		k.sky(0x0a1440, 0x4a5a98);
		k.stars(900);
		k.light({ sky: 0xa8b8f0, ground: 0x2a2a40, hemi: 1.4, sunColor: 0xc0ccff, sunIntensity: 1.2, sunPos: [-40, 80, 40], shadowSize: 30, sunTarget: [0, 20, 0] });
		k.disc(0xf4f0e0, 18, { x: 120, y: 160, z: -500 });
		k.glow(0xc8d0ff, 60, { x: 120, y: 160, z: -505, opacity: 0.5 });
		const r = rng(66);
		const lit = k.mat(0xffd890, { emissive: 0xffb050, glow: 0.9 });
		const zinc = 0x5a6a80;
		const building = (x, z, h, w) => {
			k.box(w, h, w, [0xd8c8a8, 0xe0d0b4, 0xc8b898][Math.floor(r() * 3)], { x, y: h / 2, z });
			k.cyl(w * 0.5, w * 0.72, 3, zinc, { x, y: h + 1.5, z, seg: 4, ry: PI / 4 });
			for (let j = 0; j < 3; j++) if (r() > 0.4) k.box(w * 0.7, 0.5, 0.1, lit, { x, y: h * (0.3 + j * 0.22), z: z + w / 2 + 0.02, shadow: false });
			const cx = x + (r() - 0.5) * w * 0.5;
			k.box(1.6, 2, 0.7, 0xa85a3a, { x: cx, y: h + 3, z });
			for (let j = 0; j < 3; j++) k.cyl(0.15, 0.18, 0.5, 0xc8703a, { x: cx - 0.5 + j * 0.5, y: h + 4.2, z });
		};
		for (let x = -120; x <= 120; x += 15)
			for (let z = -20; z >= -280; z -= 15) {
				if (Math.abs(x) < 10 && z > -25) continue;
				building(x + (r() - 0.5) * 3, z + (r() - 0.5) * 3, 16 + r() * 8, 12);
			}
		// Our rooftop: a flat terrace with chimney stacks.
		k.box(16, 20, 16, 0xd0c0a0, { y: 10, z: 2 });
		k.box(16.4, 0.6, 0.6, 0xc0b090, { y: 20.3, z: 9.8 });
		k.box(16.4, 0.6, 0.6, 0xc0b090, { y: 20.3, z: -5.8 });
		[[-5, -3], [4, -4]].forEach(([x, z]) => {
			k.box(2.4, 3, 1, 0xa85a3a, { x, y: 21.5, z });
			for (let j = 0; j < 4; j++) k.cyl(0.2, 0.25, 0.7, 0xc8703a, { x: x - 0.9 + j * 0.6, y: 23.3, z });
		});
		k.box(16, 0.3, 16, 0x6a7080, { y: 20.15, z: 2 });
		// The tower in the distance.
		const eif = k.group({ x: -30, z: -300 });
		const gold = new k.THREE.MeshStandardMaterial({ color: 0xffc860, emissive: 0xe09030, emissiveIntensity: 1.2, wireframe: true });
		const goldS = k.mat(0x6a4a20, { emissive: 0xa06a20, glow: 0.8 });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => {
			const leg = k.cyl(1.2, 2.6, 34, goldS, { x: sx * 12, y: 16, z: sz * 12, seg: 4, parent: eif });
			leg.rotation.set(sz * 0.32, 0, -sx * 0.32);
		}));
		k.box(26, 2, 26, goldS, { y: 30, parent: eif });
		k.mesh(new k.THREE.CylinderGeometry(4, 13, 46, 4, 6), gold, { y: 54, ry: PI / 4, parent: eif });
		k.mesh(new k.THREE.CylinderGeometry(3, 9, 46, 4, 1), goldS, { y: 54, ry: PI / 4, parent: eif, s: 0.8 });
		k.box(10, 1.5, 10, goldS, { y: 60, parent: eif });
		k.mesh(new k.THREE.CylinderGeometry(0.6, 4, 40, 4, 5), gold, { y: 97, ry: PI / 4, parent: eif });
		k.cyl(0.4, 2.8, 40, goldS, { y: 97, seg: 4, ry: PI / 4, parent: eif });
		k.cyl(0.15, 0.4, 10, goldS, { y: 122, parent: eif });
		k.glow(0xffd080, 140, { y: 60, parent: eif, opacity: 0.25 });
		k.point(0xffc060, 40, 200, { x: -30, y: 60, z: -260 });
		// The rat on the parapet.
		const rat = (o, s) => {
			const g = k.group({ ...o, s });
			const fur = 0x5a6a84;
			k.capsule(0.11, 0.16, fur, { y: 0.21, rx: -0.25, parent: g });
			k.capsule(0.08, 0.1, 0x9aa4b4, { y: 0.2, z: 0.05, rx: -0.25, parent: g });
			k.sphere(0.1, fur, { y: 0.44, z: 0.04, parent: g });
			k.cone(0.06, 0.14, fur, { y: 0.42, z: 0.17, rx: PI / 2, parent: g });
			k.sphere(0.022, 0xd88a9a, { y: 0.42, z: 0.24, parent: g });
			[-1, 1].forEach((sx) => {
				k.sphere(0.065, 0xb8a0b0, { x: sx * 0.08, y: 0.54, z: 0.0, s: [1, 1, 0.3], parent: g });
				k.sphere(0.018, 0x111111, { x: sx * 0.045, y: 0.47, z: 0.12, parent: g });
				k.box(0.05, 0.03, 0.1, fur, { x: sx * 0.06, y: 0.015, z: 0.04, parent: g });
				k.capsule(0.022, 0.08, fur, { x: sx * 0.1, y: 0.25, z: 0.08, rx: -0.8, parent: g });
			});
			chain(k, curve(k, [[0, 0.1, -0.08], [0, 0.03, -0.3], [0.15, 0.02, -0.5], [0.3, 0.05, -0.6]], 8), 0.012, 0xc89aa8, { parent: g, seg: 5 });
			return g;
		};
		rat({ x: 0.6, y: 20.6, z: 9.8, ry: PI - 0.15, from: 4 }, 1.4);
		// Vignette: the restaurant kitchen.
		const kit = k.group({ x: 0, y: -400, z: 0 });
		const tiles = k.canvas(256, 256, (g) => {
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
				g.fillStyle = (x + y) % 2 ? "#2a2a2a" : "#e8e4dc";
				g.fillRect(x * 32, y * 32, 32, 32);
			}
		});
		tiles.wrapS = tiles.wrapT = k.THREE.RepeatWrapping;
		tiles.repeat.set(6, 6);
		k.box(30, 0.2, 30, k.mat(0xffffff, { map: tiles }), { y: -0.1, parent: kit });
		const wallT = k.canvas(128, 128, (g) => {
			g.fillStyle = "#f0ece4";
			g.fillRect(0, 0, 128, 128);
			g.strokeStyle = "#c8c4bc";
			g.lineWidth = 3;
			for (let i = 0; i <= 128; i += 32) {
				g.beginPath();
				g.moveTo(i, 0);
				g.lineTo(i, 128);
				g.moveTo(0, i);
				g.lineTo(128, i);
				g.stroke();
			}
		});
		wallT.wrapS = wallT.wrapT = k.THREE.RepeatWrapping;
		wallT.repeat.set(8, 2);
		k.box(30, 6, 0.3, k.mat(0xffffff, { map: wallT }), { y: 3, z: -2.2, parent: kit });
		const steel = { metal: 0.7, rough: 0.35 };
		k.box(9, 0.9, 1.3, 0xb8bcc4, { x: -1.5, y: 0.45, z: -1.2, parent: kit, ...steel });
		k.box(9.1, 0.05, 1.4, 0xd0d4dc, { x: -1.5, y: 0.92, z: -1.2, parent: kit, ...steel });
		k.box(3.2, 0.95, 1.3, 0x2a2a30, { x: 4.6, y: 0.47, z: -1.2, parent: kit });
		const copper = { metal: 0.8, rough: 0.3 };
		[[3.8, -1.0], [5.4, -1.4]].forEach(([x, z]) => {
			k.torus(0.28, 0.03, 0x4a8aff, { x, y: 0.97, z, rx: PI / 2, parent: kit, emissive: 0x2060ff, glow: 2 });
			k.cyl(0.32, 0.3, 0.45, 0xc87a40, { x, y: 1.2, z, parent: kit, ...copper });
		});
		k.particles(200, 0xffffff, { x: 4.6, y: -398.6, z: -1.2, box: [2.4, 2.2, 1], speed: -0.6, size: 0.1, opacity: 0.35, drift: 0.3 });
		k.box(10, 0.08, 0.08, 0x8a8e96, { x: 1, y: 2.9, z: -1.4, parent: kit, ...steel });
		for (let i = 0; i < 8; i++) {
			const x = -3.2 + i * 1.2;
			k.cyl(0.01, 0.01, 0.35, 0x6a6e76, { x, y: 2.72, z: -1.4, parent: kit });
			k.cyl(0.18 + (i % 3) * 0.05, 0.16 + (i % 3) * 0.05, 0.25, 0xc87a40, { x, y: 2.42, z: -1.4, rx: 0.2, parent: kit, ...copper });
		}
		k.point(0xffe0b0, 12, 14, { x: -1, y: -397, z: 2 });
		k.point(0xffd0a0, 8, 10, { x: 4, y: -397.5, z: 1 });
		// Cheese and a strawberry.
		k.box(0.8, 0.04, 0.5, 0xa87a48, { x: -2.6, y: 0.96, z: -1.1, parent: kit });
		k.cyl(0.22, 0.22, 0.12, 0xf2d060, { x: -2.75, y: 1.04, z: -1.15, seg: 24, parent: kit });
		k.cyl(0.22, 0.22, 0.02, 0xe0b040, { x: -2.75, y: 1.11, z: -1.15, seg: 24, parent: kit });
		k.cyl(0.16, 0.16, 0.1, 0xf6dc70, { x: -2.38, y: 1.03, z: -0.98, seg: 3, ry: 0.6, parent: kit });
		const berry = k.group({ x: -2.45, y: 0.98, z: -1.3, parent: kit });
		k.cone(0.06, 0.13, 0xd8202a, { y: 0.065, rx: PI, seg: 8, parent: berry, rough: 0.3 });
		k.cone(0.065, 0.03, 0x3a8a2a, { y: 0.14, seg: 6, parent: berry });
		// The dish.
		const plate = k.group({ x: 1.6, y: 0.95, z: -1.1, parent: kit });
		k.cyl(0.3, 0.24, 0.03, 0xf8f8f4, { seg: 24, parent: plate, flat: false, rough: 0.2 });
		k.cyl(0.16, 0.16, 0.005, 0xb82a1a, { y: 0.018, seg: 20, parent: plate });
		const veg = [0x6a9a3a, 0xe8c040, 0x5a2a4a, 0xd83a2a];
		for (let i = 0; i < 34; i++) {
			const a = i * 0.42;
			const rad = 0.025 + i * 0.0035;
			k.cyl(0.035, 0.035, 0.008, veg[i % 4], { x: Math.cos(a) * rad, y: 0.04, z: Math.sin(a) * rad, rx: PI / 2 - 0.7, ry: -a + PI / 2, rz: 0, seg: 10, parent: plate });
		}
		k.cyl(0.004, 0.004, 0.08, 0x3a8a2a, { y: 0.07, rz: 0.4, parent: plate });
		// The cook with a rat under his hat.
		const cook = k.person({ x: 0.2, y: 0, z: 0.5, s: 1.05, ry: -0.1, colors: { shirt: 0xf4f4f0, legs: 0x5a5a62, hair: 0x9a4a24, skin: 0xf2d0b4 }, from: 5, parent: kit });
		limbs(cook, { armR: [-0.5, 0, 0.3] });
		[0.05, 0.25].forEach((y) => k.sphere(0.03, 0xc8c8c0, { x: 0.12, y: 1.2 + y, z: 0.15, parent: cook }));
		k.box(0.06, 0.3, 0.02, 0x2a2a2a, { y: 1.5, z: 0.15, parent: cook });
		const ch = cook.userData.limbs.head;
		[-0.07, 0.07].forEach((x) => k.sphere(0.028, 0x2a1a10, { x, y: -0.01, z: 0.18, parent: ch }));
		k.sphere(0.04, 0xe8b898, { y: -0.06, z: 0.2, parent: ch });
		rat({ y: 0.16, z: -0.04, ry: 0, parent: ch }, 0.6);
		k.cyl(0.2, 0.18, 0.24, 0xffffff, { y: 0.62, rz: 0.12, parent: ch });
		k.sphere(0.26, 0xffffff, { y: 0.84, rz: 0.12, s: [1, 0.6, 1], parent: ch });
		return {
			shots: [
				{ pos: [-2.2, -398.85, -0.45], look: [-2.6, -399.0, -1.15], fov: 40, fog: [0x3a2a20, 6, 30] },
				{ pos: [2.6, -398.2, 2.4], look: [4.8, -398.4, -1.4], fov: 50, fog: [0x3a2a20, 8, 30] },
				{ pos: [6, 27, 6], look: [3.6, 26.6, -14], fov: 50 },
				{ pos: [1.72, -398.75, -0.65], look: [1.6, -399.03, -1.1], fov: 40, fog: [0x3a2a20, 6, 30] },
				{ pos: [1.1, 21.55, 12.6], look: [0.3, 21.9, 4.6], fov: 45 },
				{ pos: [1.0, -398.25, 2.9], look: [0.25, -397.95, 0.4], fov: 48, fog: [0x3a2a20, 8, 30] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the bathhouse
	r67: (k) => {
		k.fog(0xd89878, 90, 520);
		k.sky(0x24346e, 0xf4a878, { offset: -0.05 });
		k.light({ sky: 0xffd8c0, ground: 0x3a3050, hemi: 1.35, sunColor: 0xffb888, sunPos: [60, 40, 80], sunIntensity: 2.0, shadowSize: 70, sunTarget: [0, 10, -40] });
		const r = rng(67);
		// Two plateaus and a gorge between.
		k.box(400, 30, 120, 0x6a5a48, { y: -15, z: 50 });
		k.box(400, 30, 200, 0x6a5a48, { y: -15, z: -130 });
		k.box(400, 0.4, 120, 0x5a7a40, { y: 0, z: 50 });
		k.box(400, 0.4, 200, 0x5a7a40, { y: 0, z: -130 });
		k.box(400, 1, 30, 0x3a5a3a, { y: -18, z: -20 });
		// The bridge, with lamps.
		const red = 0xb8382a;
		k.box(3.2, 0.3, 24, red, { y: 0.35, z: -20 });
		[-1.5, 1.5].forEach((x) => {
			k.box(0.12, 0.12, 24, red, { x, y: 1.3, z: -20 });
			for (let i = 0; i < 9; i++) k.box(0.15, 1, 0.15, red, { x, y: 0.9, z: -8.5 - i * 2.9 });
			for (let i = 0; i < 4; i++) {
				const z = -10 - i * 7;
				k.box(0.2, 2.4, 0.2, 0x2a1a14, { x: x * 1.15, y: 1.5, z });
				k.box(0.4, 0.5, 0.4, 0xffd8a0, { x: x * 1.15, y: 2.9, z, emissive: 0xffa040, glow: 1.2 });
				k.glow(0xffb060, 1.6, { x: x * 1.15, y: 2.9, z });
			}
		});
		for (let i = 0; i < 4; i++) k.point(0xffb060, 6, 10, { x: 0, y: 3, z: -10 - i * 7 });
		for (let i = 0; i < 12; i++) k.box(0.5, 0.5, 0.2, 0xffffff, { x: (r() - 0.5) * 20, y: -17.4, z: -20 + (r() - 0.5) * 12 });
		// The bathhouse.
		const bh = k.group({ x: 0, z: -66 });
		const roof = 0x3a6a5a;
		const wall = 0xc04a30;
		const win = k.mat(0xffd890, { emissive: 0xffa040, glow: 1 });
		k.box(46, 6, 26, 0x5a4a40, { y: 3, parent: bh });
		const tier = (w, h, d, y, rb, rt) => {
			k.box(w, h, d, wall, { y: y + h / 2, parent: bh });
			for (let row = 0; row < Math.floor(h / 3); row++) for (let i = 0; i < w / 3 - 1; i++) k.box(1.4, 1.2, 0.1, win, { x: -w / 2 + 2.5 + i * 3, y: y + 1.8 + row * 3, z: d / 2 + 0.06, parent: bh, shadow: false });
			k.cyl(rt, rb, 3, roof, { y: y + h + 1.5, ry: PI / 4, seg: 4, s: [1, 1, d / w + 0.08], parent: bh });
			for (let i = 0; i < w / 2; i++) k.glow(0xffb060, 0.8, { x: -w / 2 + 1 + i * 2, y: y + h - 0.2, z: d / 2 + 1.4, parent: bh });
		};
		tier(40, 10, 22, 6, 32, 20);
		tier(30, 8, 16, 19, 24, 14);
		tier(20, 7, 12, 30, 16, 9);
		k.box(8, 6, 8, wall, { y: 43, parent: bh });
		k.cone(7.5, 6, roof, { y: 49, ry: PI / 4, seg: 4, parent: bh });
		k.cyl(0.15, 0.3, 4, 0xd8b040, { y: 54, parent: bh, metal: 0.8 });
		k.box(6, 6, 1, 0x2a1410, { y: 3, z: 13, parent: bh });
		k.box(8, 1, 1.4, red, { y: 6.5, z: 13.2, parent: bh });
		k.cyl(1.6, 2.2, 46, 0x8a6a5a, { x: 30, y: 23, z: 4, seg: 10, parent: bh });
		const smoke = [0, 1, 2, 3, 4].map((i) => k.sphere(2 + i * 0.6, 0xc8b8c0, { x: 30, y: 47 + i * 3, z: 4, opacity: 0.4, parent: bh, shadow: false }));
		k.tick((t) => smoke.forEach((s, i) => {
			const p = (t * 0.1 + i / 5) % 1;
			s.position.set(30 + p * 10, 47 + p * 16, 4);
			s.scale.setScalar(0.6 + p);
		}));
		k.point(0xffa050, 30, 60, { x: 0, y: 14, z: -40 });
		trees(k, 40, [-120, 120, -200, -90], { color: 0x2a4a3a, h: 14, seed: 4 });
		trees(k, 30, [-120, 120, 20, 100], { color: 0x2a4a3a, h: 10, seed: 5, avoid: (x, z) => Math.abs(x) < 20 && z < 60 });
		// The white dragon, flying.
		const path = new k.THREE.CatmullRomCurve3([[-40, 44, -52], [-28, 51, -40], [-16, 45, -32], [-4, 52, -25], [6, 47, -17], [14, 50, -9]].map((p) => new k.THREE.Vector3(...p)));
		const dragon = k.group({ from: 4, until: 4 });
		const pearl = 0xeef2ec;
		const mane = 0x5ac8a0;
		k.mesh(new k.THREE.TubeGeometry(path, 90, 1.1, 8), k.mat(pearl, { rough: 0.5 }), { parent: dragon });
		for (let i = 1; i < 40; i++) {
			const p = path.getPointAt(i / 40);
			const tn = path.getTangentAt(i / 40);
			orient(k, k.cone(0.45, 1.6, mane, { x: p.x, y: p.y + 1.0, z: p.z, seg: 4, parent: dragon }), new k.THREE.Vector3(-tn.x * 0.6, 1, -tn.z * 0.6));
		}
		[0.3, 0.75].forEach((t) => {
			const p = path.getPointAt(t);
			[-1, 1].forEach((s) => k.cyl(0.18, 0.12, 1.6, pearl, { x: p.x, y: p.y - 1.2, z: p.z + s * 0.8, rx: s * 0.5, parent: dragon }));
		});
		const tip = path.getPointAt(1);
		const tan = path.getTangentAt(1);
		const head = k.group({ x: tip.x, y: tip.y, z: tip.z, s: 1.3, parent: dragon });
		orient(k, head, tan);
		k.box(1.6, 1.8, 1.7, pearl, { y: 0.6, parent: head });
		k.box(1.2, 1.6, 1.0, pearl, { y: 2.0, z: -0.2, parent: head });
		k.box(1.1, 1.4, 0.3, 0x8a2a2a, { y: 2.0, z: -0.75, parent: head });
		[-1, 1].forEach((s) => {
			k.cone(0.14, 1.8, 0xd8c8a0, { x: s * 0.5, y: 0.5, z: 1.2, rx: 2.4, rz: s * 0.3, parent: head });
			k.sphere(0.18, 0x2a8a6a, { x: s * 0.82, y: 1.0, z: 0.45, emissive: 0x104a30, parent: head });
			k.cyl(0.04, 0.02, 2.6, pearl, { x: s * 0.9, y: 2.4, z: -0.3, rz: s * 0.9, parent: head });
		});
		for (let i = 0; i < 6; i++) k.cone(0.35, 1.6, mane, { x: (i % 2 - 0.5) * 0.6, y: -0.4 + i * 0.3, z: 1.1, rx: 2.0, seg: 4, parent: head });
		k.cone(1.1, 3.5, pearl, { x: -42, y: 43, z: -54, rz: 1.3, ry: 0.6, parent: dragon });
		// The masked spirit on the bridge.
		const nf = k.group({ x: 0.9, y: 0.5, z: -17, ry: -0.15, from: 5 });
		k.capsule(0.55, 2.0, 0x101012, { y: 1.55, s: [1, 1, 0.75], parent: nf, opacity: 0.88 });
		k.sphere(0.4, 0xf4f2ec, { y: 2.55, z: 0.32, s: [0.8, 1.05, 0.35], parent: nf });
		[-0.12, 0.12].forEach((x) => {
			k.sphere(0.06, 0x111111, { x, y: 2.62, z: 0.45, s: [1, 0.6, 0.4], parent: nf });
			k.box(0.04, 0.14, 0.02, 0x8a4a9a, { x, y: 2.8, z: 0.44, parent: nf });
			k.box(0.04, 0.14, 0.02, 0x8a4a9a, { x, y: 2.44, z: 0.45, parent: nf });
		});
		k.box(0.14, 0.03, 0.02, 0x3a3a3a, { y: 2.32, z: 0.44, parent: nf });
		// Vignette: soot sprites hauling coal.
		const boil = k.group({ x: 300, y: -400, z: 0 });
		k.box(20, 0.2, 20, 0x6a4a30, { y: -0.1, parent: boil });
		k.box(20, 6, 0.3, 0x4a3426, { y: 3, z: -1.2, parent: boil });
		[[-1.2, 0.6], [0.2, 0.25], [1.4, 0.5]].forEach(([x, rr]) => k.cyl(rr, rr, 0.02, 0x0a0806, { x, y: 0.5, z: -1.04, rx: PI / 2, seg: 16, parent: boil }));
		for (let i = 0; i < 30; i++) k.ico(0.08 + r() * 0.12, 0x1a1a1e, { x: -2.6 + r() * 1.4, y: r() * 0.3, z: -0.6 + r() * 0.8, ry: r() * 6, rough: 0.6, parent: boil });
		const star = [0xff8aa0, 0xffe060, 0x80d0ff, 0xa0f080, 0xffffff];
		for (let i = 0; i < 10; i++) k.ico(0.035, star[i % 5], { x: (r() - 0.5) * 2.4, y: 0.035, z: 0.3 + r() * 0.8, detail: 0, parent: boil, emissive: star[i % 5], glow: 0.3 });
		const sprites = [];
		for (let i = 0; i < 9; i++) {
			const g = k.group({ x: -1.4 + (i % 5) * 0.6 + (r() - 0.5) * 0.2, y: 0, z: -0.2 + Math.floor(i / 5) * 0.55 + r() * 0.2, ry: (r() - 0.5) * 0.8, parent: boil });
			k.ico(0.11, 0x0a0a0c, { y: 0.12, detail: 1, parent: g });
			for (let j = 0; j < 14; j++) {
				const d = new k.THREE.Vector3(r() - 0.5, r() - 0.3, r() - 0.5).normalize();
				orient(k, k.cone(0.02, 0.08, 0x0a0a0c, { x: d.x * 0.1, y: 0.12 + d.y * 0.1, z: d.z * 0.1, seg: 3, parent: g }), d);
			}
			[-0.04, 0.04].forEach((x) => {
				k.sphere(0.03, 0xffffff, { x, y: 0.15, z: 0.095, parent: g });
				k.sphere(0.013, 0x000000, { x, y: 0.15, z: 0.12, parent: g });
				k.cyl(0.005, 0.005, 0.12, 0x0a0a0c, { x, y: 0.24, z: 0, rz: x * 6, parent: g });
			});
			[-0.04, 0.04].forEach((x) => k.cyl(0.005, 0.005, 0.06, 0x0a0a0c, { x, y: 0.02, parent: g }));
			if (i % 3 !== 2) k.ico(0.1, 0x2a2a30, { y: 0.4, ry: i, parent: g });
			sprites.push(g);
		}
		k.tick((t) => sprites.forEach((s, i) => (s.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.05)));
		k.point(0xffa040, 10, 10, { x: 302, y: -398.5, z: 2 });
		k.point(0xffe0c0, 4, 10, { x: 299, y: -398, z: 2.5 });
		// Vignette: a food stall, and two diners who have become pigs.
		const st = k.group({ x: 0, y: -400, z: 0 });
		k.box(20, 0.2, 20, 0x5a4a3a, { y: -0.1, parent: st });
		k.box(6, 1.0, 1.2, 0x8a5a30, { y: 0.5, z: -1, parent: st });
		k.box(6.2, 0.08, 1.4, 0xb07a40, { y: 1.04, z: -1, parent: st });
		k.box(6, 3, 0.2, 0x6a3a22, { y: 2.5, z: -2.6, parent: st });
		k.box(7, 0.2, 3.2, 0x3a2a20, { y: 3.5, z: -1.4, rx: -0.15, parent: st });
		const food = [0xc8803a, 0xe8c070, 0xa8402a, 0xf0e0c0, 0x8a5a2a, 0xd86a3a];
		for (let i = 0; i < 16; i++) {
			const x = -2.6 + (i % 8) * 0.72;
			const z = -1.25 + Math.floor(i / 8) * 0.5;
			k.cyl(0.24, 0.2, 0.04, 0xf4f0e8, { x, y: 1.1, z, parent: st });
			for (let j = 0; j < 4; j++) k.sphere(0.08, food[(i + j) % 6], { x: x + (j % 2 - 0.5) * 0.12, y: 1.17 + Math.floor(j / 2) * 0.08, z: z + (j % 2 ? 0.05 : -0.05), parent: st });
		}
		for (let i = 0; i < 5; i++) {
			k.cyl(0.25, 0.25, 0.5, 0xd8382a, { x: -2.6 + i * 1.3, y: 3.0, z: -0.2, parent: st, emissive: 0xc02010, glow: 0.8 });
			k.glow(0xff8040, 1.5, { x: -2.6 + i * 1.3, y: 3.0, z: 0.1, parent: st });
		}
		k.point(0xffa060, 16, 14, { x: 0, y: -397, z: 1.5 });
		const pig = (x, shirt, ry) => {
			const g = k.group({ x, y: 0, z: 0.2, ry, parent: st });
			k.cyl(0.25, 0.25, 0.6, 0x4a3a2a, { y: 0.3, parent: g });
			k.sphere(0.5, 0xf0a8a8, { y: 1.1, s: [1, 1.1, 1], parent: g });
			k.sphere(0.52, shirt, { y: 1.0, s: [1.02, 0.7, 1.02], parent: g });
			const h = k.group({ y: 1.6, z: -0.3, rx: 0.4, parent: g });
			k.sphere(0.34, 0xf0a8a8, { parent: h });
			k.cyl(0.13, 0.15, 0.18, 0xe89098, { z: -0.36, rx: PI / 2, parent: h });
			[-1, 1].forEach((s) => {
				k.cone(0.1, 0.22, 0xe89098, { x: s * 0.2, y: 0.3, z: 0.05, rz: -s * 0.3, parent: h });
				k.sphere(0.035, 0x111111, { x: s * 0.12, y: 0.1, z: -0.3, parent: h });
				k.capsule(0.1, 0.35, 0xf0a8a8, { x: s * 0.42, y: 1.25, z: -0.35, rx: -1.2, parent: g });
			});
			return g;
		};
		pig(-0.7, 0x8ab0d8, 0);
		pig(0.9, 0xe8d8b8, -0.1);
		// Vignette: the train across the shallow sea.
		const sea = k.group({ y: 400 });
		k.sky(0x3a8ae0, 0xd8eef8, { r: 280, y: 400, tag: "tsky", from: 1, until: 1 });
		const wv = k.water(560, 0x6ab8d8, { y: 400, amp: 0.04, seg: 30 });
		wv.material.roughness = 0.15;
		k.box(500, 0.08, 0.1, 0x5a5a5a, { y: 0.05, z: -0.7, parent: sea, metal: 0.6 });
		k.box(500, 0.08, 0.1, 0x5a5a5a, { y: 0.05, z: 0.7, parent: sea, metal: 0.6 });
		for (let i = 0; i < 40; i++) {
			const x = -120 + i * 12;
			k.cyl(0.12, 0.15, 7, 0x5a4a3a, { x, y: 3.5, z: -2.4, parent: sea });
			k.box(0.15, 0.15, 1.6, 0x5a4a3a, { x, y: 6.6, z: -2.4, parent: sea });
		}
		const train = k.group({ x: 4, y: 0, z: 0, parent: sea });
		k.box(11, 1.6, 2.6, 0x8a2a2a, { y: 1.2, parent: train });
		k.box(11, 1.2, 2.6, 0xe8dcc0, { y: 2.6, parent: train });
		k.box(11.2, 0.3, 2.8, 0x5a5a60, { y: 3.35, parent: train });
		for (let i = 0; i < 8; i++) k.box(0.9, 0.8, 0.05, 0x3a4a6a, { x: -4.4 + i * 1.25, y: 2.6, z: 1.31, parent: train, emissive: 0x2a3a5a, glow: 0.4 });
		k.box(0.6, 0.8, 0.05, 0xfff0c0, { x: 5.52, y: 2.6, z: 0, ry: PI / 2, parent: train, emissive: 0xc0a060 });
		k.tick((t) => (train.position.x = -20 + ((t * 2) % 40)));
		for (let i = 0; i < 26; i++) k.sphere(10 + r() * 14, 0xffffff, { x: (r() - 0.5) * 400, y: 50 + r() * 50, z: -150 - r() * 100, s: [1.8, 0.6, 1], parent: sea, emissive: 0x606870 });
		for (let i = 0; i < 4; i++) {
			const x = -80 + i * 55;
			k.box(5, 4, 5, 0xe8e0d0, { x, y: 1.5, z: -80 - i * 10, parent: sea });
			k.cone(4, 2.5, 0x5a6a7a, { x, y: 4.6, z: -80 - i * 10, ry: PI / 4, seg: 4, parent: sea });
		}
		// Vignette: little stone shrines among the roots beside a forest track.
		const fr = k.group({ x: -300, y: -400, z: 0 });
		k.ground(80, 0x4a6a34, { parent: fr, bump: 0.5, seg: 30 });
		k.box(2.6, 0.06, 40, 0x8a7a5a, { x: 2.2, y: 0.18, z: -10, ry: 0.15, parent: fr, rough: 1 });
		const sr = rng(167);
		for (let i = 0; i < 26; i++) {
			const x = (sr() - 0.5) * 30;
			const z = -2 - sr() * 22;
			if (Math.abs(x - 2.2 + z * 0.15) < 2.5) continue;
			const h = 12 + sr() * 6;
			k.cyl(0.3 + sr() * 0.3, 0.5 + sr() * 0.4, h, 0x4a3a2c, { x, y: h / 2 - 0.3, z, seg: 7, parent: fr });
			k.ico(2.5 + sr() * 1.5, [0x2a5a2a, 0x3a6a30][i % 2], { x, y: h, z, s: [1.3, 0.7, 1.3], parent: fr });
		}
		const big = k.group({ x: -1.6, y: 0, z: -2.6, parent: fr });
		k.cyl(0.9, 1.3, 8, 0x5a4a38, { y: 3.8, seg: 8, parent: big, rough: 1 });
		[0, 1.3, 2.5, 3.8, 5.0].forEach((a) => k.cyl(0.1, 0.32, 1.8, 0x5a4a38, { x: Math.cos(a) * 1.5, y: 0.2, z: Math.sin(a) * 1.5, rz: Math.cos(a) * 1.25, rx: -Math.sin(a) * 1.25, parent: big }));
		const stone = 0x8a8a7e;
		const hokora = (x, z, s, ry) => {
			const g = k.group({ x, y: 0, z, s, ry, parent: fr });
			k.box(0.5, 0.12, 0.45, stone, { y: 0.06, parent: g, rough: 1 });
			k.box(0.36, 0.34, 0.32, stone, { y: 0.29, parent: g, rough: 1 });
			k.box(0.16, 0.2, 0.02, 0x2a2a24, { y: 0.26, z: 0.161, parent: g });
			k.cone(0.36, 0.22, stone, { y: 0.57, ry: PI / 4, seg: 4, parent: g, rough: 1 });
			k.cone(0.3, 0.12, 0x6a8a3a, { y: 0.62, ry: PI / 4, seg: 4, parent: g });
		};
		hokora(-0.4, -1.4, 1, 0.3);
		hokora(0.25, -1.1, 0.8, -0.2);
		hokora(-0.9, -0.6, 0.65, 0.6);
		hokora(0.4, -0.4, 0.55, -0.4);
		k.box(0.6, 0.02, 0.4, 0xc8b898, { x: -0.1, y: 0.3, z: -0.2, parent: fr });
		for (let i = 0; i < 20; i++) k.ico(0.08 + sr() * 0.1, 0x7a7a70, { x: (sr() - 0.5) * 4, y: 0.25, z: -2 + sr() * 3, parent: fr });
		k.point(0xfff0c0, 14, 20, { x: -298, y: -396, z: 3 });
		k.point(0xb0e0a0, 5, 20, { x: -303, y: -398, z: 0 });
		return {
			shots: [
				// 1: little stone shrines among roots.
				{ pos: [-299.2, -399.0, 1.3], look: [-300.3, -399.7, -1.0], fov: 46, fog: [0x8aa078, 10, 50] },
				// 2: a train crossing a shallow sea.
				{ pos: [16, 404, 22], look: [0, 402, -10], fov: 50, fog: [0xd8eef8, 60, 300], hide: ["sky"] },
				// 3: soot sprites hauling coal.
				{ pos: [300.35, -399.62, 1.05], look: [299.9, -399.78, -0.1], fov: 42, fog: [0x2a1a10, 6, 25], exposure: 1.2 },
				// 4: parents turned to pigs at a food stall.
				{ pos: [2.8, -397.5, -2.1], look: [0.1, -398.5, 0.0], fov: 50, fog: [0x2a1a14, 10, 40] },
				// 5: the white dragon over the bathhouse.
				{ pos: [17, 49, 3], look: [-2, 48, -26], fov: 55 },
				// 6: the masked spirit on the bridge.
				{ pos: [2.2, 2.4, -10.5], look: [0.9, 2.4, -17], fov: 48 },
			],
		};
	},
};
