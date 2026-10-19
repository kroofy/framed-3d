// Shared helpers for building film sets. Every reel file imports these.

export const PI = Math.PI;

export function rng(seed) {
	let s = seed >>> 0;
	return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function trees(k, n, area, o = {}) {
	const r = rng(o.seed ?? 7);
	for (let i = 0; i < n; i++) {
		const x = area[0] + r() * (area[1] - area[0]);
		const z = area[2] + r() * (area[3] - area[2]);
		if (o.avoid && o.avoid(x, z)) continue;
		const h = (o.h ?? 6) * (0.7 + r() * 0.6);
		k.cyl(0.15, 0.25, h * 0.4, o.trunk ?? 0x4a3020, { x, y: h * 0.2, z, from: o.from });
		k.cone(h * 0.28, h * 0.8, o.color ?? 0x1f4a2a, { x, y: h * 0.6, z, seg: 6, from: o.from });
	}
}

export function city(k, n, area, o = {}) {
	const r = rng(o.seed ?? 3);
	const lit = o.windows ? k.mat(o.windows, { emissive: o.windows, glow: 0.6 }) : null;
	for (let i = 0; i < n; i++) {
		const x = area[0] + r() * (area[1] - area[0]);
		const z = area[2] + r() * (area[3] - area[2]);
		if (o.avoid && o.avoid(x, z)) continue;
		const w = (o.w ?? 6) * (0.6 + r() * 0.8);
		const h = (o.h ?? 20) * (0.3 + r() * 1.0);
		const shade = o.colors ? o.colors[Math.floor(r() * o.colors.length)] : 0x555a66;
		k.box(w, h, w, shade, { x, y: h / 2, z, from: o.from });
		if (lit && r() > 0.3) k.box(w * 1.01, h * 0.02, w * 1.01, lit, { x, y: h * (0.3 + r() * 0.6), z, from: o.from, shadow: false });
	}
}
