// Batch 01: reels r17–r27. Same conventions as reels.js: one shared world per reel, far-away vignettes,
// `from`/`until` to keep wide shots from spoiling later frames, six shots from cryptic to obvious.
import { PI, rng, trees, city } from "../kit.js";

void trees;
void city;

/** A triangular prism (gable roof, wedge), base on the group origin, ridge along local z. */
function prism(k, w, h, len, c, o = {}) {
	const g = k.group(o);
	k.cyl(1, 1, len, c, { seg: 3, rx: -PI / 2, y: h / 3, s: [w / 1.732, 1, h / 1.5], parent: g, ...(o.mat ?? {}) });
	return g;
}

/** An unlit, self-coloured material for screens, signs and painted surfaces. */
function flat(k, map, o = {}) {
	return new k.THREE.MeshBasicMaterial({ map, transparent: o.transparent ?? false, side: o.side ?? k.THREE.FrontSide, fog: o.fog ?? true, depthWrite: o.depthWrite ?? true, blending: o.add ? k.THREE.AdditiveBlending : k.THREE.NormalBlending, opacity: o.opacity ?? 1 });
}

/** Finds the person's dressing-gown/coat mesh (so it can be squashed when lying down). */
function coatOf(p) {
	return p.children.find((c) => c.geometry?.parameters?.radiusBottom === 0.45);
}

/** Puffy low-poly cloud. */
function cloud(k, x, y, z, s, o = {}) {
	const g = k.group({ x, y, z, s, ...o });
	const r = rng(Math.floor(Math.abs(x * 13 + z * 7 + y)) + 1);
	const col = o.color ?? 0xffffff;
	for (let i = 0; i < 6; i++) k.ico(1 + r() * 0.9, col, { x: (i - 2.5) * 1.1, y: r() * 0.6, z: (r() - 0.5) * 1.2, detail: 1, emissive: o.emissive ?? 0xb8c0cc, glow: 0.5, parent: g, shadow: false });
	return g;
}

/** A bowl of petunias. */
function petunias(k, o) {
	const g = k.group(o);
	k.cyl(0.62, 0.4, 0.5, 0xe9e4da, { y: 0, parent: g, rough: 0.35, seg: 16 });
	k.torus(0.6, 0.05, 0x3a6ab0, { y: 0.24, rx: PI / 2, parent: g, seg: 24 });
	k.torus(0.5, 0.04, 0x3a6ab0, { y: -0.05, rx: PI / 2, parent: g, seg: 24 });
	k.cyl(0.57, 0.57, 0.05, 0x4a3020, { y: 0.22, parent: g, seg: 16 });
	const r = rng(9);
	const colors = [0xb03aa0, 0xe070c8, 0x8a3ac8, 0xf4e8f4, 0xd8409a];
	for (let i = 0; i < 18; i++) {
		const a = r() * PI * 2;
		const d = Math.sqrt(r()) * 0.45;
		const h = 0.2 + r() * 0.25;
		k.ico(0.09 + r() * 0.05, 0x3a8a3a, { x: Math.cos(a) * d * 1.1, y: 0.28 + r() * 0.1, z: Math.sin(a) * d * 1.1, parent: g, s: [1.6, 0.5, 1] });
		k.cyl(0.015, 0.015, h, 0x3a7a30, { x: Math.cos(a) * d, y: 0.24 + h / 2, z: Math.sin(a) * d, parent: g });
		k.cone(0.13, 0.16, colors[i % colors.length], { x: Math.cos(a) * d, y: 0.27 + h, z: Math.sin(a) * d, rx: PI + (r() - 0.5) * 0.6, rz: (r() - 0.5) * 0.6, seg: 5, parent: g });
		k.sphere(0.03, 0xf8f0a0, { x: Math.cos(a) * d, y: 0.34 + h, z: Math.sin(a) * d, parent: g, seg: 6, rings: 4 });
	}
	return g;
}

/** Rain as falling line streaks inside a box around `o`. */
function rain(k, n, size, o = {}) {
	const r = rng(o.seed ?? 5);
	const len = o.len ?? 0.5;
	const pos = new Float32Array(n * 6);
	for (let i = 0; i < n; i++) {
		const x = (r() - 0.5) * size[0];
		const y = r() * size[1];
		const z = (r() - 0.5) * size[2];
		pos.set([x, y, z, x + (o.slant ?? 0), y - len, z], i * 6);
	}
	const geo = new k.THREE.BufferGeometry();
	geo.setAttribute("position", new k.THREE.BufferAttribute(pos, 3));
	const lines = k.place(new k.THREE.LineSegments(geo, new k.THREE.LineBasicMaterial({ color: o.color ?? 0xc8d8f0, transparent: true, opacity: o.opacity ?? 0.5, depthWrite: false })), { ...o, shadow: false });
	const speed = o.speed ?? 20;
	k.tick((t, dt) => {
		const a = geo.attributes.position.array;
		for (let i = 0; i < n; i++) {
			let y = a[i * 6 + 1] - speed * dt;
			if (y < 0) y += size[1];
			a[i * 6 + 1] = y;
			a[i * 6 + 4] = y - len;
		}
		geo.attributes.position.needsUpdate = true;
	});
	return lines;
}

/** A mirror-like material that reflects a painted sky, for chrome and liquid metal. */
function chrome(k, color = 0xdfe4ea, o = {}) {
	const env = k.canvas(512, 256, (g) => {
		const gr = g.createLinearGradient(0, 0, 0, 256);
		gr.addColorStop(0, o.top ?? "#4a6a9a");
		gr.addColorStop(0.45, o.horizon ?? "#e8f0ff");
		gr.addColorStop(0.52, o.ground ?? "#3a3430");
		gr.addColorStop(1, "#141210");
		g.fillStyle = gr;
		g.fillRect(0, 0, 512, 256);
		g.fillStyle = "rgba(255,255,255,0.9)";
		for (let i = 0; i < 6; i++) g.fillRect(i * 90 + 10, 40 + (i % 2) * 20, 30, 12);
	});
	env.mapping = k.THREE.EquirectangularReflectionMapping;
	return new k.THREE.MeshStandardMaterial({ color, metalness: 1, roughness: o.rough ?? 0.12, envMap: env, flatShading: o.flat ?? false });
}

export const REELS = {
	// ----------------------------------------------------------------------------------------------- the towel
	r17: (k) => {
		k.fog(0xcfdbe6, 70, 450);
		k.sky(0x4f86c6, 0xeaf1f5);
		k.light({ sky: 0xe4eeff, ground: 0x5a6a40, hemi: 1.25, sunPos: [40, 60, 30], sunIntensity: 2.2, shadowSize: 30 });

		// ---- The Horse and Groom: three pints and a bag of peanuts, minutes before the end of the world.
		const pub = k.group({ x: 400, y: 150, z: 0, from: 0, until: 0 });
		const wood = 0x5a3a22;
		k.box(3.2, 0.08, 1.8, 0x6a4428, { y: 0.76, parent: pub, rough: 0.5 });
		[[-1.4, -0.7], [1.4, -0.7], [-1.4, 0.7], [1.4, 0.7]].forEach(([x, z]) => k.box(0.08, 0.76, 0.08, wood, { x, y: 0.38, z, parent: pub }));
		k.box(6, 3.2, 0.1, 0x6a2a20, { y: 1.6, z: -1.6, parent: pub });
		k.box(6, 1.0, 0.14, 0x4a2c18, { y: 0.5, z: -1.55, parent: pub });
		k.box(6, 0.08, 0.2, 0x3a2414, { y: 1.04, z: -1.52, parent: pub });
		for (let i = 0; i < 9; i++) k.box(0.04, 1.0, 0.16, 0x3a2414, { x: -3 + i * 0.75, y: 0.5, z: -1.5, parent: pub });
		k.box(8, 0.05, 8, 0x3a2a24, { y: 0, parent: pub });
		// A framed hunting print and a brass wall lamp.
		k.box(0.9, 0.7, 0.05, 0xc8a050, { x: -1.0, y: 1.9, z: -1.53, parent: pub, metal: 0.6, rough: 0.4 });
		k.box(0.78, 0.58, 0.06, 0x5a6a3a, { x: -1.0, y: 1.9, z: -1.52, parent: pub });
		k.cyl(0.05, 0.05, 0.3, 0xc8a050, { x: 1.1, y: 1.9, z: -1.45, rx: PI / 2, parent: pub, metal: 0.7, rough: 0.3 });
		k.cone(0.16, 0.22, 0xf0d8a0, { x: 1.1, y: 2.0, z: -1.3, parent: pub, emissive: 0xffc070, glow: 0.8, seg: 10 });
		k.glow(0xffc070, 0.9, { x: 1.1, y: 1.95, z: -1.28, parent: pub });
		// Three pints of bitter.
		const glass = new k.THREE.MeshStandardMaterial({ color: 0xe8f0f0, transparent: true, opacity: 0.35, roughness: 0.05 });
		[[-0.35, 0.1, 1], [0.05, -0.15, 0.6], [0.4, 0.15, 0.95]].forEach(([x, z, full]) => {
			k.cyl(0.11, 0.085, 0.4, glass, { x, y: 0.8 + 0.2, z, parent: pub, seg: 16 });
			k.cyl(0.1, 0.08, 0.34 * full, 0xa0561a, { x, y: 0.81 + 0.17 * full, z, parent: pub, seg: 16, rough: 0.2, emissive: 0x3a1404, glow: 0.6 });
			k.cyl(0.103, 0.1, 0.04, 0xf4ead0, { x, y: 0.81 + 0.34 * full + 0.02, z, parent: pub, seg: 16 });
			k.cyl(0.16, 0.16, 0.01, [0xc83030, 0x3050a0, 0xe0c040][Math.round((x + 0.35) * 2.6) % 3], { x, y: 0.805, z, parent: pub, seg: 16 });
		});
		// The peanuts, in a torn packet.
		k.box(0.32, 0.02, 0.22, 0xd83a2a, { x: -0.7, y: 0.81, z: 0.35, ry: 0.4, parent: pub });
		const nr = rng(42);
		for (let i = 0; i < 16; i++) k.sphere(0.022, 0xc89a5a, { x: -0.6 + (nr() - 0.5) * 0.4, y: 0.83, z: 0.3 + (nr() - 0.5) * 0.3, s: [1.4, 0.8, 1], ry: nr() * 6, parent: pub, seg: 6, rings: 4 });
		k.point(0xffc080, 6, 6, { x: 0.8, y: 1.9, z: -0.8, parent: pub });
		k.point(0xffe0b0, 4, 8, { x: -1.5, y: 2.2, z: 2, parent: pub });

		// ---- Earth: the cottage, the mud, the bulldozer, and the fleet overhead.
		const earth = k.group({ from: 1, until: 2 });
		k.ground(600, 0x6f9a4a, { bump: 0.3, seg: 50, parent: earth });
		k.cyl(6, 6.5, 0.7, 0x5e4430, { y: 0, z: 3, s: [1, 1, 1.1], seg: 14, rough: 0.6, parent: earth });
		for (let i = 0; i < 6; i++) k.cyl(0.6 + (i % 3) * 0.3, 0.7 + (i % 3) * 0.3, 0.1, 0x6a5040, { x: Math.sin(i * 2.3) * 3.5, y: 0.36, z: 3 + Math.cos(i * 1.7) * 3, rough: 0.15, metal: 0.3, parent: earth });
		// The cottage.
		k.box(10, 4.2, 6, 0xeee4cc, { y: 2.1, z: -8, parent: earth });
		prism(k, 7, 3.2, 10.8, 0x5a4232, { y: 4.2, z: -8, ry: PI / 2, parent: earth });
		k.box(1.1, 2.6, 1.1, 0x9a5a40, { x: 3, y: 6.4, z: -8.6, parent: earth });
		k.box(1.3, 2.3, 0.1, 0x2a4a7a, { y: 1.15, z: -4.97, parent: earth });
		[-3, 3].forEach((x) => [1.5, 3.2].forEach((y) => {
			if (y > 2 || x < 0 || true) {
				k.box(1.5, 1.1, 0.1, 0xf8f8f8, { x, y, z: -4.97, parent: earth });
				k.box(1.2, 0.85, 0.12, 0x9ab8d0, { x, y, z: -4.96, rough: 0.2, parent: earth });
			}
		}));
		for (let i = -10; i <= 10; i++) if (Math.abs(i) > 1) k.box(0.12, 0.9, 0.08, 0xf4f4f0, { x: i * 0.7, y: 0.45, z: -3.4, parent: earth });
		[-1, 1].forEach((s) => k.box(6.4, 0.08, 0.06, 0xf4f4f0, { x: s * 4.2, y: 0.7, z: -3.4, parent: earth }));
		// The bulldozer, nose to the house.
		const dozer = k.group({ x: 0.6, y: 0, z: 9, ry: PI, parent: earth });
		const yel = 0xf2c020;
		[-1.35, 1.35].forEach((x) => {
			k.box(0.8, 1.1, 4.2, 0x2a2a2a, { x, y: 0.55, parent: dozer });
			for (let i = 0; i < 4; i++) k.cyl(0.38, 0.38, 0.82, 0x555555, { x, y: 0.45, z: -1.5 + i, rz: PI / 2, parent: dozer });
		});
		k.box(2.2, 1.4, 3.6, yel, { y: 1.6, parent: dozer });
		k.box(1.9, 1.7, 1.7, yel, { y: 3.15, z: -0.8, parent: dozer });
		k.box(1.7, 1.0, 1.72, 0x8ab0c8, { y: 3.3, z: -0.8, rough: 0.2, parent: dozer });
		k.box(2.1, 0.15, 1.9, yel, { y: 4.05, z: -0.8, parent: dozer });
		k.cyl(0.1, 0.1, 1.4, 0x333333, { x: 0.6, y: 3, z: 1.2, parent: dozer });
		[-1.15, 1.15].forEach((x) => k.box(0.2, 0.3, 1.6, yel, { x, y: 1.1, z: 2.3, rx: 0.2, parent: dozer }));
		k.box(4, 1.6, 0.3, yel, { y: 0.9, z: 3.2, rx: -0.15, parent: dozer });
		k.box(4, 0.15, 0.4, 0x777777, { y: 0.12, z: 3.35, parent: dozer });
		k.person({ x: 0, y: 2.3, z: -0.8, s: 0.9, pose: "sit", hat: 0xf8f8f8, colors: { shirt: 0xf07a20, legs: 0x2a3a5a }, parent: dozer });
		// Arthur, lying in the mud in his dressing gown.
		const arthur = k.person({ x: 0.2, y: 0.62, z: 4.4, rx: -PI / 2, ry: 0.1, coat: 0x9a5236, sleeves: 0x9a5236, colors: { shirt: 0x8aa4c8, legs: 0x8aa4c8, hair: 0x5a3a20, skin: 0xe8c0a0 }, parent: earth });
		coatOf(arthur).scale.z = 0.55;
		arthur.userData.limbs.armL.rotation.z = -0.5;
		arthur.userData.limbs.armR.rotation.z = 0.5;
		// Hedges and trees.
		const tr = rng(4);
		for (let i = 0; i < 40; i++) {
			const a = tr() * PI * 2;
			const d = 30 + tr() * 120;
			const h = 6 + tr() * 6;
			k.cyl(0.3, 0.45, h * 0.5, 0x4a3424, { x: Math.cos(a) * d, y: h * 0.25, z: Math.sin(a) * d, parent: earth });
			k.ico(h * 0.35, 0x3f6a32, { x: Math.cos(a) * d, y: h * 0.65, z: Math.sin(a) * d, detail: 0, parent: earth });
		}
		for (let i = 0; i < 8; i++) k.box(3, 1.4, 1.4, 0x3f6a32, { x: -14 + (i % 4) * 3.2, y: 0.7, z: i < 4 ? -14 : 12, parent: earth });
		// The Vogon constructor fleet.
		const vogon = (x, y, z, s, ry) => {
			const g = k.group({ x, y, z, s, ry, parent: earth, from: 2 });
			const c = 0xc8b05a;
			const d = 0x8f7e48;
			k.box(60, 12, 26, c, { parent: g, shadow: false });
			k.box(44, 8, 20, d, { y: -9, parent: g, shadow: false });
			k.box(22, 10, 34, c, { x: 18, y: 5, parent: g, shadow: false });
			k.box(14, 20, 14, d, { x: -20, y: 12, parent: g, shadow: false });
			k.box(8, 6, 40, d, { x: -4, y: 2, parent: g, shadow: false });
			for (let i = 0; i < 6; i++) k.box(4, 6, 4, d, { x: -25 + i * 10, y: -15, z: 6, parent: g, shadow: false });
			for (let i = 0; i < 5; i++) k.glow(0xffe8a0, 5, { x: -24 + i * 12, y: -13, z: -6, parent: g, fog: true });
		};
		vogon(20, 120, -120, 1.4, 0.3);
		vogon(-70, 150, -190, 1.6, -0.2);
		vogon(90, 170, -240, 1.6, 0.5);
		vogon(-20, 210, -300, 2, 0.1);
		vogon(40, 95, -60, 1, 0.6);
		vogon(-60, 110, -70, 1.2, -0.4);
		vogon(140, 130, -120, 1.5, 0.2);
		vogon(-140, 180, -150, 1.8, 0.4);

		// ---- Magrathea: the whale and the petunias, falling.
		const mag = k.group({ x: -400, y: 0, z: 0, from: 3, until: 3 });
		k.sky(0x5a4a90, 0xf6b88e, { r: 320, tag: "magsky", parent: mag, offset: -0.05 });
		k.ground(500, 0xc98a72, { bump: 1.8, seg: 50, parent: mag, height: (x, z) => (Math.hypot(x, z + 80) > 160 ? 0 : 0) + Math.max(0, Math.abs(z + 120) - 60) * 0.25 });
		const mr = rng(42);
		for (let i = 0; i < 26; i++) k.ico(1.5 + mr() * 5, 0x9a5a5a, { x: (mr() - 0.5) * 200, y: 0.5, z: -20 - mr() * 150, ry: mr() * 6, s: [1, 0.6 + mr(), 1], parent: mag });
		k.disc(0xfff2e0, 18, { x: -90, y: 70, z: -240, parent: mag });
		k.glow(0xffc8a0, 80, { x: -90, y: 70, z: -238, parent: mag });
		k.disc(0xb8a0d0, 40, { x: 120, y: 110, z: -260, parent: mag });
		const whale = k.group({ x: 0, y: 34, z: 0, rz: -0.55, ry: 0.35, parent: mag });
		const wc = 0x56657e;
		k.capsule(3.1, 11, wc, { rz: PI / 2, x: -1, parent: whale, seg: 12 });
		k.box(8, 6.6, 6, wc, { x: 7, y: 0.2, parent: whale });
		k.box(7, 0.7, 1.4, 0xd8dce4, { x: 6.5, y: -3.3, rz: 0.06, parent: whale });
		k.box(10, 1.2, 4.4, 0x8a98ac, { x: 0, y: -2.7, parent: whale });
		k.cone(2.8, 9, wc, { rz: PI / 2, x: -11.5, parent: whale, seg: 10 });
		k.box(2.4, 0.5, 10, wc, { x: -16.5, parent: whale });
		[-1, 1].forEach((s) => {
			k.sphere(0.4, 0x111111, { x: 5, y: -1.2, z: s * 3, parent: whale });
			k.box(2.6, 0.4, 1.4, wc, { x: 3, y: -2.6, z: s * 3.4, ry: s * 0.6, rz: -0.4, parent: whale });
		});
		k.tick((t) => {
			whale.rotation.z = -0.55 + Math.sin(t * 0.8) * 0.06;
			whale.position.y = 34 + Math.sin(t * 0.5) * 0.6;
		});
		petunias(k, { x: 16, y: 44, z: 8, s: 2.2, rz: -0.6, rx: 0.4, parent: mag });
		// The Heart of Gold, hanging in the sky.
		const hog = k.group({ x: 45, y: 62, z: -60, ry: 0.5, rz: 0.15, parent: mag });
		k.sphere(9, 0xf8f8fa, { s: [2, 0.8, 1], parent: hog, seg: 24, rough: 0.2, flat: false, emissive: 0x6a6a70, glow: 0.4 });
		k.sphere(6, 0xf8f8fa, { x: 9, y: 3, s: [1.2, 1, 1], parent: hog, seg: 20, rough: 0.2, flat: false, emissive: 0x6a6a70, glow: 0.4 });
		k.torus(11, 0.6, 0xd8c060, { rx: PI / 2, s: [1.6, 0.9, 1], parent: hog, metal: 0.8, rough: 0.3 });
		k.glow(0x9ad8ff, 10, { x: -18, parent: hog });

		// ---- Deep Thought and its answer.
		const dt = k.group({ x: 0, y: 0, z: 400, from: 4, until: 4 });
		k.box(140, 1, 140, 0x3a3450, { y: -0.5, parent: dt });
		const tex42 = k.canvas(512, 320, (g, w, h) => {
			g.fillStyle = "#06201a";
			g.fillRect(0, 0, w, h);
			g.strokeStyle = "rgba(120,255,200,0.15)";
			for (let y = 0; y < h; y += 6) {
				g.beginPath();
				g.moveTo(0, y);
				g.lineTo(w, y);
				g.stroke();
			}
			g.font = "bold 250px Georgia, serif";
			g.textAlign = "center";
			g.textBaseline = "middle";
			g.shadowColor = "#60ffc0";
			g.shadowBlur = 40;
			g.fillStyle = "#d8fff0";
			g.fillText("42", w / 2, h / 2 + 12);
		});
		const mc = 0x6a6680;
		k.box(48, 4, 18, 0x4a4660, { y: 2, z: -30, parent: dt });
		k.box(40, 4, 14, 0x524e6a, { y: 6, z: -31, parent: dt });
		k.box(30, 44, 10, mc, { y: 30, z: -33, parent: dt, metal: 0.3, rough: 0.5 });
		[-1, 1].forEach((s) => {
			k.box(6, 52, 12, 0x58546e, { x: s * 18, y: 26, z: -32, parent: dt, metal: 0.3 });
			k.sphere(4, 0x7a7690, { x: s * 18, y: 53, z: -32, parent: dt });
			for (let i = 0; i < 7; i++) k.glow(i % 2 ? 0x80ffc8 : 0xffd080, 1.6, { x: s * 18, y: 10 + i * 6, z: -25.8, parent: dt });
		});
		k.sphere(15, mc, { y: 52, z: -33, s: [1, 0.6, 0.7], parent: dt, metal: 0.3, rough: 0.5 });
		k.box(22, 14, 0.6, 0x1a1a24, { y: 30, z: -27.8, parent: dt });
		k.plane(20, 12.5, flat(k, tex42), { y: 30, z: -27.45, parent: dt });
		k.glow(0x60ffc0, 40, { y: 30, z: -26, parent: dt, opacity: 0.35 });
		k.point(0x80ffd0, 30, 70, { y: 28, z: -16, parent: dt });
		k.point(0xffd8a0, 20, 90, { x: 20, y: 30, z: 20, parent: dt });
		k.spot(0xfff0d8, 80, { x: 0, y: 60, z: 10, target: [0, 0, 400 - 10], angle: 0.6, distance: 120 });
		// Columns, and the crowd waiting for the answer.
		for (let i = 0; i < 6; i++) [-1, 1].forEach((s) => k.cyl(1.6, 1.8, 40, 0x48445e, { x: s * 34, y: 20, z: -20 + i * 14, parent: dt, seg: 8 }));
		k.person({ x: -1.2, y: 7.5, z: -23, ry: PI, s: 1.1, coat: 0xe8e0c8, colors: { shirt: 0xe8e0c8, legs: 0xe8e0c8, hair: 0x6a6a6a }, sleeves: 0xe8e0c8, parent: dt });
		k.person({ x: 1.2, y: 7.5, z: -23, ry: PI, s: 1.1, coat: 0xd8c8a8, colors: { shirt: 0xd8c8a8, legs: 0xd8c8a8, hair: 0x3a2a1a }, sleeves: 0xd8c8a8, parent: dt });
		const pr = rng(3);
		for (let i = 0; i < 40; i++) {
			const robe = [0xc8b890, 0x9a8ab0, 0xb0a080, 0x8aa0b0][i % 4];
			k.person({ x: -16 + (i % 10) * 3.4 + pr() * 0.8, y: 0, z: -8 + Math.floor(i / 10) * 3 + pr(), ry: PI + (pr() - 0.5) * 0.4, coat: robe, sleeves: robe, colors: { shirt: robe, legs: robe, hair: 0x2a2a2a }, parent: dt });
		}

		// ---- Aboard the Heart of Gold: the Guide, a towel, and a very depressed robot.
		const ship = k.group({ x: 0, y: 0, z: -400, from: 5, until: 5 });
		k.cyl(16, 16, 0.4, 0xf0f2f4, { y: -0.2, seg: 40, parent: ship });
		k.cyl(16, 16, 10, 0xeef2f6, { y: 5, seg: 40, open: true, side: k.THREE.DoubleSide, parent: ship });
		k.cyl(16, 16, 0.3, 0xe8ecf0, { y: 10, seg: 40, parent: ship });
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * PI * 2;
			k.box(0.5, 9, 0.5, 0xd8dee6, { x: Math.cos(a) * 15.5, y: 4.5, z: Math.sin(a) * 15.5, ry: -a, parent: ship });
		}
		k.torus(8, 0.15, 0xffffff, { y: 9.7, rx: PI / 2, emissive: 0xc8e8ff, glow: 1, parent: ship, seg: 48 });
		k.point(0xf0f8ff, 20, 40, { y: 8, parent: ship });
		k.point(0xfff4e8, 10, 12, { x: -1, y: 3.5, z: 4, parent: ship });
		// The console.
		k.box(3.2, 1.1, 1.2, 0xe2e6ec, { y: 0.55, z: 1.6, parent: ship, rough: 0.3 });
		k.box(3.3, 0.08, 1.3, 0xb8c4d4, { y: 1.12, z: 1.6, parent: ship, metal: 0.6, rough: 0.3 });
		for (let i = 0; i < 6; i++) k.sphere(0.05, [0xff5050, 0x50ff90, 0x50a0ff][i % 3], { x: 0.9 + (i % 3) * 0.18, y: 1.18, z: 1.3 + Math.floor(i / 3) * 0.2, emissive: [0xff2020, 0x20ff60, 0x2060ff][i % 3], glow: 0.8, parent: ship });
		const panic = k.canvas(512, 340, (g, w, h) => {
			g.fillStyle = "#0c2a18";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#1c4a2a";
			g.fillRect(14, 14, w - 28, h - 28);
			g.font = "bold 150px 'Arial Rounded MT Bold', 'Comic Sans MS', 'Trebuchet MS', sans-serif";
			g.textAlign = "center";
			g.textBaseline = "middle";
			g.fillStyle = "#ff8ac8";
			g.shadowColor = "#200010";
			g.shadowBlur = 8;
			g.fillText("DON'T", w / 2, h * 0.3);
			g.fillText("PANIC", w / 2, h * 0.72);
		});
		const guide = k.group({ x: -0.35, y: 1.16, z: 1.75, rx: -0.4, ry: 0.15, parent: ship });
		k.box(1.0, 0.7, 0.07, 0x7a1e22, { y: 0.35, parent: guide, rough: 0.5 });
		k.plane(0.86, 0.57, flat(k, panic), { y: 0.36, z: 0.04, parent: guide });
		k.box(0.3, 0.05, 0.3, 0x5a1418, { y: 0.02, z: -0.15, parent: guide });
		// The towel.
		const towelTex = k.canvas(128, 256, (g, w, h) => {
			g.fillStyle = "#f4e2b0";
			g.fillRect(0, 0, w, h);
			g.fillStyle = "#d07030";
			[30, 50, 200, 220].forEach((y) => g.fillRect(0, y, w, 10));
			g.fillStyle = "#3a6ab0";
			[40, 210].forEach((y) => g.fillRect(0, y, w, 6));
		});
		const towel = k.mat(0xffffff, { map: towelTex, rough: 1 });
		k.box(0.75, 0.05, 1.0, towel, { x: 0.7, y: 1.18, z: 1.6, parent: ship });
		k.box(0.75, 0.75, 0.05, towel, { x: 0.7, y: 0.8, z: 2.24, parent: ship });
		// Marvin.
		const marvin = k.group({ x: 2.45, y: 0, z: 1.7, ry: -0.85, parent: ship });
		const mw = 0xe8eaee;
		[-0.16, 0.16].forEach((x) => k.cyl(0.07, 0.06, 0.8, 0xc8ccd2, { x, y: 0.4, parent: marvin, metal: 0.5, rough: 0.3 }));
		k.capsule(0.24, 0.45, mw, { y: 1.05, parent: marvin, rough: 0.25, flat: false });
		[-1, 1].forEach((s) => {
			k.cyl(0.05, 0.04, 0.95, 0xc8ccd2, { x: s * 0.3, y: 0.85, z: 0.08, rz: s * 0.08, rx: 0.15, parent: marvin, metal: 0.5 });
			k.sphere(0.07, 0xc8ccd2, { x: s * 0.33, y: 0.38, z: 0.15, parent: marvin });
		});
		const mhead = k.group({ y: 1.85, z: 0.12, rx: 0.45, parent: marvin });
		k.sphere(0.55, mw, { s: [1, 0.95, 1], parent: mhead, rough: 0.2, flat: false, seg: 24, rings: 16 });
		k.sphere(0.4, 0x14161c, { z: 0.34, y: 0, s: [1.15, 0.85, 0.6], parent: mhead, rough: 0.1, metal: 0.4, flat: false });
		[-0.15, 0.15].forEach((x) => k.sphere(0.055, 0xa8c8e0, { x, y: 0.04, z: 0.58, emissive: 0x4a7aa0, glow: 0.8, parent: mhead }));
		k.tick((t) => (mhead.rotation.x = 0.45 + Math.sin(t * 0.4) * 0.05));
		return {
			shots: [
				{ pos: [400.7, 151.25, 1.35], look: [399.85, 150.92, 0.05], fov: 42, fog: [0x2a1810, 6, 20], exposure: 1.2 },
				{ pos: [6, 2.8, 0.8], look: [0, 1.0, 5], fov: 45 },

				{ pos: [-4, 1.6, 18], look: [8, 48, -60], fov: 55 },
				{ pos: [-384, 18, 36], look: [-398, 28, 0], fov: 55, fog: [0xe8ae8e, 80, 420], hide: ["sky"] },
				{ pos: [0, 8, 420], look: [0, 21, 368], fov: 50, fog: [0x241c3a, 40, 200], exposure: 1.25 },
				{ pos: [-0.3, 1.95, -395.8], look: [0.8, 1.35, -398.6], fov: 50, fog: [0xe6ecf2, 20, 120] },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the egg
	r18: (k) => {
		k.fog(0x5e564a, 20, 220);
		k.sky(0x2a2c34, 0x8a7a62, { offset: -0.05 });
		k.light({ sky: 0xc8c0b0, ground: 0x2a241c, hemi: 1.3, sunColor: 0xffd0a0, sunIntensity: 1.2, sunPos: [-40, 30, 30], shadowSize: 30 });
		const suit = (o) => {
			const p = k.person({ hair: false, colors: { shirt: 0xd8d4c8, legs: 0xc8c4b8, skin: 0xd8b090, shoes: 0x4a4a4a }, ...o });
			k.sphere(0.3, 0xe8e4d8, { y: 1.78, s: [1, 1.05, 1.05], parent: p, rough: 0.3 });
			k.box(0.42, 0.5, 0.22, 0x8a8a80, { y: 1.25, z: -0.24, parent: p });
			k.glow(0xfff0c0, 0.5, { x: 0.12, y: 1.95, z: 0.25, parent: p });
			return p;
		};

		// ---- Deep space: the tug and its refinery.
		const space = k.group({ y: 400, from: 1, until: 1 });
		k.stars(1800, { y: 400, upper: false, r: 600, parent: undefined, from: 1, until: 1 });
		k.point(0xfff0e0, 6, 400, { x: 80, y: 40, z: 60, parent: space, decay: 0.5 });
		k.sphere(70, 0x8a6a4a, { x: 120, y: -90, z: -260, seg: 32, rings: 24, parent: space });
		k.torus(110, 6, 0xb89a70, { x: 120, y: -90, z: -260, rx: 1.3, s: [1, 1, 0.1], parent: space, seg: 64, opacity: 0.6 });
		const tug = k.group({ x: 0, y: 2, z: 0, ry: -0.5, parent: space });
		const hull = 0x5a5c5e;
		k.box(6, 3.2, 12, hull, { parent: tug, metal: 0.5, rough: 0.6 });
		k.box(4, 2.4, 5, 0x4a4c4e, { y: 2.6, z: 1.5, parent: tug, metal: 0.5 });
		k.box(2.6, 1.2, 2.2, 0x6a6c6e, { y: 4.3, z: 2.6, parent: tug, metal: 0.5 });
		k.box(1.8, 0.4, 0.1, 0xffd890, { y: 4.4, z: 3.72, emissive: 0xffc060, glow: 1, parent: tug });
		k.box(7.6, 1.2, 4, hull, { y: -1, z: -3, parent: tug });
		[-2.4, 0, 2.4].forEach((x, i) => {
			k.cyl(1.1, 1.3, 2.4, 0x3a3c3e, { x, y: i === 1 ? 1 : -0.4, z: -7, rx: PI / 2, parent: tug, metal: 0.6 });
			k.glow(0x8ac8ff, 3, { x, y: i === 1 ? 1 : -0.4, z: -8.4, parent: tug });
		});
		const gr = rng(26);
		for (let i = 0; i < 40; i++) k.box(0.4 + gr() * 1.2, 0.3 + gr() * 0.8, 0.4 + gr() * 1.5, [0x6a6c6e, 0x4a4c4e, 0x7a7466][i % 3], { x: (gr() - 0.5) * 6, y: 1.6 + gr() * 0.5, z: (gr() - 0.5) * 11, parent: tug, metal: 0.4 });
		for (let i = 0; i < 12; i++) k.glow(0xffd8a0, 0.4, { x: 3.05, y: (gr() - 0.5) * 2.4, z: (gr() - 0.5) * 10, parent: tug });
		// The refinery, hanging below like an upside-down cathedral.
		const ref = k.group({ x: -14, y: -14, z: -30, ry: -0.5, parent: space });
		k.box(40, 5, 24, 0x3a3836, { parent: ref, metal: 0.4 });
		for (let i = 0; i < 46; i++) {
			const h = 6 + gr() * 22;
			const x = (gr() - 0.5) * 38;
			const z = (gr() - 0.5) * 22;
			k.cone(0.6 + gr() * 1.6, h, [0x4a4642, 0x3a3634, 0x5a5650][i % 3], { x, y: -2.5 - h / 2, z, rx: PI, seg: 4 + (i % 3), parent: ref, metal: 0.3 });
			if (i % 3 === 0) k.glow(0xffb070, 1.2, { x, y: -2.5 - h * 0.4, z: z + 0.8, parent: ref });
		}
		for (let i = 0; i < 16; i++) k.box(1.5 + gr() * 3, 3 + gr() * 6, 1.5 + gr() * 3, 0x4a4642, { x: (gr() - 0.5) * 36, y: 3 + gr() * 3, z: (gr() - 0.5) * 20, parent: ref });

		// ---- The bridge, before anyone wakes: a dipping bird nods over the consoles.
		const bridge = k.group({ z: 300, from: 0, until: 0 });
		k.box(10, 0.2, 8, 0x3a3c3a, { y: -0.1, parent: bridge });
		k.box(5, 0.9, 1.4, 0x5a5c56, { y: 0.45, z: -1, parent: bridge, metal: 0.3, rough: 0.6 });
		k.box(5, 0.9, 0.12, 0x6a6c64, { y: 1.3, z: -1.65, rx: -0.5, parent: bridge, metal: 0.3 });
		k.box(5, 2.6, 0.2, 0xd8d4c4, { y: 1.3, z: -2.2, parent: bridge });
		for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) k.box(0.42, 0.5, 0.08, 0xc8c4b4, { x: -2.25 + i * 0.5, y: 1.5 + j * 0.56 - 0.3, z: -2.08, parent: bridge, rough: 0.9 });
		const crt = k.canvas(256, 192, (g) => {
			g.fillStyle = "#04140a";
			g.fillRect(0, 0, 256, 192);
			g.strokeStyle = "#5aff8a";
			g.lineWidth = 2;
			for (let i = 0; i < 8; i++) {
				g.beginPath();
				g.moveTo(0, 96 + i * 12);
				g.lineTo(256, 96 + i * 12);
				g.stroke();
			}
			for (let i = -6; i <= 6; i++) {
				g.beginPath();
				g.moveTo(128 + i * 8, 96);
				g.lineTo(128 + i * 40, 192);
				g.stroke();
			}
			g.fillStyle = "#5aff8a";
			g.font = "bold 16px monospace";
			g.fillText("ATTN: 0457 . 2213", 16, 28);
			g.fillText("MU-TH-UR LINK ...", 16, 52);
		});
		[-1.6, 1.4].forEach((x) => {
			k.box(0.9, 0.7, 0.6, 0x3a3c38, { x, y: 1.25, z: -1.4, rx: -0.2, parent: bridge });
			k.plane(0.7, 0.52, flat(k, crt), { x, y: 1.28, z: -1.09, rx: -0.2, parent: bridge });
			k.glow(0x5aff8a, 1.2, { x, y: 1.28, z: -1.0, parent: bridge, opacity: 0.25 });
		});
		const br = rng(44);
		for (let i = 0; i < 90; i++) {
			const c = [0xff4a3a, 0x4aff7a, 0xffd04a, 0xf0f0e0, 0x4ab0ff][i % 5];
			const x = -2.2 + (i % 30) * 0.15;
			if (Math.abs(x - 0.1) < 0.2) continue;
			k.box(0.05, 0.025, 0.05, c, { x, y: 0.912, z: -0.35 - Math.floor(i / 30) * 0.16, parent: bridge, emissive: c, glow: br() > 0.4 ? 0.8 : 0.1 });
		}
		// The dipping bird and its water glass.
		const bird = k.group({ x: 0.1, y: 0.9, z: -0.6, ry: 0.5, parent: bridge });
		[-0.07, 0.07].forEach((x) => k.cyl(0.008, 0.012, 0.32, 0x6a7a9a, { x, y: 0.16, rz: x * 0.6, parent: bird, metal: 0.6 }));
		k.box(0.2, 0.02, 0.12, 0x6a7a9a, { y: 0.01, parent: bird, metal: 0.6 });
		const nod = k.group({ y: 0.3, parent: bird });
		const bglass = new k.THREE.MeshStandardMaterial({ color: 0xd8e8f0, transparent: true, opacity: 0.4, roughness: 0.05 });
		k.cyl(0.012, 0.012, 0.42, bglass, { y: -0.02, parent: nod });
		k.sphere(0.06, 0xd0303a, { y: -0.2, parent: nod, rough: 0.15, flat: false, emissive: 0x401010 });
		k.sphere(0.055, 0xc83038, { y: 0.21, parent: nod, rough: 0.6 });
		k.cone(0.012, 0.08, 0x2a2a2a, { y: 0.2, z: 0.07, rx: PI / 2, parent: nod, seg: 6 });
		k.cyl(0.06, 0.06, 0.008, 0x1a1a24, { y: 0.255, parent: nod, seg: 14 });
		k.cyl(0.035, 0.04, 0.07, 0x1a1a24, { y: 0.29, parent: nod, seg: 14 });
		k.tick((t) => (nod.rotation.x = 0.2 + Math.max(0, Math.sin(t * 0.9)) ** 3 * 1.2));
		k.cyl(0.045, 0.04, 0.12, bglass, { x: 0.1, y: 0.96, z: -0.37, parent: bridge, seg: 14 });
		k.cyl(0.04, 0.035, 0.08, 0x9ac0d8, { x: 0.1, y: 0.94, z: -0.37, parent: bridge, seg: 14, opacity: 0.6 });
		k.point(0xfff4e0, 6, 8, { x: 1.2, y: 2.6, z: 1.2, parent: bridge });
		k.point(0x9affb0, 2, 4, { x: -1, y: 1.4, z: -0.6, parent: bridge });

		// ---- Inside the derelict: the pilot in his chair.
		const jock = k.group({ x: 300, from: 2, until: 2 });
		k.cyl(16, 16, 0.4, 0x3a3e38, { y: -0.2, seg: 24, parent: jock });
		for (let i = 0; i < 9; i++) k.torus(14, 0.9, 0x4e5448, { z: -16 + i * 4, arc: PI, parent: jock, seg: 20, rseg: 6 });
		for (let i = 0; i < 9; i++) k.torus(14, 0.4, 0x3a4038, { z: -14 + i * 4, arc: PI, parent: jock, seg: 20, rseg: 6 });
		k.cyl(3.4, 4.2, 2.4, 0x5a6052, { y: 1.2, parent: jock, seg: 12 });
		const chair = k.group({ y: 2.4, rx: -0.75, parent: jock });
		const bone = 0x8a8a74;
		k.cyl(1.5, 1.8, 6, bone, { y: 3, parent: chair, seg: 12 });
		for (let i = 0; i < 6; i++) k.torus(1.6 + i * 0.03, 0.12, 0x6a6a58, { y: 0.6 + i * 0.9, rx: PI / 2, parent: chair, seg: 16 });
		k.cyl(0.9, 1.4, 9, bone, { y: 9.5, parent: chair, seg: 10 });
		k.cyl(0.95, 0.95, 0.5, 0x6a6a58, { y: 14, parent: chair, seg: 10 });
		const pilot = k.group({ x: 0, y: 1.4, z: 2.2, rx: 0.75, parent: chair });
		k.capsule(1.2, 2.2, 0xa0a088, { y: 2, rx: -0.5, parent: pilot });
		k.sphere(0.9, 0x1a1810, { y: 2.4, z: 1.1, parent: pilot });
		for (let i = 0; i < 4; i++) k.torus(0.9 - i * 0.05, 0.08, 0xb8b8a0, { y: 1.6 + i * 0.35, z: 0.8, arc: PI, rz: 0, ry: PI / 2, parent: pilot });
		k.sphere(1, 0xa0a088, { y: 4.3, z: -0.3, s: [1, 1.1, 1.2], parent: pilot });
		k.cone(0.5, 2.6, 0x8a8a74, { y: 3.4, z: 1.1, rx: 2.4, parent: pilot, seg: 8 });
		k.torus(0.4, 0.15, 0x6a6a58, { y: 2.4, z: 1.9, rx: 0.6, parent: pilot });
		[-1, 1].forEach((s) => k.capsule(0.4, 2.2, 0xa0a088, { x: s * 1.5, y: 2.3, z: 0.4, rz: s * 0.4, parent: pilot }));
		[[-3, 7], [-1.6, 8], [3, 7.5]].forEach(([x, z], i) => suit({ x, z, ry: PI - (i - 1) * 0.3, parent: jock }));
		k.spot(0xd8f0d0, 50, { x: 300, y: 3, z: 9, target: [300, 6, 0], angle: 0.55, distance: 40 });
		k.point(0x9ab8a0, 30, 40, { x: -6, y: 10, z: 6, parent: jock });
		k.point(0x9ab8a0, 20, 40, { x: 8, y: 6, z: -6, parent: jock });

		// ---- The egg chamber, under the blue mist.
		const eggs = k.group({ x: 300, z: 140, from: 3, until: 3 });
		k.ground(60, 0x3a3a30, { bump: 0.4, parent: eggs });
		const prof = [[0, 0], [0.3, 0.02], [0.42, 0.2], [0.55, 0.6], [0.6, 0.95], [0.55, 1.3], [0.42, 1.55], [0.3, 1.66], [0, 1.68]].map(([x, y]) => new k.THREE.Vector2(x, y));
		const eggGeo = new k.THREE.LatheGeometry(prof, 12);
		const eggMat = k.mat(0x6a6650, { rough: 0.6 });
		const egg = (x, z, s, open) => {
			const g = k.group({ x, z, s, ry: x * 3, parent: eggs });
			k.mesh(eggGeo, eggMat, { parent: g });
			if (open) {
				for (let i = 0; i < 4; i++) {
					const a = (i * PI) / 2 + PI / 4;
					k.ico(0.26, 0x8a7a58, { x: Math.cos(a) * 0.3, y: 1.66, z: Math.sin(a) * 0.3, ry: -a, rz: 0.9, s: [0.45, 0.22, 1], parent: g });
				}
				k.cyl(0.26, 0.26, 0.05, 0xc8d0a0, { y: 1.6, parent: g, emissive: 0x8a9a50, glow: 0.8 });
				for (let i = 0; i < 4; i++) k.capsule(0.03, 0.16, 0xd8c8a0, { x: Math.cos(i * 1.6) * 0.14, y: 1.72, z: Math.sin(i * 1.6) * 0.14, rz: Math.cos(i * 1.6) * 0.4, rx: -Math.sin(i * 1.6) * 0.4, parent: g });
				k.glow(0xc8ffb0, 1.2, { y: 1.7, parent: g, opacity: 0.5 });
			} else {
				k.box(0.4, 0.04, 0.04, 0x3a3020, { y: 1.67, parent: g });
				k.box(0.04, 0.04, 0.4, 0x3a3020, { y: 1.67, parent: g });
			}
		};
		egg(0, 0, 1.2, true);
		const er = rng(31);
		for (let i = 0; i < 70; i++) {
			const x = (er() - 0.5) * 34;
			const z = -er() * 30 + 4;
			if (Math.hypot(x, z) < 2.5) continue;
			egg(x, z, 0.9 + er() * 0.3, false);
		}
		const laser = new k.THREE.MeshBasicMaterial({ color: 0x3a8aff, transparent: true, opacity: 0.35, side: k.THREE.DoubleSide, blending: k.THREE.AdditiveBlending, depthWrite: false });
		k.plane(80, 80, laser, { y: 2.3, rx: -PI / 2, parent: eggs });
		k.particles(600, 0x9ac8ff, { x: 300, z: 140, box: [30, 2.3, 30], speed: 0.2, drift: 0.4, size: 0.06, opacity: 0.5, from: 3, until: 3 });
		suit({ x: -1.4, z: -0.6, ry: 1.2, pose: "hunch", parent: eggs });
		k.point(0x4a8aff, 30, 30, { y: 6, parent: eggs });
		k.spot(0xfff0d0, 8, { x: 299.4, y: 2.8, z: 141.8,
 target: [300, 1.4, 140], angle: 0.5, distance: 10 });

		// ---- The mess: dinner goes badly.
		const mess = k.group({ x: -300, from: 4, until: 4 });
		k.box(14, 0.2, 12, 0xd0d4d0, { y: -0.1, parent: mess });
		k.box(14, 4, 0.2, 0xe8ece8, { y: 2, z: -6, parent: mess });
		[-7, 7].forEach((x) => k.box(0.2, 4, 12, 0xe0e4e0, { x, y: 2, parent: mess }));
		k.box(14, 0.2, 12, 0xd8dcd8, { y: 4, parent: mess });
		for (let i = 0; i < 3; i++) k.box(3, 0.05, 1.2, 0xffffff, { x: -4 + i * 4, y: 3.88, emissive: 0xffffff, glow: 1, parent: mess });
		k.point(0xf4fff8, 18, 20, { y: 3.4, parent: mess });
		k.point(0xfff8f0, 10, 12, { x: 3, y: 2.6, z: 3, parent: mess });
		k.box(2.2, 0.12, 6, 0xf4f4f0, { y: 1.0, parent: mess });
		k.cyl(0.3, 0.4, 0.95, 0xd8d8d4, { y: 0.47, z: 1.8, parent: mess });
		k.cyl(0.3, 0.4, 0.95, 0xd8d8d4, { y: 0.47, z: -1.8, parent: mess });
		const kane = k.person({ x: 0, y: 1.2, z: 1.2, rx: -PI / 2, pose: "arms-out", colors: { shirt: 0x8a9a96, legs: 0x8a9a96, skin: 0xe0b898, hair: 0x2a1c14 }, parent: mess });
		kane.userData.limbs.armL.rotation.z = -0.4;
		kane.userData.limbs.armR.rotation.z = 0.4;
		const blood = 0x9a0a0a;
		k.sphere(0.35, blood, { y: 1.34, z: 0, s: [1, 0.15, 1.2], parent: mess, rough: 0.2 });
		k.sphere(0.5, blood, { x: 0.3, y: 1.08, z: 0.4, s: [1, 0.05, 1.4], parent: mess, rough: 0.2 });
		for (let i = 0; i < 12; i++) k.sphere(0.04 + (i % 3) * 0.02, blood, { x: Math.sin(i * 2.1) * 0.9, y: 1.07, z: Math.cos(i * 1.3) * 1.6, s: [1, 0.3, 1], parent: mess });
		const burst = k.group({ y: 1.4, z: 0, parent: mess });
		k.capsule(0.1, 0.45, 0xb8a888, { y: 0.25, rx: 0.2, parent: burst, flat: false, rough: 0.3 });
		const bh = k.group({ y: 0.6, z: 0.08, rx: -0.6, parent: burst });
		k.capsule(0.11, 0.3, 0xc8b898, { rx: -1.2, z: -0.05, parent: bh, flat: false, rough: 0.3 });
		for (let i = 0; i < 5; i++) [-1, 1].forEach((s) => k.cone(0.012, 0.05, 0xffffff, { x: s * 0.04, y: -0.05, z: 0.14 - i * 0.025, rx: PI, parent: bh, seg: 4 }));
		k.tick((t) => {
			burst.rotation.z = Math.sin(t * 3) * 0.12;
			bh.rotation.y = Math.sin(t * 2.2) * 0.3;
		});
		[[0x1a6ad0, 0.3, -1.4], [0xf2c230, -0.4, 1.8], [0xd83a2a, 0.5, 2.4]].forEach(([c, x, z]) => k.box(0.25, 0.4, 0.12, c, { x, y: 1.26, z, ry: x, parent: mess }));
		for (let i = 0; i < 5; i++) k.cyl(0.06, 0.05, 0.14, 0xf0f0f0, { x: (i % 2 ? 0.8 : -0.8), y: 1.13, z: -2 + i, parent: mess });
		const crew = [
			[-1.8, 0.8, 1.6, 0x8a9a96, 0x3a2a1a, "raise"],
			[1.7, 1.2, -1.6, 0xe8e4dc, 0x6a3a1a, "hunch"],
			[1.8, -1.0, -1.4, 0x7a8a7a, 0x111111, "stand"],
			[-1.7, -1.4, 1.4, 0x9a8a6a, 0xd8b070, "hunch"],
			[0, -3.6, 0, 0x6a7a8a, 0x5a4a3a, "raise"],
		];
		crew.forEach(([x, z, ry, sh, hair, pose]) => k.person({ x, z, ry, pose, colors: { shirt: sh, legs: sh, hair }, parent: mess }));

		// ---- The chain room: the creature.
		const den = k.group({ x: -300, z: -150, from: 5, until: 5 });
		k.box(10, 0.3, 30, 0x2a2c2c, { y: -0.15, parent: den, metal: 0.6, rough: 0.5 });
		[-4, 4].forEach((x) => {
			k.box(0.4, 7, 30, 0x3a3e40, { x, y: 3.5, parent: den, metal: 0.5 });
			for (let i = 0; i < 4; i++) k.cyl(0.2, 0.2, 30, 0x5a5a52, { x: x * 0.9, y: 1.5 + i * 1.2, rx: PI / 2, parent: den, metal: 0.6, rough: 0.4 });
		});
		k.box(10, 0.4, 30, 0x2a2c2e, { y: 7, parent: den });
		const cr = rng(8);
		for (let i = 0; i < 26; i++) {
			const x = (cr() - 0.5) * 7;
			const z = -12 + cr() * 14;
			const len = 1.5 + cr() * 3.5;
			k.cyl(0.03, 0.03, len, 0x6a6a64, { x, y: 7 - len / 2, z, parent: den, metal: 0.8, rough: 0.3 });
		}
		k.particles(300, 0x9ab8c8, { x: -300, z: -155, box: [8, 7, 12], speed: 5, size: 0.05, opacity: 0.6, from: 5, until: 5 });
		const xeno = k.group({ x: 0, y: 0, z: -6, ry: 0.15, parent: den });
		const black = { metal: 0.5, rough: 0.22, flat: false };
		const xc = 0x252b33;
		[-1, 1].forEach((s) => {
			k.cyl(0.08, 0.12, 1.1, xc, { x: s * 0.28, y: 1.15, z: 0.15, rx: -0.5, parent: xeno, ...black });
			k.cyl(0.06, 0.08, 1.0, xc, { x: s * 0.3, y: 0.45, z: 0.05, rx: 0.5, parent: xeno, ...black });
			k.cyl(0.04, 0.06, 1.3, xc, { x: s * 0.45, y: 1.6, z: 0.35, rx: -0.6, rz: s * 0.25, parent: xeno, ...black });
			k.cyl(0.03, 0.04, 1.0, xc, { x: s * 0.55, y: 1.1, z: 0.95, rx: -1.1, rz: s * 0.1, parent: xeno, ...black });
			for (let f = 0; f < 3; f++) k.cyl(0.012, 0.02, 0.35, xc, { x: s * (0.5 + f * 0.05), y: 0.85, z: 1.38, rx: -1.6, parent: xeno, ...black });
			for (let i = 0; i < 2; i++) k.cyl(0.05, 0.08, 1.0, xc, { x: s * (0.12 + i * 0.16), y: 2.55, z: -0.35, rx: -0.9 + i * 0.25, parent: xeno, ...black });
		});
		k.capsule(0.26, 0.8, xc, { y: 1.95, z: 0.25, rx: 0.35, parent: xeno, ...black });
		for (let i = 0; i < 4; i++) k.box(0.42 - i * 0.04, 0.05, 0.12, 0x343c46, { y: 1.75 + i * 0.16, z: 0.48 + i * 0.05, rx: 0.35, parent: xeno, ...black });
		for (let i = 0; i < 12; i++) k.sphere(0.16 - i * 0.01, xc, { y: 1.0 - i * 0.03, z: -0.2 - i * 0.28, x: Math.sin(i * 0.5) * 0.4, parent: xeno, ...black });
		k.cone(0.06, 0.4, 0x3a424c, { x: Math.sin(12 * 0.5) * 0.4, y: 0.62, z: -3.6, rx: -PI / 2, parent: xeno, ...black });
		const head = k.group({ y: 2.66, z: 0.6, rx: 0.12, parent: xeno });
		k.capsule(0.25, 1.15, xc, { y: 0.22, z: -0.52, rx: -1.21, parent: head, ...black, seg: 16 });
		k.sphere(0.22, xc, { y: -0.04, z: 0.12, s: [1, 0.9, 1.3], parent: head, ...black });
		k.box(0.3, 0.06, 0.26, 0x6a6e74, { y: -0.13, z: 0.24, parent: head, ...black });
		const lower = k.group({ y: -0.2, z: 0.12, rx: 0.35, parent: head });
		k.box(0.24, 0.07, 0.3, 0x3a3f46, { y: -0.06, z: 0.1, parent: lower, ...black });
		for (let i = 0; i < 7; i++) {
			const x = -0.12 + i * 0.04;
			const z = 0.36 - Math.abs(x) * 0.6;
			k.cone(0.02, 0.1, 0xf0ece0, { x, y: -0.2, z, rx: PI, parent: head, seg: 4, rough: 0.2, emissive: 0x302820 });
			k.cone(0.018, 0.08, 0xf0ece0, { x: x * 0.9, y: 0.0, z: z - 0.1, parent: lower, seg: 4, rough: 0.2, emissive: 0x302820 });
		}
		const inner = k.group({ y: -0.24, z: 0.2, parent: head });
		k.cyl(0.045, 0.05, 0.3, 0x5a3a40, { rx: PI / 2, z: 0.1, parent: inner, ...black });
		for (let i = 0; i < 3; i++) k.cone(0.014, 0.05, 0xf0ece0, { x: -0.025 + i * 0.025, y: 0.03, z: 0.26, rx: PI, parent: inner, seg: 4 });
		for (let i = 0; i < 3; i++) k.cone(0.014, 0.05, 0xf0ece0, { x: -0.025 + i * 0.025, y: -0.03, z: 0.26, parent: inner, seg: 4 });
		k.tick((t) => (inner.position.z = 0.2 + Math.max(0, Math.sin(t * 1.5)) * 0.2));
		const slime = new k.THREE.MeshStandardMaterial({ color: 0xd8e8e0, transparent: true, opacity: 0.55, roughness: 0.05 });
		[-0.08, 0.05, 0.1].forEach((x, i) => k.cyl(0.006, 0.01, 0.3 + i * 0.15, slime, { x, y: -0.42 - i * 0.07, z: 0.3, parent: head }));
		k.point(0x6ab0ff, 14, 10, { x: -2, y: 4, z: -8, parent: den });
		k.point(0xffa040, 10, 10, { x: 2.5, y: 3, z: -2, parent: den });
		const strobe = k.point(0xff7020, 0, 14, { x: -3, y: 6, z: -3, parent: den });
		k.tick((t) => (strobe.intensity = 6 + Math.max(0, Math.sin(t * 4)) * 14));
		k.point(0xd8e8ff, 8, 6, { x: 1.4, y: 2.8, z: -3.6, parent: den });
		return {
			shots: [
				{ pos: [0.75, 1.45, 300.6], look: [0.05, 1.08, 299.35], fov: 45, fog: [0x1a1c1a, 6, 20], exposure: 1.2 },
				{ pos: [9, 405, 12], look: [-6, 396, -14], fov: 50, fog: [0x000004, 900, 3000], exposure: 1.3 },
				{ pos: [311, 4, 13], look: [300, 7, 0], fov: 55, fog: [0x0e1612, 8, 70], exposure: 1.5 },
				{ pos: [302.2, 3.0, 142.8], look: [300, 1.5, 140], fov: 50, fog: [0x0a1a2a, 4, 40], exposure: 1.4 },
				{ pos: [-297.6, 2.4, 2.4], look: [-300, 1.4, 0], fov: 50, fog: [0xd8dcd8, 10, 40] },
				{ pos: [-298.3, 2.6, -154.0], look: [-299.9, 2.6, -155.6], fov: 50, fog: [0x141c22, 4, 30], exposure: 1.6 },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the eye
	r19: (k) => {
		k.fog(0x1e1a26, 80, 820);
		k.sky(0x07070e, 0x3a2a34, { offset: -0.02 });
		k.light({ sky: 0x8a90c0, ground: 0x2a1a10, hemi: 1.1, sunColor: 0x9ab0e0, sunIntensity: 0.8, sunPos: [-40, 60, 40], shadowSize: 40 });
		const neon = (text, w, h, color, o) => {
			const tex = k.canvas(w * 64, h * 64, (g, W, H) => {
				g.fillStyle = "#0a0608";
				g.fillRect(0, 0, W, H);
				g.strokeStyle = color;
				g.lineWidth = 6;
				g.strokeRect(6, 6, W - 12, H - 12);
				const vertical = H > W;
				g.font = `bold ${vertical ? W * 0.7 : H * 0.6}px sans-serif`;
				g.textAlign = "center";
				g.textBaseline = "middle";
				g.shadowColor = color;
				g.shadowBlur = 18;
				g.fillStyle = "#fff";
				if (vertical) [...text].forEach((c, i) => g.fillText(c, W / 2, (H / text.length) * (i + 0.5)));
				else g.fillText(text, W / 2, H / 2);
				g.fillStyle = color;
				g.globalAlpha = 0.5;
				if (vertical) [...text].forEach((c, i) => g.fillText(c, W / 2, (H / text.length) * (i + 0.5)));
				else g.fillText(text, W / 2, H / 2);
			});
			return k.plane(w, h, flat(k, tex, { fog: true }), o);
		};
		const spinner = (o) => {
			const g = k.group(o);
			k.box(2.2, 0.7, 4.6, 0x28323e, { y: 0.5, parent: g, metal: 0.7, rough: 0.3 });
			k.box(1.9, 0.6, 2.2, 0x1a2a3a, { y: 1.15, z: -0.3, parent: g, metal: 0.4, rough: 0.1 });
			k.box(1.6, 0.4, 1.6, 0x28323e, { y: 0.35, z: 2.8, rx: 0.25, parent: g, metal: 0.7 });
			k.box(2.0, 0.12, 0.4, 0xe8eef8, { y: 1.5, z: -0.3, parent: g, emissive: 0xffffff, glow: 0.6 });
			k.glow(0x3a6aff, 2.2, { x: -0.7, y: 1.6, z: -0.3, parent: g });
			k.glow(0xff3a3a, 2.2, { x: 0.7, y: 1.6, z: -0.3, parent: g });
			[-0.7, 0.7].forEach((x) => k.glow(0xf8f4e0, 1.8, { x, y: 0.5, z: 3.5, parent: g }));
			[-0.8, 0.8].forEach((x) => k.glow(0xff2020, 1.2, { x, y: 0.6, z: -2.35, parent: g }));
			k.glow(0x6ab0ff, 4, { y: -0.1, parent: g, opacity: 0.6 });
			return g;
		};

		// ---- The eye, with the fires of the city in it.
		const eye = k.group({ x: 400, y: 200, from: 3, until: 3 });
		k.sphere(1.0, 0xf2e8e0, { parent: eye, seg: 32, rings: 24, flat: false, rough: 0.3 });
		const iris = k.canvas(256, 256, (g) => {
			const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
			grad.addColorStop(0, "#0a1418");
			grad.addColorStop(0.35, "#2a5a5a");
			grad.addColorStop(0.8, "#6aa0a0");
			grad.addColorStop(1, "#1a3030");
			g.fillStyle = grad;
			g.fillRect(0, 0, 256, 256);
			g.strokeStyle = "rgba(200,240,230,0.35)";
			for (let i = 0; i < 90; i++) {
				const a = (i / 90) * PI * 2;
				g.beginPath();
				g.moveTo(128 + Math.cos(a) * 46, 128 + Math.sin(a) * 46);
				g.lineTo(128 + Math.cos(a) * 124, 128 + Math.sin(a) * 124);
				g.stroke();
			}
			g.fillStyle = "#020202";
			g.beginPath();
			g.arc(128, 128, 44, 0, PI * 2);
			g.fill();
		});
		const irisGeo = new k.THREE.SphereGeometry(1.004, 40, 12, 0, PI * 2, 0, 0.5);
		const ip = irisGeo.attributes.position;
		for (let i = 0; i < ip.count; i++) irisGeo.attributes.uv.setXY(i, 0.5 + ip.getX(i) / 0.96, 0.5 - ip.getZ(i) / 0.96);
		k.mesh(irisGeo, k.mat(0xffffff, { map: iris, rough: 0.2, flat: false }), { rx: PI / 2, parent: eye });
		k.sphere(1.03, 0xffffff, { parent: eye, opacity: 0.12, rough: 0.02, metal: 0.2, flat: false, seg: 32, rings: 24 });
		const face = new k.THREE.Shape();
		face.moveTo(-6, -4);
		face.lineTo(6, -4);
		face.lineTo(6, 4);
		face.lineTo(-6, 4);
		face.lineTo(-6, -4);
		const hole = new k.THREE.Path();
		hole.moveTo(-1.05, 0.05);
		hole.bezierCurveTo(-0.5, 0.75, 0.5, 0.8, 1.05, 0.1);
		hole.bezierCurveTo(0.5, -0.6, -0.5, -0.6, -1.05, 0.05);
		face.holes.push(hole);
		k.mesh(new k.THREE.ShapeGeometry(face, 24), k.mat(0xb88a74, { flat: false, rough: 0.7 }), { z: 0.62, parent: eye });
		const rim = new k.THREE.Shape();
		rim.moveTo(-1.25, 0.05);
		rim.bezierCurveTo(-0.6, 1.0, 0.6, 1.05, 1.25, 0.1);
		rim.bezierCurveTo(0.6, -0.8, -0.6, -0.8, -1.25, 0.05);
		rim.holes.push(hole);
		k.mesh(new k.THREE.ExtrudeGeometry(rim, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.06, bevelSegments: 2, curveSegments: 24 }), k.mat(0xa87a66, { flat: false, rough: 0.6 }), { z: 0.62, parent: eye });
		for (let i = 0; i < 22; i++) {
			const u = i / 21;
			const x = -0.95 + u * 1.9;
			const y = 0.1 + Math.sin(u * PI) * 0.62 + 0.12;
			k.box(0.008, 0.14, 0.008, 0x140c0a, { x, y: y - 0.06, z: 0.98, rx: 0.9, rz: (0.5 - u) * 0.8, parent: eye, shadow: false });
		}
		k.glow(0xff7a20, 0.16, { x: -0.28, y: -0.2, z: 1.0, parent: eye });
		k.glow(0xffa040, 0.1, { x: 0.3, y: -0.16, z: 1.0, parent: eye });
		const fires = [k.glow(0xffc060, 0.08, { x: -0.28, y: -0.18, z: 1.01, parent: eye }), k.glow(0xffc060, 0.06, { x: 0.3, y: -0.14, z: 1.01, parent: eye })];

		k.glow(0xffffff, 0.14, { x: 0.22, y: 0.2, z: 1.04, parent: eye });
		k.tick((t) => fires.forEach((f, i) => f.scale.setScalar(0.06 + 0.04 * Math.abs(Math.sin(t * 5 + i * 1.7)))));
		k.point(0xff9050, 4, 8, { x: 0, y: -1, z: 4, parent: eye });
		k.point(0xd8c0b0, 3, 10, { x: 2, y: 2, z: 5, parent: eye });

		// ---- The empathy test.
		const vk = k.group({ x: -400, from: 1, until: 1 });
		k.box(6, 0.12, 3, 0x1a1210, { y: 1, parent: vk, rough: 0.2, metal: 0.3 });
		k.box(0.2, 1, 0.2, 0x1a1210, { x: -2.6, y: 0.5, z: 1.2, parent: vk });
		const mach = k.group({ x: 0.3, y: 1.06, z: 0.4, ry: -0.3, parent: vk });
		k.box(0.9, 0.22, 0.6, 0x2a2c2e, { y: 0.11, parent: mach, metal: 0.6, rough: 0.4 });
		k.box(0.5, 0.35, 0.08, 0x3a3c3e, { y: 0.38, z: -0.2, rx: -0.3, parent: mach, metal: 0.5 });
		const scr = k.canvas(256, 192, (g) => {
			g.fillStyle = "#081008";
			g.fillRect(0, 0, 256, 192);
			g.strokeStyle = "#9aff9a";
			g.lineWidth = 3;
			g.beginPath();
			g.ellipse(128, 96, 110, 60, 0, 0, PI * 2);
			g.stroke();
			g.fillStyle = "#4a9a5a";
			g.beginPath();
			g.arc(128, 96, 48, 0, PI * 2);
			g.fill();
			g.fillStyle = "#020602";
			g.beginPath();
			g.arc(128, 96, 20, 0, PI * 2);
			g.fill();
			g.strokeStyle = "rgba(160,255,160,0.25)";
			for (let y = 0; y < 192; y += 4) {
				g.beginPath();
				g.moveTo(0, y);
				g.lineTo(256, y);
				g.stroke();
			}
		});
		k.plane(0.42, 0.28, flat(k, scr), { y: 0.39, z: -0.155, rx: -0.3, parent: mach });
		const bellows = [];
		for (let i = 0; i < 6; i++) bellows.push(k.box(0.36 - i * 0.03, 0.035, 0.3 - i * 0.025, i % 2 ? 0x5a5c5e : 0x2a2c2e, { x: -0.25, y: 0.25 + i * 0.045, z: 0.05, parent: mach }));
		k.tick((t) => bellows.forEach((b, i) => (b.position.y = 0.25 + i * (0.035 + 0.02 * (0.5 + 0.5 * Math.sin(t * 1.2))))));
		k.cyl(0.02, 0.02, 0.4, 0x8a8a8a, { x: 0.3, y: 0.4, z: 0.1, rz: -0.4, parent: mach, metal: 0.8 });
		k.cyl(0.06, 0.07, 0.14, 0x1a1a1a, { x: 0.38, y: 0.6, z: 0.2, rx: PI / 2 - 0.3, ry: 0.3, parent: mach });
		k.glow(0x9ab0ff, 0.12, { x: 0.38, y: 0.6, z: 0.28, parent: mach });
		for (let i = 0; i < 5; i++) k.glow([0xff5030, 0x30ff60, 0xffd040][i % 3], 0.07, { x: 0.05 + i * 0.07, y: 0.23, z: 0.31, parent: mach });
		k.box(0.12, 0.012, 0.012, 0xf4f0e8, { x: 1.2, y: 1.08, z: 0.7, ry: 0.4, parent: vk });
		k.glow(0xff6020, 0.05, { x: 1.26, y: 1.08, z: 0.72, parent: vk });

		k.box(14, 8, 0.2, 0x2a1a10, { y: 4, z: -4, parent: vk });
		const sunset = k.canvas(64, 256, (g) => {
			const gr = g.createLinearGradient(0, 0, 0, 256);
			gr.addColorStop(0, "#5a3a3a");
			gr.addColorStop(0.6, "#f0a050");
			gr.addColorStop(1, "#ffe0a0");
			g.fillStyle = gr;
			g.fillRect(0, 0, 64, 256);
		});
		for (let i = 0; i < 5; i++) k.plane(1.6, 6, flat(k, sunset), { x: -4 + i * 2, y: 4, z: -3.88, parent: vk });
		for (let i = 0; i < 6; i++) k.box(0.3, 8, 0.4, 0x3a2a1c, { x: -5 + i * 2, y: 4, z: -3.8, parent: vk });
		k.point(0xffa860, 14, 14, { x: 0, y: 3, z: -2.5, parent: vk });
		k.point(0xd8c0a0, 8, 8, { x: 2, y: 2.5, z: 3, parent: vk });
		k.box(0.6, 0.08, 0.6, 0x2a1a14, { x: 0.3, y: 0.5, z: -1.3, parent: vk });
		k.person({ x: 0.3, y: -0.3, z: -1.45, pose: "sit", coat: 0x2a2420, colors: { shirt: 0x2a2420, legs: 0x1a1414, hair: 0x120c08, skin: 0xe8c8b0 }, sleeves: 0x2a2420, parent: vk });

		// ---- A noodle counter, late: a bowl, chopsticks, a soy bottle, steam.
		const bar = k.group({ z: 400, from: 0, until: 0 });
		k.box(4, 0.1, 1.2, 0x6a665e, { y: 1.0, parent: bar, rough: 0.35, metal: 0.4 });
		k.box(4, 1.0, 0.1, 0x3a3a3e, { y: 0.5, z: 0.55, parent: bar, metal: 0.4 });
		k.box(4, 3, 0.1, 0x6a6458, { y: 1.5, z: -1.2, parent: bar });
		const tiles = k.canvas(128, 128, (g) => {
			g.fillStyle = "#4a5a58";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#8a9a94";
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
		});
		tiles.wrapS = tiles.wrapT = k.THREE.RepeatWrapping;
		tiles.repeat.set(3, 2);
		k.plane(4, 2, k.mat(0xffffff, { map: tiles, rough: 0.3 }), { y: 2, z: -1.14, parent: bar });
		k.box(4, 0.12, 0.3, 0x5a5a5e, { y: 1.3, z: -1.0, parent: bar, metal: 0.6 });
		[[-1.2, 0x2a2a2e], [-0.8, 0x6a5a40], [1.0, 0x2a2a2e]].forEach(([x, c]) => k.cyl(0.18, 0.16, 0.36, c, { x, y: 1.54, z: -0.98, parent: bar, metal: 0.6, rough: 0.3 }));
		// The bowl.
		k.cyl(0.2, 0.1, 0.14, 0xe8e0d0, { x: 0, y: 1.12, z: 0.1, parent: bar, seg: 18, rough: 0.3 });
		k.torus(0.19, 0.012, 0xb03030, { x: 0, y: 1.17, z: 0.1, rx: PI / 2, parent: bar, seg: 24 });
		k.cyl(0.185, 0.185, 0.01, 0xd8a050, { x: 0, y: 1.18, z: 0.1, parent: bar, seg: 18 });
		for (let i = 0; i < 6; i++) k.torus(0.04 + i * 0.015, 0.006, 0xf0e0a0, { x: 0.02, y: 1.19, z: 0.1, rx: PI / 2, parent: bar, seg: 14 });
		k.sphere(0.04, 0xf8f4ea, { x: -0.07, y: 1.19, z: 0.13, s: [1, 0.5, 1], parent: bar });
		k.box(0.07, 0.01, 0.1, 0x2a5a2a, { x: 0.08, y: 1.19, z: 0.05, parent: bar });
		[-0.015, 0.015].forEach((dx) => k.cyl(0.006, 0.004, 0.5, 0xb88a50, { x: 0.12 + dx, y: 1.22, z: 0.2, rz: PI / 2 + 0.25, ry: 0.4, parent: bar }));
		k.cyl(0.04, 0.05, 0.16, 0x3a1a10, { x: -0.45, y: 1.13, z: -0.15, parent: bar, rough: 0.2, opacity: 0.85 });
		k.cyl(0.02, 0.02, 0.05, 0xc03020, { x: -0.45, y: 1.23, z: -0.15, parent: bar });
		k.cyl(0.035, 0.03, 0.1, 0xe8e8f0, { x: 0.45, y: 1.1, z: -0.1, parent: bar, opacity: 0.5, rough: 0.05 });
		for (let i = 0; i < 4; i++) k.glow(0xe8e8f0, 0.3 + i * 0.12, { x: 0.02 + Math.sin(i * 2) * 0.03, y: 1.28 + i * 0.12, z: 0.1, parent: bar, opacity: 0.18 });
		k.point(0xffe0b0, 5, 5, { x: 0.3, y: 2.0, z: 0.6, parent: bar });
		k.point(0x6ab0d0, 2, 5, { x: -1.4, y: 1.6, z: 0.8, parent: bar });

		// ---- The street: neon, rain, umbrellas.
		k.box(18, 0.2, 160, 0x16161c, { y: -0.1, z: -20, rough: 0.15, metal: 0.4 });
		[-1, 1].forEach((s) => k.box(3, 0.4, 160, 0x2a2a30, { x: s * 7.5, y: 0.1, z: -20 }));
		const signs = [["ラーメン", "#ff5050"], ["酒", "#50e0ff"], ["芸者", "#ff60d0"], ["電気", "#ffd040"], ["寿司", "#60ff90"], ["夜", "#ff9040"], ["東京", "#80a0ff"]];
		const br = rng(19);
		for (let i = 0; i < 14; i++) [-1, 1].forEach((s) => {
			const h = 20 + br() * 40;
			const z = 40 - i * 8;
			k.box(7, h, 7.6, [0x22222a, 0x1a1a22, 0x2a2630][i % 3], { x: s * 12.5, y: h / 2, z });
			const [t, c] = signs[(i + (s > 0 ? 3 : 0)) % signs.length];
			neon(t, 1.2, 4 + br() * 3, c, { x: s * 8.4, y: 6 + br() * 6, z: z + 2, ry: -s * PI / 2 + s * 0.6 });
			k.box(0.1, 0.12, 6, 0xffd890, { x: s * 8.96, y: 3.4, z, emissive: 0xffb050, glow: 0.5 });
			k.box(0.1, 2.2, 3, 0x3a2418, { x: s * 8.96, y: 1.4, z, emissive: 0xff9040, glow: 0.08 });
		});
		const geisha = k.canvas(256, 512, (g) => {
			g.fillStyle = "#1a0a14";
			g.fillRect(0, 0, 256, 512);
			g.fillStyle = "#0a0408";
			g.beginPath();
			g.ellipse(128, 170, 110, 120, 0, 0, PI * 2);
			g.fill();
			g.fillStyle = "#f8f0f0";
			g.beginPath();
			g.ellipse(128, 260, 70, 95, 0, 0, PI * 2);
			g.fill();
			g.fillStyle = "#c01020";
			g.beginPath();
			g.ellipse(128, 315, 18, 9, 0, 0, PI * 2);
			g.fill();
			g.fillStyle = "#1a0a0a";
			[100, 156].forEach((x) => {
				g.beginPath();
				g.ellipse(x, 240, 16, 6, x < 128 ? 0.2 : -0.2, 0, PI * 2);
				g.fill();
			});
			g.fillStyle = "#d02040";
			g.fillRect(40, 380, 176, 132);
			g.fillStyle = "#f0c040";
			for (let i = 0; i < 6; i++) g.fillRect(40, 392 + i * 22, 176, 6);
			g.fillStyle = "#e05050";
			g.fillRect(200, 60, 6, 140);
		});
		k.box(26, 70, 10, 0x1a1a22, { y: 35, z: -95 });
		k.plane(20, 40, flat(k, geisha), { y: 42, z: -89.9, until: 4 });
		k.point(0xff6080, 30, 80, { y: 40, z: -80 });
		const pr = rng(23);
		for (let i = 0; i < 34; i++) {
			const x = (pr() - 0.5) * 12;
			const z = 12 - pr() * 60;
			const coat = [0x2a2a30, 0x3a2a24, 0x1a1a24, 0x2a3030][i % 4];
			k.person({ x, z, ry: pr() > 0.5 ? 0 : PI, coat, colors: { shirt: coat, legs: 0x1a1a1a, hair: 0x1a1210 }, sleeves: coat });
			const c = [0x60e0ff, 0xff60c0, 0xfff080, 0x80ff90][i % 4];
			k.cyl(0.025, 0.025, 1.3, c, { x: x + 0.3, y: 2.0, z, emissive: c, glow: 1.5, shadow: false });
			k.cone(0.65, 0.3, 0x14141a, { x: x + 0.3, y: 2.75, z, seg: 8, opacity: 0.85 });
			k.glow(c, 0.7, { x: x + 0.3, y: 2.0, z, opacity: 0.6 });
		}
		for (let i = 0; i < 6; i++) k.glow(0xd8d8e8, 4, { x: (pr() - 0.5) * 10, y: 0.6, z: -pr() * 50, opacity: 0.3, fog: true });
		spinner({ x: -1, y: 11, z: -16, ry: 0.4 });
		k.point(0x6aa0ff, 20, 30, { x: -1, y: 9, z: -16 });
		rain(k, 3000, [20, 20, 50], { z: -5, len: 0.7, opacity: 0.35, from: 4, until: 4 });
		k.point(0xff60c0, 12, 30, { x: -6, y: 6, z: 0 });
		k.point(0x60e0ff, 12, 30, { x: 6, y: 6, z: -12 });
		k.point(0xffd040, 10, 30, { x: -5, y: 5, z: -28 });

		// ---- The city, with its fires and the twin pyramids.
		city(k, 220, [-300, 300, -330, -110], { h: 30, w: 10, colors: [0x1c1c24, 0x242430, 0x18181e], windows: 0xffb860, seed: 41, avoid: (x, z) => Math.abs(x) < 120 && z < -230 });
		city(k, 140, [-260, 260, -110, 160], { h: 26, w: 9, colors: [0x1c1c24, 0x242430, 0x18181e], windows: 0xffb860, seed: 43, avoid: (x, z) => Math.abs(x) < 22 });
		k.ground(900, 0x101014, { bump: 0, seg: 4, y: -0.25 });
		const lights = k.canvas(256, 256, (g) => {
			g.fillStyle = "#000";
			g.fillRect(0, 0, 256, 256);
			const r = rng(5);
			for (let y = 4; y < 256; y += 8) for (let x = 2; x < 256; x += 5) if (r() > 0.45) {
				g.fillStyle = r() > 0.8 ? "#fff0c0" : "#c88a40";
				g.fillRect(x, y, 2, 3);
			}
		});
		lights.wrapS = lights.wrapT = k.THREE.RepeatWrapping;
		lights.repeat.set(4, 4);
		const pyr = new k.THREE.MeshStandardMaterial({ color: 0x3a3a46, emissive: 0xffd090, emissiveMap: lights, emissiveIntensity: 1.6, flatShading: true, roughness: 0.6 });
		[-85, 85].forEach((x) => {
			k.mesh(new k.THREE.ConeGeometry(110, 150, 4), pyr, { x, y: 75, z: -330, ry: PI / 4 });

			k.glow(0xffe0a0, 18, { x, y: 152, z: -330, fog: false });

		});
		const flames = [];
		const fr = rng(61);
		for (let i = 0; i < 16; i++) {
			const x = (fr() - 0.5) * 420;
			const z = -60 - fr() * 220;
			if (Math.abs(x) < 30) continue;
			const h = 30 + fr() * 30;
			k.cyl(1.4, 2.4, h, 0x2a2420, { x, y: h / 2, z, seg: 8 });
			flames.push(k.glow(0xff8a20, 40, { x, y: h + 12, z, fog: false }));
			k.glow(0xffe080, 14, { x, y: h + 4, z, fog: false });
			k.point(0xff8030, 30, 120, { x, y: h + 6, z, decay: 1 });
		}
		k.tick((t) => flames.forEach((f, i) => f.scale.setScalar(34 + 16 * Math.abs(Math.sin(t * 3 + i * 1.3)))));
		const hero = spinner({ x: 16, y: 94, z: -50, ry: PI + 0.5, rz: 0.15, s: 2.2, from: 5 });
		k.tick((t) => (hero.position.y = 94 + Math.sin(t) * 0.6));

		// ---- The unicorn on the floor.
		const uni = k.group({ x: -400, z: 120, from: 2, until: 2 });
		const tile = k.canvas(256, 256, (g) => {
			g.fillStyle = "#6a6050";
			g.fillRect(0, 0, 256, 256);
			for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
				const ox = x * 128;
				const oy = y * 128;
				g.fillStyle = "#7a705e";
				g.fillRect(ox + 6, oy + 6, 116, 116);
				g.fillStyle = "#4a4238";
				g.fillRect(ox + 30, oy + 30, 68, 68);
				g.fillStyle = "#857a66";
				g.fillRect(ox + 44, oy + 44, 40, 40);
				g.fillStyle = "#4a4238";
				[[20, 58], [96, 58], [58, 20], [58, 96]].forEach(([a, b]) => g.fillRect(ox + a, oy + b, 12, 12));
			}
		});
		tile.wrapS = tile.wrapT = k.THREE.RepeatWrapping;
		tile.repeat.set(10, 10);
		k.plane(4, 4, k.mat(0xffffff, { map: tile }), { rx: -PI / 2, parent: uni });
		k.box(4, 3, 0.2, k.mat(0x6a6a6a, { map: tile }), { y: 1.5, z: -1.2, parent: uni });
		const foil = { metal: 0.85, rough: 0.3 };
		const fc = 0xd8d8de;
		const un = k.group({ y: 0, ry: 0.15, parent: uni });
		k.cyl(0.05, 0.05, 0.18, fc, { seg: 3, rz: PI / 2, y: 0.11, parent: un, ...foil });
		[[-0.07, 0.03], [-0.07, -0.03], [0.06, 0.03], [0.06, -0.03]].forEach(([x, z]) => k.cone(0.018, 0.1, fc, { seg: 3, x, y: 0.05, z, rx: PI, parent: un, ...foil }));
		k.cone(0.035, 0.12, fc, { seg: 3, x: 0.11, y: 0.17, rz: -0.5, parent: un, ...foil });
		k.cone(0.03, 0.1, fc, { seg: 3, x: 0.17, y: 0.22, rz: -PI / 2 - 0.3, parent: un, ...foil });
		k.cone(0.007, 0.11, 0xf0f0f4, { seg: 3, x: 0.16, y: 0.29, rz: -0.45, parent: un, ...foil });
		[-0.012, 0.012].forEach((z) => k.cone(0.008, 0.03, fc, { seg: 3, x: 0.135, y: 0.255, z, rz: 0.3, parent: un, ...foil }));
		k.cone(0.02, 0.1, fc, { seg: 3, x: -0.13, y: 0.14, rz: 2.2, parent: un, ...foil });
		k.cyl(0.03, 0.025, 0.06, 0xe8f0f0, { x: 0.45, y: 0.03, z: -0.25, parent: uni, opacity: 0.5, rough: 0.05 });
		k.cyl(0.024, 0.024, 0.03, 0xc07a20, { x: 0.45, y: 0.02, z: -0.25, parent: uni, opacity: 0.8 });
		k.point(0xffe0b0, 3, 4, { x: 0.6, y: 0.8, z: 0.6, parent: uni });
		k.point(0x6a90d0, 3, 5, { x: -1, y: 1, z: 0.4, parent: uni });
		return {
			shots: [
				{ pos: [0.55, 1.6, 401.0], look: [0, 1.15, 400.05], fov: 45, fog: [0x1c1a1a, 4, 16], exposure: 1.2 },
				{ pos: [-398.6, 1.75, 1.6], look: [-399.8, 1.35, 0.2], fov: 45, fog: [0x2a1a10, 3, 30], exposure: 1.4 },
				{ pos: [-399.95, 0.2, 120.6], look: [-400, 0.13, 120], fov: 40, fog: [0x14100c, 1, 20], exposure: 1.3 },
				{ pos: [400.1, 200.1, 3.4], look: [400, 200.05, 0], fov: 40, fog: [0x050302, 1, 30] },
				{ pos: [1.5, 1.9, 17], look: [0, 3.4, -10], fov: 50, fog: [0x2a2240, 10, 110], exposure: 1.5 },
				{ pos: [36, 92, 30], look: [0, 62, -330], fov: 50, exposure: 1.5 },


			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the machines
	r20: (k) => {
		k.fog(0x1c2840, 30, 240);
		k.sky(0x0a1224, 0x3a4c70, { offset: -0.03 });
		k.light({ sky: 0x9ab0e0, ground: 0x2a2a3a, hemi: 1.4, sunColor: 0xa8c0ff, sunIntensity: 1.3, sunPos: [-30, 50, 30], shadowSize: 30 });
		const steel = chrome(k, 0xc8ccd4, { rough: 0.25, flat: true });
		const endo = (o) => {
			const g = k.group(o);
			k.sphere(0.2, steel, { y: 1.78, s: [0.9, 1.05, 1.05], parent: g });
			k.box(0.22, 0.1, 0.18, steel, { y: 1.6, z: 0.05, parent: g });
			for (let i = 0; i < 5; i++) k.box(0.03, 0.05, 0.03, 0xe8e8e0, { x: -0.08 + i * 0.04, y: 1.66, z: 0.15, parent: g });
			[-0.07, 0.07].forEach((x) => {
				k.sphere(0.04, 0xff1a10, { x, y: 1.8, z: 0.15, emissive: 0xff0000, glow: 2, parent: g });
				k.glow(0xff2010, 0.35, { x, y: 1.8, z: 0.2, parent: g });
			});
			k.cyl(0.05, 0.05, 0.2, steel, { y: 1.47, parent: g });
			for (let i = 0; i < 5; i++) k.box(0.42 - Math.abs(i - 1.5) * 0.04, 0.04, 0.24, steel, { y: 1.35 - i * 0.08, parent: g });
			k.cyl(0.04, 0.04, 0.5, steel, { y: 1.15, parent: g });
			k.box(0.36, 0.12, 0.2, steel, { y: 0.9, parent: g });
			[-1, 1].forEach((s) => {
				k.cyl(0.04, 0.035, 0.85, steel, { x: s * 0.13, y: 0.45, parent: g });
				k.sphere(0.06, steel, { x: s * 0.13, y: 0.45, parent: g });
				k.box(0.1, 0.05, 0.22, steel, { x: s * 0.13, y: 0.03, z: 0.05, parent: g });
				k.cyl(0.03, 0.03, 0.6, steel, { x: s * 0.32, y: 1.15, z: 0.12, rx: -0.6, parent: g });
				k.sphere(0.07, steel, { x: s * 0.28, y: 1.4, parent: g });
			});
			k.box(0.1, 0.12, 1.1, 0x3a3c44, { x: 0.05, y: 1.0, z: 0.45, parent: g, metal: 0.6 });
			k.glow(0xa060ff, 0.4, { x: 0.05, y: 1.0, z: 1.05, parent: g });
			return g;
		};

		// ---- The future: skulls, treads, lasers.
		const war = k.group({ from: 4, until: 4 });
		k.ground(400, 0x3a3a44, { bump: 0.4, seg: 40, parent: war });
		const sr = rng(20);
		for (let i = 0; i < 90; i++) {
			const x = (sr() - 0.5) * 10;
			const z = (sr() - 0.5) * 8 + 1;
			const sk = k.group({ x, y: 0.12, z, ry: sr() * 6, rz: (sr() - 0.5) * 0.8, parent: war });
			k.sphere(0.14, 0xd8d0c0, { s: [0.9, 1, 1.15], parent: sk });
			k.box(0.12, 0.06, 0.1, 0xc8c0b0, { y: -0.1, z: 0.06, parent: sk });
			[-0.05, 0.05].forEach((ex) => k.sphere(0.035, 0x141414, { x: ex, y: 0.01, z: 0.13, parent: sk }));
		}
		for (let i = 0; i < 30; i++) k.ico(0.3 + sr() * 0.8, 0x4a4a52, { x: (sr() - 0.5) * 40, y: 0.1, z: (sr() - 0.5) * 40, parent: war });
		const tank = k.group({ x: -0.5, y: 0, z: -7.5, parent: war });
		const tm = 0x5a5e68;
		[-2.4, 2.4].forEach((x) => {
			k.box(1.6, 2.6, 11, 0x464a52, { x, y: 1.3, parent: tank, metal: 0.4 });
			for (let i = 0; i < 22; i++) k.box(1.7, 0.18, 0.25, 0x1a1a1e, { x, y: 2.65, z: -5.2 + i * 0.5, parent: tank, metal: 0.5 });
			for (let i = 0; i < 6; i++) k.box(1.7, 0.25, 0.18, 0x1a1a1e, { x, y: 0.2 + i * 0.45, z: 5.55, parent: tank, metal: 0.5 });
			for (let i = 0; i < 5; i++) k.cyl(0.8, 0.8, 1.65, 0x4a4c54, { x, y: 1.1, z: -4 + i * 2, rz: PI / 2, parent: tank, metal: 0.6 });
		});
		k.box(3.4, 2.2, 8, tm, { y: 3.6, parent: tank, metal: 0.5 });
		k.box(2.6, 1.4, 3, tm, { y: 5.4, z: 1, parent: tank, metal: 0.5 });
		[-0.7, 0.7].forEach((x) => {
			k.cyl(0.2, 0.25, 4, 0x2a2c30, { x, y: 5.6, z: 4, rx: PI / 2 - 0.1, parent: tank, metal: 0.6 });
			k.glow(0xb070ff, 0.8, { x, y: 5.8, z: 6.1, parent: tank });
		});
		[-1.2, 1.2].forEach((x) => {
			k.glow(0xf8f0ff, 1.8, { x, y: 4.2, z: 4.1, parent: tank });
			k.spot(0xe8f0ff, 60, { x: x - 0.5, y: 4.2, z: -3.3, target: [x * 2, 0, 6], angle: 0.4, distance: 40 });
		});
		const ruin = rng(3);
		for (let i = 0; i < 22; i++) {
			const x = (ruin() - 0.5) * 200;
			const z = -30 - ruin() * 140;
			const h = 8 + ruin() * 30;
			k.box(8 + ruin() * 8, h, 8 + ruin() * 8, 0x2a2e3a, { x, y: h / 2, z, ry: ruin(), rz: (ruin() - 0.5) * 0.15, parent: war });
			if (i % 3 === 0) {
				k.glow(0xff8a30, 10, { x, y: h * 0.5, z: z + 6, parent: war, fog: true });
				k.point(0xff8a30, 20, 40, { x, y: h * 0.5, z: z + 8, parent: war });
			}
		}
		const lasers = [[-6, 6, -20, 0.3, 0x40a0ff], [5, 8, -14, -0.4, 0xff3060], [-10, 4, -30, 0.1, 0xa060ff], [10, 10, -40, 0.5, 0x40a0ff]];
		lasers.forEach(([x, y, z, r, c]) => {
			k.cyl(0.08, 0.08, 6, c, { x, y, z, rz: PI / 2 + r, ry: 0.4, emissive: c, glow: 3, parent: war, shadow: false });
			k.glow(c, 3, { x, y, z, parent: war });
		});
		endo({ x: 3, y: 0, z: 2.5, ry: -0.4, s: 1.05, parent: war });
		endo({ x: -6, y: 0, z: -6, ry: 0.3, parent: war });
		k.point(0xa0c0ff, 10, 20, { x: 6, y: 4, z: 8, parent: war });
		k.point(0xb0c8ff, 14, 16, { x: 1, y: 5, z: 1, parent: war });

		// ---- The storm drain chase, in the LA sun.
		const drain = k.group({ x: 400, from: 1, until: 1 });
		k.sky(0x4a8ad8, 0xe8e0d0, { r: 300, tag: "lasky", parent: drain });
		k.box(16, 0.4, 300, 0xa8a49a, { y: -0.2, parent: drain });
		k.box(1.2, 0.3, 300, 0x7a8a8a, { y: 0.02, parent: drain, opacity: 0.6, rough: 0.1 });
		[-1, 1].forEach((s) => {
			k.box(12, 0.5, 300, 0x9a968c, { x: s * 12.6, y: 3.6, rz: s * 0.62, parent: drain });
			k.box(60, 1, 300, 0x8a8058, { x: s * 47, y: 7.2, parent: drain });
			for (let i = 0; i < 12; i++) {
				const z = -140 + i * 24;
				k.cyl(0.25, 0.35, 12, 0x6a5a40, { x: s * (22 + (i % 3) * 6), y: 13.5, z, parent: drain });
				for (let f = 0; f < 6; f++) k.box(3.4, 0.08, 0.6, 0x3a6a2a, { x: s * (22 + (i % 3) * 6) + Math.cos(f) * 1.6, y: 19.3, z: z + Math.sin(f) * 1.6, ry: -f, rz: 0.4, parent: drain });
			}
		});
		for (let i = 0; i < 30; i++) k.box(0.3, 0.05, 2.4, 0x8a867c, { x: (i % 2 ? 1 : -1) * 4, y: 0.01, z: -140 + i * 10, parent: drain });
		k.box(20, 2, 4, 0xb8b4aa, { y: 14, z: -60, parent: drain });
		[-6, 6].forEach((x) => k.box(1.5, 13, 3, 0xa8a49a, { x, y: 6.5, z: -60, parent: drain }));
		const bike = (o) => {
			const g = k.group(o);
			[-0.85, 0.85].forEach((z) => k.torus(0.34, 0.1, 0x1a1a1a, { z, y: 0.42, ry: PI / 2, parent: g, seg: 16 }));
			k.box(0.3, 0.35, 1.3, 0x1a1a1e, { y: 0.7, parent: g, metal: 0.6, rough: 0.3 });
			k.sphere(0.26, 0x111114, { y: 0.95, z: 0.25, s: [0.8, 0.6, 1.3], parent: g, metal: 0.6, rough: 0.2 });
			k.cyl(0.04, 0.04, 0.9, 0xc8c8c8, { y: 1.15, z: 0.75, rz: PI / 2, parent: g, metal: 0.9, rough: 0.2 });
			k.cyl(0.05, 0.05, 1.2, 0xc8c8c8, { x: 0.2, y: 0.4, z: -0.4, rx: PI / 2, parent: g, metal: 0.9, rough: 0.2 });
			k.glow(0xfff0c0, 0.5, { y: 1.0, z: 1.0, parent: g });
			return g;
		};
		const b1 = bike({ x: 1.5, y: 0, z: 8, parent: drain });
		const arnie = k.person({ y: 0.05, z: -0.15, pose: "sit", shades: true, colors: { shirt: 0x141416, legs: 0x1a1a22, hair: 0x2a1a10, skin: 0xd8a888 }, sleeves: 0x141416, parent: b1 });
		arnie.userData.limbs.armL.rotation.x = -1.1;
		arnie.userData.limbs.armR.rotation.set(-0.3, 0, 1.4);
		k.box(0.06, 0.08, 0.9, 0x2a2018, { x: 0.95, y: 1.45, z: 0.1, ry: 0.2, parent: b1 });
		const john = k.person({ y: 0.05, z: -0.7, s: 0.8, pose: "sit", colors: { shirt: 0x6a2a2a, legs: 0x4a5a7a, hair: 0x4a3018 }, parent: b1 });
		john.userData.limbs.armL.rotation.x = -1.3;
		john.userData.limbs.armR.rotation.x = -1.3;
		const truck = k.group({ x: -1.5, y: 0, z: -6, parent: drain });
		[-1.6, 1.6].forEach((x) => [2.5, -1.5, -3.2].forEach((z) => k.cyl(0.75, 0.75, 0.6, 0x1a1a1a, { x, y: 0.75, z, rz: PI / 2, parent: truck })));
		k.box(3.6, 2.6, 3, 0xe8e4dc, { y: 2.6, z: 2.4, parent: truck });
		k.box(3.4, 1.2, 0.1, 0x2a3a4a, { y: 3.3, z: 3.92, rx: -0.1, parent: truck, rough: 0.1 });
		k.box(3.8, 0.5, 0.4, 0xc8c8c8, { y: 1.1, z: 4.0, parent: truck, metal: 0.8, rough: 0.3 });
		k.box(3.6, 1.2, 1.8, 0xe8e4dc, { y: 1.8, z: 4.7, parent: truck });
		k.box(3.3, 0.9, 0.08, 0xb8b8b8, { y: 1.8, z: 5.62, parent: truck, metal: 0.8 });
		k.box(3.8, 0.6, 7, 0x8a1a1a, { y: 1.4, z: -1.5, parent: truck });
		k.box(0.4, 3, 0.4, 0x4a4a4a, { y: 3, z: -3, rx: 0.5, parent: truck });
		[-1.2, 1.2].forEach((x) => k.cyl(0.12, 0.12, 2.6, 0xc8c8c8, { x, y: 4.6, z: 1, parent: truck, metal: 0.9 }));
		k.box(4, 0.5, 0.6, 0x2a2a2a, { y: 4.1, z: 3.6, parent: truck });
		k.person({ x: 0.8, y: 2.1, z: 2.6, s: 0.95, colors: { shirt: 0x2a3a6a, legs: 0x2a3a6a, hair: 0x2a1a10 }, parent: truck });

		// ---- The liquid-metal man, rising from the checkered floor.
		const ward = k.group({ x: -400, from: 2, until: 2 });
		const checks = k.canvas(256, 256, (g) => {
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
				g.fillStyle = (x + y) % 2 ? "#141414" : "#e8e8e4";
				g.fillRect(x * 32, y * 32, 32, 32);
			}
		});
		checks.wrapS = checks.wrapT = k.THREE.RepeatWrapping;
		checks.repeat.set(5, 10);
		k.plane(10, 20, k.mat(0xffffff, { map: checks, rough: 0.15, metal: 0.1 }), { rx: -PI / 2, parent: ward });
		[-1, 1].forEach((s) => k.box(0.2, 4, 20, 0xc8d0c4, { x: s * 5, y: 2, parent: ward }));
		k.box(10, 0.2, 20, 0xd8dcd4, { y: 4, parent: ward });
		for (let i = 0; i < 4; i++) {
			k.box(0.4, 0.06, 2, 0xffffff, { y: 3.88, z: -8 + i * 5, emissive: 0xffffff, glow: 1, parent: ward });
			k.point(0xe8fff0, 6, 10, { y: 3.4, z: -8 + i * 5, parent: ward });
		}
		const lm = chrome(k, 0xe0e6ee, { top: "#26303e", horizon: "#ffffff", ground: "#4a4a4a", rough: 0.15 });
		const t1000 = k.person({ x: 0, y: -0.45, z: -2, ry: 0.2, colors: {}, parent: ward });
		t1000.traverse((o) => o.isMesh && (o.material = lm));
		t1000.userData.limbs.armR.rotation.set(-1.1, 0, 0.35);
		k.box(0.05, 1.1, 0.2, lm, { y: -1.1, parent: t1000.userData.limbs.armR });
		k.cone(0.1, 0.35, lm, { y: -1.82, rx: PI, s: [0.5, 1, 1], parent: t1000.userData.limbs.armR });
		k.cyl(0.9, 1.1, 0.06, lm, { x: 0, y: 0.02, z: -2, s: [1, 1, 0.8], parent: ward });
		for (let i = 0; i < 6; i++) k.sphere(0.06 + (i % 3) * 0.03, lm, { x: Math.cos(i) * 1.1, y: 0.05, z: -2 + Math.sin(i) * 0.9, parent: ward });
		k.cyl(0.35, 0.6, 0.3, lm, { y: 0.0, z: -2, parent: ward });

		// ---- The playground dream.
		const play = k.group({ z: 400, from: 3, until: 3 });
		k.sky(0x6a9ad0, 0xf8e8c8, { r: 400, tag: "lasky", parent: play });
		k.ground(600, 0x8aa858, { bump: 0.3, parent: play });
		k.cyl(14, 14, 0.06, 0xd8c08a, { y: 0.02, z: -4, parent: play, seg: 24 });
		const swings = k.group({ x: -4, z: -6, parent: play });
		[-3, 3].forEach((x) => [-1, 1].forEach((s) => k.cyl(0.08, 0.08, 4.4, 0xc83a2a, { x: x + s * 0.0, y: 2.1, z: s * 1.0, rx: s * 0.25, parent: swings, metal: 0.4 })));
		k.cyl(0.08, 0.08, 6.2, 0xc83a2a, { y: 4.2, rz: PI / 2, parent: swings, metal: 0.4 });
		const seats = [];
		[-1.8, 0, 1.8].forEach((x, i) => {
			const sw = k.group({ x, y: 4.2, parent: swings });
			[-0.25, 0.25].forEach((dx) => k.cyl(0.015, 0.015, 3.4, 0x8a8a8a, { x: dx, y: -1.7, parent: sw }));
			k.box(0.7, 0.06, 0.3, 0x2a2a2a, { y: -3.4, parent: sw });
			seats.push([sw, i]);
		});
		k.tick((t) => seats.forEach(([sw, i]) => (sw.rotation.x = Math.sin(t * 1.4 + i) * 0.35)));
		const slide = k.group({ x: 5, z: -8, ry: -0.6, parent: play });
		k.box(1.2, 0.1, 5, 0xe8c030, { y: 1.6, z: 1.6, rx: 0.65, parent: slide, metal: 0.4 });
		k.box(1.4, 0.15, 1.4, 0x3a6ab0, { y: 3.3, z: -1.2, parent: slide });
		[-0.6, 0.6].forEach((x) => [-1.8, -0.6].forEach((z) => k.cyl(0.06, 0.06, 3.3, 0x3a6ab0, { x, y: 1.65, z, parent: slide })));
		const kr = rng(6);
		for (let i = 0; i < 5; i++) k.person({ x: -6 + i * 3 + kr(), z: -2 - kr() * 4, s: 0.55, ry: kr() * 6, pose: i % 2 ? "run" : "raise", colors: { shirt: [0xe85a5a, 0x5ab0e8, 0xf2c230, 0x7ad070, 0xe080c0][i], legs: 0x4a5a8a }, parent: play });
		for (let i = 0; i < 30; i++) {
			const h = 15 + kr() * 45;
			k.box(8 + kr() * 8, h, 8, [0xa8b0bc, 0x9aa2ae, 0xb8bcc4][i % 3], { x: -150 + i * 10 + kr() * 4, y: h / 2, z: -180 - kr() * 30, parent: play });
		}
		const fence = k.canvas(128, 128, (g) => {
			g.clearRect(0, 0, 128, 128);
			g.strokeStyle = "#d8dce0";
			g.lineWidth = 4;
			for (let i = -128; i < 256; i += 32) {
				g.beginPath();
				g.moveTo(i, 0);
				g.lineTo(i + 128, 128);
				g.stroke();
				g.beginPath();
				g.moveTo(i + 128, 0);
				g.lineTo(i, 128);
				g.stroke();
			}
		});
		fence.wrapS = fence.wrapT = k.THREE.RepeatWrapping;
		fence.repeat.set(16, 3);
		k.plane(30, 4, new k.THREE.MeshStandardMaterial({ map: fence, transparent: true, alphaTest: 0.3, side: k.THREE.DoubleSide, metalness: 0.5, roughness: 0.4 }), { y: 2, z: 6, parent: play, shadow: false });
		for (let i = 0; i < 6; i++) k.cyl(0.06, 0.06, 4.2, 0x9aa0a8, { x: -15 + i * 6, y: 2.1, z: 6, parent: play, metal: 0.6 });
		k.cyl(0.05, 0.05, 30, 0x9aa0a8, { y: 4.1, z: 6, rz: PI / 2, parent: play, metal: 0.6 });
		const blast = k.group({ x: 30, y: 0, z: -260, s: 1.5, parent: play });
		k.cyl(9, 18, 80, 0xd87040, { y: 40, parent: blast, emissive: 0xa03010, glow: 0.8, seg: 12 });
		k.sphere(34, 0xffb060, { y: 92, s: [1.5, 0.7, 1.5], parent: blast, emissive: 0xff6020, glow: 0.9, seg: 16, rings: 10 });
		k.torus(36, 12, 0x8a4a3a, { y: 80, rx: PI / 2, parent: blast, emissive: 0x501808, glow: 0.8 });
		k.sphere(16, 0xfff0c0, { y: 96, z: 20, s: [1.6, 0.8, 1], parent: blast, emissive: 0xffd080, glow: 1 });
		k.torus(46, 5, 0xe0c8a8, { y: 46, rx: PI / 2, parent: blast, emissive: 0x806040, glow: 0.6 });
		k.glow(0xffd0a0, 140, { y: 80, parent: blast, opacity: 0.45 });
		k.point(0xffc080, 40, 600, { y: 80, z: 50, parent: blast, decay: 0.5 });

		// ---- A roadside bar at night: pickups and motorcycles out front.
		const bar = k.group({ x: 400, z: 400, from: 0, until: 0 });
		k.ground(120, 0x5a5048, { bump: 0.15, parent: bar });
		k.box(16, 4.4, 8, 0x6a5038, { y: 2.2, z: -6, parent: bar });
		for (let i = 0; i < 14; i++) k.box(0.08, 4.4, 0.1, 0x4a3828, { x: -7.5 + i * 1.15, y: 2.2, z: -1.96, parent: bar });
		k.box(17, 0.3, 9, 0x3a2c22, { y: 4.5, z: -6, parent: bar });
		k.box(16, 0.2, 3, 0x4a3a2a, { y: 3.2, z: -0.6, rx: -0.12, parent: bar });
		[-7.6, -2, 2, 7.6].forEach((x) => k.cyl(0.1, 0.1, 3.2, 0x3a2a1c, { x, y: 1.6, z: 0.8, parent: bar }));
		k.box(1.4, 2.4, 0.1, 0x2a1a10, { x: -1, y: 1.2, z: -1.9, parent: bar });
		[2.5, 5.2].forEach((x) => {
			k.box(1.6, 1.0, 0.1, 0xffc070, { x, y: 1.8, z: -1.92, parent: bar, emissive: 0xffa040, glow: 0.7 });
			k.point(0xffa040, 4, 6, { x, y: 1.8, z: -1.2, parent: bar });
		});
		const beer = k.canvas(256, 96, (g, w, h) => {
			g.fillStyle = "#0a0606";
			g.fillRect(0, 0, w, h);
			g.font = "bold 64px sans-serif";
			g.textAlign = "center";
			g.textBaseline = "middle";
			g.shadowColor = "#ff3a3a";
			g.shadowBlur = 16;
			g.fillStyle = "#ff8a7a";
			g.fillText("BEER", w / 2, h / 2);
		});
		k.plane(2.4, 0.9, flat(k, beer), { x: 3.9, y: 2.75, z: -1.9, parent: bar });
		k.point(0xff4a4a, 6, 8, { x: 3.9, y: 2.7, z: -0.8, parent: bar });
		const moto = (x, ry) => {
			const g = k.group({ x, z: 2.2, ry, parent: bar });
			[-0.8, 0.8].forEach((z) => k.torus(0.34, 0.09, 0x141414, { z, y: 0.42, ry: PI / 2, parent: g, seg: 16 }));
			k.box(0.26, 0.3, 1.2, 0x1a1a1e, { y: 0.7, parent: g, metal: 0.6, rough: 0.3 });
			k.sphere(0.24, [0x1a1a1e, 0x6a1a1a, 0x1a2a4a][Math.abs(Math.round(x)) % 3], { y: 0.95, z: 0.2, s: [0.8, 0.6, 1.3], parent: g, metal: 0.6, rough: 0.2 });
			k.cyl(0.03, 0.03, 0.8, 0xd0d0d0, { y: 1.15, z: 0.7, rz: PI / 2, parent: g, metal: 0.9, rough: 0.2 });
			k.cyl(0.04, 0.04, 1.1, 0xd0d0d0, { x: 0.18, y: 0.4, z: -0.4, rx: PI / 2, parent: g, metal: 0.9, rough: 0.2 });
			k.box(0.3, 0.1, 0.5, 0x2a1a10, { y: 0.92, z: -0.35, parent: g });
		};
		[-6, -4.6, -3.2, -1.8, 0.8, 2.2].forEach((x, i) => moto(x, PI + 0.5 + (i % 2) * 0.08));
		const pick = k.group({ x: 7.5, z: 4, ry: 0.3, parent: bar });
		k.box(2.0, 0.8, 5, 0x6a7a8a, { y: 0.9, parent: pick, metal: 0.4, rough: 0.5 });
		k.box(1.9, 0.8, 1.8, 0x6a7a8a, { y: 1.7, z: 0.6, parent: pick, metal: 0.4, rough: 0.5 });
		k.box(1.8, 0.6, 1.82, 0x2a3a4a, { y: 1.75, z: 0.6, parent: pick, rough: 0.1 });
		[-0.9, 0.9].forEach((x) => [-1.6, 1.6].forEach((z) => k.cyl(0.4, 0.4, 0.3, 0x141414, { x, y: 0.4, z, rz: PI / 2, parent: pick })));
		k.box(0.12, 6, 0.12, 0x4a4a4a, { x: -10, y: 3, z: 3, parent: bar });
		k.sphere(0.3, 0xfff0c0, { x: -10, y: 6, z: 3.3, parent: bar, emissive: 0xffd080, glow: 1 });
		k.spot(0xffd8a0, 40, { x: 390, y: 6, z: 403.3, target: [395, 0, 402], angle: 0.8, distance: 30 });
		k.point(0x8aa0d0, 6, 30, { x: 6, y: 8, z: 12, parent: bar });
		k.disc(0xe8e8f0, 8, { x: -40, y: 50, z: -150, parent: bar });

		// ---- The steel mill: goodbye.
		const mill = k.group({ z: -400, from: 5, until: 5 });
		k.box(60, 0.4, 60, 0x2a2420, { y: -1.5, parent: mill });
		const molten = k.canvas(256, 256, (g) => {
			g.fillStyle = "#ff8a20";
			g.fillRect(0, 0, 256, 256);
			const r = rng(9);
			for (let i = 0; i < 120; i++) {
				g.fillStyle = r() > 0.5 ? "rgba(255,240,160,0.6)" : "rgba(200,60,10,0.5)";
				g.beginPath();
				g.ellipse(r() * 256, r() * 256, 6 + r() * 20, 3 + r() * 8, r() * 3, 0, PI * 2);
				g.fill();
			}
		});
		molten.wrapS = molten.wrapT = k.THREE.RepeatWrapping;
		molten.repeat.set(3, 3);
		k.plane(16, 16, flat(k, molten, { fog: false }), { rx: -PI / 2, parent: mill, shadow: false });
		k.tick((t) => (molten.offset.x = t * 0.02));
		[-1, 1].forEach((s) => k.box(18, 1.8, 1, 0x3a3430, { y: -0.6, z: s * 8.5, parent: mill }));
		[-1, 1].forEach((s) => k.box(1, 1.8, 16, 0x3a3430, { x: s * 8.5, y: -0.6, parent: mill }));
		k.box(20, 0.3, 2.5, 0x4a4440, { x: 0, y: 3.2, z: -10, parent: mill, metal: 0.5 });
		for (let i = 0; i < 10; i++) k.box(0.06, 1, 0.06, 0xa8a090, { x: -9 + i * 2, y: 3.8, z: -9, parent: mill });
		k.box(20, 0.06, 0.06, 0xa8a090, { y: 4.3, z: -9, parent: mill });
		k.person({ x: -1.2, y: 3.35, z: -9.9, s: 1, colors: { shirt: 0x4a4a3a, legs: 0x2a2a2a, hair: 0x2a1a10 }, sleeves: 0x4a4a3a, parent: mill });
		k.person({ x: 0, y: 3.35, z: -9.9, s: 0.8, colors: { shirt: 0x6a2a2a, legs: 0x4a5a7a, hair: 0x4a3018 }, parent: mill });
		for (let i = 0; i < 6; i++) k.box(1.2, 30, 1.2, 0x2a2624, { x: -14 + i * 5.6, y: 13, z: -14, parent: mill });
		k.box(30, 1.5, 1.5, 0x3a3430, { y: 14, z: -2, parent: mill });
		for (let i = 0; i < 12; i++) k.torus(0.12, 0.03, 0x5a5450, { y: 13 - i * 0.2, z: -2, ry: (i % 2) * PI / 2, parent: mill, seg: 8 });
		const t800 = k.person({ x: 0, y: -0.95, z: 0, ry: 0.25, pose: "raise", shades: false, colors: { shirt: 0x161618, legs: 0x161618, hair: 0x2a1a10, skin: 0xc89878 }, sleeves: 0x161618, parent: mill });
		const arm = t800.userData.limbs.armR;
		arm.rotation.set(0, 0, 2.95);
		arm.children[0].material = k.mat(0xc89878);
		k.box(0.2, 0.16, 0.18, 0xc89878, { y: -0.78, parent: arm });
		k.box(0.06, 0.16, 0.06, 0xc89878, { x: -0.08, y: -0.92, parent: arm });
		k.sphere(0.08, lm, { x: 0.1, y: 1.78, z: 0.13, parent: t800 });
		k.sphere(0.035, 0xff1a10, { x: 0.08, y: 1.78, z: 0.2, emissive: 0xff0000, glow: 3, parent: t800 });
		k.glow(0xff2010, 0.4, { x: 0.08, y: 1.78, z: 0.24, parent: t800 });
		k.tick((t) => (t800.position.y = -0.95 - (Math.sin(t * 0.3) * 0.5 + 0.5) * 0.12));

		k.cyl(0.6, 0.9, 0.08, 0xffe080, { y: 0.02, parent: mill, emissive: 0xffc040, glow: 1 });
		k.point(0xff8020, 40, 30, { y: 2, z: 3, parent: mill });
		k.point(0xff9a40, 30, 30, { x: 4, y: 6, z: 6, parent: mill });
		k.point(0xffd0a0, 10, 12, { x: -2, y: 3, z: 4, parent: mill });
		k.particles(400, 0xffb040, { z: -400, box: [16, 12, 16], speed: 1.5, drift: 1, size: 0.08, opacity: 0.8, from: 5, until: 5 });
		return {
			shots: [
				{ pos: [395, 2.2, 413], look: [398.5, 1.6, 398], fov: 50, fog: [0x141a2a, 20, 90], exposure: 1.2 },
				{ pos: [404, 2.4, 15], look: [400, 1.9, 2], fov: 50, fog: [0xd8d4c8, 60, 300], hide: ["sky"], exposure: 1.15 },
				{ pos: [-398.6, 0.9, 0.4], look: [-400, 1.3, -2], fov: 50, fog: [0xc8d0c8, 10, 40], exposure: 1.1 },
				{ pos: [-2, 1.7, 412], look: [8, 14, 340], fov: 55, fog: [0xf0d8b8, 60, 500], hide: ["sky"] },
				{ pos: [5.6, 2.0, 6.2], look: [2.2, 1.8, 0.5], fov: 50 },
				{ pos: [1.5, 1.2, -396.6], look: [0, 1.3, -400], fov: 50, fog: [0x2a1408, 8, 50], exposure: 1.2 },

			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the family
	r21: (k) => {
		k.fog(0xd8e0d0, 60, 380);
		k.sky(0x6a9ad0, 0xf0f0e0);
		k.light({ sky: 0xfff8e0, ground: 0x4a5a30, hemi: 1.2, sunColor: 0xfff0d0, sunIntensity: 2.2, sunPos: [30, 60, 40], shadowSize: 40 });
		const orange = (o) => k.sphere(0.12, 0xf0801a, { seg: 10, rings: 8, rough: 0.6, ...o });
		const car = (o) => {
			const g = k.group(o);
			const c = o.color ?? 0x1a1a1e;
			const paint = { metal: 0.5, rough: 0.3 };
			k.box(2.0, 0.7, 5.2, c, { y: 0.75, parent: g, ...paint });
			k.capsule(0.75, 1.3, c, { y: 1.35, z: -0.4, rx: PI / 2, s: [1.3, 1, 0.9], parent: g, ...paint });
			k.box(1.6, 0.5, 0.06, 0x9ab0c0, { y: 1.45, z: 0.75, rx: -0.5, parent: g, rough: 0.1, opacity: 0.7 });
			[-1, 1].forEach((sx) => [-1.7, 1.6].forEach((z) => {
				k.cyl(0.42, 0.42, 0.3, 0x111111, { x: sx * 0.95, y: 0.42, z, rz: PI / 2, parent: g });
				k.cyl(0.25, 0.25, 0.31, 0xe8e8e8, { x: sx * 0.95, y: 0.42, z, rz: PI / 2, parent: g });
				k.sphere(0.55, c, { x: sx * 0.85, y: 0.65, z, s: [0.5, 0.6, 1.2], parent: g, ...paint });
			}));
			k.box(1.4, 0.4, 0.1, 0xd8d8d8, { y: 0.75, z: 2.62, parent: g, metal: 0.9, rough: 0.2 });
			[-0.7, 0.7].forEach((x) => k.sphere(0.13, 0xf8f0d0, { x, y: 0.95, z: 2.55, parent: g, emissive: 0x605030 }));
			return g;
		};

		// ---- A fruit stand in winter.
		const stand = k.group({ x: 300, z: 300, from: 0, until: 0 });
		k.box(20, 0.2, 20, 0x6a6660, { y: -0.1, parent: stand });
		k.box(20, 0.25, 3, 0x8a867e, { y: 0.02, z: -2.5, parent: stand });
		const fr = rng(12);
		[[-1.2, 0xf0801a], [0, 0xc8201a], [1.2, 0xf0801a], [2.4, 0x7ab040]].forEach(([x, c], i) => {
			const crate = k.group({ x, y: 0.9, z: -3.2, rx: 0.35, parent: stand });
			k.box(1.1, 0.35, 0.8, 0x8a6a40, { parent: crate });
			for (let j = 0; j < 12; j++) k.sphere(0.12, c, { x: -0.38 + (j % 4) * 0.25 + fr() * 0.03, y: 0.22, z: -0.22 + Math.floor(j / 4) * 0.22, parent: crate, seg: 10, rings: 8, rough: 0.6 });
			k.box(0.1, 0.9, 0.1, 0x5a4a30, { y: -0.6, parent: crate });
			void i;
		});
		k.box(5, 0.1, 1.2, 0x2a5a2a, { x: 0.6, y: 2.4, z: -3.4, rx: 0.3, parent: stand });
		[[0.4, 0.12, -0.6], [-0.3, 0.12, 0.4], [1.1, 0.12, 0.1], [0.9, 0.12, 0.9], [-0.9, 0.12, -0.2]].forEach(([x, y, z]) => orange({ x, y, z, parent: stand }));
		k.box(0.16, 0.1, 0.36, 0x1a1a1a, { x: -0.5, y: 0.05, z: -1.4, parent: stand });
		k.box(0.16, 0.1, 0.36, 0x1a1a1a, { x: -0.1, y: 0.05, z: -1.6, ry: 0.3, parent: stand });
		k.box(0.6, 0.5, 0.7, 0x8a6a40, { x: 1.6, y: 0.25, z: -1.2, ry: 0.4, parent: stand });
		k.particles(300, 0xffffff, { x: 300, z: 300, box: [10, 6, 10], speed: 0.8, drift: 0.5, size: 0.05, opacity: 0.8, from: 0, until: 0 });
		k.point(0xffe8c8, 6, 12, { x: 1, y: 3, z: 2, parent: stand });

		// ---- The wedding in the garden.
		const wed = k.group({ from: 1, until: 1 });
		k.ground(300, 0x6a9a4a, { bump: 0.2, parent: wed });
		k.box(24, 8, 10, 0xf0ece0, { y: 4, z: -30, parent: wed });
		prism(k, 11, 4, 25, 0x5a3a2a, { y: 8, z: -30, ry: PI / 2, parent: wed });
		for (let i = 0; i < 6; i++) k.box(1.2, 1.6, 0.1, 0x3a4a5a, { x: -9 + i * 3.6, y: 5, z: -24.95, parent: wed });
		const cloth = 0xf8f6f0;
		[-6, 6].forEach((x) => [-4, 4].forEach((z) => {
			k.box(8, 0.78, 1.3, cloth, { x, y: 0.39, z, parent: wed });
			for (let i = 0; i < 6; i++) {
				k.cyl(0.04, 0.05, 0.3, [0x3a6a3a, 0x8a1a2a][i % 2], { x: x - 3 + i * 1.2, y: 0.93, z, parent: wed });
				k.cyl(0.14, 0.14, 0.02, 0xffffff, { x: x - 3.5 + i * 1.2, y: 0.79, z: z + 0.35, parent: wed });
			}
		}));
		for (let i = 0; i < 10; i++) {
			const x = -14 + i * 3.1;
			k.cyl(0.06, 0.06, 4, 0xf0f0e8, { x, y: 2, z: -10, parent: wed });
			k.cyl(0.06, 0.06, 4, 0xf0f0e8, { x, y: 2, z: 10, parent: wed });
		}
		for (let i = 0; i < 40; i++) {
			const u = i / 39;
			[-10, 10].forEach((z) => k.glow(0xfff0b0, 0.4, { x: -14 + u * 28, y: 3.9 - Math.sin(((u * 9) % 1) * PI) * 0.5, z, parent: wed }));
		}
		k.box(6, 0.6, 4, 0xf0ece0, { x: 0, y: 0.3, z: -16, parent: wed });
		for (let i = 0; i < 4; i++) k.person({ x: -2 + i * 1.3, y: 0.6, z: -16.5, s: 0.95, colors: { shirt: 0x1a1a1a, legs: 0x1a1a1a, hair: 0x2a1a10 }, parent: wed });
		const pr = rng(4);
		const guestColors = [0xc84a5a, 0x4a6ab0, 0xe8c040, 0x6aa060, 0xd890c0, 0x1a1a1a, 0x8a5a3a];
		for (let i = 0; i < 26; i++) {
			const x = (pr() - 0.5) * 26;
			const z = (pr() - 0.5) * 18;
			if (Math.abs(z - 4) < 1.2 || Math.abs(z + 4) < 1.2) continue;
			const c = guestColors[i % guestColors.length];
			k.person({ x, z, ry: pr() * 6, pose: i % 4 === 0 ? "raise" : "stand", dress: i % 2 ? c : undefined, colors: { shirt: i % 2 ? c : 0x1a1a1a, legs: i % 2 ? c : 0x1a1a1a, hair: [0x2a1a10, 0x111111, 0x5a3a20][i % 3] }, parent: wed });
		}
		k.person({ x: 0.5, z: 0, ry: 0.3, dress: 0xffffff, colors: { shirt: 0xffffff, legs: 0xffffff, hair: 0x2a1a10 }, pose: "arms-out", parent: wed });
		k.cone(0.4, 0.9, 0xffffff, { x: 0.45, y: 1.6, z: -0.15, opacity: 0.6, parent: wed });
		k.person({ x: -0.3, z: 0.2, ry: 2.2, colors: { shirt: 0x1a1a1a, legs: 0x1a1a1a, hair: 0x3a2a1a }, parent: wed });
		const tr = rng(9);
		for (let i = 0; i < 20; i++) {
			const a = tr() * PI * 2;
			const d = 30 + tr() * 50;
			k.cyl(0.4, 0.6, 6, 0x4a3424, { x: Math.cos(a) * d, y: 3, z: Math.sin(a) * d, parent: wed });
			k.ico(4 + tr() * 2, 0x3a6a2a, { x: Math.cos(a) * d, y: 8, z: Math.sin(a) * d, parent: wed });
		}

		// ---- The causeway tollbooth.
		const toll = k.group({ x: -400, from: 2, until: 2 });
		k.sky(0x7a8aa8, 0xe8d8c0, { r: 300, tag: "dusk", parent: toll });
		k.box(30, 0.2, 200, 0x3a3a3c, { y: -0.1, parent: toll });
		k.ground(300, 0x8a8a6a, { y: -0.3, bump: 0.6, parent: toll });
		for (let i = 0; i < 20; i++) k.box(0.2, 0.02, 2.5, 0xe8e0c0, { y: 0.01, z: -60 + i * 6, x: 0, parent: toll });
		[-5, 5].forEach((x) => {
			k.box(2.2, 2.4, 2.2, 0xe8e4d8, { x, y: 1.2, z: -2, parent: toll });
			k.box(2.3, 0.9, 2.3, 0x8ab0c0, { x, y: 1.8, z: -2, parent: toll, rough: 0.1, opacity: 0.8 });
			k.box(2.6, 0.3, 2.6, 0x3a5a3a, { x, y: 2.55, z: -2, parent: toll });
			k.box(2.6, 0.4, 5, 0xd8d4c8, { x, y: 0.2, z: -2, parent: toll });
		});
		k.box(18, 0.5, 6, 0xe8e4d8, { y: 5.2, z: -2, parent: toll });
		[-8.5, 0, 8.5].forEach((x) => k.cyl(0.2, 0.2, 5, 0xd8d4c8, { x, y: 2.5, z: -0.5, parent: toll }));
		const sonnyCar = car({ x: 0.2, y: 0, z: -2, ry: 0.05, parent: toll, color: 0x2a2a30 });
		const hr = rng(41);
		for (let i = 0; i < 60; i++) {
			const side = hr() > 0.5 ? 1 : -1;
			k.cyl(0.04, 0.04, 0.02, 0x0a0a0a, { x: side * 1.01, y: 0.55 + hr() * 1.1, z: -2.2 + hr() * 4.6, rz: PI / 2, parent: sonnyCar, shadow: false, seg: 6 });
		}
		for (let i = 0; i < 10; i++) k.box(0.3 + hr() * 0.4, 0.01, 0.01, 0xffffff, { y: 1.45 + (hr() - 0.5) * 0.4, z: 0.79, x: (hr() - 0.5) * 1.2, rz: hr() * 3, rx: -0.5, parent: sonnyCar, shadow: false });
		const sonny = k.person({ x: 1.8, y: 0.15, z: -1.5, rx: -PI / 2, rz: 0.3, pose: "arms-out", colors: { shirt: 0xe8e4d8, legs: 0x3a3430, hair: 0x2a1a10 }, parent: toll });
		void sonny;
		for (let i = 0; i < 4; i++) k.person({ x: -6 + i * 0.5, z: 1 + i * 0.6, ry: 1.2, pose: "point", hat: 0x2a2a2a, coat: 0x3a3a3a, colors: { shirt: 0x3a3a3a, legs: 0x2a2a2a }, sleeves: 0x3a3a3a, parent: toll });
		for (let i = 0; i < 40; i++) k.cyl(0.03, 0.03, 0.02, 0x0a0a0a, { x: -3.88, y: 0.6 + hr() * 1.7, z: -3 + hr() * 2, rz: PI / 2, parent: toll, seg: 6 });

		// ---- The bedroom at dawn.
		const bed = k.group({ z: 400, from: 3, until: 3 });
		k.box(14, 0.2, 14, 0x5a4030, { y: -0.1, parent: bed });
		k.box(14, 6, 0.2, 0xd8c8b0, { y: 3, z: -4, parent: bed });
		k.box(3.4, 2.4, 0.2, 0x5a3a24, { y: 1.2, z: -3.4, parent: bed });
		k.box(3.4, 0.6, 4.4, 0x5a3a24, { y: 0.3, z: -1, parent: bed });
		k.box(3.2, 0.35, 4.2, 0xf4ece0, { y: 0.78, z: -1, parent: bed, rough: 0.3 });
		k.box(1.1, 0.25, 0.6, 0xffffff, { x: -0.7, y: 1.05, z: -2.8, parent: bed });
		k.box(1.1, 0.25, 0.6, 0xffffff, { x: 0.7, y: 1.05, z: -2.8, parent: bed });
		k.box(3.25, 0.25, 2.8, 0xe8dcc8, { y: 1.05, z: -0.4, parent: bed, rough: 0.25 });
		const woltz = k.person({ x: -0.6, y: 0.95, z: -2.1, rx: -0.3, pose: "raise", colors: { shirt: 0xe8d8c8, legs: 0xe8d8c8, hair: 0x6a6a6a, skin: 0xe0b090 }, parent: bed });
		woltz.userData.limbs.armR.rotation.set(-2.2, 0, 0.6);
		woltz.userData.limbs.armL.rotation.set(-2.0, 0, -0.6);
		woltz.userData.limbs.legL.visible = false;
		woltz.userData.limbs.legR.visible = false;
		const blood = 0x6a0a10;
		k.sphere(0.6, blood, { x: 0.5, y: 1.15, z: 0.4, s: [1.4, 0.06, 1.2], parent: bed, rough: 0.3 });
		k.sphere(0.4, blood, { x: 1.2, y: 1.12, z: 0.0, s: [1.2, 0.06, 1.6], parent: bed, rough: 0.3 });
		k.box(0.6, 0.6, 0.02, blood, { x: 1.6, y: 0.7, z: 0.8, parent: bed });
		const horse = k.group({ x: 0.6, y: 1.25, z: 0.5, ry: -0.6, rz: 0.15, parent: bed });
		const hc = 0x4a2a18;
		k.box(0.5, 0.6, 1.2, hc, { y: 0.1, z: -0.1, parent: horse });
		k.box(0.38, 0.4, 0.7, hc, { y: -0.05, z: 0.7, rx: 0.2, parent: horse });
		k.box(0.4, 0.2, 0.3, 0x2a1a10, { y: -0.12, z: 1.0, parent: horse });
		[-1, 1].forEach((s) => {
			k.cone(0.07, 0.25, hc, { x: s * 0.15, y: 0.5, z: -0.45, parent: horse, seg: 4 });
			k.sphere(0.06, 0x0a0a0a, { x: s * 0.26, y: 0.22, z: 0.2, parent: horse });
			k.sphere(0.035, 0x0a0a0a, { x: s * 0.1, y: -0.05, z: 1.15, parent: horse });
		});
		k.box(0.12, 0.25, 1.1, 0x1a1008, { y: 0.45, z: -0.45, parent: horse });
		k.cyl(0.3, 0.32, 0.2, 0x8a1010, { y: 0.0, z: -0.7, rx: PI / 2, parent: horse });
		k.box(0.5, 0.5, 0.5, 0x5a4030, { x: -2.4, y: 0.25, z: -3, parent: bed });
		k.cyl(0.15, 0.25, 0.5, 0xd8c8a0, { x: -2.4, y: 0.75, z: -3, parent: bed });
		k.point(0xffe0b0, 6, 8, { x: -2.4, y: 1.6, z: -2.6, parent: bed });
		k.point(0xb8c8e8, 10, 14, { x: 3, y: 3, z: 3, parent: bed });

		// ---- The puppeteer's hand.
		const pup = k.group({ z: -400, from: 5, until: 5 });
		const hand = k.group({ y: 4.2, rx: 0.25, parent: pup });
		const skin = k.mat(0xf2eee6, { flat: false });
		k.cyl(0.32, 0.36, 3, skin, { y: 2.1, z: -0.1, parent: hand });
		k.box(0.82, 0.9, 0.3, skin, { y: 0.3, parent: hand });
		for (let i = 0; i < 4; i++) {
			const x = -0.3 + i * 0.2;
			const len = [0.42, 0.5, 0.48, 0.38][i];
			k.capsule(0.08, len, skin, { x, y: -0.4, z: 0.08, rx: 0.35, parent: hand });
			k.capsule(0.075, len * 0.7, skin, { x, y: -0.82, z: 0.26, rx: 0.9, parent: hand });
		}
		k.capsule(0.09, 0.35, skin, { x: 0.48, y: 0.0, z: 0.18, rz: 0.5, rx: 0.5, parent: hand });
		const bar = 0xc8c0b0;
		const cross = k.group({ y: -1.0, z: 0.38, rx: -0.25, parent: hand });
		k.box(2.6, 0.1, 0.1, bar, { parent: cross });
		k.box(0.1, 0.1, 1.8, bar, { parent: cross });
		[[-1.25, 0], [1.25, 0], [0, -0.85], [0, 0.85], [-0.6, 0], [0.6, 0]].forEach(([x, z]) => k.cyl(0.006, 0.006, 6, 0xffffff, { x, y: -3, z, parent: cross, emissive: 0x999999, shadow: false }));
		k.spot(0xffffff, 60, { x: 2, y: 8, z: -394, target: [0, 4, -400], angle: 0.35, distance: 20 });
		k.point(0xd8d8e8, 4, 10, { x: -3, y: 3, z: 3, parent: pup });

		// ---- The office, the day of the wedding.
		const off = k.group({ x: 400, from: 4, until: 4 });
		k.box(14, 0.2, 14, 0x3a2414, { y: -0.1, parent: off });
		k.box(14, 6, 0.2, 0x2a1a10, { y: 3, z: -3, parent: off });
		const blinds = k.canvas(64, 256, (g) => {
			g.fillStyle = "#3a2a1a";
			g.fillRect(0, 0, 64, 256);
			g.fillStyle = "#ffe8b8";
			for (let y = 4; y < 256; y += 16) g.fillRect(0, y, 64, 8);
		});
		[-2.8, 2.8].forEach((x) => k.plane(1.4, 2.4, flat(k, blinds), { x, y: 2.6, z: -2.88, parent: off }));
		k.box(1.1, 1.6, 0.6, 0x3a1a10, { y: 1.1, z: -0.7, parent: off, rough: 0.4 });
		k.box(1.0, 0.25, 1.0, 0x3a1a10, { y: 0.45, z: -0.2, parent: off, rough: 0.4 });
		[-0.55, 0.55].forEach((x) => k.box(0.15, 0.3, 0.9, 0x3a1a10, { x, y: 0.7, z: -0.2, parent: off, rough: 0.4 }));
		const don = k.person({ y: -0.28, z: -0.3, pose: "sit", colors: { shirt: 0x141416, legs: 0x141416, hair: 0x2a2624, skin: 0xd8a888 }, parent: off });
		don.userData.limbs.armR.rotation.set(-1.1, 0, 0.25);
		don.userData.limbs.armL.rotation.set(-0.9, 0, -0.15);
		k.box(0.18, 0.5, 0.02, 0xf4f0e8, { y: 1.25, z: 0.15, parent: don });
		k.box(0.18, 0.06, 0.04, 0x0a0a0a, { y: 1.49, z: 0.16, parent: don });
		k.sphere(0.05, 0xb01020, { x: -0.17, y: 1.42, z: 0.16, parent: don });
		k.box(0.05, 0.06, 0.02, 0x2a6a2a, { x: -0.17, y: 1.36, z: 0.15, parent: don });
		[-0.07, 0.07].forEach((x) => {
			k.sphere(0.022, 0x140c08, { x, y: 1.77, z: 0.185, parent: don });
			k.box(0.08, 0.02, 0.02, 0x2a2420, { x, y: 1.82, z: 0.19, rz: x * 2, parent: don });
		});
		k.box(0.045, 0.08, 0.05, 0xc89878, { y: 1.73, z: 0.21, parent: don });
		k.box(0.08, 0.012, 0.01, 0x6a3a30, { y: 1.665, z: 0.195, parent: don });
		k.sphere(0.13, 0xd0a080, { y: 1.65, z: 0.07, s: [1.3, 0.8, 1], parent: don });

		const cat = k.group({ x: 0.05, y: 0.72, z: 0.32, ry: 0.4, parent: off });
		const cc = 0x5e5e62;
		k.sphere(0.2, cc, { s: [1, 0.7, 1.5], parent: cat });
		k.sphere(0.12, cc, { x: 0.05, y: 0.12, z: 0.3, parent: cat });
		[-1, 1].forEach((s) => k.cone(0.04, 0.1, cc, { x: 0.05 + s * 0.07, y: 0.24, z: 0.3, parent: cat, seg: 4 }));
		k.capsule(0.03, 0.4, cc, { x: -0.1, y: -0.05, z: -0.3, rx: 1.2, parent: cat });
		k.box(1.6, 0.08, 1.0, 0x4a2a18, { y: 0.95, z: 1.6, parent: off, rough: 0.3 });
		k.box(1.5, 0.9, 0.9, 0x3a2010, { y: 0.45, z: 1.6, parent: off });
		k.cyl(0.05, 0.08, 0.02, 0xc8c0a0, { x: -0.5, y: 1.0, z: 1.5, parent: off });
		k.cyl(0.03, 0.02, 0.08, 0xe8e0d0, { x: 0.6, y: 1.03, z: 1.4, parent: off, opacity: 0.6 });
		k.spot(0xffd8a0, 30, { x: 400, y: 4.5, z: 0.4, target: [400, 1.2, -0.2], angle: 0.4, distance: 10 });
		k.point(0xffb870, 3, 8, { x: 1.6, y: 2, z: 2.5, parent: off });
		return {
			shots: [
				{ pos: [300.6, 0.5, 301.6], look: [300.3, 0.15, 300.1], fov: 45, fog: [0x8a8a88, 4, 30] },
				{ pos: [10, 3.4, 16], look: [0, 1.4, -2], fov: 50 },
				{ pos: [-395.4, 1.7, 3.2], look: [-399.4, 0.9, -2], fov: 50, fog: [0xd8c8b0, 60, 300], hide: ["sky"] },
				{ pos: [1.6, 2.0, 402.6], look: [0.3, 1.2, 400.2], fov: 50, fog: [0x2a2420, 8, 30], exposure: 1.3 },
				{ pos: [400.5, 1.45, 2.3], look: [400, 1.3, -0.3], fov: 40, fog: [0x140c06, 4, 20], exposure: 1.3 },
				{ pos: [0.2, 3.0, -395.6], look: [0, 3.4, -400], fov: 50, fog: [0x000000, 6, 30] },

			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the motel
	r22: (k) => {
		const BW = "grayscale(1) contrast(1.25) brightness(1.05)";
		k.fog(0x30343c, 40, 260);
		k.sky(0x14161c, 0x5a606a, { offset: -0.02 });
		k.light({ sky: 0xc8d0e0, ground: 0x30302a, hemi: 1.3, sunColor: 0xd8e0ff, sunIntensity: 1.4, sunPos: [-40, 50, 40], shadowSize: 60 });

		// ---- The bathroom: tub, drain, shower, curtain.
		const bath = k.group({ z: 400, from: 0 });
		const tiles = k.canvas(256, 256, (g) => {
			g.fillStyle = "#c8c8c4";
			g.fillRect(0, 0, 256, 256);
			g.fillStyle = "#f4f4f0";
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.fillRect(x * 32 + 2, y * 32 + 2, 28, 28);
		});
		tiles.wrapS = tiles.wrapT = k.THREE.RepeatWrapping;
		tiles.repeat.set(3, 3);
		const tileMat = k.mat(0xffffff, { map: tiles, rough: 0.3 });
		k.box(4, 0.1, 4, tileMat, { y: -0.05, parent: bath });
		k.box(4, 3, 0.1, tileMat, { y: 1.5, z: -1.0, parent: bath });
		k.box(0.1, 3, 4, tileMat, { x: -0.85, y: 1.5, parent: bath });
		k.box(0.1, 3, 4, tileMat, { x: 0.85, y: 1.5, z: -1.6, s: [1, 1, 0.2], parent: bath });
		const white = { rough: 0.25 };
		k.box(1.6, 0.1, 2.0, 0xf4f4f0, { y: 0.05, z: -0.0, parent: bath, ...white });
		k.box(1.6, 0.5, 0.1, 0xf4f4f0, { y: 0.3, z: 0.95, parent: bath, ...white });
		k.box(0.1, 0.5, 2.0, 0xf4f4f0, { x: 0.75, y: 0.3, parent: bath, ...white });
		k.cyl(0.07, 0.07, 0.02, 0x9a9a9a, { x: 0, y: 0.105, z: -0.7, parent: bath, metal: 0.9, rough: 0.2, seg: 20 });
		for (let i = 0; i < 6; i++) k.cyl(0.008, 0.008, 0.025, 0x0a0a0a, { x: Math.cos(i) * 0.04, y: 0.105, z: -0.7 + Math.sin(i) * 0.04, parent: bath, seg: 5 });
		const swirl = k.canvas(256, 256, (g) => {
			g.clearRect(0, 0, 256, 256);
			g.lineCap = "round";
			for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 80; i++) {
				const a = arm * 2.1 + i * 0.12;
				const r = 6 + i * 1.5;
				g.strokeStyle = `rgba(${arm === 0 ? "40,10,10" : "150,170,190"},${0.6 - i / 160})`;
				g.lineWidth = 6 - i / 20;
				g.beginPath();
				g.arc(128, 128, r, a, a + 0.3);
				g.stroke();
			}
		});
		const sw = k.plane(0.7, 0.7, new k.THREE.MeshStandardMaterial({ map: swirl, transparent: true, depthWrite: false, roughness: 0.05, metalness: 0.2 }), { x: 0, y: 0.112, z: -0.7, rx: -PI / 2, parent: bath });
		k.tick((t) => (sw.rotation.z = -t * 2));
		k.mesh(new k.THREE.CircleGeometry(0.75, 24), new k.THREE.MeshStandardMaterial({ color: 0xc0d0e0, transparent: true, opacity: 0.25, roughness: 0.02 }), { y: 0.108, z: -0.4, rx: -PI / 2, parent: bath });
		const showerY = 2.1;
		k.cyl(0.03, 0.03, 0.42, 0xb8b8b8, { x: 0, y: showerY + 0.15, z: -0.83, rx: 2.1, parent: bath, metal: 0.6, rough: 0.3 });
		k.cyl(0.1, 0.16, 0.12, 0xc8c8c8, { x: 0, y: showerY, z: -0.62, rx: -0.6, parent: bath, metal: 0.6, rough: 0.3, seg: 20 });
		const face = k.canvas(128, 128, (g) => {
			g.fillStyle = "#b0b0b0";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#101010";
			for (let r = 10; r < 60; r += 12) for (let i = 0; i < r / 2; i++) {
				const a = (i / (r / 2)) * PI * 2;
				g.beginPath();
				g.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2.5, 0, PI * 2);
				g.fill();
			}
		});
		k.mesh(new k.THREE.CircleGeometry(0.155, 24), k.mat(0xffffff, { map: face, metal: 0.1, rough: 0.4, emissive: 0x606060, glow: 0.6 }),
 { x: 0, y: showerY - 0.052, z: -0.585, rx: 0.98, parent: bath });

		k.particles(500, 0xe8f0ff, { x: 0, y: 0.1, z: 399.6, box: [0.9, showerY - 0.1, 0.9], speed: 6, size: 0.012,
 opacity: 0.7, from: 3, until: 4 });
		const curtainTex = k.canvas(256, 256, (g) => {
			g.fillStyle = "#e8e8e8";
			g.fillRect(0, 0, 256, 256);
			for (let x = 0; x < 256; x += 16) {
				g.fillStyle = `rgba(0,0,0,${0.05 + ((x / 16) % 2) * 0.06})`;
				g.fillRect(x, 0, 8, 256);
			}
		});
		const curtain = new k.THREE.MeshStandardMaterial({ map: curtainTex, transparent: true, opacity: 0.8, side: k.THREE.DoubleSide, roughness: 0.6, emissive: 0x404040 });
		k.plane(2.0, 2.3, curtain, { x: 0, y: 1.35, z: 0.95, parent: bath, from: 3, shadow: false });
		k.cyl(0.015, 0.015, 2, 0xc8c8c8, { y: 2.5, z: 0.95, rz: PI / 2, parent: bath, metal: 0.9 });
		for (let i = 0; i < 12; i++) k.torus(0.03, 0.006, 0xc8c8c8, { x: -0.9 + i * 0.165, y: 2.48, z: 0.95, ry: PI / 2, parent: bath });
		const mother = k.group({ x: -0.1, y: 0, z: 1.9, ry: PI, parent: bath, from: 5 });
		const silhouette = k.mat(0x050505);
		k.person({ x: 0, y: 0, z: 0, pose: "raise", dress: 0x050505, coat: 0x050505, colors: { shirt: 0x050505, legs: 0x050505, hair: 0x050505, skin: 0x050505 }, sleeves: 0x050505, parent: mother });
		k.sphere(0.13, silhouette, { y: 1.95, z: -0.12, parent: mother });
		k.box(0.07, 0.6, 0.02, 0xffffff, { x: 0.45, y: 2.8, z: 0, rz: 0.25, parent: mother, emissive: 0xffffff, glow: 1 });
		k.point(0xffffff, 30, 8, { x: 0, y: 2.0, z: 3.4, parent: bath, from: 5 });
		k.plane(4, 3, 0xffffff, { y: 1.5, z: 3.8, ry: PI, emissive: 0xffffff, glow: 1, parent: bath, from: 5 });
		k.point(0xf0f0ff, 3, 4, { x: 0.2, y: 2.4, z: 0.2, parent: bath });

		// ---- The parlour of stuffed birds.
		const parlour = k.group({ x: -400, from: 0, until: 1 });
		const paper = k.canvas(128, 128, (g) => {
			g.fillStyle = "#4a4438";
			g.fillRect(0, 0, 128, 128);
			g.strokeStyle = "#6a6250";
			g.lineWidth = 3;
			for (let i = 0; i < 4; i++) {
				g.beginPath();
				g.ellipse(32 + (i % 2) * 64, 32 + Math.floor(i / 2) * 64, 18, 26, 0, 0, PI * 2);
				g.stroke();
			}
		});
		paper.wrapS = paper.wrapT = k.THREE.RepeatWrapping;
		paper.repeat.set(6, 3);
		k.box(10, 5, 0.2, k.mat(0xffffff, { map: paper }), { y: 2.5, z: -2, parent: parlour });
		k.box(0.2, 5, 8, k.mat(0xffffff, { map: paper }), { x: -4, y: 2.5, z: 1, parent: parlour });
		k.box(10, 0.1, 8, 0x2a2018, { y: 0, z: 1, parent: parlour });
		const owl = k.group({ x: 0, y: 3.0, z: -1.5, parent: parlour });
		const brown = 0x7a6a50;
		k.sphere(0.5, brown, { s: [1, 1.25, 0.8], parent: owl });
		k.sphere(0.38, 0x9a8a6e, { y: -0.05, z: 0.18, s: [0.9, 1.1, 0.6], parent: owl });
		k.sphere(0.36, 0x8a7a5e, { y: 0.72, z: 0.08, s: [1.2, 1, 0.9], parent: owl });
		[-1, 1].forEach((s) => {
			k.cyl(0.16, 0.16, 0.04, 0xd8ccb0, { x: s * 0.15, y: 0.72, z: 0.36, rx: PI / 2, parent: owl });
			k.cyl(0.08, 0.08, 0.03, 0xf0e8c0, { x: s * 0.15, y: 0.74, z: 0.39, rx: PI / 2, parent: owl, emissive: 0x605020 });
			k.sphere(0.045, 0x050505, { x: s * 0.15, y: 0.74, z: 0.41, parent: owl, rough: 0.1 });
			k.cone(0.07, 0.24, brown, { x: s * 0.25, y: 1.06, z: 0.05, rz: -s * 0.35, parent: owl, seg: 4 });
			const wing = k.group({ x: s * 0.35, y: 0.35, parent: owl });
			for (let f = 0; f < 9; f++) {
				const a = -0.25 + f * 0.13;
				const len = 1.9 - Math.abs(f - 4) * 0.1;
				k.box(len, 0.24, 0.05, f % 2 ? 0x6a5a42 : 0x8a7a5e, { x: s * Math.cos(a) * len * 0.5, y: Math.sin(a) * len * 0.5, z: -0.02 - f * 0.01, rz: s * a, parent: wing });
			}
			k.ico(0.5, 0x7a6a50, { x: s * 0.4, y: 0.25, z: 0.02, s: [1, 0.7, 0.2], parent: wing });
		});
		k.cone(0.05, 0.14, 0x3a3020, { y: 0.6, z: 0.42, rx: PI, parent: owl, seg: 4 });
		k.box(0.7, 0.06, 0.4, 0x3a2a1a, { y: -0.62, z: 0.05, parent: owl });
		const crow = k.group({ x: -2.6, y: 1.6, z: -1.3, ry: 0.6, parent: parlour });
		k.sphere(0.25, 0x141414, { s: [0.8, 0.8, 1.4], parent: crow });
		k.sphere(0.13, 0x141414, { y: 0.2, z: 0.3, parent: crow });
		k.cone(0.05, 0.2, 0x2a2a2a, { y: 0.2, z: 0.47, rx: PI / 2, parent: crow });
		k.box(0.04, 0.9, 0.04, 0x3a2a1a, { y: -0.6, parent: crow });
		k.box(0.6, 0.06, 0.6, 0x3a2a1a, { y: -1.05, parent: crow });
		for (let i = 0; i < 3; i++) k.box(0.6, 0.8, 0.05, 0x2a2018, { x: 2.2 + i * 0.9, y: 2.6 + (i % 2) * 0.4, z: -1.88, parent: parlour });
		k.cyl(0.18, 0.25, 0.5, 0xd8c8a0, { x: 1.4, y: 1.25, z: -0.8, parent: parlour, emissive: 0x6a5a30 });
		k.box(1.4, 1, 0.8, 0x2a1a10, { x: 1.4, y: 0.5, z: -1.2, parent: parlour });
		k.point(0xffe0b0, 10, 8, { x: 1.4, y: 1.3, z: -0.5, parent: parlour });
		k.point(0xd8d8e0, 4, 8, { x: -1, y: 1, z: 2, parent: parlour });

		// Supper on a tray: sandwiches and a glass of milk, brought in from the house.
		k.box(1.2, 0.06, 0.8, 0x2a1a10, { x: 1.0, y: 0.5, z: 0.6, parent: parlour });
		[[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]].forEach(([x, z]) => k.box(0.06, 0.5, 0.06, 0x2a1a10, { x: 1.0 + x, y: 0.25, z: 0.6 + z, parent: parlour }));
		k.box(0.7, 0.03, 0.48, 0x8a8478, { x: 1.0, y: 0.545, z: 0.6, ry: 0.15, parent: parlour, metal: 0.5, rough: 0.35 });
		k.cyl(0.17, 0.15, 0.02, 0xf4f0e8, { x: 0.88, y: 0.57, z: 0.6, parent: parlour, seg: 20 });
		[[0.86, 0.56, 0.3], [0.94, 0.64, -0.6]].forEach(([x, z, ry]) => {
			const sand = k.group({ x, y: 0.585, z, ry, parent: parlour });
			k.cyl(0.11, 0.11, 0.02, 0xe8dcc0, { seg: 3, parent: sand });
			k.cyl(0.1, 0.1, 0.014, 0xc89a8a, { seg: 3, y: 0.017, parent: sand });
			k.cyl(0.11, 0.11, 0.02, 0xe8dcc0, { seg: 3, y: 0.034, parent: sand });
		});
		k.cyl(0.045, 0.04, 0.18, 0xe8eef0, { x: 1.22, y: 0.65, z: 0.55, parent: parlour, opacity: 0.45, rough: 0.05, seg: 14 });
		k.cyl(0.04, 0.036, 0.15, 0xfafaf8, { x: 1.22, y: 0.635, z: 0.55, parent: parlour, seg: 14 });
		k.box(0.03, 0.005, 0.2, 0xe8e8e8, { x: 1.18, y: 0.563, z: 0.76, ry: 0.4, parent: parlour, metal: 0.8 });
		k.point(0xffe8c0, 3, 4, { x: 1.6, y: 1.6, z: 1.4, parent: parlour });

		// ---- The swamp.
		const swamp = k.group({ x: 400, from: 2, until: 2 });
		k.water(80, 0x5a625a, { parent: swamp, amp: 0.03, seg: 20 });
		k.ground(80, 0x3a3a2e, { y: -0.2, bump: 1, parent: swamp, height: (x, z) => (z > 8 ? 1 : -2) });
		const sink = k.group({ x: 0, y: -0.1, z: -2, rx: -0.22, rz: 0.08, ry: PI + 0.5, parent: swamp });
		const pale = 0xd8d8d0;
		k.box(2.0, 0.7, 5, pale, { y: 0.55, parent: sink, metal: 0.4, rough: 0.3 });
		k.box(1.8, 0.65, 2.4, pale, { y: 1.2, z: 0.2, parent: sink, metal: 0.4, rough: 0.3 });
		k.box(1.6, 0.5, 0.06, 0x1a1a1a, { y: 1.2, z: -1.02, rx: 0.4, parent: sink });
		k.box(0.06, 0.45, 2.0, 0x1a1a1a, { x: 0.91, y: 1.22, z: 0.2, parent: sink });
		[-1, 1].forEach((x) => {
			k.box(0.12, 0.3, 1.2, pale, { x: x * 0.9, y: 1.0, z: -1.9, parent: sink, metal: 0.4 });
			k.box(0.18, 0.3, 0.12, 0xb01010, { x: x * 0.78, y: 0.75, z: -2.52, parent: sink, emissive: 0x400000 });
		});
		k.box(2.0, 0.15, 0.2, 0xc8c8c8, { y: 0.32, z: -2.55, parent: sink, metal: 0.9 });
		[-0.9, 0.9].forEach((x) => k.cyl(0.36, 0.36, 0.25, 0x111111, { x, y: 0.3, z: -1.5, rz: PI / 2, parent: sink }));
		const tr = rng(77);
		for (let i = 0; i < 14; i++) {
			const x = (tr() - 0.5) * 40;
			const z = -8 - tr() * 20;
			const h = 6 + tr() * 6;
			k.cyl(0.2, 0.4, h, 0x2a2620, { x, y: h / 2 - 0.5, z, rz: (tr() - 0.5) * 0.3, parent: swamp });
			for (let j = 0; j < 3; j++) k.box(0.1, 2 + tr() * 2, 0.1, 0x8a8a7a, { x: x + (tr() - 0.5) * 2, y: h - 1.5, z, parent: swamp, opacity: 0.8 });
		}
		for (let i = 0; i < 40; i++) k.box(0.04, 0.8 + tr(), 0.04, 0x5a5a40, { x: (tr() - 0.5) * 20, y: 0.3, z: 4 + tr() * 4, rz: (tr() - 0.5) * 0.4, parent: swamp });
		const bubbles = [];
		for (let i = 0; i < 6; i++) bubbles.push(k.sphere(0.06, 0xc8d0d0, { x: (tr() - 0.5) * 1.5, y: 0.05, z: -0.5 + (tr() - 0.5) * 1, parent: swamp, rough: 0.05 }));
		k.tick((t) => bubbles.forEach((b, i) => b.scale.setScalar(0.5 + Math.abs(Math.sin(t * 2 + i)))));
		k.person({ x: 1.5, y: 1.0, z: 7, ry: PI + 0.2, colors: { shirt: 0x9a9a9a, legs: 0x3a3a3a, hair: 0x2a2a2a }, parent: swamp });
		k.point(0xd8e0f0, 30, 40, { x: 4, y: 8, z: 8, parent: swamp });
		k.disc(0xf0f0f0, 4, { x: -10, y: 14, z: -40, parent: swamp });

		// ---- The house on the hill, and the motel below.
		k.ground(400, 0x3a3e38, { bump: 0.6, seg: 60, height: (x, z) => Math.max(0, Math.min(12, (-z - 20) * 0.6)) * (Math.abs(x) < 60 ? 1 : 1) });
		const house = k.group({ x: 2, y: 11.6, z: -46, from: 4 });
		const hc = 0x8a8478;
		k.box(9, 7, 7, hc, { y: 3.5, parent: house });
		k.box(9.6, 0.4, 7.6, 0x5a564e, { y: 7.1, parent: house });
		k.box(8.4, 2.4, 6.4, 0x3a3836, { y: 8.4, parent: house });
		prism(k, 6.4, 2.4, 8.6, 0x3a3836, { y: 9.6, ry: PI / 2, parent: house });
		k.box(3, 11, 3, hc, { x: -3.6, y: 5.5, z: 2.8, parent: house });
		k.cone(2.4, 4, 0x3a3836, { x: -3.6, y: 13, z: 2.8, seg: 4, ry: PI / 4, parent: house });
		k.box(10, 0.3, 2.4, 0x6a665e, { y: 2.2, z: 4.6, parent: house });
		for (let i = 0; i < 6; i++) k.cyl(0.1, 0.1, 2.2, 0xa8a49a, { x: -4.4 + i * 1.8, y: 1.1, z: 5.6, parent: house });
		[[-1.5, 5], [1.5, 5], [3.4, 5], [-3.6, 9], [1.5, 1.6], [-1.5, 1.6]].forEach(([x, y], i) => {
			k.box(0.9, 1.6, 0.1, i === 0 ? 0xfff0c0 : 0x1a1a1a, { x, y, z: i > 3 ? 3.52 : 3.52, parent: house, emissive: i === 0 ? 0xffe0a0 : 0x000000, glow: 1 });
		});
		k.person({ x: -1.5, y: 4.3, z: 3.4, s: 0.6, dress: 0x050505, colors: { shirt: 0x050505, legs: 0x050505, hair: 0x050505, skin: 0x050505 }, parent: house });
		k.point(0xffe0a0, 8, 10, { x: -1.5, y: 5, z: 5, parent: house });
		for (let i = 0; i < 12; i++) k.box(2, 0.25, 0.8, 0x6a6a64, { x: 2, y: 1 + i * 0.95, z: -22 - i * 1.6 });
		const motel = k.group({ x: -6, y: 0, z: -10, from: 4 });
		k.box(22, 3.2, 4, 0xb8b4aa, { y: 1.6, parent: motel });
		k.box(23, 0.3, 6, 0x5a5650, { y: 3.3, z: 0.8, parent: motel });
		for (let i = 0; i < 9; i++) {
			k.box(0.9, 2, 0.1, 0x3a3a3a, { x: -9 + i * 2.4, y: 1, z: 2.02, parent: motel });
			k.box(0.8, 0.8, 0.1, i === 1 ? 0xfff0c0 : 0x2a2a2a, { x: -8 + i * 2.4, y: 1.8, z: 2.02, parent: motel, emissive: i === 1 ? 0xffe0a0 : 0, glow: 1 });
			k.cyl(0.06, 0.06, 3.2, 0xd8d8d0, { x: -10 + i * 2.5, y: 1.6, z: 3.6, parent: motel });
		}
		k.box(5, 4, 5, 0xc8c4ba, { x: 13, y: 2, z: 0.5, parent: motel });
		k.box(1.2, 1.2, 0.1, 0xfff0c0, { x: 13, y: 2, z: 3.02, parent: motel, emissive: 0xffe0a0, glow: 1 });
		const sign = k.canvas(512, 256, (g) => {
			g.fillStyle = "#101010";
			g.fillRect(0, 0, 512, 256);
			g.font = "bold 120px Georgia, serif";
			g.textAlign = "center";
			g.fillStyle = "#ffffff";
			g.shadowColor = "#ffffff";
			g.shadowBlur = 20;
			g.fillText("MOTEL", 256, 120);
			g.font = "bold 70px Georgia, serif";
			g.fillText("VACANCY", 256, 220);
		});
		k.cyl(0.12, 0.12, 6, 0x3a3a3a, { x: 16, y: 3, z: 6, parent: motel });
		k.box(4.2, 2.2, 0.2, 0x1a1a1a, { x: 16, y: 5.8, z: 6, parent: motel });
		k.plane(4, 2, flat(k, sign), { x: 16, y: 5.8, z: 6.11, parent: motel });
		k.point(0xffffff, 10, 14, { x: 16, y: 5, z: 8, parent: motel });
		const mcar = k.group({ x: 9, y: 0, z: 5, ry: 0.3, parent: motel });
		k.box(2, 0.7, 4.8, 0x4a4a4a, { y: 0.7, parent: mcar, metal: 0.5, rough: 0.3 });
		k.box(1.8, 0.6, 2.4, 0x3a3a3a, { y: 1.3, z: -0.2, parent: mcar });
		[-1, 1].forEach((x) => [-1.5, 1.5].forEach((z) => k.cyl(0.36, 0.36, 0.3, 0x111111, { x: x * 0.95, y: 0.36, z, rz: PI / 2, parent: mcar })));
		k.disc(0xf0f0f0, 14, { x: -80, y: 120, z: -300 });
		k.glow(0xffffff, 60, { x: -80, y: 120, z: -298, opacity: 0.4 });
		const cr = rng(5);
		for (let i = 0; i < 10; i++) cloud(k, -150 + i * 30 + cr() * 10, 90 + cr() * 40, -280, 6 + cr() * 6, { color: 0x6a6e78, emissive: 0x2a2c30, from: 4 });
		trees(k, 30, [-100, 100, -120, -60], { color: 0x1e241e, h: 12, from: 4, avoid: (x) => Math.abs(x - 2) < 14 });
		k.point(0xc8d0e0, 30, 80, { x: 0, y: 30, z: 10 });
		return {
			shots: [
				{ pos: [-398.5, 1.0, 1.2], look: [-399.0, 0.6, 0.6], fov: 40, filter: BW, fog: [0x1a1814, 4, 20], exposure: 1.3 },
				{ pos: [-399.4, 1.6, 2.2], look: [-400, 3.2, -1.6], fov: 50, filter: BW, fog: [0x1a1814, 4, 20], exposure: 1.3 },
				{ pos: [402.0, 1.6, 4.2], look: [400, 0.5, -2], fov: 50, filter: BW, fog: [0x4a4e4e, 8, 60], exposure: 1.5 },
				{ pos: [0.15, 0.9, 399.6], look: [0, 2.1, 399.38], fov: 50, filter: BW, fog: [0x303030, 4, 20], exposure: 1.2 },
				{ pos: [8, 2.2, 16], look: [2, 9, -46], fov: 45, filter: BW, exposure: 1.6 },
				{ pos: [0.5, 1.45, 400.1], look: [-0.1, 1.85, 401], fov: 60, filter: BW, fog: [0x303030, 4, 20], exposure: 1.1 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the café
	r23: (k) => {
		const BW = "grayscale(1) contrast(1.2) brightness(1.05)";
		k.fog(0x2a2c34, 50, 300);
		k.sky(0x0c0e14, 0x4a4e5a, { offset: -0.02 });
		k.light({ sky: 0xd0d8e8, ground: 0x302a20, hemi: 1.2, sunColor: 0xd8e0ff, sunIntensity: 1.2, sunPos: [-30, 60, 30], shadowSize: 50 });
		const arch = (o, w = 3, h = 3.2, c = 0xe8e0d0) => {
			const g = k.group(o);
			[-1, 1].forEach((s) => k.box(0.5, h, 0.5, c, { x: (s * w) / 2, y: h / 2, parent: g }));
			k.torus(w / 2, 0.25, c, { y: h, arc: PI, parent: g, seg: 16, s: [1, 1.2, 1] });
			k.box(w + 0.5, 0.6, 0.5, c, { y: h + w / 2 * 1.2 + 0.4, parent: g });
			return g;
		};
		const fez = (p) => k.cyl(0.12, 0.15, 0.18, 0x8a1a1a, { y: 2.0, parent: p });

		// ---- The city at night, under the searchlight.
		const town = k.group({ from: 1, until: 1 });
		k.ground(400, 0x6a6458, { bump: 0.2, parent: town });
		const tr = rng(14);
		for (let i = 0; i < 90; i++) {
			const x = (tr() - 0.5) * 120;
			const z = -10 - tr() * 100;
			const w = 5 + tr() * 6;
			const h = 3 + tr() * 8;
			k.box(w, h, w * (0.8 + tr() * 0.4), [0xe8e4dc, 0xd8d0c4, 0xf0ece4][i % 3], { x, y: h / 2, z, parent: town });
			if (i % 5 === 0) {
				k.sphere(w * 0.35, 0xe8e4dc, { x, y: h, z, parent: town, seg: 10 });
			}
			if (i % 3 === 0) k.box(0.6, 1, 0.1, 0xffe8b0, { x: x + 1, y: h * 0.5, z: z + w * 0.5 + 0.06, emissive: 0xffd890, glow: 0.8, parent: town });
		}
		k.box(2.4, 26, 2.4, 0xe0dcd0, { x: -20, y: 13, z: -50, parent: town });
		k.box(3, 2, 3, 0xd0ccc0, { x: -20, y: 27, z: -50, parent: town });
		k.cone(1.5, 2, 0x5a8a5a, { x: -20, y: 29, z: -50, seg: 8, parent: town });
		const tower = k.group({ x: 14, y: 0, z: -18, parent: town });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.3, 16, 0.3, 0x5a5650, { x: sx * 1.6, y: 8, z: sz * 1.6, rz: -sx * 0.05, rx: sz * 0.05, parent: tower })));
		k.box(4, 1.8, 4, 0x6a665e, { y: 16.5, parent: tower });
		const beam = k.group({ y: 17.8, parent: tower });
		k.cyl(0.6, 0.6, 1, 0x3a3a3a, { rz: PI / 2, parent: beam });
		const ray = new k.THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, blending: k.THREE.AdditiveBlending, depthWrite: false, side: k.THREE.DoubleSide });
		k.mesh(new k.THREE.ConeGeometry(9, 120, 16, 1, true), ray, { x: -60, y: 0, rz: -PI / 2, parent: beam, shadow: false });
		k.glow(0xffffff, 3, { x: -0.6, parent: beam });
		k.tick((t) => {
			beam.rotation.y = 0.9 + Math.sin(t * 0.4) * 0.5;
			beam.rotation.z = -0.35;
		});
		k.disc(0xf0f0f0, 10, { x: 60, y: 90, z: -250 });
		k.glow(0xffffff, 40, { x: 60, y: 90, z: -248, opacity: 0.5 });
		for (let i = 0; i < 4; i++) {
			const p = k.person({ x: -4 + i * 2, z: 4 - i, ry: PI - 0.4 + i * 0.3, s: 1, coat: 0x3a3a3a, colors: { shirt: 0x5a5a5a, legs: 0x3a3a3a }, parent: town });
			if (i % 2) fez(p);
		}
		k.point(0xe8e8ff, 20, 60, { x: 0, y: 20, z: 10, parent: town });

		// ---- Inside the café.
		const cafe = k.group({ x: -400, from: 0, until: 3 });
		const floor = k.canvas(128, 128, (g) => {
			g.fillStyle = "#8a7a64";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#5a4c3c";
			for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) g.fillRect(x * 32, y * 32, 32, 32);
		});
		floor.wrapS = floor.wrapT = k.THREE.RepeatWrapping;
		floor.repeat.set(10, 10);
		k.plane(40, 40, k.mat(0xffffff, { map: floor }), { rx: -PI / 2, parent: cafe });
		k.box(40, 0.4, 40, 0x3a3020, { y: 8.2, parent: cafe });
		k.box(40, 8, 0.4, 0xd8d0c0, { y: 4, z: -12, parent: cafe });
		k.box(0.4, 8, 40, 0xd8d0c0, { x: -14, y: 4, parent: cafe });
		k.box(0.4, 8, 40, 0xd8d0c0, { x: 14, y: 4, parent: cafe });
		for (let i = 0; i < 5; i++) arch({ x: -9 + i * 4.5, z: -7, parent: cafe });
		for (let i = 0; i < 3; i++) arch({ x: -12, z: -3 + i * 4.5, ry: PI / 2, parent: cafe });
		const fans = [];
		[[-5, -2], [3, -2], [-5, 5], [3, 5]].forEach(([x, z]) => {
			const f = k.group({ x, y: 7.2, z, parent: cafe });
			k.cyl(0.03, 0.03, 1, 0x3a3a3a, { y: 0.5, parent: f });
			k.cyl(0.18, 0.18, 0.2, 0x3a3a3a, { parent: f });
			for (let b = 0; b < 4; b++) k.box(1.6, 0.03, 0.25, 0x5a4030, { x: Math.cos((b * PI) / 2) * 0.8, z: Math.sin((b * PI) / 2) * 0.8, ry: -(b * PI) / 2, parent: f });
			fans.push(f);
		});
		k.tick((t) => fans.forEach((f, i) => (f.rotation.y = t * 1.5 + i)));
		const lantern = (x, y, z) => {
			k.cyl(0.25, 0.18, 0.5, 0xb89a60, { x, y, z, seg: 6, parent: cafe, emissive: 0x806030, glow: 0.6 });
			k.cone(0.3, 0.3, 0xb89a60, { x, y: y + 0.4, z, seg: 6, parent: cafe });
			k.glow(0xffe0a0, 1.6, { x, y, z, parent: cafe });
			k.point(0xffd8a0, 6, 10, { x, y: y - 0.3, z, parent: cafe });
		};
		lantern(-7, 6, -6.5);
		lantern(0, 6, -6.5);
		lantern(7, 6, -6.5);
		lantern(-2, 5.5, 3);
		const pr = rng(8);
		const table = (x, z, guests) => {
			k.cyl(0.65, 0.65, 0.05, 0xf4f0e8, { x, y: 0.82, z, parent: cafe, seg: 16 });
			k.cyl(0.66, 0.6, 0.3, 0xf4f0e8, { x, y: 0.68, z, parent: cafe, seg: 16, open: true });
			k.cyl(0.06, 0.06, 0.8, 0x3a3020, { x, y: 0.4, z, parent: cafe });
			k.cyl(0.06, 0.08, 0.2, 0xd8c8a0, { x: x + 0.2, y: 0.95, z: z - 0.1, parent: cafe, emissive: 0x806030, glow: 0.5 });
			for (let g = 0; g < guests; g++) {
				const a = (g / guests) * PI * 2 + pr();
				const woman = pr() > 0.6;
				const p = k.person({ x: x + Math.cos(a) * 1.1, y: -0.3, z: z + Math.sin(a) * 1.1, ry: -a - PI / 2, pose: "sit", dress: woman ? 0x2a2a2a : undefined, colors: { shirt: woman ? 0xd8d0c0 : [0xf0ece4, 0x2a2a2a][g % 2], legs: 0x2a2a2a, hair: [0x1a1410, 0x5a4030][g % 2] }, parent: cafe });
				if (!woman && pr() > 0.7) fez(p);
			}
		};
		table(-4.5, 1.5, 3);
		table(-1.5, 2.5, 2);
		table(3.5, 0.5, 3);
		table(6.5, 4.5, 2);
		table(-5, 6, 3);
		table(0.6, 7.4, 0);
		const glass = (x, z, o = {}) => {
			const g = k.group({ x, y: 0.845, z, parent: cafe, ...o });
			k.cyl(0.05, 0.05, 0.008, 0xf0f4f8, { parent: g, opacity: 0.6, rough: 0.05 });
			k.cyl(0.006, 0.006, 0.12, 0xf0f4f8, { y: 0.06, parent: g, opacity: 0.6, rough: 0.05 });
			k.mesh(new k.THREE.SphereGeometry(0.075, 14, 6, 0, PI * 2, PI / 2, PI / 2), k.mat(0xf0f4f8, { opacity: 0.55, rough: 0.05, side: k.THREE.DoubleSide, flat: false }), { y: 0.2, parent: g });
			k.cyl(0.07, 0.07, 0.01, 0xe8d8a0, { y: 0.18, parent: g, opacity: 0.8, rough: 0.05 });
		};
		glass(0.4, 7.2);
		glass(0.75, 7.45);
		k.cyl(0.07, 0.09, 0.3, 0x1a2a1a, { x: 0.85, y: 1.0, z: 7.0, parent: cafe, rough: 0.2 });
		k.cyl(0.03, 0.04, 0.12, 0x1a2a1a, { x: 0.85, y: 1.2, z: 7.0, parent: cafe });
		k.cyl(0.08, 0.06, 0.03, 0x8a8a8a, { x: 0.25, y: 0.86, z: 7.6, parent: cafe, metal: 0.7 });
		k.box(0.07, 0.012, 0.012, 0xf8f8f8, { x: 0.3, y: 0.885, z: 7.6, ry: 0.4, parent: cafe });
		k.glow(0xffa060, 0.05, { x: 0.335, y: 0.885, z: 7.63, parent: cafe });
		const smoke = [];
		for (let i = 0; i < 6; i++) smoke.push(k.glow(0xd8d8d8, 0.12 + i * 0.05, { x: 0.34, y: 0.95 + i * 0.12, z: 7.63, opacity: 0.18, parent: cafe, fog: true }));
		k.tick((t) => smoke.forEach((s2, i) => (s2.position.x = 0.34 + Math.sin(t * 1.3 + i * 0.7) * 0.03 * i)));
		k.box(6, 1.2, 0.8, 0x3a2a1a, { x: 9, y: 0.6, z: -9.5, parent: cafe });
		for (let i = 0; i < 12; i++) k.cyl(0.05, 0.06, 0.3, [0x2a4a2a, 0x6a4a2a, 0xd8d0c0][i % 3], { x: 6.5 + i * 0.4, y: 2.2, z: -11.6, parent: cafe });
		k.box(6, 0.1, 0.4, 0x3a2a1a, { x: 9, y: 2.0, z: -11.6, parent: cafe });
		k.cyl(1.0, 1.0, 0.9, 0x2a3a2a, { x: 8, y: 0.45, z: 0, parent: cafe, seg: 16 });
		k.cyl(0.9, 0.9, 0.02, 0x3a1a1a, { x: 8, y: 0.91, z: 0, parent: cafe, seg: 16 });
		for (let i = 0; i < 6; i++) {
			k.cyl(0.08, 0.15, 1.6, 0x5a4a30, { x: (i % 2 ? -12.8 : 12.8), y: 0.8, z: -9 + i * 3, parent: cafe });
			for (let f = 0; f < 6; f++) k.box(1.4, 0.04, 0.3, 0x2a4a2a, { x: (i % 2 ? -12.8 : 12.8) + Math.cos(f) * 0.6, y: 1.8, z: -9 + i * 3 + Math.sin(f) * 0.6, ry: -f, rz: 0.5, parent: cafe });
		}
		// The piano.
		const piano = k.group({ x: -8, z: -3.5, ry: 0.5 + PI, parent: cafe });
		k.box(1.8, 1.3, 0.7, 0xf0ece4, { y: 0.65, parent: piano, rough: 0.3 });
		k.box(1.7, 0.1, 0.4, 0x1a1a1a, { y: 0.78, z: 0.5, parent: piano });
		const keys = k.canvas(256, 32, (g) => {
			g.fillStyle = "#f8f8f0";
			g.fillRect(0, 0, 256, 32);
			g.fillStyle = "#101010";
			for (let i = 0; i < 36; i++) {
				g.fillRect(i * 7.1, 0, 1, 32);
				if ([0, 1, 3, 4, 5].includes(i % 7)) g.fillRect(i * 7.1 + 4.5, 0, 4, 19);
			}
		});
		k.plane(1.6, 0.25, k.mat(0xffffff, { map: keys }), { y: 0.84, z: 0.55, rx: -PI / 2, parent: piano });
		k.box(1.8, 0.06, 0.75, 0xf0ece4, { y: 1.32, parent: piano });
		k.box(1.0, 0.45, 0.4, 0x2a1a10, { y: 0.22, z: 1.0, parent: piano });
		const sam = k.person({ y: -0.0, z: 1.05, ry: PI, pose: "sit", colors: { shirt: 0xf0ece4, legs: 0x1a1a1a, skin: 0x5a3a28, hair: 0x101010 }, sleeves: 0xf0ece4, parent: piano });
		sam.position.y = -0.2;
		sam.userData.limbs.armL.rotation.x = -1.3;
		sam.userData.limbs.armR.rotation.x = -1.3;
		k.box(0.36, 0.42, 0.29, 0x1a1a1a, { y: 1.2, z: 0.0, parent: sam });
		k.box(0.12, 0.05, 0.05, 0x101010, { y: 1.48, z: 0.15, parent: sam });
		const ilsa = k.person({ x: -1.25, y: 0, z: -0.45, ry: 0.69, dress: 0xf0f0f0, colors: { shirt: 0xf0f0f0, legs: 0xf0f0f0, hair: 0x5a3a20, skin: 0xf0d0b8 }, parent: piano });
		ilsa.userData.limbs.armR.rotation.set(-0.8, 0, 0.3);
		k.cyl(0.24, 0.24, 0.03, 0xf8f8f8, { y: 1.96, parent: ilsa });
		k.point(0xfff0d8, 10, 6, { x: 0.6, y: 2.6, z: 2.2, parent: piano });

		// ---- The airfield in the fog.
		const field = k.group({ z: 400, from: 4, until: 5 });
		k.box(200, 0.2, 200, 0x4a4c50, { y: -0.1, parent: field });
		for (let i = 0; i < 14; i++) k.box(0.4, 0.02, 3, 0xd8d8d0, { y: 0.01, z: -30 - i * 8, x: 6, parent: field });
		const plane = k.group({ x: 6, y: 0, z: -22, ry: 0.4, parent: field });
		const al = { metal: 0.6, rough: 0.35 };
		k.capsule(1.0, 8, 0xc8ccd0, { rx: PI / 2, y: 2.3, parent: plane, ...al, seg: 12 });
		k.cone(1.0, 3, 0xc8ccd0, { rx: -PI / 2, y: 2.4, z: -6.5, s: [1, 1, 0.7], parent: plane, ...al });
		k.box(16, 0.18, 2.2, 0xb8bcc0, { y: 2.0, z: 0.5, parent: plane, ...al });
		k.box(5.5, 0.12, 1.2, 0xb8bcc0, { y: 2.6, z: -7.6, parent: plane, ...al });
		[-2.6, 2.6].forEach((x) => {
			k.box(0.12, 1.4, 1.2, 0xb8bcc0, { x, y: 3.2, z: -7.8, parent: plane, ...al });
			k.cyl(0.55, 0.45, 2.4, 0xa8acb0, { x, y: 2.0, z: 1.4, rx: PI / 2, parent: plane, ...al });
			const prop = k.group({ x, y: 2.0, z: 2.7, parent: plane });
			for (let b = 0; b < 2; b++) k.box(0.15, 2.4, 0.05, 0x2a2a2a, { rz: b * PI / 2 + 0.3, parent: prop });
			k.tick((t) => (prop.rotation.z = t * 20));
			k.cyl(0.18, 0.18, 0.5, 0x1a1a1a, { x, y: 0.5, z: 1.4, rz: PI / 2, parent: plane });
			k.box(0.1, 1.2, 0.1, 0x5a5a5a, { x, y: 1.0, z: 1.4, parent: plane });
		});
		for (let i = 0; i < 8; i++) k.box(0.05, 0.4, 0.5, 0x1a2a3a, { x: 1.01, y: 2.6, z: 2 - i * 0.8, parent: plane });
		k.cyl(0.15, 0.15, 0.4, 0x1a1a1a, { y: 0.4, z: -7, rz: PI / 2, parent: plane });
		k.box(18, 10, 14, 0x5a5c60, { x: -18, y: 5, z: -34, parent: field });
		k.box(8, 9, 0.2, 0x1a1a1a, { x: -14, y: 4.5, z: -26.9, parent: field });
		k.box(1.4, 9, 1.4, 0x6a6c70, { x: 16, y: 4.5, z: -30, parent: field });
		k.box(3, 1.6, 3, 0xd8d8d0, { x: 16, y: 9.8, z: -30, parent: field, emissive: 0x808070, glow: 0.4 });
		k.spot(0xffffff, 80, { x: 14, y: 12, z: 380, target: [6, 1, 378], angle: 0.5, distance: 60 });
		k.point(0xd8e0f0, 20, 40, { x: -2, y: 6, z: 6, parent: field });
		const rick = k.person({ x: -0.8, y: 0, z: 0, ry: 1.4, coat: 0xc8bca8, hat: 0x6a6660, colors: { shirt: 0xc8bca8, legs: 0x3a3a3a, hair: 0x2a2018 }, sleeves: 0xc8bca8, parent: field });
		void rick;
		k.box(0.62, 0.08, 0.36, 0x8a7a60, { x: -0.8, y: 1.2, z: 0, ry: 1.4, parent: field });
		const ilsa2 = k.person({ x: 0.5, y: 0, z: 0.1, ry: -1.6, dress: 0x4a4a4a, coat: 0x4a4a4a, colors: { shirt: 0x4a4a4a, legs: 0x4a4a4a, hair: 0x5a3a20, skin: 0xf0d0b8 }, sleeves: 0x4a4a4a, parent: field });

		k.cyl(0.32, 0.32, 0.03, 0x6a6a6a, { y: 1.96, parent: ilsa2 });
		k.cyl(0.16, 0.19, 0.14, 0x6a6a6a, { y: 2.03, parent: ilsa2 });
		k.person({ x: 3, y: 0, z: -7, ry: 0.5, s: 1, coat: 0x2a2a2a, colors: { shirt: 0x2a2a2a, legs: 0x2a2a2a }, parent: field });
		return {
			shots: [
				{ pos: [-399.0, 1.25, 8.2], look: [-399.4, 0.95, 7.3], fov: 45, filter: BW, fog: [0x2a241c, 6, 40], exposure: 1.4 },
				{ pos: [-30, 6, 30], look: [0, 12, -40], fov: 50, filter: BW, exposure: 1.4 },
				{ pos: [-397, 3.4, 11], look: [-401, 1.8, -4], fov: 55, filter: BW, fog: [0x2a241c, 10, 50], exposure: 1.4 },
				{ pos: [-405.6, 2.0, -0.4], look: [-408.0, 1.5, -3.9], fov: 50, filter: BW, fog: [0x2a241c, 8, 40], exposure: 1.4 },

				{ pos: [-3, 2.4, 394], look: [5, 2.4, 378], fov: 50, filter: BW, fog: [0x8a8c90, 6, 70], exposure: 1.2 },
				{ pos: [-0.5, 1.6, 404.2], look: [1.5, 2.0, 396], fov: 45, filter: BW, fog: [0x8a8c90, 6, 50], exposure: 1.2 },

			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the circle
	r24: (k) => {
		k.fog(0xf0c890, 80, 520);
		k.sky(0x5a8ac8, 0xffd8a0, { offset: -0.05 });
		k.light({ sky: 0xffe8c0, ground: 0x8a6030, hemi: 1.25, sunColor: 0xffc880, sunIntensity: 2.4, sunPos: [-60, 40, 50], shadowSize: 60 });
		const stripes = k.canvas(128, 64, (g) => {
			g.fillStyle = "#f4f0e8";
			g.fillRect(0, 0, 128, 64);
			g.fillStyle = "#141414";
			for (let x = 0; x < 128; x += 14) g.fillRect(x, 0, 6, 64);
		});
		const zebraMat = k.mat(0xffffff, { map: stripes });
		const spots = k.canvas(128, 128, (g) => {
			g.fillStyle = "#e0b060";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#8a4a1a";
			const r = rng(3);
			for (let i = 0; i < 30; i++) g.fillRect(r() * 120, r() * 120, 12 + r() * 8, 12 + r() * 8);
		});
		const giraffeMat = k.mat(0xffffff, { map: spots });
		const zebra = (o) => {
			const g = k.group(o);
			k.box(0.6, 0.6, 1.4, zebraMat, { y: 1.1, parent: g });
			k.box(0.3, 0.7, 0.35, zebraMat, { y: 1.55, z: 0.75, rx: -0.5, parent: g });
			k.box(0.26, 0.26, 0.55, zebraMat, { y: 1.85, z: 1.05, rx: 0.5, parent: g });
			k.box(0.08, 0.35, 0.5, 0x141414, { y: 1.75, z: 0.75, rx: -0.5, parent: g });
			[-0.2, 0.2].forEach((x) => [-0.5, 0.5].forEach((z) => k.box(0.12, 0.85, 0.12, zebraMat, { x, y: 0.42, z, parent: g })));
			return g;
		};
		const giraffe = (o) => {
			const g = k.group(o);
			k.box(0.8, 0.9, 1.6, giraffeMat, { y: 2.4, rx: 0.15, parent: g });
			k.box(0.3, 2.4, 0.35, giraffeMat, { y: 3.8, z: 0.8, rx: 0.35, parent: g });
			k.box(0.3, 0.3, 0.7, giraffeMat, { y: 5.0, z: 1.35, parent: g });
			[-0.1, 0.1].forEach((x) => k.cyl(0.03, 0.03, 0.25, 0x6a4020, { x, y: 5.25, z: 1.1, parent: g }));
			[-0.28, 0.28].forEach((x) => [-0.6, 0.6].forEach((z) => k.box(0.14, 2.0, 0.14, giraffeMat, { x, y: 1.0, z, parent: g })));
			return g;
		};
		const elephant = (o) => {
			const g = k.group(o);
			const c = 0x8a8478;
			k.box(1.9, 1.7, 2.9, c, { y: 2.75, parent: g });
			k.sphere(0.75, c, { y: 3.1, z: 1.7, parent: g });
			[-1, 1].forEach((s) => {
				k.cyl(0.85, 0.85, 0.08, 0x6a6458, { x: s * 0.8, y: 3.0, z: 1.45, rz: PI / 2, ry: s * 0.4, s: [1.3, 1, 1], parent: g });
				k.cone(0.06, 0.8, 0xf4f0e0, { x: s * 0.3, y: 2.4, z: 2.3, rx: 1.9, parent: g });
			});
			k.cyl(0.18, 0.3, 1.8, c, { y: 1.9, z: 2.35, rx: 0.15, parent: g });
			[-0.6, 0.6].forEach((x) => [-1.0, 1.0].forEach((z) => k.cyl(0.32, 0.32, 2.0, c, { x, y: 1.0, z, parent: g })));
			return g;
		};
		const gnu = (o) => {
			const g = k.group(o);
			const c = 0x4a4038;
			k.box(0.55, 0.6, 1.3, c, { y: 1.0, parent: g });
			k.box(0.6, 0.5, 0.5, c, { y: 1.35, z: 0.45, parent: g });
			k.box(0.3, 0.55, 0.3, 0x2a2420, { y: 0.95, z: 0.85, rx: 0.6, parent: g });
			[-1, 1].forEach((s) => k.cone(0.04, 0.3, 0xd8d0c0, { x: s * 0.2, y: 1.35, z: 0.75, rz: -s * 1.2, parent: g }));
			const legs = [];
			[-0.18, 0.18].forEach((x) => [-0.45, 0.45].forEach((z) => legs.push(k.box(0.1, 0.8, 0.1, 0x2a2420, { x, y: 0.4, z, parent: g }))));
			return g;
		};
		const acacia = (x, z, s, o = {}) => {
			const g = k.group({ x, z, s, ...o });
			const c = o.dark ? 0x1a1008 : 0x5a3a20;
			k.cyl(0.2, 0.35, 5, c, { y: 2.5, rz: 0.1, parent: g });
			k.cyl(0.12, 0.15, 2.4, c, { x: 0.8, y: 4.8, rz: -0.6, parent: g });
			k.cyl(0.12, 0.15, 2.4, c, { x: -0.6, y: 4.8, rz: 0.6, parent: g });
			k.cyl(3.2, 2.6, 0.9, o.dark ? 0x1a1008 : 0x4a6a2a, { y: 6.1, seg: 9, parent: g, s: [1.2, 1, 1] });
			return g;
		};
		const cub = (o) => {
			const g = k.group(o);
			const c = 0xe0a860;
			k.sphere(0.32, c, { y: 0.45, s: [0.9, 0.85, 1.3], parent: g });
			k.sphere(0.27, c, { y: 0.78, z: 0.38, parent: g });
			k.sphere(0.12, 0xf0d0a0, { y: 0.7, z: 0.6, s: [1.2, 0.8, 1], parent: g });
			[-1, 1].forEach((s) => {
				k.sphere(0.08, c, { x: s * 0.18, y: 1.0, z: 0.32, parent: g });
				k.sphere(0.035, 0x1a1008, { x: s * 0.1, y: 0.84, z: 0.6, parent: g });
			});
			k.sphere(0.04, 0x3a2010, { y: 0.78, z: 0.66, parent: g });
			[-0.15, 0.15].forEach((x) => [-0.25, 0.25].forEach((z) => k.cyl(0.07, 0.07, 0.3, c, { x, y: 0.15, z, parent: g })));
			k.cyl(0.03, 0.03, 0.5, c, { y: 0.55, z: -0.5, rx: -0.9, parent: g });
			k.sphere(0.06, 0x8a4a20, { y: 0.72, z: -0.68, parent: g });
			return g;
		};

		// ---- A jungle floor: a rotten log, peeled back, full of grubs.
		const jungle = k.group({ x: 400, z: 400, from: 0, until: 0 });
		k.ground(40, 0x3a5a2a, { bump: 0.2, parent: jungle });
		const log = k.group({ y: 0.45, rz: 0.05, ry: 0.3, parent: jungle });
		k.cyl(0.55, 0.6, 5, 0x5a3a22, { rz: PI / 2, parent: log, seg: 10 });
		k.cyl(0.5, 0.5, 0.02, 0x8a6a40, { x: 2.5, rz: PI / 2, parent: log, seg: 10 });
		k.box(1.6, 0.16, 0.7, 0x9a6a3a, { y: 0.5, z: 0.1, parent: log });
		k.box(1.4, 0.08, 0.8, 0x4a2c18, { x: 0.3, y: 0.75, z: -0.65, rx: -0.9, parent: log });
		for (let i = 0; i < 5; i++) k.ico(0.25, 0x5a8a2a, { x: -2 + i * 0.4, y: 0.5, z: -0.2, s: [1.4, 0.3, 1], parent: log });
		const jr = rng(77);
		for (let i = 0; i < 9; i++) {
			const g = k.group({ x: -0.6 + jr() * 1.2, y: 0.6, z: -0.1 + jr() * 0.4, ry: jr() * 6, parent: log });
			for (let j = 0; j < 5; j++) k.sphere(0.05 - j * 0.004, j === 0 ? 0xd89a6a : 0xf4e0d0, { x: j * 0.07, y: Math.sin(j) * 0.02, parent: g, flat: false, rough: 0.3 });
		}
		const beetle = k.group({ x: 1.0, y: 1.0, z: 0.4, ry: 0.8, parent: jungle });
		k.sphere(0.12, 0x2a4ad8, { s: [1, 0.6, 1.4], parent: beetle, metal: 0.6, rough: 0.2 });
		k.sphere(0.06, 0x101828, { z: 0.16, parent: beetle });
		for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => k.cyl(0.008, 0.008, 0.16, 0x101010, { x: s * 0.11, y: -0.04, z: -0.08 + i * 0.08, rz: s * 1.1, parent: beetle }));
		for (let i = 0; i < 18; i++) {
			const a = jr() * PI * 2;
			const d = 1.5 + jr() * 4;
			const f = k.group({ x: Math.cos(a) * d, z: Math.sin(a) * d - 1, ry: jr() * 6, parent: jungle });
			for (let j = 0; j < 6; j++) k.box(0.18, 0.02, 1.4, j % 2 ? 0x2a6a2a : 0x3a7a30, { y: 0.4, z: 0.5, rx: -0.6, parent: k.group({ ry: (j / 6) * PI * 2, parent: f }) });
		}
		[[-1.2, 0.8], [-1.0, 1.1], [1.8, 0.9]].forEach(([x, z], i) => {
			k.cyl(0.03, 0.04, 0.2, 0xf0e8d8, { x, y: 0.1, z, parent: jungle });
			k.sphere(0.1 + i * 0.02, 0xc84a2a, { x, y: 0.22, z, s: [1, 0.5, 1], parent: jungle });
		});
		for (let i = 0; i < 10; i++) k.cyl(0.3, 0.45, 12, 0x3a2a1a, { x: -8 + i * 1.8 + jr(), y: 6, z: -6 - jr() * 6, parent: jungle });
		k.box(30, 10, 1, 0x2a4a22, { y: 5, z: -12, parent: jungle });
		k.point(0xd8ffb0, 10, 12, { x: 1, y: 4, z: 2, parent: jungle });
		k.point(0xfff0c0, 6, 10, { x: -2, y: 3, z: 3, parent: jungle });
		for (let i = 0; i < 4; i++) k.glow(0xf0ffd0, 3, { x: -4 + i * 2.6, y: 5 + jr() * 2, z: -5, parent: jungle, opacity: 0.25 });

		// ---- The savanna.
		const plains = k.group({ from: 2, until: 2 });
		k.ground(800, 0xc8a050, { bump: 0.3, seg: 60, parent: plains });
		const pr = rng(24);
		for (let i = 0; i < 26; i++) {
			const a = pr() * PI * 2;
			const d = 30 + pr() * 160;
			acacia(Math.cos(a) * d, Math.sin(a) * d, 0.8 + pr() * 0.6, { parent: plains });
		}
		for (let i = 0; i < 160; i++) k.cone(0.15, 0.6, 0xa88a40, { x: (pr() - 0.5) * 80, y: 0.3, z: (pr() - 0.5) * 80, seg: 4, parent: plains });
		acacia(-16, -120, 1.6, { dark: true, parent: plains });
		k.disc(0xff5a1a, 70, { x: -30, y: 18, z: -330, parent: plains });
		k.glow(0xffa040, 260, { x: -30, y: 18, z: -325, parent: plains, opacity: 0.8 });
		for (let i = 0; i < 6; i++) k.box(1.4, 0.08, 0.2, 0x1a1008, { x: -40 + i * 5, y: 40 + (i % 2) * 4, z: -280, rz: (i % 2 ? 0.3 : -0.3), parent: plains });
		for (let i = 0; i < 8; i++) zebra({ x: 10 + i * 2.6, z: -20 + (i % 3) * 1.5, ry: -PI / 2 + 0.2, parent: plains });
		for (let i = 0; i < 4; i++) giraffe({ x: 6 + i * 6, z: -30 - (i % 2) * 2, ry: -PI / 2 + 0.3, parent: plains });
		for (let i = 0; i < 3; i++) elephant({ x: 4 + i * 6, z: -12 + (i % 2), ry: -PI / 2 + 0.25, parent: plains, s: 1.1 - i * 0.15 });
		for (let i = 0; i < 12; i++) k.ico(0.4, 0xf0f0f0, { x: 40 + (pr() - 0.5) * 30, y: 12 + pr() * 8, z: -50 + pr() * 20, s: [1.4, 0.2, 0.6], parent: plains });

		// ---- The elephant graveyard.
		const grave = k.group({ x: 400, from: 1, until: 1 });
		k.ground(200, 0x5a5a48, { bump: 1.2, parent: grave });
		const bone = 0xd8d0b8;
		const skull = k.group({ x: 0, y: 0, z: -14, ry: 0.3, s: 3.4, parent: grave });
		k.sphere(1.6, bone, { y: 1.6, s: [1.1, 1, 1], parent: skull, rough: 0.9 });
		k.box(1.6, 1.4, 1.4, bone, { y: 0.8, z: 1.2, parent: skull });
		[-1, 1].forEach((s) => {
			k.sphere(0.45, 0x1a1a14, { x: s * 0.75, y: 1.7, z: 1.25, parent: skull });
			k.torus(1.6, 0.14, 0xe8e0c8, { x: s * 0.55, y: 0.6, z: 2.2, ry: PI / 2, rz: 0, arc: PI * 0.65, parent: skull });
		});
		k.box(0.8, 0.8, 0.2, 0x0a0a08, { y: 0.8, z: 1.92, parent: skull });
		const br = rng(66);
		for (let i = 0; i < 16; i++) {
			const g = k.group({ x: (br() - 0.5) * 70, y: 0, z: -br() * 50 + 4, ry: br() * 6, s: 1 + br() * 1.5, parent: grave });
			for (let r = 0; r < 6; r++) k.torus(1.2, 0.08, bone, { z: r * 0.4, arc: PI, parent: g, seg: 10 });
			k.cyl(0.12, 0.12, 2.6, bone, { y: 1.2, z: 1, rx: PI / 2, parent: g });
		}
		for (let i = 0; i < 10; i++) k.ico(2 + br() * 3, 0x4a4a3c, { x: (br() - 0.5) * 80, y: 0, z: -20 - br() * 40, parent: grave });
		[[-12, -20], [10, -26], [-20, -8]].forEach(([x, z]) => {
			k.glow(0x9af0a0, 9, { x, y: 3, z, parent: grave, fog: true, opacity: 0.6 });
			k.point(0x80ff90, 12, 30, { x, y: 2, z, parent: grave });
		});
		k.particles(600, 0xb8f0c0, { x: 400, z: -18, box: [50, 14, 30], speed: -0.0001, drift: 1, size: 0.12, opacity: 0.3, from: 1, until: 1 });
		k.point(0xd0e0c0, 10, 60, { x: 6, y: 10, z: 10, parent: grave });

		// ---- The stampede in the gorge.
		const gorge = k.group({ x: -400, from: 3, until: 3 });
		k.box(30, 0.4, 200, 0xb08a58, { y: -0.2, parent: gorge });
		const gr = rng(9);
		[-1, 1].forEach((s) => {
			for (let i = 0; i < 18; i++) k.ico(10 + gr() * 6, [0xb07a48, 0xa06a3a, 0xc08a58][i % 3], { x: s * (20 + gr() * 6), y: 4 + gr() * 6, z: -90 + i * 10, s: [1, 1.6, 1], parent: gorge });
		});
		for (let i = 0; i < 110; i++) {
			const x = (gr() - 0.5) * 22;
			const z = -70 + gr() * 80;
			const w = gnu({ x, z, ry: (gr() - 0.5) * 0.3, parent: gorge, s: 1.2 });
			w.userData.phase = gr() * 6;
			w.userData.z0 = z;
		}
		k.particles(1600, 0xd8b080, { x: -400, z: -30, box: [26, 6, 90], speed: 0.5, drift: 3, size: 0.25, opacity: 0.35, from: 3, until: 3 });
		const snag = k.group({ x: 9, y: 0, z: 14, parent: gorge });
		k.cyl(0.4, 0.6, 7, 0x6a5a48, { y: 3.5, rz: -0.2, parent: snag });
		k.cyl(0.18, 0.28, 4, 0x6a5a48, { x: -1.8, y: 6.4, rz: 1.1, parent: snag });
		cub({ x: -2.6, y: 6.75, z: 0, ry: -PI / 2, s: 1.3, parent: snag });

		// ---- The log walk.
		const walk = k.group({ z: 400, from: 4, until: 4 });
		k.sky(0x5a2a6a, 0xffa040, { r: 300, tag: "sunset", parent: walk, offset: -0.1 });
		k.disc(0xffd890, 60, { x: 0, y: 6, z: -200, parent: walk });
		k.glow(0xffc070, 200, { x: 0, y: 6, z: -195, parent: walk, opacity: 0.7 });
		const sil = 0x1a0c10;
		k.box(30, 8, 20, sil, { x: -20, y: -4, z: -10, parent: walk });
		k.box(30, 8, 20, sil, { x: 22, y: -4, z: -10, parent: walk });
		k.cyl(0.4, 0.5, 18, sil, { y: 0.3, z: -10, rz: PI / 2, parent: walk });
		const lion = k.group({ x: -2, y: 0.7, z: -10, ry: PI / 2, parent: walk });
		k.box(0.8, 0.9, 2.2, sil, { y: 1.2, parent: lion });
		k.sphere(0.75, sil, { y: 1.85, z: 1.2, parent: lion });
		k.sphere(0.4, sil, { y: 1.8, z: 1.75, parent: lion });
		k.cyl(0.05, 0.05, 1.2, sil, { y: 1.2, z: -1.5, rx: -0.6, parent: lion });
		[-0.3, 0.3].forEach((x) => [-0.8, 0.8].forEach((z, j) => k.box(0.22, 1.0, 0.22, sil, { x, y: 0.5, z, rx: (j ? 0.3 : -0.3) * Math.sign(x), parent: lion })));
		const hog = k.group({ x: 1.5, y: 0.7, z: -10, ry: PI / 2, parent: walk });
		k.sphere(0.6, sil, { y: 0.8, s: [0.9, 0.85, 1.3], parent: hog });
		k.box(0.5, 0.5, 0.6, sil, { y: 0.75, z: 0.85, parent: hog });
		[-1, 1].forEach((s) => k.cone(0.05, 0.3, sil, { x: s * 0.2, y: 0.85, z: 1.2, rx: -0.6, parent: hog }));
		k.cyl(0.03, 0.03, 0.8, sil, { y: 1.3, z: -0.75, rx: -0.3, parent: hog });
		[-0.25, 0.25].forEach((x) => [-0.5, 0.5].forEach((z) => k.box(0.14, 0.5, 0.14, sil, { x, y: 0.25, z, parent: hog })));
		const cat = k.group({ x: 3.4, y: 0.7, z: -10, ry: PI / 2, parent: walk });
		k.capsule(0.14, 0.5, sil, { y: 0.5, rx: 0.4, parent: cat });
		k.sphere(0.12, sil, { y: 0.88, z: 0.25, parent: cat });
		k.cyl(0.03, 0.02, 0.5, sil, { y: 0.3, z: -0.35, rx: -1.0, parent: cat });
		[-0.07, 0.07].forEach((x) => k.box(0.05, 0.3, 0.05, sil, { x, y: 0.15, parent: cat }));
		for (let i = 0; i < 8; i++) k.box(1.2, 0.06, 0.2, sil, { x: -40 + i * 9, y: 25 + (i % 3) * 3, z: -120, rz: i % 2 ? 0.3 : -0.3, parent: walk });
		acacia(-14, -40, 1.5, { dark: true, parent: walk });

		// ---- Pride Rock.
		const rock = k.group({ x: 0, y: 0, z: -400, from: 5, until: 5 });
		k.sky(0x4a7ac0, 0xffd8a0, { r: 400, tag: "dawn", parent: rock, offset: -0.05 });
		k.ground(600, 0xc8a050, { bump: 0.4, seg: 40, parent: rock });
		const rc = 0x9a7a5a;
		k.ico(14, rc, { x: -10, y: 2, z: -10, s: [1.6, 0.9, 1.2], parent: rock, detail: 1 });
		k.ico(9, 0x8a6a4a, { x: 4, y: 3, z: -8, s: [1.2, 1, 1], parent: rock, detail: 1 });
		k.box(14, 8, 9, 0x8a6a4a, { x: -2, y: 13, z: -8, rz: -0.08, parent: rock });
		k.box(26, 3.4, 7, 0xa88a68, { x: 11, y: 19.0, z: -6, rz: 0.12, parent: rock });
		k.ico(9, 0x9a7a5a, { x: 8, y: 9, z: -7, s: [1.5, 1.1, 0.9], parent: rock, detail: 1 });
		k.ico(6, 0x8a6a4a, { x: 14, y: 4, z: -4, s: [1.3, 1, 1], parent: rock });
		k.box(10, 2, 5, 0x9a7a5a, { x: 2, y: 17.4, z: -6, rz: 0.2, parent: rock });
		k.ico(3, rc, { x: -8, y: 18, z: -9, parent: rock });
		for (let i = 0; i < 12; i++) k.ico(1 + (i % 3), 0x8a6a4a, { x: -20 + i * 4, y: 1, z: 6 + (i % 2) * 3, parent: rock });
		const tip = [22.0, 21.75, -6];
		const rafiki = k.person({ x: tip[0], y: tip[1], z: tip[2], ry: 1.3, s: 1.5, pose: "raise", hair: true, colors: { shirt: 0x8a8a9a, legs: 0x8a8a9a, skin: 0x7a7a8a, hair: 0xf0f0f0 }, sleeves: 0x8a8a9a, parent: rock });
		rafiki.userData.limbs.armL.rotation.z = -2.8;
		rafiki.userData.limbs.armR.rotation.z = 2.8;
		k.sphere(0.14, 0xf0f0f0, { y: 1.62, z: 0.12, parent: rafiki });
		k.cyl(0.03, 0.03, 2.2, 0x6a4a2a, { x: -0.6, y: 1.1, z: 0.3, parent: rafiki });
		cub({ y: 2.6, z: 0, ry: PI / 2, s: 0.9, parent: rafiki });
		const beam = new k.THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.2, blending: k.THREE.AdditiveBlending, depthWrite: false });
		k.mesh(new k.THREE.CylinderGeometry(2, 4.5, 90, 12, 1, true), beam, { x: tip[0] - 13, y: 66, z: tip[2], rz: -0.3, parent: rock, shadow: false });
		k.point(0xfff0c0, 20, 20, { x: tip[0] - 1, y: tip[1] + 6, z: tip[2] + 3, parent: rock });

		const ar = rng(30);
		for (let i = 0; i < 24; i++) zebra({ x: 20 + ar() * 40, z: 10 + ar() * 30, ry: -PI + (ar() - 0.5), parent: rock });
		for (let i = 0; i < 6; i++) giraffe({ x: 30 + ar() * 30, z: 20 + ar() * 30, ry: -2.6, parent: rock });
		for (let i = 0; i < 5; i++) elephant({ x: 42 + ar() * 20, z: 6 + ar() * 20, ry: -2.2, parent: rock });
		for (let i = 0; i < 16; i++) gnu({ x: 14 + ar() * 20, z: 26 + ar() * 20, ry: -PI + 0.3, parent: rock });
		return {
			shots: [
				{ pos: [400.5, 2.4, 401.9], look: [400.0, 0.95, 400.0], fov: 40, fog: [0x2a3a22, 8, 30], exposure: 1.2 },
				{ pos: [413, 5, 16], look: [400, 7, -14], fov: 55, fog: [0x5a6a54, 20, 160], hide: ["sky"], exposure: 1.3 },
				{ pos: [22, 3.2, 12], look: [16, 2.8, -22], fov: 50 },
				{ pos: [-399, 24, 34], look: [-400, 1, -16], fov: 55, fog: [0xd0a070, 30, 200], hide: ["sky"] },
				{ pos: [0, -1, 412], look: [0, 3, 390], fov: 55, fog: [0xf0a050, 300, 600], hide: ["sky"] },
				{ pos: [38, 15, 12 - 400], look: [18, 19, -6 - 400], fov: 50,
 fog: [0xf0c890, 120, 600], hide: ["sky"] },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the toys
	r25: (k) => {
		k.fog(0x9ad0f0, 60, 200);
		k.sky(0x6ab0e8, 0xd8f0ff);
		k.light({ sky: 0xfff8f0, ground: 0x8a6a4a, hemi: 1.4, sunColor: 0xfff0d8, sunIntensity: 1.8, sunPos: [20, 40, 30], shadowSize: 30 });
		const cloudsTex = k.canvas(512, 512, (g) => {
			g.fillStyle = "#5aa8e8";
			g.fillRect(0, 0, 512, 512);
			g.fillStyle = "#ffffff";
			const r = rng(25);
			for (let i = 0; i < 9; i++) {
				const cx = (i % 3) * 170 + 60 + r() * 40;
				const cy = Math.floor(i / 3) * 170 + 70 + r() * 30;
				[[0, 0, 34], [36, -10, 40], [74, 2, 30], [24, 16, 30], [54, 18, 28]].forEach(([dx, dy, rr]) => {
					g.beginPath();
					g.arc(cx + dx, cy + dy, rr, 0, PI * 2);
					g.fill();
				});
				g.fillRect(cx, cy, 80, 40);
			}
		});
		cloudsTex.wrapS = cloudsTex.wrapT = k.THREE.RepeatWrapping;
		const wallMat = (rx, ry) => {
			const t = cloudsTex.clone();
			t.needsUpdate = true;
			t.repeat.set(rx, ry);
			return k.mat(0xffffff, { map: t, rough: 0.9 });
		};
		const room = k.group({ until: 5 });
		const floorTex = k.canvas(256, 256, (g) => {
			g.fillStyle = "#b07a48";
			g.fillRect(0, 0, 256, 256);
			for (let i = 0; i < 8; i++) {
				g.fillStyle = i % 2 ? "#a06c3c" : "#b88250";
				g.fillRect(0, i * 32, 256, 30);
			}
		});
		floorTex.wrapS = floorTex.wrapT = k.THREE.RepeatWrapping;
		floorTex.repeat.set(4, 4);
		k.plane(40, 40, k.mat(0xffffff, { map: floorTex }), { rx: -PI / 2, parent: room });
		k.cyl(6, 6, 0.06, 0x3a6ab0, { x: 4, y: 0.03, z: 2, s: [1.4, 1, 1], parent: room, seg: 24 });
		k.cyl(4.6, 4.6, 0.07, 0xd84a3a, { x: 4, y: 0.035, z: 2, s: [1.4, 1, 1], parent: room, seg: 24 });
		k.cyl(3.2, 3.2, 0.08, 0xf2c230, { x: 4, y: 0.04, z: 2, s: [1.4, 1, 1], parent: room, seg: 24 });
		k.box(40, 0.4, 40, 0xf4f0e8, { y: 16, parent: room, emissive: 0xb0aca0, glow: 1 });
		k.box(40, 16, 0.3, wallMat(3, 1.2), { y: 8, z: 15, parent: room });
		k.box(0.3, 16, 40, wallMat(3, 1.2), { x: 15, y: 8, parent: room });
		k.box(40, 16, 0.3, wallMat(3, 1.2), { y: 8, z: -15, parent: room });

		k.box(0.3, 16, 40, wallMat(3, 1.2), { x: -15, y: 8, parent: room });
		k.box(40, 0.5, 0.4, 0xf4f0e8, { y: 0.25, z: -14.8, parent: room });
		k.box(0.4, 0.5, 40, 0xf4f0e8, { x: -14.8, y: 0.25, parent: room });
		k.box(8, 6, 0.2, 0xd8f0ff, { x: 6, y: 9, z: -14.8, parent: room, emissive: 0xa0c8e8, glow: 0.6 });
		k.box(8.6, 0.4, 0.5, 0xf4f0e8, { x: 6, y: 5.9, z: -14.7, parent: room });
		k.box(0.3, 6, 0.3, 0xf4f0e8, { x: 6, y: 9, z: -14.65, parent: room });
		// The bed.
		const spread = k.canvas(256, 256, (g) => {
			g.fillStyle = "#d8b878";
			g.fillRect(0, 0, 256, 256);
			g.fillStyle = "#b8401a";
			for (let i = 0; i < 4; i++) g.fillRect(0, 20 + i * 64, 256, 10);
			g.strokeStyle = "#5a3a1a";
			g.lineWidth = 4;
			for (let i = 0; i < 6; i++) {
				g.beginPath();
				g.arc(40 + (i % 3) * 90, 60 + Math.floor(i / 3) * 120, 22, 0, PI * 2);
				g.stroke();
			}
		});
		const bed = k.group({ x: -6, z: -9, parent: room });
		k.box(9, 2.4, 12, 0x8a5a30, { y: 1.2, parent: bed });
		k.box(8.6, 1.0, 11.6, 0xf4f0e8, { y: 2.9, parent: bed });
		k.box(9.2, 0.4, 9, k.mat(0xffffff, { map: spread }), { y: 3.5, z: 1.4, parent: bed });
		k.box(9.2, 1.8, 0.2, k.mat(0xffffff, { map: spread }), { y: 2.6, z: 5.95, parent: bed });
		k.box(4, 0.8, 2.2, 0xffffff, { y: 3.7, z: -4.4, parent: bed });
		k.box(9.6, 6, 0.6, 0x7a4a24, { y: 3, z: -6.1, parent: bed });
		k.box(9.6, 3.6, 0.6, 0x7a4a24, { y: 1.8, z: 6.1, parent: bed });
		[-4.6, 4.6].forEach((x) => {
			k.cyl(0.45, 0.45, 7, 0x6a3a1a, { x, y: 3.5, z: -6.1, parent: bed });
			k.sphere(0.6, 0x6a3a1a, { x, y: 7.2, z: -6.1, parent: bed });
			k.cyl(0.45, 0.45, 4.6, 0x6a3a1a, { x, y: 2.3, z: 6.1, parent: bed });
			k.sphere(0.6, 0x6a3a1a, { x, y: 4.8, z: 6.1, parent: bed });
		});
		// Bookshelf, toy chest, blocks.
		k.box(5, 9, 2, 0xf0e8d8, { x: 10, y: 4.5, z: -13.8, parent: room });
		for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) k.box(0.4, 1.8, 1.4, [0xd84a3a, 0x3a6ab0, 0xf2c230, 0x5aa050][(i + j) % 4], { x: 8.2 + j * 0.65, y: 1.4 + i * 2.8, z: -13.7, parent: room });
		k.box(5, 3, 3, 0xd84a3a, { x: -12, y: 1.5, z: 6, ry: PI / 2, parent: room });
		const br = rng(5);
		for (let i = 0; i < 8; i++) k.box(1, 1, 1, [0xd84a3a, 0x3a6ab0, 0xf2c230, 0x5aa050][i % 4], { x: 8 + br() * 5, y: 0.5 + (i > 5 ? 1 : 0), z: 6 + br() * 4, ry: br(), parent: room });
		// Rex, Hamm and Mr. Potato Head on the floor.
		const rex = k.group({ x: 3, z: -1, ry: 0.5, parent: room });
		const rc = 0x5ab040;
		k.capsule(0.7, 1.2, rc, { y: 1.9, rx: 0.4, parent: rex });
		k.box(1.0, 0.9, 1.5, rc, { y: 3.2, z: 0.6, rx: -0.2, parent: rex });
		k.box(0.9, 0.3, 1.3, 0xe8e0a0, { y: 2.7, z: 0.7, rx: -0.1, parent: rex });
		[-1, 1].forEach((s) => {
			k.cyl(0.3, 0.35, 1.3, rc, { x: s * 0.5, y: 0.65, parent: rex });
			k.box(0.5, 0.2, 0.8, rc, { x: s * 0.5, y: 0.1, z: 0.2, parent: rex });
			k.cyl(0.08, 0.08, 0.45, rc, { x: s * 0.45, y: 2.1, z: 0.6, rx: -1.2, parent: rex });
			k.sphere(0.1, 0xffffff, { x: s * 0.35, y: 3.5, z: 1.1, parent: rex });
			k.sphere(0.05, 0x111111, { x: s * 0.35, y: 3.5, z: 1.19, parent: rex });
		});
		k.cone(0.5, 2.2, rc, { y: 1.0, z: -1.5, rx: -1.7, parent: rex });
		for (let i = 0; i < 5; i++) k.cone(0.12, 0.3, 0x7ad050, { y: 2.6 - i * 0.35, z: -0.5 - i * 0.25, rx: -0.6, parent: rex, seg: 4 });
		const hamm = k.group({ x: -1.2, z: 2, ry: 0.7, parent: room });
		const pink = 0xf0a0b0;
		k.sphere(0.8, pink, { y: 1.1, s: [1, 0.95, 1.2], parent: hamm, flat: false });
		k.cyl(0.25, 0.3, 0.3, 0xe08898, { y: 1.15, z: 1.05, rx: PI / 2, parent: hamm });
		[-0.1, 0.1].forEach((x) => k.sphere(0.05, 0x5a2a3a, { x, y: 1.15, z: 1.2, parent: hamm }));
		[-1, 1].forEach((s) => {
			k.cone(0.18, 0.3, pink, { x: s * 0.35, y: 1.85, z: 0.4, rz: -s * 0.4, parent: hamm, seg: 4 });
			k.sphere(0.07, 0x111111, { x: s * 0.25, y: 1.5, z: 0.85, parent: hamm });
			[-0.5, 0.5].forEach((z) => k.cyl(0.18, 0.18, 0.5, pink, { x: s * 0.4, y: 0.25, z, parent: hamm }));
		});
		k.box(0.3, 0.04, 0.06, 0x3a1a2a, { y: 2.0, parent: hamm });
		const mph = k.group({ x: 7, z: 1, ry: -0.5, parent: room });
		const pot = 0xb08048;
		k.sphere(0.85, pot, { y: 1.5, s: [1, 1.3, 0.9], parent: mph });
		[-1, 1].forEach((s) => {
			k.box(0.4, 0.25, 0.7, 0xd02020, { x: s * 0.35, y: 0.15, z: 0.15, parent: mph });
			k.sphere(0.15, 0xffffff, { x: s * 0.27, y: 2.0, z: 0.7, parent: mph });
			k.sphere(0.08, 0x111111, { x: s * 0.27, y: 2.0, z: 0.83, parent: mph });
			k.sphere(0.2, 0xf0a0a0, { x: s * 0.85, y: 1.8, s: [0.4, 1, 0.8], parent: mph });
			k.box(0.15, 0.6, 0.15, 0xffffff, { x: s * 0.9, y: 1.3, z: 0.2, rz: s * 0.6, parent: mph });
		});
		k.sphere(0.17, 0xe03030, { y: 1.65, z: 0.85, parent: mph });
		k.box(0.6, 0.15, 0.1, 0x2a1a10, { y: 1.42, z: 0.8, parent: mph });
		k.box(0.5, 0.12, 0.12, 0xe02040, { y: 1.15, z: 0.75, parent: mph });
		k.cyl(0.6, 0.6, 0.05, 0x1a1a1a, { y: 2.55, parent: mph });
		k.cyl(0.4, 0.45, 0.4, 0x1a1a1a, { y: 2.75, parent: mph });
		// The green army men and the baby monitor.
		const army = 0x4a8a30;
		const ar = rng(7);
		for (let i = 0; i < 14; i++) {
			const x = -9 + (i % 5) * 0.9 + ar() * 0.3;
			const z = 9.5 + Math.floor(i / 5) * 0.9 + ar() * 0.3;
			k.cyl(0.25, 0.25, 0.06, army, { x, y: 0.03, z, parent: room });
			const p = k.person({ x, y: 0.06, z, ry: 0.8 + ar() * 0.4, s: 0.32, pose: i % 3 ? "point" : "run", colors: { shirt: army, legs: army, skin: army, hair: army, shoes: army }, sleeves: army, parent: room });
			k.sphere(0.24, army, { y: 1.85, s: [1, 0.55, 1], parent: p });
			if (i % 3) k.box(0.08, 0.08, 0.8, army, { x: 0.35, y: 1.45, z: 0.4, parent: p });
		}
		const mon = k.group({ x: -10.4, y: 0, z: 13.4, ry: 2.4, parent: room });
		k.box(1.4, 2.0, 0.8, 0xf4f0e8, { y: 1.0, parent: mon, rough: 0.4 });
		for (let i = 0; i < 5; i++) k.box(1.0, 0.06, 0.05, 0x8a8a8a, { y: 1.4 - i * 0.18, z: 0.41, parent: mon });
		k.cyl(0.06, 0.06, 1.4, 0x3a3a3a, { x: 0.5, y: 2.6, parent: mon });
		k.sphere(0.1, 0xff3030, { x: -0.4, y: 1.75, z: 0.41, emissive: 0xff0000, glow: 1, parent: mon });
		// Woody.
		const woody = k.group({ x: -5.2, y: 3.7, z: -3.2, ry: 0.35, parent: room });
		const plaid = k.canvas(64, 64, (g) => {
			g.fillStyle = "#f2c840";
			g.fillRect(0, 0, 64, 64);
			g.fillStyle = "rgba(200,60,30,0.7)";
			for (let i = 0; i < 64; i += 16) {
				g.fillRect(i, 0, 4, 64);
				g.fillRect(0, i, 64, 4);
			}
		});
		const shirt = k.mat(0xffffff, { map: plaid });
		const cow = k.canvas(128, 128, (g) => {
			g.fillStyle = "#f4f0e8";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#111111";
			[[20, 20, 18], [80, 30, 14], [40, 80, 20], [100, 90, 16], [10, 110, 10]].forEach(([x, y, r]) => {
				g.beginPath();
				g.ellipse(x, y, r, r * 0.7, 0.5, 0, PI * 2);
				g.fill();
			});
		});
		const vest = k.mat(0xffffff, { map: cow });
		const jeans = 0x3a5aa0;
		const skin = 0xf0c8a0;
		[-0.13, 0.13].forEach((x) => {
			k.box(0.18, 0.9, 0.18, jeans, { x, y: 0.55, parent: woody });
			k.box(0.2, 0.25, 0.32, 0x6a3a1a, { x, y: 0.12, z: 0.04, parent: woody });
		});
		k.box(0.46, 0.08, 0.26, 0x5a3a1a, { y: 1.03, parent: woody });
		k.box(0.12, 0.08, 0.02, 0xe8c040, { y: 1.03, z: 0.14, parent: woody, metal: 0.8 });
		k.box(0.44, 0.6, 0.24, shirt, { y: 1.37, parent: woody });
		k.box(0.2, 0.5, 0.05, vest, { x: -0.13, y: 1.4, z: 0.12, parent: woody });
		k.box(0.2, 0.5, 0.05, vest, { x: 0.13, y: 1.4, z: 0.12, parent: woody });
		k.box(0.46, 0.55, 0.05, vest, { y: 1.4, z: -0.13, parent: woody });
		const star = new k.THREE.Shape();
		for (let i = 0; i < 10; i++) {
			const a = (i / 10) * PI * 2 + PI / 2;
			const r = i % 2 ? 0.035 : 0.08;
			i === 0 ? star.moveTo(Math.cos(a) * r, Math.sin(a) * r) : star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
		}
		k.mesh(new k.THREE.ExtrudeGeometry(star, { depth: 0.02, bevelEnabled: false }), k.mat(0xe8c040, { metal: 0.8, rough: 0.3 }), { x: -0.13, y: 1.5, z: 0.15, parent: woody });
		[-1, 1].forEach((s) => {
			const arm = k.group({ x: s * 0.28, y: 1.62, parent: woody, rz: s * 0.25 });
			k.box(0.14, 0.7, 0.14, shirt, { y: -0.35, parent: arm });
			k.sphere(0.09, skin, { y: -0.75, parent: arm });
		});
		k.box(0.2, 0.14, 0.12, 0xd02020, { y: 1.68, z: 0.1, parent: woody });
		k.cyl(0.06, 0.06, 0.1, skin, { y: 1.72, parent: woody });
		const head = k.group({ y: 2.0, parent: woody });
		k.sphere(0.24, skin, { s: [0.95, 1.15, 1], parent: head, flat: false });
		k.sphere(0.24, 0x5a3418, { y: 0.06, z: -0.03, s: [1, 1.05, 1], parent: head, flat: false });
		[-1, 1].forEach((s) => {
			k.sphere(0.06, 0xffffff, { x: s * 0.08, y: 0.04, z: 0.2, parent: head });
			k.sphere(0.035, 0x6a3a1a, { x: s * 0.08, y: 0.04, z: 0.25, parent: head });
			k.box(0.08, 0.02, 0.02, 0x3a2010, { x: s * 0.08, y: 0.13, z: 0.23, rz: -s * 0.2, parent: head });
			k.sphere(0.05, skin, { x: s * 0.24, y: 0.0, parent: head });
		});
		k.sphere(0.04, 0xe8a880, { y: -0.03, z: 0.26, parent: head });
		k.torus(0.08, 0.015, 0x8a2a20, { y: -0.12, z: 0.21, rx: 0.2, arc: PI, rz: PI, parent: head });
		k.cyl(0.48, 0.48, 0.04, 0x8a5a2a, { y: 0.24, rz: 0.08, s: [1, 1, 0.85], parent: head });
		k.cyl(0.2, 0.25, 0.28, 0x8a5a2a, { y: 0.38, parent: head });
		k.box(0.04, 0.06, 0.4, 0x6a4020, { y: 0.52, parent: head });
		k.cyl(0.255, 0.255, 0.06, 0x5a3a1a, { y: 0.28, parent: head });
		// Buzz, on the bedpost.
		const buzz = k.group({ x: -1.4, y: 4.8 + 0.6, z: -2.9, ry: -0.45, parent: room, from: 5 });
		const wh = 0xf4f4f0;
		const gr = 0x6ac040;
		const pu = 0x7a4ab0;
		[-0.15, 0.15].forEach((x) => {
			k.box(0.22, 0.85, 0.24, wh, { x, y: 0.5, parent: buzz });
			k.box(0.23, 0.12, 0.25, gr, { x, y: 0.55, parent: buzz });
			k.box(0.24, 0.2, 0.34, pu, { x, y: 0.1, z: 0.04, parent: buzz });
		});
		k.box(0.5, 0.14, 0.3, gr, { y: 1.0, parent: buzz });
		k.box(0.62, 0.6, 0.38, wh, { y: 1.38, parent: buzz });
		k.box(0.36, 0.3, 0.05, 0xd8d8e0, { y: 1.4, z: 0.2, parent: buzz });
		[0xd02020, 0x30a030, 0x3060d0].forEach((c, i) => k.sphere(0.035, c, { x: -0.1 + i * 0.1, y: 1.38, z: 0.23, parent: buzz, emissive: c, glow: 0.4 }));
		k.box(0.5, 0.2, 0.1, gr, { y: 1.65, z: 0.15, parent: buzz });
		[-1, 1].forEach((s) => {
			const wing = k.group({ x: s * 0.2, y: 1.45, z: -0.25, rz: s * 0.15, parent: buzz });
			k.box(1.3, 0.18, 0.06, wh, { x: s * 0.7, parent: wing });
			k.box(0.3, 0.2, 0.065, 0xd02020, { x: s * 1.3, y: 0, parent: wing });
			k.box(0.8, 0.06, 0.07, gr, { x: s * 0.6, y: -0.06, parent: wing });
		});
		k.box(0.3, 0.5, 0.15, wh, { y: 1.4, z: -0.25, parent: buzz });
		const armL = k.group({ x: -0.38, y: 1.6, rz: -0.35, parent: buzz });
		k.box(0.2, 0.65, 0.2, wh, { y: -0.3, parent: armL });
		k.box(0.21, 0.12, 0.21, gr, { y: -0.3, parent: armL });
		k.sphere(0.11, gr, { y: -0.7, parent: armL });
		const armR = k.group({ x: 0.38, y: 1.6, rz: 2.7, rx: -0.2, parent: buzz });
		k.box(0.2, 0.65, 0.2, wh, { y: -0.3, parent: armR });
		k.box(0.21, 0.12, 0.21, gr, { y: -0.3, parent: armR });
		k.sphere(0.11, gr, { y: -0.7, parent: armR });
		const bh = k.group({ y: 1.95, parent: buzz });
		k.sphere(0.24, 0xf0c8a0, { s: [0.95, 1.1, 1], parent: bh, flat: false });
		k.sphere(0.25, pu, { y: 0.06, z: -0.04, s: [1, 1.05, 1], parent: bh, flat: false });
		k.box(0.22, 0.12, 0.14, 0xf0c8a0, { y: -0.17, z: 0.1, parent: bh });
		[-1, 1].forEach((s) => {
			k.sphere(0.05, 0xffffff, { x: s * 0.08, y: 0.03, z: 0.2, parent: bh });
			k.sphere(0.03, 0x4a6ab0, { x: s * 0.08, y: 0.03, z: 0.24, parent: bh });
			k.box(0.08, 0.025, 0.02, 0x3a2010, { x: s * 0.08, y: 0.11, z: 0.22, rz: s * 0.25, parent: bh });
		});
		k.sphere(0.42, 0xe0f0ff, { y: 0.02, parent: bh, opacity: 0.25, rough: 0.05, flat: false });
		k.torus(0.4, 0.04, pu, { y: -0.2, rx: PI / 2, parent: bh });
		k.box(0.02, 0.4, 0.4, pu, { y: 0.0, parent: buzz });
		k.cyl(0.6, 0.6, 0.15, 0x6a3a1a, { x: -1.4, y: 5.4, z: -2.9, parent: room, from: 5 });
		k.point(0xfff8f0, 12, 20, { x: -2, y: 8, z: 2, parent: room });

		// ---- A desk top in lamplight: a Magic 8-Ball, a pencil cup, crayons.
		const desk = k.group({ x: -400, from: 0, until: 0 });
		k.box(6, 0.2, 3, 0xb07a48, { y: 2.9, parent: desk, rough: 0.6 });
		k.box(5.8, 2.9, 2.8, 0x9a6a3c, { y: 1.45, parent: desk });
		k.box(8, 6, 0.2, 0xe8dcc0, { y: 3, z: -1.6, parent: desk });
		const ball = k.group({ x: 0.2, y: 3.38, z: 0.1, ry: 0.45, rx: -0.3, parent: desk });
		k.sphere(0.38, 0x0a0a0c, { parent: ball, flat: false, rough: 0.12, metal: 0.3, seg: 28, rings: 20 });
		const eight = k.canvas(128, 128, (g, w, h) => {
			g.fillStyle = "#ffffff";
			g.beginPath();
			g.arc(64, 64, 62, 0, PI * 2);
			g.fill();
			g.fillStyle = "#0a0a0c";
			g.font = "bold 92px Georgia, serif";
			g.textAlign = "center";
			g.textBaseline = "middle";
			g.fillText("8", 64, 70);
		});
		k.mesh(new k.THREE.CircleGeometry(0.17, 24), new k.THREE.MeshStandardMaterial({ map: eight, transparent: true, roughness: 0.3 }), { z: 0.383, parent: ball });
		k.cyl(0.25, 0.22, 0.6, 0x3a6ab0, { x: -1.3, y: 3.3, z: -0.5, parent: desk, seg: 14 });
		[[0xd83a2a, -0.08], [0xf2c230, 0.06], [0x3a9a3a, 0.0]].forEach(([c, dx], i) => k.cyl(0.03, 0.03, 0.9, c, { x: -1.3 + dx, y: 3.6, z: -0.5 + (i - 1) * 0.07, rz: dx * 2, parent: desk, seg: 6 }));
		[[0xd83a2a, 0.9, 0.5, 0.3], [0x3a6ad0, 1.1, 0.3, -0.4], [0x8a3ac8, 0.7, 0.8, 1.2]].forEach(([c, x, z, ry]) => {
			k.cyl(0.035, 0.035, 0.4, c, { x, y: 3.035, z, rz: PI / 2, ry, parent: desk, seg: 8 });
			k.cone(0.035, 0.08, c, { x: x + Math.cos(ry) * 0.24, y: 3.035, z: z - Math.sin(ry) * 0.24, rz: -PI / 2, ry, parent: desk, seg: 8 });
		});
		k.cyl(0.35, 0.4, 0.1, 0x2a2a2a, { x: 2.0, y: 3.05, z: -0.8, parent: desk });
		k.cyl(0.04, 0.04, 1.4, 0x2a2a2a, { x: 2.0, y: 3.75, z: -0.8, parent: desk });
		k.cone(0.5, 0.5, 0xf4e8c8, { x: 2.0, y: 4.5, z: -0.8, parent: desk, emissive: 0xffd890, glow: 0.4, seg: 14 });
		k.point(0xffe0b0, 10, 8, { x: 1.8, y: 4.2, z: -0.3, parent: desk });
		k.point(0xd8e0ff, 3, 10, { x: -2, y: 5, z: 3, parent: desk });

		// ---- Pizza Planet's claw machine.
		const pp = k.group({ x: 400, from: 2, until: 2 });
		k.box(30, 0.2, 30, 0x2a2a5a, { y: -0.1, parent: pp });
		k.box(30, 12, 0.4, 0x1a1a3a, { y: 6, z: -6, parent: pp });
		for (let i = 0; i < 30; i++) k.glow([0xff6ad0, 0x6ad0ff, 0xffe060][i % 3], 0.6, { x: -12 + (i % 10) * 2.6, y: 4 + Math.floor(i / 10) * 3, z: -5.7, parent: pp });
		k.box(4, 2.5, 3, 0xd03030, { y: 1.25, parent: pp });
		k.box(4.1, 0.3, 3.1, 0xf2c230, { y: 2.6, parent: pp });
		const glass = new k.THREE.MeshStandardMaterial({ color: 0xc8e0ff, transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false });
		k.box(4, 3.5, 3, glass, { y: 4.5, parent: pp, shadow: false });
		[-1, 1].forEach((sx) => [-1, 1].forEach((sz) => k.box(0.12, 3.6, 0.12, 0x3a6ad0, { x: sx * 1.95, y: 4.5, z: sz * 1.45, parent: pp })));
		k.box(4.2, 1.2, 3.2, 0x3a6ad0, { y: 6.8, parent: pp });
		k.cone(0.6, 1.6, 0xd03030, { y: 8.2, parent: pp });
		k.box(0.06, 0.6, 0.06, 0xc8c8c8, { x: 0.3, y: 5.7, z: 0.2, parent: pp, metal: 0.8 });
		const claw = k.group({ x: 0.3, y: 5.3, z: 0.2, parent: pp });
		k.cyl(0.18, 0.12, 0.2, 0xc8c8c8, { parent: claw, metal: 0.8, rough: 0.3 });
		for (let i = 0; i < 3; i++) {
			const a = (i / 3) * PI * 2;
			k.box(0.04, 0.5, 0.06, 0xd8d8d8, { x: Math.cos(a) * 0.16, y: -0.25, z: Math.sin(a) * 0.16, rx: Math.sin(a) * 0.4, rz: -Math.cos(a) * 0.4, parent: claw, metal: 0.8 });
		}
		k.tick((t) => (claw.position.y = 5.0 + Math.sin(t * 0.7) * 0.25));
		const alien = (o) => {
			const g = k.group(o);
			k.box(0.36, 0.34, 0.22, 0x3a6ad0, { y: 0.2, parent: g });
			k.box(0.38, 0.06, 0.24, 0xffffff, { y: 0.38, parent: g });
			k.sphere(0.24, 0x8ae050, { y: 0.62, s: [1.1, 0.9, 0.9], parent: g, flat: false });
			[-0.1, 0, 0.1].forEach((x, i) => {
				k.sphere(0.055, 0xffffff, { x, y: 0.66 + (i === 1 ? 0.04 : 0), z: 0.19, parent: g });
				k.sphere(0.028, 0x111111, { x, y: 0.66 + (i === 1 ? 0.04 : 0), z: 0.235, parent: g });
			});
			k.torus(0.06, 0.012, 0x2a5a1a, { y: 0.52, z: 0.2, arc: PI, rz: PI, parent: g });
			k.cyl(0.012, 0.012, 0.22, 0x8ae050, { y: 0.92, parent: g });
			k.sphere(0.04, 0x8ae050, { y: 1.04, parent: g });
			return g;
		};
		const alr = rng(3);
		for (let i = 0; i < 28; i++) {
			const x = -1.6 + (i % 7) * 0.5 + alr() * 0.1;
			const z = -1.1 + Math.floor(i / 7) * 0.6;
			alien({ x, y: 2.75 + (1 - Math.abs(x) / 2) * 0.25, z, ry: (alr() - 0.5) * 0.8 - 0.2, parent: pp });
		}
		k.point(0xff80e0, 14, 14, { x: 3, y: 6, z: 4, parent: pp });
		k.point(0x80e0ff, 14, 14, { x: -3, y: 6, z: 4, parent: pp });
		k.point(0xffffff, 8, 6, { y: 6.1, parent: pp });
		return {
			shots: [
				{ pos: [-399.3, 3.9, 1.7], look: [-400, 3.3, 0], fov: 45, fog: [0x2a2420, 6, 24], exposure: 1.15 },
				{ pos: [-5, 2.2, 12.8], look: [-7.4, 0.2, 10.6], fov: 40 },
				{ pos: [400.8, 3.9, 3.6], look: [400, 3.3, 0], fov: 45, fog: [0x14143a, 10, 40], exposure: 1.2 },
				{ pos: [9, 1.6, 9], look: [0, 2, -4], fov: 55 },
				{ pos: [-4.2, 5.8, -0.4], look: [-5.2, 5.6, -3.2], fov: 45 },
				{ pos: [0.9, 5.5, 0.9], look: [-1.5, 6.4, -2.9], fov: 50 },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the reef
	r26: (k) => {
		k.fog(0x2a8ac0, 8, 90);
		k.sky(0x9ae0ff, 0x1a6aa0, { offset: -0.1 });
		k.light({ sky: 0xc8f0ff, ground: 0x2a5a7a, hemi: 1.5, sunColor: 0xe8fff8, sunIntensity: 2.0, sunPos: [10, 60, 20], shadowSize: 30 });
		const clown = (o, small) => {
			const g = k.group(o);
			const or = 0xff7a1a;
			k.sphere(0.5, or, { s: [0.55, 0.75, 1.1], parent: g, flat: false });
			[0.3, -0.05, -0.38].forEach((z, i) => {
				const r = [0.36, 0.38, 0.28][i];
				k.cyl(r * 0.58, r * 0.58, 0.1, 0xffffff, { z, rx: PI / 2, s: [1, 1, 1.4], parent: g });
				k.cyl(r * 0.6, r * 0.6, 0.02, 0x141414, { z: z + 0.06, rx: PI / 2, s: [1, 1, 1.4], parent: g });
				k.cyl(r * 0.6, r * 0.6, 0.02, 0x141414, { z: z - 0.06, rx: PI / 2, s: [1, 1, 1.4], parent: g });
			});
			k.box(0.04, 0.4, 0.3, or, { z: -0.62, parent: g });
			k.box(0.045, 0.42, 0.04, 0x141414, { z: -0.78, parent: g });
			k.box(0.04, 0.22, 0.5, or, { y: 0.38, z: 0.0, rx: -0.2, parent: g });
			[-1, 1].forEach((s) => {
				k.sphere(0.13, 0xffffff, { x: s * 0.2, y: 0.08, z: 0.32, parent: g });
				k.sphere(0.08, 0x111111, { x: s * 0.26, y: 0.08, z: 0.36, parent: g });
				const fin = small && s > 0 ? 0.5 : 1;
				k.box(0.03, 0.2 * fin, 0.22 * fin, or, { x: s * 0.26, y: -0.12, z: 0.1, rz: s * 0.7, parent: g });
			});
			return g;
		};
		const dory = (o) => {
			const g = k.group(o);
			const blue = 0x2a5ad8;
			k.sphere(0.6, blue, { s: [0.35, 0.85, 1.2], parent: g, flat: false });
			k.box(0.04, 0.5, 0.45, 0xf2d020, { z: -0.85, parent: g });
			k.box(0.04, 0.3, 1.1, 0x141838, { y: 0.15, z: -0.1, rx: -0.15, parent: g });
			k.box(0.04, 0.18, 1.0, 0x2a5ad8, { y: 0.5, z: -0.1, parent: g });
			k.box(0.045, 0.06, 1.0, 0xf2d020, { y: 0.6, z: -0.1, parent: g });
			[-1, 1].forEach((s) => {
				k.sphere(0.14, 0xffffff, { x: s * 0.16, y: 0.12, z: 0.45, parent: g });
				k.sphere(0.08, 0x2a1a5a, { x: s * 0.2, y: 0.12, z: 0.5, parent: g });
				k.box(0.03, 0.18, 0.2, 0xf2d020, { x: s * 0.2, y: -0.15, z: 0.15, rz: s * 0.6, parent: g });
			});
			return g;
		};

		// ---- The reef and the anemone.
		const reef = k.group({ from: 5 });
		k.ground(300, 0xe8d4a0, { bump: 0.8, seg: 40, parent: reef });
		const anem = k.group({ x: 0, y: 0.3, z: 0, parent: reef });
		k.cyl(1.4, 1.8, 1.2, 0x8a3a8a, { y: 0.3, parent: anem, seg: 14 });
		const tentacles = [];
		const ar = rng(26);
		for (let i = 0; i < 120; i++) {
			const a = ar() * PI * 2;
			const d = Math.sqrt(ar()) * 1.3;
			const t = k.group({ x: Math.cos(a) * d, y: 0.9, z: Math.sin(a) * d, rx: Math.sin(a) * d * 0.4, rz: -Math.cos(a) * d * 0.4, parent: anem });
			const len = 0.7 + ar() * 0.6;
			k.capsule(0.07, len, 0xe070c0, { y: len / 2, parent: t, emissive: 0x6a2050, glow: 0.4 });
			k.sphere(0.085, 0xffb0f0, { y: len + 0.05, parent: t, emissive: 0x8a3070, glow: 0.4 });
			t.userData.p = ar() * 6;
			tentacles.push(t);
		}
		k.tick((t) => tentacles.forEach((tt) => {
			tt.rotation.x += Math.sin(t * 1.2 + tt.userData.p) * 0.002;
			tt.rotation.z += Math.cos(t * 1.0 + tt.userData.p) * 0.002;
		}));
		const cr = rng(8);
		const coralColors = [0xff6a6a, 0xffa040, 0xf0e060, 0x9a6ae0, 0x40c0b0, 0xff80c0];
		for (let i = 0; i < 70; i++) {
			const a = cr() * PI * 2;
			const d = 4 + cr() * 30;
			const x = Math.cos(a) * d;
			const z = Math.sin(a) * d;
			const c = coralColors[i % coralColors.length];
			const kind = i % 4;
			if (kind === 0) k.ico(0.8 + cr() * 1.2, c, { x, y: 0.3, z, detail: 1, s: [1, 0.7, 1], parent: reef });
			else if (kind === 1) for (let b = 0; b < 5; b++) k.cyl(0.12, 0.18, 1.5 + cr() * 2, c, { x: x + (cr() - 0.5), y: 1, z: z + (cr() - 0.5), rx: (cr() - 0.5) * 0.8, rz: (cr() - 0.5) * 0.8, parent: reef });
			else if (kind === 2) k.cyl(1.4 + cr(), 1.4 + cr(), 0.08, c, { x, y: 1.6, z, rx: PI / 2, ry: cr() * 3, parent: reef, seg: 10 });
			else for (let b = 0; b < 4; b++) k.cyl(0.25, 0.2, 1 + cr() * 1.5, c, { x: x + (cr() - 0.5) * 1.2, y: 0.8, z: z + (cr() - 0.5) * 1.2, parent: reef, open: true, side: k.THREE.DoubleSide });
		}
		for (let i = 0; i < 14; i++) k.ico(3 + cr() * 4, 0x8a7a6a, { x: (cr() - 0.5) * 80, y: 0, z: -15 - cr() * 40, s: [1.4, 0.8, 1], parent: reef });
		const school = [];
		for (let i = 0; i < 40; i++) school.push(k.cone(0.15, 0.5, [0xf2d040, 0x60c0ff][i % 2], { rx: PI / 2, seg: 4, parent: reef, s: [0.5, 1, 1] }));
		k.tick((t) => school.forEach((f, i) => {
			const a = t * 0.3 + i * 0.16;
			f.position.set(Math.cos(a) * (14 + (i % 4)), 6 + (i % 5) * 0.6, Math.sin(a) * (14 + (i % 4)) - 10);
			f.rotation.set(PI / 2, 0, -a);
		}));
		const nemo = clown({ x: 0.6, y: 2.6, z: 0.8, ry: 0.6, s: 0.8, parent: reef, from: 5 }, true);
		const marlin = clown({ x: -1.3, y: 3.0, z: 1.4, ry: 0.9, s: 1.05, parent: reef, from: 5 });
		const dor = dory({ x: 1.8, y: 3.6, z: 1.6, ry: -0.6, s: 1.2, parent: reef, from: 5 });
		k.tick((t) => {
			nemo.position.y = 2.6 + Math.sin(t * 1.5) * 0.1;
			marlin.position.y = 3.0 + Math.sin(t * 1.3 + 1) * 0.1;
			dor.position.y = 3.6 + Math.sin(t * 1.1 + 2) * 0.12;
		});
		const rays = new k.THREE.MeshBasicMaterial({ color: 0xe8fff8, transparent: true, opacity: 0.08, blending: k.THREE.AdditiveBlending, depthWrite: false });
		for (let i = 0; i < 8; i++) k.mesh(new k.THREE.CylinderGeometry(0.4, 2, 40, 8, 1, true), rays, { x: -12 + i * 4, y: 20, z: -8 + (i % 3) * 3, rz: 0.2, parent: reef, shadow: false });
		k.particles(500, 0xe8fff8, { box: [40, 20, 40], speed: 0.2, drift: 0.3, size: 0.06, opacity: 0.5 });

		// ---- The jellyfish forest.
		const jel = k.group({ x: 400, from: 2, until: 2 });
		const jellies = [];
		const jr = rng(4);
		for (let i = 0; i < 70; i++) {
			const g = k.group({ x: (jr() - 0.5) * 30, y: (jr() - 0.5) * 20, z: -jr() * 30 + 4, parent: jel });
			const sz = 0.6 + jr() * 0.8;
			k.mesh(new k.THREE.SphereGeometry(sz, 14, 8, 0, PI * 2, 0, PI / 2), k.mat(0xff90d0, { opacity: 0.55, emissive: 0xc04090, glow: 0.8, flat: false, side: k.THREE.DoubleSide }), { parent: g, shadow: false });
			for (let t = 0; t < 6; t++) k.cyl(0.02, 0.01, 1.5 + jr() * 1.5, 0xffc0e8, { x: Math.cos(t) * sz * 0.5, y: -1.2, z: Math.sin(t) * sz * 0.5, parent: g, opacity: 0.6, emissive: 0x803060, shadow: false });
			g.userData.p = jr() * 6;
			jellies.push(g);
		}
		k.tick((t) => jellies.forEach((j) => {
			const p = Math.sin(t * 2 + j.userData.p);
			j.scale.set(1 + p * 0.08, 1 - p * 0.08, 1 + p * 0.08);
		}));
		k.point(0xff80d0, 30, 40, { y: 5, z: 2, parent: jel });
		k.mesh(new k.THREE.CylinderGeometry(0.8, 4, 40, 8, 1, true), rays, { x: 3, y: 10, z: -10, rz: 0.15, parent: jel, shadow: false });

		// ---- The anglerfish in the dark.
		const deep = k.group({ x: -400, from: 4, until: 4 });
		k.ground(80, 0x1a2a3a, { bump: 1, parent: deep });
		const ang = k.group({ x: 0, y: 4, z: -4, ry: 0.4, parent: deep });
		const ac = 0x3a4048;
		k.sphere(2.4, ac, { s: [1, 0.9, 1.1], parent: ang });
		const jaw = k.group({ y: -0.6, z: 1.6, rx: 0.45, parent: ang });
		k.sphere(1.9, 0x2a2e36, { s: [1.05, 0.5, 0.9], z: 0.5, parent: jaw });
		k.sphere(1.6, 0x0a0a10, { y: 0.2, z: 1.2, s: [1, 0.55, 0.6], parent: ang });
		for (let i = 0; i < 11; i++) {
			const a = -0.9 + i * 0.18;
			k.cone(0.07, 0.6 + (i % 3) * 0.25, 0xf0f0e8, { x: Math.sin(a) * 1.5, y: 0.75, z: 1.4 + Math.cos(a) * 0.9, rx: PI, parent: ang, seg: 4, emissive: 0x404040 });
			k.cone(0.07, 0.6 + ((i + 1) % 3) * 0.25, 0xf0f0e8, { x: Math.sin(a) * 1.5, y: -0.1, z: 1.4 + Math.cos(a) * 0.9, parent: ang, seg: 4, emissive: 0x404040 });
		}
		[-1, 1].forEach((s) => {
			k.sphere(0.32, 0xd8e0e0, { x: s * 1.2, y: 1.4, z: 1.2, parent: ang, emissive: 0x3a4a4a });
			k.sphere(0.12, 0x050505, { x: s * 1.3, y: 1.45, z: 1.45, parent: ang });
			k.box(0.1, 1.2, 1.0, ac, { x: s * 2.2, y: -0.4, z: -0.4, rz: s * 0.5, parent: ang });
		});
		k.box(0.1, 1.5, 1.2, ac, { z: -2.8, parent: ang });
		const stalk = new k.THREE.QuadraticBezierCurve3(new k.THREE.Vector3(0, 2.0, 0.6), new k.THREE.Vector3(0, 4.6, 1.4), new k.THREE.Vector3(0, 3.2, 3.6));
		k.mesh(new k.THREE.TubeGeometry(stalk, 16, 0.06, 6), k.mat(ac), { parent: ang });
		k.sphere(0.25, 0xe8fff8, { y: 3.1, z: 3.6, parent: ang, emissive: 0xc8fff0, glow: 2 });
		k.glow(0xa8fff0, 5, { y: 3.1, z: 3.6, parent: ang });
		k.point(0xa8fff0, 30, 16, { y: 3.0, z: 4.4, parent: ang });
		clown({ x: 0.8, y: 6.8, z: 2.6, ry: PI + 0.4, s: 0.5, parent: deep });
		dory({ x: -0.4, y: 7.0, z: 2.4, ry: PI - 0.3, s: 0.55, parent: deep });
		k.point(0x4a7ab0, 8, 40, { x: 4, y: 10, z: 8, parent: deep });

		// ---- The turtles in the current.
		const eac = k.group({ z: 400, from: 3, until: 3 });
		const turtle = (o) => {
			const g = k.group(o);
			k.sphere(1.2, 0x6a7a3a, { s: [1, 0.4, 1.25], parent: g, rough: 0.6 });
			k.sphere(1.1, 0xc8b878, { y: -0.12, s: [0.95, 0.25, 1.15], parent: g });
			for (let i = 0; i < 5; i++) k.cyl(0.32, 0.32, 0.05, 0x8a9a4a, { x: (i % 2 ? 0.4 : -0.4) * (i < 4 ? 1 : 0), y: 0.46, z: -0.6 + i * 0.3, parent: g, seg: 6 });
			k.sphere(0.4, 0x8a9a5a, { z: 1.6, y: 0.1, s: [0.9, 0.8, 1.2], parent: g });
			[-1, 1].forEach((s) => {
				k.sphere(0.07, 0x111111, { x: s * 0.25, y: 0.2, z: 1.8, parent: g });
				const fl = k.group({ x: s * 1.0, z: 0.6, parent: g });
				k.box(1.6, 0.08, 0.5, 0x8a9a5a, { x: s * 0.7, rz: s * -0.2, ry: s * 0.4, parent: fl });
				g.userData[s] = fl;
				k.box(0.5, 0.06, 0.3, 0x8a9a5a, { x: s * 0.8, z: -1.2, ry: s * 0.6, parent: g });
			});
			return g;
		};
		const tt = rng(12);
		const turtles = [];
		for (let i = 0; i < 9; i++) turtles.push(turtle({ x: (tt() - 0.5) * 16, y: (tt() - 0.5) * 8, z: -tt() * 30 - 6, ry: -PI / 2 + (tt() - 0.5) * 0.3, s: i === 0 ? 0.5 : 1 + tt() * 0.4, parent: eac }));
		turtles.push(turtle({ x: 0, y: 0, z: -2, ry: -PI / 2 + 0.3, s: 1.3, parent: eac }));
		turtles.push(turtle({ x: 2.5, y: 1.2, z: -3, ry: -PI / 2 + 0.2, s: 0.45, parent: eac }));
		k.tick((t) => turtles.forEach((g, i) => {
			const f = Math.sin(t * 1.6 + i);
			g.userData[1].rotation.z = f * 0.4;
			g.userData[-1].rotation.z = -f * 0.4;
		}));
		const streak = new k.THREE.MeshBasicMaterial({ color: 0xc8f0ff, transparent: true, opacity: 0.35, blending: k.THREE.AdditiveBlending, depthWrite: false });
		const streaks = [];
		for (let i = 0; i < 80; i++) streaks.push(k.box(6 + tt() * 6, 0.05, 0.05, streak, { x: (tt() - 0.5) * 60, y: (tt() - 0.5) * 14, z: -tt() * 40 + 5, parent: eac, shadow: false }));
		k.tick((t, dt) => streaks.forEach((s2) => (s2.position.x = ((s2.position.x + dt * 18 + 30) % 60) - 30)));

		// ---- The dentist's fish tank, with the harbour outside.
		const tank = k.group({ z: -400, from: 0, until: 1 });
		k.sky(0x4a9ae8, 0xe8f4ff, { r: 300, tag: "harbour", parent: tank });
		k.box(10, 0.4, 5, 0xc8b898, { y: 0.2, parent: tank });
		const tg = new k.THREE.MeshStandardMaterial({ color: 0xc8f0f0, transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false, side: k.THREE.DoubleSide });
		k.box(10, 6, 5, tg, { y: 3, parent: tank, shadow: false });
		k.box(10.2, 0.3, 5.2, 0x2a2a2a, { y: 6.1, parent: tank });
		k.box(10.2, 0.4, 5.2, 0x2a2a2a, { y: -0.1, parent: tank });
		k.cone(1.4, 2.2, 0x6a5a4a, { x: -3, y: 1.5, z: -1, parent: tank, seg: 8 });
		k.glow(0xffa040, 1, { x: -3, y: 2.6, z: -1, parent: tank });
		const tiki = k.group({ x: 2.8, y: 0.4, z: -1.2, parent: tank });
		k.box(1.0, 2.2, 0.9, 0x8a6a3a, { y: 1.1, parent: tiki });
		k.box(0.8, 0.25, 0.1, 0x2a1a0a, { y: 1.5, z: 0.46, parent: tiki });
		k.box(0.6, 0.3, 0.1, 0xf0f0e0, { y: 0.8, z: 0.46, parent: tiki });
		k.box(1.2, 0.5, 0.8, 0x8a5a2a, { x: 0.2, y: 0.65, z: 1.2, parent: tank });
		k.box(1.2, 0.3, 0.8, 0xd8a840, { x: 0.2, y: 1.0, z: 1.2, parent: tank, metal: 0.6 });
		for (let i = 0; i < 6; i++) k.box(0.15, 1.5 + i * 0.3, 0.15, 0x3aa04a, { x: -4.4 + i * 0.25, y: 1.2, z: 1.6, rz: (i - 3) * 0.1, parent: tank });
		const pb = rng(14);
		for (let i = 0; i < 70; i++) k.ico(0.08 + pb() * 0.08, [0x3a8ad0, 0xe86a8a, 0xf0d050, 0x6ad08a, 0xf0f0f0][i % 5], { x: (pb() - 0.5) * 9.4, y: 0.42, z: (pb() - 0.5) * 4.4, s: [1, 0.6, 1], parent: tank });
		[[1.6, -1.6], [3.9, 0.2], [-1.2, -1.8], [-2.0, 0.9]].forEach(([x, z], j) => {
			for (let i = 0; i < 5; i++) k.box(0.12, 1.2 + i * 0.25, 0.04, [0x3aa04a, 0x5ac05a][i % 2], { x: x + (i - 2) * 0.1, y: 0.4 + (0.6 + i * 0.12), z, rz: (i - 2) * 0.15, ry: j, parent: tank });
		});
		k.box(0.5, 0.3, 0.6, 0x8a5a2a, { x: 0.2, y: 1.2, z: 1.1, rx: -0.6, parent: tank });
		const gill = k.group({ x: -3.2, y: 3.6, z: 0.4, ry: -1.0, s: 1.4, parent: tank, from: 1 });
		k.sphere(0.5, 0xf0f0e8, { s: [0.3, 0.9, 1], parent: gill, flat: false });
		[0.2, -0.3].forEach((z) => k.box(0.32, 0.9, 0.2, 0x141414, { z, parent: gill }));
		k.box(0.32, 0.3, 0.15, 0xf2d020, { z: -0.6, parent: gill });
		k.box(0.04, 0.9, 0.3, 0xf0f0e8, { y: 0.9, z: 0, rx: -0.4, parent: gill });
		k.sphere(0.06, 0x111111, { x: 0.13, y: 0.2, z: 0.4, parent: gill });
		k.particles(80, 0xffffff, { z: -400, x: -3, y: 2.5, box: [0.4, 3.5, 0.4], speed: -0.0001, size: 0.08, opacity: 0.7, from: 0, until: 1 });
		k.box(30, 0.4, 14, 0xd8d0c0, { y: -0.5, z: 2, parent: tank });
		[-13, 13].forEach((x) => k.box(4, 20, 0.4, 0xe8e4d8, { x, y: 6, z: -14, parent: tank }));
		k.box(22, 5, 0.4, 0xe8e4d8, { y: 13.5, z: -14, parent: tank });
		k.box(22, 5, 0.4, 0xe8e4d8, { y: -1.5, z: -14, parent: tank });

		const win = k.group({ y: 6, z: -14, parent: tank });
		k.box(22, 0.5, 0.6, 0xf0f0f0, { y: 5, parent: win });
		k.box(22, 0.5, 0.6, 0xf0f0f0, { y: -5, parent: win });
		k.box(0.5, 10, 0.6, 0xf0f0f0, { x: 0, parent: win });
		const harbour = k.group({ y: -10, z: -80, parent: tank });
		k.water(400, 0x2a6ab0, { parent: harbour, amp: 0.2, seg: 30 });
		const shell = (x, z, h, ry, sc) => k.mesh(new k.THREE.SphereGeometry(h, 10, 6, 0, PI, 0, PI / 2), k.mat(0xf8f8f0, { side: k.THREE.DoubleSide, rough: 0.4 }), { x, y: 3, z, ry, rx: -0.3, s: [sc, 1.4, 0.5], parent: harbour });
		k.box(30, 3, 12, 0xd8b090, { x: -10, y: 1.5, z: -20, parent: harbour });
		[[-20, 0, 7], [-15, 0.5, 8], [-10, 1, 9], [-5, 0.5, 7]].forEach(([x, dz, h], i) => shell(x, -20 + dz, h, 0.2 + i * 0.05, 0.7));
		[[-14, -4, 6], [-9, -4, 7]].forEach(([x, dz, h]) => shell(x, -20 + dz, h, PI + 0.2, 0.7));
		const bridge = k.group({ x: 50, y: 0, z: -40, ry: -0.5, parent: harbour });
		k.torus(30, 1.2, 0x7a8088, { y: 0, arc: PI, parent: bridge, seg: 24, rseg: 4, s: [1, 0.8, 1] });
		k.box(64, 1, 5, 0x6a7078, { y: 10, parent: bridge });
		for (let i = 0; i < 9; i++) k.box(0.4, 10, 0.4, 0x6a7078, { x: -24 + i * 6, y: 10 + Math.sqrt(Math.max(0, 900 - (i * 6 - 24) ** 2)) * 0.4 - 4, parent: bridge });
		[-34, 34].forEach((x) => k.box(6, 16, 6, 0xd8c8a8, { x, y: 8, parent: bridge }));
		const sky8 = rng(8);
		for (let i = 0; i < 26; i++) {
			const h = 10 + sky8() * 30;
			k.box(6 + sky8() * 5, h, 6, [0xd8dce4, 0xb8c0cc, 0xe8e8e8][i % 3], { x: 10 + i * 5, y: h / 2, z: -80 - sky8() * 30, parent: harbour });
		}

		k.point(0xffffff, 10, 30, { y: 8, z: 4, parent: tank });
		return {
			shots: [
				{ pos: [0.6, 2.2, -396.4], look: [0.4, 1.3, -400.2], fov: 50, fog: [0x3a7a80, 6, 15], hide: ["sky", "harbour"], exposure: 1.15 },
				{ pos: [1.2, 3.3, -397.6], look: [-0.5, 4.0, -420], fov: 55, fog: [0xd8e8f0, 80, 300], hide: ["sky"] },
				{ pos: [403, 1, 10], look: [400, 0, -6], fov: 55, fog: [0x1a4a8a, 6, 50], exposure: 1.2 },
				{ pos: [3.5, 1.6, 405], look: [0, 0, 394], fov: 55, fog: [0x2a8ad0, 8, 60] },
				{ pos: [-397, 6.5, 8], look: [-400, 4.5, -2], fov: 55, fog: [0x061830, 6, 36], exposure: 1.4 },
				{ pos: [1.2, 3.6, 7], look: [0, 2.6, 0.5], fov: 45 },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the ghosts
	r27: (k) => {
		k.fog(0x2a2440, 60, 320);
		k.sky(0x14102a, 0x6a4a6a, { offset: -0.02 });
		k.light({ sky: 0xc8c0e8, ground: 0x3a2a2a, hemi: 1.3, sunColor: 0xd8d0ff, sunIntensity: 1.3, sunPos: [-30, 60, 40], shadowSize: 60 });
		const tan = 0xb8a47a;
		const buster = (o) => {
			const p = k.person({ pose: "point", colors: { shirt: tan, legs: tan, hair: o.hair ?? 0x3a2414, shoes: 0x2a2a2a }, sleeves: tan, ...o });
			k.box(0.42, 0.62, 0.3, 0x2a2a2e, { y: 1.25, z: -0.3, parent: p });
			k.cyl(0.12, 0.12, 0.4, 0x5a5a5a, { x: 0.14, y: 1.0, z: -0.42, parent: p });
			k.box(0.1, 0.1, 0.1, 0xd02020, { x: -0.12, y: 1.5, z: -0.46, parent: p, emissive: 0x600000 });
			k.box(0.08, 0.08, 0.55, 0x3a3a3a, { x: 0.36, y: 1.45, z: 0.45, parent: p });
			return p;
		};
		const stream = (from, to, color, parent) => {
			const n = 14;
			const segs = [];
			const mat = new k.THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: k.THREE.AdditiveBlending, depthWrite: false });
			const core = new k.THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: k.THREE.AdditiveBlending, depthWrite: false });
			const geo = new k.THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
			for (let i = 0; i < n; i++) {
				segs.push(k.mesh(geo, mat, { parent, shadow: false }));
				segs.push(k.mesh(geo, core, { parent, shadow: false }));
			}
			const A = new k.THREE.Vector3(...from);
			const B = new k.THREE.Vector3(...to);
			const up = new k.THREE.Vector3(0, 1, 0);
			const pts = [];
			k.tick((t) => {
				pts.length = 0;
				for (let i = 0; i <= n; i++) {
					const u = i / n;
					const p = A.clone().lerp(B, u);
					const j = Math.sin(u * PI) * 0.6;
					p.x += Math.sin(t * 23 + i * 2.1) * j;
					p.y += Math.cos(t * 19 + i * 1.7) * j;
					p.z += Math.sin(t * 17 + i * 2.9) * j;
					pts.push(p);
				}
				for (let i = 0; i < n; i++) {
					const a = pts[i];
					const b = pts[i + 1];
					const d = b.clone().sub(a);
					const len = d.length();
					[segs[i * 2], segs[i * 2 + 1]].forEach((m, c) => {
						m.position.copy(a).addScaledVector(d, 0.5);
						m.quaternion.setFromUnitVectors(up, d.normalize());
						m.scale.set(c ? 0.04 : 0.12, len, c ? 0.04 : 0.12);
					});
				}
			});
			k.glow(color, 2, { x: to[0], y: to[1], z: to[2], parent });
		};

		// ---- The hotel: the trap, and a hungry green ghost.
		const hotel = k.group({ x: 400, from: 2, until: 3 });
		const carpet = k.canvas(128, 128, (g) => {
			g.fillStyle = "#8a1a24";
			g.fillRect(0, 0, 128, 128);
			g.strokeStyle = "#c89a40";
			g.lineWidth = 3;
			for (let i = 0; i < 4; i++) {
				g.beginPath();
				g.arc(32 + (i % 2) * 64, 32 + Math.floor(i / 2) * 64, 20, 0, PI * 2);
				g.stroke();
			}
		});
		carpet.wrapS = carpet.wrapT = k.THREE.RepeatWrapping;
		carpet.repeat.set(3, 12);
		k.plane(6, 40, k.mat(0xffffff, { map: carpet }), { rx: -PI / 2, z: -10, parent: hotel });
		[-3, 3].forEach((x) => {
			k.box(0.2, 5, 40, 0xe8d8b0, { x, y: 2.5, z: -10, parent: hotel });
			k.box(0.25, 1.0, 40, 0x6a3a20, { x, y: 0.5, z: -10, parent: hotel });
			for (let i = 0; i < 5; i++) {
				k.box(0.1, 2.6, 1.3, 0x6a3a20, { x: x * 0.97, y: 1.3, z: -26 + i * 7, parent: hotel });
				k.glow(0xffd890, 0.7, { x: x * 0.93, y: 3.2, z: -22.5 + i * 7, parent: hotel });
			}
		});
		k.box(6, 0.2, 40, 0xf0e8d0, { y: 5, z: -10, parent: hotel });
		for (let i = 0; i < 3; i++) {
			k.sphere(0.5, 0xffe8a0, { y: 4.4, z: -24 + i * 9, parent: hotel, emissive: 0xffd080, glow: 0.8 });
			k.point(0xffe0a0, 8, 12, { y: 4, z: -24 + i * 9, parent: hotel });
		}
		const trap = k.group({ x: 0.4, y: 0, z: 2, ry: 0.3, parent: hotel });
		const hazard = k.canvas(128, 32, (g) => {
			g.fillStyle = "#f2c020";
			g.fillRect(0, 0, 128, 32);
			g.fillStyle = "#141414";
			for (let x = -32; x < 160; x += 24) {
				g.beginPath();
				g.moveTo(x, 32);
				g.lineTo(x + 12, 32);
				g.lineTo(x + 32, 0);
				g.lineTo(x + 20, 0);
				g.fill();
			}
		});
		k.box(1.0, 0.3, 0.55, 0x3a3a3e, { y: 0.15, parent: trap, metal: 0.6, rough: 0.4 });
		k.box(1.02, 0.08, 0.57, k.mat(0xffffff, { map: hazard }), { y: 0.2, parent: trap });
		[-1, 1].forEach((s) => k.box(0.95, 0.03, 0.26, 0x5a5a5e, { y: 0.32 + 0.22, z: s * 0.36, rx: s * 1.2, parent: trap, metal: 0.6 }));
		k.box(0.3, 0.08, 0.2, 0x2a2a2a, { x: 0.25, y: 0.32, z: 0, parent: trap });
		k.glow(0xff3020, 0.15, { x: -0.38, y: 0.3, z: 0.29, parent: trap });
		const tbeam = new k.THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.35, blending: k.THREE.AdditiveBlending, depthWrite: false });
		k.mesh(new k.THREE.CylinderGeometry(1.2, 0.45, 3.2, 12, 1, true), tbeam, { y: 1.9, s: [1, 1, 0.55], parent: trap, shadow: false });
		k.glow(0xfff0d0, 2.2, { y: 0.5, parent: trap });
		k.point(0xfff0d0, 8, 6, { y: 1, parent: trap });
		const cord = new k.THREE.CatmullRomCurve3([new k.THREE.Vector3(0.5, 0.1, 0), new k.THREE.Vector3(1.5, 0.03, 0.6), new k.THREE.Vector3(2.0, 0.03, 2.0), new k.THREE.Vector3(2.6, 0.03, 2.8)]);
		k.mesh(new k.THREE.TubeGeometry(cord, 20, 0.025, 5), k.mat(0x1a1a1a), { parent: trap });
		k.box(0.3, 0.08, 0.45, 0x3a3a3a, { x: 2.7, y: 0.04, z: 3.0, parent: trap });
		for (let i = 0; i < 5; i++) k.glow(0xd8d0e0, 0.6 + i * 0.25, { x: 0.4 + Math.sin(i * 2) * 0.2, y: 0.6 + i * 0.35, z: 2, parent: hotel, opacity: 0.15, fog: true, from: 2, until: 2 });

		const slimer = k.group({ x: 0, y: 2.4, z: -8, parent: hotel, from: 3 });
		const sg = k.mat(0x7af050, { opacity: 0.85, emissive: 0x3ab020, glow: 0.7, flat: false });
		k.sphere(0.9, sg, { s: [1.1, 1, 0.95], parent: slimer });
		k.sphere(0.5, sg, { y: -0.9, z: -0.3, s: [0.8, 1, 0.8], parent: slimer });
		k.cone(0.35, 1.0, sg, { y: -1.5, z: -0.5, rx: PI + 0.5, parent: slimer });
		k.sphere(0.55, 0x3a0a10, { y: -0.15, z: 0.55, s: [1.1, 0.75, 0.6], parent: slimer });
		for (let i = 0; i < 6; i++) k.box(0.1, 0.14, 0.06, 0xf0f0d8, { x: -0.3 + i * 0.12, y: 0.15, z: 0.82, parent: slimer });
		k.sphere(0.25, 0xd04060, { y: -0.35, z: 0.75, s: [1.2, 0.5, 1], parent: slimer });
		[-1, 1].forEach((s) => {
			k.sphere(0.16, 0xf0f8d0, { x: s * 0.28, y: 0.55, z: 0.72, parent: slimer });
			k.sphere(0.06, 0x111111, { x: s * 0.3, y: 0.55, z: 0.86, parent: slimer });
			k.capsule(0.12, 0.5, sg, { x: s * 0.95, y: -0.2, z: 0.3, rz: s * 0.9, parent: slimer });
		});
		k.glow(0x9aff70, 4, { parent: slimer, opacity: 0.5 });
		k.point(0x7aff50, 10, 10, { y: 0, z: 1.5, parent: slimer });
		k.tick((t) => {
			slimer.position.y = 2.4 + Math.sin(t * 1.4) * 0.2;
			slimer.rotation.y = Math.sin(t * 0.7) * 0.3;
		});
		const cart = k.group({ x: 1.6, z: -6.4, parent: hotel, from: 3 });
		k.box(1.4, 0.06, 0.9, 0xf8f8f8, { y: 1.0, parent: cart });
		k.box(1.4, 0.8, 0.9, 0xf4f0e8, { y: 0.6, parent: cart, opacity: 0.9 });
		for (let i = 0; i < 3; i++) {
			k.capsule(0.05, 0.25, 0xc04a2a, { x: -0.4 + i * 0.35, y: 1.1, rz: PI / 2, parent: cart });
			k.capsule(0.07, 0.2, 0xe0b070, { x: -0.4 + i * 0.35, y: 1.08, z: 0.02, rz: PI / 2, parent: cart });
		}

		// ---- The firehouse, and the car.
		const fire = k.group({ x: -400, from: 1, until: 4 });
		k.sky(0x5a8ad0, 0xe0e8f0, { r: 300, tag: "day", parent: fire });
		k.box(200, 0.2, 200, 0x5a5a5e, { y: -0.1, parent: fire });
		k.box(200, 0.3, 6, 0x9a9a98, { y: 0.15, z: -3, parent: fire });
		const brick = k.canvas(128, 128, (g) => {
			g.fillStyle = "#8a3a2a";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "#c8b8a0";
			for (let y = 0; y < 128; y += 8) {
				g.fillRect(0, y, 128, 1.5);
				for (let x = (y / 8) % 2 ? 0 : 8; x < 128; x += 16) g.fillRect(x, y, 1.5, 8);
			}
		});
		brick.wrapS = brick.wrapT = k.THREE.RepeatWrapping;
		brick.repeat.set(4, 4);
		const fh = k.group({ z: -14, parent: fire });
		k.box(16, 18, 10, k.mat(0xffffff, { map: brick }), { y: 9, parent: fh });
		k.box(16.6, 1, 10.6, 0xd8d0c0, { y: 18.4, parent: fh });
		k.box(16.4, 0.5, 10.4, 0xd8d0c0, { y: 6.6, parent: fh });
		k.box(10, 6, 0.2, 0x7a1a1a, { y: 3, z: 5.05, parent: fh });
		k.torus(5, 0.3, 0xd8d0c0, { y: 3, z: 5.1, arc: PI, s: [1, 0.6, 1], parent: fh });
		k.box(10, 3, 0.2, 0x7a1a1a, { y: 4.5, z: 5.04, s: [0.98, 1, 1], parent: fh });
		for (let i = 0; i < 4; i++) k.box(1.6, 1.0, 0.1, 0xb8d0e0, { x: -3.6 + i * 2.4, y: 4.2, z: 5.16, parent: fh });
		k.box(0.1, 6, 0.1, 0xd8d0c0, { y: 3, z: 5.16, parent: fh });
		[-7, 7].forEach((x) => k.box(1.2, 18, 0.4, 0xd8d0c0, { x, y: 9, z: 5.05, parent: fh }));
		for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
			k.box(1.6, 2.6, 0.1, 0x2a3a4a, { x: -4.8 + i * 3.2, y: 9.5 + r * 4.6, z: 5.06, parent: fh });
			k.box(2.0, 0.3, 0.3, 0xd8d0c0, { x: -4.8 + i * 3.2, y: 8.1 + r * 4.6, z: 5.15, parent: fh });
		}
		[-1, 1].forEach((s) => k.box(10, 22, 12, [0x6a5a50, 0x8a8478][s > 0 ? 1 : 0], { x: s * 13.2, y: 11, z: -15, parent: fire }));
		const ecto = k.group({ x: 2, y: 0, z: 1.6, ry: -PI / 2 + 0.25, parent: fire, from: 4 });
		const wht = 0xf4f2ec;
		const paint = { metal: 0.3, rough: 0.35 };
		k.box(2.2, 1.0, 6.6, wht, { y: 0.9, parent: ecto, ...paint });
		k.box(2.0, 1.1, 4.2, wht, { y: 1.95, z: -0.9, parent: ecto, ...paint });
		k.box(1.9, 0.7, 0.06, 0x2a3a4a, { y: 2.05, z: 1.21, rx: -0.3, parent: ecto, rough: 0.1 });
		[-1, 1].forEach((s) => {
			k.box(0.06, 0.6, 3.6, 0x2a3a4a, { x: s * 1.01, y: 2.1, z: -0.9, parent: ecto, rough: 0.1 });
			k.box(0.08, 0.25, 6.6, 0xc02020, { x: s * 1.1, y: 0.55, parent: ecto });
			k.box(0.4, 0.9, 1.6, 0xc02020, { x: s * 0.85, y: 1.6, z: -3.0, rx: -0.35, parent: ecto });
			[-2.2, 2.0].forEach((z) => {
				k.cyl(0.45, 0.45, 0.3, 0x111111, { x: s * 1.0, y: 0.45, z, rz: PI / 2, parent: ecto });
				k.cyl(0.28, 0.28, 0.31, 0xf4f4f4, { x: s * 1.0, y: 0.45, z, rz: PI / 2, parent: ecto });
			});
			k.glow(0xff2020, 0.8, { x: s * 0.55, y: 2.65, z: 0.9, parent: ecto });
			k.sphere(0.18, 0xfff0d0, { x: s * 0.7, y: 1.05, z: 3.3, parent: ecto, emissive: 0x806030 });
		});
		k.box(1.8, 0.4, 0.1, 0xd8d8d8, { y: 0.8, z: 3.32, parent: ecto, metal: 0.9, rough: 0.2 });
		k.box(1.4, 0.25, 0.4, 0xd02020, { y: 2.65, z: 0.9, parent: ecto, emissive: 0x800000 });
		k.box(1.8, 0.3, 2.6, 0xc8c8c8, { y: 2.65, z: -1.2, parent: ecto, metal: 0.7 });
		k.cyl(0.25, 0.25, 1.6, 0xd8d8d8, { x: -0.4, y: 3.0, z: -1.2, rx: PI / 2, parent: ecto, metal: 0.8 });
		k.box(0.6, 0.5, 0.6, 0x3a3a3a, { x: 0.5, y: 3.05, z: -0.6, parent: ecto });
		k.cyl(0.2, 0.3, 0.3, 0xd02020, { x: 0.5, y: 3.0, z: -1.9, parent: ecto, emissive: 0x600000 });
		k.box(0.1, 0.6, 0.1, 0x8a8a8a, { x: -0.7, y: 3.2, z: -2.2, parent: ecto });

		// ---- A library basement: the stacks, a card catalogue, a reading lamp.
		const lib = k.group({ z: 400, from: 0, until: 0 });
		k.box(20, 0.2, 20, 0x5a4a3a, { y: -0.1, parent: lib });
		const spines = k.canvas(256, 128, (g) => {
			g.fillStyle = "#2a1a10";
			g.fillRect(0, 0, 256, 128);
			const r = rng(12);
			let x = 0;
			while (x < 256) {
				const w = 6 + r() * 10;
				g.fillStyle = ["#6a2a20", "#2a3a5a", "#3a5a2a", "#8a6a3a", "#5a2a4a", "#c8b890"][Math.floor(r() * 6)];
				g.fillRect(x, 10 + r() * 14, w - 1, 118);
				g.fillStyle = "rgba(230,200,120,0.6)";
				g.fillRect(x + 1, 40, w - 3, 3);
				x += w;
			}
		});
		spines.wrapS = k.THREE.RepeatWrapping;
		spines.repeat.set(2, 1);
		[-1.8, 1.8].forEach((x) => {
			const shelf = k.group({ x, z: -1, parent: lib });
			k.box(0.9, 4.2, 8, 0x3a2416, { y: 2.1, parent: shelf });
			for (let i = 0; i < 5; i++) {
				k.box(0.92, 0.06, 8, 0x4a2c1a, { y: 0.2 + i * 0.85, parent: shelf });
				k.plane(8, 0.7, k.mat(0xffffff, { map: spines }), { x: -x * 0.26, y: 0.58 + i * 0.85, ry: (x < 0 ? 1 : -1) * PI / 2, parent: shelf });
			}
		});
		// The card catalogue, a drawer pulled out.
		const cat = k.group({ x: 0, z: -4.5, parent: lib });
		k.box(2.4, 1.6, 0.9, 0x6a4022, { y: 0.8, parent: cat });
		for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
			k.box(0.34, 0.3, 0.02, 0x7a4c2a, { x: -1.0 + c * 0.4, y: 0.25 + r * 0.38, z: 0.46, parent: cat });
			k.box(0.08, 0.03, 0.03, 0xc8a050, { x: -1.0 + c * 0.4, y: 0.25 + r * 0.38, z: 0.48, parent: cat, metal: 0.8 });
		}
		k.box(0.34, 0.26, 0.7, 0x7a4c2a, { x: 0.2, y: 1.01, z: 0.75, parent: cat });
		for (let i = 0; i < 10; i++) k.box(0.3, 0.22, 0.01, 0xf0e8d0, { x: 0.2, y: 1.06, z: 0.5 + i * 0.05, rx: -0.15, parent: cat });
		k.box(1.2, 0.05, 0.6, 0x5a3a20, { x: -0.6, y: 1.62, z: 0.1, parent: cat });
		k.cyl(0.1, 0.12, 0.05, 0x2a4a2a, { x: 0.8, y: 1.63, z: 0, parent: cat, metal: 0.4 });
		k.cyl(0.015, 0.015, 0.5, 0xc8a050, { x: 0.8, y: 1.85, z: 0, parent: cat, metal: 0.8 });
		k.cyl(0.05, 0.25, 0.18, 0x2a6a3a, { x: 0.8, y: 2.1, z: 0.12, rx: 0.4, parent: cat, emissive: 0x0a2a10 });
		k.point(0xffe0a0, 6, 6, { x: 0.8, y: 1.8, z: -4.0, parent: lib });
		[[-0.8, 0.0, 0x8a2a20], [-0.5, 0.15, 0x2a3a6a]].forEach(([x, z, c], i) => k.box(0.5, 0.08 + i * 0.02, 0.35, c, { x, y: 1.68 + i * 0.09, z: z - 4.4, ry: i * 0.3, parent: lib }));
		for (let i = 0; i < 7; i++) k.box(0.12, 0.003, 0.08, 0xf0e8d0, { x: -0.4 + i * 0.13, y: 0.01, z: -3.3 + (i % 3) * 0.2, ry: i, parent: lib });
		k.point(0xd8c8a0, 4, 12, { x: 0, y: 3.6, z: 0, parent: lib });

		// ---- The marshmallow man comes down the street.
		const nyc = k.group({ until: 5 });
		k.box(30, 0.2, 300, 0x3a3a40, { y: -0.1, z: -60, parent: nyc });
		[-1, 1].forEach((s) => k.box(5, 0.4, 300, 0x6a6a70, { x: s * 17.5, y: 0.1, z: -60, parent: nyc }));
		const br = rng(10);
		for (let i = 0; i < 16; i++) [-1, 1].forEach((s) => {
			const h = 30 + br() * 50;
			const z = 20 - i * 14;
			k.box(12, h, 13, [0x5a5464, 0x6a6474, 0x4a4454][i % 3], { x: s * 26, y: h / 2, z, parent: nyc });
			for (let w = 0; w < 6; w++) k.box(0.1, 1.2, 9, w % 2 ? 0xffd890 : 0x2a2a3a, { x: s * 19.95, y: 5 + w * 5, z, parent: nyc, emissive: w % 2 ? 0xffb050 : 0, glow: 0.6 });
		});
		const sp = k.group({ x: 2, y: 0, z: -70, ry: 0.15, parent: nyc, from: 5 });
		const mm = k.mat(0xfaf8f2, { flat: false, rough: 0.7, emissive: 0x3a3836, glow: 1 });
		[-1, 1].forEach((s) => {
			k.capsule(3.2, 6, mm, { x: s * 3.6, y: 6, parent: sp });
			k.capsule(2.4, 7, mm, { x: s * 8.8, y: 22, z: 1.5, rz: s * 0.5, rx: -0.4, parent: sp });
		});
		k.sphere(9, mm, { y: 15, s: [1, 0.9, 0.85], parent: sp });
		k.sphere(7.5, mm, { y: 24, s: [1, 0.8, 0.85], parent: sp });
		k.cyl(7, 7.8, 1.6, 0x3a6ad0, { y: 28.5, parent: sp, seg: 16 });
		k.cone(1.4, 2.4, 0xd02020, { y: 27.5, z: 6.8, rx: PI, parent: sp });
		[-1, 1].forEach((s) => k.cone(1.2, 2.4, 0xd02020, { x: s * 1.4, y: 28.4, z: 6.6, rz: s * PI / 2, parent: sp }));
		k.sphere(6, mm, { y: 34, parent: sp });
		k.cyl(4.4, 4.8, 3, 0xffffff, { y: 39.2, parent: sp, flat: false });
		k.torus(4.6, 0.45, 0xd02020, { y: 38.2, rx: PI / 2, parent: sp });
		k.cyl(5.6, 5.6, 0.6, 0xffffff, { y: 38.0, parent: sp });
		[-1, 1].forEach((s) => {
			k.sphere(0.9, 0x141414, { x: s * 2, y: 35, z: 5.2, s: [0.8, 1.1, 0.5], parent: sp });
			k.sphere(1.6, 0xf8c0b0, { x: s * 3.2, y: 32.4, z: 4.4, s: [1, 0.6, 0.4], parent: sp, opacity: 0.6 });
		});
		k.torus(2.2, 0.35, 0x8a2a20, { y: 32.6, z: 5.4, rx: 0.3, arc: PI, rz: PI, parent: sp });
		k.point(0xfff0e0, 40, 60, { x: 10, y: 30, z: -40, parent: nyc, from: 5 });
		k.point(0xff8040, 30, 50, { x: -10, y: 6, z: -40, parent: nyc, from: 5 });
		for (let i = 0; i < 4; i++) k.glow(0xff8a30, 6, { x: -12 + i * 7, y: 3, z: -50 - i * 6, parent: nyc, fog: true, from: 5 });
		for (let i = 0; i < 4; i++) {
			buster({ x: -4 + i * 1.6, y: 0, z: -18, ry: PI + 0.1, parent: nyc, from: 5 });
			stream([-4 + i * 1.6 + 0.3, 1.45, -18.9], [0, 22 + i * 2, -64], 0xff7a30, nyc);
		}
		k.particles(200, 0xffffff, { z: -40, box: [40, 40, 60], speed: 1, drift: 0.4, size: 0.12, opacity: 0.4, from: 5 });
		return {
			shots: [
				{ pos: [0.6, 1.9, 398.6], look: [0, 1.2, 395.5], fov: 50, fog: [0x1e1810, 6, 18], exposure: 1.25 },
				{ pos: [-394, 3, 22], look: [-400, 9, -14], fov: 50, fog: [0xd8d8e0, 80, 300], hide: ["sky"] },
				{ pos: [401.6, 1.3, 4.0], look: [400.3, 0.4, 2], fov: 45, fog: [0x2a1414, 6, 30], exposure: 1.3 },
				{ pos: [401.4, 1.8, 0], look: [400, 2.3, -8], fov: 55, fog: [0x2a1414, 8, 40], exposure: 1.3 },
				{ pos: [-394, 2.0, 7], look: [-398.5, 1.4, 1.4], fov: 50, fog: [0xd8d8e0, 80, 300], hide: ["sky"] },
				{ pos: [4, 2.4, -6], look: [2, 22, -70], fov: 60, exposure: 1.3 },
			],
		};
	},
};
