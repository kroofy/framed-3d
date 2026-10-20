import { PI, rng, trees, city } from "../kit.js";

// Original film sets, moved out of reels.js.
export const REELS = {
	// ----------------------------------------------------------------------------------------------- the balloons
	r09: (k) => {
		k.fog(0xbfe0f4, 80, 600);
		k.sky(0x5aa8f0, 0xdff2ff);
		k.light({ sky: 0xdff0ff, ground: 0x6a8a50, hemi: 1.2, sunPos: [30, 60, 40], sunIntensity: 2.4, shadowSize: 30 });
		k.ground(200, 0x7ab060, { bump: 0.3 });
		// The mailbox with handprints.
		k.cyl(0.08, 0.08, 1.2, 0x6a4a30, { x: 4, y: 0.6, z: 4 });
		const box = k.box(0.6, 0.45, 0.9, 0x5a7ab0, { x: 4, y: 1.4, z: 4 });
		void box;
		const prints = k.canvas(256, 128, (g) => {
			g.fillStyle = "#5a7ab0";
			g.fillRect(0, 0, 256, 128);
			[["#e85050", 60], ["#f2c230", 150]].forEach(([c, x]) => {
				g.fillStyle = c;
				g.beginPath();
				g.ellipse(x, 75, 22, 28, 0, 0, PI * 2);
				g.fill();
				for (let f = 0; f < 5; f++) {
					g.beginPath();
					g.ellipse(x - 26 + f * 13, 38 - (f === 0 ? -14 : 0), 5, 14, (f - 2) * 0.2, 0, PI * 2);
					g.fill();
				}
			});
		});
		k.plane(0.88, 0.43, k.mat(0xffffff, { map: prints }), { x: 4.31, y: 1.4, z: 4, ry: PI / 2 });
		// The little house.
		const house = (g) => {
			k.box(5, 3.4, 5, 0xe8d8a8, { y: 1.7, parent: g });
			k.box(5.1, 0.2, 5.1, 0xffffff, { y: 3.4, parent: g });
			const roof = k.cone(4.2, 2.8, 0x6a7ab0, { y: 4.8, ry: PI / 4, seg: 4, parent: g });
			void roof;
			k.box(1.1, 2, 0.1, 0x8a5a3a, { y: 1, z: 2.52, parent: g });
			[-1.6, 1.6].forEach((x) => k.box(1, 1, 0.1, 0xb0e0f0, { x, y: 2, z: 2.52, parent: g }));
			k.box(5.4, 0.15, 1.6, 0xf2ead8, { y: 0.2, z: 3.3, parent: g });
			k.box(0.7, 2, 0.7, 0xa04a3a, { x: 1.4, y: 5.4, z: -0.6, parent: g });
			for (let i = 0; i < 5; i++) k.box(1.2, 0.4, 0.06, [0xe85a8a, 0x5ab0e8, 0xf2c230, 0x7ad070, 0xc080e0][i], { x: -1.9, y: 0.5 + i * 0.55, z: 2.54, parent: g });
		};
		const ground = k.group({ x: -4, z: -4, from: 1 });
		house(ground);
		const palette = [0xff4a5a, 0xffb020, 0x4ac0ff, 0x8ae05a, 0xe070ff, 0xfff050, 0xff7ab0, 0x50e0c0];
		const bunch = (g, n, rad, cy, seed) => {
			const r = rng(seed);
			for (let i = 0; i < n; i++) {
				const v = new k.THREE.Vector3().randomDirection();
				const d = Math.cbrt(r()) * rad;
				k.sphere(0.45 + r() * 0.15, palette[i % palette.length], { x: 1.4 + v.x * d, y: cy + v.y * d * 0.7, z: -0.6 + v.z * d, parent: g, seg: 8, rings: 6, rough: 0.3, s: [1, 1.15, 1] });
			}
		};
		bunch(ground, 18, 1.4, 8, 3);
		k.cyl(0.01, 0.01, 2, 0xffffff, { x: -2.6, y: 6.4, z: -4.6, from: 1 });
		// Up above the clouds.
		const flying = k.group({ x: 0, y: 120, z: 0, from: 3 });
		house(flying);
		bunch(flying, 260, 6, 14, 9);
		for (let i = 0; i < 40; i++) k.cyl(0.01, 0.01, 6, 0xffffff, { x: 1.4 + Math.sin(i) * 0.5, y: 8.2, z: -0.6 + Math.cos(i) * 0.5, rz: Math.sin(i * 3) * 0.25, rx: Math.cos(i * 2) * 0.25, parent: flying, shadow: false });
		k.tick((t) => {
			flying.position.y = 120 + Math.sin(t * 0.6) * 0.6;
			flying.rotation.y = Math.sin(t * 0.2) * 0.2;
		});
		const r = rng(4);
		for (let i = 0; i < 40; i++) k.sphere(8 + r() * 10, 0xffffff, { x: (r() - 0.5) * 300, y: 95 + r() * 6, z: (r() - 0.5) * 300, s: [1.6, 0.5, 1], seg: 8, rings: 6, rough: 1, from: 3 });
		// The falls.
		const falls = k.group({ x: 0, y: 0, z: -400, from: 4 });
		k.cyl(40, 50, 70, 0x6a5a48, { y: 35, seg: 9, parent: falls, rough: 1 });
		k.cyl(40.5, 40.5, 2, 0x5a9a48, { y: 70.5, seg: 9, parent: falls });
		k.box(10, 68, 2, 0xe0f4ff, { y: 36, z: 40, parent: falls, emissive: 0x6080a0, glow: 0.4, opacity: 0.85 });
		k.glow(0xffffff, 30, { y: 4, z: 44, parent: falls, opacity: 0.6, fog: true });
		trees(k, 60, [-150, 150, -460, -330], { color: 0x2a6a30, h: 12, avoid: (x, z) => Math.hypot(x, z + 400) < 52 });
		k.ground(400, 0x3a7a3a, { y: -1, z: -400, bump: 2, from: 4 });
		const atop = k.group({ x: 10, y: 71, z: -395, ry: 0.6, from: 5 });
		house(atop);
		bunch(atop, 120, 4.5, 11, 12);
		return {
			shots: [
				{ pos: [6.6, 1.5, 4.2], look: [4.3, 1.4, 4], fov: 35 },
				{ pos: [10, 2.2, 12], look: [-4, 2.5, -4], fov: 40 },
				{ pos: [6, 2, 10], look: [-2.6, 6.5, -4.6], fov: 50 },
				{ pos: [18, 126, 22], look: [0, 128, 0], fov: 50 },
				{ pos: [0, 30, -260], look: [0, 40, -400], fov: 45 },
				{ pos: [40, 85, -330], look: [8, 76, -395], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the idol
	r10: (k) => {
		k.fog(0x1a1208, 6, 70);
		k.sky(0x0a0804, 0x2a1a0a);
		k.light({ sky: 0xd0a060, ground: 0x2a1a0c, hemi: 1.3, sun: false });
		const stone = 0x5a4a38;
		// Wall torches keep the corridor readable.
		for (let i = 0; i < 5; i++) {
			const x = i % 2 ? 4.2 : -4.2, z = -48 + i * 11;
			k.cyl(0.08, 0.05, 0.6, 0x3a2414, { x, y: 3.2, z });
			k.glow(0xffa040, 1.2, { x, y: 3.6, z });
			k.point(0xffa050, 18, 18, { x: x * 0.8, y: 3.8, z });
		}
		// The corridor along -z, ending at the altar room.
		k.box(10, 0.5, 80, 0x3a2e22, { y: -0.25, z: -20 });
		[-5, 5].forEach((x) => k.box(1, 9, 80, stone, { x, y: 4.5, z: -20, rough: 1 }));
		k.box(10, 1, 80, 0x2a2018, { y: 9, z: -20 });
		const r = rng(8);
		for (let i = 0; i < 30; i++) k.box(0.6 + r(), 0.5 + r(), 0.3, 0x6a5840, { x: (r() > 0.5 ? 1 : -1) * 4.45, y: r() * 8, z: -58 + r() * 76 });
		for (let i = 0; i < 6; i++) k.spot(0xffe0a0, 25, { x: (i % 2 ? 2 : -2), y: 9, z: -50 + i * 12, target: [0, 0, -50 + i * 12], angle: 0.25, distance: 14 });
		// Webs and light shafts.
		const web = k.canvas(256, 256, (g) => {
			g.strokeStyle = "rgba(230,230,220,0.7)";
			g.lineWidth = 1.5;
			for (let i = 0; i < 12; i++) {
				g.beginPath();
				g.moveTo(128, 128);
				g.lineTo(128 + Math.cos((i * PI) / 6) * 128, 128 + Math.sin((i * PI) / 6) * 128);
				g.stroke();
			}
			for (let rr = 12; rr < 128; rr += 14) {
				g.beginPath();
				for (let i = 0; i <= 12; i++) g.lineTo(128 + Math.cos((i * PI) / 6) * rr, 128 + Math.sin((i * PI) / 6) * rr);
				g.stroke();
			}
		});
		const webMat = new k.THREE.MeshBasicMaterial({ map: web, transparent: true, side: k.THREE.DoubleSide, depthWrite: false });
		k.plane(4, 4, webMat, { x: -3, y: 6, z: 10, ry: 0.4 });
		k.plane(3, 3, webMat, { x: 3.5, y: 2.2, z: 6, ry: -0.6 });
		const shaft = new k.THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.12, depthWrite: false, blending: k.THREE.AdditiveBlending });
		for (let i = 0; i < 4; i++) k.mesh(new k.THREE.CylinderGeometry(0.3, 1, 9, 8, 1, true), shaft, { x: -2 + i * 1.4, y: 4.5, z: 8 - i * 2, rz: 0.15, shadow: false });
		k.particles(300, 0xffe8c0, { box: [8, 8, 30], z: 0, speed: 0.15, size: 0.03, opacity: 0.6, drift: 0.2 });
		// The altar room at the end, with the idol.
		k.cyl(0.8, 1, 2.2, 0x6a5a48, { x: 0, y: 1.1, z: -55, seg: 8 });
		const idol = k.group({ x: 0, y: 2.2, z: -55, from: 1 });
		const gold = { metal: 1, rough: 0.25, emissive: 0x302000 };
		k.box(0.42, 0.55, 0.32, 0xd8a83a, { y: 0.35, parent: idol, ...gold });
		k.sphere(0.28, 0xd8a83a, { y: 0.85, parent: idol, s: [1, 1.1, 0.9], ...gold });
		k.box(0.5, 0.18, 0.36, 0xd8a83a, { y: 0.08, parent: idol, ...gold });
		[-0.1, 0.1].forEach((x) => k.sphere(0.04, 0x111111, { x, y: 0.9, z: 0.24, parent: idol }));
		k.spot(0xfff0c0, 60, { x: 0, y: 8.5, z: -54, target: [0, 2.5, -55], angle: 0.18, penumbra: 0.3, distance: 12, cast: true });
		k.sphere(0.32, 0xb89a68, { x: 1.4, y: 0.32, z: -54.4, s: [1, 1.2, 1], rough: 1, from: 2 });
		k.cyl(0.06, 0.1, 0.25, 0xb89a68, { x: 1.4, y: 0.72, z: -54.4, from: 2 });
		// Hat and whip on the floor.
		const hat = k.group({ x: -2, y: 0.03, z: -45, ry: 0.4, from: 3 });
		k.cyl(0.5, 0.5, 0.04, 0x6a4a2a, { parent: hat, seg: 20 });
		k.cyl(0.24, 0.3, 0.3, 0x6a4a2a, { y: 0.17, parent: hat, seg: 16 });
		k.cyl(0.305, 0.305, 0.07, 0x2a1a10, { y: 0.06, parent: hat, seg: 16 });
		k.torus(0.5, 0.04, 0x3a2414, { x: -2.6, y: 0.04, z: -46, rx: PI / 2, seg: 20, from: 3 });
		k.torus(0.4, 0.035, 0x3a2414, { x: -2.6, y: 0.08, z: -46.1, rx: PI / 2, seg: 20, from: 3 });
		// The boulder and the runner.
		const boulder = k.ico(4, 0x7a6a50, { x: 0, y: 4, z: -40, detail: 1, rough: 1, from: 4 });
		const runner = k.person({ x: 0, y: 0, z: -30, ry: 0, pose: "run", hat: 0x6a4a2a, colors: { shirt: 0xc8b088, legs: 0x8a7050, skin: 0xd8a888, hair: 0x3a2618 }, sleeves: 0xc8b088, from: 5 });
		k.box(0.55, 0.75, 0.3, 0x5a3a24, { y: 1.2, z: -0.05, parent: runner });
		k.tick((t) => {
			const p = (t * 0.25) % 1;
			boulder.position.z = -44 + p * 14;
			boulder.rotation.x = -boulder.position.z / 4;
			runner.position.z = boulder.position.z + 9;
			const l = runner.userData.limbs;
			l.legL.rotation.x = Math.sin(t * 10) * 0.8;
			l.legR.rotation.x = -Math.sin(t * 10) * 0.8;
			l.armL.rotation.x = -Math.sin(t * 10) * 0.9;
			l.armR.rotation.x = Math.sin(t * 10) * 0.9;
		});
		return {
			shots: [
				{ pos: [0, 2.2, 14], look: [-1, 4, 6], fov: 50 },
				{ pos: [0.7, 3.3, -53.4], look: [0, 2.8, -55], fov: 40 },
				{ pos: [3, 1.6, -51], look: [0.6, 1.5, -55], fov: 45 },
				{ pos: [-1, 1.2, -43], look: [-2.3, 0, -45.6], fov: 45, exposure: 1.5 },
				{ pos: [3.5, 2.5, -14], look: [0, 3.5, -35], fov: 50, exposure: 1.6 },
				{ pos: [-2, 2, -6], look: [0, 3, -32], fov: 55, exposure: 1.6 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the hotel
	r11: (k) => {
		k.fog(0x2a1810, 8, 60);
		k.sky(0x1a100a, 0x2a1810);
		k.light({ sky: 0xffd8b0, ground: 0x2a1408, hemi: 0.9, sun: false });
		const carpet = k.canvas(512, 512, (g) => {
			g.fillStyle = "#8a2a10";
			g.fillRect(0, 0, 512, 512);
			const hex = (cx, cy, r, fill, stroke) => {
				g.beginPath();
				for (let i = 0; i < 6; i++) g.lineTo(cx + r * Math.cos((i * PI) / 3), cy + r * Math.sin((i * PI) / 3));
				g.closePath();
				if (fill) {
					g.fillStyle = fill;
					g.fill();
				}
				if (stroke) {
					g.strokeStyle = stroke;
					g.lineWidth = 9;
					g.stroke();
				}
			};
			for (let y = -1; y < 6; y++)
				for (let x = -1; x < 5; x++) {
					const cx = x * 128 + (y % 2 ? 64 : 0);
					const cy = y * 96;
					hex(cx, cy, 60, "#3a1a0e", "#e86a10");
					hex(cx, cy, 32, "#8a2a10", "#e86a10");
				}
		});
		carpet.wrapS = carpet.wrapT = k.THREE.RepeatWrapping;
		carpet.repeat.set(2, 30);
		// The hallway along -z.
		k.plane(5, 75, k.mat(0xffffff, { map: carpet, rough: 1 }), { y: 0.01, z: -30, rx: -PI / 2 });
		[-2.5, 2.5].forEach((x) => k.box(0.2, 4, 75, 0xe8dcc0, { x, y: 2, z: -30 }));
		k.box(5, 0.2, 75, 0xf0e8d8, { y: 4, z: -30 });
		k.box(5, 4, 0.2, 0xe8dcc0, { y: 2, z: -67 });
		for (let i = 0; i < 8; i++) {
			const z = -4 - i * 8;
			k.point(0xffe0b0, 3, 10, { y: 3.6, z });
			k.glow(0xfff0d0, 0.8, { y: 3.85, z });
			[-1, 1].forEach((s) => k.box(0.1, 2.6, 1.3, 0x7a3a1a, { x: s * 2.38, y: 1.3, z: z - 3 }));
		}
		// The tricycle.
		const trike = k.group({ x: 0.5, y: 0, z: -2, ry: 0.4, from: 1 });
		k.torus(0.32, 0.05, 0x111111, { z: 0.6, ry: PI / 2, parent: trike });
		[-0.35, 0.35].forEach((x) => k.torus(0.2, 0.04, 0x111111, { x, y: -0.12, z: -0.3, ry: PI / 2, parent: trike }));
		k.box(0.06, 0.06, 1, 0xc02020, { y: 0.35, z: 0.1, parent: trike });
		k.box(0.6, 0.05, 0.06, 0xc02020, { y: 0.1, z: -0.3, parent: trike });
		k.box(0.25, 0.08, 0.3, 0x222222, { y: 0.45, z: -0.05, parent: trike });
		k.box(0.5, 0.05, 0.05, 0xd8d8d8, { y: 0.8, z: 0.55, parent: trike, metal: 0.8 });
		// The twins at the far end.
		[-0.45, 0.45].forEach((x) => k.person({ x, y: 0, z: -64, ry: 0, s: 0.75, dress: 0x9ac0e0, colors: { shirt: 0x9ac0e0, legs: 0xf0f0f0, hair: 0x6a4020, skin: 0xf0d0b8 }, from: 2 }));
		// Room 237.
		const doorTex = k.canvas(256, 512, (g) => {
			g.fillStyle = "#6a2a14";
			g.fillRect(0, 0, 256, 512);
			g.strokeStyle = "#4a1a0a";
			g.lineWidth = 8;
			g.strokeRect(30, 40, 196, 180);
			g.strokeRect(30, 260, 196, 210);
			g.fillStyle = "#d8b060";
			g.font = "bold 46px Georgia";
			g.textAlign = "center";
			g.fillText("237", 128, 140);
		});
		k.plane(1.3, 2.6, k.mat(0xffffff, { map: doorTex }), { x: 2.32, y: 1.3, z: -31, ry: -PI / 2, from: 3 });
		// The maze in snow.
		const maze = k.group({ x: 0, y: 0, z: 400, from: 4 });
		k.box(140, 0.2, 140, 0xf4f6fa, { parent: maze });
		const grid = [
			"###########",
			"#...#.....#",
			"#.#.#.###.#",
			"#.#...#...#",
			"#.#####.###",
			"#.....#...#",
			"###.#.###.#",
			"#...#.....#",
			"#.###.###.#",
			"#...#...#.#",
			"#####.#####",
		];
		grid.forEach((row, z) => [...row].forEach((c, x) => {
			if (c === "#") k.box(8, 4, 8, 0x2a4a2a, { x: (x - 5) * 8, y: 2, z: (z - 5) * 8, parent: maze });
			if (c === "#") k.box(8.1, 0.5, 8.1, 0xf4f6fa, { x: (x - 5) * 8, y: 4.2, z: (z - 5) * 8, parent: maze });
		}));
		k.particles(1500, 0xffffff, { box: [100, 50, 100], z: 400, speed: 2, size: 0.25, drift: 1 });
		k.point(0xd0e0ff, 2, 400, { x: 0, y: 80, z: 400, decay: 0, from: 4 });
		// The broken door and the axe.
		const door = k.group({ x: -300, y: 0, z: 0, from: 5 });
		k.box(1.6, 3, 0.15, 0xe8e0d0, { y: 1.5, parent: door });
		k.box(0.6, 0.7, 0.2, 0x1a1008, { x: 0.2, y: 1.8, z: 0.01, parent: door });
		k.sphere(0.2, 0xe0b090, { x: 0.2, y: 1.75, z: -0.05, parent: door });
		k.box(0.06, 0.2, 0.05, 0x111111, { x: 0.15, y: 1.7, z: 0.16, parent: door });
		k.box(0.5, 0.25, 0.03, 0xc8c8cc, { x: -0.3, y: 2.3, z: 0.15, rz: 0.5, parent: door, metal: 0.9 });
		k.box(0.06, 1, 0.06, 0x5a3a20, { x: -0.6, y: 2.0, z: 0.25, rz: -1, parent: door });
		k.box(10, 4, 0.1, 0xf0e8d8, { y: 2, z: -0.1, parent: door });
		k.point(0xfff0e0, 4, 10, { x: -300, y: 2.5, z: 3 });
		return {
			shots: [
				{ pos: [0.3, 1.4, -6], look: [0, 0, -8], fov: 40 },
				{ pos: [-0.6, 0.8, 2], look: [0.5, 0.3, -2], fov: 45 },
				{ pos: [0, 1.2, -10], look: [0, 1, -64], fov: 35 },
				{ pos: [-1.6, 1.6, -27.5], look: [2.3, 1.4, -31], fov: 45 },
				{ pos: [30, 60, 460], look: [0, 0, 400], fov: 45, fog: [0xc8d4e4, 80, 320], exposure: 1.3 },
				{ pos: [-299.8, 1.8, 2], look: [-300, 1.9, 0], fov: 45, fog: [0x1a1410, 1, 30] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the black hole
	r12: (k) => {
		k.fog(0xc8b890, 60, 400);
		k.sky(0x9ab0c8, 0xe8d8b0);
		k.light({ sky: 0xf0e8d0, ground: 0x6a5a30, hemi: 1.1, sunColor: 0xfff0d0, sunIntensity: 2, sunPos: [40, 40, 30], shadowSize: 50 });
		// Dust lines on a floorboard.
		const dust = k.group({ x: -300, y: 0, z: 0 });
		for (let i = 0; i < 12; i++) k.box(0.9, 0.02, 6, 0x8a6a48, { x: -5 + i * 0.92, y: 0, parent: dust });
		[0, 1, 1, 0, 1, 0, 0, 1].forEach((b, i) => k.box(b ? 0.5 : 0.15, 0.03, 4.5, 0xd8d0c0, { x: -3.2 + i * 0.8, y: 0.02, parent: dust }));
		k.particles(400, 0xffffff, { x: -300, box: [10, 6, 6], speed: 0.4, size: 0.03, opacity: 0.6 });
		k.spot(0xfff0d0, 30, { x: -300, y: 6, z: 3, target: [-300, 0, 0], angle: 0.5 });
		// The corn and the farmhouse.
		const corn = k.group({ from: 1 });
		for (let x = -40; x <= 40; x += 2.2)
			for (let z = 0; z < 50; z += 1.6) {
				const h = 2.2 + Math.sin(x * 3 + z) * 0.3;
				k.cyl(0.05, 0.07, h, 0x6a8a3a, { x: x + Math.sin(z) * 0.3, y: h / 2, z, parent: corn, seg: 4, shadow: false });
				k.cone(0.35, 0.7, 0x8aaa4a, { x: x + Math.sin(z) * 0.3, y: h, z, parent: corn, seg: 4, shadow: false });
			}
		k.ground(400, 0x8a7a48, { bump: 0.4 });
		const farm = k.group({ x: -10, z: -30, from: 1 });
		k.box(10, 6, 7, 0xe8e0d0, { y: 3, parent: farm });
		k.cone(7.5, 3.5, 0x5a5a5a, { y: 7.7, ry: PI / 4, seg: 4, s: [1, 1, 0.75], parent: farm });
		k.box(10.6, 0.3, 2.6, 0xd8d0c0, { y: 2.6, z: 4.6, parent: farm });
		k.box(0.3, 9, 0.3, 0xcac0b0, { x: 14, y: 4.5, z: -32 });
		// The water planet: a mountain of a wave.
		const ocean = k.group({ x: 0, y: 600, z: 0, from: 2 });
		k.water(600, 0x6a8a98, { y: 600, seg: 60, amp: 0.2, from: 2 });
		const wave = new k.THREE.CylinderGeometry(200, 200, 180, 48, 1, true, -0.5, 1);
		const waveMesh = k.mesh(wave, k.mat(0x5a7a88, { side: k.THREE.DoubleSide, rough: 0.3 }), { y: 40, z: 120, parent: ocean, s: [1, 1, 0.2], from: 2 });
		void waveMesh;
		k.box(400, 180, 6, 0x5a7a88, { y: 70, z: -170, rx: -0.15, parent: ocean, opacity: 0.95 });
		k.box(400, 6, 10, 0xe8f0f4, { y: 159, z: -183, rx: -0.15, parent: ocean });
		const ranger = k.group({ x: 0, y: 2, z: -10, parent: ocean });
		k.box(3, 1.2, 8, 0xe8e8e0, { parent: ranger });
		k.box(2, 0.8, 3, 0x2a2a2a, { y: 0.8, z: 1.5, parent: ranger });
		[-1, 1].forEach((s) => k.box(4, 0.2, 3, 0xe0e0d8, { x: s * 3, z: -1.5, parent: ranger }));
		// The ring ship.
		const space = k.group({ y: -600 });
		k.stars(3000, { y: -600, upper: false, r: 700 });
		const ring = k.group({ x: 0, y: 0, z: 0, rx: 1.2, parent: space, from: 3 });
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * PI * 2;
			k.box(5, 2.5, 3, 0xd8d8d8, { x: Math.cos(a) * 14, y: Math.sin(a) * 14, rz: a + PI / 2, parent: ring, metal: 0.4 });
		}
		k.cyl(1.4, 1.4, 6, 0xcacaca, { rx: PI / 2, parent: ring });
		k.tick((t) => (ring.rotation.z = t * 0.3));
		k.point(0xfff0d0, 3, 400, { x: 60, y: 30, z: 80, parent: space });
		// The black hole.
		const hole = k.group({ x: 0, y: -10, z: -200, parent: space, from: 4 });
		k.sphere(40, 0x000000, { parent: hole, seg: 48, rings: 32 });
		const diskTex = k.canvas(512, 64, (g) => {
			const grad = g.createLinearGradient(0, 0, 512, 0);
			grad.addColorStop(0, "rgba(255,240,200,1)");
			grad.addColorStop(0.5, "rgba(255,170,80,0.8)");
			grad.addColorStop(1, "rgba(120,40,10,0)");
			g.fillStyle = grad;
			g.fillRect(0, 0, 512, 64);
			for (let i = 0; i < 200; i++) {
				g.fillStyle = `rgba(255,255,230,${Math.random() * 0.3})`;
				g.fillRect(Math.random() * 512, Math.random() * 64, 30, 1);
			}
		});
		const diskMat = new k.THREE.MeshBasicMaterial({ map: diskTex, transparent: true, side: k.THREE.DoubleSide, blending: k.THREE.AdditiveBlending, depthWrite: false, fog: false });
		const disk = new k.THREE.RingGeometry(46, 140, 96, 1);
		const uv = disk.attributes.uv;
		const pos = disk.attributes.position;
		for (let i = 0; i < uv.count; i++) {
			const rr = Math.hypot(pos.getX(i), pos.getY(i));
			uv.setXY(i, (rr - 46) / 94, (Math.atan2(pos.getY(i), pos.getX(i)) / PI + 1) / 2);
		}
		const flat = k.mesh(disk, diskMat, { rx: PI / 2 - 0.08, parent: hole, shadow: false });
		const halo = k.mesh(new k.THREE.RingGeometry(41, 70, 96, 1), diskMat, { parent: hole, shadow: false, s: [1, 1, 1] });
		k.tick((t) => {
			flat.rotation.z = t * 0.05;
		});
		k.glow(0xffc070, 260, { parent: hole, opacity: 0.25 });
		// Inside the tesseract.
		const tess = k.group({ x: 0, y: 0, z: 600, from: 5 });
		const r = rng(6);
		for (let i = 0; i < 300; i++) {
			const axis = i % 3;
			const len = 30;
			const a = Math.floor(r() * 10) * 3 - 15;
			const b = Math.floor(r() * 10) * 3 - 15;
			const p = axis === 0 ? [0, a, b] : axis === 1 ? [a, 0, b] : [a, b, 0];
			const s = axis === 0 ? [len, 0.25, 0.25] : axis === 1 ? [0.25, len, 0.25] : [0.25, 0.25, len];
			k.box(s[0], s[1], s[2], r() > 0.7 ? 0xd8b070 : 0x6a4a2a, { x: p[0], y: p[1], z: p[2], parent: tess, emissive: 0x2a1404 });
		}
		k.point(0xffd8a0, 4, 80, { x: 0, y: 0, z: 600, decay: 0.5 });
		k.person({ x: 0, y: -1, z: 600, pose: "arms-out", rz: 0.4, colors: { shirt: 0xe8e8e0, legs: 0xe8e8e0, skin: 0xe8e8e0, hair: 0x2a2a2a }, from: 5 });
		return {
			shots: [
				{ pos: [-300, 3, 4], look: [-300, 0, 0], fov: 45, hide: ["stars"] },
				{ pos: [6, 3, 52], look: [-6, 4, -20], fov: 45, hide: ["stars"] },
				{ pos: [30, 605, 40], look: [0, 640, -150], fov: 60, hide: ["stars"] },
				{ pos: [40, -580, 50], look: [0, -600, 0], fov: 45, fog: [0x000006, 900, 3000] },
				{ pos: [0, -588, 120], look: [0, -605, -200], fov: 50, fog: [0x000006, 900, 3000] },
				{ pos: [6, 2, 612], look: [0, 0, 600], fov: 60, fog: [0x2a1a0a, 5, 60] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the ape (black & white)
	r13: (k) => {
		k.fog(0x8a8a8a, 80, 500);
		k.sky(0x5a5a62, 0xc8c8c8);
		k.light({ sky: 0xffffff, ground: 0x303030, hemi: 1.0, sunPos: [60, 80, 40], sunIntensity: 2.4, shadowSize: 60, sunTarget: [0, 90, 0] });
		city(k, 220, [-200, 200, -200, 200], { h: 40, w: 9, colors: [0x7a7a7a, 0x8a8a8a, 0x6a6a6a], avoid: (x, z) => Math.hypot(x, z) < 22, seed: 13 });
		k.box(500, 1, 500, 0x3a3a3a, { y: -0.5 });
		// The tower: stepped setbacks, then the mast.
		const t = k.group();
		[[22, 60], [17, 20], [13, 16], [9, 10], [6, 6]].reduce((y, [w, h]) => {
			k.box(w, h, w, 0xb8b8b4, { y: y + h / 2, parent: t });
			return y + h;
		}, 0);
		k.cyl(2.2, 2.6, 8, 0xc8c8c4, { y: 116, parent: t, seg: 8 });
		k.cyl(0.6, 1.4, 12, 0xd0d0cc, { y: 126, parent: t, seg: 8 });
		k.cyl(0.15, 0.4, 8, 0xd0d0cc, { y: 136, parent: t });
		// Biplanes.
		const plane = (o) => {
			const g = k.group(o);
			k.box(0.8, 0.8, 4, 0x5a5a5a, { parent: g });
			[0.7, -0.4].forEach((y) => k.box(7, 0.1, 1.2, 0x8a8a8a, { y, z: 0.6, parent: g }));
			k.box(2.4, 0.08, 0.8, 0x8a8a8a, { z: -1.8, parent: g });
			k.box(0.08, 0.8, 0.8, 0x8a8a8a, { y: 0.4, z: -1.8, parent: g });
			const prop = k.box(1.8, 0.12, 0.05, 0x222222, { z: 2.05, parent: g });
			k.tick((tt) => (prop.rotation.z = tt * 30));
			[-2, 2].forEach((x) => k.box(0.06, 1.1, 0.06, 0x444444, { x, y: 0.15, z: 0.6, parent: g }));
			return g;
		};
		const planes = [0, 1, 2, 3].map((i) => plane({ from: i === 0 ? 0 : 1 }));
		k.tick((tt) => planes.forEach((p, i) => {
			const a = tt * 0.25 + (i * PI) / 2;
			const rad = 30 + i * 6;
			p.position.set(Math.cos(a) * rad, 120 + i * 4 + Math.sin(tt + i) * 2, Math.sin(a) * rad);
			p.rotation.set(0, -a + PI, 0.5);
		}));
		// The ape on the mast, with a woman in his hand.
		const ape = k.group({ x: 2.6, y: 112, z: 1.6, ry: 0.8, from: 4 });
		const fur = 0x2a2624;
		k.sphere(3, fur, { y: 4, parent: ape, s: [1, 1.2, 0.9] });
		k.sphere(1.6, fur, { y: 8, z: 0.4, parent: ape });
		k.sphere(0.9, 0x5a5048, { y: 7.6, z: 1.6, parent: ape, s: [1.2, 0.8, 0.8] });
		[-0.55, 0.55].forEach((x) => k.sphere(0.18, 0xe8e8e8, { x, y: 8.4, z: 1.45, parent: ape }));
		k.box(1.2, 5, 1.2, fur, { x: -3, y: 6.5, z: -0.3, rz: 0.4, parent: ape });
		k.box(1.2, 5.5, 1.2, fur, { x: 3.2, y: 7, z: 0.5, rz: -1.2, parent: ape });
		k.box(1.4, 4, 1.4, fur, { x: -1.4, y: 0.6, parent: ape });
		k.box(1.4, 4, 1.4, fur, { x: 1.4, y: 0.6, parent: ape });
		k.person({ x: -4.2, y: 8.6, z: 0.4, s: 0.45, dress: 0xf0f0f0, colors: { shirt: 0xf0f0f0, hair: 0xe8e0c0 }, parent: ape, rz: 0.4 });
		return {
			shots: [
				{ pos: [55, 128, 10], look: [30, 122, 0], fov: 30, filter: "grayscale(1) contrast(1.25) brightness(1.05)" },
				{ pos: [70, 115, 70], look: [0, 122, 0], fov: 45, filter: "grayscale(1) contrast(1.25) brightness(1.05)" },
				{ pos: [120, 160, 140], look: [0, 30, 0], fov: 45, filter: "grayscale(1) contrast(1.25) brightness(1.05)" },
				{ pos: [40, 90, 60], look: [0, 110, 0], fov: 45, filter: "grayscale(1) contrast(1.25) brightness(1.05)" },
				{ pos: [26, 112, 26], look: [2, 120, 0], fov: 50, filter: "grayscale(1) contrast(1.25) brightness(1.05)" },
				{ pos: [-30, 140, 40], look: [0, 118, 0], fov: 50, filter: "grayscale(1) contrast(1.25) brightness(1.05)" },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the road
	r14: (k) => {
		k.fog(0xb8d8a0, 60, 400);
		k.sky(0x6ab0e8, 0xe8f4d0);
		k.light({ sky: 0xf0ffe0, ground: 0x5a7a30, hemi: 1.2, sunPos: [40, 60, 30], sunIntensity: 2.3, shadowSize: 50 });
		k.ground(500, 0x6aa040, { bump: 1.2, seg: 50 });
		// Kansas: a farmhouse in sepia and a twister.
		const kansas = k.group({ x: -300, z: 0 });
		k.ground(200, 0x9a8a5a, { parent: kansas, y: 0.1, bump: 0.2, seg: 10 });
		k.box(8, 5, 6, 0xd8d0c0, { x: 10, y: 2.5, z: -10, parent: kansas });
		k.cone(6, 3, 0x6a5a4a, { x: 10, y: 6.5, z: -10, ry: PI / 4, seg: 4, s: [1, 1, 0.75], parent: kansas });
		k.cyl(0.1, 0.15, 10, 0x6a5a4a, { x: -8, y: 5, z: -14, parent: kansas });
		const mill = k.group({ x: -8, y: 10, z: -13.6, parent: kansas });
		for (let i = 0; i < 8; i++) k.box(0.3, 2.5, 0.05, 0x8a7a6a, { y: 1.25, parent: k.group({ rz: (i * PI) / 4, parent: mill }) });
		const twister = k.group({ x: -280, z: -80 });
		for (let i = 0; i < 14; i++) k.cyl(2 + i * 1.6, 1.4 + i * 1.6, 6, 0x5a4a3a, { y: 3 + i * 5.6, parent: twister, seg: 9, opacity: 0.85, open: true, side: 2 });
		k.tick((t) => {
			twister.rotation.y = t * 2;
			twister.position.x = -280 + Math.sin(t * 0.3) * 10;
			mill.rotation.z = t * 3;
		});
		// The house, spinning in the funnel.
		const house = k.group({ x: -300, y: 60, z: -60, from: 1 });
		k.box(8, 5, 6, 0xd8d0c0, { y: 2.5, parent: house });
		k.cone(6, 3, 0x6a5a4a, { y: 6.5, ry: PI / 4, seg: 4, s: [1, 1, 0.75], parent: house });
		k.tick((t) => {
			house.rotation.set(Math.sin(t) * 0.3, t * 0.8, Math.cos(t * 0.7) * 0.3);
			house.position.y = 60 + Math.sin(t * 0.5) * 3;
		});
		// The yellow brick spiral.
		const bricks = k.mat(0xf2c230, { rough: 0.6 });
		for (let i = 0; i < 260; i++) {
			const a = i * 0.11;
			const rr = 0.8 + a * 0.7;
			k.box(0.9, 0.1, 0.5, bricks, { x: Math.cos(a) * rr, y: 0.05, z: Math.sin(a) * rr, ry: -a, shadow: false });
		}
		for (let i = 0; i < 160; i++) k.box(1.4, 0.1, 3.2, bricks, { x: 20 + i * 0.05, y: 0.06, z: -(Math.sin(i * 0.05) * 6) - i * 1.8 - 10, ry: 0.05, shadow: false, from: 2 });
		// The shoes, and the striped legs under the house.
		const shoes = k.group({ x: 200, y: 2, z: 0, from: 3 });
		k.box(30, 0.2, 30, 0x6aa040, { parent: shoes });
		k.box(8, 5, 6, 0xd8d0c0, { y: 2.6, z: -3, rx: 0.15, parent: shoes });
		const stripes = k.canvas(32, 128, (g) => {
			for (let i = 0; i < 16; i++) {
				g.fillStyle = i % 2 ? "#111" : "#eee";
				g.fillRect(0, i * 8, 32, 8);
			}
		});
		[-0.4, 0.4].forEach((x) => {
			k.cyl(0.15, 0.15, 2, k.mat(0xffffff, { map: stripes }), { x, y: 0.4, z: 0.6, rx: PI / 2 - 0.1, parent: shoes });
			k.box(0.4, 0.3, 0.7, 0xc0101a, { x, y: 0.3, z: 1.75, parent: shoes, metal: 0.6, rough: 0.2, emissive: 0x400000 });
			for (let i = 0; i < 6; i++) k.glow(0xff4040, 0.25, { x: x + (Math.random() - 0.5) * 0.3, y: 0.45, z: 1.5 + Math.random() * 0.5, parent: shoes });
		});
		// The scarecrow.
		k.box(0.12, 3.5, 0.12, 0x6a4a2a, { x: 4, y: 1.75, z: -14, from: 4 });
		k.box(2.6, 0.12, 0.12, 0x6a4a2a, { x: 4, y: 2.9, z: -14, from: 4 });
		k.person({ x: 4, y: 1.2, z: -13.85, pose: "arms-out", hat: 0x5a4a2a, colors: { shirt: 0x5a6a3a, legs: 0x8a7a4a, skin: 0xd8c890, hair: 0xe8c860 }, from: 4 });
		// The city of green glass at the end of the road.
		const oz = k.group({ x: 30, z: -320, from: 5 });
		const glass = { metal: 0.3, rough: 0.15, emissive: 0x0a4020 };
		for (let i = 0; i < 18; i++) {
			const h = 20 + ((i * 37) % 60);
			const x = (i - 9) * 7 + Math.sin(i) * 3;
			k.cyl(2.5 + (i % 3), 3 + (i % 3), h, 0x2ac060, { x, y: h / 2, z: Math.cos(i * 2) * 8, parent: oz, seg: 6, ...glass });
			k.cone(2.5 + (i % 3), 10, 0x5ae890, { x, y: h + 5, z: Math.cos(i * 2) * 8, parent: oz, seg: 6, ...glass });
		}
		k.glow(0x80ffb0, 120, { x: 30, y: 30, z: -330, opacity: 0.35, fog: false, from: 5 });
		return {
			shots: [
				{ pos: [-300, 6, 60], look: [-285, 30, -80], fov: 50, filter: "sepia(0.85) contrast(1.1) brightness(0.95)" },
				{ pos: [-290, 55, -30], look: [-300, 62, -60], fov: 50, filter: "sepia(0.85) contrast(1.1) brightness(0.95)" },
				{ pos: [0, 22, 1], look: [0, 0, 0], fov: 45 },
				{ pos: [201.6, 3.4, 4.2], look: [200, 2.4, 1.4], fov: 45 },
				{ pos: [9, 3, -4], look: [4, 2.2, -14], fov: 45 },
				{ pos: [12, 3, 10], look: [28, 15, -300], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the ring
	r15: (k) => {
		k.fog(0xbfd8c0, 60, 400);
		k.sky(0x7ab0e0, 0xe8f0d8);
		k.light({ sky: 0xf0ffe8, ground: 0x4a6a30, hemi: 1.2, sunPos: [30, 50, 40], sunIntensity: 2.4, shadowSize: 40 });
		k.ground(400, 0x5a9a3a, { bump: 2, seg: 60 });
		// A round door in a hill.
		const hill = (x, z, r, from) => {
			const g = k.group({ x, z, from });
			k.sphere(r, 0x5aa03a, { y: -r * 0.35, parent: g, seg: 16, s: [1, 0.7, 1] });
			k.cyl(1.4, 1.4, 0.3, 0x2a7a3a, { y: 1.4, z: r * 0.88, rx: PI / 2 - 0.15, parent: g, seg: 24 });
			k.sphere(0.12, 0xd8b040, { y: 1.4, z: r * 0.88 + 0.25, parent: g, metal: 0.9, rough: 0.3 });
			k.torus(1.45, 0.12, 0x6a4a2a, { y: 1.4, z: r * 0.88, rx: -0.15, parent: g, seg: 24 });
			[-3, 3].forEach((dx) => {
				k.cyl(0.7, 0.7, 0.3, 0xe8e0a0, { x: dx, y: 1.6, z: r * 0.8, rx: PI / 2 - 0.2, parent: g, seg: 16, emissive: 0x302810 });
				k.torus(0.72, 0.08, 0x6a4a2a, { x: dx, y: 1.6, z: r * 0.8, rx: -0.2, parent: g, seg: 16 });
			});
			for (let i = 0; i < 8; i++) k.sphere(0.25, [0xe85050, 0xf2c230, 0xffffff, 0xd070e0][i % 4], { x: -3 + i * 0.8, y: 0.3, z: r * 0.95 + 0.5, parent: g, seg: 6, rings: 4 });
			return g;
		};
		hill(0, 0, 6, 0);
		hill(-22, -14, 7, 1);
		hill(20, -20, 8, 1);
		hill(-6, -40, 9, 1);
		const tree = k.group({ x: 10, z: -50, from: 1 });
		k.cyl(1.2, 1.8, 12, 0x5a4028, { y: 6, parent: tree });
		k.sphere(9, 0x3a7a2a, { y: 16, parent: tree, seg: 10, s: [1, 0.7, 1] });
		trees(k, 30, [-120, 120, -150, -70], { color: 0x3a6a2a, h: 10 });
		// The ring.
		const ringSet = k.group({ x: 300, y: 0, z: 0, from: 2 });
		k.ico(3, 0x1a1414, { y: -2.5, parent: ringSet, detail: 1, s: [2, 1, 2] });
		const ring = k.torus(0.32, 0.075, 0xffc840, { y: 0.6, rx: PI / 2 - 0.2, parent: ringSet, rseg: 16, seg: 48, metal: 1, rough: 0.15, emissive: 0x3a2000, flat: false });
		k.glow(0xff8020, 2.5, { y: 0.55, parent: ringSet, opacity: 0.6 });
		k.point(0xffa040, 6, 6, { x: 0.5, y: 1.5, z: 1, parent: ringSet });
		k.tick((t) => (ring.rotation.z = Math.sin(t * 0.5) * 0.15));
		// Mordor: the dark tower, its eye, and the mountain.
		const mordor = k.group({ x: 0, y: 0, z: -600, from: 3 });
		k.ground(300, 0x1a1210, { parent: mordor, y: 0.5, bump: 3, seg: 30 });
		const tower = k.group({ x: 0, parent: mordor });
		k.cyl(6, 12, 70, 0x0e0c0c, { y: 35, parent: tower, seg: 6 });
		k.cyl(4, 6, 20, 0x0e0c0c, { y: 80, parent: tower, seg: 6 });
		[-1, 1].forEach((s) => k.cone(1.6, 22, 0x0e0c0c, { x: s * 3.5, y: 98, parent: tower, rz: -s * 0.1, seg: 4 }));
		const eye = k.group({ y: 99, z: 1, parent: tower, from: 4 });
		k.glow(0xff5010, 18, { parent: eye });
		k.sphere(3, 0xff8020, { parent: eye, s: [1.6, 1, 0.5], emissive: 0xff5000, glow: 2 });
		k.box(0.6, 4.5, 0.4, 0x000000, { z: 1.4, parent: eye });
		k.point(0xff5010, 30, 120, { parent: eye, decay: 0.5 });
		k.tick((t) => (eye.rotation.y = Math.sin(t * 0.3) * 0.5));
		const doom = k.group({ x: 70, z: 40, parent: mordor, from: 5 });
		k.cone(40, 55, 0x2a1a14, { y: 27, parent: doom, seg: 10 });
		k.cyl(6, 8, 3, 0xff5010, { y: 54, parent: doom, emissive: 0xff3000, glow: 2 });
		k.glow(0xff6020, 30, { y: 58, parent: doom });
		for (let i = 0; i < 6; i++) k.box(1.5, 30, 0.5, 0xff4010, { x: Math.sin(i) * 14, y: 30, z: 18 + Math.cos(i * 2) * 4, rz: Math.sin(i * 3) * 0.3, rx: 0.6, parent: doom, emissive: 0xff3000, glow: 1.5 });
		return {
			shots: [
				{ pos: [0, 1.8, 9.5], look: [0, 1.4, 5], fov: 40 },
				{ pos: [16, 9, 30], look: [-2, 2, -20], fov: 45 },
				{ pos: [300.4, 1.6, 2], look: [300, 0.55, 0], fov: 40, fog: [0x0a0606, 1, 40] },
				{ pos: [20, 30, -470], look: [0, 80, -600], fov: 45, fog: [0x3a1a10, 30, 260] },
				{ pos: [8, 92, -560], look: [0, 99, -600], fov: 40, fog: [0x3a1a10, 30, 260] },
				{ pos: [-40, 40, -430], look: [20, 60, -600], fov: 55, fog: [0x3a1a10, 40, 320] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the dream
	r16: (k) => {
		k.fog(0xd8dce0, 40, 300);
		k.sky(0x8a9ab0, 0xe0e4e8);
		k.light({ sky: 0xffffff, ground: 0x404850, hemi: 1.1, sunPos: [40, 60, 20], sunIntensity: 2, shadowSize: 50 });
		// A fortress in the snow.
		const snow = k.group({ x: -400, z: 0 });
		k.ground(300, 0xf4f6f8, { parent: snow, bump: 3, seg: 40, height: (x, z) => Math.max(0, (-z - 40) * 0.5) });
		const fort = k.group({ z: -60, y: 8, parent: snow });
		[[0, 30, 14, 20], [-22, 18, 10, 14], [22, 18, 10, 14]].forEach(([x, w, h, d]) => {
			k.box(w, h, d, 0xc8ccd0, { x, y: h / 2, parent: fort });
			for (let i = 0; i < w / 2.5; i++) k.box(1.2, h * 0.6, 0.1, 0x3a4a5a, { x: x - w / 2 + 1.5 + i * 2.5, y: h / 2, z: d / 2 + 0.05, parent: fort });
		});
		k.particles(1500, 0xffffff, { x: -400, box: [120, 50, 120], speed: 3, size: 0.3, drift: 2 });
		trees(k, 40, [-480, -320, -40, 40], { color: 0x2a3a30, h: 10, seed: 3 });
		// The turning hallway.
		const hall = k.group({ x: 0, y: 0, z: 400, from: 1 });
		const corridor = k.group({ y: 2.5, parent: hall });
		k.box(5, 0.2, 40, 0x8a3a2a, { y: -2.5, parent: corridor });
		k.box(5, 0.2, 40, 0xe8e0d0, { y: 2.5, parent: corridor });
		[-2.5, 2.5].forEach((x) => {
			k.box(0.2, 5, 40, 0xd8c8a8, { x, parent: corridor });
			for (let i = 0; i < 5; i++) k.box(0.1, 3, 1.4, 0x5a3a20, { x: x * 0.96, y: -1, z: -15 + i * 8, parent: corridor });
		});
		for (let i = 0; i < 6; i++) k.point(0xffe8c8, 2, 9, { y: 2, z: -16 + i * 6.5, parent: corridor });
		const floater = k.person({ x: 0.5, y: 0.6, z: -6, rz: 1.2, rx: 0.3, colors: { shirt: 0x2a2a30, legs: 0x2a2a30, skin: 0xe0c0a0, hair: 0x2a1a10 }, parent: corridor });
		k.tick((t) => {
			corridor.rotation.z = t * 0.25;
			floater.rotation.z = 1.2 - t * 0.15;
		});
		// The city folding over itself.
		const paris = k.group({ x: 0, y: 0, z: 0, from: 2 });
		k.box(200, 0.5, 200, 0x9a9690, { parent: paris });
		const block = (parent, seed) => {
			const r = rng(seed);
			for (let i = 0; i < 40; i++) {
				const h = 10 + r() * 10;
				const x = -60 + (i % 10) * 12;
				const z = -30 - Math.floor(i / 10) * 14;
				k.box(10, h, 12, [0xe8dcc0, 0xd8ccb0, 0xf0e8d8][i % 3], { x, y: h / 2, z, parent });
				k.box(10.4, 1.4, 12.4, 0x5a6a78, { x, y: h + 0.7, z, parent });
			}
		};
		block(paris, 1);
		const fold = k.group({ z: -90, parent: paris });
		k.box(200, 0.5, 120, 0x9a9690, { z: 60, y: 0, parent: fold });
		const folded = k.group({ z: 0, parent: fold });
		block(folded, 2);
		folded.position.z = 90;
		fold.rotation.x = -PI * 0.92;
		k.person({ x: 2, y: 0.25, z: 4, ry: PI, colors: { shirt: 0x2a2a30, legs: 0x2a2a30 }, parent: paris });
		k.person({ x: 3, y: 0.25, z: 4.5, ry: PI, dress: 0x5a5a6a, colors: { shirt: 0x5a5a6a, hair: 0x3a2010 }, parent: paris });
		// A train in the street.
		const train = k.group({ x: 200, y: 0, z: 0, from: 3 });
		k.box(30, 0.3, 60, 0x4a4a48, { parent: train });
		city(k, 20, [170, 230, -40, 30], { h: 30, colors: [0x7a7470, 0x8a8480], avoid: (x) => Math.abs(x - 200) < 7, seed: 4 });
		k.box(4, 4.2, 14, 0x111111, { y: 2.3, z: 2, parent: train, metal: 0.5 });
		k.cyl(1.8, 1.8, 10, 0x1a1a1a, { y: 2.6, z: 4, rx: PI / 2, parent: train });
		k.cyl(0.5, 0.6, 2, 0x111111, { y: 5.4, z: 7.5, parent: train });
		k.glow(0xfff0c0, 2.2, { y: 3, z: 9.2, parent: train });
		k.box(4.2, 1, 1.4, 0x8a1a1a, { y: 0.6, z: 9.2, rx: 0.6, parent: train });
		[-1.8, 1.8].forEach((x) => [0, 3, 6].forEach((z) => k.cyl(0.9, 0.9, 0.3, 0x2a2a2a, { x, y: 0.9, z: z - 2, rz: PI / 2, parent: train })));
		k.tick((t) => (train.position.z = -10 + Math.sin(t * 0.3) * 4));
		// Limbo: crumbling towers by the sea.
		const limbo = k.group({ x: 0, y: 0, z: -500, from: 4 });
		k.water(400, 0x7a8a92, { y: 0, z: -500, amp: 0.4, from: 4 });
		for (let i = 0; i < 18; i++) {
			const h = 20 + ((i * 17) % 50);
			const x = -100 + i * 12;
			const g = k.group({ x, z: -30 - (i % 3) * 20, rz: (Math.sin(i) * 0.1), parent: limbo });
			k.box(9, h, 9, 0xb8b4ac, { y: h / 2 - 4, parent: g });
			k.box(4 + (i % 3), 6, 4, 0xa8a49c, { y: h - 8, x: 5, rz: 0.4, parent: g });
		}
		// The top.
		const top = k.group({ x: 300, y: 0, z: 0, from: 5 });
		k.box(8, 0.4, 5, 0x3a2418, { y: 2.8, parent: top, rough: 0.6 });
		const spinner = k.group({ y: 3, parent: top });
		k.cone(0.22, 0.32, 0x8a8a90, { y: 0.16, rx: PI, parent: spinner, metal: 0.9, rough: 0.2, seg: 16, flat: false });
		k.cyl(0.24, 0.24, 0.08, 0x8a8a90, { y: 0.36, parent: spinner, metal: 0.9, rough: 0.2, seg: 16, flat: false });
		k.cyl(0.03, 0.03, 0.2, 0x8a8a90, { y: 0.5, parent: spinner, metal: 0.9 });
		k.spot(0xfff0d8, 30, { x: 302, y: 8, z: 3, target: [300, 3, 0], angle: 0.3, cast: true });
		k.tick((t) => {
			spinner.rotation.y = t * 25;
			spinner.rotation.z = Math.sin(t * 3) * (0.06 + 0.04 * Math.sin(t * 0.3));
		});
		return {
			shots: [
				{ pos: [-400, 14, 40], look: [-400, 14, -60], fov: 40 },
				{ pos: [0, 2.6, 418], look: [0, 2.5, 390], fov: 60 },
				{ pos: [0, 2, 20], look: [0, 30, -60], fov: 60 },
				{ pos: [196, 3, 18], look: [200, 3, 2], fov: 50 },
				{ pos: [0, 5, -440], look: [0, 20, -540], fov: 50 },
				{ pos: [300.8, 3.4, 1.6], look: [300, 3.2, 0], fov: 40, fog: [0x1a120c, 2, 30] },
			],
		};
	},
};
