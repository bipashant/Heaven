import * as THREE from 'three'
import { GeoBag, type V3 } from '../core/GeoBag'

const PI = Math.PI

// ---------------------------------------------------------------------------
// Lotus
// ---------------------------------------------------------------------------

/** A single lotus petal lying along +z, cupped and curling upward. */
export function petalGeometry(len: number, width: number, cup = 0.35, curl = 0.35) {
  const segU = 8
  const segV = 14
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= segV; j++) {
    const v = j / segV
    const halfW = width * Math.pow(Math.sin(PI * Math.min(1, v * 0.98 + 0.02)), 0.8) * (1 - 0.25 * v)
    for (let i = 0; i <= segU; i++) {
      const u = (i / segU) * 2 - 1
      const x = u * halfW
      const z = v * len
      const y = curl * v * v * len + cup * u * u * halfW
      pos.push(x, y, z)
      uv.push(i / segU, v)
    }
  }
  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * (segU + 1) + i
      const b = a + segU + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export interface LotusSpec {
  radius: number
  layers?: number
  petals?: number
  /** Elevation of the innermost layer (radians); outer layers open flatter. */
  openness?: number
  cup?: number
  /** Petals start at this radius (default: near the centre). */
  startRadius?: number
  /** Elevation of the outermost layer (radians). */
  baseElevation?: number
}

/** Lotus flower: petals under key 'petal', seed-pod under 'pod'. */
export function buildLotus(bag: GeoBag, spec: LotusSpec, center: V3 = [0, 0, 0]) {
  const { radius, layers = 3, petals = 16, openness = 1.0, cup = 0.4, startRadius, baseElevation = 0.12 } = spec
  const [cx, cy, cz] = center
  for (let L = 0; L < layers; L++) {
    const t = layers === 1 ? 0 : L / (layers - 1) // 0 = outer
    const n = Math.round(petals * (1 - t * 0.35))
    const len = radius * (1 - t * 0.38)
    const elev = baseElevation + t * openness
    const r0 = startRadius !== undefined ? startRadius * (1 - t * 0.04) : radius * 0.12 * (1 - t * 0.5)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + L * 0.37
      const m = new THREE.Matrix4()
        .makeTranslation(cx + Math.sin(a) * r0, cy + t * radius * 0.06, cz + Math.cos(a) * r0)
        .multiply(new THREE.Matrix4().makeRotationY(a))
        .multiply(new THREE.Matrix4().makeRotationX(-elev))
      bag.add('petal', petalGeometry(len, len * 0.3, cup, 0.32), m)
    }
  }
  if (startRadius !== undefined) return
  bag.cyl('pod', [cx, cy + radius * 0.1, cz], radius * 0.2, radius * 0.15, radius * 0.14, 24)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PI * 2
    const r = i === 0 ? 0 : radius * 0.11
    bag.sphere('podDots', [cx + Math.cos(a) * r, cy + radius * 0.17, cz + Math.sin(a) * r], radius * 0.025, 1, 8)
  }
}

// ---------------------------------------------------------------------------
// Serpents: Śeṣa, Vāsuki, the nāgas
// ---------------------------------------------------------------------------

export interface SerpentSpec {
  bodyR: number
  coil: { rx: number; rz: number; turns: number; rise: number; shrink?: number; y0?: number; start?: number }
  /** Path points after the coil ends (local coords). */
  neck: V3[]
  hoods: number
  hoodSize: number
  /** Direction the hoods face. */
  facing: V3
  spread?: number
  /** Extra rows of hoods behind (for the thousand-hooded Ananta). */
  rows?: number
}

function taperedTube(curve: THREE.Curve<THREE.Vector3>, segments: number, radial: number, radius: (t: number) => number) {
  const g = new THREE.TubeGeometry(curve, segments, 1, radial, false)
  const pos = g.attributes.position as THREE.BufferAttribute
  const c = new THREE.Vector3()
  const p = new THREE.Vector3()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    curve.getPointAt(t, c)
    const r = radius(t)
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(k, p.x, p.y, p.z)
    }
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
  return g
}

/** Keys: 'body', 'belly' (hood fronts), 'gem'. */
export function buildSerpent(bag: GeoBag, s: SerpentSpec) {
  const { rx, rz, turns, rise, shrink = 0.4, y0 = 0, start = 0 } = s.coil
  const pts: THREE.Vector3[] = []
  const steps = Math.max(24, Math.floor(turns * 28))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = start + t * turns * PI * 2
    const k = 1 - shrink * t
    pts.push(new THREE.Vector3(Math.cos(a) * rx * k, y0 + t * turns * rise, Math.sin(a) * rz * k))
  }
  s.neck.forEach((p) => pts.push(new THREE.Vector3(...p)))
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const segs = Math.min(900, pts.length * 8)
  bag.add(
    'body',
    taperedTube(curve, segs, 14, (t) => s.bodyR * Math.min(1, 0.15 + t * 6) * (t > 0.92 ? 1 - (t - 0.92) * 3 : 1)),
  )

  const C = pts[pts.length - 1].clone()
  const F = new THREE.Vector3(...s.facing).normalize()
  const U = new THREE.Vector3(0, 1, 0)
  const Rv = new THREE.Vector3().crossVectors(U, F).normalize()
  const U2 = new THREE.Vector3().crossVectors(F, Rv).normalize()
  const hs = s.hoodSize
  const spread = s.spread ?? 1.2
  const rows = s.rows ?? 1
  for (let row = 0; row < rows; row++) {
    const n = row === 0 ? s.hoods : Math.max(3, s.hoods - row * 2)
    const rad = hs * (1.05 + row * 0.75)
    for (let i = 0; i < n; i++) {
      const phi = n === 1 ? 0 : -spread + (i / (n - 1)) * spread * 2
      const P = C.clone()
        .addScaledVector(Rv, Math.sin(phi) * rad)
        .addScaledVector(U2, Math.cos(phi) * rad * 0.7 + hs * 0.25)
        .addScaledVector(F, -row * hs * 0.35)
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Rv, U2, F))
      const tilt = new THREE.Quaternion().setFromAxisAngle(F, -phi * 0.5)
      q.premultiply(tilt)
      const hood = new THREE.Matrix4().compose(P, q, new THREE.Vector3(hs * 0.6, hs * 0.72, hs * 0.13))
      bag.add('body', new THREE.SphereGeometry(1, 16, 12), hood)
      const front = new THREE.Matrix4().compose(
        P.clone().addScaledVector(F, hs * 0.05),
        q,
        new THREE.Vector3(hs * 0.25, hs * 0.48, hs * 0.1),
      )
      bag.add('belly', new THREE.SphereGeometry(1, 14, 10), front)
      // head & jewel
      const head = new THREE.Matrix4().compose(
        P.clone().addScaledVector(F, hs * 0.16).addScaledVector(U2, -hs * 0.42),
        q,
        new THREE.Vector3(hs * 0.15, hs * 0.11, hs * 0.26),
      )
      bag.add('body', new THREE.SphereGeometry(1, 12, 10), head)
      bag.sphere('gem', P.clone().addScaledVector(U2, hs * 0.38).addScaledVector(F, hs * 0.12).toArray() as V3, hs * 0.07, 1, 8)
      bag.between('body', C.toArray() as V3, P.clone().addScaledVector(U2, -hs * 0.3).toArray() as V3, s.bodyR * 0.6, s.bodyR * 0.45, 10)
    }
  }
}

// ---------------------------------------------------------------------------
// Architecture
// ---------------------------------------------------------------------------

/** South-Indian style gopuram: stepped tiers with a barrel-vault crown. */
export function gopuram(bag: GeoBag, pos: V3, w: number, d: number, h: number, tiers = 5, key = 'stone', trim = 'gold', rotY = 0) {
  const [x, y, z] = pos
  const base = h * 0.28
  bag.box(key, [x, y + base / 2, z], [w, base, d], [0, rotY, 0])
  let cy = y + base
  const th = (h - base) / (tiers + 1)
  for (let i = 0; i < tiers; i++) {
    const k = 1 - (i + 1) * (0.55 / tiers)
    bag.box(key, [x, cy + th / 2, z], [w * k, th, d * k], [0, rotY, 0])
    bag.box(trim, [x, cy + th * 0.96, z], [w * k * 1.04, th * 0.08, d * k * 1.04], [0, rotY, 0])
    cy += th
  }
  const kw = w * 0.45
  const cos = Math.cos(rotY)
  const sin = Math.sin(rotY)
  bag.addT(key, new THREE.CylinderGeometry(d * 0.22, d * 0.22, kw, 12, 1, false, 0, PI), [x, cy, z], [0, rotY, PI / 2])
  for (let i = -2; i <= 2; i++) {
    const o = (i / 2) * kw * 0.42
    bag.sphere(trim, [x + cos * o, cy + d * 0.26, z - sin * o], d * 0.05, [1, 1.4, 1], 8)
  }
}

/** North-Indian nāgara śikhara with āmalaka and kalaśa. */
export function shikhara(bag: GeoBag, pos: V3, r: number, h: number, key = 'stone', trim = 'gold') {
  const [x, y, z] = pos
  const prof: [number, number][] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    prof.push([r * (1 - Math.pow(t, 1.6) * 0.82), t * h])
  }
  prof.push([0.001, h])
  bag.lathe(key, prof, [x, y, z], 1, 8)
  bag.addT(trim, new THREE.TorusGeometry(r * 0.2, r * 0.08, 8, 16), [x, y + h, z], [PI / 2, 0, 0])
  bag.sphere(trim, [x, y + h + r * 0.14, z], r * 0.09, [1, 1.3, 1], 10)
  bag.cone(trim, [x, y + h + r * 0.3, z], r * 0.04, r * 0.18, 8)
}

/** Domed pavilion on columns. */
export function pavilion(bag: GeoBag, pos: V3, r: number, h: number, cols = 8, key = 'stone', domeKey = 'gold') {
  const [x, y, z] = pos
  bag.cyl(key, [x, y + h * 0.05, z], r * 1.1, r * 1.15, h * 0.1, 24)
  for (let i = 0; i < cols; i++) {
    const a = (i / cols) * PI * 2
    bag.cyl(key, [x + Math.cos(a) * r, y + h * 0.45, z + Math.sin(a) * r], r * 0.06, r * 0.07, h * 0.7, 8)
  }
  bag.cyl(key, [x, y + h * 0.84, z], r * 1.08, r * 1.08, h * 0.08, 24)
  bag.addT(domeKey, new THREE.SphereGeometry(r * 0.95, 24, 12, 0, PI * 2, 0, PI / 2), [x, y + h * 0.88, z], [0, 0, 0], [1, 1.25, 1])
  bag.cone(domeKey, [x, y + h * 0.88 + r * 1.25, z], r * 0.08, r * 0.4, 8)
}

/** Palace block with a central dome and corner chhatris. */
export function palace(bag: GeoBag, pos: V3, w: number, d: number, h: number, key = 'stone', domeKey = 'gold') {
  const [x, y, z] = pos
  bag.box(key, [x, y + h / 2, z], [w, h, d])
  bag.box(domeKey, [x, y + h, z], [w * 1.04, h * 0.06, d * 1.04])
  const r = Math.min(w, d) * 0.32
  bag.addT(domeKey, new THREE.SphereGeometry(r, 20, 10, 0, PI * 2, 0, PI / 2), [x, y + h, z], [0, 0, 0], [1, 1.3, 1])
  bag.cone(domeKey, [x, y + h + r * 1.35, z], r * 0.08, r * 0.35, 8)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = x + (sx * w) / 2
      const cz = z + (sz * d) / 2
      bag.cyl(key, [cx, y + h * 0.6, cz], r * 0.18, r * 0.2, h * 1.2, 8)
      bag.addT(domeKey, new THREE.SphereGeometry(r * 0.24, 12, 6, 0, PI * 2, 0, PI / 2), [cx, y + h * 1.2, cz])
    }
  }
}

/** Ring wall with towers. */
export function ringWall(bag: GeoBag, center: V3, r: number, h: number, thick: number, towers = 8, key = 'stone', trim = 'gold') {
  const [x, y, z] = center
  bag.addT(key, new THREE.CylinderGeometry(r, r, h, 64, 1, true), [x, y + h / 2, z])
  bag.addT(key, new THREE.CylinderGeometry(r - thick, r - thick, h, 64, 1, true), [x, y + h / 2, z])
  bag.addT(trim, new THREE.TorusGeometry(r - thick / 2, thick * 0.6, 4, 64), [x, y + h, z], [PI / 2, 0, 0])
  for (let i = 0; i < towers; i++) {
    const a = (i / towers) * PI * 2
    const tx = x + Math.cos(a) * r
    const tz = z + Math.sin(a) * r
    bag.cyl(key, [tx, y + h * 0.7, tz], thick * 1.2, thick * 1.4, h * 1.4, 10)
    bag.addT(trim, new THREE.SphereGeometry(thick * 1.3, 12, 6, 0, PI * 2, 0, PI / 2), [tx, y + h * 1.4, tz])
  }
}

// ---------------------------------------------------------------------------
// Animals
// ---------------------------------------------------------------------------

/** Bull / cow / buffalo. Seated (Nandī) or standing. Faces +z. Keys: 'hide', 'horn', 'gold'. */
export function bovine(bag: GeoBag, opts: { seated?: boolean; hump?: boolean; buffalo?: boolean } = {}) {
  const { seated = false, hump = true, buffalo = false } = opts
  const by = seated ? 0.32 : 0.62
  bag.sphere('hide', [0, by, 0], 1, [0.3, 0.3, 0.6], 18)
  bag.sphere('hide', [0, by + 0.05, 0.38], 0.27, [1, 1.05, 1], 14)
  if (hump) bag.sphere('hide', [0, by + 0.25, 0.32], 0.14, [1, 0.9, 1.2], 12)
  // neck & head
  bag.capsule('hide', [0, by + 0.12, 0.5], [0, by + 0.28, 0.76], 0.15)
  bag.sphere('hide', [0, by + 0.25, 0.86], 1, [0.12, 0.13, 0.2], 14, [0.5, 0, 0])
  bag.sphere('hide', [0, by + 0.14, 0.98], 1, [0.09, 0.08, 0.09], 10)
  bag.sphere('hide', [0, by - 0.02, 0.62], 1, [0.08, 0.14, 0.06], 10)
  // horns & ears
  for (const s of [1, -1]) {
    if (buffalo) {
      bag.tube('horn', [
        [s * 0.06, by + 0.36, 0.84],
        [s * 0.2, by + 0.38, 0.8],
        [s * 0.3, by + 0.32, 0.66],
        [s * 0.26, by + 0.42, 0.58],
      ], 0.03, 12, 6)
    } else {
      bag.tube('horn', [
        [s * 0.06, by + 0.37, 0.84],
        [s * 0.13, by + 0.45, 0.83],
        [s * 0.16, by + 0.55, 0.86],
      ], 0.022, 8, 6)
    }
    bag.sphere('hide', [s * 0.13, by + 0.3, 0.8], 1, [0.07, 0.03, 0.04], 8, [0, 0, s * 0.4])
  }
  bag.torus('gold', [0, by + 0.12, 0.62], 0.13, 0.015, [0.9, 0, 0], PI * 2, 18)
  bag.sphere('gold', [0, by - 0.02, 0.73], 0.035, 1, 10)
  if (seated) {
    for (const s of [1, -1]) {
      bag.capsule('hide', [s * 0.2, 0.08, 0.3], [s * 0.16, 0.06, 0.6], 0.07)
      bag.capsule('hide', [s * 0.24, 0.1, -0.35], [s * 0.2, 0.06, 0.05], 0.09)
    }
  } else {
    for (const sx of [1, -1]) {
      for (const sz of [0.38, -0.4]) {
        bag.capsule('hide', [sx * 0.16, by - 0.05, sz], [sx * 0.16, 0.04, sz + 0.02], 0.06)
        bag.sphere('horn', [sx * 0.16, 0.03, sz + 0.03], 0.055, [1, 0.6, 1.2], 8)
      }
    }
  }
  bag.tube('hide', [
    [0, by + 0.1, -0.58],
    [0, by - 0.1, -0.66],
    [0.03, by - 0.35, -0.64],
  ], 0.025, 8, 6)
}

/** Elephant (Airāvata). Faces +z. Keys: 'hide', 'tusk', 'gold', 'cloth'. */
export function elephant(bag: GeoBag, tusks = 4) {
  bag.sphere('hide', [0, 1.15, 0], 1, [0.62, 0.62, 0.95], 22)
  bag.sphere('hide', [0, 1.45, 0.95], 0.48, [1, 1.05, 0.95], 18)
  bag.sphere('hide', [0, 1.85, 0.95], 0.2, [1.3, 0.8, 1], 12)
  // ears
  for (const s of [1, -1]) {
    bag.sphere('hide', [s * 0.48, 1.45, 0.78], 1, [0.08, 0.42, 0.36], 14, [0, s * 0.5, 0])
  }
  // trunk
  bag.tube('hide', [
    [0, 1.3, 1.35],
    [0, 0.95, 1.5],
    [0, 0.55, 1.5],
    [0, 0.25, 1.62],
    [0, 0.2, 1.8],
  ], 0.13, 32, 12)
  bag.sphere('hide', [0, 0.2, 1.8], 0.09, 1, 10)
  // tusks
  const tp = tusks === 4 ? [-0.22, -0.11, 0.11, 0.22] : [-0.18, 0.18]
  for (const x of tp) {
    bag.tube('tusk', [
      [x, 1.15, 1.3],
      [x * 1.3, 0.9, 1.6],
      [x * 1.5, 0.95, 1.85],
    ], 0.045, 12, 8)
  }
  // legs
  for (const sx of [1, -1]) {
    for (const sz of [0.5, -0.5]) {
      bag.cyl('hide', [sx * 0.38, 0.45, sz], 0.2, 0.22, 0.95, 14)
      bag.cyl('tusk', [sx * 0.38, 0.03, sz], 0.23, 0.23, 0.06, 14)
    }
  }
  // caparison & howdah
  bag.addT('cloth', new THREE.CylinderGeometry(0.66, 0.66, 1.2, 24, 1, true, -PI / 2 - 0.9, 1.8), [0, 1.25, 0], [PI / 2, 0, 0], [1, 1, 1])
  bag.addT('cloth', new THREE.CylinderGeometry(0.66, 0.66, 1.2, 24, 1, true, PI / 2 - 0.9, 1.8), [0, 1.25, 0], [PI / 2, 0, 0], [1, 1, 1])
  bag.box('gold', [0, 1.85, -0.05], [0.7, 0.18, 0.8])
  bag.cyl('gold', [0, 2.3, -0.05], 0.03, 0.03, 0.8, 6)
  bag.addT('cloth', new THREE.ConeGeometry(0.5, 0.35, 8), [0, 2.75, -0.05])
  bag.tube('hide', [
    [0, 1.3, -0.9],
    [0, 0.9, -1.0],
    [0.04, 0.6, -0.98],
  ], 0.04, 8, 6)
  bag.torus('gold', [0, 1.2, 1.25], 0.42, 0.04, [0.3, 0, 0], PI * 2, 24)
}

/** Swan (haṁsa). Faces +z. Keys: 'feather', 'beak'. */
export function swan(bag: GeoBag) {
  bag.sphere('feather', [0, 0.25, 0], 1, [0.25, 0.2, 0.42], 18)
  bag.tube('feather', [
    [0, 0.32, 0.3],
    [0, 0.55, 0.38],
    [0, 0.72, 0.3],
    [0, 0.78, 0.38],
  ], 0.06, 20, 10)
  bag.sphere('feather', [0, 0.79, 0.4], 0.07, [1, 0.9, 1.3], 12)
  bag.cone('beak', [0, 0.775, 0.5], 0.03, 0.1, 8, [PI / 2, 0, 0])
  for (const s of [1, -1]) {
    bag.sphere('feather', [s * 0.18, 0.36, -0.05], 1, [0.08, 0.14, 0.36], 12, [0.3, 0, s * 0.3])
  }
  bag.cone('feather', [0, 0.32, -0.42], 0.1, 0.2, 10, [-PI / 2 - 0.5, 0, 0])
}
