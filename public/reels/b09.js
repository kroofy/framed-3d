// Batch 09: r98–r107. Each reel builds one diorama with far-off vignettes and returns six shots, cryptic first.
import { PI, rng, trees, city } from "../kit.js";

/** A cylinder running from point a to point b. */
function rod(k, a, b, r, color, o = {}) {
	const A = new k.THREE.Vector3(...a);
	const B = new k.THREE.Vector3(...b);
	const m = k.cyl(r, r, A.distanceTo(B), color, { ...o, x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, seg: o.seg ?? 6 });
	m.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, 1, 0), B.sub(A).normalize());
	return m;
}

/** A sword held in a person's arm pivot: grip in the hand, blade continuing along the arm. */
function blade(k, arm, o = {}) {
	k.box(0.05, 0.28, 0.05, o.grip ?? 0x151010, { y: -0.74, parent: arm });
	k.cyl(0.07, 0.07, 0.025, o.guard ?? 0xc8a040, { y: -0.9, parent: arm, metal: 0.7 });
	k.box(0.025, o.len ?? 1.0, 0.065, o.color ?? 0xe4ebf2, { y: -0.92 - (o.len ?? 1.0) / 2, parent: arm, metal: 0.85, rough: 0.2 });
}

/** A gable roof: ridge along z, base width w, height h, base sitting at y. */
function roof(k, w, len, h, color, o = {}) {
	const g = k.group(o);
	k.cyl(1, 1, 1, color, { y: h / 3, seg: 3, rx: -PI / 2, s: [w / 1.732, len, h / 1.5], parent: g });
	return g;
}

/** Rain as falling streaks inside a box around `o`. */
function rain(k, count, o = {}) {
	const size = o.box ?? [20, 15, 20];
	const len = o.len ?? 0.35;
	const pos = new Float32Array(count * 6);
	for (let i = 0; i < count; i++) {
		const x = (Math.random() - 0.5) * size[0];
		const y = Math.random() * size[1];
		const z = (Math.random() - 0.5) * size[2];
		pos.set([x, y, z, x + (o.slant ?? 0.04), y - len, z], i * 6);
	}
	const geo = new k.THREE.BufferGeometry();
	geo.setAttribute("position", new k.THREE.BufferAttribute(pos, 3));
	const lines = k.place(new k.THREE.LineSegments(geo, new k.THREE.LineBasicMaterial({ color: o.color ?? 0xb8c8d8, transparent: true, opacity: o.opacity ?? 0.5, depthWrite: false })), { ...o, shadow: false });
	const speed = o.speed ?? 20;
	k.tick((t, dt) => {
		const a = geo.attributes.position;
		for (let i = 0; i < count; i++) {
			let y = a.getY(i * 2) - speed * dt;
			if (y < 0) y += size[1];
			a.setY(i * 2, y);
			a.setY(i * 2 + 1, y - len);
		}
		a.needsUpdate = true;
	});
	return lines;
}

/** A low-poly horse facing +z, hooves at y = 0. */
function horse(k, o = {}) {
	const c = o.color ?? 0x6a4228;
	const g = k.group(o);
	k.capsule(0.42, 1.1, c, { y: 1.35, rx: PI / 2, parent: g });
	[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.16, 1.1, 0.18, c, { x: sx * 0.22, y: 0.55, z: sz * 0.62, parent: g })));
	k.box(0.3, 0.9, 0.35, c, { y: 1.85, z: 0.95, rx: 0.6, parent: g });
	k.box(0.26, 0.28, 0.7, c, { y: 2.25, z: 1.35, rx: 0.35, parent: g });
	k.box(0.08, 0.6, 0.12, o.mane ?? 0x1a120c, { y: 2.0, z: 0.82, rx: 0.6, parent: g });
	k.box(0.1, 0.8, 0.1, o.mane ?? 0x1a120c, { y: 1.15, z: -0.95, rx: -0.4, parent: g });
	[-0.09, 0.09].forEach((x) => k.cone(0.05, 0.16, c, { x, y: 2.45, z: 1.1, parent: g }));
	return g;
}

export const REELS = {
	// ----------------------------------------------------------------------------------------------- the basement and the glass house
	r98: (k) => {
		k.fog(0xdde8dc, 60, 260);
		k.sky(0x5c9ad6, 0xeef2e4);
		k.light({ sky: 0xf2f6ff, ground: 0x5a6a40, hemi: 1.25, sunColor: 0xfff2d8, sunIntensity: 2.4, sunPos: [25, 45, 35], shadowSize: 35 });
		// The architect's house: lawn in front (+z), the living room behind a wall of glass (-z).
		k.ground(400, 0x3f6630, { y: -0.6, bump: 0.3, seg: 30 });
		k.box(34, 0.6, 26, 0x6aa540, { y: -0.3, z: 5 });
		k.box(35, 3.4, 1.2, 0x2c5424, { y: 1.7, z: 18.6 });
		[-1, 1].forEach((s) => k.box(1.2, 3.4, 27, 0x2c5424, { x: s * 17.6, y: 1.7, z: 5 }));
		trees(k, 26, [-60, 60, 24, 70], { h: 11, color: 0x2a5226, trunk: 0x4a3828 });
		trees(k, 30, [-60, 60, -60, -22], { h: 14, color: 0x2a5226, seed: 9 });
		const wall = 0xe6e1d8;
		k.box(25, 0.3, 9.4, 0xcfc8bc, { y: 0.15, z: -12 });
		k.box(25, 4.2, 0.3, wall, { y: 2.1, z: -16.6 });
		[-1, 1].forEach((s) => k.box(0.4, 4.2, 9.4, wall, { x: s * 12.3, y: 2.1, z: -12 }));
		k.box(27, 0.5, 10.4, wall, { y: 4.45, z: -11.8 });
		k.plane(24.2, 3.9, k.mat(0x9ab8c8, { opacity: 0.2, rough: 0.1, metal: 0.4 }), { y: 2.25, z: -7.5, shadow: false });
		for (let x = -12; x <= 12; x += 4) k.box(0.12, 3.9, 0.12, 0x2a2a2a, { x, y: 2.25, z: -7.5 });
		k.box(17, 3.4, 9.5, wall, { x: -3.5, y: 6.45, z: -12.6 });
		k.box(15, 1.3, 0.1, 0x28323a, { x: -3.5, y: 6.5, z: -7.82, rough: 0.2, metal: 0.4 });
		k.box(17.4, 0.25, 9.9, 0x3a3a3a, { x: -3.5, y: 8.25, z: -12.6 });
		k.box(0.5, 8.4, 7, 0x6a4a30, { x: 14.2, y: 4.2, z: -12 });
		// Inside: the long sofa, the low table, a painting, a lamp.
		const sofa = 0xb4a68e;
		k.box(5.4, 0.45, 1.3, sofa, { x: -1, y: 0.53, z: -13.2 });
		k.box(5.4, 0.9, 0.35, sofa, { x: -1, y: 1.1, z: -13.85 });
		[-1, 1].forEach((s) => k.box(0.35, 0.75, 1.3, sofa, { x: -1 + s * 2.85, y: 0.68, z: -13.2 }));
		k.box(2.4, 0.45, 1.1, 0x3a2a20, { x: -1, y: 0.52, z: -11.0 });
		const art = k.canvas(256, 160, (g, w, h) => {
			g.fillStyle = "#efe8da";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#2a3a4a";
			g.fillRect(30, 30, 80, 100);
			g.fillStyle = "#c8a050";
			g.beginPath();
			g.arc(170, 80, 45, 0, PI * 2);
			g.fill();
		});
		k.box(2.4, 1.5, 0.05, k.mat(0xffffff, { map: art }), { x: 5, y: 2.3, z: -16.42 });
		k.cyl(0.03, 0.03, 2.2, 0x222222, { x: 3.2, y: 1.4, z: -15.6 });
		k.cone(0.35, 0.4, 0xf4ead0, { x: 3.2, y: 2.6, z: -15.6, emissive: 0x806a40 });
		k.point(0xffe6c0, 3, 16, { x: 0, y: 3.6, z: -12 });
		// The garden: a tent, the party table, guests.
		const tp = k.group({ x: 6, z: 5 });
		k.cone(1.5, 3.2, 0xefe6cf, { y: 1.6, seg: 8, parent: tp });
		k.cyl(1.06, 1.27, 0.45, 0xc23a26, { y: 0.75, seg: 8, parent: tp });
		k.cyl(0.6, 0.83, 0.25, 0x2a5aa8, { y: 1.6, seg: 8, parent: tp });
		[0, 2.1, 4.2].forEach((a) => k.cyl(0.03, 0.03, 1.2, 0x6a4a30, { y: 3.25, rz: 0.3 * Math.cos(a), rx: 0.3 * Math.sin(a), parent: tp }));
		k.box(5.5, 0.08, 1.4, 0xf8f8f4, { x: -6, y: 0.84, z: 6, from: 5 });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.08, 0.8, 0.08, 0xeeeeee, { x: -6 + sx * 2.5, y: 0.4, z: 6 + sz * 0.55, from: 5 })));
		k.cyl(0.35, 0.35, 0.3, 0xffffff, { x: -6, y: 1.03, z: 6, from: 5 });
		k.cyl(0.25, 0.25, 0.25, 0xf0c8d8, { x: -6, y: 1.3, z: 6, from: 5 });
		for (let i = 0; i < 6; i++) k.cyl(0.18, 0.18, 0.02, 0xdddddd, { x: -8.2 + i * 0.85, y: 0.89, z: 5.6, from: 5 });
		const guests = [
			[-8.5, 7.6, 2.8, 0xe8d8f0, 0x3a3a48],
			[-4, 7.8, 3.4, 0xf0e8c8, 0x5a6a8a],
			[-9.5, 4.6, 1.2, 0x8aa8c8, 0x2a2a30],
			[-2.8, 4.4, -0.8, 0xf4f4f0, 0x6a5a4a],
			[-12, 9, 2, 0xd88a7a, 0x2a2a30],
		];
		guests.forEach(([x, z, ry, shirt, legs], i) => k.person({ x, z, ry, colors: { shirt, legs, hair: i % 2 ? 0x1a1410 : 0x3a2a20 }, from: 5 }));
		const chief = k.person({ x: 1.8, z: 9, ry: -0.5, colors: { shirt: 0xf0ece0, legs: 0x3a3a40, hair: 0x1a1410 }, from: 5 });
		const crown = chief.userData.limbs.head;
		k.torus(0.2, 0.03, 0xc23a26, { y: 0.07, rx: PI / 2, parent: crown });
		for (let i = 0; i < 9; i++) {
			const a = -1.6 + (i / 8) * 3.2 + PI;
			k.cone(0.045, 0.42, i % 2 ? 0xf4efe0 : 0x8a5a2a, { x: Math.sin(a) * 0.19, y: 0.28, z: Math.cos(a) * 0.19, rx: Math.cos(a) * 0.35, rz: -Math.sin(a) * 0.35, parent: crown });
		}
		// The scholar's stone on its stand (x = 200).
		k.box(3, 0.12, 2, 0x5a3a24, { x: 200, y: 0.94, z: 0 });
		k.box(2.8, 0.9, 1.8, 0x3a2416, { x: 200, y: 0.44, z: 0 });
		k.cyl(0.36, 0.42, 0.12, 0x3a2414, { x: 200, y: 1.06, z: 0, seg: 14 });
		const stone = 0x3e4440;
		k.ico(0.36, stone, { x: 200, y: 1.38, z: 0, s: [1.3, 0.9, 0.75], ry: 0.4 });
		k.ico(0.22, stone, { x: 200.2, y: 1.62, z: 0.02, rz: 0.5 });
		k.ico(0.17, stone, { x: 199.8, y: 1.6, z: -0.03, s: [1, 1.5, 1] });
		k.ico(0.14, stone, { x: 199.95, y: 1.95, z: 0.02, s: [0.8, 1.6, 0.8] });
		k.ico(0.18, stone, { x: 200.25, y: 1.25, z: 0.1, s: [1, 0.7, 1] });
		k.box(6, 3, 0.2, 0x6a5440, { x: 200, y: 1.5, z: -2.5 });
		k.box(1.6, 1.2, 0.05, 0xd8e8e0, { x: 201.2, y: 2.1, z: -2.38, emissive: 0x8a9a90 });
		k.spot(0xfff0d8, 30, { x: 201, y: 4, z: 2, target: [200, 1.4, 0], angle: 0.4, distance: 12 });
		// The half-basement (x = -200): a window at street level, the toilet up on its platform.
		const B = -200;
		const bw = 0x9c9a74;
		k.box(6, 0.2, 6, 0x7a6e52, { x: B, y: -0.1 });
		k.box(6, 1.9, 0.2, bw, { x: B, y: 0.95, z: -3 });
		k.box(6, 0.3, 0.2, bw, { x: B, y: 2.75, z: -3 });
		[-1, 1].forEach((s) => k.box(1.4, 0.7, 0.2, bw, { x: B + s * 2.3, y: 2.25, z: -3 }));
		[-1, 1].forEach((s) => k.box(0.2, 2.9, 6, bw, { x: B + s * 3, y: 1.45 }));
		k.box(6, 2.9, 0.2, bw, { x: B, y: 1.45, z: 3 });
		k.box(6.2, 0.2, 6.2, 0xc8c2a8, { x: B, y: 3.0 });
		for (let i = 0; i < 6; i++) k.cyl(0.02, 0.02, 0.7, 0x2a2a2a, { x: B - 1.25 + i * 0.5, y: 2.25, z: -3 });
		k.box(40, 1.9, 20, 0x5a5a5e, { x: B, y: 0.95, z: -13.2 });
		[[-10, 0xc8b8a0], [-3, 0xa89a88], [4, 0xd8ccb0], [11, 0x9aa0a0]].forEach(([x, c], i) => {
			k.box(6.5, 7 + i, 4, c, { x: B + x, y: 1.9 + (7 + i) / 2, z: -20 });
			for (let w = 0; w < 3; w++) k.box(1, 1, 0.1, 0x3a4048, { x: B + x - 2 + w * 2, y: 4.5, z: -17.95 });
		});
		k.cyl(0.06, 0.06, 4, 0x3a3a3a, { x: B + 2.5, y: 3.9, z: -8 });
		k.box(1.2, 0.2, 0.06, 0x2a2a2a, { x: B - 4, y: 2.0, z: -4.5 });
		k.box(1.6, 1.1, 1.6, 0xdce0dc, { x: B + 2.1, y: 0.55, z: -2.1 });
		k.box(0.7, 0.55, 0.5, 0xc8ccc8, { x: B + 1.0, y: 0.28, z: -1.6, until: 2 });
		const loo = k.group({ x: B + 2.1, y: 1.1, z: -2.2 });
		k.cyl(0.16, 0.2, 0.32, 0xf4f4f4, { y: 0.16, parent: loo });
		k.cyl(0.26, 0.18, 0.14, 0xf4f4f4, { y: 0.38, s: [1, 1, 1.25], parent: loo });
		k.cyl(0.26, 0.26, 0.04, 0xe8e0d0, { y: 0.47, s: [1, 1, 1.25], parent: loo });
		k.box(0.5, 0.45, 0.2, 0xf4f4f4, { y: 0.7, z: -0.45, parent: loo });
		k.box(0.6, 0.45, 0.12, 0xc8d8e0, { x: B + 2.1, y: 2.4, z: -2.85, rough: 0.2, metal: 0.4 });
		k.box(0.12, 0.02, 1.2, 0xffffff, { x: B, y: 2.88, z: 0, emissive: 0xe8f8f0, glow: 0.9 });
		k.point(0xe8f4e0, 4, 12, { x: B, y: 2.5, z: 0.5 });
		k.spot(0xfff4dc, 25, { x: B, y: 3.6, z: -6, target: [B - 0.5, 0, 0], angle: 0.5, distance: 14 });
		// Dry clutter: the low table, folded pizza boxes, laundry under the ceiling, a kitchenette.
		k.box(1.4, 0.35, 0.8, 0x6a4a2a, { x: B - 0.5, y: 0.18, z: 0.5, until: 2 });
		for (let i = 0; i < 7; i++) k.box(0.55, 0.05, 0.55, i % 2 ? 0xf0f0ea : 0x4a7ac0, { x: B - 2, y: 0.03 + i * 0.06, z: -1.6, ry: i * 0.15, until: 2 });
		k.cyl(0.01, 0.01, 4.5, 0xdddddd, { x: B, y: 2.6, z: 1.5, rz: PI / 2 });
		[0xe85a5a, 0x5a8ae8, 0xf0f0f0, 0xe8c85a, 0x7ac87a].forEach((c, i) => k.box(0.3, 0.35, 0.02, c, { x: B - 1.6 + i * 0.75, y: 2.4, z: 1.5 }));
		k.box(0.6, 0.9, 2.4, 0xd8d4c4, { x: B - 2.65, y: 0.45, z: 0.6 });
		k.box(0.62, 0.05, 2.42, 0x8a8a84, { x: B - 2.65, y: 0.92, z: 0.6 });
		k.cyl(0.2, 0.2, 0.15, 0xc0c0c0, { x: B - 2.6, y: 1.02, z: 1.2, metal: 0.7 });
		// The flood: brown water to the waist, a sister on the toilet lid, rain through the window.
		const flood = k.water(5.8, 0x52502e, { x: B, y: 1.15, seg: 16, amp: 0.08, opacity: 0.95, from: 4 });
		flood.material.roughness = 0.9;
		flood.material.metalness = 0;
		[[-1.5, 0.4, 0.3], [0.4, -0.8, 1.1], [-0.4, 1.5, 2]].forEach(([x, z, ry]) => k.box(0.55, 0.05, 0.55, 0x4a7ac0, { x: B + x, y: 1.2, z, ry, from: 4 }));
		k.cyl(0.3, 0.2, 0.2, 0xd84a4a, { x: B + 1, y: 1.22, z: 1.3, from: 4 });
		const sis = k.person({ x: B + 2.1, y: 0.75, z: -1.95, ry: -0.5, pose: "sit", colors: { shirt: 0x2a2a30, legs: 0x3a3a50, hair: 0x14100c, skin: 0xe8c0a0 }, from: 4 });
		k.glow(0xff8a30, 0.25, { x: B + 2.0, y: 1.95, z: -1.55, from: 4 });
		const spray = [];
		for (let i = 0; i < 5; i++) spray.push(k.cyl(0.03, 0.05, 0.6, 0xc8c0a0, { x: B + 2.1 + Math.cos(i * 1.3) * 0.3, y: 1.8, z: -2.1 + Math.sin(i * 1.3) * 0.3, rz: Math.cos(i * 1.3) * 0.6, rx: -Math.sin(i * 1.3) * 0.6, opacity: 0.7, from: 4 }));
		k.tick((t) => spray.forEach((s, i) => (s.scale.y = 0.7 + 0.3 * Math.sin(t * 9 + i))));
		k.box(2.6, 0.04, 1.2, 0xc8d8e0, { x: B, y: 1.55, z: -2.45, rx: -1.0, opacity: 0.55, from: 4, shadow: false });
		for (let i = 0; i < 8; i++) k.box(0.3 + (i % 3) * 0.15, 0.04, 0.25, [0xe8e0d0, 0x5a8ae8, 0xd84a4a, 0x8a6a4a][i % 4], { x: B - 2.3 + (i * 0.71) % 4, y: 1.2, z: -1.5 + ((i * 1.3) % 3.5), ry: i, from: 4 });
		rain(k, 600, { box: [10, 6, 6], x: B, y: 1.9, z: -7, from: 4 });
		k.point(0x8aa8c8, 3, 10, { x: B - 1, y: 2.4, z: 1.5, from: 4 });
		// The long stairs down in the rain (x = 400): step tops fall 0.5 every 1.4 along -z.
		const S = 400;
		const top = (i) => 20 - i * 0.5;
		for (let i = 0; i < 40; i++) k.box(5, top(i), 1.4, 0x3e4248, { x: S, y: top(i) / 2, z: -i * 1.4 - 0.7, rough: 0.35 });
		k.box(12, 20, 10, 0x6a6e72, { x: S, y: 10, z: 5 });
		k.box(30, 0.5, 30, 0x4a4e52, { x: S, y: 0, z: -70 });
		const r = rng(4);
		for (let j = 0; j < 9; j++) {
			[-1, 1].forEach((s) => {
				const z = 2 - j * 7;
				const h = Math.max(1, top(Math.max(0, Math.round(-z / 1.4)))) + 6 + r() * 6;
				k.box(6, h, 7, [0x4a4038, 0x5a4a40, 0x3a3430][(j + (s > 0 ? 1 : 0)) % 3], { x: S + s * 5.6, y: h / 2, z });
				for (let w = 0; w < 3; w++) if (r() > 0.4) k.box(0.05, 0.8, 0.9, 0xffd890, { x: S + s * 2.58, y: h - 2 - w * 2, z: z + (r() - 0.5) * 3, emissive: 0xffb050, glow: 0.8 });
			});
		}
		for (let i = 4; i < 40; i += 8) {
			const z = -i * 1.4 - 0.7;
			k.cyl(0.06, 0.06, 4, 0x2a2a2a, { x: S + 2.2, y: top(i) + 2, z });
			k.glow(0xffd8a0, 2.2, { x: S + 2.0, y: top(i) + 4, z });
			k.point(0xffd0a0, 6, 16, { x: S + 1.5, y: top(i) + 3.6, z });
		}
		[[14, 0x3a4a5a], [15, 0x6a3a3a], [17, 0x4a4a3a]].forEach(([i, c], n) => {
			const p = k.person({ x: S - 0.8 + n * 0.8, y: top(i), z: -i * 1.4 - 0.7, ry: PI, pose: "run", colors: { shirt: c, legs: 0x2a2a30, hair: 0x14100c } });
			p.userData.limbs.body.rotation.x = 0.2;
		});
		rain(k, 2500, { box: [8, 26, 40], x: S, y: 0, z: -20, speed: 22, len: 0.5, opacity: 0.4 });
		return {
			shots: [
				{ pos: [201.2, 1.7, 1.6], look: [200, 1.45, 0], fov: 36, fog: [0x2c261e, 3, 16] },
				{ pos: [-1.2, 2.0, -16.3], look: [0.3, 1.1, -6], fov: 60 },
				{ pos: [B - 1.6, 1.3, 2.5], look: [B + 1.2, 1.7, -2.6], fov: 50 },
				{ pos: [S + 1.1, 17.8, -10], look: [S, 12, -24], fov: 55, fog: [0x1a2430, 12, 70], exposure: 1.1 },
				{ pos: [B - 1.2, 1.5, 2.2], look: [B + 1.8, 1.5, -2.0], fov: 46, fog: [0x0e1820, 6, 40], exposure: 1.05 },
				{ pos: [-3, 3.2, 17.5], look: [0, 2.2, -8], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the prison and the rain
	r99: (k) => {
		k.fog(0xb4b8b4, 70, 320);
		k.sky(0x6a7a8a, 0xd4d6d0);
		k.light({ sky: 0xe4e8f0, ground: 0x5a5044, hemi: 1.2, sunColor: 0xfff0dc, sunIntensity: 1.8, sunPos: [30, 50, 40], shadowSize: 60 });
		// The reformatory and its yard (origin).
		k.ground(500, 0x6a6a52, { y: -0.2, bump: 0.6, seg: 40 });
		k.box(80, 0.3, 70, 0x9a8c74, { y: -0.05, z: 5 });
		const stoneC = 0x8a5a46;
		const pb = k.group({ z: -42 });
		k.box(34, 22, 14, stoneC, { y: 11, parent: pb });
		[-1, 1].forEach((s) => {
			k.box(6, 34, 6, stoneC, { x: s * 7, y: 17, z: 5, parent: pb });
			k.cone(5, 9, 0x3a3c46, { x: s * 7, y: 38.5, z: 5, seg: 4, ry: PI / 4, parent: pb });
			k.box(28, 16, 12, 0x7a5040, { x: s * 31, y: 8, parent: pb });
			k.box(28.4, 0.6, 12.4, 0x5a3a30, { x: s * 31, y: 16.3, parent: pb });
		});
		k.box(10, 30, 8, stoneC, { y: 15, z: 4, parent: pb });
		roof(k, 8.4, 9, 6, 0x3a3c46, { y: 30, z: 4, parent: pb });
		roof(k, 14.4, 34, 7, 0x3a3c46, { y: 22, ry: PI / 2, parent: pb });
		k.cone(1.8, 6, 0x3a3c46, { y: 39, z: 4, seg: 4, ry: PI / 4, parent: pb });
		for (let i = 0; i < 26; i++) for (let j = 0; j < 4; j++) {
			const x = -42 + i * 3.4;
			if (Math.abs(x) < 17 && j > 2) continue;
			k.box(0.9, 2, 0.1, 0x22252a, { x, y: 3 + j * 4, z: Math.abs(x) < 17 ? 7.05 : 6.05, parent: pb });
		}
		[-1, 1].forEach((s) => k.box(1.2, 4, 0.1, 0x22252a, { x: s * 7, y: 26, z: 8.05, parent: pb }));
		k.cyl(1.4, 1.4, 0.2, 0xe8e0c8, { y: 24, z: 8.1, rx: PI / 2, parent: pb });
		k.box(110, 9, 1.5, 0x9a9488, { y: 4.5, z: 40 });
		[-1, 1].forEach((s) => k.box(1.5, 9, 80, 0x9a9488, { x: s * 55, y: 4.5, z: 0 }));
		const tower = k.group({ x: 50, z: 35 });
		k.cyl(1.4, 1.8, 14, 0x8a8478, { y: 7, parent: tower });
		k.box(5, 3, 5, 0x6a6458, { y: 15.5, parent: tower });
		k.box(5.2, 1.2, 5.2, 0x2a2a2a, { y: 15.8, parent: tower });
		k.cone(4.2, 2, 0x3a3c46, { y: 18, seg: 4, ry: PI / 4, parent: tower });
		const blue = { shirt: 0x5a78a0, legs: 0x3a4660, hair: 0x2a2018 };
		const r = rng(8);
		for (let i = 0; i < 40; i++) {
			const x = (r() - 0.5) * 70;
			const z = -18 + r() * 50;
			k.person({ x, z, ry: r() * 6, pose: r() > 0.8 ? "hunch" : "stand", colors: { ...blue, hair: r() > 0.5 ? 0x2a2018 : 0x8a7a6a, skin: r() > 0.7 ? 0x6a4630 : 0xe0b48f } });
		}
		for (let i = 0; i < 3; i++) k.box(10, 0.4, 1.2, 0x7a6a50, { x: -20, y: 0.4 + i * 0.4, z: 20 - i * 1.2 });
		// The Bible, hollowed out around the rock hammer (x = 200).
		k.box(3, 0.1, 2, 0x4a3020, { x: 200, y: 0.95, z: 0 });
		k.box(2.8, 0.9, 1.8, 0x2a1a10, { x: 200, y: 0.45, z: 0 });
		const lines = k.canvas(128, 160, (g, w, h) => {
			g.fillStyle = "#e8dcc0";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#6a6050";
			for (let y = 12; y < h - 10; y += 7) g.fillRect(10 + ((y * 7) % 5), y, w - 22 - ((y * 13) % 30), 2);
		});
		k.box(0.94, 0.04, 0.68, 0x2a1810, { x: 200, y: 1.02, z: 0 });
		k.box(0.44, 0.1, 0.62, 0xe8dcc0, { x: 199.77, y: 1.09, z: 0 });
		k.plane(0.42, 0.6, k.mat(0xffffff, { map: lines }), { x: 199.77, y: 1.141, z: 0, rx: -PI / 2 });
		k.box(0.44, 0.1, 0.62, 0xe8dcc0, { x: 200.23, y: 1.09, z: 0 });
		k.box(0.13, 0.012, 0.44, 0x4a3420, { x: 200.23, y: 1.137, z: 0.02 });
		k.box(0.18, 0.012, 0.06, 0x4a3420, { x: 200.23, y: 1.137, z: -0.17 });
		k.cyl(0.018, 0.018, 0.36, 0x9a6a3a, { x: 200.23, y: 1.15, z: 0.04, rx: PI / 2 });
		k.box(0.14, 0.035, 0.035, 0x6a6a70, { x: 200.23, y: 1.15, z: -0.17, metal: 0.7, rough: 0.35 });
		k.box(0.012, 0.012, 0.6, 0xa02020, { x: 200, y: 1.142, z: 0.25, ry: 0.3 });
		k.cyl(0.06, 0.06, 0.25, 0xd8d0b8, { x: 199.1, y: 1.12, z: -0.4 });
		k.glow(0xffc070, 0.25, { x: 199.1, y: 1.3, z: -0.4 });
		k.spot(0xffe0b0, 25, { x: 199.4, y: 3, z: 1, target: [200.1, 1.1, 0], angle: 0.35, distance: 8 });
		// The cell wall and the poster that hides the tunnel (x = -200).
		const C = -200;
		k.box(3.2, 0.2, 4.4, 0x5a5a56, { x: C, y: -0.1 });
		k.box(3.2, 3.2, 0.3, 0x8a8a7c, { x: C, y: 1.6, z: -2 });
		[-1, 1].forEach((s) => k.box(0.3, 3.2, 4.4, 0x82826e, { x: C + s * 1.6, y: 1.6 }));
		k.box(3.2, 0.2, 4.4, 0x6a6a60, { x: C, y: 3.3 });
		k.box(0.9, 0.15, 2.4, 0x6a6a6a, { x: C - 1.0, y: 0.6, z: 0.4 });
		k.box(0.85, 0.1, 2.3, 0x4a5a6a, { x: C - 1.0, y: 0.72, z: 0.4 });
		[-0.6, 1.6].forEach((z) => k.box(0.06, 0.6, 0.06, 0x3a3a3a, { x: C - 0.6, y: 0.3, z }));
		k.box(0.8, 0.03, 0.4, 0x5a3a20, { x: C + 1.2, y: 1.6, z: -1.6 });
		for (let i = 0; i < 6; i++) k.box(0.08, 0.2 + (i % 3) * 0.04, 0.16, [0x8a3020, 0x2a4a6a, 0xd8c890][i % 3], { x: C + 0.95 + i * 0.09, y: 1.72, z: -1.6 });
		[0, 1, 2, 3, 4].forEach((i) => k.ico(0.04, [0xd8d0c0, 0x7a7a70, 0x8a6a50][i % 3], { x: C + 1.0 + i * 0.1, y: 1.64, z: -1.5 }));
		k.box(0.55, 0.85, 0.04, 0x050505, { x: C + 0.1, y: 1.3, z: -1.84 });
		for (let i = 0; i < 6; i++) k.ico(0.12, 0x6a6a5c, { x: C + 0.1 + Math.cos(i) * 0.32, y: 1.3 + Math.sin(i) * 0.45, z: -1.84 });
		const poster = k.canvas(256, 400, (g, w, h) => {
			const grad = g.createLinearGradient(0, 0, 0, h);
			grad.addColorStop(0, "#e8a050");
			grad.addColorStop(1, "#8a4020");
			g.fillStyle = grad;
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#f0c8a0";
			g.beginPath();
			g.ellipse(128, 95, 26, 32, 0, 0, PI * 2);
			g.fill();
			g.fillStyle = "#4a2a14";
			g.beginPath();
			g.ellipse(124, 105, 48, 62, 0.1, PI, PI * 2.05);
			g.fill();
			g.fillStyle = "#f0c8a0";
			g.fillRect(104, 128, 48, 110);
			g.fillRect(100, 230, 22, 150);
			g.fillRect(134, 230, 22, 150);
			g.save();
			g.translate(150, 140);
			g.rotate(-0.6);
			g.fillRect(0, 0, 16, 90);
			g.restore();
			g.fillStyle = "#a07848";
			g.fillRect(102, 150, 52, 22);
			g.fillRect(98, 210, 60, 30);
			g.strokeStyle = "#f8f0e0";
			g.lineWidth = 8;
			g.strokeRect(4, 4, w - 8, h - 8);
		});
		const hinge = k.group({ x: C - 0.35, y: 1.6, z: -1.82, ry: -0.6 });
		k.plane(0.9, 1.4, k.mat(0xffffff, { map: poster, side: k.THREE.DoubleSide }), { x: 0.45, parent: hinge });
		k.point(0xffe8c0, 3, 9, { x: C + 0.6, y: 2.6, z: 1 });
		// The beach at the end of the road (x = -400).
		const Z = -400;
		k.ground(220, 0xe8d6a8, { x: Z, y: 0, bump: 0.3, seg: 30, height: (x, z) => Math.min(1.5, z * 0.06 + 0.2) });
		k.water(400, 0x2a9ac0, { x: Z, y: -0.15, z: -180, seg: 40, amp: 0.15 });
		const boat = k.group({ x: Z + 1, y: 0.5, z: 4, ry: 0.5, rz: 0.06 });
		k.box(2, 0.9, 6, 0xe8e2d4, { y: 0.9, parent: boat });
		k.box(2.05, 0.15, 6.05, 0x2a5a8a, { y: 0.6, parent: boat });
		k.cyl(1.4, 1.4, 0.9, 0xe8e2d4, { y: 0.9, z: 3.1, seg: 3, s: [0.72, 1, 1], ry: PI, parent: boat });
		k.box(1.6, 0.3, 5.8, 0x8a6a48, { y: 0.4, parent: boat });
		[-2, 2].forEach((z) => k.box(2.4, 0.6, 0.4, 0x6a5038, { y: 0.1, z, parent: boat }));
		k.cyl(0.06, 0.06, 4, 0x8a6a48, { y: 3, z: 0.8, parent: boat });
		k.person({ x: Z + 2.5, y: 0.5, z: 5, ry: -1.4, pose: "point", colors: { shirt: 0xe8e4d8, legs: 0x8a7a5a, hair: 0x5a4a3a } });
		k.person({ x: Z - 3.5, y: 0.66, z: 7, ry: 1.0, colors: { shirt: 0xb8a888, legs: 0x5a5040, hair: 0x6a6a6a, skin: 0x6a4630 }, hat: 0xd8c8a0 });
		// The plate-shop roof on a hot afternoon (x = -760): tar, a bucket, three cold bottles on the parapet.
		const P = -760;
		k.box(30, 0.4, 30, 0x2a2a2c, { x: P, y: -0.2, rough: 0.95 });
		k.box(30, 0.9, 0.6, 0x8a5a46, { x: P, y: 0.45, z: -3 });
		k.box(30, 0.12, 0.8, 0x9a948a, { x: P, y: 0.96, z: -3 });
		k.box(6, 0.02, 4, 0x111113, { x: P + 1, y: 0.01, z: 1, rough: 0.2, metal: 0.2 });
		const pail = k.group({ x: P + 2.2, z: 0.6 });
		k.cyl(0.3, 0.26, 0.55, 0x6a6a6e, { y: 0.28, parent: pail, metal: 0.6, rough: 0.4 });
		k.cyl(0.28, 0.28, 0.02, 0x0a0a0a, { y: 0.55, parent: pail, rough: 0.1 });
		rod(k, [P + 2.2, 0.5, 0.6], [P + 1.5, 1.6, 1.1], 0.03, 0x8a6a48);
		[[-0.9, 0.1], [-0.5, -0.05], [0.4, 0.12]].forEach(([x, z], i) => {
			const bt = k.group({ x: P + x, y: 1.02, z: -3 + z });
			k.cyl(0.07, 0.07, 0.36, 0x5a3010, { y: 0.18, parent: bt, rough: 0.2, metal: 0.2 });
			k.cyl(0.03, 0.06, 0.14, 0x5a3010, { y: 0.43, parent: bt, rough: 0.2 });
			k.box(0.13, 0.12, 0.005, 0xe8d8a0, { y: 0.18, z: 0.07, parent: bt });
			if (i === 2) k.cyl(0.035, 0.035, 0.02, 0xc8c8c8, { y: 0.51, parent: bt, metal: 0.7 });
		});
		k.box(0.5, 0.06, 0.3, 0x3a5a7a, { x: P - 1.6, y: 1.05, z: -3, ry: 0.3 });
		k.box(2, 0.5, 2, 0x5a5a5e, { x: P - 5, y: 0.25, z: 3 });
		k.cyl(0.15, 0.15, 2.4, 0x6a6a6e, { x: P - 5, y: 1.4, z: 3, metal: 0.5 });
		trees(k, 24, [P - 60, P + 60, -90, -40], { h: 10, color: 0x3a5a30 });
		k.point(0xfff0d0, 4, 12, { x: P + 1, y: 3, z: 2 });
		// The storm, the creek and the pipe (x = 400).
		const R = 400;
		k.ground(120, 0x3a3a2a, { x: R, y: 0, bump: 0.4, seg: 40, height: (x) => Math.min(0, Math.abs(x) - 5) * 0.3 });
		k.water(60, 0x2a3640, { x: R, y: -0.8, seg: 20, amp: 0.08 });
		k.cyl(0.95, 0.95, 7, 0x6a6a64, { x: R + 8, y: 0.3, z: 0, rz: PI / 2, open: true, seg: 14, side: k.THREE.DoubleSide, metal: 0.4, rough: 0.6 });
		k.cyl(0.8, 0.8, 0.05, 0x050505, { x: R + 5, y: 0.3, z: 0, rz: PI / 2, seg: 14 });
		k.box(0.5, 0.06, 1.0, 0x5a4a28, { x: R + 4.75, y: -0.42, z: 0, rough: 0.2 });
		rod(k, [R + 4.6, -0.42, 0], [R + 3.9, -0.85, 0.1], 0.32, 0x5a4a28, { opacity: 0.85, rough: 0.2 });
		k.cyl(0.9, 0.9, 0.05, 0x8a7a50, { x: R + 3.8, y: -0.78, z: 0.1, opacity: 0.6, seg: 14 });
		const andy = k.person({ x: R - 1, y: -1.05, z: 1, ry: 0.3, pose: "arms-out", colors: { shirt: 0xd8b090, legs: 0x8a8a7a, hair: 0x3a2a1a, skin: 0xd8b090 }, from: 5 });
		andy.userData.limbs.armL.rotation.z = -2.5;
		andy.userData.limbs.armR.rotation.z = 2.5;
		andy.userData.limbs.head.rotation.x = -0.55;
		trees(k, 40, [R - 50, R + 50, -40, 40], { h: 9, color: 0x1a2a20, trunk: 0x2a2018, avoid: (x) => Math.abs(x - R) < 12 });
		const far = k.group({ x: R - 10, z: -90 });
		k.box(40, 18, 10, 0x1a1c22, { y: 9, parent: far });
		[-1, 1].forEach((s) => k.box(5, 28, 5, 0x1a1c22, { x: s * 6, y: 14, parent: far }));
		for (let i = 0; i < 12; i++) k.glow(0xffd890, 1.5, { x: -18 + i * 3.2, y: 6 + (i % 3) * 3, z: 5.2, parent: far, fog: true });
		const beam = k.spot(0xe8f0ff, 60, { x: R - 4, y: 26, z: -86, target: [R, 0, 0], angle: 0.12, distance: 140 });
		k.tick((t) => beam.target.position.set(R + Math.sin(t * 0.5) * 20, 0, Math.cos(t * 0.5) * 10));
		k.point(0x9ab0d0, 4, 30, { x: R - 4, y: 6, z: 8 });
		const flash = k.point(0xd8e4ff, 0, 200, { x: R, y: 40, z: 10 });
		k.tick((t) => (flash.intensity = Math.sin(t * 1.3) > 0.93 ? 60 : 0));
		rain(k, 2500, { box: [16, 12, 16], x: R, y: -1, z: 2, speed: 18, len: 0.4, opacity: 0.45 });
		return {
			shots: [
				{ pos: [P + 0.3, 1.55, -1.4], look: [P - 0.4, 1.05, -3.2], fov: 42, fog: [0xc4ccd0, 30, 160] },
				{ pos: [Z - 4, 2.2, 13], look: [Z, 1.0, 3], fov: 50, fog: [0xa8d8ee, 40, 240], exposure: 1.1 },
				{ pos: [16, 2.4, 30], look: [0, 12, -40], fov: 55 },
				{ pos: [200.45, 1.62, 0.55], look: [200.12, 1.12, -0.02], fov: 40, fog: [0x241a12, 2, 14] },
				{ pos: [C + 0.6, 1.55, 0.1], look: [C - 0.1, 1.4, -1.8], fov: 45, fog: [0x2a2a28, 3, 20] },
				{ pos: [R - 2.3, -0.35, 3.4], look: [R - 1, 1.3, 1], fov: 55, fog: [0x1e2832, 8, 120], exposure: 1.3 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the bride
	r100: (k) => {
		k.fog(0x3a2418, 30, 140);
		k.sky(0x1a1018, 0x4a2a1a);
		k.light({ sky: 0xffe0c0, ground: 0x4a2a18, hemi: 1.2, sunColor: 0xffe8d0, sunIntensity: 1.4, sunPos: [10, 40, 20], shadowSize: 30 });
		const yellow = 0xf2c414;
		const bride = (o) => {
			const p = k.person({ ...o, colors: { shirt: yellow, legs: yellow, hair: 0xe8c870, skin: 0xf0d0b0 } });
			const { legL, legR, armL, armR } = p.userData.limbs;
			[legL, legR].forEach((l, i) => k.box(0.03, 0.85, 0.21, 0x111111, { x: i ? 0.09 : -0.09, y: -0.42, parent: l }));
			[armL, armR].forEach((a, i) => k.box(0.03, 0.7, 0.17, 0x111111, { x: i ? 0.07 : -0.07, y: -0.35, parent: a }));
			k.box(0.04, 0.7, 0.29, 0x111111, { x: -0.25, y: 1.2, parent: p });
			k.box(0.04, 0.7, 0.29, 0x111111, { x: 0.25, y: 1.2, parent: p });
			return p;
		};
		const goon = (o) => {
			const p = k.person({ ...o, shades: true, colors: { shirt: 0x0c0c0e, legs: 0x0c0c0e, hair: 0x14100c, skin: 0xe0c0a0 } });
			k.box(0.08, 0.4, 0.29, 0xf0f0f0, { y: 1.3, parent: p });
			return p;
		};
		// The House of Blue Leaves (origin): wooden hall, balcony, lanterns, the dance floor.
		k.box(40, 0.3, 40, 0x8a5a30, { y: -0.15, rough: 0.4 });
		const tile = k.canvas(256, 256, (g) => {
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
				g.fillStyle = (x + y) % 2 ? "#f0e8d8" : "#c8b898";
				g.fillRect(x * 64, y * 64, 64, 64);
			}
		});
		k.box(12, 0.1, 12, k.mat(0xffffff, { map: tile, emissive: 0x3a3020, rough: 0.3 }), { y: 0.05 });
		k.box(40, 10, 0.4, 0x4a2a18, { y: 5, z: -20 });
		[-1, 1].forEach((s) => k.box(0.4, 10, 40, 0x4a2a18, { x: s * 20, y: 5 }));
		k.box(40, 0.4, 6, 0x5a3420, { y: 4.5, z: -17 });
		k.box(40, 1, 0.15, 0xa02018, { y: 5.2, z: -14 });
		for (let x = -18; x <= 18; x += 4) k.box(0.4, 4.3, 0.4, 0x3a2010, { x, y: 2.15, z: -14.2 });
		const shoji = k.canvas(256, 128, (g, w, h) => {
			g.fillStyle = "#f4e8c8";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#3a2010";
			g.lineWidth = 4;
			for (let x = 0; x <= w; x += 32) g.strokeRect(x, 0, 32, h);
			g.beginPath();
			g.moveTo(0, h / 2);
			g.lineTo(w, h / 2);
			g.stroke();
		});
		k.box(38, 3.5, 0.1, k.mat(0xffffff, { map: shoji, emissive: 0x8a6a40, glow: 0.6 }), { y: 7.2, z: -19.7 });
		for (let i = 0; i < 12; i++) {
			const x = -16.5 + i * 3;
			k.cyl(0.4, 0.4, 0.8, 0xd83a2a, { x, y: 8, z: -12, emissive: 0x801a10, glow: 0.8 });
			k.cyl(0.4, 0.4, 0.8, 0x3a6ad8, { x, y: 8, z: 0, emissive: 0x102a80, glow: 0.8 });
		}
		k.point(0xffd8a0, 6, 40, { x: 0, y: 8, z: 0 });
		k.point(0xffc080, 4, 30, { x: -10, y: 6, z: 8 });
		const b = bride({ x: 0, z: 0, ry: 0.4, pose: "raise" });
		blade(k, b.userData.limbs.armR, { len: 1.1 });
		const r = rng(88);
		for (let i = 0; i < 14; i++) {
			const a = (i / 14) * PI * 2;
			const d = 3.2 + r() * 2;
			const g = goon({ x: Math.sin(a) * d, z: Math.cos(a) * d, ry: a + PI, pose: r() > 0.5 ? "point" : "stand" });
			if (g.userData.limbs.armR.rotation.x !== 0) blade(k, g.userData.limbs.armR, { len: 0.9 });
		}
		// Hattori Hanzo's sushi counter in Okinawa (x = 200): pale wood, a few pieces, a sake cup.
		const F = 200;
		k.box(8, 0.2, 8, 0x3a2a1c, { x: F, y: -0.1 });
		k.box(5, 1.0, 0.9, 0xd8b888, { x: F, y: 0.5, z: 0, rough: 0.5 });
		k.box(5.2, 0.08, 1.1, 0xe8cc9c, { x: F, y: 1.04, z: 0, rough: 0.4 });
		k.box(5, 0.4, 0.5, 0xd0b080, { x: F, y: 1.28, z: -0.5, rough: 0.5 });
		k.box(5, 0.03, 0.55, 0xe0c494, { x: F, y: 1.5, z: -0.5, rough: 0.4 });
		const geta = k.group({ x: F - 0.2, y: 1.08, z: 0.1, ry: 0.15 });
		k.box(0.9, 0.04, 0.4, 0xb08850, { y: 0.06, parent: geta });
		[-0.35, 0.35].forEach((x) => k.box(0.06, 0.06, 0.4, 0x8a6a40, { x, y: 0.01, parent: geta }));
		[[-0.25, 0xe86a4a], [0, 0xf0a070], [0.25, 0xd84040]].forEach(([x, c]) => {
			k.box(0.18, 0.08, 0.1, 0xf8f6f0, { x, y: 0.12, parent: geta });
			k.box(0.2, 0.03, 0.11, c, { x, y: 0.175, parent: geta, rough: 0.3 });
		});
		k.box(0.12, 0.05, 0.08, 0x9ac060, { x: 0.38, y: 0.11, z: 0.08, parent: geta });
		k.cyl(0.06, 0.05, 0.08, 0xf4f0e4, { x: F + 0.6, y: 1.12, z: 0.15 });
		k.cyl(0.08, 0.06, 0.26, 0xf4f0e4, { x: F + 0.85, y: 1.21, z: -0.05, seg: 10 });
		k.box(0.25, 0.006, 0.02, 0x8a6a40, { x: F - 0.85, y: 1.09, z: 0.25, ry: 0.4 });
		k.box(0.25, 0.006, 0.02, 0x8a6a40, { x: F - 0.85, y: 1.09, z: 0.29, ry: 0.35 });
		k.box(8, 4, 0.2, 0x6a4a30, { x: F, y: 2, z: -2.4 });
		const noren = k.canvas(256, 128, (g, w, h) => {
			g.fillStyle = "#1a2a5a";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#f0e8d8";
			g.beginPath();
			g.arc(w / 2, h / 2, 26, 0, PI * 2);
			g.fill();
			g.fillStyle = "#1a2a5a";
			for (let x = 0; x < w; x += 64) g.fillRect(x + 62, 0, 4, h);
		});
		k.plane(2.4, 1.1, k.mat(0xffffff, { map: noren }), { x: F + 1.4, y: 2.6, z: -2.28 });
		for (let i = 0; i < 4; i++) k.box(0.5, 0.1, 0.2, 0x8a5a30, { x: F - 1.8 + i * 0.55, y: 2.2, z: -2.2 });
		k.point(0xffe8c8, 1.5, 10, { x: F, y: 3, z: 1.5 });
		k.spot(0xfff0d0, 9, { x: F + 1, y: 3.5, z: 1.5, target: [F, 1.1, 0], angle: 0.5, distance: 9 });
		// The sword maker's attic (x = -200): katanas on a rack.
		const A = -200;
		k.box(6, 0.2, 5, 0x6a4a2a, { x: A, y: -0.1 });
		k.box(6, 4, 0.2, 0x8a6a48, { x: A, y: 2, z: -1.5 });
		k.box(2.6, 0.12, 0.6, 0x2a1810, { x: A, y: 0.8, z: -0.9 });
		k.box(2.6, 0.7, 0.5, 0x2a1810, { x: A, y: 0.35, z: -0.9 });
		const rack = k.group({ x: A, y: 0.86, z: -1.0 });
		[-1, 1].forEach((s) => k.box(0.12, 1.1, 0.3, 0x1a0e08, { x: s * 0.9, y: 0.55, parent: rack, rough: 0.3 }));
		[0.4, 0.85].forEach((y, i) => {
			const sw = k.group({ y, z: 0.05, rz: 0.03, parent: rack });
			const drawn = i === 1;
			k.box(drawn ? 0.75 : 1.5, 0.06, 0.04, 0x0a0a0c, { x: drawn ? 0.62 : 0.25, parent: sw, rough: 0.2, metal: 0.3 });
			if (drawn) k.box(0.75, 0.045, 0.012, 0xeef2f8, { x: -0.13, parent: sw, metal: 0.95, rough: 0.12 });
			if (drawn) k.box(0.75, 0.012, 0.014, 0xffffff, { x: -0.13, y: -0.02, parent: sw, emissive: 0x8a8a90 });
			k.cyl(0.06, 0.06, 0.02, 0xc8a040, { x: drawn ? -0.52 : -0.51, rz: PI / 2, parent: sw, metal: 0.8, rough: 0.3 });
			k.box(0.48, 0.05, 0.036, 0x1a1a1a, { x: -0.77, parent: sw });
			for (let j = 0; j < 6; j++) k.box(0.025, 0.055, 0.04, 0xe8e0d0, { x: -0.97 + j * 0.08, parent: sw, rz: 0.6 });
		});
		k.point(0xffe0b0, 3, 6, { x: A + 1, y: 2.4, z: 1 });
		k.glow(0xfff0d0, 1.2, { x: A - 2.5, y: 3, z: -1.3 });
		// The yellow truck in the hospital garage (x = 400).
		const T = 400;
		k.box(30, 0.2, 20, 0x5a5a5c, { x: T, y: -0.1 });
		k.box(30, 0.4, 20, 0x6a6a6c, { x: T, y: 4.2 });
		for (let x = -12; x <= 12; x += 8) k.box(0.8, 4, 0.8, 0x8a8a88, { x: T + x, y: 2, z: -4 });
		for (let x = -12; x <= 12; x += 6) {
			k.box(2.4, 0.06, 0.3, 0xffffff, { x: T + x, y: 3.97, z: 2, emissive: 0xe8fff0 });
			k.point(0xe8fff0, 2, 10, { x: T + x, y: 3.6, z: 2 });
		}
		for (let x = -14; x <= 14; x += 3) k.box(0.1, 0.01, 4, 0xe8e8d0, { x: T + x, y: 0.005, z: -1 });
		const truck = k.group({ x: T, z: 0, ry: -0.35 });
		const flames = k.canvas(512, 128, (g, w, h) => {
			g.fillStyle = "#f2c414";
			g.fillRect(0, 0, w, h);
			for (let i = 0; i < 9; i++) {
				const y = 20 + (i % 3) * 30;
				[["#d8281a", 0], ["#f28a1a", 10]].forEach(([c, d]) => {
					g.fillStyle = c;
					g.beginPath();
					g.moveTo(0, y - 14 + d);
					g.quadraticCurveTo(140 + i * 20 - d * 3, y - 30, 220 + i * 18 - d * 4, y + d);
					g.quadraticCurveTo(140 + i * 10, y + 20, 0, y + 22 - d);
					g.fill();
				});
			}
		});
		const fm = k.mat(0xffffff, { map: flames, rough: 0.35 });
		k.box(5.6, 1.0, 2.2, yellow, { y: 0.9, rough: 0.35, parent: truck });
		[-1, 1].forEach((s) => k.plane(5.6, 1.0, fm, { y: 0.9, z: s * 1.105, ry: s > 0 ? 0 : PI, s: [s, 1, 1], parent: truck }));
		k.box(2.0, 1.0, 2.0, yellow, { x: 0.3, y: 1.9, rough: 0.35, parent: truck });
		k.box(1.8, 0.75, 2.05, 0x1a2a3a, { x: 0.3, y: 1.95, rough: 0.1, metal: 0.5, parent: truck });
		k.box(0.05, 0.75, 1.9, 0x2a3a4a, { x: 1.31, y: 1.95, rough: 0.1, metal: 0.5, parent: truck });
		k.box(2.4, 0.5, 2.25, 0xc8c8c8, { x: -1.6, y: 1.65, opacity: 0.0, parent: truck });
		k.box(0.1, 0.5, 2.2, yellow, { x: -2.75, y: 1.6, parent: truck });
		k.box(0.2, 0.3, 2.3, 0xd8d8d8, { x: 2.85, y: 0.6, metal: 0.8, rough: 0.2, parent: truck });
		[-1, 1].forEach((s) => k.glow(0xfff8e0, 0.6, { x: 2.82, y: 1.05, z: s * 0.8, parent: truck }));
		[-1.8, 1.8].forEach((x) => [-1, 1].forEach((s) => k.cyl(0.42, 0.42, 0.3, 0x111111, { x, y: 0.42, z: s * 1.05, rx: PI / 2, parent: truck })));
		// The silhouette fight against blue (x = -400).
		const Q = -400;
		const grid = k.canvas(512, 256, (g, w, h) => {
			g.fillStyle = "#2a64e8";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#0a1a60";
			g.lineWidth = 5;
			for (let x = 0; x <= w; x += 64) g.strokeRect(x, 0, 64, h);
			for (let y = 0; y <= h; y += 64) g.strokeRect(0, y, w, 64);
		});
		k.plane(40, 20, new k.THREE.MeshBasicMaterial({ map: grid, fog: false }), { x: Q, y: 8, z: -10 });
		k.box(40, 0.2, 20, 0x050510, { x: Q, y: -0.1, rough: 0.2, metal: 0.5 });
		const black = { shirt: 0x020204, legs: 0x020204, hair: 0x020204, skin: 0x020204 };
		const poses = [["raise", 0.4], ["run", -1.3], ["point", 1.4], ["arms-out", 0.2], ["run", 1.9], ["lean", -0.2], ["point", -1.6]];
		poses.forEach(([pose, ry], i) => {
			const p = k.person({ x: Q - 7 + i * 2.3, y: 0, z: -2 + (i % 2) * 0.8, ry, pose, colors: black, hair: false });
			if (pose === "raise" || pose === "point") blade(k, p.userData.limbs.armR, { len: 1.1, color: 0x020204, grip: 0x020204, guard: 0x020204 });
		});
		// The snowy garden (z = 300).
		const G = 300;
		k.box(60, 0.4, 60, 0xeef2f8, { y: -0.2, z: G });
		k.cyl(5, 5, 0.1, 0x1a2a3a, { x: -6, y: 0.02, z: G - 4, rough: 0.1, seg: 20, s: [1.4, 1, 1] });
		const toro = k.group({ x: 5, z: G - 6 });
		k.cyl(0.35, 0.45, 0.4, 0x7a7a78, { y: 0.2, seg: 6, parent: toro });
		k.cyl(0.15, 0.15, 1.0, 0x7a7a78, { y: 0.9, seg: 6, parent: toro });
		k.box(0.9, 0.7, 0.9, 0x6a6a68, { y: 1.75, parent: toro });
		k.glow(0xffd890, 1.4, { y: 1.75, parent: toro });
		k.cone(0.95, 0.5, 0xeef2f8, { y: 2.35, seg: 6, parent: toro });
		k.point(0xffc880, 5, 10, { x: 5, y: 1.8, z: G - 5 });
		const tree = k.group({ x: -3, z: G - 11 });
		k.cyl(0.25, 0.4, 4, 0x2a1a14, { y: 2, rz: 0.2, parent: tree });
		[0.8, -0.7, 1.4].forEach((rz, i) => k.cyl(0.08, 0.15, 3, 0x2a1a14, { x: Math.sin(rz) * -1.2, y: 4 + i * 0.4, rz, parent: tree }));
		k.box(20, 4, 0.5, 0x2a1810, { y: 2, z: G - 16 });
		roof(k, 1.5, 20, 0.8, 0x1a1a1e, { y: 4, z: G - 16, ry: PI / 2 });
		const o = k.person({ x: 1.2, z: G, ry: -PI / 2, dress: 0xf4f0ea, coat: 0xf4f0ea, colors: { shirt: 0xf4f0ea, legs: 0xf4f0ea, hair: 0x050505, skin: 0xf0d8c8 }, pose: "point" });
		blade(k, o.userData.limbs.armR, { len: 1.0 });
		const b2 = bride({ x: -1.4, z: G, ry: PI / 2, pose: "point" });
		blade(k, b2.userData.limbs.armR, { len: 1.1 });
		k.particles(2000, 0xffffff, { box: [30, 14, 26], z: G - 4, speed: 1.2, size: 0.05, drift: 0.6 });
		k.point(0xb8c8ff, 4, 60, { x: 0, y: 12, z: G + 6 });
		return {
			shots: [
				{ pos: [F + 1.0, 1.65, 1.5], look: [F - 0.1, 1.15, -0.2], fov: 44, fog: [0x2a1810, 4, 16] },
				{ pos: [A + 0.1, 1.95, 0.6], look: [A - 0.1, 1.6, -1], fov: 42, fog: [0x2a1a10, 3, 15] },
				{ pos: [T + 7, 1.6, 6], look: [T, 1.2, 0], fov: 45, fog: [0x2a2c2c, 10, 60] },
				{ pos: [Q, 1.8, 9], look: [Q, 2.4, -2], fov: 50, fog: [0x050510, 30, 80] },
				{ pos: [-0.2, 2.2, G + 7], look: [0, 1.3, G - 3], fov: 50, fog: [0x1a2840, 12, 50], exposure: 1.2 },
				{ pos: [1.6, 3.4, 5.8], look: [0, 1.4, 0], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the sword and the bamboo
	r101: (k) => {
		k.fog(0x1c2236, 40, 220);
		k.sky(0x0e1430, 0x3a3a5a);
		k.light({ sky: 0xb8c8f0, ground: 0x2a2028, hemi: 1.3, sunColor: 0xc8d8ff, sunIntensity: 1.3, sunPos: [-30, 50, 40], shadowSize: 50 });
		const tiles = 0x464c58;
		const wood = 0x6a2a20;
		// Peking at night (origin): rows of halls with grey tiled roofs, a courtyard, red lanterns.
		k.box(120, 0.2, 120, 0x4a4a52, { y: -0.1 });
		const halls = [];
		for (const z of [-32, -16, 0, 16]) for (const x of [-24, 0, 24]) halls.push([x, z]);
		halls.forEach(([x, z], i) => {
			k.box(18, 3.6, 6, i % 2 ? 0x7a3a2a : 0x6a3426, { x, y: 1.8, z });
			k.box(18.2, 0.4, 6.2, 0x3a2420, { x, y: 3.5, z });
			roof(k, 7.8, 19.5, 2.4, tiles, { x, y: 3.6, z, ry: PI / 2 });
			k.box(19.6, 0.3, 0.3, 0x2a2c34, { x, y: 6.05, z });
			for (let p = -8; p <= 8; p += 4) k.box(0.3, 3.6, 0.3, wood, { x: x + p, y: 1.8, z: z + 3.1 });
			k.box(2, 2.6, 0.1, 0x2a1810, { x, y: 1.3, z: z + 3.02 });
			[-6, 6].forEach((p) => {
				k.sphere(0.35, 0xd83020, { x: x + p, y: 2.8, z: z + 3.5, s: [1, 1.2, 1], emissive: 0xa01808, glow: 1 });
				k.glow(0xff6030, 1.6, { x: x + p, y: 2.8, z: z + 3.5, fog: true });
			});
		});
		k.point(0xff8040, 6, 20, { x: 0, y: 3, z: 6 });
		k.point(0xff8040, 4, 20, { x: 0, y: 3, z: -10 });
		k.disc(0xf4f0dc, 14, { x: -40, y: 50, z: -160, tag: "sky" });
		k.glow(0xd8e0ff, 70, { x: -40, y: 50, z: -162, tag: "sky", opacity: 0.6 });
		const jen = k.person({ x: 1, y: 5.95, z: 0, ry: 0.4, pose: "hunch", colors: { shirt: 0x14141a, legs: 0x14141a, hair: 0x0a0a0a, skin: 0xe8c8a8 } });
		jen.userData.limbs.legL.rotation.x = -0.9;
		jen.userData.limbs.legR.rotation.x = 0.2;
		const leap = k.person({ x: -11.8, y: 7.4, z: 16, ry: 1.5, pose: "run", colors: { shirt: 0x14141a, legs: 0x14141a, hair: 0x0a0a0a, skin: 0xe8c8a8 }, from: 3 });
		leap.userData.limbs.armL.rotation.z = -1.2;
		leap.userData.limbs.armR.rotation.z = 1.0;
		const shu = k.person({ x: -17, y: 6.0, z: 16, ry: 1.5, pose: "run", colors: { shirt: 0x5a7a8a, legs: 0x3a4a5a, hair: 0x0a0a0a, skin: 0xe8c8a8 }, from: 3 });
		void shu;
		k.point(0xc8d4ff, 8, 30, { x: -12, y: 12, z: 22, from: 3 });
		// A tea table in the governor's house (x = 200): a pot, two cups and a girl's hair comb.
		const W = 200;
		k.box(6, 0.2, 5, 0x3a2a20, { x: W, y: -0.1 });
		k.box(3, 0.1, 1.5, 0x5a2016, { x: W, y: 0.95, rough: 0.35 });
		k.box(2.8, 0.9, 1.4, 0x3a140e, { x: W, y: 0.45 });
		const tea = 0xe8ecf0;
		k.sphere(0.2, tea, { x: W - 0.75, y: 1.17, z: -0.15, s: [1, 0.8, 1], rough: 0.25 });
		k.cyl(0.07, 0.09, 0.06, tea, { x: W - 0.75, y: 1.34, z: -0.15, rough: 0.25 });
		rod(k, [W - 0.58, 1.14, -0.1], [W - 0.42, 1.26, -0.05], 0.025, tea);
		k.torus(0.1, 0.02, tea, { x: W - 0.95, y: 1.18, z: -0.18, ry: 0.3, seg: 12 });
		for (let i = 0; i < 6; i++) k.box(0.05, 0.02, 0.03, 0x2a5aa8, { x: W - 0.75 + Math.cos(i) * 0.19, y: 1.18, z: -0.15 + Math.sin(i) * 0.19, ry: -i });
		[[-0.3, 0.25], [-0.05, 0.38]].forEach(([x, z]) => {
			k.cyl(0.07, 0.05, 0.08, tea, { x: W + x, y: 1.04, z, rough: 0.25 });
			k.cyl(0.062, 0.062, 0.005, 0x9a7a3a, { x: W + x, y: 1.075, z });
		});
		const comb = k.group({ x: W + 0.42, y: 1.015, z: 0.12, ry: -0.5 });
		k.cyl(0.2, 0.2, 0.025, 0x2a1a10, { parent: comb, seg: 20, s: [1, 1, 0.55], rough: 0.3 });
		k.box(0.42, 0.026, 0.12, 0x5a2016, { z: 0.07, parent: comb, rough: 0.35 });
		for (let i = 0; i < 13; i++) k.box(0.012, 0.02, 0.1, 0xe8dcc0, { x: -0.18 + i * 0.03, y: 0.002, z: 0.1, parent: comb });
		[-0.08, 0, 0.08].forEach((x, i) => k.sphere(0.022, i === 1 ? 0x3aa060 : 0xd8b040, { x, y: 0.02, z: -0.04, parent: comb, metal: 0.4, rough: 0.3 }));
		k.box(4, 3, 0.2, 0x5a2a1a, { x: W, y: 1.5, z: -1.2 });
		const scroll = k.canvas(128, 256, (g, w, h) => {
			g.fillStyle = "#efe4c8";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#3a3a3a";
			g.lineWidth = 3;
			g.beginPath();
			g.moveTo(10, 200);
			g.quadraticCurveTo(50, 150, 40, 90);
			g.quadraticCurveTo(70, 60, 118, 70);
			g.stroke();
			g.fillStyle = "#3a5a3a";
			for (let i = 0; i < 8; i++) g.fillRect(20 + i * 11, 110 - i * 6, 8, 3);
		});
		k.plane(0.7, 1.4, k.mat(0xffffff, { map: scroll }), { x: W + 1.1, y: 1.8, z: -1.09 });
		k.spot(0xfff0d0, 25, { x: W - 0.6, y: 3, z: 1.6, target: [W, 1.1, 0], angle: 0.45, distance: 9 });
		k.point(0xffc890, 2, 6, { x: W + 1, y: 2, z: 1 });
		// The desert and the bandit (x = -200).
		const D = -200;
		k.ground(300, 0xd8a868, { x: D, bump: 0.6, seg: 50, height: (x, z) => Math.sin(x * 0.08) * 2.5 + Math.cos(z * 0.06 + x * 0.03) * 2 + (z < -30 ? (-30 - z) * 0.08 : 0) });
		const h = horse(k, { x: D, y: 2.0, z: 0, ry: -1.1, color: 0x2a1a12 });
		h.rotation.x = -0.04;
		const lo = k.person({ x: 0, y: 0.95, z: 0.0, pose: "sit", parent: h, colors: { shirt: 0x5a3a24, legs: 0x3a2a1a, hair: 0x0a0a0a, skin: 0xc89870 }, coat: 0x6a5a48 });
		lo.userData.limbs.legL.rotation.set(-1.2, 0, -0.5);
		lo.userData.limbs.legR.rotation.set(-1.2, 0, 0.5);
		lo.userData.limbs.armR.rotation.x = -2.6;
		k.particles(300, 0xe8c890, { box: [8, 2, 8], x: D, y: 2.4, speed: 0.6, size: 0.12, opacity: 0.5, drift: 2 });
		// The bamboo forest (x = 400).
		const Bm = 400;
		k.ground(140, 0x4a5a2a, { x: Bm, bump: 0.5, seg: 30 });
		const rr = rng(12);
		const stalk = (x, z, H, o = {}) => {
			const g = k.group({ x, z, rz: o.rz ?? (rr() - 0.5) * 0.12, rx: o.rx ?? (rr() - 0.5) * 0.12 });
			k.cyl(0.11, 0.14, H, 0x7aa040, { y: H / 2, parent: g, seg: 6 });
			for (let n = 3; n < H; n += 3.5) k.cyl(0.13, 0.13, 0.08, 0x5a7a2a, { y: n, parent: g, seg: 6 });
			for (let l = 0; l < (o.leaves ?? 4); l++) {
				const a = rr() * PI * 2;
				const c = [0x6aaa44, 0x7ab84a, 0x5a9a3a][l % 3];
				k.ico(0.7 + rr() * 0.3, c, { x: Math.cos(a) * 0.7, y: H - 1.0 - l * 1.2, z: Math.sin(a) * 0.7, ry: a, rz: (rr() - 0.5) * 0.8, s: [1.8, 0.28, 0.7], emissive: 0x1a3a0a, parent: g });
			}
			return g;
		};
		for (let i = 0; i < 220; i++) {
			const x = Bm + (rr() - 0.5) * 70;
			const z = (rr() - 0.5) * 70;
			if (Math.abs(x - Bm) < 4 && Math.abs(z) < 4) continue;
			if (Math.abs(x - Bm) < 3 && z > 4 && z < 24) continue;
			stalk(x, z, 11 + rr() * 5);
		}
		const hero1 = stalk(Bm - 1.6, 0, 12.5, { rz: 0.1, rx: 0, leaves: 2 });
		const hero2 = stalk(Bm + 1.8, -0.8, 12, { rz: -0.12, rx: 0, leaves: 2 });
		const mu = k.person({ y: 12.5, ry: 1.2, pose: "point", parent: hero1, colors: { shirt: 0xe8e4d8, legs: 0xd8d4c8, hair: 0x1a1a1a, skin: 0xe0b890 }, coat: 0xe8e4d8 });
		blade(k, mu.userData.limbs.armR, { len: 1.1 });
		const jen2 = k.person({ y: 12, ry: -1.9, pose: "raise", parent: hero2, colors: { shirt: 0xd8e8d8, legs: 0xc8d8c8, hair: 0x0a0a0a, skin: 0xe8c8a8 } });
		blade(k, jen2.userData.limbs.armR, { len: 1.0 });
		k.point(0xf0ffe0, 4, 60, { x: Bm + 4, y: 22, z: 8 });
		k.spot(0xfff8d8, 40, { x: Bm - 8, y: 30, z: 10, target: [Bm, 0, 4], angle: 0.25, distance: 60 });
		return {
			shots: [
				{ pos: [W + 0.35, 1.75, 1.45], look: [W - 0.15, 1.1, 0.0], fov: 40, fog: [0x1a0e0a, 3, 14] },
				{ pos: [D + 8, 3.6, 10], look: [D, 2.6, 0], fov: 45, fog: [0xe8c088, 30, 180], exposure: 1.05 },
				{ pos: [-1.5, 2.4, 12.5], look: [0.8, 6.2, 0], fov: 34, exposure: 1.2 },
				{ pos: [-14, 9.5, 28], look: [-12.5, 6.8, 16], fov: 45, exposure: 1.3 },
				{ pos: [Bm, 1.6, 22], look: [Bm, 9, 0], fov: 60, fog: [0xa8c0a0, 12, 70], exposure: 1.1 },
				{ pos: [Bm + 3.6, 14.9, 5.2], look: [Bm, 13.4, -0.4], fov: 50, fog: [0xc0d4bc, 14, 90], exposure: 1.1 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the creatures at Christmas
	r102: (k) => {
		k.fog(0x2a3450, 30, 160);
		k.sky(0x0a1028, 0x3a4468);
		k.light({ sky: 0xc8d4ff, ground: 0x4a5060, hemi: 1.35, sunColor: 0xd0dcff, sunIntensity: 1.1, sunPos: [-20, 40, 30], shadowSize: 50 });
		const snow = 0xe8eef6;
		const car = (x, z, ry, color) => {
			const g = k.group({ x, z, ry });
			k.box(1.9, 0.75, 4.6, color, { y: 0.65, parent: g, rough: 0.4 });
			k.box(1.7, 0.6, 2.4, color, { y: 1.3, z: -0.3, parent: g, rough: 0.4 });
			k.box(1.72, 0.45, 2.2, 0x1a2230, { y: 1.32, z: -0.3, parent: g, rough: 0.1 });
			k.box(1.6, 0.08, 2.2, snow, { y: 1.64, z: -0.3, parent: g });
			[-1.5, 1.5].forEach((zz) => [-1, 1].forEach((s) => k.cyl(0.34, 0.34, 0.25, 0x111111, { x: s * 0.9, y: 0.34, z: zz, rz: PI / 2, parent: g })));
			[-0.6, 0.6].forEach((xx) => k.glow(0xfff0c0, 0.5, { x: xx, y: 0.7, z: 2.32, parent: g }));
			return g;
		};
		const gremlin = (o) => {
			const g = k.group(o);
			const skin = 0x3e6a2a;
			k.ico(0.42, skin, { y: 0.75, s: [1, 1.15, 0.9], parent: g });
			k.ico(0.28, 0xb8a070, { y: 0.72, z: 0.18, s: [1, 1.2, 0.6], parent: g });
			[-1, 1].forEach((s) => {
				k.box(0.14, 0.45, 0.16, skin, { x: s * 0.2, y: 0.22, parent: g });
				k.box(0.12, 0.6, 0.12, skin, { x: s * 0.45, y: 0.65, z: 0.15, rz: s * 0.5, rx: -0.6, parent: g });
				k.cone(0.2, 1.0, skin, { x: s * 0.62, y: 1.48, rz: -s * (PI / 2 - 0.25), s: [1, 1, 0.35], seg: 4, parent: g });
				k.glow(0xff3010, 0.35, { x: s * 0.13, y: 1.42, z: 0.32, parent: g });
				k.sphere(0.07, 0xff3a10, { x: s * 0.13, y: 1.42, z: 0.27, emissive: 0xc01800, parent: g });
			});
			k.ico(0.38, skin, { y: 1.35, s: [1.1, 0.9, 1], parent: g });
			k.box(0.4, 0.1, 0.1, 0x3a0a0a, { y: 1.2, z: 0.31, parent: g });
			for (let i = 0; i < 6; i++) k.cone(0.025, 0.08, 0xf4f0e0, { x: -0.15 + i * 0.06, y: 1.22, z: 0.36, rx: PI, seg: 4, parent: g });
			for (let i = 0; i < 5; i++) k.cone(0.07, 0.35, 0xf4f4f4, { y: 1.68 - i * 0.02, z: 0.15 - i * 0.12, rx: -0.3 - i * 0.15, seg: 4, parent: g });
			return g;
		};
		// Snowy town square (origin): courthouse with clock tower, tree, shops, cars.
		k.box(140, 0.3, 140, snow, { y: -0.15 });
		const ch = k.group({ z: -26 });
		k.box(32, 10, 10, 0xd0c2a8, { y: 5, parent: ch });
		k.box(32.4, 0.4, 10.4, snow, { y: 10.2, parent: ch });
		for (let i = 0; i < 6; i++) k.cyl(0.4, 0.45, 8, 0xe8e0d0, { x: -6 + i * 2.4, y: 4, z: 6, parent: ch });
		k.box(15, 1, 2, 0xd8ccb8, { y: 8.5, z: 6, parent: ch });
		roof(k, 15.4, 2.2, 2.2, 0xd0c2a8, { y: 9, z: 6, ry: PI / 2, parent: ch });
		k.box(7, 9, 7, 0xd8ccb4, { y: 14.5, parent: ch });
		const clockTex = k.canvas(256, 256, (g) => {
			g.fillStyle = "#f8f0d8";
			g.beginPath();
			g.arc(128, 128, 124, 0, PI * 2);
			g.fill();
			g.strokeStyle = "#2a2018";
			g.lineWidth = 6;
			for (let i = 0; i < 12; i++) {
				const a = (i / 12) * PI * 2;
				g.beginPath();
				g.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100);
				g.lineTo(128 + Math.sin(a) * 118, 128 - Math.cos(a) * 118);
				g.stroke();
			}
			g.lineWidth = 10;
			g.beginPath();
			g.moveTo(128, 128);
			g.lineTo(128 + Math.sin(-0.02) * 60, 128 - Math.cos(-0.02) * 60);
			g.stroke();
			g.lineWidth = 6;
			g.beginPath();
			g.moveTo(128, 128);
			g.lineTo(128 + Math.sin(-0.21) * 100, 128 - Math.cos(-0.21) * 100);
			g.stroke();
		});
		const face = k.mat(0xffffff, { map: clockTex, emissive: 0xfff0c0, glow: 0.5 });
		k.plane(4.8, 4.8, face, { y: 15, z: 3.52, parent: ch });
		face.transparent = true;
		k.box(7.6, 0.5, 7.6, 0xb8aa90, { y: 19.2, parent: ch });
		k.sphere(3, 0xb8aa90, { y: 19.4, s: [1, 0.8, 1], parent: ch });
		k.cyl(0.08, 0.08, 3, 0x2a2a2a, { y: 23, parent: ch });
		for (let i = 0; i < 7; i++) k.box(1.4, 2.4, 0.1, 0xffd890, { x: -12 + i * 4, y: 6, z: 5.05, emissive: 0xffb040, glow: 0.7, parent: ch });
		const tree = k.group({ x: 0, z: -6 });
		k.cyl(0.4, 0.5, 1.5, 0x4a2a1a, { y: 0.75, parent: tree });
		[[3.6, 4, 2.6], [2.8, 3.4, 4.8], [1.9, 3, 6.8], [1.0, 2.2, 8.6]].forEach(([r, hh, y]) => k.cone(r, hh, 0x1f4a2a, { y, seg: 9, parent: tree }));
		const bulbs = [0xff3a3a, 0x3aa0ff, 0xffd83a, 0x3aff7a, 0xff8ad8];
		for (let i = 0; i < 40; i++) {
			const y = 1.6 + (i / 40) * 7.6;
			const r = 3.6 * (1 - (y - 1.4) / 8.6) + 0.15;
			const a = i * 2.4;
			k.glow(bulbs[i % 5], 0.7, { x: Math.sin(a) * r, y, z: Math.cos(a) * r, parent: tree });
		}
		k.glow(0xfff4c0, 2.4, { y: 9.9, parent: tree });
		k.point(0xffd8a0, 5, 22, { x: 0, y: 5, z: -2 });
		[-1, 1].forEach((s) => {
			for (let i = 0; i < 4; i++) {
				const z = -10 + i * 9;
				const hh = 6 + ((i * 3 + (s > 0 ? 2 : 0)) % 4);
				k.box(8, hh, 8, [0x8a4a3a, 0x6a5a4a, 0x9a7a5a, 0x5a6a7a][(i + (s > 0 ? 1 : 0)) % 4], { x: s * 22, y: hh / 2, z });
				k.box(8.2, 0.3, 8.2, snow, { x: s * 22, y: hh + 0.15, z });
				k.box(0.1, 2, 5, 0xffd890, { x: s * 17.95, y: 1.6, z, emissive: 0xffb050, glow: 0.8 });
				for (let b = 0; b < 8; b++) k.glow(bulbs[(b + i) % 5], 0.4, { x: s * 17.8, y: hh - 0.6 - Math.sin((b / 7) * PI) * 0.5, z: z - 3.5 + b, fog: true });
				k.point(0xffc880, 3, 10, { x: s * 16.5, y: 2.5, z });
			}
		});
		car(-9, 6, 0.2, 0x7a1a1a);
		car(10, -2, -0.3, 0x2a4a7a);
		car(4.5, 8, PI - 0.4, 0xd8c8a0);
		k.particles(2500, 0xffffff, { box: [60, 30, 60], speed: 1.6, size: 0.12, drift: 0.8 });
		const gr = gremlin({ x: 4.2, y: 1.05, z: 7.4, ry: 0.4, s: 1.1, from: 4 });
		void gr;
		gremlin({ x: -9.5, y: 1.8, z: 5.7, ry: 0.8, s: 0.9, from: 4 });
		gremlin({ x: 1.8, y: 0, z: 10.5, ry: -0.3, s: 0.9, from: 4 });
		// The kitchen clock nearly at midnight (x = 200).
		const K = 200;
		k.box(5, 3, 0.2, 0xc8d8c0, { x: K, y: 1.5, z: -1 });
		k.box(5, 0.9, 1.2, 0x8a6a48, { x: K, y: 0.45, z: -0.3 });
		k.box(5, 0.08, 1.2, 0xe8e0d0, { x: K, y: 0.94, z: -0.3 });
		k.cyl(0.45, 0.45, 0.08, 0x6a4a2a, { x: K + 0.4, y: 2.0, z: -0.88, rx: PI / 2, seg: 24 });
		k.plane(0.8, 0.8, k.mat(0xffffff, { map: clockTex, opacity: 1 }), { x: K + 0.4, y: 2.0, z: -0.835 });
		k.cyl(0.28, 0.24, 0.03, 0xf4f4f0, { x: K - 0.3, y: 1.0, z: -0.2, seg: 18 });
		[[-0.1, 0.4], [0.12, -0.3], [0.0, 1.2]].forEach(([dx, ry]) => {
			k.capsule(0.06, 0.16, 0xb8742a, { x: K - 0.3 + dx, y: 1.07, z: -0.2 + dx * 0.4, rz: PI / 2, ry, rough: 0.6 });
			k.cyl(0.015, 0.015, 0.08, 0xf0e8d8, { x: K - 0.3 + dx + Math.cos(ry) * 0.17, y: 1.07, z: -0.2 + dx * 0.4 - Math.sin(ry) * 0.17, rz: PI / 2, ry });
		});
		k.cyl(0.07, 0.06, 0.2, 0xd8f0ff, { x: K + 0.6, y: 1.08, z: -0.1, opacity: 0.45, rough: 0.1 });
		k.box(1.3, 1, 0.05, 0x1a2440, { x: K - 1.4, y: 2.0, z: -0.88 });
		k.point(0xffe0b0, 3, 8, { x: K, y: 2.6, z: 1 });
		// The curio shop (x = -200).
		const C = -200;
		k.box(8, 0.2, 6, 0x3a2418, { x: C, y: -0.1 });
		k.box(8, 4, 0.2, 0x4a1a14, { x: C, y: 2, z: -2.5 });
		[0.6, 1.4, 2.2, 3.0].forEach((y) => k.box(6, 0.06, 0.5, 0x2a1810, { x: C, y, z: -2.2 }));
		const rr = rng(31);
		for (let i = 0; i < 40; i++) {
			const sx = C - 2.8 + rr() * 5.6;
			const sy = [0.63, 1.43, 2.23, 3.03][i % 4];
			const hh = 0.15 + rr() * 0.3;
			k.cyl(0.06 + rr() * 0.08, 0.08 + rr() * 0.06, hh, [0xc8a040, 0x2a6a5a, 0xa83020, 0xe8e0c8, 0x3a4a8a][i % 5], { x: sx, y: sy + hh / 2, z: -2.15, metal: rr() > 0.6 ? 0.6 : 0, seg: 8 });
		}
		[-2, 0, 2].forEach((x) => {
			k.cyl(0.25, 0.25, 0.5, 0xc82a1a, { x: C + x, y: 3.3, z: 0, emissive: 0x801a08, glow: 1 });
			k.glow(0xff7030, 1.6, { x: C + x, y: 3.3, z: 0 });
		});
		k.box(3, 1, 0.8, 0x3a2014, { x: C, y: 0.5, z: -0.6 });
		k.box(0.8, 0.6, 0.6, 0x5a3a20, { x: C + 0.5, y: 1.3, z: -0.6 });
		k.box(0.9, 0.5, 0.7, 0x8a2a2a, { x: C + 0.5, y: 1.45, z: -0.6, rz: 0.03 });
		k.box(0.94, 0.05, 0.74, 0xc8a040, { x: C + 0.5, y: 1.72, z: -0.6 });
		k.person({ x: C - 0.9, z: -1.4, colors: { shirt: 0x2a2a3a, legs: 0x1a1a22, hair: 0xe8e8e8, skin: 0xd8b088 } });
		k.point(0xffa060, 5, 10, { x: C, y: 2.6, z: 1.5 });
		// The cocoons in the bedroom (x = 400).
		const P = 400;
		k.box(8, 0.2, 6, 0x5a4a3a, { x: P, y: -0.1 });
		k.box(8, 3.5, 0.2, 0x4a5a6a, { x: P, y: 1.75, z: -2.5 });
		k.box(2.4, 0.5, 2.2, 0x3a5a8a, { x: P - 2.5, y: 0.25, z: -1.2 });
		k.box(1.2, 1.4, 0.05, 0xb8c8e8, { x: P + 1.6, y: 2.0, z: -2.38, emissive: 0x4a5a8a });
		[[-0.6, 0.2, 0.2], [0.2, 0.0, -0.3], [0.9, 0.4, 0.5], [-1.4, -0.4, -0.2], [1.6, -0.6, 0.1], [-0.1, 0.9, 0.9]].forEach(([x, z, rz], i) => {
			k.ico(0.3 + (i % 2) * 0.06, 0x6a5a2a, { x: P + x, y: 0.3, z, rz: PI / 2 + rz, ry: rz * 3, rough: 0.2, metal: 0.15, s: [0.8, 1.4, 0.8], detail: 1, emissive: 0x1a2a08 });
			k.ico(0.12, 0x8a9a3a, { x: P + x, y: 0.42, z: z + 0.12, rough: 0.2, s: [1, 0.4, 1], detail: 1 });
			k.cyl(0.01, 0.01, 0.6, 0xc8d890, { x: P + x + 0.3, y: 0.15, z: z + 0.2, rz: 1.2, opacity: 0.6 });
		});
		k.point(0x9ad860, 3, 6, { x: P, y: 1.2, z: 1.2 });
		k.spot(0xa8c0ff, 18, { x: P + 1.6, y: 2.4, z: -1.5, target: [P, 0, 0.4], angle: 0.6, distance: 8 });
		// The little one (x = -400).
		const G = -400;
		k.box(8, 0.2, 6, 0x6a3a2a, { x: G, y: -0.1 });
		k.box(8, 4, 0.2, 0x8a3a30, { x: G, y: 2, z: -2.5 });
		k.box(2.4, 0.8, 1.4, 0x5a3a24, { x: G, y: 0.4, z: 0 });
		k.box(2.4, 0.06, 1.4, 0x2a5a3a, { x: G, y: 0.83, z: 0 });
		const t2 = k.group({ x: G + 2.2, z: -1.6 });
		[[1.2, 1.6, 1.0], [0.95, 1.4, 1.9], [0.6, 1.1, 2.7]].forEach(([r, hh, y]) => k.cone(r, hh, 0x1f4a2a, { y, seg: 9, parent: t2 }));
		for (let i = 0; i < 18; i++) k.glow(bulbs[i % 5], 0.35, { x: Math.sin(i * 2.4) * (1.1 - i * 0.05), y: 0.6 + i * 0.13, z: Math.cos(i * 2.4) * (1.1 - i * 0.05), parent: t2 });
		const giz = k.group({ x: G, y: 0.86, z: 0.1, s: 0.9 });
		const cream = 0xe8d8bc;
		const brown = 0x8a5a34;
		k.sphere(0.32, cream, { y: 0.36, s: [1, 1.1, 0.95], parent: giz });
		k.sphere(0.25, brown, { y: 0.4, z: -0.1, s: [1.1, 1.1, 0.8], parent: giz });
		[-1, 1].forEach((s) => {
			k.sphere(0.09, brown, { x: s * 0.15, y: 0.05, z: 0.18, s: [1, 0.7, 1.4], parent: giz });
			k.capsule(0.06, 0.16, brown, { x: s * 0.3, y: 0.42, z: 0.12, rz: s * 0.5, rx: -0.4, parent: giz });
			k.sphere(0.3, brown, { x: s * 0.62, y: 1.0, z: -0.02, rz: s * 0.25, s: [1.6, 0.8, 0.18], parent: giz });
			k.sphere(0.25, 0xe8a8a0, { x: s * 0.6, y: 0.99, z: 0.02, rz: s * 0.25, s: [1.55, 0.62, 0.1], parent: giz });
			k.sphere(0.12, brown, { x: s * 0.14, y: 0.98, z: 0.26, parent: giz });
			k.sphere(0.085, 0x2a1408, { x: s * 0.14, y: 0.97, z: 0.33, rough: 0.15, parent: giz });
			k.sphere(0.025, 0xffffff, { x: s * 0.14 + 0.03, y: 1.0, z: 0.41, emissive: 0xffffff, parent: giz });
		});
		k.sphere(0.38, cream, { y: 0.95, s: [1.1, 0.95, 1], parent: giz });
		k.mesh(new k.THREE.SphereGeometry(0.39, 14, 10, 0, PI * 2, 0, PI * 0.38), k.mat(brown), { y: 0.97, rx: -0.35, parent: giz, s: [1.1, 0.95, 1] });
		k.sphere(0.045, 0x5a3020, { y: 0.88, z: 0.37, parent: giz });
		k.box(0.1, 0.02, 0.02, 0x5a3020, { y: 0.8, z: 0.36, parent: giz });
		k.point(0xffd8b0, 4, 6, { x: G + 0.6, y: 2, z: 2 });
		k.point(0xff9050, 2, 6, { x: G - 2, y: 1, z: 1 });
		return {
			shots: [
				{ pos: [K + 0.2, 1.6, 1.4], look: [K + 0.1, 1.5, -0.6], fov: 45, fog: [0x2a2420, 3, 14] },
				{ pos: [0, 4, 30], look: [0, 7, -16], fov: 55 },
				{ pos: [C - 0.4, 1.7, 3.2], look: [C + 0.2, 1.5, -1.2], fov: 50, fog: [0x1a0e0a, 3, 16], exposure: 1.25 },
				{ pos: [P - 0.6, 1.1, 2.4], look: [P + 0.2, 0.2, 0], fov: 50, fog: [0x101420, 3, 14] },
				{ pos: [7.8, 3.0, 10.4], look: [4.2, 2.0, 7.4], fov: 48 },
				{ pos: [G + 0.15, 1.85, 2.0], look: [G, 1.62, 0.1], fov: 40, fog: [0x2a1410, 3, 14] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the treasure map and the ship
	r103: (k) => {
		k.fog(0xb8c4c8, 50, 280);
		k.sky(0x8a9aa8, 0xdde2e0);
		k.light({ sky: 0xe8eef4, ground: 0x5a5040, hemi: 1.25, sunColor: 0xfff0dc, sunIntensity: 1.8, sunPos: [-30, 40, 30], shadowSize: 60 });
		// The foggy coast (origin): beach, three sea stacks, the old restaurant with its lighthouse.
		k.ground(300, 0xb8a482, { bump: 0.5, seg: 60, height: (x, z) => z * 0.035 + (x < -20 ? Math.max(0, Math.min(4.8 - z * 0.035, (-20 - x) * 0.9)) : 0) });
		k.water(600, 0x3e5e6a, { y: -0.6, z: -250, seg: 60, amp: 0.3 });
		const rock = 0x3a3630;
		const hay = k.group({ x: -10, z: -70 });
		k.ico(14, rock, { y: 6, s: [1.2, 1.4, 1], detail: 1, parent: hay });
		k.ico(9, rock, { x: 9, y: 2, z: 4, s: [1, 0.9, 1], parent: hay });
		k.ico(10, 0x3a5a34, { y: 21, s: [1.05, 0.25, 0.85], parent: hay });
		[[18, 18, 3.2], [27, 14, 2.6]].forEach(([x, h, r]) => {
			k.cone(r, h, rock, { x, y: h / 2 - 1, z: -60, seg: 6 });
			k.ico(r * 0.9, rock, { x, y: 0, z: -60 });
		});
		const R = { x: -32, z: 6 };
		k.box(12, 6, 8, 0x7a6a5a, { x: R.x, y: 5.8, z: R.z });
		roof(k, 9, 12.6, 2.4, 0x4a4038, { x: R.x, y: 8.8, z: R.z, ry: PI / 2 });
		for (let i = 0; i < 4; i++) k.box(1.2, 1, 0.1, 0x2a3038, { x: R.x - 4 + i * 2.6, y: 7.2, z: R.z + 4.02 });
		k.box(1.4, 2.4, 0.1, 0x3a2a20, { x: R.x + 4.5, y: 6.0, z: R.z + 4.02 });
		k.cyl(1.0, 1.3, 7, 0xf0ece4, { x: R.x - 3, y: 13.5, z: R.z });
		k.cyl(1.05, 1.05, 1.4, 0xfff4c8, { x: R.x - 3, y: 17.6, z: R.z, emissive: 0xffd880, glow: 0.8, opacity: 0.85 });
		k.cone(1.4, 1.4, 0xa82a1a, { x: R.x - 3, y: 19, z: R.z });
		k.glow(0xfff0c0, 6, { x: R.x - 3, y: 17.6, z: R.z, fog: true });
		const jeep = k.group({ x: R.x + 9, y: 4.75, z: R.z + 4, ry: 0.2 });
		k.box(1.9, 0.8, 4.4, 0x14141a, { y: 0.7, parent: jeep });
		k.box(1.8, 0.7, 2.6, 0x14141a, { y: 1.45, z: -0.4, parent: jeep });
		k.box(1.82, 0.5, 2.3, 0x3a4a58, { y: 1.5, z: -0.4, parent: jeep, rough: 0.1 });
		[-1.4, 1.4].forEach((z) => [-1, 1].forEach((s) => k.cyl(0.36, 0.36, 0.25, 0x0a0a0a, { x: s * 0.95, y: 0.36, z, rz: PI / 2, parent: jeep })));
		// The doubloon on the map (x = 200).
		const M = 200;
		const map = k.canvas(512, 384, (g, w, h) => {
			g.fillStyle = "#d8c08a";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "rgba(120,80,30,0.25)";
			for (let i = 0; i < 30; i++) g.fillRect((i * 97) % w, (i * 53) % h, 40, 30);
			g.strokeStyle = "#4a3018";
			g.lineWidth = 4;
			g.beginPath();
			g.moveTo(40, 60);
			g.bezierCurveTo(140, 120, 90, 220, 180, 300);
			g.bezierCurveTo(240, 350, 330, 330, 470, 360);
			g.stroke();
			g.setLineDash([10, 10]);
			g.strokeStyle = "#6a2a10";
			g.beginPath();
			g.moveTo(120, 80);
			g.bezierCurveTo(260, 90, 230, 200, 380, 230);
			g.stroke();
			g.setLineDash([]);
			g.lineWidth = 8;
			g.strokeStyle = "#a01a10";
			g.beginPath();
			g.moveTo(370, 215);
			g.lineTo(400, 245);
			g.moveTo(400, 215);
			g.lineTo(370, 245);
			g.stroke();
			g.fillStyle = "#4a3018";
			g.beginPath();
			g.arc(300, 100, 22, 0, PI * 2);
			g.fill();
			g.fillStyle = "#d8c08a";
			g.fillRect(290, 92, 7, 7);
			g.fillRect(304, 92, 7, 7);
			[[420, 90], [450, 110], [440, 70]].forEach(([x, y]) => {
				g.beginPath();
				g.arc(x, y, 8, 0, PI * 2);
				g.fillStyle = "#4a3018";
				g.fill();
			});
		});
		k.box(4, 0.1, 3, 0x5a3a20, { x: M, y: 0.95 });
		k.plane(1.6, 1.2, k.mat(0xffffff, { map }), { x: M, y: 1.005, rx: -PI / 2, rz: 0.1 });
		const coin = k.group({ x: M + 0.25, y: 1.03, z: 0.15, rx: -0.15 });
		k.cyl(0.24, 0.24, 0.035, 0xc89838, { parent: coin, metal: 0.8, rough: 0.35, seg: 20 });
		k.torus(0.2, 0.012, 0xa87828, { y: 0.02, rx: PI / 2, parent: coin, metal: 0.8 });
		[[-0.08, -0.05], [0.07, -0.08], [0.0, 0.09]].forEach(([x, z]) => k.cyl(0.03, 0.03, 0.04, 0x1a1408, { x, y: 0.003, z, parent: coin }));
		k.cyl(0.05, 0.06, 0.25, 0xe8e0c8, { x: M - 0.9, y: 1.12, z: -0.6 });
		k.glow(0xffc070, 0.4, { x: M - 0.9, y: 1.32, z: -0.6 });
		k.spot(0xffe0b0, 25, { x: M - 0.5, y: 3, z: 1.2, target: [M + 0.1, 1, 0], angle: 0.4, distance: 8 });
		// A cellar corner (x = -600): a crate, a dropped candy bar, a chain running off into the dark.
		const V = -600;
		k.box(8, 0.2, 8, 0x4a4036, { x: V, y: -0.1 });
		k.box(8, 4, 0.3, 0x6a5a48, { x: V, y: 2, z: -2 });
		for (let i = 0; i < 5; i++) k.box(1.4, 0.04, 0.3, 0x5a4a38, { x: V - 2.8 + i * 1.45, y: 1.2 + (i % 2) * 0.9, z: -1.84 });
		const crate = k.group({ x: V, z: -0.6, ry: 0.15 });
		k.box(1.2, 0.8, 0.9, 0x9a7448, { y: 0.4, parent: crate });
		[0.15, 0.65].forEach((y) => k.box(1.22, 0.08, 0.92, 0x7a5a34, { y, parent: crate }));
		const bar = k.group({ x: V + 0.15, y: 0.83, z: -0.45, ry: 0.5 });
		k.box(0.42, 0.06, 0.12, 0xf4f0e8, { parent: bar, rough: 0.4 });
		k.box(0.16, 0.065, 0.125, 0xc8281e, { x: 0.02, parent: bar, rough: 0.4 });
		k.box(0.04, 0.04, 0.13, 0xe8e2d6, { x: 0.22, rz: 0.3, parent: bar });
		k.box(0.1, 0.05, 0.1, 0x5a3418, { x: -0.25, y: 0, parent: bar });
		for (let i = 0; i < 9; i++) k.torus(0.07, 0.018, 0x5a5a5e, { x: V - 0.9 + i * 0.12, y: 0.03, z: 0.4 - i * 0.03, rx: i % 2 ? PI / 2 : 0, ry: i % 2 ? 0 : PI / 2, metal: 0.7, rough: 0.4, seg: 12 });
		k.cyl(0.06, 0.06, 0.4, 0xe8e0c8, { x: V - 0.4, y: 1.0, z: -0.8 });
		k.glow(0xffc070, 0.5, { x: V - 0.4, y: 1.25, z: -0.8 });
		k.point(0xffc080, 3, 6, { x: V - 0.4, y: 1.4, z: -0.6 });
		k.spot(0xfff0d0, 18, { x: V + 1.5, y: 3, z: 1.6, target: [V, 0.7, -0.5], angle: 0.5, distance: 9 });
		// The bone organ in the cave (x = -200).
		const O = -200;
		k.ground(30, 0x3a3028, { x: O, bump: 0.3, seg: 12 });
		const cr = rng(19);
		for (let i = 0; i < 16; i++) {
			const a = (i / 16) * PI * 2;
			k.ico(3 + cr() * 2, 0x4a3a30, { x: O + Math.cos(a) * 9, y: 2 + cr() * 3, z: Math.sin(a) * 9 - 2, ry: cr() * 6 });
		}
		k.box(4.4, 1.2, 1.2, 0x3a2a20, { x: O, y: 0.6, z: -3 });
		for (let i = 0; i < 13; i++) {
			const x = O - 2 + i * (4 / 12);
			const h = 1.6 + Math.sin((i / 12) * PI) * 2.4;
			k.capsule(0.11, h, 0xe8dcc0, { x, y: 1.2 + h / 2 + 0.1, z: -3.2 });
			k.sphere(0.16, 0xe8dcc0, { x, y: 1.2 + h + 0.2, z: -3.2 });
		}
		const skull = k.group({ x: O, y: 4.9, z: -2.9 });
		k.sphere(0.4, 0xf0e8d4, { parent: skull, s: [1, 1.1, 1] });
		[-0.14, 0.14].forEach((x) => k.sphere(0.1, 0x1a1008, { x, y: 0.04, z: 0.33, parent: skull }));
		k.box(0.3, 0.12, 0.2, 0xf0e8d4, { y: -0.36, z: 0.18, parent: skull });
		k.box(3.4, 0.1, 0.5, 0x2a1a10, { x: O, y: 1.25, z: -2.3 });
		for (let i = 0; i < 16; i++) k.box(0.17, 0.06, 0.45, i % 3 === 2 ? 0x2a2018 : 0xf0e8d4, { x: O - 1.6 + i * 0.21, y: 1.33, z: -2.25 });
		const andy = k.person({ x: O + 0.2, z: -1.2, ry: PI, pose: "point", colors: { shirt: 0xe8e0d8, legs: 0x5a7a9a, hair: 0x6a4020 } });
		andy.userData.limbs.armL.rotation.x = -1.3;
		[-3.5, 3.5].forEach((x) => {
			k.cyl(0.06, 0.08, 1.4, 0x3a2a1a, { x: O + x, y: 2.4, z: -3.6, rz: x > 0 ? -0.3 : 0.3 });
			k.glow(0xff9a40, 1.8, { x: O + x * 0.94, y: 3.2, z: -3.6 });
			k.point(0xff9a50, 6, 12, { x: O + x * 0.9, y: 3.3, z: -2.6 });
		});
		// The grotto and the pirate ship (x = 400).
		const S = 400;
		k.sphere(70, 0x2e2a26, { x: S, y: 0, z: 0, s: [1, 0.55, 1], side: k.THREE.BackSide, seg: 18, rings: 10 });
		k.water(150, 0x1e4a4e, { x: S, y: 0, seg: 40, amp: 0.15 });
		k.spot(0xf0f8ff, 120, { x: S - 10, y: 38, z: -6, target: [S, 0, 0], angle: 0.3, distance: 90 });
		k.glow(0xe8f4ff, 30, { x: S - 10, y: 36, z: -6, opacity: 0.5 });
		k.point(0xffd890, 6, 40, { x: S + 10, y: 10, z: 12 });
		const ship = k.group({ x: S, y: 0, z: 0, ry: -0.3 });
		const hull = 0x6a4428;
		k.box(5, 5, 16, hull, { y: 1, parent: ship });
		k.box(5.1, 0.35, 16.1, 0xa8842e, { y: 2.6, parent: ship });
		k.cyl(5, 5, 5, hull, { y: 1, z: 10.5, seg: 3, s: [0.577, 1, 1], parent: ship });
		k.box(5, 4, 4.5, 0x5a3420, { y: 5.5, z: -5.8, parent: ship });
		k.box(5.2, 0.3, 4.7, 0xa8842e, { y: 7.6, z: -5.8, parent: ship });
		k.box(5, 1.6, 2.5, 0x5a3420, { y: 4.3, z: 9.5, parent: ship });
		for (let i = 0; i < 9; i++) [-1, 1].forEach((sx) => k.box(0.12, 0.8, 0.12, 0xa8842e, { x: sx * 2.45, y: 3.9, z: -3 + i * 1.3, parent: ship }));
		[-1, 1].forEach((sx) => k.box(0.1, 0.1, 12, 0xa8842e, { x: sx * 2.45, y: 4.3, z: 2.2, parent: ship }));
		for (let i = 0; i < 4; i++) k.glow(0xffd070, 0.6, { x: -1.5 + i, y: 4.8, z: -8.05, parent: ship });
		k.cyl(0.12, 0.1, 6, 0x3a2418, { y: 4.4, z: 16.5, rx: 1.1, parent: ship });
		[[5, 15], [-1, 13]].forEach(([z, h]) => {
			k.cyl(0.2, 0.25, h, 0x3a2418, { y: 3.5 + h / 2, z, parent: ship });
			[0.45, 0.8].forEach((f, j) => {
				const y = 3.5 + h * f;
				k.cyl(0.08, 0.08, 7 - j * 2, 0x3a2418, { y: y + 2, z, rz: PI / 2, parent: ship });
				k.box(6.2 - j * 2, 3.6 - j * 0.6, 0.1, 0x14120f, { y: y, z: z + 0.25, rx: 0.08, parent: ship });
			});
			k.cyl(0.6, 0.5, 0.5, 0x3a2418, { y: 3.5 + h * 0.92, z, parent: ship });
		});
		k.box(1.2, 0.8, 0.04, 0x0a0a0a, { x: 0.6, y: 19.2, z: 5, parent: ship });
		for (let i = 0; i < 9; i++) k.ico(0.35 + (i % 3) * 0.12, 0xe8b830, { x: -1.6 + (i % 3) * 1.4, y: 3.5, z: -3 + Math.floor(i / 3) * 1.2, emissive: 0x6a4a00, metal: 0.7, rough: 0.3, parent: ship });
		[0xc83a2a, 0x3a6ab8, 0xe8c83a, 0x5a8a3a, 0xe8e8e0, 0x8a3a8a, 0x2a2a2a].forEach((c, i) => k.person({ x: -1.6 + (i % 4) * 1.1, y: 3.5, z: 1 + Math.floor(i / 4) * 1.8 + (i % 2) * 0.4, ry: 0.3 + i * 0.4, s: 0.72, colors: { shirt: c, legs: 0x3a4a6a, hair: [0x3a2010, 0xd8b060, 0x1a1008][i % 3] }, pose: i === 2 ? "raise" : "stand", parent: ship }));
		return {
			shots: [
				{ pos: [V + 0.9, 1.5, 1.3], look: [V - 0.05, 0.7, -0.4], fov: 44, fog: [0x2a1e14, 4, 16] },
				{ pos: [4, 1.8, 40], look: [2, 7, -60], fov: 40, fog: [0xc4ccd0, 30, 160] },
				{ pos: [R.x + 22, 7, R.z + 24], look: [R.x, 8, R.z], fov: 45 },
				{ pos: [M + 0.6, 1.55, 0.75], look: [M + 0.2, 1.03, 0.1], fov: 42, fog: [0x2a1e14, 3, 14] },
				{ pos: [O + 1.6, 2.4, 4], look: [O, 2.6, -3], fov: 50, fog: [0x140e0a, 6, 30] },
				{ pos: [S + 11, 6.5, 10], look: [S, 5.5, 0.5], fov: 55, fog: [0x1e3034, 20, 120], exposure: 1.45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the book and the luckdragon
	r104: (k) => {
		k.fog(0xe8c8a0, 60, 300);
		k.sky(0x6a90d0, 0xf4d8b0);
		k.light({ sky: 0xfff0d8, ground: 0x8a5a38, hemi: 1.25, sunColor: 0xffe0b0, sunIntensity: 2.2, sunPos: [30, 40, 30], shadowSize: 50 });
		const boy = (o) => {
			const p = k.person({ ...o, colors: { shirt: 0xb8865a, legs: 0x8a6a48, hair: 0x14100c, skin: 0xb8865a } });
			k.box(0.16, 0.7, 0.12, 0x14100c, { y: 1.55, z: -0.18, parent: p });
			k.box(0.52, 0.9, 0.04, 0xa83a1a, { y: 1.1, z: -0.2, rx: 0.1, parent: p });
			return p;
		};
		// The oracle's gate (origin): two sphinxes facing across a path.
		k.ground(400, 0xc89060, { bump: 1.2, seg: 40, height: (x, z) => (Math.abs(x) > 18 ? (Math.abs(x) - 18) * 0.4 : 0) });
		const rr = rng(23);
		for (let i = 0; i < 30; i++) k.ico(2 + rr() * 5, 0xa8704a, { x: (rr() > 0.5 ? 1 : -1) * (20 + rr() * 40), y: 1 + rr() * 4, z: -60 + rr() * 90, ry: rr() * 6 });
		const sphinx = (x, ry) => {
			const g = k.group({ x, z: -6, ry });
			const st = 0xd8c09a;
			k.box(5, 1.6, 10, 0xb89a78, { y: 0.8, parent: g });
			k.box(3.6, 3.4, 7, st, { y: 3.3, z: -0.8, parent: g });
			[-1, 1].forEach((s) => k.box(1, 1, 3.8, st, { x: s * 1.2, y: 2.1, z: 3.6, parent: g }));
			k.box(3.0, 3.6, 2.2, st, { y: 5.4, z: 2.0, parent: g });
			[-0.7, 0.7].forEach((xx) => k.sphere(0.7, st, { x: xx, y: 5.6, z: 3.1, parent: g }));
			k.sphere(1.3, st, { y: 8.2, z: 2.3, s: [1, 1.15, 1], parent: g });
			k.box(3.2, 3.4, 1.6, 0x8a6a48, { y: 8.4, z: 1.8, parent: g });
			k.box(2.6, 0.5, 2.6, 0xc8a040, { y: 9.6, z: 2.3, parent: g, metal: 0.5 });
			[-0.45, 0.45].forEach((xx) => {
				k.box(0.5, 0.12, 0.1, 0x3a2a1a, { x: xx, y: 8.4, z: 3.55, parent: g });
				k.glow(0xbfe0ff, 1.0, { x: xx, y: 8.35, z: 3.65, parent: g, from: 2 });
			});
			[-1, 1].forEach((s) => k.box(0.4, 4, 6, 0xc8b08a, { x: s * 1.9, y: 5.4, z: -2.5, rx: 0.5, parent: g }));
			return g;
		};
		sphinx(-8, PI / 2 - 0.25);
		sphinx(8, -PI / 2 + 0.25);
		boy({ x: 0.3, z: 2, ry: PI });
		const knight = k.group({ x: -3, z: 6, ry: 0.6 });
		k.box(0.6, 0.35, 1.2, 0x8a8a90, { y: 0.18, metal: 0.6, rough: 0.4, parent: knight });
		k.sphere(0.25, 0x7a7a80, { y: 0.25, z: 0.85, metal: 0.6, parent: knight });
		k.box(0.12, 0.12, 1.4, 0x9a9aa0, { x: 0.5, y: 0.06, z: 0.3, ry: 0.4, metal: 0.8, parent: knight });
		for (let i = 0; i < 6; i++) k.capsule(0.05, 0.3, 0xe8e0c8, { x: 2 + (i % 3), y: 0.05, z: 5 + i * 0.4, rz: PI / 2, ry: i });
		// A school attic (x = 200): a borrowed book, a candle, an apple, a stack of old gym mats.
		const A = 200;
		k.box(5, 0.2, 5, 0x5a3e28, { x: A, y: -0.1 });
		for (let i = 0; i < 8; i++) k.box(0.02, 0.005, 5, 0x3a2414, { x: A - 2 + i * 0.55, y: 0.003 });
		k.box(4, 1, 0.3, 0x2a3a20, { x: A, y: 0.5, z: -1.8 });
		const book = k.group({ x: A, y: 0.0, z: 0, ry: 0.3 });
		[0.008, 0.112].forEach((y) => k.box(0.56, 0.016, 0.76, 0x9a3a22, { y, parent: book, rough: 0.6 }));
		k.box(0.52, 0.09, 0.72, 0xf0e4c8, { x: 0.01, y: 0.06, parent: book });
		k.box(0.04, 0.12, 0.76, 0x7a2a18, { x: -0.27, y: 0.06, parent: book });
		const candle = k.group({ x: A - 0.8, z: -0.5 });
		k.cyl(0.12, 0.14, 0.04, 0xa88a50, { y: 0.02, parent: candle, metal: 0.6 });
		k.cyl(0.04, 0.04, 0.3, 0xf0e8d0, { y: 0.19, parent: candle });
		const flame = k.glow(0xffb040, 0.4, { y: 0.4, parent: candle });
		const cl = k.point(0xffa040, 4, 6, { x: A - 0.8, y: 0.6, z: -0.3 });
		k.tick((t) => {
			cl.intensity = 3.6 + Math.sin(t * 13) * 0.4 + Math.sin(t * 7) * 0.3;
			flame.scale.setScalar(0.38 + Math.sin(t * 11) * 0.03);
		});
		k.sphere(0.09, 0xb81a1a, { x: A + 0.6, y: 0.09, z: -0.4 });
		k.box(1.4, 0.25, 0.9, 0x5a6a7a, { x: A + 0.9, y: 0.12, z: 0.8, ry: 0.4 });
		// The amulet (x = -200).
		const N = -200;
		k.box(4, 0.1, 3, 0x1a1440, { x: N, y: 0.95, rough: 1 });
		const am = k.group({ x: N, y: 1.03, z: 0, rx: -PI / 2 });
		[[-0.22, 0xd8a830, 0.25], [0.22, 0xd0d4dc, -0.25]].forEach(([x, c, ry]) => {
			k.torus(0.36, 0.055, c, { x, ry, s: [1, 1.35, 1], parent: am, metal: 0.85, rough: 0.25, seg: 40 });
			k.ico(0.08, c, { x: x * 0.15, y: Math.sign(x) * 0.47, z: 0.03, s: [1, 1.4, 0.8], parent: am, metal: 0.85, rough: 0.25 });
			k.sphere(0.018, 0x1a0a0a, { x: x * 0.15 + 0.03, y: Math.sign(x) * 0.5, z: 0.08, parent: am });
		});
		for (let i = 0; i < 10; i++) k.torus(0.04, 0.01, 0xd8a830, { x: N, y: 1.0, z: -0.62 - i * 0.07, ry: i % 2 ? PI / 2 : 0, metal: 0.8 });
		k.spot(0xfff0d0, 30, { x: N + 0.5, y: 3.2, z: 1.2, target: [N, 1, 0], angle: 0.35, distance: 8 });
		// The swamp: the sinking horse, and the giant turtle (x = 400).
		const W = 400;
		k.ground(140, 0x3a3a26, { x: W, bump: 0.8, seg: 40 });
		k.water(140, 0x3e4434, { x: W, y: 0.15, seg: 30, amp: 0.05 });
		const wr = rng(41);
		for (let i = 0; i < 26; i++) {
			const x = W + (wr() - 0.5) * 70;
			const z = -60 + wr() * 70;
			if (Math.abs(x - W) < 8 && z > -10) continue;
			const h = 4 + wr() * 5;
			k.cyl(0.18, 0.35, h, 0x2a2618, { x, y: h / 2, z, rz: (wr() - 0.5) * 0.3 });
			for (let b = 0; b < 3; b++) rod(k, [x, h * (0.55 + b * 0.15), z], [x + (wr() - 0.5) * 4, h * (0.7 + b * 0.15) + 1, z + (wr() - 0.5) * 4], 0.07, 0x2a2618);
		}
		const artax = horse(k, { x: W + 1, y: -0.5, z: 2, ry: -0.6, color: 0xe8e2d8, mane: 0xd8d0c4 });
		artax.rotation.x = -0.32;
		rod(k, [W - 0.57, 1.65, 3.5], [W + 0.24, 1.6, 3.1], 0.02, 0x5a3a1a);
		const at = boy({ x: W - 1.2, y: 0.2, z: 3.8, ry: 2.02, pose: "point" });
		at.userData.limbs.armL.rotation.x = -1.4;
		const morla = k.group({ x: W + 4, z: -32 });
		k.sphere(10, 0x4a5430, { y: 0, s: [1, 0.55, 1.1], seg: 16, rings: 10, parent: morla });
		for (let i = 0; i < 18; i++) {
			const a = i * 2.4;
			const rad = 3 + (i % 4) * 1.8;
			k.ico(1.4, i % 3 ? 0x3a4a28 : 0x5a6a3a, { x: Math.cos(a) * rad, y: 5.5 - rad * 0.38, z: Math.sin(a) * rad, s: [1.4, 0.4, 1.4], parent: morla });
		}
		const mh = k.group({ x: -2, y: 1.8, z: 10.5, ry: -0.3, parent: morla });
		k.sphere(2.4, 0x6a6a4a, { s: [1.1, 0.85, 1.3], parent: mh });
		k.box(2.6, 0.1, 0.6, 0x2a2418, { y: -0.6, z: 2.6, parent: mh });
		[-1, 1].forEach((s) => {
			k.sphere(0.45, 0xd8d0a0, { x: s * 1.1, y: 0.7, z: 2.0, parent: mh });
			k.sphere(0.48, 0x5a5a3a, { x: s * 1.1, y: 0.86, z: 2.0, s: [1, 0.55, 1], parent: mh });
			k.sphere(0.16, 0x1a1408, { x: s * 1.1, y: 0.62, z: 2.38, parent: mh });
		});
		boy({ x: W + 0.5, y: 0.2, z: -18.5, ry: PI - 0.2, s: 0.95 });
		k.point(0xd8e0c8, 4, 50, { x: W, y: 10, z: -10 });
		// The luckdragon over the clouds (y = 400).
		const F = 400;
		const cr = rng(5);
		for (let i = 0; i < 40; i++) k.ico(4 + cr() * 7, 0xffffff, { x: (cr() - 0.5) * 160, y: F - 16 - cr() * 6, z: (cr() - 0.5) * 160 - 20, s: [1.6, 0.6, 1.2], emissive: 0x6a6a7a, glow: 0.5 });
		const dragon = k.group({ x: 0, y: F, z: 0, ry: -0.5 });
		const fur = 0xf4ece6;
		const pts = [];
		for (let i = 0; i < 18; i++) {
			const x = 1.2 - i * 1.4;
			const y = Math.sin(i * 0.55) * 1.3;
			const z = Math.cos(i * 0.4) * 1.4 - 1.4;
			const r = 1.1 - i * 0.035;
			pts.push([x, y, z]);
			k.sphere(r, i % 2 ? fur : 0xf8e8e8, { x, y, z, parent: dragon, seg: 10, rings: 8 });
			k.cone(0.25, 0.9, 0xffffff, { x, y: y + r * 0.95, z, rz: 0.4, parent: dragon, seg: 4 });
			if (i % 3 === 1) k.sphere(r * 0.6, 0xf0c8c8, { x, y: y - r * 0.55, z, s: [1.2, 0.5, 1], parent: dragon });
		}
		const head = k.group({ x: 3.0, y: 0.6, z: 0.2, parent: dragon });
		k.sphere(1.2, fur, { s: [1.25, 1, 1], parent: head });
		k.sphere(0.75, fur, { x: 1.1, y: -0.25, s: [1.3, 0.8, 0.9], parent: head });
		k.sphere(0.2, 0x3a2a2a, { x: 2.0, y: -0.1, parent: head });
		[-1, 1].forEach((s) => {
			k.sphere(0.28, 0xffffff, { x: 0.75, y: 0.4, z: s * 0.7, parent: head });
			k.sphere(0.17, 0x8a3a2a, { x: 0.92, y: 0.42, z: s * 0.78, parent: head });
			k.capsule(0.22, 0.9, fur, { x: -0.4, y: 0.5, z: s * 1.05, rx: s * 0.9, rz: -0.6, parent: head });
		});
		for (let i = 0; i < 7; i++) k.cone(0.2, 1.2, 0xffffff, { x: -0.6 - i * 0.15, y: 1.1, z: (i - 3) * 0.2, rz: 0.9, parent: head, seg: 4 });
		const rider = k.person({ x: -0.3, y: 0.55, z: -0.3, ry: PI / 2, pose: "raise", parent: dragon, colors: { shirt: 0x5a6a8a, legs: 0x4a4a5a, hair: 0xd8b060, skin: 0xf0d0b0 } });
		rider.userData.limbs.legL.rotation.set(-1.3, 0, -0.6);
		rider.userData.limbs.legR.rotation.set(-1.3, 0, 0.6);
		k.tick((t) => {
			dragon.position.y = F + Math.sin(t * 0.8) * 0.3;
			head.rotation.z = Math.sin(t * 0.6) * 0.05;
		});
		void pts;
		k.point(0xfff0e0, 4, 60, { x: 10, y: F + 12, z: 12 });
		return {
			shots: [
				{ pos: [A + 0.8, 1.05, 1.5], look: [A - 0.05, 0.12, -0.15], fov: 46, fog: [0x1a100a, 3, 12], exposure: 1.25 },
				{ pos: [W - 1, 2.5, -10], look: [W + 2, 3, -22], fov: 55, fog: [0x5e6a5c, 8, 60], exposure: 1.2 },
				{ pos: [0.5, 2.2, 15], look: [0, 4.8, -5], fov: 55 },
				{ pos: [W + 3.8, 1.5, 7.2], look: [W, 0.9, 2.6], fov: 48, fog: [0x5e6a5c, 6, 50], exposure: 1.2 },
				{ pos: [N, 2.9, 0.5], look: [N, 1.03, 0], fov: 40, fog: [0x0a0820, 2, 12] },
				{ pos: [3, F + 2.5, 14], look: [-5, F + 0.3, -1], fov: 55, fog: [0x9ccaf0, 40, 220] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the stairs
	r105: (k) => {
		k.fog(0xb0aca0, 50, 220);
		k.sky(0x8a96a0, 0xd8d0c0);
		k.light({ sky: 0xf0ece0, ground: 0x5a4a3a, hemi: 1.25, sunColor: 0xffe8c8, sunIntensity: 1.8, sunPos: [20, 40, 30], shadowSize: 40 });
		const clownFace = (p) => {
			const h = p.userData.limbs.head;
			k.box(0.22, 0.04, 0.03, 0xc81a1a, { y: -0.08, z: 0.19, parent: h });
			[-1, 1].forEach((s) => {
				k.box(0.06, 0.06, 0.02, 0xc81a1a, { x: s * 0.12, y: -0.05, z: 0.18, rz: s * 0.6, parent: h });
				k.cone(0.03, 0.09, 0x2a5ad8, { x: s * 0.08, y: 0.1, z: 0.19, parent: h, seg: 3 });
			});
			k.sphere(0.035, 0xc81a1a, { y: -0.01, z: 0.2, parent: h });
		};
		const joker = (o) => {
			const p = k.person({ ...o, sleeves: 0xa8201a, coat: 0xa8201a, colors: { shirt: 0xd09a1a, legs: 0xa8201a, hair: 0x2e7a2a, skin: 0xf4f0ea } });
			clownFace(p);
			return p;
		};
		// The long stairs between brick walls (origin), climbing towards -z.
		const top = (i) => (i + 1) * 0.42;
		for (let i = 0; i < 34; i++) k.box(4.4, top(i), 0.8, 0x9a968c, { y: top(i) / 2, z: -i * 0.8 - 0.4 });
		k.box(40, 0.3, 30, 0x6a6a68, { y: -0.15, z: 14 });
		k.box(40, 14.3, 30, 0x6a6a68, { y: 7.15, z: -42 });
		[-1, 1].forEach((s) => {
			k.box(1.2, 3, 30, 0x8a8478, { x: s * 2.8, y: 0, z: -13, rx: Math.atan(0.42 / 0.8) });
			rod(k, [s * 2.0, 1.1, 0.2], [s * 2.0, 1.1 + 34 * 0.42, -27], 0.04, 0x2a3a2a);
			for (let i = 0; i < 34; i += 5) rod(k, [s * 2.0, top(i), -i * 0.8 - 0.4], [s * 2.0, top(i) + 1.1, -i * 0.8 - 0.4], 0.035, 0x2a3a2a);
			for (let j = 0; j < 4; j++) {
				const z = 6 - j * 11;
				const h = 22 + j * 4;
				k.box(10, h, 10, [0x8a4a36, 0x7a4232, 0x9a5a40, 0x6a3a2c][(j + (s > 0 ? 1 : 0)) % 4], { x: s * 8.6, y: h / 2, z });
				for (let w = 0; w < 4; w++) for (let f = 0; f < Math.floor(h / 4); f++) k.box(0.1, 1.4, 1.0, 0x2a2a30, { x: s * 3.55, y: 2.5 + f * 4, z: z - 3.5 + w * 2.4 });
			}
		});
		rod(k, [0, 1.1, 0.2], [0, 1.1 + 34 * 0.42, -27], 0.04, 0x2a3a2a);
		for (let i = 0; i < 34; i += 5) rod(k, [0, top(i), -i * 0.8 - 0.4], [0, top(i) + 1.1, -i * 0.8 - 0.4], 0.035, 0x2a3a2a);
		const j = joker({ x: -1, y: top(9), z: -9 * 0.8 - 0.4, ry: 0.15, from: 5 });
		const L = j.userData.limbs;
		L.armL.rotation.z = -2.3;
		L.armR.rotation.z = 1.1;
		L.legR.rotation.x = -0.9;
		L.head.rotation.z = 0.25;
		L.body.rotation.z = -0.1;
		// The dressing mirror (x = 200).
		const M = 200;
		k.box(3, 0.1, 1.2, 0x5a3a28, { x: M, y: 0.95 });
		k.box(3, 0.9, 1.2, 0x4a2a1c, { x: M, y: 0.45 });
		k.box(3, 3, 0.2, 0x6a5a4a, { x: M, y: 1.5, z: -0.6 });
		k.box(1.4, 1.0, 0.04, 0x9aa8b0, { x: M, y: 1.75, z: -0.48, metal: 0.8, rough: 0.12 });
		for (let i = 0; i < 6; i++) {
			k.glow(0xfff0c8, 0.35, { x: M - 0.8, y: 1.3 + i * 0.18, z: -0.42 });
			k.glow(0xfff0c8, 0.35, { x: M + 0.8, y: 1.3 + i * 0.18, z: -0.42 });
		}
		k.point(0xffe8c0, 3, 5, { x: M, y: 1.8, z: 0.4 });
		[[-0.5, 0xf4f4f0], [-0.25, 0xc81a1a], [0.0, 0x2a5ad8]].forEach(([x, c]) => {
			k.cyl(0.09, 0.09, 0.06, 0x8a8a8a, { x: M + x, y: 1.03, z: 0.1, metal: 0.6 });
			k.cyl(0.08, 0.08, 0.01, c, { x: M + x, y: 1.065, z: 0.1 });
		});
		k.sphere(0.05, 0xc81a1a, { x: M + 0.35, y: 1.05, z: 0.25 });
		k.cyl(0.12, 0.1, 0.03, 0x3a3a3a, { x: M + 0.6, y: 1.015, z: 0.05 });
		k.cyl(0.006, 0.006, 0.14, 0xf0f0e8, { x: M + 0.62, y: 1.04, z: 0.05, rz: PI / 2 - 0.1 });
		k.glow(0xff6a20, 0.06, { x: M + 0.69, y: 1.045, z: 0.05 });
		for (let i = 0; i < 3; i++) k.cyl(0.008, 0.008, 0.22, [0x3a2a1a, 0x2a2a2a, 0x8a5a2a][i], { x: M - 0.6 + i * 0.05, y: 1.015, z: 0.35, rz: PI / 2, ry: 0.4 + i * 0.2 });
		// The garbage strike street (x = -200).
		const G = -200;
		k.box(30, 0.2, 40, 0x2a2a2e, { x: G, y: -0.1, rough: 0.35 });
		[-1, 1].forEach((s) => {
			k.box(3, 0.3, 40, 0x5a5854, { x: G + s * 6.5, y: 0.15 });
			k.box(4, 14, 40, s > 0 ? 0x6a3a2a : 0x5a4a3a, { x: G + s * 10, y: 7 });
		});
		const graffiti = k.canvas(512, 128, (g, w, h) => {
			g.fillStyle = "#5a4a3a";
			g.fillRect(0, 0, w, h);
			const cols = ["#d83a8a", "#3ad8c8", "#e8d83a", "#ffffff", "#3a6ad8"];
			for (let i = 0; i < 40; i++) {
				g.strokeStyle = cols[i % 5];
				g.lineWidth = 4 + (i % 4) * 2;
				g.beginPath();
				g.moveTo((i * 53) % w, 20 + ((i * 37) % 90));
				g.bezierCurveTo((i * 71) % w, (i * 13) % h, (i * 29 + 40) % w, (i * 43) % h, (i * 67 + 30) % w, 30 + ((i * 17) % 80));
				g.stroke();
			}
		});
		k.plane(30, 3, k.mat(0xffffff, { map: graffiti }), { x: G - 7.99, y: 1.8, z: 0, ry: PI / 2 });
		const br = rng(7);
		for (let i = 0; i < 70; i++) k.ico(0.35 + br() * 0.3, br() > 0.3 ? 0x141416 : 0x2a3a2a, { x: G - 6.2 + (br() - 0.5) * 2.4 + (i % 2 ? 12.4 : 0), y: 0.5 + br() * 0.5, z: -18 + br() * 30, s: [1, 0.8, 1], rough: 0.25 });
		const cab = k.group({ x: G + 2, z: 2, ry: 0.05 });
		k.box(2, 0.8, 4.8, 0xf0c020, { y: 0.7, parent: cab, rough: 0.4 });
		k.box(1.8, 0.65, 2.4, 0xf0c020, { y: 1.42, z: -0.2, parent: cab, rough: 0.4 });
		k.box(1.82, 0.45, 2.2, 0x1a1e24, { y: 1.45, z: -0.2, parent: cab, rough: 0.1 });
		k.box(0.6, 0.25, 0.3, 0xf4f0d0, { y: 1.88, z: -0.2, parent: cab, emissive: 0xc8a040 });
		[-1.6, 1.6].forEach((z) => [-1, 1].forEach((s) => k.cyl(0.35, 0.35, 0.25, 0x0a0a0a, { x: s * 1.0, y: 0.35, z, rz: PI / 2, parent: cab })));
		[-0.6, 0.6].forEach((x) => k.glow(0xfff4d0, 0.7, { x, y: 0.75, z: 2.42, parent: cab }));
		[[G - 7.9, 4, -6, 0xff3a8a], [G + 7.9, 5, -12, 0x3ac8ff], [G - 7.9, 6, 6, 0xffa83a]].forEach(([x, y, z, c]) => {
			k.box(0.1, 0.6, 2.4, c, { x, y, z, emissive: c, glow: 1.2 });
			k.point(c, 4, 10, { x: x + Math.sign(G - x) * -1.5, y, z });
		});
		const clown = k.person({ x: G + 5.5, y: 0.3, z: -1, ry: -1.2, colors: { shirt: 0x3a8ad8, legs: 0xe8c020, hair: 0x2e7a2a, skin: 0xf4f0ea }, sleeves: 0xd83a3a });
		clownFace(clown);
		clown.userData.limbs.armR.rotation.x = -1.2;
		const sign = k.canvas(256, 96, (g, w, h) => {
			g.fillStyle = "#f4ecd8";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#c81a1a";
			g.beginPath();
			g.moveTo(20, 35);
			g.lineTo(170, 35);
			g.lineTo(170, 12);
			g.lineTo(236, 48);
			g.lineTo(170, 84);
			g.lineTo(170, 61);
			g.lineTo(20, 61);
			g.fill();
		});
		k.box(1.4, 0.5, 0.03, k.mat(0xffffff, { map: sign }), { x: G + 5.0, y: 1.75, z: -0.4, ry: -1.2 });
		k.glow(0xffffff, 3, { x: G + 1, y: 0.2, z: -6, opacity: 0.35 });
		k.point(0xffd8a0, 4, 18, { x: G, y: 6, z: 2 });
		// The subway car (x = 400).
		const T = 400;
		k.box(3.4, 0.1, 20, 0x5a5a52, { x: T, y: -0.05 });
		k.box(3.4, 0.1, 20, 0xd8d8c8, { x: T, y: 2.45 });
		[-1, 1].forEach((s) => {
			k.box(0.1, 2.5, 20, 0xb8b4a0, { x: T + s * 1.7, y: 1.25 });
			k.box(0.5, 0.45, 18, 0xd8801a, { x: T + s * 1.4, y: 0.45 });
			for (let z = -8; z <= 8; z += 3) k.box(0.02, 0.7, 1.8, 0x0a0a10, { x: T + s * 1.64, y: 1.5, z });
		});
		for (let z = -9; z <= 9; z += 3) {
			k.cyl(0.03, 0.03, 2.4, 0xd8d8d8, { x: T, y: 1.2, z, metal: 0.8 });
		}
		const tubes = [];
		for (let z = -8; z <= 8; z += 4) {
			tubes.push(k.box(0.15, 0.05, 2.2, 0xffffff, { x: T, y: 2.38, z, emissive: 0xe0ffe8 }));
			k.point(0xd8ffe0, 2.5, 7, { x: T, y: 2.1, z });
		}
		k.tick((t) => tubes.forEach((tb, i) => (tb.material.emissiveIntensity = i === 2 && Math.sin(t * 17) > 0.6 ? 0.2 : 1)));
		[[-0.6, -3, 0.2], [0.4, -3.6, -0.3], [0.9, -2.4, -0.9]].forEach(([x, z, ry]) => k.person({ x: T + x, z, ry: PI + ry, colors: { shirt: 0x2a3048, legs: 0x2a3048, hair: 0x3a2a1a } }));
		const seated = k.person({ x: T - 1.25, y: -0.15, z: 0, ry: PI / 2, pose: "sit", colors: { shirt: 0x8a2a20, legs: 0x5a4a6a, hair: 0x2a3a2a, skin: 0xf4f0ea } });
		clownFace(seated);
		// The talk show set (x = -400).
		const V = -400;
		k.box(30, 0.2, 20, 0x3a2a4a, { x: V, y: -0.1, rough: 0.3 });
		k.box(12, 0.4, 7, 0x6a4a6a, { x: V, y: 0.2, z: -3 });
		const sky = k.canvas(512, 256, (g, w, h) => {
			const grad = g.createLinearGradient(0, 0, 0, h);
			grad.addColorStop(0, "#1a1a5a");
			grad.addColorStop(1, "#8a4aa8");
			g.fillStyle = grad;
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#0e0e2a";
			for (let x = 0; x < w; x += 24) {
				const bh = 40 + ((x * 37) % 110);
				g.fillRect(x, h - bh, 22, bh);
			}
			g.fillStyle = "#ffe8a0";
			for (let i = 0; i < 120; i++) g.fillRect((i * 41) % w, h - 10 - ((i * 23) % 100), 3, 3);
		});
		k.plane(14, 6, k.mat(0xffffff, { map: sky }), { x: V, y: 3.4, z: -6.4 });
		[-1, 1].forEach((s) => {
			for (let i = 0; i < 6; i++) k.cyl(0.25, 0.25, 7, 0x8a1a2a, { x: V + s * (7.2 + i * 0.4), y: 3.5, z: -6.2 + i * 0.1, seg: 6 });
		});
		k.box(2.6, 1.1, 1.2, 0x5a3a28, { x: V + 2.6, y: 0.95, z: -3.5 });
		k.box(2.8, 0.08, 1.3, 0x3a2418, { x: V + 2.6, y: 1.54, z: -3.5 });
		k.cyl(0.05, 0.05, 0.25, 0xe8e8f0, { x: V + 2.2, y: 1.7, z: -3.4 });
		k.person({ x: V + 2.6, y: 0.0, z: -4.4, pose: "sit", colors: { shirt: 0x5a5a62, legs: 0x5a5a62, hair: 0x8a8a8a } });
		k.box(1, 0.5, 1, 0x3a2a5a, { x: V + 2.6, y: 0.65, z: -4.5 });
		k.box(1.4, 0.5, 1.2, 0x7a2a3a, { x: V - 1.2, y: 0.65, z: -3.2 });
		k.box(1.4, 0.8, 0.3, 0x7a2a3a, { x: V - 1.2, y: 1.2, z: -3.75 });
		const guest = joker({ x: V - 1.2, y: 0.05, z: -3.2, ry: 0.5, pose: "sit" });
		void guest;
		for (let i = 0; i < 10; i++) {
			k.glow(0xffffff, 1.0, { x: V - 9 + i * 2, y: 7.5, z: -1 });
			k.glow(0xffe0a0, 0.6, { x: V - 9 + i * 2, y: 7.1, z: -1, opacity: 0.6 });
		}
		k.box(20, 0.2, 0.2, 0x2a2a2a, { x: V, y: 7.7, z: -1 });
		k.spot(0xfff0e0, 22, { x: V, y: 9, z: 4, target: [V, 1, -3.5], angle: 0.3, distance: 25 });
		[-3, 3].forEach((x) => {
			const cam = k.group({ x: V + x, z: 4 });
			k.cyl(0.04, 0.04, 1.4, 0x1a1a1a, { y: 0.7, parent: cam });
			k.box(0.5, 0.5, 0.9, 0x2a2a2e, { y: 1.6, parent: cam });
			k.glow(0xff2020, 0.15, { x: 0.15, y: 1.85, z: -0.46, parent: cam });
		});
		// The riot (z = 300).
		const Rz = 300;
		k.box(40, 0.2, 40, 0x1e1e22, { y: -0.1, z: Rz, rough: 0.4 });
		[-1, 1].forEach((s) => k.box(4, 16, 40, 0x3a2a24, { x: s * 12, y: 8, z: Rz }));
		const cop = (x, z, ry, burning) => {
			const g = k.group({ x, z, ry });
			k.box(2, 0.8, 4.8, 0x1a1a22, { y: 0.7, parent: g });
			k.box(2.02, 0.4, 2.4, 0xe8e8e8, { y: 0.8, parent: g });
			k.box(1.8, 0.6, 2.4, 0x1a1a22, { y: 1.4, z: -0.2, parent: g });
			k.box(0.8, 0.12, 0.3, 0xd81a1a, { x: -0.3, y: 1.76, z: -0.2, parent: g, emissive: 0xd81a1a });
			k.box(0.8, 0.12, 0.3, 0x1a3ad8, { x: 0.3, y: 1.76, z: -0.2, parent: g, emissive: 0x1a3ad8 });
			[-1.6, 1.6].forEach((zz) => [-1, 1].forEach((s) => k.cyl(0.35, 0.35, 0.25, 0x0a0a0a, { x: s * 1.0, y: 0.35, z: zz, rz: PI / 2, parent: g })));
			if (burning) for (let i = 0; i < 6; i++) {
				k.cone(0.4 + (i % 3) * 0.15, 1.4 + (i % 2), i % 2 ? 0xff8a1a : 0xffd04a, { x: -0.6 + (i % 3) * 0.6, y: 2.2, z: -1.2 + Math.floor(i / 3) * 1.4, emissive: i % 2 ? 0xff5a00 : 0xffa020, glow: 1.2, parent: g });
				k.glow(0xff8030, 3, { x: -0.6 + (i % 3) * 0.6, y: 2.4, z: -1.2 + Math.floor(i / 3) * 1.4, parent: g });
			}
			return g;
		};
		cop(-4, Rz - 6, 0.6, true);
		cop(1, Rz - 1, -0.3, false);
		const fire = k.point(0xff7020, 12, 30, { x: -4, y: 3, z: Rz - 5 });
		k.tick((t) => (fire.intensity = 11 + Math.sin(t * 9) * 2 + Math.sin(t * 23)));
		const jk = joker({ x: 1.1, y: 1.1, z: Rz + 0.5, ry: 0.2, pose: "arms-out" });
		jk.userData.limbs.armL.rotation.z = -2.2;
		jk.userData.limbs.armR.rotation.z = 2.2;
		const mr = rng(66);
		for (let i = 0; i < 26; i++) {
			const p = k.person({ x: (mr() - 0.5) * 16, z: Rz + 3 + mr() * 8, ry: PI + (mr() - 0.5) * 0.8, pose: mr() > 0.6 ? "raise" : "stand", colors: { shirt: [0x3a3a40, 0x5a3a2a, 0x2a3a5a][i % 3], legs: 0x2a2a30, hair: [0x2e7a2a, 0xd86a1a, 0x1a1a1a][i % 3], skin: 0xf4f0ea } });
			k.sphere(0.06, 0xc81a1a, { y: -0.01, z: 0.2, parent: p.userData.limbs.head });
		}
		k.point(0xffd0a0, 4, 30, { x: 0, y: 8, z: Rz + 12 });
		return {
			shots: [
				{ pos: [G + 1, 1.6, 12], look: [G + 2, 1.2, -4], fov: 50, fog: [0x14141c, 10, 50], exposure: 1.2 },
				{ pos: [M + 0.1, 1.45, 0.95], look: [M + 0.1, 1.15, 0], fov: 45, fog: [0x2a1e14, 3, 12] },
				{ pos: [T + 0.8, 1.6, 7], look: [T - 0.4, 1.2, -2], fov: 55, fog: [0x0a0c0a, 8, 30] },
				{ pos: [V + 0.5, 1.9, 6.5], look: [V + 0.6, 1.4, -3.5], fov: 50, fog: [0x0a0814, 12, 40] },
				{ pos: [3.5, 3.8, Rz + 14], look: [0.5, 2.2, Rz], fov: 45, fog: [0x1a0e0a, 12, 60], exposure: 1.2 },
				{ pos: [0.7, 3.6, -1.5], look: [-0.9, 5.4, -7.6], fov: 50, exposure: 1.3 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the web-slinger
	r106: (k) => {
		k.fog(0xc4d6e8, 90, 420);
		k.sky(0x3a7ad0, 0xdce8f4);
		k.light({ sky: 0xf0f6ff, ground: 0x5a5a60, hemi: 1.3, sunColor: 0xfff4e0, sunIntensity: 2.2, sunPos: [40, 80, 30], shadowSize: 40 });
		const V3 = (a) => new k.THREE.Vector3(...a);
		const hero = (o) => {
			const p = k.person({ ...o, hair: false, colors: { shirt: 0xc8141a, legs: 0x1a3ab0, skin: 0xc8141a } });
			const L = p.userData.limbs;
			[-1, 1].forEach((s) => k.sphere(0.07, 0xf4f4f4, { x: s * 0.08, y: 0.03, z: 0.17, s: [1, 1.3, 0.4], rz: s * 0.4, parent: L.head, emissive: 0x404040 }));
			[L.legL, L.legR].forEach((l) => k.box(0.22, 0.3, 0.22, 0xc8141a, { y: -0.72, parent: l }));
			[L.armL, L.armR].forEach((a) => k.box(0.17, 0.14, 0.17, 0xc8141a, { y: -0.64, parent: a }));
			k.box(0.06, 0.12, 0.02, 0x0a0a0a, { y: 1.3, z: 0.15, parent: p });
			k.box(0.18, 0.02, 0.02, 0x0a0a0a, { y: 1.32, z: 0.15, parent: p });
			k.box(0.3, 0.7, 0.01, 0x1a3ab0, { x: 0, y: 1.2, z: -0.145, parent: p });
			return p;
		};
		const handOf = (p, arm) => {
			p.updateMatrixWorld(true);
			const v = p.userData.limbs[arm].localToWorld(V3([0, -0.72, 0]));
			return [v.x, v.y, v.z];
		};
		// Midtown avenue in daylight (origin).
		k.box(400, 0.2, 400, 0x4a4a4e, { y: -0.1 });
		city(k, 140, [-90, 90, -160, 60], { h: 70, w: 14, colors: [0x8a8478, 0x9a948a, 0x6a6e78, 0xb0a890, 0x7a7068], windows: 0xa8c8e8, seed: 17, avoid: (x) => Math.abs(x) < 16 });
		k.box(14, 95, 14, 0x9a948a, { x: 24, y: 47.5, z: -34 });
		const spire = k.group({ x: -30, z: -120 });
		k.box(16, 90, 16, 0xb8b4a8, { y: 45, parent: spire });
		[0, 1, 2, 3, 4].forEach((i) => k.cyl(7 - i * 1.3, 7.6 - i * 1.3, 5, 0xd8dce0, { y: 92.5 + i * 5, seg: 4, ry: PI / 4, metal: 0.7, rough: 0.25, parent: spire }));
		k.cone(1.2, 14, 0xd8dce0, { y: 124, seg: 4, metal: 0.7, parent: spire });
		const sp = hero({ x: 0, y: 34, z: 2, ry: 0.3, pose: "raise" });
		sp.rotation.z = 0.25;
		sp.userData.limbs.legL.rotation.x = -1.2;
		sp.userData.limbs.legR.rotation.x = -0.4;
		sp.userData.limbs.armL.rotation.set(0.4, 0, -1.0);
		const hand = handOf(sp, "armR");
		rod(k, hand, [17, 95, -30], 0.035, 0xf4f4f4, { emissive: 0x606060 });
		// A teenager's desk in Queens (x = 200): textbooks, a film camera, a lamp, snapshots pinned to the wall.
		const W = 200;
		k.box(8, 0.2, 6, 0x6a5040, { x: W, y: -0.1 });
		k.box(8, 4, 0.2, 0x8aa0b0, { x: W, y: 2, z: -1.2 });
		k.box(2.4, 0.08, 1.1, 0x9a7048, { x: W, y: 1.0, z: -0.55, rough: 0.5 });
		[-1, 1].forEach((sx) => k.box(0.08, 0.96, 1.0, 0x7a5434, { x: W + sx * 1.12, y: 0.48, z: -0.55 }));
		[[0x2a4a8a, 0.1], [0xb83a2a, 0.08], [0x3a6a3a, 0.12], [0xd8c8a0, 0.07]].forEach(([c, t], i, arr) => {
			const y = 1.04 + arr.slice(0, i).reduce((m, [, q]) => m + q, 0) + t / 2;
			k.box(0.5, t, 0.36, c, { x: W - 0.7, y, z: -0.6, ry: (i % 2 ? 0.12 : -0.08) });
		});
		const cam = k.group({ x: W + 0.15, y: 1.04, z: -0.35, ry: -0.4 });
		k.box(0.34, 0.2, 0.12, 0x1a1a1c, { y: 0.1, parent: cam, rough: 0.4 });
		k.box(0.34, 0.035, 0.122, 0xc8c8cc, { y: 0.19, parent: cam, metal: 0.7, rough: 0.3 });
		k.cyl(0.07, 0.075, 0.12, 0x2a2a2c, { y: 0.1, z: 0.11, rx: PI / 2, parent: cam });
		k.cyl(0.05, 0.05, 0.005, 0x3a5a8a, { y: 0.1, z: 0.172, rx: PI / 2, parent: cam, metal: 0.6, rough: 0.1 });
		k.box(0.07, 0.04, 0.05, 0xc8c8cc, { x: 0.1, y: 0.22, parent: cam, metal: 0.7 });
		k.box(0.32, 0.015, 0.24, 0xf0ece0, { x: W + 0.55, y: 1.05, z: -0.5, ry: 0.3 });
		const lamp = k.group({ x: W + 0.8, y: 1.04, z: -0.8 });
		k.cyl(0.12, 0.14, 0.04, 0x2a2a2c, { y: 0.02, parent: lamp });
		rod(k, [W + 0.8, 1.06, -0.8], [W + 0.7, 1.55, -0.7], 0.015, 0x2a2a2c);
		k.cone(0.14, 0.2, 0x2a6a4a, { x: W + 0.62, y: 1.55, z: -0.62, rz: 0.5, rx: -0.3, side: k.THREE.DoubleSide });
		k.glow(0xfff0c0, 0.5, { x: W + 0.56, y: 1.47, z: -0.56 });
		k.point(0xffe8c0, 3, 5, { x: W + 0.5, y: 1.4, z: -0.4 });
		const snaps = [0xd8c0a0, 0xa8c0d8, 0xe8d8b0, 0xb8a0c8, 0xc8d8b8];
		snaps.forEach((c, i) => {
			k.box(0.3, 0.22, 0.01, 0xf8f6f0, { x: W - 0.6 + i * 0.32, y: 1.75 + (i % 2) * 0.28, z: -1.09, rz: (i - 2) * 0.06 });
			k.box(0.25, 0.16, 0.012, c, { x: W - 0.6 + i * 0.32, y: 1.76 + (i % 2) * 0.28, z: -1.088, rz: (i - 2) * 0.06 });
		});
		k.box(1.8, 0.04, 0.04, 0x8a6a48, { x: W, y: 2.25, z: -1.08 });
		k.cyl(0.04, 0.035, 0.12, 0xf4f4f0, { x: W - 0.25, y: 1.1, z: -0.3 });
		k.spot(0xfff4e0, 15, { x: W - 1, y: 3, z: 1.5, target: [W, 1.1, -0.5], angle: 0.5, distance: 8 });
		// The genetics lab (x = -200).
		const L = -200;
		k.box(16, 0.2, 12, 0xd8dce0, { x: L, y: -0.1 });
		k.box(16, 4, 0.2, 0xb8c0c8, { x: L, y: 2, z: -4 });
		[-4, 0, 4].forEach((x) => {
			k.box(2.6, 0.9, 1, 0x8a9098, { x: L + x, y: 0.45, z: -1.5 });
			k.box(1.6, 0.9, 0.8, 0xc8e0e8, { x: L + x, y: 1.36, z: -1.5, opacity: 0.25, rough: 0.05 });
			k.box(1.62, 0.05, 0.82, 0x3a3a3a, { x: L + x, y: 1.83, z: -1.5 });
			k.glow(0x8ad8ff, 1.2, { x: L + x, y: 1.3, z: -1.5, opacity: 0.5 });
			k.box(1.2, 0.8, 0.05, 0x1a4a8a, { x: L + x, y: 2.8, z: -3.88, emissive: 0x3a8ad8, glow: 0.8 });
		});
		const dna = k.group({ x: L + 6.5, y: 0, z: -2.5 });
		for (let i = 0; i < 16; i++) {
			const a = i * 0.6;
			k.sphere(0.08, 0x3a8ad8, { x: Math.cos(a) * 0.3, y: 0.3 + i * 0.18, z: Math.sin(a) * 0.3, parent: dna });
			k.sphere(0.08, 0xd83a3a, { x: -Math.cos(a) * 0.3, y: 0.3 + i * 0.18, z: -Math.sin(a) * 0.3, parent: dna });
		}
		[[-5, 1.5, 0.4], [-1.5, 2, -0.3], [2, 1.2, 2.8], [5, 2.2, -1.0]].forEach(([x, z, ry], i) => k.person({ x: L + x, z, ry, colors: { shirt: [0xd8c8a8, 0x6a8ab8, 0xe8e8e8, 0xa86a5a][i], legs: 0x3a3a48, hair: [0x6a4020, 0x1a1008, 0xb83a1a, 0x8a6a3a][i] } }));
		k.point(0xe8f4ff, 4, 20, { x: L, y: 3.6, z: 0 });
		// The cage match (x = 400).
		const C = 400;
		k.box(30, 0.2, 30, 0x1a1a1e, { x: C, y: -0.1 });
		k.box(7, 1.2, 7, 0x2a2a3a, { x: C, y: 0.6 });
		k.box(6.6, 0.1, 6.6, 0xd8d8d0, { x: C, y: 1.25 });
		const mesh = k.canvas(128, 128, (g, w, h) => {
			g.clearRect(0, 0, w, h);
			g.strokeStyle = "rgba(200,200,210,0.85)";
			g.lineWidth = 3;
			for (let i = -h; i < w; i += 16) {
				g.beginPath();
				g.moveTo(i, 0);
				g.lineTo(i + h, h);
				g.moveTo(i + h, 0);
				g.lineTo(i, h);
				g.stroke();
			}
		});
		mesh.wrapS = mesh.wrapT = k.THREE.RepeatWrapping;
		mesh.repeat.set(6, 5);
		const fence = k.mat(0xffffff, { map: mesh, opacity: 1, side: k.THREE.DoubleSide, metal: 0.6 });
		fence.alphaTest = 0.3;
		[[0, -3.4, 0], [0, 3.4, PI], [-3.4, 0, PI / 2], [3.4, 0, -PI / 2]].forEach(([x, z, ry]) => k.plane(6.8, 5, fence, { x: C + x, y: 3.8, z, ry, shadow: false }));
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.cyl(0.08, 0.08, 5.2, 0x8a8a8a, { x: C + sx * 3.4, y: 3.8, z: sz * 3.4, metal: 0.7 })));
		const saw = k.person({ x: C + 0.8, y: 1.3, z: -0.6, ry: -2.2, s: 1.3, pose: "arms-out", colors: { shirt: 0xc8986a, legs: 0x0a0a0a, hair: 0x0a0a0a, skin: 0xc8986a }, sleeves: 0xc8986a });
		void saw;
		const kid = k.person({ x: C - 0.9, y: 1.3, z: 0.7, ry: 0.9, colors: { shirt: 0xb82a1a, legs: 0x2a3a8a, hair: 0x0a0a0a, skin: 0x2a3a8a }, sleeves: 0xb82a1a });
		k.box(0.3, 0.08, 0.05, 0x0a0a0a, { y: 0.04, z: 0.18, parent: kid.userData.limbs.head });
		const cr = rng(9);
		for (let i = 0; i < 40; i++) {
			const a = cr() * PI * 2;
			const d = 7 + cr() * 6;
			k.person({ x: C + Math.cos(a) * d, z: Math.sin(a) * d, ry: -a - PI / 2, s: 0.9, colors: { shirt: [0x3a3a48, 0x5a3a2a, 0x2a4a3a][i % 3], legs: 0x1a1a22 } });
		}
		k.spot(0xfff4e0, 60, { x: C, y: 14, z: 0, target: [C, 1, 0], angle: 0.35, distance: 30 });
		k.glow(0xffffff, 4, { x: C, y: 13.5, z: 0 });
		// The goblin's glider over the night city (x = -400).
		const N = -400;
		city(k, 90, [N - 70, N + 70, -80, 50], { h: 40, w: 10, colors: [0x2a2e3a, 0x3a3e4a, 0x22262e], windows: 0xffd890, seed: 4 });
		k.box(200, 0.2, 200, 0x101218, { x: N, y: -0.1 });
		const gl = k.group({ x: N, y: 58, z: 0, ry: 0.5, rz: 0.12 });
		k.box(0.7, 0.18, 1.6, 0x3a3a40, { parent: gl, metal: 0.6, rough: 0.4 });
		[-1, 1].forEach((s) => {
			k.box(1.6, 0.06, 0.8, 0x2a2a30, { x: s * 1.0, y: 0.02, z: -0.2, ry: s * 0.5, parent: gl, metal: 0.5 });
			k.cone(0.25, 0.7, 0x2a2a30, { x: s * 1.6, y: 0.03, z: -0.6, rx: -PI / 2, parent: gl, seg: 4 });
			k.glow(0xffd020, 0.35, { x: s * 0.18, y: 0.08, z: 0.82, parent: gl });
			k.glow(0xff7a20, 0.9, { x: s * 0.25, y: 0, z: -0.95, parent: gl });
		});
		const gob = k.person({ y: 0.09, z: 0.1, hair: false, pose: "raise", parent: gl, colors: { shirt: 0x3a6a2a, legs: 0x3a6a2a, skin: 0x5a8a3a } });
		k.box(0.5, 0.22, 0.3, 0x5a2a6a, { y: 1.05, parent: gob });
		[-1, 1].forEach((s) => k.sphere(0.06, 0xffe040, { x: s * 0.08, y: 0.04, z: 0.17, emissive: 0xc8a000, parent: gob.userData.limbs.head }));
		k.cone(0.07, 0.25, 0x5a8a3a, { y: 0.25, rz: 0.1, parent: gob.userData.limbs.head, seg: 5 });
		k.sphere(0.12, 0xff8a1a, { y: -0.8, parent: gob.userData.limbs.armR, emissive: 0xd85a00, glow: 0.9 });
		k.glow(0xffa040, 1.0, { y: -0.85, parent: gob.userData.limbs.armR });
		k.point(0x9adf6a, 6, 12, { x: N + 2, y: 60, z: 3 });
		k.point(0xffa040, 4, 8, { x: N, y: 61, z: 0 });
		k.disc(0xfff8e0, 10, { x: N - 60, y: 100, z: -180 });
		// The kiss in the rain (z = 400).
		const Z = 400;
		k.box(10, 0.2, 20, 0x2a2a30, { y: -0.1, z: Z, rough: 0.3 });
		[-1, 1].forEach((s) => k.box(1, 12, 20, s > 0 ? 0x6a3a2c : 0x5a3a30, { x: s * 3.5, y: 6, z: Z }));
		k.box(1.6, 0.08, 4, 0x2a2a2a, { x: 2.2, y: 4.4, z: Z - 0.5 });
		for (let i = 0; i < 9; i++) k.box(0.04, 1, 0.04, 0x2a2a2a, { x: 1.45, y: 4.9, z: Z - 2.4 + i * 0.5 });
		k.box(0.04, 0.04, 4, 0x2a2a2a, { x: 1.45, y: 5.4, z: Z - 0.5 });
		const hang = hero({ x: 0.15, y: 3.6, z: Z, rz: PI });
		const hk = hang.userData.limbs.head;
		k.sphere(0.205, 0xe0b48f, { y: -0.02, parent: hk, s: [1, 0.55, 1] });
		[hang.userData.limbs.armL, hang.userData.limbs.armR].forEach((a, i) => (a.rotation.z = i ? 0.3 : -0.3));
		rod(k, [0.0, 3.6, Z], [1.5, 4.4, Z - 0.2], 0.02, 0xf4f4f4, { emissive: 0x606060 });
		const mj = k.person({ x: 0, y: 0, z: Z + 0.42, ry: PI, dress: 0x2a5a3a, colors: { shirt: 0x2a5a3a, legs: 0xe8c0a0, hair: 0xb83a1a, skin: 0xf0d0b8 } });
		mj.userData.limbs.armL.rotation.set(-2.6, 0, 0.3);
		k.box(0.36, 0.5, 0.2, 0xb83a1a, { y: 1.62, z: 0.05, parent: mj });
		rain(k, 2500, { box: [7, 10, 14], z: Z, y: 0, speed: 16, len: 0.4, opacity: 0.5 });
		k.glow(0xffd8a0, 2.5, { x: -2.8, y: 5, z: Z - 4 });
		k.point(0xffd8a0, 8, 14, { x: -2.6, y: 5, z: Z - 3 });
		k.point(0x8ab0ff, 3, 14, { x: 1, y: 3, z: Z + 4 });
		return {
			shots: [
				{ pos: [W + 0.4, 1.55, 1.1], look: [W, 1.2, -0.6], fov: 48, fog: [0x2a2a30, 4, 14] },
				{ pos: [L + 1, 2.4, 7], look: [L, 1.6, -2], fov: 55, fog: [0xd8e0e8, 12, 40] },
				{ pos: [C + 4, 3.0, 11], look: [C, 2.6, 0], fov: 45, fog: [0x0a0a10, 12, 40] },
				{ pos: [N + 4, 60.5, 4.5], look: [N, 58.6, 0], fov: 50, fog: [0x0a1024, 40, 220], exposure: 1.3 },
				{ pos: [-2.4, 2.0, Z + 1.0], look: [0, 2.0, Z + 0.2], fov: 50, fog: [0x10141e, 6, 30], exposure: 1.3 },
				{ pos: [-2.2, 33, 5.5], look: [0.3, 34.6, 1.2], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the man of steel
	r107: (k) => {
		k.fog(0xc8dcf0, 120, 520);
		k.sky(0x2a6ad0, 0xd8e8f8);
		k.light({ sky: 0xf0f6ff, ground: 0x6a6a70, hemi: 1.3, sunColor: 0xfff4e0, sunIntensity: 2.4, sunPos: [60, 90, 60], sunTarget: [0, 60, -20], shadowSize: 60 });
		const shield = k.canvas(128, 128, (g) => {
			g.fillStyle = "#1a4ac0";
			g.fillRect(0, 0, 128, 128);
			g.beginPath();
			g.moveTo(64, 120);
			g.lineTo(6, 40);
			g.lineTo(28, 10);
			g.lineTo(100, 10);
			g.lineTo(122, 40);
			g.closePath();
			g.fillStyle = "#c81a1a";
			g.fill();
			g.beginPath();
			g.moveTo(64, 104);
			g.lineTo(18, 41);
			g.lineTo(34, 19);
			g.lineTo(94, 19);
			g.lineTo(110, 41);
			g.closePath();
			g.fillStyle = "#f2d020";
			g.fill();
			g.fillStyle = "#c81a1a";
			g.font = "bold 66px Georgia";
			g.textAlign = "center";
			g.fillText("S", 64, 80);
		});
		const hero = (o) => {
			const p = k.person({ ...o, colors: { shirt: 0x1a4ac0, legs: 0x1a4ac0, hair: 0x0a0a14, skin: 0xe8c0a0 } });
			const L = p.userData.limbs;
			[L.legL, L.legR].forEach((l) => k.box(0.22, 0.34, 0.24, 0xc81a1a, { y: -0.7, parent: l }));
			k.box(0.52, 0.2, 0.3, 0xc81a1a, { y: 0.92, parent: p });
			k.box(0.53, 0.06, 0.31, 0xf2d020, { y: 1.02, parent: p });
			k.plane(0.34, 0.34, k.mat(0xffffff, { map: shield }), { y: 1.35, z: 0.142, parent: p });
			k.plane(0.85, 1.8, k.mat(0xc81a1a, { side: k.THREE.DoubleSide }), { y: 0.75, z: -0.38, rx: 0.35, parent: p });
			return p;
		};
		// Metropolis and the newspaper tower with the globe (origin).
		k.box(600, 0.2, 600, 0x5a5a60, { y: -0.1 });
		const tw = 0xd0c4ae;
		k.box(26, 64, 22, tw, { y: 32, z: -20 });
		for (let i = 0; i < 9; i++) k.box(1.2, 58, 0.2, 0x3a4a5a, { x: -11 + i * 2.75, y: 30, z: -8.95, rough: 0.2, metal: 0.4 });
		for (let i = 0; i < 7; i++) k.box(0.2, 58, 1.2, 0x3a4a5a, { x: 13.05, y: 30, z: -28 + i * 2.6, rough: 0.2, metal: 0.4 });
		k.box(20, 10, 17, tw, { y: 69, z: -21 });
		k.box(13, 6, 11, tw, { y: 77, z: -21 });
		k.cyl(1.2, 1.6, 4, 0x8a8478, { y: 82, z: -21 });
		const globe = k.group({ y: 90, z: -21 });
		k.sphere(6, 0xc8a040, { parent: globe, metal: 0.7, rough: 0.35, seg: 20, rings: 14 });
		[-3, 0, 3].forEach((y) => k.torus(Math.sqrt(36 - y * y) + 0.05, 0.12, 0x8a6a20, { y, rx: PI / 2, parent: globe, metal: 0.8, seg: 40 }));
		for (let i = 0; i < 4; i++) k.torus(6.05, 0.12, 0x8a6a20, { ry: (i * PI) / 4, parent: globe, metal: 0.8, seg: 40 });
		k.torus(8.2, 0.35, 0xd8b850, { rx: PI / 2 - 0.35, parent: globe, metal: 0.8, seg: 48 });
		k.tick((t) => (globe.rotation.y = t * 0.15));
		city(k, 120, [-160, 160, -200, 90], { h: 55, w: 16, colors: [0x9a9488, 0xb0a894, 0x7a8090, 0x8a8478], windows: 0xa8c8e8, seed: 29, avoid: (x, z) => Math.abs(x) < 26 && z > -45 && z < 30 });
		// The helicopter over the edge of the roof.
		const heli = k.group({ x: 12.4, y: 64.6, z: -12, rz: -0.55, from: 4 });
		k.sphere(1.4, 0x2a5a8a, { s: [1.5, 1, 1], parent: heli });
		k.sphere(1.0, 0x9ad0f0, { x: 1.2, y: 0.2, s: [1, 0.8, 0.95], opacity: 0.6, rough: 0.1, parent: heli });
		k.cyl(0.25, 0.4, 5, 0x2a5a8a, { x: -3.6, y: 0.3, rz: PI / 2, parent: heli });
		k.box(0.1, 1.2, 0.5, 0x2a5a8a, { x: -6, y: 0.8, parent: heli });
		k.box(7, 0.08, 0.3, 0x1a1a1a, { y: 1.5, ry: 0.5, parent: heli });
		k.box(7, 0.08, 0.3, 0x1a1a1a, { y: 1.5, ry: -1.1, parent: heli });
		k.cyl(0.1, 0.1, 0.5, 0x1a1a1a, { y: 1.2, parent: heli });
		[-0.8, 0.8].forEach((z) => k.box(3, 0.08, 0.08, 0x1a1a1a, { y: -1.3, z, parent: heli }));
		const lois = k.person({ x: 15.6, y: 59.2, z: -12, ry: -0.6, pose: "raise", colors: { shirt: 0xe8d8c8, legs: 0x5a3a2a, hair: 0x1a1008 }, from: 4 });
		lois.userData.limbs.armL.rotation.z = -2.8;
		lois.userData.limbs.legL.rotation.x = 0.3;
		rod(k, [15.5, 61.3, -12], [14.7, 63.4, -12], 0.03, 0x2a2a2a, { from: 4 });
		const fly = k.group({ x: 3, y: 81, z: 2, ry: 2.2, from: 5 });
		const sup = hero({ rx: PI / 2 - 0.15, y: 0, z: -1, pose: "raise", parent: fly });
		sup.userData.limbs.armL.rotation.set(0, 0, -0.15);
		sup.userData.limbs.legL.rotation.x = 0.15;
		// The green crystal in the snow (x = 200).
		const X = 200;
		k.ground(200, 0xe8f0f8, { x: X, bump: 0.5, seg: 50 });
		const cry = k.group({ x: X, y: 0.1, z: 0, rz: 0.35, rx: -0.15 });
		k.cyl(0.13, 0.13, 1.1, 0x5aff8a, { y: 0.4, seg: 6, emissive: 0x1aa84a, glow: 1, rough: 0.1, opacity: 0.9, parent: cry });
		k.cone(0.13, 0.35, 0x8affaa, { y: 1.12, seg: 6, emissive: 0x2ac85a, glow: 1, parent: cry });
		k.glow(0x5aff8a, 2.2, { x: X - 0.25, y: 0.8, z: 0 });
		k.point(0x5aff8a, 6, 8, { x: X - 0.3, y: 0.9, z: 0.5 });
		k.stars(1500, { x: X, r: 300 });
		// The farm at sunset (x = -200).
		const F = -500;
		k.ground(400, 0xd8a848, { x: F, bump: 0.6, seg: 40 });
		const wr = rng(3);
		for (let i = 0; i < 400; i++) k.cone(0.22, 0.8, [0xe8b850, 0xd8a040, 0xc89838][i % 3], { x: F + (wr() - 0.5) * 40, y: 0.35, z: -2 + wr() * 18, seg: 4, shadow: false });
		const farm = k.group({ x: F - 4, z: -20 });
		k.box(8, 5, 6, 0xf0ece0, { y: 2.5, parent: farm });
		roof(k, 7, 8.6, 3, 0x5a4a40, { y: 5, ry: PI / 2, parent: farm });
		k.box(8.4, 0.2, 2, 0xe0dcd0, { y: 2.2, z: 3.8, parent: farm });
		for (let i = 0; i < 4; i++) k.box(0.9, 1.2, 0.1, 0xffd890, { x: -3 + i * 2, y: 3.4, z: 3.02, emissive: 0xc88a30, glow: 0.6, parent: farm });
		k.box(7, 6, 9, 0xa82a1a, { x: 14, y: 3, parent: farm });
		roof(k, 8, 9.4, 3.4, 0x3a2a24, { x: 14, y: 6, parent: farm });
		const truck = k.group({ x: F + 4, z: -8, ry: -0.6 });
		k.box(2, 0.9, 4.4, 0x2a5a8a, { y: 0.8, parent: truck });
		k.box(1.8, 0.8, 1.8, 0x2a5a8a, { y: 1.65, z: 0.6, parent: truck });
		[-1.4, 1.4].forEach((z) => [-1, 1].forEach((s) => k.cyl(0.38, 0.38, 0.25, 0x111111, { x: s * 1.0, y: 0.38, z, rz: PI / 2, parent: truck })));
		k.glow(0xffb060, 60, { x: F + 40, y: 8, z: -200, opacity: 0.8 });
		k.disc(0xffd8a0, 14, { x: F + 40, y: 8, z: -205 });
		// The fortress of ice (x = 400).
		const I = 400;
		k.ground(400, 0xeef4fa, { x: I, bump: 1, seg: 30 });
		const ir = rng(14);
		for (let i = 0; i < 40; i++) {
			const a = ir() * PI * 2;
			const d = ir() * 9;
			const h = 14 + ir() * 30 * (1 - d / 12);
			const lean = 0.08 + d * 0.03;
			k.cyl(0.9 + ir() * 1.2, 1 + ir() * 1.2, h, 0xe8f4ff, { x: I + Math.cos(a) * d, y: h / 2 - 1, z: Math.sin(a) * d - 30, rz: -Math.cos(a) * lean, rx: Math.sin(a) * lean, seg: 6, emissive: 0x6a8ab0, glow: 0.5, rough: 0.15, opacity: 0.92 });
		}
		k.person({ x: I + 1, z: -12, ry: PI, s: 1, colors: { shirt: 0x5a4a3a, legs: 0x3a3a4a, hair: 0x0a0a14 } });
		k.point(0xd8ecff, 6, 80, { x: I + 10, y: 20, z: -10 });
		return {
			shots: [
				{ pos: [F + 6, 2.2, 14], look: [F, 3, -18], fov: 50, fog: [0xf0b070, 40, 260], exposure: 1.05, hide: ["sky", "stars"] },
				{ pos: [X + 1.6, 1.0, 2.2], look: [X - 0.1, 0.65, 0], fov: 40, fog: [0x0a1424, 4, 40], hide: ["sky"] },
				{ pos: [I + 4, 3, 10], look: [I, 14, -30], fov: 55, fog: [0xd8e8f4, 30, 220], exposure: 1.0, hide: ["sky", "stars"] },
				{ pos: [26, 86, 26], look: [0, 86, -21], fov: 45, hide: ["stars"] },
				{ pos: [25, 58, -1], look: [13.5, 61.5, -12], fov: 48, hide: ["stars"] },
				{ pos: [8.5, 79, 8.5], look: [0, 83.5, -4], fov: 50, hide: ["stars"] },
			],
		};
	},
};
