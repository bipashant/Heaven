import * as THREE from 'three'
import type { GeoBag, V3 } from '../core/GeoBag'
import { taperedTube } from './builders'
import { smoothstep } from '../core/noise'

// Sculpting helpers for the high-detail deity figures: an anatomical torso and
// head, tapered limbs, hands with fingers, bead chains and cloth ribbons.

const v3 = (a: V3) => new THREE.Vector3(...a)
const gauss = (x: number, w: number) => Math.exp(-(x / w) * (x / w))

/** Tube whose radius varies along its length, with rounded ends. */
export function taperTube(bag: GeoBag, key: string, pts: V3[], radius: (t: number) => number, segments = 28, radial = 14, caps = true) {
  const curve = new THREE.CatmullRomCurve3(pts.map(v3), false, 'centripetal')
  bag.add(key, taperedTube(curve, segments, radial, radius))
  if (caps) {
    bag.sphere(key, pts[0], radius(0), 1, radial)
    bag.sphere(key, pts[pts.length - 1], radius(1), 1, radial)
  }
}

/** Beads strung along a curve: rudrākṣa, pearls, gold chains, jasmine. */
export function beadChain(bag: GeoBag, key: string, pts: V3[], count: number, r: number, closed = false, seg = 8) {
  const curve = new THREE.CatmullRomCurve3(pts.map(v3), closed, 'centripetal')
  for (let i = 0; i < count; i++) {
    const p = curve.getPointAt(closed ? i / count : i / Math.max(1, count - 1))
    bag.add(key, new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), new THREE.Matrix4().makeTranslation(p.x, p.y, p.z))
  }
}

/** Points on a (tilted) ellipse: necklaces that hang lower at the front. */
export function loop(cx: number, y: number, cz: number, rx: number, rz: number, drop = 0, n = 16): V3[] {
  const pts: V3[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const front = Math.max(0, Math.cos(a))
    pts.push([cx + Math.sin(a) * rx, y - drop * front * front, cz + Math.cos(a) * rz])
  }
  return pts
}

/** A ring of beads around a limb (perpendicular to `dir`). */
export function beadRing(bag: GeoBag, key: string, center: V3, dir: V3, R: number, count: number, r: number) {
  const d = v3(dir).normalize()
  const u = new THREE.Vector3(0, 1, 0).cross(d)
  if (u.lengthSq() < 1e-4) u.set(1, 0, 0).cross(d)
  u.normalize()
  const w = new THREE.Vector3().crossVectors(d, u)
  const c = v3(center)
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const p = c.clone().addScaledVector(u, Math.cos(a) * R).addScaledVector(w, Math.sin(a) * R)
    bag.add(key, new THREE.SphereGeometry(r, 6, 4), new THREE.Matrix4().makeTranslation(p.x, p.y, p.z))
  }
}

/** A torus band around a limb (armlets, bangles). */
export function bandAround(bag: GeoBag, key: string, center: V3, dir: V3, R: number, r: number) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), v3(dir).normalize())
  bag.add(key, new THREE.TorusGeometry(R, r, 8, 24), new THREE.Matrix4().compose(v3(center), q, new THREE.Vector3(1, 1, 1)))
}

/** Flat cloth strip following a curve (the sari's pallu). Normals point along `outward`. */
export function ribbon(bag: GeoBag, key: string, pts: V3[], width: number, outward: (p: THREE.Vector3) => THREE.Vector3, segments = 48) {
  const curve = new THREE.CatmullRomCurve3(pts.map(v3), false, 'centripetal')
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    const n = outward(p).normalize()
    const side = new THREE.Vector3().crossVectors(tan, n).normalize()
    const w = width * (0.85 + 0.15 * Math.sin(t * Math.PI))
    for (const s of [-0.5, 0.5]) {
      const q = p.clone().addScaledVector(side, s * w).addScaledVector(n, 0.004 + 0.006 * Math.sin((s + 0.5) * Math.PI))
      pos.push(q.x, q.y, q.z)
      uv.push(t * 4, s + 0.5)
    }
    if (i < segments) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  bag.add(key, g)
}

// ---------------------------------------------------------------------------
// Torso
// ---------------------------------------------------------------------------

const MALE_PROFILE: [number, number][] = [
  [0.02, 0.115], [0.19, 0.13], [0.215, 0.19], [0.2, 0.26], [0.186, 0.31], [0.196, 0.38],
  [0.222, 0.45], [0.242, 0.52], [0.254, 0.565], [0.242, 0.605], [0.19, 0.64], [0.11, 0.668], [0.062, 0.69], [0.055, 0.71],
]
const FEMALE_PROFILE: [number, number][] = [
  [0.02, 0.115], [0.2, 0.13], [0.212, 0.19], [0.18, 0.25], [0.152, 0.31], [0.16, 0.38],
  [0.18, 0.44], [0.19, 0.5], [0.196, 0.55], [0.186, 0.595], [0.15, 0.63], [0.09, 0.66], [0.05, 0.685], [0.045, 0.705],
]

const profileCache = new Map<boolean, { spline: THREE.SplineCurve; table: THREE.Vector2[] }>()
function profile(female: boolean) {
  let p = profileCache.get(female)
  if (!p) {
    const spline = new THREE.SplineCurve((female ? FEMALE_PROFILE : MALE_PROFILE).map(([r, y]) => new THREE.Vector2(r, y)))
    p = { spline, table: spline.getPoints(400) }
    profileCache.set(female, p)
  }
  return p
}

/** Profile radius at height y (front-facing part of the torso). */
function radiusAt(female: boolean, y: number) {
  const t = profile(female).table
  for (let i = 1; i < t.length; i++) {
    if (t[i].y >= y) {
      const a = t[i - 1]
      const b = t[i]
      return a.x + (b.x - a.x) * ((y - a.y) / Math.max(1e-6, b.y - a.y))
    }
  }
  return t[t.length - 1].x
}

/** Surface point of the torso at height y and angle a (0 = front, ±π = back). */
function torsoPoint(female: boolean, y: number, a: number, r: number): V3 {
  const x = Math.sin(a) * r * 1.12
  let z = Math.cos(a) * r * 0.74
  if (female) {
    z += 0.046 * (gauss(a - 0.42, 0.33) + gauss(a + 0.42, 0.33)) * gauss(y - 0.5, 0.045)
    z += 0.006 * gauss(a, 0.9) * gauss(y - 0.24, 0.05)
  } else {
    z += 0.02 * (gauss(a - 0.5, 0.38) + gauss(a + 0.5, 0.38)) * gauss(y - 0.53, 0.05)
    z += 0.01 * gauss(a, 0.9) * gauss(y - 0.25, 0.06)
    z -= 0.003 * gauss(a, 0.05) * smoothstep(0.24, 0.32, y) * (1 - smoothstep(0.42, 0.48, y))
    z += 0.004 * gauss(Math.abs(a) - 0.6, 0.3) * gauss(y - 0.625, 0.012)
  }
  z -= 0.006 * gauss(a, 0.07) * gauss(y - 0.27, 0.012)
  if (Math.abs(a) > Math.PI / 2) {
    const da = Math.PI - Math.abs(a)
    z += 0.01 * gauss(da, 0.22) * smoothstep(0.2, 0.35, y) * (1 - smoothstep(0.55, 0.62, y))
    z -= 0.012 * gauss(da - 0.7, 0.35) * gauss(y - 0.53, 0.06)
  }
  return [x, y, z]
}

/** A point just outside the torso skin, for threads, malas and necklaces. */
export function onTorso(female: boolean, y: number, a: number, out = 0.006): V3 {
  const r = radiusAt(female, y)
  const p = torsoPoint(female, y, a, r)
  const q = torsoPoint(female, y, a, r + 0.02)
  const n = new THREE.Vector3(q[0] - p[0], 0, q[2] - p[2]).normalize()
  return [p[0] + n.x * out, y, p[2] + n.z * out]
}

/** Chain path around the neck and down the chest, from (y, angle) stops on the front half. */
export function chestLoop(female: boolean, front: [number, number][], out: number): V3[] {
  const right = front.map(([y, a]) => onTorso(female, y, a, out))
  const left = front
    .slice(1)
    .reverse()
    .map(([y, a]) => onTorso(female, y, -a, out))
  return [...right, ...left]
}

/**
 * Anatomical torso: a lathe profile flattened front-to-back, then shaped with
 * chest, belly, navel, spine and shoulder blades. The seam runs down the back.
 * `range` cuts out a band (for the choli); `inflate` grows it outward.
 */
export function sculptTorso(opts: { female?: boolean; range?: [number, number]; inflate?: number } = {}) {
  const { female = false, inflate = 1 } = opts
  const { spline } = profile(female)
  const ny = 72
  const na = 72
  const rings: THREE.Vector2[] = []
  for (let k = 0; k <= ny; k++) {
    const p = spline.getPoint(k / ny)
    if (opts.range && (p.y < opts.range[0] || p.y > opts.range[1])) continue
    rings.push(p)
  }
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  rings.forEach((p, k) => {
    for (let i = 0; i <= na; i++) {
      let a = (Math.PI + (i / na) * Math.PI * 2) % (Math.PI * 2)
      if (a > Math.PI) a -= Math.PI * 2
      const [x, y, z] = torsoPoint(female, p.y, a, p.x * inflate)
      pos.push(x, y, z)
      uv.push(i / na, k / Math.max(1, rings.length - 1))
    }
  })
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < na; i++) {
      const a = k * (na + 1) + i
      const b = a + na + 1
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

// ---------------------------------------------------------------------------
// Head
// ---------------------------------------------------------------------------

export const HEAD_C: V3 = [0, 0.835, 0.008]

const headDims = (female: boolean) => (female ? { sx: 0.08, sy: 0.102, sz: 0.09, jaw: 0.34 } : { sx: 0.084, sy: 0.106, sz: 0.094, jaw: 0.28 })

function shapeHead(x: number, y: number, z: number, female: boolean): V3 {
  const d = headDims(female)
  const jaw = smoothstep(0.0, -0.95, y)
  let X = x * d.sx * (1 - d.jaw * jaw)
  let Z = z * d.sz * (1 - 0.16 * jaw)
  const Y = y * d.sy
  if (z > 0) {
    Z += 0.01 * smoothstep(-0.5, -0.9, y) * z
    Z -= 0.006 * z * z * z
    X *= 1 + 0.045 * Math.exp(-(((y + 0.1) / 0.25) ** 2))
    for (const s of [-1, 1]) {
      const dd = Math.hypot(x - s * 0.36, y - 0.1)
      Z -= 0.005 * Math.exp(-((dd / 0.13) ** 2)) * z
    }
  } else Z *= 1.06
  return [X + HEAD_C[0], Y + HEAD_C[1], Z + HEAD_C[2]]
}

/** Point on the front of the face at (x, y) in figure space, pushed `out` forward. */
export function onFace(x: number, y: number, female = false, out = 0.0015): V3 {
  const d = headDims(female)
  const yu = THREE.MathUtils.clamp((y - HEAD_C[1]) / d.sy, -0.99, 0.99)
  const jaw = smoothstep(0.0, -0.95, yu)
  const cheek = 1 + 0.045 * Math.exp(-(((yu + 0.1) / 0.25) ** 2))
  const xu = THREE.MathUtils.clamp((x - HEAD_C[0]) / (d.sx * (1 - d.jaw * jaw) * cheek), -0.99, 0.99)
  const zu = Math.sqrt(Math.max(0.0001, 1 - xu * xu - yu * yu))
  const p = shapeHead(xu, yu, zu, female)
  return [x, y, p[2] + out]
}

/** Sculpted head: narrower jaw, forward chin, cheekbones, eye sockets, fuller skull. */
export function sculptHead(female = false) {
  const g = new THREE.SphereGeometry(1, 56, 42)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const [X, Y, Z] = shapeHead(pos.getX(i), pos.getY(i), pos.getZ(i), female)
    pos.setXYZ(i, X, Y, Z)
  }
  g.computeVertexNormals()
  return g
}

/** Eyes, brows, nose, lips and ears placed on the sculpted head. */
export function addFace(bag: GeoBag, opts: { female?: boolean; meditative?: boolean } = {}) {
  const fem = !!opts.female
  const [cx, cy] = HEAD_C
  const f = fem ? 0.96 : 1
  for (const s of [-1, 1]) {
    const ex = cx + s * 0.032 * f
    const ey = cy + 0.009
    const ez = onFace(ex, ey, fem, -0.003)[2]
    bag.sphere('eye', [ex, ey, ez], 1, [0.017 * f, opts.meditative ? 0.0045 : 0.0066, 0.006], 14, [0, s * 0.35, s * -0.08])
    bag.sphere('skin', [ex, ey + 0.0048, ez + 0.0004], 1, [0.019 * f, 0.0045, 0.0068], 12, [0, s * 0.35, s * -0.08])
    bag.tube(
      'brow',
      ([
        [0.011, 0.03],
        [0.031, 0.036],
        [0.052 * f, 0.029],
      ] as [number, number][]).map(([x, y]) => onFace(cx + s * x, cy + y, fem, 0.0012)),
      0.0026,
      10,
      5,
    )
    bag.sphere('skin', [cx + s * 0.085 * f, cy - 0.004, cz(-0.012)], 1, [0.011, 0.028, 0.018], 12, [0, s * 0.3, 0])
  }
  bag.sphere('skin', [cx, cy - 0.012, onFace(cx, cy - 0.012, fem, 0.004)[2]], 1, [fem ? 0.0092 : 0.011, 0.026, 0.013], 12, [-0.25, 0, 0])
  bag.sphere('skin', [cx, cy - 0.03, onFace(cx, cy - 0.03, fem, 0.004)[2]], 1, [fem ? 0.0118 : 0.0145, 0.009, 0.01], 12)
  bag.sphere('lip', [cx, cy - 0.046, onFace(cx, cy - 0.046, fem, -0.001)[2]], 1, [0.019 * f, 0.0046, 0.008], 14)
  bag.sphere('lip', [cx, cy - 0.053, onFace(cx, cy - 0.053, fem, -0.0015)[2]], 1, [0.016 * f, 0.0052, 0.0078], 14)
}

const cz = (dz: number) => HEAD_C[2] + dz

// ---------------------------------------------------------------------------
// Limbs & hands
// ---------------------------------------------------------------------------

/** Arm radius along its length: deltoid → bicep → elbow → forearm → wrist. */
export const armRadius = (k: number) => (t: number) => {
  const up = t < 0.5
  const u = up ? t / 0.5 : (t - 0.5) / 0.5
  const r = up ? 0.056 + (0.041 - 0.056) * u + 0.006 * Math.sin(Math.PI * u) : 0.043 + (0.027 - 0.043) * u + 0.005 * Math.sin(Math.PI * u * 0.8)
  return r * k
}

/**
 * A hand at `wrist`: fingers along `fingerDir`, palm facing `palm`.
 * `curl` 0 = open, 1 = closed. `side` puts the thumb on +x or −x.
 */
export function hand(bag: GeoBag, key: string, wrist: V3, fingerDir: V3, palm: V3, opts: { size?: number; curl?: number; side?: 1 | -1 } = {}) {
  const { size = 1, curl = 0.15, side = 1 } = opts
  const Y = v3(fingerDir).normalize()
  const Z = v3(palm)
  Z.addScaledVector(Y, -Z.dot(Y)).normalize()
  const X = new THREE.Vector3().crossVectors(Y, Z).normalize()
  const m = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(v3(wrist)).multiply(new THREE.Matrix4().makeScale(size, size, size))
  bag.push(m)
  bag.sphere(key, [0, 0.028, -0.002], 1, [0.025, 0.031, 0.0105], 14)
  const xs = [-0.016, -0.0054, 0.0054, 0.0158]
  const lens = [0.026, 0.032, 0.034, 0.029]
  xs.forEach((x0, i) => {
    const x = x0 * -side
    const len = lens[side === 1 ? i : 3 - i]
    const base: V3 = [x, 0.054, 0]
    const mid: V3 = [x * 1.05, 0.054 + len * 0.55 * (1 - curl * 0.3), curl * len * 0.35]
    const tip: V3 = [x * 1.08, mid[1] + len * 0.45 * (1 - curl * 0.7), mid[2] + curl * len * 0.45]
    bag.capsule(key, base, mid, 0.0062, 8)
    bag.capsule(key, mid, tip, 0.0054, 8)
  })
  bag.capsule(key, [side * 0.019, 0.014, 0.004], [side * 0.032, 0.033, 0.012 + curl * 0.006], 0.0072, 8)
  bag.capsule(key, [side * 0.032, 0.033, 0.012 + curl * 0.006], [side * (0.036 - curl * 0.01), 0.05, 0.017 + curl * 0.012], 0.0062, 8)
  bag.pop()
}

/** Bare foot, sole up (padmāsana) or flat. Length along `dir`. */
export function foot(bag: GeoBag, key: string, heel: V3, dir: V3, up: V3, size = 1) {
  const Yd = v3(dir).normalize()
  const Zu = v3(up)
  Zu.addScaledVector(Yd, -Zu.dot(Yd)).normalize()
  const X = new THREE.Vector3().crossVectors(Yd, Zu).normalize()
  bag.push(new THREE.Matrix4().makeBasis(X, Yd, Zu).setPosition(v3(heel)).multiply(new THREE.Matrix4().makeScale(size, size, size)))
  bag.sphere(key, [0, 0.01, 0], 0.026, [1, 1, 0.9], 12)
  bag.sphere(key, [0, 0.055, 0.002], 1, [0.03, 0.05, 0.016], 14)
  for (let i = 0; i < 5; i++) {
    const x = -0.02 + i * 0.01
    bag.sphere(key, [x, 0.103 - Math.abs(i - 1) * 0.004, 0.003], i === 0 ? 0.0075 : 0.0055, 1, 8)
  }
  bag.pop()
}
