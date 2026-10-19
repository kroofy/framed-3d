// The 3D stage: renders one reel (a low-poly film set) through six camera "frames".
import * as THREE from "/vendor/three.module.js";
import { REELS } from "./reels.js";

const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const glowCache = new Map();

function glowTexture(color) {
	if (glowCache.has(color)) return glowCache.get(color);
	const c = document.createElement("canvas");
	c.width = c.height = 128;
	const g = c.getContext("2d");
	const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
	const col = new THREE.Color(color);
	const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
	grad.addColorStop(0, `rgba(255,255,255,1)`);
	grad.addColorStop(0.15, `rgba(${rgb},0.95)`);
	grad.addColorStop(0.45, `rgba(${rgb},0.35)`);
	grad.addColorStop(1, `rgba(${rgb},0)`);
	g.fillStyle = grad;
	g.fillRect(0, 0, 128, 128);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	glowCache.set(color, tex);
	return tex;
}

let disc;
/** A soft-edged white circle, tinted by the sprite colour. */
function discTexture() {
	if (disc) return disc;
	const c = document.createElement("canvas");
	c.width = c.height = 256;
	const g = c.getContext("2d");
	g.fillStyle = "#fff";
	g.beginPath();
	g.arc(128, 128, 124, 0, Math.PI * 2);
	g.fill();
	disc = new THREE.CanvasTexture(c);
	disc.colorSpace = THREE.SRGBColorSpace;
	return disc;
}

/** The toolkit each reel builds its set with. Every helper takes `{ x, y, z, rx, ry, rz, s, from, until, parent }`. */
function makeKit(scene, ticks) {
	const place = (obj, o = {}) => {
		obj.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
		obj.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
		if (o.s !== undefined) Array.isArray(o.s) ? obj.scale.set(...o.s) : obj.scale.setScalar(o.s);
		obj.userData.from = o.from ?? 0;
		obj.userData.until = o.until ?? 99;
		if (o.tag) obj.userData.tag = o.tag;
		if (o.shadow !== false && obj.isMesh) {
			obj.castShadow = true;
			obj.receiveShadow = true;
		}
		(o.parent ?? scene).add(obj);
		return obj;
	};
	const mat = (color, o = {}) =>
		new THREE.MeshStandardMaterial({
			color,
			flatShading: o.flat ?? true,
			roughness: o.rough ?? 0.85,
			metalness: o.metal ?? 0,
			emissive: o.emissive ?? 0x000000,
			emissiveIntensity: o.glow ?? 1,
			transparent: o.opacity !== undefined,
			opacity: o.opacity ?? 1,
			side: o.side ?? THREE.FrontSide,
			map: o.map ?? null,
		});
	const mesh = (geo, color, o = {}) => place(new THREE.Mesh(geo, color?.isMaterial ? color : mat(color, o)), o);
	const k = {
		THREE,
		scene,
		mat,
		mesh,
		place,
		tick: (fn) => ticks.push(fn),
		group: (o = {}) => place(new THREE.Group(), o),
		box: (w, h, d, c, o = {}) => mesh(new THREE.BoxGeometry(w, h, d), c, o),
		cyl: (rt, rb, h, c, o = {}) => mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 12, 1, o.open ?? false), c, o),
		cone: (r, h, c, o = {}) => mesh(new THREE.ConeGeometry(r, h, o.seg ?? 10), c, o),
		sphere: (r, c, o = {}) => mesh(new THREE.SphereGeometry(r, o.seg ?? 14, o.rings ?? 10), c, o),
		ico: (r, c, o = {}) => mesh(new THREE.IcosahedronGeometry(r, o.detail ?? 0), c, o),
		torus: (r, t, c, o = {}) => mesh(new THREE.TorusGeometry(r, t, o.rseg ?? 8, o.seg ?? 32, o.arc ?? Math.PI * 2), c, o),
		plane: (w, h, c, o = {}) => mesh(new THREE.PlaneGeometry(w, h, o.wseg ?? 1, o.hseg ?? 1), c, { shadow: o.shadow, ...o }),
		capsule: (r, l, c, o = {}) => mesh(new THREE.CapsuleGeometry(r, l, 4, o.seg ?? 10), c, o),
		/** A glowing billboard: suns, moons, lamps, eyes. */
		glow: (color, size, o = {}) => {
			const sprite = new THREE.Sprite(
				new THREE.SpriteMaterial({ map: glowTexture(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: o.opacity ?? 1, fog: o.fog ?? false }),
			);
			sprite.scale.set(size, size, 1);
			return place(sprite, { ...o, shadow: false });
		},
		/** A flat disc that always faces the camera, for big moons and suns. */
		disc: (color, size, o = {}) => {
			const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ color, fog: false, map: o.map ?? discTexture(), transparent: true }));
			sprite.scale.set(size, size, 1);
			return place(sprite, { ...o, shadow: false });
		},
		canvas: (w, h, draw) => {
			const c = document.createElement("canvas");
			c.width = w;
			c.height = h;
			draw(c.getContext("2d"), w, h);
			const tex = new THREE.CanvasTexture(c);
			tex.colorSpace = THREE.SRGBColorSpace;
			tex.anisotropy = 4;
			return tex;
		},
		sky: (top, bottom, o = {}) => {
			const geo = new THREE.SphereGeometry(o.r ?? 900, 32, 16);
			const m = new THREE.ShaderMaterial({
				side: THREE.BackSide,
				depthWrite: false,
				fog: false,
				uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) }, offset: { value: o.offset ?? 0 } },
				vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
				fragmentShader:
					"uniform vec3 top; uniform vec3 bottom; uniform float offset; varying vec3 vP; void main(){ float h = clamp(vP.y + offset, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.6)), 1.0); }",
			});
			return place(new THREE.Mesh(geo, m), { tag: "sky", ...o, shadow: false });
		},
		stars: (count = 1500, o = {}) => {
			const pos = new Float32Array(count * 3);
			for (let i = 0; i < count; i++) {
				const v = new THREE.Vector3().randomDirection().multiplyScalar(o.r ?? 800);
				if (o.upper !== false) v.y = Math.abs(v.y);
				pos.set([v.x, v.y, v.z], i * 3);
			}
			const geo = new THREE.BufferGeometry();
			geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
			return place(new THREE.Points(geo, new THREE.PointsMaterial({ color: o.color ?? 0xffffff, size: o.size ?? 1.6, sizeAttenuation: false, fog: false })), { tag: "stars", ...o, shadow: false });
		},
		/** Falling particles (rain, snow, sparks) inside a box around `o`. */
		particles: (count, color, o = {}) => {
			const size = o.box ?? [40, 30, 40];
			const pos = new Float32Array(count * 3);
			for (let i = 0; i < count; i++) pos.set([(Math.random() - 0.5) * size[0], Math.random() * size[1], (Math.random() - 0.5) * size[2]], i * 3);
			const geo = new THREE.BufferGeometry();
			geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
			const pts = place(new THREE.Points(geo, new THREE.PointsMaterial({ color, size: o.size ?? 0.08, transparent: true, opacity: o.opacity ?? 0.8, depthWrite: false })), { ...o, shadow: false });
			const speed = o.speed ?? 12;
			const drift = o.drift ?? 0;
			ticks.push((t, dt) => {
				const a = geo.attributes.position;
				for (let i = 0; i < count; i++) {
					let y = a.getY(i) - speed * dt;
					if (y < 0) y += size[1];
					a.setY(i, y);
					if (drift) a.setX(i, a.getX(i) + Math.sin(t + i) * drift * dt);
				}
				a.needsUpdate = true;
			});
			return pts;
		},
		/** An animated low-poly sea. */
		water: (size, color, o = {}) => {
			const seg = o.seg ?? 48;
			const geo = new THREE.PlaneGeometry(size, size, seg, seg);
			geo.rotateX(-Math.PI / 2);
			const base = geo.attributes.position.array.slice();
			const m = mat(color, { rough: 0.35, metal: 0.1, opacity: o.opacity, side: THREE.DoubleSide });
			const w = place(new THREE.Mesh(geo, m), { ...o, shadow: false });
			w.receiveShadow = true;
			const amp = o.amp ?? 0.35;
			ticks.push((t) => {
				const a = geo.attributes.position;
				for (let i = 0; i < a.count; i++) {
					const x = base[i * 3];
					const z = base[i * 3 + 2];
					a.setY(i, amp * (Math.sin(x * 0.35 + t * 1.3) + Math.cos(z * 0.3 + t * 0.9) * 0.7));
				}
				a.needsUpdate = true;
				geo.computeVertexNormals();
			});
			return w;
		},
		/** Bumpy low-poly ground. */
		ground: (size, color, o = {}) => {
			const seg = o.seg ?? 40;
			const geo = new THREE.PlaneGeometry(size, size, seg, seg);
			geo.rotateX(-Math.PI / 2);
			const a = geo.attributes.position;
			const bump = o.bump ?? 0.4;
			for (let i = 0; i < a.count; i++) {
				const x = a.getX(i);
				const z = a.getZ(i);
				const h = o.height ? o.height(x, z) : 0;
				a.setY(i, h + (Math.sin(x * 0.7) * Math.cos(z * 0.6) + Math.sin(x * 0.23 + z * 0.31)) * bump * 0.5);
			}
			geo.computeVertexNormals();
			const g = place(new THREE.Mesh(geo, mat(color, o)), o);
			g.castShadow = false;
			return g;
		},
		light: (o = {}) => {
			scene.add(new THREE.HemisphereLight(o.sky ?? 0xbfd7ff, o.ground ?? 0x403020, o.hemi ?? 1.1));
			if (o.sun !== false) {
				const sun = new THREE.DirectionalLight(o.sunColor ?? 0xfff1d6, o.sunIntensity ?? 2.2);
				sun.position.set(...(o.sunPos ?? [30, 50, 20]));
				sun.target.position.set(...(o.sunTarget ?? [0, 0, 0]));
				sun.castShadow = true;
				sun.shadow.mapSize.set(2048, 2048);
				const r = o.shadowSize ?? 40;
				Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 400 });
				sun.shadow.bias = -0.0005;
				scene.add(sun, sun.target);
			}
		},
		point: (color, intensity, distance, o = {}) => {
			const l = new THREE.PointLight(color, intensity, distance, o.decay ?? 1.5);
			return place(l, { ...o, shadow: false });
		},
		spot: (color, intensity, o = {}) => {
			const l = new THREE.SpotLight(color, intensity, o.distance ?? 60, o.angle ?? 0.4, o.penumbra ?? 0.5, o.decay ?? 1);
			l.castShadow = o.cast ?? false;
			place(l, { ...o, shadow: false });
			l.target.position.set(...(o.target ?? [0, 0, 0]));
			scene.add(l.target);
			return l;
		},
		fog: (color, near, far) => {
			scene.fog = new THREE.Fog(color, near, far);
			scene.background = new THREE.Color(color);
		},
		/** A blocky person. Poses: stand, arms-out, lean, run, hunch, raise, sit, swim, point. */
		person: (o = {}) => {
			const c = { skin: 0xe0b48f, shirt: 0x3b5b92, legs: 0x2b2b35, hair: 0x3a2618, shoes: 0x1a1a1a, ...o.colors };
			const g = place(new THREE.Group(), o);
			const part = (geo, color, x, y, z, parent = g) => {
				const m = new THREE.Mesh(geo, mat(color));
				m.position.set(x, y, z);
				m.castShadow = true;
				parent.add(m);
				return m;
			};
			const limb = (w, h, color, x, y, z) => {
				const pivot = new THREE.Group();
				pivot.position.set(x, y, z);
				g.add(pivot);
				part(new THREE.BoxGeometry(w, h, w), color, 0, -h / 2, 0, pivot);
				return pivot;
			};
			const legL = limb(0.2, 0.85, c.legs, -0.13, 0.85, 0);
			const legR = limb(0.2, 0.85, c.legs, 0.13, 0.85, 0);
			const body = part(new THREE.BoxGeometry(0.5, 0.7, 0.28), c.shirt, 0, 1.2, 0);
			if (o.dress) part(new THREE.CylinderGeometry(0.2, 0.42, 0.6, 10), o.dress, 0, 0.88, 0);
			const coat = o.coat ? part(new THREE.CylinderGeometry(0.3, 0.45, 1.1, 10), o.coat, 0, 1.0, 0) : null;
			const armL = limb(0.16, 0.7, o.sleeves ?? c.shirt, -0.34, 1.52, 0);
			const armR = limb(0.16, 0.7, o.sleeves ?? c.shirt, 0.34, 1.52, 0);
			const head = new THREE.Group();
			head.position.set(0, 1.75, 0);
			g.add(head);
			part(new THREE.SphereGeometry(0.2, 10, 8), c.skin, 0, 0, 0, head);
			if (o.hair !== false) part(new THREE.SphereGeometry(0.215, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), c.hair, 0, 0.02, -0.01, head);
			if (o.hat) {
				part(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 14), o.hat, 0, 0.12, 0, head);
				part(new THREE.CylinderGeometry(0.17, 0.2, 0.18, 12), o.hat, 0, 0.22, 0, head);
			}
			if (o.shades) part(new THREE.BoxGeometry(0.34, 0.07, 0.05), 0x050505, 0, 0.03, 0.19, head);
			const pose = o.pose ?? "stand";
			if (pose === "arms-out") {
				armL.rotation.z = -1.45;
				armR.rotation.z = 1.45;
			} else if (pose === "raise") {
				armR.rotation.z = 2.8;
				armL.rotation.z = -0.3;
			} else if (pose === "run") {
				armL.rotation.x = 0.9;
				armR.rotation.x = -0.9;
				legL.rotation.x = -0.7;
				legR.rotation.x = 0.6;
			} else if (pose === "hunch") {
				body.rotation.x = 0.5;
				head.position.z = 0.25;
				head.position.y = 1.62;
				armL.rotation.x = 0.4;
				armR.rotation.x = 0.4;
			} else if (pose === "point") {
				armR.rotation.x = -1.5;
			} else if (pose === "swim") {
				armL.rotation.x = -2.6;
				armR.rotation.x = 0.4;
				legL.rotation.x = 0.3;
				legR.rotation.x = -0.3;
			} else if (pose === "sit") {
				legL.rotation.x = -1.5;
				legR.rotation.x = -1.5;
			}
			g.userData.limbs = { armL, armR, legL, legR, head, body };
			if (pose === "lean") {
				// Bullet time: bend back from the knees.
				const top = new THREE.Group();
				[body, armL, armR, head].forEach((p) => top.add(p));
				if (coat) {
					// The coat bends with the torso and its tails hang back.
					top.add(coat);
					coat.position.y = 1.15;
					coat.scale.y = 0.6;
					const tails = coat.clone();
					tails.position.set(0, 0.62, -0.05);
					tails.scale.set(1, 0.55, 0.8);
					g.add(tails);
				}
				top.position.y = 0;
				const hinge = new THREE.Group();
				hinge.position.y = 0.85;
				top.position.y = -0.85;
				hinge.add(top);
				g.add(hinge);
				hinge.rotation.x = -1.05;
				legL.rotation.x = 0.35;
				legR.rotation.x = 0.35;
				armL.rotation.z = -1.0;
				armR.rotation.z = 1.0;
				armL.rotation.x = -0.4;
				armR.rotation.x = -0.4;
			}
			return g;
		},
	};
	return k;
}

export class Stage {
	constructor(host) {
		this.host = host;
		this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.05;
		host.prepend(this.renderer.domElement);
		this.camera = new THREE.PerspectiveCamera(40, 2.39, 0.05, 2000);
		this.clock = new THREE.Clock();
		this.drag = { yaw: 0, pitch: 0, active: false, x: 0, y: 0, zoom: 0 };
		this.reel = null;
		this.frame = 0;
		this.#bindPointer();
		new ResizeObserver(() => this.#resize()).observe(host);
		this.#resize();
		this.renderer.setAnimationLoop(() => this.#render());
	}

	#resize() {
		const w = this.host.clientWidth;
		const h = this.host.clientHeight;
		if (w === 0 || h === 0) return;
		this.renderer.setSize(w, h, false);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
	}

	#bindPointer() {
		const el = this.renderer.domElement;
		el.addEventListener("pointerdown", (e) => {
			this.drag.active = true;
			this.drag.x = e.clientX;
			this.drag.y = e.clientY;
			el.setPointerCapture(e.pointerId);
		});
		el.addEventListener("pointermove", (e) => {
			if (!this.drag.active) return;
			const limit = 0.55;
			this.drag.yaw = Math.max(-limit, Math.min(limit, this.drag.yaw - (e.clientX - this.drag.x) * 0.005));
			this.drag.pitch = Math.max(-0.3, Math.min(0.3, this.drag.pitch + (e.clientY - this.drag.y) * 0.004));
			this.drag.x = e.clientX;
			this.drag.y = e.clientY;
		});
		const end = () => (this.drag.active = false);
		el.addEventListener("pointerup", end);
		el.addEventListener("pointercancel", end);
		el.addEventListener(
			"wheel",
			(e) => {
				e.preventDefault();
				this.drag.zoom = Math.max(-0.35, Math.min(0.35, this.drag.zoom + e.deltaY * 0.0006));
			},
			{ passive: false },
		);
	}

	/** Builds the set for a reel. Same reel again is a no-op. */
	load(reel) {
		if (this.reel === reel) return;
		this.#dispose();
		this.reel = reel;
		this.scene = new THREE.Scene();
		this.ticks = [];
		const build = REELS[reel];
		if (build === undefined) {
			this.shots = [{ pos: [0, 2, 8], look: [0, 0, 0] }];
			return;
		}
		const kit = makeKit(this.scene, this.ticks);
		const result = build(kit);
		this.shots = result.shots;
		this.baseFog = this.scene.fog;
		this.baseBg = this.scene.background;
		this.frame = -1;
		this.show(0, true);
	}

	#dispose() {
		if (!this.scene) return;
		this.scene.traverse((o) => {
			o.geometry?.dispose();
			const m = o.material;
			(Array.isArray(m) ? m : m ? [m] : []).forEach((x) => {
				if (x.map && !glowCacheHas(x.map)) x.map.dispose();
				x.dispose();
			});
		});
		this.scene = null;
	}

	/** Cuts to a frame, 0..5. */
	show(index, instant = false) {
		if (!this.shots) return;
		const f = Math.max(0, Math.min(this.shots.length - 1, index));
		if (f === this.frame) return;
		const apply = () => {
			this.frame = f;
			const shot = this.shots[f];
			this.scene.traverse((o) => {
				if (o.userData.from !== undefined) o.visible = o.userData.from <= f && f <= o.userData.until && !(shot.hide ?? (shot.fog ? ["sky"] : [])).includes(o.userData.tag);
			});
			this.camera.fov = shot.fov ?? 40;
			this.camera.updateProjectionMatrix();
			if (shot.fog) {
				this.scene.fog = new THREE.Fog(shot.fog[0], shot.fog[1], shot.fog[2]);
				this.scene.background = new THREE.Color(shot.fog[0]);
			} else {
				this.scene.fog = this.baseFog;
				this.scene.background = this.baseBg;
			}
			this.renderer.domElement.style.filter = shot.filter ?? "";
			this.renderer.toneMappingExposure = shot.exposure ?? 1.05;
			this.drag.yaw = this.drag.pitch = this.drag.zoom = 0;
			this.shotStart = this.clock.elapsedTime;
		};
		if (instant) return apply();
		this.host.classList.add("cut");
		setTimeout(() => {
			apply();
			this.host.classList.remove("cut");
		}, 140);
	}

	#render() {
		if (!this.scene) return;
		const dt = Math.min(0.05, this.clock.getDelta());
		const t = this.clock.elapsedTime;
		for (const fn of this.ticks) fn(t, dt);
		const shot = this.shots[Math.max(0, this.frame)];
		if (!this.drag.active) {
			this.drag.yaw *= 0.97;
			this.drag.pitch *= 0.97;
		}
		const look = V(shot.look);
		const offset = V(shot.pos).sub(look);
		// A slow dolly so a still frame still breathes.
		const since = t - (this.shotStart ?? 0);
		const push = 1 - Math.min(0.06, since * 0.004) * (shot.push ?? 1) + this.drag.zoom;
		offset.multiplyScalar(push);
		const sway = Math.sin(t * 0.4) * 0.015;
		offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.drag.yaw + sway);
		const right = new THREE.Vector3().crossVectors(offset, new THREE.Vector3(0, 1, 0)).normalize();
		if (right.lengthSq() > 0) offset.applyAxisAngle(right, this.drag.pitch);
		this.camera.position.copy(look).add(offset);
		this.camera.up.set(0, 1, 0);
		this.camera.lookAt(look);
		if (shot.roll) this.camera.rotateZ(shot.roll);
		this.renderer.render(this.scene, this.camera);
	}
}

function glowCacheHas(tex) {
	for (const t of glowCache.values()) if (t === tex) return true;
	return false;
}
