// Batch 08: r88–r97. Same rules as reels.js: one shared world per reel, far-away vignettes, cryptic → obvious.
import { PI, rng, trees, city } from "../kit.js";

// ------------------------------------------------------------------------------------------------- local helpers

/** A cylinder stretched between two points (ropes, cables, beams, branches). */
function tube(k, a, b, r, color, o = {}) {
	const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
	const len = Math.hypot(dx, dy, dz);
	const m = k.cyl(o.r2 ?? r, r, len, color, { seg: 6, ...o, x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2 });
	m.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, 1, 0), new k.THREE.Vector3(dx / len, dy / len, dz / len));
	return m;
}

/** Repaints every mesh in a group with one material. */
function paint(group, material) {
	group.traverse((m) => {
		if (m.isMesh) m.material = material;
	});
}

/** Many copies of one geometry as a single InstancedMesh. `list` holds [x, y, z, ry, sx, sy, sz]. */
function instances(k, geo, material, list, o = {}) {
	const T = k.THREE;
	const im = new T.InstancedMesh(geo, material, list.length);
	const d = new T.Object3D();
	list.forEach((p, i) => {
		d.position.set(p[0], p[1], p[2]);
		d.rotation.set(p[7] ?? 0, p[3] ?? 0, p[8] ?? 0);
		d.scale.set(p[4] ?? 1, p[5] ?? p[4] ?? 1, p[6] ?? p[4] ?? 1);
		d.updateMatrix();
		im.setMatrixAt(i, d.matrix);
	});
	return k.place(im, o);
}

/** Static points (city lights, plankton, stars in a dome) that don't fall. */
function dots(k, list, color, o = {}) {
	const T = k.THREE;
	const geo = new T.BufferGeometry();
	geo.setAttribute("position", new T.BufferAttribute(new Float32Array(list.flat()), 3));
	const pts = new T.Points(geo, new T.PointsMaterial({ color, size: o.size ?? 0.3, sizeAttenuation: o.atten ?? true, transparent: true, opacity: o.opacity ?? 1, depthWrite: false, fog: o.fog ?? true, blending: o.add ? T.AdditiveBlending : T.NormalBlending }));
	return k.place(pts, { ...o, shadow: false });
}

/** A palm tree with a curved trunk and drooping fronds. */
function palm(k, x, y, z, h, lean, o = {}) {
	const segs = 6;
	let p = [x, y, z];
	const dir = o.dir ?? 0;
	for (let i = 0; i < segs; i++) {
		const t = (i + 1) / segs;
		const q = [x + Math.cos(dir) * lean * t * t, y + h * t, z + Math.sin(dir) * lean * t * t];
		tube(k, p, q, 0.22 - i * 0.02, o.trunk ?? 0x7a5a38, { from: o.from, until: o.until, parent: o.parent, r2: 0.2 - i * 0.02 });
		p = q;
	}
	for (let i = 0; i < 8; i++) {
		const a = (i / 8) * PI * 2;
		const g = k.group({ x: p[0], y: p[1], z: p[2], ry: a, from: o.from, until: o.until, parent: o.parent });
		k.box(0.5, 0.05, 2.6, o.leaf ?? 0x2f7a2a, { z: 1.2, y: -0.35, rx: 0.45, parent: g });
		k.box(0.35, 0.05, 1.4, o.leaf ?? 0x2f7a2a, { z: 2.6, y: -1.1, rx: 0.9, parent: g });
	}
	k.sphere(0.25, 0x5a3a20, { x: p[0], y: p[1] - 0.2, z: p[2], from: o.from, until: o.until, parent: o.parent });
	return p;
}

/** A simple sedan, nose towards +z. */
function car(k, color, o = {}) {
	const g = k.group(o);
	k.box(1.8, 0.6, 4.2, color, { y: 0.65, parent: g, metal: 0.4, rough: 0.4 });
	k.box(1.6, 0.55, 2.0, color, { y: 1.2, z: -0.3, parent: g, metal: 0.4, rough: 0.4 });
	k.box(1.62, 0.4, 1.7, 0x1a2430, { y: 1.22, z: -0.3, parent: g, rough: 0.2 });
	[-0.8, 0.8].forEach((x) => [-1.3, 1.3].forEach((z) => k.cyl(0.34, 0.34, 0.25, 0x151515, { x, y: 0.34, z, rz: PI / 2, parent: g })));
	if (o.lights) [-0.6, 0.6].forEach((x) => k.glow(0xfff0c0, 0.7, { x, y: 0.7, z: 2.12, parent: g }));
	return g;
}

/** Height of k.water's surface (same formula as the kit) so floating things can bob with it. */
const waveY = (x, z, t, amp) => amp * (Math.sin(x * 0.35 + t * 1.3) + Math.cos(z * 0.3 + t * 0.9) * 0.7);

export const REELS = {
	// ----------------------------------------------------------------------------------------------- the vault (Mission: Impossible)
	r88: (k) => {
		k.fog(0xe6eef2, 30, 160);
		k.sky(0xbcd0e0, 0xeef4f8);
		k.light({ sky: 0xffffff, ground: 0xb8c4d0, hemi: 1.6, sunColor: 0xffffff, sunIntensity: 0.8, sunPos: [10, 40, 15], shadowSize: 10 });
		// The white room: tiled pressure floor, white walls, a hole in the ceiling for the vent.
		const tiles = k.canvas(512, 512, (g, w, h) => {
			g.fillStyle = "#f4f6f8";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#c4ccd4";
			g.lineWidth = 4;
			for (let i = 0; i <= 8; i++) {
				g.beginPath();
				g.moveTo(i * 64, 0);
				g.lineTo(i * 64, h);
				g.moveTo(0, i * 64);
				g.lineTo(w, i * 64);
				g.stroke();
			}
		});
		tiles.wrapS = tiles.wrapT = k.THREE.RepeatWrapping;
		tiles.repeat.set(1.5, 1.5);
		k.plane(12, 12, k.mat(0xffffff, { map: tiles, rough: 0.35 }), { rx: -PI / 2, y: 0.01 });
		k.box(12.6, 0.3, 12.6, 0xdde3e8, { y: -0.15 });
		const wall = 0xeef2f5;
		k.box(0.3, 8, 12.6, wall, { x: -6.15, y: 4 });
		k.box(0.3, 8, 12.6, wall, { x: 6.15, y: 4 });
		k.box(12, 8, 0.3, wall, { z: -6.15, y: 4 });
		k.box(12, 8, 0.3, wall, { z: 6.15, y: 4 });
		for (let i = -5; i <= 5; i += 1.25) {
			k.box(0.05, 7.6, 0.06, 0xd0d8e0, { x: i, y: 4, z: -5.97 });
			k.box(0.06, 7.6, 0.05, 0xd0d8e0, { x: -5.97, y: 4, z: i });
			k.box(0.06, 7.6, 0.05, 0xd0d8e0, { x: 5.97, y: 4, z: i });
		}
		k.box(0.2, 0.25, 12, 0xc8d0d8, { x: -5.9, y: 0.12 });
		k.box(0.2, 0.25, 12, 0xc8d0d8, { x: 5.9, y: 0.12 });
		const cy = 8.15;
		k.box(5.2, 0.3, 12.6, wall, { x: -3.4, y: cy });
		k.box(5.2, 0.3, 12.6, wall, { x: 3.4, y: cy });
		k.box(1.6, 0.3, 5.5, wall, { z: 3.55, y: cy });
		k.box(1.6, 0.3, 5.5, wall, { z: -3.55, y: cy });
		[-3.5, 3.5].forEach((x) => [-3.5, 3.5].forEach((z) => k.box(1.8, 0.04, 1.8, 0xffffff, { x, y: 7.98, z, emissive: 0xffffff, glow: 0.9, shadow: false })));
		k.point(0xf4f8ff, 18, 30, { x: -3, y: 6.5, z: 3 });
		k.point(0xf4f8ff, 18, 30, { x: 3, y: 6.5, z: -3 });
		// The vent shaft above the hole.
		const sh = 0x5a646e;
		k.box(0.15, 5, 1.9, sh, { x: -0.875, y: 10.8 });
		k.box(0.15, 5, 1.9, sh, { x: 0.875, y: 10.8 });
		k.box(1.6, 5, 0.15, sh, { z: -0.875, y: 10.8 });
		k.box(1.6, 5, 0.15, sh, { z: 0.875, y: 10.8 });
		k.box(2, 0.2, 2, sh, { y: 13.4 });
		k.box(0.9, 0.05, 1.1, 0x6a747e, { x: 0.35, y: 9.3, z: -0.6, rx: 1.1 });
		k.point(0xffffff, 4, 8, { y: 12.5 });
		// The vault door and a red status light.
		k.box(3.2, 4.4, 0.12, 0xa8b0b8, { y: 2.2, z: -5.94, metal: 0.7, rough: 0.3 });
		k.box(0.06, 4.2, 0.14, 0x7a828a, { y: 2.1, z: -5.9 });
		k.box(0.35, 0.5, 0.1, 0x2a2e34, { x: 2.1, y: 1.5, z: -5.95 });
		k.glow(0xff2020, 0.5, { x: 2.1, y: 1.6, z: -5.85 });
		k.glow(0xff3030, 0.7, { y: 4.7, z: -5.85 });
		// The terminal: a white pedestal, a beige monitor and a keyboard.
		k.box(1.4, 1.0, 0.9, 0xf2f4f6, { y: 0.5, z: -0.1 });
		k.box(0.9, 0.7, 0.7, 0xd8d4c8, { y: 1.35, z: -0.35 });
		k.box(0.7, 0.5, 0.02, 0x0a1a12, { y: 1.38, z: 0.01, emissive: 0x0a4a22, glow: 0.6 });
		const keys = k.canvas(256, 96, (g, w, h) => {
			g.fillStyle = "#cfcabd";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#8a867c";
			for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) g.fillRect(6 + c * 17.6, 6 + r * 17.6, 14, 14);
		});
		k.box(0.9, 0.05, 0.35, 0xd0ccc0, { y: 1.025, z: 0.2 });
		k.plane(0.86, 0.31, k.mat(0xffffff, { map: keys }), { rx: -PI / 2, y: 1.052, z: 0.2 });
		k.point(0x60ff90, 1.2, 3, { y: 1.4, z: 0.5 });
		k.point(0xffffff, 8, 6, { y: 1.2, z: 2.5, from: 3 });
		// A drop of sweat, falling towards the keys.
		k.sphere(0.018, 0xb8e0ff, { x: 0.06, y: 1.3, z: 0.22, s: [1, 1.4, 1], rough: 0.05, metal: 0.2, emissive: 0x3060a0, glow: 0.4, opacity: 0.85, flat: false });
		// The agent, hanging on wires, arms out.
		const agent = k.person({ x: 0, y: 2.4, z: -1.42, rx: PI / 2, pose: "arms-out", colors: { shirt: 0x16181c, legs: 0x16181c, skin: 0xd8b090, hair: 0x1a120c, shoes: 0x0a0a0a }, from: 3 });
		k.box(0.56, 0.5, 0.06, 0x50565e, { y: 1.15, z: -0.17, parent: agent });
		const L = agent.userData.limbs;
		L.legL.rotation.x = 0.5;
		L.legR.rotation.x = 0.25;
		L.head.rotation.x = -0.25;
		[[-0.18, -0.45], [0.18, -0.45], [-0.12, 0.15], [0.12, 0.15]].forEach(([x, z]) => tube(k, [x, 2.55, z], [x * 0.5, 9.5, z * 0.3], 0.012, 0x222222, { from: 3 }));
		tube(k, [0, 2.55, -1.3], [0, 9.5, -0.6], 0.012, 0x222222, { from: 3 });
		// The knife, stuck in the desk.
		k.box(0.03, 0.2, 0.07, 0xd8dde2, { x: 0.5, y: 1.08, z: -0.15, metal: 0.9, rough: 0.2, from: 3 });
		k.box(0.04, 0.12, 0.06, 0x111111, { x: 0.5, y: 1.23, z: -0.15, from: 3 });

		// A hotel nightstand: a Gideon Bible left open beside a lamp.
		const fx = 300;
		k.box(30, 0.2, 30, 0x5a4a3a, { x: fx, y: -0.1 });
		const paper = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#d8ccb0";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#c4b694";
			for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 14, 0, 4, h);
		});
		paper.wrapS = paper.wrapT = k.THREE.RepeatWrapping;
		paper.repeat.set(5, 2);
		k.box(12, 5, 0.2, k.mat(0xffffff, { map: paper }), { x: fx, y: 2.5, z: -1.2 });
		k.box(1.4, 0.9, 1.0, 0x6a4428, { x: fx, y: 0.45, z: -0.5 });
		k.box(1.5, 0.06, 1.1, 0x7a5030, { x: fx, y: 0.93, z: -0.5 });
		k.box(1.2, 0.2, 0.02, 0x5a3a20, { x: fx, y: 0.65, z: 0.01 });
		k.sphere(0.03, 0xc8a050, { x: fx, y: 0.65, z: 0.03, metal: 0.8 });
		// The lamp.
		k.cyl(0.14, 0.18, 0.06, 0x8a7a5a, { x: fx - 0.45, y: 0.99, z: -0.75, metal: 0.5 });
		k.cyl(0.03, 0.03, 0.5, 0x8a7a5a, { x: fx - 0.45, y: 1.25, z: -0.75, metal: 0.5 });
		k.cyl(0.14, 0.26, 0.3, 0xf0e4c4, { x: fx - 0.45, y: 1.55, z: -0.75, emissive: 0xffd890, glow: 0.6, seg: 16 });
		k.point(0xffd8a0, 6, 6, { x: fx - 0.45, y: 1.4, z: -0.5 });
		// The open book: two pages of tiny print, a red ribbon.
		const page = (flip) => k.canvas(128, 160, (g, w, h) => {
			g.fillStyle = "#f2ead6";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#3a3028";
			g.font = "bold 11px serif";
			g.fillText(flip ? "JOB" : "JOB", 50, 14);
			g.fillStyle = "#6a6058";
			for (let c = 0; c < 2; c++) for (let l = 0; l < 22; l++) g.fillRect(8 + c * 58, 22 + l * 6, 50 - ((l * 7 + c * 3) % 9), 2);
			if (!flip) {
				g.fillStyle = "rgba(200,40,30,0.8)";
				g.fillRect(8, 22 + 6 * 9 - 2, 50, 7);
			}
		});
		k.plane(0.32, 0.42, k.mat(0xffffff, { map: page(false) }), { x: fx + 0.04, y: 1.0, z: -0.42, rx: -PI / 2, rz: 0.12, ry: 0.08 });
		k.plane(0.32, 0.42, k.mat(0xffffff, { map: page(true) }), { x: fx + 0.36, y: 1.0, z: -0.46, rx: -PI / 2, rz: 0.12, ry: -0.08 });
		k.box(0.68, 0.035, 0.46, 0x1a1a24, { x: fx + 0.2, y: 0.975, z: -0.44, ry: 0.12 });
		k.box(0.015, 0.005, 0.3, 0xb02020, { x: fx + 0.19, y: 1.006, z: -0.2, ry: 0.3 });
		// A glass of water and a room key.
		k.cyl(0.05, 0.045, 0.16, 0xd8f0ff, { x: fx + 0.55, y: 1.04, z: -0.85, opacity: 0.5, rough: 0.05 });
		k.box(0.04, 0.01, 0.12, 0xc8a050, { x: fx - 0.2, y: 0.965, z: -0.2, ry: 0.7, metal: 0.8 });
		k.box(0.08, 0.012, 0.1, 0x8a2020, { x: fx - 0.25, y: 0.965, z: -0.13, ry: 0.7 });
		k.point(0xd8e0ff, 3, 12, { x: fx + 2, y: 3, z: 2 });

		// The tunnel chase: a high-speed train with a helicopter tethered behind it.
		const tx = -300;
		k.cyl(5.5, 5.5, 220, 0x5a544c, { x: tx, y: 3, z: -60, rx: PI / 2, seg: 18, open: true, side: k.THREE.BackSide });
		k.box(10, 0.4, 220, 0x34302a, { x: tx, y: -1.2, z: -60 });
		[-0.75, 0.75].forEach((x) => k.box(0.12, 0.12, 220, 0x8a8a90, { x: tx + x, y: -0.94, z: -60, metal: 0.8 }));
		for (let z = 40; z > -160; z -= 9) [-1, 1].forEach((s) => k.glow(0xffc070, 1.2, { x: tx + s * 4.9, y: 4.5, z }));
		[30, 10, -10, -40].forEach((z) => k.point(0xffb060, 20, 40, { x: tx, y: 6, z }));
		const train = k.group({ x: tx, y: 0, z: 0 });
		for (let c = 0; c < 4; c++) {
			const z = -10 - c * 19.5;
			k.box(3, 3.4, 19, 0xeeeee8, { y: 1.0, z, parent: train });
			k.box(3.04, 0.5, 19, 0xf2c230, { y: -0.3, z, parent: train });
			k.box(3.04, 0.6, 18, 0x2a2e38, { y: 1.6, z, parent: train });
		}
		k.sphere(1.5, 0xeeeee8, { y: 0.9, z: -0.5, s: [1, 1.15, 3.2], parent: train, seg: 16 });
		k.sphere(1.52, 0xf2c230, { y: 0.1, z: -0.5, s: [1, 0.55, 3.25], parent: train, seg: 16 });
		k.box(1.8, 0.7, 0.1, 0x1a2028, { y: 1.9, z: 2.0, rx: -0.9, parent: train });
		const rider = k.person({ x: 0.2, y: 2.85, z: -6, rx: PI / 2, colors: { shirt: 0x16181c, legs: 0x16181c }, parent: train });
		void rider;
		const heli = k.group({ x: tx, y: 2.6, z: 12 });
		k.sphere(1.2, 0x23272e, { s: [1, 1, 1.8], parent: heli, metal: 0.4, rough: 0.4 });
		k.sphere(0.9, 0x6a8aa8, { y: 0.25, z: -1.3, s: [1, 0.8, 0.9], parent: heli, rough: 0.1, metal: 0.5 });
		tube(k, [0, 0.2, 1.8], [0, 0.7, 6.5], 0.25, 0x23272e, { parent: heli, r2: 0.12 });
		k.box(0.1, 1.2, 0.8, 0x23272e, { y: 1.1, z: 6.4, parent: heli });
		[-0.7, 0.7].forEach((x) => k.box(0.08, 0.08, 3, 0x111111, { x, y: -1.3, parent: heli }));
		k.cyl(0.15, 0.15, 0.4, 0x111111, { y: 1.3, parent: heli });
		const rotor = k.group({ y: 1.5, parent: heli });
		k.box(8, 0.06, 0.3, 0x111111, { parent: rotor });
		k.box(0.3, 0.06, 8, 0x111111, { parent: rotor });
		k.tick((t) => (rotor.rotation.y = t * 9));
		k.glow(0xff3030, 0.4, { x: tx, y: 1.3, z: 10.2 });
		tube(k, [tx, 1.6, 10], [tx, 2.7, -1], 0.025, 0x111111);

		return {
			shots: [
				{ pos: [0.36, 1.58, 0.78], look: [0.06, 1.25, 0.2], fov: 20 },
				{ pos: [fx + 0.55, 1.7, 0.85], look: [fx + 0.05, 1.12, -0.5], fov: 42, fog: [0x2a2018, 4, 30] },
				{ pos: [5, 5.5, 5.3], look: [0, 1.2, -0.5], fov: 55 },
				{ pos: [tx + 3, 4.2, 26], look: [tx, 2, 2], fov: 45, fog: [0x1a140e, 5, 110] },
				{ pos: [0.1, 9.6, 0.3], look: [0, 0, -0.35], fov: 60 },
				{ pos: [1.5, 1.9, 3.5], look: [0, 2.35, -0.6], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the gold (Goldfinger)
	r89: (k) => {
		k.fog(0xcfe0e8, 80, 420);
		k.sky(0x5a9ae0, 0xe0f0f8);
		k.light({ sky: 0xfff4e0, ground: 0x5a5040, hemi: 1.3, sunPos: [30, 60, 40], sunIntensity: 2.2, shadowSize: 30 });
		const goldMat = k.mat(0xe8b840, { metal: 0.85, rough: 0.28, emissive: 0x4a3000, glow: 0.6 });
		const barGeo = new k.THREE.CylinderGeometry(0.75 * 0.707, 0.707, 1, 4, 1).rotateY(PI / 4).scale(0.6, 0.14, 0.28);
		// The vault: two tiers of gold behind steel grilles, and a bomb on a trolley in the middle.
		k.box(40, 0.4, 34, 0x6a706e, { y: -0.2, rough: 0.3, metal: 0.3 });
		k.box(40, 16, 0.4, 0xd8d8d0, { z: -17, y: 8 });
		k.box(40, 16, 0.4, 0xd8d8d0, { z: 17, y: 8 });
		k.box(0.4, 16, 34, 0xd8d8d0, { x: -20, y: 8 });
		k.box(0.4, 16, 34, 0xd8d8d0, { x: 20, y: 8 });
		k.box(40, 0.4, 34, 0xe8e8e0, { y: 16 });
		const bars = [];
		const rods = [];
		[-1, 1].forEach((side) => {
			const fx = side * 13;
			for (let tier = 0; tier < 2; tier++) {
				const by = tier * 6;
				for (let bay = 0; bay < 6; bay++) {
					const bz = -12.5 + bay * 5;
					for (let lx = 0; lx < 5; lx++)
						for (let lz = 0; lz < 7; lz++)
							for (let ly = 0; ly < 7 + ((bay + lx) % 3); ly++) {
								const alt = ly % 2;
								bars.push([fx + side * (1 + lx * 0.65), by + 0.6 + ly * 0.15, bz - 1.6 + lz * 0.48 + alt * 0.12, alt ? PI / 2 : 0]);
							}
					for (let i = 0; i < 12; i++) rods.push([fx, by + 2.6, bz - 2.3 + i * 0.42]);
				}
				k.box(0.3, 0.3, 30, 0xb8bcc0, { x: fx, y: by + 0.15, metal: 0.8, rough: 0.3 });
				k.box(0.3, 0.3, 30, 0xb8bcc0, { x: fx, y: by + 5.05, metal: 0.8, rough: 0.3 });
				k.box(7, 0.3, 30, 0xc8ccd0, { x: fx + side * 3.4, y: by + 0.4 });
			}
			k.box(2.4, 0.2, 30, 0x9aa0a4, { x: side * 11.6, y: 6.1, metal: 0.5 });
			k.box(0.08, 1, 30, 0xb8bcc0, { x: side * 10.5, y: 6.7, metal: 0.8 });
		});
		instances(k, barGeo, goldMat, bars);
		instances(k, new k.THREE.CylinderGeometry(0.04, 0.04, 4.7, 6), k.mat(0xd8dce0, { metal: 0.9, rough: 0.2 }), rods);
		for (let i = 0; i < 4; i++) [-1, 1].forEach((s) => k.point(0xffe8b0, 25, 26, { x: s * 9, y: 4 + (i % 2) * 6, z: -12 + i * 8 }));
		k.point(0xfff0d0, 30, 40, { y: 12, z: 6 });
		// The bomb.
		const bomb = k.group({ y: 0, z: 2, from: 2 });
		k.box(1.6, 0.5, 2.8, 0x4a4e52, { y: 0.55, parent: bomb });
		[-0.7, 0.7].forEach((x) => [-1.1, 1.1].forEach((z) => k.cyl(0.2, 0.2, 0.15, 0x111111, { x, y: 0.2, z, rz: PI / 2, parent: bomb })));
		k.cyl(0.6, 0.6, 2.6, 0xd8dce0, { y: 1.45, rx: PI / 2, parent: bomb, metal: 0.9, rough: 0.15, seg: 20 });
		k.box(0.9, 0.7, 0.3, 0x2a2e32, { y: 1.5, z: 1.4, parent: bomb });
		for (let i = 0; i < 4; i++) k.glow(i % 2 ? 0xff3020 : 0xffb020, 0.3, { x: -0.3 + i * 0.2, y: 1.7, z: 1.58, parent: bomb });
		k.box(0.5, 0.18, 0.02, 0x200000, { y: 1.4, z: 1.56, parent: bomb, emissive: 0xff2010, glow: 0.8 });

		// The putting green: a steel-brimmed bowler hat lies by the pin.
		const gx = -300;
		k.ground(220, 0x4a8a38, { x: gx, y: 0, bump: 0.4, seg: 30 });
		k.cyl(9, 9, 0.12, 0x6ab04a, { x: gx, y: 0.1, seg: 32 });
		k.cyl(0.18, 0.18, 0.13, 0x111111, { x: gx, y: 0.11, z: -1.5, seg: 16 });
		k.cyl(0.03, 0.03, 3.2, 0xf0f0f0, { x: gx, y: 1.7, z: -1.5 });
		k.box(1.0, 0.6, 0.02, 0xd02020, { x: gx + 0.5, y: 3, z: -1.5 });
		k.sphere(0.07, 0xffffff, { x: gx + 0.6, y: 0.23, z: -0.6, seg: 12 });
		const hat = k.group({ x: gx + 1.6, y: 0.16, z: 0.6, ry: 0.4, rz: 0.08, tag: "hat" });
		k.cyl(0.5, 0.5, 0.04, 0xe0e4e8, { parent: hat, seg: 24, metal: 0.9, rough: 0.12, emissive: 0x30343a });
		k.torus(0.5, 0.03, 0xe8ecf0, { rx: PI / 2, parent: hat, seg: 24, metal: 0.9, rough: 0.12 });
		k.sphere(0.27, 0x16161a, { y: 0.06, parent: hat, s: [1, 1.05, 1.1], seg: 18 });
		k.cyl(0.275, 0.275, 0.06, 0x2a2a30, { y: 0.06, parent: hat, seg: 18 });
		trees(k, 50, [gx - 90, gx + 90, -90, -15], { color: 0x2a5a2a, h: 12, seed: 4 });
		trees(k, 30, [gx + 25, gx + 90, -10, 40], { color: 0x2a5a2a, h: 11, seed: 6 });

		// Miami: a card table on a hotel sundeck by the pool.
		const mz = -400;
		k.box(80, 0.4, 80, 0xf0ece0, { z: mz, y: -0.2 });
		const tilesM = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#3ab8d0";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#7ad8e8";
			g.lineWidth = 3;
			for (let i = 0; i < 4; i++) {
				g.beginPath();
				g.moveTo(0, i * 32 + 10);
				g.bezierCurveTo(40, i * 32, 80, i * 32 + 22, w, i * 32 + 10);
				g.stroke();
			}
		});
		tilesM.wrapS = tilesM.wrapT = k.THREE.RepeatWrapping;
		tilesM.repeat.set(4, 2);
		k.plane(20, 9, k.mat(0xffffff, { map: tilesM, rough: 0.2 }), { x: -2, y: 0.02, z: mz - 9, rx: -PI / 2 });
		k.box(20.6, 0.1, 0.3, 0xffffff, { x: -2, y: 0.04, z: mz - 4.4 });
		k.box(20.6, 0.1, 0.3, 0xffffff, { x: -2, y: 0.04, z: mz - 13.6 });
		const table = k.group({ x: 0, y: 0, z: mz });
		k.cyl(0.6, 0.6, 0.05, 0x2a6a3a, { y: 0.75, parent: table, seg: 20 });
		k.cyl(0.04, 0.04, 0.75, 0xe8e8e8, { y: 0.37, parent: table, metal: 0.6 });
		k.cyl(0.3, 0.3, 0.03, 0xe8e8e8, { y: 0.02, parent: table, metal: 0.6 });
		const card = k.canvas(32, 48, (g, w, h) => {
			g.fillStyle = "#fbfaf4";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#c02020";
			g.fillRect(12, 18, 8, 12);
		});
		const back = k.canvas(32, 48, (g, w, h) => {
			g.fillStyle = "#fbfaf4";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#2a4aa0";
			g.fillRect(3, 3, w - 6, h - 6);
		});
		const cm = k.mat(0xffffff, { map: card }), bm = k.mat(0xffffff, { map: back });
		for (let i = 0; i < 6; i++) k.plane(0.11, 0.16, i < 3 ? cm : bm, { x: -0.25 + i * 0.09, y: 0.785 + i * 0.001, z: i < 3 ? 0.2 : -0.25, rx: -PI / 2, rz: (i - 2.5) * 0.15, parent: table });
		k.box(0.12, 0.04, 0.17, 0x2a4aa0, { x: 0.3, y: 0.795, z: 0, ry: 0.3, parent: table });
		k.cyl(0.04, 0.035, 0.12, 0xf0d890, { x: -0.35, y: 0.84, z: -0.05, parent: table, opacity: 0.7, rough: 0.1 });
		k.box(0.1, 0.01, 0.06, 0x2a7a3a, { x: 0.1, y: 0.782, z: -0.05, ry: 0.5, parent: table });
		[-1, 1].forEach((sd) => {
			const ch = k.group({ x: 0, z: mz + sd * 0.95, ry: sd > 0 ? PI : 0 });
			k.box(0.5, 0.05, 0.5, 0xffffff, { y: 0.45, parent: ch });
			k.box(0.5, 0.5, 0.05, 0xffffff, { y: 0.7, z: -0.25, parent: ch });
			[-0.22, 0.22].forEach((x) => [-0.22, 0.22].forEach((z) => k.cyl(0.02, 0.02, 0.45, 0xd8d8d8, { x, y: 0.22, z, parent: ch, metal: 0.6 })));
		});
		// The striped umbrella and loungers.
		k.cyl(0.03, 0.03, 2.4, 0xe8e8e8, { x: 0, y: 1.2, z: mz });
		const umb = k.canvas(256, 32, (g, w, h) => {
			for (let i = 0; i < 16; i++) {
				g.fillStyle = i % 2 ? "#f4f0e8" : "#e8a020";
				g.fillRect(i * 16, 0, 16, h);
			}
		});
		k.cone(1.6, 0.6, k.mat(0xffffff, { map: umb }), { x: 0, y: 2.5, z: mz, seg: 16 });
		for (let i = 0; i < 5; i++) {
			const lg = k.group({ x: -8 + i * 2.2, z: mz - 3.2, ry: 0 });
			k.box(0.7, 0.08, 1.9, 0xffffff, { y: 0.35, parent: lg });
			k.box(0.7, 0.08, 0.7, 0xffffff, { y: 0.55, z: -0.95, rx: 0.6, parent: lg });
			k.box(0.66, 0.04, 1.6, i % 2 ? 0x2a8ac0 : 0xe8a020, { y: 0.41, parent: lg });
		}
		palm(k, 6, 0, mz - 6, 9, 1.6, { dir: PI });
		palm(k, -12, 0, mz - 15, 10, 1.2, { dir: 0.3 });
		// The hotel behind.
		k.box(60, 30, 8, 0xf4f0e6, { x: 0, y: 15, z: mz - 30 });
		for (let y = 0; y < 9; y++) k.box(60.2, 0.4, 8.6, 0xd8d4c8, { x: 0, y: 2.5 + y * 3, z: mz - 29.8 });

		// The silver car on an Alpine road.
		const az = 400;
		k.ground(400, 0x6a8a4a, { z: az, bump: 1.2, seg: 40 });
		for (let i = 0; i < 8; i++) {
			const x = -150 + i * 45, z = az - 120 - (i % 3) * 30, h = 70 + (i % 4) * 25;
			k.cone(45 + (i % 3) * 10, h, 0x7a7a80, { x, y: h / 2 - 2, z, seg: 7 });
			k.cone(19, h * 0.4, 0xf4f6fa, { x, y: h - h * 0.2 - 2 + 0.5, z, seg: 7 });
		}
		k.box(7, 0.1, 200, 0x55575a, { x: 0, y: 0.25, z: az, ry: 0.35 });
		k.box(0.2, 0.11, 200, 0xf0f0f0, { x: 0, y: 0.26, z: az, ry: 0.35 });
		const db5 = k.group({ x: 0.5, y: 0.3, z: az + 2, ry: 0.35 + PI });
		const silver = { metal: 0.1, rough: 0.45 };
		k.box(1.7, 0.5, 4.5, 0xc8ccd2, { y: 0.55, parent: db5, ...silver });
		k.box(1.66, 0.2, 1.3, 0xc8ccd2, { y: 0.85, z: 1.4, rx: 0.06, parent: db5, ...silver });
		k.box(1.4, 0.42, 1.5, 0xc8ccd2, { y: 1.0, z: -0.45, parent: db5, ...silver });
		k.box(1.36, 0.36, 0.08, 0x2a3440, { y: 1.0, z: 0.38, rx: -0.55, parent: db5, rough: 0.1 });
		[-1, 1].forEach((s) => k.box(0.02, 0.28, 1.2, 0x2a3440, { x: s * 0.71, y: 1.02, z: -0.45, parent: db5, rough: 0.1 }));
		k.box(0.7, 0.28, 0.05, 0x8a8e92, { y: 0.52, z: 2.26, parent: db5, metal: 0.9 });
		k.box(1.8, 0.1, 0.1, 0xe0e4e8, { y: 0.32, z: 2.27, parent: db5, metal: 1, rough: 0.1 });
		[-0.62, 0.62].forEach((x) => k.sphere(0.13, 0xfff4d8, { x, y: 0.66, z: 2.2, parent: db5, emissive: 0xa08040 }));
		[-0.75, 0.75].forEach((x) => [-1.4, 1.4].forEach((z) => {
			k.cyl(0.34, 0.34, 0.22, 0x151515, { x, y: 0.34, z, rz: PI / 2, parent: db5 });
			k.cyl(0.22, 0.22, 0.24, 0xd8dce0, { x, y: 0.34, z, rz: PI / 2, parent: db5, metal: 1 });
		}));
		trees(k, 40, [-120, 120, az - 80, az + 60], { color: 0x2a4a2a, h: 9, seed: 9, avoid: (x, z) => Math.abs(x - (z - az) * Math.tan(0.35)) < 8 });

		// The laser table.
		const lx = 600;
		k.box(30, 0.2, 30, 0x2a2a30, { x: lx, y: -0.1 });
		k.box(30, 10, 0.3, 0x3a3e48, { x: lx, y: 5, z: -6 });
		k.box(2.2, 0.85, 3.6, 0x4a4e58, { x: lx, y: 0.43, metal: 0.4 });
		k.box(2.0, 0.06, 3.4, 0xe8b840, { x: lx, y: 0.88, ...{ metal: 0.85, rough: 0.25, emissive: 0x3a2400 } });
		const bond = k.person({ x: lx, y: 1.06, z: 1.25, rx: -PI / 2, pose: "arms-out", colors: { shirt: 0x5a6070, legs: 0x5a6070, skin: 0xe0b48f, hair: 0x2a1a10 } });
		bond.userData.limbs.legL.rotation.z = -0.35;
		bond.userData.limbs.legR.rotation.z = 0.35;
		[-0.85, 0.85].forEach((x) => k.box(0.15, 0.05, 0.25, 0x3a2a1a, { x: lx + x, y: 1.08, z: -0.2 }));
		const gun = k.group({ x: lx, y: 3.2, z: 3.4 });
		k.box(0.25, 3.4, 0.25, 0x5a5e66, { y: -1.6, z: 0.6, parent: gun });
		k.cyl(0.35, 0.45, 1.6, 0x7a7e86, { rx: -2.2, parent: gun, metal: 0.7, rough: 0.3 });
		k.cyl(0.12, 0.12, 0.3, 0x111111, { y: -0.75, z: -0.5, rx: -2.2, parent: gun });
		const tip = [lx, 2.5, 2.85];
		const hit = [lx, 0.92, 1.6];
		tube(k, tip, hit, 0.025, 0xff2010, { emissive: 0xff2010, glow: 3, shadow: false });
		k.box(0.04, 0.02, 0.2, 0xff4020, { x: lx, y: 0.915, z: 1.7, emissive: 0xff3010, glow: 2 });
		const spark = k.glow(0xff5030, 0.7, { x: hit[0], y: hit[1] + 0.05, z: hit[2] });
		k.glow(0xff2010, 0.4, { x: tip[0], y: tip[1], z: tip[2] });
		k.point(0xff3020, 4, 6, { x: lx, y: 1.4, z: 1.8 });
		k.spot(0xffeedd, 50, { x: lx + 2, y: 7, z: 1, target: [lx, 0.9, 0], angle: 0.45, distance: 20 });
		k.point(0x8090c0, 5, 20, { x: lx - 4, y: 5, z: 4 });
		k.tick((t) => spark.scale.setScalar(0.5 + 0.4 * Math.abs(Math.sin(t * 23))));

		// The gilded girl on the hotel bed.
		const bx = 300;
		k.box(16, 0.2, 16, 0x8a6a5a, { x: bx, y: -0.1 });
		k.box(16, 6, 0.2, 0xe8dcc4, { x: bx, y: 3, z: -3 });
		k.box(0.2, 6, 16, 0xe0d4bc, { x: bx - 4, y: 3 });
		k.box(2.4, 0.45, 2.6, 0xf2eee4, { x: bx, y: 0.3, z: -1.5 });
		k.box(2.5, 0.12, 2.7, 0xffffff, { x: bx, y: 0.56, z: -1.5 });
		k.box(2.6, 1.6, 0.15, 0xc8b8a0, { x: bx, y: 0.8, z: -2.85 });
		k.box(0.8, 0.18, 0.5, 0xffffff, { x: bx - 0.7, y: 0.7, z: -2.45 });
		const girl = k.person({ x: bx + 0.15, y: 0.78, z: -0.5, rx: -PI / 2, ry: PI });
		paint(girl, goldMat);
		const gl = girl.userData.limbs;
		gl.armL.rotation.z = -0.25;
		gl.armR.rotation.z = 0.25;
		gl.legL.rotation.z = -0.08;
		gl.legR.rotation.z = 0.12;
		gl.head.rotation.y = 0.6;
		k.box(0.6, 0.9, 0.6, 0x8a6a4a, { x: bx + 1.7, y: 0.45, z: -2.3 });
		k.cyl(0.15, 0.3, 0.6, 0xf0d8b0, { x: bx + 1.7, y: 1.3, z: -2.3, emissive: 0xa07030, glow: 0.5 });
		k.point(0xffd8a0, 8, 10, { x: bx + 1.6, y: 1.8, z: -1.8 });
		k.spot(0xfff0e0, 25, { x: bx + 2, y: 5, z: 1.5, target: [bx, 0.7, -1.4], angle: 0.5, distance: 20 });
		for (let i = 0; i < 8; i++) k.box(1.8, 0.06, 0.04, 0xf8f4ea, { x: bx - 1, y: 1.8 + i * 0.22, z: -2.88 + 0.1, emissive: 0x7a7060 });
		return {
			shots: [
				{ pos: [2.6, 1.5, mz + 3.4], look: [-1, 0.9, mz - 2], fov: 45 },
				{ pos: [-2.6, 1.1, az - 3.2], look: [0.5, 0.75, az + 1.6], fov: 50 },
				{ pos: [0, 6.5, 11], look: [0, 2.6, -4], fov: 55 },
				{ pos: [gx + 3.8, 1.0, 3.2], look: [gx + 0.4, 1.0, -1], fov: 42 },
				{ pos: [lx + 3.4, 3, 2.6], look: [lx, 1, 0.4], fov: 45, fog: [0x14161c, 4, 40] },
				{ pos: [bx + 2.6, 2.2, 0.3], look: [bx, 0.7, -1.4], fov: 45, fog: [0x2a2018, 6, 40] },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the game (Jumanji)
	r90: (k) => {
		k.fog(0xe8d8b8, 60, 400);
		k.sky(0x7ab0e0, 0xf0e4c8);
		k.light({ sky: 0xfff0d8, ground: 0x5a4028, hemi: 1.5, sunPos: [30, 50, 20], sunIntensity: 2, shadowSize: 30 });
		const wood = 0x5a3a20;
		// Animals.
		const rhino = (o) => {
			const g = k.group(o);
			const c = 0x7c7a74;
			k.capsule(0.75, 1.5, c, { y: 1.35, rx: PI / 2, parent: g, s: [1, 1, 0.95] });
			k.box(0.8, 0.75, 1.0, c, { y: 1.25, z: 1.6, rx: 0.35, parent: g });
			k.cone(0.16, 0.6, 0xd8d0c0, { y: 1.55, z: 2.05, rx: 0.4, parent: g, seg: 6 });
			k.cone(0.1, 0.3, 0xd8d0c0, { y: 1.62, z: 1.75, rx: 0.3, parent: g, seg: 6 });
			[-0.3, 0.3].forEach((x) => k.cone(0.08, 0.2, c, { x, y: 1.75, z: 1.2, parent: g, seg: 4 }));
			[-0.4, 0.4].forEach((x) => [-0.8, 0.8].forEach((z, j) => k.box(0.32, 0.9, 0.32, c, { x, y: 0.45, z, rx: (j ? 0.4 : -0.3) * (x > 0 ? 1 : -1), parent: g })));
			return g;
		};
		const elephant = (o) => {
			const g = k.group(o);
			const c = 0x8a857e;
			k.sphere(1.4, c, { y: 2.9, parent: g, s: [1, 1, 1.4], seg: 12 });
			[-0.6, 0.6].forEach((x) => [-1.1, 1.1].forEach((z, j) => k.cyl(0.35, 0.33, 2.2, c, { x, y: 1.1, z, rx: (j ? 0.3 : -0.25) * (x > 0 ? 1 : -1), parent: g })));
			k.sphere(0.85, c, { y: 3.5, z: 2.0, parent: g, seg: 10 });
			[-1, 1].forEach((s) => k.box(0.08, 1.4, 1.1, 0x7a756e, { x: s * 0.85, y: 3.4, z: 1.7, ry: s * 0.6, parent: g }));
			let p = [0, 3.2, 2.7];
			for (let i = 0; i < 5; i++) {
				const q = [0, p[1] - 0.45, p[2] + 0.28 - i * 0.07];
				tube(k, p, q, 0.24 - i * 0.03, c, { parent: g, r2: 0.21 - i * 0.03 });
				p = q;
			}
			[-0.35, 0.35].forEach((x) => tube(k, [x, 3.0, 2.5], [x * 1.4, 2.9, 3.4], 0.07, 0xf0e8d8, { parent: g, r2: 0.02 }));
			return g;
		};
		const stripes = k.canvas(128, 64, (g, w, h) => {
			g.fillStyle = "#f4f0e8";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#151515";
			for (let i = 0; i < 12; i++) g.fillRect(i * 11, 0, 5, h);
		});
		const zebra = (o) => {
			const g = k.group(o);
			const m = k.mat(0xffffff, { map: stripes });
			k.capsule(0.45, 1.2, m, { y: 1.4, rx: PI / 2, parent: g });
			k.box(0.3, 0.9, 0.35, m, { y: 1.9, z: 1.0, rx: 0.5, parent: g });
			k.box(0.28, 0.3, 0.7, m, { y: 2.3, z: 1.35, parent: g });
			[-0.22, 0.22].forEach((x) => [-0.6, 0.6].forEach((z, j) => k.box(0.12, 1.1, 0.12, 0xe8e4dc, { x, y: 0.55, z, rx: j ? 0.5 : -0.5, parent: g })));
			return g;
		};

		// The living room: green wallpaper, a fireplace, a rug and the game on the floor.
		const paper = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#2f4a32";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#4a6a3e";
			for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 12, 0, 8, h);
			g.fillStyle = "#b8a060";
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2 === 0) {
				g.beginPath();
				g.ellipse(x * 32 + 16, y * 32 + 16, 4, 7, 0, 0, PI * 2);
				g.fill();
			}
		});
		paper.wrapS = paper.wrapT = k.THREE.RepeatWrapping;
		paper.repeat.set(4, 2);
		const wallMat = k.mat(0xffffff, { map: paper });
		const planks = k.canvas(256, 256, (g, w, h) => {
			for (let i = 0; i < 8; i++) {
				g.fillStyle = ["#7a4a28", "#6a4022", "#86522e"][i % 3];
				g.fillRect(0, i * 32, w, 32);
				g.fillStyle = "#3a2212";
				g.fillRect(0, i * 32, w, 2);
				g.fillRect((i * 97) % w, i * 32, 2, 32);
			}
		});
		planks.wrapS = planks.wrapT = k.THREE.RepeatWrapping;
		planks.repeat.set(3, 3);
		k.plane(14, 12, k.mat(0xffffff, { map: planks, rough: 0.6 }), { rx: -PI / 2 });
		k.box(14, 6, 0.3, wallMat, { y: 3, z: -6.15 });
		k.box(0.3, 6, 12, wallMat, { x: -7.15, y: 3 });
		k.box(0.3, 6, 12, wallMat, { x: 7.15, y: 3 });
		k.box(14, 6, 0.3, wallMat, { y: 3, z: 6.15 });
		k.box(14.6, 0.3, 12.6, 0xe8dcc0, { y: 6.1 });
		[[-7, 0, 0.3, 12], [7, 0, 0.3, 12], [0, -6, 14, 0.3]].forEach(([x, z, w, d]) => k.box(w + 0.02, 0.3, d + 0.02, 0x3a2414, { x, y: 0.15, z: z === 0 ? 0 : z }));
		// Tall windows with light pouring in.
		[-3, 1.5].forEach((z) => {
			k.box(0.1, 3.2, 1.6, 0xe8f0ff, { x: -6.98, y: 2.8, z, emissive: 0xc8dcff, glow: 0.9 });
			k.box(0.14, 3.4, 0.1, 0xf0e8d8, { x: -6.95, y: 2.8, z });
			k.box(0.14, 0.1, 1.7, 0xf0e8d8, { x: -6.95, y: 2.8, z });
			k.box(0.1, 3.6, 0.5, 0x8a2a1a, { x: -6.9, y: 2.9, z: z - 1.05 });
			k.box(0.1, 3.6, 0.5, 0x8a2a1a, { x: -6.9, y: 2.9, z: z + 1.05 });
		});
		k.spot(0xfff0d0, 40, { x: -6, y: 4, z: -1, target: [0, 0, 0], angle: 0.6, distance: 20 });
		// Fireplace and mantel.
		k.box(3.2, 2.6, 0.6, 0x8a7a68, { y: 1.3, z: -5.8 });
		k.box(1.8, 1.5, 0.3, 0x1a100a, { y: 0.75, z: -5.5 });
		k.box(3.6, 0.15, 0.8, 0x4a2a18, { y: 2.65, z: -5.75 });
		k.glow(0xff8030, 1.4, { y: 0.4, z: -5.4 });
		k.point(0xff9040, 6, 8, { y: 0.8, z: -5 });
		k.box(1, 1.3, 0.05, 0xc8a040, { y: 3.6, z: -5.98, metal: 0.6 });
		k.box(0.85, 1.15, 0.06, 0x3a4a5a, { y: 3.6, z: -5.96 });
		// Sofa, armchair, side table, lamp.
		const sofa = k.group({ x: 4.8, z: -1, ry: -PI / 2 });
		k.box(3.4, 0.5, 1.1, 0x7a2a22, { y: 0.45, parent: sofa });
		k.box(3.4, 0.9, 0.3, 0x7a2a22, { y: 0.95, z: -0.45, parent: sofa });
		[-1.6, 1.6].forEach((x) => k.box(0.3, 0.75, 1.1, 0x6a221a, { x, y: 0.6, parent: sofa }));
		k.box(1.0, 0.6, 1.0, 0x4a2a18, { x: -5.5, y: 0.3, z: 4 });
		k.cyl(0.05, 0.05, 1, 0xc8a040, { x: -5.5, y: 1.1, z: 4 });
		k.cyl(0.25, 0.35, 0.4, 0xf0e0b0, { x: -5.5, y: 1.7, z: 4, emissive: 0xffd080, glow: 0.6 });
		k.point(0xffd890, 6, 10, { x: -5.5, y: 2, z: 4 });
		k.point(0xfff0d8, 14, 18, { x: 1, y: 5, z: 2 });
		k.cyl(0.1, 0.1, 1, 0x3a2a14, { y: 5.5 });
		k.glow(0xffe0a0, 1.2, { y: 4.9 });
		// The rug.
		const rug = k.canvas(256, 192, (g, w, h) => {
			g.fillStyle = "#7a1a14";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#d8a850";
			g.lineWidth = 6;
			g.strokeRect(14, 14, w - 28, h - 28);
			g.strokeStyle = "#1a2a4a";
			g.strokeRect(28, 28, w - 56, h - 56);
			g.fillStyle = "#d8a850";
			g.beginPath();
			g.ellipse(w / 2, h / 2, 44, 30, 0, 0, PI * 2);
			g.fill();
		});
		k.plane(5, 3.6, k.mat(0xffffff, { map: rug }), { rx: -PI / 2, y: 0.015, z: 0.5 });
		// The board, open: two carved halves, a spiral track on each and the crystal in the middle.
		const track = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#3a2414";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#2a4a20";
			for (let i = 0; i < 40; i++) {
				g.beginPath();
				g.ellipse((i * 53) % w, (i * 31) % h, 10, 4, i, 0, PI * 2);
				g.fill();
			}
			for (let i = 0; i < 70; i++) {
				const a = i * 0.27;
				const r = 112 - i * 1.35;
				g.fillStyle = i % 2 ? "#e0c890" : "#c8a868";
				g.save();
				g.translate(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
				g.rotate(a);
				g.fillRect(-7, -9, 14, 18);
				g.restore();
			}
		});
		const board = k.group({ x: 0, y: 0, z: 0.6 });
		[-1, 1].forEach((s) => {
			k.box(0.74, 0.1, 0.74, wood, { x: s * 0.38, y: 0.05, parent: board });
			k.plane(0.66, 0.66, k.mat(0xffffff, { map: track }), { x: s * 0.38, y: 0.102, rx: -PI / 2, rz: s > 0 ? PI : 0, parent: board });
			[-1, 1].forEach((t) => k.box(0.74, 0.04, 0.05, 0x3a2410, { x: s * 0.38, y: 0.12, z: t * 0.35, parent: board }));
			k.box(0.05, 0.04, 0.74, 0x3a2410, { x: s * 0.73, y: 0.12, parent: board });
		});
		k.cyl(0.13, 0.15, 0.06, 0x3a2410, { y: 0.13, parent: board, seg: 16 });
		k.sphere(0.11, 0x1a5a2a, { y: 0.16, parent: board, s: [1, 0.55, 1], emissive: 0x20a040, glow: 0.8, rough: 0.05, flat: false });
		k.glow(0x60ff80, 0.5, { y: 0.22, parent: board });
		k.point(0x40ff70, 2, 3, { y: 0.6, parent: board });
		[0xd02a1a, 0x2a6ad0, 0xe0c020, 0x2a9a3a].forEach((c, i) => {
			const x = (i % 2 ? 1 : -1) * 0.66, z = (i < 2 ? 1 : -1) * 0.28;
			k.cone(0.035, 0.1, c, { x, y: 0.19, z, parent: board, seg: 8 });
			k.sphere(0.03, c, { x, y: 0.25, z, parent: board });
		});
		const pips = k.canvas(64, 64, (g) => {
			g.fillStyle = "#f2e8d2";
			g.fillRect(0, 0, 64, 64);
			g.fillStyle = "#1a1a1a";
			[[16, 16], [48, 16], [32, 32], [16, 48], [48, 48]].forEach(([x, y]) => {
				g.beginPath();
				g.arc(x, y, 6, 0, PI * 2);
				g.fill();
			});
		});
		const dieMat = k.mat(0xffffff, { map: pips, rough: 0.4 });
		k.box(0.08, 0.08, 0.08, dieMat, { x: 0.32, y: 0.04, z: 1.35, ry: 0.4 });
		k.box(0.08, 0.08, 0.08, dieMat, { x: 0.48, y: 0.04, z: 1.25, ry: -0.3 });
		// The jungle grows in: vines up the walls, giant leaves and flowers.
		const vine = 0x2f6a24;
		const r = rng(12);
		for (let i = 0; i < 14; i++) {
			const onBack = i < 7;
			const base = onBack ? [-6 + i * 2, 0, -5.9] : [-6.9, 0, -5 + (i - 7) * 1.6];
			let p = base;
			for (let j = 0; j < 6; j++) {
				const q = onBack ? [p[0] + (r() - 0.5) * 1.4, p[1] + 1, -5.9 + r() * 0.2] : [-6.9 + r() * 0.2, p[1] + 1, p[2] + (r() - 0.5) * 1.4];
				tube(k, p, q, 0.08, vine, { from: 2 });
				if (j % 2) k.box(0.7, 0.04, 0.4, 0x3a8a2a, { x: q[0] + (onBack ? 0 : 0.3), y: q[1], z: q[2] + (onBack ? 0.3 : 0), ry: r() * 6, rx: 0.4, from: 2 });
				p = q;
			}
		}
		for (let i = 0; i < 12; i++) {
			const x = -6 + r() * 12, z = -5 + r() * 10;
			if (Math.hypot(x, z - 0.6) < 2.2) continue;
			const g = k.group({ x, z, ry: r() * 6, from: 2 });
			for (let j = 0; j < 5; j++) k.box(0.6, 0.04, 1.4, 0x2f7a2a, { y: 0.4 + j * 0.05, z: 0.6, rx: -0.5, parent: k.group({ ry: (j * PI * 2) / 5, parent: g }) });
		}
		[[-4.5, -4], [3.5, -4.6], [-5.6, 1]].forEach(([x, z], i) => {
			const g = k.group({ x, z, from: 2 });
			k.cyl(0.08, 0.12, 1.6 + i * 0.4, vine, { y: 0.8 + i * 0.2, parent: g });
			for (let j = 0; j < 6; j++) k.sphere(0.35, 0xb03aa0, { x: Math.cos(j) * 0.35, y: 1.7 + i * 0.4, z: Math.sin(j) * 0.35, s: [1, 0.4, 1.6], ry: j, parent: g });
			k.sphere(0.2, 0xf2c230, { y: 1.75 + i * 0.4, parent: g });
		});
		// Monkeys on the mantel.
		[-1.2, 0.9].forEach((x) => {
			const m = k.person({ x, y: 2.73, z: -5.65, s: 0.45, pose: x < 0 ? "raise" : "sit", colors: { shirt: 0x5a3a22, legs: 0x5a3a22, skin: 0xc8a080, hair: 0x5a3a22 }, sleeves: 0x5a3a22, from: 2 });
			void m;
		});
		// The stampede bursts through the side of the room.
		k.box(0.32, 4.2, 4.5, 0x1a1208, { x: 7.1, y: 2.1, z: -2.5, from: 5 });
		for (let i = 0; i < 12; i++) k.box(0.3 + r() * 0.5, 0.1, 0.2 + r() * 0.4, 0x5a4a38, { x: 6 - r() * 4, y: 0.05, z: -1 - r() * 4, ry: r() * 3, from: 5 });
		elephant({ x: 5.2, z: -3.6, ry: -PI / 2 - 0.3, from: 5 });
		rhino({ x: 2.2, z: -2.4, ry: -PI / 2 - 0.5, from: 5 });
		zebra({ x: 0.2, z: -4.3, ry: -PI / 2 + 0.1, from: 5 });
		k.particles(300, 0xc8b090, { box: [8, 3, 5], x: 3, z: -3, speed: 0.6, size: 0.06, opacity: 0.5, drift: 0.5, from: 5 });

		// 1869: two boys bury the box in the woods.
		const fx = 300;
		k.ground(120, 0x2a3a24, { x: fx, bump: 0.6, seg: 24 });
		trees(k, 50, [fx - 40, fx + 40, -40, -4], { color: 0x1a3a26, h: 12, seed: 8 });
		k.sphere(1.6, 0x4a3420, { x: fx, y: -0.6, z: 0, s: [1.4, 0.45, 1.2], rough: 1 });
		const box = k.group({ x: fx + 0.1, y: 0.25, z: 0.5, rx: 0.35, ry: 0.3 });
		k.box(0.8, 0.18, 0.8, wood, { parent: box });
		const lid = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#6a4426";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#3a2010";
			g.lineWidth = 10;
			g.strokeRect(14, 14, w - 28, h - 28);
			g.lineWidth = 5;
			for (let i = 0; i < 6; i++) {
				g.beginPath();
				g.ellipse(128, 128, 30 + i * 14, 20 + i * 10, i * 0.5, 0, PI * 2);
				g.stroke();
			}
			g.fillStyle = "#2a1408";
			g.beginPath();
			g.ellipse(128, 128, 22, 30, 0, 0, PI * 2);
			g.fill();
		});
		k.plane(0.76, 0.76, k.mat(0xffffff, { map: lid }), { y: 0.091, rx: -PI / 2, parent: box });
		tube(k, [fx + 1.4, 0, -0.6], [fx + 1.9, 1.5, -0.9], 0.03, 0x5a4028);
		k.box(0.3, 0.4, 0.04, 0x707478, { x: fx + 1.35, y: -0.05, z: -0.57, ry: 0.6, metal: 0.8 });
		k.box(0.2, 0.3, 0.2, 0x2a2a2a, { x: fx - 1.4, y: 0.15, z: 0.8 });
		k.glow(0xffb050, 1.2, { x: fx - 1.4, y: 0.25, z: 0.8 });
		k.point(0xffa040, 10, 10, { x: fx - 1.4, y: 0.6, z: 1.0 });
		k.point(0x8090c0, 6, 40, { x: fx + 6, y: 10, z: 6 });
		k.disc(0xf0f0e0, 6, { x: fx + 10, y: 26, z: -60 });

		// 1969: a workbench in a shoe factory.
		const wz = 400;
		k.box(30, 0.2, 30, 0x6a6460, { z: wz, y: -0.1 });
		k.box(30, 8, 0.3, 0xb8b0a0, { z: wz - 3, y: 4 });
		for (let i = 0; i < 3; i++) {
			k.box(2.4, 1.6, 0.1, 0xd8e8f0, { x: -3 + i * 3, y: 4.5, z: wz - 2.84, emissive: 0xa8c0d0, glow: 0.7 });
			k.box(0.08, 1.6, 0.12, 0x4a4a48, { x: -3 + i * 3, y: 4.5, z: wz - 2.8 });
		}
		k.box(4, 0.12, 1.4, 0x7a5a38, { y: 1.0, z: wz - 1 });
		[-1.8, 1.8].forEach((x) => [-0.6, 0.6].forEach((z) => k.box(0.12, 1.0, 0.12, 0x4a3a28, { x, y: 0.5, z: wz - 1 + z })));
		const shoe = (x, z, ry, c, o = {}) => {
			const g = k.group({ x, y: 1.06, z, ry, ...o });
			k.box(0.22, 0.04, 0.6, 0x2a1a10, { y: 0.02, parent: g });
			k.box(0.22, 0.14, 0.42, c, { y: 0.11, z: 0.05, parent: g, rough: 0.5 });
			k.box(0.2, 0.2, 0.18, c, { y: 0.14, z: -0.18, parent: g, rough: 0.5 });
			k.sphere(0.11, c, { y: 0.1, z: 0.25, s: [1, 0.6, 1.1], parent: g, rough: 0.5 });
			k.box(0.15, 0.012, 0.16, 0x1a1008, { y: 0.245, z: -0.17, parent: g });
			for (let l = 0; l < 4; l++) k.box(0.16, 0.012, 0.015, 0xf0e8d8, { y: 0.185, z: 0.0 + l * 0.05, parent: g });
			return g;
		};
		shoe(-0.4, wz - 1.1, 0.4, 0x6a2a1a);
		shoe(0.3, wz - 0.9, -0.2, 0xe8e4dc);
		// An iron last, a hammer, tacks, a spool of thread and leather scraps.
		k.box(0.16, 0.24, 0.42, 0x3a3a40, { x: -1.5, y: 1.18, z: wz - 1.4, ry: 0.3, metal: 0.7, rough: 0.4 });
		k.cyl(0.03, 0.03, 0.45, 0x8a6a40, { x: -1.1, y: 1.08, z: wz - 0.7, rz: PI / 2, ry: 0.5 });
		k.box(0.08, 0.08, 0.16, 0x3a3a40, { x: -1.3, y: 1.1, z: wz - 0.82, ry: 0.5, metal: 0.8 });
		for (let i = 0; i < 12; i++) k.cyl(0.006, 0.006, 0.03, 0x8a8a8a, { x: -0.9 + (i % 4) * 0.05, y: 1.075, z: wz - 0.55 + Math.floor(i / 4) * 0.04, metal: 0.8 });
		k.cyl(0.07, 0.07, 0.1, 0xd8c8a0, { x: 1.0, y: 1.11, z: wz - 1.5 });
		[[-0.1, -0.5, 0.3], [0.6, -1.5, 1.2], [-1.4, -1.4, 2]].forEach(([x, z, ry]) => k.box(0.3, 0.008, 0.2, 0x8a4a2a, { x, y: 1.065, z: wz + z, ry }));
		// Racks of boxes along the wall.
		for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) k.box(0.7, 0.35, 0.5, [0xd8c8a8, 0xc8b898, 0xe0d4b8][(x + y) % 3], { x: -4 + x * 0.75 + (y % 2) * 0.1, y: 0.2 + y * 0.38, z: wz - 2.5 });
		k.point(0xfff0d8, 10, 14, { x: 1, y: 3.5, z: wz + 1 });
		k.point(0xd0e0f0, 6, 14, { x: -2, y: 4.5, z: wz - 2 });

		// The stampede down a small-town street.
		const sx = -300;
		k.ground(300, 0x6a8a48, { x: sx, bump: 0.3, seg: 20 });
		k.box(10, 0.1, 200, 0x4a4a4c, { x: sx, y: 0.1 });
		[-1, 1].forEach((s) => k.box(2, 0.25, 200, 0xb8b0a0, { x: sx + s * 6, y: 0.12 }));
		for (let i = 0; i < 8; i++)
			[-1, 1].forEach((s) => {
				const z = 30 - i * 14;
				const c = [0xe8e0d0, 0xc8d8e8, 0xf0d8b8, 0xd8c8d8][(i + (s > 0 ? 1 : 0)) % 4];
				k.box(8, 6, 8, c, { x: sx + s * 15, y: 3, z });
				k.cone(6.5, 3.5, 0x5a3a30, { x: sx + s * 15, y: 7.75, z, ry: PI / 4, seg: 4 });
				k.box(1.2, 2, 0.1, 0x5a3a2a, { x: sx + s * 10.95, y: 1, z, ry: PI / 2 });
				k.cyl(0.3, 0.4, 5, 0x5a3a20, { x: sx + s * 8.5, y: 2.5, z: z + 6 });
				k.sphere(2.4, [0xd86a20, 0xe8a030, 0xc84a1a][i % 3], { x: sx + s * 8.5, y: 6, z: z + 6, seg: 7, rings: 5 });
			});
		const crushed = car(k, 0x3a6aa8, { x: sx + 3, y: 0.1, z: 6, ry: 0.4, s: [1, 0.45, 1] });
		void crushed;
		const herd = [];
		for (let i = 0; i < 4; i++) herd.push(elephant({ x: sx - 3 + (i % 2) * 5, z: -14 - i * 7, s: 1.1 }));
		for (let i = 0; i < 5; i++) herd.push(rhino({ x: sx - 4 + i * 2, z: -4 - (i % 2) * 4 }));
		for (let i = 0; i < 4; i++) herd.push(zebra({ x: sx + 2.5 - i * 2, z: -8 - i * 3 }));
		k.tick((t) => herd.forEach((h, i) => (h.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.2)));
		k.particles(800, 0xc8b090, { x: sx, z: -15, box: [16, 5, 40], speed: 0.8, size: 0.15, opacity: 0.45, drift: 1 });
		return {
			shots: [
				{ pos: [0.9, 1.75, wz + 0.4], look: [0, 1.1, wz - 1.0], fov: 42, fog: [0x8a8478, 8, 40] },
				{ pos: [fx + 0.9, 1.1, 2.0], look: [fx, 0.2, 0.3], fov: 42, fog: [0x1a2438, 6, 70], exposure: 1.4 },
				{ pos: [5.2, 3, 5.2], look: [-1.5, 1.8, -3], fov: 55 },
				{ pos: [0.05, 1.25, 1.75], look: [0, 0.05, 0.55], fov: 45 },
				{ pos: [sx + 1.5, 1.8, 7], look: [sx, 2.4, -12], fov: 55 },
				{ pos: [-1.8, 3.2, 4.4], look: [2.2, 1.0, -2.2], fov: 58 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the storm (Twister)
	r91: (k) => {
		k.fog(0x8a9a8a, 50, 420);
		k.sky(0x3a4a46, 0xa8b498, { offset: -0.05 });
		k.light({ sky: 0xd8e8d0, ground: 0x4a4a30, hemi: 1.7, sunColor: 0xf0f0d8, sunIntensity: 1.4, sunPos: [60, 50, 60], shadowSize: 40 });
		const r = rng(21);
		/** A funnel: stacked open rings that widen with height, plus orbiting debris. */
		const tornado = (o) => {
			const g = k.group(o);
			const spin = k.group({ parent: g });
			const n = 18;
			for (let i = 0; i < n; i++) {
				const t0 = i / n, t1 = (i + 1) / n;
				const rb = 1.5 + Math.pow(t0, 2.2) * 26, rt = 1.5 + Math.pow(t1, 2.2) * 26;
				const seg = k.cyl(rt, rb, 5.2, i % 2 ? 0x6a6a62 : 0x5e5e58, { y: 2.5 + i * 5, x: Math.sin(i * 0.4) * 2.2 * (1 - t0), parent: spin, seg: 14, open: true, side: k.THREE.DoubleSide, opacity: 0.88, rough: 1 });
				seg.castShadow = false;
			}
			k.sphere(9, 0x8a7a60, { y: 1, parent: g, s: [1, 0.4, 1], opacity: 0.55, seg: 10 });
			const debris = [];
			for (let i = 0; i < 70; i++) debris.push([r() * PI * 2, r() * 30, 3 + r() * 9]);
			const pts = dots(k, debris.map(() => [0, 0, 0]), 0x3a3028, { parent: g, size: 0.5 });
			k.tick((t) => {
				spin.rotation.y = -t * 1.5;
				const a = pts.geometry.attributes.position;
				debris.forEach(([a0, h, rad], i) => {
					const ang = a0 - t * (2 + 10 / rad);
					const y = (h + t * 3) % 30;
					a.setXYZ(i, Math.cos(ang) * (rad + y * 0.3), y, Math.sin(ang) * (rad + y * 0.3));
				});
				a.needsUpdate = true;
			});
			return g;
		};
		const truckRed = 0xb01818;
		const truck = (o) => {
			const g = k.group(o);
			k.box(2.0, 0.6, 5.4, truckRed, { y: 0.95, parent: g, metal: 0.3, rough: 0.4 });
			k.box(1.98, 1.0, 1.8, truckRed, { y: 1.75, z: 0.4, parent: g, metal: 0.3, rough: 0.4 });
			k.box(1.8, 0.7, 0.08, 0x1a2430, { y: 1.85, z: 1.32, rx: -0.3, parent: g });
			[-1, 1].forEach((s) => k.box(0.04, 0.6, 1.2, 0x1a2430, { x: s * 1.0, y: 1.9, z: 0.4, parent: g }));
			k.box(2.0, 0.5, 1.4, truckRed, { y: 1.45, z: 2.0, parent: g, metal: 0.3, rough: 0.4 });
			k.box(1.6, 0.3, 0.1, 0xc8ccd0, { y: 1.2, z: 2.72, parent: g, metal: 0.9 });
			[-1, 1].forEach((s) => k.box(0.1, 0.5, 2.6, truckRed, { x: s * 0.95, y: 1.5, z: -1.4, parent: g }));
			k.box(2.0, 0.5, 0.1, truckRed, { y: 1.5, z: -2.7, parent: g });
			k.box(1.7, 0.1, 0.3, 0x2a2a2a, { y: 2.3, z: 0.4, parent: g });
			[-0.95, 0.95].forEach((x) => [-1.7, 1.6].forEach((z) => k.cyl(0.5, 0.5, 0.35, 0x151515, { x, y: 0.5, z, rz: PI / 2, parent: g })));
			[-0.65, 0.65].forEach((x) => k.glow(0xfff4d0, 0.5, { x, y: 1.4, z: 2.72, parent: g }));
			return g;
		};
		/** The instrument drum, packed with little winged sensors. */
		const drum = (o, open) => {
			const g = k.group(o);
			k.cyl(0.45, 0.45, 1.1, 0xc8ccd0, { y: 0.55, parent: g, metal: 0.85, rough: 0.3, seg: 18 });
			[0.15, 0.55, 0.95].forEach((y) => k.torus(0.46, 0.03, 0x9aa0a6, { y, rx: PI / 2, parent: g, metal: 0.9 }));
			k.box(0.3, 0.4, 0.05, 0xd02020, { y: 0.6, z: 0.45, parent: g });
			if (!open) k.cyl(0.46, 0.46, 0.05, 0xb8bcc0, { y: 1.12, parent: g, metal: 0.9 });
			return g;
		};
		const sensor = (o) => {
			const g = k.group(o);
			k.sphere(0.06, 0xf4f4f0, { parent: g, seg: 8, rings: 6 });
			k.box(0.16, 0.008, 0.04, 0xd8dce0, { y: 0.02, parent: g, metal: 0.8, rough: 0.2 });
			k.box(0.04, 0.008, 0.16, 0xd03020, { y: 0.02, parent: g });
			return g;
		};
		// The plains: a dirt road, fences, telephone poles, a farm.
		k.ground(700, 0x8a9448, { bump: 0.6, seg: 50 });
		k.box(7, 0.12, 700, 0x8a7458, { y: 0.06 });
		for (let z = -300; z < 300; z += 8) [-1, 1].forEach((s) => k.box(0.12, 1.1, 0.12, 0x5a4a38, { x: s * 5, y: 0.55, z }));
		[-1, 1].forEach((s) => k.box(0.04, 0.04, 600, 0x3a3a3a, { x: s * 5, y: 0.9 }));
		for (let z = -280; z < 200; z += 25) {
			k.cyl(0.15, 0.2, 9, 0x4a3a2a, { x: 7.5, y: 4.5, z });
			k.box(2.2, 0.15, 0.15, 0x4a3a2a, { x: 7.5, y: 8.3, z });
		}
		[-0.9, 0.9].forEach((dx) => k.box(0.03, 0.03, 480, 0x222222, { x: 7.5 + dx, y: 8.4, z: -40 }));
		const farm = k.group({ x: -40, z: -30, ry: 0.4 });
		k.box(8, 5, 6, 0xe8e0d0, { y: 2.5, parent: farm });
		k.cone(6.2, 3, 0x5a3a30, { y: 6.5, ry: PI / 4, seg: 4, s: [1, 1, 0.75], parent: farm });
		k.box(7, 6, 7, 0x9a2a1a, { x: 12, y: 3, parent: farm });
		k.cone(5.6, 3, 0x3a3a3a, { x: 12, y: 7.5, ry: PI / 4, seg: 4, parent: farm });
		k.cyl(1.4, 1.4, 10, 0xb8bcc0, { x: 18, y: 5, z: 3, parent: farm, metal: 0.6 });
		k.cone(1.6, 1.4, 0xb8bcc0, { x: 18, y: 10.7, z: 3, parent: farm, metal: 0.6 });
		trees(k, 14, [-70, -20, -60, -10], { color: 0x3a5a2a, h: 9, seed: 5, avoid: (x, z) => Math.hypot(x + 34, z + 28) < 14 });
		// Storm clouds.
		for (let i = 0; i < 40; i++) k.sphere(30 + r() * 30, 0x4a5450, { x: -60 + (r() - 0.5) * 360, y: 85 + r() * 15, z: -160 + (r() - 0.5) * 240, s: [1.6, 0.35, 1.2], seg: 8, rings: 6, rough: 1, shadow: false });
		const wall = k.cyl(40, 30, 14, 0x3e4642, { x: -30, y: 80, z: -120, seg: 16, from: 3 });
		k.tick((t) => (wall.rotation.y = t * 0.2));
		const flash = k.point(0xe0e8ff, 0, 600, { x: -40, y: 70, z: -100 });
		k.tick((t) => (flash.intensity = Math.sin(t * 1.1) > 0.96 ? 60 : 0));
		// The funnel.
		tornado({ x: -30, z: -120, s: [1.6, 1, 1.6], from: 3 });
		// The cow.
		const hide = k.canvas(128, 64, (g, w, h) => {
			g.fillStyle = "#f2f0ea";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#1a1a1a";
			[[20, 20, 16], [70, 40, 20], [105, 15, 12], [45, 55, 10]].forEach(([x, y, rr]) => {
				g.beginPath();
				g.ellipse(x, y, rr, rr * 0.8, x, 0, PI * 2);
				g.fill();
			});
		});
		const cow = k.group({ x: -6, y: 22, z: -40, rx: 0.5, rz: 1.1, ry: 0.4, s: 1.4, from: 3, tag: "cow" });
		const cm = k.mat(0xffffff, { map: hide });
		k.box(1.1, 1.0, 2.2, cm, { parent: cow });
		k.box(0.6, 0.6, 0.75, cm, { y: 0.3, z: 1.4, parent: cow });
		k.box(0.45, 0.3, 0.2, 0xe0a0a0, { y: 0.15, z: 1.8, parent: cow });
		[-0.3, 0.3].forEach((x) => k.cone(0.06, 0.25, 0xe8e0c8, { x, y: 0.7, z: 1.3, parent: cow }));
		[-0.4, 0.4].forEach((x) => [-0.8, 0.8].forEach((z) => k.box(0.2, 0.9, 0.2, 0xf2f0ea, { x, y: -0.9, z, rx: z * 0.4, parent: cow })));
		k.tick((t) => {
			cow.position.set(-6 + Math.sin(t * 0.5) * 2, 22 + Math.sin(t * 0.8), -40);
			cow.rotation.y = 0.4 + t * 0.3;
		});
		for (let i = 0; i < 18; i++) k.box(0.15, 0.05, 1.5 + r() * 2, 0x6a5038, { x: -6 + (r() - 0.5) * 30, y: 15 + r() * 20, z: -40 + (r() - 0.5) * 20, rx: r() * 6, ry: r() * 6, from: 3 });
		k.particles(600, 0x5a6a3a, { x: -10, y: 5, z: -50, box: [60, 40, 40], speed: -2, size: 0.12, drift: 4, from: 3 });
		k.particles(1500, 0xb8c0c8, { box: [80, 40, 80], speed: 28, size: 0.05, opacity: 0.4, drift: 3 });
		// The chasers' truck, and the drum set down in the funnel's path.
		const rig = truck({ x: 0, y: 0.1, z: 0, ry: PI, from: 3 });
		const bed = drum({ x: 0, y: 0.95, z: -1.4, parent: rig }, false);
		void bed;
		drum({ x: -10, y: 0.1, z: -60, from: 4 }, true);
		const swarm = [];
		for (let i = 0; i < 40; i++) swarm.push(sensor({ from: 4 }));
		k.tick((t) => swarm.forEach((s, i) => {
			const p = (t * 0.08 + i / 40) % 1;
			const a = i * 2.4 + t * (1 + p * 2);
			const rad = 0.5 + p * 14;
			s.position.set(-10 + (-30 + 10) * p * 0.8 + Math.cos(a) * rad, 1.2 + p * 45, -60 - 55 * p + Math.sin(a) * rad);
			s.rotation.set(t * 3 + i, t * 5, 0);
			s.scale.setScalar(5);
		}));

		// Close-up: the open drum, full of sensors.
		const dx = 300;
		k.ground(60, 0x8a9448, { x: dx, bump: 0.3, seg: 10 });
		drum({ x: dx, y: 0, z: 0 }, true);
		k.cyl(0.42, 0.42, 0.02, 0x2a2a2a, { x: dx, y: 0.98 });
		for (let i = 0; i < 46; i++) {
			const a = r() * PI * 2, rr = Math.sqrt(r()) * 0.34;
			sensor({ x: dx + Math.cos(a) * rr, y: 1.02 + r() * 0.08, z: Math.sin(a) * rr, ry: r() * 6, rx: (r() - 0.5) * 0.8 });
		}
		for (let i = 0; i < 6; i++) sensor({ x: dx + 0.6 + r() * 0.6, y: 0.08, z: (r() - 0.5) * 1.2, ry: r() * 6 });

		// A drive-in at night, and a funnel behind the screen.
		const dz = 400;
		k.ground(400, 0x3a4030, { z: dz, bump: 0.3 });
		const screen = k.group({ x: 0, z: dz - 30 });
		k.box(28, 13, 0.4, 0xf0f4ff, { y: 12, parent: screen, emissive: 0xc8d4f0, glow: 0.9 });
		k.box(28.4, 0.6, 0.6, 0x3a3a3a, { y: 18.7, parent: screen });
		for (let i = -3; i <= 3; i++) k.box(0.4, 18, 0.4, 0x4a4a4a, { x: i * 4.5, y: 9, z: -0.5, parent: screen });
		k.point(0xd0dcff, 30, 60, { x: 0, y: 10, z: dz - 20 });
		const cols = [0xc04030, 0x3a6aa8, 0xe8d8a0, 0x2a8a5a, 0x8a3a8a, 0xd0d0d0];
		for (let row = 0; row < 3; row++) for (let c = 0; c < 6; c++) {
			if (row === 2 && c === 2) continue;
			car(k, cols[(row * 3 + c) % cols.length], { x: -12 + c * 4.8, y: 0.05, z: dz - 8 + row * 7, ry: PI + (row - 1) * 0.04 });
			k.cyl(0.05, 0.05, 1.2, 0x5a5a5a, { x: -9.6 + c * 4.8, y: 0.6, z: dz - 8 + row * 7 });
		}
		tornado({ x: 25, z: dz - 90, s: 1.1 });
		const flash2 = k.point(0xd8e4ff, 0, 400, { x: 20, y: 60, z: dz - 60 });
		k.tick((t) => (flash2.intensity = Math.sin(t * 1.7) > 0.9 ? 50 : 4));
		return {
			shots: [
				{ pos: [3, 1.8, 30], look: [-30, 8, -40], fov: 50 },
				{ pos: [dx + 0.35, 1.75, 0.7], look: [dx, 1.0, 0], fov: 40 },
				{ pos: [-4, 3, dz + 20], look: [8, 16, dz - 50], fov: 55, fog: [0x1c2430, 30, 320], exposure: 1.3 },
				{ pos: [4.5, 2.2, 7], look: [-4, 4, -40], fov: 48, hide: ["cow"] },
				{ pos: [-7.2, 1.5, -56.5], look: [-13, 7, -80], fov: 55, exposure: 1.25, hide: ["cow"] },
				{ pos: [3, 18, -29], look: [-7, 22, -42], fov: 50, exposure: 1.3 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the island (Cast Away)
	r92: (k) => {
		k.fog(0xc8eef4, 90, 520);
		k.sky(0x2a8ae0, 0xd8f4f8);
		k.light({ sky: 0xe8f8ff, ground: 0xc8b088, hemi: 1.3, sunPos: [50, 70, 60], sunIntensity: 2.6, shadowSize: 60 });
		const amp = 0.25;
		k.water(800, 0x1a9ab8, { seg: 80, amp, opacity: 0.92 });
		k.ground(170, 0xead8a6, { bump: 0.15, seg: 50, height: (x, z) => 1.2 - Math.max(0, Math.hypot(x, z * 1.2) - 48) * 0.3 });
		k.ground(60, 0x4a8a3a, { y: 1.3, z: -18, bump: 2, seg: 20, height: (x, z) => Math.max(-3, 7 - Math.hypot(x, z) * 0.3) });
		// The rock peak.
		k.cone(16, 34, 0x7a6a58, { x: -4, y: 17, z: -30, seg: 7, rough: 1 });
		k.cone(9, 20, 0x8a7a66, { x: 10, y: 10, z: -24, seg: 6, rough: 1 });
		k.ico(5, 0x6a5a4a, { x: -14, y: 3, z: -6, s: [1.4, 0.8, 1] });
		const r = rng(31);
		for (let i = 0; i < 24; i++) {
			const a = -PI * 0.95 + r() * PI * 0.9, d = 22 + r() * 18;
			palm(k, Math.cos(a) * d, 1.2, Math.sin(a) * d * 0.8 - 6, 7 + r() * 4, 1 + r() * 2, { dir: a + PI });
		}
		for (let i = 0; i < 10; i++) {
			const x = -30 + r() * 60, z = -40 + r() * 25;
			k.ico(2 + r() * 2.5, 0x3a7a2a, { x, y: 3 + r() * 3, z });
		}
		// The washed-up box with wings drawn on it, among other parcels.
		const wings = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#c89a62";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#a07848";
			g.lineWidth = 10;
			g.beginPath();
			g.moveTo(0, 128);
			g.lineTo(256, 128);
			g.stroke();
			g.strokeStyle = "#2a2018";
			g.lineWidth = 3;
			[-1, 1].forEach((sd) => {
				for (let f = 0; f < 7; f++) {
					g.save();
					g.translate(128 + sd * 18, 112);
					g.rotate(sd * (0.25 + f * 0.2));
					g.fillStyle = f % 2 ? "#f4ecd8" : "#fffaf0";
					g.beginPath();
					g.ellipse(sd * 46, 0, 50 - f * 2, 11, 0, 0, PI * 2);
					g.fill();
					g.stroke();
					g.restore();
				}
			});
		});
		const parcel = k.mat(0xffffff, { map: wings });
		const kraft = 0xc89a62;
		const px = 6, pz = 34;
		k.box(0.6, 0.38, 0.45, kraft, { x: px, y: 1.32, z: pz, ry: 0.3 });
		k.plane(0.6, 0.45, parcel, { x: px, y: 1.515, z: pz, rx: -PI / 2, rz: 0.3 });
		[[3, 33, 0.8], [8.5, 36, -0.4], [4.6, 37, 1.2]].forEach(([x, z, ry], i) => k.box(0.5 + i * 0.1, 0.3, 0.4, i === 1 ? 0xf0f0ea : kraft, { x, y: 1.25, z, ry, rz: 0.1 }));
		// Out to sea: the raft with its ribbed panel sail, and the volleyball adrift.
		const raft = k.group({ x: 20, y: 0, z: 78, ry: 0.3, from: 4 });
		for (let i = 0; i < 6; i++) k.cyl(0.18, 0.18, 4, 0x8a6a40, { x: -1.0 + i * 0.4, y: 0.2, rx: PI / 2, parent: raft });
		k.cyl(0.07, 0.07, 4.2, 0x7a5a38, { y: 2.3, parent: raft });
		const ribs = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#6a8aa8";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#4a6a88";
			for (let i = 0; i < 8; i++) g.fillRect(i * 16 + 6, 0, 4, h);
		});
		k.box(1.8, 2.4, 0.04, k.mat(0xffffff, { map: ribs }), { y: 2.9, z: 0.1, parent: raft, ry: 0.2 });
		const chuck = (o) => {
			const p = k.person({ ...o, colors: { shirt: 0xe8e0c8, legs: 0x9a8a68, skin: 0xb07850, hair: 0x5a4028 } });
			const head = p.userData.limbs.head;
			k.box(0.3, 0.25, 0.14, 0x5a4028, { y: -0.15, z: 0.12, parent: head });
			k.box(0.44, 0.35, 0.18, 0x5a4028, { y: -0.08, z: -0.1, parent: head });
			return p;
		};
		const sailor = chuck({ x: 0.4, y: 0.38, z: 1.0, ry: 0.4, pose: "point", parent: raft });
		sailor.userData.limbs.armR.rotation.x = -1.3;
		const wilsonTex = k.canvas(512, 256, (g, w, h) => {
			g.fillStyle = "#f4f2ea";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#c8c4b8";
			g.lineWidth = 3;
			for (let i = 0; i < 6; i++) {
				g.beginPath();
				g.moveTo(i * 85, 0);
				g.bezierCurveTo(i * 85 + 40, 80, i * 85 - 40, 170, i * 85, h);
				g.stroke();
			}
			const cx = w * 0.25, cy = h * 0.4;
			g.fillStyle = "#b8281e";
			g.beginPath();
			g.ellipse(cx, cy + 14, 34, 40, 0, 0, PI * 2);
			g.fill();
			[[-24, -46, -0.25], [-8, -56, -0.08], [9, -56, 0.08], [25, -46, 0.25]].forEach(([dx, dy, a]) => {
				g.save();
				g.translate(cx + dx, cy + dy);
				g.rotate(a);
				g.beginPath();
				g.ellipse(0, 0, 7, 22, 0, 0, PI * 2);
				g.fill();
				g.restore();
			});
			g.save();
			g.translate(cx + 38, cy + 12);
			g.rotate(0.9);
			g.beginPath();
			g.ellipse(0, 0, 8, 20, 0, 0, PI * 2);
			g.fill();
			g.restore();
			g.fillStyle = "#4a0a08";
			[-12, 12].forEach((dx) => g.fillRect(cx + dx - 3, cy + 2, 6, 10));
			g.strokeStyle = "#4a0a08";
			g.lineWidth = 4;
			g.beginPath();
			g.arc(cx, cy + 22, 14, 0.3, PI - 0.3);
			g.stroke();
		});
		const ball = k.sphere(0.45, k.mat(0xffffff, { map: wilsonTex, flat: false, rough: 0.7 }), { x: 14, y: 0.2, z: 85, ry: -0.45, seg: 24, rings: 16, from: 5 });
		k.tick((t) => {
			ball.position.y = waveY(14, 85, t, amp) + 0.3;
			ball.rotation.z = Math.sin(t * 0.9) * 0.15;
			raft.position.y = waveY(20, 78, t, amp) - 0.05;
			raft.rotation.x = Math.sin(t * 1.2) * 0.05;
		});
		// Night: the crash. An orange raft in a storm, wreckage burning.
		const cx = -700;
		k.water(260, 0x0e2a3a, { x: cx, seg: 50, amp: 0.7 });
		const life = k.group({ x: cx, y: 0.1, z: 0 });
		k.torus(1.3, 0.35, 0xf06a10, { rx: PI / 2, parent: life, seg: 20, emissive: 0x401800 });
		k.cyl(1.3, 1.3, 0.1, 0xd05a10, { y: -0.2, parent: life, seg: 20 });
		chuck({ x: 0, y: -0.4, z: 0, ry: 2.4, pose: "hunch", parent: life, s: 0.9 });
		k.tick((t) => {
			life.position.y = waveY(0, 0, t, 0.7) + 0.1;
			life.rotation.z = Math.sin(t * 1.3) * 0.15;
		});
		const tail = k.group({ x: cx - 14, y: 0, z: -30, rz: 0.4 });
		k.box(1, 9, 5, 0xe8e8e8, { y: 3, parent: tail });
		k.box(4, 3, 8, 0xd8d8d8, { y: -0.5, x: 1, parent: tail });
		const fires = [];
		for (let i = 0; i < 10; i++) fires.push(k.glow(i % 2 ? 0xff7020 : 0xffc040, 3 + (i % 3), { x: cx - 18 + i * 1.4, y: 0.5 + (i % 3) * 0.6, z: -28 + (i % 4) }));
		k.point(0xff7020, 30, 60, { x: cx - 12, y: 3, z: -26 });
		k.tick((t) => fires.forEach((f, i) => f.scale.setScalar(3 + Math.sin(t * 8 + i * 2) * 0.8)));
		k.particles(1500, 0xa8b8c8, { x: cx, box: [60, 30, 60], speed: 30, size: 0.06, opacity: 0.5 });
		const bolt = k.point(0xc8d8ff, 0, 300, { x: cx + 20, y: 60, z: -60 });
		k.tick((t) => (bolt.intensity = Math.sin(t * 1.4) > 0.94 ? 80 : 6));

		// Night on the beach: he made fire.
		const fx = 700;
		k.ground(120, 0xb8a078, { x: fx, bump: 0.2, seg: 20 });
		k.water(200, 0x10283a, { x: fx, z: 90, seg: 30, amp: 0.2, y: -0.3 });
		for (let i = 0; i < 6; i++) palm(k, fx - 20 + i * 8, 0, -14 - (i % 2) * 6, 8 + (i % 3), 1.5, { dir: -PI / 2 + (i - 3) * 0.2, leaf: 0x1a3a1a, trunk: 0x3a2a1a });
		const blaze = [];
		for (let i = 0; i < 6; i++) tube(k, [fx + Math.cos(i) * 0.8, 0, Math.sin(i) * 0.8], [fx, 1.1, 0], 0.06, 0x4a3018);
		for (let i = 0; i < 7; i++) blaze.push(k.cone(0.35 - i * 0.03, 1.2 + (i % 3) * 0.4, i % 2 ? 0xff8a20 : 0xffc040, { x: fx + Math.cos(i * 1.7) * 0.25, y: 0.7, z: Math.sin(i * 1.7) * 0.25, emissive: 0xff6010, glow: 1.6, seg: 5, shadow: false }));
		k.glow(0xff9030, 5, { x: fx, y: 1.2, z: 0 });
		k.point(0xff9040, 30, 30, { x: fx, y: 1.6, z: 0.5 });
		k.tick((t) => blaze.forEach((b, i) => (b.scale.y = 0.8 + 0.4 * Math.abs(Math.sin(t * 7 + i)))));
		const triumph = chuck({ x: fx + 1.6, y: 0, z: 1.2, ry: -2.2 });
		triumph.userData.limbs.armL.rotation.z = -2.7;
		triumph.userData.limbs.armR.rotation.z = 2.7;
		k.disc(0xf8f4e0, 5, { x: fx - 10, y: 24, z: 80 });
		k.particles(120, 0xffb040, { x: fx, y: 1, box: [1.5, 6, 1.5], speed: -1.5, size: 0.05, opacity: 0.9 });

		// Close-up: a few coconuts and a flat stone on a patch of sand.
		const nz = 700;
		k.ground(60, 0xd8c49a, { z: nz, bump: 0.12, seg: 30 });
		const husk = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#6a4a2a";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#4a3018";
			g.lineWidth = 2;
			for (let i = 0; i < 60; i++) {
				const x = (i * 37) % w, y = (i * 53) % h;
				g.beginPath();
				g.moveTo(x, y);
				g.lineTo(x + 6, y + 18);
				g.stroke();
			}
		});
		const hm = k.mat(0xffffff, { map: husk, rough: 1 });
		[[-0.5, -0.3, 0.2], [0.35, -0.6, 1.1], [-1.1, -1.1, 2.0]].forEach(([x, z, ry]) => k.sphere(0.22, hm, { x, y: 0.18, z: nz + z, ry, s: [1, 0.92, 1.1], seg: 12, rings: 9 }));
		[[0.45, 0.25, 0.4], [-0.15, 0.45, -1.4]].forEach(([x, z, rz]) => {
			const half = k.group({ x, y: 0.12, z: nz + z, rz, rx: -0.3 });
			k.mesh(new k.THREE.SphereGeometry(0.21, 12, 8, 0, PI * 2, PI / 2, PI / 2), k.mat(0x5a3a20, { side: k.THREE.DoubleSide }), { parent: half });
			k.cyl(0.19, 0.19, 0.01, 0xf4f0e4, { y: -0.01, parent: half, seg: 14 });
		});
		k.ico(0.35, 0x8a847a, { x: 1.0, y: 0.08, z: nz - 0.2, s: [1.3, 0.35, 1], rough: 1 });
		[[-1.6, 0.4], [1.4, -1.2], [0.9, 0.9], [-0.6, 1.2]].forEach(([x, z], i) => k.ico(0.06 + (i % 2) * 0.04, 0xb0a490, { x, y: 0.03, z: nz + z }));
		tube(k, [-2.4, 0.04, nz - 0.4], [-0.9, 0.04, nz + 0.6], 0.03, 0x9a8460);
		k.point(0xfff0d0, 10, 12, { x: 2, y: 4, z: nz + 2 });
		return {
			shots: [
				{ pos: [cx + 4, 2.2, 7], look: [cx - 4, 1.4, -10], fov: 50, fog: [0x0e1824, 5, 110], exposure: 1.4 },
				{ pos: [0.6, 1.7, nz + 2.2], look: [0, 0.1, nz - 0.2], fov: 45, fog: [0xe8dcc0, 6, 40], hide: ["sky"] },
				{ pos: [px + 0.5, 2.35, pz + 0.75], look: [px, 1.4, pz], fov: 40 },
				{ pos: [fx + 6, 1.6, 8], look: [fx + 0.6, 1.6, 0], fov: 45, fog: [0x0c1624, 6, 90], exposure: 1.3 },
				{ pos: [25, 1.6, 86], look: [17, 2.6, 70], fov: 50 },
				{ pos: [12.4, 1.2, 88.2], look: [15.4, 0.95, 81], fov: 45 },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the lifeboat (Life of Pi)
	r93: (k) => {
		k.fog(0xf4c8b0, 80, 620);
		k.sky(0x4a68b0, 0xffcca8, { offset: -0.02 });
		k.stars(1200, { upper: false });
		k.light({ sky: 0xffe0d0, ground: 0x7a6a9a, hemi: 1.5, sunColor: 0xffc890, sunIntensity: 2.2, sunPos: [-30, 30, -60], shadowSize: 14 });
		const T = k.THREE;
		const r = rng(93);
		// A glassy sea that mirrors the clouds: the water is see-through, the clouds have twins below it.
		k.water(900, 0xe0b8c0, { seg: 60, amp: 0.03, opacity: 0.55 });
		k.sphere(2000, 0xe8a8a8, { y: -2001, seg: 8, rings: 4, shadow: false, until: 3 });
		for (let i = 0; i < 26; i++) {
			const x = (r() - 0.5) * 700, z = -100 - r() * 400, y = 40 + r() * 40, w = 20 + r() * 40;
			const c = [0xfff0e8, 0xf8d0c8, 0xe8c0d8][i % 3];
			k.sphere(w, c, { x, y, z, s: [1.6, 0.35, 0.9], seg: 9, rings: 6, rough: 1, shadow: false, emissive: 0x6a4a4a, glow: 0.5 });
			k.sphere(w, c, { x, y: -y, z, s: [1.6, 0.35, 0.9], seg: 9, rings: 6, rough: 1, shadow: false, emissive: 0x6a4a4a, glow: 0.5 });
		}
		k.glow(0xffd8a0, 120, { x: 60, y: 25, z: -500, tag: "sky" });
		k.glow(0xffd8a0, 90, { x: 60, y: -25, z: -500, tag: "sky", opacity: 0.6 });
		// The boat, the tiger, the raft and the boy.
		const tigerTex = k.canvas(256, 128, (g, w, h) => {
			g.fillStyle = "#e8781a";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#f4e4cc";
			g.fillRect(0, h * 0.78, w, h * 0.22);
			g.fillStyle = "#1a1008";
			for (let i = 0; i < 18; i++) {
				const x = i * 14 + 4;
				g.beginPath();
				g.moveTo(x, 0);
				g.quadraticCurveTo(x + 10, h * 0.3, x - 2, h * 0.62);
				g.lineTo(x + 4, h * 0.62);
				g.quadraticCurveTo(x + 15, h * 0.3, x + 6, 0);
				g.fill();
			}
		});
		const fur = k.mat(0xffffff, { map: tigerTex });
		const tiger = (o) => {
			const g = k.group(o);
			k.capsule(0.34, 1.0, fur, { y: 0.78, rx: PI / 2, parent: g });
			const head = k.group({ y: 1.0, z: 0.95, parent: g });
			k.box(0.52, 0.46, 0.46, fur, { parent: head });
			k.box(0.32, 0.2, 0.22, 0xf4e8d8, { y: -0.12, z: 0.28, parent: head });
			k.box(0.1, 0.06, 0.05, 0x3a2020, { y: -0.04, z: 0.4, parent: head });
			[-0.15, 0.15].forEach((x) => {
				k.sphere(0.045, 0xd8e040, { x, y: 0.08, z: 0.235, parent: head, emissive: 0x404000 });
				k.sphere(0.02, 0x050505, { x, y: 0.08, z: 0.27, parent: head });
				k.cone(0.09, 0.14, 0xe8781a, { x: x * 1.4, y: 0.28, z: -0.05, parent: head, seg: 4 });
				k.box(0.14, 0.12, 0.08, 0xf4ecdc, { x: x * 1.5, y: -0.1, z: 0.22, parent: head });
			});
			[-0.2, 0.2].forEach((x) => [-0.55, 0.55].forEach((z) => k.box(0.17, 0.6, 0.2, fur, { x, y: 0.3, z, parent: g })));
			let p = [0, 0.85, -0.75];
			for (let i = 0; i < 5; i++) {
				const q = [Math.sin(i * 0.6) * 0.25, 0.85 - i * 0.12, -0.75 - (i + 1) * 0.2];
				tube(k, p, q, 0.06, i === 4 ? 0x1a1008 : 0xe8781a, { parent: g });
				p = q;
			}
			return g;
		};
		const boy = (o) => {
			const p = k.person({ ...o, colors: { shirt: 0xe8e0d0, legs: 0xc8b898, skin: 0x8a5a38, hair: 0x1a1008 } });
			k.box(0.35, 0.22, 0.16, 0x1a1008, { y: -0.12, z: 0.1, parent: p.userData.limbs.head });
			return p;
		};
		const hullGeo = new T.SphereGeometry(1, 20, 10, 0, PI * 2, PI / 2, PI / 2);
		const lifeboat = (o) => {
			const g = k.group(o);
			k.mesh(hullGeo, k.mat(o.hull ?? 0xf06a1a, { side: T.DoubleSide }), { y: 0.6, s: [1.3, 0.9, 3.6], parent: g });
			k.torus(1, 0.06, 0xe8e0d0, { y: 0.6, rx: PI / 2, s: [1.3, 3.6, 1], parent: g, seg: 40 });
			k.box(1.9, 0.1, 2.0, o.tarp ?? 0xd85a14, { y: 0.72, z: 1.4, parent: g });
			[-1.6, -0.4].forEach((z) => k.box(2.1, 0.08, 0.3, 0xd8c8a8, { y: 0.45, z, parent: g }));
			return g;
		};
		const raft = (o) => {
			const g = k.group(o);
			[-0.6, 0, 0.6].forEach((x) => k.box(0.1, 0.08, 1.8, 0xc8a878, { x, y: 0.12, parent: g }));
			[-0.6, 0, 0.6].forEach((z) => k.box(1.8, 0.08, 0.1, 0xc8a878, { y: 0.16, z, parent: g }));
			[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([x, z]) => k.box(0.45, 0.2, 0.35, 0xf07a1a, { x, y: 0.05, z, parent: g }));
			k.box(1.3, 0.04, 1.3, 0xd8c8a0, { y: 0.21, parent: g });
			return g;
		};
		const boat = lifeboat({ x: 0, y: 0, z: 0, ry: 0.5 });
		tiger({ x: 0, y: 0.77, z: 1.1, ry: PI / 2 + 0.3, parent: boat });
		const rf = raft({ x: -1.6, y: 0, z: -6.5, ry: 0.5 });
		boy({ x: 0, y: 0.23, z: 0, ry: PI * 0.75, pose: "sit", parent: rf });
		tube(k, [Math.sin(0.5) * -3.5, 0.6, Math.cos(0.5) * -3.5], [-1.6 + 0.4, 0.2, -6.0], 0.02, 0xd8c8a0);
		k.tick((t) => {
			boat.rotation.z = Math.sin(t * 0.7) * 0.02;
			rf.position.y = Math.sin(t * 0.9) * 0.03;
		});

		// Night: the sea glows, and a whale rises.
		const nx = 700;
		k.water(300, 0x0a2638, { x: nx, seg: 40, amp: 0.05, opacity: 0.9 });
		const glow = [];
		for (let i = 0; i < 2500; i++) {
			const a = r() * PI * 2, d = Math.sqrt(r()) * 60;
			glow.push([nx + Math.cos(a) * d, 0.08, Math.sin(a) * d]);
		}
		dots(k, glow, 0x40f0d0, { size: 0.12, add: true, opacity: 0.9 });
		for (let i = 0; i < 40; i++) {
			const a = r() * PI * 2, d = 3 + r() * 25;
			const x = nx + Math.cos(a) * d, z = Math.sin(a) * d;
			k.sphere(0.4 + r() * 0.5, 0x60e0ff, { x, y: 0.02, z, s: [1, 0.5, 1], emissive: 0x30a0d0, glow: 1.2, opacity: 0.7, seg: 10, rings: 6, shadow: false });
			k.glow(0x40c0ff, 2, { x, y: 0.2, z, opacity: 0.6 });
		}
		const nb = lifeboat({ x: nx, y: 0, z: 0, ry: -0.3 });
		tiger({ x: 0, y: 0.77, z: 1.1, ry: -PI / 2, parent: nb });
		boy({ x: 0.2, y: 0.5, z: -1.6, ry: PI, pose: "sit", parent: nb });
		k.point(0x60e0ff, 20, 30, { x: nx, y: 3, z: 4 });
		k.point(0x8090c0, 10, 80, { x: nx + 10, y: 20, z: 10 });
		const whale = k.group({ x: nx - 4, y: 0, z: -9, ry: 0.5, from: 4 });
		const skin = k.mat(0x22445a, { emissive: 0x0a2a40, glow: 0.6 });
		const body = k.group({ rz: 1.0, parent: whale });
		k.capsule(2.6, 11, skin, { y: 4, parent: body, s: [1, 1, 0.9] });
		k.sphere(2.4, 0xb8c8d0, { y: 6, x: 0.9, s: [0.4, 2.4, 0.8], parent: body, emissive: 0x304050 });
		[-1, 1].forEach((sd) => k.box(0.3, 4.5, 1.2, skin, { x: 0.6, y: 6, z: sd * 2.6, rx: sd * 0.9, parent: body }));
		const spots = [];
		for (let i = 0; i < 220; i++) {
			const a = r() * PI * 2, yy = -1 + r() * 13;
			spots.push([Math.cos(a) * 2.65, yy, Math.sin(a) * 2.4]);
		}
		dots(k, spots, 0x80ffe8, { parent: body, size: 0.3, add: true });
		for (let i = 0; i < 30; i++) k.glow(0xa0f0ff, 1 + r() * 2, { x: (r() - 0.5) * 8, y: r() * 1.5, z: (r() - 0.5) * 6, parent: whale, opacity: 0.6 });
		k.particles(300, 0xa0f0ff, { x: nx - 3, y: 0, z: -10, box: [26, 14, 10], speed: 3, size: 0.12, opacity: 0.7, from: 4 });

		// A storm: the cargo ship goes down.
		const sx = -700;
		k.water(300, 0x14303e, { x: sx, seg: 50, amp: 0.9 });
		const ship = k.group({ x: sx, y: -2, z: -40, rx: -0.3, rz: 0.15, ry: 0.5 });
		k.box(12, 9, 70, 0x2a2a2a, { parent: ship });
		k.box(12.1, 1.5, 70, 0x8a2a1a, { y: -3.4, parent: ship });
		k.cyl(10, 10, 9, 0x2a2a2a, { z: 40, seg: 3, s: [0.69, 1, 1], parent: ship });
		for (let i = 0; i < 5; i++) k.box(10.1, 0.5, 8, 0xffe0a0, { y: 6 + i * 1.5, z: -26, parent: ship, emissive: 0xffc070, glow: 0.4 * (i % 2) });
		k.box(10, 8, 9, 0xe8e8e0, { y: 8.5, z: -26, parent: ship });
		for (let i = 0; i < 12; i++) k.box(10, 2.6, 4, [0x3a6aa8, 0xc0402a, 0x2a8a5a, 0xd8a030][i % 4], { y: 5.8, z: -16 + i * 4.4, parent: ship });
		for (let i = 0; i < 14; i++) k.glow(0xffe0a0, 0.8, { x: 5.1, y: 6 + (i % 2) * 2.5, z: -30 + i * 0.6, parent: ship });
		k.glow(0xffe0a0, 3, { y: 13.5, z: -26, parent: ship });
		k.point(0xffd8a0, 8, 50, { x: sx + 2, y: 14, z: -36 });
		k.point(0x8098c0, 10, 120, { x: sx + 30, y: 40, z: -60 });
		const lb = lifeboat({ x: sx + 6, y: 0, z: -4, ry: 1.2 });
		k.tick((t) => {
			lb.position.y = waveY(6, -4, t, 0.9) - 0.1;
			lb.rotation.x = Math.sin(t * 1.3) * 0.15;
		});
		k.particles(1800, 0xb0c0d0, { x: sx, box: [80, 40, 80], speed: 32, size: 0.07, opacity: 0.5 });
		const bolt = k.point(0xd0e0ff, 0, 400, { x: sx - 30, y: 80, z: -80 });
		k.tick((t) => (bolt.intensity = Math.sin(t * 1.5) > 0.9 ? 60 : 8));

		// A French swimming pool: white tiles, a ladder, an empty diving board.
		const qz = 700;
		const tileP = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#f4f2ec";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#c8ccd0";
			g.lineWidth = 2;
			for (let i = 0; i <= 8; i++) {
				g.beginPath();
				g.moveTo(i * 16, 0);
				g.lineTo(i * 16, h);
				g.moveTo(0, i * 16);
				g.lineTo(w, i * 16);
				g.stroke();
			}
		});
		tileP.wrapS = tileP.wrapT = T.RepeatWrapping;
		tileP.repeat.set(6, 6);
		const tm = k.mat(0xffffff, { map: tileP, rough: 0.3 });
		[[-12.5, 0, 15, 22], [12.5, 0, 15, 22], [0, 15.5, 40, 9], [0, -15.5, 40, 9]].forEach(([x, z, w, d]) => k.box(w, 2.4, d, tm, { x, y: -1.2, z: qz + z }));
		k.box(10, 0.2, 22, 0x7ad0e0, { y: -2.3, z: qz, rough: 0.3 });
		k.plane(10, 22, k.mat(0x48b0d0, { opacity: 0.7, rough: 0.1, metal: 0.1 }), { y: -0.3, z: qz, rx: -PI / 2, shadow: false });
		[-1, 1].forEach((sd) => k.box(0.6, 0.1, 22.6, 0xf8f8f4, { x: sd * 5.3, y: 0.02, z: qz }));
		for (let i = 0; i < 6; i++) k.box(0.06, 0.06, 22, i % 2 ? 0xe03030 : 0xf8f8f8, { x: -3.6 + i * 1.45, y: -0.27, z: qz });
		// The ladder.
		[-0.25, 0.25].forEach((x) => tube(k, [5 + x * 0, -1.2, qz + 3 + x], [4.9, 0.9, qz + 3 + x], 0.03, 0xd8dce0, { metal: 0.9, rough: 0.2 }));
		[-0.25, 0.25].forEach((x) => tube(k, [4.9, 0.9, qz + 3 + x], [5.3, 0.9, qz + 3 + x], 0.03, 0xd8dce0, { metal: 0.9, rough: 0.2 }));
		for (let i = 0; i < 3; i++) k.box(0.12, 0.03, 0.5, 0xd8dce0, { x: 4.97, y: -0.9 + i * 0.4, z: qz + 3, metal: 0.9 });
		// The far wall: tiers of balconies, high glass roof light.
		k.box(14, 9, 0.4, 0xf0e8d8, { y: 4.3, z: qz - 12 });
		for (let i = 0; i < 2; i++) {
			k.box(14, 0.2, 1.2, 0xe8e0d0, { y: 3 + i * 3, z: qz - 11.3 });
			for (let x = -6; x <= 6; x += 0.5) k.box(0.04, 0.8, 0.04, 0x2a5a8a, { x, y: 3.5 + i * 3, z: qz - 10.75 });
			k.box(14, 0.05, 0.05, 0x2a5a8a, { y: 3.9 + i * 3, z: qz - 10.75 });
		}
		for (let x = -5; x <= 5; x += 2.5) k.box(1.6, 1.2, 0.1, 0x2a5a8a, { x, y: 1.4, z: qz - 11.75 });
		// The board.
		k.box(0.7, 0.08, 3, 0xf0f0e8, { x: -2, y: 0.9, z: qz - 9.5 });
		k.box(0.5, 0.9, 0.5, 0x8a8a90, { x: -2, y: 0.45, z: qz - 10.8 });
		k.point(0xfff8f0, 20, 40, { y: 9, z: qz });
		k.point(0xa8e8ff, 8, 20, { x: 3, y: 1, z: qz + 6 });

		// The floating island of meerkats.
		const mz = -700;
		k.water(300, 0x2a7a8a, { z: mz, seg: 30, amp: 0.1 });
		k.ground(140, 0x6aa040, { z: mz, y: 0.2, bump: 0.25, seg: 40, height: (x, z) => Math.min(1.2, 8 - Math.hypot(x, z) * 0.14) });
		for (let i = 0; i < 26; i++) {
			const a = r() * PI * 2, d = 12 + r() * 30;
			const x = Math.cos(a) * d, z = mz - 20 + Math.sin(a) * d * 0.6;
			const h = 6 + r() * 6;
			for (let j = 0; j < 4; j++) tube(k, [x + Math.cos(j * 1.6) * 1.2, 0.5, z + Math.sin(j * 1.6) * 1.2], [x, 2.2, z], 0.12, 0x6a5a40);
			k.cyl(0.25, 0.35, h, 0x7a6a4a, { x, y: h / 2 + 2, z });
			k.ico(2.5 + r() * 1.5, 0x3a8a2a, { x, y: h + 2.5, z, s: [1.3, 0.8, 1.3] });
		}
		const meer = [];
		const heads = [];
		for (let i = 0; i < 320; i++) {
			const x = (r() - 0.5) * 36, z = mz + 10 + r() * 20;
			const ry = (r() - 0.5) * 0.6;
			meer.push([x, 1.62, z, ry]);
			heads.push([x, 2.02, z + 0.02, ry]);
		}
		instances(k, new T.CapsuleGeometry(0.09, 0.34, 3, 6), k.mat(0xc8aa78), meer);
		instances(k, new T.SphereGeometry(0.085, 7, 5).scale(1, 1.1, 1), k.mat(0xa88a5a), heads);
		instances(k, new T.ConeGeometry(0.045, 0.12, 5).rotateX(PI / 2), k.mat(0x3a2a1a), heads.map((h) => [h[0] + Math.sin(h[3]) * 0.1, h[1] - 0.02, h[2] + Math.cos(h[3]) * 0.1, h[3]]));
		instances(k, new T.SphereGeometry(0.03, 5, 4), k.mat(0x1a1008), heads.map((h) => [h[0], h[1] + 0.03, h[2] + 0.06, h[3], 2.6, 0.8, 0.6]));
		return {
			shots: [
				{ pos: [3.8, 1.9, qz + 10], look: [-0.5, 0.4, qz - 6], fov: 50, fog: [0xe8eef0, 20, 80], hide: ["sky", "stars"] },
				{ pos: [1, 3.2, mz + 31], look: [0, 1.9, mz + 17], fov: 45, hide: ["stars"] },
				{ pos: [sx + 40, 6, -64], look: [sx, 4, -38], fov: 50, fog: [0x101a24, 10, 200], exposure: 1.4, hide: ["sky", "stars"] },
				{ pos: [nx + 6, 5, 9], look: [nx + 1, 0, 1], fov: 50, fog: [0x04101c, 10, 120], exposure: 1.3 },
				{ pos: [nx + 12, 2, 14], look: [nx - 2, 7, -6], fov: 55, fog: [0x04101c, 10, 140], exposure: 1.3 },
				{ pos: [6.5, 2.4, -1.5], look: [-0.8, 1.0, -2.8], fov: 45, hide: ["stars"] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the twilight dance (La La Land)
	r94: (k) => {
		k.fog(0x7a5a8e, 60, 700);
		k.sky(0x232a6a, 0xf4a0a0, { offset: -0.08 });
		k.stars(600, { size: 1.2 });
		k.light({ sky: 0xc8a8e8, ground: 0x3a2a48, hemi: 1.5, sunColor: 0xffb0a0, sunIntensity: 1.4, sunPos: [-20, 12, -60], shadowSize: 14 });
		const T = k.THREE;
		const r = rng(94);
		// The hillside road above the city lights.
		k.ground(900, 0x3a4a3a, { bump: 0.5, seg: 60, height: (x, z) => (z > 4 ? (z - 4) * 0.25 : z < -3 ? Math.max(-55, (z + 3) * 0.9) : 0) + (Math.abs(x) > 30 && z < -3 ? Math.min(30, (Math.abs(x) - 30) * 0.5) : 0) });
		k.box(60, 0.08, 4.4, 0x4a4650, { y: 0.06, z: -0.6 });
		k.box(60, 0.3, 0.25, 0x8a8890, { y: 0.15, z: -2.9 });
		for (let i = 0; i < 12; i++) k.sphere(0.8 + r(), 0x2a3a28, { x: -28 + i * 5 + r() * 2, y: 0.2, z: 3.2 + r() * 2, s: [1.4, 0.5, 1], seg: 7, rings: 5 });
		const lights = [];
		for (let i = 0; i < 6000; i++) {
			const x = (r() - 0.5) * 900, z = -70 - Math.pow(r(), 0.7) * 600;
			lights.push([x, -52, z]);
		}
		dots(k, lights, 0xffc070, { size: 0.9, add: true, opacity: 0.9 });
		const blue = [];
		for (let i = 0; i < 1200; i++) blue.push([(r() - 0.5) * 900, -52, -70 - r() * 600]);
		dots(k, blue, 0xd8e8ff, { size: 0.7, add: true });
		for (let i = 0; i < 9; i++) k.cone(60 + r() * 40, 40 + r() * 40, 0x3a3060, { x: -400 + i * 100, y: -40, z: -620, seg: 6, shadow: false });
		// Lamppost and bench.
		const lamp = k.group({ x: -3.2, z: -2.5 });
		k.cyl(0.08, 0.12, 4, 0x1a2a20, { y: 2, parent: lamp });
		k.box(0.4, 0.5, 0.4, 0x1a2a20, { y: 4.2, parent: lamp });
		k.box(0.3, 0.38, 0.3, 0xffe8b0, { y: 4.2, parent: lamp, emissive: 0xffd080, glow: 1.2 });
		k.glow(0xffd890, 2.4, { y: 4.2, parent: lamp });
		k.point(0xffd890, 8, 12, { x: -3.2, y: 4, z: -2 });
		const bench = k.group({ x: 3.2, z: -2.3 });
		k.box(2, 0.08, 0.5, 0x5a3a2a, { y: 0.5, parent: bench });
		k.box(2, 0.4, 0.06, 0x5a3a2a, { y: 0.8, z: -0.25, parent: bench });
		[-0.9, 0.9].forEach((x) => k.box(0.06, 0.5, 0.5, 0x1a1a1a, { x, y: 0.25, parent: bench }));
		// The two dancers.
		const seb = k.person({ x: -0.5, y: 0.1, z: -0.6, ry: 0.5, colors: { shirt: 0xf4f4f0, legs: 0x4a4a58, skin: 0xe8c0a0, hair: 0x5a4028, shoes: 0xf0f0f0 }, from: 4 });
		k.box(0.06, 0.4, 0.02, 0x1a1a2a, { y: 1.3, z: 0.15, parent: seb });
		const mia = k.person({ x: 0.55, y: 0.1, z: -0.6, ry: -0.5, dress: 0xf4d020, colors: { shirt: 0xf4d020, legs: 0xe8c0a0, skin: 0xf0c8a8, hair: 0x5a2a18, shoes: 0xe8c0a0 }, from: 4 });
		[seb, mia].forEach((p, i) => {
			const l = p.userData.limbs;
			l.armL.rotation.z = -0.6 - i * 0.6;
			l.armR.rotation.z = 0.4;
			l.legR.rotation.x = -0.4;
		});
		k.tick((t) => {
			[seb, mia].forEach((p, i) => {
				const l = p.userData.limbs;
				l.legR.rotation.x = -0.4 * Math.abs(Math.sin(t * 3 + i));
				l.legL.rotation.x = 0.2 * Math.abs(Math.sin(t * 3 + i + 1.5));
			});
		});
		k.point(0xffe0d0, 6, 12, { x: 0, y: 3, z: 5 });

		// Close-up: the keys of a grand piano.
		const px = 700;
		k.box(30, 0.2, 30, 0x1a1418, { x: px, y: -0.1 });
		const piano = k.group({ x: px, y: 0 });
		k.box(3.2, 0.5, 2.8, 0x0a0a0c, { y: 1.05, z: -1.6, parent: piano, rough: 0.15, metal: 0.3 });
		k.box(3.2, 0.12, 0.5, 0x0a0a0c, { y: 0.84, z: 0.05, parent: piano, rough: 0.15, metal: 0.3 });
		const whites = [], blacks = [];
		for (let i = 0; i < 52; i++) {
			const x = -1.5 + i * 0.058;
			whites.push([x, 0.92, 0.12, 0]);
			const n = i % 7;
			if (n !== 2 && n !== 6) blacks.push([x + 0.029, 0.96, 0.03, 0]);
		}
		instances(k, new T.BoxGeometry(0.054, 0.04, 0.32), k.mat(0xf8f4ec, { rough: 0.3 }), whites, { parent: piano });
		instances(k, new T.BoxGeometry(0.03, 0.05, 0.19), k.mat(0x0a0a0a, { rough: 0.2 }), blacks, { parent: piano });
		k.box(3.2, 0.3, 0.08, 0x0a0a0c, { y: 1.12, z: -0.1, parent: piano, rough: 0.15 });
		k.spot(0xfff0d8, 50, { x: px + 0.5, y: 5, z: 1.5, target: [px, 0.9, 0], angle: 0.3, distance: 20 });
		k.point(0x6a4aa0, 4, 15, { x: px - 3, y: 3, z: 2 });

		// Morning traffic on a freeway ramp, everyone dancing on their cars.
		const fx = -700;
		k.ground(400, 0xc8b088, { x: fx, bump: 0.5, seg: 20 });
		const ramp = k.group({ x: fx, y: 0 });
		const cars = [0xf0c020, 0xd83030, 0x2a7ad8, 0xffffff, 0x30b080, 0xe86aa0, 0x8a8a8a, 0xf08a20];
		for (let i = 0; i < 16; i++) {
			const a = -0.6 + i * 0.075, rr = 70;
			const x = Math.sin(a) * rr, z = 70 - Math.cos(a) * rr;
			k.box(14, 0.6, 5.6, 0xd8d0c0, { x, y: 7, z, ry: -a + PI / 2, parent: ramp });
			k.box(14, 0.6, 0.3, 0xe8e0d0, { x: x + Math.cos(a) * 3, y: 7.6, z: z + Math.sin(a) * 3, ry: -a + PI / 2, parent: ramp });
			k.box(14, 0.6, 0.3, 0xe8e0d0, { x: x - Math.cos(a) * 3, y: 7.6, z: z - Math.sin(a) * 3, ry: -a + PI / 2, parent: ramp });
			if (i % 3 === 0) k.box(1.5, 7, 1.5, 0xc8c0b0, { x, y: 3.5, z, parent: ramp });
			[-1.3, 1.3].forEach((off, j) => {
				const c = car(k, cars[(i * 2 + j) % cars.length], { x: x + Math.cos(a) * off, y: 7.3, z: z + Math.sin(a) * off, ry: -a, parent: ramp });
				if ((i + j) % 3 === 0 && i > 2 && i < 13) {
					const d = k.person({ y: 1.5, z: -0.3, ry: (i + j) * 1.3, pose: (i + j) % 2 ? "raise" : "arms-out", dress: (i + j) % 2 ? cars[(i + j + 3) % 8] : undefined, colors: { shirt: cars[(i + j + 3) % 8], legs: 0x2a2a3a }, parent: c });
					void d;
				}
			});
		}
		for (let i = 0; i < 10; i++) palm(k, fx - 50 + i * 11, 0, 30 + (i % 2) * 10, 12 + (i % 3) * 3, 1, {});
		city(k, 20, [fx - 80, fx + 80, -160, -110], { h: 60, w: 12, colors: [0xd8c8b8, 0xc8d0d8, 0xb8a898], seed: 7 });

		// The pier at blue hour.
		const pz = 700;
		k.water(300, 0x2a3a6a, { z: pz, seg: 30, amp: 0.2, y: -3 });
		k.box(5, 0.3, 80, 0x6a5a4a, { y: 0, z: pz - 20 });
		for (let z = pz + 18; z > pz - 60; z -= 6) [-2.3, 2.3].forEach((x) => {
			k.cyl(0.25, 0.25, 6, 0x3a3028, { x, y: -3, z });
			k.box(0.1, 1, 0.1, 0x3a3028, { x, y: 0.6, z });
		});
		[-2.3, 2.3].forEach((x) => k.box(0.08, 0.08, 80, 0x3a3028, { x, y: 1.1, z: pz - 20 }));
		for (let i = 0; i < 6; i++) {
			const z = pz + 10 - i * 12;
			k.cyl(0.05, 0.07, 3.4, 0x1a1a24, { x: 2.2, y: 1.7, z });
			k.glow(0xffd890, 1.6, { x: 2.2, y: 3.5, z });
			k.sphere(0.15, 0xfff0c8, { x: 2.2, y: 3.5, z, emissive: 0xffd080 });
			k.point(0xffd890, 4, 10, { x: 2.2, y: 3.2, z });
		}
		const walker = k.person({ x: 1.6, y: 0.15, z: pz + 4, ry: -PI / 2 - 0.2, colors: { shirt: 0xe8e8f0, legs: 0x3a3a4a, skin: 0xe8c0a0, hair: 0x5a4028 }, coat: 0x4a4a5a });
		void walker;
		k.disc(0xfff0e0, 4, { x: -30, y: 12, z: pz - 120 });

		// The observatory on its hill.
		const ox = 1400;
		k.ground(400, 0x2a3828, { x: ox, bump: 1.4, seg: 30, height: (x, z) => Math.max(0, 20 - Math.hypot(x, z + 10) * 0.25) });
		const obs = k.group({ x: ox, y: 20, z: -10 });
		const white = 0xf0ece4;
		k.box(10, 5, 9, white, { y: 2.5, parent: obs });
		k.cyl(4.2, 4.2, 2.2, white, { y: 6.1, parent: obs, seg: 24 });
		k.sphere(4.2, 0x6a8a80, { y: 7.2, parent: obs, seg: 24, rings: 12, s: [1, 0.9, 1], metal: 0.4, rough: 0.4 });
		[-1, 1].forEach((s) => {
			k.box(10, 3.5, 4, white, { x: s * 9, y: 1.75, z: 1, parent: obs });
			k.cyl(2.2, 2.2, 2, white, { x: s * 15, y: 2, z: 1, parent: obs, seg: 20 });
			k.sphere(2.2, 0x6a8a80, { x: s * 15, y: 3, z: 1, parent: obs, seg: 20, rings: 10, metal: 0.4, rough: 0.4 });
		});
		k.box(3, 3.2, 0.1, 0xffd890, { y: 1.6, z: 4.52, parent: obs, emissive: 0xffc070, glow: 0.8 });
		for (let i = -3; i <= 3; i++) if (i) k.box(0.8, 1.4, 0.1, 0xffd890, { x: i * 2.7, y: 2, z: 3.02 + (Math.abs(i) > 1 ? 0 : 1.5), parent: obs, emissive: 0xffc070, glow: 0.6 });
		k.spot(0xfff0d8, 80, { x: ox, y: 6, z: 30, target: [ox, 24, -10], angle: 0.5, distance: 80 });
		k.spot(0xc8d0ff, 40, { x: ox + 20, y: 10, z: 20, target: [ox, 24, -10], angle: 0.5, distance: 80 });
		k.disc(0xf8f4e0, 6, { x: ox - 30, y: 60, z: -150 });

		// Floating among the stars in the planetarium.
		const py = -600;
		const sky = [];
		for (let i = 0; i < 2500; i++) {
			const v = new T.Vector3().randomDirection().multiplyScalar(60 + r() * 30);
			sky.push([v.x, py + v.y, v.z]);
		}
		dots(k, sky, 0xffffff, { size: 2, atten: false, fog: false });
		[[-20, 10, -50, 0x8a4ad8, 50], [30, -8, -60, 0x2a8ad8, 60], [0, 20, -70, 0xd84a9a, 40]].forEach(([x, y, z, c, s]) => k.glow(c, s * 0.5, { x, y: py + y, z, opacity: 0.25 }));
		const planet = k.group({ x: 9, y: py + 6, z: -22 });
		k.sphere(3, 0xe8c890, { parent: planet, seg: 20 });
		k.torus(5, 0.5, 0xd8b880, { rx: 1.3, parent: planet, s: [1, 1, 0.1], seg: 40 });
		const pair = k.group({ y: py, z: 0 });
		const sebF = k.person({ x: -0.35, y: -1, ry: 0.4, rz: -0.2, colors: { shirt: 0x2a2a34, legs: 0x2a2a34, skin: 0xe8c0a0, hair: 0x5a4028 }, parent: pair });
		const miaF = k.person({ x: 0.35, y: -0.9, ry: -0.4, rz: 0.3, dress: 0x2a8a7a, colors: { shirt: 0x2a8a7a, legs: 0xf0c8a8, skin: 0xf0c8a8, hair: 0x5a2a18 }, parent: pair });
		sebF.userData.limbs.armL.rotation.z = -1.2;
		miaF.userData.limbs.armR.rotation.z = 1.2;
		miaF.userData.limbs.armL.rotation.z = -2.4;
		miaF.userData.limbs.legL.rotation.x = 0.7;
		k.point(0xc8d0ff, 10, 20, { x: 3, y: py + 3, z: 6 });
		k.point(0xd080ff, 6, 20, { x: -4, y: py - 2, z: 4 });
		k.tick((t) => {
			pair.rotation.y = Math.sin(t * 0.3) * 0.4;
			pair.position.y = py + Math.sin(t * 0.6) * 0.2;
		});
		return {
			shots: [
				{ pos: [px + 0.9, 1.25, 0.65], look: [px + 0.1, 0.92, 0.05], fov: 32, fog: [0x0c0a10, 2, 20], hide: ["sky", "stars"] },
				{ pos: [-1.5, 1.6, pz + 12], look: [1.8, 1.4, pz + 2], fov: 45, fog: [0x3a3a78, 10, 160], exposure: 1.3, hide: ["sky", "stars"] },
				{ pos: [ox + 14, 23, 34], look: [ox, 26, -8], fov: 45, fog: [0x14183a, 40, 400], exposure: 1.3 },
				{ pos: [fx - 40, 10.2, 13.5], look: [fx - 4, 7.6, 0], fov: 50, fog: [0xb8d8f0, 60, 420], exposure: 1.1, hide: ["sky", "stars"] },
				{ pos: [2.8, py + 0.6, 5.2], look: [0.5, py + 0.4, 0], fov: 50, fog: [0x06061a, 50, 200], hide: ["sky", "stars"] },
				{ pos: [0.4, 4.2, 9], look: [0, 0.6, -6], fov: 42 },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the pink hotel (The Grand Budapest Hotel)
	r95: (k) => {
		k.fog(0xf0dce0, 120, 700);
		k.sky(0x8ab8e0, 0xf8e0e4, { offset: -0.05 });
		k.light({ sky: 0xfff4f4, ground: 0x8a7a8a, hemi: 1.5, sunColor: 0xfff0e0, sunIntensity: 2.2, sunPos: [40, 80, 70], shadowSize: 60, sunTarget: [0, 40, 0] });
		const r = rng(95);
		const pink = 0xf2a8bc;
		// The mountain: a snowy shelf for the hotel, peaks behind.
		k.ground(900, 0xd4dce8, { bump: 1.5, seg: 60, height: (x, z) => (z < 14 ? 40 + Math.max(0, -z - 40) * 0.6 : Math.max(0, 40 - (z - 14) * 0.9)) });
		for (let i = 0; i < 9; i++) {
			const x = -360 + i * 90, h = 160 + (i % 3) * 60;
			k.cone(90, h, 0xb8c4d8, { x, y: 40 + h / 2 - 10, z: -260 - (i % 2) * 60, seg: 6 });
			k.cone(40, h * 0.45, 0xffffff, { x, y: 40 + h - h * 0.225 - 10 + 0.5, z: -260 - (i % 2) * 60, seg: 6 });
		}
		const pine = (x, y, z, h) => {
			k.cyl(0.3, 0.4, h * 0.3, 0x4a3020, { x, y: y + h * 0.15, z });
			k.cone(h * 0.25, h * 0.8, 0x2a4a3a, { x, y: y + h * 0.6, z, seg: 6 });
			k.cone(h * 0.16, h * 0.3, 0xffffff, { x, y: y + h * 0.88, z, seg: 6 });
		};
		for (let i = 0; i < 60; i++) {
			const x = (r() - 0.5) * 240, z = -10 - r() * 100;
			if (Math.abs(x) < 34 && z > -30) continue;
			pine(x, 40 + Math.max(0, -z - 40) * 0.6, z, 8 + r() * 6);
		}
		for (let i = 0; i < 50; i++) {
			const x = (r() - 0.5) * 240, z = 20 + r() * 40;
			if (Math.abs(x) < 8) continue;
			pine(x, Math.max(0, 40 - (z - 14) * 0.9) - 0.5, z, 7 + r() * 5);
		}
		// The hotel: a pink wedding cake with a lilac roof, a central tower and two domed wings.
		const winTex = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#f2a8bc";
			g.fillRect(0, 0, w, h);
			for (let y = 0; y < 4; y++) {
				g.fillStyle = "#e690a8";
				g.fillRect(0, y * 64 + 56, w, 8);
				for (let x = 0; x < 4; x++) {
					g.fillStyle = "#fff4f0";
					g.fillRect(x * 64 + 18, y * 64 + 12, 28, 40);
					g.fillStyle = "#7a8ab0";
					g.fillRect(x * 64 + 22, y * 64 + 16, 20, 32);
				}
			}
		});
		winTex.wrapS = winTex.wrapT = k.THREE.RepeatWrapping;
		const facade = (w, h) => {
			const t = winTex.clone();
			t.needsUpdate = true;
			t.repeat.set(w / 5, h / 5);
			return k.mat(0xffffff, { map: t });
		};
		const hotel = k.group({ y: 40, z: 0 });
		k.box(40, 1.5, 16, 0xe8d8d0, { y: 0.75, parent: hotel });
		k.box(30, 15, 10, facade(30, 15), { y: 9, parent: hotel });
		k.box(30.6, 0.6, 10.6, 0xfff0f0, { y: 16.8, parent: hotel });
		k.box(28, 4, 8.5, 0xb88ab8, { y: 19, parent: hotel });
		for (let i = 0; i < 8; i++) k.box(1.4, 1.6, 1, 0xfff0f0, { x: -12 + i * 3.4, y: 19.5, z: 4.4, parent: hotel });
		k.box(10, 24, 10.6, facade(10, 24), { y: 13.5, z: 0.4, parent: hotel });
		k.box(10.6, 0.6, 11.2, 0xfff0f0, { y: 25.8, z: 0.4, parent: hotel });
		k.cyl(3.6, 4.2, 4, 0xf8c8d4, { y: 28, z: 0.4, parent: hotel, seg: 16 });
		k.sphere(3.8, 0xb88ab8, { y: 30, z: 0.4, parent: hotel, seg: 16, rings: 10, s: [1, 1.2, 1] });
		k.cyl(0.1, 0.1, 5, 0xfff0f0, { y: 36, z: 0.4, parent: hotel });
		k.box(1.8, 1, 0.05, 0xc02840, { x: 0.9, y: 37.8, z: 0.4, parent: hotel });
		[-1, 1].forEach((s) => {
			k.box(9, 18, 12, facade(9, 18), { x: s * 19, y: 10.5, z: 1, parent: hotel });
			k.box(9.6, 0.6, 12.6, 0xfff0f0, { x: s * 19, y: 19.8, z: 1, parent: hotel });
			k.cyl(3.2, 3.6, 2.4, 0xf8c8d4, { x: s * 19, y: 21.2, z: 1, parent: hotel, seg: 16 });
			k.sphere(3.3, 0xb88ab8, { x: s * 19, y: 22.6, z: 1, parent: hotel, seg: 16, rings: 10, s: [1, 1.1, 1] });
			k.cone(0.4, 2.5, 0xfff0f0, { x: s * 19, y: 27, z: 1, parent: hotel });
		});
		k.box(6, 4, 2, 0xc02840, { y: 3.5, z: 6.2, parent: hotel });
		k.box(3, 3, 0.2, 0x5a2a30, { y: 3, z: 7.1, parent: hotel });
		k.box(8, 0.4, 4, 0xfff0f0, { y: 1.6, z: 8, parent: hotel });
		// The funicular, climbing from the valley.
		const slope = Math.atan2(40 - 3, 44);
		k.box(3.2, 0.5, Math.hypot(40, 44) + 4, 0x7a6a6a, { x: 0, y: 21, z: 36, rx: slope });
		[-0.7, 0.7].forEach((x) => k.box(0.12, 0.12, Math.hypot(40, 44) + 4, 0x3a3a3a, { x, y: 21.35, z: 36, rx: slope }));
		k.box(3, 4, 4, 0xe8d0c8, { y: 2, z: 60 });
		const cab = k.group({ x: 0, y: 26, z: 30, rx: slope });
		k.box(2.4, 2.4, 3.6, 0xc8303a, { y: 1.9, parent: cab });
		k.box(2.45, 0.8, 3.0, 0xfff0e0, { y: 2.3, parent: cab, emissive: 0x806050, glow: 0.3 });
		k.box(2.6, 0.2, 3.8, 0x8a2028, { y: 3.2, parent: cab });
		k.box(2.0, 0.6, 3.2, 0x3a3a3a, { y: 0.5, parent: cab });

		// Close-up: a tiered pastry, then a stack of pink boxes tied with blue ribbon.
		const px = 700;
		k.box(30, 0.2, 30, 0xf0d0d8, { x: px, y: -0.1 });
		k.box(30, 12, 0.2, 0xf4b8c8, { x: px, y: 6, z: -3 });
		k.box(4, 0.9, 2.4, 0xfff8f4, { x: px, y: 0.45, z: -0.3 });
		const courtesan = (x, z, s = 1) => {
			const g = k.group({ x, y: 0.9, z, s });
			k.cyl(0.42, 0.42, 0.03, 0xffffff, { y: 0.015, parent: g, seg: 20 });
			k.sphere(0.24, 0xb8a0d8, { y: 0.18, s: [1, 0.75, 1], parent: g, seg: 14, rings: 8 });
			k.torus(0.12, 0.03, 0xfff4f0, { y: 0.31, rx: PI / 2, parent: g, seg: 14 });
			k.sphere(0.17, 0xa8d8b8, { y: 0.4, s: [1, 0.8, 1], parent: g, seg: 14, rings: 8 });
			k.torus(0.08, 0.025, 0xfff4f0, { y: 0.51, rx: PI / 2, parent: g, seg: 12 });
			k.sphere(0.11, 0xf4b0c4, { y: 0.58, s: [1, 0.85, 1], parent: g, seg: 12, rings: 8 });
			k.sphere(0.035, 0x4a2a18, { y: 0.68, s: [1, 0.7, 1.4], parent: g });
		};
		courtesan(px, 0);
		courtesan(px - 0.95, -0.4, 0.9);
		courtesan(px + 1.0, -0.6, 0.9);
		const ribbon = 0x3a78c8;
		const boxStack = [[0, 0, 1.6, 0.6, 1.1], [0.1, 0.6, 1.4, 0.5, 1.0], [-0.05, 1.1, 1.2, 0.45, 0.9]];
		boxStack.forEach(([dx, y, w, h, d], i) => {
			const g = k.group({ x: px + 1.5 + dx, y: 0.9 + y, z: -1.6, ry: (i - 1) * 0.12, from: 3 });
			k.box(w, h, d, 0xd87898, { y: h / 2, parent: g });
			k.box(w * 1.01, h * 1.01, 0.08, ribbon, { y: h / 2, parent: g });
			k.box(0.08, h * 1.01, d * 1.01, ribbon, { y: h / 2, parent: g });
			if (i === 2) [-1, 1].forEach((s) => k.sphere(0.12, ribbon, { x: s * 0.1, y: h + 0.05, s: [1.4, 0.6, 0.8], ry: s * 0.4, parent: g }));
		});
		k.spot(0xfff4f0, 18, { x: px + 1, y: 6, z: 4, target: [px, 1, -0.5], angle: 0.5, distance: 20 });

		// A painting of a boy with an apple, on a panelled wall.
		const ax = -700;
		k.box(30, 0.2, 30, 0x5a3a2a, { x: ax, y: -0.1 });
		const panel = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#6a4a30";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#4a3020";
			g.lineWidth = 8;
			for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.strokeRect(i * 128 + 14, j * 128 + 14, 100, 100);
		});
		panel.wrapS = panel.wrapT = k.THREE.RepeatWrapping;
		panel.repeat.set(6, 3);
		k.box(24, 10, 0.2, k.mat(0xffffff, { map: panel }), { x: ax, y: 5, z: -2 });
		const art = k.canvas(256, 320, (g, w, h) => {
			const bg = g.createRadialGradient(128, 150, 20, 128, 160, 200);
			bg.addColorStop(0, "#5a6a4a");
			bg.addColorStop(1, "#1a2018");
			g.fillStyle = bg;
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#3a2a5a";
			g.beginPath();
			g.moveTo(40, h);
			g.quadraticCurveTo(60, 170, 128, 160);
			g.quadraticCurveTo(196, 170, 216, h);
			g.fill();
			g.fillStyle = "#f0f0e8";
			g.fillRect(100, 150, 56, 14);
			g.fillStyle = "#e8c8a8";
			g.beginPath();
			g.ellipse(128, 105, 34, 44, 0, 0, PI * 2);
			g.fill();
			g.fillStyle = "#8a5a2a";
			g.beginPath();
			g.ellipse(128, 76, 38, 24, 0, PI, PI * 2);
			g.fill();
			g.fillStyle = "#2a1a10";
			g.fillRect(112, 100, 8, 4);
			g.fillRect(136, 100, 8, 4);
			g.fillStyle = "#e8c8a8";
			g.beginPath();
			g.ellipse(150, 252, 22, 14, 0, 0, PI * 2);
			g.fill();
			g.fillStyle = "#d8b030";
			g.beginPath();
			g.arc(156, 236, 20, 0, PI * 2);
			g.fill();
			g.fillStyle = "#6a8a2a";
			g.fillRect(156, 210, 4, 10);
		});
		k.box(2.9, 3.6, 0.15, 0xc89a40, { x: ax, y: 4.2, z: -1.82, metal: 0.7, rough: 0.35 });
		k.plane(2.4, 3.0, k.mat(0xffffff, { map: art }), { x: ax, y: 4.2, z: -1.73 });
		k.spot(0xfff0d8, 60, { x: ax, y: 9, z: 3, target: [ax, 4.2, -1.8], angle: 0.32, distance: 20 });
		k.point(0xffc8a0, 4, 20, { x: ax + 4, y: 3, z: 3 });

		// A prison cell: stone walls, an iron cot, a barred window.
		const cx = 1400;
		const brick = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#8a8478";
			g.fillRect(0, 0, w, h);
			for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) {
				g.fillStyle = ["#9a9488", "#7e786c", "#928c80"][(x * 3 + y) % 3];
				g.fillRect(x * 56 + (y % 2) * 28 - 26, y * 32 + 2, 52, 28);
			}
		});
		brick.wrapS = brick.wrapT = k.THREE.RepeatWrapping;
		brick.repeat.set(3, 2);
		const bm = k.mat(0xffffff, { map: brick, rough: 1 });
		k.box(12, 0.2, 12, 0x6a665e, { x: cx, y: -0.1 });
		k.box(8, 6, 0.3, bm, { x: cx, y: 3, z: -3 });
		k.box(0.3, 6, 8, bm, { x: cx - 3, y: 3, z: 0 });
		// The window high up, with bars and a shaft of daylight.
		k.box(1.2, 0.9, 0.32, 0xd8e8f4, { x: cx + 0.8, y: 4.6, z: -2.98, emissive: 0xc8dcf0, glow: 1 });
		for (let b = 0; b < 4; b++) k.box(0.05, 0.9, 0.05, 0x2a2a2a, { x: cx + 0.45 + b * 0.24, y: 4.6, z: -2.8, metal: 0.6 });
		k.spot(0xf0f4ff, 50, { x: cx + 0.8, y: 4.6, z: -2.6, target: [cx + 0.2, 0, 0.6], angle: 0.35, distance: 14 });
		// The iron cot with a grey blanket.
		k.box(0.9, 0.12, 2.2, 0x3a3a3a, { x: cx - 2.4, y: 0.6, z: -1.6, metal: 0.6 });
		[-0.4, 0.4].forEach((x) => [-1.0, 1.0].forEach((z) => k.box(0.05, 0.6, 0.05, 0x2a2a2a, { x: cx - 2.4 + x, y: 0.3, z: -1.6 + z, metal: 0.6 })));
		k.box(0.85, 0.1, 1.9, 0x6a6e70, { x: cx - 2.4, y: 0.71, z: -1.5, rough: 1 });
		k.box(0.6, 0.12, 0.35, 0xe8e4d8, { x: cx - 2.4, y: 0.75, z: -2.5 });
		// A tin cup, a bucket and a little rock hammer on the floor.
		k.cyl(0.06, 0.05, 0.12, 0xa8acb0, { x: cx - 1.6, y: 0.06, z: -2.3, metal: 0.7, rough: 0.4 });
		k.cyl(0.22, 0.18, 0.4, 0x6a6e70, { x: cx + 2.2, y: 0.2, z: -2.4, metal: 0.5, open: true, side: k.THREE.DoubleSide });
		k.box(0.03, 0.03, 0.3, 0x6a4a2a, { x: cx - 1.3, y: 0.02, z: -1.2, ry: 0.6 });
		k.box(0.12, 0.05, 0.04, 0x4a4a50, { x: cx - 1.38, y: 0.03, z: -1.33, ry: 0.6, metal: 0.8 });
		// The barred door, front-right.
		for (let b = 0; b < 8; b++) k.box(0.05, 5, 0.05, 0x1a1a1a, { x: cx + 3, y: 2.5, z: -2.6 + b * 0.32, metal: 0.6 });
		k.box(0.08, 0.08, 2.6, 0x1a1a1a, { x: cx + 3, y: 2.2, z: -1.4, metal: 0.6 });
		k.point(0xd8d0c0, 4, 12, { x: cx + 1, y: 3, z: 3 });

		// The lobby: red lift, pink walls, two men in purple.
		const lz = 700;
		k.box(30, 0.2, 30, 0xc02838, { y: -0.1, z: lz });
		k.box(30, 12, 0.2, 0xf4b0c0, { y: 6, z: lz - 5 });
		k.box(30, 0.2, 30, 0xf8e0e4, { y: 9, z: lz });
		[-1, 1].forEach((s) => {
			k.box(0.2, 12, 30, 0xf4b0c0, { x: s * 8, y: 6, z: lz });
			k.cyl(0.4, 0.45, 9, 0xfff0f0, { x: s * 5, y: 4.5, z: lz - 4 });
		});
		k.box(3.6, 5.2, 0.4, 0xd02838, { y: 2.6, z: lz - 4.7 });
		k.box(2.4, 4.0, 0.1, 0xd8a840, { y: 2.0, z: lz - 4.45, metal: 0.8, rough: 0.3 });
		for (let i = 0; i < 9; i++) k.box(0.05, 3.8, 0.05, 0x8a6020, { x: -1.0 + i * 0.25, y: 2.0, z: lz - 4.35, metal: 0.8 });
		k.box(1.4, 0.4, 0.1, 0xfff0d8, { y: 4.8, z: lz - 4.45, emissive: 0xffd080, glow: 0.8 });
		const uniform = { shirt: 0x6a3a8a, legs: 0x6a3a8a, shoes: 0x1a1a1a };
		const boy = k.person({ x: -1.4, y: 0, z: lz - 2.6, colors: { ...uniform, skin: 0xd8a888, hair: 0x1a1008 } });
		k.cyl(0.14, 0.14, 0.18, 0x6a3a8a, { y: 0.2, parent: boy.userData.limbs.head });
		const conc = k.person({ x: 1.4, y: 0, z: lz - 2.6, coat: 0x5a2a7a, colors: { ...uniform, skin: 0xf0c8a8, hair: 0x6a4a30 } });
		k.box(0.18, 0.04, 0.05, 0x3a2418, { y: -0.08, z: 0.2, parent: conc.userData.limbs.head });
		k.box(5, 0.05, 6, 0x8a1828, { y: 0.01, z: lz - 1 });
		k.point(0xffe0d0, 12, 20, { y: 7, z: lz + 2 });
		[-1, 1].forEach((s) => k.glow(0xffe8c0, 1.2, { x: s * 4, y: 6.5, z: lz - 4.8 }));

		// A reception desk: pigeonholes of room keys, a brass bell and a guest ledger.
		const kx = -1400;
		k.box(20, 0.2, 20, 0x4a3a2a, { x: kx, y: -0.1 });
		k.box(20, 8, 0.2, 0xd8cfb8, { x: kx, y: 4, z: -2.2 });
		k.box(4.4, 3.4, 0.4, 0x5a3a22, { x: kx, y: 2.9, z: -1.9 });
		for (let row = 0; row < 5; row++)
			for (let col = 0; col < 8; col++) {
				const x = kx - 1.9 + col * 0.54, y = 1.55 + row * 0.62;
				k.box(0.46, 0.52, 0.1, 0x2a1a10, { x, y, z: -1.68 });
				if ((row * 8 + col) % 5 === 3) k.box(0.3, 0.1, 0.08, 0xf0ead8, { x, y: y - 0.15, z: -1.62, rz: 0.1 });
				else if ((row * 3 + col) % 4) {
					k.box(0.04, 0.22, 0.03, 0xc8a040, { x, y: y - 0.05, z: -1.6, metal: 0.8, rough: 0.3 });
					k.box(0.1, 0.16, 0.03, 0x7a5030, { x, y: y - 0.22, z: -1.6 });
				}
			}
		k.box(5, 1.15, 0.9, 0x6a4428, { x: kx, y: 0.57, z: 0.2 });
		k.box(5.2, 0.08, 1.1, 0x3a2414, { x: kx, y: 1.18, z: 0.2 });
		const bell = k.group({ x: kx + 0.9, y: 1.22, z: 0.35 });
		k.cyl(0.13, 0.13, 0.03, 0x2a2a2a, { parent: bell, seg: 16 });
		k.sphere(0.11, 0xd8b048, { y: 0.03, s: [1, 0.8, 1], parent: bell, metal: 0.9, rough: 0.25, seg: 14, rings: 8 });
		k.cyl(0.015, 0.015, 0.06, 0xd8b048, { y: 0.13, parent: bell, metal: 0.9 });
		k.box(0.9, 0.04, 0.6, 0xf2ecdc, { x: kx - 0.6, y: 1.24, z: 0.35, ry: 0.15 });
		k.box(0.02, 0.05, 0.6, 0x6a5a40, { x: kx - 0.6, y: 1.25, z: 0.35, ry: 0.15 });
		k.cyl(0.012, 0.012, 0.35, 0x1a1a1a, { x: kx - 0.3, y: 1.26, z: 0.5, rz: PI / 2, ry: 0.6 });
		k.cyl(0.18, 0.24, 0.3, 0x2a4a2a, { x: kx + 1.9, y: 1.37, z: 0.2 });
		k.point(0xffe8c0, 14, 14, { x: kx + 1, y: 3.5, z: 3 });
		k.point(0xc8d0e0, 5, 12, { x: kx - 3, y: 4, z: 2 });
		return {
			shots: [
				{ pos: [cx + 1.8, 2.0, 3.4], look: [cx - 1.2, 1.2, -1.8], fov: 50, fog: [0x2a2824, 6, 30], exposure: 1.2 },
				{ pos: [kx + 1.6, 1.9, 3.4], look: [kx - 0.2, 1.9, -1.6], fov: 45, fog: [0x2a2018, 6, 30] },
				{ pos: [ax + 0.8, 4.0, 3.8], look: [ax, 4.2, -1.8], fov: 45, fog: [0x2a1a14, 5, 30] },
				{ pos: [px + 0.2, 1.9, 2.6], look: [px + 1.4, 1.5, -1.6], fov: 40, fog: [0xf4c0cc, 6, 30] },
				{ pos: [0, 2.0, lz + 8], look: [0, 2.3, lz - 4], fov: 50, fog: [0xf0c0c8, 10, 40] },
				{ pos: [0, 47, 62], look: [0, 57, 0], fov: 42 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- Montmartre (Amélie)
	r96: (k) => {
		k.fog(0xd8d0a0, 80, 500);
		k.sky(0x6a9a7a, 0xf0e0a8, { offset: -0.05 });
		k.light({ sky: 0xfff0c8, ground: 0x4a5a2a, hemi: 1.5, sunColor: 0xffe0a8, sunIntensity: 2.3, sunPos: [-30, 40, 50], shadowSize: 40, sunTarget: [0, 10, -20] });
		const r = rng(96);
		const filter = "saturate(1.3) contrast(1.05)";
		// The hill, the steps and the basilica on top.
		k.ground(600, 0x5a8a3a, { bump: 0.4, seg: 60, height: (x, z) => (z < -10 ? Math.min(28, (-10 - z) * 0.7) : 0) });
		k.box(10, 0.1, 60, 0xd8c8a8, { y: 0.05, z: 10 });
		for (let i = 0; i < 20; i++) k.box(8, 1.4, 1, 0xe0d4b8, { y: 0.7 + i * 1.4, z: -10.5 - i * 2 });
		[-1, 1].forEach((s) => k.box(0.3, 0.3, 40, 0x2a2a2a, { x: s * 4.3, y: 15, z: -30, rx: 0.61 }));
		trees(k, 40, [-80, 80, -50, -12], { color: 0x3a6a2a, h: 9, seed: 9, avoid: (x) => Math.abs(x) < 7 });
		const base = k.group({ y: 28, z: -62 });
		const stone = 0xf4f0e6;
		k.box(30, 12, 22, stone, { y: 6, parent: base });
		for (let i = -2; i <= 2; i++) k.box(3, 7, 0.3, 0xd8d0c0, { x: i * 5, y: 3.5, z: 11.1, parent: base });
		k.box(14, 6, 6, stone, { y: 3, z: 13, parent: base });
		[-1, 0, 1].forEach((i) => k.cyl(1.8, 1.8, 0.4, 0xd0c8b8, { x: i * 4.2, y: 4, z: 16.1, rx: PI / 2, parent: base, seg: 16, s: [1, 1, 1] }));
		k.cyl(6, 6.5, 8, stone, { y: 16, parent: base, seg: 16 });
		k.sphere(6.2, stone, { y: 20, parent: base, seg: 16, rings: 12, s: [1, 1.5, 1] });
		k.cyl(1.2, 1.4, 4, stone, { y: 30.5, parent: base, seg: 12 });
		k.cone(1.2, 2.5, stone, { y: 33.5, parent: base, seg: 12 });
		k.cyl(0.08, 0.08, 1.6, 0x8a8a7a, { y: 35.4, parent: base });
		[[-11, 6], [11, 6], [-8, -6], [8, -6]].forEach(([x, z]) => {
			k.cyl(2.6, 2.8, 4, stone, { x, y: 14, z, parent: base, seg: 12 });
			k.sphere(2.6, stone, { x, y: 16, z, parent: base, seg: 12, rings: 8, s: [1, 1.5, 1] });
			k.cone(0.5, 1.5, stone, { x, y: 20.5, z, parent: base });
		});
		k.box(5, 26, 5, stone, { y: 13, z: -14, parent: base });
		k.sphere(3, stone, { y: 27.5, z: -14, parent: base, seg: 12, rings: 8, s: [1, 1.3, 1] });
		// The carousel at the foot of the hill.
		const car0 = k.group({ x: -14, z: 4, from: 3 });
		k.cyl(5, 5, 0.5, 0xc8a050, { y: 0.4, parent: car0, seg: 24 });
		k.cyl(0.4, 0.4, 5, 0xd8b060, { y: 3, parent: car0, metal: 0.6 });
		const roof = k.canvas(256, 64, (g, w, h) => {
			for (let i = 0; i < 16; i++) {
				g.fillStyle = i % 2 ? "#c0282a" : "#f4ecd8";
				g.fillRect(i * 16, 0, 16, h);
			}
		});
		k.cone(5.8, 2.4, k.mat(0xffffff, { map: roof }), { y: 6.4, parent: car0, seg: 16 });
		k.cyl(5.8, 5.8, 0.8, 0xc0282a, { y: 4.8, parent: car0, seg: 16, emissive: 0x401010 });
		for (let i = 0; i < 16; i++) k.glow(0xffe8a0, 0.5, { x: Math.cos((i / 16) * PI * 2) * 5.9, y: 4.8, z: Math.sin((i / 16) * PI * 2) * 5.9, parent: car0 });
		const spin = k.group({ parent: car0 });
		for (let i = 0; i < 8; i++) {
			const a = (i / 8) * PI * 2;
			const x = Math.cos(a) * 3.8, z = Math.sin(a) * 3.8;
			k.cyl(0.05, 0.05, 4.2, 0xd8b060, { x, y: 2.8, z, parent: spin, metal: 0.8 });
			const horse = k.group({ x, y: 1.9 + (i % 2) * 0.4, z, ry: -a, parent: spin });
			k.box(0.4, 0.5, 1.2, i % 2 ? 0xf4ecd8 : 0x8a5a3a, { parent: horse });
			k.box(0.3, 0.6, 0.3, i % 2 ? 0xf4ecd8 : 0x8a5a3a, { y: 0.45, z: 0.6, rx: -0.4, parent: horse });
			k.box(0.3, 0.1, 0.3, 0xc0282a, { y: 0.3, parent: horse });
		}
		k.tick((t) => (spin.rotation.y = t * 0.4));
		k.point(0xffd890, 10, 16, { x: -14, y: 3, z: 8, from: 3 });
		// The girl: black bob, red dress, green cardigan.
		const ame = k.person({ x: 1.3, y: 0.1, z: 22, ry: 0.35, dress: 0xb81e22, sleeves: 0x2a6a3a, colors: { shirt: 0xb81e22, legs: 0xf0d0b8, skin: 0xf4d4bc, hair: 0x0e0a08, shoes: 0x1a1a1a }, from: 5 });
		const hd = ame.userData.limbs.head;
		k.box(0.46, 0.34, 0.26, 0x0e0a08, { y: 0.0, z: -0.08, parent: hd });
		[-1, 1].forEach((sd) => k.box(0.08, 0.3, 0.3, 0x0e0a08, { x: sd * 0.2, y: 0.0, z: 0.02, parent: hd }));
		k.box(0.38, 0.07, 0.07, 0x0e0a08, { y: 0.15, z: 0.17, parent: hd });
		ame.userData.limbs.armR.rotation.x = -0.5;

		// Close-up: a spoon about to crack the caramel of a crème brûlée.
		const bx = 700;
		const cloth = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#f4ecd8";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "rgba(190,40,40,0.75)";
			for (let i = 0; i < 8; i += 2) {
				g.fillRect(i * 16, 0, 16, h);
				g.fillRect(0, i * 16, w, 16);
			}
		});
		cloth.wrapS = cloth.wrapT = k.THREE.RepeatWrapping;
		cloth.repeat.set(4, 4);
		k.box(6, 0.2, 6, k.mat(0xffffff, { map: cloth }), { x: bx, y: -0.1 });
		k.cyl(0.5, 0.42, 0.32, 0xffffff, { x: bx, y: 0.16, seg: 24, rough: 0.3, open: true, side: k.THREE.DoubleSide });
		k.torus(0.5, 0.025, 0xffffff, { x: bx, y: 0.32, rx: PI / 2, seg: 24 });
		const crust = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#b8742a";
			g.fillRect(0, 0, w, h);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = `rgba(${150 + i},${90 + i},30,0.35)`;
				g.beginPath();
				g.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 14, 0, PI * 2);
				g.fill();
			}
			g.strokeStyle = "#f0d8a0";
			g.lineWidth = 2;
			g.beginPath();
			g.moveTo(70, 60);
			g.lineTo(84, 74);
			g.lineTo(80, 92);
			g.moveTo(84, 74);
			g.lineTo(100, 70);
			g.stroke();
		});
		k.cyl(0.48, 0.48, 0.02, k.mat(0xffffff, { map: crust, rough: 0.2, metal: 0.1 }), { x: bx, y: 0.28, seg: 24 });
		const spoon = k.group({ x: bx + 0.1, y: 0.33, z: 0.1, ry: 0.7, rx: -0.55 });
		k.sphere(0.1, 0xb8bcc4, { s: [1, 0.2, 1.4], parent: spoon, metal: 0.5, rough: 0.2 });
		k.box(0.05, 0.02, 0.9, 0xb8bcc4, { z: 0.55, y: 0.03, parent: spoon, metal: 0.5, rough: 0.2 });
		k.point(0xffd8a0, 6, 6, { x: bx + 1, y: 1.6, z: 1 });

		// Behind a loose bathroom tile: a dusty tin box of a boy's treasures.
		const cx = -700;
		const tileW = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#e8e4d4";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#b8b4a4";
			g.lineWidth = 3;
			for (let i = 0; i <= 4; i++) {
				g.beginPath();
				g.moveTo(i * 32, 0);
				g.lineTo(i * 32, h);
				g.moveTo(0, i * 32);
				g.lineTo(w, i * 32);
				g.stroke();
			}
		});
		tileW.wrapS = tileW.wrapT = k.THREE.RepeatWrapping;
		tileW.repeat.set(3, 2);
		const tw = k.mat(0xffffff, { map: tileW, rough: 0.4 });
		// Wall with a hole where one tile came away (built from four slabs around the gap).
		k.box(6, 1.6, 0.2, tw, { x: cx, y: 0.8, z: -1 });
		k.box(6, 1.4, 0.2, tw, { x: cx, y: 2.9, z: -1 });
		k.box(2.8, 0.6, 0.2, tw, { x: cx - 1.6, y: 1.9, z: -1 });
		k.box(2.6, 0.6, 0.2, tw, { x: cx + 1.7, y: 1.9, z: -1 });
		k.box(0.6, 0.6, 0.4, 0x2a2218, { x: cx + 0.1, y: 1.9, z: -1.2 });
		k.box(0.52, 0.3, 0.3, 0x8a6a3a, { x: cx + 0.1, y: 1.75, z: -1.0, metal: 0.6, rough: 0.5 });
		k.box(0.54, 0.04, 0.32, 0xa88040, { x: cx + 0.1, y: 1.91, z: -1.0, metal: 0.6, rough: 0.4 });
		// The loose tile, leaning below.
		k.box(0.58, 0.58, 0.04, tw, { x: cx - 0.5, y: 0.31, z: -0.7, rx: -0.2, ry: 0.2 });
		// A shelf with a toothbrush glass and a bar of soap.
		k.box(1.4, 0.06, 0.3, 0xf4f0e8, { x: cx + 1.4, y: 1.5, z: -0.8 });
		k.cyl(0.06, 0.05, 0.18, 0xc8e8e0, { x: cx + 1.1, y: 1.62, z: -0.8, opacity: 0.6, rough: 0.1 });
		k.box(0.03, 0.26, 0.03, 0x3a8a6a, { x: cx + 1.12, y: 1.75, z: -0.8, rz: 0.2 });
		k.box(0.18, 0.06, 0.1, 0xf0d0a8, { x: cx + 1.6, y: 1.56, z: -0.8 });
		k.box(6, 0.2, 4, 0x8a7a68, { x: cx, y: -0.1, z: 0.6 });
		k.point(0xffe8c0, 8, 10, { x: cx + 0.5, y: 2.6, z: 1.2 });

		// A garden gnome.
		const gz = 700;
		k.ground(80, 0x5a8a3a, { z: gz, bump: 0.2, seg: 20 });
		const gnome = k.group({ x: 0, y: 0, z: gz });
		k.cyl(0.32, 0.38, 0.6, 0x2a5aa8, { y: 0.3, parent: gnome });
		k.sphere(0.22, 0xf0c8a8, { y: 0.78, parent: gnome });
		k.cone(0.24, 0.6, 0xc81e22, { y: 1.15, parent: gnome, rx: -0.15 });
		k.cone(0.22, 0.45, 0xf8f8f0, { y: 0.5, z: 0.15, rx: PI + 0.25, parent: gnome, seg: 8 });
		k.sphere(0.05, 0xe8a088, { y: 0.78, z: 0.21, parent: gnome });
		k.box(0.5, 0.1, 0.4, 0x5a3a20, { y: 0.05, parent: gnome });
		k.box(0.45, 0.32, 0.15, 0x8a5a2a, { x: 0.45, y: 0.16, z: 0.1, parent: gnome });
		for (let i = 0; i < 30; i++) {
			const x = (r() - 0.5) * 8, z = gz - 1 - r() * 4;
			k.cyl(0.02, 0.02, 0.5, 0x3a6a2a, { x, y: 0.25, z });
			k.sphere(0.12, [0xc81e22, 0xf2c230, 0xe86aa0][i % 3], { x, y: 0.52, z });
		}
		k.box(12, 2.5, 0.4, 0xb8a888, { y: 1.25, z: gz - 6 });
		k.box(4, 3, 4, 0xe0d4c0, { x: -4, y: 1.5, z: gz - 9 });

		// A photo booth in a métro corridor, torn photos on the floor.
		const mz = -700;
		k.box(30, 0.2, 30, 0x8a8478, { y: -0.1, z: mz });
		const tile = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#e8e4d8";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#a8a498";
			g.lineWidth = 3;
			for (let i = 0; i <= 8; i++) {
				g.beginPath();
				g.moveTo(0, i * 16);
				g.lineTo(w, i * 16);
				g.stroke();
				g.beginPath();
				g.moveTo(i * 16 + ((i % 2) * 8), 0);
				g.lineTo(i * 16 + ((i % 2) * 8), h);
				g.stroke();
			}
		});
		tile.wrapS = tile.wrapT = k.THREE.RepeatWrapping;
		tile.repeat.set(8, 3);
		k.box(30, 6, 0.2, k.mat(0xffffff, { map: tile }), { y: 3, z: mz - 3 });
		const booth = k.group({ x: 0, z: mz - 1.8 });
		k.box(1.6, 2.4, 1.4, 0xd0d4d8, { y: 1.2, parent: booth, metal: 0.4 });
		k.box(1.2, 1.8, 0.05, 0xb81e22, { y: 1.2, z: 0.72, parent: booth });
		k.box(1.6, 0.4, 1.42, 0xfff4d8, { y: 2.3, parent: booth, emissive: 0xffd890, glow: 0.8 });
		k.box(0.12, 0.4, 0.05, 0x2a2a2a, { x: 0.65, y: 1.4, z: 0.72, parent: booth });
		const strip = k.canvas(64, 256, (g, w, h) => {
			g.fillStyle = "#f4f0e8";
			g.fillRect(0, 0, w, h);
			for (let i = 0; i < 4; i++) {
				g.fillStyle = "#6a6660";
				g.fillRect(6, 6 + i * 62, 52, 56);
				g.fillStyle = "#c8c4bc";
				g.beginPath();
				g.ellipse(32, 30 + i * 62, 14, 18, 0, 0, PI * 2);
				g.fill();
			}
		});
		const smat = k.mat(0xffffff, { map: strip });
		for (let i = 0; i < 14; i++) k.plane(0.16, 0.3 + r() * 0.3, smat, { x: (r() - 0.5) * 2.4, y: 0.012 + i * 0.001, z: mz + r() * 1.6, rx: -PI / 2, rz: r() * 6 });
		k.point(0xfff0d0, 8, 12, { x: 0, y: 3, z: mz + 2 });
		k.point(0x80c080, 6, 16, { x: 3, y: 4, z: mz + 1 });
		return {
			shots: [
				{ pos: [cx + 0.6, 1.95, 0.9], look: [cx + 0.1, 1.7, -1], fov: 45, fog: [0x3a3428, 4, 20] },
				{ pos: [bx + 0.55, 0.75, 0.75], look: [bx, 0.3, 0], fov: 38, fog: [0x2a1a10, 2, 20], filter },
				{ pos: [0.8, 1.5, mz + 4], look: [0, 0.6, mz - 0.4], fov: 50, fog: [0x3a4a3a, 6, 40], filter, exposure: 1.2 },
				{ pos: [-4, 3.5, 20], look: [-14, 3.5, 4], fov: 45, filter },
				{ pos: [0.6, 0.9, gz + 2.4], look: [0, 0.7, gz], fov: 40, fog: [0xd8e0a8, 10, 60], filter },
				{ pos: [3.4, 1.4, 26.2], look: [-2, 11, -50], fov: 50, filter },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the labyrinth (Pan's Labyrinth)
	r97: (k) => {
		k.fog(0x3a5058, 20, 220);
		k.sky(0x1a2a3a, 0x4a6068);
		k.light({ sky: 0xa8c8d0, ground: 0x2a2a20, hemi: 1.6, sunColor: 0xc8d8f0, sunIntensity: 1.3, sunPos: [-30, 60, 40], shadowSize: 40 });
		const r = rng(97);
		const stone = 0x6a6e5e;
		const moss = 0x4a5a38;
		// The labyrinth: mossy stone walls, an arch with a carved face, and the pit at the centre.
		k.ground(400, 0x3a4a2a, { bump: 0.4, seg: 40 });
		const walls = [];
		const ring = (rad, gaps) => {
			const n = Math.round(rad * 1.6);
			for (let i = 0; i < n; i++) {
				const a = (i / n) * PI * 2;
				if (gaps.some((g) => Math.abs(((a - g + PI * 3) % (PI * 2)) - PI) < 0.22)) continue;
				walls.push([Math.cos(a) * rad, 2.5, Math.sin(a) * rad, -a + PI / 2, 1, 1 + r() * 0.15, 1]);
			}
		};
		ring(8, [PI / 2]);
		ring(13, [-PI / 2]);
		ring(18, [PI / 2 + 0.3]);
		instances(k, new k.THREE.BoxGeometry(4.2, 5, 0.9), k.mat(stone, { rough: 1 }), walls);
		instances(k, new k.THREE.BoxGeometry(4.3, 0.3, 1.1), k.mat(moss, { rough: 1 }), walls.map((w) => [w[0], 5.1, w[2], w[3]]));
		const arch = k.group({ x: 0, z: 18 });
		[-1, 1].forEach((s) => k.box(1.6, 7, 1.6, stone, { x: s * 2.2, y: 3.5, parent: arch, rough: 1 }));
		k.box(6, 1.6, 1.6, stone, { y: 7.6, parent: arch, rough: 1 });
		k.sphere(1.1, 0x7a7e6a, { y: 7.8, z: 0.9, parent: arch, s: [1, 1.2, 0.5] });
		[-0.4, 0.4].forEach((x) => k.sphere(0.18, 0x2a2a20, { x, y: 8, z: 1.4, parent: arch }));
		k.box(0.3, 0.08, 0.1, 0x2a2a20, { y: 7.4, z: 1.45, parent: arch });
		[-1, 1].forEach((s) => tube(k, [s * 0.9, 8.6, 1], [s * 1.6, 9.6, 1.2], 0.15, 0x7a7e6a, { parent: arch, r2: 0.05 }));
		// The pit: a spiral of steps around a carved monolith.
		k.cyl(5, 5, 0.4, 0x2a2a24, { y: 0.05, seg: 20 });
		for (let i = 0; i < 18; i++) {
			const a = i * 0.35;
			k.box(1.6, 0.25, 0.8, 0x7a7a6a, { x: Math.cos(a) * 4.2, y: 0.35 + i * 0.05, z: Math.sin(a) * 4.2, ry: -a });
		}
		k.box(1.4, 5, 1.0, 0x7a7e6a, { y: 2.5 });
		for (let i = 0; i < 6; i++) k.torus(0.15 + i * 0.07, 0.03, 0x4a4e40, { y: 3.5, z: 0.51, parent: undefined });
		k.cone(0.9, 1.6, 0x7a7e6a, { y: 5.8, seg: 4, ry: PI / 4 });
		// The faun.
		const faun = k.group({ x: -2.2, y: 0, z: 2.2, ry: 0.6, from: 4 });
		const bark = 0x8a7a5a;
		[-0.3, 0.3].forEach((x) => {
			tube(k, [x, 0, 0.2], [x, 1.2, -0.3], 0.18, 0x5a4a38, { parent: faun });
			tube(k, [x, 1.2, -0.3], [x * 0.8, 2.3, 0.1], 0.22, 0x5a4a38, { parent: faun });
			k.box(0.25, 0.15, 0.35, 0x2a2018, { x, y: 0.07, z: 0.25, parent: faun });
		});
		k.box(0.9, 1.4, 0.5, bark, { y: 3.0, parent: faun });
		k.box(0.6, 0.6, 0.55, bark, { y: 4.0, z: 0.1, parent: faun });
		k.box(0.25, 0.3, 0.15, 0x6a5a40, { y: 3.85, z: 0.42, parent: faun });
		[-0.15, 0.15].forEach((x) => k.sphere(0.06, 0x8ab8c8, { x, y: 4.1, z: 0.38, parent: faun, emissive: 0x405860 }));
		[-1, 1].forEach((s) => {
			k.torus(0.32, 0.1, 0x6a5a40, { x: s * 0.42, y: 4.3, z: -0.05, ry: PI / 2, parent: faun, arc: PI * 1.5, seg: 12 });
			tube(k, [s * 0.5, 3.6, 0], [s * 1.0, 2.6, 0.5], 0.1, bark, { parent: faun });
			tube(k, [s * 1.0, 2.6, 0.5], [s * 1.0, 2.0, 0.9], 0.07, bark, { parent: faun });
		});
		k.point(0x80c0d0, 8, 12, { x: -1, y: 4, z: 6, from: 4 });
		// The girl, in green with a white pinafore.
		const ofelia = (o) => {
			const p = k.person({ ...o, s: 0.8, dress: 0x2a6a4a, colors: { shirt: 0xf0ece0, legs: 0xf0e8e0, skin: 0xf0d0b8, hair: 0x2a1a10, shoes: 0xa01818 } });
			k.box(0.42, 0.55, 0.05, 0xf4f0e6, { y: 1.1, z: 0.16, parent: p });
			return p;
		};
		ofelia({ x: 1.4, y: 0, z: 22, ry: PI, from: 3 });
		ofelia({ x: 0.6, y: 0.5, z: 4.2, ry: PI + 0.4, from: 4 });
		trees(k, 70, [-90, 90, -90, 90], { color: 0x2a3a2a, h: 16, seed: 11, avoid: (x, z) => Math.hypot(x, z) < 26 });
		k.particles(800, 0xc8d8d8, { box: [60, 20, 60], speed: 0.4, size: 0.06, opacity: 0.4, drift: 0.5 });
		k.disc(0xe8f0f0, 10, { x: -40, y: 70, z: -150 });
		for (let i = 0; i < 4; i++) k.point(0xa8d0e0, 8, 30, { x: Math.cos(i * 1.6) * 12, y: 8, z: Math.sin(i * 1.6) * 12 });

		// A chalk door on a bedroom wall.
		const dx = 700;
		k.box(20, 0.2, 20, 0x3a2a20, { x: dx, y: -0.1 });
		const chalk = k.canvas(256, 256, (g, w, h) => {
			g.fillStyle = "#4a3a2a";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#5a4a34";
			for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 14, 0, 4, h);
			g.strokeStyle = "rgba(240,236,220,0.9)";
			g.lineWidth = 5;
			g.lineCap = "round";
			g.beginPath();
			g.moveTo(70, 250);
			g.lineTo(72, 90);
			g.quadraticCurveTo(128, 20, 186, 90);
			g.lineTo(186, 250);
			g.stroke();
		});
		k.box(10, 6, 0.2, k.mat(0xffffff, { map: chalk }), { x: dx, y: 3, z: -1, });
		k.box(0.06, 0.06, 0.25, 0xf4f0e6, { x: dx + 1.1, y: 0.03, z: 0.2, ry: 0.4 });
		const seam = k.box(1.8, 0.04, 0.02, 0xffe0a0, { x: dx, y: 0.04, z: -0.88, emissive: 0xffc060, glow: 2 });
		void seam;
		k.glow(0xffd080, 2.4, { x: dx, y: 0.1, z: -0.7, opacity: 0.6 });
		k.point(0xffc070, 6, 6, { x: dx, y: 0.4, z: -0.4 });
		k.point(0x8090b0, 6, 14, { x: dx + 2, y: 4, z: 4 });

		// An officer's desk: a cracked pocket watch by lamplight.
		const sx = -700;
		k.box(20, 0.2, 20, 0x2a1e16, { x: sx, y: -0.1 });
		k.box(10, 6, 0.2, 0x4a4a3e, { x: sx, y: 3, z: -1.6 });
		k.box(3, 0.1, 1.6, 0x4a2a18, { x: sx, y: 1.0, z: -0.6, rough: 0.5 });
		k.box(2.9, 0.95, 1.5, 0x3a2012, { x: sx, y: 0.48, z: -0.6 });
		const watch = k.group({ x: sx + 0.1, y: 1.06, z: -0.3, ry: 0.3 });
		const face = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#f0e8d4";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#1a1410";
			for (let n = 0; n < 12; n++) {
				const an = (n / 12) * PI * 2;
				g.fillRect(64 + Math.sin(an) * 50 - 3, 64 - Math.cos(an) * 50 - 3, 6, 6);
			}
			g.lineWidth = 4;
			g.strokeStyle = "#1a1410";
			g.beginPath();
			g.moveTo(64, 64);
			g.lineTo(64 + 30, 64 - 18);
			g.moveTo(64, 64);
			g.lineTo(64 - 8, 64 - 42);
			g.stroke();
			g.strokeStyle = "rgba(255,255,255,0.9)";
			g.lineWidth = 2;
			g.beginPath();
			g.moveTo(30, 20);
			g.lineTo(60, 70);
			g.lineTo(100, 90);
			g.moveTo(60, 70);
			g.lineTo(40, 110);
			g.stroke();
		});
		k.cyl(0.2, 0.2, 0.06, 0xb8a060, { parent: watch, metal: 0.85, rough: 0.25, seg: 24 });
		k.cyl(0.17, 0.17, 0.005, k.mat(0xffffff, { map: face, rough: 0.2 }), { y: 0.032, parent: watch, seg: 24 });
		k.cyl(0.03, 0.03, 0.06, 0xb8a060, { z: -0.22, rx: PI / 2, parent: watch, metal: 0.85 });
		k.torus(0.05, 0.012, 0xb8a060, { z: -0.28, rx: PI / 2, parent: watch, metal: 0.85 });
		for (let c = 0; c < 10; c++) k.sphere(0.012, 0xb8a060, { x: sx + 0.0 - c * 0.04, y: 1.06, z: -0.62 - Math.sin(c * 0.5) * 0.06, metal: 0.85 });
		// Papers, an inkwell, a lamp.
		k.box(0.42, 0.005, 0.56, 0xe8dcc0, { x: sx - 0.6, y: 1.055, z: -0.6, ry: -0.15 });
		k.box(0.42, 0.005, 0.56, 0xd8ccb0, { x: sx - 0.55, y: 1.06, z: -0.55, ry: 0.1 });
		k.cyl(0.07, 0.08, 0.1, 0x1a1a24, { x: sx + 0.7, y: 1.1, z: -0.9, rough: 0.1 });
		k.cyl(0.005, 0.005, 0.3, 0xe8e0d0, { x: sx + 0.72, y: 1.2, z: -0.9, rz: 0.3 });
		k.cyl(0.12, 0.14, 0.08, 0x6a5a3a, { x: sx + 1.1, y: 1.09, z: -1.1, metal: 0.6 });
		k.cyl(0.08, 0.1, 0.3, 0xffe8b0, { x: sx + 1.1, y: 1.28, z: -1.1, emissive: 0xffc060, glow: 0.8, opacity: 0.8 });
		k.point(0xffc878, 10, 8, { x: sx + 0.9, y: 1.6, z: -0.7 });
		k.point(0x8090a0, 4, 12, { x: sx - 2, y: 3, z: 3 });

		// The dying fig tree with a hollow among its roots.
		const fz = -700;
		k.ground(120, 0x3a3a28, { z: fz, bump: 0.6, seg: 20 });
		const fig = k.group({ z: fz });
		k.cyl(2.2, 3.5, 10, 0x4a4234, { y: 5, parent: fig, seg: 8 });
		for (let i = 0; i < 9; i++) {
			const a = (i / 9) * PI * 2;
			tube(k, [Math.cos(a) * 2.5, 2.5, Math.sin(a) * 2.5], [Math.cos(a) * 6, 0, Math.sin(a) * 6], 0.6, 0x4a4234, { parent: fig, r2: 0.2 });
		}
		for (let i = 0; i < 7; i++) {
			const a = (i / 7) * PI * 2 + 0.3;
			const p = [Math.cos(a) * 1.5, 9.5, Math.sin(a) * 1.5];
			const q = [Math.cos(a) * 7, 15 + r() * 4, Math.sin(a) * 7];
			tube(k, p, q, 0.5, 0x4a4234, { parent: fig, r2: 0.15 });
			tube(k, q, [q[0] * 1.4, q[1] + 3, q[2] * 1.4 + 1], 0.15, 0x4a4234, { parent: fig, r2: 0.04 });
		}
		k.sphere(1.3, 0x0a0806, { y: 1.1, z: 2.6, s: [1, 1.2, 0.6], parent: fig });
		ofelia({ x: 1.6, y: 0, z: fz + 6, ry: PI + 0.4 });
		trees(k, 30, [-60, 60, fz - 60, fz - 15], { color: 0x2a3424, h: 18, seed: 2 });
		k.particles(1000, 0xa8b8c0, { z: fz, box: [40, 25, 40], speed: 14, size: 0.05, opacity: 0.4 });

		// The Pale Man at his feast.
		const px = 1400;
		k.box(30, 0.2, 30, 0x4a2a1a, { x: px, y: -0.1 });
		k.box(30, 10, 0.3, 0x6a3a28, { x: px, y: 5, z: -6 });
		[-1, 1].forEach((s) => k.box(0.3, 10, 14, 0x6a3a28, { x: px + s * 6, y: 5 }));
		const vault = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#6a3a28";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#a86a3a";
			g.lineWidth = 6;
			for (let i = 0; i < 4; i++) {
				g.beginPath();
				g.arc(64, 128, 30 + i * 22, PI, 0);
				g.stroke();
			}
		});
		k.plane(12, 10, k.mat(0xffffff, { map: vault }), { x: px, y: 5, z: -5.84 });
		// The fireplace behind him.
		k.box(3.4, 3.4, 0.6, 0x5a3020, { x: px, y: 1.7, z: -5.6 });
		k.box(2.2, 2.2, 0.3, 0x1a0806, { x: px, y: 1.1, z: -5.3 });
		const fl = [];
		for (let i = 0; i < 5; i++) fl.push(k.cone(0.25, 0.9, i % 2 ? 0xff7a20 : 0xffc040, { x: px - 0.6 + i * 0.3, y: 0.55, z: -5.2, emissive: 0xff5010, glow: 1.5, seg: 5, shadow: false }));
		k.tick((t) => fl.forEach((f, i) => (f.scale.y = 0.8 + 0.4 * Math.abs(Math.sin(t * 6 + i)))));
		k.point(0xff7a30, 20, 16, { x: px, y: 1.6, z: -4.3 });
		// The long table with its red feast.
		k.box(2.2, 0.15, 7, 0x8a1a14, { x: px, y: 1.0, z: 0 });
		k.box(2.0, 1.0, 6.8, 0x3a1a10, { x: px, y: 0.5, z: 0 });
		for (let i = 0; i < 16; i++) {
			const z = -3 + i * 0.4, x = px + (i % 2 ? 0.55 : -0.55);
			k.cyl(0.2, 0.18, 0.05, 0xd8c8a0, { x, y: 1.1, z, metal: 0.5 });
			k.sphere(0.12 + r() * 0.08, [0xc01818, 0x8a1020, 0xe04020, 0x6a1a2a][i % 4], { x, y: 1.2, z, seg: 8, rings: 6 });
		}
		[-2.4, -0.4, 1.6].forEach((z) => {
			k.cyl(0.04, 0.05, 0.6, 0xe8e0c8, { x: px, y: 1.4, z });
			k.glow(0xffc060, 0.5, { x: px, y: 1.75, z });
		});
		k.point(0xffb060, 8, 10, { x: px, y: 2.2, z: 0 });
		// Him: pale, sagging, seated at the head, eyes held up in his palms.
		const pale = k.group({ x: px, y: 0, z: -4 });
		const flesh = 0xe0c8c0;
		k.box(0.8, 0.8, 0.6, 0x5a2a1a, { y: 0.4, parent: pale });
		k.sphere(0.5, flesh, { y: 1.35, parent: pale, s: [1, 1.3, 0.8] });
		k.sphere(0.45, flesh, { y: 0.95, z: 0.1, parent: pale, s: [1.1, 0.6, 0.9] });
		k.sphere(0.32, flesh, { y: 2.05, parent: pale, s: [1, 1.1, 1] });
		k.box(0.2, 0.04, 0.05, 0x5a2a2a, { y: 1.88, z: 0.3, parent: pale });
		[-1, 1].forEach((s) => {
			tube(k, [s * 0.4, 1.7, 0], [s * 0.75, 1.3, 0.35], 0.08, flesh, { parent: pale });
			tube(k, [s * 0.75, 1.3, 0.35], [s * 0.45, 2.15, 0.55], 0.07, flesh, { parent: pale });
			k.box(0.25, 0.32, 0.06, flesh, { x: s * 0.42, y: 2.35, z: 0.58, parent: pale });
			for (let f = 0; f < 4; f++) tube(k, [s * 0.42 + (f - 1.5) * 0.06, 2.5, 0.58], [s * 0.42 + (f - 1.5) * 0.08, 2.75, 0.6], 0.018, flesh, { parent: pale });
			k.sphere(0.07, 0xf8f4ec, { x: s * 0.42, y: 2.35, z: 0.62, parent: pale });
			k.sphere(0.035, 0x1a1008, { x: s * 0.42, y: 2.35, z: 0.68, parent: pale });
			[0, 1].forEach((leg) => tube(k, [s * 0.25, 0.85, 0.2], [s * 0.3, 0.4 + leg * 0.05, 0.7], 0.1, flesh, { parent: pale }));
			tube(k, [s * 0.3, 0.42, 0.7], [s * 0.3, 0, 0.75], 0.08, flesh, { parent: pale });
		});
		k.cyl(0.22, 0.2, 0.05, 0xd8c8a0, { x: px, y: 1.1, z: -2.8, metal: 0.5 });
		[-0.06, 0.06].forEach((x) => k.sphere(0.05, 0xf8f4ec, { x: px + x, y: 1.16, z: -2.8 }));
		k.spot(0xffe0c8, 30, { x: px + 1.5, y: 4.5, z: 0, target: [px, 1.8, -3.8], angle: 0.4, distance: 14 });
		return {
			shots: [
				{ pos: [sx + 0.55, 1.75, 0.75], look: [sx + 0.05, 1.05, -0.45], fov: 42, fog: [0x1a1410, 4, 30], exposure: 1.2 },
				{ pos: [dx + 0.6, 2.0, 4.6], look: [dx, 2.0, -1], fov: 45, fog: [0x1a1410, 4, 30], exposure: 1.2 },
				{ pos: [6, 2.5, fz + 16], look: [0, 4, fz], fov: 50, fog: [0x3a4040, 8, 90], exposure: 1.2 },
				{ pos: [2.5, 2, 31], look: [0, 4, 17], fov: 50 },
				{ pos: [3.6, 3.2, 5.0], look: [-1.6, 3, 1.6], fov: 55 },
				{ pos: [px + 1.6, 2.2, 2.8], look: [px, 1.8, -3.5], fov: 45, fog: [0x2a140c, 6, 40], exposure: 1.2 },
			],
		};
	},
};
