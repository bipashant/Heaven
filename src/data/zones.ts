import { REALMS, type RealmId } from './realms'
import type { Vec3 } from './layout'

// Where each world is in space, for working out which one you are looking at
// while navigating freely. A zone is a flattened ellipsoid around the realm's
// focus: `r` horizontal radius, `h` vertical half-height, and `d` the furthest
// the camera can be from what it looks at and still count as "in" the realm.
// When several match, the smallest (most specific) wins, e.g. Kailash over
// Bhūloka. Outside every zone you are simply looking at the whole cosmos.

interface Zone {
  r: number
  h: number
  d: number
}

const LOWER: Zone = { r: 195, h: 26, d: 300 }

const ZONES: Partial<Record<RealmId, Zone>> = {
  vaikuntha: { r: 115, h: 95, d: 700 },
  satya: { r: 60, h: 45, d: 380 },
  tapa: { r: 80, h: 40, d: 420 },
  jana: { r: 78, h: 40, d: 420 },
  mahar: { r: 78, h: 38, d: 420 },
  svarga: { r: 90, h: 50, d: 480 },
  bhuvar: { r: 265, h: 65, d: 1300 },
  bhu: { r: 295, h: 45, d: 1500 },
  kailash: { r: 7, h: 7, d: 45 },
  kshira: { r: 14, h: 10, d: 70 },
  atala: LOWER,
  vitala: LOWER,
  sutala: LOWER,
  talatala: LOWER,
  mahatala: LOWER,
  rasatala: LOWER,
  patala: { r: 195, h: 30, d: 360 },
  yama: { r: 85, h: 55, d: 420 },
}

const ENTRIES = Object.entries(ZONES) as [RealmId, Zone][]

/** The realm the camera is looking at, given its orbit target and distance to it. */
export function realmAt(target: { x: number; y: number; z: number }, camDist: number): RealmId {
  let best: RealmId = 'brahmanda'
  let bestR = Infinity
  for (const [id, z] of ENTRIES) {
    if (camDist > z.d || z.r >= bestR) continue
    const c: Vec3 = REALMS[id].focus
    const dxz = Math.hypot(target.x - c[0], target.z - c[2]) / z.r
    const dy = (target.y - c[1]) / z.h
    if (dxz * dxz + dy * dy < 1) {
      best = id
      bestR = z.r
    }
  }
  return best
}
