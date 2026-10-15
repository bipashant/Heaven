import * as THREE from 'three'
import { JAMBU_R, KAILASH, LAKES, SHIVA_SEAT } from '../../../data/layout'
import { fbm2, lerp, noise2, ridged2, smoothstep } from '../../core/noise'

// Jambūdvīpa height field. +z is south. Meru stands at the origin, encircled by
// the plain of Ilāvṛta. East–west ranges run to the north and south of it,
// with the Himālaya southernmost (holding Kailāsa) and Bhārata-varṣa below.
// Four branches of the Gaṅgā flow out from Meru (Bhāgavata Purāṇa 5.17).

const RANGES = [
  { z: 9, h: 1.3, w: 1.2 }, // Niṣadha
  { z: 16.5, h: 1.55, w: 1.4 }, // Hemakūṭa
  { z: 24.5, h: 2.3, w: 1.9 }, // Himālaya
  { z: -9, h: 1.3, w: 1.2 }, // Nīla
  { z: -16.5, h: 1.55, w: 1.4 }, // Śveta
  { z: -24.5, h: 2.0, w: 1.8 }, // Śṛṅgavān
]

/** Distance to each river and how far along it the point is. */
function rivers(x: number, z: number): { d: number; along: number } {
  let best = { d: 1e9, along: 0 }
  // Alakanandā flows south into Bhārata-varṣa
  if (z > 6) {
    const cx = 3.0 + 1.4 * Math.sin(z * 0.23) + 0.6 * Math.sin(z * 0.61)
    const d = Math.abs(x - cx)
    if (d < best.d) best = { d, along: z }
  }
  // Sītā flows east
  if (x > 6) {
    const cz = -1.5 + 1.4 * Math.sin(x * 0.21) + 0.5 * Math.sin(x * 0.57)
    const d = Math.abs(z - cz)
    if (d < best.d) best = { d, along: x }
  }
  // Cakṣu flows west
  if (x < -6) {
    const cz = 1.2 + 1.3 * Math.sin(x * 0.25) + 0.5 * Math.sin(x * 0.53)
    const d = Math.abs(z - cz)
    if (d < best.d) best = { d, along: -x }
  }
  // Bhadrā flows north
  if (z < -6) {
    const cx = -2.0 + 1.3 * Math.sin(z * 0.22) + 0.5 * Math.sin(z * 0.59)
    const d = Math.abs(x - cx)
    if (d < best.d) best = { d, along: -z }
  }
  return best
}

export function coastRadius(x: number, z: number) {
  const a = Math.atan2(z, x)
  return JAMBU_R - 2.4 + 1.8 * noise2(Math.cos(a) * 1.7, Math.sin(a) * 1.7) + 0.6 * noise2(Math.cos(a) * 5, Math.sin(a) * 5)
}

export function heightAt(x: number, z: number): number {
  const r = Math.hypot(x, z)
  let h = 0.42 + 0.32 * fbm2(x * 0.06, z * 0.06, 4) + 0.1 * fbm2(x * 0.3, z * 0.3, 3)

  const rough = 0.55 + 0.75 * ridged2(x * 0.32, z * 0.32, 4)
  for (const rg of RANGES) {
    const zz = z - rg.z + 1.1 * noise2(x * 0.07, rg.z * 0.3)
    const ridge = Math.exp(-(zz * zz) / (rg.w * rg.w))
    h += ridge * rg.h * rough
  }
  // Gandhamādana (west) and Mālyavān (east) close the plain of Ilāvṛta
  for (const xc of [9, -9]) {
    const xx = x - xc + 0.8 * noise2(z * 0.08, xc)
    h += Math.exp(-(xx * xx) / 1.3) * 1.2 * rough * smoothstep(10, 7.5, Math.abs(z))
  }

  // Ilāvṛta: the level plain around Meru
  h = lerp(h, 0.55 + 0.05 * fbm2(x * 0.4, z * 0.4, 2), smoothstep(9.5, 6.5, r))

  // Rivers
  const rv = rivers(x, z)
  if (rv.along > 6.5) {
    const w = 0.2 + 0.006 * rv.along
    const k = 1 - smoothstep(w, w * 2.8, rv.d)
    h = lerp(h, -0.12, k * smoothstep(6.5, 8, rv.along))
  }

  // Kailāsa: a level shelf in front of the south face for Śiva and Pārvatī
  const dEll = Math.hypot((x - SHIVA_SEAT.x) / 1.7, (z - (SHIVA_SEAT.z + 0.7)) / 2.2)
  h = lerp(h, SHIVA_SEAT.h, smoothstep(1.25, 0.8, dEll))

  // The sacred lakes below Kailāsa
  for (const lk of LAKES) {
    const d = Math.hypot(x - lk.x, (z - lk.z) * 1.15) / lk.r
    h = lerp(h, Math.min(h, 0.35), smoothstep(2.2, 1.2, d))
    h = lerp(h, -0.22, smoothstep(1.05, 0.75, d))
  }

  // Coastline
  const coast = coastRadius(x, z)
  const e = smoothstep(coast + 1.4, coast - 1.2, r)
  return h * e + (1 - e) * -1.4
}

/** Distance from the Kailāsa summit axis (used to keep clutter away). */
export const nearKailash = (x: number, z: number, r = 4) => Math.hypot(x - KAILASH.x, z - KAILASH.z) < r

const C = (hex: string) => new THREE.Color(hex)
const COL = {
  sand: C('#b9a77a'),
  grass: C('#5a7f35'),
  grass2: C('#7b8f3c'),
  forest: C('#2f5226'),
  field: C('#a49a4a'),
  rock: C('#6c6158'),
  rock2: C('#4e4741'),
  snow: C('#f4f6fb'),
  ilavrta: C('#b39a4e'),
}

export function buildTerrainGeometry(size = 84, seg = 336) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, heightAt(x, z))
  }
  g.computeVertexNormals()
  const nrm = g.attributes.normal as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const ny = nrm.getY(i)
    const n = fbm2(x * 0.25, z * 0.25, 3)
    const r = Math.hypot(x, z)
    if (y < 0.08) c.copy(COL.sand)
    else {
      c.copy(COL.grass).lerp(COL.grass2, 0.5 + n)
      const forest = smoothstep(0.05, 0.25, fbm2(x * 0.12 + 7, z * 0.12, 3))
      c.lerp(COL.forest, forest * 0.75 * smoothstep(1.3, 0.6, y))
      if (z > 26 && y < 0.9) c.lerp(COL.field, smoothstep(0.1, 0.3, fbm2(x * 0.2, z * 0.2 - 4, 2)) * 0.5)
      c.lerp(COL.ilavrta, smoothstep(9, 6.5, r) * 0.7)
      const rocky = smoothstep(0.86, 0.62, ny) + smoothstep(1.3, 1.8, y)
      c.lerp(n > 0 ? COL.rock : COL.rock2, Math.min(1, rocky))
      const snowLine = 2.0 + n * 0.35
      const snow = smoothstep(snowLine, snowLine + 0.25, y) * smoothstep(0.45, 0.7, ny)
      c.lerp(COL.snow, snow)
    }
    colors.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}
