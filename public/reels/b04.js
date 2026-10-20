// Batch 04: r48–r57. Ids are neutral on purpose: the server owns the titles.
import { PI, rng, trees, city } from "../kit.js";

// ------------------------------------------------------------------------------------------------- local helpers
const V3 = (k, a) => new k.THREE.Vector3(a[0], a[1], a[2]);

/** A box stretched between two points. */
function seg(k, a, b, w, color, o = {}) {
	const A = V3(k, a);
	const B = V3(k, b);
	const m = k.box(w, A.distanceTo(B), w, color, { ...o, x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2 });
	m.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, 1, 0), B.sub(A).normalize());
	return m;
}

/** Re-poses a person's arms so the hands land on world points, optionally through elbows. */
function reach(k, p, left, right, o = {}) {
	p.updateWorldMatrix(true, false);
	const L = p.userData.limbs;
	const sleeve = o.sleeve ?? L.armL.children[0].material.color.getHex();
	const skin = o.skin ?? 0xe0b48f;
	const loc = (w) => {
		const v = p.worldToLocal(V3(k, w));
		return [v.x, v.y, v.z];
	};
	[[left, -0.34, L.armL, o.elbowL], [right, 0.34, L.armR, o.elbowR]].forEach(([t, sx, arm, el]) => {
		if (!t) return;
		arm.visible = false;
		const to = loc(t);
		const from = [sx, 1.52, 0];
		if (el) {
			const e = loc(el);
			seg(k, from, e, 0.16, sleeve, { parent: p });
			seg(k, e, to, 0.15, o.fore ?? sleeve, { parent: p });
			k.sphere(0.085, sleeve, { x: e[0], y: e[1], z: e[2], parent: p, seg: 8, rings: 6 });
		} else seg(k, from, to, 0.16, sleeve, { parent: p });
		k.sphere(0.09, skin, { x: to[0], y: to[1], z: to[2], parent: p, seg: 8, rings: 6 });
	});
}

/** Turns a group translucent and glowing. */
function ghostify(g, color, opacity = 0.5) {
	g.traverse((o) => {
		if (!o.isMesh) return;
		o.material = o.material.clone();
		Object.assign(o.material, { transparent: true, opacity, depthWrite: false });
		o.material.emissive.set(color);
		o.material.emissiveIntensity = 0.9;
		o.castShadow = false;
	});
}

/** Hair over the back of a person's head, for people seen from behind. */
function backHair(k, p, color) {
	k.mesh(new k.THREE.SphereGeometry(0.218, 10, 8, PI, PI, 0, PI * 0.7), k.mat(color), { parent: p.userData.limbs.head, z: -0.01 });
}

/** Short hair for close-ups: a cap over the crown and the back, leaving the forehead clear. Use with hair: false. */
function hairTop(k, p, color, o = {}) {
	const h = p.userData.limbs.head;
	k.mesh(new k.THREE.SphereGeometry(0.218, 12, 8, 0, PI * 2, 0, PI * (o.cap ?? 0.3)), k.mat(color), { parent: h, y: 0.01 });
	k.mesh(new k.THREE.SphereGeometry(0.22, 10, 8, PI, PI, 0, PI * 0.62), k.mat(color), { parent: h, z: -0.01 });
}

/** Eyes and brows on a person's face. */
function face(k, p, o = {}) {
	const h = p.userData.limbs.head;
	[-1, 1].forEach((s) => {
		k.sphere(0.028, o.eye ?? 0x1a1410, { x: s * 0.075, y: 0.03, z: 0.18, parent: h, seg: 8, rings: 6 });
		k.box(0.08, 0.02, 0.02, o.brow ?? 0x2a1a10, { x: s * 0.075, y: 0.085, z: 0.185, rz: s * (o.frown ?? 0.15), parent: h });
	});
	if (o.mouth !== false) k.box(0.08, 0.015, 0.02, o.mouth ?? 0x8a4a3a, { y: -0.09, z: 0.188, parent: h });
}

/** A triangular prism (gable or pediment): base width w, height h, depth d along z, base sitting at o.y. */
function gable(k, w, h, d, color, o = {}) {
	const g = k.group({ x: o.x, y: o.y, z: o.z, ry: o.ry, from: o.from, until: o.until, parent: o.parent });
	k.cyl(1, 1, d, color, { seg: 3, rx: -PI / 2, y: h / 3, s: [w / 1.732, 1, h / 1.5], parent: g, rough: o.rough });
	return g;
}

/** Brick texture. */
function bricks(k, base, colors, rep = [4, 2]) {
	const t = k.canvas(256, 256, (g) => {
		g.fillStyle = base;
		g.fillRect(0, 0, 256, 256);
		for (let r = 0; r < 16; r++)
			for (let c = -1; c < 5; c++) {
				g.fillStyle = colors[(r * 3 + c + 9) % colors.length];
				g.fillRect(c * 52 + (r % 2 ? 26 : 0) + 2, r * 16 + 2, 48, 12);
			}
	});
	t.wrapS = t.wrapT = k.THREE.RepeatWrapping;
	t.repeat.set(rep[0], rep[1]);
	return t;
}

/** A lit window: a white frame with a glowing pane, facing +z. */
function windowPane(k, w, h, glow, o = {}) {
	const g = k.group(o);
	k.box(w + 0.25, h + 0.25, 0.1, o.frame ?? 0xf2efe8, { parent: g });
	k.box(w, h, 0.12, glow, { parent: g, emissive: glow, glow: o.glow ?? 0.8 });
	k.box(w, 0.06, 0.16, o.frame ?? 0xf2efe8, { parent: g });
	k.box(0.06, h, 0.16, o.frame ?? 0xf2efe8, { parent: g });
	return g;
}

const REELS_B04 = {
	// ----------------------------------------------------------------------------------------------- the potter's wheel
	r48: (k) => {
		k.fog(0x1c2236, 18, 90);
		k.sky(0x10162a, 0x2a3450);
		k.light({ sky: 0xdde0ff, ground: 0x5a3a28, hemi: 1.5, sunColor: 0xffe2c0, sunIntensity: 1.3, sunPos: [8, 18, 12], shadowSize: 16 });
		// The loft: wood floor, brick walls, tall arched windows.
		const brick = k.mat(0xffffff, { map: bricks(k, "#5a3026", ["#9a4a36", "#8a4030", "#a85a40", "#7a3a2a"], [6, 3]) });
		k.box(26, 0.2, 18, 0x6a4630, { y: -0.1 });
		for (let i = 0; i < 12; i++) k.box(0.03, 0.01, 18, 0x4a3020, { x: -12 + i * 2.2, y: 0.005, shadow: false });
		k.box(26, 9, 0.4, brick, { y: 4.5, z: -8 });
		k.box(0.4, 9, 18, brick, { x: -12, y: 4.5 });
		const glass = { emissive: 0x4a6ab0, glow: 0.7 };
		[-6, 0, 6].forEach((x) => {
			k.box(2.4, 4.4, 0.1, 0x6a8ac8, { x, y: 4, z: -7.78, ...glass });
			k.mesh(new k.THREE.CircleGeometry(1.2, 16, 0, PI), k.mat(0x6a8ac8, glass), { x, y: 6.2, z: -7.77 });
			k.box(0.08, 5.6, 0.14, 0x1a1a1a, { x, y: 4.6, z: -7.7 });
			[2.6, 4, 5.4].forEach((y) => k.box(2.4, 0.08, 0.14, 0x1a1a1a, { x, y, z: -7.7 }));
			k.box(2.8, 0.15, 0.4, 0x3a2a20, { x, y: 1.75, z: -7.6 });
		});
		k.point(0xffc080, 10, 22, { x: -5, y: 3.5, z: -2 });
		k.point(0xffd8b0, 6, 18, { x: 5, y: 3, z: 4 });
		k.spot(0xfff0dd, 40, { x: 1.5, y: 6, z: 2.5, target: [0, 1, -0.3], angle: 0.45, distance: 16, cast: true });
		// Shelves of pots, a sofa, a rug and a glowing jukebox.
		for (let s = 0; s < 3; s++) {
			k.box(0.5, 0.08, 5, 0x5a3a24, { x: -11.5, y: 1.2 + s * 1.1, z: -2 });
			for (let i = 0; i < 6; i++) {
				const h = 0.3 + ((i + s) % 3) * 0.12;
				k.cyl(0.12 + (i % 2) * 0.05, 0.1, h, [0xc8a07a, 0x8a5a3e, 0xe0d0b8][(i + s) % 3], { x: -11.5, y: 1.24 + s * 1.1 + h / 2, z: -4.2 + i * 0.85, seg: 10 });
			}
		}
		k.box(4, 0.5, 1.6, 0x7a2a2a, { x: 5, y: 0.45, z: -5.5 });
		k.box(4, 0.8, 0.4, 0x7a2a2a, { x: 5, y: 0.9, z: -6.2 });
		k.cyl(3, 3, 0.03, 0x6a3040, { y: 0.015, z: -0.3, seg: 24, shadow: false });
		const juke = k.group({ x: -8, z: -6.8, ry: 0.4 });
		k.box(1.4, 1.6, 0.8, 0x5a2a1a, { y: 0.8, parent: juke });
		k.cyl(0.7, 0.7, 0.8, 0x5a2a1a, { y: 1.6, rx: PI / 2, parent: juke, seg: 20 });
		k.cyl(0.55, 0.55, 0.82, 0xffb050, { y: 1.6, rx: PI / 2, parent: juke, seg: 20, emissive: 0xff8020, glow: 1 });
		[0xff4080, 0x40c0ff, 0xffd040].forEach((c, i) => k.box(1.2 - i * 0.2, 0.08, 0.84, c, { y: 0.5 + i * 0.3, parent: juke, emissive: c, glow: 1.2 }));
		k.point(0xff9050, 4, 6, { x: -7.6, y: 1.4, z: -6 });
		// The wheel and the spinning clay.
		k.cyl(0.4, 0.45, 0.55, 0x6a6a70, { y: 0.28 });
		k.cyl(0.58, 0.5, 0.2, 0x7a7a80, { y: 0.66, seg: 20 });
		k.cyl(0.34, 0.34, 0.05, 0x9a9aa0, { y: 0.78, seg: 20, metal: 0.6, rough: 0.4 });
		const prof = [[0, 0], [0.17, 0], [0.19, 0.04], [0.17, 0.11], [0.12, 0.19], [0.09, 0.26], [0.1, 0.31], [0.09, 0.32], [0.08, 0.31]].map(([r, y]) => new k.THREE.Vector2(r, y));
		const clay = k.mesh(new k.THREE.LatheGeometry(prof, 18), k.mat(0x8a5a3e, { rough: 0.3, side: k.THREE.DoubleSide }), { y: 0.805 });
		k.tick((t) => (clay.rotation.y = t * 4));
		k.box(0.6, 0.55, 1.1, 0x5a3a24, { y: 0.275, z: -1.05 });
		// Her, at the wheel.
		const molly = k.person({ x: 0, y: -0.27, z: -0.78, s: 0.95, pose: "sit", hair: false, colors: { shirt: 0xf2eee6, legs: 0x3a3a48, skin: 0xf0c8a8, hair: 0x2a1a12 } });
		hairTop(k, molly, 0x2a1a12, { cap: 0.36 });
		face(k, molly, { frown: -0.1, mouth: 0xb05a5a });
		molly.userData.limbs.head.rotation.y = 0.25;
		molly.userData.limbs.legL.rotation.set(-1.0, 0, -0.5);
		molly.userData.limbs.legR.rotation.set(-1.0, 0, 0.5);
		reach(k, molly, [-0.1, 1.0, -0.15], [0.1, 1.0, -0.15], { skin: 0xf0c8a8, fore: 0xf0c8a8, elbowL: [-0.36, 0.92, -0.5], elbowR: [0.36, 0.92, -0.5] });
		// Him, behind her, from frame 6.
		const sam = k.person({ x: 0, y: -0.24, z: -1.22, rx: 0.22, s: 1.03, pose: "sit", hair: false, colors: { shirt: 0xf4f2ec, legs: 0x4a4a58, skin: 0xd8a888, hair: 0x4a3018 }, from: 5 });
		k.point(0xffe8d0, 3, 5, { x: -1.2, y: 1.6, z: 1.2, from: 5 });
		sam.userData.limbs.legL.rotation.set(-1.0, 0, -0.7);
		sam.userData.limbs.legR.rotation.set(-1.0, 0, 0.7);
		sam.userData.limbs.head.position.set(0.2, 1.68, 0.05);
		sam.userData.limbs.head.rotation.y = -0.2;
		hairTop(k, sam, 0x4a3018, { cap: 0.34 });
		face(k, sam, { frown: -0.1 });
		reach(k, sam, [-0.14, 1.04, -0.19], [0.14, 1.04, -0.19], { skin: 0xd8a888, sleeve: 0xd8a888, elbowL: [-0.52, 1.08, -0.62], elbowR: [0.52, 1.08, -0.62] });
		// A penny, sliding up a door.
		const door = k.group({ x: 200 });
		k.box(8, 0.2, 6, 0x5a3a26, { y: -0.1, parent: door });
		k.box(8, 4, 0.2, 0x4a5a48, { y: 2, z: -1.1, parent: door });
		const panel = k.canvas(128, 256, (g) => {
			g.fillStyle = "#6a3a22";
			g.fillRect(0, 0, 128, 256);
			g.strokeStyle = "#4a2614";
			g.lineWidth = 6;
			[[14, 14, 100, 100], [14, 134, 100, 108]].forEach(([x, y, w, h]) => g.strokeRect(x, y, w, h));
		});
		k.box(1.1, 2.2, 0.08, k.mat(0xffffff, { map: panel }), { y: 1.1, z: -0.96, parent: door });
		k.box(1.3, 2.35, 0.06, 0xe8e0d0, { y: 1.17, z: -0.99, parent: door });
		k.sphere(0.05, 0xd8b040, { x: 0.42, y: 1.0, z: -0.9, parent: door, metal: 0.9, rough: 0.3 });
		const penny = k.cyl(0.04, 0.04, 0.01, 0xb87333, { rx: PI / 2, x: 199.9, z: -0.913, metal: 0.9, rough: 0.25, seg: 18, emissive: 0x2a1004 });
		const halo = k.glow(0x9ad0ff, 0.3, { x: 199.9, z: -0.95, opacity: 0.35 });
		k.tick((t) => {
			const y = 0.5 + ((t * 0.12) % 1.3);
			penny.position.y = y;
			halo.position.y = y;
		});
		k.glow(0xffd8a0, 0.6, { x: 201.8, y: 2.3, z: -0.95, parent: undefined });
		k.point(0xffd0a0, 4, 8, { x: 201.6, y: 2.2, z: -0.4 });
		k.point(0xa8c0ff, 2, 6, { x: 199.6, y: 1.2, z: 0.6 });
		// The psychic's storefront.
		const shop = k.group({ x: -200 });
		k.box(20, 0.2, 14, 0x24242c, { y: -0.1, parent: shop, rough: 0.3, metal: 0.4 });
		k.box(20, 0.25, 3, 0x5a5a60, { y: 0.12, z: -2.8, parent: shop });
		k.box(16, 10, 0.5, k.mat(0xffffff, { map: bricks(k, "#3a2620", ["#6a3a2c", "#5a3024", "#7a4232"], [5, 3]) }), { y: 5, z: -4.3, parent: shop });
		k.box(4, 2.4, 0.1, 0xffa860, { x: -1.5, y: 1.9, z: -4.0, parent: shop, emissive: 0xff8a30, glow: 0.9 });
		[-3.2, 0.2].forEach((x) => k.box(0.5, 2.4, 0.12, 0x7a1020, { x, y: 1.9, z: -3.94, parent: shop }));
		k.box(4.3, 0.15, 0.3, 0x2a1a14, { x: -1.5, y: 0.65, z: -3.9, parent: shop });
		k.box(1.2, 2.4, 0.12, 0x2a1a14, { x: 2.2, y: 1.45, z: -4.0, parent: shop });
		k.box(1.0, 1.0, 0.13, 0xffb070, { x: 2.2, y: 1.9, z: -3.98, parent: shop, emissive: 0xff9040, glow: 0.6 });
		const neon = k.canvas(256, 256, (g) => {
			g.lineCap = g.lineJoin = "round";
			const hand = () => {
				g.beginPath();
				g.moveTo(80, 230);
				g.lineTo(78, 140);
				g.lineTo(52, 108);
				g.lineTo(60, 98);
				g.lineTo(88, 120);
				[[92, 40], [120, 28], [148, 34], [174, 56]].forEach(([x, y], i) => {
					g.lineTo(x, 116);
					g.lineTo(x, y);
					g.lineTo(x + 18, y);
					g.lineTo(x + 18, 116 + (i === 3 ? 10 : 0));
				});
				g.lineTo(186, 230);
				g.stroke();
			};
			g.shadowColor = "#ff3aa0";
			g.shadowBlur = 18;
			g.strokeStyle = "#ff8ad0";
			g.lineWidth = 8;
			hand();
			g.strokeStyle = "#7af0ff";
			g.shadowColor = "#20c0ff";
			g.beginPath();
			g.ellipse(134, 172, 26, 14, 0, 0, PI * 2);
			g.stroke();
			g.beginPath();
			g.arc(134, 172, 6, 0, PI * 2);
			g.stroke();
		});
		k.plane(1.8, 1.8, new k.THREE.MeshBasicMaterial({ map: neon, transparent: true, blending: k.THREE.AdditiveBlending, depthWrite: false }), { x: -1.5, y: 4.2, z: -4.0, parent: shop });
		k.point(0xff60c0, 8, 10, { x: -201.5, y: 4.2, z: -2.5 });
		k.box(1.4, 0.9, 0.3, 0x4a1a2a, { x: -1.5, y: 0.45, z: -3.72, parent: shop });
		k.sphere(0.25, 0xd0e8ff, { x: -1.5, y: 1.15, z: -3.72, parent: shop, emissive: 0x6080c0, glow: 0.8, rough: 0.1 });
		k.glow(0xa0d0ff, 1.2, { x: -201.5, y: 1.15, z: -3.5 });
		[-2.6, -0.4].forEach((x) => {
			k.cyl(0.05, 0.05, 0.3, 0xf2e8d0, { x: x + 0.3, y: 1.05, z: -3.72, parent: shop });
			k.glow(0xffc060, 0.4, { x: x - 199.7, y: 1.27, z: -3.65 });
		});
		k.point(0xffb070, 6, 10, { x: -201.5, y: 1.8, z: -2 });
		k.box(1.6, 2.2, 0.1, 0x8a9ab8, { x: 4.5, y: 5.2, z: -4.02, parent: shop, emissive: 0x3a4a6a });
		k.cyl(0.08, 0.1, 4.5, 0x2a2a2a, { x: -7, y: 2.25, z: -1.5, parent: shop });
		k.glow(0xffe0a0, 2, { x: -7, y: 4.6, z: -1.5, parent: shop });
		k.point(0xffe0b0, 6, 14, { x: -207, y: 4.3, z: -1 });
		// The light at the end: he glows and goes.
		const heaven = k.group({ z: 300 });
		k.box(16, 0.2, 16, 0x2a3048, { y: -0.1, parent: heaven });
		k.mesh(new k.THREE.CylinderGeometry(0.8, 2.4, 14, 20, 1, true), new k.THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0.22, blending: k.THREE.AdditiveBlending, depthWrite: false, side: k.THREE.DoubleSide }), { y: 7, x: -1, parent: heaven, shadow: false });
		k.glow(0xffffff, 10, { x: -1, y: 4, z: 300, opacity: 0.7 });
		const ghost = k.person({ x: -1, y: 0, z: 300, ry: 0.5, colors: { shirt: 0xf0f4ff, legs: 0xc8d4f0, skin: 0xe8eeff, hair: 0xb8c8e8 } });
		ghostify(ghost, 0x8ab8ff, 0.6);
		k.person({ x: 1.6, y: 0, z: 301.4, ry: -2.3, colors: { shirt: 0xf2eee6, legs: 0x3a3a48, skin: 0xf0c8a8, hair: 0x2a1a12 } });
		k.particles(250, 0xfff0d0, { x: -1, z: 300, box: [3.5, 9, 3.5], speed: 0.4, size: 0.06, opacity: 0.9, drift: 0.4 });
		k.point(0xffffff, 14, 14, { x: -1, y: 6, z: 302 });
		k.point(0x8ab8ff, 4, 8, { x: 2, y: 2, z: 304 });
		return {
			shots: [
				{ pos: [-5.9, 1.6, -3.7], look: [-8.0, 1.15, -6.8], fov: 42 },
				{ pos: [200.25, 1.15, 0.2], look: [199.95, 1.08, -0.9], fov: 35 },
				{ pos: [-197.6, 2.2, 3.2], look: [-200.8, 3.0, -4], fov: 45 },
				{ pos: [4.2, 2.2, 307], look: [0, 2.4, 300], fov: 45, fog: [0x1a1e34, 10, 60] },
				{ pos: [5.5, 3.2, 7.5], look: [-0.5, 1.4, -2], fov: 45 },
				{ pos: [-0.85, 1.38, 1.2], look: [0.05, 1.25, -0.75], fov: 42 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the house at Christmas
	r49: (k) => {
		k.fog(0x1c2a48, 30, 170);
		k.sky(0x0a1230, 0x34466e);
		k.light({ sky: 0xb8ccf8, ground: 0x4a4050, hemi: 1.6, sunColor: 0xc0d4ff, sunIntensity: 1.3, sunPos: [-20, 40, 40], shadowSize: 30 });
		k.ground(300, 0xe8eef8, { bump: 0.3 });
		k.particles(1500, 0xffffff, { box: [70, 30, 70], z: 5, speed: 1.5, size: 0.12, drift: 0.8 });
		// The red-brick house.
		const house = k.group({ z: -4 });
		const brick = k.mat(0xffffff, { map: bricks(k, "#7a3a2c", ["#a8483a", "#9a4034", "#b85a44", "#8a3a2c"], [5, 3]) });
		k.box(15, 8, 9, brick, { y: 4, parent: house });
		k.box(15.3, 0.4, 9.3, 0xf2efe8, { y: 8.1, parent: house });
		const roof = k.group({ y: 8.3, parent: house });
		k.cone(10.8, 3.6, 0x3a3e48, { y: 1.8, ry: PI / 4, seg: 4, s: [1, 1, 0.66], parent: roof });
		k.cone(9.6, 3.2, 0xeef2fa, { y: 2.15, ry: PI / 4, seg: 4, s: [1, 1, 0.66], parent: roof });
		[-5.5, 5.5].forEach((x) => {
			k.box(1.2, 3.6, 1.2, brick, { x, y: 10.6, parent: house });
			k.box(1.3, 0.25, 1.3, 0xeef2fa, { x, y: 12.5, parent: house });
		});
		const warm = 0xffc870;
		[-5.4, -2.7, 2.7, 5.4].forEach((x) => [2.4, 6].forEach((y) => {
			windowPane(k, 1.2, 1.7, warm, { x, y, z: 4.6, parent: house });
			[-1, 1].forEach((s) => k.box(0.45, 1.9, 0.1, 0x1a1a1e, { x: x + s * 0.9, y, z: 4.56, parent: house }));
		}));
		windowPane(k, 1.2, 1.5, warm, { x: 0, y: 6, z: 4.6, parent: house });
		// The door, portico and wreaths.
		k.box(1.4, 2.6, 0.12, 0x1a3a2a, { y: 1.5, z: 4.56, parent: house });
		k.mesh(new k.THREE.CircleGeometry(0.75, 12, 0, PI), k.mat(warm, { emissive: warm, glow: 0.7 }), { y: 2.85, z: 4.57, parent: house });
		k.box(3.4, 0.3, 2, 0xd8d8d8, { y: 0.15, z: 5.5, parent: house });
		[-1.3, 1.3].forEach((x) => k.cyl(0.15, 0.17, 3.4, 0xf2efe8, { x, y: 2, z: 6.2, parent: house }));
		k.box(3.4, 0.3, 1.9, 0xf2efe8, { y: 3.8, z: 5.6, parent: house });
		gable(k, 3.6, 1, 1.9, 0xf2efe8, { y: 3.95, z: 5.6, parent: house });
		[[0, 1.9, 4.66], [-2.7, 6, 4.72], [2.7, 6, 4.72], [0, 6, 4.72]].forEach(([x, y, z]) => {
			k.torus(0.32, 0.1, 0x1f5a2a, { x, y, z, parent: house, rseg: 6, seg: 14 });
			k.box(0.2, 0.15, 0.06, 0xd02020, { x, y: y - 0.3, z: z + 0.08, parent: house });
		});
		// Christmas lights along the eaves and the porch.
		const bulbs = [0xff3030, 0x30ff60, 0x3080ff, 0xffd030, 0xff60e0];
		for (let i = 0; i < 31; i++) k.glow(bulbs[i % 5], 0.45, { x: -7.5 + i * 0.5, y: 7.85 - Math.abs(Math.sin(i * 0.8)) * 0.15, z: 0.75 });
		for (let i = 0; i < 9; i++) k.glow(bulbs[(i + 2) % 5], 0.4, { x: -1.6 + i * 0.4, y: 3.6, z: 2.95 });
		k.point(0xffc070, 10, 16, { x: 0, y: 3.5, z: 6 });
		k.point(0xffb060, 6, 12, { x: -6, y: 4, z: 4 });
		k.point(0xffb060, 6, 12, { x: 6, y: 4, z: 4 });
		// Snowy evergreens with lights, hedges, the walk and the street.
		[[-11, 3], [11, 4], [-14, -6], [14, -8], [-9, 9], [16, 8]].forEach(([x, z], i) => {
			k.cyl(0.25, 0.35, 1.4, 0x3a2818, { x, y: 0.7, z });
			k.cone(2.2, 4.5, 0x1a4a2a, { x, y: 3.2, z, seg: 7 });
			k.cone(1.6, 2.4, 0xeef2fa, { x, y: 4.6, z, seg: 7 });
			if (i < 2) for (let j = 0; j < 10; j++) k.glow(bulbs[j % 5], 0.35, { x: x + Math.cos(j * 1.9) * (1.9 - j * 0.12), y: 1.7 + j * 0.3, z: z + Math.sin(j * 1.9) * (1.9 - j * 0.12) });
		});
		[-4.5, 4.5].forEach((x) => k.box(5, 1, 1.2, 0x2a4a2a, { x, y: 0.5, z: 2.4 }));
		k.box(2, 0.05, 9, 0xb8bcc8, { y: 0.02, z: 7 });
		k.box(200, 0.06, 8, 0x3a3c48, { y: 0.03, z: 15, rough: 0.5 });
		[10.8, 19.2].forEach((z) => k.box(200, 0.5, 0.9, 0xeef2fa, { y: 0.2, z }));
		[-12, 12].forEach((x) => {
			k.cyl(0.08, 0.1, 4.5, 0x1a1a1a, { x, y: 2.25, z: 10.4 });
			k.glow(0xffe0b0, 1.6, { x, y: 4.6, z: 10.4 });
			k.point(0xffe0b0, 5, 14, { x, y: 4.4, z: 10.6 });
		});
		// The van and the two burglars.
		const van = k.group({ x: 5, y: 0, z: 14, ry: -PI / 2, from: 3 });
		k.box(2.2, 2.0, 4.0, 0xe8e8e4, { y: 1.5, z: -0.6, parent: van });
		k.box(2.2, 1.2, 1.6, 0xe8e8e4, { y: 1.1, z: 2.2, parent: van });
		k.box(2.1, 0.7, 0.9, 0x2a3a4a, { y: 2.0, z: 1.65, rx: -0.4, parent: van, rough: 0.2 });
		k.box(2.25, 0.3, 5.6, 0x2a5a9a, { y: 1.3, z: 0.2, parent: van });
		k.box(1.8, 0.1, 3.2, 0x8a8a90, { y: 2.6, z: -0.6, parent: van });
		[-1, 1].forEach((x) => [-1.8, 1.9].forEach((z) => k.cyl(0.42, 0.42, 0.3, 0x111111, { x: x * 1.05, y: 0.42, z, rz: PI / 2, parent: van })));
		[-0.75, 0.75].forEach((x) => k.glow(0xfff0c0, 0.8, { x, y: 1.0, z: 3.02, parent: van }));
		const harry = k.person({ x: 1.5, y: 0, z: 12, ry: PI + 0.3, s: 0.92, colors: { shirt: 0x2a2a30, legs: 0x2a2a34, skin: 0xe0b090, hair: 0x1a1a1a }, from: 3 });
		k.sphere(0.23, 0x111114, { y: 1.83, parent: harry, s: [1, 0.8, 1] });
		const marv = k.person({ x: 0.2, y: 0, z: 12.6, ry: PI - 0.2, s: 1.12, pose: "point", colors: { shirt: 0x8a7a50, legs: 0x3a3a48, skin: 0xe8c0a0, hair: 0x4a2a14 }, from: 3 });
		k.glow(0xfff8d0, 0.6, { x: 0.38, y: 1.45, z: -0.8, parent: marv });
		// Inside: broken ornaments and toy cars on the floor.
		const floor = k.group({ x: -200 });
		k.box(6, 0.1, 6, 0x7a5030, { y: -0.05, parent: floor });
		k.box(6, 3, 0.2, 0xd8cca8, { y: 1.5, z: -1.2, parent: floor });
		k.box(6, 0.5, 0.25, 0xf2efe8, { y: 0.25, z: -1.1, parent: floor });
		windowPane(k, 1.4, 1.6, 0x6a8ad0, { x: 0.4, y: 1.8, z: -1.05, parent: floor, glow: 0.6 });
		const r = rng(49);
		const shine = [0xd02020, 0xe0b030, 0x2a8a3a, 0x3060d0];
		for (let i = 0; i < 6; i++) k.sphere(0.07, shine[i % 4], { x: (r() - 0.5) * 1.4, y: 0.07, z: (r() - 0.5) * 1, parent: floor, metal: 0.7, rough: 0.2, seg: 12 });
		for (let i = 0; i < 26; i++) k.ico(0.02 + r() * 0.025, shine[i % 4], { x: (r() - 0.5) * 1.2, y: 0.01, z: (r() - 0.5) * 1, s: [1, 0.35, 1], ry: r() * 6, parent: floor, metal: 0.7, rough: 0.2 });
		for (let i = 0; i < 7; i++) {
			const car = k.group({ x: (r() - 0.5) * 1.6, z: 0.1 + (r() - 0.5) * 1.2, ry: r() * 6, parent: floor });
			k.box(0.08, 0.035, 0.15, shine[(i + 1) % 4], { y: 0.03, parent: car, metal: 0.5, rough: 0.3 });
			k.box(0.07, 0.03, 0.07, 0x2a3a4a, { y: 0.06, z: -0.01, parent: car });
			[-1, 1].forEach((s) => k.box(0.1, 0.025, 0.025, 0x111111, { y: 0.013, z: s * 0.05, parent: car }));
		}
		[[-1.8, -0.6, 0xc02020], [-1.2, -0.7, 0x2a6a3a], [1.9, -0.5, 0x3060d0]].forEach(([x, z, c]) => {
			k.box(0.5, 0.4, 0.5, c, { x, y: 0.2, z, parent: floor });
			k.box(0.52, 0.42, 0.08, 0xf2d040, { x, y: 0.2, z, parent: floor });
		});
		k.point(0xffd8a0, 4, 6, { x: -199, y: 1.4, z: 1.2 });
		k.point(0xa0b8ff, 1.5, 4, { x: -199.6, y: 1.4, z: -0.6 });
		// The staircase and the swinging paint can.
		const stairs = k.group({ x: 200 });
		k.box(8, 0.2, 14, 0x5a3a24, { y: -0.1, z: -3, parent: stairs });
		for (let i = 0; i < 12; i++) {
			const h = 0.35 * (i + 1);
			k.box(2.8, h, 0.5, 0x6a4028, { y: h / 2, z: -0.25 - i * 0.5, parent: stairs });
			k.box(1.4, h + 0.02, 0.52, 0x8a2020, { y: h / 2, z: -0.25 - i * 0.5, parent: stairs });
		}
		k.box(2.8, 4.2, 3, 0x6a4028, { y: 2.1, z: -7.5, parent: stairs });
		const paper = k.canvas(128, 128, (g) => {
			g.fillStyle = "#2f5a3a";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#4a7a52";
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
				g.beginPath();
				g.arc(16 + x * 32 + (y % 2) * 16, 16 + y * 32, 6, 0, PI * 2);
				g.fill();
			}
		});
		paper.wrapS = paper.wrapT = k.THREE.RepeatWrapping;
		paper.repeat.set(6, 4);
		k.box(0.2, 10, 16, k.mat(0xffffff, { map: paper }), { x: -1.5, y: 5, z: -3, parent: stairs });
		k.box(8, 10, 0.2, k.mat(0xffffff, { map: paper }), { y: 5, z: -9, parent: stairs });
		for (let i = 0; i < 12; i += 2) k.box(0.07, 1.1, 0.07, 0xf2efe8, { x: 1.35, y: 0.35 * (i + 1) + 0.55, z: -0.25 - i * 0.5, parent: stairs });
		seg(k, [201.35, 1.45, 0.4], [201.35, 5.35, -5.6], 0.12, 0x4a2a18);
		k.cyl(0.12, 0.14, 1.4, 0x4a2a18, { x: 1.35, y: 0.7, z: 0.4, parent: stairs });
		const swing = k.group({ x: 200, y: 8, z: -4 });
		k.cyl(0.015, 0.015, 5.1, 0xd8c8a0, { y: -2.55, parent: swing });
		const can = k.group({ y: -5.32, parent: swing });
		k.cyl(0.2, 0.2, 0.32, 0x9aa0a8, { parent: can, metal: 0.7, rough: 0.35, seg: 16 });
		k.cyl(0.205, 0.205, 0.16, 0xe8e0d0, { y: -0.02, parent: can, seg: 16 });
		k.torus(0.2, 0.012, 0x8a8a90, { y: 0.16, rz: 0, rx: 0, s: [1, 1.2, 1], arc: PI, parent: can, seg: 12 });
		k.cyl(0.2, 0.2, 0.02, 0xf0f0f0, { y: 0.17, parent: can, seg: 16 });
		k.tick((t) => (swing.rotation.x = -(0.33 + 0.03 * Math.sin(t * 2.2))));
		k.point(0xffe0b0, 8, 14, { x: 202, y: 6.5, z: -1 });
		k.point(0xffe0b0, 5, 10, { x: 199, y: 2.5, z: 2 });
		const victim = k.person({ x: 200, y: 1.4, z: -1.72, ry: PI, s: 0.95, pose: "arms-out", colors: { shirt: 0x2a2a30, legs: 0x2a2a34, skin: 0xe0b090, hair: 0x1a1a1a }, from: 4 });
		k.sphere(0.23, 0x111114, { y: 1.83, parent: victim, s: [1, 0.8, 1] });
		victim.rotation.x = 0.2;
		// The bathroom mirror: the scream.
		const bath = k.group({ x: 400 });
		const tile = k.canvas(128, 128, (g) => {
			g.fillStyle = "#a8c8c0";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#e8f2ee";
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
		});
		tile.wrapS = tile.wrapT = k.THREE.RepeatWrapping;
		tile.repeat.set(4, 3);
		k.box(6, 4, 0.2, k.mat(0xffffff, { map: tile }), { y: 2, z: -1.2, parent: bath });
		k.box(0.2, 4, 6, k.mat(0xffffff, { map: tile }), { x: -2, y: 2, parent: bath });
		k.box(6, 0.1, 6, 0xd8d0c0, { y: -0.05, parent: bath });
		k.box(0.12, 0.7, 0.9, 0xc04040, { x: -1.85, y: 1.5, z: -0.4, parent: bath });
		k.box(1.6, 0.08, 0.6, 0xf2efe8, { y: 0.78, z: 0.5, parent: bath });
		k.box(1.5, 0.74, 0.5, 0xe0dcd0, { y: 0.37, z: 0.5, parent: bath });
		k.cyl(0.05, 0.06, 0.2, 0x3a6ab0, { x: 0.5, y: 0.92, z: 0.45, parent: bath, rough: 0.2, opacity: 0.85 });
		k.cyl(0.02, 0.02, 0.05, 0xe8e8e8, { x: 0.5, y: 1.04, z: 0.45, parent: bath });
		const kevin = k.person({ x: 400, y: 0, z: 0, s: 0.72, colors: { shirt: 0xc8202a, legs: 0x3a4a6a, skin: 0xf2c8a8, hair: 0xe0b860 } });
		reach(k, kevin, [399.87, 1.21, 0.07], [400.13, 1.21, 0.07], { skin: 0xf2c8a8, elbowL: [399.72, 0.95, 0.18], elbowR: [400.28, 0.95, 0.18] });
		k.sphere(0.035, 0x3a0a0a, { x: 400, y: 1.18, z: 0.135, s: [0.8, 1.3, 0.5] });
		[-1, 1].forEach((s) => {
			k.sphere(0.022, 0xffffff, { x: 400 + s * 0.05, y: 1.28, z: 0.126 });
			k.sphere(0.011, 0x1a3a6a, { x: 400 + s * 0.05, y: 1.28, z: 0.145 });
			k.box(0.045, 0.01, 0.01, 0xa07a3a, { x: 400 + s * 0.05, y: 1.33, z: 0.13, rz: -s * 0.25 });
		});
		k.point(0xfff4e0, 6, 6, { x: 400.4, y: 2.2, z: 1.6 });
		k.point(0xffe0c0, 2, 5, { x: 399, y: 1.6, z: 1 });
		// The basement: an old oil furnace, its grate glowing.
		const base = k.group({ x: 600 });
		k.box(10, 0.1, 10, 0x6a6660, { y: -0.05, parent: base });
		k.box(10, 5, 0.3, 0x8a847a, { y: 2.5, z: -2.6, parent: base });
		k.box(0.3, 5, 10, 0x7a746a, { x: -3, y: 2.5, parent: base });
		for (let i = 0; i < 5; i++) k.box(10, 0.04, 0.32, 0x6a645a, { y: 0.5 + i * 0.9, z: -2.44, parent: base });
		k.box(10, 0.3, 0.3, 0x5a3a24, { y: 4.2, z: -1.2, parent: base });
		k.box(10, 0.3, 0.3, 0x5a3a24, { y: 4.2, z: 1.2, parent: base });
		const iron = { metal: 0.5, rough: 0.6 };
		k.cyl(1.0, 1.1, 2.0, 0x4a4440, { y: 1.0, z: -1.2, parent: base, seg: 16, ...iron });
		k.cyl(1.05, 1.05, 0.12, 0x3a3430, { y: 2.02, z: -1.2, parent: base, seg: 16, ...iron });
		k.box(0.8, 0.5, 0.1, 0x1a1210, { y: 0.75, z: -0.12, parent: base });
		for (let i = 0; i < 5; i++) k.box(0.06, 0.42, 0.12, 0x2a2420, { x: -0.3 + i * 0.15, y: 0.75, z: -0.08, parent: base });
		k.box(0.7, 0.4, 0.05, 0xff7a20, { y: 0.75, z: -0.15, parent: base, emissive: 0xff5a10, glow: 1.5 });
		k.point(0xff7a30, 5, 5, { x: 600, y: 0.8, z: 0.6 });
		[[-0.6, -0.5, -1.6], [0.6, 0.5, -1.4], [0, 0.1, -1.9]].forEach(([x, lean, z]) => {
			k.cyl(0.28, 0.28, 2.6, 0x8a8a84, { x: x + lean * 0.8, y: 3.2, z, rz: -lean, parent: base, seg: 10, metal: 0.4, rough: 0.5 });
		});
		k.box(1.2, 1.0, 0.3, 0x6a5a48, { x: -2, y: 0.5, z: -2.2, parent: base });
		k.box(0.6, 0.8, 0.6, 0x7a5a3a, { x: 1.9, y: 0.4, z: -1.6, parent: base });
		k.cyl(0.01, 0.01, 0.6, 0x111111, { x: 1.5, y: 4.5, z: 0.6, parent: base });
		k.sphere(0.1, 0xfff0c0, { x: 1.5, y: 4.15, z: 0.6, parent: base, emissive: 0xffe0a0, glow: 1.5 });
		k.point(0xffe0b0, 6, 10, { x: 601.5, y: 3.9, z: 0.8 });
		k.point(0xa0b0d0, 2, 8, { x: 598, y: 2, z: 3 });
		return {
			shots: [
				{ pos: [-199.45, 0.32, 0.85], look: [-200, 0.05, 0], fov: 40 },
				{ pos: [601.6, 1.3, 3.6], look: [599.9, 1.6, -1.2], fov: 45 },
				{ pos: [10, 3.5, 30], look: [0, 4.5, -2], fov: 45 },
				{ pos: [-3.5, 1.9, 18.5], look: [2.2, 1.5, 12.5], fov: 45 },
				{ pos: [202.8, 2.8, 2.6], look: [200, 3.0, -2.4], fov: 50 },
				{ pos: [400.15, 1.28, 1.25], look: [400, 1.18, 0], fov: 35 },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the day off
	r50: (k) => {
		k.fog(0xc8dce0, 60, 320);
		k.sky(0x5a9ae0, 0xe0eef4);
		k.light({ sky: 0xf0f8ff, ground: 0x5a6a40, hemi: 1.35, sunPos: [30, 50, 20], sunIntensity: 2.3, shadowSize: 30 });
		// The woods, the ravine and the glass pavilion on stilts.
		k.ground(300, 0x4a7a32, { bump: 0.5, height: (x, z) => (z > 4 ? -Math.min(9, (z - 4) * 1.4) : 0) });
		k.box(300, 0.1, 5, 0x4a7aa0, { y: -8.6, z: 15, rough: 0.2 });
		trees(k, 70, [-60, 60, -60, 40], { color: 0x2f6a2a, h: 11, seed: 50, avoid: (x, z) => (Math.abs(x) < 9 && z > -10 && z < 12) || (z > 3 && z < 20) });
		const ferrari = (o) => {
			const g = k.group(o);
			const R = 0xc8101a;
			const red = { metal: 0.4, rough: 0.35 };
			const chrome = { metal: 1, rough: 0.15 };
			k.box(1.76, 0.55, 4.2, R, { y: 0.55, parent: g, ...red });
			k.box(1.6, 0.16, 1.9, R, { y: 0.88, z: 1.05, parent: g, ...red });
			k.box(1.66, 0.2, 1.3, R, { y: 0.9, z: -1.4, parent: g, ...red });
			k.cyl(0.28, 0.28, 1.76, R, { rz: PI / 2, y: 0.55, z: 2.1, parent: g, ...red });
			[-0.72, 0.72].forEach((x) => [1.25, -1.3].forEach((z) => k.sphere(0.5, R, { x, y: 0.72, z, s: [0.5, 0.45, 1.5], parent: g, ...red })));
			[-0.66, 0.66].forEach((x) => {
				k.sphere(0.14, 0xf8f4e0, { x, y: 0.78, z: 1.98, parent: g, emissive: 0xfff0c0, glow: 0.5, rough: 0.1 });
				k.sphere(0.1, 0xff2010, { x, y: 0.78, z: -2.05, parent: g, emissive: 0xa00000, glow: 0.8 });
				k.box(0.5, 0.06, 0.1, 0xe0e0e8, { x: x * 0.85, y: 0.38, z: 2.33, parent: g, ...chrome });
				k.box(0.5, 0.06, 0.1, 0xe0e0e8, { x: x * 0.85, y: 0.38, z: -2.12, parent: g, ...chrome });
			});
			k.box(0.7, 0.22, 0.05, 0x1a1a1a, { y: 0.5, z: 2.37, parent: g });
			k.box(1.5, 0.45, 0.04, 0xa8c8d8, { y: 1.15, z: 0.25, rx: -0.35, parent: g, opacity: 0.4, rough: 0.05 });
			k.box(1.56, 0.05, 0.06, 0xe0e0e8, { y: 1.36, z: 0.18, rx: -0.35, parent: g, ...chrome });
			k.box(1.5, 0.02, 1.7, 0x2a1a14, { y: 0.835, z: -0.35, parent: g });
			[-0.38, 0.38].forEach((x) => {
				k.box(0.55, 0.12, 0.6, 0x9a6a40, { x, y: 0.9, z: -0.4, parent: g });
				k.box(0.55, 0.5, 0.12, 0x9a6a40, { x, y: 1.1, z: -0.72, rx: -0.15, parent: g });
			});
			k.torus(0.17, 0.025, 0x1a1a1a, { x: 0.38, y: 1.08, z: 0.0, rx: -0.5, parent: g, seg: 16 });
			[-0.8, 0.8].forEach((x) => [1.35, -1.35].forEach((z) => {
				k.cyl(0.36, 0.36, 0.24, 0x151515, { x, y: 0.36, z, rz: PI / 2, parent: g, seg: 16 });
				k.cyl(0.22, 0.22, 0.26, 0xd8d8e0, { x, y: 0.36, z, rz: PI / 2, parent: g, seg: 12, ...chrome });
			}));
			return g;
		};
		const glass = k.mat(0xc8e8f0, { opacity: 0.2, rough: 0.05, metal: 0.3 });
		const steel = 0x1a1a1c;
		k.box(9.4, 0.35, 8.4, 0xd8d8d0, { y: 0.175, z: 1.2 });
		k.box(10, 0.35, 9, 0xe8e8e0, { y: 3.75, z: 1.2 });
		k.box(10.05, 0.15, 9.05, steel, { y: 3.6, z: 1.2 });
		[-4.6, 4.6].forEach((x) => [-3, 5.4].forEach((z) => k.box(0.15, 3.3, 0.15, steel, { x, y: 1.95, z })));
		[-3, 3].forEach((x) => k.box(0.25, 8, 0.25, steel, { x, y: -3.6, z: 5 }));
		k.box(9.2, 3.2, 0.04, glass, { y: 1.95, z: -3, shadow: false });
		k.box(9.2, 3.2, 0.04, glass, { y: 1.95, z: 5.4, shadow: false, until: 3 });
		[-4.6, 4.6].forEach((x) => k.box(0.04, 3.2, 8.4, glass, { x, y: 1.95, z: 1.2, shadow: false }));
		for (let i = -2; i <= 2; i++) {
			k.box(0.08, 3.2, 0.08, steel, { x: i * 1.84, y: 1.95, z: -3 });
			k.box(0.08, 3.2, 0.08, steel, { x: i * 1.84, y: 1.95, z: 5.4, until: 3 });
		}
		k.box(1.4, 0.9, 0.6, 0x5a5a60, { x: -3.6, y: 0.8, z: -2.2 });
		ferrari({ x: 0, y: 0.35, z: 1.4, ry: PI, until: 3 });
		k.point(0xfff0e0, 4, 10, { x: 0, y: 3, z: 1 });
		// The car goes backwards through the glass, into the ravine.
		const fall = k.group({ x: 0.3, y: -2.6, z: 7.8, ry: PI + 0.15, from: 4 });
		ferrari({ rx: -0.75, parent: fall });
		const r = rng(50);
		for (let i = 0; i < 50; i++) k.box(0.15 + r() * 0.3, 0.02, 0.1 + r() * 0.3, 0xd8f0ff, { x: (r() - 0.5) * 8, y: -2.5 + r() * 5, z: 5.6 + r() * 3.5, rx: r() * 6, ry: r() * 6, opacity: 0.6, rough: 0.05, from: 4 });
		for (let i = 0; i < 9; i++) k.cone(0.25, 0.8 + r(), 0xd8f0ff, { x: -4.2 + i, y: 3.1, z: 5.4, rx: PI, seg: 3, s: [1, 1, 0.1], opacity: 0.5, from: 4 });
		// A dotted painting in the gallery.
		const gallery = k.group({ x: 300 });
		k.box(14, 6, 0.2, 0xf2efe8, { y: 3, z: -0.2, parent: gallery });
		k.box(14, 0.1, 8, 0x8a6a48, { y: -0.05, z: 3, parent: gallery });
		k.box(5.5, 3.8, 0.12, 0xb89040, { y: 2.3, z: -0.04, parent: gallery, metal: 0.6, rough: 0.4 });
		const art = k.canvas(1024, 680, (g, w, h) => {
			const base = document.createElement("canvas");
			base.width = w;
			base.height = h;
			const b = base.getContext("2d");
			b.fillStyle = "#9ab84a";
			b.fillRect(0, 0, w, h);
			b.fillStyle = "#3a5a2a";
			b.fillRect(0, 0, w, h * 0.3);
			b.fillStyle = "#d0dce0";
			b.fillRect(0, 0, w * 0.4, h * 0.08);
			b.fillStyle = "#4a7ab0";
			b.beginPath();
			b.moveTo(0, h * 0.1);
			b.lineTo(w * 0.42, h * 0.1);
			b.lineTo(w * 0.2, h * 0.45);
			b.lineTo(0, h * 0.55);
			b.fill();
			b.fillStyle = "#4a6a2a";
			b.beginPath();
			b.moveTo(0, h * 0.8);
			b.lineTo(w, h * 0.68);
			b.lineTo(w, h);
			b.lineTo(0, h);
			b.fill();
			b.fillStyle = "#3a2a1a";
			[0.48, 0.62, 0.72, 0.88].forEach((x) => b.fillRect(x * w, 0, 10, h * 0.42));
			const fig = (x, y, s, dress, top) => {
				b.fillStyle = dress;
				b.beginPath();
				b.moveTo(x - 30 * s, y);
				b.lineTo(x + 34 * s, y);
				b.lineTo(x + 14 * s, y - 120 * s);
				b.lineTo(x - 12 * s, y - 120 * s);
				b.fill();
				b.fillStyle = top;
				b.fillRect(x - 10 * s, y - 175 * s, 20 * s, 60 * s);
				b.beginPath();
				b.arc(x, y - 185 * s, 12 * s, 0, PI * 2);
				b.fill();
			};
			fig(w * 0.82, h * 0.92, 2.2, "#2a1a2a", "#2a1a2a");
			b.fillStyle = "#2a1a2a";
			b.beginPath();
			b.ellipse(w * 0.84, h * 0.32, 70, 30, 0, PI, 0);
			b.fill();
			fig(w * 0.73, h * 0.92, 2.3, "#1a1a20", "#1a1a20");
			b.fillRect(w * 0.73 - 14, h * 0.92 - 470, 28, 50);
			fig(w * 0.5, h * 0.62, 0.9, "#e8a070", "#e8a070");
			fig(w * 0.555, h * 0.62, 0.55, "#f8f8f0", "#f8f8f0");
			b.fillStyle = "#e86a2a";
			b.fillRect(w * 0.555 - 10, h * 0.62 - 112, 20, 6);
			fig(w * 0.15, h * 0.9, 1.6, "#3a2a3a", "#e0d8c8");
			fig(w * 0.3, h * 0.6, 0.8, "#c84a4a", "#c84a4a");
			fig(w * 0.4, h * 0.45, 0.5, "#3a3a6a", "#3a3a6a");
			const px = b.getImageData(0, 0, w, h).data;
			g.fillStyle = "#c8c8a0";
			g.fillRect(0, 0, w, h);
			const rr = rng(1886);
			for (let i = 0; i < 52000; i++) {
				const x = Math.floor(rr() * w);
				const y = Math.floor(rr() * h);
				const j = (y * w + x) * 4;
				const n = (rr() - 0.5) * 70;
				const swap = rr() < 0.12;
				const c = swap ? [px[j + 2] + 40, px[j] + 20, px[j + 1]] : [px[j] + n, px[j + 1] + n * 0.8, px[j + 2] + n * 0.6];
				g.fillStyle = `rgb(${c.map((v) => Math.max(0, Math.min(255, v | 0))).join(",")})`;
				g.beginPath();
				g.arc(x, y, 3.2, 0, PI * 2);
				g.fill();
			}
		});
		k.plane(5.1, 3.4, k.mat(0xffffff, { map: art, rough: 0.9 }), { y: 2.3, z: 0.03, parent: gallery });
		k.spot(0xfff4e0, 30, { x: 300, y: 6, z: 3, target: [300, 2.3, 0], angle: 0.6, distance: 15 });
		k.point(0xfff4e0, 3, 10, { x: 300, y: 2, z: 3 });
		// A high-school corridor between classes: lockers, a trophy case, a wall clock.
		const hall = k.group({ x: 300, z: 300 });
		const lino = k.canvas(128, 128, (g) => {
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
				g.fillStyle = (x + y) % 2 ? "#d8d2c0" : "#c8c0aa";
				g.fillRect(x * 32, y * 32, 32, 32);
			}
		});
		lino.wrapS = lino.wrapT = k.THREE.RepeatWrapping;
		lino.repeat.set(5, 12);
		k.box(5, 0.1, 30, k.mat(0xffffff, { map: lino, rough: 0.25 }), { y: -0.05, parent: hall });
		k.box(5, 0.1, 30, 0xe8e8e0, { y: 3.4, parent: hall });
		[-2.5, 2.5].forEach((x) => k.box(0.1, 3.4, 30, 0xd8cca8, { x, y: 1.7, parent: hall }));
		for (let i = 0; i < 7; i++) k.box(0.5, 0.04, 1.6, 0xf8fbff, { y: 3.33, z: -12 + i * 4, parent: hall, emissive: 0xf0f8ff, glow: 1 });
		for (let i = 0; i < 26; i++) {
			const z = -12 + i * 0.5;
			if (z > -1.5 && z < 1.2) continue;
			k.box(0.4, 1.9, 0.46, [0x3a5a8a, 0x34548a][i % 2], { x: -2.25, y: 0.95, z, parent: hall, metal: 0.4, rough: 0.5 });
			for (let v = 0; v < 3; v++) k.box(0.02, 0.03, 0.3, 0x1a2a40, { x: -2.04, y: 1.6 + v * 0.07, z, parent: hall });
			k.box(0.03, 0.12, 0.04, 0xb8b8b8, { x: -2.04, y: 1.0, z: z + 0.15, parent: hall, metal: 0.8 });
		}
		k.box(0.3, 1.5, 2.4, 0x6a4a2a, { x: -2.3, y: 1.35, z: -0.15, parent: hall });
		k.box(0.32, 1.3, 2.2, 0xc8e0e8, { x: -2.28, y: 1.35, z: -0.15, parent: hall, opacity: 0.3, rough: 0.05 });
		[[-0.8, 0.25], [-0.2, 0.35], [0.4, 0.22], [0.9, 0.3]].forEach(([z, h]) => {
			k.cyl(0.07, 0.05, h, 0xd8b040, { x: -2.35, y: 1.0 + h / 2, z, parent: hall, metal: 0.9, rough: 0.25 });
			k.cyl(0.1, 0.1, 0.06, 0xd8b040, { x: -2.35, y: 1.03 + h, z, parent: hall, metal: 0.9, rough: 0.25 });
		});
		[-6, 4].forEach((z) => {
			k.box(0.08, 2.3, 1.1, 0x8a6a40, { x: 2.45, y: 1.15, z, parent: hall });
			k.box(0.1, 0.5, 0.3, 0xc8e0e8, { x: 2.42, y: 1.7, z: z + 0.2, parent: hall, opacity: 0.6 });
		});
		k.box(0.08, 1.2, 2.4, 0x6a8a5a, { x: 2.45, y: 1.6, z: -1, parent: hall });
		for (let i = 0; i < 6; i++) k.box(0.02, 0.28, 0.22, [0xf0f0e8, 0xf0e8a0, 0xc8e0f0][i % 3], { x: 2.4, y: 1.4 + (i % 2) * 0.4, z: -1.8 + i * 0.32, rz: 0.05, parent: hall });
		k.cyl(0.25, 0.25, 0.06, 0xf8f8f0, { x: 2.4, y: 2.85, z: 1.8, rz: PI / 2, parent: hall, seg: 20 });
		k.torus(0.25, 0.03, 0x1a1a1a, { x: 2.4, y: 2.85, z: 1.8, ry: PI / 2, parent: hall, seg: 20 });
		k.box(0.02, 0.15, 0.02, 0x111111, { x: 2.36, y: 2.9, z: 1.8, parent: hall });
		k.box(0.02, 0.02, 0.12, 0x111111, { x: 2.36, y: 2.85, z: 1.85, parent: hall });
		k.point(0xf4f8ff, 5, 14, { x: 300, y: 3, z: 298 });
		k.point(0xf4f8ff, 4, 14, { x: 300, y: 3, z: 304 });
		// Chicago: the tower, the city and the observation deck.
		city(k, 90, [-470, -330, -160, 60], { h: 50, w: 10, colors: [0x8a8a90, 0x6a6e78, 0xa8a49a, 0x5a5e66], windows: 0xd8e0ff, seed: 86, avoid: (x, z) => Math.abs(x + 400) < 13 || z > 50 || Math.hypot(x + 420, z + 60) < 16 });
		const sears = k.group({ x: -420, z: -60 });
		[[12, 110, 0, 0], [8, 140, -2, -2], [6, 125, 3, 3], [6, 95, 3, -3]].forEach(([w, h, x, z]) => k.box(w, h, w, 0x1a1a1e, { x, y: h / 2, z, parent: sears }));
		[-1.5, 1.5].forEach((x) => k.cyl(0.25, 0.4, 24, 0xd8d8d8, { x, y: 152, z: -2, parent: sears }));
		k.box(18, 125, 14, 0x1a1a1e, { x: -400, y: 62.5, z: 88 });
		k.box(16, 0.3, 6, 0x5a5a60, { x: -400, y: 119.85, z: 84 });
		k.box(16, 0.3, 6, 0x2a2a2e, { x: -400, y: 124.2, z: 84 });
		k.box(15, 4.2, 0.03, glass, { x: -400, y: 122, z: 81.05, shadow: false });
		for (let i = 0; i < 7; i++) k.box(0.15, 4.2, 0.15, 0x111111, { x: -407 + i * 2.33, y: 122, z: 81.05 });
		const teen = (x, colors, o = {}) => backHair(k, k.person({ x, y: 120, z: 81.55, ry: PI, rx: -0.14, colors, ...o }), colors.hair);
		teen(-401.6, { shirt: 0xb81a2a, legs: 0x3a4a6a, hair: 0x3a2a1a });
		teen(-400, { shirt: 0x8a6a4a, legs: 0x2a2a30, hair: 0x5a3a20 }, { sleeves: 0xf0f0f0 });
		teen(-398.3, { shirt: 0xf0ece0, legs: 0x3a3a48, hair: 0xd8a860, skin: 0xf0c8a8 });
		k.point(0xffffff, 3, 12, { x: -400, y: 123, z: 85 });
		// The parade.
		k.box(18, 0.1, 160, 0x4a4a50, { x: -400, y: 0.05, z: -20 });
		[-1, 1].forEach((s) => k.box(4, 0.3, 160, 0xa8a8a0, { x: -400 + s * 11, y: 0.15, z: -20 }));
		k.ground(220, 0x8a8a84, { x: -400, z: -40, bump: 0, y: -0.05 });
		const float = k.group({ x: -400, z: 8, from: 4 });
		const skirt = k.canvas(256, 64, (g) => {
			["#1a1a1a", "#c81a1a", "#f2c020"].forEach((c, i) => {
				g.fillStyle = c;
				g.fillRect(0, i * 21, 256, 22);
			});
			g.fillStyle = "#ffffff";
			for (let i = 0; i < 8; i++) {
				g.beginPath();
				g.arc(16 + i * 32, 64, 14, PI, 0);
				g.fill();
			}
		});
		skirt.wrapS = k.THREE.RepeatWrapping;
		skirt.repeat.set(4, 1);
		k.box(4.6, 1.3, 9, k.mat(0xffffff, { map: skirt }), { y: 0.85, parent: float });
		k.box(4.7, 0.12, 9.1, 0xf0f0f0, { y: 1.55, parent: float });
		k.box(2.6, 0.9, 2.6, 0x2a6a3a, { y: 2.05, z: 1.5, parent: float });
		k.box(2.7, 0.1, 2.7, 0xf2c020, { y: 2.55, z: 1.5, parent: float });
		const ferris = k.person({ x: 0, y: 2.6, z: 1.6, pose: "raise", colors: { shirt: 0x6a4a30, legs: 0x2a2a30, hair: 0x5a3a20, skin: 0xf0c8a0 }, sleeves: 0xf2f2f2, parent: float });
		ferris.userData.limbs.armL.rotation.z = -2.5;
		k.cyl(0.05, 0.05, 0.25, 0x1a1a1a, { x: -0.25, y: 2.2, z: 0.15, parent: ferris });
		[[-1.5, 3.2], [1.5, 3.4], [-1.4, -1.5], [1.4, -2], [0, -3]].forEach(([x, z], i) => k.person({ x, y: 1.61, z, ry: (i % 2 ? -0.3 : 0.3), s: 0.92, pose: i % 2 ? "arms-out" : "raise", dress: 0xc81a1a, colors: { shirt: 0xf8f8f0, legs: 0xf0e0d0, hair: [0xd8b060, 0x5a3a20, 0x8a4a20][i % 3], skin: 0xf0c8a8 }, parent: float }));
		const crowdCol = [0xc83a3a, 0x3a6ac8, 0xf2c030, 0x3a9a5a, 0xf0f0f0, 0x8a4ac8, 0xe87a30];
		const rc = rng(7);
		for (let i = 0; i < 90; i++) {
			const side = i % 2 ? 1 : -1;
			k.person({ x: -400 + side * (9.5 + rc() * 3), y: 0.3, z: -30 + rc() * 55, ry: side > 0 ? -PI / 2 + (rc() - 0.5) : PI / 2 + (rc() - 0.5), s: 0.85 + rc() * 0.2, pose: rc() > 0.6 ? "raise" : "stand", colors: { shirt: crowdCol[i % 7], legs: crowdCol[(i + 3) % 7] === 0xf0f0f0 ? 0x2a3a5a : 0x2a3a5a, hair: [0x2a1a10, 0x8a5a2a, 0xd8b060][i % 3] }, from: 4 });
		}
		[0xff3030, 0xffd030, 0x30a0ff, 0xffffff].forEach((c) => k.particles(300, c, { x: -400, z: 5, box: [22, 16, 40], speed: 1.6, size: 0.16, drift: 1.2, from: 4 }));
		for (let i = 0; i < 4; i++) for (let j = 0; j < 12; j++) k.box(1.4, 0.6, 0.04, [0xc81a1a, 0xf2c020, 0x1a1a1a, 0xf0f0f0][(i + j) % 4], { x: -409 + j * 1.6, y: 9 - Math.sin((j / 11) * PI) * 1.2, z: -14 - i * 14, rz: 0.1 * Math.sin(j) });
		return {
			shots: [
				{ pos: [300.6, 1.6, 305], look: [299.6, 1.4, 296], fov: 50, fog: [0xd8d4c8, 8, 40] },
				{ pos: [300.25, 2.25, 0.95], look: [300.25, 2.25, 0], fov: 30 },
				{ pos: [-397.2, 122.6, 83.6], look: [-401, 104, 50], fov: 55 },
				{ pos: [1.9, 0.85, -2.4], look: [0.3, 0.95, -0.6], fov: 38 },
				{ pos: [8.5, 0.8, 13.5], look: [0, -1.5, 5.5], fov: 50 },
				{ pos: [-397.8, 2.7, 15.8], look: [-400, 3.9, 9], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the carrier
	r51: (k) => {
		k.fog(0xe8956a, 120, 700);
		k.sky(0x3a4a8a, 0xf8a868, { offset: -0.03 });
		k.light({ sky: 0xffd0b0, ground: 0x3a3040, hemi: 1.3, sunColor: 0xffb070, sunIntensity: 2.4, sunPos: [10, 25, -80], shadowSize: 90 });
		k.water(1000, 0x2a4a6a, { seg: 60, amp: 0.35 });
		k.glow(0xffb060, 160, { x: 0, y: 40, z: -760, tag: "sky" });
		k.disc(0xfff0c8, 40, { x: 0, y: 40, z: -790, tag: "sky" });
		const jet = (o, c = 0xa0a8b2, opt = {}) => {
			const g = k.group(o);
			const m = { metal: 0.3, rough: 0.6 };
			k.box(2.0, 1.3, 9.5, c, { z: -0.25, parent: g, ...m });
			k.cyl(0.75, 0.95, 2, c, { rx: PI / 2, z: 5.5, y: 0.1, parent: g, ...m });
			k.cone(0.75, 2.6, c, { rx: PI / 2, z: 7.8, y: 0.1, parent: g, seg: 10, ...m });
			k.sphere(0.6, 0x1a2a3a, { y: 0.8, z: 4.2, s: [0.95, 0.75, 2.4], parent: g, metal: 0.6, rough: 0.1 });
			[-1, 1].forEach((s) => {
				k.box(1.1, 1.3, 5, c, { x: s * 1.5, y: -0.1, z: 1, parent: g, ...m });
				k.cyl(0.62, 0.58, 6, c, { x: s * 1.2, y: -0.1, z: -4, rx: PI / 2, parent: g, ...m });
				k.cyl(0.55, 0.5, 0.8, 0x2a2a2a, { x: s * 1.2, y: -0.1, z: -7.3, rx: PI / 2, parent: g });
				if (opt.burn) {
					k.glow(0xff9030, 2.4, { x: s * 1.2, y: -0.1, z: -8.1, parent: g });
					k.glow(0x80a0ff, 1.2, { x: s * 1.2, y: -0.1, z: -7.8, parent: g });
				}
				k.box(6, 0.15, 2.2, c, { x: s * 3.6, y: 0.1, z: -2.4, ry: s * 0.5, parent: g, ...m });
				k.box(3, 0.12, 2, c, { x: s * 2.6, y: -0.1, z: -6.6, ry: s * 0.4, parent: g, ...m });
				if (opt.tails !== 1) k.box(0.15, 3, 2.4, c, { x: s * 1.3, y: 1.9, z: -5.6, rz: -s * 0.2, rx: -0.35, parent: g, ...m });
				if (opt.gear) k.cyl(0.08, 0.08, 1.2, 0x3a3a3a, { x: s * 1.6, y: -1.2, z: -1.5, parent: g });
				if (opt.gear) k.cyl(0.35, 0.35, 0.25, 0x111111, { x: s * 1.6, y: -1.8, z: -1.5, rz: PI / 2, parent: g });
			});
			k.box(5, 0.3, 3, c, { y: 0.2, z: -0.8, parent: g, ...m });
			if (opt.tails === 1) k.box(0.15, 3, 2.4, c, { y: 1.9, z: -5.4, rx: -0.4, parent: g, ...m });
			if (opt.star) k.cyl(0.4, 0.4, 0.17, 0xd01a1a, { seg: 5, rz: PI / 2, y: 2.1, z: -5.6, parent: g, emissive: 0x400000 });
			if (opt.gear) {
				k.cyl(0.08, 0.08, 1.2, 0x3a3a3a, { y: -1.2, z: 5, parent: g });
				k.cyl(0.3, 0.3, 0.2, 0x111111, { y: -1.8, z: 5, rz: PI / 2, parent: g });
			}
			return g;
		};
		// The carrier.
		k.box(24, 14, 150, 0x5a6068, { y: 5 });
		k.box(30, 0.6, 160, 0x3a3e44, { y: 12.3 });
		k.box(14, 0.6, 80, 0x3a3e44, { x: -14, y: 12.3, z: -10, ry: 0.16 });
		k.box(0.4, 0.05, 150, 0xf0f0f0, { y: 12.625 });
		[-1, 1].forEach((s) => k.box(0.25, 0.05, 150, 0xf2d020, { x: s * 6, y: 12.625 }));
		k.box(0.4, 0.05, 80, 0xf0f0f0, { x: -12, y: 12.625, z: -10, ry: 0.16 });
		k.box(5, 9, 20, 0x6a7078, { x: 12.5, y: 17, z: 15 });
		k.box(5.1, 1.2, 14, 0x1a2a3a, { x: 12.5, y: 19.5, z: 15, emissive: 0x302010 });
		k.box(4, 3, 10, 0x6a7078, { x: 12.5, y: 23, z: 15 });
		k.cyl(0.3, 0.4, 10, 0x5a6068, { x: 12.5, y: 29, z: 14 });
		const radar = k.box(4, 1.2, 0.2, 0x8a9098, { x: 12.5, y: 32, z: 14 });
		k.tick((t) => (radar.rotation.y = t * 1.5));
		[[8, 40, 0.6], [8, 52, 0.6], [8, 64, 0.6], [-7, 58, -0.5]].forEach(([x, z, ry]) => jet({ x, y: 14.3, z, ry, s: 0.6 }, 0xa0a8b2, { gear: true }));
		const crew = [0xf2d020, 0x3a9a3a, 0x8a3ac8, 0xd02a2a, 0xf0f0f0, 0x3a6ad0];
		for (let i = 0; i < 12; i++) {
			const c = crew[i % 6];
			const p = k.person({ x: -10 + (i * 7) % 20, y: 12.6, z: -30 + i * 7, ry: i, s: 0.9, colors: { shirt: c, legs: 0x5a5a4a } });
			k.sphere(0.24, c, { y: 1.8, parent: p, s: [1, 0.85, 1] });
		}
		// The catapult: the jet, the steam and the shooter.
		jet({ x: 0, y: 14.3, z: -50, ry: PI, s: 0.6 }, 0xa0a8b2, { gear: true, burn: true });
		k.box(4, 2.2, 0.2, 0x5a5a60, { y: 13.7, z: -45, rx: 0.9 });
		const steam = [];
		for (let i = 0; i < 26; i++) steam.push(k.glow(0xf0e8e0, 2, { x: 0, y: 12.9, z: -64 + i, opacity: 0.25, fog: true }));
		k.tick((t) => steam.forEach((s, i) => {
			s.position.y = 12.9 + ((t * 0.6 + i * 0.13) % 1) * 1.5;
			s.scale.setScalar(1.5 + ((t * 0.6 + i * 0.13) % 1) * 2);
		}));
		const shooter = k.person({ x: 5, y: 12.2, z: -62, ry: PI - 0.4, pose: "point", colors: { shirt: 0xf2d020, legs: 0x4a4a3a } });
		shooter.userData.limbs.legL.rotation.x = -1.4;
		shooter.userData.limbs.legR.rotation.x = 0.4;
		shooter.userData.limbs.armR.rotation.set(-1.7, 0, 0);
		k.sphere(0.25, 0xf2d020, { y: 1.82, parent: shooter, s: [1, 0.85, 1] });
		k.box(0.36, 0.08, 0.08, 0x1a1a1a, { y: 1.8, z: 0.2, parent: shooter });
		[-1, 1].forEach((s) => k.sphere(0.09, 0x1a1a1a, { x: s * 0.22, y: 1.75, parent: shooter }));
		k.point(0xffb070, 6, 20, { x: 8, y: 16, z: -66 });
		// A bar: an upright piano with beers on its lid.
		const bar = k.group({ x: 300, y: 100 });
		k.box(10, 0.2, 8, 0x5a3a24, { y: -0.1, parent: bar });
		for (let i = 0; i < 10; i++) k.box(0.03, 0.01, 8, 0x3a2414, { x: -4.5 + i, y: 0.005, parent: bar, shadow: false });
		k.box(10, 4, 0.2, 0x3a4a3a, { y: 2, z: -1.6, parent: bar });
		k.box(10, 1.1, 0.25, 0x4a2e1a, { y: 0.55, z: -1.45, parent: bar });
		const wood = { rough: 0.45 };
		k.box(2.4, 1.6, 0.8, 0x2a1810, { y: 0.8, z: -1.0, parent: bar, ...wood });
		k.box(2.5, 0.08, 0.86, 0x3a2216, { y: 1.64, z: -1.0, parent: bar, ...wood });
		k.box(2.3, 0.08, 0.36, 0x2a1810, { y: 0.98, z: -0.45, parent: bar, ...wood });
		k.box(2.2, 0.04, 0.24, 0xf4f0e4, { y: 1.04, z: -0.42, parent: bar });
		for (let i = 0; i < 30; i++) if (i % 7 !== 2 && i % 7 !== 6) k.box(0.035, 0.03, 0.12, 0x111111, { x: -1.05 + i * 0.073, y: 1.075, z: -0.47, parent: bar });
		k.box(1.4, 0.5, 0.04, 0x1a0e08, { y: 1.35, z: -0.6, parent: bar });
		k.box(0.6, 0.35, 0.02, 0xf2ecd8, { x: 0.1, y: 1.32, z: -0.57, rx: -0.15, parent: bar });
		[[-0.8, 0xd8a030], [-0.55, 0xc89028], [0.7, 0xe0b040]].forEach(([x, c]) => {
			k.cyl(0.07, 0.06, 0.24, c, { x, y: 1.8, z: -1.0, parent: bar, opacity: 0.85, rough: 0.1 });
			k.cyl(0.072, 0.072, 0.05, 0xf8f4e8, { x, y: 1.93, z: -1.0, parent: bar });
		});
		k.cyl(0.1, 0.12, 0.06, 0x8a8a90, { x: 0.25, y: 1.71, z: -1.05, parent: bar, metal: 0.6, rough: 0.3 });
		k.box(0.9, 0.08, 0.4, 0x4a2a1a, { y: 0.55, z: 0.2, parent: bar });
		k.cyl(0.04, 0.04, 0.55, 0x1a1a1a, { x: -0.35, y: 0.27, z: 0.2, parent: bar });
		k.cyl(0.04, 0.04, 0.55, 0x1a1a1a, { x: 0.35, y: 0.27, z: 0.2, parent: bar });
		k.box(1.2, 0.8, 0.05, 0x1a1a1a, { x: -2.8, y: 2.6, z: -1.48, parent: bar });
		k.box(1.1, 0.7, 0.06, 0x6a7a8a, { x: -2.8, y: 2.6, z: -1.47, parent: bar, emissive: 0x2a3a4a });
		k.cyl(0.35, 0.35, 0.05, 0xb02020, { x: 2.8, y: 2.7, z: -1.48, rx: PI / 2, parent: bar, emissive: 0xc02020, glow: 0.7, seg: 20 });
		k.point(0xffd0a0, 6, 10, { x: 301.5, y: 103, z: 1.5 });
		k.point(0xffa060, 3, 8, { x: 298, y: 101.5, z: 1 });
		k.glow(0xffd8a0, 0.8, { x: 302.2, y: 102.2, z: -1.3 });
		// A weathered beach house at dusk, an old black convertible parked out front.
		const beach = k.group({ x: 300, z: -300 });
		k.box(60, 1, 40, 0xc8a878, { y: 0.1, z: -8, parent: beach, rough: 1 });
		k.box(60, 0.6, 6, 0xb89868, { y: -0.05, z: 13, rx: 0.08, parent: beach, rough: 1 });
		const house = k.group({ x: -2, y: 0.6, z: -9, parent: beach });
		k.box(9, 0.6, 7, 0x6a5a48, { y: 0.3, parent: house });
		k.box(8, 4, 5.5, 0xd8d0b8, { y: 2.6, z: -0.6, parent: house });
		gable(k, 8.8, 2.4, 6.2, 0x5a6a70, { y: 4.6, z: -0.6, parent: house });
		k.box(9, 0.15, 2, 0x8a7a60, { y: 0.65, z: 3.1, parent: house });
		k.box(9.2, 0.15, 2.3, 0x5a6a70, { y: 3.4, z: 3.0, rx: -0.12, parent: house });
		[-4.3, -1.5, 1.5, 4.3].forEach((x) => k.box(0.14, 2.7, 0.14, 0xf0ece0, { x, y: 2.0, z: 4.0, parent: house }));
		for (let i = 0; i < 30; i++) if (i < 13 || i > 16) k.box(0.06, 0.7, 0.06, 0xf0ece0, { x: -4.3 + i * 0.3, y: 1.05, z: 4.0, parent: house });
		k.box(8.6, 0.08, 0.08, 0xf0ece0, { y: 1.4, z: 4.0, parent: house });
		k.box(1.1, 2.1, 0.08, 0x3a4a5a, { y: 1.7, z: 2.18, parent: house });
		[-2.6, 2.6].forEach((x) => windowPane(k, 1.3, 1.2, 0xffd890, { x, y: 2.0, z: 2.18, parent: house, glow: 0.9, frame: 0xf0ece0 }));
		windowPane(k, 1.2, 0.9, 0xffc870, { y: 4.9, z: 2.6, parent: house, glow: 0.6, frame: 0xf0ece0 });
		for (let i = 0; i < 4; i++) k.box(1.6, 0.12, 0.4, 0x8a7a60, { y: 0.55 - i * 0.14, z: 4.3 + i * 0.4, parent: house });
		k.point(0xffd090, 5, 8, { x: 298, y: 3.4, z: -306.8 });
		k.point(0xffc080, 3, 8, { x: 305, y: 2.5, z: -299 });
		[[-9, -12], [7, -14], [9.5, -6]].forEach(([x, z], i) => {
			const h = 7 + i * 1.5;
			k.cyl(0.15, 0.25, h, 0x6a5a40, { x, y: h / 2, z, rz: 0.08 * (i - 1), parent: beach });
			for (let f = 0; f < 7; f++) k.box(2.4, 0.05, 0.5, 0x2a4a2a, { x: x + Math.cos(f * 0.9) * 1.1, y: h - 0.2, z: z + Math.sin(f * 0.9) * 1.1, ry: -f * 0.9, rz: -0.45, parent: beach });
		});
		const speedster = k.group({ x: 3.2, y: 0.6, z: -2.4, ry: 0.5, parent: beach });
		const blk = { metal: 0.6, rough: 0.25 };
		k.capsule(0.55, 2.6, 0x111114, { rx: PI / 2, y: 0.55, s: [1.35, 1, 0.75], parent: speedster, ...blk });
		[-0.68, 0.68].forEach((x) => [1.15, -1.15].forEach((z) => {
			k.sphere(0.36, 0x111114, { x, y: 0.5, z, s: [0.55, 0.8, 1.3], parent: speedster, ...blk });
			k.cyl(0.3, 0.3, 0.2, 0x0a0a0a, { x, y: 0.3, z, rz: PI / 2, parent: speedster, seg: 14 });
			k.cyl(0.17, 0.17, 0.22, 0xd8d8e0, { x, y: 0.3, z, rz: PI / 2, parent: speedster, seg: 12, metal: 1, rough: 0.15 });
		}));
		k.box(1.0, 0.05, 1.1, 0x6a2a1a, { y: 0.96, z: -0.2, parent: speedster });
		k.box(1.1, 0.18, 0.04, 0xa8c8d8, { y: 1.08, z: 0.45, rx: -0.3, parent: speedster, opacity: 0.5, rough: 0.05 });
		[-0.45, 0.45].forEach((x) => k.sphere(0.1, 0xf8f0d0, { x, y: 0.72, z: 1.62, parent: speedster, emissive: 0xffe0a0, glow: 0.4 }));
		// The runway: a bike racing a jet.
		k.box(200, 1, 400, 0xa89068, { x: -400, y: -0.4 });
		k.box(18, 0.05, 400, 0x3a3a40, { x: -399, y: 0.12 });
		k.box(5, 0.05, 400, 0x4a4a50, { x: -386, y: 0.12 });
		for (let i = 0; i < 40; i++) k.box(0.4, 0.06, 4, 0xf0f0f0, { x: -399, y: 0.13, z: -200 + i * 10 });
		for (let i = 0; i < 60; i++) k.box(0.08, 1.4, 0.08, 0x6a6a6a, { x: -390, y: 0.8, z: -150 + i * 5 });
		k.box(0.03, 1.2, 300, 0x8a8a8a, { x: -390, y: 1, opacity: 0.4 });
		jet({ x: -398, y: 3.6, z: -1, rx: -0.12, s: 0.6 }, 0xa0a8b2, { burn: true });
		const bike = k.group({ x: -386, y: 0.12, z: 2 });
		[-0.75, 0.75].forEach((z) => k.cyl(0.33, 0.33, 0.14, 0x111111, { z, y: 0.33, rz: PI / 2, parent: bike, seg: 14 }));
		k.box(0.32, 0.4, 1.3, 0x1a1a1a, { y: 0.65, parent: bike });
		k.box(0.4, 0.3, 0.6, 0x1a1a1a, { y: 0.95, z: 0.2, parent: bike });
		k.box(0.42, 0.45, 0.4, 0xb01a1a, { y: 0.9, z: 0.65, rx: -0.35, parent: bike });
		k.box(0.3, 0.12, 0.7, 0x2a2a2a, { y: 0.92, z: -0.4, parent: bike });
		k.box(0.7, 0.04, 0.04, 0x8a8a8a, { y: 1.15, z: 0.5, parent: bike });
		k.glow(0xfff0c0, 0.7, { y: 0.95, z: 0.9, parent: bike });
		const rider = k.person({ x: 0, y: 0.08, z: -0.35, pose: "sit", shades: true, colors: { shirt: 0x5a3a20, legs: 0x3a4a6a, hair: 0x3a2618, skin: 0xe0b48f }, parent: bike });
		rider.userData.limbs.legL.rotation.set(-1.2, 0, -0.25);
		rider.userData.limbs.legR.rotation.set(-1.2, 0, 0.25);
		rider.rotation.x = 0.3;
		reach(k, rider, [-386.33, 1.3, 2.5], [-385.67, 1.3, 2.5], { skin: 0xe0b48f });
		// Inverted, above the black jet.
		k.point(0xffd0a0, 4, 400, { x: 40, y: 330, z: 40, decay: 0 });
		jet({ x: 0, y: 300, z: 0, s: 0.52 }, 0x2a2a30, { tails: 1, star: true });
		jet({ x: 0, y: 304.2, z: 2.2, rz: PI, s: 0.6 }, 0xa0a8b2);
		const rcl = rng(51);
		for (let i = 0; i < 30; i++) k.sphere(8 + rcl() * 8, 0xffe4d0, { x: (rcl() - 0.5) * 300, y: 270, z: (rcl() - 0.5) * 300, s: [1.8, 0.4, 1], seg: 8, rings: 6, rough: 1, from: 5, until: 5 });
		// The flyby at sunset.
		jet({ x: -25, y: 45, z: 40, ry: PI, rz: -0.5, s: 0.6, from: 4, until: 4 }, 0xa0a8b2, { burn: true });
		jet({ x: -37, y: 47, z: 28, ry: PI, rz: -0.45, s: 0.6, from: 4, until: 4 }, 0xa0a8b2, { burn: true });
		return {
			shots: [
				{ pos: [301.6, 1.75 + 100, 2.6], look: [300, 101.3, -0.8], fov: 45, fog: [0x1a1210, 4, 20] },
				{ pos: [306, 2.2, -294], look: [300, 2.4, -308], fov: 45 },
				{ pos: [13, 13.5, -68], look: [3, 13.6, -58], fov: 45, exposure: 1.3 },
				{ pos: [-381.5, 1.1, 10], look: [-391, 2.0, 0], fov: 50, exposure: 1.2 },
				{ pos: [-20.5, 48.5, 53], look: [-26, 44, 30], fov: 50 },
				{ pos: [13, 302.2, 7], look: [0, 302, 1], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the steps
	r52: (k) => {
		k.fog(0xf0c8a0, 80, 420);
		k.sky(0x5a7ab8, 0xffc898, { offset: -0.04 });
		k.light({ sky: 0xffe0c8, ground: 0x6a5a50, hemi: 1.35, sunColor: 0xffc080, sunIntensity: 2.3, sunPos: [20, 25, 80], shadowSize: 50 });
		k.ground(800, 0x6a7a4a, { bump: 0.2, seg: 20 });
		k.glow(0xffc070, 120, { x: 20, y: 25, z: 600, tag: "sky" });
		k.disc(0xfff0d0, 22, { x: 20, y: 25, z: 620, tag: "sky" });
		// The museum on its plaza.
		const stone = 0xd8c8a0;
		k.box(60, 8, 34, 0xc8c0b0, { y: 4, z: -25 });
		k.box(40, 0.1, 22, 0xb0a898, { y: 0.05, z: 22 });
		k.box(44, 16, 20, stone, { y: 16, z: -34 });
		for (let i = 0; i < 8; i++) k.cyl(0.9, 1, 13, 0xe8dcc0, { x: -10.5 + i * 3, y: 14.5, z: -22 });
		k.box(28, 2.2, 4, stone, { y: 22.1, z: -22.5 });
		gable(k, 28, 4.2, 3.8, 0xd0c098, { y: 23.2, z: -22.5 });
		k.box(10, 6, 0.2, 0x3a3028, { y: 11, z: -24 });
		[-1, 1].forEach((s) => {
			k.box(16, 18, 30, stone, { x: s * 30, y: 17, z: -40 });
			gable(k, 16, 3.5, 3, 0xd0c098, { x: s * 30, y: 26, z: -24.5 });
			for (let i = 0; i < 4; i++) k.cyl(0.7, 0.8, 12, 0xe8dcc0, { x: s * 30 - 5 + i * 3.3, y: 14, z: -24 });
		});
		// The steps, down towards the city.
		for (let i = 1; i <= 32; i++) {
			const h = 8 - i * 0.25;
			if (h > 0) k.box(26, h, 0.6, i % 8 === 0 ? 0xc8beac : 0xbab2a2, { y: h / 2, z: -8 + (i - 0.5) * 0.6 });
		}
		[-1, 1].forEach((s) => k.box(2, 8, 20, 0xc8c0b0, { x: s * 14, y: 4, z: -2, rx: 0.4, s: [1, 1, 1] }));
		// The parkway to City Hall.
		k.box(14, 0.05, 400, 0x5a5a60, { y: 0.03, z: 220 });
		for (let i = 0; i < 18; i++) [-1, 1].forEach((s) => {
			const z = 30 + i * 10;
			k.cyl(0.25, 0.3, 2.5, 0x4a3020, { x: s * 10, y: 1.25, z });
			k.sphere(2.2, 0x4a7a3a, { x: s * 10, y: 3.6, z, seg: 8, rings: 6 });
			k.cyl(0.05, 0.05, 6, 0xd8d8d8, { x: s * 8, y: 3, z: z + 5 });
			k.box(1.2, 0.7, 0.04, [0xc02020, 0x2a5ab0, 0xf2c020, 0x2a9a4a][(i + (s > 0 ? 1 : 0)) % 4], { x: s * 8 + 0.6, y: 5.6, z: z + 5 });
		});
		const hall = k.group({ z: 230 });
		k.box(34, 18, 30, 0xd8c8a8, { y: 9, parent: hall });
		k.box(10, 22, 10, 0xd8c8a8, { y: 29, parent: hall });
		k.box(8, 10, 8, 0xe0d0b0, { y: 45, parent: hall });
		k.cyl(3.5, 4.5, 8, 0xb8b0a0, { y: 54, parent: hall, seg: 8 });
		k.cyl(1, 3.5, 6, 0x6a8a7a, { y: 61, parent: hall, seg: 8 });
		k.box(1.2, 3.5, 1.2, 0x5a6a5a, { y: 65.5, parent: hall });
		city(k, 70, [-110, 110, 170, 330], { h: 55, w: 12, colors: [0xa8a8b0, 0x8a8a98, 0xc8b8a0, 0x7a7a88], windows: 0xffe0b0, seed: 76, avoid: (x, z) => Math.abs(x) < 22 || Math.hypot(x, z - 230) < 30 });
		// Up the steps, then at the top.
		const sweats = { shirt: 0x8a8a92, legs: 0x8a8a92, skin: 0xe0b090, hair: 0x2a1a10, shoes: 0x111111 };
		const beanie = (p) => k.sphere(0.23, 0x1a1a1e, { y: 1.82, parent: p, s: [1, 0.8, 1] });
		const runner = k.person({ x: -0.6, y: 4.5, z: 0.2, ry: PI, pose: "run", colors: sweats, from: 4, until: 4 });
		beanie(runner);
		k.tick((t) => {
			const l = runner.userData.limbs;
			l.legL.rotation.x = Math.sin(t * 9) * 0.8;
			l.legR.rotation.x = -Math.sin(t * 9) * 0.8;
			l.armL.rotation.x = -Math.sin(t * 9) * 0.9;
			l.armR.rotation.x = Math.sin(t * 9) * 0.9;
		});
		const champ = k.person({ x: 0, y: 8, z: -7.6, colors: sweats, from: 5 });
		backHair(k, champ, 0x1a1a1e);
		champ.userData.limbs.armL.rotation.z = -2.65;
		champ.userData.limbs.armR.rotation.z = 2.65;
		beanie(champ);
		// Raw eggs in a glass.
		const kitchen = k.group({ x: 300 });
		const check = k.canvas(128, 128, (g) => {
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
				g.fillStyle = (x + y) % 2 ? "#e8e0d0" : "#b8483a";
				g.fillRect(x * 16, y * 16, 16, 16);
			}
		});
		k.box(4, 0.1, 3, k.mat(0xffffff, { map: check }), { y: -0.05, parent: kitchen });
		k.box(4, 3, 0.2, 0x5a6a5a, { y: 1.4, z: -1.5, parent: kitchen });
		windowPane(k, 1.2, 1.0, 0x8aa0c8, { x: -0.8, y: 1.6, z: -1.38, parent: kitchen, glow: 0.5 });
		// Two little turtles in a bowl, with a plastic palm tree.
		k.cyl(0.62, 0.5, 0.42, 0xd8eef4, { y: 0.21, parent: kitchen, opacity: 0.3, rough: 0.05, seg: 20 });
		k.cyl(0.58, 0.5, 0.2, 0x6ab0c8, { y: 0.11, parent: kitchen, opacity: 0.55, rough: 0.1, seg: 20 });
		const gravel = rng(152);
		for (let i = 0; i < 40; i++) k.ico(0.035, [0xd8b878, 0x9a7a58, 0xc8c0b0][i % 3], { x: (gravel() - 0.5) * 0.8, y: 0.03, z: (gravel() - 0.5) * 0.8, parent: kitchen });
		k.cone(0.22, 0.18, 0xc8a870, { x: 0.15, y: 0.11, z: -0.1, parent: kitchen, seg: 8 });
		k.cyl(0.02, 0.025, 0.45, 0x8a6a3a, { x: 0.15, y: 0.4, z: -0.1, rz: 0.15, parent: kitchen });
		for (let i = 0; i < 5; i++) k.box(0.28, 0.015, 0.07, 0x3aa84a, { x: 0.12 + Math.cos(i * 1.25) * 0.13, y: 0.6, z: -0.1 + Math.sin(i * 1.25) * 0.13, ry: -i * 1.25, rz: -0.35, parent: kitchen });
		[[-0.2, 0.15, 0.6], [0.2, 0.25, -0.9]].forEach(([x, z, ry]) => {
			const t = k.group({ x, y: 0.24, z, ry, parent: kitchen });
			k.sphere(0.1, 0x4a5a2a, { s: [1, 0.45, 1.25], parent: t, rough: 0.6 });
			k.sphere(0.04, 0x6a8a3a, { z: 0.15, y: 0.01, parent: t });
			[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.sphere(0.025, 0x6a8a3a, { x: sx * 0.08, y: -0.02, z: sz * 0.08, parent: t })));
			k.box(0.015, 0.012, 0.03, 0xc83a2a, { x: 0.035, y: 0.02, z: 0.15, parent: t });
		});
		k.box(0.9, 0.25, 0.45, 0xb8a888, { x: -0.8, y: 0.125, z: -0.3, parent: kitchen });
		k.point(0xffe0b0, 4, 6, { x: 300.6, y: 1.6, z: 1 });
		k.point(0x9ab0e0, 2, 5, { x: 299.2, y: 1.4, z: -0.8 });
		// The meat locker.
		const locker = k.group({ x: -300 });
		k.box(14, 0.2, 12, 0x8a8a88, { y: -0.1, parent: locker });
		k.box(14, 6, 0.2, 0xd8dcd8, { y: 3, z: -5, parent: locker });
		k.box(0.2, 6, 12, 0xd8dcd8, { x: -6, y: 3, parent: locker });
		k.box(14, 0.2, 12, 0xc8ccc8, { y: 5, parent: locker });
		[-2.5, 0, 2.5].forEach((z) => k.box(12, 0.12, 0.12, 0x8a8a90, { y: 4.4, z, parent: locker, metal: 0.8 }));
		for (let i = 0; i < 13; i++) {
			const x = -5 + (i % 5) * 2.2;
			const z = [-2.5, 0, 2.5][i % 3];
			if (Math.abs(x - 0.6) < 1 && z === 0) continue;
			carcass(x, z, i);
		}
		carcass(-0.5, 0.6, 3);
		function carcass(x, z, i) {
			const side = k.group({ x, y: 4.3, z, ry: i * 0.7 + 1.2, parent: locker });
			k.torus(0.12, 0.02, 0x9a9aa0, { y: 0, parent: side, metal: 0.8, seg: 10 });
			k.cyl(0.02, 0.02, 0.5, 0x9a9aa0, { y: -0.3, parent: side });
			k.ico(0.6, 0xc87a68, { y: -1.7, s: [0.85, 1.9, 0.5], detail: 1, parent: side });
			k.ico(0.42, 0xeadcc4, { y: -0.95, x: 0.1, s: [1, 0.9, 0.62], detail: 1, parent: side });
			k.ico(0.38, 0x9a4034, { y: -2.3, x: -0.12, s: [0.9, 1.6, 0.58], detail: 1, parent: side });
			k.cyl(0.08, 0.1, 0.5, 0xeadcc4, { y: -0.45, parent: side });
		}
		const boxer = k.person({ x: -299.3, y: 0, z: 1.6, ry: PI + 0.3, colors: sweats });
		beanie(boxer);
		boxer.userData.limbs.armL.rotation.set(-1.3, 0, 0.2);
		boxer.userData.limbs.armR.rotation.set(-1.6, 0, -0.1);
		for (let i = 0; i < 3; i++) {
			k.box(0.15, 0.06, 2, 0xe8f0ff, { x: -2 + i * 3, y: 4.88, parent: locker, emissive: 0xc0d8ff, glow: 1 });
			k.point(0xd0e0ff, 5, 10, { x: -302 + i * 3, y: 4.5, z: 0 });
		}
		k.point(0xffe0c0, 3, 8, { x: -296, y: 2, z: 4 });
		// Jogging under the elevated train at dawn.
		const street = k.group({ x: 300, z: 300 });
		k.box(40, 0.1, 60, 0x5a5a5e, { y: -0.05, parent: street });
		const row = bricks(k, "#5a3026", ["#8a4a36", "#7a4030", "#9a5a40"], [4, 2]);
		for (let i = 0; i < 8; i++) [-1, 1].forEach((s) => {
			const h = 7 + (i % 3);
			k.box(5.8, h, 6, k.mat(0xffffff, { map: row }), { x: s * 10, y: h / 2, z: -24 + i * 6, parent: street });
			windowPane(k, 1, 1.4, 0xffd8a0, { x: s * 6.95, y: 4.5, z: -24 + i * 6, ry: -s * PI / 2, parent: street, glow: i % 2 ? 0.7 : 0.1 });
			k.box(1.2, 0.3, 1.6, 0xb8b0a0, { x: s * 6.5, y: 0.15, z: -24 + i * 6 + 1.5, parent: street });
		});
		for (let i = 0; i < 9; i++) [-2.4, 2.4].forEach((x) => k.box(0.4, 7, 0.4, 0x2a4a3a, { x, y: 3.5, z: -24 + i * 6, parent: street }));
		k.box(6, 0.8, 60, 0x2a4a3a, { y: 7.4, parent: street });
		k.box(5, 0.5, 60, 0x3a3a3a, { y: 8, parent: street });
		const jog = k.person({ x: 300.5, y: 0, z: 304, ry: PI + 0.15, pose: "run", colors: sweats });
		beanie(jog);
		k.point(0xffd0a0, 6, 30, { x: 302, y: 5, z: 312 });
		// The ring under the lights.
		const ring = k.group({ x: -300, z: 300 });
		k.box(60, 0.1, 60, 0x1a1418, { y: -0.05, parent: ring });
		k.box(8, 1.2, 8, 0x2a2a3a, { y: 0.6, parent: ring });
		k.box(7.6, 0.06, 7.6, 0x3a6ab0, { y: 1.23, parent: ring });
		[[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => k.cyl(0.12, 0.12, 1.6, 0xd8d8d8, { x: sx * 3.7, y: 2.0, z: sz * 3.7, parent: ring }));
		[0.55, 0.95, 1.35].forEach((y, i) => {
			const c = [0xd02020, 0xf0f0f0, 0x2040c0][i];
			[-1, 1].forEach((s) => {
				k.box(7.4, 0.06, 0.06, c, { y: 1.25 + y, z: s * 3.7, parent: ring });
				k.box(0.06, 0.06, 7.4, c, { x: s * 3.7, y: 1.25 + y, parent: ring });
			});
		});
		const rr = rng(52);
		for (let i = 0; i < 80; i++) {
			const a = (i / 80) * PI * 2;
			const d = 7 + (i % 3) * 1.5;
			k.box(0.6, 1 + (i % 3) * 0.6, 0.5, 0x2a2228, { x: Math.cos(a) * d, y: 0.5 + (i % 3) * 0.3, z: Math.sin(a) * d, parent: ring });
			k.sphere(0.2, [0xd8a888, 0x8a5a3a, 0xc89070][i % 3], { x: Math.cos(a) * d, y: 1.25 + (i % 3) * 0.6 + rr() * 0.1, z: Math.sin(a) * d, parent: ring });
		}
		const apollo = k.person({ x: -298.8, y: 1.26, z: 300.2, ry: -PI / 2 - 0.2, colors: { shirt: 0x5a3a28, legs: 0x5a3a28, skin: 0x5a3a28, hair: 0x1a1a1a, shoes: 0xf0f0f0 }, sleeves: 0x5a3a28 });
		const stars = k.canvas(64, 32, (g) => {
			for (let i = 0; i < 4; i++) {
				g.fillStyle = i % 2 ? "#f0f0f0" : "#c02020";
				g.fillRect(0, i * 8, 64, 8);
			}
			g.fillStyle = "#2a3a8a";
			g.fillRect(0, 0, 30, 16);
			g.fillStyle = "#fff";
			for (let i = 0; i < 6; i++) g.fillRect(4 + (i % 3) * 9, 3 + Math.floor(i / 3) * 7, 3, 3);
		});
		k.box(0.54, 0.35, 0.32, k.mat(0xffffff, { map: stars }), { y: 0.8, parent: apollo });
		apollo.userData.limbs.armL.rotation.set(-1.4, 0, 0.3);
		apollo.userData.limbs.armR.rotation.set(-0.8, 0, -0.2);
		const rocky = k.person({ x: -301.2, y: 1.26, z: 299.8, ry: PI / 2 - 0.2, colors: { shirt: 0xe0b090, legs: 0xe0b090, skin: 0xe0b090, hair: 0x2a1a10 }, sleeves: 0xe0b090 });
		k.box(0.54, 0.35, 0.32, 0x5a1a20, { y: 0.8, parent: rocky });
		k.box(0.55, 0.06, 0.33, 0xf0f0f0, { y: 0.95, parent: rocky });
		rocky.userData.limbs.armL.rotation.set(-1.0, 0, 0.3);
		rocky.userData.limbs.armR.rotation.set(-1.5, 0, -0.1);
		[apollo, rocky].forEach((b, i) => ["armL", "armR"].forEach((a) => k.sphere(0.13, i ? 0x8a1a1a : 0xc02020, { y: -0.72, parent: b.userData.limbs[a] })));
		k.spot(0xffffff, 80, { x: -300, y: 12, z: 300, target: [-300, 1, 300], angle: 0.5, distance: 30, cast: true });
		k.point(0xfff0e0, 4, 20, { x: -296, y: 5, z: 305 });
		// A street corner at night: a few men warming their hands at a burning oil drum.
		const corner = k.group({ x: -300, z: -300 });
		k.box(40, 0.1, 40, 0x2a2a2e, { y: 0.01, parent: corner, rough: 0.5 });
		k.box(40, 0.2, 3, 0x5a5a5c, { y: 0.1, z: -3.5, parent: corner });
		const wall = bricks(k, "#3a221c", ["#6a3a2c", "#5a3226", "#7a4836"], [4, 2]);
		k.box(30, 10, 0.4, k.mat(0xffffff, { map: wall }), { y: 5, z: -5.2, parent: corner });
		k.box(2.2, 2.8, 0.1, 0x1a1412, { x: -3.5, y: 1.4, z: -4.98, parent: corner });
		windowPane(k, 2.6, 1.6, 0x6a5a40, { x: 2.8, y: 1.8, z: -4.95, parent: corner, glow: 0.25, frame: 0x2a2018 });
		windowPane(k, 1, 1.4, 0x3a3020, { x: -1, y: 6, z: -4.95, parent: corner, glow: 0.1, frame: 0x2a2018 });
		windowPane(k, 1, 1.4, 0xffc070, { x: 2.5, y: 6, z: -4.95, parent: corner, glow: 0.5, frame: 0x2a2018 });
		k.cyl(0.42, 0.42, 1.1, 0x3a2a22, { y: 0.55, z: -2.6, parent: corner, metal: 0.4, rough: 0.8, seg: 14 });
		[0.25, 0.85].forEach((y) => k.torus(0.43, 0.03, 0x2a1a14, { y, z: -2.6, rx: PI / 2, parent: corner, seg: 16 }));
		k.glow(0xff8a30, 1.6, { x: -300, y: 1.4, z: -302.6 });
		k.glow(0xffd070, 0.8, { x: -300, y: 1.25, z: -302.6 });
		k.particles(60, 0xffa040, { x: -300, y: 1.8, z: -302.6, box: [0.6, 1.4, 0.6], speed: 0.8, size: 0.05, drift: 0.2 });
		const fire = k.point(0xff8a30, 10, 9, { x: -300, y: 1.6, z: -302.6 });
		k.tick((t) => (fire.intensity = 9 + Math.sin(t * 13) * 1.5 + Math.sin(t * 7.3)));
		[[-1.1, -2.3, 1.6, 0x3a3228, 0x2a2a2a], [1.05, -2.0, -1.7, 0x4a3a2a, 0x3a2a20], [0.15, -1.4, PI - 0.1, 0x2a2a34, 0x1a1a1a]].forEach(([x, z, ry, coat, hat]) => {
			const m = k.person({ x: x - 300, y: 0, z: z - 300, ry, coat, hat, colors: { shirt: coat, legs: 0x2a2a30, skin: 0xd8a888, hair: 0x2a1a10 } });
			m.userData.limbs.armL.rotation.set(-0.9, 0, 0.3);
			m.userData.limbs.armR.rotation.set(-0.9, 0, -0.3);
		});
		k.cyl(0.07, 0.09, 5, 0x1a1a1a, { x: -6, y: 2.5, z: -3.2, parent: corner });
		k.glow(0xffe0b0, 1.2, { x: -306, y: 5, z: -303.2 });
		k.point(0xffe0b0, 3, 10, { x: -306, y: 4.8, z: -302.8 });
		return {
			shots: [
				{ pos: [-296.2, 1.9, -296.2], look: [-300.4, 1.7, -303], fov: 45, fog: [0x0a0808, 6, 30], exposure: 0.8 },
				{ pos: [301.4, 1.5, 309], look: [300.2, 1.8, 298], fov: 50, fog: [0xe0b090, 15, 90] },
				{ pos: [-293, 4.2, 306], look: [-300, 2.2, 300], fov: 45, fog: [0x0a0808, 10, 40], exposure: 1.3 },
				{ pos: [-296, 2.0, 4.6], look: [-300, 1.8, -0.5], fov: 50, fog: [0x8a9aa8, 6, 40] },
				{ pos: [4, 1.6, 24], look: [0, 6, -8], fov: 50 },
				{ pos: [-3, 10.6, -13.5], look: [1, 7.5, 10], fov: 50 },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the night shift
	r53: (k) => {
		k.fog(0x1a1028, 25, 140);
		k.sky(0x0a0814, 0x2a1838);
		k.light({ sky: 0x9a88c8, ground: 0x2a2030, hemi: 1.5, sunColor: 0xc0a8ff, sunIntensity: 0.8, sunPos: [-20, 40, 30], shadowSize: 40 });
		// A wet avenue, running along x.
		k.box(200, 0.1, 12, 0x15151c, { y: -0.05, rough: 0.15, metal: 0.6 });
		[-1, 1].forEach((s) => k.box(200, 0.25, 3.5, 0x3a3640, { y: 0.125, z: s * 7.75 }));
		for (let i = 0; i < 25; i++) k.box(2, 0.02, 0.15, 0xc8a020, { x: -60 + i * 5, y: 0.01, z: -1.5 });
		const brick = k.mat(0xffffff, { map: bricks(k, "#2a1c1c", ["#5a3a34", "#4a302c", "#6a4438"], [2, 3]) });
		const lit = k.mat(0xffd890, { emissive: 0xffc060, glow: 0.7 });
		const dark = k.mat(0x1a1a24, { rough: 0.2 });
		for (let i = 0; i < 14; i++) [-1, 1].forEach((s) => {
			const h = 10 + ((i * 7) % 3) * 4 + (s > 0 ? 2 : 0);
			const x = -56 + i * 8;
			k.box(8, h, 6, brick, { x, y: h / 2, z: s * 12.5 });
			for (let y = 4.5; y < h - 1; y += 2.6) for (let c = 0; c < 3; c++) k.box(1, 1.3, 0.1, (i * 3 + c + y) % 4 < 1.3 ? lit : dark, { x: x - 2.5 + c * 2.5, y, z: s * 9.47, shadow: false });
			k.box(7, 2.6, 0.1, [0xff4a8a, 0x3ad0ff, 0xffb040, 0x7a3aff][(i + (s > 0 ? 2 : 0)) % 4], { x, y: 1.55, z: s * 9.47, emissive: [0xa01a50, 0x1a7090, 0x905010, 0x3a1a90][(i + (s > 0 ? 2 : 0)) % 4], glow: 0.8, shadow: false });
		});
		// Neon shapes, no words.
		const neon = (draw, color) => new k.THREE.MeshBasicMaterial({
			map: k.canvas(256, 256, (g) => {
				g.lineCap = g.lineJoin = "round";
				g.shadowColor = color;
				g.shadowBlur = 20;
				g.strokeStyle = color;
				g.lineWidth = 12;
				draw(g);
				g.strokeStyle = "#fff";
				g.lineWidth = 4;
				g.shadowBlur = 0;
				draw(g);
			}),
			transparent: true,
			blending: k.THREE.AdditiveBlending,
			depthWrite: false,
		});
		const shapes = [
			[(g) => { g.beginPath(); g.moveTo(30, 128); g.lineTo(190, 128); g.moveTo(140, 70); g.lineTo(200, 128); g.lineTo(140, 186); g.stroke(); }, "#ff3a8a"],
			[(g) => { g.beginPath(); for (let i = 0; i < 11; i++) { const r = i % 2 ? 40 : 100; g.lineTo(128 + Math.sin((i * PI) / 5) * r, 128 - Math.cos((i * PI) / 5) * r); } g.stroke(); }, "#40e0ff"],
			[(g) => { g.beginPath(); g.moveTo(50, 50); g.lineTo(206, 50); g.lineTo(128, 140); g.closePath(); g.moveTo(128, 140); g.lineTo(128, 210); g.moveTo(80, 214); g.lineTo(176, 214); g.stroke(); }, "#ff4040"],
			[(g) => { g.beginPath(); g.arc(128, 128, 90, 0, PI * 2); g.moveTo(60, 128); g.lineTo(196, 128); g.stroke(); }, "#a060ff"],
			[(g) => { g.strokeRect(40, 70, 176, 116); g.beginPath(); g.moveTo(40, 128); g.lineTo(216, 128); g.stroke(); }, "#40ff90"],
		].map(([d, c]) => [neon(d, c), c]);
		for (let i = 0; i < 12; i++) {
			const s = i % 2 ? 1 : -1;
			const [m, c] = shapes[i % 5];
			const x = -42 + i * 7.5;
			k.plane(3, 3, m, { x, y: 4.6, z: s * 9.3, ry: s > 0 ? PI : 0, shadow: false });
			k.point(new k.THREE.Color(c).getHex(), 8, 16, { x, y: 4, z: s * 7 });
		}
		// A marquee of bulbs.
		k.box(10, 1.2, 1.2, 0x1a1a1a, { x: 12, y: 3.6, z: -9 });
		for (let i = 0; i < 22; i++) k.glow(0xffe8a0, 0.45, { x: 7.2 + i * 0.45, y: 4.25, z: -8.35 });
		for (let i = 0; i < 22; i++) k.glow(0xffe8a0, 0.45, { x: 7.2 + i * 0.45, y: 2.95, z: -8.35 });
		k.point(0xffd890, 8, 14, { x: 12, y: 3, z: -6.5 });
		[-30, 0, 30].forEach((x) => {
			k.cyl(0.1, 0.12, 6, 0x2a2a2a, { x, y: 3, z: 6.4 });
			k.box(1.6, 0.12, 0.12, 0x2a2a2a, { x: x, y: 6, z: 5.7, ry: PI / 2 });
			k.glow(0xffa040, 2, { x, y: 5.9, z: 5.0 });
			k.point(0xffa040, 8, 18, { x, y: 5.6, z: 5 });
		});
		// Steam out of the manhole.
		k.cyl(0.6, 0.6, 0.04, 0x2a2a2a, { x: 3, y: 0.01, z: -1.5, metal: 0.6, seg: 18 });
		k.point(0xff5050, 3, 8, { x: 4, y: 0.6, z: -2.5 });
		const steam = [];
		for (let i = 0; i < 34; i++) steam.push(k.glow(0xb0a4b4, 1, { x: 3, y: 0, z: -1.5, opacity: 0.5, fog: true }));
		k.tick((t) => steam.forEach((p, i) => {
			const f = (t * 0.18 + i / 30) % 1;
			p.position.set(3 + Math.sin(i * 2.3 + t * 0.5) * f * 1.2 + f * 1.5, f * 6, -1.5 + Math.cos(i * 1.7) * f * 1.2);
			p.scale.setScalar(0.8 + f * 4);
			p.material.opacity = 0.6 * Math.min(1, f * 6) * (1 - f);
		}));
		// The checker cab.
		const cab = k.group({ x: 0, z: 3, ry: PI / 2, from: 2 });
		const Y = 0xf2c21a;
		const paint = { metal: 0.3, rough: 0.35 };
		k.box(1.95, 0.75, 5.2, Y, { y: 0.7, parent: cab, ...paint });
		k.box(1.8, 0.72, 2.7, Y, { y: 1.42, z: -0.3, parent: cab, ...paint });
		k.box(1.82, 0.46, 2.3, 0x1a2028, { y: 1.45, z: -0.3, parent: cab, rough: 0.15 });
		[-1, 1].forEach((s) => k.box(1.6, 0.48, 0.05, 0x1a2028, { y: 1.45, z: -0.3 + s * 1.36, parent: cab, rough: 0.1 }));
		k.box(0.06, 0.48, 0.08, Y, { x: 0.92, y: 1.45, z: -0.25, parent: cab });
		k.box(0.06, 0.48, 0.08, Y, { x: -0.92, y: 1.45, z: -0.25, parent: cab });
		const chk = k.canvas(128, 16, (g) => {
			for (let y = 0; y < 2; y++) for (let x = 0; x < 16; x++) {
				g.fillStyle = (x + y) % 2 ? "#111" : "#f2f2f2";
				g.fillRect(x * 8, y * 8, 8, 8);
			}
		});
		k.box(1.97, 0.16, 3.6, k.mat(0xffffff, { map: chk }), { y: 0.95, z: -0.2, parent: cab });
		k.box(0.6, 0.2, 0.3, 0xfff4c0, { y: 1.88, z: -0.2, parent: cab, emissive: 0xffe080, glow: 0.8 });
		[-1, 1].forEach((s) => {
			k.box(2.0, 0.15, 0.15, 0xd8d8e0, { y: 0.4, z: s * 2.62, parent: cab, metal: 1, rough: 0.2 });
			[-0.55, -0.8].forEach((x) => [x, -x].forEach((xx) => s > 0 && k.sphere(0.09, 0xfff8e0, { x: xx, y: 0.78, z: 2.6, parent: cab, emissive: 0xfff0c0, glow: 1 })));
			[-1, 1].forEach((z) => k.cyl(0.36, 0.36, 0.25, 0x111111, { x: s * 0.92, y: 0.36, z: z * 1.6, rz: PI / 2, parent: cab }));
		});
		k.box(0.7, 0.3, 0.05, 0x8a8a90, { y: 0.7, z: 2.61, parent: cab, metal: 0.9 });
		[-0.7, 0.7].forEach((x) => k.glow(0xfff0c0, 1, { x, y: 0.78, z: 2.75, parent: cab }));
		[-0.7, 0.7].forEach((x) => k.glow(0xff2020, 0.6, { x, y: 0.8, z: -2.65, parent: cab }));
		// Him, with the mohawk, by the cab.
		const travis = (o) => k.person({ colors: { shirt: 0x5a5e3e, legs: 0x3a4258, skin: 0xd8b090, hair: 0x2a1a10 }, ...o });
		const mohawk = travis({ x: 1.6, y: 0, z: 4.75, ry: 0.45, hair: false, shades: true, from: 4, until: 4 });
		k.box(0.08, 0.14, 0.44, 0x2a1a10, { y: 0.2, parent: mohawk.userData.limbs.head });
		face(k, mohawk, { eye: 0x050505 });
		k.point(0xff80b0, 6, 6, { x: 3.4, y: 2.2, z: 6.6, from: 4, until: 4 });
		k.point(0xfff0d0, 6, 5, { x: 2.4, y: 2.0, z: 6.6, from: 4, until: 4 });
		// The rear-view mirror, from the back seat.
		const inside = k.group({ x: -300 });
		k.box(2.2, 0.6, 0.8, 0x1a1614, { y: 0.9, z: 1.4, parent: inside });
		k.box(2.2, 0.08, 1.6, 0x1a1614, { y: 2.0, z: 0.3, parent: inside });
		[-1.05, 1.05].forEach((x) => k.box(0.1, 0.9, 0.1, 0x1a1614, { x, y: 1.6, z: 1.75, rx: -0.4, parent: inside }));
		k.box(0.7, 0.2, 0.05, 0x111111, { y: 1.58, z: 1.15, parent: inside });
		const eyes = k.canvas(512, 140, (g, w, h) => {
			const grad = g.createLinearGradient(0, 0, 0, h);
			grad.addColorStop(0, "#5a3a2a");
			grad.addColorStop(0.5, "#b88a68");
			grad.addColorStop(1, "#8a6248");
			g.fillStyle = grad;
			g.fillRect(0, 0, w, h);
			[170, 342].forEach((x, i) => {
				g.fillStyle = "#2a1810";
				g.beginPath();
				g.ellipse(x, 40, 62, 11, i ? 0.12 : -0.12, 0, PI * 2);
				g.fill();
				g.fillStyle = "#e8e0d8";
				g.beginPath();
				g.ellipse(x, 78, 40, 15, 0, 0, PI * 2);
				g.fill();
				g.fillStyle = "#4a2a14";
				g.beginPath();
				g.arc(x - 6, 78, 14, 0, PI * 2);
				g.fill();
				g.fillStyle = "#050302";
				g.beginPath();
				g.arc(x - 6, 78, 6, 0, PI * 2);
				g.fill();
				g.fillStyle = "#fff";
				g.fillRect(x - 2, 72, 4, 4);
				g.strokeStyle = "#3a2216";
				g.lineWidth = 6;
				g.beginPath();
				g.ellipse(x, 76, 42, 17, 0, PI * 1.05, PI * 1.95);
				g.stroke();
			});
		});
		k.plane(0.62, 0.15, new k.THREE.MeshBasicMaterial({ map: eyes, color: 0xd8c8c8 }), { y: 1.58, z: 1.12, ry: PI, parent: inside });
		k.sphere(0.21, 0x2a1a10, { x: 0.5, y: 1.4, z: 0.4, parent: inside });
		k.box(0.6, 0.5, 0.4, 0x5a5e3e, { x: 0.5, y: 0.95, z: 0.45, parent: inside });
		for (let i = 0; i < 24; i++) k.glow([0xff3a8a, 0x40e0ff, 0xffb040, 0xff4040, 0xfff0c0][i % 5], 1.5 + (i % 3), { x: -300 + Math.sin(i * 2.1) * 10, y: 1 + (i % 4) * 1.5, z: 12 + i * 2, opacity: 0.8 });
		k.point(0xff4a8a, 2, 4, { x: -300.6, y: 1.8, z: 0.4 });
		k.point(0x40c0ff, 1.5, 4, { x: -299.4, y: 1.8, z: 0.6 });
		// A diner counter: a tablet fizzing in a glass of water.
		const diner = k.group({ x: -600 });
		k.box(8, 0.1, 6, 0x3a2a2a, { y: -0.05, parent: diner });
		k.box(6, 1.0, 1.4, 0xb83a3a, { y: 0.5, parent: diner });
		k.box(6.1, 0.06, 1.5, 0x9ab8b0, { y: 1.03, parent: diner, rough: 0.5 });
		k.box(6.1, 0.05, 0.05, 0xc8c8d0, { y: 1.03, z: 0.76, parent: diner, metal: 0.9, rough: 0.2 });
		k.box(8, 4, 0.2, 0x8a7a5a, { y: 2, z: -1.6, parent: diner });
		k.box(8, 0.3, 0.25, 0xc8c8d0, { y: 1.5, z: -1.45, parent: diner, metal: 0.8, rough: 0.3 });
		const glassM = { opacity: 0.28, rough: 0.05 };
		k.cyl(0.11, 0.09, 0.32, 0xe0f0f8, { x: 0, y: 1.22, z: 0.1, parent: diner, seg: 18, ...glassM });
		k.cyl(0.1, 0.085, 0.24, 0xc8e0e8, { x: 0, y: 1.18, z: 0.1, parent: diner, seg: 18, opacity: 0.45, rough: 0.05 });
		k.cyl(0.08, 0.08, 0.02, 0xf0f0e8, { x: 0, y: 1.29, z: 0.1, parent: diner, seg: 16, opacity: 0.85 });
		const fizz = [];
		const rf = rng(530);
		for (let i = 0; i < 40; i++) fizz.push([k.sphere(0.008 + rf() * 0.008, 0xffffff, { x: -600, y: 1.08, z: 0.1, parent: undefined, seg: 6, rings: 4, opacity: 0.9, shadow: false }), rf(), rf(), rf()]);
		k.tick((t) => fizz.forEach(([b, a, r, ph]) => {
			const f = (t * 0.5 + ph) % 1;
			b.position.set(-600 + Math.cos(a * 6.28) * r * 0.07, 1.08 + f * 0.21, 0.1 + Math.sin(a * 6.28) * r * 0.07);
		}));
		k.cyl(0.13, 0.1, 0.04, 0xf4f0e8, { x: 0.55, y: 1.08, z: 0.15, parent: diner, seg: 16 });
		k.cyl(0.08, 0.06, 0.14, 0xf4f0e8, { x: 0.55, y: 1.17, z: 0.15, parent: diner, seg: 14 });
		k.cyl(0.07, 0.07, 0.01, 0x3a1a0a, { x: 0.55, y: 1.24, z: 0.15, parent: diner, seg: 14 });
		k.box(0.18, 0.2, 0.1, 0xc8c8d0, { x: -0.55, y: 1.16, z: -0.3, parent: diner, metal: 0.9, rough: 0.2 });
		k.box(0.16, 0.16, 0.11, 0xffffff, { x: -0.55, y: 1.18, z: -0.3, parent: diner });
		k.cyl(0.035, 0.035, 0.12, 0xe8e8e8, { x: -0.3, y: 1.12, z: -0.35, parent: diner, opacity: 0.6 });
		k.cyl(0.036, 0.036, 0.04, 0xc8c8d0, { x: -0.3, y: 1.2, z: -0.35, parent: diner, metal: 0.9 });
		k.point(0xffe0b0, 2.2, 6, { x: -599.4, y: 2.4, z: 1.2 });
		k.point(0xff6080, 2, 5, { x: -601.5, y: 1.6, z: 1.5 });
		// The mirror at home: the gun pointed straight at us.
		const room = k.group({ x: 300 });
		k.box(8, 0.1, 8, 0x4a3a2a, { y: -0.05, parent: room });
		k.box(8, 4, 0.2, 0x7a7a52, { y: 2, z: -2.5, parent: room });
		k.box(0.2, 4, 8, 0x6a6a48, { x: -3, y: 2, parent: room });
		const blinds = k.group({ x: 1.6, y: 2.3, z: -2.38, parent: room });
		for (let i = 0; i < 9; i++) k.box(1.4, 0.08, 0.04, 0xff7a7a, { y: -0.6 + i * 0.15, parent: blinds, emissive: 0xc02040, glow: 0.8 });
		k.box(1.6, 0.5, 2.4, 0xc8c0a8, { x: -1.8, y: 0.25, z: -1, parent: room });
		k.cyl(0.01, 0.01, 0.6, 0x111111, { x: -0.6, y: 3.7, z: -1, parent: room });
		k.glow(0xfff0c0, 0.8, { x: -300.6, y: 3.35, z: -1 });
		k.point(0xffe8c0, 5, 10, { x: 299.4, y: 3.2, z: -0.5 });
		k.point(0xff4070, 4, 8, { x: 301.6, y: 2.2, z: -1.5 });
		k.point(0xfff0e0, 3, 6, { x: 300.4, y: 2, z: 2 });
		const mirror = travis({ x: 300, y: 0, z: 0, ry: 0.05, pose: "point", hair: false });
		hairTop(k, mirror, 0x2a1a10);
		face(k, mirror, { frown: 0.3 });
		const arm = mirror.userData.limbs.armR;
		k.box(0.06, 0.3, 0.09, 0x151515, { y: -0.86, parent: arm, metal: 0.7, rough: 0.3 });
		k.box(0.06, 0.1, 0.16, 0x151515, { y: -0.74, z: -0.09, parent: arm, metal: 0.7, rough: 0.3 });
		return {
			shots: [
				{ pos: [-599.55, 1.78, 1.05], look: [-600.05, 1.12, 0], fov: 40, fog: [0x1a1014, 3, 20] },
				{ pos: [6.4, 0.7, -4.6], look: [3, 1.6, -1.2], fov: 42 },
				{ pos: [0.7, 1.25, 5.6], look: [-0.3, 1.1, 3.9], fov: 35 },
				{ pos: [-300.25, 1.4, -0.6], look: [-300, 1.56, 1.1], fov: 28, fog: [0x05040a, 2, 60] },
				{ pos: [3.9, 1.75, 8.4], look: [1.3, 1.45, 4.4], fov: 45, exposure: 1.3 },
				{ pos: [300.55, 1.72, 2.3], look: [300.05, 1.55, 0], fov: 40, fog: [0x1a1410, 3, 25] },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the house on the hill
	r54: (k) => {
		k.fog(0x3a4660, 8, 70);
		k.sky(0x101828, 0x3a4660);
		k.light({ sky: 0xb0c0e8, ground: 0x2a2a30, hemi: 1.5, sunColor: 0xb0c4ff, sunIntensity: 0.8, sunPos: [-10, 30, 20], shadowSize: 30 });
		// A foggy street and a narrow brick house.
		k.box(60, 0.1, 30, 0x24242a, { y: -0.05, z: 6, rough: 0.35, metal: 0.3 });
		k.box(60, 0.2, 3, 0x4a4a50, { y: 0.1, z: -2.5 });
		const brick = k.mat(0xffffff, { map: bricks(k, "#2a1a16", ["#5a3a30", "#4a3028", "#6a4236"], [3, 4]) });
		k.box(8, 11, 10, brick, { y: 5.5, z: -9 });
		k.box(8.4, 0.4, 10.4, 0x2a2a2a, { y: 11.2, z: -9 });
		[[-9, 0x7a7a80, 10], [9, 0x8a7a68, 9.5]].forEach(([x, c, h]) => k.box(9.6, h, 10, c, { x, y: h / 2, z: -9 }));
		[[-2, 2.5], [2, 2.5], [-2, 5.6], [-2, 8.6]].forEach(([x, y]) => windowPane(k, 1.3, 1.8, 0x3a3a48, { x, y, z: -3.95, glow: 0.2, frame: 0x2a2a2a }));
		windowPane(k, 1.3, 1.8, 0xfff0c8, { x: 2, y: 8.6, z: -3.95, glow: 1.6, frame: 0x2a2a2a });
		windowPane(k, 1.3, 1.8, 0xffe0a0, { x: 2, y: 5.6, z: -3.95, glow: 0.4, frame: 0x2a2a2a });
		k.box(1.2, 2.2, 0.12, 0x1a1414, { x: 0, y: 1.3, z: -3.95 });
		for (let i = 0; i < 16; i++) k.box(0.05, 1.1, 0.05, 0x111111, { x: -4 + i * 0.5, y: 0.75, z: -2.8 });
		k.box(8, 0.06, 0.06, 0x111111, { y: 1.25, z: -2.8 });
		// The beam from the upstairs window.
		const beamFrom = V3(k, [2, 8.6, -3.9]);
		const beamTo = V3(k, [3.2, 0, 3.0]);
		const beam = k.mesh(new k.THREE.CylinderGeometry(0.6, 2.4, beamFrom.distanceTo(beamTo), 16, 1, true), new k.THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.13, blending: k.THREE.AdditiveBlending, depthWrite: false, side: k.THREE.DoubleSide }), { x: (beamFrom.x + beamTo.x) / 2, y: (beamFrom.y + beamTo.y) / 2, z: (beamFrom.z + beamTo.z) / 2, shadow: false });
		beam.quaternion.setFromUnitVectors(new k.THREE.Vector3(0, -1, 0), beamTo.clone().sub(beamFrom).normalize());
		k.glow(0xfff4d8, 6, { x: 2, y: 8.6, z: -3.5, opacity: 0.8 });
		k.spot(0xfff0d0, 30, { x: 2, y: 8.6, z: -3.6, target: [3.2, 0, 3], angle: 0.25, distance: 30 });
		// The lamp and the visitor with his hat and bag.
		k.cyl(0.08, 0.12, 4.6, 0x111111, { x: 3.9, y: 2.3, z: 1.2 });
		k.box(0.5, 0.6, 0.5, 0x1a1a1a, { x: 3.9, y: 4.8, z: 1.2 });
		k.glow(0xffe0a0, 3, { x: 3.9, y: 4.7, z: 1.2 });
		k.point(0xffe0a0, 8, 14, { x: 3.9, y: 4.4, z: 1.6 });
		const priest = k.person({ x: 3.0, y: 0, z: 3.2, ry: PI - 0.1, coat: 0x1a1a1e, hat: 0x141416, colors: { shirt: 0x1a1a1e, legs: 0x1a1a1e, skin: 0xd8b8a0, hair: 0xd8d8d8 }, from: 5 });
		k.box(0.5, 0.36, 0.14, 0x2a1a14, { x: 0.38, y: 0.62, z: 0, parent: priest });
		const mist = [];
		for (let i = 0; i < 14; i++) mist.push(k.glow(0x9aa8c8, 9, { x: -10 + i * 1.6, y: 0.8, z: -1 + (i % 4) * 2.5, opacity: 0.12, fog: true }));
		k.tick((t) => mist.forEach((m, i) => (m.position.x = -12 + ((i * 1.9 + t * 0.4) % 26))));
		// The bare trees.
		[[-5, 0.5], [7, 0.8]].forEach(([x, z]) => {
			k.cyl(0.15, 0.25, 6, 0x1a1614, { x, y: 3, z });
			for (let i = 0; i < 5; i++) seg(k, [x, 4 + i * 0.5, z], [x + Math.sin(i * 2.4) * 2, 6 + i * 0.6, z + Math.cos(i * 2.4) * 1.2], 0.08, 0x1a1614);
		});
		// The steep stone steps.
		const steps = k.group({ x: -200 });
		k.box(10, 0.1, 10, 0x2a2a2e, { y: -0.05, z: 3, parent: steps });
		for (let i = 0; i < 40; i++) k.box(3, 0.3 * (i + 1), 0.45, 0x6a6a68, { y: 0.15 * (i + 1), z: -0.225 - i * 0.45, parent: steps });
		[-1, 1].forEach((s) => k.box(1.4, 18, 22, s < 0 ? 0x5a5650 : k.mat(0xffffff, { map: bricks(k, "#2a1a16", ["#5a3a30", "#4a3028"], [4, 6]) }), { x: s * 2.2, y: 7, z: -8, parent: steps }));
		for (let i = 0; i < 3; i++) {
			k.glow(0xffe0a0, 1.6, { x: -201.3, y: 3.2 + i * 4.5, z: -3 - i * 6 });
			k.point(0xffd8a0, 6, 10, { x: -200.6, y: 3 + i * 4.5, z: -3 - i * 6 });
		}
		k.box(0.06, 1, 18, 0x111111, { x: 1.35, y: 6.6, z: -9, rx: Math.atan(0.3 / 0.45), parent: steps });
		// The desert dig and the demon statue.
		const dig = k.group({ x: 300 });
		k.ground(200, 0xc89a60, { parent: dig, bump: 1.2, seg: 30 });
		const sun = 0xffa040;
		k.glow(sun, 90, { x: 300, y: 10, z: -150 });
		k.disc(0xffe0a0, 20, { x: 300, y: 10, z: -155 });
		const r = rng(54);
		for (let i = 0; i < 14; i++) k.box(1 + r() * 4, 0.5 + r() * 2, 0.8, 0x9a7a50, { x: (r() - 0.5) * 30, y: 0.4, z: -6 - r() * 20, ry: r() * 3, parent: dig });
		const st = 0x7a6a52;
		const stone = { rough: 1, emissive: 0x2a1408, glow: 0.4 };
		k.box(2, 1.6, 2, 0x8a7a60, { y: 0.8, parent: dig, ...stone });
		const pz = k.group({ y: 1.6, parent: dig });
		[-0.28, 0.28].forEach((x) => {
			k.box(0.28, 1.5, 0.3, st, { x, y: 0.75, parent: pz, ...stone });
			for (let j = -1; j <= 1; j++) k.cone(0.06, 0.35, st, { x: x + j * 0.1, y: 0.06, z: 0.25, rx: PI / 2, parent: pz, seg: 4 });
		});
		k.box(0.95, 1.4, 0.55, st, { y: 2.2, parent: pz, ...stone });
		[-1, 1].forEach((s) => {
			k.box(0.1, 2.4, 0.9, 0x6a5a44, { x: s * 0.55, y: 3.3, z: -0.45, rz: -s * 0.45, parent: pz, ...stone });
			k.box(0.1, 1.9, 0.8, 0x6a5a44, { x: s * 0.4, y: 3.1, z: -0.55, rz: -s * 0.2, parent: pz, ...stone });
		});
		seg(k, [300.6, 4.2, 0], [300.85, 5.1, 0.15], 0.22, st, stone);
		k.box(0.32, 0.4, 0.08, st, { x: 0.9, y: 5.35, z: 0.2, parent: pz, ...stone });
		seg(k, [299.4, 4.2, 0], [299.3, 2.9, 0.15], 0.22, st, stone);
		const head = k.group({ y: 3.35, z: 0.05, parent: pz });
		k.box(0.62, 0.7, 0.55, st, { y: 0.35, parent: head, ...stone });
		k.box(0.68, 0.12, 0.2, 0x6a5a44, { y: 0.52, z: 0.25, parent: head, ...stone });
		[-0.15, 0.15].forEach((x) => {
			k.sphere(0.07, 0x2a1a0c, { x, y: 0.4, z: 0.25, s: [1.2, 0.7, 1], parent: head });
			k.cone(0.07, 0.4, 0x6a5a44, { x: x * 1.6, y: 0.85, z: -0.05, rz: -x * 2, parent: head, seg: 5 });
		});
		k.box(0.42, 0.14, 0.06, 0x1a1008, { y: 0.17, z: 0.28, parent: head });
		k.cone(0.2, 0.35, st, { y: -0.05, z: 0.18, rx: PI, parent: head, seg: 5, ...stone });
		k.person({ x: 300.8, y: 0, z: 9.5, ry: PI, s: 0.95, colors: { shirt: 0xc8b088, legs: 0x8a7a5a, skin: 0xd8b8a0, hair: 0xd8d8d8 } });
		k.point(0xffb070, 6, 12, { x: 301.5, y: 5.6, z: 2.5 });
		// The bedroom: in bed, then rising.
		const room = k.group({ x: -400 });
		k.box(9, 0.1, 9, 0x6a5a4a, { y: -0.05, parent: room });
		k.box(9, 5, 0.2, 0x8a9a8a, { y: 2.5, z: -3.2, parent: room });
		k.box(0.2, 5, 9, 0x7a8a7a, { x: -4, y: 2.5, parent: room });
		windowPane(k, 1.4, 2, 0x5a7ab0, { x: -2.6, y: 2.6, z: -3.05, parent: room, glow: 0.7 });
		k.box(2.4, 1.6, 0.15, 0xf0ece0, { y: 0.8, z: -2.7, parent: room });
		k.box(2.2, 0.5, 3.4, 0xd8d0c0, { y: 0.4, z: -0.9, parent: room });
		k.box(2.25, 0.12, 3.45, 0xf2f2f8, { y: 0.71, z: -0.9, parent: room });
		k.box(1.0, 0.18, 0.5, 0xffffff, { y: 0.85, z: -2.3, parent: room });
		const girl = (o) => {
			const p = k.person({ s: 0.8, rx: -PI / 2, dress: 0xe8b8cc, colors: { shirt: 0xe8b8cc, legs: 0xc8d0a8, skin: 0xc8d0a8, hair: 0x4a3018 }, sleeves: 0xe8b8cc, ...o });
			k.sphere(0.27, 0x4a3018, { y: 1.72, z: -0.05, parent: p, s: [1.15, 1, 1] });
			k.sphere(0.03, 0x5a1010, { x: -0.07, y: 1.78, z: 0.19, parent: p });
			k.sphere(0.03, 0x5a1010, { x: 0.07, y: 1.78, z: 0.19, parent: p });
			return p;
		};
		girl({ x: -400, y: 0.98, z: -0.75, until: 3 });
		k.box(1.9, 0.28, 1.8, 0xc8d0e8, { y: 0.92, z: -0.75, parent: room, until: 3 });
		const floating = girl({ x: -400, y: 2.1, z: 0.0, from: 4 });
		floating.userData.limbs.armL.rotation.x = PI / 2;
		floating.userData.limbs.armR.rotation.x = PI / 2;
		k.tick((t) => (floating.position.y = 2.1 + Math.sin(t) * 0.08));
		const cassock = (x, z, ry, hair) => {
			const p = k.person({ x, y: 0, z, ry, coat: 0x111114, colors: { shirt: 0x111114, legs: 0x111114, skin: 0xd8b8a0, hair } });
			k.box(0.14, 0.06, 0.05, 0xffffff, { y: 1.55, z: 0.15, parent: p });
			return p;
		};
		cassock(-401.8, 0.8, PI / 2, 0xd8d8d8);
		cassock(-398.4, -1.7, -PI / 2, 0x1a1410).userData.limbs.armR.rotation.x = -1.4;
		k.point(0xa0c0ff, 8, 10, { x: -402, y: 3, z: 2 });
		k.point(0xffe0c0, 4, 8, { x: -397, y: 2.5, z: 2.5 });
		k.glow(0xd0e0ff, 4, { x: -400, y: 1.6, z: -0.7, opacity: 0.5, from: 4 });
		k.point(0xd0e0ff, 4, 5, { x: -400, y: 1.5, z: -0.7, from: 4 });
		k.particles(200, 0xd8e8ff, { x: -400, z: 0, box: [6, 4, 5], speed: 0.3, size: 0.04, opacity: 0.6, drift: 0.3 });
		return {
			shots: [
				{ pos: [-199.5, 1.6, 4], look: [-200, 7, -14], fov: 50, exposure: 1.3 },
				{ pos: [299.55, 5.2, 1.3], look: [300, 5.0, 0], fov: 40, fog: [0xd8905a, 20, 220] },
				{ pos: [301.8, 1.2, 16.5], look: [300, 3.4, 0], fov: 45, fog: [0xd8905a, 30, 220] },
				{ pos: [-397, 2.3, 2.8], look: [-400, 0.8, -0.5], fov: 45 },
				{ pos: [-396.9, 1.35, 2.7], look: [-400, 1.65, -0.9], fov: 50 },
				{ pos: [7, 1.6, 12], look: [1.8, 4, -4], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the masked man
	r55: (k) => {
		k.fog(0xc0785a, 40, 220);
		k.sky(0x3a2a5a, 0xf08a4a, { offset: -0.03 });
		k.light({ sky: 0xffc8a8, ground: 0x4a3a2a, hemi: 1.35, sunColor: 0xffa060, sunIntensity: 2.2, sunPos: [-60, 18, 30], shadowSize: 40 });
		k.ground(400, 0x5a6a30, { bump: 0.3 });
		k.box(200, 0.06, 7, 0x3a3a3e, { y: 0.03, z: 8 });
		k.box(200, 0.1, 2, 0xb0a898, { y: 0.05, z: 3.6 });
		const pumpkin = (x, y, z, ry = 0, o = {}) => {
			const g = k.group({ x, y, z, ry, ...o });
			k.sphere(0.3, 0xe8701a, { s: [1.15, 0.85, 1.1], parent: g, seg: 12, rings: 8, rough: 0.6 });
			k.cyl(0.03, 0.05, 0.14, 0x4a5a20, { y: 0.28, parent: g });
			const lit = { emissive: 0xffa020, glow: 2 };
			[-0.11, 0.11].forEach((ex) => k.cone(0.07, 0.1, 0xffd040, { x: ex, y: 0.07, z: 0.3, rx: PI / 2, seg: 3, parent: g, ...lit }));
			k.cone(0.04, 0.06, 0xffd040, { y: -0.01, z: 0.32, rx: PI / 2, seg: 3, parent: g, ...lit });
			k.box(0.3, 0.07, 0.06, 0xffd040, { y: -0.1, z: 0.3, parent: g, ...lit });
			[-0.06, 0.06].forEach((tx) => k.box(0.04, 0.035, 0.07, 0xd8601a, { x: tx, y: -0.08, z: 0.31, parent: g }));
			k.glow(0xffa030, 0.9, { z: 0.38, parent: g, opacity: 0.7 });
			k.point(0xff9030, 1.5, 3, { z: 0.6, parent: g });
			return g;
		};
		const house = (x, z, color, roof, o = {}) => {
			const g = k.group({ x, z, from: o.from });
			k.box(8, 6, 7, color, { y: 3, parent: g });
			gable(k, 9, 3, 7.6, roof, { y: 6, parent: g });
			k.box(8.4, 0.5, 2.5, 0xd8d0c0, { y: 0.25, z: 4.75, parent: g });
			[-3.8, 3.8].forEach((px) => k.box(0.2, 2.6, 0.2, 0xf0ece0, { x: px, y: 1.8, z: 5.8, parent: g }));
			k.box(8.6, 0.2, 2.8, roof, { y: 3.2, z: 4.8, rx: 0.1, parent: g });
			k.box(1.1, 2.1, 0.1, o.door ?? 0x5a2a1a, { y: 1.55, z: 3.53, parent: g });
			[-2.4, 2.4].forEach((wx) => [1.9, 4.6].forEach((wy) => windowPane(k, 1.1, 1.3, o.glow ?? 0xffc870, { x: wx, y: wy, z: 3.55, parent: g, glow: o.dim ? 0.15 : 0.6 })));
			windowPane(k, 1.0, 1.1, o.glow ?? 0xffc870, { y: 4.6, z: 3.55, parent: g, glow: o.dim ? 0.15 : 0.6 });
			return g;
		};
		const autumn = (x, z, h = 7) => {
			k.cyl(0.25, 0.4, h * 0.55, 0x3a2818, { x, y: h * 0.27, z });
			[0xd86a20, 0xc83a1a, 0xe8a830].forEach((c, i) => k.ico(h * 0.28, c, { x: x + Math.sin(i * 2.1) * h * 0.18, y: h * 0.7 + i * 0.4, z: z + Math.cos(i * 2.1) * h * 0.18, rough: 0.9 }));
		};
		// Haddonfield at dusk.
		house(0, -4, 0xe8e4d8, 0x5a4a48);
		house(-14, -4, 0xe8d8a0, 0x4a3a3a, { door: 0x2a4a3a });
		house(14, -4, 0xa8b8c8, 0x3a3a48);
		house(-28, -5, 0xd8c8b8, 0x5a3a2a);
		house(28, -5, 0xe8e4d8, 0x4a4a4a);
		[-21, -7, 7, 21, 35, -35].forEach((x, i) => autumn(x, 1.5 - (i % 2), 7 + (i % 3)));
		[-20, 20].forEach((x) => autumn(x, 13, 8));
		[-4, 4].forEach((x) => k.box(4, 0.9, 1, 0x2a4a22, { x: x + (x > 0 ? 1.5 : -1.5), y: 0.45, z: 2.7 }));
		const r = rng(55);
		for (let i = 0; i < 160; i++) k.box(0.18, 0.02, 0.12, [0xd86a20, 0xc83a1a, 0xe8a830][i % 3], { x: (r() - 0.5) * 70, y: 0.07, z: -2 + r() * 16, ry: r() * 6, shadow: false });
		k.particles(250, 0xd8701a, { box: [70, 14, 30], z: 4, speed: 0.8, size: 0.12, drift: 1.2 });
		pumpkin(2.6, 0.73, 1.2, 0.2, { from: 2 });
		pumpkin(-1.9, 0.73, 1.4, -0.3, { from: 2 });
		pumpkin(-12, 0.73, 1.2, 0, { from: 2 });
		// Trick-or-treaters on the sidewalk.
		const sheet = k.group({ x: 6, z: 3.6, from: 2 });
		k.cone(0.55, 1.5, 0xf2f2f2, { y: 0.75, parent: sheet, seg: 10 });
		k.sphere(0.32, 0xf2f2f2, { y: 1.45, parent: sheet });
		[-0.1, 0.1].forEach((x) => k.sphere(0.05, 0x111111, { x, y: 1.5, z: 0.28, parent: sheet }));
		const witch = k.person({ x: 7.2, y: 0, z: 3.7, s: 0.7, ry: -0.4, dress: 0x1a1a1a, colors: { shirt: 0x1a1a1a, legs: 0x3a8a3a, hair: 0x8a5a2a }, from: 2 });
		k.cone(0.26, 0.6, 0x1a1a1a, { y: 2.15, parent: witch });
		k.cyl(0.4, 0.4, 0.03, 0x1a1a1a, { y: 1.9, parent: witch, seg: 14 });
		k.cyl(0.12, 0.12, 0.2, 0xe8701a, { x: 0.4, y: 0.8, parent: witch });
		// The man in the mask.
		const shape = (o) => {
			const p = k.person({ hair: false, colors: { shirt: 0x2a3448, legs: 0x2a3448, skin: 0xe8e4dc, hair: 0x4a3020 }, ...o });
			hairTop(k, p, 0x4a3020, { cap: 0.28 });
			const h = p.userData.limbs.head;
			h.scale.set(1, 1.1, 1);
			[-0.07, 0.07].forEach((x) => k.sphere(0.04, 0x050505, { x, y: 0.03, z: 0.17, parent: h }));
			k.box(0.04, 0.07, 0.04, 0xd8d4cc, { y: -0.03, z: 0.19, parent: h });
			k.box(0.08, 0.015, 0.02, 0x8a8478, { y: -0.1, z: 0.185, parent: h });
			return p;
		};
		// Between the sheets on the line, out back.
		[-17, -11].forEach((x) => {
			k.box(0.12, 2.6, 0.12, 0x5a4a3a, { x, y: 1.3, z: -16 });
			k.box(1.2, 0.1, 0.1, 0x5a4a3a, { x, y: 2.5, z: -16 });
		});
		k.box(6, 0.02, 0.02, 0xe8e8e8, { x: -14, y: 2.45, z: -16.4 });
		k.box(6, 0.02, 0.02, 0xe8e8e8, { x: -14, y: 2.45, z: -15.6 });
		const sheets = [[-15.6, -16.4], [-13.4, -15.6], [-12.6, -16.4]].map(([x, z], i) => k.plane(1.6, 1.7, k.mat(0xf8f6f0, { side: k.THREE.DoubleSide }), { x, y: 1.6, z, ry: 0.05 * i }));
		k.tick((t) => sheets.forEach((s, i) => (s.rotation.x = Math.sin(t * 1.3 + i) * 0.12)));
		shape({ x: -14.4, y: 0, z: -17.4, ry: 0.1, from: 3 });
		for (let i = 0; i < 9; i++) k.box(0.15, 1.5, 3, 0x8a7a60, { x: -22 + i * 2.5, y: 0.75, z: -21 });
		// Night: the old house, a streetlight and him.
		const night = k.group({ x: 300 });
		k.ground(120, 0x2a3424, { parent: night, bump: 0.2, seg: 20 });
		k.box(60, 0.06, 7, 0x24242a, { y: 0.03, z: 10, parent: night });
		k.box(60, 0.1, 2, 0x6a6a68, { y: 0.05, z: 5.6, parent: night });
		house(300, -3, 0x8a8478, 0x3a3634, { glow: 0x3a3a4a, dim: true, door: 0x2a2420 });
		windowPane(k, 1.0, 1.1, 0xffd890, { x: 300, y: 4.6, z: 0.6, glow: 1.2 });
		pumpkin(298.5, 0.73, 2.4, 0.3);
		pumpkin(301.6, 0.73, 2.6, -0.2);
		[[291, 3], [309, 2]].forEach(([x, z]) => {
			k.cyl(0.2, 0.35, 7, 0x1a1614, { x, y: 3.5, z });
			for (let i = 0; i < 6; i++) seg(k, [x, 4 + i * 0.4, z], [x + Math.sin(i * 2.4) * 2.4, 6.5 + i * 0.5, z + Math.cos(i * 2.4) * 1.4], 0.08, 0x1a1614);
		});
		k.cyl(0.08, 0.1, 5, 0x1a1a1a, { x: 305, y: 2.5, z: 6.4 });
		k.glow(0xd8e8ff, 2, { x: 305, y: 5, z: 6.4 });
		k.spot(0xd8e8ff, 40, { x: 305, y: 5, z: 6.4, target: [302, 0, 5], angle: 0.7, distance: 14 });
		k.point(0x8aa0ff, 6, 30, { x: 306, y: 6, z: 14 });
		k.disc(0xf0f0e0, 6, { x: 330, y: 30, z: -60 });
		const him = shape({ x: 302.2, y: 0, z: 4.4, ry: -0.25, pose: "raise", from: 4 });
		const arm = him.userData.limbs.armR;
		k.box(0.04, 0.55, 0.1, 0xf0f4fa, { y: -0.5, z: 0.14, parent: arm, metal: 0.8, rough: 0.2, emissive: 0x404858 });
		k.box(0.05, 0.14, 0.06, 0x2a1a10, { y: -0.78, z: 0.11, parent: arm });
		k.point(0xd0e0ff, 4, 6, { x: 302.6, y: 2.4, z: 6.6, from: 4 });
		// A kitchen, babysitting night: popcorn on the stove, the phone off its hook.
		const kit = k.group({ x: -300 });
		k.box(8, 0.1, 6, 0x9a8a6a, { y: -0.05, parent: kit });
		k.box(8, 4, 0.2, 0xe8dca0, { y: 2, z: -1.6, parent: kit });
		k.box(0.2, 4, 6, 0xd8cc90, { x: -2.6, y: 2, parent: kit });
		k.box(5, 0.9, 0.9, 0x8a5a3a, { x: 0.5, y: 0.45, z: -1.05, parent: kit });
		k.box(5.05, 0.06, 0.95, 0xd8d0c0, { x: 0.5, y: 0.93, z: -1.05, parent: kit });
		k.box(1.2, 0.04, 0.8, 0xf0f0ea, { x: 1.6, y: 0.97, z: -1.05, parent: kit });
		[[1.3, -0.85], [1.9, -1.25]].forEach(([x, z]) => k.cyl(0.14, 0.14, 0.02, 0x2a2a2a, { x, y: 0.99, z, parent: kit, seg: 14 }));
		k.cyl(0.2, 0.18, 0.18, 0x9a9aa0, { x: 1.3, y: 1.09, z: -0.85, parent: kit, metal: 0.7, rough: 0.3, seg: 16 });
		k.box(0.3, 0.03, 0.05, 0x1a1a1a, { x: 1.55, y: 1.15, z: -0.85, parent: kit });
		const corn = rng(551);
		k.cyl(0.32, 0.2, 0.18, 0xd8402a, { x: 0, y: 1.05, z: -0.75, parent: kit, seg: 16 });
		for (let n = 0; n < 40; n++) k.ico(0.035, n % 4 ? 0xfff6dc : 0xf2d890, { x: (corn() - 0.5) * 0.42, y: 1.15 + corn() * 0.08, z: -0.75 + (corn() - 0.5) * 0.42, parent: kit, detail: 0 });
		for (let n = 0; n < 6; n++) k.ico(0.035, 0xfff6dc, { x: 0.35 + corn() * 0.4, y: 0.98, z: -0.55 + corn() * 0.3, parent: kit });
		k.box(0.3, 0.5, 0.12, 0xe8e4d8, { x: -1.2, y: 1.7, z: -1.44, parent: kit });
		k.box(0.25, 0.08, 0.1, 0xe8e4d8, { x: -1.2, y: 1.98, z: -1.38, parent: kit });
		k.capsule(0.04, 0.18, 0xe8e4d8, { x: -0.85, y: 1.0, z: -0.85, rz: PI / 2, parent: kit });
		for (let n = 0; n < 8; n++) k.sphere(0.02, 0xe8e4d8, { x: -1.2 + n * 0.045, y: 1.45 - Math.sin((n / 7) * PI) * 0.4, z: -1.35 + n * 0.06, parent: kit, seg: 6, rings: 4 });
		k.box(0.9, 0.6, 0.05, 0xb8c8e0, { x: 1.2, y: 2.3, z: -1.48, parent: kit, emissive: 0x2a3a5a });
		k.point(0xffe8c0, 6, 8, { x: -299.5, y: 2.6, z: 0.8 });
		k.point(0xb0c0ff, 2, 6, { x: -301.5, y: 1.6, z: 1.5 });
		// Through the clown mask.
		const eye = [306, 1.5, 14];
		const dir = V3(k, [300, 3.5, -2]).sub(V3(k, eye)).normalize();
		const maskTex = k.canvas(512, 256, (g, w, h) => {
			g.fillStyle = "#050404";
			g.fillRect(0, 0, w, h);
			g.globalCompositeOperation = "destination-out";
			[w / 2 - 78, w / 2 + 78].forEach((x) => {
				g.beginPath();
				g.ellipse(x, h / 2, 60, 40, 0, 0, PI * 2);
				g.fill();
			});
		});
		const mask = k.plane(0.4, 0.2, new k.THREE.MeshBasicMaterial({ map: maskTex, transparent: true, fog: false, side: k.THREE.DoubleSide }), { x: eye[0] + dir.x * 0.12, y: eye[1] + dir.y * 0.12, z: eye[2] + dir.z * 0.12, from: 2, until: 2, shadow: false });
		mask.lookAt(V3(k, eye));
		return {
			shots: [
				{ pos: [-299.6, 1.7, 1.4], look: [-300.2, 1.05, -0.9], fov: 45, fog: [0x2a2420, 4, 25] },
				{ pos: [18, 3, 17], look: [0, 2.5, 0], fov: 45 },
				{ pos: eye, look: [eye[0] + dir.x * 0.6, eye[1] + dir.y * 0.6, eye[2] + dir.z * 0.6], fov: 50, push: 0, fog: [0x10142a, 10, 90] },
				{ pos: [-14.5, 1.75, -10.5], look: [-14.4, 1.55, -16.5], fov: 45 },
				{ pos: [307, 2.2, 16], look: [301.5, 2.4, 3], fov: 45, fog: [0x10142a, 10, 90] },
				{ pos: [302.0, 1.8, 6.9], look: [302.2, 1.9, 4.4], fov: 42, fog: [0x0a0c1a, 5, 40] },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the town under a dome
	r56: (k) => {
		k.fog(0xcfe6f4, 60, 320);
		k.sky(0x4a9ae8, 0xe0f2fc);
		k.light({ sky: 0xf0f8ff, ground: 0x6a8a5a, hemi: 1.35, sunPos: [30, 60, 30], sunIntensity: 2.3, shadowSize: 40 });
		k.ground(420, 0x7ab060, { bump: 0.1, seg: 30 });
		k.box(200, 0.06, 7, 0x9a9aa0, { y: 0.03 });
		[-1, 1].forEach((s) => k.box(200, 0.12, 2, 0xe8e4d8, { y: 0.06, z: s * 4.6 }));
		const pastel = [0xf4dcd4, 0xd8e8f4, 0xf4ecc4, 0xd8f0dc, 0xf0e0f0, 0xfafafa];
		const roofs = [0xc86a50, 0x8a9aa8, 0xf0f0f0, 0x6a8ab0];
		for (let i = 0; i < 6; i++) [-1, 1].forEach((s) => {
			const x = -36 + i * 13 + (s > 0 ? 5 : 0);
			const g = k.group({ x, z: s * 15, ry: s > 0 ? PI : 0 });
			const c = pastel[(i * 2 + (s > 0 ? 1 : 0)) % 6];
			k.box(8, 5.5, 7, c, { y: 2.75, parent: g });
			gable(k, 9, 2.8, 7.6, roofs[(i + (s > 0 ? 2 : 0)) % 4], { y: 5.5, parent: g });
			k.box(8.6, 0.3, 2.4, 0xfafafa, { y: 0.15, z: 4.7, parent: g });
			[-3.9, 3.9].forEach((px) => k.box(0.2, 2.8, 0.2, 0xfafafa, { x: px, y: 1.6, z: 5.7, parent: g }));
			k.box(8.8, 0.2, 2.8, 0xfafafa, { y: 3.1, z: 4.8, parent: g });
			k.box(1.1, 2.1, 0.1, [0x3a6a9a, 0xc84a4a, 0x2a6a4a][i % 3], { y: 1.35, z: 3.53, parent: g });
			[-2.4, 2.4].forEach((wx) => [1.8, 4.3].forEach((wy) => windowPane(k, 1.1, 1.2, 0x9ac8e8, { x: wx, y: wy, z: 3.55, parent: g, glow: 0.15 })));
			for (let p = 0; p < 22; p++) k.box(0.12, 0.9, 0.06, 0xfafafa, { x: -5.25 + p * 0.5, y: 0.45, z: 8.6, parent: g });
			k.box(11, 0.08, 0.04, 0xfafafa, { y: 0.65, z: 8.56, parent: g });
			k.box(1.5, 0.06, 4.5, 0xe8e4d8, { y: 0.03, z: 6.6, parent: g });
			k.cyl(0.18, 0.25, 2.2, 0x6a4a30, { x: -4.5, y: 1.1, z: 6.5, parent: g });
			k.sphere(1.5, 0x4a9a3a, { x: -4.5, y: 3.0, z: 6.5, parent: g, seg: 8, rings: 6 });
		});
		// The light that fell from the sky.
		const fallen = k.group({ x: 2, z: 0.6, ry: 0.5 });
		k.cyl(0.55, 0.45, 1.2, 0x3a3a40, { rx: PI / 2, rz: 0.15, y: 0.5, parent: fallen, metal: 0.6, rough: 0.4, seg: 16 });
		k.cyl(0.5, 0.5, 0.05, 0xd8f0ff, { rx: PI / 2, y: 0.52, z: 0.62, parent: fallen, emissive: 0x8ab0d0, glow: 0.6, rough: 0.1, seg: 16 });
		k.torus(0.52, 0.05, 0x2a2a2e, { y: 0.52, z: 0.62, parent: fallen, seg: 20, metal: 0.6 });
		[-1, 1].forEach((s) => {
			k.box(0.06, 0.9, 0.5, 0x1a1a1e, { x: s * 0.62, y: 0.55, z: 0.85, rz: s * 0.4, parent: fallen });
			k.box(0.08, 0.08, 1.4, 0x6a6a70, { x: s * 0.62, y: 0.35, parent: fallen, metal: 0.8 });
		});
		k.box(0.3, 0.12, 0.2, 0xf0f0e8, { y: 0.98, z: -0.1, parent: fallen });
		const shards = rng(56);
		for (let i = 0; i < 26; i++) k.box(0.05 + shards() * 0.1, 0.01, 0.04 + shards() * 0.1, 0xe0f4ff, { x: 2 + (shards() - 0.5) * 3, y: 0.07, z: 0.6 + (shards() - 0.5) * 2.4, ry: shards() * 6, metal: 0.6, rough: 0.05 });
		// Good morning, neighbour.
		const truman = (o) => k.person({ colors: { shirt: 0xc8b898, legs: 0x8a7a68, skin: 0xf0c8a8, hair: 0x2a1a10 }, sleeves: 0xc8b898, ...o });
		const waving = truman({ x: -6.2, y: 0, z: -5.6, ry: 0.4, pose: "raise", from: 3 });
		k.box(0.1, 0.5, 0.04, 0xb02020, { y: 1.3, z: 0.15, parent: waving });
		k.box(0.18, 0.12, 0.04, 0xf0f0f0, { y: 1.55, z: 0.15, parent: waving });
		k.box(0.6, 0.45, 0.14, 0x4a2a1a, { x: -0.5, y: 0.75, parent: waving });
		const nb = k.person({ x: -1, y: 0, z: -7.4, ry: -0.6, pose: "raise", dress: 0xe86a8a, colors: { shirt: 0xf0e8d8, legs: 0xf0c8a8, hair: 0xe0c070 }, from: 3 });
		void nb;
		k.box(0.6, 0.4, 0.9, 0xe8e0d0, { x: -0.3, y: 0.3, z: -7.8, from: 3 });
		// The control room under the moon.
		const studio = k.group({ x: -300 });
		k.box(30, 0.2, 20, 0x1a1c24, { y: -0.1, parent: studio });
		k.box(30, 12, 0.3, 0x14161c, { y: 6, z: -6, parent: studio });
		const thumbs = [
			(g) => { g.fillStyle = "#7ab8e8"; g.fillRect(0, 0, 128, 96); g.fillStyle = "#f4dcd4"; g.fillRect(30, 40, 60, 40); g.fillStyle = "#c86a50"; g.beginPath(); g.moveTo(24, 40); g.lineTo(60, 18); g.lineTo(96, 40); g.fill(); g.fillStyle = "#7ab060"; g.fillRect(0, 80, 128, 16); },
			(g) => { g.fillStyle = "#e8c0a0"; g.fillRect(0, 0, 128, 96); g.fillStyle = "#2a1a10"; g.fillRect(0, 0, 128, 22); g.fillStyle = "#fff"; [40, 88].forEach((x) => { g.beginPath(); g.ellipse(x, 44, 12, 7, 0, 0, PI * 2); g.fill(); }); g.fillStyle = "#3a5a8a"; [40, 88].forEach((x) => { g.beginPath(); g.arc(x, 44, 5, 0, PI * 2); g.fill(); }); g.fillStyle = "#b85a4a"; g.fillRect(48, 74, 32, 6); },
			(g) => { g.fillStyle = "#8ac8f0"; g.fillRect(0, 0, 128, 60); g.fillStyle = "#2a6a9a"; g.fillRect(0, 60, 128, 36); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(60, 20); g.lineTo(60, 62); g.lineTo(84, 62); g.fill(); },
			(g) => { g.fillStyle = "#9a9aa0"; g.fillRect(0, 0, 128, 96); g.fillStyle = "#d8e8f4"; g.fillRect(0, 0, 128, 40); g.fillStyle = "#c84a4a"; g.fillRect(40, 56, 50, 18); g.fillStyle = "#111"; g.fillRect(46, 72, 10, 8); g.fillRect(76, 72, 10, 8); },
			(g) => { const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, "#f08a4a"); gr.addColorStop(1, "#3a2a5a"); g.fillStyle = gr; g.fillRect(0, 0, 128, 96); g.fillStyle = "#ffe0a0"; g.beginPath(); g.arc(64, 60, 16, 0, PI * 2); g.fill(); },
			(g) => { g.fillStyle = "#4a7a3a"; g.fillRect(0, 0, 128, 96); g.fillStyle = "#e8e4d8"; for (let i = 0; i < 4; i++) g.fillRect(10 + i * 30, 20 + (i % 2) * 30, 20, 20); g.fillStyle = "#9a9aa0"; g.fillRect(0, 44, 128, 10); },
		].map((d) => new k.THREE.MeshBasicMaterial({ map: k.canvas(128, 96, d) }));
		for (let row = 0; row < 4; row++) for (let col = 0; col < 9; col++) {
			const x = -8.8 + col * 2.2;
			k.box(2.1, 1.6, 0.2, 0x0a0a0e, { x, y: 1.8 + row * 1.75, z: -5.8, parent: studio });
			k.plane(1.9, 1.4, thumbs[(row * 5 + col * 7) % 6], { x, y: 1.8 + row * 1.75, z: -5.68, parent: studio, shadow: false });
		}
		k.box(16, 1, 2, 0x2a2c34, { y: 0.5, z: -2.5, parent: studio });
		for (let i = 0; i < 30; i++) k.box(0.15, 0.04, 0.1, [0xff4040, 0x40ff80, 0xffd040][i % 3], { x: -7 + i * 0.48, y: 1.02, z: -2.2, parent: studio, emissive: [0xff4040, 0x40ff80, 0xffd040][i % 3], glow: 1 });
		const maker = k.person({ x: -299.4, y: 0, z: 0.2, ry: PI, hat: 0x1a1a1a, coat: 0x2a2a30, colors: { shirt: 0x2a2a30, legs: 0x2a2a30, hair: 0xd8d8d8 } });
		backHair(k, maker, 0xd8d8d8);
		[-303, -297].forEach((x) => k.person({ x, y: -0.1, z: -1.2, ry: PI, pose: "sit", s: 0.95, colors: { shirt: 0x3a4a6a, legs: 0x2a2a30 } }));
		k.point(0x9ac0ff, 10, 18, { x: -300, y: 4, z: -2 });
		k.point(0xd0d8ff, 3, 10, { x: -300, y: 3, z: 4 });
		k.disc(0xf4f2e8, 3, { x: -306, y: 9.2, z: -5.5 });
		// The sea, and the end of the world: a wall painted like the sky.
		const sea = k.group({ x: 400 });
		k.water(320, 0x3a7ab0, { x: 400, seg: 50, amp: 0.25 });
		const skyTex = k.canvas(1024, 512, (g, w, h) => {
			const gr = g.createLinearGradient(0, 0, 0, h);
			gr.addColorStop(0, "#3a84dc");
			gr.addColorStop(1, "#9ccef2");
			g.fillStyle = gr;
			g.fillRect(0, 0, w, h);
			const rc = rng(9);
			g.fillStyle = "rgba(255,255,255,0.9)";
			for (let c = 0; c < 9; c++) {
				const cx = rc() * w;
				const cy = 60 + rc() * 360;
				for (let p = 0; p < 7; p++) {
					g.beginPath();
					g.ellipse(cx + (p - 3) * 22 + rc() * 10, cy + Math.abs(p - 3) * 5, 30 + rc() * 20, 18 + rc() * 10, 0, 0, PI * 2);
					g.fill();
				}
			}
			g.strokeStyle = "rgba(60,90,130,0.12)";
			g.lineWidth = 2;
			for (let x = 0; x < w; x += 64) {
				g.beginPath();
				g.moveTo(x, 0);
				g.lineTo(x, h);
				g.stroke();
			}
		});
		skyTex.wrapS = k.THREE.RepeatWrapping;
		skyTex.repeat.set(5, 1);
		k.plane(300, 60, new k.THREE.MeshBasicMaterial({ map: skyTex }), { x: 0, y: 29, z: -40, parent: sea, shadow: false });
		for (let i = 0; i < 12; i++) k.box(0.5, 0.15, 1, 0xdce8f4, { x: -10 + i * 0.55, y: 0.6 + i * 0.5, z: -39.45, parent: sea });
		k.box(2.4, 0.15, 1.2, 0xdce8f4, { x: -2.3, y: 6.6, z: -39.4, parent: sea });
		for (let i = 0; i < 12; i++) k.box(0.04, 0.9, 0.04, 0xdce8f4, { x: -10 + i * 0.55, y: 1.1 + i * 0.5, z: -38.98, parent: sea });
		seg(k, [390, 1.55, -38.98], [397.1, 7.6, -38.98], 0.05, 0xdce8f4);
		k.box(1.1, 2.1, 0.06, 0x0a0a10, { x: -2.2, y: 7.73, z: -39.95, parent: sea, from: 4 });
		const boat = (o) => {
			const g = k.group(o);
			k.box(1.6, 0.8, 4.4, 0xf4f4f0, { y: 0.3, parent: g });
			k.box(1.62, 0.15, 4.42, 0x2a4a8a, { y: 0.05, parent: g });
			k.cyl(0.8, 0.8, 0.8, 0xf4f4f0, { y: 0.3, z: 2.2, seg: 3, s: [1, 1, 1.8], ry: 0, parent: g });
			k.cyl(0.06, 0.06, 6.5, 0xd8d0c0, { y: 3.8, z: 0.5, parent: g });
			const sail = new k.THREE.Shape();
			sail.moveTo(0, 0);
			sail.lineTo(0, 5.6);
			sail.lineTo(-2.6, 0);
			k.mesh(new k.THREE.ShapeGeometry(sail), k.mat(0xf8f4ea, { side: k.THREE.DoubleSide }), { y: 1, z: 0.5, ry: PI / 2, parent: g });
			k.box(0.6, 0.5, 1, 0xd8d0c0, { y: 0.9, z: -1.2, parent: g });
			return g;
		};
		// On the boat at the wall, then on the stairs.
		boat({ x: 392.5, y: 0.2, z: -42.6 + 4.4, ry: PI, from: 4 });
		const atWall = truman({ x: 392.5, y: 0.7, z: -38.9, ry: PI, from: 4, until: 4 });
		atWall.userData.limbs.armR.rotation.x = -1.6;
		const bow = truman({ x: 397.4, y: 6.68, z: -39.2, from: 5, pose: "hunch" });
		bow.userData.limbs.armR.rotation.set(-0.9, 0, 0.5);
		bow.userData.limbs.armL.rotation.set(0.3, 0, -0.3);
		k.point(0xffffff, 4, 20, { x: 396, y: 8, z: -32, from: 4 });
		// The storm.
		const storm = boat({ x: 400, y: 0.2, z: 60, ry: 0.6, rz: 0.3 });
		const cling = truman({ x: 0, y: 0.7, z: 1.2, parent: storm, pose: "raise" });
		void cling;
		k.particles(1500, 0xc8d4e0, { x: 400, z: 60, box: [40, 25, 40], speed: 22, size: 0.06, opacity: 0.6 });
		const flash = k.point(0xd0e0ff, 0, 200, { x: 410, y: 40, z: 70 });
		k.tick((t) => (flash.intensity = Math.sin(t * 1.1) > 0.95 ? 30 : 0));
		k.point(0xa0b0c0, 4, 30, { x: 405, y: 8, z: 66 });
		return {
			shots: [
				{ pos: [3.9, 1.3, 0.1], look: [2.0, 0.5, 0.7], fov: 42 },
				{ pos: [406, 3.2, 69], look: [400, 2.6, 60], fov: 45, fog: [0x2a323c, 5, 70], filter: "saturate(0.45) brightness(0.9)" },
				{ pos: [-300, 2.4, 7], look: [-300, 3.6, -5], fov: 50, exposure: 1.2 },
				{ pos: [-2.6, 1.8, 2.5], look: [-5.4, 1.7, -6], fov: 45 },
				{ pos: [396.8, 2.6, -31], look: [392.5, 2, -39.6], fov: 45 },
				{ pos: [401.5, 6, -29], look: [395.8, 5.4, -40], fov: 45 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the same day, again
	r57: (k) => {
		k.fog(0xc8d0dc, 40, 220);
		k.sky(0x8a9ab8, 0xe0e4ec);
		k.light({ sky: 0xffffff, ground: 0x8a8a90, hemi: 1.45, sunPos: [-30, 40, 40], sunIntensity: 1.6, sunColor: 0xfff0e0, shadowSize: 40 });
		k.ground(420, 0xf0f2f6, { bump: 0.3 });
		k.particles(1500, 0xffffff, { box: [80, 30, 80], speed: 1.5, size: 0.1, drift: 0.8 });
		// The square: a gazebo, slushy streets and brick storefronts.
		k.cyl(14, 14, 0.06, 0xf4f6fa, { y: 0.03, seg: 32 });
		[[0, 19, 60, 5], [0, -19, 60, 5], [19, 0, 5, 60], [-19, 0, 5, 60]].forEach(([x, z, w, d]) => k.box(w, 0.05, d, 0x8a8a90, { x, y: 0.02, z, rough: 0.4 }));
		k.box(34, 0.25, 0.4, 0xd8d8dc, { y: 0.12, z: 16.3 });
		const gz = k.group();
		k.cyl(4.2, 4.2, 0.6, 0xf2f0ea, { y: 0.3, seg: 8, parent: gz });
		for (let i = 0; i < 8; i++) {
			const a = (i / 8) * PI * 2 + PI / 8;
			k.cyl(0.12, 0.12, 3, 0xf8f8f4, { x: Math.cos(a) * 3.8, y: 2.1, z: Math.sin(a) * 3.8, parent: gz });
			if (i !== 2) k.box(2.9, 0.08, 0.08, 0xf8f8f4, { x: Math.cos(a + PI / 8) * 3.5, y: 1.4, z: Math.sin(a + PI / 8) * 3.5, ry: -(a + PI / 8) + PI / 2, parent: gz });
		}
		k.cone(4.8, 2.4, 0x3a5a4a, { y: 4.8, seg: 8, ry: PI / 8, parent: gz });
		k.cone(4.0, 2.0, 0xf4f6fa, { y: 5.15, seg: 8, ry: PI / 8, parent: gz });
		const bulbs = [0xff4040, 0x40c0ff, 0xffd040, 0x40ff80];
		for (let i = 0; i < 24; i++) k.glow(bulbs[i % 4], 0.5, { x: Math.cos((i / 24) * PI * 2) * 4.7, y: 3.65, z: Math.sin((i / 24) * PI * 2) * 4.7 });
		const brick = k.mat(0xffffff, { map: bricks(k, "#4a2a20", ["#8a4a36", "#7a4030", "#9a5a44"], [2, 2]) });
		const awn = [0xc02a2a, 0x2a5a3a, 0x2a3a7a, 0xc8a030];
		for (let i = 0; i < 6; i++) [[0, -26, 0], [0, 26, PI], [-26, 0, PI / 2], [26, 0, -PI / 2]].forEach(([bx, bz, ry], side) => {
			const off = -17.5 + i * 7;
			const g = k.group({ x: bx + (bx === 0 ? off : 0), z: bz + (bz === 0 ? off : 0), ry });
			const h = 7 + ((i + side) % 3) * 2;
			k.box(6.8, h, 8, side % 2 ? brick : [0xb8a888, 0x8a5a48, 0xa89a8a][i % 3], { y: h / 2, parent: g });
			k.box(7, 0.4, 8.2, 0xf4f6fa, { y: h + 0.2, parent: g });
			k.box(5, 2, 0.1, 0xffd890, { y: 1.5, z: 4.02, parent: g, emissive: 0xffb050, glow: 0.6 });
			k.box(6, 0.15, 1.6, awn[(i + side) % 4], { y: 3.1, z: 4.7, rx: 0.35, parent: g });
			[-1.6, 1.6].forEach((wx) => windowPane(k, 1, 1.3, 0x5a6a80, { x: wx, y: 5.2, z: 4.05, parent: g, glow: 0.2 }));
		});
		[[-9, 15], [9, 15], [-15, -9], [15, 9]].forEach(([x, z]) => {
			k.cyl(0.08, 0.1, 4, 0x1a1a1a, { x, y: 2, z });
			k.glow(0xfff0c0, 1.4, { x, y: 4.1, z });
			k.torus(0.3, 0.1, 0x2a5a3a, { x, y: 3.2, z: z + (z > 0 ? 0.12 : -0.12), parent: undefined, seg: 12 });
		});
		const coats = [0xc02a2a, 0x2a4a8a, 0x3a6a3a, 0xd8a030, 0x6a3a7a, 0x8a5a3a];
		const rc = rng(57);
		for (let i = 0; i < 22; i++) {
			const a = rc() * PI * 2;
			const d = 6 + rc() * 7;
			const p = k.person({ x: Math.cos(a) * d, y: 0, z: Math.sin(a) * d, ry: rc() * 6, s: 0.9, coat: coats[i % 6], colors: { shirt: coats[i % 6], legs: 0x2a2a34, hair: 0x3a2a1a }, from: 2 });
			k.sphere(0.23, coats[(i + 3) % 6], { y: 1.85, parent: p, s: [1, 0.8, 1] });
		}
		// The deep puddle at the kerb, and the foot that finds it.
		k.cyl(1.2, 1.2, 0.02, 0x3a4658, { x: 6, y: 0.06, z: 17.6, s: [1, 1, 0.6], metal: 0.6, rough: 0.08, seg: 20 });
		k.torus(1.2, 0.08, 0xc8ccd4, { x: 6, y: 0.06, z: 17.6, rx: PI / 2, s: [1, 0.6, 0.6], seg: 20 });
		k.person({ x: 6.1, y: -0.32, z: 17.6, ry: -0.3, colors: { shirt: 0xb8946a, legs: 0x3a3a44, hair: 0x5a3a20, shoes: 0x3a2418 } });
		for (let i = 0; i < 8; i++) k.sphere(0.04, 0xe8f0f8, { x: 6.1 + Math.cos(i) * 0.5, y: 0.15 + (i % 3) * 0.12, z: 17.6 + Math.sin(i) * 0.4, opacity: 0.8 });
		const ripples = [0, 1, 2].map(() => k.torus(0.3, 0.012, 0xe0e8f0, { x: 6.1, y: 0.075, z: 17.6, rx: PI / 2, shadow: false }));
		k.tick((t) => ripples.forEach((r, i) => {
			const f = (t * 0.6 + i / 3) % 1;
			r.scale.setScalar(0.4 + f * 2.4);
			r.material.transparent = true;
			r.material.opacity = 1 - f;
		}));
		// The bed-and-breakfast room and the clock radio.
		const room = k.group({ x: 300 });
		k.box(8, 0.1, 8, 0x6a4a30, { y: -0.05, parent: room });
		const paper = k.canvas(128, 128, (g) => {
			g.fillStyle = "#f0e4d0";
			g.fillRect(0, 0, 128, 128);
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
				const cx = 16 + x * 32 + (y % 2) * 16;
				const cy = 16 + y * 32;
				g.fillStyle = "#d87a8a";
				for (let p = 0; p < 5; p++) {
					g.beginPath();
					g.arc(cx + Math.cos((p * PI * 2) / 5) * 5, cy + Math.sin((p * PI * 2) / 5) * 5, 4, 0, PI * 2);
					g.fill();
				}
				g.fillStyle = "#7a9a5a";
				g.fillRect(cx - 1, cy + 6, 2, 8);
			}
		});
		paper.wrapS = paper.wrapT = k.THREE.RepeatWrapping;
		paper.repeat.set(5, 3);
		k.box(8, 4, 0.2, k.mat(0xffffff, { map: paper }), { y: 2, z: -3, parent: room });
		k.box(0.2, 4, 8, k.mat(0xffffff, { map: paper }), { x: -3.5, y: 2, parent: room });
		windowPane(k, 1.4, 1.6, 0xb8d0f0, { x: -3.38, y: 2.2, z: 0.5, ry: PI / 2, parent: room, glow: 0.6 });
		k.box(2.2, 1.6, 0.15, 0x5a3a20, { x: 0.4, y: 0.8, z: -2.8, parent: room });
		k.box(2, 0.5, 3.2, 0x6a4a30, { x: 0.4, y: 0.35, z: -1.1, parent: room });
		const quilt = k.canvas(128, 128, (g) => {
			const cols = ["#c84a4a", "#e8d8b0", "#4a6a9a", "#d8a040", "#7a9a5a", "#f0f0e8"];
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
				g.fillStyle = cols[(x * 3 + y * 5) % 6];
				g.fillRect(x * 16, y * 16, 16, 16);
			}
		});
		k.box(2.1, 0.2, 2.6, k.mat(0xffffff, { map: quilt }), { x: 0.4, y: 0.7, z: -0.8, parent: room });
		k.box(1.6, 0.18, 0.5, 0xf8f8f0, { x: 0.4, y: 0.7, z: -2.4, parent: room });
		k.box(0.7, 0.75, 0.6, 0x5a3a20, { x: 2.2, y: 0.375, z: -2.4, parent: room });
		const clock = k.group({ x: 302.2, y: 0.75, z: -2.3, ry: -0.35 });
		k.box(0.5, 0.2, 0.26, 0x6a4a30, { y: 0.1, parent: clock });
		k.box(0.36, 0.13, 0.02, 0x111111, { x: -0.04, y: 0.1, z: 0.13, parent: clock });
		[-0.17, -0.08, 0.04, 0.13].forEach((x, i) => i !== 1 && k.box(0.06, 0.1, 0.012, 0x2a2a2a, { x: x - 0.025, y: 0.1, z: 0.142, parent: clock, until: 4 }));
		const digits = k.canvas(256, 96, (g, w, h) => {
			g.fillStyle = "#111";
			g.fillRect(0, 0, w, h);
			[[8, "6"], [72, ":"], [104, "0"], [172, "0"]].forEach(([x, ch]) => {
				if (ch !== ":") {
					g.fillStyle = "#2a2a2a";
					g.fillRect(x, 8, 62, 80);
					g.fillStyle = "#000";
					g.fillRect(x, 47, 62, 2);
				}
				g.fillStyle = "#f4f4f0";
				g.font = "bold 70px Helvetica, Arial, sans-serif";
				g.textAlign = "center";
				g.fillText(ch, x + (ch === ":" ? 16 : 31), 72);
			});
		});
		k.plane(0.34, 0.12, new k.THREE.MeshBasicMaterial({ map: digits }), { x: -0.04, y: 0.1, z: 0.142, parent: clock, from: 5 });
		k.box(0.06, 0.12, 0.02, 0x8a7a60, { x: 0.2, y: 0.1, z: 0.132, parent: clock });
		k.cyl(0.06, 0.1, 0.4, 0xd8c8a0, { x: 2.0, y: 0.95, z: -2.6, parent: room });
		k.cone(0.3, 0.35, 0xf8e8c0, { x: 2.0, y: 1.3, z: -2.6, parent: room, emissive: 0xffd890, glow: 0.5, open: true });
		k.point(0xffe0b0, 4, 8, { x: 302, y: 1.6, z: -1.6 });
		k.point(0xd8e4ff, 3, 8, { x: 298, y: 2.2, z: 1.5 });
		// Up on the knob at dawn: top hats and the groundhog.
		const knob = k.group({ x: -300 });
		k.ground(120, 0xeef2f8, { parent: knob, bump: 0.6, seg: 24 });
		trees(k, 50, [-350, -250, -40, -6], { color: 0x2a4a3a, h: 10, seed: 57 });
		for (let i = 0; i < 25; i++) k.cone(1.5, 2.5, 0xf4f6fa, { x: -340 + ((i * 37) % 80), y: 6.2, z: -38 + ((i * 13) % 30), seg: 6 });
		k.box(11, 1, 5, 0x6a4a30, { y: 0.5, z: -1, parent: knob });
		k.box(11, 4.5, 0.4, 0x5a3a24, { y: 3.2, z: -3.4, parent: knob });
		for (let i = 0; i < 9; i++) k.cyl(0.25, 0.25, 11, 0x7a5a3a, { rz: PI / 2, y: 1.2 + i * 0.5, z: -3.15, parent: knob, seg: 8 });
		k.box(11.4, 0.4, 0.6, 0xf4f6fa, { y: 5.6, z: -3.4, parent: knob });
		k.cyl(0.7, 0.8, 1.0, 0x5a4028, { x: 2.5, y: 1.5, z: -1.2, parent: knob, seg: 10 });
		const topper = (x, z, ry, pose) => {
			const p = k.person({ x: x - 300, y: 1, z, ry, pose, hat: 0x111114, coat: 0x111114, colors: { shirt: 0x111114, legs: 0x111114, hair: 0x8a8a8a } });
			k.box(0.16, 0.2, 0.05, 0xf8f8f8, { y: 1.45, z: 0.15, parent: p });
			return p;
		};
		topper(-4, -1.5, 0.2);
		topper(-2.5, -2, 0.1);
		topper(3.8, -2, -0.2);
		topper(1.5, -1.6, -0.3, "point");
		const handler = topper(-0.4, -0.6, 0);
		handler.userData.limbs.armL.rotation.set(-1.25, 0, 0.25);
		handler.userData.limbs.armR.rotation.set(-1.25, 0, -0.25);
		// The groundhog, held up to the crowd: a fat, furry rodent sideways across the handler's chest.
		const hog = k.group({ x: -300.75, y: 2.5, z: 0.05 });
		const fur = { rough: 1 };
		k.sphere(0.36, 0x5a3e22, { s: [1.55, 1, 1], parent: hog, ...fur });
		k.sphere(0.3, 0x9a7a50, { x: 0.05, y: -0.08, z: 0.12, s: [1.3, 0.8, 0.8], parent: hog, ...fur });
		k.sphere(0.24, 0x5a3e22, { x: 0.62, y: 0.12, s: [1.15, 1, 1], parent: hog, ...fur });
		k.sphere(0.12, 0xb89a70, { x: 0.82, y: 0.06, z: 0.06, s: [1, 0.8, 1], parent: hog });
		k.sphere(0.04, 0x111111, { x: 0.92, y: 0.09, z: 0.08, parent: hog });
		[-1, 1].forEach((s) => {
			k.sphere(0.035, 0x111111, { x: 0.74, y: 0.22, z: s * 0.13, parent: hog });
			k.sphere(0.06, 0x5a4028, { x: 0.58, y: 0.33, z: s * 0.13, parent: hog });
			k.box(0.08, 0.22, 0.08, 0x5a4028, { x: 0.3, y: -0.3, z: s * 0.16, parent: hog });
			k.box(0.08, 0.2, 0.08, 0x5a4028, { x: -0.35, y: -0.3, z: s * 0.16, parent: hog });
		});
		k.capsule(0.08, 0.3, 0x5a4028, { x: -0.62, y: -0.1, rz: -1.1, parent: hog });
		k.box(0.04, 0.02, 0.02, 0xf0f0e8, { x: 0.94, y: 0.0, z: 0.06, parent: hog });
		// The sign over the stage.
		const sign = k.canvas(512, 96, (g, w, h) => {
			g.fillStyle = "#2a3a2a";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "#f0e8c8";
			g.lineWidth = 6;
			g.strokeRect(6, 6, w - 12, h - 12);
			g.fillStyle = "#f0e8c8";
			g.font = "bold 50px Georgia, serif";
			g.textAlign = "center";
			g.fillText("GOBBLER'S KNOB", w / 2, 68);
		});
		k.box(6, 1.1, 0.12, k.mat(0xffffff, { map: sign }), { y: 6.6, z: -3.3, parent: knob });
		[-2.9, 2.9].forEach((x) => k.box(0.15, 1.6, 0.15, 0x3a2a1a, { x, y: 6.2, z: -3.35, parent: knob }));
		for (let i = 0; i < 12; i++) k.cone(0.22, 0.4, [0xc02a2a, 0xf0f0f0, 0x2a3a8a][i % 3], { x: -5.2 + i * 0.95, y: 5.05, z: -3.1, rx: PI, seg: 3, s: [1, 1, 0.1], parent: knob });
		const phil = k.person({ x: -296.6, y: 0, z: 2.2, ry: -0.5, coat: 0xb8946a, colors: { shirt: 0xb8946a, legs: 0x3a3a40, hair: 0x5a3a20 }, sleeves: 0xb8946a });
		phil.userData.limbs.armR.rotation.set(-2.3, 0, -0.3);
		k.cyl(0.04, 0.03, 0.25, 0x111111, { y: -0.72, parent: phil.userData.limbs.armR });
		k.sphere(0.06, 0x222222, { y: -0.86, parent: phil.userData.limbs.armR });
		k.box(0.55, 0.12, 0.3, 0x8a2a2a, { y: 1.55, parent: phil });
		const cam = k.person({ x: -294.6, y: 0, z: 3.4, ry: -0.9, coat: 0x2a3a5a, colors: { shirt: 0x2a3a5a, legs: 0x2a2a30, hair: 0x2a1a10 } });
		k.box(0.3, 0.35, 0.7, 0x2a2a2a, { x: 0.3, y: 1.9, z: 0.15, parent: cam });
		k.cyl(0.1, 0.1, 0.3, 0x111111, { x: 0.3, y: 1.92, z: 0.6, rx: PI / 2, parent: cam });
		for (let i = 0; i < 70; i++) {
			const p = k.person({ x: -300 + (rc() - 0.5) * 22, y: 0, z: 6 + rc() * 14, ry: PI + (rc() - 0.5), s: 0.85 + rc() * 0.2, pose: rc() > 0.75 ? "raise" : "stand", coat: coats[i % 6], colors: { shirt: coats[i % 6], legs: 0x2a2a34, hair: 0x3a2a1a } });
			k.sphere(0.23, coats[(i + 2) % 6], { y: 1.85, parent: p, s: [1, 0.8, 1] });
		}
		[-6, 6].forEach((x) => {
			k.cyl(0.12, 0.12, 7, 0x2a2a2a, { x: -300 + x, y: 3.5, z: 4 });
			k.glow(0xffffff, 2.5, { x: -300 + x, y: 7, z: 4 });
			k.spot(0xfff4e0, 60, { x: -300 + x, y: 7, z: 4, target: [-300, 2, -1], angle: 0.5, distance: 30 });
		});
		k.point(0xfff0e0, 6, 20, { x: -298, y: 6, z: 6 });
		return {
			shots: [
				{ pos: [303.3, 1.9, 2.8], look: [300.6, 0.8, -1.4], fov: 50 },
				{ pos: [7.0, 1.5, 19.4], look: [6.1, 0.15, 17.4], fov: 40 },
				{ pos: [7, 3.2, 15], look: [0, 3, -4], fov: 50 },
				{ pos: [-300, 4, 24], look: [-300, 2.8, 0], fov: 45, fog: [0x5a6a8a, 25, 120] },
				{ pos: [-298.2, 2.9, 4.6], look: [-300.3, 4.1, -1.5], fov: 48, fog: [0x5a6a8a, 25, 120] },
				{ pos: [302.0, 0.9, -1.74], look: [302.2, 0.85, -2.3], fov: 35 },
			],
		};
	},
};

export const REELS = REELS_B04;
