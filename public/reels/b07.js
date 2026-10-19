// Batch 07: r78–r87. Each reel builds one diorama and returns six shots, cryptic first and obvious last.
import { PI, rng, trees, city } from "../kit.js";

/** A ball of fire: hot icosahedra, a glow and a light. */
function fireball(k, s, o = {}) {
	const g = k.group(o);
	const r = rng(o.seed ?? 1);
	for (let i = 0; i < 8; i++) {
		k.ico(s * (0.45 + r() * 0.5), [0xff7a18, 0xffb030, 0xffe070][i % 3], { x: (r() - 0.5) * s * 1.8, y: (r() - 0.3) * s * 1.4, z: (r() - 0.5) * s * 1.8, emissive: 0xff5a10, glow: 1.4, parent: g, shadow: false, ry: r() * 6 });
	}
	k.glow(0xff9030, s * 6, { parent: g });
	if (o.light !== false) k.point(0xff8030, 12 * s, 40 * s, { parent: g, decay: 1 });
	return g;
}

/** A man in a black suit, white shirt, black tie and sunglasses. */
function agent(k, o) {
	const g = k.person({ shades: true, ...o, colors: { shirt: 0x141416, legs: 0x141416, shoes: 0x050505, ...o.colors } });
	k.box(0.16, 0.5, 0.02, 0xf4f4f4, { y: 1.33, z: 0.145, parent: g });
	k.box(0.06, 0.44, 0.03, 0x050505, { y: 1.3, z: 0.155, parent: g });
	return g;
}

/** A low-poly jet fighter, nose towards -z. */
function jet(k, color, o) {
	const g = k.group(o);
	k.cyl(0.55, 0.7, 8, color, { rx: PI / 2, parent: g, seg: 8 });
	k.cone(0.55, 3, color, { rx: -PI / 2, z: -5.5, parent: g, seg: 8 });
	k.sphere(0.5, 0x223548, { y: 0.45, z: -3, s: [0.9, 0.8, 2.2], parent: g, rough: 0.2, metal: 0.4 });
	k.cyl(5, 5, 0.18, color, { seg: 3, s: [1, 1, 0.9], z: 0.8, ry: PI, parent: g });
	k.cyl(2.2, 2.2, 0.15, color, { seg: 3, s: [1, 1, 0.8], z: 3.6, ry: PI, parent: g });
	[-1, 1].forEach((s) => {
		k.box(0.12, 1.8, 1.6, color, { x: s * 0.7, y: 1.0, z: 3, rz: s * 0.35, parent: g });
		k.glow(0xffa040, 1.3, { x: s * 0.3, z: 4.3, parent: g });
	});
	return g;
}

export const REELS = {
	// ----------------------------------------------------------------------------------------------- the mothership
	r78: (k) => {
		k.fog(0xa89088, 150, 900);
		k.sky(0x3a3a56, 0xe8a880, { offset: -0.05 });
		k.light({ sky: 0xffe2cc, ground: 0x7a7476, hemi: 1.5, sunColor: 0xffd0a0, sunIntensity: 2.2, sunPos: [60, 50, 120], shadowSize: 45 });
		k.ground(1600, 0x5e7e4a, { bump: 0.05, seg: 30 });
		// The White House, facing +z.
		const wh = k.group({ x: 0, z: 0 });
		const white = 0xf4f1e8;
		const trim = 0xe2ded4;
		k.box(26, 9, 11, white, { y: 4.5, parent: wh });
		k.box(27, 0.9, 12, trim, { y: 9.45, parent: wh });
		k.box(24, 1.4, 9, 0xb8b8b6, { y: 10.6, parent: wh });
		[-1, 1].forEach((s) => {
			k.box(16, 5, 8, white, { x: s * 21, y: 2.5, parent: wh });
			k.box(16.4, 0.5, 8.4, trim, { x: s * 21, y: 5.25, parent: wh });
			for (let i = 0; i < 5; i++) k.box(1, 1.6, 0.1, 0x2c3444, { x: s * (15 + i * 2.6), y: 2.6, z: 4.05, parent: wh });
		});
		for (const y of [2.6, 6.6]) for (let x = -11; x <= 11; x += 2.4) if (Math.abs(x) > 5.6) k.box(1, 1.8, 0.1, 0x2c3444, { x, y, z: 5.55, parent: wh });
		k.cyl(5, 5, 0.6, trim, { y: 0.3, z: 5.5, seg: 24, parent: wh });
		k.cyl(5, 5, 1, trim, { y: 9.3, z: 5.5, seg: 24, parent: wh });
		k.box(4, 7, 0.1, 0x3a4050, { y: 4.4, z: 5.56, parent: wh });
		for (let i = 0; i <= 6; i++) {
			const a = (i / 6) * PI;
			k.cyl(0.3, 0.36, 8.4, white, { x: Math.cos(a) * 4.5, y: 4.8, z: 5.5 + Math.sin(a) * 4.5, parent: wh });
		}
		k.cyl(0.07, 0.07, 5, 0xdddddd, { y: 13.8, parent: wh });
		k.box(2.2, 1.3, 0.05, 0xb22234, { x: 1.1, y: 15.6, parent: wh });
		k.box(0.9, 0.7, 0.06, 0x2a3a7a, { x: 0.45, y: 15.9, parent: wh });
		// The lawn, the fountain and trees.
		k.box(70, 0.1, 60, 0x6fa052, { y: 0.05, z: 34 });
		k.cyl(4, 4, 0.5, 0xd8d4c8, { y: 0.25, z: 40, seg: 20 });
		k.cyl(3.5, 3.5, 0.52, 0x6aa0c8, { y: 0.27, z: 40, seg: 20 });
		k.cyl(0.4, 0.2, 3, 0xe8f4ff, { y: 1.5, z: 40, opacity: 0.7, emissive: 0x6080a0, glow: 0.5 });
		trees(k, 40, [-70, 70, -40, 70], { color: 0x335a2c, h: 9, avoid: (x, z) => (Math.abs(x) < 34 && z > -10 && z < 66) || (Math.abs(x) < 32 && z < 10) });
		// The skyline and the monument.
		city(k, 70, [-400, 400, -520, -110], { h: 30, colors: [0x8a8a90, 0xa49c90, 0x7a7c84], seed: 4 });
		k.box(6, 56, 6, 0xeae4d8, { x: -70, y: 28, z: -130 });
		k.cone(4.24, 5, 0xeae4d8, { x: -70, y: 58.5, z: -130, seg: 4, ry: PI / 4 });
		// The ship, fifteen miles wide, parked over the city.
		const ship = k.group({ x: 0, y: 105, z: -10, from: 1 });
		const hull = { parent: ship, seg: 48, shadow: false, rough: 0.8, emissive: 0x1c1c26 };
		k.cyl(150, 230, 12, 0x55565e, { y: 6, ...hull });
		k.cyl(230, 210, 6, 0x45464e, { y: -3, ...hull });
		k.cyl(90, 150, 14, 0x60616a, { y: 19, ...hull });
		k.cyl(198, 198, 0.5, 0x2c2d34, { y: -6.1, ...hull });
		for (let i = 0; i < 6; i++) k.torus(40 + i * 28, 1.6, 0x24252c, { y: -6.4, rx: PI / 2, ...hull, seg: 64 });
		for (let i = 0; i < 16; i++) {
			const a = (i / 16) * PI * 2;
			k.box(6, 1.5, 60, 0x34353c, { x: Math.cos(a) * 120, y: -6.5, z: Math.sin(a) * 120, ry: -a + PI / 2, parent: ship, shadow: false, emissive: 0x141418 });
			if (i % 2) k.glow(0xffa860, 7, { x: Math.cos(a) * 80, y: -8, z: Math.sin(a) * 80, parent: ship, fog: true });
		}
		for (let i = 0; i < 40; i++) {
			const a = (i / 40) * PI * 2;
			k.glow(0xffb070, 9, { x: Math.cos(a) * 214, y: -4, z: Math.sin(a) * 214, parent: ship, fog: true });
		}
		k.cyl(20, 24, 6, 0x1c1d22, { y: -8, ...hull, seg: 24 });
		// The weapon charging, then firing.
		const charge = k.group({ x: 0, y: 94, z: -10, from: 4 });
		k.cyl(16, 16, 0.6, 0x9ae0ff, { emissive: 0x6ac8ff, glow: 2, parent: charge, seg: 32, shadow: false });
		k.glow(0x8ad8ff, 60, { parent: charge, y: -2 });
		k.point(0x8ad8ff, 40, 160, { parent: charge, y: -6, decay: 1 });
		const beam = k.group({ from: 5 });
		k.cyl(3.2, 3.2, 84, 0xe8fbff, { y: 52, z: -2, emissive: 0xa0e8ff, glow: 2.5, parent: beam, shadow: false, seg: 16 });
		k.cyl(5, 5, 84, 0x9ae0ff, { y: 52, z: -2, opacity: 0.3, emissive: 0x6ac8ff, parent: beam, shadow: false, seg: 16 });
		for (let i = 0; i < 8; i++) k.glow(0xa0e8ff, 14, { y: 14 + i * 10, z: -2, parent: beam });
		fireball(k, 7, { y: 12, z: 1, parent: beam, seed: 3 });
		fireball(k, 4, { x: 9, y: 10, z: 3, parent: beam, seed: 4, light: false });
		fireball(k, 4, { x: -8, y: 10.5, z: 2, parent: beam, seed: 5, light: false });
		// A rooftop welcome party, staring up.
		const roof = k.group({ x: 120, y: 0, z: 120, from: 1 });
		k.box(30, 40, 30, 0x8a8076, { y: 20, parent: roof });
		k.box(30.4, 1.2, 0.5, 0x6a625a, { y: 40.6, z: 15, parent: roof });
		k.box(0.5, 1.2, 30.4, 0x6a625a, { x: -15, y: 40.6, parent: roof });
		k.box(3, 3, 3, 0x7a7068, { x: 8, y: 41.5, z: -8, parent: roof });
		const fans = [0xd84a3a, 0xf2c230, 0x3a8ad8, 0xffffff, 0x8ad84a, 0xe070c0];
		for (let i = 0; i < 9; i++) {
			const x = -6 + (i % 5) * 2.4 + (i > 4 ? 1.2 : 0);
			const z = 6 - Math.floor(i / 5) * 2.4;
			const p = k.person({ x, y: 40, z, ry: PI + 0.6 + (i % 3) * 0.2, pose: i % 3 === 0 ? "raise" : "stand", colors: { shirt: fans[i % 6], legs: 0x2a3a5a, hair: [0x3a2618, 0xd8b060, 0x111111][i % 3] }, parent: roof });
			p.userData.limbs.head.rotation.x = -0.5;
			if (i % 2) {
				k.cyl(0.04, 0.04, 2.4, 0x8a6a40, { x: x + 0.4, y: 42, z: z - 0.2, parent: roof });
				k.box(1.8, 1.1, 0.05, fans[(i + 3) % 6], { x: x + 0.4, y: 43.4, z: z - 0.2, rx: -0.3, ry: 0.6, parent: roof });
			}
		}
		k.point(0xffd8b0, 30, 30, { x: 126, y: 46, z: 132, from: 1 });
		// The jets going in.
		const jets = k.group({ x: 50, y: 78, z: 280, from: 2 });
		jet(k, 0x8a929c, { x: 0, y: 0, z: 0, rz: 0.15, parent: jets });
		jet(k, 0x8a929c, { x: -14, y: 3, z: 12, rz: 0.1, parent: jets });
		jet(k, 0x8a929c, { x: 14, y: -2, z: 14, rz: 0.2, parent: jets });
		k.point(0xfff0e0, 40, 80, { x: 50, y: 90, z: 310, from: 2 });
		k.tick((t) => (jets.position.y = 78 + Math.sin(t * 0.8) * 0.6));
		// The fire wall rolling in the clouds.
		const storm = k.group({ x: -700, y: 300, z: 0 });
		const r = rng(9);
		for (let i = 0; i < 40; i++) {
			const x = (r() - 0.5) * 70, y = (r() - 0.5) * 30, z = -20 - r() * 40;
			const hot = r() > 0.55;
			k.ico(5 + r() * 7, hot ? 0xc8542a : 0x4a3634, { x, y, z, detail: 1, parent: storm, ry: r() * 6, s: [1.4, 1, 1], emissive: hot ? 0xa83a10 : 0x1a0a06, glow: 1 });
			k.glow(r() > 0.5 ? 0xff6a20 : 0xffb040, 14 + r() * 18, { x: x * 0.95, y: y - 2, z: z + 9, parent: storm, opacity: 0.9 });
		}
		k.point(0xff7a30, 60, 120, { x: -700, y: 300, z: 10, decay: 1 });
		return {
			shots: [
				{ pos: [-700, 300, 18], look: [-700, 302, -30], fov: 50, fog: [0x4a2a20, 10, 110] },
				{ pos: [127, 41.4, 134], look: [114, 50, 112], fov: 60 },
				{ pos: [54, 82, 312], look: [30, 90, 160], fov: 50 },
				{ pos: [-26, 2, -42], look: [-66, 40, -130], fov: 55 },
				{ pos: [0, 3, 90], look: [0, 40, -10], fov: 55 },
				{ pos: [26, 6, 70], look: [0, 30, 0], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the suits
	r79: (k) => {
		k.fog(0xc8d8e8, 80, 500);
		k.sky(0x4a8ad8, 0xe0ecf6);
		k.light({ sky: 0xf0f6ff, ground: 0x6a7060, hemi: 1.3, sunPos: [40, 60, 50], sunIntensity: 2.4, shadowSize: 45 });
		k.ground(800, 0x6a9a4a, { bump: 0.05, seg: 30 });
		// The plaza and the fountain pool.
		k.cyl(26, 26, 0.3, 0xc8c4bc, { y: 0.15, seg: 40 });
		k.cyl(20, 20, 0.6, 0xd8d4cc, { y: 0.3, seg: 40 });
		k.cyl(19.4, 19.4, 0.62, 0x5a90b8, { y: 0.32, seg: 40, rough: 0.2, metal: 0.2 });
		for (let i = 0; i < 24; i++) {
			const a = (i / 24) * PI * 2;
			k.cyl(0.15, 0.05, 2.5, 0xeef6ff, { x: Math.cos(a) * 16, y: 1.8, z: Math.sin(a) * 16, opacity: 0.6, emissive: 0x6080a0, glow: 0.4, shadow: false });
		}
		// The steel globe.
		const globe = k.group({ y: 16, rz: 0.35 });
		const land = k.canvas(512, 256, (g, w, h) => {
			g.clearRect(0, 0, w, h);
			g.fillStyle = "#c8ccd0";
			const blob = (pts) => {
				g.beginPath();
				pts.forEach(([x, y], i) => (i ? g.lineTo(x * w, y * h) : g.moveTo(x * w, y * h)));
				g.closePath();
				g.fill();
			};
			blob([[0.12, 0.2], [0.3, 0.15], [0.33, 0.3], [0.26, 0.45], [0.22, 0.5], [0.15, 0.35]]);
			blob([[0.25, 0.52], [0.33, 0.55], [0.3, 0.8], [0.26, 0.7]]);
			blob([[0.46, 0.18], [0.6, 0.15], [0.6, 0.3], [0.52, 0.33], [0.47, 0.3]]);
			blob([[0.47, 0.35], [0.58, 0.36], [0.56, 0.7], [0.5, 0.62]]);
			blob([[0.6, 0.15], [0.85, 0.15], [0.88, 0.35], [0.75, 0.45], [0.62, 0.35]]);
			blob([[0.8, 0.62], [0.9, 0.62], [0.9, 0.75], [0.8, 0.72]]);
		});
		k.sphere(12, new k.THREE.MeshStandardMaterial({ map: land, transparent: true, alphaTest: 0.5, side: k.THREE.DoubleSide, metalness: 0.7, roughness: 0.35, flatShading: true }), { parent: globe, seg: 32, rings: 20 });
		const steel = { metal: 0.8, rough: 0.35, parent: globe, seg: 40, rseg: 4 };
		for (let i = 0; i < 12; i++) k.torus(12, 0.1, 0xb8bcc4, { ry: (i * PI) / 12, ...steel });
		for (let i = -4; i <= 4; i++) {
			const lat = (i / 5) * (PI / 2);
			k.torus(12 * Math.cos(lat), 0.1, 0xb8bcc4, { y: 12 * Math.sin(lat), rx: PI / 2, ...steel });
		}
		k.torus(13.2, 0.18, 0xb8bcc4, { rx: PI / 2 + 0.3, ry: 0.4, ...steel });
		k.cone(2.4, 6, 0x9a9ea6, { y: 3.4, rx: PI, metal: 0.7, rough: 0.4, seg: 8 });
		[0, 1, 2].forEach((i) => {
			const a = (i / 3) * PI * 2;
			k.cyl(0.4, 0.8, 5.5, 0x9a9ea6, { x: Math.cos(a) * 1.8, y: 2.5, z: Math.sin(a) * 1.8, rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3, metal: 0.7, rough: 0.4 });
		});
		// The pavilion towers with saucers on top, and the ring of the tent.
		const towers = k.group({ x: -55, z: -60, from: 3 });
		[[0, 0, 30, 6], [9, 5, 44, 5], [-7, 9, 60, 7]].forEach(([x, z, h, r]) => {
			k.cyl(1, 1.3, h, 0xd8d0c0, { x, y: h / 2, z, parent: towers });
			k.cyl(1.6, 1.6, h * 0.95, 0xd8d0c0, { x: x + 1.6, y: h * 0.475, z, parent: towers, seg: 6, s: [0.4, 1, 0.4] });
			k.cyl(r, r * 0.8, 1.6, 0xe8e2d4, { x, y: h + 0.8, z, parent: towers, seg: 24 });
			k.cyl(r * 0.7, r, 1, 0xe8e2d4, { x, y: h + 2.1, z, parent: towers, seg: 24 });
			k.cyl(r * 1.01, r * 1.01, 0.4, 0x3a5a7a, { x, y: h + 1.4, z, parent: towers, seg: 24 });
		});
		const tent = k.group({ x: -20, z: -78, from: 3 });
		for (let i = 0; i < 16; i++) {
			const a = (i / 16) * PI * 2;
			k.cyl(0.6, 0.7, 30, 0xe0dcd0, { x: Math.cos(a) * 20, y: 15, z: Math.sin(a) * 14, parent: tent });
		}
		k.torus(20, 0.8, 0xe0dcd0, { y: 30, rx: PI / 2, s: [1, 0.7, 1], parent: tent });
		trees(k, 50, [-140, 140, -160, 100], { color: 0x3a6a30, h: 10, avoid: (x, z) => Math.hypot(x, z) < 34 || (x < 0 && x > -90 && z < -30 && z > -110) || (z > 20 && Math.abs(x - 10) < 30) });
		// The two agents by the globe.
		const k1 = agent(k, { x: -2.2, y: 0.3, z: 24, ry: 0.1, colors: { skin: 0xd8b090, hair: 0x9a9a9a }, from: 5 });
		const j1 = agent(k, { x: 0.6, y: 0.3, z: 24.4, ry: -0.1, colors: { skin: 0x6a4630, hair: 0x111111 }, from: 5 });
		j1.userData.limbs.armR.rotation.x = -1.4;
		k.cyl(0.05, 0.05, 0.5, 0xd8dce4, { x: 0.94, y: 1.3, z: 25.4, rx: PI / 2 - 0.4, metal: 0.9, rough: 0.2, from: 5 });
		void k1;
		// The black sedan and the suits beside it.
		const car = k.group({ x: 160, y: 0, z: 150, ry: 0, from: 2 });
		const paint = { metal: 0.6, rough: 0.25 };
		k.box(2.1, 0.8, 5.4, 0x08080a, { y: 0.7, parent: car, ...paint });
		k.box(1.9, 0.6, 2.6, 0x08080a, { y: 1.4, z: -0.2, parent: car, ...paint });
		k.box(1.92, 0.42, 2.0, 0x1a2430, { y: 1.42, z: -0.2, parent: car, rough: 0.1, metal: 0.5 });
		k.box(2.14, 0.12, 5.44, 0xc8ccd0, { y: 0.45, parent: car, metal: 0.9, rough: 0.2 });
		[-1, 1].forEach((x) => [-1.7, 1.7].forEach((z) => k.cyl(0.38, 0.38, 0.3, 0x111111, { x: x * 0.98, y: 0.38, z, rz: PI / 2, parent: car })));
		[-0.65, 0.65].forEach((x) => k.glow(0xfff8e0, 0.5, { x, y: 0.75, z: 2.72, parent: car }));
		agent(k, { x: 162.6, y: 0, z: 151, ry: 0.1, colors: { skin: 0x6a4630, hair: 0x111111 }, from: 2 });
		agent(k, { x: 164.2, y: 0, z: 151.6, ry: -0.1, colors: { skin: 0xd8b090, hair: 0x9a9a9a }, from: 2 });
		city(k, 30, [190, 260, 120, 260], { h: 40, colors: [0x8a7a6a, 0x9a8a78, 0x6a6a72], seed: 8 });
		// The flash: a silver wand, a pair of shades and a burst of light.
		const flash = k.group({ x: 300, y: 0, z: 0, from: 4 });
		k.box(30, 0.2, 30, 0x1a1c22, { parent: flash });
		const kay = agent(k, { x: 0, y: 0.1, z: -1.2, colors: { skin: 0xd8b090, hair: 0x9a9a9a }, parent: flash });
		const arm = kay.userData.limbs.armR;
		arm.rotation.set(-2.1, 0, 0.25);
		k.box(0.13, 0.13, 0.13, 0xd8b090, { y: -0.74, parent: arm });
		k.cyl(0.035, 0.035, 0.5, 0xdde2ea, { y: -0.95, parent: arm, metal: 0.5, rough: 0.15, seg: 10, emissive: 0x404448 });
		k.glow(0xff3020, 0.3, { y: -1.2, parent: arm });
		k.glow(0xfff4f0, 0.9, { y: -1.25, parent: arm });
		k.point(0xffffff, 2, 4, { y: -1.3, z: 0.2, parent: arm });
		k.spot(0xfff4e8, 12, { x: 302, y: 5, z: 4, target: [300.3, 1.8, -1], angle: 0.4, from: 4 });
		// The tiny silver gun in a palm.
		const cricket = k.group({ x: -300, y: 0, z: 0, from: 1 });
		k.box(30, 0.2, 30, 0xeceae4, { parent: cricket });
		for (let i = 0; i < 5; i++) k.cyl(1.2, 1.2, 0.1, 0xd8d4cc, { x: -4 + i * 2.6, y: 3, z: -3, rx: PI / 2, parent: cricket, seg: 24 });
		k.box(1.4, 0.3, 1.1, 0xa87858, { y: 0.7, parent: cricket });
		[-0.45, -0.15, 0.15, 0.45].forEach((x) => k.box(0.22, 0.2, 0.7, 0xa87858, { x, y: 0.75, z: 0.85, rx: -0.6, parent: cricket }));
		k.box(0.25, 0.2, 0.6, 0xa87858, { x: -0.8, y: 0.8, z: 0.2, ry: 0.6, parent: cricket });
		k.box(0.6, 1.2, 0.7, 0x121214, { y: 0.35, z: -0.9, parent: cricket });
		const gun = k.group({ y: 1.05, z: 0.1, ry: 0.5, s: 1.7, parent: cricket });
		const chrome = { metal: 0.35, rough: 0.2, parent: gun, emissive: 0x3a3e44 };
		k.box(0.18, 0.2, 0.42, 0xdfe4ea, { ...chrome });
		k.cyl(0.07, 0.07, 0.35, 0xdfe4ea, { z: -0.36, rx: PI / 2, ...chrome, seg: 10 });
		k.cyl(0.11, 0.11, 0.08, 0xc8ced6, { z: -0.12, rx: PI / 2, ...chrome, seg: 12 });
		k.box(0.12, 0.25, 0.1, 0xb8bec6, { y: -0.18, z: 0.12, rx: 0.3, ...chrome });
		k.sphere(0.06, 0xc8ced6, { y: 0.12, z: 0.1, ...chrome });
		k.spot(0xffffff, 30, { x: -299, y: 6, z: 3, target: [-300, 1, 0], angle: 0.35, from: 1 });
		// A pug on a newsstand counter.
		const pug = k.group({ x: 0, y: 0, z: 400 });
		k.box(30, 0.2, 30, 0x5a4a3a, { parent: pug });
		k.box(4, 1, 2, 0x6a4a2a, { y: 0.6, parent: pug });
		for (let i = 0; i < 6; i++) k.box(0.9, 1.1, 0.04, [0xe8e0d0, 0xd84a3a, 0xf2c230][i % 3], { x: -1.6 + i * 0.6, y: 1.9, z: -0.8, rx: -0.2, parent: pug });
		const fawn = 0xd8b07a;
		k.sphere(0.45, fawn, { y: 1.55, z: 0.1, s: [1, 0.9, 1.3], parent: pug });
		const head = k.group({ y: 2.05, z: 0.45, parent: pug });
		k.sphere(0.36, fawn, { parent: head, s: [1.1, 1, 0.95] });
		k.sphere(0.18, 0x1a1412, { y: -0.1, z: 0.26, s: [1.2, 0.8, 0.7], parent: head });
		k.sphere(0.05, 0x050505, { y: 0.0, z: 0.4, parent: head });
		[-1, 1].forEach((s) => {
			k.sphere(0.08, 0x111111, { x: s * 0.15, y: 0.08, z: 0.28, parent: head, rough: 0.1 });
			k.sphere(0.025, 0xffffff, { x: s * 0.15 + 0.02, y: 0.11, z: 0.35, parent: head });
			k.box(0.16, 0.2, 0.04, 0x1a1412, { x: s * 0.3, y: 0.28, z: 0, rz: s * -0.7, parent: head });
			k.box(0.14, 0.4, 0.14, fawn, { x: s * 0.2, y: 1.25, z: 0.45, parent: pug });
		});
		k.torus(0.12, 0.05, fawn, { y: 1.85, z: -0.4, parent: pug });
		k.point(0xfff0d8, 8, 8, { x: 1, y: 3.5, z: 403 });
		return {
			shots: [
				{ pos: [0.5, 2.15, 401.9], look: [0, 2.0, 400.4], fov: 40, fog: [0x3a3028, 2, 30] },
				{ pos: [-299.2, 2.9, 1.7], look: [-300, 0.95, 0.1], fov: 40, fog: [0xe8e6e0, 4, 40] },
				{ pos: [165.4, 1.0, 145.6], look: [162.4, 1.0, 152], fov: 50 },
				{ pos: [30, 6, 60], look: [-20, 22, -40], fov: 50 },
				{ pos: [299.4, 2.0, 1.4], look: [300.1, 2.05, -1.0], fov: 45, fog: [0x101218, 2, 30] },
				{ pos: [0.4, 1.9, 29.5], look: [-0.4, 7, 0], fov: 60 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the desert planet
	r80: (k) => {
		k.fog(0xe8c8a0, 90, 700);
		k.sky(0x8aa0b8, 0xf2d4ac, { offset: -0.03 });
		k.light({ sky: 0xfff0d8, ground: 0x9a6a3a, hemi: 1.3, sunColor: 0xffe0b0, sunIntensity: 2.6, sunPos: [-60, 40, 40], shadowSize: 60 });
		const dune = (x, z) => 4 * Math.sin(x * 0.03 + z * 0.012) + 2.5 * Math.sin(z * 0.05 - x * 0.02) + 1.5 * Math.sin(x * 0.08);
		k.ground(1200, 0xd8a868, { bump: 0, seg: 90, height: dune });
		const h = (x, z) => dune(x, z);
		// Rock outcrops.
		const r = rng(12);
		[[-120, -200, 30], [90, -260, 40], [200, -120, 25], [-220, -60, 20]].forEach(([x, z, s]) => {
			for (let i = 0; i < 5; i++) {
				const hh = s * (0.8 + r() * 1.4);
				const rad = s * (0.25 + r() * 0.25);
				k.cyl(rad * 0.7, rad, hh, [0x9a6440, 0x84553a][i % 2], { x: x + (r() - 0.5) * s, y: hh / 2 - 2, z: z + (r() - 0.5) * s, ry: r() * 3, rough: 1, seg: 7 });
			}
		});
		// The thumper.
		const th = k.group({ x: 0, y: h(0, 0), z: 0 });
		[0, 1, 2].forEach((i) => {
			const a = (i / 3) * PI * 2;
			k.cyl(0.04, 0.05, 1.3, 0x7a6e60, { x: Math.cos(a) * 0.3, y: 0.55, z: Math.sin(a) * 0.3, rx: Math.sin(a) * 0.45, rz: -Math.cos(a) * 0.45, parent: th, metal: 0.6 });
		});
		k.cyl(0.12, 0.12, 1.4, 0x8a8078, { y: 0.9, parent: th, metal: 0.3, rough: 0.5 });
		const piston = k.cyl(0.18, 0.18, 0.5, 0x6a5e54, { y: 1.5, parent: th, metal: 0.3, rough: 0.5 });
		k.cyl(0.2, 0.2, 0.06, 0xa08060, { y: 1.75, parent: th, metal: 0.5 });
		k.tick((t) => (piston.position.y = 1.4 + Math.abs(Math.sin(t * 3)) * 0.25));
		const ripples = [0, 1, 2].map(() => k.torus(1, 0.03, 0xe8c090, { y: 0.15, rx: PI / 2, parent: th, shadow: false, opacity: 0.8 }));
		k.tick((t) => ripples.forEach((rp, i) => {
			const p = (t * 0.5 + i / 3) % 1;
			rp.scale.setScalar(0.5 + p * 3);
			rp.material.opacity = 0.8 * (1 - p);
		}));
		// A figure in a stillsuit on a crest, with spice in the air.
		const crest = [30, -40];
		const fig = (x, z, ry, from) => {
			const p = k.person({ x, y: h(x, z), z, ry, colors: { shirt: 0x5a5048, legs: 0x4a4038, skin: 0xc8a080, hair: 0x2a1a10 }, coat: 0x8a7a68, from });
			k.cone(0.3, 0.5, 0x8a7a68, { y: 1.95, z: -0.05, parent: p, seg: 8 });
			k.box(0.3, 0.12, 0.08, 0x2a2420, { y: 1.68, z: 0.18, parent: p });
			return p;
		};
		fig(crest[0], crest[1], -0.8, 1);
		fig(crest[0] - 3, crest[1] - 2, -0.6, 1);
		k.particles(1500, 0xff8a2a, { x: 30, z: -40, y: -2, box: [40, 12, 40], speed: 0.3, size: 0.07, drift: 0.6, opacity: 0.9, from: 1 });
		// An ornithopter on the sand.
		const thopter = (o) => {
			const g = k.group(o);
			const hull = 0xa89c88;
			k.capsule(1.2, 6, hull, { rx: PI / 2, parent: g, s: [1, 0.85, 1] });
			k.sphere(1.25, 0x6a8090, { z: -3.6, y: 0.1, s: [1, 0.9, 1.3], parent: g, rough: 0.1, metal: 0.3 });
			k.cone(0.7, 3, hull, { rx: PI / 2, z: 6, parent: g, seg: 6 });
			k.box(4.6, 0.4, 1.6, 0x8a806e, { y: 1.1, z: -0.6, parent: g });
			const wings = [];
			[-1, 1].forEach((s) => [-1.6, 0.6].forEach((z) => {
				const w = k.group({ x: s * 2.2, y: 1.35, z, parent: g });
				k.box(9, 0.08, 1.3, 0xd8d0c0, { x: s * 4.6, parent: w, opacity: 0.85 });
				k.box(9, 0.14, 0.16, 0x6a6458, { x: s * 4.6, z: -0.6, parent: w });
				wings.push([w, s]);
			}));
			[-1, 1].forEach((s) => k.box(0.2, 1.4, 0.2, 0x5a5448, { x: s * 1.1, y: -1.2, z: -1, parent: g }));
			[-1, 1].forEach((s) => k.box(0.2, 1.4, 0.2, 0x5a5448, { x: s * 1.1, y: -1.2, z: 2, parent: g }));
			return { g, wings };
		};
		const parked = thopter({ x: -16, y: h(-16, -20) + 2.6, z: -20, ry: 0.7, from: 2 });
		parked.wings.forEach(([w, s]) => (w.rotation.z = s * 0.08));
		const fly = [thopter({ x: 0, y: 60, z: -150, ry: 0.2, from: 3 }), thopter({ x: 22, y: 66, z: -170, ry: 0.25, from: 3 }), thopter({ x: -20, y: 64, z: -175, ry: 0.15, from: 3 })];
		k.tick((t) => fly.forEach(({ g, wings }, i) => {
			wings.forEach(([w, s]) => (w.rotation.z = s * Math.sin(t * 22 + i) * 0.35));
			g.position.y = [60, 66, 64][i] + Math.sin(t * 1.3 + i) * 0.5;
		}));
		// The worm, rising out of the sand towards the camera.
		const worm = k.group({ x: 0, y: 0, z: -120, from: 4 });
		const skin = 0x9a7c60;
		let py = -10, pz = 0, lean = 0;
		for (let i = 0; i < 13; i++) {
			lean = Math.min(1.25, i * 0.13);
			const rr = 20 - i * 0.3;
			const cy = py + 2.6 * Math.cos(lean), cz = pz + 2.6 * Math.sin(lean);
			k.cyl(rr, rr + 0.4, 5.4, i % 2 ? skin : 0x8a6e54, { y: cy, z: cz, rx: lean, parent: worm, seg: 16, rough: 1 });
			k.torus(rr + 0.2, 0.55, 0x6a5038, { y: py, z: pz, rx: PI / 2 + lean, parent: worm, seg: 16 });
			py += 5.2 * Math.cos(lean);
			pz += 5.2 * Math.sin(lean);
		}
		const mouth = k.group({ y: py + 3 * Math.cos(lean), z: pz + 3 * Math.sin(lean), rx: lean, parent: worm });
		k.cyl(16.6, 16.8, 3.2, skin, { y: -1.6, parent: mouth, seg: 16, open: true, rough: 1 });
		k.torus(13.6, 3.2, 0x8a4430, { y: 0.4, rx: PI / 2, s: [1, 1, 0.4], parent: mouth, seg: 24 });
		k.cyl(12, 8, 3.4, 0x2a0c08, { y: -1.2, parent: mouth, seg: 24, open: true, side: 2 });
		k.cyl(16.6, 16.6, 0.3, 0x2a0c08, { y: -2.9, parent: mouth, seg: 24 });
		
		for (let ring = 0; ring < 3; ring++) {
			const rr = 15.5 - ring * 1.6;
			for (let i = 0; i < 28 - ring * 4; i++) {
				const a = (i / (28 - ring * 4)) * PI * 2;
				k.cone(0.5, 3.2, 0xf4ead4, { x: Math.cos(a) * rr, y: 1.2, z: Math.sin(a) * rr, rx: -Math.sin(a) * 1.0, rz: Math.cos(a) * 1.0, parent: mouth, seg: 4, emissive: 0x3a3020 });
			}
		}

		k.particles(1500, 0xe0b880, { x: 0, y: 0, z: -110, box: [90, 50, 40], speed: 6, size: 0.5, opacity: 0.6, drift: 3, from: 4 });
		for (let i = 0; i < 30; i++) k.ico(3 + (i % 5) * 1.5, 0xd8b484, { x: Math.cos(i * 2.4) * (20 + (i % 3) * 4), y: 1 + (i % 4) * 2, z: -120 + Math.sin(i * 2.4) * (16 + (i % 3) * 3), opacity: 0.7, from: 4, shadow: false, detail: 1, rough: 1 });
		fig(-2, -40, PI, 5);
		k.point(0xffe0b0, 60, 160, { x: 0, y: 40, z: -50, from: 4, decay: 1 });
		return {
			shots: [
				{ pos: [1.6, h(0, 0) + 1.6, 2.2], look: [0, h(0, 0) + 1.2, 0], fov: 40 },
				{ pos: [35, h(35, -33) + 2.2, -33], look: [28, h(28, -40) + 1.8, -42], fov: 45 },
				{ pos: [-3, h(-3, -34) + 5, -34], look: [-16, h(-16, -20) + 2, -20], fov: 50 },
				{ pos: [30, 62, -110], look: [0, 60, -170], fov: 50 },
				{ pos: [-90, h(-90, -40) + 5, -40], look: [0, 30, -110], fov: 50 },
				{ pos: [8, 24, -32], look: [0, 40, -95], fov: 60 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the shell
	r81: (k) => {
		k.fog(0xb4c0c4, 60, 520);
		k.sky(0x7a8a98, 0xdce2e2);
		k.light({ sky: 0xeef4f6, ground: 0x4a5a40, hemi: 1.6, sunColor: 0xf4f2ea, sunIntensity: 1.3, sunPos: [-40, 80, 40], shadowSize: 60 });
		const hills = (x, z) => Math.max(0, Math.abs(x) - 70) * 0.45 * (1 + 0.3 * Math.sin(z * 0.03)) + Math.max(0, -z - 170) * 0.4;
		k.ground(1200, 0x6a8650, { bump: 0.8, seg: 70, height: hills });
		// Clouds rolling over the ridges.
		const r = rng(31);
		for (let i = 0; i < 70; i++) {
			const side = i % 3;
			const x = side === 0 ? -150 - r() * 60 : side === 1 ? 150 + r() * 60 : (r() - 0.5) * 300;
			const z = side === 2 ? -230 - r() * 60 : -250 + r() * 300;
			k.ico(10 + r() * 14, 0xf4f6f6, { x, y: hills(x, z) + 6 + r() * 8, z, s: [1.8, 0.55, 1.3], detail: 1, emissive: 0x4a5258, glow: 0.8, rough: 1, shadow: false, opacity: 0.92 });
		}
		// The shell, hovering above the meadow.
		const shell = k.group({ x: 0, y: 0, z: -80, from: 3 });
		k.sphere(1, 0x2c2e30, { y: 52, s: [11, 38, 4.2], seg: 28, rings: 20, rough: 0.55, parent: shell, emissive: 0x0a0c0e });
		k.glow(0xffffff, 3, { y: 14.6, parent: shell });
		// The scissor lift under it.
		const lift = k.group({ x: 0, z: -80, from: 3 });
		k.box(3, 0.3, 3, 0x8a8a80, { y: 0.15, parent: lift });
		k.box(1.4, 13, 1.4, 0xd8c040, { y: 6.6, parent: lift });
		for (let i = 0; i < 6; i++) k.box(1.5, 0.12, 1.5, 0x3a3a30, { y: 1 + i * 2.2, parent: lift });
		k.box(3.2, 0.3, 3.2, 0x8a8a80, { y: 13.4, parent: lift });
		// The camp: tents, trucks, floodlights.
		const camp = k.group({ x: 45, z: 40 });
		for (let i = 0; i < 6; i++) {
			const x = (i % 3) * 12, z = Math.floor(i / 3) * 16;
			k.box(8, 2.6, 12, 0xe4e2d8, { x, y: 1.3, z, parent: camp });
			k.cyl(4.6, 4.6, 12, 0xd8d6cc, { x, y: 2.6, z, rx: PI / 2, rz: PI / 2, seg: 3, s: [0.45, 1, 1], parent: camp });
		}
		for (let i = 0; i < 4; i++) {
			const t = k.group({ x: -14 + i * 4.5, z: 30, ry: 0.2, parent: camp });
			k.box(2.4, 2, 5, 0x5a6248, { y: 1.5, parent: t });
			k.box(2.4, 1.6, 1.8, 0x4a5240, { y: 1.3, z: 3.4, parent: t });
			[-1, 1].forEach((x) => [-1.5, 1.5, 3.4].forEach((z) => k.cyl(0.45, 0.45, 0.3, 0x1a1a1a, { x: x * 1.2, y: 0.45, z, rz: PI / 2, parent: t })));
		}
		[[-8, -8], [40, -8], [-8, 28], [40, 28]].forEach(([x, z]) => {
			k.cyl(0.15, 0.2, 9, 0x6a6a6a, { x, y: 4.5, z, parent: camp });
			k.box(2.2, 1, 0.5, 0x3a3a3a, { x, y: 9, z, parent: camp });
			k.glow(0xfff8e0, 5, { x, y: 9, z: z - 0.4, parent: camp });
		});
		k.point(0xfff4e0, 20, 60, { x: 60, y: 12, z: 50 });
		k.cyl(3, 0.2, 1.2, 0xd8d8d0, { x: 75, y: 6, z: 20, rx: 0.8, seg: 16 });
		k.cyl(0.2, 0.2, 5, 0x8a8a8a, { x: 75, y: 2.5, z: 20 });
		// Soldiers by the camp.
		for (let i = 0; i < 6; i++) k.person({ x: 30 + i * 2.2, z: 26 + (i % 2) * 1.5, ry: -2.4, colors: { shirt: 0x5a6248, legs: 0x4a5240, skin: 0xd8b090, hair: 0x3a3020 }, hat: 0x4a5240 });
		// The approach: two orange suits in a dark passage towards a white light.
		const pass = k.group({ x: -400, y: 0, z: 0, from: 1 });
		k.box(8, 0.4, 60, 0x1a1a1c, { y: -0.2, parent: pass });
		[-1, 1].forEach((s) => k.box(1, 14, 60, 0x2a2a2c, { x: s * 4.5, y: 7, parent: pass, rough: 1 }));
		k.box(10, 1, 60, 0x1a1a1c, { y: 14, parent: pass });
		k.box(8, 13.6, 0.4, 0xffffff, { y: 7, z: -24, parent: pass, emissive: 0xffffff, glow: 1 });
		k.glow(0xffffff, 30, { y: 7, z: -22, parent: pass, opacity: 0.8 });
		k.point(0xf0f4ff, 40, 50, { y: 7, z: -20, parent: pass, decay: 1 });
		const suit = { shirt: 0xf07a20, legs: 0xf07a20, skin: 0xd8c8b0, hair: 0xf07a20, shoes: 0x3a3a3a };
		[-1.1, 1.1].forEach((x, i) => {
			const p = k.person({ x, z: -8 + i, ry: PI, colors: suit, sleeves: 0xf07a20, parent: pass });
			k.sphere(0.32, 0xe8eef0, { y: 1.78, parent: p, opacity: 0.4, rough: 0.1 });
			k.box(0.4, 0.5, 0.2, 0xe8e8e0, { y: 1.3, z: -0.22, parent: p });
		});
		// The chamber: the bright screen, the mist, the heptapod and an ink ring.
		const room = k.group({ x: 0, y: -400, z: 0, from: 0 });
		k.box(60, 0.4, 40, 0x141416, { y: -0.2, parent: room });
		k.box(60, 40, 0.4, 0xf2f4f2, { y: 10, z: -24, parent: room, emissive: 0xe8ecec, glow: 1 });
		[-1, 1].forEach((s) => k.box(0.4, 30, 40, 0x1a1a1c, { x: s * 22, y: 10, parent: room }));
		k.box(44, 0.4, 40, 0x1a1a1c, { y: 18, parent: room });
		for (let i = 0; i < 14; i++) k.glow(0xffffff, 10 + (i % 4) * 4, { x: -16 + (i % 7) * 5.4, y: 2 + Math.floor(i / 7) * 6, z: -14, parent: room, opacity: 0.5 });
		const hep = k.group({ x: 2, y: 0, z: -15, parent: room, from: 3 });
		const ink = 0x2a2826;
		k.sphere(3, ink, { y: 12, s: [1, 1.3, 0.9], parent: hep, seg: 10, rings: 8 });
		for (let i = 0; i < 7; i++) {
			const a = (i / 7) * PI * 2;
			const kx = Math.cos(a) * 4.5, kz = Math.sin(a) * 2.5;
			const knee = [kx, 13.5, kz];
			const foot = [Math.cos(a) * 6.5, 0, Math.sin(a) * 3.5];
			const seg = (p, q, rad) => {
				const v = new k.THREE.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
				const m = k.cyl(rad * 0.7, rad, v.length(), ink, { x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, z: (p[2] + q[2]) / 2, parent: hep, seg: 6 });
				m.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, 1, 0), v.normalize());
			};
			seg([0, 12, 0], knee, 0.7);
			seg(knee, foot, 0.5);
		}
		// One limb reaches to the glass and splays out like a hand.
		const palm = [-2, 5, -9.4];
		k.sphere(0.8, ink, { x: palm[0], y: palm[1], z: palm[2], s: [1, 1, 0.4], parent: hep });
		for (let i = 0; i < 7; i++) {
			const a = (i / 7) * PI * 2;
			k.cyl(0.12, 0.25, 2.4, ink, { x: palm[0] + Math.cos(a) * 1.4, y: palm[1] + Math.sin(a) * 1.4, z: palm[2], rz: a - PI / 2, parent: hep, seg: 5 });
		}
		const logo = k.canvas(512, 512, (g, w) => {
			g.clearRect(0, 0, w, w);
			const rr = rng(77);
			g.fillStyle = "rgba(18,16,14,0.9)";
			for (let i = 0; i < 900; i++) {
				const a = rr() * PI * 2;
				if (a > 4.9 && a < 5.3) continue;
				const rad = 170 + (rr() - 0.5) * 26 * (1 + Math.sin(a * 5) * 0.8);
				const size = 6 + rr() * 14 * (1 + Math.max(0, Math.sin(a * 3 + 1)));
				g.beginPath();
				g.arc(256 + Math.cos(a) * rad, 256 + Math.sin(a) * rad, size, 0, PI * 2);
				g.fill();
			}
			g.strokeStyle = "rgba(18,16,14,0.8)";
			g.lineWidth = 3;
			for (let i = 0; i < 18; i++) {
				const a = rr() * PI * 2;
				g.beginPath();
				g.moveTo(256 + Math.cos(a) * 185, 256 + Math.sin(a) * 185);
				g.quadraticCurveTo(256 + Math.cos(a + 0.1) * 225, 256 + Math.sin(a + 0.1) * 225, 256 + Math.cos(a + 0.2) * (215 + rr() * 30), 256 + Math.sin(a + 0.2) * (215 + rr() * 30));
				g.stroke();
			}
		});
		k.plane(9, 9, new k.THREE.MeshBasicMaterial({ map: logo, transparent: true, depthWrite: false }), { x: -4, y: 7, z: -9, parent: room, shadow: false });
		k.box(40, 20, 0.1, 0xe8f0f0, { y: 8, z: -9.1, opacity: 0.08, parent: room, shadow: false });
		for (let i = 0; i < 8; i++) k.glow(0xffffff, 7, { x: -10 + i * 3, y: 2 + (i % 3) * 4, z: -11.5, parent: room, opacity: 0.35 });
		// The two in orange, watching.
		[[-3, 2], [1, 3]].forEach(([x, z]) => k.person({ x, z, ry: PI, colors: suit, sleeves: 0xf07a20, parent: room, from: 3 }));
		k.point(0xffffff, 10, 40, { x: 0, y: -392, z: 6 });
		return {
			shots: [
				{ pos: [-5.2, -392.6, -3.6], look: [-4, -393, -9], fov: 40, fog: [0xd8dcdc, 4, 60] },
				{ pos: [-400.4, 1.8, 2], look: [-400, 2.4, -20], fov: 50 },
				{ pos: [90, 3, 110], look: [55, 3, 45], fov: 45 },
				{ pos: [6, 2, -64], look: [0, 22, -80], fov: 60 },
				{ pos: [1, -397.6, 10], look: [-1, -393, -12], fov: 55, fog: [0xd8dcdc, 30, 120] },
				{ pos: [16, 4, 52], look: [0, 40, -80], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the stones
	r82: (k) => {
		k.fog(0xd8a880, 60, 420);
		k.sky(0x5a7aa8, 0xf4c8a0, { offset: -0.1 });
		k.light({ sky: 0xffe0c8, ground: 0x8a7a70, hemi: 1.9, sunColor: 0xffd8a8, sunIntensity: 2.2, sunPos: [-40, 80, 60], shadowSize: 60 });
		// The canyon of towers, deep enough to swallow the street.
		const r = rng(41);
		const tones = [0xc8b4a0, 0xb8a494, 0xd8c4a8, 0xa89a8c, 0xd0b898];
		const lit = [0xffd890, 0x80e0ff, 0xff7aa0];
		for (let side = -1; side <= 1; side += 2) {
			for (let i = 0; i < 14; i++) {
				const w = 18 + r() * 12, d = 22 + r() * 10, top = 50 + r() * 70;
				const x = side * (22 + w / 2 + r() * 4), z = 100 - i * 30;
				k.box(w, top + 200, d, tones[i % 5], { x, y: (top - 200) / 2, z });
				for (let f = 0; f < 6; f++) k.box(w + 0.4, 0.8, d + 0.4, 0x5a5048, { x, y: top - 8 - f * 22, z });
				for (let f = 0; f < 3; f++) {
					const y = top - 14 - f * 30 - r() * 6;
					k.box(1.2, 0.8 + r(), 4 + r() * 4, lit[(i + f) % 3], { x: x - side * (w / 2 + 0.6), y, z: z + (r() - 0.5) * 10, emissive: lit[(i + f) % 3], glow: 1.2, shadow: false });
				}
				k.box(w * 0.5, 8, d * 0.5, tones[(i + 2) % 5], { x, y: top + 4, z });
			}
		}
		city(k, 50, [-260, 260, -600, -320], { h: 120, colors: tones, seed: 6 });
		// Lanes of flying traffic.
		const cars = [];
		const paint = [0xd84a3a, 0x3a6ad8, 0xe8e0d0, 0x2a2a30, 0x6ad8a0, 0xd8a03a, 0x8a4ad8];
		for (let i = 0; i < 46; i++) {
			const lane = i % 4;
			const g = k.group({ x: lane % 2 ? -8 : 8, y: 4 + lane * 9 + (i % 3) * 3, z: 0 });
			k.box(2, 0.9, 4.2, paint[i % 7], { y: 0, parent: g, metal: 0.4, rough: 0.4 });
			k.box(1.7, 0.6, 1.8, 0x2a3440, { y: 0.65, z: 0.2, parent: g, rough: 0.2 });
			[-0.7, 0.7].forEach((x) => k.glow(lane % 2 ? 0xfff2d0 : 0xff3020, 0.9, { x, z: lane % 2 ? -2.2 : 2.2, parent: g }));
			cars.push({ g, speed: (lane % 2 ? -1 : 1) * (10 + (i % 5) * 2), off: i * 23 });
		}
		k.tick((t) => cars.forEach((c) => (c.g.position.z = ((((c.off + t * c.speed) % 400) + 400) % 400) - 300)));
		// The yellow cab with an orange-haired passenger.
		const cab = k.group({ x: 0, y: 24, z: -20, from: 5 });
		const yellow = { metal: 0.3, rough: 0.35 };
		k.box(2.6, 1.1, 5.6, 0xf2c018, { parent: cab, ...yellow });
		k.box(2.62, 0.25, 5.62, 0x1a1a1a, { y: -0.45, parent: cab });
		k.capsule(1.1, 1.2, 0xf2c018, { y: 0.3, z: 2.6, rz: PI / 2, s: [0.7, 1.15, 1], parent: cab, ...yellow });
		k.box(2.3, 0.75, 2.8, 0x3a5060, { y: 0.9, z: -0.2, parent: cab, rough: 0.1, metal: 0.4, opacity: 0.55 });
		k.box(2.4, 0.12, 1.2, 0xf2c018, { y: 1.3, z: -1.2, parent: cab });
		for (let i = 0; i < 6; i++) k.box(0.3, 0.22, 0.02, i % 2 ? 0x111111 : 0xffffff, { x: -0.75 + i * 0.3, y: 0.15, z: -2.82, parent: cab });
		[-1, 1].forEach((s) => k.cyl(0.5, 0.6, 1, 0x3a3a3e, { x: s * 1.5, y: -0.3, z: -2, rx: PI / 2, parent: cab, metal: 0.5 }));
		[-1, 1].forEach((s) => k.glow(0xff7020, 1.6, { x: s * 1.5, y: -0.3, z: -2.6, parent: cab }));
		k.sphere(0.24, 0xf0c8a8, { x: 0.5, y: 1.05, z: -0.6, parent: cab });
		k.sphere(0.27, 0xff6a14, { x: 0.5, y: 1.15, z: -0.65, parent: cab, s: [1, 0.9, 1] });
		k.sphere(0.24, 0xd8a888, { x: -0.5, y: 1.05, z: 0.6, parent: cab });
		k.sphere(0.2, 0xe8c070, { x: -0.5, y: 1.2, z: 0.58, s: [1, 0.5, 1], parent: cab });
		k.point(0xfff0d0, 25, 30, { x: 4, y: 30, z: -12, from: 5 });
		k.tick((t) => {
			cab.position.y = 24 + Math.sin(t * 0.9) * 0.4;
			cab.rotation.z = Math.sin(t * 0.7) * 0.05;
		});
		// A ledge high on a tower, and the girl in white straps.
		const ledge = k.group({ x: -21, y: 60, z: -40, from: 4 });
		k.box(5, 0.5, 6, 0x8a7a6a, { x: 1.5, parent: ledge });
		k.box(1.2, 2.4, 0.8, 0x6a5a50, { x: 0, y: 1.4, z: -2.6, parent: ledge, emissive: 0x302820 });
		const skinTone = 0xf0d0b8;
		const lee = k.person({ x: 2.6, y: 0.25, z: 0, ry: PI / 2 - 0.3, colors: { shirt: skinTone, legs: skinTone, skin: skinTone, hair: 0xff6010, shoes: 0xd8d0c0 }, parent: ledge });
		const strap = (y, rz, w = 0.54) => k.box(w, 0.07, 0.31, 0xf4f2ea, { y, rz, parent: lee });
		[1.0, 1.12, 1.3, 1.45].forEach((y, i) => strap(y, i % 2 ? 0.35 : -0.35));
		[-0.13, 0.13].forEach((x) => [0.2, 0.4, 0.6, 0.8].forEach((y) => k.box(0.23, 0.06, 0.23, 0xf4f2ea, { x, y, parent: lee })));
		k.box(0.46, 0.14, 0.3, 0xff6010, { y: 1.87, z: 0.04, parent: lee });
		lee.userData.limbs.armL.rotation.z = -0.4;
		// The temple and the four stones.
		const temple = k.group({ x: -500, y: 0, z: 0, from: 0 });
		k.box(60, 0.4, 60, 0xc8a878, { y: -0.2, parent: temple });
		for (let i = 0; i < 8; i++) [-1, 1].forEach((s) => k.cyl(1.4, 1.6, 16, 0xc0a070, { x: s * 12, y: 8, z: -24 + i * 6, parent: temple, seg: 10, rough: 1 }));
		k.box(30, 1.5, 60, 0xa8885a, { y: 16.6, parent: temple });
		k.box(30, 20, 1, 0xb89868, { y: 10, z: -27, parent: temple });
		const glyph = k.canvas(512, 256, (g, w, h) => {
			g.fillStyle = "#c89a5a";
			g.fillRect(0, 0, w, h);
			for (let i = 0; i < 400; i++) {
				g.fillStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 40},30,0.25)`;
				g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
			}
			g.strokeStyle = "#4a2a10";
			g.lineWidth = 8;
			for (let q = 0; q < 4; q++) {
				const cx = 64 + q * 128;
				g.beginPath();
				g.moveTo(cx, 70);
				g.lineTo(cx - 38, 150);
				g.lineTo(cx + 38, 150);
				g.closePath();
				g.stroke();
				g.beginPath();
				g.arc(cx, 124, 12, 0, PI * 2);
				g.stroke();
			}
		});
		const stoneMat = k.mat(0xffffff, { map: glyph, rough: 1 });
		[[-5, -6], [5, -6], [-5, 4], [5, 4]].forEach(([x, z], i) => {
			k.cyl(0.9, 1.1, 1, 0x9a7a50, { x, y: 0.5, z, parent: temple, seg: 8 });
			k.cyl(0.5, 0.8, 2.6, stoneMat, { x, y: 2.3, z, ry: PI / 4 + (i % 2 ? PI : 0), seg: 4, parent: temple, flat: true });
			k.cyl(0.52, 0.52, 0.12, 0x6a4a2a, { x, y: 3.66, z, ry: PI / 4, seg: 4, parent: temple });
		});
		k.box(2.4, 1.6, 5, 0x8a6a3a, { y: 0.8, z: -1, parent: temple });
		const shaft = new k.THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.16, depthWrite: false, blending: k.THREE.AdditiveBlending });
		for (let i = 0; i < 3; i++) k.mesh(new k.THREE.CylinderGeometry(0.6, 2.4, 18, 8, 1, true), shaft, { x: -6 + i * 6, y: 8, z: -2, rz: 0.3, parent: temple, shadow: false });
		k.particles(400, 0xfff0c8, { x: -500, y: 0, box: [30, 16, 30], speed: 0.2, size: 0.05, opacity: 0.7, drift: 0.2 });
		k.point(0xffd8a0, 25, 40, { x: -503, y: 10, z: 8, decay: 1 });
		// The opera stage and the blue diva.
		const opera = k.group({ x: 500, y: 0, z: 0, from: 3 });
		k.box(40, 0.4, 40, 0x2a0a10, { y: -0.2, parent: opera });
		k.box(20, 1.6, 10, 0x6a1a1a, { y: 0.8, z: -4, parent: opera });
		k.box(24, 22, 0.6, 0x8a1418, { y: 11, z: -10, parent: opera, rough: 1 });
		for (let i = 0; i < 12; i++) k.box(0.3, 22, 0.8, 0x6a0c10, { x: -11 + i * 2, y: 11, z: -9.6, parent: opera });
		[-1, 1].forEach((s) => {
			k.cyl(0.8, 0.9, 16, 0xd8a83a, { x: s * 9, y: 8, z: -6, parent: opera, metal: 0.7, rough: 0.3, emissive: 0x3a2808 });
			k.torus(9, 0.6, 0xd8a83a, { y: 16, z: -6, parent: opera, arc: PI, metal: 0.7, rough: 0.3, emissive: 0x3a2808 });
		});
		const diva = k.group({ y: 1.6, z: -4, parent: opera });
		const blue = 0x4a7ad8;
		k.cyl(0.25, 1.1, 2.6, 0xc8d8f0, { y: 1.3, parent: diva, seg: 12, metal: 0.4, rough: 0.3, emissive: 0x2a3a5a });
		k.cyl(0.3, 0.25, 0.9, blue, { y: 3, parent: diva, seg: 10, emissive: 0x10204a });
		k.sphere(0.36, blue, { y: 3.75, s: [0.8, 1.35, 0.85], parent: diva, emissive: 0x10204a });
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * PI * 2;
			k.capsule(0.08, 1.4, blue, { x: Math.cos(a) * 0.3, y: 3.3, z: Math.sin(a) * 0.3 - 0.05, rx: -Math.sin(a) * 0.3, rz: Math.cos(a) * 0.3, parent: diva, emissive: 0x10204a });
		}
		[-1, 1].forEach((s) => k.capsule(0.07, 1, blue, { x: s * 0.55, y: 2.8, z: 0.2, rz: s * 1.0, rx: -0.4, parent: diva, emissive: 0x10204a }));
		k.spot(0xd8e8ff, 60, { x: 500, y: 18, z: 10, target: [500, 4, -4], angle: 0.25, distance: 50 });
		for (let i = 0; i < 30; i++) k.sphere(0.3, 0x1a1a24, { x: -12 + (i % 10) * 2.6, y: 0.9, z: 6 + Math.floor(i / 10) * 2.4, parent: opera });
		return {
			shots: [
				{ pos: [-503.6, 2.8, 5.6], look: [-505, 2.4, 4], fov: 40, fog: [0x2a1a10, 3, 40] },
				{ pos: [-496, 6, 20], look: [-500, 2, -2], fov: 50, fog: [0x3a2414, 10, 90] },
				{ pos: [4, 14, 60], look: [0, 18, -40], fov: 50 },
				{ pos: [500, 4.6, 6], look: [500, 4.4, -4], fov: 45, fog: [0x10060a, 10, 60] },
				{ pos: [-14.6, 61.6, -36.4], look: [-18.4, 61.3, -40], fov: 50 },
				{ pos: [7, 27, -6], look: [0, 24, -20], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the grid
	r83: (k) => {
		k.fog(0x02040c, 30, 260);
		k.sky(0x000208, 0x0a1830);
		k.light({ sky: 0x4a8aff, ground: 0x0a0a1a, hemi: 1.2, sun: false });
		const gridTex = k.canvas(128, 128, (g, w) => {
			g.fillStyle = "#020814";
			g.fillRect(0, 0, w, w);
			g.strokeStyle = "#1ac8ff";
			g.lineWidth = 3;
			g.strokeRect(0, 0, w, w);
		});
		gridTex.wrapS = gridTex.wrapT = k.THREE.RepeatWrapping;
		gridTex.repeat.set(160, 160);
		k.plane(800, 800, new k.THREE.MeshBasicMaterial({ map: gridTex }), { rx: -PI / 2, shadow: false });
		// Distant walls of light on the horizon.
		for (let i = 0; i < 12; i++) k.box(60, 30 + (i % 4) * 12, 2, 0x0a1a3a, { x: -330 + i * 60, y: 15, z: -340, emissive: 0x08204a, glow: 1, until: 2 });
		const neon = (c) => ({ emissive: c, glow: 1.6, shadow: false });
		// Light cycles and their walls.
		const cycle = (color, o) => {
			const g = k.group(o);
			k.capsule(0.55, 2.4, color, { rx: PI / 2, y: 0.7, s: [0.8, 1, 0.75], parent: g, emissive: color, glow: 0.25, metal: 0.3, rough: 0.3 });
			k.box(0.95, 0.5, 2.6, color, { y: 0.95, parent: g, ...neon(color) });
			k.box(0.9, 0.35, 1.2, 0x102030, { y: 1.25, z: -0.2, parent: g, rough: 0.1 });
			[-1.15, 1.15].forEach((z) => {
				k.cyl(0.62, 0.62, 0.7, 0x1a1e2a, { z, y: 0.62, rz: PI / 2, parent: g, seg: 16 });
				k.torus(0.62, 0.06, color, { z, y: 0.62, ry: PI / 2, parent: g, ...neon(color) });
			});
			return g;
		};
		const trail = (color, pts) => {
			for (let i = 0; i < pts.length - 1; i++) {
				const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
				const len = Math.hypot(x2 - x1, z2 - z1);
				k.box(0.12, 2, len, color, { x: (x1 + x2) / 2, y: 1, z: (z1 + z2) / 2, ry: Math.atan2(x2 - x1, z2 - z1), opacity: 0.8, emissive: color, glow: 0.8, shadow: false, from: 5 });
			}
		};
		const blueC = 0x30c8ff, yellowC = 0xffd030, redC = 0xff4020;
		const c1 = cycle(blueC, { x: 0, z: 0, s: 1.3, from: 5 });
		const c2 = cycle(yellowC, { x: 6, z: -6, s: 1.3, from: 5 });
		const c3 = cycle(redC, { x: -5, z: -14, ry: PI / 2, s: 1.3, from: 5 });
		void c1, c2, c3;
		trail(blueC, [[0, 1.8], [0, 30], [-14, 30], [-14, 90]]);
		trail(yellowC, [[6, -4.2], [6, 40], [24, 40], [24, 110]]);
		trail(redC, [[-6.8, -14], [-40, -14], [-40, 60]]);
		k.point(blueC, 8, 20, { x: 0, y: 2, z: 2, from: 5 });
		k.point(yellowC, 8, 20, { x: 6, y: 2, z: -4, from: 5 });
		// A recognizer, striding over the grid.
		const rec = k.group({ x: 20, y: 0, z: -50, ry: -0.4, from: 2 });
		const recC = 0xff5a20;
		const body = 0x2a1410;
		[-1, 1].forEach((s) => {
			k.box(4, 24, 5, body, { x: s * 9, y: 14, parent: rec });
			k.box(4.2, 0.4, 5.2, recC, { x: s * 9, y: 2.2, parent: rec, ...neon(recC) });
			k.box(0.3, 22, 0.3, recC, { x: s * 9 + s * 2.1, y: 14, z: 2.6, parent: rec, ...neon(recC) });
		});
		k.box(24, 5, 6, body, { y: 27, parent: rec });
		k.box(24.2, 0.4, 6.2, recC, { y: 24.6, parent: rec, ...neon(recC) });
		k.box(6, 7, 5, body, { y: 22, parent: rec });
		k.box(6.2, 0.4, 5.2, recC, { y: 18.6, parent: rec, ...neon(recC) });
		k.box(30, 0.6, 3, body, { y: 30, parent: rec });
		k.box(30.2, 0.2, 3.2, recC, { y: 30.4, parent: rec, ...neon(recC) });
		k.point(recC, 30, 60, { x: 20, y: 10, z: -40, from: 2 });
		// The master program: a red column with a face.
		const mcp = k.group({ x: 0, y: 0, z: -400, from: 3 });
		k.cyl(14, 16, 80, 0x3a0806, { y: 40, parent: mcp, seg: 24, emissive: 0x5a0a04, glow: 1 });
		for (let i = 0; i < 18; i++) k.cyl(14.3, 14.3, 0.6, 0xff3a10, { y: 4 + i * 4.4, parent: mcp, seg: 24, ...neon(0xff3a10), open: true });
		const mcpFace = k.group({ y: 48, z: 13, parent: mcp });
		[-1, 1].forEach((s) => k.box(5, 1.6, 2, 0x0a0000, { x: s * 4, y: 4, parent: mcpFace, rz: s * 0.15 }));
		k.box(2, 9, 2.2, 0x2a0402, { y: -1, parent: mcpFace });
		k.box(8, 1, 2, 0x0a0000, { y: -7, parent: mcpFace });
		k.box(10, 14, 0.5, 0xff5020, { y: 0, z: -0.4, parent: mcpFace, ...neon(0xc02000), opacity: 0.5 });
		k.glow(0xff3010, 120, { y: 40, z: 10, parent: mcp, opacity: 0.5, fog: false });
		k.point(0xff4020, 40, 100, { x: 0, y: 50, z: -360, from: 3 });
		k.tick((t) => (mcp.rotation.y = Math.sin(t * 0.3) * 0.2));
		// A program holding his disc up.
		const prog = k.person({ x: -60, y: 0, z: 0, ry: 0.3, pose: "raise", colors: { shirt: 0x2a3a52, legs: 0x2a3a52, skin: 0xb8d8f0, hair: 0x2a3a52, shoes: 0x1a2232 }, from: 4 });
		k.point(0x8ac8ff, 6, 10, { x: -57, y: 2.5, z: 3, from: 4 });
		const line = (w, h, d, x, y, z, parent = prog) => k.box(w, h, d, blueC, { x, y, z, parent, ...neon(blueC) });
		line(0.04, 0.7, 0.3, -0.24, 1.2, 0);
		line(0.04, 0.7, 0.3, 0.24, 1.2, 0);
		line(0.5, 0.04, 0.3, 0, 1.45, 0.005);
		line(0.22, 0.04, 0.22, -0.13, 0.5, 0);
		line(0.22, 0.04, 0.22, 0.13, 0.5, 0);
		line(0.52, 0.04, 0.3, 0, 0.9, 0);
		k.cyl(0.22, 0.22, 0.12, 0x0c1220, { y: 1.97, parent: prog });
		const disc = k.group({ y: -0.85, parent: prog.userData.limbs.armR });
		k.cyl(0.36, 0.36, 0.06, 0x0a0c14, { rx: PI / 2, parent: disc, seg: 24 });
		k.torus(0.32, 0.04, blueC, { parent: disc, ...neon(blueC), seg: 24 });
		k.torus(0.14, 0.03, blueC, { parent: disc, ...neon(blueC), seg: 20 });
		k.glow(blueC, 1.6, { parent: disc });
		k.point(blueC, 6, 8, { x: -59, y: 3, z: 1.5, from: 4 });
		// The identity disc, close up.
		const id = k.group({ x: 0, y: 400, z: 0 });
		k.cyl(1.5, 1.5, 0.2, 0x10141c, { rx: PI / 2 - 0.4, parent: id, seg: 40, metal: 0.4, rough: 0.3 });
		[1.38, 1.0, 0.55].forEach((rr, i) => k.torus(rr, 0.05 + (i === 0 ? 0.04 : 0), blueC, { rx: -0.4, z: 0.12, y: 0.04, parent: id, seg: 48, ...neon(blueC) }));
		k.glow(blueC, 5, { parent: id, opacity: 0.6 });
		k.point(blueC, 6, 8, { x: 0, y: 401, z: 2 });
		// The arcade where it all starts.
		const arcade = k.group({ x: 400, y: 0, z: 0, from: 1 });
		k.box(60, 0.3, 60, 0x2a1a24, { y: 0.05, parent: arcade });
		k.box(30, 8, 0.4, 0x1a1020, { y: 4, z: -4, parent: arcade });
		const screen = k.canvas(128, 96, (g, w, h) => {
			g.fillStyle = "#050818";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#1a5aa8";
			for (let i = 0; i < w; i += 12) {
				g.beginPath();
				g.moveTo(i, 0);
				g.lineTo(i, h);
				g.stroke();
			}
			for (let i = 0; i < h; i += 12) {
				g.beginPath();
				g.moveTo(0, i);
				g.lineTo(w, i);
				g.stroke();
			}
			g.lineWidth = 3;
			g.strokeStyle = "#ffd030";
			g.beginPath();
			g.moveTo(10, 80);
			g.lineTo(10, 30);
			g.lineTo(60, 30);
			g.lineTo(60, 60);
			g.stroke();
			g.strokeStyle = "#30c8ff";
			g.beginPath();
			g.moveTo(118, 10);
			g.lineTo(118, 70);
			g.lineTo(80, 70);
			g.lineTo(80, 40);
			g.stroke();
		});
		for (let i = 0; i < 5; i++) {
			const cab = k.group({ x: -6 + i * 3, z: -2.6, parent: arcade });
			const col = [0x1a3a8a, 0x8a1a2a, 0x1a3a8a, 0x2a1a6a, 0x1a3a8a][i];
			k.box(2, 4.6, 1.6, col, { y: 2.3, parent: cab });
			k.mesh(new k.THREE.PlaneGeometry(1.6, 1.2), new k.THREE.MeshBasicMaterial({ map: screen }), { y: 3.1, z: 0.84, parent: cab, shadow: false });
			k.box(2, 0.3, 0.8, 0x111111, { y: 2.1, z: 0.9, rx: 0.3, parent: cab });
			k.box(2, 0.5, 0.3, 0xffd030, { y: 4.4, z: 0.75, parent: cab, emissive: 0xc08010, glow: 1 });
			k.point(0x4a8aff, 3, 5, { y: 3, z: 1.6, parent: cab });
		}
		k.person({ x: 400.2, y: 0, z: 0.2, ry: PI + 0.2, colors: { shirt: 0x8a5a3a, legs: 0x3a4a6a, hair: 0x5a3a20 }, from: 1 });
		k.point(0xffa060, 6, 20, { x: 404, y: 6, z: 6, from: 1 });
		return {
			shots: [
				{ pos: [0.6, 401.2, 4.2], look: [0, 400, 0], fov: 40, fog: [0x000000, 1, 40] },
				{ pos: [403, 2.6, 6], look: [399.6, 2.6, -2], fov: 50, fog: [0x0a0610, 2, 40] },
				{ pos: [10, 2, -18], look: [19, 17, -50], fov: 55 },
				{ pos: [0, 40, -320], look: [0, 46, -400], fov: 45, fog: [0x0a0000, 60, 400] },
				{ pos: [-57.6, 1.6, 4], look: [-59.8, 2.2, 0], fov: 50 },
				{ pos: [-6, 3, -9], look: [2, 1, 0], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the cyborg
	r84: (k) => {
		k.fog(0x7a5a52, 50, 420);
		k.sky(0x3a3a5a, 0xe8946a, { offset: -0.05 });
		k.light({ sky: 0xffd8c0, ground: 0x4a4048, hemi: 1.4, sunColor: 0xffb080, sunIntensity: 2.0, sunPos: [-60, 30, 50], shadowSize: 40 });
		// Old Detroit: a wet street between brick blocks.
		k.box(400, 0.2, 400, 0x4a4446, { y: -0.1 });
		k.box(16, 0.04, 400, 0x2a2a2e, { y: 0.02, rough: 0.25, metal: 0.3 });
		for (let i = 0; i < 20; i++) k.box(0.25, 0.05, 3, 0xd8c060, { y: 0.03, z: 150 - i * 16 });
		const r = rng(51);
		const bricks = [0x7a4a3a, 0x6a4038, 0x8a5a44, 0x5a4a44];
		[-1, 1].forEach((s) => {
			for (let i = 0; i < 12; i++) {
				const h = 12 + r() * 24, w = 14 + r() * 6;
				const x = s * (8 + 3 + w / 2), z = 120 - i * 22;
				k.box(w, h, 20, bricks[i % 4], { x, y: h / 2, z });
				for (let f = 0; f < h / 4 - 1; f++) for (let j = 0; j < 4; j++) if (r() > 0.3) k.box(0.1, 1.6, 2, r() > 0.7 ? 0xffc870 : 0x1a1a22, { x: x - s * (w / 2 + 0.05), y: 3 + f * 4, z: z - 7 + j * 4.6, emissive: r() > 0.7 ? 0x6a4a20 : 0, shadow: false });
			}
		});
		k.particles(1200, 0xb8c0d0, { box: [40, 30, 80], z: 20, speed: 20, size: 0.05, opacity: 0.4 });
		// The skyline and the corporate tower.
		city(k, 50, [-300, 300, -460, -260], { h: 60, colors: [0x4a4a58, 0x5a5462, 0x3a3a48], windows: 0xffc070, seed: 9 });
		const tower = k.group({ x: 20, z: -330 });
		[[40, 120], [32, 150], [22, 175], [12, 195]].forEach(([w, h]) => k.box(w, h, w, 0x2a2a34, { y: h / 2, parent: tower, metal: 0.4, rough: 0.4 }));
		for (let i = 0; i < 16; i++) k.box(40.4, 0.6, 40.4, 0x8ab0d8, { y: 8 + i * 7, parent: tower, emissive: 0x3a5a8a, glow: 1, shadow: false });
		k.glow(0xff3020, 6, { y: 198, parent: tower, fog: true });
		// The police car.
		const car = k.group({ x: -3.5, y: 0, z: 10, ry: 0.35 });
		k.box(2.1, 0.8, 5, 0x141418, { y: 0.7, parent: car, metal: 0.4, rough: 0.35 });
		k.box(1.9, 0.6, 2.4, 0x141418, { y: 1.4, z: -0.2, parent: car, metal: 0.4, rough: 0.35 });
		k.box(1.92, 0.42, 1.8, 0x2a3440, { y: 1.42, z: -0.2, parent: car, rough: 0.1 });
		[-1, 1].forEach((s) => k.box(0.04, 0.5, 2.2, 0xf0f0f0, { x: s * 1.06, y: 0.75, z: 0, parent: car }));
		k.box(1.4, 0.2, 0.4, 0x1a1a1a, { y: 1.8, z: -0.2, parent: car });
		k.box(0.6, 0.18, 0.36, 0xff2020, { x: -0.38, y: 1.88, z: -0.2, parent: car, emissive: 0xff1010, glow: 1.5 });
		k.box(0.6, 0.18, 0.36, 0x2040ff, { x: 0.38, y: 1.88, z: -0.2, parent: car, emissive: 0x1030ff, glow: 1.5 });
		[-1, 1].forEach((x) => [-1.6, 1.6].forEach((z) => k.cyl(0.38, 0.38, 0.3, 0x111111, { x: x * 0.98, y: 0.38, z, rz: PI / 2, parent: car })));
		[-0.65, 0.65].forEach((x) => k.glow(0xfff4e0, 0.7, { x, y: 0.75, z: 2.52, parent: car }));
		const red = k.point(0xff2020, 6, 14, { x: -0.4, y: 2.4, z: -0.2, parent: car });
		const blue = k.point(0x3050ff, 6, 14, { x: 0.4, y: 2.4, z: -0.2, parent: car });
		k.tick((t) => {
			const on = Math.sin(t * 8) > 0;
			red.intensity = on ? 10 : 2;
			blue.intensity = on ? 2 : 10;
		});
		k.point(0xffd0a0, 18, 30, { x: 3, y: 6, z: 18 });
		[-30, 0, 30].forEach((z) => [-1, 1].forEach((s) => {
			k.cyl(0.1, 0.12, 7, 0x2a2a2e, { x: s * 8.5, y: 3.5, z });
			k.glow(0xffc070, 2, { x: s * 7.8, y: 7, z });
			k.point(0xffb060, 10, 18, { x: s * 7.8, y: 6.5, z });
		}));
		// The officer of the future.
		const steel = { metal: 0.35, rough: 0.3, emissive: 0x2a3440 };
		const robo = (o) => {
			const g = k.group(o);
			const plate = 0xa8b4c4, dark = 0x22242a;
			[-1, 1].forEach((s) => {
				k.box(0.36, 0.9, 0.42, plate, { x: s * 0.22, y: 0.5, parent: g, ...steel });
				k.box(0.4, 0.2, 0.6, dark, { x: s * 0.22, y: 0.1, z: 0.08, parent: g });
				k.sphere(0.2, dark, { x: s * 0.22, y: 1.0, parent: g });
				k.box(0.4, 0.75, 0.46, plate, { x: s * 0.22, y: 1.42, parent: g, ...steel });
			});
			k.box(0.7, 0.3, 0.42, dark, { y: 1.9, parent: g });
			k.box(0.86, 0.85, 0.52, plate, { y: 2.45, parent: g, ...steel });
			k.box(0.6, 0.4, 0.06, 0x8a96a8, { y: 2.6, z: 0.28, parent: g, ...steel });
			[-1, 1].forEach((s) => {
				k.sphere(0.27, plate, { x: s * 0.55, y: 2.75, s: [1, 0.8, 1], parent: g, ...steel });
				k.box(0.26, 0.6, 0.3, plate, { x: s * 0.62, y: 2.3, parent: g, ...steel });
				k.box(0.24, 0.55, 0.28, plate, { x: s * 0.62, y: 1.75, z: 0.12, rx: -0.4, parent: g, ...steel });
				k.box(0.18, 0.18, 0.2, dark, { x: s * 0.62, y: 1.48, z: 0.28, parent: g });
			});
			k.cyl(0.14, 0.16, 0.2, dark, { y: 2.95, parent: g });
			const head = k.group({ y: 3.2, parent: g });
			k.sphere(0.24, plate, { y: 0.06, s: [0.95, 1.05, 1.1], parent: head, ...steel });
			k.box(0.42, 0.11, 0.2, 0x050508, { y: 0.06, z: 0.16, parent: head, rough: 0.05, metal: 0.8 });
			k.sphere(0.13, 0xe0b090, { y: -0.12, z: 0.12, s: [1, 0.8, 1], parent: head });
			k.box(0.04, 0.02, 0.01, 0x6a3a30, { y: -0.14, z: 0.24, parent: head });
			k.box(0.44, 0.06, 0.4, plate, { y: 0.1, parent: head, ...steel });
			return g;
		};
		const officer = robo({ x: 0.5, y: 0, z: 12, ry: -0.4, from: 4 });
		k.box(0.12, 0.22, 0.6, 0x1a1a1e, { x: 0.62, y: 1.38, z: 0.6, parent: officer, metal: 0.6 });
		k.box(0.1, 0.12, 0.5, 0x2a2a30, { x: 0.62, y: 1.48, z: 0.85, parent: officer, metal: 0.6 });
		// Through his eyes: a punk in an alley, framed by the targeting display.
		const alley = k.group({ x: -400, y: 0, z: 0 });
		k.box(14, 0.2, 40, 0x3a3436, { y: -0.1, parent: alley });
		[-1, 1].forEach((s) => k.box(1, 12, 40, 0x6a4038, { x: s * 5, y: 6, parent: alley }));
		k.box(3, 1.6, 1.6, 0x2a4a3a, { x: 3, y: 0.8, z: -3, parent: alley });
		k.box(1, 1, 1, 0x8a6a4a, { x: -3.4, y: 0.5, z: -1, ry: 0.4, parent: alley });
		const punk = k.person({ x: 0, y: 0, z: 4, pose: "point", colors: { shirt: 0x1a1a1a, legs: 0x3a3a5a, skin: 0xd8b090, hair: 0xd83a3a }, parent: alley });
		k.box(0.1, 0.14, 0.4, 0x111111, { y: -0.75, z: 0.12, rx: PI / 2, parent: punk.userData.limbs.armR });
		k.point(0xffe0c0, 14, 20, { x: -398, y: 5, z: 6, decay: 1 });
		const hudTex = k.canvas(1024, 424, (g, w, h) => {
			g.clearRect(0, 0, w, h);
			g.fillStyle = "rgba(200,230,255,0.08)";
			for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
			g.strokeStyle = "rgba(220,240,255,0.9)";
			g.lineWidth = 2;
			const cx = w / 2, cy = h / 2 + 30;
			g.strokeRect(cx - 50, cy - 100, 100, 200);
			[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
				g.beginPath();
				g.moveTo(cx + sx * 160, cy + sy * 100);
				g.lineTo(cx + sx * 160, cy + sy * 130);
				g.lineTo(cx + sx * 130, cy + sy * 130);
				g.stroke();
			});
			g.beginPath();
			g.moveTo(cx - 16, cy - 40);
			g.lineTo(cx + 16, cy - 40);
			g.moveTo(cx, cy - 56);
			g.lineTo(cx, cy - 24);
			g.stroke();
			for (let i = 0; i < 12; i++) g.fillRect(cx - 380 + i * 6, h - 50, 3, 10 + (i % 3) * 4);
			g.strokeRect(cx + 300, 40, 90, 50);
		});
		const hud = k.plane(4.4, 1.1, new k.THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthWrite: false, depthTest: false, fog: false }), { x: -400, y: 1.3, z: 8.6, s: [0.9, 0.754, 1], shadow: false });
		hud.renderOrder = 10;
		// The boardroom, and the enforcement droid.
		const room = k.group({ x: 400, y: 0, z: 0, from: 2 });
		k.box(40, 0.2, 40, 0x6a5a4a, { parent: room });
		k.box(40, 12, 0.4, 0x2a2a34, { y: 6, z: -14, parent: room });
		for (let i = 0; i < 6; i++) k.box(5, 8, 0.1, 0xffc89a, { x: -15 + i * 6, y: 5.5, z: -13.7, parent: room, emissive: 0xd88a5a, glow: 0.8 });
		k.box(14, 0.3, 3, 0x3a2418, { y: 1.2, z: 3, parent: room, rough: 0.3 });
		k.box(13, 1.1, 2.4, 0x2a1810, { y: 0.55, z: 3, parent: room });
		for (let i = 0; i < 6; i++) k.person({ x: -5 + i * 2, y: 0, z: 5.4, ry: PI, pose: "sit", s: 0.95, colors: { shirt: [0x3a4050, 0x5a5a62, 0x2a3040][i % 3], legs: 0x2a2a30, hair: [0x6a6a6a, 0x3a2618, 0x9a9a9a][i % 3] }, parent: room });
		const ed = k.group({ x: 0, y: 0, z: -6, parent: room });
		const ash = 0xc8c8c0, joint = 0x3a3a3e;
		[-1, 1].forEach((s) => {
			k.box(0.8, 2.4, 0.8, ash, { x: s * 1.6, y: 3.0, z: -0.6, rx: 0.5, parent: ed });
			k.sphere(0.5, joint, { x: s * 1.6, y: 1.9, z: -1.2, parent: ed });
			k.box(0.6, 2.0, 0.6, ash, { x: s * 1.6, y: 1.0, z: -0.8, rx: -0.4, parent: ed });
			k.box(1.4, 0.3, 2.2, joint, { x: s * 1.6, y: 0.15, z: -0.4, parent: ed });
			k.box(1.3, 1.2, 2.4, ash, { x: s * 2.4, y: 4.4, z: 0.6, parent: ed });
			[-0.3, 0.3].forEach((dy) => k.cyl(0.14, 0.14, 1.6, joint, { x: s * 2.4, y: 4.4 + dy, z: 2.4, rx: PI / 2, parent: ed }));
		});
		k.box(3.2, 1.8, 2.6, ash, { y: 4.6, z: 0, parent: ed });
		k.box(2.6, 0.9, 1.4, ash, { y: 4.1, z: 1.7, rx: 0.3, parent: ed });
		k.box(2, 0.25, 0.1, 0x111111, { y: 4.9, z: 1.32, parent: ed });
		k.glow(0xff3020, 0.4, { x: 0.6, y: 4.9, z: 1.4, parent: ed });
		k.spot(0xfff0e0, 40, { x: 400, y: 12, z: 8, target: [400, 3, -5], angle: 0.5, from: 2 });
		return {
			shots: [
				{ pos: [-400, 1.3, 9.6], look: [-400, 1.3, 0], fov: 45, fog: [0x1a1418, 6, 40], filter: "sepia(0.35) hue-rotate(175deg) saturate(0.8) contrast(1.15)" },
				{ pos: [-2, 8, 60], look: [16, 60, -330], fov: 40 },
				{ pos: [402.6, 4.2, 9], look: [400, 3.4, -5], fov: 50 },
				{ pos: [1.5, 1.3, 17], look: [-3.5, 1.0, 10], fov: 50 },
				{ pos: [1.3, 3.25, 13.2], look: [0.5, 3.25, 12], fov: 40 },
				{ pos: [3.2, 2.6, 17], look: [0.2, 2.3, 11.5], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the hunter
	r85: (k) => {
		k.fog(0x6a8a6a, 20, 180);
		k.sky(0x8ab0a0, 0xc8dcc0);
		k.light({ sky: 0xe8ffe0, ground: 0x3a4a2a, hemi: 1.5, sunColor: 0xfff0c8, sunIntensity: 2.0, sunPos: [20, 60, 30], shadowSize: 40 });
		k.ground(600, 0x3e5230, { bump: 1, seg: 60 });
		const jungle = (n, area, seed, o = {}) => {
			const r = rng(seed);
			for (let i = 0; i < n; i++) {
				const x = area[0] + r() * (area[1] - area[0]);
				const z = area[2] + r() * (area[3] - area[2]);
				if (o.avoid && o.avoid(x, z)) continue;
				const h = 10 + r() * 14;
				k.cyl(0.35 + r() * 0.3, 0.6 + r() * 0.3, h, o.trunk ?? 0x5a4a38, { x, y: h / 2, z, seg: 7, ...o.mat });
				for (let j = 0; j < 3; j++) k.ico(2.5 + r() * 2.5, o.leaf ?? [0x2a5a2a, 0x3a6a2a, 0x1e4a24][j], { x: x + (r() - 0.5) * 4, y: h + (r() - 0.3) * 2, z: z + (r() - 0.5) * 4, s: [1.3, 0.6, 1.3], ...o.mat });
				if (r() > 0.4) k.cone(1.4 + r(), 1.2, o.fern ?? 0x4a7a30, { x: x + 1.5, y: 0.6, z: z + 1, seg: 7, ...o.mat });
				if (r() > 0.6) k.cyl(0.04, 0.04, h * 0.8, 0x3a5a2a, { x: x + 0.7, y: h * 0.55, z, rz: 0.08, ...o.mat });
			}
		};
		jungle(150, [-90, 90, -110, 60], 3, { avoid: (x, z) => Math.hypot(x, z + 20) < 6 || Math.hypot(x, z) < 3 });
		// The tree with three red dots.
		k.cyl(1.2, 1.5, 20, 0x5a4634, { x: 0, y: 10, z: 0, seg: 9, rough: 1 });
		for (let i = 0; i < 12; i++) k.box(0.15, 1.2 + (i % 3) * 0.5, 0.05, 0x3a2a20, { x: Math.sin(i) * 0.7, y: 0.8 + i * 0.35, z: 1.36, ry: Math.sin(i), shadow: false });
		const dots = [[-0.12, 1.64], [0.12, 1.64], [0, 1.44]];
		dots.forEach(([x, y]) => {
			k.glow(0xff1010, 0.3, { x, y, z: 1.56 });
			k.sphere(0.025, 0xff2020, { x, y, z: 1.52, emissive: 0xff0000, glow: 2 });
		});
		// The hunter in the trees.
		const pred = k.group({ x: 0, y: 0, z: -20, ry: 0.1, from: 5 });
		const hide = 0x7a7048, mesh = 0x1a1a14, armor = 0x9a948a;
		[-1, 1].forEach((s) => {
			k.box(0.4, 1.2, 0.45, hide, { x: s * 0.26, y: 0.65, parent: pred });
			k.box(0.44, 0.8, 0.5, hide, { x: s * 0.26, y: 1.6, parent: pred });
			k.box(0.46, 0.25, 0.6, 0x3a3a30, { x: s * 0.26, y: 0.12, z: 0.06, parent: pred });
			k.box(0.28, 1.1, 0.3, hide, { x: s * 0.7, y: 2.4, rz: s * 0.15, parent: pred });
			k.box(0.3, 0.6, 0.34, armor, { x: s * 0.78, y: 1.95, rz: s * 0.15, parent: pred, metal: 0.5, rough: 0.4 });
		});
		k.box(1.1, 1.3, 0.6, hide, { y: 2.6, parent: pred });
		for (let i = 0; i < 6; i++) k.box(1.12, 0.02, 0.62, mesh, { y: 2.0 + i * 0.22, rz: (i % 2 ? 0.3 : -0.3), parent: pred });
		
		k.box(1.0, 0.35, 0.62, armor, { y: 3.05, z: 0.04, parent: pred, metal: 0.5, rough: 0.4 });
		k.box(0.8, 0.4, 0.5, 0x3a3a30, { y: 1.95, parent: pred });
		[-1, 1].forEach((s) => k.sphere(0.32, armor, { x: s * 0.62, y: 3.2, s: [1, 0.7, 1], parent: pred, metal: 0.5, rough: 0.4 }));
		const head = k.group({ y: 3.6, parent: pred });
		k.box(0.5, 0.55, 0.5, hide, { parent: head });
		k.box(0.52, 0.5, 0.12, 0xa89a78, { y: 0.0, z: 0.3, rx: -0.15, parent: head, metal: 0.6, rough: 0.35 });
		k.box(0.3, 0.3, 0.1, 0xa89a78, { y: -0.1, z: 0.36, rx: 0.2, parent: head, metal: 0.6, rough: 0.35 });
		[-1, 1].forEach((s) => k.box(0.16, 0.06, 0.04, 0x0a0a0a, { x: s * 0.12, y: 0.1, z: 0.37, rz: s * 0.4, parent: head }));
		for (let i = 0; i < 14; i++) {
			const a = PI * 0.15 + (i / 13) * PI * 1.7;
			const dx = Math.sin(a), dz = Math.cos(a);
			k.cyl(0.045, 0.03, 1.2, 0x14120e, { x: dx * 0.32, y: -0.3, z: dz * 0.3 - 0.04, rz: dx * 0.25, rx: -dz * 0.25, parent: head, seg: 5 });
		}
		const cannon = k.group({ x: -0.6, y: 3.55, z: -0.05, parent: pred });
		k.box(0.2, 0.2, 0.6, 0x3a3a34, { parent: cannon, metal: 0.6 });
		k.cyl(0.07, 0.07, 0.5, 0x3a3a34, { z: 0.45, rx: PI / 2, parent: cannon, metal: 0.6 });
		k.glow(0xff2020, 0.3, { z: 0.72, parent: cannon });
		[-1, 1].forEach((s) => k.cone(0.03, 0.45, 0xd0d0d0, { x: s * 0.82, y: 1.55, z: 0.15, rx: PI / 2, parent: pred, metal: 0.8 }));
		k.point(0xfff0d0, 10, 12, { x: 1, y: 4, z: -15, from: 5 });
		// The chopper over the canopy.
		const heli = k.group({ x: 30, y: 36, z: -40, ry: 0.8, from: 2 });
		const olive = 0x4a5634;
		k.capsule(1.4, 3.4, olive, { rx: PI / 2, parent: heli, s: [1, 1, 1] });
		k.box(0.5, 0.6, 6, olive, { y: 0.6, z: -4.6, parent: heli });
		k.box(0.12, 1.6, 0.8, olive, { y: 1.2, z: -7.4, parent: heli });
		k.sphere(1.25, 0x2a3a40, { z: 2.4, y: 0.2, s: [1, 0.8, 0.8], parent: heli, rough: 0.1, metal: 0.4 });
		[-1, 1].forEach((s) => k.box(0.12, 0.12, 4, 0x2a2a2a, { x: s * 1.2, y: -1.7, z: 0.3, parent: heli }));
		k.cyl(0.2, 0.2, 0.8, 0x2a2a2a, { y: 1.6, parent: heli });
		const rotor = k.group({ y: 2.05, parent: heli });
		k.box(15, 0.06, 0.4, 0x1a1a1a, { parent: rotor });
		k.tick((t) => {
			rotor.rotation.y = t * 9;
			heli.position.y = 36 + Math.sin(t) * 0.3;
		});
		// The handshake.
		const shake = k.group({ x: 300, y: 0, z: 0, from: 1 });
		k.box(40, 0.2, 40, 0x2a3a20, { parent: shake });
		jungle(30, [282, 318, -30, -6], 9);
		const arm = (skin, side) => {
			const g = k.group({ x: side * 0.05, y: 2, parent: shake });
			k.capsule(0.22, 0.9, skin, { x: side * 0.5, y: -0.55, rz: side * 0.75, parent: g });
			k.capsule(0.3, 1.0, skin, { x: side * 1.45, y: -0.75, rz: side * -1.0, parent: g });
			k.sphere(0.36, skin, { x: side * 1.4, y: -0.48, parent: g, s: [1.1, 0.85, 0.9] });
			k.box(0.42, 0.36, 0.34, skin, { x: side * 0.1, y: 0, parent: g, rz: side * 0.3 });
			k.box(0.12, 0.3, 0.3, skin, { x: side * -0.14, y: 0.05, z: 0.08, parent: g, rz: side * -0.4 });
			k.box(0.9, 0.8, 0.8, side < 0 ? 0x4a5a34 : 0x3a4a5a, { x: side * 2.3, y: -0.25, parent: g });
			return g;
		};
		arm(0xd8a07a, -1);
		arm(0x6a4430, 1);
		k.spot(0xfff0d8, 30, { x: 302, y: 7, z: 6, target: [300, 1.6, 0], angle: 0.4, from: 1 });
		// Thermal vision of a soldier.
		const heat = k.group({ x: -300, y: 0, z: 0, from: 3 });
		const cold = { emissive: 0x10106a, glow: 1, rough: 1 };
		k.box(80, 0.2, 80, 0x0a0a3a, { parent: heat, ...cold });
		for (let i = 0; i < 26; i++) {
			const x = (i % 7) * 7 - 21 + Math.sin(i) * 2, z = -6 - Math.floor(i / 7) * 7;
			k.cyl(0.4, 0.6, 16, 0x1a1a6a, { x, y: 8, z, parent: heat, ...cold, emissive: 0x2a1a8a });
			k.ico(3, 0x14147a, { x, y: 15, z, s: [1.3, 0.6, 1.3], parent: heat, ...cold, emissive: 0x1a2aa0 });
		}
		const hot = (c) => ({ emissive: c, glow: 1.4 });
		const sol = k.group({ x: 1, y: 0, z: -4, ry: 0.3, parent: heat });
		[-1, 1].forEach((s) => {
			k.box(0.22, 0.85, 0.22, 0xff4010, { x: s * 0.14, y: 0.43, parent: sol, ...hot(0xd02008) });
			k.box(0.18, 0.75, 0.18, 0xffa020, { x: s * 0.38, y: 1.2, parent: sol, ...hot(0xff8010) });
		});
		k.box(0.55, 0.75, 0.32, 0xffc030, { y: 1.22, parent: sol, ...hot(0xffa018) });
		k.sphere(0.22, 0xffffa0, { y: 1.78, parent: sol, ...hot(0xfff070) });
		k.box(0.1, 0.1, 0.9, 0x2a1a6a, { x: 0.3, y: 1.3, z: 0.4, parent: sol, ...cold });
		// The man covered in mud, with a torch.
		const mud = k.group({ x: 600, y: 0, z: 0, from: 4 });
		k.box(40, 0.2, 40, 0x2a2418, { parent: mud });
		jungle(20, [585, 615, -22, -4], 11);
		const man = k.person({ x: 0, y: 0, z: 0, ry: 0.2, pose: "raise", colors: { shirt: 0x6a6252, legs: 0x5a5444, skin: 0x7a7060, hair: 0x5a5444, shoes: 0x4a4434 }, parent: mud });
		man.userData.limbs.armR.rotation.z = 2.4;
		k.cyl(0.03, 0.04, 0.8, 0x4a3420, { y: -0.95, parent: man.userData.limbs.armR });
		const flame = k.group({ y: -1.45, parent: man.userData.limbs.armR });
		k.glow(0xff9a30, 1.6, { parent: flame });
		k.point(0xff9040, 14, 16, { parent: flame, decay: 1 });
		k.box(0.6, 0.14, 0.32, 0x5a5444, { y: 1.5, parent: man });
		k.point(0x6a8ab8, 4, 20, { x: 604, y: 6, z: 6, from: 4 });
		return {
			shots: [
				{ pos: [0.35, 1.7, 3.0], look: [0, 1.55, 1.3], fov: 40 },
				{ pos: [300.3, 2.0, 2.6], look: [300, 1.55, 0], fov: 50, fog: [0x3a5a3a, 6, 40] },
				{ pos: [10, 44, -12], look: [30, 34, -40], fov: 50 },
				{ pos: [-300, 2.2, 6], look: [-299.5, 1.4, -4], fov: 45, fog: [0x0a0a50, 5, 60], filter: "saturate(1.5) contrast(1.15)" },
				{ pos: [601.6, 2.2, 3.6], look: [600, 1.8, 0], fov: 45, fog: [0x0a120e, 4, 40] },
				{ pos: [1.2, 3.0, -16], look: [0, 2.9, -20], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the tower
	r86: (k) => {
		k.fog(0x1c2848, 60, 600);
		k.sky(0x0a1230, 0x3a4a7a);
		k.stars(500);
		k.light({ sky: 0x9aaad8, ground: 0x2a2a38, hemi: 1.3, sunColor: 0xb8c8ff, sunIntensity: 1.0, sunPos: [-40, 60, 60], shadowSize: 60 });
		k.box(800, 0.2, 800, 0x2a2c32, { y: -0.1 });
		k.box(30, 0.04, 800, 0x1a1a1e, { x: 40, y: 0.02 });
		city(k, 80, [-300, 300, -320, 160], { h: 40, colors: [0x3a3c48, 0x2a2c38, 0x4a4a54], windows: 0xffd890, seed: 12, avoid: (x, z) => (Math.abs(x) < 50 && z > -110 && z < 120) || Math.abs(x - 40) < 20 });
		// The tower.
		const tw = k.group({ x: 0, z: -60 });
		const stone = 0xa89a84;
		const H = 140;
		k.box(36, H, 26, stone, { y: H / 2, parent: tw });
		[-1, 1].forEach((s) => k.box(8, H + 4, 30, 0x988a74, { x: s * 15, y: (H + 4) / 2, parent: tw }));
		for (let f = 0; f < 34; f++) {
			const y = 6 + f * 3.9;
			k.box(22, 1.7, 26.4, 0x1a2234, { y, parent: tw, emissive: f % 5 === 2 ? 0x8a6a30 : 0x0a1020, glow: 1, shadow: false });
			[-1, 1].forEach((s) => k.box(8.4, 1.4, 30.4, 0x1a2234, { x: s * 15, y, parent: tw, emissive: f % 7 === 3 ? 0x8a6a30 : 0x0a1020, glow: 1, shadow: false }));
		}
		k.box(30, 4, 22, 0x6a6058, { y: H + 2, parent: tw });
		k.cyl(6, 6, 0.4, 0x3a3a3a, { y: H + 4.2, z: 2, parent: tw, seg: 20 });
		k.point(0xffe0b0, 30, 120, { x: 0, y: 40, z: -10 });
		k.spot(0xffe8c8, 120, { x: 0, y: 2, z: 10, target: [0, 90, -50], angle: 0.35, distance: 220 });
		// Fire on the top floors.
		const fire = k.group({ x: 0, y: H - 6, z: -46, from: 5 });
		fireball(k, 7, { x: -6, parent: fire, seed: 1 });
		fireball(k, 6, { x: 8, y: 4, parent: fire, seed: 2, light: false });
		fireball(k, 9, { x: 0, y: 12, z: -8, parent: fire, seed: 3 });
		// Helicopters, police and the limo.
		const chopper = (o) => {
			const g = k.group(o);
			k.capsule(1.2, 2.6, 0x1a1a20, { rx: PI / 2, parent: g });
			k.box(0.4, 0.5, 5, 0x1a1a20, { y: 0.4, z: -3.8, parent: g });
			k.box(12, 0.06, 0.3, 0x0a0a0a, { y: 1.6, parent: g });
			k.glow(0xff2020, 1, { y: -1, z: -6, parent: g });
			k.spot(0xffffff, 40, { y: -1, z: 1, parent: g, target: [o.x - 5, 60, -50], angle: 0.12, distance: 120 });
			return g;
		};
		chopper({ x: 50, y: 150, z: -20, ry: -0.8, from: 5 });
		chopper({ x: -60, y: 130, z: -10, ry: 0.9, from: 5 });
		const plaza = k.group({ x: 0, z: -20 });
		k.box(60, 0.3, 30, 0x5a5650, { y: 0.15, parent: plaza });
		for (let i = 0; i < 6; i++) {
			const p = k.group({ x: -22 + i * 7, z: 18 + (i % 2) * 4, ry: 0.4 * (i % 3), parent: plaza });
			k.box(2, 0.8, 4.6, 0x111111, { y: 0.7, parent: p });
			k.box(2.02, 0.3, 2, 0xf0f0f0, { y: 0.8, parent: p });
			k.box(1.8, 0.55, 2.2, 0x111111, { y: 1.35, parent: p });
			k.glow(i % 2 ? 0xff2020 : 0x2040ff, 2.2, { y: 1.9, parent: p });
		}
		k.point(0xff3030, 20, 40, { x: -10, y: 4, z: 0 });
		k.point(0x3050ff, 20, 40, { x: 10, y: 4, z: 0 });
		const limo = k.group({ x: 20, z: 6, ry: 1.3, parent: plaza });
		k.box(2.1, 0.8, 8, 0x0a0a0c, { y: 0.7, parent: limo, metal: 0.5, rough: 0.3 });
		k.box(1.9, 0.55, 5.6, 0x0a0a0c, { y: 1.35, z: -0.6, parent: limo, metal: 0.5, rough: 0.3 });
		// The man falling from the tower.
		const fall = k.person({ x: 1, y: 90, z: -37, rx: -PI / 2 + 0.3, pose: "arms-out", colors: { shirt: 0x2a2a30, legs: 0x2a2a30, skin: 0xe0c0a0, hair: 0x5a4a3a }, from: 3 });
		k.box(0.16, 0.5, 0.02, 0xf4f4f4, { y: 1.33, z: 0.145, parent: fall });
		k.point(0xfff0d0, 10, 16, { x: 2, y: 97, z: -33, from: 3 });
		// McClane on the roof with a hose, the roof blowing.
		const hero = k.person({ x: 6, y: H + 4, z: -50, ry: 0, pose: "run", colors: { shirt: 0xf0ece0, legs: 0x4a5040, skin: 0xd8a888, hair: 0x5a3a24, shoes: 0xd8a888 }, sleeves: 0xd8a888, from: 4 });
		k.box(0.52, 0.5, 0.3, 0x8a3a2a, { y: 1.1, parent: hero, opacity: 0.6 });
		k.torus(0.4, 0.06, 0xd8c8a0, { y: 1.05, rx: PI / 2, parent: hero });
		const blast = k.group({ x: 0, y: H + 8, z: -60, from: 4 });
		fireball(k, 6, { z: -6, parent: blast, seed: 7 });
		fireball(k, 4, { x: -10, y: -2, z: 0, parent: blast, seed: 8, light: false });
		// The vent and a lighter.
		const vent = k.group({ x: 500, y: 0, z: 0, from: 1 });
		const duct = 0x8a8e94;
		k.box(2, 0.1, 30, duct, { y: 0, parent: vent, metal: 0.5, rough: 0.4 });
		k.box(2, 0.1, 30, duct, { y: 1.6, parent: vent, metal: 0.5, rough: 0.4 });
		[-1, 1].forEach((s) => k.box(0.1, 1.6, 30, duct, { x: s * 1, y: 0.8, parent: vent, metal: 0.5, rough: 0.4 }));
		for (let i = 0; i < 12; i++) {
			const z = 12 - i * 2.4;
			[-1, 1].forEach((s) => {
				k.box(0.12, 1.7, 0.12, 0x6a6e74, { x: s * 0.94, y: 0.8, z, parent: vent });
				k.box(2.1, 0.12, 0.12, 0x6a6e74, { y: s > 0 ? 1.54 : 0.06, z, parent: vent });
			});
		}
		k.box(0.2, 0.36, 0.12, 0xb0b4b8, { x: 0.2, y: 0.4, z: 2, parent: vent, metal: 0.7 });
		k.box(0.3, 0.22, 0.24, 0xd8a888, { x: 0.2, y: 0.18, z: 2.05, parent: vent });
		k.glow(0xffa040, 0.7, { x: 0.2, y: 0.7, z: 2, parent: vent });
		k.point(0xffa050, 6, 8, { x: 0.2, y: 0.8, z: 2.2, parent: vent });
		// The lobby Christmas tree.
		const lobby = k.group({ x: -400, y: 0, z: 0, from: 2 });
		k.box(40, 0.2, 40, 0xd8d0c4, { parent: lobby, rough: 0.2, metal: 0.2 });
		k.box(40, 20, 0.4, 0xa89a84, { y: 10, z: -12, parent: lobby });
		k.cone(4, 10, 0x1a5a2a, { y: 5.6, parent: lobby, seg: 9 });
		k.cyl(0.4, 0.4, 0.8, 0x5a3a20, { y: 0.4, parent: lobby });
		const deco = [0xff3030, 0xffd040, 0x40a0ff, 0xffffff];
		for (let i = 0; i < 50; i++) {
			const t = i / 50, a = i * 2.4;
			const rr = 4 * (1 - t) * 0.92;
			k.glow(deco[i % 4], 0.6, { x: Math.cos(a) * rr, y: 0.8 + t * 9.5, z: Math.sin(a) * rr, parent: lobby });
		}
		k.glow(0xfff0a0, 1.6, { y: 10.8, parent: lobby });
		for (let i = 0; i < 7; i++) k.person({ x: -8 + i * 2.6, z: 5 + (i % 2) * 2, ry: (i % 3) - 1 + PI, dress: i % 2 ? 0x8a1a2a : undefined, colors: { shirt: i % 2 ? 0x8a1a2a : 0x1a1a22, legs: 0x1a1a22, hair: [0x3a2618, 0xd8b060, 0x111111][i % 3] }, parent: lobby });
		k.point(0xffd8a0, 20, 40, { x: -400, y: 12, z: 10, decay: 1 });
		// Bare feet on broken glass.
		const glass = k.group({ x: 300, y: 0, z: 0 });
		k.box(20, 0.2, 20, 0x5a5a62, { y: -0.1, parent: glass, rough: 1 });
		const rr = rng(66);
		for (let i = 0; i < 70; i++) k.ico(0.04 + rr() * 0.12, 0xd8f0ff, { x: (rr() - 0.5) * 3, y: 0.02, z: (rr() - 0.5) * 3, s: [1, 0.15, 1.6], ry: rr() * 6, parent: glass, opacity: 0.6, rough: 0.05, metal: 0.3, emissive: 0x1a2a3a });
		[-0.18, 0.18].forEach((x, i) => {
			const f = k.group({ x, z: i * 0.2, ry: 0.1 * (i ? -1 : 1), parent: glass });
			k.box(0.18, 0.12, 0.42, 0xd8a888, { y: 0.06, parent: f });
			k.box(0.14, 0.4, 0.14, 0xd8a888, { y: 0.3, z: -0.14, parent: f });
			k.box(0.16, 0.6, 0.16, 0x4a5040, { y: 0.8, z: -0.14, parent: f });
			for (let t = 0; t < 5; t++) k.sphere(0.028, 0xd8a888, { x: -0.07 + t * 0.035, y: 0.04, z: 0.23, parent: f });
		});
		k.sphere(0.04, 0x8a0a0a, { x: 0.3, y: 0.01, z: 0.5, s: [1.6, 0.2, 1], parent: glass });
		k.spot(0xfff0e0, 20, { x: 301, y: 4, z: 2, target: [300, 0, 0], angle: 0.4 });
		return {
			shots: [
				{ pos: [300.6, 0.8, 1.5], look: [300, 0.15, 0], fov: 45, hide: ["sky", "stars"], fog: [0x0e1018, 2, 20] },
				{ pos: [500, 0.9, 5.4], look: [500.1, 0.6, 0], fov: 55, fog: [0x050608, 2, 30], hide: ["sky", "stars"] },
				{ pos: [-400, 3, 18], look: [-400, 5, 0], fov: 50, fog: [0x2a2018, 10, 60], hide: ["sky", "stars"] },
				{ pos: [1, 94.5, -33.6], look: [1, 89.6, -37.6], fov: 50 },
				{ pos: [10, H + 3.2, -41], look: [6, H + 6.5, -51], fov: 55 },
				{ pos: [44, 6, 50], look: [0, 72, -60], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the bus
	r87: (k) => {
		k.fog(0xe4ccac, 120, 800);
		k.sky(0x5a9ad8, 0xf2dcc0, { offset: -0.05 });
		k.light({ sky: 0xfff0e0, ground: 0x8a7a5a, hemi: 1.4, sunColor: 0xfff0d0, sunIntensity: 2.4, sunPos: [60, 80, 30], shadowSize: 50 });
		k.ground(1600, 0xb8a072, { bump: 0.4, seg: 40 });
		// The elevated freeway, with a gap.
		const deck = 0xb8b4ac;
		const span = (z0, z1, from = 0, until = 99) => {
			const len = z1 - z0, zc = (z0 + z1) / 2;
			k.box(22, 1.4, len, deck, { y: 12, z: zc, from, until });
			k.box(21.8, 0.04, len, 0x5a5a5e, { y: 12.72, z: zc, from, until });
			[-1, 1].forEach((s) => k.box(0.6, 1.1, len, 0xd8d4cc, { x: s * 10.7, y: 13.3, z: zc, from, until }));
			[-3.6, 3.6].forEach((x) => {
				for (let z = z0 + 2; z < z1 - 2; z += 8) k.box(0.2, 0.03, 3, 0xf4f4f0, { x, y: 12.75, z, from, until, shadow: false });
			});
			for (let z = z0 + 10; z < z1 - 5; z += 30) k.cyl(1.4, 1.6, 12, 0xa8a49c, { y: 6, z, from, until });
		};
		span(-400, -80);
		span(-55, 400);
		// Snapped rebar at the edges.
		for (let i = 0; i < 10; i++) {
			k.cyl(0.05, 0.05, 2, 0x6a4a3a, { x: -9 + i * 2, y: 12.2, z: -80.8, rx: PI / 2 + 0.4, from: 5 });
			k.cyl(0.05, 0.05, 2, 0x6a4a3a, { x: -9 + i * 2, y: 12.2, z: -54.2, rx: PI / 2 - 0.4, from: 5 });
		}
		trees(k, 30, [-150, 150, -300, 300], { color: 0x5a7a40, h: 7, avoid: (x) => Math.abs(x) < 20 });
		city(k, 40, [-500, 500, -700, -450], { h: 60, colors: [0xc8b8a0, 0xb0a490, 0x9a9a9a], seed: 15 });
		// The bus.
		const bus = (o) => {
			const g = k.group(o);
			k.box(2.6, 2.4, 12, 0xf2f0e8, { y: 1.75, parent: g });
			k.box(2.62, 0.5, 12.02, 0x2a5ab0, { y: 1.0, parent: g });
			k.box(2.64, 0.9, 10, 0x1e2a36, { y: 2.3, z: -0.6, parent: g, rough: 0.15, metal: 0.4 });
			k.box(2.3, 0.9, 0.06, 0x1e2a36, { y: 2.3, z: 6.0, parent: g, rough: 0.15, metal: 0.4 });
			k.box(1.6, 0.3, 0.05, 0xff9a20, { y: 2.95, z: 6.02, parent: g, emissive: 0xd06010, glow: 1 });
			k.box(2.62, 0.25, 12.02, 0x2a2a2a, { y: 0.55, parent: g });
			k.box(1.8, 0.4, 3, 0xe0ded4, { y: 3.15, z: -3, parent: g });
			[-0.9, 0.9].forEach((x) => k.glow(0xfff8e0, 0.6, { x, y: 0.9, z: 6.05, parent: g }));
			[-0.9, 0.9].forEach((x) => k.glow(0xff3020, 0.5, { x, y: 1.2, z: -6.05, parent: g }));
			[-1, 1].forEach((x) => [-3.8, 3.8].forEach((z) => k.cyl(0.5, 0.5, 0.4, 0x151515, { x: x * 1.15, y: 0.5, z, rz: PI / 2, parent: g })));
			return g;
		};
		bus({ x: 3.6, y: 12.7, z: 60, from: 2, until: 4 });
		const police = (x, z, from, until) => {
			const g = k.group({ x, y: 12.7, z, from, until });
			k.box(2, 0.8, 4.6, 0x111111, { y: 0.7, parent: g });
			k.box(2.02, 0.4, 2, 0xf4f4f4, { y: 0.8, parent: g });
			k.box(1.8, 0.55, 2.2, 0x111111, { y: 1.35, z: -0.2, parent: g });
			k.glow(0xff2020, 1.2, { x: -0.4, y: 1.8, parent: g });
			k.glow(0x2040ff, 1.2, { x: 0.4, y: 1.8, parent: g });
			[-1, 1].forEach((sx) => [-1.5, 1.5].forEach((sz) => k.cyl(0.36, 0.36, 0.3, 0x111111, { x: sx * 0.95, y: 0.36, z: sz, rz: PI / 2, parent: g })));
		};
		[[3.6, 76], [-3.6, 82], [3.6, 90], [-3.6, 100], [0, 112]].forEach(([x, z]) => police(x, z, 4, 4));
		[[3.6, 0], [-3.6, 8], [0, 18]].forEach(([x, z]) => police(x, z, 5));
		// The jump.
		const flying = bus({ x: 2, y: 15.6, z: -66, rx: 0.12, from: 5 });
		void flying;
		const heli = k.group({ x: -30, y: 40, z: 40, ry: 0.6, from: 4 });
		k.capsule(1.1, 2.4, 0x2a3a6a, { rx: PI / 2, parent: heli });
		k.box(0.4, 0.4, 4, 0x2a3a6a, { y: 0.3, z: -3.4, parent: heli });
		k.box(11, 0.06, 0.3, 0x111111, { y: 1.4, parent: heli });
		// Underneath: the bomb strapped to the chassis.
		const under = k.group({ x: 3.6, y: 12.7, z: 60, from: 2, until: 2 });
		k.point(0xffd8b0, 4, 4, { x: 3.4, y: 12.9, z: 63, from: 2, until: 2 });
		k.box(1.2, 0.35, 0.9, 0x3a3a3a, { y: 0.3, z: 1.5, parent: under });
		for (let i = 0; i < 6; i++) k.cyl(0.07, 0.07, 0.9, 0xb83a2a, { x: -0.45 + i * 0.18, y: 0.15, z: 1.5, rx: PI / 2, parent: under });
		k.box(0.3, 0.12, 0.2, 0x1a1a1a, { x: 0.2, y: 0.05, z: 2.0, parent: under });
		k.glow(0xff2020, 0.25, { x: 0.25, y: 0.02, z: 2.1, parent: under });
		for (let i = 0; i < 3; i++) k.cyl(0.015, 0.015, 0.8, [0xff3030, 0x3060ff, 0xffd030][i], { x: -0.2 + i * 0.1, y: 0.12, z: 2.1, rz: PI / 2 + 0.3, parent: under });
		k.point(0xffe0c0, 6, 10, { x: 5, y: 13.2, z: 64, from: 2, until: 2 });
		// The dashboard dial.
		const dash = k.group({ x: -400, y: 0, z: 0 });
		k.box(10, 4, 1, 0x1a1a1e, { y: 2, parent: dash });
		const dial = k.canvas(256, 256, (g) => {
			g.fillStyle = "#0e0e10";
			g.fillRect(0, 0, 256, 256);
			g.strokeStyle = "#f0f0f0";
			for (let i = 0; i <= 40; i++) {
				const a = PI * 0.75 + (i / 40) * PI * 1.5;
				const long = i % 5 === 0;
				g.lineWidth = long ? 5 : 2;
				g.beginPath();
				g.moveTo(128 + Math.cos(a) * (long ? 92 : 102), 128 + Math.sin(a) * (long ? 92 : 102));
				g.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112);
				g.stroke();
			}
			g.strokeStyle = "#ff3a20";
			g.lineWidth = 6;
			const a = PI * 0.75 + (25 / 40) * PI * 1.5;
			g.beginPath();
			g.arc(128, 128, 118, a - 0.05, PI * 2.25);
			g.stroke();
		});
		k.cyl(1.2, 1.2, 0.1, k.mat(0xffffff, { map: dial, emissive: 0x404040 }), { y: 2, z: 0.52, rx: PI / 2, ry: PI, parent: dash, seg: 32 });
		k.torus(1.22, 0.06, 0x8a8a90, { y: 2, z: 0.58, parent: dash, metal: 0.6 });
		const needle = k.group({ y: 2, z: 0.6, parent: dash });
		k.box(0.06, 0.95, 0.03, 0xff4020, { y: 0.45, parent: needle, emissive: 0xc02000, glow: 1.4 });
		k.cyl(0.1, 0.1, 0.06, 0x2a2a2a, { rx: PI / 2, parent: needle });
		k.tick((t) => (needle.rotation.z = -(PI * 0.75 + (25 / 40) * PI * 1.5 + PI / 2) + Math.sin(t * 6) * 0.03));
		k.point(0xffd8a0, 5, 8, { x: -399, y: 3, z: 3 });
		// The elevator shaft from above.
		const shaft = k.group({ x: 400, y: 0, z: 0, from: 1 });
		[-1, 1].forEach((s) => {
			k.box(0.4, 60, 6, 0x6a6660, { x: s * 3, y: 0, parent: shaft, rough: 1 });
			k.box(6, 60, 0.4, 0x5a5650, { z: s * 3, y: 0, parent: shaft, rough: 1 });
			k.box(0.2, 60, 0.3, 0x3a3a3c, { x: s * 2.6, parent: shaft, metal: 0.5 });
		});
		const car = k.group({ y: -6, parent: shaft });
		k.box(4.6, 3, 4.6, 0x8a8a8a, { y: -1.5, parent: car, metal: 0.5, rough: 0.4 });
		k.box(4.6, 0.1, 4.6, 0x5a5a5e, { y: 0.05, parent: car });
		k.box(1.4, 0.6, 0.8, 0x3a3a3c, { y: 0.4, parent: car });
		k.box(1.4, 0.06, 1.2, 0xc8c4bc, { x: -1.2, y: 0.12, z: 1, parent: car });
		for (let i = 0; i < 4; i++) k.cyl(0.04, 0.04, 10, 0x2a2a2a, { x: -0.3 + i * 0.2, y: 5.5, parent: car, metal: 0.6 });
		k.box(5.6, 0.6, 0.8, 0x4a4a4e, { y: 10.6, parent: car, metal: 0.4 });
		k.cyl(0.6, 0.6, 0.6, 0x3a3a3e, { y: 10.6, z: 0.6, rx: PI / 2, parent: car });
		k.point(0xfff0d0, 10, 20, { x: 400, y: 4, z: 1, from: 1 });
		// Inside the bus: the woman at the wheel.
		const cab = k.group({ x: 0, y: 0, z: 400, from: 3 });
		k.box(2.6, 0.2, 12, 0x5a5a62, { parent: cab });
		k.box(2.6, 0.2, 12, 0xd8d8d0, { y: 2.6, parent: cab });
		[-1, 1].forEach((s) => {
			k.box(0.1, 0.9, 12, 0xd8d8d0, { x: s * 1.3, y: 0.45, parent: cab });
			k.box(0.1, 1.0, 12, 0xd8eaff, { x: s * 1.3, y: 1.5, parent: cab, emissive: 0xc8dcf0, glow: 0.8 });
			for (let i = 0; i < 5; i++) {
				k.box(0.8, 0.5, 0.6, 0x2a4a8a, { x: s * 0.7, y: 0.5, z: -4 + i * 1.6, parent: cab });
				k.box(0.8, 0.8, 0.12, 0x2a4a8a, { x: s * 0.7, y: 1.1, z: -4.3 + i * 1.6, parent: cab });
				if ((i + (s > 0 ? 1 : 0)) % 2) k.person({ x: s * 0.7, y: 0.3, z: -4 + i * 1.6, ry: 0, pose: "sit", s: 0.8, colors: { shirt: [0xd84a3a, 0x3a8ad8, 0xf2c230, 0x8a5ad8][i % 4], legs: 0x3a3a4a, hair: [0x3a2618, 0x111111, 0xd8b060][i % 3] }, parent: cab });
			}
		});
		k.box(2.6, 1.0, 0.1, 0xd8eaff, { y: 1.6, z: 6, parent: cab, emissive: 0xc8dcf0, glow: 0.8 });
		const annie = k.person({ x: -0.6, y: 0.3, z: 4.4, ry: 0, pose: "sit", s: 0.85, colors: { shirt: 0xc8a8c0, legs: 0x3a4a6a, skin: 0xe8c0a0, hair: 0x5a3020 }, parent: cab });
		annie.userData.limbs.armL.rotation.x = -1.2;
		annie.userData.limbs.armR.rotation.x = -1.2;
		k.sphere(0.22, 0x5a3020, { y: 1.62, z: -0.05, parent: annie, s: [1.2, 1.1, 1.1] });
		k.torus(0.4, 0.04, 0x1a1a1a, { x: -0.6, y: 1.4, z: 5.2, rx: -0.9, parent: cab });
		k.box(2.6, 0.6, 0.6, 0x2a2a2e, { y: 0.9, z: 5.7, parent: cab });
		k.point(0xfff4e8, 12, 10, { x: 0.6, y: 2.2, z: 403 });
		return {
			shots: [
				{ pos: [-399.4, 2.3, 2.6], look: [-400, 2, 0.5], fov: 40, fog: [0x0e0e10, 3, 30] },
				{ pos: [400.9, 11, 1.4], look: [400, -8, 0], fov: 55, fog: [0x1a1814, 8, 50] },
				{ pos: [3.3, 12.9, 63.4], look: [3.6, 13.0, 61.7], fov: 60 },
				{ pos: [0.7, 1.9, 405.6], look: [-0.5, 1.4, 403.6], fov: 55, fog: [0xc8dcf0, 10, 40] },
				{ pos: [26, 24, 100], look: [2, 13, 72], fov: 45 },
				{ pos: [30, 9, -50], look: [2, 14.5, -67], fov: 50 },
			],
		};
	},
};
