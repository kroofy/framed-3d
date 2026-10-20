import { PI, rng, trees, city } from "../kit.js";

// ------------------------------------------------------------------------------------------------- local helpers

const vec = (k, a) => new k.THREE.Vector3(a[0], a[1], a[2]);

/** A box (or cylinder with `round`) stretched from point a to point b. */
function rod(k, a, b, w, color, o = {}) {
	const A = vec(k, a);
	const B = vec(k, b);
	const len = A.distanceTo(B);
	const m = o.round ? k.cyl(w / 2, (o.w2 ?? w) / 2, len, color, { seg: 8, ...o }) : k.box(w, len, o.d ?? w, color, o);
	m.position.copy(A).add(B).multiplyScalar(0.5);
	m.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
	return m;
}

/** A smooth tube along points. */
function tube(k, pts, r, color, o = {}) {
	const curve = new k.THREE.CatmullRomCurve3(pts.map((p) => vec(k, p)));
	return k.mesh(new k.THREE.TubeGeometry(curve, o.tseg ?? 64, r, o.rseg ?? 8, false), color, o);
}

/** A hemisphere light that can be limited to some frames. */
function hemi(k, sky, ground, intensity, o = {}) {
	return k.place(new k.THREE.HemisphereLight(sky, ground, intensity), { ...o, shadow: false });
}

/** Rotates a person's limbs: pose(p, { armL: [x, y, z] }). */
function pose(p, parts) {
	const L = p.userData.limbs;
	for (const [n, r] of Object.entries(parts)) L[n].rotation.set(r[0], r[1], r[2]);
	return p;
}

/** Replaces a person's arm with a bent one: shoulder -> elbow -> hand, in the person's local space. */
function bentArm(k, p, side, elbow, hand, color, w = 0.15) {
	const L = p.userData.limbs;
	(side < 0 ? L.armL : L.armR).visible = false;
	const sh = [side * 0.34, 1.5, 0];
	rod(k, sh, elbow, w, color, { parent: p });
	rod(k, elbow, hand, w * 0.92, color, { parent: p });
	k.sphere(w * 0.55, color, { x: elbow[0], y: elbow[1], z: elbow[2], parent: p, seg: 6, rings: 4 });
	k.sphere(w * 0.6, color, { x: hand[0], y: hand[1], z: hand[2], parent: p, seg: 6, rings: 4 });
}

/** Two simple cartoon eyes on a person's head. */
function faceEyes(k, p, o = {}) {
	const y = o.y ?? 1.78;
	const z = o.z ?? 0.17;
	const r = o.r ?? 0.05;
	[-1, 1].forEach((s) => {
		k.sphere(r, 0xffffff, { x: s * (o.dx ?? 0.075), y, z, parent: p, seg: 8, rings: 6 });
		k.sphere(r * 0.55, 0x101010, { x: s * (o.dx ?? 0.075), y, z: z + r * 0.7, parent: p, seg: 6, rings: 4 });
	});
}

/** A window-grid facade texture. */
function facade(k, o = {}) {
	const cols = o.cols ?? 8;
	const rows = o.rows ?? 22;
	return k.canvas(128, 256, (g, w, h) => {
		g.fillStyle = o.wall ?? "#e6e6e6";
		g.fillRect(0, 0, w, h);
		for (let r = 0; r < rows; r++)
			for (let c = 0; c < cols; c++) {
				g.fillStyle = Math.random() < (o.p ?? 0.12) ? (o.lit ?? "#ffe8b0") : (o.dark ?? "#6a7686");
				g.fillRect((c * w) / cols + 4, (r * h) / rows + 3, w / cols - 8, h / rows - 6);
			}
	});
}

/** A four-legged animal: body along +z, head group at the front. */
function quad(k, o) {
	const g = k.group(o);
	const L = o.len ?? 2;
	const G = o.girth ?? 0.5;
	const H = o.leg ?? 0.7;
	const body = k.capsule(G, L, o.color, { y: H + G * 0.8, rx: PI / 2, parent: g, s: o.bodyScale });
	const legs = [];
	[-1, 1].forEach((sx) =>
		[-1, 1].forEach((sz) => legs.push(k.cyl(G * 0.3, G * 0.24, H + G * 0.6, o.legColor ?? o.color, { x: sx * G * 0.55, y: (H + G * 0.6) / 2, z: sz * L * 0.42, parent: g, seg: 6 }))),
	);
	const head = k.group({ y: H + G * 1.15, z: L / 2 + G * 0.85, parent: g });
	return { g, head, body, legs, top: H + G * 1.8 };
}

/** A five-pointed star shape, extruded. */
function starGeo(k, r1, r2, depth) {
	const s = new k.THREE.Shape();
	for (let i = 0; i < 10; i++) {
		const a = (i * PI) / 5 + PI / 2;
		const r = i % 2 ? r2 : r1;
		const x = Math.cos(a) * r;
		const y = Math.sin(a) * r;
		i ? s.lineTo(x, y) : s.moveTo(x, y);
	}
	return new k.THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}

/** A heart shape, extruded. */
function heartGeo(k, size, depth) {
	const h = new k.THREE.Shape();
	h.moveTo(0, -0.5 * size);
	h.bezierCurveTo(-0.9 * size, 0.1 * size, -0.5 * size, 0.75 * size, 0, 0.35 * size);
	h.bezierCurveTo(0.5 * size, 0.75 * size, 0.9 * size, 0.1 * size, 0, -0.5 * size);
	return new k.THREE.ExtrudeGeometry(h, { depth, bevelEnabled: true, bevelSize: size * 0.06, bevelThickness: size * 0.06, bevelSegments: 1 });
}

/** A leafy broadleaf tree. */
function leafy(k, x, y, z, h, o = {}) {
	const greens = o.greens ?? [0x2f6a2a, 0x3a7a30, 0x285a24];
	k.cyl(h * 0.035, h * 0.06, h * 0.7, o.trunk ?? 0x5a4030, { x, y: y + h * 0.35, z, seg: 6, from: o.from, until: o.until });
	for (let i = 0; i < 4; i++)
		k.ico(h * (0.22 + (i % 2) * 0.06), greens[i % greens.length], { x: x + Math.sin(i * 2.1) * h * 0.15, y: y + h * (0.72 + (i % 3) * 0.1), z: z + Math.cos(i * 2.1) * h * 0.15, from: o.from, until: o.until });
}

// ------------------------------------------------------------------------------------------------- r108: the team in the city
function r108(k) {
	k.fog(0xc4b8a8, 90, 620);
	k.sky(0x4f6690, 0xe4cdb0, { offset: -0.03 });
	k.light({ sky: 0xe6eef8, ground: 0x6a5a48, hemi: 1.75, sunColor: 0xffe2b8, sunIntensity: 2.4, sunPos: [25, 90, 30], shadowSize: 30 });
	const win = facade(k);
	const mats = [0x8a96a4, 0xa2acb6, 0x747c86, 0xb0a08a, 0x8e8274].map((c) => k.mat(c, { map: win }));
	const r = rng(108);
	k.box(900, 1, 900, 0x5a5650, { y: -0.7 });
	k.box(26, 0.4, 320, 0x3c3d41, { y: -0.2, z: -110 });
	[-1, 1].forEach((s) => k.box(5, 0.5, 320, 0x8c8780, { x: s * 15.5, y: -0.05, z: -110 }));
	for (let i = 0; i < 30; i++) k.box(0.25, 0.03, 3, 0xe8cf6a, { x: 0, y: 0.015, z: 46 - i * 9, shadow: false });
	// The avenue, lined with towers.
	for (const s of [-1, 1]) {
		let z = 60;
		while (z > -205) {
			const d = 12 + r() * 10;
			const h = 30 + r() * 60;
			const w = 14 + r() * 8;
			const m = mats[Math.floor(r() * mats.length)];
			k.box(w, h, d - 1.2, m, { x: s * (18 + w / 2), y: h / 2, z: z - d / 2 });
			if (r() > 0.5) {
				const hh = 8 + r() * 12;
				k.box(w * 0.6, hh, (d - 1.2) * 0.6, m, { x: s * (18 + w / 2), y: h + hh / 2, z: z - d / 2 });
			}
			z -= d;
		}
	}
	city(k, 120, [-260, 260, -480, 60], { h: 70, w: 18, colors: [0x7d8896, 0x949ca6, 0x6e6a66, 0xa29684], windows: 0xffe0a0, seed: 9, avoid: (x, z) => (Math.abs(x) < 45 && z > -275) || (Math.abs(x) < 25 && z > -300) });
	// The tower at the end of the avenue, with its beam and the hole in the sky.
	const tw = k.group({ z: -238 });
	k.cyl(10, 12, 80, k.mat(0xb6c2cc, { map: win, metal: 0.3, rough: 0.4 }), { y: 40, seg: 8, parent: tw });
	k.cyl(8, 10, 12, 0xd2d8dc, { y: 86, seg: 8, parent: tw, metal: 0.3 });
	k.cyl(16, 9, 2.5, 0xe0e4e8, { y: 93, seg: 16, parent: tw });
	k.cyl(5, 7, 8, 0x9aa6ae, { y: 98, seg: 8, parent: tw });
	k.box(3, 3, 3, 0xcff4ff, { y: 103.5, parent: tw, emissive: 0x58c8ff, glow: 1.5 });
	k.glow(0x9fe4ff, 22, { y: 104, parent: tw });
	k.cyl(1.1, 1.1, 40, 0xdff8ff, { y: 125, parent: tw, emissive: 0x7fd8ff, glow: 2.5, shadow: false, seg: 8 });
	for (let i = 0; i < 5; i++) k.glow(0x7fd8ff, 9, { y: 108 + i * 8, parent: tw });
	const space = k.canvas(512, 512, (g, w, h) => {
		const gr = g.createRadialGradient(256, 256, 10, 256, 256, 256);
		gr.addColorStop(0, "#0a0620");
		gr.addColorStop(0.6, "#1c1250");
		gr.addColorStop(0.85, "#2a4ab0");
		gr.addColorStop(0.95, "#8ad8ff");
		gr.addColorStop(1, "#e8fbff");
		g.fillStyle = gr;
		g.fillRect(0, 0, w, h);
		for (let i = 0; i < 400; i++) {
			g.fillStyle = `rgba(255,255,255,${Math.random()})`;
			g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
		}
		for (let i = 0; i < 6; i++) {
			const n = g.createRadialGradient(100 + Math.random() * 300, 100 + Math.random() * 300, 0, 256, 256, 200);
			n.addColorStop(0, "rgba(160,80,200,0.25)");
			n.addColorStop(1, "rgba(0,0,0,0)");
			g.fillStyle = n;
			g.fillRect(0, 0, w, h);
		}
	});
	const port = k.group({ y: 145, z: -238, rx: 0.95 });
	k.mesh(new k.THREE.CircleGeometry(48, 48), new k.THREE.MeshBasicMaterial({ map: space, fog: false, side: k.THREE.DoubleSide }), { parent: port, shadow: false });
	k.torus(48, 1.6, 0xe8fbff, { parent: port, emissive: 0x9fe8ff, glow: 2, seg: 64, shadow: false });
	k.glow(0xa0e8ff, 150, { z: -3, parent: port, opacity: 0.45 });
	// Wreckage: cars, fires, rubble, smoke.
	const car = (x, z, ry, c, flip) => {
		const g = k.group({ x, y: flip ? 1.67 : 0, z, ry, rz: flip ? PI : 0 });
		k.box(2, 0.75, 4.4, c, { y: 0.7, parent: g, rough: 0.5 });
		k.box(1.8, 0.62, 2.3, c, { y: 1.36, z: -0.2, parent: g, rough: 0.5 });
		k.box(1.82, 0.4, 2.32, 0x2a3038, { y: 1.36, z: -0.2, parent: g, rough: 0.2 });
		[-1, 1].forEach((sx) => [-1.4, 1.4].forEach((sz) => k.cyl(0.36, 0.36, 0.3, 0x151515, { x: sx * 0.95, y: 0.36, z: sz, rz: PI / 2, parent: g })));
		return g;
	};
	const fire = (x, y, z, s = 1, from = 0) => {
		k.glow(0xff7a1a, 4 * s, { x, y: y + 0.9 * s, z, from });
		k.glow(0xffd070, 1.8 * s, { x, y: y + 0.5 * s, z, from });
		for (let i = 0; i < 3; i++) k.cone(0.35 * s, 1.4 * s, 0xff8a20, { x: x + (i - 1) * 0.3 * s, y: y + 0.6 * s, z, emissive: 0xff5a00, glow: 1.5, seg: 5, from, shadow: false });
		k.point(0xff7a30, 5, 18, { x, y: y + 1.5, z, from });
	};
	car(-7, 14, 0.4, 0xf0c020, false);
	car(8, -6, 2.0, 0xf0c020, true);
	car(-6, -22, -0.6, 0x8a2a2a, false);
	car(6.5, -48, 1.2, 0xf0c020, false);
	car(-5, -70, 2.6, 0x3a5a8a, true);
	car(4, -95, 0.3, 0xf0c020, false);
	fire(-7, 1.5, 14, 1.1);
	fire(8, 0.2, -6, 1);
	fire(6.5, 1.5, -48, 1.2);
	fire(-5, 0.2, -70, 1.3);
	for (let i = 0; i < 60; i++) {
		const x = (r() - 0.5) * 24;
		const z = 30 - r() * 230;
		if (Math.hypot(x, z) < 5) continue;
		k.ico(0.2 + r() * 0.6, [0x7a746c, 0x8e887e, 0x5e5a54][i % 3], { x, y: 0.1, z, ry: r() * 6 });
	}
	k.particles(800, 0xd8d0c4, { box: [40, 30, 60], y: 0, z: -10, speed: 1.2, size: 0.07, opacity: 0.6, drift: 0.4 });
	// The invaders on their sleds.
	const sleds = [];
	for (let i = 0; i < 10; i++) {
		const g = k.group({ from: 2 });
		k.box(1.4, 0.3, 2.4, 0x5a5e62, { parent: g, metal: 0.6, rough: 0.4 });
		k.cone(0.4, 1, 0x4a4e52, { rx: PI / 2, z: 1.6, parent: g, seg: 6 });
		k.person({ y: 0.15, s: 0.8, pose: "hunch", colors: { shirt: 0x6a6650, legs: 0x4a4838, skin: 0x8a8670, hair: 0x3a3830 }, parent: g });
		k.glow(0x8ad8ff, 1.6, { z: -1.4, parent: g });
		sleds.push(g);
	}
	k.tick((t) =>
		sleds.forEach((g, i) => {
			const a = t * 0.25 + i * 0.63;
			g.position.set(Math.sin(a) * (10 + (i % 3) * 5), 22 + (i % 4) * 9 + Math.sin(t + i) * 2, -50 - i * 15 + Math.cos(a) * 8);
			g.rotation.y = a + PI / 2;
		}),
	);
	// The great armoured beast between the towers.
	const lev = k.group({ x: 10, y: 30, z: -56, s: 1.3, ry: PI / 2 + 0.35, from: 3, until: 4 });
	const segs = [];
	for (let i = 0; i < 16; i++) {
		const s = 1 - i * 0.045;
		const seg = k.group({ z: -i * 5.2, parent: lev });
		k.box(9 * s, 7 * s, 5.6, 0x8a8c84, { parent: seg, metal: 0.4, rough: 0.6 });
		k.box(10 * s, 1.2, 4.6, 0x8a8a7e, { y: 3.6 * s, parent: seg, metal: 0.5 });
		k.cone(1.2 * s, 3 * s, 0x5a5c56, { y: 5 * s, rx: -0.5, parent: seg, seg: 4 });
		[-1, 1].forEach((sx) => k.box(1, 4 * s, 4, 0x585a54, { x: sx * 4.8 * s, y: -1, parent: seg, rz: sx * 0.3 }));
		k.glow(0x8ad8ff, 2.4, { y: -3.7 * s, parent: seg });
		segs.push(seg);
	}
	const hd = k.group({ z: 5, parent: lev });
	k.box(10, 6, 8, 0x74766c, { y: 1, z: 2, parent: hd, metal: 0.5 });
	k.box(9, 1.6, 9, 0x6a6c64, { y: -3.4, z: 3, rx: 0.35, parent: hd });
	k.box(8, 3.4, 1, 0x2a0a08, { y: -1.2, z: 5.6, parent: hd });
	for (let i = 0; i < 8; i++) k.cone(0.35, 1.4, 0xe8e0c8, { x: -3.5 + i, y: 0.2, z: 6, rx: PI, seg: 4, parent: hd });
	[-1, 1].forEach((sx) => k.glow(0xffa040, 3, { x: sx * 4.2, y: 2.6, z: 6, parent: hd }));
	k.tick((t) =>
		segs.forEach((s, i) => {
			s.position.y = Math.sin(t * 0.8 - i * 0.45) * 2;
			s.position.x = Math.sin(t * 0.5 - i * 0.35) * 7;
			s.rotation.y = Math.cos(t * 0.5 - i * 0.35) * 0.5;
		}),
	);
	// The heroes.
	const capt = (o) => {
		const p = k.person({ colors: { shirt: 0x2a4a9c, legs: 0x2a4a9c, hair: 0x2a4a9c, skin: 0xe2b48e }, ...o });
		k.mesh(starGeo(k, 0.11, 0.045, 0.02), 0xf6f6f6, { y: 1.38, z: 0.14, parent: p });
		for (let i = 0; i < 4; i++) k.box(0.51, 0.045, 0.29, i % 2 ? 0xf2f2f2 : 0xc0222a, { y: 0.92 + i * 0.045, parent: p });
		const sh = k.group({ x: -0.46, y: 1.08, z: 0.22, ry: -0.35, parent: p });
		[[0.42, 0xc0222a], [0.33, 0xf2f2f2], [0.25, 0xc0222a], [0.16, 0x2a4ab0]].forEach(([rad, c], i) => k.cyl(rad, rad, 0.04, c, { z: i * 0.012, rx: PI / 2, parent: sh, seg: 28, metal: 0.4, rough: 0.4 }));
		k.mesh(starGeo(k, 0.13, 0.055, 0.02), 0xf6f6f6, { z: 0.04, parent: sh });
		return p;
	};
	const iron = (o) => {
		const p = k.person({ hair: false, colors: { skin: 0xd8ac3c, shirt: 0xa8161c, legs: 0xa8161c }, ...o });
		k.cyl(0.07, 0.07, 0.04, 0xe8fbff, { y: 1.32, z: 0.15, rx: PI / 2, emissive: 0x9fe8ff, glow: 2, parent: p });
		k.glow(0x9fe8ff, 0.6, { y: 1.32, z: 0.2, parent: p });
		[-0.07, 0.07].forEach((x) => k.box(0.07, 0.025, 0.02, 0xffffff, { x, y: 1.79, z: 0.195, emissive: 0xbfefff, glow: 2, parent: p }));
		k.box(0.52, 0.18, 0.3, 0xd8ac3c, { y: 0.95, parent: p, metal: 0.6, rough: 0.35 });
		return p;
	};
	const thor = (o) => {
		const p = k.person({ colors: { shirt: 0x3a3a46, legs: 0x26262c, hair: 0xd8b25a, skin: 0xe6b894 }, sleeves: 0xe6b894, ...o });
		k.box(0.36, 0.45, 0.08, 0xd8b25a, { y: 1.62, z: -0.16, parent: p });
		k.box(0.64, 1.45, 0.05, 0xb01c22, { y: 0.98, z: -0.24, rx: 0.08, parent: p });
		[-0.12, 0.12].forEach((x) => k.cyl(0.07, 0.07, 0.03, 0xc8c8d0, { x, y: 1.35, z: 0.15, rx: PI / 2, metal: 0.8, rough: 0.3, parent: p }));
		const hand = p.userData.limbs.armR;
		k.cyl(0.035, 0.035, 0.42, 0x6a4a30, { y: -0.86, parent: hand });
		k.box(0.36, 0.22, 0.22, 0x9a9ca4, { y: -1.1, metal: 0.7, rough: 0.35, parent: hand });
		return p;
	};
	const hulk = (o) => {
		const p = k.person({ s: [1.8, 1.6, 1.7], colors: { skin: 0x5e9a3c, shirt: 0x5e9a3c, legs: 0x4a2c66, hair: 0x161616 }, ...o });
		[-1, 1].forEach((s) => k.sphere(0.2, 0x5e9a3c, { x: s * 0.28, y: 1.5, parent: p }));
		k.box(0.16, 0.06, 0.04, 0x2a0a0a, { y: 1.68, z: 0.18, parent: p });
		return p;
	};
	const widow = (o) => {
		const p = k.person({ colors: { shirt: 0x17171c, legs: 0x17171c, hair: 0xa8341c, skin: 0xeec2a0 }, ...o });
		k.box(0.42, 0.32, 0.12, 0xa8341c, { y: 1.68, z: -0.12, parent: p });
		k.box(0.52, 0.06, 0.3, 0x8a7a5a, { y: 0.9, parent: p, metal: 0.6 });
		[p.userData.limbs.armL, p.userData.limbs.armR].forEach((a) => k.box(0.06, 0.1, 0.22, 0x222222, { y: -0.72, z: 0.08, parent: a }));
		return p;
	};
	const hawk = (o) => {
		const p = k.person({ colors: { shirt: 0x2e2a36, legs: 0x2a2830, hair: 0x8a6a40, skin: 0xe0b48f }, sleeves: 0xe0b48f, ...o });
		pose(p, { armL: [-1.4, 0, 0] });
		k.torus(0.55, 0.025, 0x2a1e30, { x: -0.34, y: 1.5, z: 0.15, ry: -PI / 2, rz: -1.1, arc: 2.2, parent: p });
		k.box(0.18, 0.5, 0.18, 0x5a3a2a, { y: 1.35, z: -0.2, rz: 0.3, parent: p });
		return p;
	};
	// Frame 5: a smashing green giant, and the armour hovering over him.
	const h1 = hulk({ x: 2, y: 0, z: -32, ry: 0.42, from: 4, until: 4 });
	pose(h1, { armL: [0, 0, -2.4], armR: [0, 0, 2.4] });
	const im1 = iron({ x: -3.5, y: 6.5, z: -27, ry: 0.6, from: 4, until: 4 });
	pose(im1, { armL: [0.2, 0, -0.4], armR: [-1.5, 0, 0] });
	[[-0.13, 0], [0.13, 0]].forEach(([x, y]) => k.glow(0x9fe8ff, 0.9, { x, y, parent: im1 }));
	k.point(0x9fe8ff, 4, 10, { x: -3.5, y: 6, z: -26, from: 4, until: 4 });
	k.tick((t) => (im1.position.y = 6.5 + Math.sin(t * 1.5) * 0.2));
	car(1, -36, 1.4, 0xf0c020, false).scale.set(1, 0.55, 1);
	// Frame 6: the six of them, back to back.
	const ring = [
		[capt, 0],
		[iron, 1.05],
		[hulk, 2.1],
		[hawk, PI],
		[widow, -2.1],
		[thor, -1.05],
	];
	ring.forEach(([make, a]) => {
		const rad = make === hulk ? 2.7 : 2.3;
		make({ x: Math.sin(a) * rad, z: Math.cos(a) * rad, ry: a, from: 5 });
	});
	// Frame 2: a glowing blue cube in a dark lab.
	const lab = k.group({ x: 300 });
	k.box(40, 1, 40, 0x1a2230, { y: -0.5, parent: lab, rough: 0.4, metal: 0.3 });
	k.cyl(0.5, 0.65, 1, 0x3a4250, { y: 0.5, parent: lab, metal: 0.6, rough: 0.3 });
	k.cyl(0.55, 0.55, 0.08, 0x8a96a8, { y: 1.04, parent: lab, metal: 0.8, rough: 0.2 });
	const cube = k.box(0.42, 0.42, 0.42, 0x3aa8ff, { y: 1.42, parent: lab, emissive: 0x1a6cff, glow: 0.9, opacity: 0.75, rough: 0.05 });
	k.box(0.22, 0.22, 0.22, 0xffffff, { y: 1.42, emissive: 0xbff4ff, glow: 2, parent: lab });
	k.glow(0x5ac8ff, 2.4, { y: 1.42, parent: lab });
	k.point(0x5ac8ff, 6, 10, { y: 1.8, z: 0.8, parent: lab });
	k.torus(0.6, 0.03, 0x8a96a8, { y: 1.42, rx: PI / 2, parent: lab, metal: 0.8 });
	for (let i = 0; i < 8; i++) {
		const a = (i / 8) * PI * 2;
		k.box(1.2, 2.5 + (i % 3), 1, 0x2a3240, { x: Math.cos(a) * 5, y: 1.3, z: Math.sin(a) * 5, ry: -a, parent: lab, metal: 0.5 });
		k.glow(i % 2 ? 0x5ac8ff : 0xffa040, 0.4, { x: Math.cos(a) * 4.4, y: 1.8, z: Math.sin(a) * 4.4, parent: lab });
	}
	k.spot(0xbfdfff, 30, { x: 302, y: 6, z: 3, target: [300, 1.2, 0], angle: 0.35 });
	k.tick((t) => {
		cube.rotation.y = t * 0.4;
		cube.rotation.x = t * 0.25;
	});
	// Frame 1: a woman tied to a chair in a bare warehouse, her captors standing over her.
	const wh = k.group({ x: -300 });
	k.box(40, 1, 40, 0x6a6660, { y: -0.5, parent: wh, rough: 0.9 });
	k.box(24, 9, 0.5, 0x7a7266, { y: 4.5, z: -6, parent: wh });
	k.box(0.5, 9, 20, 0x726a60, { x: -8, y: 4.5, z: 2, parent: wh });
	for (let i = 0; i < 5; i++) k.box(0.4, 9, 0.4, 0x4a4844, { x: -6 + i * 4, y: 4.5, z: -5.6, parent: wh, metal: 0.4 });
	for (let i = 0; i < 4; i++) k.box(0.8, 0.12, 20, 0x5a5650, { x: -6 + i * 4, y: 8.6, z: 2, parent: wh });
	[[-5.5, -4.2, 0.55, 0], [-6.2, -2.4, 0.55, 0.4], [-5.5, -4.2, 1.65, 0.15], [5, -4.4, 0.55, 0.2]].forEach(([x, z, y, ry], i) => k.box(1.4, 1.1, 1.2, [0x8a6a44, 0x7a5a3a][i % 2], { x, y, z, ry, parent: wh }));
	k.cyl(0.9, 0.9, 1.6, 0x3a5a7a, { x: 3.6, y: 0.8, z: -4.4, parent: wh, metal: 0.4, rough: 0.5 });
	k.cyl(0.9, 0.9, 1.6, 0x7a3a2a, { x: 5.6, y: 0.8, z: -2.6, parent: wh, metal: 0.4, rough: 0.5 });
	const chair = k.group({ x: 0, z: 0, ry: 0.35, parent: wh });
	k.box(0.6, 0.06, 0.55, 0x5a5a60, { y: 0.55, parent: chair, metal: 0.5 });
	k.box(0.6, 0.7, 0.05, 0x5a5a60, { y: 0.92, z: -0.27, parent: chair, metal: 0.5 });
	[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.cyl(0.025, 0.025, 0.55, 0x3a3a40, { x: sx * 0.26, y: 0.27, z: sz * 0.24, parent: chair })));
	const cap = k.person({ y: 0.12, z: 0.05, pose: "sit", colors: { shirt: 0x2a2a30, legs: 0x22222a, skin: 0xeec2a0, hair: 0xa8341c }, parent: chair });
	pose(cap, { armL: [0.5, 0, 0.25], armR: [0.5, 0, -0.25] });
	k.box(0.4, 0.3, 0.12, 0xa8341c, { y: 1.68, z: -0.12, parent: cap });
	[0.95, 1.25].forEach((y) => k.box(0.62, 0.05, 0.4, 0xc8b890, { y, z: -0.02, parent: cap }));
	const thug = (x, z, ry, shirt) => k.person({ x, z, ry, colors: { shirt, legs: 0x2a2a2e, skin: 0xd8a888, hair: 0x1a1410 }, parent: wh });
	pose(thug(1.5, -0.7, -1.4, 0x3a3a44), { armR: [-0.5, 0, 0.1] });
	thug(-1.6, 0.9, 2.3, 0x5a4a3a);
	thug(0.6, -1.9, -0.4, 0x2a2a2e);
	k.box(0.9, 0.05, 0.6, 0x6a5a4a, { x: 2.4, y: 0.8, z: -0.8, parent: wh });
	[-1, 1].forEach((sx) => k.cyl(0.03, 0.03, 0.8, 0x3a3a40, { x: 2.4 + sx * 0.38, y: 0.4, z: -0.8, parent: wh }));
	k.box(0.12, 0.05, 0.22, 0x1a1a1a, { x: 2.3, y: 0.85, z: -0.8, parent: wh });
	k.cyl(0.01, 0.01, 4.6, 0x1a1a1a, { y: 6.3, parent: wh });
	k.cone(0.3, 0.25, 0x3a4a3a, { y: 4, parent: wh, open: true, seg: 10 });
	k.glow(0xffe0a0, 1.2, { y: 3.85, parent: wh });
	k.point(0xffd8a0, 12, 14, { y: 3.7, parent: wh });
	k.spot(0xdfe8f0, 18, { x: -296, y: 7, z: 6, target: [-300, 0.5, 0], angle: 0.6 });
	return {
		shots: [
			{ pos: [-298.2, 2.2, 4.4], look: [-300, 0.9, -0.2], fov: 46, fog: [0x2e2a26, 8, 40], exposure: 1.25 },
			{ pos: [300.9, 1.65, 1.5], look: [300, 1.35, 0], fov: 40, fog: [0x050c18, 2, 30], exposure: 1.2 },
			{ pos: [6, 2.2, 48], look: [0, 48, -220], fov: 50 },
			{ pos: [12, 3, 10], look: [-4, 34, -62], fov: 55, exposure: 1.2 },
			{ pos: [8.5, 2.2, -21], look: [0, 4.2, -32], fov: 50 },
			{ pos: [0, 1.15, 6.2], look: [0, 3.6, -12], fov: 58 },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r109: the hidden kingdom
function r109(k) {
	k.fog(0xb8c8b4, 70, 420);
	k.sky(0x5a86c0, 0xf0e2c0, { offset: -0.02 });
	k.light({ sky: 0xf4f6ea, ground: 0x5a6a48, hemi: 1.7, sunColor: 0xffe4b8, sunIntensity: 2.2, sunPos: [10, 70, 60], shadowSize: 45 });
	const r = rng(109);
	// Warrior Falls: a pool between terraced cliffs, a waterfall at the back.
	k.water(140, 0x2e8088, { amp: 0.12, seg: 40, opacity: 0.92 });
	k.ground(200, 0x3a4a34, { y: -6, bump: 1 });
	const rock = [0x9a8468, 0xa89074, 0x8a765e];
	for (const s of [-1, 1]) {
		const side = k.group({ ry: s * 0.2 });
		for (let i = 0; i < 9; i++) {
			const h = 38 + r() * 10;
			k.box(16, h, 6.4, rock[i % 3], { x: s * 16, y: h / 2 - 6, z: 26 - i * 6, ry: (r() - 0.5) * 0.08, parent: side });
		}
		// Terraces with the tribes watching.
		[3, 8, 13].forEach((y, lvl) => {
			k.box(2.6, 0.8, 44, rock[(lvl + 1) % 3], { x: s * (6.8 + lvl * 0.3), y: y - 0.4, z: 2, parent: side });
			const tribe = [0x2a5aa8, 0xa83a2a, 0x3a7a3a][lvl];
			for (let i = 0; i < 13; i++) {
				const z = -15 + i * 2.9 + r() * 0.6;
				k.person({ x: s * (6.6 + lvl * 0.3), y, z, ry: -s * (PI / 2) + 0.4 * s, s: 0.95, colors: { shirt: i % 4 ? tribe : 0xd8a040, legs: tribe, skin: 0x4a2e22, hair: 0x1a1210 }, pose: i % 5 === 0 ? "raise" : "stand", parent: side });
			}
		});
	}
	// The back wall and the falls.
	[-1, 1].forEach((s) => k.box(20, 46, 8, rock[1], { x: s * 15, y: 17, z: -27 }));
	k.box(12, 46, 4, 0x4e4438, { y: 17, z: -30 });
	const fallTex = k.canvas(64, 256, (g, w, h) => {
		g.fillStyle = "#cfeef0";
		g.fillRect(0, 0, w, h);
		for (let i = 0; i < 90; i++) {
			g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.9)" : "rgba(90,160,170,0.5)";
			g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 20 + Math.random() * 60);
		}
	});
	fallTex.wrapT = k.THREE.RepeatWrapping;
	k.plane(10.5, 42, k.mat(0xffffff, { map: fallTex, emissive: 0x3a5a60, glow: 0.4 }), { y: 15, z: -27.9, shadow: false });
	k.tick((t) => (fallTex.offset.y = t * 0.6));
	for (let i = 0; i < 9; i++) k.ico(1.3 + r() * 1.2, 0xf4fbfb, { x: -4.5 + i * 1.1, y: 0, z: -26 + r(), opacity: 0.85, shadow: false });
	k.particles(400, 0xffffff, { box: [14, 6, 6], y: 0, z: -25, speed: 1.5, size: 0.12, opacity: 0.5, drift: 0.6 });
	// The fighting ledge in the pool.
	k.box(9, 2, 7, 0x5e5244, { y: -1.35, z: -15 });
	const fighter = (x, ry, shirt, from) => {
		const p = k.person({ x, y: -0.35, z: -15, ry, colors: { shirt: 0x4a2e22, legs: shirt, skin: 0x4a2e22, hair: 0x15100c }, sleeves: 0x4a2e22, from });
		pose(p, { armL: [-1.1, 0, -0.3], armR: [-1.5, 0, 0.2], legL: [-0.4, 0, 0], legR: [0.3, 0, 0] });
		return p;
	};
	fighter(-1.2, PI / 2, 0x2a2a2a, 3);
	const foe = fighter(1.2, -PI / 2, 0x7a5a2a, 3);
	k.box(0.5, 0.18, 0.12, 0xd8c8a0, { y: 1.52, z: 0.12, parent: foe });
	// The city in the valley.
	const W = 500;
	k.ground(500, 0x5a8a48, { x: W, y: -0.3, bump: 1.5, seg: 50, height: (x, z) => Math.max(0, Math.hypot(x, z + 20) - 120) * 0.35 });
	k.box(14, 0.3, 300, 0x3a8aa0, { x: W - 30, y: -0.05, z: 0, ry: 0.3 });
	const stone = [0xd8b88a, 0xc8a070, 0xe0c8a0, 0xb88a60];
	const tops = [0x6a8a5a, 0xc8a050, 0x8a5a3a];
	const glass = k.mat(0x6ab0a8, { map: facade(k, { dark: "#4a7a74", lit: "#fff0c0", wall: "#d8c8a0", p: 0.2 }) });
	for (let i = 0; i < 46; i++) {
		const a = r() * PI * 2;
		const d = 8 + r() * 70;
		const x = W + Math.cos(a) * d;
		const z = -30 + Math.sin(a) * d * 0.8;
		const h = (14 + r() * 40) * (1.4 - d / 100);
		const w = 3 + r() * 4;
		const body = i % 3 === 0 ? glass : stone[i % 4];
		k.cyl(w, w * 1.15, h, body, { x, y: h / 2, z, seg: 8 });
		k.cone(w * 1.9, w * 0.9, tops[i % 3], { x, y: h + w * 0.4, z, seg: 10 });
		k.cyl(w * 0.4, w * 0.6, w * 1.4, stone[(i + 1) % 4], { x, y: h + w * 1.2, z, seg: 8 });
		if (i % 4 === 0) k.box(0.4, 0.4, 0.4, 0xffd890, { x, y: h + w * 2, z, emissive: 0xffb050, glow: 1.4 });
	}
	k.cyl(9, 12, 110, glass, { x: W, y: 55, z: -40, seg: 10 });
	k.cone(16, 8, 0x6a8a5a, { x: W, y: 114, z: -40, seg: 12 });
	k.cyl(3, 6, 14, 0xe0c8a0, { x: W, y: 124, z: -40, seg: 10 });
	for (let i = 0; i < 3; i++) {
		const pts = [];
		for (let j = 0; j <= 12; j++) {
			const a = (j / 12) * PI * 2;
			pts.push([W + Math.cos(a) * (40 + i * 18), 18 + i * 8 + Math.sin(a * 2) * 3, -30 + Math.sin(a) * (34 + i * 14)]);
		}
		tube(k, pts, 0.5, 0xe8e0d0, { tseg: 120, metal: 0.4 });
	}
	for (let i = 0; i < 14; i++) {
		const a = (i / 14) * PI * 2;
		k.cone(60 + r() * 30, 80 + r() * 60, i % 2 ? 0x4a6a4a : 0x557a52, { x: W + Math.cos(a) * 230, y: 30, z: -30 + Math.sin(a) * 230, seg: 7 });
	}
	trees(k, 70, [W - 150, W + 150, -150, 120], { color: 0x3a6a2a, h: 9, seed: 19, avoid: (x, z) => Math.hypot(x - W, z + 30) < 85 || Math.hypot(x - W, z - 90) < 12 });
	// The king in his suit, on a rock above the city.
	k.ico(4, 0x6a604e, { x: W, y: -1.6, z: 90, s: [1.4, 0.9, 1.2] });
	const bp = k.person({ x: W, y: 1.95, z: 90, hair: false, colors: { skin: 0x16161c, shirt: 0x1c1c24, legs: 0x1c1c24 }, from: 5 });
	[-1, 1].forEach((s) => k.cone(0.06, 0.14, 0x16161c, { x: s * 0.12, y: 1.95, z: -0.02, rz: -s * 0.3, parent: bp, seg: 4 }));
	k.torus(0.17, 0.035, 0xe8ecf4, { y: 1.55, rx: PI / 2 - 0.25, parent: bp, metal: 0.2, rough: 0.3, emissive: 0x606070, seg: 20 });
	for (let i = 0; i < 9; i++) k.cone(0.025, 0.09, 0xe8ecf4, { x: Math.cos(PI + (i / 8) * PI) * 0.17, y: 1.49, z: -Math.sin(PI + (i / 8) * PI) * 0.17, rx: PI, emissive: 0x606070, parent: bp, seg: 4 });
	[-1, 1].forEach((s) => k.box(0.08, 0.022, 0.02, 0xe8e8f0, { x: s * 0.07, y: 1.78, z: 0.192, rz: s * -0.25, emissive: 0x9a9ab0, glow: 1, parent: bp }));
	[-1, 1].forEach((s) => {
		k.box(0.03, 0.55, 0.02, 0xb070ff, { x: s * 0.13, y: 1.2, z: 0.145, rz: s * 0.35, emissive: 0x9a50ff, glow: 1.0, parent: bp });
		k.box(0.03, 0.55, 0.03, 0xb070ff, { x: s * 0.13, y: 0.45, z: 0.1, emissive: 0x9a50ff, glow: 1.0, parent: bp });
	});
	bentArm(k, bp, -1, [-0.36, 1.12, 0.22], [0.2, 1.5, 0.2], 0x1c1c24);
	bentArm(k, bp, 1, [0.36, 1.12, 0.26], [-0.2, 1.5, 0.25], 0x1c1c24);
	k.point(0xffe0c0, 4, 10, { x: W + 1, y: 4.5, z: 93, from: 5 });
	// The garden of glowing purple flowers, in a cave.
	const cave = k.group({ x: -400 });
	k.ground(40, 0x1e1a24, { parent: cave, bump: 0.3, seg: 16 });
	for (let i = 0; i < 18; i++) {
		const a = (i / 18) * PI * 2;
		k.ico(3 + r() * 3, 0x2a2434, { x: Math.cos(a) * 9, y: 2, z: Math.sin(a) * 9, parent: cave });
		k.cone(0.4, 2 + r() * 2, 0x3a3046, { x: Math.cos(a) * 6, y: 7, z: Math.sin(a) * 6, rx: PI, parent: cave, seg: 5 });
	}
	k.box(30, 1, 30, 0x2a2434, { y: 8, parent: cave });
	const herb = k.mat(0xc070ff, { emissive: 0x8a30ff, glow: 1.1, rough: 0.4 });
	for (let i = 0; i < 26; i++) {
		const x = (r() - 0.5) * 6;
		const z = (r() - 0.5) * 6 - 1;
		const h = 0.5 + r() * 0.6;
		k.cyl(0.02, 0.03, h, 0x2a5a3a, { x, y: h / 2, z, parent: cave, seg: 5 });
		for (let j = 0; j < 3; j++) k.mesh(heartGeo(k, 0.22, 0.02), herb, { x: x + Math.cos(j * 2.1) * 0.08, y: h + 0.02, z: z + Math.sin(j * 2.1) * 0.08, ry: j * 2.1, rx: -0.6, parent: cave });
		if (i % 3 === 0) k.glow(0xb060ff, 1.2, { x, y: h + 0.1, z, parent: cave });
	}
	k.point(0xb070ff, 8, 14, { y: 2.2, z: 1, parent: cave });
	k.point(0x7a90ff, 4, 14, { x: 2, y: 3, z: -2, parent: cave });
	// The mine of glowing blue ore.
	const mine = k.group({ x: -400, z: 200 });
	k.box(12, 0.4, 60, 0x2a2a30, { y: -0.2, parent: mine });
	[-1, 1].forEach((s) => {
		k.box(2, 12, 60, 0x7a7488, { x: s * 6, y: 6, parent: mine });
		k.box(0.12, 0.12, 60, 0x9aa0b0, { x: s * 0.8, y: 0.1, parent: mine, metal: 0.8 });
		for (let i = 0; i < 30; i++) k.ico(0.25 + r() * 0.5, 0x4a90ff, { x: s * 5.1, y: 0.5 + r() * 8, z: -28 + r() * 56, parent: mine, emissive: 0x2a60ff, glow: 2, rough: 0.2 });
	});
	k.box(12, 1, 60, 0x4a4656, { y: 12, parent: mine });
	hemi(k, 0x8aa0ff, 0x2a2440, 1.2, { from: 0, until: 0 });
	for (let i = 0; i < 6; i++) k.point(0x5a90ff, 5, 14, { x: (i % 2 ? 1 : -1) * 3, y: 5, z: -25 + i * 10, parent: mine });
	const pod = k.group({ y: 0.9, z: -6, parent: mine });
	k.capsule(1.2, 4, 0x3a3440, { rx: PI / 2, s: [1.2, 0.8, 1], parent: pod, metal: 0.6, rough: 0.3 });
	k.box(2.4, 0.15, 5, 0x9a70ff, { y: -0.45, parent: pod, emissive: 0x7a40ff, glow: 1.2 });
	k.box(2.2, 0.6, 2, 0x8ad0ff, { y: 0.6, z: 1.6, parent: pod, opacity: 0.6, rough: 0.1 });
	k.particles(300, 0x8ab8ff, { box: [10, 10, 50], x: -400, y: 0, z: 200, speed: 0.4, size: 0.06, opacity: 0.6 });
	return {
		shots: [
			{ pos: [-398, 2.4, 205], look: [-400, 1.4, 194], fov: 50, fog: [0x0a1428, 4, 40], exposure: 1.3 },
			{ pos: [W + 80, 70, 150], look: [W, 25, -30], fov: 48 },
			{ pos: [0, 3.5, 36], look: [0, 12, -12], fov: 55 },
			{ pos: [1.2, 1.7, -8.2], look: [0, 2.6, -18], fov: 62 },
			{ pos: [-399.2, 1.25, 1.9], look: [-400, 0.85, -0.6], fov: 40, fog: [0x1a0c2a, 3, 24], exposure: 1.35 },
			{ pos: [W + 0.9, 3.65, 94.4], look: [W, 3.3, 89.6], fov: 40 },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r110: the man-cub
function r110(k) {
	k.fog(0xa8d8a0, 50, 320);
	k.sky(0x4aa8e8, 0xe8f6c8);
	k.light({ sky: 0xf0ffe0, ground: 0x3a5a20, hemi: 1.5, sunColor: 0xfff0c0, sunIntensity: 2.3, sunPos: [30, 70, 30], shadowSize: 30 });
	const r = rng(110);
	const greens = [0x2f7a2a, 0x3a8a30, 0x256a24, 0x4a9a3a];
	const jungle = (x0, z0, n, rad, avoid, y = 0) => {
		for (let i = 0; i < n; i++) {
			const x = x0 + (r() - 0.5) * rad * 2;
			const z = z0 + (r() - 0.5) * rad * 2;
			if (avoid(x, z)) continue;
			if (i % 3 === 0) {
				// A palm.
				const h = 7 + r() * 5;
				const lean = (r() - 0.5) * 0.3;
				k.cyl(0.18, 0.28, h, 0x8a6a48, { x, y: y + h / 2, z, rz: lean, seg: 6 });
				for (let j = 0; j < 7; j++) k.cone(0.6, 3.4, greens[j % 4], { x: x - Math.sin(lean) * h + Math.cos(j) * 1.3, y: y + h - 0.2, z: z + Math.sin(j) * 1.3, rz: Math.cos(j) * 1.6, rx: Math.sin(j) * 1.6, s: [1, 1, 0.2], seg: 4 });
			} else leafy(k, x, y, z, 8 + r() * 8, { greens, trunk: 0x6a5038 });
		}
	};
	// The river and its banks.
	k.water(320, 0x3a9aa8, { amp: 0.12, opacity: 0.9 });
	k.ground(320, 0x4f8a34, { bump: 0.8, seg: 60, height: (x, z) => Math.max(-2.5, Math.min(2.5, (Math.abs(z) - 11) * 0.6)) });
	jungle(0, -40, 70, 55, (x, z) => z > -16, 2.5);
	jungle(0, 40, 50, 55, (x, z) => z < 17 || (x > -8 && x < 14 && z < 28), 2.5);
	for (let i = 0; i < 30; i++) k.cone(0.9, 2, greens[i % 4], { x: (r() - 0.5) * 90, y: 3, z: (i % 2 ? 1 : -1) * (16 + r() * 4), rx: (r() - 0.5) * 0.6, s: [1, 1, 0.3], ry: r() * 3, seg: 4 });
	// The bear, floating on his back, with the boy on his belly.
	const bear = k.group({ ry: 0.25 });
	const fur = 0x7d8798;
	const pale = 0xc8ccd6;
	k.capsule(1.3, 2.2, fur, { rz: PI / 2, y: 0.15, s: [0.72, 1, 1], parent: bear });
	k.sphere(1.15, pale, { y: 0.78, s: [1.6, 0.32, 0.88], parent: bear });
	k.sphere(0.95, fur, { x: 2.55, y: 0.45, parent: bear });
	k.sphere(0.45, pale, { x: 3.15, y: 0.9, s: [1, 0.75, 0.85], parent: bear });
	k.sphere(0.17, 0x1a1a1a, { x: 3.5, y: 1.1, parent: bear });
	[-1, 1].forEach((s) => {
		k.sphere(0.36, fur, { x: 2.2, y: 1.15, z: s * 0.72, s: [0.6, 1, 1], parent: bear });
		k.sphere(0.08, 0x111111, { x: 2.85, y: 1.28, z: s * 0.33, parent: bear });
		k.capsule(0.32, 1.1, fur, { x: 1.6, y: 0.7, z: s * 1.2, rx: s * 0.9, rz: -0.6, parent: bear });
		k.capsule(0.38, 0.9, fur, { x: -2.0, y: 0.75, z: s * 0.7, rz: 0.6, rx: s * 0.4, parent: bear });
		k.sphere(0.32, 0xa8aeb8, { x: -2.45, y: 1.35, z: s * 0.9, s: [0.5, 1, 1], rz: 0.6, parent: bear });
	});
	const boy = k.person({ x: 0.2, y: 0.45, z: 0, ry: PI / 2, pose: "sit", colors: { skin: 0xa8643a, shirt: 0xa8643a, legs: 0xa8643a, hair: 0x101010 }, parent: bear });
	k.box(0.54, 0.24, 0.32, 0xc0282a, { y: 0.88, parent: boy });
	k.sphere(0.24, 0x101010, { y: 1.82, z: -0.04, s: [1, 0.8, 1], parent: boy });
	pose(boy, { armL: [-0.6, 0, -0.4], armR: [-2.4, 0, 0.2] });
	k.tick((t) => {
		bear.position.y = Math.sin(t * 1.2) * 0.06;
		bear.rotation.z = Math.sin(t * 0.9) * 0.03;
	});
	// The tiger in the long grass.
	const stripes = k.canvas(256, 256, (g, w, h) => {
		g.fillStyle = "#e0782a";
		g.fillRect(0, 0, w, h);
		g.fillStyle = "#1a1210";
		for (let i = 0; i < 12; i++) {
			const y = 10 + i * 21;
			g.beginPath();
			g.moveTo(0, y);
			for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 5 + (x % 32 ? 4 : -4));
			g.lineTo(w, y + 7);
			for (let x = w; x >= 0; x -= 16) g.lineTo(x, y + 7 + Math.sin(x * 0.04 + i) * 3);
			g.fill();
		}
	});
	const tigerMat = k.mat(0xffffff, { map: stripes });
	const tg = quad(k, { x: -12, y: 2.5, z: -19, ry: 0.15, len: 1.8, girth: 0.5, leg: 0.6, color: tigerMat, legColor: 0xe0782a, from: 1 });
	k.sphere(0.45, tigerMat, { parent: tg.head, s: [1.1, 0.95, 1] });
	k.sphere(0.28, 0xf2e8d8, { y: -0.12, z: 0.32, s: [1.1, 0.8, 1], parent: tg.head });
	k.sphere(0.08, 0x2a1a1a, { y: 0.02, z: 0.58, parent: tg.head });
	[-1, 1].forEach((s) => {
		k.cone(0.13, 0.2, 0xe0782a, { x: s * 0.28, y: 0.38, parent: tg.head, seg: 4 });
		k.sphere(0.06, 0xf0d040, { x: s * 0.16, y: 0.14, z: 0.38, parent: tg.head, emissive: 0x806000, glow: 0.6 });
		k.sphere(0.03, 0x101010, { x: s * 0.16, y: 0.14, z: 0.43, parent: tg.head });
	});
	tube(k, [[0, 1.2, -1.3], [0.3, 1.0, -2.0], [0.7, 1.4, -2.6], [0.6, 1.9, -2.9]], 0.08, 0xe0782a, { parent: tg.g });
	for (let i = 0; i < 160; i++) {
		const x = -12 + (r() - 0.5) * 10;
		const z = -19 + (r() - 0.5) * 8 + 2.5;
		if (Math.abs(x + 12) < 1.2 && Math.abs(z + 19) < 1.8) continue;
		k.cone(0.07, 1.2 + r() * 0.8, [0xb8b050, 0x8aa040, 0xa8a848][i % 3], { x, y: 3.0, z, rx: (r() - 0.5) * 0.4, rz: (r() - 0.5) * 0.4, seg: 3, from: 1 });
	}
	// The snake in the tree, at night-green.
	const T = k.group({ x: -300 });
	k.ground(80, 0x2f5a2a, { parent: T, bump: 0.6 });
	k.cyl(1.6, 2.2, 30, 0x5a4a3a, { x: -3, y: 15, z: -2, parent: T, seg: 9 });
	k.cyl(0.5, 0.65, 13, 0x5a4a3a, { x: 3.5, y: 7, z: -0.6, rz: PI / 2 - 0.05, parent: T, seg: 8 });
	for (let i = 0; i < 9; i++) k.ico(2.5 + r() * 2, greens[i % 4], { x: -8 + r() * 18, y: 11 + r() * 4, z: -6 + r() * 5, parent: T });
	for (let i = 0; i < 14; i++) {
		const a = r() * PI * 2;
		leafy(k, -300 + Math.cos(a) * (14 + r() * 14), 0, -Math.abs(Math.sin(a)) * (14 + r() * 14) - 8, 10 + r() * 8, { greens });
	}
	const snake = 0x5f9a3a;
	const coil = [];
	for (let i = 0; i <= 40; i++) {
		const a = i * 0.55;
		coil.push([-1.4 + i * 0.16, 7 + Math.cos(a) * 0.68, -0.6 + Math.sin(a) * 0.68]);
	}
	coil.push([5.4, 7.9, 0.2], [5.9, 7.0, 1.0], [5.6, 6.0, 1.6], [4.7, 5.6, 2.1], [3.9, 5.8, 2.6]);
	tube(k, coil, 0.32, snake, { parent: T, tseg: 200 });
	tube(k, [[-1.4, 7, 0.22], [-2.2, 6, 0.5], [-2.3, 5, 0.2], [-2.0, 4.6, -0.2]], 0.22, snake, { parent: T });
	const head = k.group({ x: 3.6, y: 5.9, z: 2.9, ry: -0.35, parent: T });
	k.sphere(0.5, snake, { s: [0.85, 0.6, 1.2], parent: head });
	k.sphere(0.4, 0xd8c860, { y: -0.18, z: 0.1, s: [0.8, 0.4, 1.1], parent: head });
	const spiral = k.canvas(128, 128, (g) => {
		const cols = ["#f8e040", "#6ac040", "#b040c0", "#f08020", "#40a0e0", "#f8e040", "#e04080"];
		for (let i = 0; i < cols.length; i++) {
			g.fillStyle = cols[i];
			g.beginPath();
			g.arc(64, 64, 64 - i * 9, 0, PI * 2);
			g.fill();
		}
		g.fillStyle = "#101010";
		g.beginPath();
		g.arc(64, 64, 6, 0, PI * 2);
		g.fill();
	});
	const eyeMat = new k.THREE.MeshBasicMaterial({ map: spiral });
	const pupils = [];
	[-1, 1].forEach((s) => {
		k.sphere(0.18, 0xf0e8a0, { x: s * 0.24, y: 0.2, z: 0.25, parent: head });
		pupils.push(k.mesh(new k.THREE.CircleGeometry(0.15, 24), eyeMat, { x: s * 0.27, y: 0.22, z: 0.415, ry: s * 0.3, rx: -0.15, parent: head, shadow: false }));
	});
	k.tick((t) => pupils.forEach((p) => (p.rotation.z = t * 2)));
	k.point(0xffffe0, 4, 12, { x: -296, y: 7, z: 6 });
	// The boy, held in the coils.
	const held = k.person({ x: -0.6, y: 3.6, z: -0.1, ry: 0.5, colors: { skin: 0xa8643a, shirt: 0xa8643a, legs: 0xa8643a, hair: 0x101010 }, parent: T, from: 4 });
	k.box(0.54, 0.24, 0.32, 0xc0282a, { y: 0.88, parent: held });
	const wrap = [];
	for (let i = 0; i <= 26; i++) {
		const a = i * 0.7;
		wrap.push([-0.6 + Math.cos(a) * 0.42, 4.3 + i * 0.1, -0.1 + Math.sin(a) * 0.42]);
	}
	wrap.push([-0.4, 7.2, -0.2], [0, 7.6, -0.5]);
	tube(k, wrap, 0.24, snake, { parent: T, tseg: 140, from: 4 });
	// The elephant patrol.
	const E = k.group({ x: 300 });
	k.ground(120, 0x6a9a44, { parent: E, bump: 0.5 });
	jungle(300, 0, 50, 50, (x, z) => Math.abs(z) < 12);
	const elephant = (x, s) => {
		const e = quad(k, { x, z: 0, ry: PI / 2, s, len: 2.4, girth: 1.15, leg: 1.1, color: 0x8a8e9a, parent: E });
		k.sphere(0.95, 0x8a8e9a, { parent: e.head, y: 0.3 });
		[-1, 1].forEach((sx) => {
			k.sphere(0.8, 0x9aa0ac, { x: sx * 0.95, y: 0.25, z: -0.3, s: [0.15, 1.1, 0.9], parent: e.head });
			k.cone(0.1, 0.8, 0xf2ecd8, { x: sx * 0.45, y: -0.5, z: 0.65, rx: 1.9, seg: 6, parent: e.head });
			k.sphere(0.08, 0x111111, { x: sx * 0.55, y: 0.5, z: 0.7, parent: e.head });
		});
		tube(k, [[0, 0, 0.8], [0, -0.6, 1.1], [0, -1.3, 1.25], [0, -1.8, 1.0]], 0.2, 0x8a8e9a, { parent: e.head });
		return e;
	};
	[0, -7, -13.5, -19.5, -24.5].forEach((x, i) => {
		const e = elephant(x, i === 4 ? 0.55 : 1 - i * 0.06);
		e.legs.forEach((l, j) => (l.rotation.x = Math.sin(j * 1.7 + i) * 0.25));
	});
	// The temple ruins and the dancing king of the apes.
	const R = k.group({ x: 600 });
	k.ground(120, 0x6a7a3a, { parent: R, bump: 0.6 });
	jungle(600, -10, 40, 50, (x, z) => Math.abs(x - 600) < 18 && z > -22);
	const stone = [0xb8a888, 0xa89878, 0xc8b898];
	[[22, 16], [17, 12], [12, 8]].forEach(([w, d], i) => k.box(w, 1, d, stone[i], { y: 0.5 + i, z: -6 - i * 1.5, parent: R }));
	for (let i = 0; i < 8; i++) {
		const x = -9 + i * 2.6;
		const h = [6, 3.5, 7, 2, 6.5, 4.5, 7, 3][i];
		k.cyl(0.6, 0.7, h, stone[i % 3], { x, y: 1 + h / 2, z: -12, parent: R, seg: 8 });
		if (h > 5) k.box(1.6, 0.5, 1.6, stone[(i + 1) % 3], { x, y: 1 + h + 0.25, z: -12, parent: R });
		if (i % 2) tube(k, [[x, 1 + h, -11.5], [x + 0.4, h * 0.6, -11.3], [x - 0.2, 1.5, -11.4]], 0.06, 0x3a7a2a, { parent: R });
	}
	k.box(8, 0.8, 1.4, stone[0], { x: 0, y: 8.4, z: -12, parent: R, rz: 0.05 });
	k.cyl(0.7, 0.7, 6, stone[1], { x: 6, y: 0.7, z: 1, rz: PI / 2, ry: 0.4, parent: R, seg: 8 });
	k.box(2.4, 2.6, 1.2, stone[2], { y: 4.3, z: -10.5, parent: R });
	k.box(2.4, 0.8, 1.6, stone[1], { y: 3.4, z: -9.4, parent: R });
	const ape = (x, z, ry, s, sit) => {
		const p = k.person({ x, y: sit ? 3.0 : 1, z, ry, s, pose: sit ? "sit" : "stand", colors: { skin: 0xd8a070, shirt: 0xc0602a, legs: 0xc0602a, hair: 0xa04a1a }, parent: R });
		k.sphere(0.13, 0xe8b888, { y: 1.68, z: 0.15, s: [1.2, 0.8, 0.8], parent: p });
		return p;
	};
	const king = ape(0, -9.4, 0, 1.4, true);
	k.sphere(0.45, 0xc0602a, { y: 1.25, z: 0.05, s: [1, 1.1, 0.8], parent: king });
	pose(king, { armL: [-0.2, 0, -1.2], armR: [-0.4, 0, 1.9] });
	for (let i = 0; i < 7; i++) {
		const a = (i / 7) * PI - PI / 2;
		const m = ape(Math.sin(a) * 5, -3 + Math.cos(a) * 2, -a * 0.6, 0.6, false);
		m.userData.limbs.body.rotation.x = 0.3;
		pose(m, { armL: [0, 0, -2.5 + (i % 2)], armR: [0, 0, 2.5 - (i % 3) * 0.6], legL: [(i % 2) * 0.6, 0, 0] });
	}
	[-5, 5].forEach((x) => {
		k.cyl(0.08, 0.1, 1.6, 0x4a3020, { x, y: 1.8, z: -7, parent: R });
		k.glow(0xffa040, 2, { x, y: 2.8, z: -7, parent: R });
	});
	k.point(0xffb060, 5, 16, { y: 6, z: -2, parent: R });
	// Frame 1: a wrecked boat on a muddy bank, a basket still lodged in it.
	const Bt = k.group({ x: 0, z: 400 });
	k.ground(80, 0x6a7a3a, { parent: Bt, bump: 0.5, height: (x, z) => Math.min(1.2, Math.max(-1.5, (-z - 2) * 0.35)) });
	k.water(80, 0x4a8a8a, { y: -0.3, z: 400 + 22, amp: 0.06, seg: 24, opacity: 0.9 });
	k.box(5, 0.05, 3.4, 0x5a4a32, { x: 0.4, y: -0.18, z: 1.2, ry: 0.5, parent: Bt, rough: 1 });
	const hull = k.group({ x: 0.4, y: 0.05, z: 1.2, ry: 0.5, rz: 0.22, parent: Bt });
	[-1, 1].forEach((s) => {
		k.box(0.1, 0.55, 3.6, 0x7a5a3a, { x: s * 0.7, y: 0.3, rz: s * 0.25, parent: hull });
		k.box(0.1, 0.25, 3.0, 0x5a4028, { x: s * 0.52, y: 0.08, rz: s * 0.6, parent: hull });
	});
	k.box(1.0, 0.08, 3.4, 0x6a4a30, { y: 0.0, parent: hull });
	k.box(1.4, 0.06, 0.3, 0x5a4028, { y: 0.5, z: 0.4, parent: hull });
	k.box(0.1, 0.5, 1.2, 0x7a5a3a, { x: 1.5, y: 0.1, z: -0.8, ry: 0.7, rz: 1.3, parent: Bt });
	k.cyl(0.04, 0.05, 2.6, 0x6a5038, { x: -1.4, y: 0.06, z: 2.6, rz: PI / 2, ry: 0.4, parent: Bt });
	const basket = k.group({ y: 0.18, z: -0.9, parent: hull });
	k.cyl(0.38, 0.3, 0.3, 0xc8a060, { y: 0.15, parent: basket, seg: 14 });
	k.torus(0.37, 0.04, 0xa8803a, { y: 0.3, rx: PI / 2, parent: basket, seg: 20 });
	for (let i = 0; i < 3; i++) k.torus(0.34 - i * 0.02, 0.012, 0x9a7030, { y: 0.06 + i * 0.08, rx: PI / 2, parent: basket, seg: 20 });
	k.sphere(0.3, 0xe8dcc0, { y: 0.28, s: [1, 0.35, 1], parent: basket });
	for (let i = 0; i < 40; i++) k.cone(0.04, 0.6 + r() * 0.8, [0x5a8a3a, 0x7a9a40][i % 2], { x: (r() - 0.5) * 10, y: 0.4, z: -3 - r() * 3, rx: (r() - 0.5) * 0.4, seg: 3, parent: Bt });
	for (let i = 0; i < 10; i++) k.ico(0.15 + r() * 0.25, 0x7a7466, { x: (r() - 0.5) * 8, y: 0.0, z: 2 + r() * 3, parent: Bt });
	for (let i = 0; i < 12; i++) leafy(k, (r() - 0.5) * 40, 1.2, 400 - 7 - r() * 12, 9 + r() * 6, { greens });
	return {
		shots: [
			{ pos: [3.4, 2.4, 404.4], look: [0.3, 0.3, 400.6], fov: 46 },
			{ pos: [-10.8, 3.5, -14.3], look: [-12, 3.3, -18.5], fov: 42 },
			{ pos: [306, 1.8, 13], look: [292, 2.4, 0], fov: 50 },
			{ pos: [604.5, 3.6, 4.5], look: [600, 3.6, -9], fov: 50 },
			{ pos: [-295, 5.4, 9], look: [-299, 5.7, 0], fov: 48 },
			{ pos: [3.6, 2.7, 7.4], look: [0.8, 0.9, 0], fov: 46 },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r111: the frozen herd
function r111(k) {
	k.fog(0xdcecf8, 60, 420);
	k.sky(0x6aaee8, 0xf2f8ff);
	k.light({ sky: 0xf4faff, ground: 0x8aa0b8, hemi: 1.4, sunColor: 0xfff4e0, sunIntensity: 2.2, sunPos: [30, 50, 40], shadowSize: 30 });
	const r = rng(111);
	const snow = 0xf0f6fc;
	k.ground(600, snow, { bump: 1.2, seg: 60, height: (x, z) => Math.max(0, Math.abs(x) - 70) * 0.3 });
	for (let i = 0; i < 16; i++) {
		const a = (i / 16) * PI * 2;
		k.cone(50 + r() * 30, 80 + r() * 70, i % 2 ? 0xdfeaf6 : 0xc8daf0, { x: Math.cos(a) * 260, y: 30, z: Math.sin(a) * 260, seg: 6, ry: r() });
	}
	k.particles(1500, 0xffffff, { box: [60, 25, 60], speed: 1.5, size: 0.08, opacity: 0.8, drift: 0.5 });
	// The mammoth, the sloth and the sabre-tooth, walking with the baby.
	const brown = 0x6a4a32;
	const m = quad(k, { x: 0, z: 0, ry: PI / 2, len: 2.8, girth: 1.55, leg: 1.5, color: brown });
	for (let i = 0; i < 18; i++) {
		const a = (i / 18) * PI * 2;
		k.cone(0.45, 1.3, 0x553a26, { x: Math.cos(a) * 1.35, y: 2.0, z: Math.sin(a) * 2.2, rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3, rotation: 0, seg: 4, parent: m.g, s: [1, 1, 1] });
	}
	k.sphere(1.15, brown, { y: 0.9, z: 0.1, parent: m.head, s: [1, 1.15, 1] });
	k.sphere(0.5, 0x553a26, { y: 2.0, z: -0.2, parent: m.head });
	tube(k, [[0, 0.2, 0.9], [0, -0.6, 1.3], [0, -1.6, 1.4], [0, -2.3, 1.2], [0, -2.5, 0.9]], 0.28, brown, { parent: m.head });
	[-1, 1].forEach((s) => {
		k.torus(1.0, 0.13, 0xf2ead2, { x: s * 0.7, y: -0.6, z: 1.3, ry: PI / 2, rz: PI * 0.75, arc: PI * 0.9, parent: m.head, seg: 16 });
		k.sphere(0.1, 0x111111, { x: s * 0.72, y: 0.9, z: 0.85, parent: m.head });
		k.sphere(0.5, 0x553a26, { x: s * 1.05, y: 0.8, z: -0.2, s: [0.3, 1, 1], parent: m.head });
	});
	const baby = k.person({ x: 0, y: m.top - 0.25, z: 0.6, s: 0.45, pose: "sit", colors: { shirt: 0xb08a5a, legs: 0xb08a5a, skin: 0xe8b890, hair: 0x2a1a10 }, parent: m.g });
	pose(baby, { armL: [0, 0, -2.6], armR: [0, 0, 2.6] });
	// The sloth.
	const sid = k.group({ x: 4.6, z: 1.6, ry: 0.5 });
	const sloth = 0x9aa088;
	k.sphere(0.55, sloth, { y: 0.95, s: [1, 1.35, 0.9], parent: sid });
	k.sphere(0.38, 0xc0c4a8, { y: 0.85, z: 0.25, s: [1, 1.3, 0.6], parent: sid });
	k.cyl(0.18, 0.24, 0.6, sloth, { y: 1.75, z: 0.05, rx: 0.3, parent: sid });
	k.sphere(0.32, sloth, { y: 2.1, z: 0.2, s: [1.1, 0.9, 1.2], parent: sid });
	k.sphere(0.13, 0x7a6a5a, { y: 2.05, z: 0.55, s: [1.3, 0.8, 1], parent: sid });
	k.sphere(0.05, 0x2a1a1a, { y: 2.08, z: 0.66, parent: sid });
	[-1, 1].forEach((s) => {
		k.sphere(0.13, 0xffffff, { x: s * 0.26, y: 2.2, z: 0.3, parent: sid });
		k.sphere(0.055, 0x101010, { x: s * 0.31, y: 2.22, z: 0.4, parent: sid });
		k.cyl(0.09, 0.07, 0.75, sloth, { x: s * 0.52, y: 1.1, z: 0.25, rx: -0.5, rz: s * 0.4, parent: sid });
		k.cyl(0.12, 0.1, 0.5, sloth, { x: s * 0.25, y: 0.22, parent: sid });
		k.box(0.22, 0.08, 0.3, 0x7a6a5a, { x: s * 0.25, y: 0.04, z: 0.08, parent: sid });
	});
	k.box(0.11, 0.09, 0.03, 0xffffff, { y: 1.95, z: 0.6, parent: sid });
	// The sabre-tooth.
	const tan = 0xc8955a;
	const d = quad(k, { x: -5.2, z: 1.2, ry: PI / 2, len: 1.7, girth: 0.52, leg: 0.75, color: tan });
	k.sphere(0.42, tan, { parent: d.head, s: [1.1, 1, 1.1] });
	k.sphere(0.25, 0xead8b8, { y: -0.12, z: 0.32, parent: d.head, s: [1.2, 0.8, 1] });
	k.sphere(0.07, 0x2a1a1a, { y: 0.02, z: 0.55, parent: d.head });
	[-1, 1].forEach((s) => {
		k.cone(0.05, 0.42, 0xffffff, { x: s * 0.1, y: -0.38, z: 0.42, rx: PI, seg: 5, parent: d.head });
		k.cone(0.12, 0.2, tan, { x: s * 0.26, y: 0.36, z: -0.05, seg: 4, parent: d.head });
		k.sphere(0.05, 0x3a2a10, { x: s * 0.17, y: 0.14, z: 0.38, parent: d.head });
	});
	tube(k, [[0, 1.2, -1.2], [0, 1.1, -1.7], [0, 1.4, -2.1]], 0.08, tan, { parent: d.g });
	// The sabre pack above the hunters' camp.
	const camp = k.group({ x: 0, z: -150 });
	for (let i = 0; i < 7; i++) {
		const a = (i / 7) * PI * 2;
		k.cone(2.2, 4, [0x8a6a4a, 0x7a5a3a, 0x9a7a5a][i % 3], { x: Math.cos(a) * 8, y: 2, z: Math.sin(a) * 8, seg: 7, parent: camp });
		k.person({ x: Math.cos(a + 0.4) * 4.5, z: Math.sin(a + 0.4) * 4.5, ry: -a, colors: { shirt: 0x7a5a3a, legs: 0x5a4028, hair: 0x2a1a10 }, parent: camp });
	}
	k.glow(0xff9a40, 4, { y: 0.8, parent: camp });
	k.point(0xff9a40, 6, 20, { y: 2, parent: camp });
	for (let i = 0; i < 6; i++) k.ico(0.8 + i * 0.5, 0xb8c0c8, { y: 2 + i * 1.8, x: i * 0.4, parent: camp, opacity: 0.5 - i * 0.06, shadow: false });
	k.ico(9, 0x6a6e78, { x: 22, y: -3, z: -104, s: [1.4, 0.9, 1] });
	k.ico(6, 0x5a5e68, { x: 30, y: 0, z: -98 });
	[[18, -102, 0.0], [22, -99, 0.4], [25, -104, -0.3]].forEach(([x, z, a], i) => {
		const s = quad(k, { x, y: 4.6, z, ry: PI + 0.5 + a, len: 1.6, girth: 0.5, leg: 0.7, color: i === 1 ? tan : 0x8a8a92 });
		k.sphere(0.4, i === 1 ? tan : 0x8a8a92, { parent: s.head });
		[-1, 1].forEach((sx) => k.cone(0.05, 0.4, 0xffffff, { x: sx * 0.1, y: -0.36, z: 0.3, rx: PI, seg: 5, parent: s.head }));
	});
	// The wall of ice with things frozen inside.
	const W = k.group({ x: -600 });
	k.ground(80, snow, { parent: W, bump: 0.4 });
	k.cyl(0.8, 3, 1, 0x2a2a30, { x: -4, y: 3, z: -2.5, parent: W, metal: 0.6, rough: 0.3, seg: 16 });
	k.sphere(1, 0x6a8a9a, { x: -4, y: 3.5, z: -2.5, parent: W, s: [1, 0.5, 1], opacity: 0.8 });
	k.glow(0xa0ff80, 0.8, { x: -3, y: 2.6, z: -2.2, parent: W });
	const bones = 0x4a5058;
	k.capsule(0.8, 2, bones, { x: 5, y: 3, z: -2.5, rz: PI / 2, parent: W });
	tube(k, [[6.5, 3.4, -2.5], [8, 5, -2.5], [8.5, 7, -2.5], [9.4, 7.6, -2.5]], 0.25, bones, { parent: W });
	tube(k, [[3.5, 3, -2.5], [2.3, 2.6, -2.5], [1.2, 3.2, -2.5]], 0.22, bones, { parent: W });
	[4.3, 5.9].forEach((x) => k.cyl(0.18, 0.15, 2, bones, { x, y: 1.6, z: -2.5, parent: W }));
	k.sphere(0.45, 0xd88a50, { x: -10, y: 6, z: -2.4, s: [1.5, 0.8, 0.4], parent: W });
	k.cone(0.4, 0.6, 0xd88a50, { x: -11, y: 6, z: -2.4, rz: -PI / 2, s: [1, 1, 0.4], parent: W });
	k.box(30, 13, 3, 0x88c4ec, { y: 6.5, z: -2.5, parent: W, opacity: 0.6, rough: 0.1, emissive: 0x1a4a6a, glow: 0.4 });
	k.box(30, 13, 3, 0x6aa4d0, { y: 6.5, z: -6, parent: W });
	for (let i = 0; i < 9; i++) k.cone(1 + (i % 3), 4 + (i % 4) * 2, 0xd8eefa, { x: -14 + i * 3.5, y: 13 + (i % 4), z: -3, parent: W, seg: 5 });
	k.spot(0xe8f8ff, 20, { x: -600, y: 12, z: 14, target: [-600, 5, -2], angle: 0.6 });
	// An icy pinnacle, an acorn, and its desperate owner.
	const P = k.group({ x: 300 });
	k.cyl(2.2, 4.5, 8, 0xc8e4f4, { y: 4, seg: 7, parent: P, rough: 0.3 });
	k.cyl(2.4, 2.2, 0.6, snow, { y: 8.1, seg: 9, parent: P });
	for (let i = 0; i < 10; i++) k.cone(1 + r() * 2, 6 + r() * 10, 0xc0dcf0, { x: (r() - 0.5) * 30, y: 3, z: -6 - r() * 20, parent: P, seg: 5 });
	const acorn = k.group({ x: 0.15, y: 8.38, z: 0.1, rz: 0.3, rx: 0.2, parent: P });
	k.sphere(0.2, 0xc8904a, { s: [1, 1.3, 1], parent: acorn, seg: 12 });
	k.sphere(0.215, 0x6a4424, { y: 0.1, s: [1, 0.7, 1], parent: acorn, seg: 10, rings: 6 });
	k.cyl(0.025, 0.03, 0.12, 0x5a3a20, { y: 0.28, parent: acorn });
	for (let i = 0; i < 6; i++) k.box(0.015, 0.01, 0.3 + r() * 0.35, 0x2a6a9a, { x: 0.15 + Math.cos(i) * 0.3, y: 8.405, z: 0.1 + Math.sin(i) * 0.3, ry: -i + PI / 2, parent: P, emissive: 0x1a4a8a, from: 5, shadow: false });
	const sq = k.group({ x: -0.2, y: 8.4, z: 0.12, ry: 1.1, rz: 0, parent: P, from: 5 });
	const fur = 0x9a8268;
	k.capsule(0.13, 0.22, fur, { y: 0.32, rx: 0.4, parent: sq });
	k.sphere(0.14, fur, { y: 0.58, z: 0.16, s: [1, 1, 1.2], parent: sq });
	k.cone(0.07, 0.22, fur, { y: 0.55, z: 0.36, rx: PI / 2, parent: sq, seg: 6 });
	k.sphere(0.03, 0x1a1010, { y: 0.56, z: 0.47, parent: sq });
	[-1, 1].forEach((s) => {
		k.sphere(0.075, 0xffffff, { x: s * 0.07, y: 0.67, z: 0.24, parent: sq });
		k.sphere(0.03, 0x101010, { x: s * 0.075, y: 0.68, z: 0.31, parent: sq });
		k.cone(0.05, 0.12, fur, { x: s * 0.1, y: 0.75, z: 0.08, parent: sq, seg: 4 });
		rod(k, [s * 0.09, 0.4, 0.12], [s * 0.06, 0.3, 0.34], 0.04, fur, { parent: sq });
		k.cyl(0.04, 0.03, 0.22, fur, { x: s * 0.07, y: 0.1, parent: sq });
	});
	[-0.02, 0.02].forEach((x) => k.box(0.035, 0.09, 0.02, 0xfffff0, { x, y: 0.46, z: 0.36, parent: sq }));
	const tail = [];
	for (let i = 0; i < 8; i++) tail.push(k.sphere(0.08 + Math.sin((i / 7) * PI) * 0.06, fur, { x: 0, y: 0.25 + Math.sin(i * 0.4) * 0.5, z: -0.15 - Math.sin(i * 0.3) * 0.25 + (i > 5 ? (i - 5) * 0.08 : 0), parent: sq }));
	k.tick((t) => (sq.rotation.z = Math.sin(t * 8) * 0.03));
	return {
		shots: [
			{ pos: [-13, 2.6, -139], look: [1, 1.4, -153], fov: 46 },
			{ pos: [-600, 5, 17], look: [-600, 5.5, -2], fov: 52 },
			{ pos: [27, 9, -91], look: [2, 0, -150], fov: 50 },
			{ pos: [5.9, 2.15, 4.4], look: [4.6, 1.9, 1.6], fov: 40 },
			{ pos: [1.5, 2.6, 12.5], look: [-0.3, 2.2, 0], fov: 50 },
			{ pos: [301.1, 8.95, 1.6], look: [300, 8.55, 0.1], fov: 42 },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r112: the bridge of petals
function r112(k) {
	k.fog(0x2a1a4a, 40, 520);
	k.sky(0x140c38, 0x6a2a6a, { offset: -0.05 });
	k.stars(1200);
	k.light({ sky: 0xa898e8, ground: 0x3a2030, hemi: 1.5, sunColor: 0xb8b0ff, sunIntensity: 0.9, sunPos: [-30, 60, 30], shadowSize: 35 });
	const r = rng(112);
	// A crumpled pom-pom of petals, shared by every flower.
	const bloom = new k.THREE.IcosahedronGeometry(1, 2);
	const bp = bloom.attributes.position;
	const seen = new Map();
	for (let i = 0; i < bp.count; i++) {
		const key = `${bp.getX(i).toFixed(3)},${bp.getY(i).toFixed(3)},${bp.getZ(i).toFixed(3)}`;
		if (!seen.has(key)) seen.set(key, 0.62 + r() * 0.5);
		const f = seen.get(key);
		bp.setXYZ(i, bp.getX(i) * f, bp.getY(i) * f * 0.8, bp.getZ(i) * f);
	}
	bloom.computeVertexNormals();
	const orange = [k.mat(0xff8a10, { emissive: 0x803000, glow: 0.45 }), k.mat(0xffa020, { emissive: 0x804000, glow: 0.45 }), k.mat(0xf06a08, { emissive: 0x702000, glow: 0.45 })];
	let mi = 0;
	const marigold = (x, y, z, s = 1, o = {}) => k.mesh(bloom, orange[mi++ % 3], { x, y: y + 0.03 * s, z, s: 0.1 * s, ry: mi, ...o });
	const candle = (x, y, z, o = {}) => {
		k.cyl(0.04, 0.04, 0.18, 0xf2ead8, { x, y: y + 0.09, z, ...o });
		k.glow(0xffb040, 0.35, { x, y: y + 0.22, z, ...o });
	};
	// The cemetery.
	k.ground(300, 0x3a2e30, { bump: 0.4 });
	for (let i = 0; i < 36; i++) {
		const x = -16 + (i % 9) * 4 + (r() - 0.5);
		const z = 8 - Math.floor(i / 9) * 5;
		if (Math.abs(x) < 2.5) continue;
		const g = k.group({ x, z, ry: (r() - 0.5) * 0.2 });
		if (i % 4 === 0) {
			k.box(0.18, 1.6, 0.18, 0x9a948a, { y: 0.8, parent: g });
			k.box(0.8, 0.18, 0.18, 0x9a948a, { y: 1.15, parent: g });
		} else {
			k.box(0.9, 1.0, 0.25, 0x8a8478, { y: 0.5, parent: g });
			k.cyl(0.45, 0.45, 0.25, 0x8a8478, { y: 1.0, rx: PI / 2, parent: g, seg: 12 });
		}
		k.box(1, 0.15, 1.8, 0x4a3a30, { y: 0.07, z: 1.1, parent: g });
		for (let j = 0; j < 6; j++) marigold((r() - 0.5) * 0.8, 0.18, 0.4 + r() * 1.4, 1.2, { parent: g });
		candle(-0.3, 0.15, 0.4, { parent: g });
		candle(0.35, 0.15, 0.5, { parent: g });
	}
	for (let i = 0; i < 6; i++) k.point(0xff9a40, 4, 14, { x: (i % 3) * 10 - 10, y: 2, z: 6 - Math.floor(i / 3) * 10 });
	for (let i = 0; i < 6; i++) k.person({ x: (r() - 0.5) * 26, z: 10 - r() * 14, ry: r() * 6, s: 0.95, colors: { shirt: [0x6a2a4a, 0x2a4a6a, 0x8a5a2a][i % 3], legs: 0x2a2a30, skin: 0xb07a50, hair: 0x101010 }, dress: i % 2 ? 0x5a2a5a : undefined });
	const picado = k.canvas(128, 128, (g, w, h) => {
		g.fillStyle = "#fff";
		g.fillRect(0, 0, w, h);
		g.globalCompositeOperation = "destination-out";
		for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
			g.beginPath();
			g.arc(16 + i * 32, 20 + j * 28, 7, 0, PI * 2);
			g.fill();
		}
		g.fillRect(0, h - 14, w, 14);
	});
	const flags = [0xe8408a, 0x40a8e8, 0xf2c030, 0x8a50d8, 0x50c878, 0xff7030].map((c) => new k.THREE.MeshStandardMaterial({ color: c, map: picado, transparent: true, side: k.THREE.DoubleSide, alphaTest: 0.3, emissive: c, emissiveIntensity: 0.3 }));
	const banner = (a, b, n, o = {}) => {
		for (let i = 0; i < n; i++) {
			const t = (i + 0.5) / n;
			const x = a[0] + (b[0] - a[0]) * t;
			const y = a[1] + (b[1] - a[1]) * t - Math.sin(t * PI) * 0.6;
			const z = a[2] + (b[2] - a[2]) * t;
			k.plane(0.5, 0.6, flags[i % flags.length], { x, y: y - 0.3, z, ry: o.ry ?? 0, shadow: false, ...o });
		}
	};
	banner([-14, 4.5, 4], [14, 4.5, 4], 28);
	banner([-14, 4.5, -4], [14, 4.5, -4], 28);
	// The marigold bridge, rising to the city of the dead.
	const path = new k.THREE.CatmullRomCurve3([[0, 0.2, -14], [0, 4, -40], [-6, 16, -100], [-10, 26, -170], [-4, 28, -230], [0, 22, -280], [0, 16, -305]].map((p) => vec(k, p)));
	const petal = k.mat(0xff8a1a, { emissive: 0xff6a00, glow: 0.75 });
	const N = 180;
	for (let i = 0; i < N; i++) {
		const a = path.getPointAt(i / N);
		const b = path.getPointAt((i + 1) / N);
		rod(k, [a.x, a.y, a.z], [b.x, b.y, b.z], 6.5, petal, { d: 0.5, from: 4 });
		if (i % 3 === 0) [-1, 1].forEach((s) => k.glow(i % 2 ? 0xffb040 : 0xff8020, 2, { x: a.x + s * 3.1, y: a.y + 0.4, z: a.z, from: 4 }));
	}
	k.particles(600, 0xffa030, { box: [12, 30, 80], x: -4, y: 0, z: -60, speed: 1.2, size: 0.12, opacity: 0.9, drift: 0.8, from: 4 });
	// The city: stacked, painted towers, all lit up.
	const cols = [0xd04a8a, 0x2aa8a0, 0xe8b040, 0x7a3ab0, 0xe8703a, 0x3a6ad0];
	const tex = facade(k, { lit: "#fff0a0", dark: "#3a2a4a", wall: "#ffffff", p: 0.55, cols: 5, rows: 8 });
	const cmats = cols.map((c) => k.mat(c, { map: tex, emissive: c, glow: 0.22 }));
	for (let i = 0; i < 24; i++) {
		const x = (r() - 0.5) * 220;
		const z = -330 - r() * 140;
		let y = -10;
		const levels = 4 + Math.floor(r() * 7);
		let w = 14 + r() * 10;
		for (let j = 0; j < levels; j++) {
			const h = 5 + r() * 8;
			k.box(w, h, w * (0.7 + r() * 0.4), cmats[(i + j) % cmats.length], { x: x + (r() - 0.5) * 4, y: y + h / 2, z, ry: (r() - 0.5) * 0.4, from: 4 });
			y += h;
			w *= 0.82;
		}
		k.cone(w * 0.5, 10, cmats[i % cmats.length], { x, y: y + 5, z, seg: 6, from: 4 });
		for (let j = 0; j < 4; j++) k.glow([0xffd060, 0xff60c0, 0x60e0ff][j % 3], 6, { x: x + (r() - 0.5) * 14, y: r() * y, z: z + 10, from: 4 });
	}
	k.glow(0xff9ad8, 260, { x: 0, y: 40, z: -420, opacity: 0.45, from: 4 });
	k.disc(0xfff6e0, 22, { x: 120, y: 140, z: -400 });
	// Two travellers on the bridge: a skeleton in a straw hat and a boy in a red hoodie, and their dog.
	const at = path.getPointAt(0.115);
	const pair = k.group({ x: at.x, y: at.y + 0.25, z: at.z, ry: 0.15, from: 5 });
	const sk = k.person({ x: -0.7, colors: { skin: 0xf2ece0, shirt: 0xe8d8a8, legs: 0x5a4030, hair: 0x2a1a10 }, sleeves: 0xf2ece0, hat: 0xd8b870, parent: pair });
	[-1, 1].forEach((s) => k.sphere(0.06, 0x101010, { x: s * 0.075, y: 1.79, z: 0.165, s: [1, 1.2, 0.6], parent: sk }));
	k.box(0.04, 0.04, 0.02, 0x101010, { y: 1.71, z: 0.195, rz: PI / 4, parent: sk });
	for (let i = 0; i < 5; i++) k.box(0.012, 0.05, 0.02, 0x2a2a2a, { x: -0.06 + i * 0.03, y: 1.64, z: 0.185, parent: sk });
	k.box(0.3, 0.12, 0.08, 0xc0282a, { y: 1.52, z: 0.12, parent: sk });
	pose(sk, { armR: [0, 0, 0.5] });
	const boy = k.person({ x: 0.55, s: 0.72, colors: { skin: 0xb57a50, shirt: 0xc8282a, legs: 0x3a4a7a, hair: 0x101010 }, sleeves: 0xc8282a, parent: pair });
	k.box(0.3, 0.42, 0.02, 0xf2f2f2, { y: 1.22, z: 0.145, parent: boy });
	faceEyes(k, boy, { r: 0.035, dx: 0.07, z: 0.17 });
	pose(boy, { armL: [0, 0, -0.5] });
	const dog = quad(k, { x: 1.6, z: 0.5, ry: -0.5, len: 0.6, girth: 0.22, leg: 0.3, color: 0x3a3a40, parent: pair });
	k.sphere(0.2, 0x3a3a40, { parent: dog.head, s: [0.9, 0.9, 1.2] });
	k.box(0.07, 0.14, 0.02, 0xe86a8a, { y: -0.18, z: 0.16, parent: dog.head });
	k.point(0xffb060, 6, 10, { x: at.x + 2, y: at.y + 3, z: at.z + 3, from: 5 });
	// The family altar.
	const O = k.group({ x: 300 });
	k.box(14, 1, 14, 0x6a3a2a, { y: -0.5, parent: O });
	k.box(14, 8, 0.5, 0xc8784a, { y: 4, z: -2, parent: O });
	[[3.2, 0.7, 1.4, 0.35, 0], [2.6, 0.6, 1.0, 1.0, -0.4], [2.0, 0.6, 0.7, 1.6, -0.75]].forEach(([w, h, d, y, z]) => k.box(w, h, d, 0xf4f0e8, { y, z, parent: O }));
	const photo = k.canvas(96, 128, (g, w, h) => {
		g.fillStyle = "#d8c098";
		g.fillRect(0, 0, w, h);
		g.fillStyle = "#6a4a30";
		g.beginPath();
		g.ellipse(48, 52, 20, 26, 0, 0, PI * 2);
		g.fill();
		g.fillRect(18, 84, 60, 44);
	});
	const photoMat = k.mat(0xffffff, { map: photo });
	[[-0.8, 1.9, -0.82], [0, 2.1, -0.82], [0.8, 1.95, -0.82], [-0.6, 1.35, -0.46], [0.6, 1.35, -0.46]].forEach(([x, y, z], i) => {
		k.box(0.42, 0.52, 0.05, 0x3a2414, { x, y, z, parent: O });
		k.plane(0.34, 0.44, photoMat, { x, y, z: z + 0.03, parent: O });
		if (i === 1) k.box(0.12, 0.2, 0.02, 0x3a2414, { x: 0.05, y: 2.25, z: z + 0.04, parent: O });
	});
	for (let i = 0; i < 18; i++) candle(-1.4 + (i % 9) * 0.35, i < 9 ? 0.7 : 1.3, i < 9 ? 0.45 : -0.15, { parent: O });
	for (let i = 0; i < 5; i++) {
		k.sphere(0.1, 0xf8f8f8, { x: -0.9 + i * 0.45, y: 1.38, z: 0.1, parent: O, s: [1, 1.1, 1] });
		[-1, 1].forEach((s) => k.sphere(0.025, [0xe84080, 0x40a0e8, 0x50c050][i % 3], { x: -0.9 + i * 0.45 + s * 0.035, y: 1.4, z: 0.19, parent: O }));
	}
	k.sphere(0.18, 0xc8803a, { x: 0.9, y: 1.4, z: 0.15, s: [1, 0.6, 1], parent: O });
	for (let i = 0; i < 70; i++) marigold(-1.6 + r() * 3.2, i < 40 ? 0.05 : 0.72, i < 40 ? 0.9 + r() * 1.4 : 0.6 + r() * 0.1, 1.3, { parent: O });
	for (let i = 0; i < 40; i++) k.box(0.05, 0.01, 0.07, 0xff9a20, { x: (r() - 0.5) * 3, y: 0.01, z: 1 + r() * 2.5, ry: r() * 3, parent: O, emissive: 0x803000, shadow: false });
	banner([-2, 3.6, -1.2], [2, 3.6, -1.2], 8, { parent: O });
	k.point(0xffa040, 6, 8, { y: 2, z: 1.5, parent: O });
	k.point(0xffc080, 3, 10, { x: 2, y: 3, z: 3, parent: O });
	// The white guitar with the skull, in its tomb.
	const G = k.group({ x: -300 });
	k.box(14, 1, 14, 0x5a5048, { y: -0.5, parent: G });
	k.box(10, 8, 0.6, 0xd8cfc0, { y: 4, z: -1, parent: G });
	k.box(3, 4.6, 0.3, 0x8a7a6a, { y: 2.3, z: -0.62, parent: G });
	k.cyl(1.5, 1.5, 0.3, 0x8a7a6a, { y: 4.6, z: -0.62, rx: PI / 2, parent: G, seg: 20 });
	const gt = k.group({ y: 2.2, z: -0.4, rz: 0.05, parent: G });
	k.cyl(0.42, 0.42, 0.14, 0xf6f2ea, { y: -0.35, rx: PI / 2, parent: gt, seg: 24 });
	k.cyl(0.32, 0.32, 0.14, 0xf6f2ea, { y: 0.15, rx: PI / 2, parent: gt, seg: 24 });
	k.cyl(0.12, 0.12, 0.15, 0x1a1210, { y: 0.0, rx: PI / 2, parent: gt, seg: 16 });
	k.torus(0.15, 0.025, 0xd8b040, { y: 0, z: 0.075, parent: gt, metal: 0.8, rough: 0.3 });
	k.torus(0.42, 0.02, 0xd8b040, { y: -0.35, z: 0.072, parent: gt, metal: 0.8, arc: PI, rz: PI });
	k.box(0.11, 0.9, 0.06, 0x2a1a10, { y: 0.85, parent: gt });
	k.sphere(0.16, 0xf6f2ea, { y: 1.43, parent: gt, s: [1, 1.05, 0.6] });
	k.box(0.18, 0.08, 0.08, 0xf6f2ea, { y: 1.28, parent: gt });
	[-1, 1].forEach((s) => {
		k.sphere(0.04, 0x101010, { x: s * 0.055, y: 1.45, z: 0.08, parent: gt, s: [1, 1.2, 0.5] });
		k.cyl(0.02, 0.02, 0.12, 0xd8b040, { x: s * 0.18, y: 1.4, rz: PI / 2, parent: gt, metal: 0.8 });
	});
	k.box(0.14, 0.03, 0.06, 0x2a1a10, { y: -0.5, z: 0.06, parent: gt });
	for (let i = 0; i < 6; i++) k.box(0.006, 1.8, 0.006, 0xe8e8e8, { x: -0.04 + i * 0.016, y: 0.35, z: 0.08, parent: gt, shadow: false });
	for (let i = 0; i < 30; i++) marigold(-2 + r() * 4, 0.05, 0.2 + r() * 2, 1.4, { parent: G });
	for (let i = 0; i < 8; i++) candle(-1.6 + i * 0.45, 0, 0.3 + (i % 2) * 0.4, { parent: G });
	k.spot(0xfff0d8, 30, { x: -300, y: 6, z: 4, target: [-300, 2, -0.5], angle: 0.35 });
	k.point(0xffa040, 4, 8, { y: 1, z: 1.5, parent: G });
	// The family workshop: shoes on the bench.
	const Sh = k.group({ x: 600 });
	k.box(16, 1, 16, 0x8a6a4a, { y: -0.5, parent: Sh });
	k.box(16, 7, 0.4, 0xe0c8a0, { y: 3.5, z: -2.4, parent: Sh });
	k.box(0.4, 7, 10, 0xd8bc92, { x: -3.2, y: 3.5, z: 2, parent: Sh });
	k.box(2.2, 1.4, 0.1, 0xfff4d8, { x: -1.2, y: 3.3, z: -2.18, parent: Sh, emissive: 0xffe8b0, glow: 0.9 });
	k.box(0.08, 1.4, 0.12, 0x5a3a20, { x: -1.2, y: 3.3, z: -2.12, parent: Sh });
	k.box(4.6, 0.12, 1.4, 0x7a4a28, { x: 0.4, y: 1.0, z: -1.4, parent: Sh });
	[[-1.7, -0.8], [2.5, -0.8], [-1.7, -2], [2.5, -2]].forEach(([x, z]) => k.box(0.12, 1.0, 0.12, 0x5a3a20, { x, y: 0.5, z, parent: Sh }));
	k.box(4.6, 0.08, 0.5, 0x6a4024, { x: 0.4, y: 2.2, z: -2.0, parent: Sh });
	const shoeCols = [0x6a3a1e, 0x2a1a14, 0x8a5a2e, 0xa8432a, 0x3a2418];
	const shoe = (x, y, z, ry, c) => {
		const g = k.group({ x, y, z, ry, parent: Sh });
		k.box(0.13, 0.025, 0.34, 0x1a1210, { y: 0.012, parent: g });
		k.box(0.12, 0.05, 0.08, 0x1a1210, { y: 0.035, z: -0.13, parent: g });
		k.sphere(0.075, c, { y: 0.05, z: 0.06, s: [0.85, 0.75, 1.6], parent: g, rough: 0.5 });
		k.box(0.12, 0.1, 0.13, c, { y: 0.09, z: -0.09, parent: g, rough: 0.5 });
		return g;
	};
	for (let i = 0; i < 8; i++) shoe(-1.5 + (i >> 1) * 0.95 + (i % 2) * 0.17, 2.24, -2.0, 0.08, shoeCols[(i >> 1) % 5]);
	[[-1.3, -1.6, 0.2, 0x2a1a14], [-1.1, -1.55, 0.1, 0x2a1a14], [-0.7, -1.75, -0.3, 0xa8432a], [0.5, -1.8, 0.9, 0x6a3a1e]].forEach(([x, z, ry, c]) => shoe(x, 1.06, z, ry, c));
	shoe(-0.2, 1.06, -1.2, 0.6, 0x8a5a2e);
	shoe(0.15, 1.06, -1.05, 0.3, 0x8a5a2e);
	k.box(0.11, 0.18, 0.3, 0xb89a70, { x: 0.8, y: 1.15, z: -1.3, ry: -0.3, parent: Sh });
	k.cyl(0.02, 0.02, 0.3, 0x6a4a30, { x: 1.3, y: 1.075, z: -1.0, rz: PI / 2, ry: 0.5, parent: Sh });
	k.box(0.12, 0.06, 0.06, 0x8a8a90, { x: 1.43, y: 1.08, z: -1.07, ry: 0.5, parent: Sh, metal: 0.7, rough: 0.3 });
	k.box(0.5, 0.01, 0.35, 0x9a6a3a, { x: 1.7, y: 1.065, z: -1.5, ry: 0.4, parent: Sh });
	for (let i = 0; i < 6; i++) k.cyl(0.006, 0.006, 0.05, 0xb0b0b8, { x: 1.0 + i * 0.05, y: 1.08, z: -0.9 + (i % 2) * 0.04, rz: PI / 2, parent: Sh, metal: 0.8 });
	k.cyl(0.15, 0.18, 0.5, 0x5a3a20, { x: 2.0, y: 0.25, z: 0.4, parent: Sh });
	for (let i = 0; i < 5; i++) k.box(0.25 + r() * 0.2, 0.01, 0.15 + r() * 0.1, [0x9a6a3a, 0x6a3a1e][i % 2], { x: -1 + r() * 3, y: 0.01, z: r() * 1.5, ry: r() * 3, parent: Sh, shadow: false });
	k.point(0xfff0d0, 6, 10, { x: -1, y: 3, z: 1, parent: Sh });
	k.point(0xffd8a0, 4, 10, { x: 2, y: 2.4, z: 2, parent: Sh });
	return {
		shots: [
			{ pos: [600.9, 1.65, 0.3], look: [600.0, 1.2, -1.4], fov: 44, fog: [0x6a5038, 6, 30], exposure: 1.2, hide: ["sky", "stars"] },
			{ pos: [300.5, 0.75, 3.1], look: [300.1, 0.15, 1.6], fov: 40, fog: [0x1a0c14, 3, 22], exposure: 1.3, hide: ["sky", "stars"] },
			{ pos: [301.2, 1.7, 5.5], look: [300, 1.4, 0], fov: 45, fog: [0x1a0c14, 4, 30], exposure: 1.2, hide: ["sky", "stars"] },
			{ pos: [-299.5, 2.2, 2.6], look: [-300, 2.05, -0.4], fov: 42, fog: [0x140a22, 3, 25], exposure: 1.2, hide: ["sky", "stars"] },
			{ pos: [5, 7, 0], look: [-5, 15, -120], fov: 55 },
			{ pos: [at.x + 1.6, at.y + 2.6, at.z + 5.2], look: [at.x, at.y + 1.6, at.z - 4], fov: 50 },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r113: the voices in her head
function r113(k) {
	k.fog(0x7a68c0, 60, 420);
	k.sky(0x3a2a8a, 0xf0a8d8, { offset: -0.05 });
	k.light({ sky: 0xffffff, ground: 0x8a7ab0, hemi: 1.6, sunColor: 0xfff4f0, sunIntensity: 1.6, sunPos: [10, 60, 30], shadowSize: 20 });
	const r = rng(113);
	const orbCols = [0xffd84a, 0x4a8af0, 0xe8402a, 0x9a5ae0, 0x5ac84a];
	// Instanced memory orbs, coloured per instance.
	const orbs = (list, rad) => {
		const geo = new k.THREE.IcosahedronGeometry(rad, 1);
		const m = new k.THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.35, flatShading: true });
		const inst = new k.THREE.InstancedMesh(geo, m, list.length);
		const mx = new k.THREE.Matrix4();
		const c = new k.THREE.Color();
		list.forEach(([x, y, z, col], i) => {
			inst.setMatrixAt(i, mx.makeTranslation(x, y, z));
			inst.setColorAt(i, c.set(col));
		});
		return k.place(inst, { shadow: false });
	};
	// Headquarters: a round room with a big window, a console and the memory shelves.
	k.cyl(11, 11, 0.4, 0xe8e0f4, { y: -0.2, seg: 32, rough: 0.3 });
	k.cyl(11, 11, 0.3, 0xd8d0ec, { y: 7, seg: 32 });
	k.torus(4, 0.15, 0xffffff, { y: 6.8, rx: PI / 2, emissive: 0xfff0e0, glow: 1.5 });
	for (let i = 0; i < 24; i++) {
		const a = (i / 24) * PI * 2;
		if (Math.abs(Math.sin(a) + 1) < 0.25) continue;
		k.box(3, 7, 0.4, i % 2 ? 0x9a8ad8 : 0x8a7ac8, { x: Math.cos(a) * 10.6, y: 3.5, z: Math.sin(a) * 10.6, ry: -a + PI / 2 });
	}
	const view = k.canvas(512, 256, (g, w, h) => {
		const s = g.createLinearGradient(0, 0, 0, h);
		s.addColorStop(0, "#9ad0f0");
		s.addColorStop(1, "#e8f4ff");
		g.fillStyle = s;
		g.fillRect(0, 0, w, h);
		g.fillStyle = "#f4f8ff";
		g.fillRect(0, h * 0.62, w, h);
		g.strokeStyle = "#d84040";
		g.lineWidth = 6;
		g.strokeRect(w * 0.42, h * 0.45, w * 0.16, h * 0.2);
		g.strokeStyle = "#4060c0";
		g.beginPath();
		g.moveTo(0, h * 0.75);
		g.lineTo(w, h * 0.75);
		g.stroke();
		g.fillStyle = "#1a1a1a";
		g.beginPath();
		g.ellipse(w * 0.5, h * 0.85, 18, 7, 0, 0, PI * 2);
		g.fill();
		g.fillStyle = "#8a6a4a";
		g.fillRect(w * 0.2, h * 0.88, w * 0.35, 14);
	});
	k.box(13, 5.4, 0.3, 0x5a4a9a, { y: 3.6, z: -10.2 });
	k.plane(12.4, 4.9, new k.THREE.MeshBasicMaterial({ map: view }), { y: 3.6, z: -10.0, shadow: false });
	const console_ = k.group({ z: -5.6 });
	for (let i = 0; i < 7; i++) {
		const a = (i - 3) * 0.14;
		const g = k.group({ x: Math.sin(a) * 9, z: 9 - Math.cos(a) * 9, ry: -a, parent: console_ });
		k.box(1.3, 1.0, 1.1, 0xe8e4f0, { y: 0.5, parent: g });
		k.box(1.32, 0.12, 1.25, 0xb8b0d8, { y: 1.08, rx: -0.25, parent: g });
		for (let j = 0; j < 5; j++) k.cyl(0.07, 0.07, 0.06, orbCols[(i + j) % 5], { x: -0.45 + j * 0.22, y: 1.17, z: 0.1 - (j % 2) * 0.25, rx: -0.25, parent: g, emissive: orbCols[(i + j) % 5], glow: 0.8 });
		if (i % 2) k.cyl(0.03, 0.03, 0.4, 0x8a8aa0, { x: 0.4, y: 1.3, z: -0.3, rx: 0.3, parent: g });
	}
	const memList = [];
	[[1.08, 1.34], [1.66, 1.92]].forEach(([a0, a1]) => {
		for (let i = 0; i < 6; i++) {
			const th = (a0 + ((a1 - a0) * i) / 5) * PI;
			k.box(1.5, 5, 0.3, 0x6a5aa8, { x: Math.cos(th) * 10.1, y: 2.6, z: Math.sin(th) * 10.1, ry: -th + PI / 2 });
			for (let row = 0; row < 7; row++)
				for (let c = 0; c < 4; c++) {
					const aa = th + (c - 1.5) * 0.032;
					memList.push([Math.cos(aa) * 9.8, 0.6 + row * 0.62, Math.sin(aa) * 9.8, orbCols[Math.floor(r() * 5)]]);
				}
		}
	});
	orbs(memList, 0.13);
	// The core memories, glowing gold in their holder.
	const core = k.group({ x: -5.2, z: -1.6 });
	k.cyl(0.5, 0.7, 1.1, 0xd8d0ec, { y: 0.55, parent: core });
	k.cyl(0.35, 0.35, 1.8, 0xe8f4ff, { y: 2.0, parent: core, opacity: 0.35, rough: 0.05 });
	for (let i = 0; i < 5; i++) k.sphere(0.16, 0xffd84a, { y: 1.3 + i * 0.33, parent: core, emissive: 0xffb020, glow: 1 });
	k.glow(0xffd860, 3, { y: 2, parent: core });
	k.point(0xffe090, 3, 8, { y: 2, z: 0.6, parent: core });
	k.point(0xfff4ff, 6, 22, { y: 6, z: 2 });
	k.point(0xfff4ff, 4, 16, { x: 0, y: 4, z: -7 });
	// The five of them.
	const emo = (o) => {
		const p = k.person(o);
		faceEyes(k, p, { dx: 0.075, r: o.eye ?? 0.055, z: 0.165 });
		return p;
	};
	const joy = (o) => {
		const p = emo({ colors: { skin: 0xffe27a, shirt: 0xc6e04a, legs: 0xffe27a, hair: 0x2a4aa8 }, sleeves: 0xffe27a, dress: 0xc6e04a, ...o });
		k.box(0.3, 0.12, 0.3, 0x2a4aa8, { y: 1.96, parent: p });
		k.glow(0xfff0a0, 2.6, { y: 1.2, parent: p, opacity: 0.5 });
		k.point(0xffe080, 2, 5, { y: 1.5, z: 0.6, parent: p });
		return p;
	};
	const sad = (o) => {
		const p = emo({ s: [1.3, 0.8, 1.25], colors: { skin: 0x6a9ae0, shirt: 0xe6ecf4, legs: 0x6a9ae0, hair: 0x2a4ab8 }, sleeves: 0xe6ecf4, eye: 0.045, ...o });
		[-1, 1].forEach((s) => k.torus(0.06, 0.012, 0x101010, { x: s * 0.075, y: 1.78, z: 0.2, parent: p, seg: 14 }));
		k.box(0.48, 0.25, 0.3, 0x2a4ab8, { y: 1.72, z: -0.08, parent: p });
		return p;
	};
	const anger = (o) => {
		const p = emo({ s: [1.35, 0.78, 1.2], hair: false, colors: { skin: 0xe0402a, shirt: 0xf2f2f2, legs: 0x5a4a3a }, sleeves: 0xe0402a, eye: 0.045, ...o });
		k.box(0.44, 0.4, 0.38, 0xe0402a, { y: 1.78, parent: p });
		k.box(0.36, 0.05, 0.05, 0x3a1a10, { y: 1.88, z: 0.19, parent: p });
		k.box(0.06, 0.3, 0.02, 0x8a1a1a, { y: 1.3, z: 0.15, parent: p });
		faceEyes(k, p, { dx: 0.09, r: 0.045, z: 0.19, y: 1.8 });
		return p;
	};
	const fear = (o) => {
		const p = emo({ s: [0.78, 1.25, 0.8], hair: false, colors: { skin: 0xa684d8, shirt: 0xc8b0e0, legs: 0x5a3a7a }, sleeves: 0xa684d8, eye: 0.065, ...o });
		k.box(0.18, 0.06, 0.04, 0xc02040, { y: 1.53, z: 0.15, parent: p });
		k.cyl(0.008, 0.008, 0.3, 0x3a2a5a, { y: 2.05, rz: 0.4, parent: p });
		return p;
	};
	const disgust = (o) => {
		const p = emo({ colors: { skin: 0x7ac85a, shirt: 0x4a9a3a, legs: 0x7ac85a, hair: 0x1a3a1a }, sleeves: 0x7ac85a, dress: 0x4a9a3a, ...o });
		k.box(0.38, 0.38, 0.12, 0x1a3a1a, { y: 1.68, z: -0.15, parent: p });
		k.box(0.3, 0.08, 0.3, 0x9a4ac0, { y: 1.52, parent: p });
		return p;
	};
	const crew = k.group({ z: -2.6, from: 5 });
	pose(joy({ x: 0, z: 0.4, parent: crew }), { armL: [0, 0, -2.5], armR: [0, 0, 2.5] });
	sad({ x: -1.1, z: 0, ry: 0.15, parent: crew });
	anger({ x: 1.15, z: 0, ry: -0.15, parent: crew });
	pose(fear({ x: -2.1, z: -0.4, ry: 0.3, parent: crew }), { armL: [0, 0, -0.6], armR: [0, 0, 0.6] });
	disgust({ x: 2.15, z: -0.4, ry: -0.3, parent: crew });
	// Long-term memory: endless rows of shelves.
	const L = k.group({ x: 300 });
	k.ground(400, 0x8a6ac0, { parent: L, bump: 0.2 });
	const shelfList = [];
	for (let row = -4; row <= 4; row++) {
		const x = row * 5;
		for (let seg = 0; seg < 8; seg++) {
			const z = -20 - seg * 9;
			k.box(0.6, 7, 8.4, 0x5a4a98, { x, y: 3.5, z, parent: L });
			for (let sh = 0; sh < 7; sh++) {
				k.box(1.4, 0.08, 8.4, 0x6a5ab0, { x, y: 0.5 + sh * 0.95, z, parent: L });
				for (let c = 0; c < 15; c++) [-1, 1].forEach((s) => shelfList.push([300 + x + s * 0.45, 0.68 + sh * 0.95, z - 4 + c * 0.55, orbCols[Math.floor(r() * 5)]]));
			}
		}
	}
	orbs(shelfList, 0.16);
	for (let i = 0; i < 40; i++) k.ico(4 + r() * 6, 0xd8a8e0, { x: 300 + (r() - 0.5) * 300, y: 30 + r() * 30, z: -60 - r() * 200, opacity: 0.4, shadow: false });
	// One golden memory on its own.
	const gold = k.sphere(0.32, 0xffe060, { x: 302.4, y: 1.8, z: -12, until: 3, emissive: 0xffb020, glow: 0.9, rough: 0.2, seg: 24, rings: 16 });
	k.glow(0xfff0a0, 2.4, { x: 302.4, y: 1.8, z: -12, until: 3 });
	k.cyl(0.25, 0.32, 0.6, 0x6a5ab0, { x: 302.4, y: 1.2, z: -12, until: 3 });
	[[301.6, 0x4a8af0], [303.2, 0xe8402a]].forEach(([x, c]) => {
		k.cyl(0.25, 0.32, 0.6, 0x6a5ab0, { x, y: 1.2, z: -12.6, until: 3 });
		k.sphere(0.3, c, { x, y: 1.8, z: -12.6, emissive: c, glow: 0.5, rough: 0.2, until: 3 });
	});
	k.tick((t) => (gold.rotation.y = t));
	k.point(0xfff0d0, 6, 18, { x: 302, y: 4, z: -8 });
	// Joy and Sadness, lost among the shelves.
	pose(joy({ x: 302.4, z: -15.5, ry: 0.2, from: 4 }), { armR: [-1.4, 0, 0.3] });
	sad({ x: 300.8, z: -15.2, ry: 0.4, from: 4 });
	// The islands of personality, over the abyss.
	const I = k.group({ x: -400 });
	k.ground(400, 0x2a1a4a, { y: -60, parent: I, bump: 4 });
	const island = (x, z, h, col, deco) => {
		const g = k.group({ x, z, parent: I });
		k.cyl(5, 3, h, 0x7a6a98, { y: -h / 2, parent: g, seg: 7 });
		k.cyl(6, 5, 1.4, col, { y: 0.2, parent: g, seg: 12, emissive: col, glow: 0.3 });
		deco(g);
		k.point(col, 5, 20, { y: 6, parent: g });
		return g;
	};
	island(-14, -10, 70, 0x5ab0f0, (g) => {
		k.box(6, 0.2, 4, 0xf4f8ff, { y: 1, parent: g });
		k.box(1.6, 1.0, 0.1, 0xe8402a, { y: 1.6, z: -1.8, parent: g });
		rod(k, [-1, 1.2, 0], [1.5, 6, 0.4], 0.35, 0x8a5a2a, { parent: g });
		k.box(1.4, 0.3, 0.35, 0x2a2a2a, { x: -1.4, y: 1.25, parent: g });
	});
	island(0, -26, 70, 0xffd84a, (g) => {
		k.box(3, 3, 3, 0xf0e0c0, { y: 2.4, parent: g });
		k.cone(2.6, 2.2, 0xd84a4a, { y: 5, ry: PI / 4, seg: 4, parent: g });
		k.mesh(heartGeo(k, 1.6, 0.4), 0xff5a8a, { y: 8, parent: g, emissive: 0xc02a5a, glow: 0.8 });
	});
	island(15, -12, 70, 0xc87af0, (g) => {
		k.torus(2.4, 0.2, 0xffd84a, { y: 4, parent: g, emissive: 0xc0a020, glow: 0.6 });
		for (let i = 0; i < 6; i++) k.box(0.6, 0.6, 0.6, orbCols[i % 5], { x: Math.cos(i) * 2.4, y: 4 + Math.sin(i) * 2.4, parent: g });
		k.cyl(0.2, 0.3, 3, 0x8a8aa0, { y: 2, parent: g });
	});
	island(28, -30, 70, 0x5ac84a, (g) => {
		for (let i = 0; i < 2; i++) k.person({ x: -0.4 + i * 0.8, y: 0.9, s: 1.6, ry: i ? -0.6 : 0.6, colors: { shirt: orbCols[i + 1], legs: 0x3a3a5a }, parent: g, pose: "raise" });
	});
	for (let i = 0; i < 3; i++) tube(k, [[-14 + i * 14, 1, -10 - (i % 2) * 16], [-7 + i * 14, -1.5, -18 + (i % 2) * 8], [i * 14, 1, -26 + (i % 2) * 14]], 0.12, 0xfff0d0, { parent: I, emissive: 0xfff0d0, glow: 1, shadow: false });
	for (let i = 0; i < 30; i++) k.glow([0xffd84a, 0x4a8af0, 0xe8402a, 0x9a5ae0, 0x5ac84a][i % 5], 1.5, { x: -400 + (r() - 0.5) * 80, y: -10 - r() * 30, z: -20 + (r() - 0.5) * 40 });
	// Frame 3: a slice of pizza with broccoli on it, on a counter.
	const Pz = k.group({ z: 500 });
	k.box(20, 1, 20, 0x5a4a40, { y: -0.5, parent: Pz });
	k.box(6, 1.1, 1.6, 0x8a5a3a, { y: 0.55, parent: Pz });
	k.box(6.1, 0.06, 1.7, 0xd8d0c0, { y: 1.13, parent: Pz, rough: 0.4 });
	k.box(8, 5, 0.3, 0xb8a888, { y: 2.5, z: -2.5, parent: Pz });
	const menu = k.canvas(256, 128, (g, w, h) => {
		g.fillStyle = "#2a2a2a";
		g.fillRect(0, 0, w, h);
		g.fillStyle = "#e8e0c8";
		for (let i = 0; i < 6; i++) {
			g.fillRect(16, 16 + i * 18, 100 + Math.random() * 60, 6);
			g.fillRect(210, 16 + i * 18, 26, 6);
		}
	});
	k.plane(2.4, 1.2, k.mat(0xffffff, { map: menu }), { y: 2.9, z: -2.34, parent: Pz });
	k.box(0.9, 0.12, 0.9, 0xd8c8a8, { x: -1.6, y: 1.22, z: -0.2, ry: 0.2, parent: Pz });
	k.box(0.9, 0.12, 0.9, 0xd8c8a8, { x: -1.6, y: 1.34, z: -0.2, ry: 0.1, parent: Pz });
	k.cyl(0.42, 0.42, 0.02, 0xf4f4f0, { y: 1.17, parent: Pz, seg: 24 });
	const slice = k.group({ y: 1.19, ry: 0.4, parent: Pz });
	const tri = new k.THREE.Shape();
	tri.moveTo(0, 0.36);
	tri.lineTo(-0.2, -0.3);
	tri.quadraticCurveTo(0, -0.36, 0.2, -0.3);
	tri.lineTo(0, 0.36);
	k.mesh(new k.THREE.ExtrudeGeometry(tri, { depth: 0.03, bevelEnabled: false }), 0xf0c860, { rx: -PI / 2, parent: slice });
	k.box(0.42, 0.05, 0.06, 0xc8883a, { y: 0.02, z: 0.31, parent: slice });
	for (let i = 0; i < 9; i++) {
		const x = (r() - 0.5) * 0.22 * (1 - i / 12);
		const z = 0.22 - i * 0.05;
		k.cyl(0.008, 0.012, 0.03, 0x6a9a3a, { x, y: 0.045, z, parent: slice, seg: 5 });
		k.ico(0.025, 0x2f6a24, { x, y: 0.065, z, parent: slice });
	}
	k.cyl(0.08, 0.07, 0.22, 0xc8302a, { x: 0.8, y: 1.27, z: -0.3, parent: Pz, seg: 10 });
	k.cyl(0.05, 0.05, 0.06, 0xe8e8e8, { x: 0.8, y: 1.41, z: -0.3, parent: Pz, seg: 10, metal: 0.5 });
	k.point(0xfff0d0, 6, 10, { x: 0.5, y: 3, z: 1.5, parent: Pz });
	k.point(0xffd8b0, 3, 8, { x: -2, y: 2, z: 1, parent: Pz });
	// Frame 1: a frozen pond in the woods, a stick and a puck on the ice.
	const Pd = k.group({ x: 900 });
	k.ground(200, 0xf2f6fa, { parent: Pd, bump: 0.6, height: (x, z) => (Math.hypot(x, z) < 22 ? -0.3 : Math.min(2, (Math.hypot(x, z) - 22) * 0.2)) });
	k.cyl(22, 22, 0.1, 0xb8d8ec, { y: -0.12, parent: Pd, seg: 40, rough: 0.15, metal: 0.1 });
	trees(k, 70, [900 - 80, 900 + 80, -80, 30], { color: 0x2a4a34, h: 12, seed: 33, avoid: (x, z) => Math.hypot(x - 900, z) < 26 });
	const stick = k.group({ x: 0.6, y: -0.05, z: 1.2, ry: 0.7, parent: Pd });
	k.box(0.05, 0.04, 1.6, 0x8a5a2e, { rx: 0.08, y: 0.05, parent: stick });
	k.box(0.08, 0.05, 0.28, 0x1a1a1a, { x: 0.1, y: 0.0, z: 0.82, ry: 1.3, parent: stick });
	k.cyl(0.06, 0.06, 0.03, 0x111111, { x: -0.4, y: -0.05, z: 0.7, parent: Pd });
	const net = k.group({ x: -1.4, y: -0.07, z: -4, ry: 0.3, parent: Pd });
	[-1, 1].forEach((s) => k.cyl(0.04, 0.04, 1.1, 0xc8302a, { x: s * 0.9, y: 0.55, parent: net }));
	k.cyl(0.04, 0.04, 1.8, 0xc8302a, { y: 1.1, rz: PI / 2, parent: net });
	k.box(1.8, 1.1, 0.02, 0xe8e8e8, { y: 0.55, z: -0.6, parent: net, opacity: 0.5 });
	[-1.6, 1.6].forEach((x) => k.box(0.15, 0.5, 0.15, 0x6a5038, { x, y: 0.15, z: 3, parent: Pd }));
	k.box(3.4, 0.12, 0.5, 0x7a5a40, { y: 0.45, z: 3, parent: Pd });
	k.point(0xfff4e0, 3, 30, { x: 2, y: 6, z: 6, parent: Pd });
	// Frame 2: a bare bedroom on moving day, boxes and a sleeping bag.
	const Rm = k.group({ z: -600 });
	k.box(12, 0.2, 12, 0x9a7a58, { y: -0.1, parent: Rm, rough: 0.6 });
	for (let i = 0; i < 12; i++) k.box(0.02, 0.21, 12, 0x7a5e44, { x: -5.5 + i, y: -0.1, parent: Rm, shadow: false });
	k.box(12, 4, 0.2, 0xd8d2c4, { y: 2, z: -4, parent: Rm });
	k.box(0.2, 4, 12, 0xcfc8b8, { x: -4, y: 2, parent: Rm });
	k.box(0.2, 4, 12, 0xcfc8b8, { x: 4, y: 2, parent: Rm });
	k.box(12, 0.2, 12, 0xe0dad0, { y: 4, parent: Rm });
	k.box(1.8, 1.6, 0.05, 0xdfe8f0, { x: 1.4, y: 2.2, z: -3.88, parent: Rm, emissive: 0xc8d4e0, glow: 0.9 });
	k.box(1.9, 0.06, 0.08, 0xffffff, { x: 1.4, y: 2.2, z: -3.85, parent: Rm });
	k.box(0.06, 1.7, 0.08, 0xffffff, { x: 1.4, y: 2.2, z: -3.85, parent: Rm });
	k.box(2.1, 0.08, 0.3, 0xffffff, { x: 1.4, y: 1.38, z: -3.8, parent: Rm });
	k.box(0.06, 0.06, 0.06, 0xf4f0e0, { x: -3.88, y: 0.35, z: -1, parent: Rm });
	const boxCol = [0xb8885a, 0xa87a4e, 0xc0946a];
	[[-2.6, 0, -3.2, 1.0, 0.8, 0.8], [-2.6, 0.8, -3.2, 0.8, 0.6, 0.7], [-1.5, 0, -3.3, 0.9, 0.7, 0.7], [-3.3, 0, -1.8, 0.8, 0.9, 1.0], [2.9, 0, -2.5, 0.9, 0.6, 0.9], [3.1, 0, -1.2, 0.7, 0.7, 0.7]].forEach(([x, y, z, w, h, d], i) => {
		const b = k.group({ x, y, z, ry: (r() - 0.5) * 0.4, parent: Rm });
		k.box(w, h, d, boxCol[i % 3], { y: h / 2, parent: b });
		k.box(0.14, 0.01, d + 0.01, 0xc8b890, { y: h + 0.005, parent: b, rough: 0.2 });
		k.box(0.3, 0.12, 0.01, 0x2a2a2a, { y: h * 0.6, z: d / 2 + 0.006, parent: b, opacity: 0.7, shadow: false });
	});
	k.box(0.5, 0.01, 0.5, 0xb8885a, { x: -0.6, y: 0.01, z: -1.6, ry: 0.5, parent: Rm });
	k.capsule(0.34, 1.6, 0x4a6a8a, { x: 0.3, y: 0.24, z: -1.2, rx: PI / 2, ry: 0.3, s: [1, 1, 0.55], parent: Rm });
	k.cyl(0.18, 0.18, 0.5, 0xb03a3a, { x: -0.4, y: 0.18, z: -2.6, rz: PI / 2, ry: 0.4, parent: Rm });
	k.point(0xe8eef8, 4, 12, { x: 1.4, y: 2.4, z: -2.5, parent: Rm });
	k.point(0xfff0dc, 2.5, 12, { x: -1, y: 3.2, z: 2, parent: Rm });
	return {
		shots: [
			{ pos: [903.5, 1.7, 6.5], look: [899.5, 0.3, -1], fov: 50, fog: [0xd8e2ec, 25, 120], hide: ["sky"] },
			{ pos: [-0.5, 1.7, -596.6], look: [0.2, 0.7, -602.5], fov: 55, fog: [0x8a8478, 8, 30], hide: ["sky"] },
			{ pos: [0.5, 1.75, 501.1], look: [0, 1.2, 499.8], fov: 44, fog: [0x4a3a30, 5, 25], exposure: 1.15, hide: ["sky"] },
			{ pos: [-393, 7, 18], look: [-392, 2, -18], fov: 55 },
			{ pos: [303.6, 1.6, -11], look: [301.6, 1.2, -15.4], fov: 46 },
			{ pos: [0, 1.45, 3.3], look: [0, 1.25, -3], fov: 50 },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r114: the plastic paradise
function r114(k) {
	k.fog(0xffd6ea, 80, 500);
	k.sky(0x6ec0f4, 0xffe8f2);
	k.light({ sky: 0xffffff, ground: 0xf0a0c8, hemi: 1.5, sunColor: 0xfff4ea, sunIntensity: 2.2, sunPos: [25, 60, 45], shadowSize: 30 });
	const r = rng(114);
	const pink = 0xff5aa8;
	const hot = 0xf0308a;
	const pale = 0xffc0dc;
	k.box(500, 1, 500, 0x7ad87a, { y: -0.5 });
	k.box(500, 0.04, 8, 0xf6b0d0, { y: 0.02, z: 6 });
	k.box(500, 0.08, 2, 0xffffff, { y: 0.04, z: 1 });
	// Painted mountains, flat as a backdrop.
	for (let i = 0; i < 9; i++) k.cone(30 + r() * 20, 30 + r() * 30, [0xb8a8f0, 0x9ad0f8, 0xf8b0d8][i % 3], { x: -160 + i * 40, y: 20, z: -140, seg: 3, s: [1, 1, 0.05] });
	k.disc(0xfff4a0, 24, { x: 60, y: 70, z: -200 });
	const palm = (x, z, h = 7) => {
		for (let i = 0; i < 5; i++) k.cyl(0.25, 0.3, h / 5, 0xd8b080, { x, y: (i + 0.5) * (h / 5), z, seg: 6 });
		for (let i = 0; i < 7; i++) {
			const a = (i / 7) * PI * 2;
			k.cone(0.6, 3.2, 0x3ac85a, { x: x + Math.cos(a) * 1.3, y: h + 0.1, z: z + Math.sin(a) * 1.3, rz: -Math.cos(a) * 1.7, rx: Math.sin(a) * 1.7, s: [1, 1, 0.2], seg: 4 });
		}
	};
	[-26, -18, 18, 26, -40, 40].forEach((x, i) => palm(x, -4 + (i % 2) * 2));
	// The convertible.
	const car = k.group({ x: -3, y: 0, z: 6.5, ry: 0.15 });
	k.capsule(0.75, 3.3, pink, { rz: PI / 2, y: 0.75, s: [0.65, 1, 1.3], parent: car, rough: 0.3 });
	k.box(4.4, 0.5, 1.9, pink, { y: 0.95, parent: car, rough: 0.3 });
	k.box(1.6, 0.35, 1.5, 0xffffff, { x: -0.4, y: 1.25, parent: car });
	k.box(0.3, 0.6, 1.5, 0xffffff, { x: -1.3, y: 1.45, parent: car });
	k.box(0.3, 0.55, 1.5, 0xffffff, { x: 0.2, y: 1.42, parent: car });
	k.box(0.06, 0.45, 1.6, 0xd8f0ff, { x: 0.85, y: 1.45, rz: 0.4, parent: car, opacity: 0.5 });
	k.torus(0.18, 0.03, 0xffffff, { x: 0.55, y: 1.4, z: 0.4, ry: PI / 2, rz: 0.4, parent: car });
	[-1, 1].forEach((sx) =>
		[-1, 1].forEach((sz) => {
			k.cyl(0.4, 0.4, 0.3, 0x1a1a1a, { x: sx * 1.45, y: 0.4, z: sz * 0.95, rx: PI / 2, parent: car });
			k.cyl(0.25, 0.25, 0.32, 0xffffff, { x: sx * 1.45, y: 0.4, z: sz * 0.95, rx: PI / 2, parent: car });
		}),
	);
	[-0.5, 0.5].forEach((z) => k.glow(0xffffe0, 0.5, { x: 2.25, y: 0.9, z, parent: car }));
	// The dream house: open walls, a slide and a pool.
	const H = k.group({ z: -9, from: 4 });
	[0, 3.2, 6.4].forEach((y, i) => {
		k.box(12, 0.3, 7, 0xffffff, { y: y + 0.15, parent: H });
		k.box(12, 3, 0.25, i % 2 ? pale : pink, { y: y + 1.6, z: -3.4, parent: H });
		k.box(0.25, 3, 7, pale, { x: -5.9, y: y + 1.6, parent: H });
		if (i < 2) k.box(0.25, 3, 3, pink, { x: 5.9, y: y + 1.6, z: -2, parent: H });
	});
	k.box(12.4, 0.4, 7.4, hot, { y: 9.6, parent: H });
	for (let i = 0; i < 6; i++) k.box(0.4, 0.4, 0.4, 0xffffff, { x: -5.5 + i * 2.2, y: 10, z: 3.5, parent: H });
	[-5.8, 5.8].forEach((x) => k.cyl(0.18, 0.18, 9.6, 0xffffff, { x, y: 4.8, z: 3.3, parent: H }));
	k.box(2.4, 0.5, 1.2, hot, { x: -3, y: 0.55, z: -2.4, parent: H });
	k.box(2.4, 0.8, 0.3, hot, { x: -3, y: 0.9, z: -2.9, parent: H });
	k.box(2.2, 0.4, 2.6, 0xffffff, { x: 2.5, y: 3.6, z: -1.7, parent: H });
	k.box(2.2, 0.15, 2.4, pale, { x: 2.5, y: 3.85, z: -1.6, parent: H });
	k.box(2.4, 1.2, 0.2, hot, { x: 2.5, y: 4.0, z: -3.1, parent: H });
	k.box(1.4, 2.2, 0.8, 0xffffff, { x: -3.5, y: 4.6, z: -2.8, parent: H });
	k.sphere(0.9, 0xffffff, { x: 3, y: 7.3, z: -2.5, s: [1, 0.3, 1], parent: H });
	for (let i = 0; i < 8; i++) k.box(1.2, 0.2, 0.6, 0xffffff, { x: 5.2, y: 0.4 + i * 0.4, z: 2.6 - i * 0.6, parent: H });
	const slide = [];
	for (let i = 0; i <= 16; i++) {
		const a = (i / 16) * PI * 1.3;
		slide.push([7 + Math.cos(a) * 2.2, 6.6 - i * 0.37, 1.5 + Math.sin(a) * 2.2]);
	}
	tube(k, slide, 0.45, hot, { parent: H, tseg: 80 });
	k.box(6, 0.4, 4, 0xffffff, { x: 9, y: 0.2, z: 5.5, parent: H });
	k.box(5.4, 0.42, 3.4, 0x5ad0f0, { x: 9, y: 0.22, z: 5.5, parent: H, emissive: 0x2a8ab0, glow: 0.3 });
	// The pair out front.
	const doll = k.person({ x: 1.6, z: 4.2, ry: -0.2, colors: { skin: 0xf6caa8, shirt: pink, legs: 0xf6caa8, hair: 0xf8de70 }, sleeves: 0xf6caa8, from: 5 });
	const gingham = k.canvas(64, 64, (g) => {
		g.fillStyle = "#ffffff";
		g.fillRect(0, 0, 64, 64);
		g.fillStyle = "rgba(255,80,160,0.6)";
		for (let i = 0; i < 8; i++) {
			g.fillRect(i * 8, 0, 4, 64);
			g.fillRect(0, i * 8, 64, 4);
		}
	});
	gingham.wrapS = gingham.wrapT = k.THREE.RepeatWrapping;
	gingham.repeat.set(4, 2);
	const dressMat = k.mat(0xffffff, { map: gingham });
	k.cyl(0.2, 0.48, 0.65, dressMat, { y: 0.88, parent: doll, seg: 12 });
	k.box(0.52, 0.5, 0.3, dressMat, { y: 1.3, parent: doll });
	k.box(0.42, 0.55, 0.12, 0xf8de70, { y: 1.55, z: -0.13, parent: doll });
	faceEyes(k, doll, { r: 0.04 });
	pose(doll, { armR: [0, 0, 2.6] });
	const ken = k.person({ x: 2.6, z: 4.0, ry: -0.3, colors: { skin: 0xe8b890, shirt: 0x8ad0f0, legs: 0xf4f4f4, hair: 0xf0d470 }, from: 5 });
	faceEyes(k, ken, { r: 0.04 });
	pose(ken, { armL: [0, 0, -0.3] });
	k.box(0.52, 0.06, 0.3, pink, { y: 1.45, parent: ken });
	// Frame 1: an old woman alone on a bench at a city bus stop.
	const S = k.group({ x: 300 });
	k.box(90, 1, 90, 0x8a8a86, { y: -0.5, parent: S });
	k.box(40, 0.3, 6, 0x9c9a94, { y: 0.15, z: -1, parent: S });
	k.box(40, 0.31, 0.25, 0xb8b4aa, { y: 0.16, z: 2, parent: S });
	k.box(40, 0.02, 12, 0x4a4a4e, { y: 0.01, z: 8, parent: S });
	const tall = k.mat(0x8a96a2, { map: facade(k, { wall: "#b8bcc0", dark: "#5a6a7a", lit: "#d8e0e8", p: 0.1, cols: 10, rows: 30 }) });
	k.box(14, 40, 8, tall, { x: -6, y: 20, z: -12, parent: S });
	k.box(12, 30, 8, k.mat(0xa89a88, { map: facade(k, { wall: "#c0b4a0", dark: "#4a5260", p: 0.05 }) }), { x: 9, y: 15, z: -14, parent: S });
	const bench = k.group({ x: 0, y: 0.3, z: -1.2, parent: S });
	k.box(2.4, 0.08, 0.55, 0x6a5a48, { y: 0.45, parent: bench });
	k.box(2.4, 0.4, 0.06, 0x6a5a48, { y: 0.8, z: -0.27, rx: -0.1, parent: bench });
	[-1, 1].forEach((sx) => k.box(0.08, 0.45, 0.5, 0x2a2a2e, { x: sx * 1.1, y: 0.22, parent: bench, metal: 0.5 }));
	const lady = k.person({ x: 0.55, y: -0.3, z: 0.08, pose: "sit", colors: { skin: 0xe8c8b0, shirt: 0x7a8a7a, legs: 0x5a5a62, hair: 0xd8d8d8 }, coat: 0x6a7868, parent: bench });
	pose(lady, { armL: [-0.7, 0, 0.1], armR: [-0.7, 0, -0.1] });
	k.box(0.3, 0.22, 0.15, 0x3a2a24, { x: 0.55, y: 0.58, z: 0.42, parent: bench });
	k.box(0.06, 2.6, 0.06, 0x3a3a3e, { x: 2, y: 1.6, z: -0.9, parent: S, metal: 0.5 });
	k.box(0.5, 0.6, 0.04, 0x2a5a8a, { x: 2, y: 2.75, z: -0.9, parent: S });
	k.box(1.6, 0.8, 0.5, 0x5a5a5e, { x: -2.2, y: 0.7, z: -1.6, parent: S });
	for (let i = 0; i < 3; i++) {
		const tx = -4.5 + i * 4.5;
		k.box(1.2, 0.05, 1.2, 0x5a4a3a, { x: tx, y: 0.31, z: 1.2, parent: S });
		k.cyl(0.12, 0.16, 3, 0x5a4434, { x: tx, y: 1.8, z: 1.2, parent: S, seg: 6 });
		[0, 1, 2].forEach((j) => k.ico(0.9 + j * 0.15, [0xc87a2a, 0xd89a3a, 0xa85a24][j], { x: tx + Math.sin(j * 2) * 0.5, y: 3.6 + j * 0.3, z: 1.2 + Math.cos(j * 2) * 0.5, parent: S }));
	}
	for (let i = 0; i < 14; i++) k.box(0.1, 0.01, 0.08, [0xc87a2a, 0xd89a3a][i % 2], { x: (r() - 0.5) * 6, y: 0.31, z: (r() - 0.5) * 3, ry: r() * 3, parent: S, shadow: false });
	k.point(0xfff4e8, 4, 14, { x: 1.5, y: 4, z: 4, parent: S });
	// Frame 3: a beach with stiff plastic waves.
	const B = k.group({ x: -300 });
	k.box(80, 1, 40, 0xf8e0b0, { y: -0.5, z: 10, parent: B });
	k.box(80, 1, 60, 0x4ab8e8, { y: -0.45, z: -40, parent: B, rough: 0.2 });
	for (let row = 0; row < 4; row++)
		for (let i = 0; i < 9; i++) k.torus(1.2, 0.35, row % 2 ? 0xffffff : 0x8ae0f8, { x: -16 + i * 4 + row * 2, y: -0.1, z: -4 - row * 5, arc: PI, parent: B, rough: 0.2, seg: 16 });
	const umb = k.group({ x: 4, z: 4, parent: B });
	k.cyl(0.05, 0.05, 2.6, 0xffffff, { y: 1.3, parent: umb });
	for (let i = 0; i < 8; i++) k.cone(1.6, 0.6, i % 2 ? pink : 0xffffff, { y: 2.6, ry: (i / 8) * PI * 2, seg: 8, parent: umb, s: [1, 1, 1] });
	k.box(1.4, 0.15, 3, 0xffffff, { x: 1.5, y: 0.25, z: 4, parent: B });
	const tower = k.group({ x: -5, z: 2, parent: B });
	[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.15, 3, 0.15, 0xffffff, { x: sx * 0.8, y: 1.5, z: sz * 0.8, parent: tower })));
	k.box(2, 1.2, 2, pink, { y: 3.6, parent: tower });
	k.disc(0xfff080, 10, { x: -300, y: 18, z: -80 });
	// Frame 2: a giant in a striped swimsuit towers over little girls in the desert.
	const D = k.group({ x: -600 });
	k.ground(300, 0xd8a070, { parent: D, bump: 1 });
	for (let i = 0; i < 12; i++) k.ico(3 + r() * 6, 0xb8784a, { x: (r() - 0.5) * 140, y: 1, z: -40 - r() * 60, parent: D, s: [1, 1.5, 1] });
	const giant = k.person({ y: 0, z: -14, s: 9, colors: { skin: 0xf2c4a0, shirt: 0x111111, legs: 0xf2c4a0, hair: 0xf0d470 }, sleeves: 0xf2c4a0, parent: D });
	const stripe = k.canvas(64, 64, (g) => {
		g.fillStyle = "#ffffff";
		g.fillRect(0, 0, 64, 64);
		g.fillStyle = "#111111";
		for (let i = 0; i < 8; i++) g.fillRect(0, i * 8, 64, 4);
	});
	k.box(0.52, 0.72, 0.3, k.mat(0xffffff, { map: stripe }), { y: 1.18, parent: giant });
	k.box(0.42, 0.18, 0.29, k.mat(0xffffff, { map: stripe }), { y: 0.82, parent: giant });
	k.box(0.34, 0.07, 0.05, 0xffffff, { y: 1.8, z: 0.19, parent: giant });
	k.box(0.18, 0.4, 0.15, 0xf0d470, { y: 1.9, z: -0.2, rx: -0.4, parent: giant });
	pose(giant, { armL: [0, 0, -0.15], armR: [0, 0, 0.15] });
	for (let i = 0; i < 7; i++) {
		const g = k.person({ x: -6 + i * 2, z: 4 + (i % 2) * 1.5, ry: PI + (r() - 0.5) * 0.5, s: 0.6, colors: { shirt: [0xd8c8a0, 0xa0b0c8, 0xc8a0a0][i % 3], legs: 0xe0b48f, hair: [0x5a3a20, 0xd8b060, 0x2a1a10][i % 3] }, dress: [0xd8c8a0, 0xa0b0c8, 0xc8a0a0][i % 3], parent: D });
		if (i % 2) pose(g, { armR: [0, 0, 2.6] });
		k.sphere(0.12, 0xf0d0b8, { x: 0.34, y: i % 2 ? 2.25 : 0.82, parent: g });
	}
	k.glow(0xffc070, 120, { x: -600, y: 10, z: -200 });
	return {
		shots: [
			{ pos: [302.5, 1.45, 3.0], look: [300.3, 1.0, -1.2], fov: 46, fog: [0xc8ccd0, 25, 90], hide: ["sky"] },
			{ pos: [-602, 1.6, 12], look: [-600, 10, -14], fov: 60, fog: [0xf0b880, 60, 260] },
			{ pos: [-302, 2.4, 12], look: [-300, 0.6, -6], fov: 50, fog: [0xbfe6fa, 30, 140] },
			{ pos: [0.5, 1.6, 12], look: [-2.8, 0.9, 6.5], fov: 45 },
			{ pos: [9, 4.5, 13], look: [1.5, 4.2, -9], fov: 52 },
			{ pos: [1.2, 1.55, 8.6], look: [2.2, 1.9, 0], fov: 50 },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r115: the test in the desert
function r115(k) {
	k.fog(0x3a3a58, 60, 600);
	k.sky(0x141c3a, 0x8a6a78, { offset: -0.05 });
	k.light({ sky: 0x9aa8d8, ground: 0x4a3a30, hemi: 1.3, sunColor: 0xc8c0e8, sunIntensity: 0.9, sunPos: [-40, 60, 30], shadowSize: 40 });
	const r = rng(115);
	k.ground(1400, 0x8a7458, { bump: 1.2, seg: 70 });
	for (let i = 0; i < 18; i++) {
		const a = (i / 18) * PI * 2;
		k.cone(60 + r() * 50, 40 + r() * 50, 0x4a4050, { x: Math.cos(a) * 450, y: 10, z: Math.sin(a) * 450, seg: 6, ry: r() });
	}
	for (let i = 0; i < 60; i++) k.cone(0.4 + r() * 0.5, 0.6, 0x5a6a3a, { x: (r() - 0.5) * 200, y: 0.2, z: 40 + r() * 140, seg: 5 });
	// The steel tower and the shed on top.
	const T = k.group({ until: 3 });
	const steel = 0x7a7a80;
	[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => rod(k, [sx * 3, 0, sz * 3], [sx * 2, 30, sz * 2], 0.3, steel, { parent: T })));
	for (let i = 0; i < 6; i++) {
		const y0 = i * 5;
		const y1 = y0 + 5;
		const w0 = 3 - i / 6;
		const w1 = 3 - (i + 1) / 6;
		[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
			const p = (w, y, s) => [dx ? dx * w : s * w, y, dz ? dz * w : s * w];
			rod(k, p(w0, y0, -1), p(w1, y1, 1), 0.1, steel, { parent: T });
			rod(k, p(w0, y0, 1), p(w1, y1, -1), 0.1, steel, { parent: T });
			rod(k, p(w1, y1, -1), p(w1, y1, 1), 0.12, steel, { parent: T });
		});
	}
	k.box(5, 0.3, 5, 0x6a5a48, { y: 30.15, parent: T });
	k.box(4, 3, 0.1, 0x9a9a90, { y: 31.8, z: -1.95, parent: T, metal: 0.3 });
	[-1, 1].forEach((s) => k.box(0.1, 3, 4, 0x9a9a90, { x: s * 1.95, y: 31.8, parent: T, metal: 0.3 }));
	k.box(4.3, 0.15, 4.3, 0x8a8a80, { y: 33.4, parent: T });
	for (let i = 0; i < 8; i++) rod(k, [-0.4 + i * 0.12, 0, 3], [-0.4 + i * 0.12, 30, 2], 0.03, 0x1a1a1a, { parent: T });
	// The device: a sphere bristling with cables.
	const dev = k.group({ y: 31.2, parent: T });
	k.sphere(0.85, 0x5a5a62, { parent: dev, rough: 0.5, seg: 16, rings: 12 });
	for (let i = 0; i < 32; i++) {
		const v = new k.THREE.Vector3().randomDirection();
		const p = v.clone().multiplyScalar(0.86);
		const box = k.box(0.16, 0.12, 0.16, i % 3 ? 0x8a8a90 : 0x3a3a40, { x: p.x, y: p.y, z: p.z, parent: dev });
		box.lookAt(v.clone().multiplyScalar(3).add(box.position));
		const q = v.clone().multiplyScalar(1.05);
		tube(k, [[q.x, q.y, q.z], [q.x * 1.15, q.y * 1.1 - 0.15, q.z * 1.15], [q.x * 1.25, -0.9, q.z * 1.25 + 0.2], [0.4 + (i % 5) * 0.12, -1.05, 1.1]], 0.015, i % 4 ? 0x1a1a1a : 0xa03020, { parent: dev, tseg: 12, rseg: 4 });
	}
	k.glow(0xfff0c0, 0.8, { x: 1.2, y: 33, z: 1.5 });
	k.point(0xfff0d0, 8, 12, { x: 1.2, y: 33, z: 2 });
	// Floodlights, storm, rain.
	[[-12, 10], [12, 14], [0, -14]].forEach(([x, z]) => {
		k.cyl(0.1, 0.1, 4, 0x3a3a3a, { x, y: 2, z, until: 3 });
		k.glow(0xffffff, 3, { x, y: 4.2, z, until: 3 });
		k.spot(0xfff4e0, 60, { x, y: 4.2, z, target: [0, 20, 0], angle: 0.25, distance: 80, until: 3 });
	});
	// The bunker, the man in the hat, and the people lying on the ground.
	const B = k.group({ z: 160 });
	k.box(14, 3, 6, 0x8a8478, { y: 1.5, z: 4, parent: B });
	k.box(14.4, 0.4, 6.4, 0x6a6458, { y: 3.2, z: 4, parent: B });
	k.box(10, 0.4, 0.2, 0x111111, { y: 2.2, z: 0.95, parent: B });
	k.box(3, 1.2, 4, 0x8a7458, { x: -9, y: 0.6, z: 4, rz: 0.5, parent: B });
	k.box(4, 0.2, 3, 0x7a6048, { x: 0.5, y: 0.1, z: -1.5, parent: B });
	k.cyl(0.05, 0.05, 6, 0x5a4a3a, { x: 6, y: 3, z: 0, parent: B });
	k.glow(0xffd8a0, 1, { x: 6, y: 6, z: 0, parent: B, until: 3 });
	const oppie = (o) => {
		const p = k.person({ hat: 0x7a6a58, colors: { shirt: 0x8a7a68, legs: 0x8a7a68, skin: 0xe0b896, hair: 0x2a1e18 }, ...o });
		k.box(0.2, 0.3, 0.02, 0xf0ece0, { y: 1.42, z: 0.145, parent: p });
		k.box(0.05, 0.2, 0.02, 0x2a2a3a, { y: 1.42, z: 0.165, parent: p });
		k.cyl(0.015, 0.02, 0.12, 0x3a2a1a, { x: 0.05, y: 1.68, z: 0.25, rx: PI / 2 - 0.3, parent: p });
		return p;
	};
	oppie({ x: 0.5, z: 156, ry: PI + 0.08, s: 1.02, from: 3, until: 3 });
	for (let i = 0; i < 6; i++) {
		const p = k.person({ x: -6 + i * 2.2, y: 0.3, z: 150 + (i % 2) * 0.6, rx: -(PI / 2 - 0.25), ry: PI, colors: { shirt: [0xc8c0b0, 0x6a7a8a, 0x8a7a68][i % 3], legs: 0x4a4a52, hair: 0x2a1e18 }, from: 4, until: 4 });
		pose(p, { armL: [-2.6, 0, 0.2], armR: [-2.6, 0, -0.2] });
		k.box(0.25, 0.14, 0.02, 0x1a3a2a, { y: 1.8, z: 0.32, parent: p, emissive: 0x2a6a3a, glow: 0.6 });
	}
	// The flash, then the fireball.
	const F = k.group({ from: 4 });
	const fireMats = [0xfff0a0, 0xffc040, 0xff8a20, 0xe85a18].map((c) => k.mat(c, { emissive: c, glow: 1.1 }));
	for (let i = 0; i < 70; i++) {
		const v = new k.THREE.Vector3().randomDirection();
		if (v.y < -0.2) v.y = -v.y * 0.3;
		const d = 10 + r() * 12;
		k.ico(5 + r() * 7, fireMats[Math.min(3, Math.floor((d - 10) / 3.5))], { x: v.x * d, y: 26 + v.y * d * 0.9, z: v.z * d, parent: F, shadow: false });
	}
	for (let i = 0; i < 26; i++) {
		const a = (i / 26) * PI * 2;
		k.ico(4 + r() * 4, i % 2 ? 0x6a3a28 : 0x8a5a38, { x: Math.cos(a) * (24 + r() * 6), y: 3 + r() * 3, z: Math.sin(a) * (24 + r() * 6), parent: F, emissive: 0x401808, glow: 0.6, shadow: false });
	}
	k.cyl(5, 9, 18, fireMats[3], { y: 9, parent: F, shadow: false });
	k.glow(0xffd080, 140, { y: 28, parent: F, opacity: 0.8 });
	k.glow(0xfff4d0, 60, { y: 28, parent: F });
	k.point(0xffa050, 120, 900, { y: 30, z: 40, decay: 1, from: 4 });
	hemi(k, 0xffb070, 0x5a2a10, 1.6, { from: 4 });
	const fb = [];
	F.children.forEach((c) => c.isMesh && fb.push([c, c.scale.x]));
	k.tick((t) => fb.forEach(([c, s], i) => c.scale.setScalar(s * (1 + Math.sin(t * 1.5 + i) * 0.06))));
	oppie({ x: 2.6, z: 119.5, ry: PI - 0.15, from: 5 });
	// Frame 2: marbles in glass bowls on a desk.
	const M = k.group({ x: 300 });
	k.box(30, 1, 30, 0x2a1e16, { y: -0.5, parent: M });
	k.box(4, 0.1, 2.4, 0x5a3a24, { y: 0.75, parent: M });
	[-1, 1].forEach((s) => k.box(0.1, 0.75, 2.2, 0x4a3020, { x: s * 1.9, y: 0.375, parent: M }));
	const bowl = (x, z, n) => {
		k.sphere(0.42, 0xe8f4ff, { x, y: 1.2, z, parent: M, opacity: 0.25, rough: 0.05, seg: 20, rings: 14 });
		k.torus(0.3, 0.02, 0xe8f4ff, { x, y: 1.58, z, rx: PI / 2, parent: M, opacity: 0.5 });
		for (let i = 0; i < n; i++) {
			const v = new k.THREE.Vector3().randomDirection().multiplyScalar(0.3 * Math.cbrt(r()));
			v.y = -Math.abs(v.y) * 0.9;
			k.sphere(0.045, [0x3a7ad8, 0xd84a3a, 0x3ab85a, 0xe8c040, 0xf0f0f0][i % 5], { x: x + v.x, y: 1.2 + v.y, z: z + v.z, parent: M, rough: 0.15, seg: 8, rings: 6 });
		}
	};
	bowl(0, 0, 90);
	bowl(-1.1, -0.4, 40);
	k.cyl(0.2, 0.2, 0.5, 0xe8f4ff, { x: 1, y: 1.05, z: -0.3, parent: M, opacity: 0.3 });
	const chalk = k.canvas(512, 256, (g, w, h) => {
		g.fillStyle = "#1e2a24";
		g.fillRect(0, 0, w, h);
		g.strokeStyle = "rgba(240,240,230,0.8)";
		g.lineWidth = 2;
		g.lineWidth = 1;
		for (let i = 0; i < 18; i++) {
			g.strokeStyle = "rgba(240,240,230,0.25)";
			g.beginPath();
			g.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 30, 0, PI * 2 * Math.random());
			g.stroke();
		}
	});
	k.plane(5, 2.5, k.mat(0xffffff, { map: chalk }), { y: 2.2, z: -3, parent: M });
	k.cyl(0.25, 0.35, 0.3, 0x1a3a2a, { x: 1.4, y: 1.95, z: 0.2, parent: M, rx: 0.3 });
	k.glow(0xffd090, 1.2, { x: 1.4, y: 1.8, z: 0.25, parent: M });
	k.point(0xffd090, 6, 6, { x: 1.2, y: 1.8, z: 0.3, parent: M });
	// Frame 1: a cramped, wood-panelled hearing room: tables, chairs, microphones, files.
	const Hr = k.group({ x: -300 });
	k.box(20, 1, 20, 0x5a4a3a, { y: -0.5, parent: Hr });
	k.box(12, 0.02, 8, 0x6a5a48, { y: 0.01, parent: Hr, shadow: false });
	const panel = k.canvas(256, 128, (g, w, h) => {
		g.fillStyle = "#7a5634";
		g.fillRect(0, 0, w, h);
		g.strokeStyle = "#5a3c22";
		g.lineWidth = 3;
		for (let i = 0; i < 8; i++) g.strokeRect(i * 32 + 3, 8, 26, h - 16);
	});
	k.box(12, 4, 0.2, k.mat(0xffffff, { map: panel }), { y: 2, z: -3, parent: Hr });
	k.box(0.2, 4, 8, k.mat(0xffffff, { map: panel }), { x: -4, y: 2, z: 0.5, parent: Hr });
	k.box(12, 0.15, 0.25, 0x4a3020, { y: 4, z: -2.9, parent: Hr });
	k.box(1.4, 1.6, 0.05, 0xe8e4d8, { x: 2.4, y: 2.3, z: -2.88, parent: Hr, emissive: 0xc8c0a8, glow: 0.5 });
	for (let i = 0; i < 9; i++) k.box(1.4, 0.04, 0.06, 0xb8b0a0, { x: 2.4, y: 1.6 + i * 0.17, z: -2.84, parent: Hr });
	const table = (x, z, w, ry) => {
		const g = k.group({ x, z, ry, parent: Hr });
		k.box(w, 0.06, 0.8, 0x6a4a2c, { y: 0.78, parent: g, rough: 0.5 });
		[-1, 1].forEach((s) => k.box(0.06, 0.78, 0.7, 0x4a3420, { x: s * (w / 2 - 0.1), y: 0.39, parent: g }));
		return g;
	};
	const chair = (x, z, ry) => {
		const g = k.group({ x, z, ry, parent: Hr });
		k.box(0.45, 0.05, 0.45, 0x5a3a24, { y: 0.47, parent: g });
		k.box(0.45, 0.5, 0.05, 0x5a3a24, { y: 0.74, z: -0.21, parent: g });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.04, 0.47, 0.04, 0x3a2414, { x: sx * 0.19, y: 0.235, z: sz * 0.19, parent: g })));
	};
	const head = table(0, -2, 4, 0);
	[-1.2, 0, 1.2].forEach((x) => {
		chair(x, -2.6, 0);
		k.cyl(0.02, 0.06, 0.25, 0x2a2a2a, { x, y: 0.94, z: 0.15, parent: head, metal: 0.6 });
		k.sphere(0.05, 0x3a3a3a, { x, y: 1.08, z: 0.17, parent: head, metal: 0.6 });
		k.cyl(0.04, 0.035, 0.12, 0xe8f0f0, { x: x + 0.3, y: 0.87, z: 0.1, parent: head, opacity: 0.6 });
	});
	for (let i = 0; i < 5; i++) k.box(0.32, 0.04 + (i % 3) * 0.04, 0.24, [0xd8c8a0, 0xe8e0c8, 0xb89a68][i % 3], { x: -1.7 + i * 0.85, y: 0.83 + (i % 3) * 0.02, z: -0.05, ry: (r() - 0.5) * 0.3, parent: head });
	const side = table(-2.6, 0.4, 2.2, PI / 2);
	chair(-3.2, 0.4, PI / 2);
	k.box(0.35, 0.18, 0.25, 0xc8b890, { y: 0.9, parent: side });
	const wit = table(0.4, 1.2, 1.2, PI);
	chair(0.4, 1.8, PI);
	k.cyl(0.02, 0.06, 0.25, 0x2a2a2a, { y: 0.94, z: 0.15, parent: wit, metal: 0.6 });
	k.sphere(0.05, 0x3a3a3a, { y: 1.08, z: 0.17, parent: wit, metal: 0.6 });
	k.cyl(0.04, 0.035, 0.12, 0xe8f0f0, { x: 0.35, y: 0.87, parent: wit, opacity: 0.6 });
	k.cyl(0.07, 0.05, 0.04, 0x8a8a90, { x: -0.3, y: 0.83, parent: wit, metal: 0.6 });
	for (let i = 0; i < 4; i++) k.box(0.5, 0.3, 0.35, 0xb8a078, { x: 2.8, y: 0.15 + i * 0.3, z: 1 + (i % 2) * 0.05, parent: Hr });
	k.cyl(0.18, 0.22, 0.04, 0xd8c8a0, { y: 3.95, z: 0, parent: Hr });
	k.point(0xffe8c0, 6, 10, { x: 0, y: 3.4, z: 0.5, parent: Hr });
	k.point(0xd8dcff, 2, 8, { x: 2.4, y: 2.2, z: -1.5, parent: Hr });
	return {
		shots: [
			{ pos: [-297.4, 2.2, 3.4], look: [-300.2, 0.8, -0.8], fov: 50, fog: [0x2a2018, 6, 26], exposure: 1.3, hide: ["sky"] },
			{ pos: [300.75, 1.55, 1.05], look: [300, 1.15, 0], fov: 40, fog: [0x1c140e, 3, 22], exposure: 1.3 },
			{ pos: [1.4, 31.4, 3.2], look: [0, 31.1, 0], fov: 45, fog: [0x0e1220, 6, 60], exposure: 1.35 },
			{ pos: [2.3, 2.0, 159.6], look: [2.08, 2.15, 147.6], fov: 42, exposure: 1.3 },
			{ pos: [4, 1.6, 155.5], look: [3.74, 2.27, 145.5], fov: 55, fog: [0xf0c890, 60, 700], exposure: 1.0 },
			{ pos: [4.2, 1.75, 124], look: [3.93, 3.29, 116.15], fov: 55, fog: [0x5a2a18, 120, 800] },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r116: the summer resort
function r116(k) {
	k.fog(0xc8d8d0, 60, 380);
	k.sky(0x5aa0d8, 0xf8e0c0, { offset: -0.03 });
	k.light({ sky: 0xf8f4e8, ground: 0x4a5a30, hemi: 1.5, sunColor: 0xffe0b0, sunIntensity: 2.3, sunPos: [-30, 50, -40], shadowSize: 40 });
	const r = rng(116);
	// The lake, the hill and the big white lodge.
	k.water(500, 0x3a7a90, { amp: 0.1, opacity: 0.92 });
	k.ground(500, 0x4f7a3a, { bump: 0.6, seg: 60, height: (x, z) => Math.max(-3, Math.min(6, (z + 6) * 0.22)) + (z < -110 ? Math.min(20, (-110 - z) * 0.5) : 0) });
	trees(k, 90, [-120, 120, 20, 90], { color: 0x2a5a2a, h: 12, seed: 3, avoid: (x, z) => Math.abs(x) < 26 && z < 60 });
	trees(k, 120, [-200, 200, -200, -130], { color: 0x2f5f30, h: 14, seed: 4 });
	const lodge = k.group({ z: 40, y: 5.8 });
	const clap = k.mat(0xf4f0e6, { map: facade(k, { dark: "#3a4a5a", lit: "#ffe0a0", wall: "#f8f6f0", p: 0.3, cols: 10, rows: 4 }) });
	k.box(36, 9, 10, clap, { y: 4.5, parent: lodge });
	[-1, 1].forEach((s) => k.box(36.4, 0.3, 7.6, 0x2f5a3a, { y: 10.6, z: s * 2.7, rx: s * 0.6, parent: lodge }));
	k.box(36, 0.3, 4, 0xe8e0d0, { y: 0.15, z: -7, parent: lodge });
	for (let i = 0; i < 12; i++) k.cyl(0.18, 0.18, 4, 0xffffff, { x: -16.5 + i * 3, y: 2.2, z: -8.6, parent: lodge });
	k.box(36, 0.3, 4, 0x2f5a3a, { y: 4.35, z: -7, parent: lodge });
	k.box(6, 3, 0.3, 0x2f5a3a, { y: 11, z: -1, parent: lodge });
	for (let i = 0; i < 6; i++) {
		const c = k.group({ x: -40 + i * 16 + (i > 2 ? 20 : 0), y: 3.6, z: 22 + (i % 2) * 6, ry: (r() - 0.5) * 0.3 });
		k.box(5, 3, 4, 0xe8e0d0, { y: 1.5, parent: c });
		k.cone(4, 2, 0x3a5a3a, { y: 4, ry: PI / 4, seg: 4, parent: c });
	}
	k.box(3, 0.3, 20, 0x8a6a48, { x: 14, y: 0.3, z: -6 });
	for (let i = 0; i < 6; i++) k.cyl(0.12, 0.12, 2, 0x5a4a38, { x: 14 + (i % 2 ? 1.3 : -1.3), y: -0.6, z: -15 + i * 3.6 });
	const boat = k.group({ x: 17, y: 0.15, z: -12, ry: 0.3 });
	k.box(1.4, 0.5, 3.6, 0xc84a3a, { y: 0.1, parent: boat });
	// The lift in the lake.
	const lifter = (o, dress) => {
		const j = k.person({ colors: { shirt: 0x2a2a30, legs: 0x2a2a30, skin: 0xd8a888, hair: 0x2a1a10 }, ...o });
		pose(j, { armL: [0, 0, -PI + 0.12], armR: [0, 0, PI - 0.12] });
		const b = k.person({ y: 2.3, z: -0.9, rx: PI / 2, pose: "arms-out", colors: { shirt: dress, legs: dress === 0xf2a0b8 ? 0xf0c8a8 : 0x6a8ac0, skin: 0xf0c8a8, hair: 0x5a3018 }, dress: dress === 0xf2a0b8 ? dress : undefined, parent: j });
		pose(b, { legL: [0.15, 0, -0.05], legR: [0.15, 0, 0.05] });
		return j;
	};
	const lake = lifter({ x: -4, y: -0.88, z: -10, ry: 0.5, from: 4, until: 4 }, 0xf2f2ee);
	void lake;
	for (let i = 0; i < 5; i++) k.torus(0.6 + i * 0.4, 0.03, 0xe8f4ff, { x: -4, y: 0.08, z: -10, rx: PI / 2, opacity: 0.5 - i * 0.08, from: 4, until: 4, shadow: false });
	// Frame 4: watermelons on a porch.
	const P = k.group({ x: 300 });
	k.box(20, 1, 20, 0x3a4a2a, { y: -0.5, parent: P });
	for (let i = 0; i < 4; i++) k.box(4, 0.25, 0.5, 0x8a6a48, { y: 0.12 + i * 0.25, z: -0.5 - i * 0.5, parent: P });
	k.box(4, 1.2, 0.3, 0x8a6a48, { y: 0.55, z: -2.8, parent: P });
	k.box(8, 5, 0.3, 0xe8e0d0, { y: 2.5, z: -3, parent: P });
	k.box(1.2, 2.2, 0.1, 0xffe0a0, { y: 2.2, z: -2.8, parent: P, emissive: 0xffb050, glow: 0.8 });
	const melon = k.canvas(256, 128, (g, w, h) => {
		g.fillStyle = "#7ab84a";
		g.fillRect(0, 0, w, h);
		g.fillStyle = "#1e4a1e";
		for (let i = 0; i < 16; i++) {
			g.beginPath();
			for (let y = 0; y <= h; y += 8) g.lineTo(i * 16 + Math.sin(y * 0.2 + i) * 3, y);
			for (let y = h; y >= 0; y -= 8) g.lineTo(i * 16 + 8 + Math.sin(y * 0.2 + i) * 3, y);
			g.fill();
		}
	});
	const mm = k.mat(0xffffff, { map: melon, rough: 0.5 });
	k.sphere(0.32, mm, { x: 0.1, y: 0.53, z: -0.75, s: [1, 0.85, 1.3], ry: 0.4, parent: P, seg: 16 });
	k.sphere(0.3, mm, { x: -0.65, y: 0.78, z: -1.25, s: [1, 0.85, 1.3], ry: 1.2, parent: P, seg: 16 });
	k.sphere(0.3, mm, { x: 0.8, y: 0.3, z: -0.2, s: [1, 0.85, 1.3], ry: -0.4, parent: P, seg: 16 });
	k.point(0xffd090, 5, 8, { x: 0.5, y: 2.5, z: 0.5, parent: P });
	// Frame 3: two dancers balancing on a log.
	const Lg = k.group({ x: -300 });
	k.ground(80, 0x3f6a32, { parent: Lg, bump: 0.6, height: (x, z) => (Math.abs(z) < 3 ? -1.2 : 0) });
	k.box(80, 0.1, 5, 0x4a8aa0, { y: -0.6, parent: Lg, rough: 0.2 });
	for (let i = 0; i < 10; i++) k.ico(0.4 + r() * 0.5, 0x7a7a70, { x: (r() - 0.5) * 20, y: -0.5, z: (r() - 0.5) * 5, parent: Lg });
	k.cyl(0.35, 0.4, 9, 0x6a4a30, { y: 0.2, rz: PI / 2, parent: Lg, seg: 9 });
	const dancer = (x, shirt, legs, hair, ry) => {
		const p = k.person({ x, y: 0.52, z: 0, ry, pose: "arms-out", colors: { shirt, legs, skin: 0xe8b896, hair }, parent: Lg });
		pose(p, { legL: [0.3, 0, 0], legR: [-0.2, 0, 0] });
		return p;
	};
	dancer(-1.4, 0xf2f2ea, 0x5a7ab0, 0x5a3018, PI / 2);
	dancer(1.2, 0x2a2a30, 0x2a2a30, 0x2a1a10, PI / 2);
	for (let i = 0; i < 26; i++) {
		const a = r() * PI * 2;
		leafy(k, -300 + Math.cos(a) * (8 + r() * 20), 0, -Math.abs(Math.sin(a)) * (6 + r() * 20) - 4, 10 + r() * 6);
	}
	// Frame 2: the staff party, red-lit and close.
	const S = k.group({ x: 600 });
	k.box(20, 1, 20, 0x5a3a24, { y: -0.5, parent: S });
	k.box(20, 6, 0.4, 0x6a4630, { y: 3, z: -6, parent: S });
	[-1, 1].forEach((s) => k.box(0.4, 6, 14, 0x6a4630, { x: s * 8, y: 3, parent: S }));
	k.box(20, 0.4, 14, 0x4a3020, { y: 6, parent: S });
	for (let i = 0; i < 7; i++) {
		const x = -5 + (i % 4) * 3.2 + (r() - 0.5);
		const z = -3.5 + Math.floor(i / 4) * 3;
		const g = k.group({ x, z, ry: r() * 6, parent: S });
		const a = k.person({ z: 0.22, ry: PI, colors: { shirt: [0xf0e8e0, 0x2a2a30, 0xc04040][i % 3], legs: 0x2a2a30, hair: 0x2a1a10 }, parent: g });
		const b = k.person({ z: -0.22, colors: { shirt: [0xe8a0b0, 0xf2f2f2, 0x6a8ac0][i % 3], legs: 0x3a4a6a, hair: [0x5a3018, 0xd8b060, 0x1a1010][i % 3] }, dress: i % 2 ? 0x8a2a3a : undefined, parent: g });
		pose(a, { armL: [-1.3, 0, 0.3], armR: [-1.3, 0, -0.3] });
		pose(b, { armL: [-1.3, 0, 0.3], armR: [-1.3, 0, -0.3] });
		a.rotation.x = 0.06;
		b.rotation.x = -0.06;
	}
	k.box(1.4, 0.8, 1, 0x3a2414, { x: 6, y: 0.4, z: -5, parent: S });
	k.cyl(0.5, 0.5, 0.05, 0x111111, { x: 6, y: 0.83, z: -5, parent: S });
	k.point(0xff4030, 10, 20, { x: -2, y: 4.5, z: 0, parent: S });
	k.point(0xffa040, 6, 16, { x: 4, y: 4, z: 2, parent: S });
	[-4, 0, 4].forEach((x) => k.glow(0xff5030, 1.4, { x, y: 5.3, z: -2, parent: S }));
	// Frame 6: the last dance, the lift on the ballroom floor.
	const D = k.group({ x: -600 });
	k.box(40, 1, 40, 0xa8784a, { y: -0.5, parent: D, rough: 0.4 });
	k.box(14, 1, 5, 0x6a3a24, { y: 0.5, z: -9, parent: D });
	k.box(16, 8, 0.4, 0x9a1a2a, { y: 4, z: -11.5, parent: D });
	for (let i = 0; i < 5; i++) {
		const p = k.person({ x: -5 + i * 2.5, y: 1, z: -9.5, colors: { shirt: 0xf2f2f2, legs: 0x1a1a1a, hair: 0x2a1a10 }, parent: D });
		pose(p, { armL: [-1.2, 0, 0.3], armR: [-1, 0, -0.3] });
	}
	for (let i = 0; i < 10; i++) {
		const side = i % 2 ? 1 : -1;
		const z = -5 + Math.floor(i / 2) * 3;
		const tx = side * 9;
		k.cyl(0.7, 0.7, 0.05, 0xf8f4ec, { x: tx, y: 0.8, z, parent: D });
		k.cyl(0.08, 0.08, 0.8, 0x3a2a1a, { x: tx, y: 0.4, z, parent: D });
		k.glow(0xffd080, 0.6, { x: tx, y: 1.0, z, parent: D });
		for (let j = 0; j < 2; j++) k.person({ x: tx + (j ? 0.9 : -0.9) * 0.9, z: z + 0.6, ry: -side * PI / 2, colors: { shirt: [0x3a3a5a, 0xc8a0a0, 0x8a8a6a, 0xa0b8d8][(i + j) % 4], legs: 0x2a2a30, hair: [0x5a3018, 0xb8b0a0, 0x2a1a10][(i + j) % 3] }, parent: D, pose: (i + j) % 3 ? "stand" : "raise" });
	}
	for (let i = 0; i < 8; i++) {
		const p = k.person({ x: (i % 2 ? 1 : -1) * (3.2 + (i % 3)), z: -3.5 + Math.floor(i / 2) * 1.4, ry: (i % 2 ? -1 : 1) * 0.7, colors: { shirt: [0xe8c0d0, 0x2a2a30, 0xf2e0b0][i % 3], legs: 0x2a2a30, hair: 0x3a2018 }, dress: i % 3 === 0 ? 0xd890a8 : undefined, parent: D });
		pose(p, { armL: [0, 0, -0.8], armR: [0, 0, 0.8] });
	}
	lifter({ x: -600, y: 0, z: 0, ry: 0.6, from: 5 }, 0xf2a0b8);
	for (let i = 0; i < 30; i++) k.glow(0xffe0a0, 0.5, { x: -18 + i * 1.2, y: 6 + Math.sin(i * 0.5) * 0.4, z: -6, parent: D });
	k.spot(0xfff0e0, 120, { x: -600, y: 12, z: 6, target: [-600, 2, 0], angle: 0.3, distance: 40, cast: true });
	k.point(0xffb070, 6, 30, { x: 0, y: 6, z: 4, parent: D });
	return {
		shots: [
			{ pos: [8, 3.5, -22], look: [0, 9, 40], fov: 50 },
			{ pos: [604, 2.6, 6], look: [599, 1.4, -2], fov: 52, fog: [0x2a0e0a, 4, 30], exposure: 1.3 },
			{ pos: [-294.5, 1.9, 6], look: [-300, 1.3, 0], fov: 45 },
			{ pos: [301.2, 1.1, 1.1], look: [300.1, 0.55, -0.7], fov: 40, fog: [0x1a2214, 3, 20], exposure: 1.25 },
			{ pos: [-2.0, 0.9, -14.2], look: [-4, 1.8, -10], fov: 48 },
			{ pos: [-597.6, 2.8, 4.6], look: [-600, 2.5, 0], fov: 50, fog: [0x2a1810, 12, 60], exposure: 1.2 },
		],
	};
}

// ------------------------------------------------------------------------------------------------- r117: the quest with the coconuts
function r117(k) {
	k.fog(0xb8c0b0, 30, 260);
	k.sky(0x8a9aa8, 0xd8dcd0);
	k.light({ sky: 0xe8ecf0, ground: 0x4a5a3a, hemi: 1.5, sunColor: 0xfff0d8, sunIntensity: 1.6, sunPos: [30, 50, 40], shadowSize: 30 });
	const r = rng(117);
	k.ground(500, 0x6a7a44, { bump: 1.2, seg: 60, height: (x, z) => (z < -60 ? Math.min(8, (-60 - z) * 0.3) : 0) });
	for (let i = 0; i < 80; i++) k.ico(0.3 + r() * 0.5, 0x5a6a3a, { x: (r() - 0.5) * 120, y: 0.1, z: 30 - r() * 80, s: [1, 0.5, 1] });
	// The castle on the hill.
	const C = k.group({ z: -100, y: 8 });
	const wall = 0x9a968a;
	k.box(40, 10, 3, wall, { y: 5, parent: C });
	[-1, 1].forEach((s) => k.box(3, 10, 24, wall, { x: s * 20, y: 5, z: -12, parent: C }));
	[-20, 20].forEach((x) => {
		k.cyl(3.4, 3.8, 16, 0x8e8a7e, { x, y: 8, parent: C, seg: 10 });
		for (let i = 0; i < 8; i++) k.box(1.1, 1.2, 1.1, 0x8e8a7e, { x: x + Math.cos((i / 8) * PI * 2) * 3.2, y: 16.6, z: Math.sin((i / 8) * PI * 2) * 3.2, parent: C });
	});
	for (let i = 0; i < 14; i++) k.box(1.4, 1.2, 3, wall, { x: -17 + i * 2.6, y: 10.6, parent: C });
	k.box(6, 7, 0.4, 0x3a2a1a, { y: 3.5, z: 1.4, parent: C });
	k.cyl(3, 3, 0.42, 0x3a2a1a, { y: 7, z: 1.4, rx: PI / 2, parent: C, seg: 16 });
	k.cyl(5, 5.5, 22, 0x8a867a, { x: 4, y: 11, z: -12, parent: C, seg: 10 });
	k.cone(6, 6, 0x5a4a5a, { x: 4, y: 25, z: -12, parent: C, seg: 10 });
	k.box(2.2, 1.4, 0.05, 0x2a4aa8, { x: 4, y: 29, z: -12, parent: C });
	k.cyl(0.05, 0.05, 4, 0x3a3a3a, { x: 2.9, y: 29, z: -12, parent: C });
	for (let i = 0; i < 4; i++) {
		const p = k.person({ x: -10 + i * 6, y: 10, z: -0.6, colors: { shirt: [0x3a4a8a, 0x8a8a90, 0x3a4a8a, 0xb0a070][i], legs: 0x5a5a60, hair: 0x2a1a10 }, hat: i % 2 ? 0x8a8a90 : undefined, parent: C, pose: i % 2 ? "raise" : "point", from: 2 });
		void p;
	}
	// The wooden rabbit at the gate.
	const rab = k.group({ x: 0, y: 8, z: -92, from: 2 });
	const wood = 0x9a7048;
	k.box(4, 0.6, 6, 0x6a4a30, { y: 1, parent: rab });
	[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.cyl(0.9, 0.9, 0.4, 0x5a3a20, { x: sx * 2.1, y: 0.9, z: sz * 2.2, rz: PI / 2, parent: rab, seg: 10 })));
	k.sphere(3, wood, { y: 4.4, z: -0.5, s: [1, 1.15, 1.3], parent: rab, seg: 10, rings: 8 });
	k.sphere(1.9, wood, { y: 8.2, z: 1.6, parent: rab, seg: 10, rings: 8 });
	[-1, 1].forEach((s) => {
		k.capsule(0.5, 3.6, wood, { x: s * 0.8, y: 11.5, z: 1.2, rz: -s * 0.15, parent: rab, s: [1, 1, 0.5] });
		k.sphere(0.25, 0x2a1a10, { x: s * 0.8, y: 8.6, z: 3.3, parent: rab });
	});
	k.sphere(1.0, 0xc8a070, { y: 5, z: -4.3, parent: rab });
	for (let i = 0; i < 8; i++) k.box(0.1, 0.05, 6.5, 0x5a3a20, { x: -2.9 + i * 0.8, y: 4.4, z: -0.5, parent: rab, s: [1, 1, 1] });
	// King and squire, galloping on foot to the sound of coconuts.
	const arthur = k.person({ x: -0.6, z: 0, ry: 0.15, pose: "run", colors: { shirt: 0x8a2a24, legs: 0x8a8a90, skin: 0xe2b896, hair: 0x8a6a4a }, sleeves: 0x8a8a90, from: 5 });
	k.cyl(0.21, 0.21, 0.12, 0xe8c040, { y: 1.93, parent: arthur, metal: 0.3, emissive: 0x504010, open: true });
	for (let i = 0; i < 6; i++) k.cone(0.04, 0.12, 0xe8c040, { x: Math.cos((i / 6) * PI * 2) * 0.2, y: 2.04, z: Math.sin((i / 6) * PI * 2) * 0.2, parent: arthur, emissive: 0x504010 });
	k.box(0.3, 0.3, 0.06, 0x7a5a3a, { y: 1.6, z: 0.18, parent: arthur });
	k.mesh(starGeo(k, 0.12, 0.06, 0.02), 0xe8c040, { y: 1.2, z: 0.145, parent: arthur, emissive: 0x504010 });
	k.box(0.6, 1.0, 0.04, 0x8a2a24, { y: 1.05, z: -0.17, parent: arthur });
	const patsy = k.person({ x: 0.9, z: -2.2, ry: 0.15, pose: "run", colors: { shirt: 0x6a5a40, legs: 0x5a4a38, skin: 0xd8a888, hair: 0x5a3a20 }, from: 5 });
	pose(patsy, { armL: [-1.6, 0, -0.3], armR: [-1.6, 0, 0.3] });
	k.box(0.5, 0.6, 0.3, 0x5a4a30, { y: 1.3, z: -0.3, parent: patsy });
	const half = (o) => {
		const g = k.group(o);
		k.mesh(new k.THREE.SphereGeometry(0.11, 10, 6, 0, PI * 2, 0, PI / 2), k.mat(0x5a3a1e, { rough: 1 }), { parent: g, rx: PI });
		k.mesh(new k.THREE.SphereGeometry(0.1, 10, 6, 0, PI * 2, 0, PI / 2), k.mat(0xf2ece0, { side: k.THREE.BackSide }), { parent: g, rx: PI });
		k.cyl(0.11, 0.11, 0.004, 0xf2ece0, { parent: g });
		return g;
	};
	[-1, 1].forEach((s) => half({ x: s * 0.08, y: -0.75, z: 0.05, rz: s * 1.4, parent: s < 0 ? patsy.userData.limbs.armL : patsy.userData.limbs.armR }));
	// Frame 1: peasants raking a field of mud, a cart and a hovel.
	const N = k.group({ x: 300 });
	k.ground(80, 0x5a4a34, { parent: N, bump: 0.5, seg: 40 });
	for (let i = 0; i < 30; i++) k.sphere(0.3 + r() * 0.5, [0x4a3a28, 0x6a5638, 0x3e3020][i % 3], { x: (r() - 0.5) * 16, y: -0.1, z: (r() - 0.5) * 12, s: [1, 0.3, 1], parent: N });
	const hut = k.group({ x: -4, z: -6, ry: 0.3, parent: N });
	k.box(4, 2, 3, 0x7a6a4a, { y: 1, parent: hut });
	k.cone(3.4, 2.2, 0xa8904a, { y: 3.1, ry: PI / 4, seg: 4, parent: hut, s: [1, 1, 0.8] });
	k.box(0.9, 1.4, 0.1, 0x2a2014, { y: 0.7, z: 1.52, parent: hut });
	const cart = k.group({ x: 3.4, z: -2.5, ry: -0.6, parent: N });
	k.box(1.6, 0.5, 2.4, 0x6a5038, { y: 0.9, parent: cart });
	k.box(1.4, 0.1, 2.2, 0x4a3a28, { y: 1.1, parent: cart });
	[-1, 1].forEach((s) => k.cyl(0.6, 0.6, 0.12, 0x5a4028, { x: s * 0.9, y: 0.6, rz: PI / 2, parent: cart, seg: 10 }));
	rod(k, [0, 0.8, 1.2], [0, 0.4, 3.0], 0.08, 0x5a4028, { parent: cart });
	const raker = (x, z, ry, shirt) => {
		const p = k.person({ x, z, ry, pose: "hunch", colors: { shirt, legs: 0x5a4a38, skin: 0xd0a080, hair: 0x4a3a28 }, parent: N });
		pose(p, { armL: [-1.0, 0, 0.1], armR: [-0.7, 0, -0.1] });
		rod(k, [0, 1.0, 0.5], [0.05, 0.05, 1.7], 0.05, 0x7a6040, { parent: p });
		k.box(0.5, 0.06, 0.06, 0x5a5048, { x: 0.05, y: 0.05, z: 1.75, parent: p });
		return p;
	};
	raker(0, 0, 0.5, 0x7a6a50);
	raker(-1.8, 1.6, -0.3, 0x6a5a48);
	raker(2.0, 1.8, 2.6, 0x8a7a5a);
	for (let i = 0; i < 4; i++) k.cyl(0.06, 0.08, 1.4, 0x5a4a38, { x: -8 + i * 1.6, y: 0.7, z: -2 + i * 0.4, parent: N });
	k.box(5, 0.08, 0.08, 0x5a4a38, { x: -5.6, y: 1.2, z: -1.4, ry: -0.25, parent: N });
	for (let i = 0; i < 20; i++) leafy(k, 300 + (r() - 0.5) * 60, 0, -14 - r() * 20, 6 + r() * 5, { greens: [0x4a5a32, 0x3a4a2a] });
	// Frames 2 and 4: the misty wood, a shrubbery, the black knight at the stream.
	const Wd = k.group({ x: -300 });
	k.ground(160, 0x4a5a34, { parent: Wd, bump: 0.5, height: (x, z) => (Math.abs(x) < 2.5 ? -1 : 0) });
	k.box(5, 0.1, 160, 0x5a7a80, { y: -0.6, parent: Wd, rough: 0.2 });
	k.box(6, 0.3, 2.4, 0x6a5038, { y: 0.1, parent: Wd });
	for (let i = 0; i < 60; i++) {
		const x = -300 + (r() - 0.5) * 80;
		const z = (r() - 0.5) * 120 - 10;
		if (Math.abs(x + 300) < 7 && Math.abs(z) < 8) continue;
		if (Math.abs(x + 300) < 6 && Math.abs(z - 60) < 8) continue;
		if (Math.abs(x + 300) < 3) continue;
		const h = 10 + r() * 8;
		k.cyl(0.2, 0.35, h, 0x3a3228, { x, y: h / 2, z, seg: 6 });
		for (let j = 0; j < 3; j++) k.ico(h * 0.18, [0x3a4a2a, 0x4a5a32][j % 2], { x: x + Math.sin(j * 2) * 1.2, y: h * (0.75 + j * 0.08), z: z + Math.cos(j * 2) * 1.2 });
	}
	// The black knight, both arms off and spurting, still blocking the bridge; the king faces him, sword up.
	const knight = k.person({ x: 0.9, y: 0.25, z: 0, ry: -PI / 2 + 0.35, s: 1.15, hair: false, colors: { shirt: 0x141418, legs: 0x2a2a30, skin: 0x2a2a30, shoes: 0x0a0a0a }, parent: Wd });
	knight.userData.limbs.armL.visible = false;
	knight.userData.limbs.armR.visible = false;
	k.box(0.56, 0.95, 0.34, 0x0e0e12, { y: 1.05, parent: knight });
	k.cyl(0.24, 0.24, 0.42, 0x1e1e24, { y: 1.8, parent: knight, metal: 0.5, rough: 0.4, seg: 14 });
	k.cyl(0.25, 0.25, 0.03, 0x1e1e24, { y: 2.02, parent: knight, metal: 0.5, seg: 14 });
	k.box(0.36, 0.035, 0.05, 0x000000, { y: 1.84, z: 0.22, parent: knight });
	k.box(0.035, 0.22, 0.05, 0x2a2a30, { y: 1.74, z: 0.235, parent: knight, metal: 0.5 });
	const blood = 0xd01818;
	[-1, 1].forEach((sd) => {
		k.sphere(0.13, blood, { x: sd * 0.3, y: 1.5, parent: knight, emissive: 0x500000, s: [0.9, 0.8, 0.9] });
		const pts = [];
		for (let i = 0; i <= 8; i++) {
			const t = i / 8;
			pts.push([sd * (0.34 + t * 0.9), 1.55 + t * 0.6 - t * t * 1.6, t * 0.15]);
		}
		tube(k, pts, 0.035, blood, { parent: knight, emissive: 0x700000, tseg: 24, rseg: 5 });
		for (let i = 0; i < 6; i++) k.sphere(0.03, blood, { x: sd * (0.6 + r() * 0.8), y: 0.6 + r() * 1.1, z: (r() - 0.5) * 0.4, parent: knight, emissive: 0x700000 });
	});
	k.box(1.0, 0.012, 0.8, 0x8a1010, { x: 0.9, y: 0.26, z: 0.1, parent: Wd, shadow: false });
	// The severed arms on the planks, one still holding the sword.
	const arm = (x, z, ry) => {
		const g = k.group({ x, y: 0.34, z, ry, parent: Wd });
		k.box(0.8, 0.18, 0.18, 0x1a1a20, { parent: g, metal: 0.4 });
		k.box(0.2, 0.2, 0.22, 0x2a2a30, { x: 0.48, parent: g, metal: 0.4 });
		k.box(0.12, 0.2, 0.2, blood, { x: -0.44, parent: g, emissive: 0x500000 });
		return g;
	};
	arm(1.9, 0.7, 0.5);
	const swordArm = arm(-0.2, 0.9, -0.3);
	k.box(1.1, 0.03, 0.09, 0xd8d8e0, { x: 1.1, y: 0.02, parent: swordArm, metal: 0.8, rough: 0.2 });
	k.box(0.05, 0.05, 0.4, 0x8a7020, { x: 0.56, parent: swordArm, metal: 0.6 });
	k.box(0.3, 0.1, 0.5, 0x0e0e12, { x: 2.5, y: 0.32, z: -0.7, ry: 0.4, parent: Wd });
	const king = k.person({ x: -1.4, y: 0.25, z: 0.3, ry: PI / 2 - 0.3, colors: { shirt: 0x8a8a90, legs: 0x8a8a90, skin: 0xe2b896, hair: 0x8a6a4a }, parent: Wd });
	k.box(0.54, 1.0, 0.32, 0x8a2a24, { y: 1.05, parent: king });
	k.mesh(starGeo(k, 0.13, 0.06, 0.02), 0xe8c040, { y: 1.25, z: 0.165, parent: king, emissive: 0x504010 });
	k.cyl(0.21, 0.21, 0.12, 0xe8c040, { y: 1.93, parent: king, metal: 0.3, emissive: 0x504010, open: true });
	for (let i = 0; i < 6; i++) k.cone(0.04, 0.12, 0xe8c040, { x: Math.cos((i / 6) * PI * 2) * 0.2, y: 2.04, z: Math.sin((i / 6) * PI * 2) * 0.2, parent: king, emissive: 0x504010 });
	k.box(0.14, 0.18, 0.08, 0x8a6a4a, { y: 1.62, z: 0.17, parent: king });
	pose(king, { armR: [-2.4, 0, 0.2], armL: [-0.3, 0, -0.2] });
	const blade = k.group({ parent: king.userData.limbs.armR, y: -0.72 });
	k.box(0.06, 1.1, 0.03, 0xe0e0e8, { y: -0.6, parent: blade, metal: 0.8, rough: 0.2 });
	k.box(0.3, 0.05, 0.05, 0x8a7020, { y: -0.05, parent: blade, metal: 0.6 });
	k.point(0xfff4e0, 3, 12, { x: -299.5, y: 3.5, z: 3 });
	const shrub = k.group({ x: 0, z: 60, parent: Wd });
	k.ico(0.7, 0x3a7a2a, { y: 0.6, parent: shrub, detail: 1 });
	k.ico(0.5, 0x4a8a32, { x: 0.3, y: 0.9, z: 0.2, parent: shrub, detail: 1 });
	k.ico(0.45, 0x2f6a24, { x: -0.35, y: 0.85, z: -0.1, parent: shrub, detail: 1 });
	for (let i = 0; i < 6; i++) k.sphere(0.06, 0xe84a6a, { x: Math.cos(i) * 0.6, y: 0.8 + Math.sin(i * 2) * 0.3, z: Math.sin(i) * 0.6, parent: shrub });
	k.cyl(0.6, 0.7, 0.3, 0x8a8478, { y: 0.15, parent: shrub, seg: 8 });
	// Frame 5: the cave, its bones, its small white guardian, and the holy grenade.
	const V = k.group({ x: 600 });
	k.ground(80, 0x7a7a6a, { parent: V, bump: 0.6 });
	for (let i = 0; i < 12; i++) {
		const a = (i / 11) * PI;
		k.ico(3 + r() * 1.5, [0x6a6a62, 0x5a5a54][i % 2], { x: Math.cos(a) * 6, y: Math.sin(a) * 5, z: -8, parent: V });
	}
	k.sphere(4, 0x0a0a0a, { y: 1, z: -9.5, s: [1, 1, 0.3], parent: V });
	for (let i = 0; i < 16; i++) k.capsule(0.05, 0.35, 0xf0ead8, { x: (r() - 0.5) * 5, y: 0.06, z: -4 + r() * 4, rz: PI / 2, ry: r() * 3, parent: V });
	for (let i = 0; i < 4; i++) k.sphere(0.14, 0xf0ead8, { x: -2 + i * 1.3, y: 0.12, z: -3 + (i % 2), parent: V });
	const bun = k.group({ x: 0.3, z: -2.5, ry: 0.3, parent: V });
	k.sphere(0.22, 0xffffff, { y: 0.2, s: [1, 0.9, 1.3], parent: bun });
	k.sphere(0.14, 0xffffff, { y: 0.36, z: 0.24, parent: bun });
	[-1, 1].forEach((s) => {
		k.capsule(0.035, 0.22, 0xffffff, { x: s * 0.06, y: 0.6, z: 0.2, rz: -s * 0.15, parent: bun });
		k.sphere(0.025, 0xc01a1a, { x: s * 0.07, y: 0.4, z: 0.36, parent: bun, emissive: 0x600000 });
	});
	k.box(0.08, 0.03, 0.02, 0xa01a1a, { y: 0.31, z: 0.37, parent: bun });
	k.ico(1.6, 0x6a6a62, { x: 4.5, y: 0.6, z: 1, parent: V });
	for (let i = 0; i < 3; i++) {
		const p = k.person({ x: 4.4 + i * 0.6, z: 2.4 + i * 0.3, ry: -2.4, pose: "hunch", colors: { shirt: [0x8a2a24, 0x2a4a8a, 0x8a8a90][i], legs: 0x8a8a90, hair: 0x5a3a20 }, sleeves: 0x8a8a90, parent: V });
		void p;
	}
	k.ico(0.5, 0x6a6a62, { x: 1.6, y: 0.2, z: 0.4, parent: V });
	const gren = k.group({ x: 1.6, y: 0.88, z: 0.4, parent: V });
	k.sphere(0.28, 0xe8c040, { parent: gren, metal: 0.35, rough: 0.3, emissive: 0x3a2800 });
	k.torus(0.28, 0.025, 0xd8a830, { rx: PI / 2, parent: gren, metal: 0.3 });
	k.box(0.06, 0.32, 0.06, 0xe8c040, { y: 0.42, parent: gren, emissive: 0x3a2800 });
	k.box(0.22, 0.06, 0.06, 0xe8c040, { y: 0.47, parent: gren, emissive: 0x3a2800 });
	for (let i = 0; i < 6; i++) k.sphere(0.04, [0xd02020, 0x2050d0, 0x20a040][i % 3], { x: Math.cos(i) * 0.27, y: 0.05, z: Math.sin(i) * 0.27, parent: gren });
	k.glow(0xffe8a0, 1.4, { parent: gren, opacity: 0.6 });
	k.point(0xfff0c0, 3, 8, { x: 3, y: 2.5, z: 3, parent: V });
	return {
		shots: [
			{ pos: [305, 3.2, 8], look: [300, 0.8, -1], fov: 48, fog: [0xb8bcb0, 20, 70] },
			{ pos: [-298, 1.4, 64.5], look: [-300, 0.9, 59], fov: 46, fog: [0xc0c8bc, 4, 40] },
			{ pos: [10, 6, -60], look: [0, 14, -94], fov: 50 },
			{ pos: [-299.6, 1.5, 4.6], look: [-299.7, 1.2, 0], fov: 50, fog: [0xc0c8bc, 8, 60] },
			{ pos: [601.4, 1.25, 4.4], look: [600.7, 0.55, -1.5], fov: 50 },
			{ pos: [0.9, 1.35, 4.4], look: [0.1, 1.5, -2], fov: 50 },
		],
	};
}

export const REELS = { r108, r109, r110, r111, r112, r113, r114, r115, r116, r117 };
