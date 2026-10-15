import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type V3 = [number, number, number]

const UP = new THREE.Vector3(0, 1, 0)
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()

export function compose(pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], scale: number | V3 = 1) {
  _p.set(...pos)
  _q.setFromEuler(_e.set(...rot))
  if (typeof scale === 'number') _s.setScalar(scale)
  else _s.set(...scale)
  return new THREE.Matrix4().compose(_p, _q, _s)
}

/**
 * Collects primitive geometries under material keys, then merges each key into
 * one BufferGeometry, giving one draw call per material for a whole figure or city.
 */
export class GeoBag {
  parts = new Map<string, THREE.BufferGeometry[]>()
  /** Transform applied to everything added after it is set. */
  private stack: THREE.Matrix4[] = []

  push(m: THREE.Matrix4) {
    const top = this.stack.length ? this.stack[this.stack.length - 1].clone().multiply(m) : m.clone()
    this.stack.push(top)
    return this
  }
  pop() {
    this.stack.pop()
    return this
  }

  add(key: string, geo: THREE.BufferGeometry, matrix?: THREE.Matrix4) {
    let g = geo.index ? geo.clone() : mergeVertices(geo.clone())
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
    }
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
    }
    if (matrix) g.applyMatrix4(matrix)
    if (this.stack.length) g.applyMatrix4(this.stack[this.stack.length - 1])
    let list = this.parts.get(key)
    if (!list) this.parts.set(key, (list = []))
    list.push(g)
    geo.dispose()
    return this
  }

  addT(key: string, geo: THREE.BufferGeometry, pos?: V3, rot?: V3, scale?: number | V3) {
    return this.add(key, geo, compose(pos, rot, scale))
  }

  sphere(key: string, pos: V3, r: number, scale: number | V3 = 1, seg = 18, rot?: V3) {
    return this.addT(key, new THREE.SphereGeometry(r, seg, Math.max(8, Math.floor(seg * 0.75))), pos, rot, scale)
  }

  box(key: string, pos: V3, size: V3, rot?: V3) {
    return this.addT(key, new THREE.BoxGeometry(...size), pos, rot)
  }

  cyl(key: string, pos: V3, rTop: number, rBottom: number, h: number, seg = 16, rot?: V3, open = false) {
    return this.addT(key, new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1, open), pos, rot)
  }

  cone(key: string, pos: V3, r: number, h: number, seg = 16, rot?: V3) {
    return this.addT(key, new THREE.ConeGeometry(r, h, seg), pos, rot)
  }

  torus(key: string, pos: V3, R: number, r: number, rot?: V3, arc = Math.PI * 2, seg = 32, scale?: number | V3) {
    return this.addT(key, new THREE.TorusGeometry(R, r, 8, seg, arc), pos, rot, scale)
  }

  /** Lathe from [radius, y] pairs. */
  lathe(key: string, profile: [number, number][], pos: V3 = [0, 0, 0], scale: number | V3 = 1, seg = 24, rot?: V3) {
    const pts = profile.map(([r, y]) => new THREE.Vector2(r, y))
    return this.addT(key, new THREE.LatheGeometry(pts, seg), pos, rot, scale)
  }

  /** A capsule spanning two points: limbs, staffs, columns. */
  capsule(key: string, a: V3, b: V3, r: number, seg = 10) {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const len = dir.length()
    const geo = new THREE.CapsuleGeometry(r, Math.max(0.0001, len), 4, seg)
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize())
    const m = new THREE.Matrix4().compose(va.add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1))
    return this.add(key, geo, m)
  }

  /** A (possibly tapered) cylinder spanning two points. */
  between(key: string, a: V3, b: V3, rA: number, rB = rA, seg = 10) {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const len = dir.length()
    const geo = new THREE.CylinderGeometry(rB, rA, len, seg)
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize())
    const m = new THREE.Matrix4().compose(va.add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1))
    return this.add(key, geo, m)
  }

  tube(key: string, points: V3[], r: number, segments = 64, radial = 10, closed = false) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed)
    return this.add(key, new THREE.TubeGeometry(curve, segments, r, radial, closed))
  }

  merge(): Record<string, THREE.BufferGeometry> {
    const out: Record<string, THREE.BufferGeometry> = {}
    for (const [key, list] of this.parts) {
      const merged = mergeGeometries(list, false)
      if (merged) {
        merged.computeBoundingSphere()
        out[key] = merged
      }
      list.forEach((g) => g.dispose())
    }
    this.parts.clear()
    return out
  }
}
