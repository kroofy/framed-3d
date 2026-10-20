import { PI, rng, trees, city } from "../kit.js";

// Original film sets, moved out of reels.js.
export const REELS = {
	// ----------------------------------------------------------------------------------------------- the shark
	r01: (k) => {
		k.fog(0x9cc9e3, 40, 300);
		k.sky(0x3f86cf, 0xd8eef8);
		k.light({ sunPos: [40, 70, 30], shadowSize: 60 });
		k.water(500, 0x1d6c9c, { seg: 70, amp: 0.28, opacity: 0.9 });
		k.ground(500, 0xc8b07a, { y: -14, bump: 1.4, seg: 30 });
		for (let i = 0; i < 18; i++) k.ico(0.6 + (i % 4) * 0.5, 0x6d6a5a, { x: Math.sin(i * 7) * 30, y: -13.5, z: Math.cos(i * 3) * 30 });
		// The swimmer, kicking at the surface.
		const sw = k.person({ x: 0, y: -0.3, z: 0, rx: -PI / 2 + 0.15, pose: "swim", colors: { shirt: 0xd8d0c8, legs: 0xe0b48f, skin: 0xe8b996, hair: 0xd8b060 }, dress: 0xd8d0c8 });
		k.tick((t) => {
			sw.userData.limbs.legL.rotation.x = 0.5 * Math.sin(t * 7);
			sw.userData.limbs.legR.rotation.x = -0.5 * Math.sin(t * 7);
			sw.userData.limbs.armL.rotation.x = -2.6 + 0.6 * Math.sin(t * 2);
		});
		// Yellow barrels.
		const barrels = [k.cyl(0.55, 0.55, 1.3, 0xf2c230, { x: 7, y: 0, z: -5, rz: 1.3, from: 1 }), k.cyl(0.55, 0.55, 1.3, 0xf2c230, { x: 9, y: 0, z: -3, rz: 1.5, ry: 0.6, from: 1 })];
		k.tick((t) => barrels.forEach((b, i) => (b.position.y = 0.15 * Math.sin(t * 1.5 + i))));
		// The fin, circling.
		const fin = k.cone(1.1, 2.2, 0x56616b, { seg: 3, s: [0.25, 1, 1], from: 2 });
		const body = k.capsule(1.1, 5.5, 0x4c5660, { s: [0.8, 0.7, 1], rx: PI / 2, from: 1 });
		k.tick((t) => {
			const a = t * 0.35;
			fin.position.set(Math.cos(a) * 9, 0.8, Math.sin(a) * 9);
			fin.rotation.y = -a;
			body.position.set(Math.cos(a - 0.05) * 9, -3.2, Math.sin(a - 0.05) * 9);
			body.rotation.set(PI / 2, 0, -a);
		});
		// The boat.
		const boat = k.group({ x: 25, y: 0, z: -20, ry: 0.3, from: 3 });
		k.box(10, 2, 3.4, 0xf3efe6, { y: 0.7, parent: boat });
		k.box(10.05, 0.3, 3.45, 0x24527a, { y: 0.3, parent: boat });
		k.box(3.5, 2.2, 2.6, 0xe9e2d0, { x: 0.8, y: 2.7, parent: boat });
		k.box(3.7, 0.15, 2.9, 0x3a6a50, { x: 0.8, y: 3.85, parent: boat });
		k.cyl(0.08, 0.1, 9, 0x8a7a60, { x: 1, y: 6.5, parent: boat });
		k.cyl(0.6, 0.6, 0.6, 0xe9e2d0, { x: 1, y: 9.2, parent: boat, open: true });
		k.box(5, 0.12, 0.5, 0x8a7a60, { x: 6.5, y: 1.9, parent: boat });
		k.person({ x: -2, y: 1.7, z: 0.6, ry: -PI / 2, s: 0.95, colors: { shirt: 0x3b4a6a, legs: 0x34302a }, parent: boat });
		k.person({ x: -3, y: 1.7, z: -0.6, ry: -PI / 2, s: 0.95, colors: { shirt: 0x9a7b4a, legs: 0x2a2f45 }, hat: 0x3a3020, parent: boat });
		// The beach, full of tourists.
		k.ground(220, 0xe3cf9a, { y: 0.6, z: -175, bump: 0.6, from: 4, seg: 20, height: (x, z) => Math.max(-2, z * 0.02) });
		const colors = [0xd23b3b, 0x2f74c0, 0xf2c230, 0x3ba55c, 0xffffff];
		for (let i = 0; i < 26; i++) {
			const x = -60 + ((i * 37) % 120);
			const z = -78 - ((i * 13) % 22);
			k.cyl(0.05, 0.05, 2.4, 0xdddddd, { x, y: 1.6, z, from: 4 });
			k.cone(1.4, 0.7, colors[i % colors.length], { x, y: 2.9, z, seg: 8, from: 4 });
			k.person({ x: x + 1.5, y: 0.6, z: z + 1, ry: (i * 1.7) % 6, s: 0.9, colors: { shirt: colors[(i + 2) % 5], legs: colors[(i + 3) % 5] }, from: 4 });
		}
		const tower = k.group({ x: 12, y: 0.6, z: -76, from: 4 });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.15, 3, 0.15, 0xf0f0f0, { x: sx * 0.9, y: 1.5, z: sz * 0.9, parent: tower })));
		k.box(2.4, 1.4, 2.4, 0xd23b3b, { y: 3.6, parent: tower });
		// The shark comes up at the stern.
		const shark = k.group({ x: 17.8, y: 0.4, z: -17.6, ry: 0.3, rz: 0.55, from: 5 });
		k.capsule(1.6, 6, 0x56616b, { rz: PI / 2, x: -3, s: [1, 1, 0.85], parent: shark });
		k.cone(1.6, 3, 0x56616b, { rz: -PI / 2, x: 1.4, y: 0.5, s: [1, 1, 0.9], parent: shark });
		k.box(2.6, 0.4, 2.4, 0xe8e2dc, { x: 1.2, y: -0.6, rz: -0.35, parent: shark });
		k.box(2.2, 0.8, 2.2, 0x6b1c22, { x: 1.0, y: -0.1, parent: shark });
		for (let i = 0; i < 7; i++) {
			k.cone(0.12, 0.45, 0xffffff, { x: 0.2 + i * 0.32, y: 0.35, z: 0.9, rx: PI, seg: 4, parent: shark });
			k.cone(0.12, 0.45, 0xffffff, { x: 0.2 + i * 0.32, y: -0.45, z: 0.9, seg: 4, parent: shark });
		}
		k.sphere(0.18, 0x050505, { x: 0.3, y: 0.9, z: 1.1, parent: shark });
		return {
			shots: [
				{ pos: [1.5, -10, 5], look: [0, 0, 0], fov: 50, fog: [0x0b4466, 1, 40] },
				{ pos: [-5, -7, 16], look: [3, -2, -2], fov: 55, fog: [0x0b4466, 1, 55] },
				{ pos: [-10, 1.3, 12], look: [2, 0.4, 0], fov: 38 },
				{ pos: [38, 7, 2], look: [24, 2, -20], fov: 42 },
				{ pos: [6, 45, 30], look: [0, 0, -70], fov: 50 },
				{ pos: [26, 5, -9], look: [19, 2, -18.5], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the dinosaurs
	r02: (k) => {
		k.fog(0x1a262e, 10, 110);
		k.sky(0x1a2a36, 0x2e4048);
		k.light({ sky: 0x8aa8c0, ground: 0x1a2420, hemi: 1.1, sunColor: 0xa8c8e8, sunIntensity: 1.2, sunPos: [-20, 40, 30] });
		k.ground(300, 0x1d2a1a, { bump: 0.5 });
		k.particles(2500, 0x9fb8c8, { box: [60, 30, 60], y: 0, speed: 22, size: 0.06, opacity: 0.5 });
		// The car, its dashboard, and the cup.
		const car = k.group({ x: 0, y: 0, z: 0 });
		k.box(2.2, 1.0, 4.6, 0xb22a22, { y: 0.9, parent: car });
		k.box(2.21, 0.35, 4.61, 0x2f7a3a, { y: 0.6, parent: car });
		// An open cabin: roof on four pillars, so the camera can sit inside.
		k.box(2.1, 0.1, 2.5, 0xd8c84a, { y: 2.6, z: -0.3, parent: car });
		[-1, 1].forEach((x) => [-1.5, 0.9].forEach((z) => k.box(0.08, 1.2, 0.08, 0xd8c84a, { x: x * 1.0, y: 2.0, z, parent: car })));
		[-1, 1].forEach((x) => k.box(0.05, 0.3, 1.6, 0x222222, { x: x * 0.5, y: 1.55, z: -0.9, parent: car }));
		// Headlights towards the fence.
		[-0.7, 0.7].forEach((x) => {
			k.glow(0xfff4d0, 0.6, { x, y: 1.0, z: 2.32, parent: car });
			k.spot(0xfff0d0, 40, { x, y: 1.2, z: 2.4, target: [x * 3, 4, 16], angle: 0.5, distance: 40 });
		});
		k.box(1.9, 0.75, 0.05, 0x8ab0c0, { y: 1.85, z: 0.92, rx: -0.25, opacity: 0.25, parent: car });
		k.box(1.9, 0.3, 0.6, 0x1a1a1a, { y: 1.45, z: 0.6, parent: car });
		[-0.9, 0.9].forEach((x) => [-1.4, 1.5].forEach((z) => k.cyl(0.42, 0.42, 0.3, 0x111111, { x: x * 1.15, y: 0.42, z, rz: PI / 2, parent: car })));
		k.cyl(0.11, 0.09, 0.22, 0xe8eef0, { x: 0.45, y: 1.71, z: 0.55, opacity: 0.55, rough: 0.1, parent: car });
		const water = k.cyl(0.1, 0.1, 0.005, 0x7aa0b8, { x: 0.45, y: 1.79, z: 0.55, rough: 0.05, metal: 0.6, parent: car });
		const rings = [0, 1, 2].map(() => k.torus(0.05, 0.004, 0xd0e8ff, { x: 0.45, y: 1.795, z: 0.55, rx: PI / 2, parent: car, shadow: false }));
		k.tick((t) => rings.forEach((r, i) => {
			const p = ((t * 0.7 + i / 3) % 1);
			r.scale.setScalar(0.2 + p * 1.6);
			r.material.opacity = 1 - p;
			r.material.transparent = true;
		}));
		void water;
		k.point(0xffe0a0, 1.2, 4, { x: 0.3, y: 2.2, z: 0.3 });
		// The fence.
		for (let i = -6; i <= 6; i++) {
			k.box(0.4, 9, 0.4, 0x5a5a55, { x: i * 4, y: 4.5, z: 12 });
			if (i < 6) for (let w = 0; w < 7; w++) k.box(4, 0.04, 0.04, 0x8a8a80, { x: i * 4 + 2, y: 1 + w * 1.2, z: 12, shadow: false });
		}
		k.box(1.2, 0.8, 0.05, 0xf2c230, { x: 2, y: 3.4, z: 11.75, from: 1 });
		k.box(0.5, 0.5, 0.06, 0x111111, { x: 2, y: 3.4, z: 11.72, rz: PI / 4, from: 1 });
		// The gate: two log pillars, torches, an arch.
		const gate = k.group({ x: -30, z: -25, ry: 0.5 });
		[-6, 6].forEach((x) => {
			k.cyl(1.2, 1.4, 16, 0x5a4028, { x, y: 8, parent: gate, seg: 8 });
			k.cyl(0.25, 0.15, 1, 0x3a2a18, { x: x * 0.85, y: 9, z: 1.3, parent: gate });
			k.glow(0xff9a30, 3, { x: x * 0.85, y: 10, z: 1.4, parent: gate });
			k.point(0xff8a30, 6, 18, { x: x * 0.85, y: 10, z: 2, parent: gate });
		});
		k.box(16, 2.4, 1.4, 0x4a3420, { y: 16, parent: gate });
		k.cyl(1.6, 1.6, 0.3, 0xf2c230, { y: 16, z: 0.8, rx: PI / 2, parent: gate, seg: 24 });
		k.cyl(1.25, 1.25, 0.32, 0xc0282a, { y: 16, z: 0.82, rx: PI / 2, parent: gate, seg: 24 });
		k.box(0.25, 1.6, 0.34, 0x111111, { y: 16.1, z: 0.85, rz: 0.4, parent: gate });
		trees(k, 90, [-90, 90, -90, 70], { avoid: (x, z) => (Math.abs(x) < 14 && z > -14 && z < 30) || Math.hypot(x + 30, z + 25) < 14 });
		// The tyrannosaur.
		const rex = k.group({ x: 3, y: 0, z: 18, ry: PI + 0.3, from: 4 });
		const skin = 0x5a5440;
		[-1, 1].forEach((s) => {
			k.box(1.2, 4, 1.6, skin, { x: s * 1.2, y: 2.6, z: -0.6, rx: 0.2, parent: rex });
			k.box(1.4, 0.4, 2, skin, { x: s * 1.2, y: 0.2, z: 0.1, parent: rex });
			k.box(0.25, 1.1, 0.25, skin, { x: s * 0.7, y: 5.4, z: 2.2, rx: -0.8, parent: rex });
		});
		k.capsule(2.2, 4, skin, { y: 6, z: 0, rx: PI / 2 - 0.3, parent: rex });
		k.cone(1.8, 9, skin, { y: 5.4, z: -6.5, rx: -PI / 2 + 0.15, seg: 8, parent: rex });
		const head = k.group({ y: 8.4, z: 3.4, rx: -0.25, parent: rex });
		k.box(2.2, 1.6, 3.6, skin, { z: 0.8, parent: head });
		const jaw = k.box(1.9, 0.5, 3.2, skin, { y: -1.1, z: 0.8, rx: 0.45, parent: head });
		k.box(1.9, 0.7, 3.0, 0x6a1a1a, { y: -0.7, z: 0.9, rx: 0.2, parent: head });
		[-0.75, 0.75].forEach((x) => k.sphere(0.16, 0xd8a020, { x, y: 0.45, z: 0.5, parent: head, glow: 0.6, emissive: 0x6a4a00 }));
		for (let i = 0; i < 6; i++) [-0.9, 0.9].forEach((x) => k.cone(0.08, 0.35, 0xf0e8d0, { x, y: -0.9, z: 1.8 - i * 0.4 + 0.6, rx: PI, seg: 4, parent: head }));
		k.tick((t) => {
			head.rotation.x = -0.25 - 0.12 * Math.max(0, Math.sin(t * 0.8));
			jaw.rotation.x = 0.45 + 0.25 * Math.max(0, Math.sin(t * 0.8));
		});
		// Lightning.
		const flash = k.point(0xc8d8ff, 0, 400, { x: 0, y: 80, z: 30 });
		k.tick((t) => (flash.intensity = Math.sin(t * 0.9) > 0.97 ? 80 : 0));
		return {
			shots: [
				{ pos: [0.62, 1.95, 0.25], look: [0.45, 1.76, 0.55], fov: 35 },
				{ pos: [-0.3, 2.15, -1.3], look: [0.35, 1.8, 2.4], fov: 55 },
				{ pos: [-0.2, 2.3, 0.2], look: [1.5, 3, 12], fov: 50 },
				{ pos: [-18, 3, -5], look: [-30, 10, -25], fov: 50 },
				{ pos: [-2, 2, -6], look: [3, 6, 16], fov: 50 },
				{ pos: [7, 3.5, 3], look: [3, 8.5, 14], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the monolith
	r03: (k) => {
		k.fog(0xd99b62, 60, 500);
		k.sky(0x5a7ab8, 0xf2b070, { offset: -0.05 });
		k.light({ sky: 0xffd0a0, ground: 0x6a4020, sunColor: 0xffb070, sunIntensity: 2.5, sunPos: [0, 10, -60], shadowSize: 50 });
		k.ground(500, 0xb07848, { bump: 1.6, seg: 50, height: (x, z) => (Math.abs(x) > 40 ? (Math.abs(x) - 40) * 0.3 : 0) });
		const r = rng(5);
		for (let i = 0; i < 40; i++) k.ico(1 + r() * 4, 0x8a5a38, { x: (r() - 0.5) * 160, y: 0.5, z: (r() - 0.5) * 160 - 20, ry: r() * 6 });
		// Bones, apes, and the bone in the air.
		const boneMat = 0xeee6d2;
		for (let i = 0; i < 9; i++) k.capsule(0.12, 1 + r(), boneMat, { x: 4 + r() * 4, y: 0.2, z: 3 + r() * 3, rz: PI / 2, ry: r() * 6 });
		k.sphere(0.7, boneMat, { x: 6, y: 0.5, z: 5, s: [1, 0.8, 1.2] });
		const ape = k.person({ x: 5, y: 0, z: 2, ry: 0.3, pose: "raise", colors: { shirt: 0x3a2a1c, legs: 0x3a2a1c, skin: 0x2a1c12, hair: 0x2a1c12 }, sleeves: 0x3a2a1c, from: 1 });
		k.capsule(0.08, 0.9, boneMat, { x: 0.35, y: 2.9, z: 0, parent: ape });
		[-3, -1.5, 9].forEach((x, i) => k.person({ x, y: 0, z: 6 + i, ry: 2 + i, pose: "hunch", s: 0.85, colors: { shirt: 0x3a2a1c, legs: 0x3a2a1c, skin: 0x2a1c12, hair: 0x2a1c12 }, from: 1 }));
		const flying = k.group({ x: 0, y: 30, z: 0 });
		k.capsule(0.2, 2.2, boneMat, { rz: PI / 2, parent: flying });
		[-1.4, 1.4].forEach((x) => k.sphere(0.32, boneMat, { x, parent: flying, s: [1, 1, 1.4] }));
		k.tick((t) => {
			flying.rotation.z = t * 2.2;
			flying.rotation.y = t * 0.4;
		});
		// The monolith with the sun rising over it.
		k.box(1.2, 9, 3.4, 0x050505, { x: 0, y: 4.5, z: -14, rough: 0.2, metal: 0.4, from: 3 });
		k.glow(0xffd8a0, 30, { x: 0, y: 14, z: -120 });
		k.disc(0xfff4e0, 6, { x: 0, y: 14, z: -125 });
		k.disc(0xd8d8e0, 4, { x: 0, y: 22, z: -125 });
		// Space: Earth, the wheel, and the eye.
		const space = k.group({ x: 0, y: 400, z: 0 });
		k.stars(2500, { y: 400, upper: false, r: 600 });
		k.sphere(30, 0x2a5ab0, { x: -20, y: -50, z: -120, seg: 32, rings: 24, parent: space, rough: 0.6 });
		k.sphere(30.6, 0xffffff, { x: -20, y: -50, z: -120, seg: 24, rings: 16, opacity: 0.25, parent: space });
		const wheel = k.group({ x: 5, y: 8, z: -30, rx: 0.9, parent: space, from: 2 });
		k.torus(12, 1.2, 0xe8e8ec, { parent: wheel, seg: 48 });
		k.torus(12.5, 0.25, 0x9a9aa0, { parent: wheel, seg: 48 });
		for (let i = 0; i < 4; i++) k.cyl(0.4, 0.4, 24, 0xd0d0d8, { rz: (i * PI) / 4, parent: wheel });
		k.cyl(2, 2, 3, 0xd8d8e0, { rx: PI / 2, parent: wheel });
		k.tick((t) => (wheel.rotation.z = t * 0.08));
		k.point(0xffffff, 3, 300, { x: 80, y: 60, z: 40, parent: space });
		// The red eye.
		const eye = k.group({ x: -60, y: 0, z: 0, parent: space, from: 4 });
		k.box(3, 6, 0.4, 0x2a2a2e, { parent: eye, metal: 0.6, rough: 0.3 });
		k.cyl(1, 1, 0.3, 0x9a9aa0, { rx: PI / 2, z: 0.25, parent: eye, metal: 0.8, rough: 0.2, seg: 32 });
		k.cyl(0.8, 0.8, 0.32, 0x100000, { rx: PI / 2, z: 0.26, parent: eye, seg: 32, rough: 0.05 });
		k.glow(0xff1a00, 1.6, { z: 0.6, parent: eye });
		k.glow(0xffd040, 0.35, { z: 0.65, parent: eye });
		k.point(0xff2000, 3, 8, { z: 2, parent: eye });
		// The child.
		const child = k.group({ x: 40, y: -20, z: -60, parent: space, from: 5 });
		k.sphere(9, 0xffeedd, { parent: child, opacity: 0.25, emissive: 0x806040, seg: 24 });
		k.sphere(4, 0xf2c8a8, { y: 1, parent: child, emissive: 0x402010 });
		k.capsule(2.6, 3, 0xf2c8a8, { y: -3, rz: 0.8, parent: child, emissive: 0x402010 });
		k.glow(0xffe0c0, 26, { parent: child, opacity: 0.6 });
		return {
			shots: [
				{ pos: [0, 26, 9], look: [0, 30, 0], fov: 35, hide: ["stars"] },
				{ pos: [8, 2.2, 13], look: [4, 1.6, 2], fov: 45, hide: ["stars"] },
				{ pos: [-20, 420, 30], look: [5, 405, -30], fov: 45, fog: [0x000006, 900, 3000] },
				{ pos: [0.4, 1, 0], look: [0, 12, -40], fov: 50, hide: ["stars"] },
				{ pos: [-60, 400, 8], look: [-60, 400, 0], fov: 35, fog: [0x000000, 1, 60] },
				{ pos: [15, 395, 60], look: [20, 380, -60], fov: 55, fog: [0x000006, 900, 3000] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the code rain
	r04: (k) => {
		k.fog(0x0b120e, 30, 220);
		k.sky(0x3a4a44, 0x8a9a92);
		k.light({ sky: 0xb0d8c0, ground: 0x202820, hemi: 1.0, sunColor: 0xd8ffe8, sunIntensity: 1.1, sunPos: [-30, 60, 20], shadowSize: 30 });
		// Digital rain on columns of glyph strips.
		const glyphs = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789Z:.=*+-<>¦";
		const tex = k.canvas(64, 1024, (g, w, h) => {
			g.fillStyle = "#000";
			g.fillRect(0, 0, w, h);
			g.font = "bold 40px monospace";
			g.textAlign = "center";
			for (let i = 0; i < 24; i++) {
				const fade = i / 24;
				g.fillStyle = i === 23 ? "#e8ffe8" : `rgba(40,255,90,${0.15 + fade * 0.85})`;
				g.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], 32, 40 + i * 42);
			}
		});
		tex.wrapT = k.THREE.RepeatWrapping;
		const rainMat = new k.THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: k.THREE.AdditiveBlending, depthWrite: false, fog: false });
		const r = rng(11);
		const strips = [];
		for (let i = 0; i < 140; i++) {
			const m = rainMat.clone();
			m.map = tex.clone();
			m.map.needsUpdate = true;
			m.map.offset.y = r();
			const strip = k.mesh(new k.THREE.PlaneGeometry(0.6, 10), m, { x: -300 + (r() - 0.5) * 30, y: 200 + (r() - 0.5) * 14, z: (r() - 0.5) * 30 - 5, ry: (r() - 0.5) * 0.2, shadow: false });
			strip.userData.speed = 0.15 + r() * 0.4;
			strips.push(strip);
		}
		k.tick((t, dt) => strips.forEach((s) => (s.material.map.offset.y += s.userData.speed * dt)));
		// The rooftop.
		k.box(40, 1, 40, 0x6a6e68, { y: -0.5 });
		k.box(40, 1.4, 0.6, 0x5a5e58, { y: 0.7, z: -20 });
		k.box(0.6, 1.4, 40, 0x5a5e58, { x: 20, y: 0.7 });
		k.box(4, 3, 4, 0x7a7e78, { x: -12, y: 1.5, z: -12 });
		k.cyl(2, 2, 3, 0x5a4a3a, { x: 12, y: 6, z: -14 });
		k.cone(2.3, 1.5, 0x4a3a2a, { x: 12, y: 8.2, z: -14 });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.2, 4.5, 0.2, 0x3a3a3a, { x: 12 + sx * 1.6, y: 2.25, z: -14 + sz * 1.6 })));
		city(k, 70, [-120, 120, -160, -30], { h: 50, colors: [0x6a746e, 0x5a645e, 0x7a847e], windows: 0x9adab0, seed: 21, avoid: () => false });
		k.box(260, 1, 260, 0x3a403c, { y: -30 });
		// The hero, bending back.
		const neo = k.person({ x: 0, y: 0, z: 0, ry: 0, pose: "lean", coat: 0x0a0a0a, colors: { shirt: 0x0a0a0a, legs: 0x0a0a0a, skin: 0xd8c0a8, hair: 0x0a0a0a }, shades: true, from: 2 });
		k.tick((t) => (neo.userData.limbs.armL.rotation.x = -0.4 + Math.sin(t * 0.8) * 0.2));
		// Bullets with ripples, crawling.
		const bullets = [];
		for (let i = 0; i < 4; i++) {
			const b = k.group({ from: 3 });
			k.capsule(0.07, 0.2, 0xd8b060, { rx: PI / 2, metal: 0.9, rough: 0.2, parent: b, emissive: 0x302000 });
			for (let j = 0; j < 4; j++) k.torus(0.14 + j * 0.07, 0.012, 0xddeeff, { z: -0.2 - j * 0.25, opacity: 0.45 - j * 0.1, parent: b, shadow: false });
			bullets.push(b);
		}
		k.tick((t) => bullets.forEach((b, i) => b.position.set(-0.4 + i * 0.25, 1.4 + i * 0.12, 6 - ((t * 0.25 + i * 0.6) % 5))));
		k.person({ x: 0.5, y: 0, z: 12, ry: PI, pose: "point", colors: { shirt: 0x1a1c22, legs: 0x1a1c22, skin: 0xd8b898, hair: 0x2a2018 }, shades: true, from: 4 });
		// The choice.
		const hand = k.group({ x: 300, y: 0, z: 0, from: 5 });
		k.box(30, 30, 30, 0x0a0a0a, { y: 0, parent: hand });
		k.capsule(0.12, 0.25, 0xd81a1a, { x: -0.5, y: 15.2, z: 0, rz: 0.4, parent: hand, rough: 0.2, emissive: 0x300000 });
		k.capsule(0.12, 0.25, 0x1a40e0, { x: 0.5, y: 15.2, z: 0, rz: -0.3, parent: hand, rough: 0.2, emissive: 0x000830 });
		k.spot(0xffffff, 40, { x: 300, y: 22, z: 2, target: [300, 15, 0], angle: 0.4 });
		return {
			shots: [
				{ pos: [-300, 200, 14], look: [-300, 200, 0], fov: 45, fog: [0x000000, 1, 60] },
				{ pos: [-10, 1.7, 14], look: [0, 3, -10], fov: 50 },
				{ pos: [5, 1.3, 0.3], look: [0, 1.0, -0.2], fov: 45 },
				{ pos: [5, 0.8, 4], look: [0, 1, 2], fov: 55 },
				{ pos: [-6, 4, 18], look: [0, 1.2, 4], fov: 50 },
				{ pos: [300, 17, 3], look: [300, 15.2, 0], fov: 40, fog: [0x050505, 1, 40] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the ship
	r05: (k) => {
		k.fog(0xe89a6a, 80, 600);
		k.sky(0x5a6ab0, 0xffb070, { offset: -0.04 });
		k.light({ sky: 0xffc8a0, ground: 0x203040, hemi: 1.0, sunColor: 0xffa060, sunIntensity: 2.6, sunPos: [-10, 12, 80], shadowSize: 60 });
		k.water(800, 0x284a6a, { seg: 70, amp: 0.4 });
		k.glow(0xffb060, 80, { x: 0, y: 25, z: 380, tag: "sky" });
		// The ship, heading +z: hull, decks, four funnels.
		const ship = k.group({ x: 0, y: 0, z: 0 });
		const L = 60;
		k.box(7, 8, L, 0x111111, { y: 1, parent: ship });
		k.box(7.05, 2.4, L, 0xf0ece0, { y: 6.2, parent: ship });
		k.box(7.06, 0.6, L, 0x8a2020, { y: -2.8, parent: ship });
		// The bow: a triangular prism with a flat foredeck, tip at z = L/2 + 15.
		k.cyl(10, 10, 8, 0x111111, { y: 1, z: L / 2 + 5, seg: 3, s: [0.404, 1, 1], parent: ship });
		k.cyl(10, 10, 0.6, 0x8a2020, { y: -2.8, z: L / 2 + 5, seg: 3, s: [0.41, 1, 1.01], parent: ship });
		k.cyl(9.6, 9.6, 0.2, 0xb89a70, { y: 5.05, z: L / 2 + 5, seg: 3, s: [0.4, 1, 1], parent: ship });
		k.box(6, 2.5, L * 0.7, 0xf0ece0, { y: 8.6, z: -2, parent: ship });
		for (let i = 0; i < 4; i++) {
			const z = 14 - i * 10;
			k.cyl(1.4, 1.5, 9, 0xe8a640, { y: 14, z, rx: -0.12, parent: ship, seg: 14 });
			k.cyl(1.42, 1.42, 1.8, 0x111111, { y: 18.6, z: z - 0.55, rx: -0.12, parent: ship, seg: 14 });
		}
		for (let i = 0; i < 50; i++) k.glow(0xffe0a0, 0.6, { x: 3.6, y: 3 + (i % 2) * 2, z: -28 + i * 1.15, parent: ship, opacity: 0.7 });
		k.cyl(0.15, 0.15, 20, 0x3a3a3a, { y: 16, z: 26, parent: ship });
		// Bow railing with the two at its tip.
		for (let i = 0; i < 14; i++) [-1, 1].forEach((s) => k.box(0.08, 1, 0.08, 0xdddddd, { x: s * ((3.5 * (15 - i)) / 15 - 0.15), y: 5.6, z: L / 2 + i, parent: ship }));
		[-1, 1].forEach((s) => k.box(0.07, 0.07, 15.4, 0xdddddd, { x: s * 1.6, y: 6.1, z: L / 2 + 7.5, ry: -s * 0.229, parent: ship }));
		const her = k.person({ x: 0, y: 5.15, z: 37.2, pose: "arms-out", dress: 0x2a2a44, colors: { shirt: 0x2a2a44, skin: 0xf0c8a8, hair: 0x9a3a1a }, parent: ship, from: 4 });
		const him = k.person({ x: 0, y: 5.15, z: 36.8, colors: { shirt: 0xe8e0d0, legs: 0x5a4a38, hair: 0xc8a050 }, parent: ship, from: 4 });
		him.userData.limbs.armL.rotation.set(-1.2, 0, 0.5);
		him.userData.limbs.armR.rotation.set(-1.2, 0, -0.5);
		void her;
		// The iceberg.
		const berg = k.group({ x: 30, y: 0, z: 140 });
		const r = rng(2);
		for (let i = 0; i < 9; i++) k.ico(6 + r() * 9, 0xf4faff, { x: (r() - 0.5) * 16, y: r() * 12, z: (r() - 0.5) * 14, ry: r() * 6, rough: 0.4, emissive: 0x5a7a96, glow: 0.6, parent: berg, s: [1, 1.4, 1] });
		// The wreck on the seabed, and the necklace.
		const deep = k.group({ x: 0, y: -400, z: 0 });
		k.ground(200, 0x2a2a24, { parent: deep, bump: 1.4 });
		const wreck = k.group({ y: 2, rz: 0.15, rx: -0.1, parent: deep });
		k.box(7, 8, 30, 0x4a3020, { y: 2, parent: wreck, rough: 1 });
		k.cone(3.5, 14, 0x4a3020, { y: 2, z: 21.8, rx: PI / 2, ry: PI / 4, seg: 4, parent: wreck });
		for (let i = 0; i < 12; i++) [-1, 1].forEach((s) => k.box(0.1, 1, 0.1, 0x6a3a1a, { x: s * (3.2 - i * 0.24), y: 6.5, z: 15 + i * 0.5, rz: (r() - 0.5) * 0.6, parent: wreck }));
		k.particles(600, 0xc8d8c8, { box: [40, 30, 40], y: -400, speed: 0.3, size: 0.08, opacity: 0.5, drift: 0.3 });
		k.spot(0xcfe8ff, 80, { x: -6, y: -380, z: 40, target: [0, -394, 20], angle: 0.35, distance: 90 });
		const heart = new k.THREE.Shape();
		heart.moveTo(0, -0.5);
		heart.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.35);
		heart.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
		const gem = k.mesh(new k.THREE.ExtrudeGeometry(heart, { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 }), new k.THREE.MeshStandardMaterial({ color: 0x1a50ff, emissive: 0x0a2080, roughness: 0.05, metalness: 0.3, flatShading: true }), { x: 200, y: -399.6, z: 0, rx: -PI / 2 + 0.3, from: 1 });
		k.ground(30, 0x101018, { x: 200, y: -400, bump: 0.05, from: 1 });
		for (let i = 0; i < 26; i++) k.sphere(0.07, 0xf0f0ff, { x: 200 + Math.cos(i / 4) * 1.2 * (i / 26), y: -399.9, z: -0.8 - i * 0.07, metal: 0.8, rough: 0.2, from: 1 });
		k.spot(0xddeeff, 60, { x: 201, y: -394, z: 2, target: [200, -400, 0], angle: 0.3 });
		k.tick((t) => (gem.rotation.z = Math.sin(t * 0.5) * 0.15));
		return {
			shots: [
				{ pos: [-8, -392, 45], look: [0, -396, 18], fov: 50, fog: [0x061a28, 2, 70] },
				{ pos: [201.4, -398.2, 1.6], look: [200, -399.8, 0], fov: 40, fog: [0x020208, 1, 30] },
				{ pos: [10, 3, 95], look: [30, 8, 140], fov: 45 },
				{ pos: [70, 10, 20], look: [0, 8, 0], fov: 50 },
				{ pos: [0, 7.6, 43], look: [0, 6.6, 35], fov: 50 },
				{ pos: [-16, 9, 62], look: [0, 7, 35], fov: 40 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the desert planet
	r06: (k) => {
		k.fog(0xe8a870, 60, 420);
		k.sky(0x7a90c0, 0xf8c088, { offset: -0.04 });
		k.light({ sky: 0xffd8b0, ground: 0x8a5a30, hemi: 1.1, sunColor: 0xffb070, sunIntensity: 2.2, sunPos: [-40, 18, -80], shadowSize: 60 });
		k.ground(600, 0xd8a868, { bump: 2.4, seg: 60 });
		// The homestead dome and courtyard.
		k.sphere(4, 0xe8d8c0, { x: 0, y: 0, z: 0, s: [1, 0.6, 1], rough: 1, seg: 20 });
		k.box(2, 2.2, 2, 0xd8c8b0, { x: 0, y: 1.2, z: 3.6 });
		k.box(1.2, 1.6, 0.2, 0x2a2018, { x: 0, y: 1, z: 4.6 });
		k.cyl(9, 9, 0.2, 0xc89860, { x: 14, y: -0.2, z: 0, seg: 24 });
		// Vaporators.
		const vap = (x, z, from) => {
			const g = k.group({ x, z, from });
			k.cyl(0.35, 0.45, 5, 0xb8b8b0, { y: 2.5, parent: g, metal: 0.5, rough: 0.5 });
			for (let i = 0; i < 4; i++) k.cyl(0.6, 0.6, 0.18, 0x8a8a84, { y: 1.2 + i * 1, parent: g, metal: 0.5 });
			k.box(0.1, 0.9, 1.4, 0x8a8a84, { y: 4.6, parent: g });
			k.cyl(0.5, 0.5, 0.6, 0x8a8a84, { y: 0.3, parent: g });
		};
		vap(-10, -6, 1);
		vap(-16, 4, 1);
		vap(9, -14, 1);
		// The farm boy on the ridge.
		k.ground(60, 0xc89058, { x: -30, y: 1.5, z: -30, bump: 1, seg: 12, height: (x, z) => Math.max(0, 6 - Math.hypot(x, z) * 0.3) });
		k.person({ x: -30, y: 7.2, z: -30, ry: PI * 0.85, colors: { shirt: 0xf0ece0, legs: 0xe8e0d0, hair: 0xd8b060, skin: 0xe8c0a0 }, from: 2 });
		// Two suns.
		k.glow(0xffe0a0, 50, { x: -140, y: 22, z: -300, from: 3 });
		k.disc(0xfff0d0, 8, { x: -150, y: 22, z: -305, from: 3 });
		k.disc(0xfff8e8, 6, { x: -118, y: 28, z: -305, from: 3 });
		// Space: the battle station and a fighter.
		const space = k.group({ y: 500 });
		k.stars(2000, { y: 500, upper: false, r: 500 });
		k.point(0xffffff, 3, 600, { x: 100, y: 80, z: 100, parent: space });
		const ds = k.group({ x: -30, y: 0, z: -140, parent: space });
		k.sphere(40, 0x7a7c80, { parent: ds, seg: 40, rings: 30, rough: 0.7 });
		k.torus(40.1, 0.6, 0x3a3a40, { rx: PI / 2, parent: ds, seg: 60 });
		k.sphere(9, 0x55575c, { x: 18, y: 18, z: 30, s: [1, 1, 0.35], parent: ds, ry: 0.6, rx: -0.5 });
		const wing = k.group({ x: 0, y: 0, z: 0, ry: 0.3, rz: 0.1, parent: space, from: 4 });
		k.cone(0.5, 7, 0xe8e8ea, { rx: -PI / 2, z: 2, parent: wing, seg: 6 });
		k.cyl(0.6, 0.7, 2.5, 0xe8e8ea, { rx: PI / 2, z: -1.5, parent: wing, seg: 8 });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sy) => {
			k.box(4.5, 0.12, 1.6, 0xd8d8da, { x: sx * 2.6, y: sy * 0.6, z: -1.6, rz: sx * sy * 0.25, parent: wing });
			k.cyl(0.07, 0.07, 3.5, 0xa0a0a4, { x: sx * 4.8, y: sy * 1.15, z: -0.4, rx: PI / 2, parent: wing });
			k.cyl(0.3, 0.3, 1.1, 0xb0b0b4, { x: sx * 1.2, y: sy * 0.75, z: -2.6, rx: PI / 2, parent: wing });
			k.glow(0xff8050, 1.2, { x: sx * 1.2, y: sy * 0.75, z: -3.3, parent: wing });
		}));
		k.box(1, 0.2, 0.6, 0xc03030, { x: 3.5, y: 0.7, z: -1.6, rz: 0.25, parent: wing });
		k.tick((t) => (wing.position.y = Math.sin(t) * 0.3));
		// A blade of light.
		const saber = k.group({ x: 200, y: 0, z: 0, rz: 0.6, from: 5 });
		k.cyl(0.18, 0.2, 1.2, 0x9a9aa0, { parent: saber, metal: 0.9, rough: 0.2 });
		k.cyl(0.1, 0.1, 4.5, 0xe8f4ff, { y: 2.85, parent: saber, emissive: 0x80c0ff, glow: 2 });
		for (let i = 0; i < 6; i++) k.glow(0x3a8aff, 1.6, { y: 1 + i * 0.85, parent: saber });
		k.point(0x4a9aff, 8, 12, { y: 3, z: 1, parent: saber });
		return {
			shots: [
				{ pos: [-6, 2, 9], look: [0, 1.5, 0], fov: 40, hide: ["stars"] },
				{ pos: [-2, 3, 14], look: [-12, 2.5, -2], fov: 45, hide: ["stars"] },
				{ pos: [-24, 8.5, -20], look: [-30, 8, -30], fov: 45, hide: ["stars"] },
				{ pos: [-18, 7, -12], look: [-90, 18, -250], fov: 45, hide: ["stars"] },
				{ pos: [12, 500, 18], look: [0, 500, 0], fov: 45, fog: [0x000006, 900, 3000] },
				{ pos: [203, 3, 6], look: [200.5, 2.5, 0], fov: 40, fog: [0x020208, 1, 40] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the visitor
	r07: (k) => {
		k.fog(0x0a1426, 10, 220);
		k.sky(0x08101e, 0x1a2a48);
		k.stars(1500);
		k.light({ sky: 0x5a7ab0, ground: 0x0a0c10, hemi: 0.7, sunColor: 0xb8d0ff, sunIntensity: 0.9, sunPos: [0, 40, -100], shadowSize: 50 });
		k.ground(400, 0x1a2a1a, { bump: 1.2, seg: 50 });
		trees(k, 120, [-90, 90, -100, 60], { color: 0x10241a, h: 9, avoid: (x, z) => Math.abs(x) < 8 && z > -20 });
		// A trail of candy.
		const candy = [0xe86a1a, 0xf2c230, 0x5a2a12];
		for (let i = 0; i < 16; i++) k.cyl(0.09, 0.09, 0.05, candy[i % 3], { x: Math.sin(i * 0.6) * 0.8, y: 0.12, z: 6 - i * 0.55, rx: 0.2 * (i % 2) });
		// The shed and its light.
		const shed = k.group({ x: 10, z: -20, ry: -0.5, from: 1 });
		k.box(5, 3.2, 4, 0x5a4030, { y: 1.6, parent: shed });
		k.box(5.4, 0.3, 4.6, 0x3a2a20, { y: 3.4, rz: 0.15, parent: shed });
		k.box(1.4, 2.4, 0.1, 0xffd890, { y: 1.2, z: 2.02, parent: shed, emissive: 0xffb050, glow: 1.2 });
		k.spot(0xffd8a0, 30, { x: 10, y: 2.5, z: -17, target: [6, 0, -8], angle: 0.5, distance: 30 });
		// Flashlights in the fog.
		for (let i = 0; i < 4; i++) {
			const x = -12 + i * 7;
			k.person({ x, y: 0, z: -40, ry: 0.2 * i, s: 1, colors: { shirt: 0x2a2a30, legs: 0x1a1a20 }, from: 2 });
			k.spot(0xe8f0ff, 25, { x, y: 1.5, z: -39.5, target: [x + 2, 0, -20], angle: 0.18, distance: 40, from: 2 });
			k.glow(0xe8f0ff, 1.2, { x: x + 0.3, y: 1.5, z: -39.2, from: 2 });
		}
		// The finger.
		const finger = k.group({ x: 300, y: 0, z: 0, from: 3 });
		k.box(30, 1, 30, 0x0a0a10, { y: -1, parent: finger });
		k.capsule(0.12, 1.6, 0x7a6a58, { x: -0.2, y: 1, rz: 1.1, parent: finger, rough: 1 });
		k.sphere(0.16, 0xffa060, { x: 0.65, y: 1.35, parent: finger, emissive: 0xff7020, glow: 2 });
		k.glow(0xff8030, 1.6, { x: 0.68, y: 1.36, z: 0.05, parent: finger });
		k.point(0xff8040, 2, 6, { x: 0.8, y: 1.4, z: 0.4, parent: finger });
		k.spot(0xc8d0ff, 20, { x: 300.5, y: 5, z: 3, target: [300.6, 1.3, 0], angle: 0.4, from: 3 });
		k.capsule(0.11, 1.3, 0xf0c8a8, { x: 1.85, y: 1.38, rz: PI / 2, parent: finger });
		// The bike with a basket and a white bundle, over a huge moon.
		const bike = k.group({ x: 0, y: 30, z: -60, s: 1.6, from: 4 });
		[-0.8, 0.8].forEach((x) => k.torus(0.5, 0.05, 0x111111, { x, parent: bike }));
		k.box(1.6, 0.06, 0.06, 0x111111, { y: 0.35, rz: 0.2, parent: bike });
		k.box(0.06, 0.8, 0.06, 0x111111, { x: 0.6, y: 0.5, parent: bike });
		k.box(0.5, 0.4, 0.4, 0x8a6a40, { x: 0.85, y: 0.95, parent: bike });
		k.sphere(0.3, 0xf2f2f2, { x: 0.85, y: 1.3, parent: bike, s: [1, 1.2, 1] });
		const rider = k.person({ x: -0.1, y: 0.1, z: 0, ry: PI / 2, s: 0.8, pose: "sit", colors: { shirt: 0xc02020, legs: 0x2a3050 }, parent: bike });
		void rider;
		k.disc(0xf4f1e0, 34, { x: 0, y: 34, z: -100, from: 4 });
		k.glow(0xd8e0ff, 70, { x: 0, y: 34, z: -110, opacity: 0.5, from: 4 });
		k.tick((t) => {
			bike.position.x = -7 + ((t * 1.2) % 14);
			bike.position.y = 32 + Math.sin(t * 0.8) * 0.4;
		});
		return {
			shots: [
				{ pos: [0.6, 1.2, 8.5], look: [0, 0, 2], fov: 40 },
				{ pos: [-2, 1.7, 2], look: [9, 1.6, -19], fov: 45 },
				{ pos: [-2, 2, -10], look: [-2, 1.2, -40], fov: 50 },
				{ pos: [300.6, 1.6, 2.6], look: [300.6, 1.35, 0], fov: 40, fog: [0x050308, 1, 40] },
				{ pos: [0, 30, -38], look: [0, 33, -100], fov: 45 },
				{ pos: [0, 24, -20], look: [0, 33, -100], fov: 30 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the time machine
	r08: (k) => {
		k.fog(0x141a2a, 30, 260);
		k.sky(0x0a0e1e, 0x2a2a48);
		k.stars(800);
		k.light({ sky: 0x8090c0, ground: 0x2a2818, hemi: 1.2, sunColor: 0xa0b0ff, sunIntensity: 1.1, sunPos: [20, 50, 40], shadowSize: 60 });
		k.ground(400, 0x2a3424, { bump: 0.2 });
		// The courthouse and its stopped clock.
		const hall = k.group({ x: 0, z: -40 });
		k.box(30, 12, 12, 0xc8b898, { y: 6, parent: hall });
		for (let i = 0; i < 8; i++) k.cyl(0.5, 0.6, 9, 0xe8e0d0, { x: -10.5 + i * 3, y: 4.5, z: 6.6, parent: hall });
		k.box(31, 1, 13, 0xe8e0d0, { y: 12.4, parent: hall });
		k.box(7, 9, 7, 0xc8b898, { y: 17, parent: hall });
		k.box(5, 4, 5, 0xd8d0c0, { y: 23.5, parent: hall });
		k.cone(3.8, 4, 0x4a5a4a, { y: 27.5, ry: PI / 4, seg: 4, parent: hall });
		const face = k.cyl(2.6, 2.6, 0.3, 0xf2ead0, { y: 17.5, z: 3.6, rx: PI / 2, seg: 32, parent: hall, emissive: 0x605030, glow: 0.4 });
		void face;
		for (let i = 0; i < 12; i++) k.box(0.12, 0.45, 0.05, 0x222222, { x: Math.sin((i * PI) / 6) * 2.2, y: 17.5 + Math.cos((i * PI) / 6) * 2.2, z: 3.8, rz: (-i * PI) / 6, parent: hall });
		const hand = (len, angle, w) => {
			const pivot = k.group({ y: 17.5, z: 3.85, rz: -angle, parent: hall });
			k.box(w, len, 0.06, 0x111111, { y: len / 2, parent: pivot });
		};
		hand(1.3, ((10 + 4 / 60) / 12) * 2 * PI, 0.16);
		hand(2, (4 / 60) * 2 * PI, 0.1);
		// A cable from the tower to a lamppost, and lightning.
		k.cyl(0.04, 0.04, 30, 0x111111, { x: 6, y: 13, z: -22, rx: 1.05, ry: -0.3, from: 2 });
		k.cyl(0.15, 0.2, 7, 0x333333, { x: 8, y: 3.5, z: -8, from: 2 });
		k.glow(0xfff0c0, 2, { x: 8, y: 7.2, z: -8, from: 2 });
		const bolt = k.group({ x: 0, y: 28, z: -38, from: 2 });
		let y = 0;
		for (let i = 0; i < 8; i++) {
			const len = 6;
			k.box(0.35, len, 0.35, 0xe0f0ff, { x: Math.sin(i * 2.3) * 1.5, y: y + len / 2, rz: Math.sin(i * 1.7) * 0.5, parent: bolt, emissive: 0xc0e0ff, glow: 3, shadow: false });
			y += len * 0.9;
		}
		const flash = k.point(0xc0d8ff, 0, 300, { x: 0, y: 40, z: -30, from: 2 });
		k.tick((t) => {
			const on = Math.sin(t * 1.3) > 0.9;
			bolt.visible = on && bolt.userData.from <= 2;
			flash.intensity = on ? 40 : 0;
		});
		// The car: brushed steel wedge, gull-wing doors up.
		const car = k.group({ x: 0, y: 0, z: 30, ry: -0.4, from: 3 });
		const steel = { metal: 0.85, rough: 0.35 };
		k.box(2, 0.8, 4.4, 0xb8bcc0, { y: 0.75, parent: car, ...steel });
		k.box(1.7, 0.6, 1.8, 0xa8acb0, { y: 1.45, z: -0.3, parent: car, ...steel });
		k.box(1.6, 0.5, 0.1, 0x1a2028, { y: 1.45, z: 0.62, rx: -0.6, parent: car });
		[-1, 1].forEach((s) => k.box(0.08, 1.2, 1.6, 0xb8bcc0, { x: s * 1.4, y: 2.1, z: -0.3, rz: s * -0.9, parent: car, ...steel }));
		[-1, 1].forEach((x) => [-1.4, 1.4].forEach((z) => k.cyl(0.38, 0.38, 0.3, 0x111111, { x: x * 1.0, y: 0.38, z, rz: PI / 2, parent: car })));
		k.box(1.8, 0.25, 0.05, 0x1a1a1a, { y: 0.8, z: -2.22, parent: car });
		[-0.6, 0.6].forEach((x) => k.glow(0xff3020, 0.6, { x, y: 0.85, z: -2.25, parent: car }));
		k.box(0.8, 0.5, 0.7, 0x5a5a60, { y: 1.15, z: -1.9, parent: car });
		k.glow(0x60c0ff, 1.4, { y: 1.5, z: -0.6, parent: car });
		k.point(0xd8e4ff, 20, 16, { x: 4, y: 5, z: 34, from: 3 });
		k.point(0x60c0ff, 6, 6, { y: 1.6, z: -0.6, parent: car });
		// Two fire trails on a dark road.
		k.box(14, 0.05, 200, 0x1a1a1c, { x: 60, y: 0.01, z: 0 });
		const fire = [];
		[-0.9, 0.9].forEach((x) => {
			for (let i = 0; i < 30; i++) fire.push(k.glow(i % 3 ? 0xff6a10 : 0xffc040, 1.2, { x: 60 + x, y: 0.35, z: -i * 1.6, from: 4 }));
		});
		k.tick((t) => fire.forEach((f, i) => f.scale.setScalar(0.8 + 0.5 * Math.abs(Math.sin(t * 9 + i)))));
		k.point(0xff6a10, 10, 30, { x: 60, y: 1, z: -15, from: 4 });
		// The car, flying.
		const sky = k.group({ x: 0, y: 60, z: 0, rz: 0.1, from: 5 });
		k.box(2, 0.8, 4.4, 0xb8bcc0, { y: 0.75, parent: sky, ...steel });
		k.box(1.7, 0.6, 1.8, 0xa8acb0, { y: 1.45, z: -0.3, parent: sky, ...steel });
		[-1, 1].forEach((x) => [-1.4, 1.4].forEach((z) => {
			k.cyl(0.38, 0.38, 0.3, 0x111111, { x: x * 1.0, y: 0.3, z, rz: PI / 2 + 0, parent: sky });
			k.glow(0x60c0ff, 0.9, { x: x * 1.0, y: 0.0, z, parent: sky });
		}));
		k.point(0xd8e4ff, 25, 20, { x: 5, y: 65, z: 8, from: 5 });
		k.point(0x60c0ff, 8, 8, { x: 0, y: 58, z: 0, from: 5 });
		k.tick((t) => (sky.position.y = 60 + Math.sin(t) * 0.4));
		return {
			shots: [
				{ pos: [0.8, 17.6, -30], look: [0, 17.5, -36], fov: 35 },
				{ pos: [10, 4, 0], look: [0, 14, -40], fov: 45 },
				{ pos: [16, 3, -2], look: [0, 18, -38], fov: 55 },
				{ pos: [4, 3, 37], look: [0, 1.2, 30], fov: 45 },
				{ pos: [61.5, 1.2, 8], look: [60, 0.3, -20], fov: 50 },
				{ pos: [6, 61, 8], look: [0, 60.5, 0], fov: 45 },
			],
		};
	},
};
