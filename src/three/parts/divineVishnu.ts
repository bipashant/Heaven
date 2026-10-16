import * as THREE from 'three'
import { GeoBag, compose, type V3 } from '../core/GeoBag'
import { addItem } from './figureBuilder'
import {
  HEAD_C,
  addFace,
  armRadius,
  bandAround,
  beadChain,
  chestLoop,
  foot,
  hand,
  onFace,
  onTorso,
  ribbon,
  sculptHead,
  sculptTorso,
  taperTube,
} from './sculpt'

// High-detail Viṣṇu reclining on Śeṣa (Anantaśayana) and four-headed Brahmā.
// The upper body is built upright and then tilted back about the hips, so
// all the torso helpers (malas, necklaces, garland) still fit the body.

const [, CY] = HEAD_C
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

function arm(bag: GeoBag, S: V3, E: V3, W: V3, k = 1, bend: V3 = [0, 0, 0]) {
  taperTube(bag, 'skin', [S, add3(lerp3(S, E, 0.5), bend), E, lerp3(E, W, 0.5), W], armRadius(k), 40, 14)
}

function ornamentArm(bag: GeoBag, S: V3, E: V3, W: V3) {
  bandAround(bag, 'gold', lerp3(S, E, 0.36), sub(E, S), 0.06, 0.0065) // keyūra
  for (let b = 0; b < 3; b++) bandAround(bag, 'gold', lerp3(E, W, 0.82 + b * 0.05), sub(W, E), 0.034, 0.004)
}

/** Flowers of the vanamālā, alternating colours. */
function garland(bag: GeoBag, pts: V3[], count: number, r: number) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), true, 'centripetal')
  const keys = ['flowerWhite', 'flowerRed', 'flowerYellow', 'leaf']
  for (let i = 0; i < count; i++) {
    const p = curve.getPointAt(i / count)
    const k = keys[i % 4]
    bag.add(k, new THREE.SphereGeometry(k === 'leaf' ? r * 0.8 : r, 8, 6), new THREE.Matrix4().makeTranslation(p.x, p.y, p.z))
  }
}

/** A tall faceted kirīṭa crown with jewelled bands. */
function kirita(bag: GeoBag, y0: number, scale = 1, hScale = scale) {
  const s = scale
  const h = hScale
  bag.cyl('gold', [0, y0, -0.01], 0.088 * s, 0.093 * s, 0.03 * s, 40)
  bag.cyl('gold', [0, y0 + 0.11 * h, -0.01], 0.056 * s, 0.084 * s, 0.19 * h, 8)
  for (let i = 0; i < 4; i++) bag.torus('gold', [0, y0 + (0.03 + i * 0.05) * h, -0.01], (0.084 - i * 0.008) * s, 0.0035 * s, [Math.PI / 2, 0, 0], Math.PI * 2, 32)
  bag.cyl('gold', [0, y0 + 0.225 * h, -0.01], 0.032 * s, 0.056 * s, 0.04 * h, 8)
  bag.sphere('gold', [0, y0 + 0.255 * h, -0.01], 1, [0.028 * s, 0.022 * s, 0.028 * s], 16)
  bag.cone('gold', [0, y0 + 0.29 * h, -0.01], 0.012 * s, 0.04 * h, 10)
  bag.sphere('kaustubha', [0, y0 + 0.315 * h, -0.01], 0.007 * s, 1, 10)
  // front plate and jewels
  bag.sphere('gold', [0, y0 + 0.06 * s, 0.075 * s], 1, [0.05 * s, 0.045 * s, 0.009 * s], 20, [-0.2, 0, 0])
  bag.sphere('kaustubha', [0, y0 + 0.06 * s, 0.084 * s], 0.012 * s, 1, 14)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    bag.sphere(i % 2 ? 'jewelGreen' : 'jewelRed', [Math.sin(a) * 0.078 * s, y0 + 0.08 * s, -0.01 + Math.cos(a) * 0.078 * s], 0.0055 * s, 1, 8)
  }
}

/** Right-handed conch (dakṣiṇāvarta śaṅkha), spiral ridges, opening at the base. */
function conch(bag: GeoBag, at: V3, rot: V3, size: number) {
  const prof: [number, number][] = []
  for (let i = 0; i <= 18; i++) {
    const t = i / 18
    const r = (0.045 * Math.sin(Math.PI * Math.pow(t, 0.75)) + 0.006) * (1 + 0.12 * Math.sin(t * 40))
    prof.push([r, t * 0.13 - 0.06])
  }
  bag.lathe('pearl', prof, at, size, 18, rot)
  bag.addT('pearl', new THREE.TorusGeometry(0.03, 0.009, 8, 18, Math.PI * 1.4), at, rot, size)
}

export const RECLINE_TILT = -1.22
const HIP: V3 = [0, 0.15, 0]
const upperM = () => compose(HIP, [RECLINE_TILT, 0, 0]).multiply(compose([-HIP[0], -HIP[1], -HIP[2]]))
const headM = () => compose([0, 0.72, 0], [0.5, 0, 0]).multiply(compose([0, -0.72, 0]))

export interface VishnuAnchors {
  chakra: { pos: V3; quat: [number, number, number, number] }
  head: V3
  navel: V3
  feet: V3
}

export function buildVishnuReclining(): { geos: Record<string, THREE.BufferGeometry>; anchors: VishnuAnchors } {
  const bag = new GeoBag()

  // ---- legs, lying along +z; the left crosses over at the ankle -----------
  const rHip: V3 = [-0.085, 0.13, 0.04]
  const rKnee: V3 = [-0.1, 0.115, 0.46]
  const rAnk: V3 = [-0.088, 0.1, 0.86]
  const lHip: V3 = [0.085, 0.14, 0.04]
  const lKnee: V3 = [0.115, 0.2, 0.44]
  const lAnk: V3 = [0.02, 0.17, 0.835]
  for (const [H, K, A] of [
    [rHip, rKnee, rAnk],
    [lHip, lKnee, lAnk],
  ] as [V3, V3, V3][]) {
    taperTube(bag, 'skin', [H, lerp3(H, K, 0.5), K], (t) => 0.084 - 0.026 * t)
    taperTube(bag, 'skin', [K, lerp3(K, A, 0.5), A], (t) => 0.056 - 0.022 * t)
    // pītāmbara, the yellow silk, to below the knee
    taperTube(bag, 'pita', [lerp3(H, K, -0.05), lerp3(H, K, 0.5), K, lerp3(K, A, 0.36)], (t) => 0.098 - 0.032 * t, 32, 18)
    bandAround(bag, 'gold', lerp3(K, A, 0.36), sub(A, K), 0.07, 0.0055)
    bandAround(bag, 'gold', lerp3(K, A, 0.93), sub(A, K), 0.037, 0.005) // anklet
  }
  foot(bag, 'skin', [-0.088, 0.085, 0.885], [-0.1, 0.92, 0.38], [0, 0, -1])
  foot(bag, 'skin', [0.02, 0.16, 0.862], [0.14, 0.9, 0.42], [0, 0, -1])
  bag.sphere('pita', [0, 0.15, 0.04], 1, [0.2, 0.1, 0.13], 28)
  ribbon(bag, 'pita', [[0, 0.262, 0.08], [0.006, 0.272, 0.28], [0.0, 0.245, 0.5]], 0.075, () => new THREE.Vector3(0, 1, 0.1), 24)

  // ---- upper body, tilted back about the hips -------------------------------
  bag.push(upperM())
  bag.add('skin', sculptTorso())
  bag.torus('gold', [0, 0.207, 0.004], 0.2, 0.013, [Math.PI / 2, 0, 0], Math.PI * 2, 64, [1.12, 0.76, 1])
  bag.tube(
    'thread',
    Array.from({ length: 12 }, (_, i) => {
      const t = i / 11
      return onTorso(false, 0.62 - t * 0.4, -0.95 + t * 1.9, 0.004)
    }),
    0.0033,
    90,
    5,
  )
  beadChain(bag, 'gold', chestLoop(false, [[0.6, 0], [0.615, 0.5], [0.64, 1.05], [0.66, 1.8], [0.668, Math.PI]], 0.009), 64, 0.0056, true)
  beadChain(bag, 'gold', chestLoop(false, [[0.53, 0], [0.56, 0.45], [0.61, 0.95], [0.65, 1.7], [0.668, Math.PI]], 0.017), 76, 0.0058, true)
  // Kaustubha on the chest, Śrīvatsa on the right breast
  const kp = onTorso(false, 0.508, 0, 0.026)
  bag.sphere('kaustubha', kp, 0.017, 1, 16)
  bag.torus('gold', kp, 0.02, 0.0034, [0, 0, 0], Math.PI * 2, 24)
  bag.torus('gold', onTorso(false, 0.53, -0.48, 0.004), 0.011, 0.0022, [0, -0.5, 0.4], Math.PI * 1.6, 14)
  bag.torus('gold', onTorso(false, 0.515, -0.43, 0.004), 0.008, 0.0022, [0, -0.5, -0.6], Math.PI * 1.5, 14)
  // vanamālā, the garland of forest flowers
  garland(bag, chestLoop(false, [[0.2, 0], [0.27, 0.32], [0.4, 0.62], [0.55, 0.95], [0.64, 1.5], [0.668, 2.3], [0.672, Math.PI]], 0.042), 120, 0.011)

  bag.cyl('skin', [0, 0.73, 0.004], 0.05, 0.058, 0.1, 24)
  // the head inclines toward the chest
  bag.push(headM())
  bag.add('skin', sculptHead())
  addFace(bag, { meditative: true })
  // ūrdhva-puṇḍra: the Vaiṣṇava tilaka
  for (const s of [-1, 1]) bag.tube('ash', [onFace(s * 0.006, CY + 0.016), onFace(s * 0.012, CY + 0.042), onFace(s * 0.014, CY + 0.07)], 0.0021, 14, 5)
  bag.tube('ash', [onFace(-0.006, CY + 0.016), onFace(0, CY + 0.01), onFace(0.006, CY + 0.016)], 0.0021, 8, 5)
  bag.tube('tilak', [onFace(0, CY + 0.024, false, 0.0022), onFace(0, CY + 0.066, false, 0.0022)], 0.0016, 8, 5)
  // hair and curls at the nape
  bag.sphere('hair', [0, 0.852, -0.012], 1, [0.0905, 0.1, 0.0965], 32)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      taperTube(
        bag,
        'hair',
        [
          [s * (0.05 + k * 0.012), 0.8, -0.07 - k * 0.006],
          [s * (0.085 + k * 0.012), 0.73, -0.075],
          [s * (0.12 + k * 0.012), 0.67, -0.05 + Math.sin(k) * 0.01],
        ],
        (t) => 0.012 - 0.007 * t,
        14,
        6,
      )
    }
    // makara-kuṇḍala
    bag.torus('gold', [s * 0.088, CY - 0.05, -0.008], 0.02, 0.0055, [0, Math.PI / 2, 0], Math.PI * 2, 24)
    bag.cone('gold', [s * 0.09, CY - 0.078, -0.004], 0.009, 0.022, 8, [Math.PI, 0, s * 0.3])
    bag.sphere('kaustubha', [s * 0.092, CY - 0.05, -0.002], 0.0045, 1, 8)
  }
  kirita(bag, 0.925, 1, 0.6)
  bag.pop()

  // ---- four arms -----------------------------------------------------------
  // lower right: cradles his head
  const rS: V3 = [-0.235, 0.585, -0.01]
  const rE: V3 = [-0.34, 0.77, -0.12]
  const rW: V3 = [-0.14, 0.88, -0.07]
  arm(bag, rS, rE, rW)
  hand(bag, 'skin', rW, [0.45, 0.45, 0.6], [0.7, -0.2, -0.5], { curl: 0.45, side: -1 })
  // lower left: rests along his body
  const lS: V3 = [0.235, 0.585, -0.01]
  const lE: V3 = [0.33, 0.37, 0.06]
  const lW: V3 = [0.27, 0.17, 0.15]
  arm(bag, lS, lE, lW)
  hand(bag, 'skin', lW, [0.0, -0.75, 0.6], [-0.6, -0.1, -0.7], { curl: 0.3, side: 1 })
  // upper right: Sudarśana
  const urS: V3 = [-0.2, 0.57, -0.06]
  const urE: V3 = [-0.4, 0.66, -0.16]
  const urW: V3 = [-0.42, 0.86, -0.12]
  arm(bag, urS, urE, urW, 0.92)
  hand(bag, 'skin', urW, [0, 1, 0.1], [0.2, 0, 1], { curl: 0.55, side: -1 })
  // upper left: Pāñcajanya, the conch
  const ulS: V3 = [0.2, 0.57, -0.06]
  const ulE: V3 = [0.4, 0.62, -0.12]
  const ulW: V3 = [0.43, 0.8, -0.06]
  arm(bag, ulS, ulE, ulW, 0.92)
  hand(bag, 'skin', ulW, [0, 1, 0.15], [-0.3, 0, 1], { curl: 0.6, side: 1 })
  conch(bag, [ulW[0] - 0.005, ulW[1] + 0.07, ulW[2] + 0.02], [0, 0, 0.3], 1)
  for (const [S, E, W] of [
    [rS, rE, rW],
    [lS, lE, lW],
    [urS, urE, urW],
    [ulS, ulE, ulW],
  ] as [V3, V3, V3][]) {
    ornamentArm(bag, S, E, W)
  }
  bag.pop()

  // anchors in the figure's own frame
  const U = upperM()
  const toArr = (v: THREE.Vector3): V3 => [v.x, v.y, v.z]
  const chakraPos = new THREE.Vector3(urW[0], urW[1] + 0.1, urW[2] + 0.02).applyMatrix4(U)
  const q = new THREE.Quaternion().setFromRotationMatrix(U)
  const head = new THREE.Vector3(...HEAD_C).applyMatrix4(headM()).applyMatrix4(U)
  const navel = new THREE.Vector3(...onTorso(false, 0.27, 0, 0.004)).applyMatrix4(U)
  return {
    geos: bag.merge(),
    anchors: {
      chakra: { pos: toArr(chakraPos), quat: [q.x, q.y, q.z, q.w] },
      head: toArr(head),
      navel: toArr(navel),
      feet: [-0.03, 0.13, 0.92],
    },
  }
}

// ===========================================================================
// BRAHMĀ
// ===========================================================================

export function buildBrahma(): Record<string, THREE.BufferGeometry> {
  const bag = new GeoBag()
  // legs in padmāsana under a white dhoti
  taperTube(bag, 'cloth', [[0.09, 0.15, 0.0], [0.26, 0.12, 0.1], [0.4, 0.1, 0.2]], (t) => 0.098 - 0.03 * t)
  taperTube(bag, 'cloth', [[-0.09, 0.14, 0.0], [-0.26, 0.11, 0.1], [-0.4, 0.09, 0.2]], (t) => 0.098 - 0.03 * t)
  taperTube(bag, 'cloth', [[0.4, 0.09, 0.21], [0.16, 0.135, 0.275], [-0.1, 0.17, 0.225]], (t) => 0.064 - 0.02 * t)
  taperTube(bag, 'cloth', [[-0.4, 0.08, 0.21], [-0.16, 0.1, 0.295], [0.1, 0.125, 0.255]], (t) => 0.062 - 0.02 * t)
  foot(bag, 'skin', [-0.105, 0.19, 0.215], [-0.95, 0.12, -0.32], [0, 1, 0.1])
  foot(bag, 'skin', [0.105, 0.148, 0.245], [0.95, 0.1, -0.3], [0, 1, 0.1])
  bag.sphere('cloth', [0, 0.155, 0.0], 1, [0.27, 0.11, 0.21], 32)

  bag.add('skin', sculptTorso())
  bag.torus('gold', [0, 0.207, 0.004], 0.2, 0.012, [Math.PI / 2, 0, 0], Math.PI * 2, 64, [1.12, 0.76, 1])
  // saffron uttarīya across the chest
  ribbon(
    bag,
    'cloth2',
    ([
      [0.24, -0.85, 0.016],
      [0.36, -0.45, 0.018],
      [0.47, 0.0, 0.02],
      [0.56, 0.45, 0.022],
      [0.625, 0.95, 0.022],
      [0.645, 1.6, 0.03],
      [0.58, 2.3, 0.022],
      [0.42, 2.7, 0.02],
    ] as [number, number, number][]).map(([y, a, o]) => onTorso(false, y, a, o)),
    0.1,
    (p) => new THREE.Vector3(p.x, (p.y - 0.4) * 0.3, p.z),
    60,
  )
  beadChain(bag, 'gold', chestLoop(false, [[0.58, 0], [0.6, 0.5], [0.635, 1.05], [0.66, 1.8], [0.668, Math.PI]], 0.01), 60, 0.0055, true)
  bag.cyl('skin', [0, 0.73, 0.004], 0.05, 0.058, 0.1, 24)

  // four heads facing the four directions, each bearded and crowned
  const hc = new THREE.Vector3(...HEAD_C)
  for (let k = 0; k < 4; k++) {
    const m = compose([0, 0, 0], [0, (k * Math.PI) / 2, 0])
      .multiply(compose([0, -0.012, 0.045]))
      .multiply(compose(hc.toArray() as V3))
      .multiply(compose([0, 0, 0], [0, 0, 0], 0.8))
      .multiply(compose(hc.clone().negate().toArray() as V3))
    bag.push(m)
    bag.add('skin', sculptHead())
    addFace(bag, { meditative: true })
    bag.sphere('hairWhite', [0, 0.852, -0.012], 1, [0.0905, 0.1, 0.0965], 24)
    bag.sphere('beard', [0, CY - 0.07, 0.042], 1, [0.072, 0.066, 0.055], 20)
    bag.tube('beard', [onFace(-0.03, CY - 0.034, false, 0.004), onFace(0, CY - 0.04, false, 0.006), onFace(0.03, CY - 0.034, false, 0.004)], 0.006, 10, 6)
    for (let j = 0; j < 5; j++) {
      const x = (j - 2) * 0.022
      taperTube(bag, 'beard', [[x, CY - 0.09, 0.07], [x * 1.1, CY - 0.13, 0.065], [x * 0.9, CY - 0.17, 0.05]], (t) => 0.012 - 0.008 * t, 10, 6)
    }
    bag.cyl('gold', [0, 0.94, -0.01], 0.07, 0.09, 0.03, 32)
    bag.cyl('gold', [0, 0.99, -0.01], 0.04, 0.07, 0.07, 8)
    bag.sphere('jewelRed', [0, 0.95, 0.088], 0.008, 1, 10)
    bag.pop()
  }
  bag.cyl('gold', [0, 1.06, 0], 0.03, 0.06, 0.08, 8)
  bag.sphere('gold', [0, 1.11, 0], 0.025, 1, 12)
  bag.cone('gold', [0, 1.145, 0], 0.01, 0.04, 8)

  // four arms: blessing, kamaṇḍalu, akṣamālā, the Vedas
  const R1: [V3, V3, V3] = [[0.235, 0.585, -0.01], [0.335, 0.37, 0.07], [0.305, 0.53, 0.175]]
  const L1: [V3, V3, V3] = [[-0.235, 0.585, -0.01], [-0.335, 0.36, 0.05], [-0.36, 0.205, 0.2]]
  const R2: [V3, V3, V3] = [[0.2, 0.57, -0.06], [0.4, 0.62, -0.12], [0.43, 0.82, -0.08]]
  const L2: [V3, V3, V3] = [[-0.2, 0.57, -0.06], [-0.4, 0.62, -0.12], [-0.43, 0.82, -0.08]]
  arm(bag, ...R1)
  hand(bag, 'skin', R1[2], [-0.08, 1, 0.12], [0, 0.05, 1], { curl: 0.06, side: -1 })
  arm(bag, ...L1)
  hand(bag, 'skin', L1[2], [-0.05, -0.45, 0.9], [0, -1, -0.35], { curl: 0.5, side: 1 })
  addItem(bag, 'kamandalu', [L1[2][0], L1[2][1] - 0.02, L1[2][2] + 0.04], -1)
  arm(bag, ...R2, 0.92)
  hand(bag, 'skin', R2[2], [0, 1, 0.1], [0, 0, 1], { curl: 0.6, side: -1 })
  addItem(bag, 'mala', R2[2], 1)
  arm(bag, ...L2, 0.92)
  hand(bag, 'skin', L2[2], [0, 1, 0.1], [0, 0, 1], { curl: 0.6, side: 1 })
  addItem(bag, 'book', [L2[2][0], L2[2][1] + 0.05, L2[2][2]], -1)
  for (const [S, E, W] of [R1, L1, R2, L2]) ornamentArm(bag, S, E, W)

  bag.torus('halo', [0, CY + 0.06, -0.17], 0.2, 0.007, [0, 0, 0], Math.PI * 2, 72)
  return bag.merge()
}
