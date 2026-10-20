// Batch 03: reels r38–r47. Each builds one diorama and returns six shots, cryptic first and obvious last.
import { PI, rng, trees, city } from "../kit.js";

// ------------------------------------------------------------------------------------------------- local helpers

/** A thin rod between two points (cables, strings, wires, bars). Points are in the parent's space. */
function line(k, a, b, color, r = 0.03, o = {}) {
	const T = k.THREE;
	const A = new T.Vector3(...a);
	const B = new T.Vector3(...b);
	const m = k.cyl(r, r, A.distanceTo(B), color, { seg: 5, shadow: false, ...o });
	m.position.copy(A).add(B).multiplyScalar(0.5);
	m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
	return m;
}

function mtx(T, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
	return new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...r)), new T.Vector3(...s));
}

/** Bakes several transformed geometries into one, for instancing. */
function merge(T, parts) {
	const pos = [];
	for (const [g, m] of parts) {
		const n = g.index ? g.toNonIndexed() : g;
		n.applyMatrix4(m);
		pos.push(...n.attributes.position.array);
	}
	const out = new T.BufferGeometry();
	out.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
	out.computeVertexNormals();
	return out;
}

/** Many copies of one geometry. `list` holds [x, y, z, ry, scale, rx, rz]. */
function instanced(k, geo, color, list, o = {}) {
	const T = k.THREE;
	const mat = color?.isMaterial ? color : k.mat(color, o);
	const im = new T.InstancedMesh(geo, mat, list.length);
	const d = new T.Object3D();
	list.forEach(([x, y, z, ry = 0, s = 1, rx = 0, rz = 0], i) => {
		d.position.set(x, y, z);
		d.rotation.set(rx, ry, rz);
		d.scale.setScalar(s);
		d.updateMatrix();
		im.setMatrixAt(i, d.matrix);
	});
	im.instanceMatrix.needsUpdate = true;
	return k.place(im, o);
}

/** A small bird facing +z, about 0.4 tall. Flying birds get wings. */
function birdGeo(T, flying) {
	if (flying) {
		return merge(T, [
			[new T.SphereGeometry(1, 6, 4), mtx(T, [0, 0.2, 0], [0, 0, 0], [0.08, 0.07, 0.2])],
			[new T.SphereGeometry(0.06, 6, 4), mtx(T, [0, 0.23, 0.2])],
			[new T.BoxGeometry(0.32, 0.02, 0.16), mtx(T, [0.15, 0.25, 0.02], [0, 0, 0.4])],
			[new T.BoxGeometry(0.32, 0.02, 0.16), mtx(T, [-0.15, 0.25, 0.02], [0, 0, -0.4])],
			[new T.BoxGeometry(0.34, 0.02, 0.12), mtx(T, [0.44, 0.27, 0.0], [0, 0, -0.3])],
			[new T.BoxGeometry(0.34, 0.02, 0.12), mtx(T, [-0.44, 0.27, 0.0], [0, 0, 0.3])],
			[new T.BoxGeometry(0.1, 0.02, 0.1), mtx(T, [0, 0.2, -0.22])],
		]);
	}
	const parts = [
		[new T.SphereGeometry(1, 6, 4), mtx(T, [0, 0.18, 0], [0, 0, 0], [0.12, 0.11, 0.22])],
		[new T.SphereGeometry(0.075, 6, 4), mtx(T, [0, 0.3, 0.17])],
		[new T.ConeGeometry(0.025, 0.09, 4), mtx(T, [0, 0.29, 0.27], [PI / 2, 0, 0])],
		[new T.BoxGeometry(0.1, 0.02, 0.2), mtx(T, [0, 0.16, -0.26], [-0.25, 0, 0])],
	];
	{
		parts.push([new T.BoxGeometry(0.02, 0.1, 0.02), mtx(T, [0.04, 0.04, 0])]);
		parts.push([new T.BoxGeometry(0.02, 0.1, 0.02), mtx(T, [-0.04, 0.04, 0])]);
	}
	return merge(T, parts);
}

/** A triangular roof prism running along x, apex up, its base at o.y. */
function roof(k, len, w, h, color, o = {}) {
	return k.cyl(1, 1, len, color, { seg: 3, ...o, rz: PI / 2, rx: -PI / 2, y: (o.y ?? 0) + h / 3, s: [w / 1.732, 1, h / 1.5] });
}

/** A palm tree whose foot is at (x, y, z). */
function palm(k, x, y, z, h, o = {}) {
	const g = k.group({ x, y, z, ry: o.ry ?? 0, from: o.from, until: o.until, parent: o.parent });
	const lean = o.lean ?? 0.12;
	k.cyl(0.16, 0.28, h, o.trunk ?? 0x5a4630, { x: (-h / 2) * Math.sin(lean), y: h / 2, rz: lean, parent: g, seg: 6 });
	const top = k.group({ x: -h * Math.sin(lean), y: h * Math.cos(lean), parent: g });
	const L = h * 0.42;
	for (let i = 0; i < 8; i++) {
		const lg = k.group({ ry: (i * PI * 2) / 8 + 0.2, parent: top });
		const droop = 0.35 + (i % 2) * 0.25;
		k.box(0.55, 0.05, L, o.leaf ?? 0x2f5a26, { z: (L / 2) * Math.cos(droop), y: (-L / 2) * Math.sin(droop), rx: droop, parent: lg });
	}
	return g;
}

/** A Huey helicopter facing +z, skids at y = 0. */
function huey(k, o = {}, col = 0x3c4430) {
	const g = k.group(o);
	k.capsule(1.0, 2.4, col, { rx: PI / 2, y: 1.5, s: [0.9, 1, 1], parent: g });
	k.sphere(0.85, 0x1a2228, { y: 1.65, z: 1.7, s: [1, 0.8, 0.8], parent: g, rough: 0.3 });
	k.cyl(0.22, 0.45, 6, col, { rx: PI / 2, z: -4.4, y: 1.9, parent: g, seg: 8 });
	k.box(0.1, 1.4, 0.9, col, { z: -7.4, y: 2.5, rx: -0.3, parent: g });
	k.cyl(0.12, 0.15, 0.7, 0x222222, { y: 2.8, parent: g });
	const rotor = k.group({ y: 3.15, parent: g });
	[0, PI / 2].forEach((a) => k.box(13, 0.05, 0.35, 0x1a1a1a, { ry: a, parent: rotor, shadow: false }));
	const tail = k.group({ x: 0.2, y: 2.6, z: -7.4, parent: g });
	[0, PI / 2].forEach((a) => k.box(0.05, 1.8, 0.18, 0x1a1a1a, { rx: a, parent: tail, shadow: false }));
	[-0.9, 0.9].forEach((x) => {
		k.box(0.1, 0.1, 4.2, 0x2a2a2a, { x, y: 0.05, parent: g });
		[-0.9, 0.9].forEach((z) => k.box(0.08, 0.7, 0.08, 0x2a2a2a, { x: x * 0.85, y: 0.4, z, rz: x > 0 ? 0.25 : -0.25, parent: g }));
	});
	k.tick((t) => {
		rotor.rotation.y = t * 9;
		tail.rotation.x = t * 20;
	});
	return g;
}

/** A biplane facing +z. */
function biplane(k, o = {}, body = 0x3a3a3a, wing = 0x9a958a) {
	const g = k.group(o);
	k.box(0.9, 0.9, 5, body, { parent: g });
	k.cone(0.45, 1.6, body, { rx: -PI / 2, z: -3.2, parent: g, seg: 4, ry: PI / 4 });
	[0.85, -0.35].forEach((y) => k.box(9, 0.1, 1.4, wing, { y, z: 0.9, parent: g }));
	[-3, 3].forEach((x) => [0.5, 1.3].forEach((z) => k.box(0.06, 1.2, 0.06, 0x333333, { x, y: 0.25, z, parent: g })));
	k.box(3, 0.08, 0.9, wing, { z: -3.6, parent: g });
	k.box(0.08, 1.1, 0.9, wing, { y: 0.5, z: -3.6, parent: g });
	k.cyl(0.5, 0.5, 0.3, 0x222222, { rx: PI / 2, z: 2.6, parent: g });
	const prop = k.box(2.2, 0.15, 0.05, 0x1a1a1a, { z: 2.8, parent: g });
	k.tick((t) => (prop.rotation.z = t * 30));
	[-0.7, 0.7].forEach((x) => {
		k.box(0.06, 0.9, 0.06, 0x333333, { x, y: -0.8, z: 1.2, parent: g });
		k.cyl(0.3, 0.3, 0.15, 0x111111, { x, y: -1.25, z: 1.2, rz: PI / 2, parent: g });
	});
	k.person({ y: -0.5, z: -0.6, s: 0.6, pose: "sit", colors: { shirt: 0x4a3a2a, hair: 0x2a2018 }, parent: g });
	return g;
}

/** A camel facing +z, feet at y = 0, with an optional rider. */
function camel(k, o = {}, rider) {
	const c = o.color ?? 0xb8915a;
	const g = k.group(o);
	k.sphere(1, c, { y: 2.3, s: [0.75, 0.7, 1.35], parent: g });
	k.sphere(0.6, c, { y: 3.0, z: -0.1, s: [1, 0.9, 1.1], parent: g });
	k.cyl(0.22, 0.3, 1.6, c, { y: 2.9, z: 1.65, rx: 0.65, parent: g, seg: 6 });
	k.box(0.35, 0.35, 0.8, c, { y: 3.55, z: 2.25, parent: g });
	[-0.45, 0.45].forEach((x) => [-0.85, 0.85].forEach((z) => k.box(0.18, 2, 0.18, c, { x, y: 1, z, parent: g })));
	if (rider) k.person({ y: 2.2, z: 0.55, pose: "sit", s: 0.85, parent: g, ...rider });
	return g;
}

/** A blocky astronaut in a white suit. */
function astronaut(k, o = {}) {
	const p = k.person({ hair: false, ...o, colors: { shirt: 0xf2f0ea, legs: 0xf2f0ea, skin: 0xf2f0ea, shoes: 0x6a6a6a } });
	k.sphere(0.32, 0xf6f4ee, { y: 1.78, parent: p });
	k.sphere(0.24, 0x2a2010, { y: 1.78, z: 0.14, s: [1, 0.85, 0.6], parent: p, rough: 0.1, metal: 0.6, emissive: 0x6a4010, glow: 0.4 });
	k.box(0.5, 0.65, 0.3, 0xe6e4dc, { y: 1.25, z: -0.28, parent: p });
	[-0.34, 0.34].forEach((x) => k.box(0.18, 0.08, 0.18, 0xe86a1a, { x, y: 1.3, parent: p }));
	k.box(0.52, 0.06, 0.3, 0xe86a1a, { y: 0.9, parent: p });
	return p;
}

// ------------------------------------------------------------------------------------------------- the reels

export const REELS = {
	// ----------------------------------------------------------------------------------------------- the botanist
	r38: (k) => {
		k.fog(0xd8996a, 90, 520);
		k.sky(0xb0785a, 0xf2b88a, { offset: -0.02 });
		k.light({ sky: 0xffe2c8, ground: 0x7a3418, hemi: 1.3, sunColor: 0xfff0d8, sunIntensity: 2.4, sunPos: [-50, 45, 40], shadowSize: 70 });
		const ridge = (x, z) => 14 * Math.exp(-((x + 45) ** 2 + (z - 35) ** 2) / 500);
		const H = (x, z) => Math.sin(x * 0.06) * Math.cos(z * 0.05) * 1.2 + Math.sin(x * 0.02 + z * 0.03) * 2 + Math.max(0, Math.hypot(x, z) - 90) * 0.1 + ridge(x, z);
		k.ground(800, 0xb4552c, { bump: 0, seg: 110, height: H });
		const r = rng(38);
		for (let i = 0; i < 70; i++) {
			const x = (r() - 0.5) * 300;
			const z = (r() - 0.5) * 300;
			if (Math.hypot(x, z) < 30) continue;
			k.ico(0.4 + r() * 1.6, 0x7a3a22, { x, y: H(x, z), z, ry: r() * 6, s: [1, 0.6, 1] });
		}
		// Mesas on the horizon.
		for (let i = 0; i < 9; i++) {
			const a = -0.4 + i * 0.35;
			k.cyl(18 + (i % 3) * 8, 26 + (i % 3) * 8, 22 + (i % 4) * 6, 0x9a4626, { x: Math.sin(a) * 280, y: 8, z: -Math.cos(a) * 280, seg: 7 });
		}
		k.glow(0xfff4e0, 30, { x: -160, y: 60, z: 260, tag: "sky" });
		k.particles(600, 0xe8a070, { box: [120, 20, 120], speed: 0.6, size: 0.12, opacity: 0.35, drift: 2 });
		// The habitat: a long pressurised dome with airlocks and an antenna.
		const hy = H(0, 0);
		const hab = k.group({ x: 0, y: hy, z: 0, ry: 0.2 });
		k.capsule(4, 12, 0xeeece4, { rz: PI / 2, y: -0.6, s: [1, 0.8, 1], parent: hab, seg: 16 });
		for (let i = -2; i <= 2; i++) k.torus(3.95, 0.12, 0xc8c4b8, { x: i * 3, y: -0.6, ry: PI / 2, s: [1, 0.8, 1], parent: hab });
		[-1, 1].forEach((s) => {
			k.cyl(1.4, 1.4, 2.6, 0xd8d6ce, { x: s * 11.5, y: 1.2, rz: PI / 2, parent: hab });
			k.box(0.1, 1.6, 1.2, 0x5a5a60, { x: s * 12.85, y: 1.1, parent: hab });
		});
		k.cyl(0.08, 0.08, 4, 0x8a8a8a, { x: -4, y: 4.5, z: 1, parent: hab });
		k.cone(0.9, 0.4, 0xdedede, { x: -4, y: 6.6, z: 1, rx: PI, parent: hab });
		// Solar farm.
		for (let i = 0; i < 4; i++)
			for (let j = 0; j < 5; j++) {
				const x = 18 + j * 4;
				const z = -14 + i * 3.4;
				const y = H(x, z);
				k.box(0.12, 1.2, 0.12, 0x8a8a8a, { x, y: y + 0.6, z });
				k.box(3.4, 0.08, 2.4, 0x1c2c5a, { x, y: y + 1.3, z, rx: -0.4, metal: 0.5, rough: 0.3, emissive: 0x0a1a40, glow: 0.4 });
			}
		// The rover.
		const rover = (o) => {
			const g = k.group(o);
			k.box(2.8, 1.3, 5, 0xeeece4, { y: 1.5, parent: g });
			k.box(2.6, 0.7, 1.4, 0x2a3440, { y: 2.0, z: 2.0, parent: g, rough: 0.2, metal: 0.4 });
			k.box(2.9, 0.2, 5.1, 0xe86a1a, { y: 0.9, parent: g });
			[-1.6, 1.6].forEach((x) => [-1.7, 0, 1.7].forEach((z) => k.cyl(0.6, 0.6, 0.45, 0x2a2a2a, { x, y: 0.6, z, rz: PI / 2, parent: g })));
			k.cyl(0.05, 0.05, 1.4, 0x8a8a8a, { x: 0.8, y: 2.8, z: -1.5, parent: g });
			k.cone(0.5, 0.25, 0xdddddd, { x: 0.8, y: 3.5, z: -1.5, rx: PI, parent: g });
			return g;
		};
		rover({ x: 9, y: H(9, 12), z: 12, ry: -0.6 });
		// Out on the dunes: a rover laden with solar panels and its tracks.
		const far = rover({ x: 140, y: H(140, 60), z: 60, ry: -2.3, rz: 0.03, from: 4 });
		for (let i = 0; i < 3; i++) k.box(3.2, 0.08, 2.2, 0x1c2c5a, { y: 2.25 + i * 0.12, z: -0.8, parent: far, metal: 0.5, rough: 0.3, emissive: 0x0a1a40, glow: 0.4 });
		k.box(1.6, 1.0, 1.6, 0xd8d6ce, { y: 2.7, z: -2.6, parent: far });
		for (let i = 1; i < 40; i++) {
			const x = 140 + Math.sin(2.3) * i * 1.4;
			const z = 60 + Math.cos(2.3) * i * 1.4;
			[-1.6, 1.6].forEach((d) => {
				const tx = x + Math.cos(2.3) * d;
				const tz = z - Math.sin(2.3) * d;
				k.box(0.5, 0.06, 1.3, 0x7a3418, { x: tx, y: H(tx, tz) + 0.02, z: tz, ry: -2.3, shadow: false, from: 4 });
			});
		}
		// The old lander, dug out of the sand.
		const ly = H(-90, -60);
		const lander = k.group({ x: -90, y: ly, z: -60, ry: 0.5 });
		k.cyl(1.3, 1.3, 0.7, 0xb8a888, { y: 0.3, seg: 3, parent: lander });
		for (let i = 0; i < 3; i++) {
			const a = (i * PI * 2) / 3;
			const petal = k.group({ ry: a, parent: lander });
			k.cyl(1.25, 1.25, 0.08, 0xc8b898, { z: 1.6, y: 0.05, seg: 3, ry: PI, parent: petal });
			k.box(1.5, 0.04, 1.2, 0x2a3450, { z: 1.4, y: 0.11, parent: petal, metal: 0.4, rough: 0.3 });
		}
		k.cyl(0.05, 0.05, 1.2, 0x8a8a8a, { y: 1.2, parent: lander });
		k.box(0.35, 0.25, 0.2, 0xd8d0c0, { y: 1.85, parent: lander });
		for (let i = 0; i < 6; i++) k.ico(0.6, 0xe8dcc0, { x: Math.cos(i) * 2.8, y: 0.1, z: Math.sin(i) * 2.8, s: [1, 0.35, 1], parent: lander, rough: 1 });
		k.ico(2.2, 0xa64c28, { x: 3, y: -0.6, z: -2, s: [1, 0.5, 1], parent: lander });
		// The greenhouse inside the habitat.
		const g = k.group({ x: 300, y: 0, z: 0 });
		k.box(30, 0.2, 14, 0x9a9a98, { y: -0.1, parent: g });
		k.cyl(7, 7, 30, 0xf4f2ec, { rz: PI / 2, parent: g, open: true, side: 2, seg: 24 });
		k.box(0.2, 14, 14, 0xe8e6e0, { x: -15, parent: g });
		k.box(0.2, 14, 14, 0xe8e6e0, { x: 15, parent: g });
		const plants = [];
		[-3.2, 0, 3.2].forEach((z) => {
			k.box(26, 0.5, 1.8, 0x5a3420, { y: 0.25, z, parent: g, rough: 1 });
			for (let i = 0; i < 18; i++) plants.push([-12 + i * 1.4 + (z === 0 ? 0.6 : 0), 0.5, z + Math.sin(i * 3) * 0.3, i * 1.7, 1.6 + ((i * 7) % 5) * 0.2]);
		});
		const T = k.THREE;
		const leafGeo = merge(T, [
			[new T.CylinderGeometry(0.03, 0.04, 0.5, 4), mtx(T, [0, 0.25, 0])],
			[new T.IcosahedronGeometry(0.22, 0), mtx(T, [0.15, 0.45, 0], [0, 0, 0], [1, 0.4, 0.7])],
			[new T.IcosahedronGeometry(0.2, 0), mtx(T, [-0.14, 0.52, 0.06], [0, 0, 0], [1, 0.4, 0.7])],
			[new T.IcosahedronGeometry(0.18, 0), mtx(T, [0, 0.62, -0.12], [0, 0, 0], [0.7, 0.4, 1])],
		]);
		instanced(k, leafGeo, 0x4a8a3a, plants, { parent: g });
		for (let i = 0; i < 5; i++) {
			k.glow(0xfff0f8, 2, { x: -12 + i * 6, y: 5.2, parent: g });
			k.point(0xffe8f0, 10, 18, { x: -12 + i * 6, y: 5, parent: g });
		}
		k.box(1.4, 0.8, 1, 0xd8d6ce, { x: 8, y: 0.4, z: 5.5, parent: g });
		for (let i = 0; i < 9; i++) k.ico(0.16, 0xa0784a, { x: 7.6 + (i % 3) * 0.3, y: 0.9 + Math.floor(i / 3) * 0.12, z: 5.4 + (i % 2) * 0.2, parent: g, s: [1.3, 1, 1] });
		// The macro sprout at the front of the first bed.
		k.ico(0.16, 0x9a7048, { x: -11.2, y: 0.52, z: -2.55, s: [1.3, 0.9, 1], parent: g });
		k.cyl(0.015, 0.02, 0.25, 0x6aa04a, { x: -11.15, y: 0.65, z: -2.55, rz: 0.2, parent: g });
		k.ico(0.06, 0x6aaa4a, { x: -11.2, y: 0.79, z: -2.55, s: [1.4, 0.4, 0.8], parent: g });
		k.ico(0.05, 0x6aaa4a, { x: -11.1, y: 0.77, z: -2.52, s: [1.4, 0.4, 0.8], ry: 1.2, parent: g });
		// In orbit: the ship, over the red planet.
		const space = k.group({ y: 600 });
		k.stars(2200, { y: 600, upper: false, r: 600 });
		k.sphere(140, 0xc0602c, { x: 0, y: -170, z: -40, seg: 40, rings: 30, parent: space, rough: 1 });
		k.point(0xfff4e0, 3, 600, { x: -100, y: 80, z: 120, parent: space });
		const ship = k.group({ x: 0, y: 0, z: 0, ry: 0.5, parent: space });
		k.cyl(0.8, 0.8, 34, 0xd8d8dc, { rx: PI / 2, parent: ship });
		k.cyl(1.6, 1.6, 5, 0xe8e8ec, { rx: PI / 2, z: 15, parent: ship });
		k.sphere(1.6, 0xe8e8ec, { z: 17.5, parent: ship });
		const ring = k.group({ z: 8, parent: ship });
		k.torus(8, 0.9, 0xe8e8ec, { parent: ring, seg: 40 });
		for (let i = 0; i < 6; i++) k.box(0.5, 16, 0.5, 0xc8c8cc, { rz: (i * PI) / 6, parent: ring });
		k.tick((t) => (ring.rotation.z = t * 0.2));
		[-1, 1].forEach((s) => [-4, -10].forEach((z) => {
			k.box(16, 0.1, 4, 0x1c2c5a, { x: s * 9, z, parent: ship, metal: 0.5, rough: 0.3, emissive: 0x0a1a40, glow: 0.6 });
			k.box(2, 0.3, 0.3, 0xa8a8a8, { x: s * 1.6, z, parent: ship });
		}));
		for (let i = 0; i < 4; i++) {
			const a = (i * PI) / 2;
			k.cyl(0.9, 1.2, 3, 0x8a8a90, { x: Math.cos(a) * 1.4, y: Math.sin(a) * 1.4, z: -17.5, rx: PI / 2, parent: ship });
			k.glow(0x6ab0ff, 3, { x: Math.cos(a) * 1.4, y: Math.sin(a) * 1.4, z: -19.5, parent: ship });
		}
		// A quiet corner of the crew quarters: a bunk, a laptop, a roll of tape.
		const bunk = k.group({ x: -300, y: -300, z: 0 });
		k.box(14, 0.2, 10, 0x8a8a88, { y: -0.1, parent: bunk });
		k.cyl(6, 6, 14, 0xeceae2, { rz: PI / 2, y: 0.6, parent: bunk, open: true, side: 2, seg: 20 });
		[-7, 7].forEach((x) => k.box(0.2, 12, 12, 0xe2e0d8, { x, y: 0.6, parent: bunk }));
		k.box(2.4, 0.08, 1.2, 0xd8d6ce, { x: -1.4, y: 0.95, z: -1.6, parent: bunk });
		[[-2.5, -2.1], [-0.3, -2.1], [-2.5, -1.1], [-0.3, -1.1]].forEach(([x, z]) => k.box(0.06, 0.95, 0.06, 0x9a9a9a, { x, y: 0.47, z, parent: bunk, metal: 0.6 }));
		k.box(2.0, 0.08, 1.0, 0x7a8088, { x: -1.4, y: 1.03, z: -1.6, parent: bunk, metal: 0.3, rough: 0.5 });
		const lap = k.group({ x: -1.6, y: 1.07, z: -1.6, ry: 0.35, parent: bunk });
		k.box(0.62, 0.03, 0.42, 0x2a2a2e, { parent: lap });
		const screen = k.canvas(128, 96, (g) => {
			g.fillStyle = "#0e1a2a";
			g.fillRect(0, 0, 128, 96);
			g.fillStyle = "#8ad0ff";
			for (let i = 0; i < 9; i++) g.fillRect(8, 8 + i * 9, 30 + ((i * 37) % 80), 3);
		});
		k.box(0.62, 0.42, 0.02, 0x2a2a2e, { y: 0.21, z: -0.21, rx: -0.2, parent: lap });
		k.plane(0.56, 0.36, k.mat(0xffffff, { map: screen, emissive: 0x3a6a9a, glow: 0.5 }), { y: 0.21, z: -0.198, rx: -0.2, parent: lap });
		k.torus(0.09, 0.045, 0xb8bcc0, { x: -0.8, y: 1.1, z: -1.4, rx: PI / 2, parent: bunk, metal: 0.6, rough: 0.4 });
		k.cyl(0.06, 0.05, 0.14, 0xe86a1a, { x: -0.95, y: 1.14, z: -1.85, parent: bunk });
		k.box(0.3, 0.02, 0.4, 0xf0ece0, { x: -2.1, y: 1.08, z: -1.5, ry: 0.3, parent: bunk });
		k.box(2.6, 0.35, 1.3, 0x5a6470, { x: 2.2, y: 0.5, z: -1.8, parent: bunk });
		k.box(0.7, 0.18, 0.5, 0xe8e6de, { x: 1.3, y: 0.76, z: -1.9, parent: bunk });
		k.point(0xf0f4ff, 8, 14, { x: 0, y: 3, z: 1.5, parent: bunk });
		k.spot(0xfff4e8, 20, { x: -301.5, y: -297, z: 1, target: [-301.5, -299, -1.6], angle: 0.5 });
		// The botanist on the ridge.
		const ay = H(-7, 11);
		const man = astronaut(k, { x: -7, y: ay - 0.05, z: 11, ry: -0.5, from: 5 });
		man.userData.limbs.armR.rotation.z = 0.25;
		man.userData.limbs.armL.rotation.set(-0.5, 0, -0.2);
		return {
			shots: [
				{ pos: [-300.4, -298.1, 0.6], look: [-301.5, -298.8, -1.6], fov: 50, fog: [0x8a8e94, 4, 30] },
				{ pos: [-24, 595, 26], look: [0, 604, 2], fov: 45, fog: [0x000006, 900, 3000] },
				{ pos: [-86, ly + 2.8, -55], look: [-90, ly + 0.5, -60], fov: 45, hide: ["stars"] },
				{ pos: [313, 3.6, 5.5], look: [296, 1.0, -1], fov: 55, fog: [0xe8dce0, 4, 60] },
				{ pos: [146, H(146, 70) + 3, 70], look: [138, H(138, 58) + 1.2, 58], fov: 45, hide: ["stars"] },
				{ pos: [-10.5, ay + 1.9, 16.5], look: [-2, hy + 2.2, 2], fov: 50, hide: ["stars"] },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the tower and the lights
	r39: (k) => {
		k.fog(0x2a2848, 90, 560);
		k.sky(0x0a0e2a, 0x8a5a78, { offset: -0.04 });
		k.stars(1400);
		k.light({ sky: 0x9098d8, ground: 0x2a2418, hemi: 1.3, sunColor: 0xd8c8ff, sunIntensity: 1.2, sunPos: [60, 50, 80], shadowSize: 100, sunTarget: [0, 0, -100] });
		k.ground(1000, 0x34402a, { bump: 0.8, seg: 70 });
		const r = rng(39);
		// The butte: a fluted stone column on a wooded skirt.
		const tower = k.group({ x: 0, z: -190 });
		k.cone(72, 34, 0x4e5a3a, { y: 17, parent: tower, seg: 16 });
		k.cyl(17, 25, 64, 0xa88a70, { y: 52, parent: tower, seg: 18 });
		k.point(0xc8c0ff, 30, 320, { x: 60, y: 90, z: -90, decay: 0.6 });
		for (let i = 0; i < 30; i++) {
			const g = k.group({ ry: (i * PI * 2) / 30, parent: tower });
			k.box(2.4, 62, 1.6, i % 2 ? 0x9a7e66 : 0xb89c80, { z: 21, y: 52, rx: -0.13, parent: g });
		}
		k.cyl(17.4, 17.4, 1, 0x6a5a48, { y: 84, parent: tower, seg: 18 });
		const pine = merge(k.THREE, [
			[new k.THREE.CylinderGeometry(0.2, 0.3, 2, 5), mtx(k.THREE, [0, 1, 0])],
			[new k.THREE.ConeGeometry(1.8, 6, 6), mtx(k.THREE, [0, 4.5, 0])],
		]);
		const pines = [];
		for (let i = 0; i < 220; i++) {
			const a = r() * PI * 2;
			const d = 30 + r() * 70;
			const x = Math.cos(a) * d;
			const z = Math.sin(a) * d;
			if (z > 60 && Math.abs(x) < 30) continue;
			pines.push([x, Math.max(0, 34 * (1 - d / 72)) - 0.3, z, r() * 6, 0.7 + r() * 0.6]);
		}
		instanced(k, pine, 0x1e3424, pines, { parent: tower });
		// The landing site, its floodlights and the signal board.
		const site = k.group({ x: 0, z: -95, from: 4 });
		k.box(70, 0.3, 44, 0x8a8a7c, { y: 0.15, parent: site });
		[[-34, 21], [34, 21], [-34, -21], [34, -21]].forEach(([x, z]) => {
			k.box(0.5, 12, 0.5, 0x5a5a5a, { x, y: 6, z, parent: site });
			k.box(3, 1.2, 0.6, 0xf8f4e8, { x, y: 12.4, z, parent: site, emissive: 0xfff4d8, glow: 1.2 });
			k.glow(0xfff4d8, 8, { x, y: 12.4, z: z * 0.97, parent: site });
			k.spot(0xfff0d8, 60, { x, y: 12, z: z - 95, target: [0, 0, -95], angle: 0.7, distance: 90, from: 4 });
		});
		const board = k.group({ y: 0.3, z: 14, parent: site });
		k.box(16, 9, 0.6, 0x2a2a30, { y: 4.8, parent: board });
		const cols = [0xff4040, 0xffa030, 0xfff050, 0x40e060, 0x40a0ff, 0xc060ff];
		for (let i = 0; i < 6; i++)
			for (let j = 0; j < 4; j++) {
				const c = cols[(i + j * 2) % 6];
				k.box(2.2, 1.7, 0.2, c, { x: -6.25 + i * 2.5, y: 1.4 + j * 2.1, z: 0.35, parent: board, emissive: c, glow: 1.3 });
			}
		for (let i = 0; i < 4; i++) k.box(0.15, 11, 0.15, 0x8a8a8a, { x: -8 + i * 5.3, y: 5.5, z: -0.5, parent: board });
		k.point(0xffffff, 8, 30, { y: 6, z: 6, parent: board });
		for (let i = 0; i < 14; i++) k.person({ x: -20 + r() * 40, y: 0.3, z: -10 + r() * 22, ry: PI + (r() - 0.5), s: 0.95, colors: { shirt: i % 3 ? 0xe8e8e0 : 0xd84030, legs: i % 3 ? 0xe8e8e0 : 0xd84030, hair: 0x2a2018 }, parent: site });
		[[-26, 8], [24, 6]].forEach(([x, z]) => {
			k.box(3, 3, 7, 0xe8e4d8, { x, y: 1.8, z, parent: site });
			k.box(3, 1.8, 2, 0xe8e4d8, { x, y: 1.2, z: z + 4.5, parent: site });
		});
		// Little craft, buzzing about.
		const scouts = [0xff5030, 0xffa040, 0xfff0e0, 0x60c0ff].map((c, i) => {
			const g = k.group({ from: 3 });
			k.cone(1.1, 0.7, 0x2a2a30, { parent: g, seg: 8 });
			k.glow(c, 4, { y: -0.3, parent: g });
			k.glow(0xffffff, 1.5, { y: -0.4, parent: g });
			return g;
		});
		k.tick((t) => scouts.forEach((g, i) => {
			if (i < 3) g.position.set(272 + i * 9 + Math.sin(t + i) * 1.5, 7 + i * 1.2 + Math.sin(t * 2 + i) * 0.4, 258 - i * 2);
			else g.position.set(Math.sin(t * 0.5) * 14, 22 + Math.sin(t) * 2, -110);
		}));
		[1, 2].forEach((i) => {
			const g = k.group({ from: 4 });
			k.cone(1.1, 0.7, 0x2a2a30, { parent: g, seg: 8 });
			k.glow([0xff5030, 0x60c0ff][i - 1], 4, { y: -0.3, parent: g });
			k.tick((t) => g.position.set(Math.sin(t * 0.6 + i * 2) * 18, 18 + i * 4, -115 + Math.cos(t * 0.6 + i) * 6));
		});
		// The mothership.
		const mother = k.group({ x: 0, y: 52, z: -150, from: 5 });
		k.cyl(44, 30, 8, 0x2a2a38, { y: 6, parent: mother, seg: 36 });
		k.cyl(30, 46, 4, 0x3a3a4a, { y: 0, parent: mother, seg: 36 });
		k.cyl(46, 34, 4, 0xfff0e0, { y: -4, parent: mother, seg: 36, emissive: 0xffe8c8, glow: 1.4 });
		k.sphere(22, 0xffffff, { y: -6, s: [1, 0.35, 1], parent: mother, emissive: 0xfff4e0, glow: 2 });
		for (let i = 0; i < 26; i++) {
			const a = r() * PI * 2;
			const d = r() * 26;
			const h = 4 + r() * 14;
			k.box(1 + r() * 2, h, 1 + r() * 2, 0x3a3a48, { x: Math.cos(a) * d, y: 10 + h / 2, z: Math.sin(a) * d, parent: mother });
			if (r() > 0.5) k.glow(cols[i % 6], 3, { x: Math.cos(a) * d, y: 10 + h, z: Math.sin(a) * d, parent: mother });
		}
		const rim = [];
		for (let i = 0; i < 48; i++) {
			const a = (i / 48) * PI * 2;
			rim.push(k.glow([0xff4040, 0xffb040, 0x60b0ff, 0xffffff, 0x60ff90][i % 5], 7, { x: Math.cos(a) * 45, y: -1, z: Math.sin(a) * 45, parent: mother }));
		}
		k.tick((t) => rim.forEach((g, i) => (g.material.opacity = 0.5 + 0.5 * Math.sin(t * 3 + i * 0.7))));
		k.glow(0xfff0e0, 160, { y: -8, parent: mother, opacity: 0.55 });
		k.point(0xfff0e0, 40, 260, { y: -20, parent: mother, decay: 0.8 });
		// A plate of mashed potatoes, sculpted.
		const plate = k.group({ x: 0, y: -300, z: 0 });
		k.box(8, 0.2, 5, 0x6a4428, { y: 0.9, parent: plate });
		k.box(30, 12, 0.2, 0x8a7a5a, { y: 5, z: -3, parent: plate });
		k.cyl(0.95, 0.8, 0.06, 0xf4f2ea, { y: 1.03, parent: plate, seg: 28 });
		k.cyl(0.78, 0.78, 0.02, 0x8a5a2a, { y: 1.065, parent: plate, seg: 28, rough: 0.3 });
		k.cyl(0.55, 0.72, 0.16, 0xf0e4c0, { y: 1.14, parent: plate, seg: 10 });
		k.cyl(0.3, 0.46, 0.52, 0xf0e4c0, { y: 1.48, parent: plate, seg: 11 });
		k.cyl(0.31, 0.31, 0.03, 0xe8dcb4, { y: 1.75, parent: plate, seg: 11 });
		for (let i = 0; i < 11; i++) k.box(0.05, 0.5, 0.05, 0xe0d4ac, { x: Math.cos(i * 0.571) * 0.38, y: 1.48, z: Math.sin(i * 0.571) * 0.38, ry: -i * 0.571, rz: 0.27 * Math.cos(i * 0.571), rx: -0.27 * Math.sin(i * 0.571), parent: plate });
		for (let i = 0; i < 9; i++) k.sphere(0.04, 0x5a9a3a, { x: 0.55 + (i % 3) * 0.08, y: 1.1, z: 0.2 + Math.floor(i / 3) * 0.08, parent: plate });
		k.box(0.06, 0.02, 0.9, 0xc8c8cc, { x: -0.7, y: 1.1, z: 0.4, ry: 0.5, parent: plate, metal: 0.8, rough: 0.3 });
		k.point(0xffd8a0, 4, 10, { x: 1, y: 3, z: 1.5, parent: plate });
		k.spot(0xfff0d0, 20, { x: -300, y: -295, z: 3, target: [0, -298.5, 0], angle: 0.4 });
		// A lonely road, a crossing, a truck in a beam from above.
		const road = k.group({ x: 250, z: 260 });
		k.box(300, 0.1, 8, 0x26262a, { y: 0.05, parent: road });
		for (let i = 0; i < 30; i++) k.box(3, 0.02, 0.2, 0xd8b030, { x: -140 + i * 10, y: 0.11, parent: road });
		[-0.75, 0.75].forEach((dx) => k.box(0.12, 0.15, 60, 0x6a6a6a, { x: 22 + dx, y: 0.15, parent: road, metal: 0.7 }));
		for (let i = 0; i < 20; i++) k.box(2.4, 0.1, 0.3, 0x3a2a1a, { x: 22, y: 0.08, z: -28 + i * 3, parent: road });
		k.cyl(0.08, 0.08, 4, 0xe8e8e8, { x: 19, y: 2, z: 5, parent: road });
		[-0.6, 0.6].forEach((a) => k.box(2.2, 0.35, 0.05, 0xf0f0f0, { x: 19, y: 3.4, z: 5.05, rz: a, parent: road }));
		const truck = k.group({ x: -4, y: 0, z: 1.8, ry: PI / 2, parent: road });
		k.box(2.2, 1.8, 2.2, 0xe8e4d8, { y: 1.5, z: 2.6, parent: truck });
		k.box(2.0, 0.7, 0.1, 0x1a2a3a, { y: 1.9, z: 3.71, parent: truck, rough: 0.2 });
		k.box(2.3, 1.5, 4.2, 0xe8a030, { y: 1.3, z: -0.8, parent: truck });
		k.box(0.3, 0.2, 4, 0x8a8a8a, { x: 0.6, y: 2.2, z: -0.8, parent: truck });
		[-1, 1].forEach((x) => [2.6, -1.8].forEach((z) => k.cyl(0.45, 0.45, 0.3, 0x111111, { x: x * 1.05, y: 0.45, z, rz: PI / 2, parent: truck })));
		[-0.7, 0.7].forEach((x) => k.glow(0xfff4d0, 1.2, { x, y: 1.1, z: 3.75, parent: truck }));
		k.spot(0xf8f4ff, 120, { x: 246, y: 40, z: 261.8, target: [246, 0, 261.8], angle: 0.13, penumbra: 0.4, distance: 70, from: 2 });
		k.glow(0xffffff, 14, { x: 246, y: 26, z: 261.8, from: 2 });
		k.mesh(new k.THREE.CylinderGeometry(0.6, 4.5, 26, 16, 1, true), new k.THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.13, depthWrite: false, blending: k.THREE.AdditiveBlending }), { x: 246, y: 13, z: 261.8, shadow: false, from: 2 });
		k.point(0x8a9ad8, 4, 60, { x: 240, y: 10, z: 270, from: 2 });
		k.point(0x9aa8e0, 5, 30, { x: 264, y: 6, z: 272, until: 1 });
		// A kitchen table late at night: a road map, a thermos, a flashlight, keys.
		const desk = k.group({ x: 300, y: -300, z: 0 });
		const oak = k.canvas(128, 128, (g) => {
			g.fillStyle = "#7a5636";
			g.fillRect(0, 0, 128, 128);
			for (let i = 0; i < 10; i++) {
				g.fillStyle = i % 2 ? "#6c4a2e" : "#86603e";
				g.fillRect(0, i * 13, 128, 12);
			}
		});
		k.box(4, 0.1, 3, k.mat(0xffffff, { map: oak }), { y: 1, parent: desk });
		k.box(14, 0.2, 14, 0x3a3028, { y: -0.1, parent: desk });
		k.box(14, 8, 0.2, 0xb8a888, { y: 4, z: -3, parent: desk });
		const map = k.canvas(128, 96, (g) => {
			g.fillStyle = "#ece2c4";
			g.fillRect(0, 0, 128, 96);
			g.strokeStyle = "#c86a3a";
			g.lineWidth = 2;
			for (let i = 0; i < 6; i++) {
				g.beginPath();
				g.moveTo(0, 10 + i * 16);
				g.bezierCurveTo(40, i * 20, 80, 90 - i * 10, 128, 20 + i * 12);
				g.stroke();
			}
			g.strokeStyle = "#6a8ac8";
			g.beginPath();
			g.moveTo(20, 96);
			g.bezierCurveTo(30, 60, 70, 50, 90, 0);
			g.stroke();
			g.strokeStyle = "rgba(0,0,0,0.25)";
			[32, 64, 96].forEach((x) => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 96); g.stroke(); });
			g.beginPath(); g.moveTo(0, 48); g.lineTo(128, 48); g.stroke();
		});
		k.box(1.6, 0.01, 1.2, k.mat(0xffffff, { map }), { x: -0.1, y: 1.056, z: 0.1, ry: 0.12, parent: desk });
		k.cyl(0.11, 0.11, 0.5, 0x3a5a4a, { x: -0.95, y: 1.3, z: -0.45, parent: desk, metal: 0.4, rough: 0.4 });
		k.cyl(0.12, 0.12, 0.12, 0x9a9a9a, { x: -0.95, y: 1.6, z: -0.45, parent: desk, metal: 0.8, rough: 0.3 });
		k.cyl(0.1, 0.09, 0.14, 0xe8e4dc, { x: -0.6, y: 1.12, z: 0.65, parent: desk });
		k.cyl(0.085, 0.085, 0.01, 0x3a2414, { x: -0.6, y: 1.185, z: 0.65, parent: desk });
		const torch = k.group({ x: 0.75, y: 1.1, z: 0.55, ry: 0.7, parent: desk });
		k.cyl(0.05, 0.05, 0.5, 0x2a2a2a, { rz: PI / 2, parent: torch, metal: 0.6, rough: 0.4 });
		k.cyl(0.08, 0.05, 0.12, 0xb8b8b8, { x: 0.3, rz: PI / 2, parent: torch, metal: 0.8, rough: 0.2 });
		[0, 0.08].forEach((d) => k.torus(0.035, 0.008, 0xc8b060, { x: 0.35 + d, y: 1.06, z: -0.4 + d, rx: PI / 2, parent: desk, metal: 0.9, seg: 12 }));
		k.box(0.05, 0.012, 0.16, 0xc8b060, { x: 0.47, y: 1.06, z: -0.28, ry: 0.5, parent: desk, metal: 0.9 });
		k.box(0.04, 0.012, 0.14, 0xa8a8a8, { x: 0.36, y: 1.06, z: -0.25, ry: -0.3, parent: desk, metal: 0.9 });
		k.point(0xffe0b0, 6, 10, { x: 0.5, y: 3, z: 1.5, parent: desk });
		k.spot(0xfff0d0, 22, { x: 300.5, y: -296, z: 1, target: [300, -298.9, 0], angle: 0.45 });
		return {
			shots: [
				{ pos: [300.3, -297.6, 1.6], look: [300, -298.9, 0.1], fov: 45, fog: [0x2a2018, 3, 20] },
				{ pos: [266.5, 1.6, 272], look: [269.2, 2.6, 265], fov: 34, fog: [0x10131c, 4, 40], hide: ["sky", "stars"] },
				{ pos: [236, 2.6, 270], look: [246, 3, 261], fov: 50, fog: [0x0a0e1e, 5, 120], hide: [] },
				{ pos: [0.9, -298.2, 1.8], look: [0, -298.55, 0], fov: 40, fog: [0x2a1c14, 2, 25] },
				{ pos: [30, 7, -52], look: [0, 10, -110], fov: 55 },
				{ pos: [0, 3, -40], look: [0, 42, -140], fov: 60 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the river
	r40: (k) => {
		k.fog(0xd88a50, 70, 420);
		k.sky(0x4a3a5a, 0xf2a050, { offset: -0.03 });
		k.light({ sky: 0xffd0a0, ground: 0x3a3020, hemi: 1.3, sunColor: 0xffb070, sunIntensity: 2.2, sunPos: [-60, 30, -60], shadowSize: 80 });
		const H = (x, z) => {
			const d = Math.abs(z);
			if (d < 16) return -3;
			if (d < 24) return -3 + (d - 16) * 0.55;
			return 1.4 + Math.sin(x * 0.08) * Math.cos(z * 0.07) * 0.6;
		};
		k.ground(900, 0x3a4a22, { bump: 0, seg: 150, height: H });
		k.water(900, 0x6a5a38, { y: 0, seg: 70, amp: 0.12 });
		const r = rng(40);
		const bush = merge(k.THREE, [[new k.THREE.IcosahedronGeometry(2, 0), mtx(k.THREE, [0, 1, 0], [0, 0, 0], [1, 0.7, 1])]]);
		const bushes = [];
		for (let i = 0; i < 260; i++) {
			const x = (r() - 0.5) * 420;
			const z = (r() > 0.5 ? 1 : -1) * (24 + r() * 90);
			bushes.push([x, H(x, z), z, r() * 6, 0.8 + r() * 1.2]);
		}
		instanced(k, bush, 0x2a4a1c, bushes);
		for (let i = 0; i < 80; i++) {
			const x = (r() - 0.5) * 400;
			const z = (r() > 0.5 ? 1 : -1) * (25 + r() * 70);
			if (x > 50 && x < 160 && z < -35 && z > -75) continue;
			palm(k, x, H(x, z) - 0.2, z, 9 + r() * 7, { ry: r() * 6, lean: 0.05 + r() * 0.25 });
		}
		// The patrol boat.
		const pbr = (o) => {
			const boat = k.group(o);
			k.box(2.6, 1.0, 7, 0x5a6458, { y: 0.2, parent: boat });
			k.cyl(1.5, 1.5, 1.0, 0x5a6458, { y: 0.2, z: 4.25, seg: 3, s: [0.87, 1, 1], parent: boat });
			k.box(2.62, 0.12, 9.5, 0x3a4038, { y: 0.75, z: 0.6, parent: boat });
			k.box(1.6, 1.2, 2, 0x6a7466, { y: 1.3, z: 0.6, parent: boat });
			k.box(1.7, 0.08, 4.6, 0x4a5a3a, { y: 2.3, z: -1.0, parent: boat });
			[-0.8, 0.8].forEach((x) => [-3, 1].forEach((z) => k.box(0.06, 1.5, 0.06, 0x2a2a2a, { x, y: 1.55, z, parent: boat })));
			k.cyl(0.5, 0.55, 0.6, 0x4a5246, { y: 1.1, z: 3.3, parent: boat });
			[-0.12, 0.12].forEach((x) => k.cyl(0.05, 0.05, 1.4, 0x1a1a1a, { x, y: 1.4, z: 4.0, rx: PI / 2 - 0.1, parent: boat }));
			k.cyl(0.05, 0.05, 2.2, 0x2a2a2a, { y: 2.6, z: 0.2, parent: boat });
			k.box(0.8, 0.1, 0.3, 0x2a2a2a, { y: 3.6, z: 0.2, parent: boat });
			k.person({ x: 0.5, y: 0.8, z: -2, ry: 0.4, colors: { shirt: 0x4a5434, legs: 0x3a4430, hair: 0x2a1a10 }, parent: boat });
			k.person({ x: -0.6, y: 0.8, z: -3, ry: -0.3, colors: { shirt: 0x6a6a4a, legs: 0x3a4430, skin: 0x6a4a30, hair: 0x111111 }, parent: boat });
			return boat;
		};
		const boat = pbr({ x: 0, y: 0, z: 0, ry: PI / 2 });
		k.tick((t) => {
			boat.position.y = Math.sin(t * 1.4) * 0.08;
			boat.rotation.z = Math.sin(t) * 0.02;
		});
		// The tree line, burning.
		const napalm = k.group({ from: 4 });
		for (let i = 0; i < 26; i++) {
			const x = 60 + i * 4 + r() * 2;
			const z = -42 - r() * 10;
			palm(k, x, H(x, z) - 0.2, z, 10 + r() * 6, { ry: r() * 6, leaf: 0x1a2a10, parent: napalm });
		}
		for (let i = 0; i < 40; i++) {
			const x = 58 + r() * 104;
			const z = -40 - r() * 30;
			const s = 3 + r() * 6;
			k.ico(s, i % 3 ? 0xff7a1a : 0xffc040, { x, y: 2 + r() * 8, z, parent: napalm, emissive: i % 3 ? 0xff5a00 : 0xffa020, glow: 1.6, shadow: false });
		}
		for (let i = 0; i < 30; i++) k.ico(6 + r() * 8, 0x2a2018, { x: 60 + r() * 100, y: 18 + r() * 25, z: -50 - r() * 30, parent: napalm, rough: 1 });
		for (let i = 0; i < 6; i++) k.glow(0xff8a20, 50, { x: 70 + i * 18, y: 8, z: -50, parent: napalm, opacity: 0.6, fog: true });
		k.point(0xff7a20, 40, 160, { x: 110, y: 10, z: -30, from: 4, decay: 0.8 });
		// The helicopters.
		const flight = [];
		for (let i = 0; i < 7; i++) flight.push(huey(k, { x: -95 - (i % 3) * 14 - Math.floor(i / 3) * 6, y: 12 + (i % 3) * 3 + Math.floor(i / 3) * 2, z: -14 + i * 4.5, ry: PI / 2, rz: 0, rx: 0.08, from: 5 }));
		k.tick((t) => flight.forEach((h, i) => (h.position.y += Math.sin(t * 1.3 + i) * 0.004)));
		k.disc(0xffd070, 160, { x: -520, y: 40, z: 10, from: 5 });
		k.glow(0xffa040, 420, { x: -500, y: 40, z: 10, from: 5 });
		// The compound upriver: a stepped temple and its stone face.
		const temple = k.group({ x: 0, y: -300, z: 0 });
		k.ground(200, 0x3a3a24, { parent: temple, bump: 0.6, seg: 20 });
		[[32, 3], [26, 3], [20, 3], [14, 3], [9, 4]].reduce((y, [w, h]) => {
			k.box(w, h, w * 0.8, 0x7a705a, { y: y + h / 2, z: -20, parent: temple, rough: 1 });
			return y + h;
		}, 0);
		for (let i = 0; i < 12; i++) k.box(5, i + 1, 1.05, 0x6a6250, { y: (i + 1) / 2, z: -4.5 - i, parent: temple, rough: 1 });
		k.box(2.5, 3.2, 0.2, 0x0a0806, { y: 13.6, z: -16.3, parent: temple });
		k.person({ y: 12, z: -16.6, hair: false, colors: { shirt: 0x1a1a14, legs: 0x1a1a14, skin: 0x8a6a50 }, parent: temple });
		const face = k.group({ x: -26, y: 0, z: -8, ry: 0.5, parent: temple });
		k.box(7, 9, 6, 0x6a6650, { y: 4.5, parent: face, rough: 1 });
		k.box(7.4, 0.9, 1, 0x5a5644, { y: 6.6, z: 3, parent: face });
		k.box(1.4, 2.6, 1.4, 0x7a7460, { y: 4.8, z: 3.3, rx: -0.2, parent: face });
		k.box(3.4, 0.8, 0.8, 0x5a5644, { y: 2.4, z: 3.1, parent: face });
		[-1.6, 1.6].forEach((x) => k.box(1.6, 0.6, 0.6, 0x2a2820, { x, y: 5.9, z: 3.0, parent: face }));
		for (let i = 0; i < 6; i++) {
			const x = i < 3 ? -7 - i * 3 : 7 + (i - 3) * 3;
			const z = 2 + (i % 3) * 3;
			k.cyl(0.12, 0.12, 2.6, 0x3a2414, { x, y: 1.3, z, parent: temple });
			k.glow(0xff9a30, 3, { x, y: 2.8, z, parent: temple });
			k.point(0xff8a30, 10, 24, { x, y: 3.2, z, parent: temple });
		}
		// Kurtz's compound: Khmer towers, the river landing, the boat, the painted army, the hanged.
		[[-11, -28.5], [11, -28.5], [-11, -11.5], [11, -11.5]].forEach(([x, z]) => {
			k.box(3.2, 3, 3.2, 0x6a6250, { x, y: 7.5, z, parent: temple, rough: 1 });
			for (let i = 0; i < 4; i++) k.cyl(1.4 - i * 0.3, 1.6 - i * 0.3, 1.4, 0x726a56, { x, y: 9.7 + i * 1.3, z, seg: 8, parent: temple, rough: 1 });
			k.cone(0.4, 1.6, 0x6a6250, { x, y: 15.3, z, seg: 8, parent: temple });
		});
		k.box(200, 0.2, 60, 0x4a3c24, { y: 0.6, z: 27, parent: temple, rough: 0.3, metal: 0.2 });
		const kb = pbr({ x: 6, y: 0.6, z: 5, ry: -2.0, parent: temple });
		void kb;
		const painted = { shirt: 0x2a2018, legs: 0x2a2018, skin: 0xd8d4c8, hair: 0x111111 };
		for (let i = 0; i < 7; i++) {
			const cx = -14 + i * 4.5 + r() * 2;
			const cz = 9 + r() * 10;
			const canoe = k.group({ x: cx, y: 0.75, z: cz, ry: 0.3 + r() * 0.8, parent: temple });
			k.box(0.8, 0.35, 4.2, 0x3a2414, { parent: canoe });
			for (let j = 0; j < 2; j++) k.person({ x: 0, y: -0.5, z: -1 + j * 1.8, ry: PI + r() - 0.5, s: 0.9, pose: j ? "raise" : "stand", colors: painted, hair: false, parent: canoe });
		}
		for (let i = 0; i < 12; i++) k.person({ x: (r() - 0.5) * 9, y: 0.5 + i * 0.9, z: -4.5 - i - 0.1, ry: r() - 0.5, s: 0.9, colors: painted, hair: false, parent: temple });
		for (let i = 0; i < 6; i++) k.person({ x: -18 + i * 2.2 + (i > 2 ? 22 : 0), y: 0.5, z: -1 - r() * 2, ry: r() - 0.5, s: 0.9, pose: i % 2 ? "raise" : "stand", colors: painted, hair: false, parent: temple });
		// A dead tree with the hanged, and heads on stakes by the landing.
		k.cyl(0.35, 0.5, 11, 0x2a2018, { x: 18, y: 5.5, z: -2, parent: temple });
		k.cyl(0.18, 0.25, 9, 0x2a2018, { x: 14, y: 9.5, z: -2, rz: 1.3, parent: temple });
		[11.5, 14, 16.2].forEach((x, i) => {
			k.cyl(0.02, 0.02, 2, 0x8a7a5a, { x, y: 9.4, z: -2, parent: temple });
			k.person({ x, y: 5.6 - i * 0.2, z: -2, ry: i, s: 0.95, colors: { shirt: 0x5a5a3a, legs: 0x3a3a2a, skin: 0x8a7a68, hair: 0x2a2018 }, parent: temple });
		});
		for (let i = 0; i < 9; i++) {
			const x = -16 + i * 4;
			k.cyl(0.05, 0.05, 2.6, 0x5a4a30, { x, y: 1.6, z: 1.6, parent: temple });
			k.sphere(0.24, 0xc8bca0, { x, y: 3.0, z: 1.6, parent: temple });
		}
		k.particles(400, 0xe8d8b8, { y: -300, box: [60, 25, 60], speed: 0.3, size: 0.12, opacity: 0.35, drift: 0.5 });
		k.point(0xd8b890, 6, 120, { x: 10, y: 30, z: 30, parent: temple, decay: 0.5 });
		// The ceiling fan in a Saigon hotel room.
		const room = k.group({ x: 200, y: -300, z: 0 });
		k.box(14, 0.4, 14, 0xc8b490, { y: 4.2, parent: room });
		[-3, 3].forEach((x) => k.box(0.5, 0.5, 14, 0x5a4028, { x, y: 3.85, parent: room }));
		[-7, 7].forEach((x) => k.box(0.2, 8, 14, 0xa89070, { x, y: 0, parent: room }));
		const fan = k.group({ y: 3.2, parent: room });
		k.cyl(0.05, 0.05, 0.8, 0x2a2018, { y: 0.4, parent: fan });
		k.cyl(0.25, 0.2, 0.25, 0x3a2a1a, { parent: fan, metal: 0.4 });
		for (let i = 0; i < 4; i++) k.box(0.32, 0.04, 1.6, 0x4a301a, { z: 1.0, parent: k.group({ ry: (i * PI) / 2, parent: fan }), rx: 0.08 });
		k.tick((t) => (fan.rotation.y = t * 1.6));
		for (let i = 0; i < 9; i++) k.box(0.1, 0.06, 4, 0xffc070, { x: 6.85, y: -1 + i * 0.35, parent: room, emissive: 0xff9a30, glow: 1.4, shadow: false });
		k.point(0xffa040, 8, 16, { x: 5, y: 1, parent: room });
		k.point(0xff9a40, 3, 10, { x: 0, y: 1, parent: room });
		// A dossier on a plank table: typed pages, a snapshot, an ashtray.
		const desk = k.group({ x: 400, y: -300, z: 0 });
		const planks = k.canvas(128, 128, (g) => {
			g.fillStyle = "#6a4a30";
			g.fillRect(0, 0, 128, 128);
			for (let i = 0; i < 8; i++) {
				g.fillStyle = i % 2 ? "#5a3e28" : "#74523a";
				g.fillRect(0, i * 16, 128, 15);
			}
		});
		k.box(4, 0.1, 3, k.mat(0xffffff, { map: planks }), { y: 1, parent: desk });
		k.box(14, 0.2, 14, 0x3a2c22, { y: -0.1, parent: desk });
		k.box(14, 8, 0.2, 0x8a7a5a, { y: 4, z: -3, parent: desk });
		const typed = k.canvas(96, 128, (g) => {
			g.fillStyle = "#ece6d4";
			g.fillRect(0, 0, 96, 128);
			g.fillStyle = "#3a3a3a";
			for (let i = 0; i < 18; i++) g.fillRect(8, 10 + i * 6, 40 + ((i * 29) % 40), 2);
			g.fillStyle = "#a82a2a";
			g.fillRect(52, 4, 38, 8);
		});
		k.box(0.9, 0.02, 1.2, 0xc8a868, { x: -0.3, y: 1.06, z: 0.1, ry: 0.15, parent: desk });
		k.box(0.72, 0.01, 0.96, k.mat(0xffffff, { map: typed }), { x: -0.32, y: 1.08, z: 0.12, ry: 0.1, parent: desk });
		k.box(0.72, 0.01, 0.96, 0xe4dcc8, { x: 0.45, y: 1.065, z: 0.25, ry: -0.25, parent: desk });
		const snap = k.canvas(64, 64, (g) => {
			g.fillStyle = "#8a8a84";
			g.fillRect(0, 0, 64, 64);
			g.fillStyle = "#4a4a46";
			g.fillRect(0, 40, 64, 24);
			g.fillStyle = "#2a2a28";
			g.beginPath();
			g.ellipse(32, 30, 9, 11, 0, 0, PI * 2);
			g.fill();
			g.fillRect(20, 40, 24, 24);
		});
		k.box(0.36, 0.012, 0.36, 0xf4f0e8, { x: 0.35, y: 1.08, z: 0.1, ry: -0.4, parent: desk });
		k.box(0.3, 0.013, 0.28, k.mat(0xffffff, { map: snap }), { x: 0.35, y: 1.082, z: 0.11, ry: -0.4, parent: desk });
		k.cyl(0.17, 0.15, 0.05, 0x3a3a3a, { x: 1.0, y: 1.07, z: -0.5, parent: desk, metal: 0.5, rough: 0.4 });
		k.cyl(0.012, 0.012, 0.22, 0xf0ece0, { x: 1.05, y: 1.11, z: -0.48, rz: PI / 2 - 0.1, ry: 0.4, parent: desk });
		k.cyl(0.13, 0.11, 0.2, 0xd8a050, { x: -1.05, y: 1.15, z: -0.4, parent: desk, opacity: 0.75, rough: 0.1 });
		k.box(0.5, 0.06, 0.22, 0x2a2a2a, { x: -0.9, y: 1.08, z: 0.75, ry: 0.6, parent: desk });
		k.point(0xffe8c8, 6, 10, { x: 0.5, y: 3, z: 1.5, parent: desk });
		k.spot(0xfff0d8, 20, { x: 401, y: -296, z: 1, target: [400, -299, 0], angle: 0.45 });
		return {
			shots: [
				{ pos: [400.2, -297.7, 1.5], look: [400.1, -298.9, 0.1], fov: 45, fog: [0x2a2014, 3, 20] },
				{ pos: [-9, 2.4, 7], look: [0, 1.4, 0], fov: 45, fog: [0xa8b0a0, 6, 110] },
				{ pos: [11, -296.6, 15], look: [0, -293.2, -12], fov: 55, fog: [0x3a2c1c, 14, 120], exposure: 1.3 },
				{ pos: [200.6, -299.8, 0.4], look: [200, -296.8, 0], fov: 55, fog: [0x3a2414, 2, 20], exposure: 1.3 },
				{ pos: [50, 3, 4], look: [110, 12, -55], fov: 50 },
				{ pos: [-30, 2.5, 6], look: [-180, 22, 6], fov: 45, fog: [0xf07a28, 80, 420], exposure: 0.85, filter: "contrast(1.25) saturate(1.3)" },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the rain
	r41: (k) => {
		k.fog(0x1c2840, 20, 140);
		k.sky(0x141e34, 0x3a4c70);
		k.light({ sky: 0xa8bce8, ground: 0x2a2a30, hemi: 1.5, sunColor: 0xb0c4ff, sunIntensity: 0.8, sunPos: [-20, 40, 30], shadowSize: 40 });
		k.particles(2000, 0xc8d8f0, { box: [50, 25, 80], speed: 22, size: 0.04, opacity: 0.4 });
		{
			// Rain as streaks, so it never reads as snow.
			const T = k.THREE;
			const n = 6000;
			const box = [40, 22, 70];
			const pos = new Float32Array(n * 6);
			const seed = rng(141);
			for (let i = 0; i < n; i++) {
				const x = (seed() - 0.5) * box[0];
				const y = seed() * box[1];
				const z = (seed() - 0.5) * box[2];
				pos.set([x, y, z, x + 0.04, y + 0.7, z], i * 6);
			}
			const geo = new T.BufferGeometry();
			geo.setAttribute("position", new T.BufferAttribute(pos, 3));
			k.place(new T.LineSegments(geo, new T.LineBasicMaterial({ color: 0xc8d8f0, transparent: true, opacity: 0.45, depthWrite: false })), { shadow: false });
			k.tick((t, dt) => {
				const a = geo.attributes.position.array;
				for (let i = 0; i < n; i++) {
					let y = a[i * 6 + 1] - 24 * dt;
					if (y < 0) y += box[1];
					a[i * 6 + 1] = y;
					a[i * 6 + 4] = y + 0.7;
				}
				geo.attributes.position.needsUpdate = true;
			});
		}
		k.box(10, 0.1, 140, 0x22262e, { y: 0.05, rough: 0.2, metal: 0.5 });
		[-1, 1].forEach((s) => {
			k.box(5, 0.3, 140, 0x4a4c56, { x: s * 7.5, y: 0.15, rough: 0.4, metal: 0.3 });
			for (let i = 0; i < 12; i++) {
				const z = -55 + i * 10;
				const h = 9 + ((i * 5 + (s > 0 ? 1 : 3)) % 4) * 2;
				const col = [0x6a3a30, 0x8a7a68, 0x5a4a5a, 0x7a5a40][(i + (s > 0 ? 0 : 2)) % 4];
				k.box(8, h, 9.8, col, { x: s * 14, y: h / 2, z });
				k.box(0.2, 2.6, 6, 0xffd890, { x: s * 9.95, y: 1.8, z, emissive: 0xffb050, glow: 0.9 });
				k.box(1.6, 0.1, 7, i % 2 ? 0x8a2a2a : 0x2a5a3a, { x: s * 9.3, y: 3.5, z, rz: s * 0.35 });
				for (let row = 0; row < 2; row++) for (let w = 0; w < 3; w++) k.box(0.2, 1.4, 1.4, (i + w + row) % 3 ? 0x3a3020 : 0xd8b060, { x: s * 9.95, y: 5.5 + row * 2.6, z: z - 3 + w * 3, emissive: (i + w + row) % 3 ? 0x000000 : 0x8a6020, glow: 0.8 });
			}
		});
		// Lamp posts.
		const lamp = (x, z) => {
			k.cyl(0.25, 0.3, 0.6, 0x2a2a2a, { x, y: 0.6, z, metal: 0.5 });
			k.cyl(0.08, 0.11, 4.4, 0x2a2a2a, { x, y: 3.1, z, metal: 0.5 });
			k.box(0.4, 0.6, 0.4, 0xfff0c0, { x, y: 5.6, z, emissive: 0xffd080, glow: 1.5 });
			k.cone(0.4, 0.35, 0x1a1a1a, { x, y: 6.07, z, seg: 4, ry: PI / 4 });
			k.glow(0xffd890, 3, { x, y: 5.6, z });
			k.point(0xffcc80, 10, 22, { x, y: 5.2, z });
		};
		lamp(5.6, 0);
		[-36, -18, 18, 36].forEach((z) => lamp(5.6, z));
		[-27, -9, 9, 27].forEach((z) => lamp(-5.6, z));
		// A puddle, rippling.
		k.cyl(1.6, 1.6, 0.02, 0x3a4a70, { x: 2, y: 0.11, z: 5, seg: 24, rough: 0.05, metal: 0.8, s: [1, 1, 0.7] });
		k.glow(0xffd890, 0.9, { x: 2.8, y: 0.13, z: 4.6, opacity: 0.7 });
		const ripples = [];
		for (let i = 0; i < 6; i++) ripples.push(k.torus(0.2, 0.012, 0xd8e4ff, { x: 1 + (i % 3) * 0.9, y: 0.13, z: 4.5 + Math.floor(i / 3) * 0.9, rx: PI / 2, shadow: false, opacity: 1 }));
		k.tick((t) => ripples.forEach((rr, i) => {
			const p = (t * 0.9 + i * 0.37) % 1;
			rr.scale.setScalar(0.3 + p * 1.6);
			rr.material.opacity = 1 - p;
		}));
		// The dancer: splashing in the gutter, then hanging from the lamp post.
		const suit = { shirt: 0x6e6a5c, legs: 0x6e6a5c, hair: 0x3a2a1a, skin: 0xe0b48f };
		const splash = k.person({ x: 2.6, y: 0.1, z: 6.5, ry: 0.5, hat: 0x5a5040, colors: suit, from: 3, until: 4 });
		const sl = splash.userData.limbs;
		sl.armR.rotation.z = 2.6;
		sl.armL.rotation.z = -0.5;
		sl.legL.rotation.x = -0.8;
		const brolly = k.group({ y: -0.7, parent: sl.armR });
		k.cyl(0.015, 0.015, 1.1, 0x2a2a2a, { y: -0.45, parent: brolly });
		k.cone(1.0, 0.45, 0x16161a, { y: -1.1, rx: PI, seg: 8, parent: brolly });
		for (let i = 0; i < 14; i++) k.sphere(0.03 + (i % 3) * 0.02, 0xd8e8ff, { emissive: 0x6a7a9a, rough: 0.1, x: 2.6 + Math.cos(i) * (0.3 + (i % 4) * 0.15), y: 0.15 + (i % 5) * 0.12, z: 6.8 + Math.sin(i) * 0.4, opacity: 0.45, from: 3, until: 4, shadow: false });
		const hang = k.person({ x: 5.35, y: 0.9, z: 0, rz: 0.35, hat: 0x5a5040, colors: suit, from: 5 });
		const hl = hang.userData.limbs;
		hl.armR.rotation.z = 2.2;
		hl.armL.rotation.z = -1.9;
		hl.legL.rotation.z = -0.6;
		hl.head.rotation.z = 0.2;
		const closed = k.group({ y: -0.7, parent: hl.armL });
		k.torus(0.07, 0.015, 0x3a2a1a, { y: 0.05, parent: closed, arc: PI });
		k.cyl(0.015, 0.015, 1.1, 0x2a2a2a, { y: -0.5, parent: closed });
		k.cone(0.09, 0.8, 0x16161a, { y: -0.75, rx: PI, seg: 8, parent: closed });
		k.tick((t) => (hang.rotation.z = 0.35 + Math.sin(t * 1.2) * 0.04));
		k.point(0xffe0b0, 6, 8, { x: 3.4, y: 2.8, z: 2.6, from: 5 });
		// An umbrella hooked on a lamp post, a hat on the wet kerb, splashes in the gutter.
		const hook = k.group({ x: -5.1, y: 0.3, z: 9.5, rz: 0.15, rx: 0.12, from: 3, until: 3 });
		k.cone(0.14, 0.85, 0x16161a, { y: 0.45, rx: PI, seg: 8, parent: hook });
		k.cyl(0.018, 0.018, 1.0, 0x2a2a2a, { y: 0.9, parent: hook });
		k.torus(0.08, 0.018, 0x3a2a1a, { x: -0.08, y: 1.4, parent: hook, arc: PI });
		const hat = k.group({ x: -4.3, y: 0.32, z: 10.2, ry: 0.4, rz: 0.12, from: 3, until: 3 });
		k.cyl(0.3, 0.3, 0.03, 0x5a5040, { parent: hat });
		k.cyl(0.15, 0.18, 0.17, 0x5a5040, { y: 0.1, parent: hat });
		k.cyl(0.182, 0.182, 0.04, 0x2a2420, { y: 0.04, parent: hat });
		k.cyl(1.4, 1.4, 0.02, 0x3a4a70, { x: -3.6, y: 0.11, z: 11, seg: 20, rough: 0.05, metal: 0.8, s: [1, 1, 0.6], from: 3, until: 3 });
		const drips = [];
		for (let i = 0; i < 8; i++) drips.push(k.torus(0.18, 0.01, 0xd8e4ff, { x: -4.2 + (i % 4) * 0.4, y: 0.13, z: 10.7 + Math.floor(i / 4) * 0.5, rx: PI / 2, shadow: false, opacity: 1, from: 3, until: 3 }));
		k.tick((t) => drips.forEach((rr, i) => {
			const p = (t * 1.1 + i * 0.29) % 1;
			rr.scale.setScalar(0.3 + p * 1.5);
			rr.material.opacity = 1 - p;
		}));
		k.point(0xffd8a0, 5, 9, { x: -3.6, y: 3, z: 12, from: 3, until: 3 });
		// A microphone hidden in a potted bush.
		const pot = k.group({ x: 0, y: -300, z: 0 });
		k.box(20, 0.2, 20, 0x4a3a2a, { parent: pot });
		k.box(20, 10, 0.2, 0x7a1a20, { y: 5, z: -3, parent: pot });
		for (let i = 0; i < 12; i++) k.box(0.3, 10, 0.25, 0x5a1016, { x: -8 + i * 1.5, y: 5, z: -2.85, parent: pot });
		k.cyl(0.5, 0.36, 0.8, 0xb8603a, { y: 0.5, parent: pot, seg: 10 });
		const leaves = [[0, 1.3, 0, 0.55], [0.35, 1.6, 0.1, 0.45], [-0.35, 1.55, 0.05, 0.45], [0, 1.9, -0.1, 0.42], [0.2, 1.4, 0.35, 0.35], [-0.25, 1.35, 0.35, 0.35]];
		leaves.forEach(([x, y, z, s], i) => k.ico(s, i % 2 ? 0x3a7a3a : 0x2a6a30, { x, y, z, parent: pot }));
		k.cyl(0.07, 0.08, 0.28, 0xb8b8c0, { x: 0.08, y: 1.55, z: 0.42, rx: 0.5, parent: pot, metal: 0.9, rough: 0.25 });
		k.sphere(0.1, 0x8a8a90, { x: 0.08, y: 1.7, z: 0.5, parent: pot, metal: 0.8, rough: 0.4 });
		k.torus(0.1, 0.015, 0xd8d8e0, { x: 0.08, y: 1.7, z: 0.5, rx: 0.5, parent: pot, metal: 0.9 });
		k.spot(0xfff0d0, 30, { x: 2, y: -296, z: 4, target: [0, -298.5, 0], angle: 0.4 });
		k.point(0xffd0a0, 3, 10, { x: -2, y: 2, z: 2, parent: pot });
		// An old film camera on a sound stage.
		const stage = k.group({ x: 200, y: -300, z: 0 });
		k.box(30, 0.2, 30, 0x3a3028, { parent: stage });
		const cam = k.group({ y: 1.6, parent: stage, ry: 0.5 });
		k.box(0.6, 0.7, 1.0, 0x1a1a1a, { y: 0.35, parent: cam, metal: 0.3 });
		k.cyl(0.14, 0.17, 0.4, 0x8a7040, { y: 0.4, z: 0.68, rx: PI / 2, parent: cam, metal: 0.8, rough: 0.3 });
		[-0.32, 0.32].forEach((z) => k.cyl(0.38, 0.38, 0.1, 0x2a2a2a, { y: 1.05, z, rz: PI / 2, parent: cam, seg: 20 }));
		k.box(0.04, 0.04, 0.4, 0x8a8a8a, { x: 0.33, y: 0.3, z: -0.2, parent: cam });
		for (let i = 0; i < 3; i++) {
			const a = (i * PI * 2) / 3;
			k.box(0.06, 1.75, 0.06, 0x7a5a3a, { x: Math.sin(a) * 0.35, y: 0.82, z: Math.cos(a) * 0.35, rx: 0.2 * Math.cos(a), rz: -0.2 * Math.sin(a), parent: stage });
		}
		k.box(0.6, 0.06, 0.6, 0x7a5a3a, { y: 1.6, parent: stage });
		const chair = k.group({ x: -2, z: 1.5, ry: 0.8, parent: stage });
		[-0.3, 0.3].forEach((x) => [-0.25, 0.25].forEach((z) => k.box(0.05, 0.9, 0.05, 0x8a6a40, { x, y: 0.45, z, parent: chair })));
		k.box(0.62, 0.04, 0.5, 0x2a2a2a, { y: 0.6, parent: chair });
		k.box(0.62, 0.35, 0.04, 0x2a2a2a, { y: 1.05, z: -0.25, parent: chair });
		k.cone(0.22, 0.7, 0xd8d0c0, { x: -2, y: 0.75, z: 1.5, rz: PI / 2, parent: stage, open: true });
		[[3, -2], [-3, -3]].forEach(([x, z]) => {
			k.box(0.08, 3, 0.08, 0x2a2a2a, { x, y: 1.5, z, parent: stage });
			k.cyl(0.45, 0.35, 0.6, 0x2a2a2a, { x, y: 3.2, z, rx: 1.2, parent: stage });
			k.glow(0xfff0d0, 2, { x, y: 3.1, z: z + 0.4, parent: stage });
		});
		k.spot(0xfff0d0, 40, { x: 203, y: -295, z: 3, target: [200, -298.6, 0], angle: 0.45 });
		k.point(0xffe8c8, 4, 14, { x: -1, y: 3, z: 3, parent: stage });
		return {
			shots: [
				{ pos: [202.4, -297.9, 0.9], look: [200, -298.1, 0], fov: 45, fog: [0x1a1410, 2, 30] },
				{ pos: [0.7, -298.25, 1.6], look: [0.08, -298.32, 0.45], fov: 40, fog: [0x2a1810, 2, 25] },
				{ pos: [2.6, 0.75, 8.0], look: [2, 0.1, 4.8], fov: 45 },
				{ pos: [-2.0, 1.9, 14.2], look: [-5.2, 2.0, 8.6], fov: 60 },
				{ pos: [0.2, 1.4, 11], look: [2.6, 1.6, 6.5], fov: 45 },
				{ pos: [2.4, 1.3, 3.8], look: [5.0, 2.5, 0], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the hills
	r42: (k) => {
		k.fog(0xc8e0f0, 140, 720);
		k.sky(0x3a86e0, 0xdcecf8);
		k.light({ sky: 0xe8f4ff, ground: 0x5a7a30, hemi: 1.3, sunPos: [60, 70, 50], sunIntensity: 2.4, shadowSize: 60 });
		const H = (x, z) => 16 * Math.exp(-(x * x + z * z) / 2500) + 2.5 * Math.sin(x * 0.03) * Math.cos(z * 0.025) + Math.max(0, Math.hypot(x, z) - 160) * 0.25;
		k.ground(1000, 0x6aa840, { bump: 0, seg: 120, height: H });
		const r = rng(42);
		const T = k.THREE;
		const mountain = (x, z, rad, h, parent, y = 0) => {
			const ry = r() * 6;
			k.cone(rad, h, 0x7a8290, { x, y: y + h / 2, z, seg: 7, ry, parent });
			k.cone(rad * 0.36, h * 0.36, 0xf4f8fc, { x, y: y + h - h * 0.18 + 0.3, z, seg: 7, ry, parent, s: 1.02 });
		};
		for (let i = 0; i < 16; i++) {
			const a = (i / 16) * PI * 2 + r() * 0.2;
			const d = 330 + r() * 90;
			mountain(Math.cos(a) * d, Math.sin(a) * d, 70 + r() * 40, 130 + r() * 90);
		}
		const pine = merge(T, [
			[new T.CylinderGeometry(0.2, 0.3, 2, 5), mtx(T, [0, 1, 0])],
			[new T.ConeGeometry(1.6, 6, 6), mtx(T, [0, 4.5, 0])],
		]);
		const pines = [];
		for (let i = 0; i < 300; i++) {
			const a = r() * PI * 2;
			const d = 70 + r() * 200;
			const x = Math.cos(a) * d;
			const z = Math.sin(a) * d;
			if (Math.abs(a - 0.8) < 0.3) continue;
			pines.push([x, H(x, z) - 0.2, z, r() * 6, 0.8 + r() * 0.8]);
		}
		instanced(k, pine, 0x2a5030, pines);
		const flowers = [];
		for (let i = 0; i < 500; i++) {
			const x = (r() - 0.5) * 70;
			const z = (r() - 0.5) * 70;
			flowers.push([x, H(x, z) + 0.05, z, 0, 0.6 + r() * 0.6]);
		}
		instanced(k, new T.IcosahedronGeometry(0.08, 0), 0xf4f0d0, flowers.filter((_, i) => i % 2));
		instanced(k, new T.IcosahedronGeometry(0.08, 0), 0xe8c040, flowers.filter((_, i) => !(i % 2)));
		// The edelweiss among rocks.
		const ex = 4;
		const ez = 3;
		const ey = H(ex, ez);
		const ed = k.group({ x: ex, y: ey, z: ez });
		[[0.5, 0.1, -0.3, 0.35], [-0.4, 0.05, -0.4, 0.3], [0.1, 0, -0.7, 0.4]].forEach(([x, y, z, s]) => k.ico(s, 0x9a9a92, { x, y, z, parent: ed, s: [1, 0.7, 1] }));
		k.cyl(0.012, 0.015, 0.22, 0x8a9a7a, { y: 0.11, parent: ed });
		for (let i = 0; i < 10; i++) {
			const a = (i / 10) * PI * 2;
			k.sphere(1, 0xf2f2ea, { x: Math.cos(a) * 0.075, y: 0.225, z: Math.sin(a) * 0.075, ry: -a, s: [0.075, 0.012, 0.026], parent: ed, seg: 6, rings: 4 });
		}
		for (let i = 0; i < 7; i++) k.sphere(0.018, 0xe8e0a0, { x: Math.cos(i) * 0.02, y: 0.235, z: Math.sin(i) * 0.02, parent: ed, seg: 6, rings: 4 });
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * PI * 2 + 0.3;
			k.sphere(1, 0x9aaa8a, { x: Math.cos(a) * 0.07, y: 0.02, z: Math.sin(a) * 0.07, ry: -a, s: [0.08, 0.01, 0.025], parent: ed, seg: 6, rings: 4 });
		}
		// A guitar case and a carpet bag by a gate.
		const gx = 14;
		const gz = 12;
		const gy = H(gx, gz);
		const kit = k.group({ x: gx, y: gy, z: gz, ry: 0.4 });
		const bagTex = k.canvas(128, 128, (g) => {
			g.fillStyle = "#6a2a2a";
			g.fillRect(0, 0, 128, 128);
			for (let i = 0; i < 30; i++) {
				g.fillStyle = ["#d8a040", "#3a6a4a", "#e8d8b0"][i % 3];
				g.beginPath();
				g.arc((i * 37) % 128, (i * 53) % 128, 6 + (i % 4) * 2, 0, PI * 2);
				g.fill();
			}
		});
		k.box(0.6, 0.45, 0.3, k.mat(0xffffff, { map: bagTex }), { x: 0.6, y: 0.23, parent: kit });
		k.box(0.62, 0.05, 0.32, 0x3a2a1a, { x: 0.6, y: 0.47, parent: kit });
		k.torus(0.13, 0.02, 0x3a2a1a, { x: 0.6, y: 0.5, parent: kit, arc: PI });
		const caseG = k.group({ x: -0.4, y: 0.6, rz: 0.15, parent: kit });
		k.cyl(0.3, 0.3, 0.16, 0x4a3020, { y: -0.3, rx: PI / 2, parent: caseG, seg: 14 });
		k.cyl(0.23, 0.23, 0.16, 0x4a3020, { y: 0.1, rx: PI / 2, parent: caseG, seg: 14 });
		k.box(0.12, 0.6, 0.12, 0x4a3020, { y: 0.55, parent: caseG });
		k.box(0.03, 0.1, 0.17, 0xc8a040, { x: 0.3, y: -0.3, parent: caseG, metal: 0.8 });
		[0, 1.2, 2.4].forEach((x) => k.box(0.12, 1.1, 0.12, 0x7a5a3a, { x: x - 0.6, y: 0.55, z: -1.2, parent: kit }));
		[0.4, 0.85].forEach((y) => k.box(2.6, 0.08, 0.06, 0x7a5a3a, { x: 0.6, y, z: -1.2, parent: kit }));
		// The governess, spinning on the hilltop.
		const my = H(0, 0);
		const maria = k.person({ x: 0, y: my - 0.05, z: 0, pose: "arms-out", dress: 0x3a4458, sleeves: 0xf0ece0, colors: { shirt: 0x3a4458, legs: 0xe8c8a8, hair: 0x9a7a4a, shoes: 0x3a2a1a }, from: 5 });
		k.tick((t) => (maria.rotation.y = t * 1.2));
		// The villa by the lake, the gazebo and the children.
		const V = k.group({ x: 0, y: -400, z: 0 });
		k.box(400, 2, 140, 0x5a9a3a, { y: -1, z: 50, parent: V });
		k.water(500, 0x3a6a8a, { y: -400.6, z: -150, seg: 50, amp: 0.15 });
		for (let i = 0; i < 9; i++) mountain(-200 + i * 50 + r() * 20, -260 - r() * 60, 60 + r() * 30, 100 + r() * 70, V, -1);
		for (let i = 0; i < 7; i++) mountain(-200 + i * 70, 240 + r() * 40, 50 + r() * 20, 70 + r() * 40, V, -1);
		const villa = k.group({ x: 10, z: 40, parent: V });
		k.box(46, 14, 16, 0xf2e2a8, { y: 7, parent: villa });
		k.cone(24, 8, 0x6a5a58, { y: 18, ry: PI / 4, seg: 4, s: [1.36, 1, 0.48], parent: villa });
		for (let row = 0; row < 3; row++) for (let i = 0; i < 11; i++) {
			k.box(1.6, 2.4, 0.1, 0x3a4a5a, { x: -20 + i * 4, y: 2.5 + row * 4.2, z: -8.02, parent: villa });
			k.box(2.2, 0.25, 0.2, 0xffffff, { x: -20 + i * 4, y: 1.2 + row * 4.2, z: -8.05, parent: villa });
		}
		k.box(30, 0.6, 8, 0xe8e0d0, { y: 0.3, z: -12, parent: villa });
		for (let i = 0; i < 4; i++) k.box(12, 0.3, 1, 0xe8e0d0, { y: 0.15, z: -16.5 - i, parent: villa, s: [1, 1 - i * 0.2, 1] });
		const gz2 = k.group({ x: -45, z: 25, parent: V });
		k.cyl(3.2, 3.4, 0.5, 0xf0eee8, { y: 0.25, seg: 8, parent: gz2 });
		k.cyl(3, 3, 3.2, 0xbfe0f0, { y: 2.1, seg: 8, open: true, side: 2, opacity: 0.35, rough: 0.1, parent: gz2 });
		for (let i = 0; i < 8; i++) {
			const a = (i / 8) * PI * 2;
			k.box(0.2, 3.4, 0.2, 0xffffff, { x: Math.sin(a) * 3, y: 2.1, z: Math.cos(a) * 3, parent: gz2 });
		}
		k.cyl(3.1, 3.1, 0.25, 0xffffff, { y: 3.8, seg: 8, parent: gz2 });
		k.cone(3.6, 2.2, 0xd8d8d0, { y: 5, seg: 8, parent: gz2 });
		k.sphere(0.25, 0xffffff, { y: 6.2, parent: gz2 });
		trees(k, 14, [-80, -55, 10, 50], { color: 0x2a5a2a, h: 10, seed: 3, avoid: () => false });
		const kidH = [0.95, 0.88, 0.8, 0.72, 0.64, 0.57, 0.5];
		let kx = -3;
		kidH.forEach((s, i) => {
			const girl = [0, 2, 3, 5, 6].includes(i);
			const kid = k.person({ x: 12 + kx, y: 0, z: 18, ry: PI, s, dress: girl ? 0x1e2a50 : undefined, colors: { shirt: 0x1e2a50, legs: girl ? 0xe8c8a8 : 0x1e2a50, hair: [0x6a4a2a, 0x3a2a1a, 0x8a6a3a][i % 3] }, parent: V });
			k.box(0.56, 0.12, 0.32, 0xffffff, { y: 1.5, parent: kid });
			kx += 0.9 * s + 0.35;
		});
		const capt = k.person({ x: 7.5, y: 0, z: 18.5, ry: PI - 0.4, s: 1.08, colors: { shirt: 0x2a2e3a, legs: 0x2a2e3a, hair: 0x3a2a1a }, parent: V });
		capt.userData.limbs.armR.rotation.x = -2.3;
		// Brown paper packages tied up with string, on a kitchen table.
		const pk = k.group({ y: -800 });
		k.box(20, 0.2, 20, 0x5a4434, { y: -0.1, parent: pk });
		k.box(20, 8, 0.2, 0xe8e0c8, { y: 4, z: -3, parent: pk });
		k.box(20, 1.2, 0.25, 0x8a6a4a, { y: 0.6, z: -2.9, parent: pk });
		const cloth = k.canvas(128, 128, (g) => {
			g.fillStyle = "#f2eee4";
			g.fillRect(0, 0, 128, 128);
			g.fillStyle = "rgba(60,100,170,0.55)";
			for (let i = 0; i < 8; i++) {
				g.fillRect(i * 16, 0, 7, 128);
				g.fillRect(0, i * 16, 128, 7);
			}
		});
		cloth.wrapS = cloth.wrapT = T.RepeatWrapping;
		cloth.repeat.set(3, 2);
		k.box(4, 0.12, 2.6, k.mat(0xffffff, { map: cloth }), { y: 1.0, parent: pk });
		[[-1.8, -1.1], [1.8, -1.1], [-1.8, 1.1], [1.8, 1.1]].forEach(([x, z]) => k.box(0.12, 1, 0.12, 0x7a5a3a, { x, y: 0.5, z, parent: pk }));
		[[-0.35, 0.1, 0.7, 0.32, 0.5, 0.2], [0.35, 0.25, 0.5, 0.25, 0.4, -0.3], [-0.2, -0.45, 0.55, 0.22, 0.42, 0.5], [-0.32, 0.12, 0.4, 0.18, 0.32, -0.1]].forEach(([x, z, w, h, d, ry], i) => {
			const y = 1.06 + (i === 3 ? 0.32 : 0) + h / 2;
			const p = k.group({ x, y, z, ry, parent: pk });
			k.box(w, h, d, [0xb08a5a, 0xa47e50, 0xb8946a, 0xa88458][i], { parent: p, rough: 1 });
			k.box(w + 0.01, h + 0.01, 0.015, 0xe8dcc0, { parent: p });
			k.box(0.015, h + 0.01, d + 0.01, 0xe8dcc0, { parent: p });
			[-0.05, 0.05].forEach((a) => k.torus(0.05, 0.008, 0xe8dcc0, { y: h / 2 + 0.03, x: a * 1.2, ry: a > 0 ? 0.6 : -0.6, rz: a * 12, parent: p, seg: 10 }));
		});
		k.cyl(0.07, 0.07, 0.03, 0xd8d0b8, { x: 0.75, y: 1.08, z: -0.35, parent: pk });
		k.cyl(0.02, 0.02, 0.12, 0xb8a888, { x: 0.75, y: 1.15, z: -0.35, parent: pk });
		k.point(0xfff0d8, 6, 12, { x: 1.5, y: 3.5, z: 2.5, parent: pk });
		k.spot(0xfff4e0, 18, { x: -1, y: -796, z: 2, target: [0, -798.9, 0], angle: 0.45 });
		// A copper kettle on an old stove, wool mittens drying on the rail.
		const st = k.group({ x: 300, y: -800 });
		k.box(20, 0.2, 20, 0x4a3a2c, { y: -0.1, parent: st });
		const tiles = k.canvas(64, 64, (g) => {
			g.fillStyle = "#e8e4d8";
			g.fillRect(0, 0, 64, 64);
			g.fillStyle = "#b8b0a0";
			for (let i = 0; i < 4; i++) {
				g.fillRect(0, i * 16, 64, 1);
				g.fillRect(i * 16, 0, 1, 64);
			}
		});
		tiles.wrapS = tiles.wrapT = T.RepeatWrapping;
		tiles.repeat.set(8, 4);
		k.plane(20, 8, k.mat(0xffffff, { map: tiles }), { y: 4, z: -1.2, parent: st });
		k.box(2.4, 1.0, 1.6, 0x2a2a2c, { y: 0.5, parent: st, metal: 0.4, rough: 0.5 });
		k.box(2.5, 0.06, 1.7, 0x1a1a1a, { y: 1.03, parent: st, metal: 0.5 });
		[[-0.55, 0.2], [0.55, 0.2], [-0.55, -0.45], [0.55, -0.45]].forEach(([x, z]) => k.cyl(0.32, 0.32, 0.03, 0x3a3a3a, { x, y: 1.07, z, parent: st, metal: 0.6 }));
		const kettle = k.group({ x: -0.55, y: 1.08, z: 0.2, ry: 0.5, parent: st });
		const copper = { metal: 0.9, rough: 0.25, emissive: 0x3a1a08 };
		k.cyl(0.24, 0.3, 0.3, 0xc87038, { y: 0.15, parent: kettle, seg: 18, ...copper });
		k.sphere(0.24, 0xc87038, { y: 0.3, s: [1, 0.5, 1], parent: kettle, ...copper });
		k.sphere(0.04, 0x2a1a10, { y: 0.43, parent: kettle });
		k.cyl(0.03, 0.05, 0.3, 0xc87038, { x: 0.3, y: 0.24, rz: -0.9, parent: kettle, ...copper });
		k.torus(0.18, 0.02, 0x2a1a10, { y: 0.4, parent: kettle, arc: PI });
		k.cyl(0.03, 0.03, 2.4, 0xb8b8b8, { y: 1.4, z: 0.86, rz: PI / 2, parent: st, metal: 0.8 });
		[[-0.6, 0xa83030], [-0.25, 0xa83030], [0.45, 0x2a4a7a]].forEach(([x, c], i) => {
			const m = k.group({ x, y: 1.2, z: 0.88, rz: (i - 1) * 0.1, parent: st });
			k.box(0.18, 0.26, 0.06, c, { parent: m, rough: 1 });
			k.box(0.07, 0.1, 0.06, c, { x: -0.11, y: 0.02, rz: 0.4, parent: m, rough: 1 });
			k.box(0.19, 0.05, 0.065, 0xf0ece0, { y: 0.14, parent: m, rough: 1 });
		});
		k.point(0xffe8c8, 6, 10, { x: 1, y: 3, z: 2.5, parent: st });
		k.spot(0xfff0d8, 18, { x: 300.5, y: -796, z: 2.5, target: [300, -798.8, 0], angle: 0.45 });
		return {
			shots: [
				{ pos: [0.6, -797.9, 1.7], look: [0, -798.75, 0], fov: 45, fog: [0x3a3028, 3, 25] },
				{ pos: [300.6, -797.6, 2.6], look: [299.95, -798.7, 0.2], fov: 45, fog: [0x3a3028, 3, 25] },
				{ pos: [ex + 0.32, ey + 0.42, ez + 0.36], look: [ex, ey + 0.2, ez], fov: 40 },
				{ pos: [gx + 1.5, gy + 1.2, gz + 2.4], look: [gx, gy + 0.4, gz], fov: 45 },
				{ pos: [12.5, -398.6, 11], look: [11.5, -399, 18], fov: 45, fog: [0xc8e0f0, 80, 520] },
				{ pos: [3.2, my + 1.9, 4.6], look: [-3, my + 3.2, -6], fov: 55 },
			],
		};
	},
	// ----------------------------------------------------------------------------------------------- the nanny
	r43: (k) => {
		k.fog(0xd8b8a8, 90, 430);
		k.sky(0x6a84b8, 0xf4c8a8, { offset: -0.03 });
		k.light({ sky: 0xffe8d8, ground: 0x5a4a40, hemi: 1.35, sunColor: 0xffd8b0, sunIntensity: 2.2, sunPos: [-40, 35, 50], shadowSize: 80 });
		k.box(800, 1, 800, 0x4a4440, { y: -0.5 });
		const r = rng(43);
		const bricks = [0x8a4a38, 0x9a6a50, 0x7a5a4a, 0xa88a70, 0x6a4a40];
		// Terraces of London roofs, chimney pots everywhere.
		const pots = [];
		for (let row = 0; row < 7; row++)
			for (let i = 0; i < 15; i++) {
				const x = -56 + i * 8;
				const z = 20 - row * 16;
				if (row === 1 && i >= 6 && i <= 8) continue;
				const h = 12 + Math.floor(r() * 3) * 1.5;
				k.box(8, h, 10, bricks[(i + row * 2) % 5], { x, y: h / 2, z });
				roof(k, 8, 10.4, 3.2, 0x4a4e58, { x, y: h, z });
				if (i % 2 === 0) {
					k.box(1.2, 4, 3.4, bricks[(i + row) % 5], { x: x + 4, y: h + 1.8, z });
					for (let p = 0; p < 4; p++) pots.push([x + 4, h + 3.8, z - 1.2 + p * 0.8, 0, 1]);
				}
				for (let w = 0; w < 2; w++) k.box(1.4, 1.8, 0.1, 0x2a3040, { x: x - 1.8 + w * 3.6, y: h - 3, z: z + 5.02 });
			}
		const T = k.THREE;
		instanced(k, new T.CylinderGeometry(0.22, 0.28, 0.9, 6), 0xc8703a, pots);
		// A flat lead roof where the sweeps dance.
		k.box(24, 13, 10, 0x8a5a48, { x: -8, y: 6.5, z: 4 });
		k.box(24, 0.3, 10, 0x6a6e78, { x: -8, y: 13.15, z: 4 });
		[-1, 1].forEach((s) => k.box(24, 0.8, 0.3, 0x7a4a3a, { x: -8, y: 13.6, z: 4 + s * 4.9 }));
		k.box(1.4, 3, 3, 0x8a4a38, { x: -17, y: 14.5, z: 4 });
		for (let p = 0; p < 3; p++) k.cyl(0.22, 0.28, 0.9, 0xc8703a, { x: -17, y: 16.4, z: 3 + p, seg: 6 });
		const sweepCols = { shirt: 0x2a2a2c, legs: 0x2a2a2c, skin: 0xa8846a, hair: 0x1a1a1a };
		const sweeps = [];
		[[-12, 2, "raise"], [-9, 5, "arms-out"], [-5, 3, "run"], [-2, 6, "raise"], [1, 3.5, "arms-out"], [-14, 6, "point"]].forEach(([x, z, pose], i) => {
			const p = k.person({ x, y: 13.3, z, ry: 0.4 + i * 0.5, pose, hat: 0x1a1a1a, colors: sweepCols, from: 4 });
			sweeps.push(p);
			const hand = k.group({ y: -0.7, parent: p.userData.limbs.armL });
			k.cyl(0.03, 0.03, 1.8, 0x7a5a3a, { y: -0.2, parent: hand });
			k.box(0.3, 0.35, 0.3, 0x1a1a1a, { y: -1.15, parent: hand });
		});
		k.tick((t) => sweeps.forEach((p, i) => (p.position.y = 13.3 + Math.max(0, Math.sin(t * 4 + i)) * 0.35)));
		// The cathedral dome on the skyline.
		const dome = k.group({ x: 10, z: -190 });
		const stone = 0xe0d8c8;
		k.box(40, 22, 70, stone, { y: 11, parent: dome });
		k.cyl(13, 13, 10, stone, { y: 27, parent: dome, seg: 24 });
		for (let i = 0; i < 24; i++) k.cyl(0.5, 0.5, 9, 0xf0e8d8, { x: Math.cos((i / 24) * PI * 2) * 14, y: 26.5, z: Math.sin((i / 24) * PI * 2) * 14, parent: dome, seg: 6 });
		k.cyl(14.6, 14.6, 1.2, stone, { y: 31.6, parent: dome, seg: 24 });
		k.cyl(11, 11, 5, stone, { y: 34.5, parent: dome, seg: 24 });
		k.sphere(11.5, 0xb8b8b4, { y: 37, s: [1, 1.15, 1], parent: dome, seg: 24, rings: 12 });
		k.cyl(1.8, 2.2, 5, stone, { y: 52, parent: dome, seg: 8 });
		k.sphere(1.6, 0xb8b8b4, { y: 55, parent: dome });
		k.cyl(0.3, 0.3, 3, 0xd8b040, { y: 57.5, parent: dome, metal: 0.8 });
		[-1, 1].forEach((s) => {
			k.box(8, 30, 8, stone, { x: s * 15, y: 15, z: 34, parent: dome });
			k.cone(4, 8, stone, { x: s * 15, y: 34, z: 34, parent: dome, seg: 8 });
		});
		// Cherry Tree Lane, the park, the admiral's ship-roofed house.
		k.box(240, 0.2, 200, 0x5a9a3a, { y: 0.1, z: 170 });
		k.box(240, 0.25, 8, 0x8a8478, { y: 0.12, z: 64 });
		const boom = k.group({ x: -30, z: 48 });
		k.box(14, 12, 10, 0xe8e0d0, { y: 6, parent: boom });
		for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) k.box(1.6, 2.2, 0.1, 0x2a3a4a, { x: -4 + i * 4, y: 3.5 + row * 4.5, z: 5.05, parent: boom });
		k.box(13, 0.6, 9, 0x8a6a40, { y: 12.3, parent: boom });
		k.box(13.4, 1.8, 0.3, 0xf0f0e8, { y: 13.5, z: 4.4, parent: boom });
		k.box(13.4, 1.8, 0.3, 0xf0f0e8, { y: 13.5, z: -4.4, parent: boom });
		k.cone(4.5, 3, 0xf0f0e8, { x: 8.5, y: 13.2, rz: -PI / 2, seg: 4, s: [1, 1, 0.5], parent: boom });
		k.cyl(0.25, 0.3, 14, 0x6a4a2a, { y: 19, parent: boom });
		k.box(7, 0.2, 0.2, 0x6a4a2a, { y: 22, parent: boom });
		k.box(5.5, 3, 0.05, 0xf4f0e4, { y: 20.3, z: 0.15, parent: boom });
		line(k, [0, 26, 0], [8, 14, 0], 0x3a3a3a, 0.04, { parent: boom });
		line(k, [0, 26, 0], [-6.5, 13, 0], 0x3a3a3a, 0.04, { parent: boom });
		k.cyl(0.35, 0.45, 2.4, 0x1a1a1a, { x: 3, y: 13.4, z: 4.8, rx: PI / 2 - 0.2, parent: boom, metal: 0.6 });
		k.box(0.8, 0.5, 1, 0x5a3a20, { x: 3, y: 13.1, z: 3.9, parent: boom });
		k.cyl(0.05, 0.05, 4, 0xd8d8d8, { x: -5, y: 15, parent: boom });
		k.box(1.6, 1.0, 0.05, 0xc02020, { x: -4.2, y: 16.4, parent: boom });
		for (let i = 0; i < 9; i++) {
			const x = -70 + i * 17;
			k.cyl(0.3, 0.4, 3, 0x5a3a2a, { x, y: 1.5, z: 60 });
			k.ico(2.6, 0xf2b0c8, { x, y: 4.6, z: 60, s: [1, 0.8, 1] });
			k.ico(1.8, 0xf8c8d8, { x: x + 1.2, y: 5.4, z: 59.5 });
		}
		for (let i = 1; i < 6; i++) {
			const x = -30 + i * 14;
			k.box(13, 12, 10, i % 2 ? 0xd8d0c0 : 0xc8c0b0, { x, y: 6, z: 48 });
			roof(k, 13, 10.4, 3, 0x4a4e58, { x, y: 12, z: 48 });
		}
		// Kites over the park.
		const kiteCols = [[0xd83030, 0xf2c230], [0x3060c0, 0xf0f0f0], [0x30a050, 0xf2c230], [0xe06020, 0x6030a0]];
		const kites = [];
		[[-20, 110, 22, 26, 150], [-5, 104, 30, 18, 160], [12, 112, 26, 2, 156], [26, 106, 20, 30, 140]].forEach(([px, pz, ky, kx, kz], i) => {
			const flyer = k.person({ x: px, y: 0.2, z: pz, ry: PI * 0.95, pose: "raise", colors: { shirt: [0x3a3a5a, 0xc8a070, 0x6a2a2a, 0x2a4a3a][i], legs: 0x2a2a30 }, hat: i % 2 ? 0x1a1a1a : undefined, from: 2 });
			void flyer;
			const g = k.group({ x: kx, y: ky, z: kz, s: 2.2, from: 2 });
			k.box(2.2, 2.2, 0.06, kiteCols[i][0], { rz: PI / 4, s: [0.75, 1.2, 1], parent: g });
			k.box(0.06, 3.2, 0.08, kiteCols[i][1], { parent: g });
			for (let t = 0; t < 6; t++) k.box(0.4, 0.15, 0.05, kiteCols[i][1], { y: -2.2 - t * 0.7, x: Math.sin(t) * 0.3, parent: g });
			line(k, [px + 0.35, 2.4, pz], [kx, ky - 1, kz], 0xf0f0f0, 0.025, { from: 2 });
			kites.push(g);
		});
		k.tick((t) => kites.forEach((g, i) => {
			g.rotation.z = Math.sin(t * 1.3 + i) * 0.15;
			g.rotation.x = -0.3;
		}));
		trees(k, 24, [-110, 110, 160, 250], { color: 0x3a6a2a, h: 12, seed: 4 });
		// The nanny, floating down under her umbrella.
		const nanny = k.person({ x: 0, y: 30, z: 6, ry: -0.3, dress: 0x24264a, hat: 0x1a1a1a, colors: { shirt: 0x24264a, legs: 0x1a1a22, hair: 0x2a1a10, skin: 0xf0d0b8 }, from: 5 });
		const nl = nanny.userData.limbs;
		nl.armR.rotation.z = 2.95;
		nl.armL.rotation.z = -0.25;
		k.sphere(0.07, 0xd02030, { x: 0.15, y: 0.18, z: 0.15, parent: nl.head });
		const umb = k.group({ y: -0.7, parent: nl.armR });
		k.cyl(0.02, 0.02, 1.3, 0x2a2a2a, { y: -0.55, parent: umb });
		k.cone(1.25, 0.55, 0x141418, { y: -1.25, rx: PI, seg: 8, parent: umb });
		k.sphere(0.07, 0x3a9a3a, { y: 0.1, parent: umb });
		k.cone(0.03, 0.08, 0xe8c030, { y: 0.1, z: 0.08, rx: PI / 2, parent: umb });
		const bag = k.group({ y: -0.75, parent: nl.armL });
		const bagTex = k.canvas(128, 128, (g) => {
			g.fillStyle = "#7a2a2a";
			g.fillRect(0, 0, 128, 128);
			for (let i = 0; i < 40; i++) {
				g.fillStyle = ["#d8a040", "#2a5a3a", "#e8d8b0", "#4a2a5a"][i % 4];
				g.beginPath();
				g.arc((i * 37) % 128, (i * 53) % 128, 5 + (i % 4) * 2, 0, PI * 2);
				g.fill();
			}
		});
		const bagMat = k.mat(0xffffff, { map: bagTex });
		k.box(0.25, 0.45, 0.6, bagMat, { y: -0.25, parent: bag });
		k.tick((t) => (nanny.position.y = 30 + Math.sin(t * 0.7) * 0.3));
		for (let i = 0; i < 16; i++) k.sphere(5 + r() * 6, 0xf4ece8, { x: -80 + r() * 160, y: 50 + r() * 16, z: -90 + r() * 70, s: [1.8, 0.6, 1], seg: 8, rings: 6, rough: 1, emissive: 0x8a7a78, glow: 0.8, from: 5 });
		// The nursery: a spoonful of sugar, a bag that holds a lamp.
		const nursery = k.group({ y: -300 });
		const paper = k.canvas(128, 128, (g) => {
			g.fillStyle = "#e8d8c0";
			g.fillRect(0, 0, 128, 128);
			for (let i = 0; i < 4; i++) {
				g.fillStyle = "#c89090";
				g.fillRect(i * 32, 0, 10, 128);
				g.fillStyle = "#8aa880";
				for (let j = 0; j < 4; j++) {
					g.beginPath();
					g.arc(i * 32 + 22, j * 32 + 16, 4, 0, PI * 2);
					g.fill();
				}
			}
		});
		paper.wrapS = paper.wrapT = T.RepeatWrapping;
		paper.repeat.set(6, 3);
		k.box(24, 0.2, 16, 0x6a4a30, { y: -0.1, parent: nursery });
		k.plane(24, 9, k.mat(0xffffff, { map: paper }), { y: 4.5, z: -4, parent: nursery });
		k.box(3, 0.12, 1.8, 0x7a5030, { y: 1.0, parent: nursery });
		[-1.4, 1.4].forEach((x) => [-0.8, 0.8].forEach((z) => k.box(0.1, 1, 0.1, 0x6a4028, { x, y: 0.5, z, parent: nursery })));
		k.box(0.04, 0.012, 0.32, 0xd8d8e0, { x: 0.05, y: 1.075, z: 0.32, parent: nursery, metal: 0.9, rough: 0.2 });
		k.sphere(1, 0xd8d8e0, { x: 0.05, y: 1.09, z: 0.1, s: [0.07, 0.025, 0.1], parent: nursery, metal: 0.9, rough: 0.2 });
		[[0.03, 0.1], [0.07, 0.12], [0.05, 0.07]].forEach(([x, z], i) => k.box(0.035, 0.035, 0.035, 0xffffff, { x: x, y: 1.125 + (i === 2 ? 0.03 : 0), z, ry: i, parent: nursery, emissive: 0x404040 }));
		k.cyl(0.11, 0.11, 0.34, 0x6a3a1a, { x: -0.45, y: 1.23, z: -0.1, parent: nursery, rough: 0.2, opacity: 0.85 });
		k.cyl(0.04, 0.06, 0.1, 0x6a3a1a, { x: -0.45, y: 1.45, z: -0.1, parent: nursery, rough: 0.2 });
		k.cyl(0.035, 0.035, 0.06, 0xc8a070, { x: -0.45, y: 1.53, z: -0.1, parent: nursery });
		k.cyl(0.14, 0.1, 0.14, 0xf0f0f0, { x: 0.5, y: 1.13, z: -0.3, parent: nursery, seg: 14 });
		k.point(0xffe0b0, 4, 10, { x: 1, y: 3, z: 2, parent: nursery });
		k.spot(0xfff0d8, 25, { x: 1, y: -296, z: 2, target: [0, -299, 0], angle: 0.4 });
		const cbag = k.group({ x: 6, y: 0, z: 0, ry: -0.3, parent: nursery });
		k.box(1.0, 0.7, 0.5, bagMat, { y: 0.35, parent: cbag });
		k.box(0.9, 0.04, 0.4, 0x1a1008, { y: 0.71, parent: cbag });
		[-0.22, 0.22].forEach((z) => k.box(1.04, 0.06, 0.06, 0x3a2a1a, { y: 0.72, z, parent: cbag, metal: 0.5 }));
		k.cyl(0.03, 0.03, 2.2, 0xc8a040, { y: 1.8, parent: cbag, metal: 0.8, rough: 0.3 });
		k.cone(0.45, 0.5, 0xf4e0b8, { y: 2.95, parent: cbag, emissive: 0xffc070, glow: 0.6, seg: 10 });
		for (let i = 0; i < 16; i++) k.box(0.03, 0.12, 0.03, 0xc87a3a, { x: Math.cos(i * 0.39) * 0.44, y: 2.66, z: Math.sin(i * 0.39) * 0.44, parent: cbag });
		k.glow(0xffd8a0, 1.4, { y: 2.65, parent: cbag });
		k.point(0xffd090, 4, 6, { y: 2.5, z: 0.5, parent: cbag });
		// Toys left out on the nursery floor.
		const toys = k.group({ x: -6, y: 0, z: -2, parent: nursery });
		const sold = k.group({ x: 0.2, z: 0.3, ry: 0.4, parent: toys });
		k.cyl(0.06, 0.06, 0.2, 0x1a2a5a, { y: 0.1, parent: sold });
		k.cyl(0.065, 0.06, 0.18, 0xc02a2a, { y: 0.29, parent: sold });
		k.sphere(0.05, 0xf0d0b0, { y: 0.43, parent: sold });
		k.cyl(0.045, 0.05, 0.14, 0x1a1a1a, { y: 0.54, parent: sold });
		k.cyl(0.01, 0.01, 0.4, 0x8a8a8a, { x: 0.08, y: 0.32, parent: sold, metal: 0.7 });
		[[-0.3, 0.06, 0.5, 0.2, 0xd8a030], [-0.12, 0.06, 0.62, -0.3, 0x3a7a4a], [-0.22, 0.18, 0.56, 0.6, 0x3a5ab0]].forEach(([x, y, z, ry, c]) => k.box(0.12, 0.12, 0.12, c, { x, y, z, ry, parent: toys }));
		k.cone(0.12, 0.2, 0xc04a30, { x: 0.55, y: 0.12, z: 0.6, rx: PI, parent: toys, seg: 8 });
		k.cyl(0.015, 0.015, 0.08, 0x6a4a2a, { x: 0.55, y: 0.26, z: 0.6, parent: toys });
		k.box(0.5, 0.3, 0.35, 0x7a5a3a, { x: -0.6, y: 0.15, z: -0.4, ry: 0.3, parent: toys });
		k.box(0.52, 0.04, 0.37, 0x8a6a4a, { x: -0.6, y: 0.32, z: -0.4, ry: 0.3, parent: toys });
		k.point(0xffe8c8, 3, 6, { x: 0.8, y: 1.5, z: 1.5, parent: toys });
		// The cathedral steps: the bird woman, her crumbs and the pigeons.
		const steps = k.group({ x: 200, y: -300 });
		const portland = 0xd8d2c4;
		k.box(120, 0.2, 120, 0x8a867c, { y: -0.1, parent: steps });
		for (let i = 0; i < 9; i++) k.box(60, 0.3, 1.0, i % 2 ? 0xccc6b8 : portland, { y: 0.15 + i * 0.3, z: -i * 0.9, parent: steps, rough: 1 });
		k.box(60, 2.7, 10, portland, { y: 1.35, z: -13, parent: steps });
		for (let i = 0; i < 8; i++) {
			const x = -14 + i * 4;
			k.cyl(0.85, 0.95, 16, 0xe4dece, { x, y: 10.7, z: -10.5, seg: 14, parent: steps });
			k.box(2.2, 0.8, 2.2, portland, { x, y: 3.1, z: -10.5, parent: steps });
			k.box(2.2, 0.8, 2.2, portland, { x, y: 19.1, z: -10.5, parent: steps });
		}
		k.box(36, 3, 3, portland, { y: 21, z: -10.5, parent: steps });
		k.box(30, 12, 0.5, 0x5a5650, { y: 9, z: -14, parent: steps });
		k.box(2.6, 5, 0.3, 0x3a2a1a, { y: 5.2, z: -13.7, parent: steps });
		const crone = k.person({ x: 0.4, y: 1.6, z: -6.0, ry: 0.15, pose: "sit", dress: 0x2a2826, coat: 0x3a3632, colors: { shirt: 0x3a3632, legs: 0x2a2826, skin: 0xd8b8a0, hair: 0xb8b4ac }, parent: steps });
		k.sphere(0.24, 0x2a2420, { y: 0.07, z: -0.09, s: [1.12, 1.05, 0.9], parent: crone.userData.limbs.head });
		k.cyl(0.02, 0.36, 0.5, 0x2a2420, { y: 1.2, z: 0, parent: crone });
		crone.userData.limbs.armR.rotation.x = -0.9;
		crone.userData.limbs.armR.rotation.z = 0.3;
		k.cyl(0.3, 0.24, 0.32, 0x8a6a3a, { x: -0.5, y: 2.56, z: -6.0, parent: steps, seg: 10 });
		for (let i = 0; i < 6; i++) k.box(0.12, 0.18, 0.08, 0xd8c8a0, { x: -0.62 + (i % 3) * 0.12, y: 2.8, z: -6.05 + Math.floor(i / 3) * 0.12, ry: i, parent: steps });
		const pg = birdGeo(T, false);
		const pf = birdGeo(T, true);
		const pigeons = [];
		for (let i = 0; i < 70; i++) {
			const row = Math.floor(r() * 8);
			const x = (r() - 0.5) * 9 + 0.4;
			const z = -row * 0.9 + 0.2 + r() * 0.3;
			if (Math.abs(x - 0.4) < 0.7 && row >= 5) continue;
			pigeons.push([x, 0.3 + row * 0.3, z, r() * 6, 0.8 + r() * 0.3]);
		}
		instanced(k, pg, 0x8a8e9a, pigeons, { parent: steps });
		const fly = [];
		for (let i = 0; i < 14; i++) fly.push([-3 + r() * 7, 3 + r() * 3, -4 + r() * 4, r() * 6, 0.8, 0, (r() - 0.5) * 0.6]);
		instanced(k, pf, 0x7a7e8a, fly, { parent: steps });
		k.point(0xe8ecf4, 10, 30, { x: 3, y: 6, z: 6, parent: steps, decay: 0.8 });
		k.spot(0xfff4e8, 30, { x: 205, y: -290, z: 6, target: [200.4, -298, -5], angle: 0.5, distance: 40 });
		return {
			shots: [
				{ pos: [-5.0, -299.1, -0.2], look: [-6.1, -299.75, -1.9], fov: 45, fog: [0x3a2a20, 2, 30] },
				{ pos: [-12, 4, 82], look: [-30, 13, 48], fov: 50 },
				{ pos: [-2, 1.6, 112], look: [6, 20, 150], fov: 55 },
				{ pos: [202.2, -297.2, 0.2], look: [200.3, -297.0, -6.0], fov: 55, fog: [0xa8acb4, 12, 60] },
				{ pos: [2, 15.4, 12], look: [-6, 15, -10], fov: 50 },
				{ pos: [4.4, 31.6, 13.5], look: [0, 31.2, 5], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the desert
	r44: (k) => {
		k.fog(0xf0d8b0, 140, 700);
		k.sky(0x3a7ad0, 0xf2dcb0, { offset: -0.02 });
		k.light({ sky: 0xfff0d8, ground: 0xa07040, hemi: 1.25, sunColor: 0xfff0d0, sunIntensity: 2.5, sunPos: [40, 60, 50], shadowSize: 60 });
		const sm = (a, b, v) => {
			const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
			return t * t * (3 - 2 * t);
		};
		const ridge = (z) => 11 * Math.exp(-((z + 120) ** 2) / 260);
		const H = (x, z) => (4 * Math.sin(x * 0.02 + Math.sin(z * 0.013) * 2) + 3 * Math.cos(z * 0.017 + x * 0.005) + 3) * sm(12, 50, Math.abs(z)) + ridge(z);
		k.ground(1200, 0xe2b272, { bump: 0, seg: 160, height: H });
		const r = rng(44);
		const T = k.THREE;
		// The railway, and the train they blew up.
		[-0.75, 0.75].forEach((z) => k.box(300, 0.15, 0.12, 0x5a4a40, { y: 0.25, z, metal: 0.6 }));
		const sleepers = [];
		for (let i = 0; i < 200; i++) sleepers.push([-150 + i * 1.5, 0.1, 0, r() * 0.1 - 0.05 + PI / 2, 1]);
		instanced(k, new T.BoxGeometry(0.3, 0.15, 2.4), 0x5a3a24, sleepers.map(([x, y, z]) => [x, y, z, 0, 1]));
		const loco = k.group({ x: 28, y: 0, z: 3.4, ry: 0.25, rx: 0.55 });
		k.cyl(1.2, 1.2, 7, 0x2a2826, { x: 1, y: 2.3, rz: PI / 2, parent: loco, metal: 0.4 });
		k.box(2.8, 3, 3, 0x2a2826, { x: -3.8, y: 2.7, parent: loco });
		k.box(3.2, 0.3, 3.4, 0x1a1a1a, { x: -3.8, y: 4.3, parent: loco });
		k.cyl(0.4, 0.5, 1.6, 0x1a1a1a, { x: 3.6, y: 4.0, parent: loco });
		k.box(9, 0.6, 2.6, 0x3a2a24, { x: 0, y: 0.9, parent: loco });
		[-1.1, 1.1].forEach((z) => [-3, -1, 1, 3].forEach((x) => k.cyl(0.65, 0.65, 0.2, 0x6a2a20, { x, y: 0.65, z, rx: PI / 2, parent: loco })));
		const cars = [];
		[[13, 0, 0, 0], [-2, 0, 0, 0], [-17, 0.4, 0.06, 1.4], [-32, 0, 0.3, 0.3]].forEach(([x, rz, ry, rx]) => {
			const g = k.group({ x, z: rx ? 1.4 : 0, ry, rx });
			k.box(13, 3.2, 3, 0x7a4a2a, { y: 2.4, parent: g });
			k.box(13.4, 0.2, 3.4, 0x5a3420, { y: 4.1, parent: g });
			[-4.5, 4.5].forEach((xx) => [-1, 1].forEach((zz) => k.cyl(0.45, 0.45, 0.2, 0x2a2a2a, { x: xx, y: 0.6, z: zz, rx: PI / 2, parent: g })));
			k.box(2.4, 2.4, 0.1, 0x3a2414, { y: 2.3, z: 1.52, parent: g });
			cars.push(g);
		});
		// Lawrence, robes white, walking the roof.
		const robe = { shirt: 0xf6f2e6, legs: 0xf6f2e6, skin: 0xe0a880, hair: 0xd8b070 };
		const law = k.person({ x: -2, y: 4.2, z: 0, ry: 0.3, coat: 0xf8f4ea, sleeves: 0xf8f4ea, colors: robe, from: 5 });
		law.userData.limbs.armR.rotation.z = 0.7;
		law.userData.limbs.armL.rotation.z = -0.7;
		k.sphere(0.25, 0xf8f4ea, { y: 0.05, z: -0.08, s: [1.05, 1.05, 0.95], parent: law.userData.limbs.head });
		k.box(0.36, 0.08, 0.06, 0xd8a070, { y: -0.12, z: 0.17, parent: law.userData.limbs.head });
		k.box(0.5, 0.7, 0.06, 0xf8f4ea, { y: -0.3, z: -0.2, parent: law.userData.limbs.head });
		k.torus(0.22, 0.035, 0xc8a040, { y: 0.15, rx: PI / 2, parent: law.userData.limbs.head, metal: 0.6 });
		k.box(1.2, 1.3, 0.04, 0xf8f4ea, { y: 1.1, z: -0.3, rx: 0.4, parent: law });
		k.cyl(0.26, 0.55, 1.5, 0xfbf8f0, { y: 0.78, parent: law, seg: 12 });
		k.cyl(0.555, 0.56, 0.08, 0xd8b048, { y: 0.06, parent: law, seg: 12, metal: 0.6 });
		k.box(0.52, 0.08, 0.3, 0xd8b048, { y: 1.1, parent: law, metal: 0.6 });
		k.box(0.09, 0.32, 0.05, 0xe8c050, { x: 0.02, y: 1.0, z: 0.17, rz: 0.3, parent: law, metal: 0.8, rough: 0.3 });
		k.sphere(0.06, 0xe8c050, { x: -0.03, y: 1.17, z: 0.17, parent: law, metal: 0.8 });
		[-1, 1].forEach((sd) => k.box(0.05, 1.5, 0.7, 0xf8f4ea, { x: sd * 0.62, y: 0.95, z: -0.15, rz: sd * 0.35, parent: law }));
		k.tick((t) => (law.rotation.y = 0.3 + Math.sin(t * 0.8) * 0.15));
		[[-5.5, 5.2, 0.4], [-0.6, 6.4, -0.3], [1.8, 5.0, 0.2]].forEach(([x, z, ry], i) => {
			const p = k.person({ x, y: H(x, z) - 0.05, z, ry: PI + ry, pose: "raise", coat: [0x3a3028, 0x6a5a48, 0x2a2420][i], colors: { shirt: 0x5a4a38, legs: 0x5a4a38, skin: 0x8a5a3a, hair: 0x1a1a1a }, from: 5 });
			k.sphere(0.25, [0x3a3028, 0xd8d0c0, 0x8a2a2a][i], { y: 0.03, parent: p.userData.limbs.head });
			k.box(0.06, 1.4, 0.06, 0x2a1a10, { y: -0.9, parent: p.userData.limbs.armR });
		});
		// Bedouin, cheering, and their camels.
		for (let i = 0; i < 12; i++) {
			const x = -24 + r() * 50;
			const z = (r() > 0.5 ? 1 : -1) * (5 + r() * 9);
			const p = k.person({ x, y: H(x, z) - 0.05, z, ry: z > 0 ? PI : 0, pose: i % 3 ? "raise" : "arms-out", coat: [0x3a3028, 0x6a5a48, 0x8a7a60, 0x2a2420][i % 4], colors: { shirt: 0x5a4a38, legs: 0x5a4a38, skin: 0x8a5a3a, hair: 0x1a1a1a }, from: 3 });
			k.sphere(0.25, [0x3a3028, 0xd8d0c0, 0x8a2a2a][i % 3], { y: 0.03, parent: p.userData.limbs.head });
		}
		[[-10, 14], [8, -13], [20, 12]].forEach(([x, z], i) => camel(k, { x, y: H(x, z) - 0.05, z, ry: i * 1.7, from: 3 }));
		// The caravan along the crest.
		const caravan = [];
		for (let i = 0; i < 9; i++) {
			const x = -80 + i * 11;
			caravan.push(camel(k, { x, y: H(x, -120) - 0.1, z: -120, ry: PI / 2, from: 2 }, { colors: { shirt: i === 2 ? 0xf8f4ea : 0x3a3028, legs: 0x3a3028, skin: 0x8a5a3a, hair: 0x1a1a1a }, coat: i === 2 ? 0xf8f4ea : 0x3a3028 }));
		}
		// Sunrise (the match cut).
		k.disc(0xffe8a0, 150, { x: 0, y: 2, z: -820, from: 1, until: 1 });
		k.glow(0xffa040, 600, { x: 0, y: 10, z: -800, opacity: 0.7, from: 1, until: 1 });
		// A motorcycle on its side in a green English lane.
		const lane = k.group({ y: -300 });
		k.box(300, 1, 300, 0x5a7a3a, { y: -0.5, parent: lane });
		k.box(4, 0.06, 300, 0x8a8478, { y: 0.03, parent: lane, rough: 1 });
		const hedge = merge(T, [[new T.IcosahedronGeometry(1.4, 0), mtx(T, [0, 1, 0], [0, 0, 0], [1, 0.9, 1])]]);
		const hedges = [];
		for (let i = 0; i < 70; i++) [-1, 1].forEach((sd) => hedges.push([sd * (3.4 + r() * 0.6), 0, -60 + i * 1.6 + r() * 0.5, r() * 6, 0.9 + r() * 0.4]));
		instanced(k, hedge, 0x3a6a2a, hedges, { parent: lane });
		for (let i = 0; i < 10; i++) {
			const x = (i % 2 ? 1 : -1) * (9 + r() * 10);
			const z = -50 + i * 9 + r() * 4;
			k.cyl(0.3, 0.45, 5, 0x4a3a28, { x, y: 2.5, z, parent: lane });
			k.ico(3.5 + r() * 1.5, 0x3a6a2a, { x, y: 7, z, parent: lane, s: [1, 0.85, 1] });
		}
		const bike = k.group({ x: 0.6, y: 0.1, z: 1, ry: 0.9, rz: PI / 2, parent: lane });
		[-0.75, 0.75].forEach((z) => {
			k.torus(0.32, 0.07, 0x1a1a1a, { z, ry: PI / 2, parent: bike, seg: 16 });
			k.cyl(0.05, 0.05, 0.2, 0x8a8a8a, { z, rz: PI / 2, parent: bike, metal: 0.8 });
		});
		k.box(0.22, 0.24, 0.6, 0x2a2a2e, { y: 0.45, z: 0.15, parent: bike, metal: 0.5, rough: 0.3 });
		k.box(0.2, 0.08, 0.36, 0x3a2418, { y: 0.48, z: -0.35, parent: bike });
		k.box(0.24, 0.26, 0.3, 0x5a5a5e, { y: 0.15, z: 0.0, parent: bike, metal: 0.7 });
		line(k, [0, 0.4, 0.4], [0, 0, 0.75], 0x6a6a6a, 0.025, { parent: bike });
		line(k, [0, 0.4, -0.15], [0, 0, -0.75], 0x6a6a6a, 0.025, { parent: bike });
		k.box(0.6, 0.03, 0.03, 0x8a8a8a, { x: 0.25, y: 0.58, z: 0.45, parent: bike, metal: 0.8 });
		k.cyl(0.04, 0.05, 0.6, 0x8a8a8a, { x: 0.12, y: 0.1, z: -0.45, rx: PI / 2, parent: bike, metal: 0.8 });
		const gog = k.group({ x: -0.7, y: 0.04, z: 2.0, ry: 0.4, parent: lane });
		[-0.07, 0.07].forEach((x) => k.torus(0.05, 0.015, 0x6a4a2a, { x, rx: PI / 2, parent: gog }));
		k.torus(0.12, 0.008, 0x3a2a1a, { rx: PI / 2, z: -0.05, s: [1, 0.6, 1], parent: gog });
		k.point(0xfff4e0, 4, 30, { x: 3, y: 5, z: 6, parent: lane, decay: 0.8 });
		// A well in the open desert, and a black rider out of the mirage.
		const pan = k.group({ y: -600 });
		k.ground(800, 0xe2b272, { parent: pan, bump: 0, seg: 80, height: (x, z) => (z < -60 ? 0 : 0) + Math.max(0, -z - 200) * 0.03 + Math.sin(x * 0.03) * Math.max(0, -z - 150) * 0.01 });
		k.cyl(1.5, 1.6, 0.6, 0x9a7a52, { y: 0.3, parent: pan, seg: 12, rough: 1 });
		k.cyl(1.25, 1.25, 0.02, 0x1a1408, { y: 0.61, parent: pan, seg: 12 });
		for (let i = 0; i < 10; i++) k.ico(0.35, 0x8a6a48, { x: Math.cos(i * 0.63) * 1.6, y: 0.65, z: Math.sin(i * 0.63) * 1.6, parent: pan, rough: 1 });
		k.box(0.12, 0.6, 0.12, 0x5a4028, { x: 1.9, y: 0.9, z: 0.4, rz: 0.4, parent: pan });
		k.cyl(0.18, 0.15, 0.3, 0x6a4a2a, { x: 1.2, y: 0.15, z: 1.6, rz: PI / 2, parent: pan });
		const kneel = camel(k, { x: -4, y: -1.3, z: 2, ry: 2.2, parent: pan });
		void kneel;
		const bedu = { coat: 0x8a7a60, colors: { shirt: 0x8a7a60, legs: 0x8a7a60, skin: 0xc89070, hair: 0xe8e0d0 } };
		const lw = k.person({ x: 1.4, y: 0, z: -0.6, ry: PI - 0.15, parent: pan, ...bedu, colors: { ...bedu.colors, skin: 0xe0a880 } });
		k.sphere(0.25, 0xe8e0d0, { y: 0.03, parent: lw.userData.limbs.head });
		k.box(0.48, 0.55, 0.05, 0xe8e0d0, { y: -0.25, z: -0.2, parent: lw.userData.limbs.head });
		lw.userData.limbs.armR.rotation.x = -2.6;
		const rider = camel(k, { z: -40, ry: 0, color: 0x2a2018, parent: pan }, { colors: { shirt: 0x0a0908, legs: 0x0a0908, skin: 0x3a2418, hair: 0x0a0908 }, coat: 0x0a0908 });
		k.sphere(0.27, 0x0a0908, { y: 0.03, parent: rider.children[rider.children.length - 1].userData.limbs.head });
		for (let i = 0; i < 8; i++) k.box(140, 0.05, 0.6, 0xfff4e0, { y: 0.3 + i * 0.25, z: -70 - i * 3, parent: pan, emissive: 0xfff0d0, glow: 0.8, opacity: 0.18, shadow: false });
		k.glow(0xfff0d0, 30, { y: 1.5, z: -60, parent: pan, opacity: 0.4 });
		k.tick((t) => {
			rider.position.z = -46 + ((t * 1.0) % 8);
			rider.position.y = Math.sin(t * 6) * 0.15;
		});
		k.point(0xfff0d0, 6, 60, { x: 6, y: 10, z: 8, parent: pan, decay: 0.8 });
		return {
			shots: [
				{ pos: [-1.0, -298.6, 3.6], look: [0.5, -299.75, 1.0], fov: 45, fog: [0xc8d4d0, 20, 90] },
				{ pos: [0, H(0, -180) + 4, -180], look: [0, 12, -800], fov: 40, fog: [0xe8803a, 60, 1150], exposure: 0.95 },
				{ pos: [-20, H(-20, -88) + 1.4, -88], look: [-40, H(-40, -120) + 4, -120], fov: 50 },
				{ pos: [16, 11, 46], look: [2, 2.5, 0], fov: 50 },
				{ pos: [3.6, -597.9, 4.2], look: [-0.6, -597.6, -40], fov: 34, fog: [0xf0d8b0, 60, 500], hide: [] },
				{ pos: [3, 4.4, 10.5], look: [-1.6, 5.2, 0], fov: 34, filter: "saturate(1.15)" },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the crop duster
	r45: (k) => {
		k.fog(0xe0dcc8, 90, 650);
		k.sky(0x4a8ad8, 0xece4cc, { offset: -0.02 });
		k.light({ sky: 0xfff8e8, ground: 0x8a7040, hemi: 1.25, sunColor: 0xfff4e0, sunIntensity: 2.5, sunPos: [30, 70, 40], shadowSize: 70 });
		k.ground(1000, 0xc8aa6a, { bump: 0.15, seg: 40 });
		const r = rng(45);
		const T = k.THREE;
		const furrows = k.canvas(64, 64, (g) => {
			g.fillStyle = "#8a6a44";
			g.fillRect(0, 0, 64, 64);
			g.fillStyle = "#6a5034";
			for (let i = 0; i < 8; i++) g.fillRect(0, i * 8, 64, 3);
		});
		furrows.wrapS = furrows.wrapT = T.RepeatWrapping;
		furrows.repeat.set(1, 12);
		[[-60, -60, 70, 80], [70, 70, 60, 90], [-80, 90, 60, 70]].forEach(([x, z, w, d]) => k.plane(w, d, k.mat(0xffffff, { map: furrows }), { x, y: 0.15, z, rx: -PI / 2 }));
		// The highway.
		k.box(8, 0.1, 1000, 0x6a6a68, { y: 0.06 });
		for (let i = 0; i < 100; i++) k.box(0.2, 0.02, 4, 0xe8d8a0, { y: 0.12, z: -495 + i * 10 });
		// The bus stop sign.
		k.cyl(0.05, 0.05, 2.4, 0x6a6a6a, { x: 5, y: 1.2, z: 4 });
		k.box(0.9, 0.5, 0.04, 0xf0f0e8, { x: 5, y: 2.3, z: 4 });
		k.box(0.94, 0.04, 0.05, 0x2a2a2a, { x: 5, y: 2.05, z: 4 });
		// The cornfield.
		const stalk = merge(T, [
			[new T.CylinderGeometry(0.05, 0.07, 2.4, 4), mtx(T, [0, 1.2, 0])],
			[new T.ConeGeometry(0.35, 0.8, 4), mtx(T, [0, 2.4, 0])],
			[new T.BoxGeometry(0.7, 0.03, 0.12), mtx(T, [0.2, 1.4, 0], [0, 0, -0.4])],
		]);
		const corn = [];
		for (let x = 20; x < 70; x += 1.6) for (let z = -70; z < -10; z += 1.4) corn.push([x + r() * 0.3, 0, z, r() * 6, 0.9 + r() * 0.3]);
		instanced(k, stalk, 0x7a8a3a, corn);
		// Power poles along the road.
		for (let i = 0; i < 12; i++) {
			k.cyl(0.12, 0.15, 8, 0x5a4a3a, { x: -8, y: 4, z: -220 + i * 40 });
			k.box(2, 0.15, 0.15, 0x5a4a3a, { x: -8, y: 7.6, z: -220 + i * 40 });
		}
		// The crop duster: dusting the corn, then hunting the man.
		const spray = (g) => { for (let i = 0; i < 10; i++) k.glow(0xf4f0e0, 3 + i * 0.6, { y: -1.4 - i * 0.1, z: -2 - i * 1.6, parent: g, opacity: 0.5 - i * 0.04 }); };
		const far = biplane(k, { x: 45, y: 6, z: -40, ry: -PI / 2, rz: 0.2, from: 3, until: 3 });
		spray(far);
		const hunt = biplane(k, { x: -39, y: 3.4, z: 20, ry: PI / 2, rx: 0.08, from: 5 });
		k.tick((t) => {
			far.position.z = -40 + Math.sin(t * 0.4) * 8;
			hunt.position.y = 3.4 + Math.sin(t * 1.2) * 0.15;
		});
		// The man in the grey suit.
		const man = k.person({ x: -29, y: 0, z: 20, ry: PI / 2, pose: "run", colors: { shirt: 0x8a8c8e, legs: 0x8a8c8e, hair: 0x6a6a6a, skin: 0xd8a888 }, from: 5 });
		k.box(0.18, 0.4, 0.02, 0xf4f4f0, { y: 1.35, z: 0.145, parent: man });
		k.box(0.06, 0.32, 0.02, 0x3a3a50, { y: 1.33, z: 0.16, parent: man });
		k.tick((t) => {
			const l = man.userData.limbs;
			l.legL.rotation.x = Math.sin(t * 9) * 0.8;
			l.legR.rotation.x = -Math.sin(t * 9) * 0.8;
			l.armL.rotation.x = -Math.sin(t * 9) * 0.9;
			l.armR.rotation.x = Math.sin(t * 9) * 0.9;
			l.head.rotation.y = -0.9;
		});
		k.box(2.6, 2.6, 9, 0xd8d0c0, { x: 2, y: 1.8, z: -120, from: 5 });
		k.cyl(1.2, 1.2, 6, 0xe8e0d0, { x: 2, y: 2.4, z: -127, rx: PI / 2, from: 5 });
		// The mountain of presidents.
		const rush = k.group({ y: -400 });
		k.box(600, 1, 600, 0x6a7a4a, { y: -0.5, parent: rush });
		for (let i = 0; i < 22; i++) k.ico(14 + r() * 12, 0xb0a898, { x: -70 + r() * 140, y: 10 + r() * 28, z: -55 - r() * 30, parent: rush, ry: r() * 6, rough: 1 });
		for (let i = 0; i < 26; i++) k.ico(2 + r() * 3, 0xa8a090, { x: -40 + r() * 80, y: 1 + r() * 3, z: -4 - r() * 12, parent: rush, rough: 1 });
		const head = (x, y, z, s, ry, beard) => {
			const g = k.group({ x, y, z, ry, parent: rush, s });
			const c = 0xd2cabc;
			k.ico(6, c, { detail: 1, s: [0.82, 1.1, 0.85], parent: g, rough: 1 });
			k.box(1.6, 3.4, 2.4, c, { y: -0.6, z: 4.6, rx: -0.15, parent: g });
			k.box(6, 1.1, 1.4, c, { y: 1.8, z: 4.2, parent: g });
			[-1.7, 1.7].forEach((xx) => k.sphere(0.85, 0x7a7466, { x: xx, y: 0.8, z: 4.5, parent: g }));
			k.box(2.6, 0.4, 0.8, 0x8a8476, { y: -3.1, z: 4.4, parent: g });
			k.box(3.6, 2.4, 2.6, beard ? 0xbab2a4 : c, { y: -4.5, z: 3.4, parent: g });
		};
		head(-30, 36, -22, 1.7, 0.2);
		head(-11, 35, -28, 1.55, 0.35);
		head(4, 33, -33, 1.45, -0.1);
		head(22, 33, -24, 1.65, -0.2, true);
		k.person({ x: 21.6, y: 16.6, z: -15.4, s: 0.5, pose: "raise", colors: { shirt: 0x8a8c8e, legs: 0x8a8c8e }, parent: rush });
		k.person({ x: 20.2, y: 16.2, z: -15.8, s: 0.5, dress: 0xd8d0b0, colors: { shirt: 0xd8d0b0, hair: 0xd8b060 }, parent: rush });
		const pines = [];
		for (let i = 0; i < 160; i++) pines.push([-120 + r() * 240, 0, -10 - r() * 80 + (r() > 0.5 ? 0 : 50), r() * 6, 1 + r()]);
		instanced(k, merge(T, [[new T.CylinderGeometry(0.2, 0.3, 2, 5), mtx(T, [0, 1, 0])], [new T.ConeGeometry(1.6, 6, 6), mtx(T, [0, 4.5, 0])]]), 0x2a4a2a, pines.filter((p) => Math.abs(p[0]) > 50 || p[2] > -8), { parent: rush });
		// The cliff house at dusk.
		const cliff = k.group({ x: 300, y: -400 });
		k.box(60, 40, 60, 0x6a6458, { x: -30, y: -20, parent: cliff, rough: 1 });
		for (let i = 0; i < 8; i++) k.ico(5 + r() * 5, 0x5a5448, { x: -2 + r() * 4, y: -5 - i * 4, z: -20 + r() * 40, parent: cliff });
		k.box(800, 1, 800, 0x2a3a2a, { y: -40, parent: cliff });
		const house = k.group({ y: 0, parent: cliff });
		k.box(24, 4, 9, 0xe8e2d4, { x: 2, y: 2.4, parent: house });
		k.box(26, 0.5, 11, 0x4a4440, { x: 2, y: 4.6, parent: house });
		k.box(16, 2.6, 0.1, 0xffd890, { x: 6, y: 2.4, z: 4.52, parent: house, emissive: 0xffb050, glow: 1.0 });
		for (let i = 0; i < 6; i++) k.box(0.15, 2.8, 0.2, 0x3a3430, { x: -2 + i * 3.2, y: 2.4, z: 4.6, parent: house });
		k.box(3, 7, 3, 0x8a7a60, { x: -8, y: 3.5, parent: house });
		k.box(0.6, 12, 0.6, 0x3a3430, { x: 9, y: -4, z: 0, rz: 0.5, parent: house });
		k.point(0xffc080, 6, 30, { x: 8, y: 3, z: 7, parent: house });
		k.point(0x8aa0d8, 6, 120, { x: 30, y: 20, z: 40, parent: cliff, decay: 0.6 });
		const cpines = [];
		for (let i = 0; i < 40; i++) cpines.push([-55 + r() * 50, 0, -28 + r() * 56, r() * 6, 1.2 + r() * 0.8]);
		instanced(k, merge(T, [[new T.CylinderGeometry(0.2, 0.3, 2, 5), mtx(T, [0, 1, 0])], [new T.ConeGeometry(1.6, 6, 6), mtx(T, [0, 4.5, 0])]]), 0x1a3020, cpines.filter((p) => p[0] < -14 || Math.abs(p[2]) > 8), { parent: cliff });
		// A hotel bar table: a gin martini, an ashtray, a book of matches.
		const bar = k.group({ y: -800 });
		k.box(20, 0.2, 20, 0x2a1e18, { y: -0.1, parent: bar });
		k.box(20, 8, 0.2, 0x5a3a2a, { y: 4, z: -3, parent: bar });
		k.cyl(1.2, 1.2, 0.06, 0x3a2418, { y: 1.0, parent: bar, seg: 28, rough: 0.3 });
		k.cyl(0.1, 0.18, 0.95, 0x2a2a2a, { y: 0.5, parent: bar, metal: 0.6 });
		const glass = { opacity: 0.45, rough: 0.05, metal: 0.1 };
		k.cyl(0.08, 0.08, 0.01, 0xe8f0f0, { x: -0.25, y: 1.04, z: 0.1, parent: bar, ...glass });
		k.cyl(0.008, 0.008, 0.18, 0xe8f0f0, { x: -0.25, y: 1.13, z: 0.1, parent: bar, ...glass });
		k.cone(0.14, 0.16, 0xe8f0f0, { x: -0.25, y: 1.28, z: 0.1, rx: PI, parent: bar, ...glass, seg: 16 });
		k.cone(0.11, 0.12, 0xf0ecd0, { x: -0.25, y: 1.3, z: 0.1, rx: PI, parent: bar, opacity: 0.6, seg: 16 });
		k.sphere(0.025, 0x6a8a2a, { x: -0.23, y: 1.3, z: 0.1, parent: bar });
		k.cyl(0.004, 0.004, 0.2, 0xd8d0b0, { x: -0.22, y: 1.33, z: 0.1, rz: 0.4, parent: bar });
		k.cyl(0.15, 0.13, 0.04, 0x8a8a90, { x: 0.35, y: 1.05, z: -0.3, parent: bar, metal: 0.8, rough: 0.3 });
		k.cyl(0.008, 0.008, 0.16, 0xf0ece0, { x: 0.38, y: 1.08, z: -0.28, rz: PI / 2, ry: 0.5, parent: bar });
		k.box(0.18, 0.015, 0.1, 0xf0ece4, { x: 0.25, y: 1.04, z: 0.25, ry: -0.3, parent: bar });
		k.box(0.08, 0.016, 0.1, 0x8a2a2a, { x: 0.21, y: 1.041, z: 0.25, ry: -0.3, parent: bar });
		k.box(0.5, 0.01, 0.35, 0xe8e2d0, { x: 0.05, y: 1.035, z: 0.5, ry: 0.2, parent: bar });
		k.point(0xffd8a0, 5, 10, { x: 1, y: 3, z: 1.5, parent: bar });
		k.spot(0xffe8c8, 20, { x: 0.5, y: -796, z: 1.5, target: [0, -799, 0], angle: 0.4 });
		return {
			shots: [
				{ pos: [0.5, -798.3, 1.5], look: [-0.05, -798.85, 0.1], fov: 45, fog: [0x1e1410, 3, 20] },
				{ pos: [7.5, 1.0, 8.5], look: [4.6, 2.0, 3.0], fov: 50 },
				{ pos: [330, -412, 34], look: [302, -399, 0], fov: 50, fog: [0x3a4462, 40, 260], exposure: 1.3 },
				{ pos: [10, 2.2, 12], look: [44, 5, -40], fov: 40 },
				{ pos: [2, -380, 52], look: [-2, -368, -26], fov: 55, fog: [0xa8c8e8, 120, 500] },
				{ pos: [-20, 1.0, 22.5], look: [-32, 2.6, 19.5], fov: 50 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the bay
	r46: (k) => {
		k.fog(0xa8b2b2, 70, 420);
		k.sky(0x6a7880, 0xd4d8d0);
		k.light({ sky: 0xe8eef0, ground: 0x4a5040, hemi: 1.5, sunColor: 0xf0f0e8, sunIntensity: 1.3, sunPos: [40, 60, 30], shadowSize: 80, sunTarget: [70, 0, 20] });
		const H = (x, z) => {
			if (x < -210) return -3 + Math.min(14, (-210 - x) * 0.3);
			if (x < -40) return -3;
			if (x < -25) return -3 + (x + 40) * (5 / 15);
			return 2 + Math.max(0, x - 140) * 0.3 + Math.max(0, Math.abs(z) - 160) * 0.2;
		};
		k.ground(800, 0x6a7a4a, { bump: 0, seg: 160, height: H });
		k.water(800, 0x4a6a78, { y: 0, seg: 60, amp: 0.15 });
		const r = rng(46);
		const T = k.THREE;
		const perched = birdGeo(T, false);
		const flying = birdGeo(T, true);
		const crow = 0x141618;
		// Far shore: a fishing town.
		for (let i = 0; i < 18; i++) {
			const z = -120 + i * 14 + r() * 4;
			const x = -228 - r() * 20;
			const h = 4 + r() * 4;
			k.box(6, h, 7, [0xe8e4d8, 0xd8c8a8, 0xa8b8c0][i % 3], { x, y: H(x, z) + h / 2 - 0.5, z });
		}
		// The school, the jungle gym, the bench.
		const school = k.group({ x: 40, y: 2, z: -46 });
		k.box(12, 6, 14, 0xece8e0, { y: 3, parent: school });
		roof(k, 14, 12.6, 4, 0x5a4a44, { y: 6, parent: k.group({ ry: PI / 2, parent: school }) });
		k.box(2, 3, 2, 0xece8e0, { y: 11, z: 5, parent: school });
		k.cone(1.8, 2, 0x5a4a44, { y: 13.5, z: 5, seg: 4, ry: PI / 4, parent: school });
		k.box(1.6, 2.6, 0.1, 0x6a3a2a, { y: 1.3, z: 7.02, parent: school });
		for (let i = 0; i < 2; i++) k.box(2, 2, 0.1, 0x3a4a5a, { x: -3.5 + i * 7, y: 3.2, z: 7.02, parent: school });
		const gym = { x: 40, z: -26 };
		const bars = [];
		const pipe = 0x7a7c80;
		for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) k.cyl(0.06, 0.06, 2.6, pipe, { x: gym.x - 3 + i * 2, y: 3.3, z: gym.z - 2 + j * 2 });
		[1.3, 2.6].forEach((h) => {
			for (let j = 0; j < 3; j++) {
				k.cyl(0.05, 0.05, 6, pipe, { x: gym.x, y: 2 + h, z: gym.z - 2 + j * 2, rz: PI / 2 });
				for (let s = 0; s < 6; s++) bars.push([gym.x - 2.8 + s + r() * 0.4, 2 + h + 0.04, gym.z - 2 + j * 2, (r() - 0.5) * 1.5 + 0.3, 0.9 + r() * 0.25]);
			}
			for (let i = 0; i < 4; i++) k.cyl(0.05, 0.05, 4, pipe, { x: gym.x - 3 + i * 2, y: 2 + h, z: gym.z, rx: PI / 2 });
		});
		k.mesh(perched, k.mat(crow), { x: gym.x + 1.1, y: 4.64, z: gym.z, ry: 0.4, s: 1.1, from: 4 });
		instanced(k, perched, crow, bars, { from: 4 });
		k.box(3, 0.12, 0.8, 0x6a5a48, { x: 38, y: 2.5, z: -12 });
		[-1.3, 1.3].forEach((x) => k.box(0.1, 0.5, 0.7, 0x4a4a4a, { x: 38 + x, y: 2.25, z: -12 }));
		const suit = { shirt: 0x7a8a5a, legs: 0xe0c0a0, hair: 0xe8d098, skin: 0xf0d0b8 };
		const mel = k.person({ x: 38, y: 1.75, z: -12.05, pose: "sit", dress: 0x7a8a5a, colors: suit, from: 4 });
		k.sphere(0.12, 0xe8d098, { y: 0.12, z: -0.2, parent: mel.userData.limbs.head });
		mel.userData.limbs.armR.rotation.x = -1.9;
		k.cyl(0.012, 0.012, 0.14, 0xffffff, { x: 0.4, y: 1.85, z: 0.35, rx: PI / 2, parent: mel });
		k.glow(0xd8d8d8, 0.6, { x: 0.4, y: 2.05, z: 0.45, parent: mel, opacity: 0.4 });
		// Crows gathering on wires and roofs.
		const poles = [];
		for (let i = 0; i < 10; i++) {
			const x = -10 + i * 22;
			k.cyl(0.15, 0.2, 9, 0x5a4a3a, { x, y: 6.5, z: 20 });
			k.box(2.4, 0.15, 0.15, 0x5a4a3a, { x, y: 10.4, z: 20 });
			poles.push(x);
		}
		[-1, 1].forEach((d) => line(k, [poles[0], 10.5, 20 + d * 0], [poles[9], 10.5, 20], 0x1a1a1a, 0.025, { x: 0 }));
		[-1.1, 1.1].forEach((dx) => {
			for (let i = 0; i < 9; i++) line(k, [poles[i] + dx, 10.5, 20], [poles[i + 1] + dx, 10.5, 20], 0x1a1a1a, 0.025);
		});
		// The farmhouse.
		const farm = k.group({ x: 100, y: 2, z: 42 });
		k.box(14, 9, 10, 0xf0ece4, { y: 4.5, parent: farm });
		roof(k, 14.6, 10.8, 4, 0x4a4440, { y: 9, parent: farm });
		k.box(14, 0.3, 4, 0xe0dcd4, { y: 0.15, z: 7, parent: farm });
		k.box(14, 0.25, 4.2, 0x5a5048, { y: 3.4, z: 7, parent: farm });
		for (let i = 0; i < 4; i++) k.box(0.2, 3.2, 0.2, 0xf0ece4, { x: -6.5 + i * 4.3, y: 1.7, z: 8.9, parent: farm });
		for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) k.box(1.4, 1.8, 0.1, 0x2a3440, { x: -4 + i * 4, y: 2 + row * 4, z: 5.03, parent: farm });
		k.box(2, 5, 2, 0x8a6a5a, { x: 4, y: 10, parent: farm });
		k.box(30, 1.1, 0.1, 0xe8e4dc, { x: 90, y: 2.55, z: 58 });
		for (let i = 0; i < 11; i++) k.box(0.15, 1.3, 0.15, 0xe8e4dc, { x: 75 + i * 3, y: 2.65, z: 58 });
		// The car, creeping away through the birds.
		const car = k.group({ x: 100, y: 2, z: 75.6, ry: -1.77, from: 5 });
		k.box(1.8, 0.7, 4.2, 0x7a8a80, { y: 0.65, parent: car, metal: 0.4, rough: 0.4 });
		k.box(1.6, 0.6, 1.8, 0x5a6a62, { y: 1.25, z: -0.5, parent: car, metal: 0.3 });
		k.box(1.5, 0.5, 0.06, 0x2a3440, { y: 1.25, z: 0.42, rx: -0.4, parent: car });
		[-0.85, 0.85].forEach((x) => [-1.3, 1.3].forEach((z) => k.cyl(0.35, 0.35, 0.25, 0x111111, { x, y: 0.35, z, rz: PI / 2, parent: car })));
		[-0.6, 0.6].forEach((x) => k.glow(0xfff0c0, 0.7, { x, y: 0.7, z: 2.12, parent: car }));
		k.box(80, 0.06, 4, 0x6a6458, { x: 70, y: 2.03, z: 70, ry: -0.2 });
		// Birds everywhere at the end.
		const swarm = [];
		for (let i = 0; i < 2600; i++) {
			const x = 60 + r() * 80;
			const z = 25 + r() * 60;
			if (x > 91 && x < 109 && z > 35 && z < 52) continue;
			if (Math.abs(z - (70 + (x - 70) * 0.2)) < 2.6) continue;
			swarm.push([x, 2.02, z, r() * 6, 0.8 + r() * 0.4]);
		}
		for (let i = 0; i < 9; i++) for (let s = 0; s < 40; s++) swarm.push([poles[i] + s * 0.55 + r() * 0.2, 10.52, 20 + (s % 3 - 1) * 1.1, PI / 2 + (r() - 0.5), 0.9]);
		for (let s = 0; s < 60; s++) swarm.push([93.5 + s * 0.22, 2 + 9 + 4 - 0.08, 42, (r() - 0.5) * 2, 0.9]);
		for (let s = 0; s < 40; s++) swarm.push([75 + s * 0.75, 3.22, 58, PI / 2 + (r() - 0.5), 0.9]);
		instanced(k, perched, crow, swarm.filter((_, i) => i % 3), { from: 5 });
		instanced(k, perched, 0xe8e8e4, swarm.filter((_, i) => !(i % 3)), { from: 5 });
		const sky = [];
		for (let i = 0; i < 200; i++) sky.push([40 + r() * 140, 14 + r() * 40, -10 + r() * 90, r() * 6, 1.4]);
		instanced(k, flying, 0x2a2c30, sky, { from: 5 });
		k.glow(0xffe8b0, 240, { x: 300, y: 30, z: 200, tag: "sky", opacity: 0.6, from: 5 });
		// The boat across the bay.
		const boat = k.group({ x: -80, y: 0.1, z: 8, ry: PI / 2 + 0.3, from: 1 });
		k.box(1.6, 0.6, 4, 0xe8e4d8, { y: 0.1, parent: boat });
		k.cyl(0.8, 0.8, 0.6, 0xe8e4d8, { y: 0.1, z: 2.46, seg: 3, s: [1.15, 1, 1], parent: boat });
		k.box(1.62, 0.12, 4, 0x3a5a7a, { y: -0.1, parent: boat });
		k.box(0.4, 0.8, 0.4, 0x2a2a2a, { y: 0.4, z: -2.1, parent: boat });
		k.person({ y: -0.3, z: -1.2, pose: "sit", dress: 0x7a8a5a, coat: 0xa89070, colors: suit, parent: boat });
		k.tick((t) => (boat.position.y = 0.1 + Math.sin(t * 1.5) * 0.06));
		k.box(2, 0.3, 14, 0x6a5a48, { x: -32, y: 1.2, z: 6 });
		// The phone booth under attack.
		const town = k.group({ y: -300 });
		k.box(200, 0.4, 200, 0x6a6a64, { y: -0.2, parent: town });
		const booth = k.group({ parent: town });
		[-0.65, 0.65].forEach((x) => [-0.65, 0.65].forEach((z) => k.box(0.08, 2.6, 0.08, 0xe8e8e0, { x, y: 1.3, z, parent: booth })));
		k.box(1.4, 0.2, 1.4, 0xe8e8e0, { y: 2.65, parent: booth });
		k.box(1.4, 0.15, 1.4, 0xb8b8b0, { y: 0.07, parent: booth });
		k.box(1.3, 2.5, 1.3, 0xd0e8f0, { y: 1.3, parent: booth, opacity: 0.25, rough: 0.05 });
		k.box(0.3, 0.4, 0.15, 0x2a2a2a, { y: 1.6, z: -0.55, parent: booth });
		const inside = k.person({ ry: 0.4, dress: 0x7a8a5a, colors: suit, parent: booth, s: 0.95 });
		inside.userData.limbs.armR.rotation.x = -2.2;
		inside.userData.limbs.armL.rotation.x = -2.0;
		const gulls = [];
		for (let i = 0; i < 70; i++) {
			const a = r() * PI * 2;
			const d = 1.2 + r() * 6;
			gulls.push([Math.cos(a) * d, 0.8 + r() * 6, Math.sin(a) * d, a + PI / 2 + (r() - 0.5), 0.9 + r() * 0.4, (r() - 0.5) * 0.8, (r() - 0.5) * 0.6]);
		}
		instanced(k, flying, 0xf0f0ec, gulls, { parent: town });
		for (let i = 0; i < 5; i++) {
			const x = -16 + i * 8;
			k.box(6, 6, 6, [0xd8d0c0, 0xc0b8a8, 0xe8e0d0][i % 3], { x, y: 3, z: -14, parent: town });
		}
		k.ico(6, 0x1a1614, { x: 14, y: 14, z: -26, parent: town, s: [1.6, 1, 1] });
		k.ico(5, 0x2a2420, { x: 20, y: 20, z: -30, parent: town });
		k.glow(0xff8a30, 22, { x: 14, y: 4, z: -22, parent: town });
		k.point(0xff8a30, 10, 40, { x: 14, y: 4, z: -18, parent: town });
		k.point(0xe8ecf0, 4, 60, { x: 4, y: 12, z: 10, parent: town, decay: 0.5 });
		// The lovebirds in their cage.
		const cage = k.group({ x: 100, y: -300 });
		k.box(10, 0.2, 10, 0x6a4a3a, { parent: cage });
		k.cyl(0.6, 0.65, 0.12, 0xc8a040, { y: 0.16, parent: cage, metal: 0.8, rough: 0.3, seg: 20 });
		for (let i = 0; i < 18; i++) k.cyl(0.008, 0.008, 1.0, 0xd8b050, { x: Math.cos((i / 18) * PI * 2) * 0.58, y: 0.72, z: Math.sin((i / 18) * PI * 2) * 0.58, parent: cage, metal: 0.8 });
		for (let i = 0; i < 9; i++) {
			const g = k.group({ y: 1.22, ry: (i / 9) * PI, parent: cage });
			k.torus(0.58, 0.008, 0xd8b050, { parent: g, arc: PI, metal: 0.8 });
		}
		k.torus(0.08, 0.012, 0xd8b050, { y: 1.88, parent: cage, metal: 0.8 });
		k.cyl(0.015, 0.015, 1.0, 0x8a6a40, { y: 0.6, rz: PI / 2, parent: cage });
		[-0.12, 0.12].forEach((x, i) => {
			const b = k.group({ x, y: 0.62, ry: i ? -0.5 : 0.5, parent: cage });
			k.sphere(1, 0x4aa040, { y: 0.1, s: [0.07, 0.08, 0.1], parent: b });
			k.sphere(0.05, 0xe86a50, { y: 0.2, z: 0.05, parent: b });
			k.cone(0.02, 0.04, 0xe8d8a0, { y: 0.2, z: 0.1, rx: PI / 2, parent: b });
			k.box(0.04, 0.02, 0.1, 0x2a6a8a, { y: 0.05, z: -0.1, parent: b });
		});
		k.point(0xfff0d8, 3, 8, { x: 1, y: 2, z: 1.5, parent: cage });
		// A farmhouse dresser: a row of teacups on hooks, some of them broken.
		const kitchen = k.group({ x: 300, y: -300 });
		k.box(14, 0.2, 14, 0x6a5a4a, { y: -0.1, parent: kitchen });
		k.box(14, 8, 0.2, 0x8a9a82, { y: 4, z: -1.2, parent: kitchen });
		k.box(3.4, 2.6, 0.12, 0x7a5a3a, { y: 2.0, z: -1.04, parent: kitchen });
		[0.75, 1.75].forEach((y) => k.box(3.4, 0.06, 0.4, 0x6a4a30, { y, z: -0.85, parent: kitchen }));
		k.box(3.6, 0.1, 0.5, 0x6a4a30, { y: 3.3, z: -0.85, parent: kitchen });
		[-1.75, 1.75].forEach((x) => k.box(0.1, 3.4, 0.5, 0x6a4a30, { x, y: 1.7, z: -0.85, parent: kitchen }));
		const china = 0xf4f2ec;
		const rim = 0x5a7ab0;
		const cupGeo = (arc) => new T.CylinderGeometry(0.11, 0.08, 0.16, 14, 1, true, 0, arc);
		for (let i = 0; i < 7; i++) {
			const x = -1.35 + i * 0.45;
			k.box(0.02, 0.08, 0.02, 0x8a7a50, { x, y: 2.95, z: -0.9, parent: kitchen, metal: 0.8 });
			const broken = [1, 4, 5].includes(i);
			if (i === 4) continue;
			const cup = k.group({ x, y: 2.8, z: -0.85, rz: 0.06, parent: kitchen });
			k.mesh(cupGeo(broken ? PI * 1.1 : PI * 2), k.mat(china, { side: 2 }), { ry: broken ? PI * 0.45 : 0, parent: cup });
			k.cyl(0.08, 0.08, 0.01, china, { y: -0.08, parent: cup });
			if (!broken) k.torus(0.112, 0.008, rim, { y: 0.08, rx: PI / 2, parent: cup });
			k.torus(0.05, 0.012, china, { x: -0.13, y: 0.02, ry: 0, parent: cup, arc: PI, rz: PI / 2 });
		}
		for (let i = 0; i < 9; i++) k.box(0.07 + (i % 3) * 0.03, 0.01, 0.05 + (i % 2) * 0.04, i % 4 ? china : rim, { x: -0.6 + i * 0.16 + Math.sin(i * 3) * 0.05, y: 1.79, z: -0.8 + Math.cos(i * 2) * 0.1, ry: i * 0.9, parent: kitchen });
		for (let i = 0; i < 4; i++) {
			const x = -1.2 + i * 0.75;
			k.cyl(0.32, 0.32, 0.03, china, { x, y: 1.0, z: -0.98, rx: PI / 2 - 0.15, parent: kitchen, seg: 20 });
			k.torus(0.3, 0.012, rim, { x, y: 1.0, z: -0.96, rx: -0.15, parent: kitchen });
		}
		k.point(0xfff0d8, 2, 8, { x: 1, y: 3, z: 2.5, parent: kitchen });
		k.spot(0xfff4e8, 6, { x: 300.5, y: -296, z: 3, target: [300, -297.4, -0.9], angle: 0.45 });
		return {
			shots: [
				{ pos: [300.6, -297.15, 1.3], look: [300.05, -297.6, -0.9], fov: 45, fog: [0x3a3430, 3, 20] },
				{ pos: [-71, 1.8, 15], look: [-80, 0.8, 8], fov: 45 },
				{ pos: [100.5, -298.95, 1.3], look: [100, -298.9, 0], fov: 40, fog: [0x3a3430, 2, 20] },
				{ pos: [5.5, -297.6, 7.5], look: [0, -298.3, -1], fov: 50, fog: [0x8a9090, 10, 80] },
				{ pos: [34.5, 3.1, -7.5], look: [39.5, 3.9, -22], fov: 50 },
				{ pos: [124, 5, 88], look: [92, 5, 54], fov: 55 },
			],
		};
	},

	// ----------------------------------------------------------------------------------------------- the spiral
	r47: (k) => {
		k.fog(0xc89a88, 110, 520);
		k.sky(0x2a3a6a, 0xf0a878, { offset: -0.03 });
		k.light({ sky: 0xffd8c0, ground: 0x3a3040, hemi: 1.3, sunColor: 0xffb888, sunIntensity: 2.2, sunPos: [-60, 30, 40], shadowSize: 90, sunTarget: [0, 20, 0] });
		const H = (x, z) => (z > 30 ? Math.min(30, (z - 30) * 0.3) + Math.sin(x * 0.05) * 1.5 + 2 : z < -230 ? -4 + (-230 - z) * 0.45 : -4);
		k.ground(1000, 0x5a6a48, { bump: 0, seg: 140, height: H });
		k.water(1000, 0x3a5a70, { y: 0, seg: 60, amp: 0.2 });
		const r = rng(47);
		const T = k.THREE;
		const red = 0xc4442a;
		// The bridge.
		[0, -200].forEach((z) => {
			[-7, 7].forEach((x) => k.box(3, 72, 4, red, { x, y: 34, z }));
			[26, 44, 58, 68].forEach((y) => k.box(17, 2.4, 3, red, { y, z }));
			[-7, 7].forEach((x) => k.box(3.6, 4, 4.6, 0x8a8a84, { x, y: 1, z }));
		});
		k.box(20, 1.6, 330, red, { y: 22, z: -100 });
		k.box(18, 2.6, 330, 0x9a3a24, { y: 20.2, z: -100 });
		const cableY = (z) => {
			if (z <= 0 && z >= -200) return 24 + 46 * ((z + 100) / 100) ** 2;
			if (z > 0) return 70 - (z / 60) * 46;
			return 70 - ((-200 - z) / 60) * 46;
		};
		const suspenders = [];
		[-7.5, 7.5].forEach((x) => {
			for (let z = 60; z > -260; z -= 8) {
				line(k, [x, cableY(z), z], [x, cableY(z - 8), z - 8], red, 0.35);
				const h = cableY(z) - 23;
				if (h > 1.5) suspenders.push([x, 23 + h / 2, z, 0, 1, 0, 0, h]);
			}
		});
		const sus = new T.InstancedMesh(new T.CylinderGeometry(0.08, 0.08, 1, 4), k.mat(red), suspenders.length);
		const d = new T.Object3D();
		suspenders.forEach(([x, y, z, , , , , h], i) => {
			d.position.set(x, y, z);
			d.scale.set(1, h, 1);
			d.updateMatrix();
			sus.setMatrixAt(i, d.matrix);
		});
		k.place(sus, { shadow: false });
		// The fort beneath the south end, and the woman by the sea wall.
		const fy = H(0, 52);
		k.box(26, 10, 20, 0x9a5a40, { y: fy + 3, z: 56 });
		for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) k.box(1.4, 1.8, 0.1, 0x2a1a14, { x: -10 + i * 4, y: fy + 1 + row * 3, z: 45.95 });
		k.box(70, 1.5, 4, 0x8a8278, { x: -30, y: fy - 0.6, z: 42 });
		const madge = k.person({ x: -52, y: fy + 0.15, z: 42.5, ry: PI + 0.5, colors: { shirt: 0x9a9a94, legs: 0xe0c8b0, hair: 0xe8d8a0, skin: 0xf0d4c0 }, dress: 0x9a9a94 });
		k.torus(0.09, 0.04, 0xe8d8a0, { y: 0.05, z: -0.21, parent: madge.userData.limbs.head });
		madge.userData.limbs.armR.rotation.x = -0.8;
		k.sphere(0.12, 0xd84a6a, { x: 0.36, y: 1.0, z: 0.5, parent: madge, s: [1, 0.8, 1] });
		// The city on the hills.
		const houses = [];
		for (let i = 0; i < 360; i++) {
			const x = -200 + r() * 400;
			const z = 70 + r() * 140;
			if (Math.abs(x) < 20 && z < 90) continue;
			houses.push([x, H(x, z) + 1.5, z, Math.round(r()) * 0.1, 1 + r() * 0.8]);
		}
		instanced(k, new T.BoxGeometry(4, 4, 5), 0xe8d8c8, houses.filter((_, i) => i % 3 === 0));
		instanced(k, new T.BoxGeometry(4, 4, 5), 0xd8c0a8, houses.filter((_, i) => i % 3 === 1));
		instanced(k, new T.BoxGeometry(4, 4, 5), 0xb8c4c8, houses.filter((_, i) => i % 3 === 2));
		k.cyl(2.5, 3, 24, 0xe8e0d0, { x: 60, y: H(60, 140) + 12, z: 140, seg: 10 });
		// The rooftop: a man hanging from a gutter.
		const roofSet = k.group({ y: -400 });
		k.box(16, 0.4, 12, 0x5a4a44, { x: 0, y: 0, z: -5, rx: 0.25, parent: roofSet });
		k.cyl(0.18, 0.18, 16, 0x8a8a90, { y: -0.6, z: 1.1, rz: PI / 2, parent: roofSet, metal: 0.6 });
		k.box(16, 40, 0.5, 0x8a7a68, { y: -20.8, z: 0.6, parent: roofSet });
		for (let row = 0; row < 8; row++) for (let i = 0; i < 4; i++) k.box(1.4, 2, 0.1, row % 3 ? 0x2a2a34 : 0xd8b060, { x: -5 + i * 3.4, y: -4 - row * 4.5, z: 0.9, parent: roofSet, emissive: row % 3 ? 0x000000 : 0x8a6020, glow: 0.8 });
		k.box(16, 44, 0.5, 0x7a6a5a, { y: -22, z: 14, parent: roofSet });
		k.box(30, 0.5, 30, 0x2a2a30, { y: -42, z: 8, parent: roofSet });
		for (let i = 0; i < 3; i++) k.box(1.8, 1.2, 4, [0x8a2a2a, 0x2a4a6a, 0x3a3a3a][i], { x: -3 + i * 3, y: -41.2, z: 4 + i * 5, parent: roofSet });
		for (let i = 0; i < 4; i++) {
			k.glow(0xffd890, 3, { x: -6 + i * 4, y: -38, z: 10, parent: roofSet });
			k.point(0xffd890, 8, 20, { x: -6 + i * 4, y: -37, z: 10, parent: roofSet });
		}
		const hanger = k.person({ y: -2.85, z: 1.25, ry: PI, colors: { shirt: 0x8a8a90, legs: 0x8a8a90, hair: 0x5a4030 }, parent: roofSet });
		hanger.userData.limbs.armR.rotation.z = 3.0;
		hanger.userData.limbs.armL.rotation.z = -3.0;
		hanger.userData.limbs.legL.rotation.x = 0.3;
		hanger.userData.limbs.head.rotation.x = 0.5;
		const cop = k.person({ x: 3, y: 0.6, z: -1.2, ry: PI, rx: 0.9, pose: "point", hat: 0x1a1a2a, colors: { shirt: 0x1a1a2a, legs: 0x1a1a2a }, parent: roofSet });
		void cop;
		k.point(0xa8b8ff, 10, 40, { x: 4, y: 6, z: 8, parent: roofSet });
		// The bell tower of the mission.
		const mission = k.group({ x: -300, y: -400 });
		k.box(300, 1, 300, 0xc8a878, { y: -0.5, parent: mission });
		k.box(10, 9, 40, 0xece2d0, { x: 8, y: 4.5, z: -10, parent: mission });
		roof(k, 40, 11, 3.5, 0xa84a30, { x: 8, y: 9, z: -10, parent: k.group({ ry: PI / 2, parent: mission, x: 8, z: -10 }) });
		for (let i = 0; i < 6; i++) k.box(2.2, 4, 1, 0xe0d4c0, { x: 2.5, y: 2, z: -26 + i * 6, parent: mission });
		k.box(6, 26, 6, 0xf0e8d8, { x: -2, y: 13, z: 6, parent: mission });
		for (let f = 0; f < 4; f++) {
			const face = k.group({ x: -2, z: 6, ry: (f * PI) / 2, parent: mission });
			[-1, 1].forEach((s) => {
				k.box(1.6, 3.2, 0.2, 0x2a1a14, { x: s * 1.4, y: 22, z: 3.02, parent: face });
				k.cyl(0.8, 0.8, 0.22, 0x2a1a14, { x: s * 1.4, y: 23.6, z: 3.02, rx: PI / 2, parent: face, seg: 12 });
				k.cone(0.55, 1.1, 0x8a6a30, { x: s * 1.4, y: 22.2, z: 2.6, parent: face, metal: 0.7 });
			});
			k.box(6.4, 0.4, 0.6, 0xe0d4c0, { y: 19.8, z: 3.1, parent: face });
			for (let w = 0; w < 3; w++) k.box(0.8, 1.6, 0.1, 0x3a2a20, { y: 6 + w * 5, z: 3.02, parent: face });
		}
		for (let i = 0; i < 5; i++) {
			k.box(0.4, 0.8 + i * 0.1, 0.1, 0x2a1a14, { x: 2.95, y: 5.5, z: -24 + i * 7, parent: mission });
		}
		k.box(6.8, 0.6, 6.8, 0xe0d4c0, { x: -2, y: 26.3, z: 6, parent: mission });
		k.cone(4.6, 4, 0xa84a30, { x: -2, y: 28.6, z: 6, seg: 4, ry: PI / 4, parent: mission });
		k.cyl(0.08, 0.08, 2, 0x3a2a1a, { x: -2, y: 31.4, z: 6, parent: mission });
		k.box(1.2, 0.08, 0.08, 0x3a2a1a, { x: -2, y: 31.8, z: 6, parent: mission });
		trees(k, 10, [-340, -310, 10, 40], { color: 0x3a5a3a, h: 9, seed: 2, avoid: () => false });
		for (let i = 0; i < 10; i++) k.ico(2 + r() * 2, 0x4a6a3a, { x: -315 - r() * 20, y: -399, z: 20 + r() * 20 });
		k.point(0xffb080, 8, 80, { x: 20, y: 20, z: 30, parent: mission, decay: 0.5 });
		// The stairwell, spiralling down.
		const well = k.group({ x: 300, y: -400 });
		const depth = 26;
		[[0, 4.2, 8.4, 0.4], [0, -4.2, 8.4, 0.4], [4.2, 0, 0.4, 8.4], [-4.2, 0, 0.4, 8.4]].forEach(([x, z, w, dd]) => k.box(w, depth + 2, dd, 0xd8c8a8, { x, y: -depth / 2, z, parent: well }));
		const steps = [];
		const rails = [];
		const n = 78;
		for (let i = 0; i < n; i++) {
			const side = Math.floor(i / 6) % 4;
			const p = (i % 6) / 6;
			const y = -i * (depth / n) - 0.5;
			const along = -3 + p * 6;
			const pos = [[along, y, -3.4], [3.4, y, along], [-along, y, 3.4], [-3.4, y, -along]][side];
			steps.push([pos[0], pos[1], pos[2], side % 2 ? PI / 2 : 0, 1]);
			const rp = [[along, y + 0.8, -2.55], [2.55, y + 0.8, along], [-along, y + 0.8, 2.55], [-2.55, y + 0.8, -along]][side];
			rails.push([rp[0], rp[1], rp[2], side % 2 ? PI / 2 : 0, 1]);
		}
		instanced(k, new T.BoxGeometry(1.1, 0.25, 1.7), 0x6a4a30, steps, { parent: well });
		instanced(k, new T.BoxGeometry(1.1, 0.08, 0.08), 0x3a2a1a, rails, { parent: well });
		const spiral = k.canvas(512, 512, (g) => {
			g.fillStyle = "#f0e8dc";
			g.fillRect(0, 0, 512, 512);
			g.strokeStyle = "#c8281e";
			g.lineWidth = 16;
			g.beginPath();
			for (let a = 0; a < PI * 14; a += 0.05) {
				const rr = a * 5.6;
				g.lineTo(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr);
			}
			g.stroke();
		});
		k.plane(8, 8, k.mat(0xffffff, { map: spiral, emissive: 0x401010, glow: 0.3 }), { y: -depth - 0.4, rx: -PI / 2, parent: well });
		const spin = k.group({ y: -depth - 0.3, parent: well });
		k.tick((t) => (spin.rotation.y = t * 0.4));
		for (let i = 0; i < 4; i++) k.point(0xffe0b0, 6, 16, { y: -4 - i * 6.5, parent: well });
		const fall = k.person({ y: -15, z: 0.4, rx: -PI / 2 + 0.4, rz: 0.6, pose: "arms-out", dress: 0x2a2a30, colors: { shirt: 0x2a2a30, hair: 0x2a1a10 }, parent: well });
		k.tick((t) => (fall.rotation.y = t * 0.5));
		void spin;
		// The museum: a blonde twist, a portrait.
		const museum = k.group({ x: 600, y: -400 });
		k.box(20, 0.2, 20, 0x8a6a4a, { parent: museum });
		k.box(20, 8, 0.2, 0xd8cab0, { y: 4, z: -4, parent: museum });
		const portrait = k.canvas(256, 320, (g) => {
			g.fillStyle = "#2a3a2a";
			g.fillRect(0, 0, 256, 320);
			g.fillStyle = "#4a3a4a";
			g.fillRect(70, 170, 120, 150);
			g.fillStyle = "#e8c8b0";
			g.beginPath();
			g.ellipse(128, 120, 34, 44, 0, 0, PI * 2);
			g.fill();
			g.fillStyle = "#3a2418";
			g.beginPath();
			g.ellipse(128, 90, 40, 28, 0, PI, PI * 2);
			g.fill();
			g.fillStyle = "#c83a5a";
			for (let i = 0; i < 9; i++) {
				g.beginPath();
				g.arc(150 + (i % 3) * 12, 230 + Math.floor(i / 3) * 12, 7, 0, PI * 2);
				g.fill();
			}
			g.fillStyle = "#e8d070";
			g.fillRect(100, 170, 56, 6);
		});
		k.box(2.6, 3.2, 0.12, 0xb8902a, { y: 3.4, z: -3.85, parent: museum, metal: 0.7, rough: 0.3 });
		k.plane(2.2, 2.8, k.mat(0xffffff, { map: portrait }), { y: 3.4, z: -3.78, parent: museum });
		k.box(3, 0.5, 1, 0x5a3a2a, { y: 0.5, z: 0, parent: museum });
		const her = k.person({ y: 0.05, z: 0.1, ry: PI, pose: "sit", colors: { shirt: 0x9a9a94, legs: 0xe0c8b0, hair: 0xe8d8a0, skin: 0xf0d4c0 }, dress: 0x9a9a94, parent: museum });
		her.position.y = -0.1;
		her.rotation.y = 0;
		const hh = her.userData.limbs.head;
		k.torus(0.075, 0.035, 0xe8d8a0, { y: 0.0, z: -0.2, parent: hh, seg: 16 });
		k.torus(0.04, 0.022, 0xd8c890, { y: 0.0, z: -0.235, parent: hh, seg: 12 });
		k.sphere(0.02, 0xe8d8a0, { y: 0.0, z: -0.24, parent: hh });
		her.rotation.y = PI;
		k.spot(0xfff0d0, 30, { x: 600, y: -393, z: 3, target: [600, -397, -3.8], angle: 0.4 });
		k.point(0xffe8c8, 3, 10, { x: 1, y: 3, z: 3, parent: museum });
		// The green light.
		const room = k.group({ x: -600, y: -400 });
		k.box(14, 0.2, 14, 0x3a3030, { parent: room });
		k.box(14, 8, 0.2, 0x4a4040, { y: 4, z: -5, parent: room });
		k.box(4, 4.5, 0.1, 0x0a1a10, { x: 2.5, y: 3.6, z: -4.88, parent: room });
		k.box(3.6, 0.5, 0.2, 0x60ff90, { x: 2.5, y: 5.3, z: -5.3, parent: room, emissive: 0x30ff70, glow: 2 });
		k.glow(0x40ff80, 12, { x: 2.5, y: 4.4, z: -5.5, parent: room, opacity: 0.8 });
		k.point(0x40ff80, 30, 22, { x: 2.5, y: 4, z: -3.5, parent: room });
		k.point(0x60ff90, 6, 20, { x: -2, y: 4, z: 4, parent: room });
		k.box(3, 0.8, 4, 0xd8d0c0, { x: -4, y: 0.4, z: -2, parent: room });
		const judy = k.person({ x: 0.5, z: -1.6, ry: 0.1, colors: { shirt: 0x9a9a94, legs: 0xe0c8b0, hair: 0xf0e0b0, skin: 0xf0d4c0 }, dress: 0x9a9a94, parent: room });
		k.torus(0.075, 0.035, 0xf0e0b0, { z: -0.2, parent: judy.userData.limbs.head });
		k.particles(300, 0x80ffa0, { x: -600, y: -400, box: [10, 7, 8], speed: 0.1, size: 0.05, opacity: 0.35, drift: 0.3 });
		// A studio apartment: a drafting board, a lamp, a cane hooked on a chair.
		const studio = k.group({ y: -800 });
		k.box(16, 0.2, 16, 0x6a5040, { y: -0.1, parent: studio });
		k.box(16, 8, 0.2, 0xd8d0b8, { y: 4, z: -3, parent: studio });
		const sketch = k.canvas(128, 96, (g) => {
			g.fillStyle = "#f4f0e4";
			g.fillRect(0, 0, 128, 96);
			g.strokeStyle = "#3a3a4a";
			g.lineWidth = 2;
			for (let i = 0; i < 3; i++) {
				g.beginPath();
				g.moveTo(14 + i * 38, 70);
				g.bezierCurveTo(18 + i * 38, 30, 44 + i * 38, 30, 46 + i * 38, 70);
				g.stroke();
			}
			g.fillStyle = "#8a8a9a";
			for (let i = 0; i < 4; i++) g.fillRect(10, 80 + (i % 2) * 6, 30 + i * 20, 2);
		});
		const board = k.group({ x: 0, y: 1.3, z: -0.6, rx: -0.9, parent: studio });
		k.box(1.6, 1.1, 0.05, 0xc8b48a, { parent: board });
		k.plane(1.1, 0.8, k.mat(0xffffff, { map: sketch }), { z: 0.03, parent: board });
		k.box(1.4, 0.03, 0.04, 0x2a2a2a, { y: -0.3, z: 0.05, parent: board });
		[-0.7, 0.7].forEach((x) => k.box(0.06, 1.3, 0.06, 0x5a4030, { x, y: 0.65, z: -0.6, parent: studio }));
		k.cyl(0.015, 0.015, 0.55, 0xd8b030, { x: 0.25, y: 1.32, z: -0.42, rz: 0.4, rx: -0.9, parent: studio });
		const lamp = k.group({ x: 1.1, y: 0, z: -0.8, parent: studio });
		k.cyl(0.12, 0.14, 0.05, 0x2a3a2a, { y: 1.6, parent: lamp });
		line(k, [0, 1.6, 0], [-0.15, 2.2, 0.2], 0x2a3a2a, 0.02, { parent: lamp });
		line(k, [-0.15, 2.2, 0.2], [-0.45, 2.05, 0.35], 0x2a3a2a, 0.02, { parent: lamp });
		k.cone(0.13, 0.2, 0x2a3a2a, { x: -0.48, y: 1.98, z: 0.38, rz: 0.5, parent: lamp, open: true, side: 2 });
		k.glow(0xfff0c0, 0.4, { x: -0.5, y: 1.9, z: 0.4, parent: lamp });
		k.box(0.3, 1.6, 0.3, 0x5a4030, { x: 1.1, y: 0.8, z: -0.8, parent: studio });
		const chair = k.group({ x: -1.2, z: 0.5, ry: 0.5, parent: studio });
		[-0.22, 0.22].forEach((x) => [-0.2, 0.2].forEach((z) => k.box(0.05, 0.5, 0.05, 0x4a3020, { x, y: 0.25, z, parent: chair })));
		k.box(0.5, 0.05, 0.46, 0x4a3020, { y: 0.52, parent: chair });
		[-0.22, 0.22].forEach((x) => k.box(0.05, 0.6, 0.05, 0x4a3020, { x, y: 0.82, z: -0.21, parent: chair }));
		k.box(0.5, 0.12, 0.04, 0x4a3020, { y: 1.08, z: -0.21, parent: chair });
		k.cyl(0.02, 0.02, 0.95, 0x2a1810, { x: 0.12, y: 0.62, z: -0.27, rz: 0.08, parent: chair });
		k.torus(0.07, 0.02, 0x2a1810, { x: 0.05, y: 1.1, z: -0.27, arc: PI, parent: chair });
		k.point(0xfff0d0, 5, 10, { x: 0.5, y: 3, z: 2.5, parent: studio });
		k.point(0xffe0a0, 2, 4, { x: 0.6, y: 1.8, z: -0.3, parent: studio });
		return {
			shots: [
				{ pos: [0.6, -797.6, 2.9], look: [-0.3, -798.9, -0.2], fov: 45, fog: [0x3a3028, 4, 25] },
				{ pos: [-601, -398.3, 3.6], look: [-600.4, -398.4, -1.6], fov: 45, fog: [0x062a14, 4, 30], exposure: 1.2 },
				{ pos: [600.45, -397.85, 0.95], look: [600, -398.15, -0.2], fov: 40, fog: [0x2a2018, 3, 25] },
				{ pos: [-280, -398, 34], look: [-302, -386, 4], fov: 50, fog: [0xc87a5a, 40, 220] },
				{ pos: [3.2, -400.6, 5.4], look: [0.2, -402.6, 1.2], fov: 60, fog: [0x141a2a, 6, 120], exposure: 1.3 },
				{ pos: [300.05, -399.6, 0.05], look: [300, -426, 0], fov: 70, fog: [0x2a2018, 10, 80] },
			],
		};
	},
};
