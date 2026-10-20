import { PI, rng, trees, city } from "../kit.js";

// Original film sets, moved out of reels.js.
export const REELS = {
	// ----------------------------------------------------------------------------------------------- the shark
	r01: (k) => {
		k.fog(0x9cc9e3, 40, 300);
		k.sky(0x3f86cf, 0xd8eef8);
		k.light({ sunPos: [40, 70, 30], shadowSize: 60 });
		k.water(500, 0x1d6c9c, { seg: 70, amp: 0.28, opacity: 0.9, tag: "sea" });
		k.ground(500, 0xc8b07a, { y: -14, bump: 1.4, seg: 30 });
		for (let i = 0; i < 18; i++) k.ico(0.6 + (i % 4) * 0.5, 0x6d6a5a, { x: Math.sin(i * 7) * 30, y: -13.5, z: Math.cos(i * 3) * 30 });
		// The swimmer, kicking at the surface.
		const sw = k.person({ x: 0, y: -0.3, z: 0, rx: -PI / 2 + 0.15, pose: "swim", colors: { shirt: 0xd8d0c8, legs: 0xe0b48f, skin: 0xe8b996, hair: 0xd8b060 }, dress: 0xd8d0c8 });
		k.tick((t) => {
			sw.userData.limbs.legL.rotation.x = 0.5 * Math.sin(t * 7);
			sw.userData.limbs.legR.rotation.x = -0.5 * Math.sin(t * 7);
			sw.userData.limbs.armL.rotation.x = -2.6 + 0.6 * Math.sin(t * 2);
		});
		// A bell buoy, far out on its own.
		const buoy = k.group({ x: -40, y: 0, z: 40 });
		k.cyl(1.1, 1.3, 1.2, 0xc8302a, { y: 0.2, parent: buoy, seg: 14 });
		k.cyl(1.32, 1.32, 0.3, 0xf0ece0, { y: 0.55, parent: buoy, seg: 14 });
		[0, 1, 2, 3].forEach((i) => k.box(0.1, 2.6, 0.1, 0x8a2420, { x: Math.cos((i * PI) / 2 + 0.6) * 0.6, y: 2.0, z: Math.sin((i * PI) / 2 + 0.6) * 0.6, parent: buoy }));
		k.box(1.5, 0.12, 1.5, 0x8a2420, { y: 3.3, ry: 0.6, parent: buoy });
		k.cone(0.4, 0.55, 0x8a7a3a, { y: 2.7, parent: buoy, metal: 0.7, rough: 0.35, seg: 12 });
		k.cyl(0.04, 0.04, 0.5, 0x333333, { y: 3.55, parent: buoy });
		k.sphere(0.12, 0xf0f0f0, { x: 0.45, y: 3.45, z: 0.2, parent: buoy, s: [1.4, 0.8, 0.9] });
		k.tick((t) => {
			buoy.position.y = 0.2 * Math.sin(t * 1.1);
			buoy.rotation.z = 0.06 * Math.sin(t * 0.9);
		});
		// A weathered wooden jetty at dusk, far away on its own: planks, pilings, a coil of rope, a bucket.
		const jetty = k.group({ x: -300, y: 0, z: 0 });
		k.water(80, 0x2a5a78, { x: -300, y: -0.6, seg: 30, amp: 0.15 });
		for (let i = 0; i < 14; i++) k.box(0.42, 0.12, 4, i % 3 ? 0x8a7458 : 0x7a644a, { x: -2.8 + i * 0.45, y: 0.6, z: 0, ry: (i % 2) * 0.02, parent: jetty });
		[-3, 3].forEach((x) => [-1.9, 1.9].forEach((z) => k.cyl(0.22, 0.25, 3.6, 0x5a4a38, { x, y: -0.6, z, parent: jetty, seg: 8 })));
		k.box(6.6, 0.18, 0.18, 0x6a5440, { y: 0.45, z: 1.9, parent: jetty });
		k.torus(0.32, 0.07, 0xb8a070, { x: 0.6, y: 0.72, z: 0.5, rx: PI / 2, parent: jetty, seg: 20 });
		k.torus(0.22, 0.07, 0xb8a070, { x: 0.6, y: 0.8, z: 0.5, rx: PI / 2, parent: jetty, seg: 20 });
		k.cyl(0.22, 0.18, 0.4, 0x8a9098, { x: -0.6, y: 0.86, z: -0.6, parent: jetty, metal: 0.6, rough: 0.4, open: true, side: 2 });
		k.cyl(0.08, 0.08, 1.1, 0x5a4a38, { x: 1.6, y: 1.1, z: 1.8, parent: jetty, seg: 8 });
		k.point(0xffc890, 6, 14, { x: -298, y: 3, z: 3 });
		// Yellow barrels by the boat.
		const barrels = [k.cyl(0.55, 0.55, 1.3, 0xf2c230, { x: 17, y: 0, z: -11, rz: 1.3, from: 3 }), k.cyl(0.55, 0.55, 1.3, 0xf2c230, { x: 19.5, y: 0, z: -9, rz: 1.5, ry: 0.6, from: 3 })];
		k.tick((t) => barrels.forEach((b, i) => (b.position.y = 0.15 * Math.sin(t * 1.5 + i))));
		// The fin, circling.
		const fin = k.cone(1.1, 2.2, 0x56616b, { seg: 3, s: [0.25, 1, 1], from: 4 });
		const body = k.capsule(1.1, 5.5, 0x4c5660, { s: [0.8, 0.7, 1], rx: PI / 2, from: 4 });
		k.tick((t) => {
			const a = t * 0.35;
			fin.position.set(Math.cos(a) * 6, 0.8, Math.sin(a) * 6);
			fin.rotation.y = -a;
			body.position.set(Math.cos(a - 0.05) * 6, -3.2, Math.sin(a - 0.05) * 6);
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
		k.ground(220, 0xe3cf9a, { y: 0, z: -175, bump: 0.25, from: 1, seg: 40, height: (x, z) => Math.min(0.6, (104 - z) * 0.12) });
		const colors = [0xd23b3b, 0x2f74c0, 0xf2c230, 0x3ba55c, 0xffffff];
		for (let i = 0; i < 26; i++) {
			const x = -60 + ((i * 37) % 120);
			const z = -78 - ((i * 13) % 22);
			k.cyl(0.05, 0.05, 2.4, 0xdddddd, { x, y: 1.6, z, from: 1 });
			k.cone(1.4, 0.7, colors[i % colors.length], { x, y: 2.9, z, seg: 8, from: 1 });
			k.person({ x: x + 1.5, y: 0.6, z: z + 1, ry: (i * 1.7) % 6, s: 0.9, colors: { shirt: colors[(i + 2) % 5], legs: colors[(i + 3) % 5] }, from: 1 });
		}
		// Up the beach, a towel, a radio and a pail under a striped umbrella.
		k.box(0.9, 0.04, 1.8, 0x3a8ad0, { x: -25, y: 0.86, z: -93, ry: 0.3, from: 1, until: 1 });
		k.box(0.92, 0.05, 0.25, 0xf0f0f0, { x: -25.1, y: 0.87, z: -93.3, ry: 0.3, from: 1, until: 1 });
		k.box(0.45, 0.28, 0.14, 0x8a2a20, { x: -24.3, y: 1.0, z: -92.3, ry: 0.5, from: 1, until: 1 });
		k.cyl(0.18, 0.14, 0.3, 0xf2c230, { x: -25.9, y: 1.0, z: -92.5, from: 1, until: 1 });
		const tower = k.group({ x: 12, y: 0.6, z: -76, from: 3 });
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
				{ pos: [-297.6, 1.7, -2.6], look: [-300, 0.6, 0.4], fov: 45, fog: [0x8a9aa8, 6, 45] },
				{ pos: [-23.4, 2.0, -95.2], look: [-25.2, 0.8, -92.6], fov: 50 },
				{ pos: [-44, 2.4, 33], look: [-40, 2, 40], fov: 42 },
				{ pos: [40, 6, -2], look: [22, 2, -17], fov: 45 },
				{ pos: [-13, 2, 16], look: [0, 0.4, 0], fov: 42 },
				{ pos: [26, 5, -9], look: [19, 2, -18.5], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the dinosaurs
	r02: (k) => {
		k.fog(0x24343e, 12, 120);
		k.sky(0x22343f, 0x3a5058);
		k.light({ sky: 0xa0bcd0, ground: 0x2a3428, hemi: 1.6, sunColor: 0xb8d0f0, sunIntensity: 1.5, sunPos: [-20, 40, 30] });
		k.ground(300, 0x2a3a24, { bump: 0.5 });
		// A dropped can of shaving foam in the mud.
		const can = k.group({ x: -10, y: 0.13, z: -8, ry: 0.7, rz: PI / 2 });
		const stripes = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#f4f4f0";
			g.fillRect(0, 0, w, h);
			for (let i = -4; i < 8; i++) {
				g.fillStyle = i % 2 ? "#c82828" : "#2a4aa8";
				g.beginPath();
				g.moveTo(i * 24, 0);
				g.lineTo(i * 24 + 10, 0);
				g.lineTo(i * 24 + 50, h);
				g.lineTo(i * 24 + 40, h);
				g.fill();
			}
		});
		k.cyl(0.13, 0.13, 0.5, k.mat(0xffffff, { map: stripes, metal: 0.4, rough: 0.35 }), { parent: can, seg: 20 });
		k.cyl(0.1, 0.13, 0.07, 0xd8d8dc, { y: 0.28, parent: can, metal: 0.8, rough: 0.3, seg: 20 });
		k.cyl(0.04, 0.05, 0.08, 0xf4f4f0, { y: 0.34, parent: can, seg: 10 });
		k.cyl(0.9, 0.9, 0.02, 0x3a3020, { x: -10, y: 0.03, z: -8.2, rough: 0.15, metal: 0.3, seg: 18, s: [1, 1, 0.7] });
		[[-9.4, -8.6], [-10.6, -7.5], [-10.2, -8.9]].forEach(([x, z], i) => k.box(0.5, 0.02, 0.22, 0x3a5a2a, { x, y: 0.06, z, ry: i * 1.3 }));
		k.point(0xffe8c8, 6, 6, { x: -9, y: 1.4, z: -6.8, until: 0 });
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
		k.cyl(0.11, 0.09, 0.22, 0xe8eef0, { x: 0.45, y: 1.71, z: 0.55, opacity: 0.45, rough: 0.1, parent: car, open: true, seg: 16, side: 2 });
		const water = k.cyl(0.1, 0.1, 0.005, 0x2a4858, { x: 0.45, y: 1.79, z: 0.55, rough: 0.05, metal: 0.2, parent: car });
		const rings = [0, 1, 2].map(() => k.torus(0.05, 0.004, 0xffffff, { x: 0.45, y: 1.795, z: 0.55, rx: PI / 2, parent: car, shadow: false, emissive: 0xa0b0c0, seg: 40 }));
		k.tick((t) => rings.forEach((r, i) => {
			const p = ((t * 0.7 + i / 3) % 1);
			r.scale.setScalar(0.2 + p * 1.6);
			r.material.opacity = 1 - p;
			r.material.transparent = true;
		}));
		void water;
		k.point(0xffe0a0, 1.2, 4, { x: 0.3, y: 2.2, z: 0.3 });
		k.point(0xfff0d8, 3, 2, { x: 0.6, y: 2.2, z: 0.4, from: 3, until: 3 });
		// The fence.
		for (let i = -6; i <= 6; i++) {
			k.box(0.4, 9, 0.4, 0x5a5a55, { x: i * 4, y: 4.5, z: 12 });
			if (i < 6) for (let w = 0; w < 7; w++) k.box(4, 0.04, 0.04, 0x8a8a80, { x: i * 4 + 2, y: 1 + w * 1.2, z: 12, shadow: false });
		}
		const sign = k.canvas(256, 170, (g, w, h) => {
			g.fillStyle = "#f2c230";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#111";
			g.lineWidth = 8;
			g.strokeRect(6, 6, w - 12, h - 12);
			g.fillStyle = "#111";
			g.font = "bold 40px sans-serif";
			g.textAlign = "center";
			g.fillText("DANGER", w / 2, 56);
			g.font = "bold 30px sans-serif";
			g.fillText("10,000 VOLTS", w / 2, 108);
			g.beginPath();
			g.moveTo(140, 118);
			g.lineTo(112, 144);
			g.lineTo(130, 144);
			g.lineTo(116, 164);
			g.lineTo(148, 136);
			g.lineTo(130, 136);
			g.fill();
		});
		k.box(1.5, 1.0, 0.05, k.mat(0xffffff, { map: sign }), { x: 2, y: 3.4, z: 11.75, ry: PI, from: 2 });
		k.point(0xfff0c8, 4, 8, { x: 1.5, y: 4.5, z: 9.5, from: 2, until: 2 });
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
		trees(k, 90, [-90, 90, -90, 70], { avoid: (x, z) => (Math.abs(x) < 14 && z > -14 && z < 30) || Math.hypot(x + 30, z + 25) < 14 || Math.hypot(x + 24, z + 13) < 8 });
		// The tyrannosaur, out of its paddock beside the car, roaring in profile.
		const rex = k.group({ x: 7, y: 0, z: 7, ry: -PI / 2 - 0.25, from: 5 });
		k.spot(0xd0dcf0, 60, { x: 4, y: 12, z: -6, target: [6, 6, 7], angle: 0.6, distance: 45, from: 5 });
		k.spot(0xffd8a0, 120, { x: -22, y: 6, z: -10, target: [-30, 12, -25], angle: 0.5, distance: 40, from: 1, until: 1 });
		const skin = 0x5a5844;
		[-1, 1].forEach((s) => {
			k.box(1.3, 3.2, 2.2, skin, { x: s * 1.15, y: 4.0, z: -0.4, rx: 0.35, parent: rex });
			k.box(0.8, 2.6, 0.8, skin, { x: s * 1.15, y: 1.5, z: -0.6, rx: -0.4, parent: rex });
			k.box(1.1, 0.4, 2, skin, { x: s * 1.15, y: 0.2, z: 0.1, parent: rex });
			k.box(0.22, 1.0, 0.22, skin, { x: s * 0.6, y: 5.6, z: 2.7, rx: -1.0, parent: rex });
		});
		k.capsule(2.0, 4.2, skin, { y: 6, z: 0.3, rx: PI / 2 - 0.25, parent: rex });
		k.cone(1.9, 11, skin, { y: 6.3, z: -7.6, rx: -PI / 2 + 0.08, seg: 8, parent: rex });
		k.cyl(1.2, 1.6, 2.6, skin, { y: 7.6, z: 3.0, rx: 0.75, parent: rex });
		const head = k.group({ y: 8.6, z: 4.0, rx: -0.2, parent: rex });
		k.box(1.9, 1.7, 2.4, skin, { z: 0.6, parent: head });
		k.box(1.5, 1.1, 1.8, skin, { y: -0.15, z: 2.5, parent: head });
		k.box(1.6, 0.35, 1.0, 0x4a483a, { y: 0.85, z: 0.9, parent: head });
		const jaw = k.group({ y: -0.6, z: -0.2, rx: 0.5, parent: head });
		k.box(1.4, 0.45, 3.6, skin, { y: -0.25, z: 1.9, parent: jaw });
		k.box(1.2, 0.2, 3.2, 0x7a2020, { y: 0.05, z: 1.9, parent: jaw });
		for (let i = 0; i < 6; i++) [-0.6, 0.6].forEach((x) => {
			k.cone(0.08, 0.35, 0xf0e8d0, { x, y: -0.85, z: 3.2 - i * 0.42, rx: PI, seg: 4, parent: head });
			k.cone(0.07, 0.3, 0xf0e8d0, { x, y: 0.25, z: 3.4 - i * 0.42, seg: 4, parent: jaw });
		});
		[-0.96, 0.96].forEach((x) => k.sphere(0.16, 0xe0b020, { x, y: 0.35, z: 0.9, parent: head, emissive: 0x6a4a00 }));
		k.tick((t) => {
			head.rotation.x = -0.2 - 0.15 * Math.max(0, Math.sin(t * 0.8));
			jaw.rotation.x = 0.45 + 0.25 * Math.max(0, Math.sin(t * 0.8));
		});
		// Lightning.
		const flash = k.point(0xc8d8ff, 0, 400, { x: 0, y: 80, z: 30 });
		k.tick((t) => (flash.intensity = Math.sin(t * 0.9) > 0.97 ? 80 : 0));
		return {
			shots: [
				{ pos: [-9.3, 0.75, -6.9], look: [-10, 0.12, -8], fov: 42, exposure: 1.3 },
				{ pos: [-23.5, 3, -12.5], look: [-30, 9.5, -25], fov: 55, exposure: 1.3 },
				{ pos: [0.5, 2.6, 7.5], look: [2, 3.4, 12], fov: 50, exposure: 1.3 },
				{ pos: [0.7, 2.0, 0.2], look: [0.45, 1.75, 0.6], fov: 40, exposure: 1.2 },
				{ pos: [-6.5, 2.4, -6.5], look: [0, 1.2, 0.5], fov: 45, exposure: 1.3 },
				{ pos: [5, 3, -9.5], look: [5.5, 6, 7], fov: 55, exposure: 1.25 },
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
		// Height of the bumpy desert floor (matches k.ground's bump of 1.6).
		const gy = (x, z) => (Math.sin(x * 0.7) * Math.cos(z * 0.6) + Math.sin(x * 0.23 + z * 0.31)) * 0.8;
		for (let i = 0; i < 9; i++) {
			const len = 1 + r();
			const x = 4 + r() * 4;
			const z = 3 + r() * 3;
			k.capsule(0.12, len, boneMat, { x, y: gy(x, z) + 0.08, z, rz: PI / 2, ry: r() * 6 });
		}
		// A muddy waterhole among rocks, away from the bones.
		k.cyl(3.2, 3.2, 0.1, 0x4a5a5a, { x: -25, y: gy(-25, 32) + 0.15, z: 32, seg: 18, s: [1, 1, 0.7], rough: 0.15, metal: 0.3 });
		k.cyl(3.8, 3.8, 0.08, 0x6a4428, { x: -25, y: gy(-25, 32) + 0.08, z: 32, seg: 18, s: [1, 1, 0.75] });
		[[-28.5, 30], [-21.6, 33.5], [-27, 35], [-23, 29.6]].forEach(([x, z], i) => k.ico(0.5 + i * 0.25, 0x7a4e30, { x, y: gy(x, z) + 0.2, z, ry: i }));
		[[-29, 33], [-21, 31], [-26.5, 28.8]].forEach(([x, z]) => [0, 1, 2].forEach((j) => k.cone(0.05, 0.7, 0x6a6030, { x: x + j * 0.12, y: gy(x, z) + 0.35, z, rz: (j - 1) * 0.4, seg: 4 })));
		// A long skull among the scattered bones.
		const skull = k.group({ x: 6.6, y: gy(6.6, 3.8) + 0.2, z: 3.8, ry: 0.5, rz: 0.15 });
		k.sphere(0.45, boneMat, { parent: skull, s: [1, 0.75, 1.5] });
		k.box(0.5, 0.25, 0.9, boneMat, { y: -0.15, z: 0.8, parent: skull });
		[-0.2, 0.2].forEach((x) => k.sphere(0.12, 0x2a1a10, { x, y: 0.05, z: 0.45, parent: skull }));
		const ape = k.person({ x: 5, y: gy(5, 2) - 0.1, z: 2, ry: 0.3, pose: "raise", colors: { shirt: 0x3a2a1c, legs: 0x3a2a1c, skin: 0x2a1c12, hair: 0x2a1c12 }, sleeves: 0x3a2a1c, from: 3 });
		k.capsule(0.08, 0.9, boneMat, { x: 0.35, y: 2.9, z: 0, parent: ape });
		[-3, -1.5, 9].forEach((x, i) => k.person({ x, y: gy(x, 6 + i) - 0.1, z: 6 + i, ry: 2 + i, pose: "hunch", s: 0.85, colors: { shirt: 0x3a2a1c, legs: 0x3a2a1c, skin: 0x2a1c12, hair: 0x2a1c12 }, from: 1 }));
		// The monolith with the sun rising over it.
		k.box(1.2, 9, 3.4, 0x050505, { x: 0, y: 4.5, z: -14, rough: 0.2, metal: 0.4, from: 5 });
		k.glow(0xffd8a0, 30, { x: 0, y: 14, z: -120, until: 4 });
		k.disc(0xfff4e0, 6, { x: 0, y: 14, z: -125, until: 4 });
		// The alignment: sun and crescent stacked over the slab's top edge.
		k.glow(0xffe0b0, 40, { x: -2.4, y: 80, z: -112, from: 5 });
		k.disc(0xfffaf0, 7, { x: -2.4, y: 80, z: -114, from: 5 });
		k.disc(0xe8e8f0, 4, { x: -2.4, y: 93, z: -112, from: 5 });
		// Space: Earth, the wheel, and the eye.
		const space = k.group({ x: 0, y: 400, z: 0 });
		k.stars(2500, { y: 400, upper: false, r: 600 });
		k.sphere(30, 0x2a6ad0, { x: -20, y: -50, z: -120, seg: 32, rings: 24, parent: space, rough: 0.6, emissive: 0x0a2a6a, glow: 0.8 });
		k.sphere(30.6, 0xffffff, { x: -20, y: -50, z: -120, seg: 24, rings: 16, opacity: 0.25, parent: space });
		const wheel = k.group({ x: 5, y: 8, z: -30, rx: 0.9, parent: space, from: 2 });
		k.torus(12, 1.2, 0xe8e8ec, { parent: wheel, seg: 48, emissive: 0x404048 });
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
		return {
			shots: [
				{ pos: [-25.5, 2.2, 25.5], look: [-25, 0.2, 32], fov: 45, hide: ["stars"] },
				{ pos: [30, 4, 34], look: [2, 1.5, 4], fov: 40, hide: ["stars"] },
				{ pos: [-20, 420, 30], look: [5, 405, -30], fov: 45, fog: [0x000006, 900, 3000] },
				{ pos: [8, 2.2, 13], look: [4, 1.6, 2], fov: 45, hide: ["stars"] },
				{ pos: [-60, 400, 8], look: [-60, 400, 0], fov: 35, fog: [0x000000, 1, 60] },
				{ pos: [0.3, 0.5, -2], look: [0, 11, -16], fov: 55, hide: ["stars"] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the code rain
	r04: (k) => {
		k.fog(0x1a1e1c, 30, 220);
		k.sky(0x4a524e, 0x9aa29e);
		k.light({ sky: 0xc8d4cc, ground: 0x252825, hemi: 1.1, sunColor: 0xf0f8f0, sunIntensity: 1.2, sunPos: [-30, 60, 20], shadowSize: 30 });
		// A grey office: a cubicle with a beige computer, far away on its own.
		const office = k.group({ x: -300, y: 0, z: 0 });
		k.box(30, 0.2, 30, 0x5a5e66, { y: -0.1, parent: office });
		k.box(30, 0.2, 30, 0xd8d8d0, { y: 3.4, parent: office });
		for (let i = 0; i < 3; i++) k.box(1.2, 0.04, 0.6, 0xf8f8f0, { x: -3 + i * 3, y: 3.28, z: -1, parent: office, emissive: 0xf0f0e0, glow: 1 });
		const cube = (x, z, ry) => {
			const c = k.group({ x, z, ry, parent: office });
			k.box(2.6, 1.6, 0.08, 0x6a7280, { y: 0.8, z: -1.3, parent: c });
			k.box(0.08, 1.6, 2.6, 0x6a7280, { x: -1.3, y: 0.8, parent: c });
			k.box(2.4, 0.06, 1.0, 0xb8a888, { y: 0.74, z: -0.75, parent: c });
			k.box(0.1, 0.72, 0.9, 0x4a4a4a, { x: 1.1, y: 0.37, z: -0.75, parent: c });
			return c;
		};
		const mine = cube(0, 0, 0);
		cube(2.7, 0, 0);
		cube(0, -2.8, 0);
		cube(2.7, -2.8, 0);
		cube(-2.7, -2.8, 0);
		k.box(0.6, 0.5, 0.55, 0xd8d0b8, { y: 1.05, z: -0.95, parent: mine });
		k.box(0.48, 0.36, 0.02, 0x1a2a3a, { y: 1.07, z: -0.665, parent: mine, emissive: 0x0a1a2a });
		k.box(0.56, 0.1, 0.45, 0xd8d0b8, { y: 0.82, z: -0.95, parent: mine });
		k.box(0.5, 0.03, 0.18, 0xd0c8b0, { y: 0.78, z: -0.5, parent: mine });
		k.cyl(0.05, 0.045, 0.11, 0xf0f0f0, { x: 0.55, y: 0.83, z: -0.55, parent: mine });
		k.box(0.3, 0.02, 0.22, 0xf4f0e0, { x: -0.6, y: 0.78, z: -0.6, ry: 0.3, parent: mine });
		k.box(0.12, 0.12, 0.02, 0xf2e070, { x: -0.3, y: 1.3, z: -1.25, parent: mine });
		k.cyl(0.25, 0.28, 0.08, 0x222222, { x: 0.1, y: 0.45, z: 0.1, parent: mine });
		k.box(0.5, 0.08, 0.5, 0x2a2a30, { x: 0.1, y: 0.5, z: 0.1, parent: mine });
		k.box(0.5, 0.6, 0.08, 0x2a2a30, { x: 0.1, y: 0.85, z: 0.38, parent: mine });
		k.point(0xf4f4ea, 14, 14, { x: -300, y: 3, z: 1.5 });
		k.point(0xf4f4ea, 6, 12, { x: -302, y: 3, z: -3 });
		// The rooftop.
		k.box(40, 1, 40, 0x6a6e6a, { y: -0.5 });
		k.box(40, 1.4, 0.6, 0x5a5e5a, { y: 0.7, z: -20 });
		k.box(0.6, 1.4, 40, 0x5a5e5a, { x: 20, y: 0.7 });
		k.box(4, 3, 4, 0x7a7e7a, { x: -12, y: 1.5, z: -12 });
		k.cyl(2, 2, 3, 0x5a4a3a, { x: 12, y: 6, z: -14 });
		k.cone(2.3, 1.5, 0x4a3a2a, { x: 12, y: 8.2, z: -14 });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.2, 4.5, 0.2, 0x3a3a3a, { x: 12 + sx * 1.6, y: 2.25, z: -14 + sz * 1.6 })));
		city(k, 70, [-120, 120, -160, -30], { h: 50, colors: [0x6a706c, 0x5a605c, 0x7a807c], windows: 0xc8d8c0, seed: 21, avoid: () => false });
		k.box(260, 1, 260, 0x3a3e3c, { y: -30 });
		// The hero, bending back.
		const neo = k.person({ x: 0, y: 0, z: 0, ry: 0, pose: "lean", coat: 0x0a0a0a, colors: { shirt: 0x0a0a0a, legs: 0x0a0a0a, skin: 0xd8c0a8, hair: 0x0a0a0a }, shades: true, from: 5 });
		k.tick((t) => (neo.userData.limbs.armL.rotation.x = -0.4 + Math.sin(t * 0.8) * 0.2));
		k.point(0xe8f4ec, 6, 8, { x: 2.5, y: 2.5, z: 2.5, from: 5 });
		// Behind him in the final frame only: a wall of falling green glyphs.
		const glyphs = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789Z:.=*+-<>";
		const gr = rng(11);
		const tex = k.canvas(64, 1024, (g, w, h) => {
			g.fillStyle = "#000";
			g.fillRect(0, 0, w, h);
			g.font = "bold 40px monospace";
			g.textAlign = "center";
			for (let i = 0; i < 24; i++) {
				g.fillStyle = i === 23 ? "#e8ffe8" : `rgba(40,255,90,${0.15 + (i / 24) * 0.85})`;
				g.fillText(glyphs[Math.floor(gr() * glyphs.length)], 32, 40 + i * 42);
			}
		});
		tex.wrapT = k.THREE.RepeatWrapping;
		const strips = [];
		for (let i = 0; i < 90; i++) {
			const m = new k.THREE.MeshBasicMaterial({ map: tex.clone(), transparent: true, blending: k.THREE.AdditiveBlending, depthWrite: false, fog: false });
			m.map.needsUpdate = true;
			m.map.offset.y = gr();
			const a = -0.9 + gr() * 1.8;
			const d = 9 + gr() * 4;
			const strip = k.mesh(new k.THREE.PlaneGeometry(0.5, 9), m, { x: -Math.cos(a) * d, y: 3 + gr() * 4, z: -1 + Math.sin(a) * d, ry: PI / 2 - a * 0.5, shadow: false, from: 5 });
			strip.userData.speed = 0.15 + gr() * 0.4;
			strips.push(strip);
		}
		k.tick((t, dt) => strips.forEach((st) => (st.material.map.offset.y += st.userData.speed * dt)));
		// Bullets with ripples, crawling.
		const bullets = [];
		for (let i = 0; i < 4; i++) {
			const b = k.group({ from: 3 });
			k.capsule(0.07, 0.2, 0xd8b060, { rx: PI / 2, metal: 0.9, rough: 0.2, parent: b, emissive: 0x302000 });
			for (let j = 0; j < 4; j++) k.torus(0.14 + j * 0.07, 0.012, 0xddeeff, { z: -0.2 - j * 0.25, opacity: 0.45 - j * 0.1, parent: b, shadow: false });
			bullets.push(b);
		}
		k.tick((t) => bullets.forEach((b, i) => b.position.set(-0.3 + i * 0.2, 1.5 + i * 0.1, 4.5 - ((t * 0.25 + i * 0.9) % 6.5))));
		// The agent: dark suit, earpiece, aiming.
		const agent = k.person({ x: 0.5, y: 0, z: 12, ry: PI, pose: "point", colors: { shirt: 0x1a1c22, legs: 0x1a1c22, skin: 0xd8b898, hair: 0x2a2018 }, shades: true, from: 2 });
		k.box(0.1, 0.12, 0.3, 0x111111, { y: -0.7, z: 0.1, parent: agent.userData.limbs.armR, rx: PI / 2 });
		k.box(0.12, 0.3, 0.2, 0xf0f0f0, { y: 1.25, z: 0.13, parent: agent });
		k.box(0.06, 0.28, 0.02, 0x2a2a30, { y: 1.27, z: 0.24, parent: agent });
		// The choice.
		const hand = k.group({ x: 300, y: 0, z: 0, from: 4 });
		k.box(30, 30, 30, 0x0a0a0a, { y: 0, parent: hand });
		[-0.55, 0.55].forEach((x) => {
			k.box(0.8, 0.14, 0.95, 0xd8b090, { x, y: 15.07, z: 0.1, parent: hand });
			for (let f = 0; f < 4; f++) k.box(0.17, 0.11, 0.5 - Math.abs(f - 1.5) * 0.08, 0xd8b090, { x: x - 0.29 + f * 0.195, y: 15.08, z: -0.6, parent: hand });
			k.box(0.16, 0.11, 0.4, 0xd8b090, { x: x + Math.sign(x) * 0.48, y: 15.08, z: 0.1, ry: -Math.sign(x) * 0.6, parent: hand });
		});
		k.capsule(0.12, 0.25, 0xd81a1a, { x: -0.5, y: 15.26, z: 0.1, rz: PI / 2 + 0.3, parent: hand, rough: 0.2, emissive: 0x300000 });
		k.capsule(0.12, 0.25, 0x1a40e0, { x: 0.55, y: 15.26, z: 0.1, rz: PI / 2 - 0.4, parent: hand, rough: 0.2, emissive: 0x000830 });
		k.spot(0xffffff, 40, { x: 300, y: 22, z: 2, target: [300, 15, 0], angle: 0.4, from: 4 });
		return {
			shots: [
				{ pos: [-299.4, 1.55, 1.3], look: [-300.1, 1.0, -0.8], fov: 50, fog: [0x8a8c88, 4, 40] },
				{ pos: [-10, 1.7, 14], look: [0, 3, -10], fov: 50 },
				{ pos: [1.6, 1.8, 7.5], look: [0.5, 1.5, 12], fov: 45 },
				{ pos: [2.2, 1.5, 4.2], look: [-0.2, 1.65, 2.4], fov: 45 },
				{ pos: [300, 17.6, 2.6], look: [300, 15.2, 0], fov: 40, fog: [0x050505, 1, 40] },
				{ pos: [4.2, 0.35, 0.9], look: [0, 1.15, -0.5], fov: 48 },
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
		const her = k.person({ x: 0, y: 5.15, z: 37.2, pose: "arms-out", dress: 0x2a2a44, colors: { shirt: 0x2a2a44, skin: 0xf0c8a8, hair: 0x9a3a1a }, parent: ship, from: 5 });
		const him = k.person({ x: 0, y: 5.15, z: 36.8, colors: { shirt: 0xe8e0d0, legs: 0x5a4a38, hair: 0xc8a050 }, parent: ship, from: 5 });
		him.userData.limbs.armL.rotation.set(-1.2, 0, 0.5);
		him.userData.limbs.armR.rotation.set(-1.2, 0, -0.5);
		void her;
		// The iceberg.
		const berg = k.group({ x: 30, y: 0, z: 140 });
		const r = rng(2);
		for (let i = 0; i < 9; i++) k.ico(6 + r() * 9, 0xf4faff, { x: (r() - 0.5) * 16, y: r() * 12, z: (r() - 0.5) * 14, ry: r() * 6, rough: 0.4, emissive: 0x5a7a96, glow: 0.6, parent: berg, s: [1, 1.4, 1] });
		// A dining saloon, far away on its own: a laid table in warm lamplight.
		const saloon = k.group({ x: -300, y: -200, z: 0 });
		k.box(24, 0.2, 24, 0x6a3a2a, { y: -0.1, parent: saloon });
		k.box(24, 8, 0.3, 0x7a5a3a, { z: -4, y: 4, parent: saloon });
		for (let i = 0; i < 12; i++) k.box(0.12, 8, 0.12, 0x5a3a22, { x: -11 + i * 2, y: 4, z: -3.8, parent: saloon });
		k.box(24, 0.15, 0.2, 0xc8a050, { y: 2.4, z: -3.8, parent: saloon, metal: 0.7, rough: 0.3 });
		k.box(2.4, 0.06, 1.6, 0xf4f0e6, { y: 1.5, parent: saloon });
		k.box(2.42, 0.4, 1.62, 0xece8dc, { y: 1.3, parent: saloon, opacity: 0.95 });
		[[-0.55, 0.45], [0.55, 0.45], [-0.55, -0.45], [0.55, -0.45]].forEach(([x, z]) => {
			k.cyl(0.26, 0.2, 0.03, 0xf8f6f0, { x, y: 1.55, z, parent: saloon, seg: 24, rough: 0.3 });
			k.torus(0.22, 0.012, 0xc8a050, { x, y: 1.57, z, rx: PI / 2, parent: saloon, seg: 24, metal: 0.8, rough: 0.3 });
			k.box(0.03, 0.01, 0.32, 0xd8d8d8, { x: x - 0.33, y: 1.54, z, parent: saloon, metal: 0.9, rough: 0.2 });
			k.box(0.03, 0.01, 0.32, 0xd8d8d8, { x: x + 0.33, y: 1.54, z, parent: saloon, metal: 0.9, rough: 0.2 });
			k.cyl(0.07, 0.02, 0.14, 0xe8f0f0, { x: x + 0.25, y: 1.72, z: z - Math.sign(z) * 0.28, parent: saloon, opacity: 0.4, rough: 0.05, seg: 12 });
			k.cyl(0.01, 0.01, 0.12, 0xe8f0f0, { x: x + 0.25, y: 1.59, z: z - Math.sign(z) * 0.28, parent: saloon, opacity: 0.4 });
		});
		k.cyl(0.08, 0.12, 0.35, 0xc8b070, { y: 1.71, parent: saloon, metal: 0.8, rough: 0.3 });
		k.sphere(0.2, 0xe8d8d0, { y: 1.95, parent: saloon, s: [1, 0.7, 1] });
		[-0.12, 0.08, 0.1].forEach((x, i) => k.sphere(0.07, 0xd85a6a, { x, y: 2.0 + (i % 2) * 0.05, z: (i - 1) * 0.08, parent: saloon }));
		[-1.6, 1.6].forEach((x) => {
			k.box(0.6, 0.08, 0.6, 0x5a2a1a, { x, y: 0.9, parent: saloon });
			k.box(0.08, 1.1, 0.6, 0x5a2a1a, { x: x + Math.sign(x) * 0.3, y: 1.45, parent: saloon });
		});
		k.point(0xffd8a0, 10, 16, { x: -299, y: -196.5, z: 2 });
		k.point(0xffc890, 4, 12, { x: -303, y: -197, z: 1 });
		k.glow(0xffd8a0, 1.5, { x: -301, y: -197, z: -3.6 });
		k.glow(0xffd8a0, 1.5, { x: -297, y: -197, z: -3.6 });
		// The wreck on the seabed, and the necklace.
		const deep = k.group({ x: 0, y: -400, z: 0 });
		k.ground(200, 0x2a2a24, { parent: deep, bump: 1.4 });
		const wreck = k.group({ y: -0.6, rz: 0.15, rx: -0.06, parent: deep });
		k.box(7, 8, 30, 0x4a3020, { y: 2, parent: wreck, rough: 1 });
		k.cone(3.5, 14, 0x4a3020, { y: 2, z: 21.8, rx: PI / 2, ry: PI / 4, seg: 4, parent: wreck });
		for (let i = 0; i < 12; i++) [-1, 1].forEach((s) => k.box(0.1, 1, 0.1, 0x6a3a1a, { x: s * (3.2 - i * 0.24), y: 6.5, z: 15 + i * 0.5, rz: (r() - 0.5) * 0.6, parent: wreck }));
		k.particles(600, 0xc8d8c8, { box: [40, 30, 40], y: -400, speed: 0.3, size: 0.08, opacity: 0.5, drift: 0.3 });
		k.spot(0xcfe8ff, 80, { x: -6, y: -380, z: 40, target: [0, -394, 20], angle: 0.35, distance: 90 });
		const heart = new k.THREE.Shape();
		heart.moveTo(0, -0.5);
		heart.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.35);
		heart.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
		const gem = k.mesh(new k.THREE.ExtrudeGeometry(heart, { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 }), new k.THREE.MeshStandardMaterial({ color: 0x1a50ff, emissive: 0x0a2080, roughness: 0.05, metalness: 0.3, flatShading: true }), { x: 200, y: -399.6, z: 0, rx: -PI / 2 + 0.3, from: 2 });
		k.ground(30, 0x101018, { x: 200, y: -400, bump: 0.05, from: 2 });
		for (let i = 0; i < 26; i++) k.sphere(0.07, 0xf0f0ff, { x: 200 + Math.cos(i / 4) * 1.2 * (i / 26), y: -399.9, z: -0.8 - i * 0.07, metal: 0.8, rough: 0.2, from: 2 });
		k.spot(0xddeeff, 60, { x: 201, y: -394, z: 2, target: [200, -400, 0], angle: 0.3 });
		k.tick((t) => (gem.rotation.z = Math.sin(t * 0.5) * 0.15));
		return {
			shots: [
				{ pos: [-298.4, -197.4, 2.4], look: [-300, -198.5, 0], fov: 45, fog: [0x2a1e16, 6, 40], exposure: 1.2 },
				{ pos: [-9, -393, 38], look: [0, -395, 18], fov: 50, fog: [0x0e3a52, 2, 80], exposure: 1.5 },
				{ pos: [201.4, -398.2, 1.6], look: [200, -399.8, 0], fov: 40, fog: [0x020208, 1, 30] },
				{ pos: [10, 3, 95], look: [30, 8, 140], fov: 45 },
				{ pos: [70, 10, 20], look: [0, 8, 0], fov: 50 },
				{ pos: [-2.6, 7.0, 42.5], look: [0, 6.6, 36.8], fov: 50 },
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
		const gy = (x, z) => (Math.sin(x * 0.7) * Math.cos(z * 0.6) + Math.sin(x * 0.23 + z * 0.31)) * 1.2;
		const vap = (x, z, from) => {
			const g = k.group({ x, y: gy(x, z) - 0.2, z, from });
			k.cyl(0.35, 0.45, 5, 0xb8b8b0, { y: 2.5, parent: g, metal: 0.5, rough: 0.5 });
			for (let i = 0; i < 4; i++) k.cyl(0.6, 0.6, 0.18, 0x8a8a84, { y: 1.2 + i * 1, parent: g, metal: 0.5 });
			k.box(0.1, 0.9, 1.4, 0x8a8a84, { y: 4.6, parent: g });
			k.cyl(0.5, 0.5, 0.6, 0x8a8a84, { y: 0.3, parent: g });
		};
		vap(-10, -6, 0);
		vap(-16, 4, 0);
		vap(9, -14, 0);
		// The farm boy on the ridge.
		k.ground(60, 0xc89058, { x: -30, y: 1.5, z: -30, bump: 1, seg: 12, height: (x, z) => Math.max(0, 6 - Math.hypot(x, z) * 0.3) });
		k.person({ x: -30, y: 7.2, z: -30, ry: PI * 0.85, colors: { shirt: 0xf0ece0, legs: 0xe8e0d0, hair: 0xd8b060, skin: 0xe8c0a0 }, from: 1 });
		// Two suns.
		k.glow(0xffc070, 34, { x: -160, y: 24, z: -300, from: 3 });
		k.glow(0xffe0a0, 26, { x: -122, y: 34, z: -300, from: 3 });
		k.disc(0xfff0d0, 12, { x: -160, y: 24, z: -305, from: 3 });
		k.disc(0xfff8e8, 9, { x: -122, y: 34, z: -305, from: 3 });
		// Space: the battle station and a fighter.
		const space = k.group({ y: 500 });
		k.stars(2000, { y: 500, upper: false, r: 500 });
		k.point(0xffffff, 3, 600, { x: 100, y: 80, z: 100, parent: space });
		const ds = k.group({ x: -30, y: 0, z: -140, parent: space });
		k.sphere(40, 0x7a7c80, { parent: ds, seg: 40, rings: 30, rough: 0.7 });
		k.torus(40.1, 0.6, 0x3a3a40, { rx: PI / 2, parent: ds, seg: 60 });
		k.sphere(9, 0x55575c, { x: 18, y: 18, z: 30, s: [1, 1, 0.35], parent: ds, ry: 0.6, rx: -0.5 });
		const wing = k.group({ x: 0, y: 0, z: 0, ry: 0.3, rz: 0.1, parent: space, from: 5 });
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
		return {
			shots: [
				{ pos: [-8.2, 4.2, -3.6], look: [-10, 3.6, -6], fov: 45, hide: ["stars"] },
				{ pos: [-24, 8.5, -20], look: [-30, 8, -30], fov: 45, hide: ["stars"] },
				{ pos: [-6, 2, 9], look: [0, 1.5, 0], fov: 40, hide: ["stars"] },
				{ pos: [-18, 7, -12], look: [-90, 20, -250], fov: 45, hide: ["stars"] },
				{ pos: [40, 520, 40], look: [-30, 500, -140], fov: 40, fog: [0x000006, 900, 3000] },
				{ pos: [12, 500, 18], look: [0, 500, 0], fov: 45, fog: [0x000006, 900, 3000] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the visitor
	r07: (k) => {
		k.fog(0x16243a, 10, 220);
		k.sky(0x0e1a30, 0x2a3a5a);
		k.stars(1500);
		k.light({ sky: 0x7a9ad0, ground: 0x1a1c20, hemi: 1.2, sunColor: 0xb8d0ff, sunIntensity: 1.1, sunPos: [0, 40, -100], shadowSize: 50 });
		k.ground(400, 0x2a3a26, { bump: 1.2, seg: 50 });
		k.spot(0xfff0d0, 25, { x: 1.5, y: 3.5, z: 9, target: [0, 0, 3], angle: 0.45, distance: 20, from: 3, until: 3 });
		trees(k, 120, [-90, 90, -100, 60], { color: 0x10241a, h: 9, avoid: (x, z) => Math.abs(x) < 8 && z > -20 });
		// A trail of candy.
		const candy = [0xe86a1a, 0xf2c230, 0x5a2a12];
		for (let i = 0; i < 16; i++) k.cyl(0.09, 0.09, 0.05, candy[i % 3], { x: Math.sin(i * 0.6) * 0.8, y: 0.12, z: 6 - i * 0.55, rx: 0.2 * (i % 2), from: 3 });
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
		// A suburban back yard at night, far away on its own: a board fence, a porch lamp, a ball in the grass.
		const yard = k.group({ x: 300, y: 0, z: 0 });
		const etSkin = 0x7a6450;
		k.box(30, 1, 30, 0x2a3a22, { y: -0.5, parent: yard });
		for (let i = 0; i < 16; i++) k.box(0.28, 1.9 + (i % 3) * 0.04, 0.06, i % 2 ? 0x8a7a64 : 0x7e6e58, { x: -4 + i * 0.3, y: 0.95, z: -2, parent: yard });
		k.box(4.8, 0.1, 0.06, 0x6a5a48, { y: 1.5, z: -1.95, parent: yard });
		for (let i = 0; i < 40; i++) k.cone(0.03, 0.18, 0x3a5a2a, { x: -2 + ((i * 37) % 40) / 10, y: 0.08, z: -1.5 + ((i * 13) % 30) / 10, seg: 3, parent: yard });
		k.sphere(0.12, 0xf0ece0, { x: 0.3, y: 0.12, z: 0.2, parent: yard, rough: 0.6 });
		k.torus(0.1, 0.006, 0xc02020, { x: 0.3, y: 0.12, z: 0.2, ry: 0.6, rx: 0.3, parent: yard, seg: 20 });
		k.spot(0xffd8a0, 18, { x: 302, y: 4, z: 3, target: [300.2, 0, 0], angle: 0.5, distance: 14 });
		k.glow(0xffd8a0, 0.6, { x: 302, y: 2.4, z: 2.5 });
		// The visitor himself, hiding among stuffed toys in a closet.
		const closet = k.group({ x: -300, y: 0, z: 0, from: 4 });
		k.box(8, 0.2, 6, 0x6a5038, { y: -0.1, parent: closet });
		k.box(8, 5, 0.2, 0xb8a888, { z: -1.6, y: 2.5, parent: closet });
		[-1, 1].forEach((sx) => k.box(0.2, 5, 4, 0xa89878, { x: sx * 2.4, y: 2.5, parent: closet }));
		k.box(4.8, 0.08, 1.2, 0x8a6a48, { y: 2.6, z: -1.0, parent: closet });
		const toy = (x, y, z, c, s) => {
			k.sphere(0.35 * s, c, { x, y: y + 0.35 * s, z, parent: closet });
			k.sphere(0.25 * s, c, { x, y: y + 0.85 * s, z: z + 0.05, parent: closet });
			[-1, 1].forEach((e) => k.sphere(0.09 * s, c, { x: x + e * 0.18 * s, y: y + 1.05 * s, z, parent: closet }));
			k.sphere(0.03 * s, 0x111111, { x: x - 0.08 * s, y: y + 0.9 * s, z: z + 0.27 * s, parent: closet });
			k.sphere(0.03 * s, 0x111111, { x: x + 0.08 * s, y: y + 0.9 * s, z: z + 0.27 * s, parent: closet });
		};
		toy(-1.3, 0, -0.6, 0x8a5a30, 1.3);
		toy(1.3, 0, -0.5, 0xe8d8c0, 1.2);
		toy(-1.7, 0, 0.4, 0x3a7ac8, 0.8);
		toy(1.6, 0, 0.6, 0xd85a8a, 0.8);
		toy(-0.8, 2.64, -1.1, 0xc8a050, 0.8);
		toy(0.9, 2.64, -1.1, 0x5a9a5a, 0.7);
		const et = k.group({ x: 0, y: 0, z: -0.2, parent: closet });
		k.sphere(0.5, etSkin, { y: 0.45, parent: et, s: [1, 0.85, 0.85], rough: 1 });
		k.sphere(0.36, 0x8a7460, { y: 0.4, z: 0.25, parent: et, s: [1, 0.8, 0.6], rough: 1 });
		[-0.22, 0.22].forEach((x) => k.box(0.16, 0.12, 0.32, etSkin, { x, y: 0.06, z: 0.2, parent: et }));
		k.cyl(0.13, 0.18, 0.75, etSkin, { y: 1.15, z: 0.05, rx: 0.15, parent: et, rough: 1 });
		const etHead = k.group({ y: 1.6, z: 0.15, parent: et });
		k.sphere(0.42, etSkin, { parent: etHead, s: [1.25, 0.72, 0.95], rough: 1 });
		k.sphere(0.3, etSkin, { y: 0.12, z: -0.15, parent: etHead, s: [1.2, 0.7, 1] });
		[-0.2, 0.2].forEach((x) => {
			k.sphere(0.12, 0x1a2a4a, { x, y: 0.05, z: 0.33, parent: etHead, rough: 0.1, s: [1, 0.8, 0.6] });
			k.sphere(0.035, 0xffffff, { x: x + 0.03, y: 0.08, z: 0.4, parent: etHead, emissive: 0x888888 });
			k.sphere(0.07, etSkin, { x, y: 0.15, z: 0.34, parent: etHead, s: [1.6, 0.6, 0.7] });
		});
		k.box(0.22, 0.03, 0.04, 0x4a3428, { y: -0.14, z: 0.38, parent: etHead });
		[-1, 1].forEach((sx) => k.capsule(0.06, 0.7, etSkin, { x: sx * 0.42, y: 0.75, z: 0.15, rz: sx * 0.35, parent: et }));
		k.point(0xffe8c8, 10, 10, { x: -299, y: 3.5, z: 3.5, from: 4 });
		k.point(0xd8c0ff, 3, 8, { x: -302, y: 2, z: 2, from: 4 });
		// The bike with a basket and a white bundle, over a huge moon.
		const bike = k.group({ x: 0, y: 30, z: -60, s: 1.6, from: 5 });
		[-0.8, 0.8].forEach((x) => k.torus(0.5, 0.05, 0x111111, { x, parent: bike }));
		k.box(1.6, 0.06, 0.06, 0x111111, { y: 0.35, rz: 0.2, parent: bike });
		k.box(0.06, 0.8, 0.06, 0x111111, { x: 0.6, y: 0.5, parent: bike });
		k.box(0.5, 0.4, 0.4, 0x8a6a40, { x: 0.85, y: 0.95, parent: bike });
		k.sphere(0.3, 0xf2f2f2, { x: 0.85, y: 1.3, parent: bike, s: [1, 1.2, 1] });
		const rider = k.person({ x: -0.1, y: 0.1, z: 0, ry: PI / 2, s: 0.8, pose: "sit", colors: { shirt: 0xc02020, legs: 0x2a3050 }, parent: bike });
		void rider;
		k.disc(0xf4f1e0, 34, { x: 0, y: 34, z: -100, from: 5 });
		k.glow(0xd8e0ff, 70, { x: 0, y: 34, z: -110, opacity: 0.5, from: 5 });
		k.tick((t) => {
			bike.position.x = -7 + ((t * 1.2) % 14);
			bike.position.y = 32 + Math.sin(t * 0.8) * 0.4;
		});
		return {
			shots: [
				{ pos: [301.2, 1.1, 2.4], look: [300.1, 0.4, -0.4], fov: 45, fog: [0x0a0c18, 4, 30], exposure: 1.2 },
				{ pos: [-2, 1.7, 2], look: [9, 1.6, -19], fov: 45, exposure: 1.3 },
				{ pos: [-2, 2, -10], look: [-2, 1.2, -40], fov: 50, exposure: 1.3 },
				{ pos: [0.6, 1.2, 8.5], look: [0, 0, 2], fov: 40, exposure: 1.3 },
				{ pos: [-299.6, 1.5, 4.2], look: [-300, 1.2, -0.3], fov: 45, fog: [0x2a2420, 4, 40] },
				{ pos: [0, 24, -20], look: [0, 33, -100], fov: 30 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the time machine
	r08: (k) => {
		k.fog(0x1e2638, 30, 260);
		k.sky(0x121a32, 0x3a3a5a);
		k.stars(800);
		k.light({ sky: 0x98a8d8, ground: 0x3a3828, hemi: 1.6, sunColor: 0xb0c0ff, sunIntensity: 1.3, sunPos: [20, 50, 40], shadowSize: 60 });
		k.ground(400, 0x34402c, { bump: 0.2 });
		// A 1950s diner counter, far away on its own: stools, a soda fountain, a malt glass.
		const diner = k.group({ x: -300, y: 0, z: 0 });
		const tiles = k.canvas(128, 128, (g, w, h) => {
			for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
				g.fillStyle = (i + j) % 2 ? "#f0ece0" : "#1a1a1a";
				g.fillRect(i * 16, j * 16, 16, 16);
			}
		});
		tiles.wrapS = tiles.wrapT = k.THREE.RepeatWrapping;
		tiles.repeat.set(6, 6);
		k.box(16, 0.2, 12, k.mat(0xffffff, { map: tiles }), { y: -0.1, parent: diner });
		k.box(16, 6, 0.2, 0xe8dcc0, { y: 3, z: -3, parent: diner });
		k.box(16, 0.4, 0.22, 0x2a8a8a, { y: 2.2, z: -2.9, parent: diner });
		k.box(8, 1.1, 0.9, 0xe8e0d0, { y: 0.55, z: -0.6, parent: diner });
		k.box(8.1, 0.08, 1.0, 0xd03a3a, { y: 1.14, z: -0.6, parent: diner });
		k.box(8, 0.06, 0.92, 0xc8c8cc, { y: 0.12, z: -0.6, parent: diner, metal: 0.8, rough: 0.3 });
		for (let i = 0; i < 5; i++) {
			const x = -3 + i * 1.5;
			k.cyl(0.05, 0.12, 0.75, 0xc8c8cc, { x, y: 0.38, z: 0.4, parent: diner, metal: 0.9, rough: 0.2 });
			k.cyl(0.3, 0.3, 0.12, 0xd03a3a, { x, y: 0.8, z: 0.4, parent: diner, seg: 16 });
			k.torus(0.3, 0.03, 0xd8d8dc, { x, y: 0.8, z: 0.4, rx: PI / 2, parent: diner, metal: 0.9, rough: 0.2, seg: 20 });
		}
		k.cyl(0.08, 0.05, 0.32, 0xe8f0f0, { x: 0.2, y: 1.34, z: -0.5, parent: diner, opacity: 0.5, rough: 0.05 });
		k.cyl(0.075, 0.075, 0.2, 0xf4e0d0, { x: 0.2, y: 1.3, z: -0.5, parent: diner });
		k.cyl(0.008, 0.008, 0.3, 0xffffff, { x: 0.24, y: 1.55, z: -0.5, rz: 0.2, parent: diner });
		k.cyl(0.1, 0.11, 0.35, 0xc8c8cc, { x: 1.4, y: 1.35, z: -0.8, parent: diner, metal: 0.9, rough: 0.2 });
		k.box(2, 0.6, 0.5, 0xc8c8cc, { x: -1.5, y: 1.48, z: -2.6, parent: diner, metal: 0.8, rough: 0.3 });
		[-2.2, -1.5, -0.8].forEach((x) => k.cyl(0.03, 0.03, 0.3, 0xd8d8dc, { x, y: 1.9, z: -2.5, parent: diner, metal: 0.9 }));
		k.point(0xfff0d8, 12, 16, { x: -300, y: 4.5, z: 2 });
		k.point(0xa0e0e0, 3, 10, { x: -304, y: 3, z: 1 });
		// A skateboard on a night sidewalk, far away on its own.
		const walk = k.group({ x: 300, y: 0, z: 0 });
		for (let i = 0; i < 4; i++) k.box(1.9, 0.2, 1.9, i % 2 ? 0x8a8a84 : 0x84847e, { x: -3 + i * 2, y: 0.1, parent: walk });
		k.box(8, 0.25, 0.3, 0x9a9a94, { y: 0.08, z: 1.1, parent: walk });
		k.box(8, 0.1, 4, 0x2a2a2c, { y: -0.1, z: 3.2, parent: walk });
		k.box(8, 0.2, 4, 0x3a4a2c, { y: 0.05, z: -3, parent: walk });
		const board = k.group({ x: 0.2, y: 0.32, z: 0, ry: 0.4, parent: walk });
		k.box(0.24, 0.03, 0.85, 0x6a4a2a, { parent: board });
		[-0.3, 0.3].forEach((z) => [-0.09, 0.09].forEach((x) => k.cyl(0.035, 0.035, 0.035, 0xf0e8d0, { x, y: -0.05, z, rz: PI / 2, parent: board })));
		k.spot(0xffe0b0, 30, { x: 301.5, y: 6, z: 1.5, target: [300, 0, 0], angle: 0.4, distance: 14 });
		// The courthouse and its stopped clock.
		const hall = k.group({ x: 0, z: -40 });
		k.box(30, 12, 12, 0xc8b898, { y: 6, parent: hall });
		for (let i = 0; i < 8; i++) k.cyl(0.5, 0.6, 9, 0xe8e0d0, { x: -10.5 + i * 3, y: 4.5, z: 6.6, parent: hall });
		k.box(31, 1, 13, 0xe8e0d0, { y: 12.4, parent: hall });
		k.box(7, 9, 7, 0xc8b898, { y: 17, parent: hall });
		k.box(5, 4, 5, 0xd8d0c0, { y: 23.5, parent: hall });
		k.cone(3.8, 4, 0x4a5a4a, { y: 27.5, ry: PI / 4, seg: 4, parent: hall });
		k.cyl(2.6, 2.6, 0.3, 0xf2ead0, { y: 17.5, z: 3.6, rx: PI / 2, seg: 32, parent: hall, emissive: 0x605030, glow: 0.4 });
		for (let i = 0; i < 12; i++) k.box(0.12, 0.45, 0.05, 0x222222, { x: Math.sin((i * PI) / 6) * 2.2, y: 17.5 + Math.cos((i * PI) / 6) * 2.2, z: 3.8, rz: (-i * PI) / 6, parent: hall });
		const hand = (len, angle, w) => {
			const pivot = k.group({ y: 17.5, z: 3.85, rz: -angle, parent: hall });
			k.box(w, len, 0.06, 0x111111, { y: len / 2, parent: pivot });
		};
		hand(1.3, ((10 + 4 / 60) / 12) * 2 * PI, 0.16);
		hand(2, (4 / 60) * 2 * PI, 0.1);
		k.point(0xfff0d0, 5, 10, { x: 0, y: 17.5, z: -32, from: 2, until: 2 });
		// A cable from the tower to a lamppost, and lightning.
		k.cyl(0.04, 0.04, 30, 0x111111, { x: 6, y: 13, z: -22, rx: 1.05, ry: -0.3, from: 4 });
		k.cyl(0.15, 0.2, 7, 0x333333, { x: 8, y: 3.5, z: -8, from: 4 });
		k.glow(0xfff0c0, 2, { x: 8, y: 7.2, z: -8, from: 4 });
		// A jagged bolt: segments joined end to end, down to the spire.
		const bolt = k.group({ x: 0, y: 29.5, z: -40, from: 4 });
		const pts = [[0, 0], [1.6, 4], [-0.8, 8], [1.2, 12.5], [-1.5, 17], [0.6, 21], [-1, 26], [1, 31]];
		for (let i = 0; i < pts.length - 1; i++) {
			const [x0, y0] = pts[i];
			const [x1, y1] = pts[i + 1];
			const len = Math.hypot(x1 - x0, y1 - y0);
			k.box(0.6, len + 0.3, 0.6, 0xe8f4ff, { x: (x0 + x1) / 2, y: (y0 + y1) / 2, rz: -Math.atan2(x1 - x0, y1 - y0), parent: bolt, emissive: 0xc0e0ff, glow: 3, shadow: false });
		}
		k.glow(0xd8e8ff, 12, { x: 0, y: 29.5, z: -39, from: 4 });
		k.point(0xc0d8ff, 30, 120, { x: 0, y: 34, z: -30, from: 4 });
		// Two fire trails on a dark road.
		k.box(14, 0.05, 200, 0x2a2a2c, { x: 60, y: 0.01, z: 0 });
		for (let i = 0; i < 12; i++) k.box(0.2, 0.06, 2, 0xd8c060, { x: 60, y: 0.02, z: 8 - i * 6 });
		const fire = [];
		[-0.9, 0.9].forEach((x) => {
			for (let i = 0; i < 30; i++) fire.push(k.glow(i % 3 ? 0xff6a10 : 0xffc040, 1.2, { x: 60 + x, y: 0.35, z: -i * 1.6, from: 3 }));
		});
		k.tick((t) => fire.forEach((f, i) => f.scale.setScalar(0.8 + 0.5 * Math.abs(Math.sin(t * 9 + i)))));
		k.point(0xff6a10, 10, 30, { x: 60, y: 1, z: -15, from: 3 });
		// The car: a brushed steel wedge, gull-wing doors up, a reactor on the back.
		const car = k.group({ x: 0, y: 0, z: 30, ry: -0.6, from: 5 });
		const steel = { metal: 0.8, rough: 0.38 };
		const st = 0xc4c8cc;
		k.box(1.95, 0.5, 4.3, st, { y: 0.6, parent: car, ...steel });
		k.box(1.9, 0.28, 1.5, st, { y: 0.88, z: 1.45, rx: 0.12, parent: car, ...steel });
		k.box(1.6, 0.42, 1.3, st, { y: 1.05, z: -0.25, parent: car, ...steel });
		k.box(1.5, 0.05, 0.75, 0x141820, { y: 1.12, z: 0.62, rx: -0.95, parent: car, rough: 0.1 });
		k.box(1.85, 0.22, 1.5, st, { y: 0.92, z: -1.45, rx: -0.08, parent: car, ...steel });
		for (let i = 0; i < 6; i++) k.box(1.5, 0.04, 0.06, 0x1a1a1a, { y: 1.06, z: -0.95 - i * 0.18, parent: car });
		k.box(1.97, 0.06, 4.32, 0x2a2a2a, { y: 0.45, parent: car });
		[-1, 1].forEach((sx) => {
			const door = k.group({ x: sx * 0.75, y: 1.35, z: -0.2, rz: sx * 1.2, parent: car });
			k.box(0.05, 0.9, 1.2, st, { x: sx * 0.02, y: 0.45, parent: door, ...steel });
			k.box(0.06, 0.4, 0.9, 0x141820, { x: sx * 0.03, y: 0.65, z: 0.05, parent: door, rough: 0.1 });
		});
		[-1, 1].forEach((x) => [-1.35, 1.4].forEach((z) => k.cyl(0.31, 0.31, 0.26, 0x151515, { x: x * 0.92, y: 0.31, z, rz: PI / 2, parent: car, seg: 16 })));
		k.box(1.8, 0.2, 0.05, 0x1a1a1a, { y: 0.72, z: -2.17, parent: car });
		[-0.6, 0.6].forEach((x) => k.glow(0xff3020, 0.6, { x, y: 0.75, z: -2.2, parent: car }));
		k.cyl(0.18, 0.22, 0.45, 0xe8e8e0, { y: 1.35, z: -1.75, parent: car });
		k.cyl(0.12, 0.12, 0.15, 0x3a3a3a, { y: 1.65, z: -1.75, parent: car });
		[-0.55, 0.55].forEach((x) => k.cyl(0.07, 0.07, 1.5, 0x5a5a60, { x, y: 1.25, z: -1.6, rx: PI / 2, parent: car, metal: 0.7 }));
		[-1, 1].forEach((sx) => k.box(0.04, 0.12, 2.2, 0x60c8ff, { x: sx * 0.99, y: 0.55, z: -0.5, parent: car, emissive: 0x3090ff, glow: 1.4 }));
		[-0.6, 0.6].forEach((x) => k.box(0.4, 0.14, 0.04, 0xf0f0e0, { x, y: 0.7, z: 2.16, parent: car, emissive: 0xc0c0b0 }));
		k.glow(0x60c0ff, 1.4, { y: 1.3, z: -0.4, parent: car });
		k.spot(0xe0e8ff, 60, { x: 6, y: 7, z: 36, target: [0, 0.8, 30], angle: 0.45, distance: 25, from: 5 });
		k.point(0x60c0ff, 6, 6, { x: 0, y: 1.6, z: 29.6, from: 5 });
		const smoke = [];
		for (let i = 0; i < 10; i++) smoke.push(k.glow(0xc8d0e0, 2.5, { x: -2 + (i % 5), y: 0.3, z: 27 + (i % 3) * 1.5, opacity: 0.25, from: 5 }));
		k.tick((t) => smoke.forEach((s, i) => (s.position.y = 0.3 + 0.2 * Math.sin(t * 0.7 + i))));
		return {
			shots: [
				{ pos: [301.4, 1.3, 1.6], look: [300.1, 0.3, -0.1], fov: 45, fog: [0x101418, 4, 25] },
				{ pos: [-297.8, 1.9, 2.4], look: [-299.8, 1.1, -0.8], fov: 50, fog: [0x2a2420, 6, 40], exposure: 1.2 },
				{ pos: [0.8, 17.6, -30], look: [0, 17.5, -36], fov: 35 },
				{ pos: [61.5, 1.2, 8], look: [60, 0.3, -20], fov: 50 },
				{ pos: [22, 4, 8], look: [0, 27, -38], fov: 58, exposure: 1.2 },
				{ pos: [3.6, 1.6, 34.6], look: [0, 0.95, 30], fov: 45, exposure: 1.25 },
			],
		};
	},
};
