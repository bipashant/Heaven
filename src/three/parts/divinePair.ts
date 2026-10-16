import * as THREE from 'three'
import { GeoBag, type V3 } from '../core/GeoBag'
import { smoothstep } from '../core/noise'
import { addSmallLotus } from './figureBuilder'
import {
  HEAD_C,
  addFace,
  armRadius,
  bandAround,
  beadChain,
  beadRing,
  chestLoop,
  foot,
  hand,
  loop,
  onFace,
  onTorso,
  ribbon,
  sculptHead,
  sculptTorso,
  taperTube,
} from './sculpt'

// High-detail seated figures of Śiva and Pārvatī for Kailāsa. Units: seated
// height ≈ 1, facing +z. Śiva is mirrored in the scene so that his raised right
// hand blesses and Pārvatī sits on his left (vāma-bhāga).

const [, CY] = HEAD_C
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

function arm(bag: GeoBag, key: string, pts: V3[], k: number) {
  taperTube(bag, key, pts, armRadius(k), 40, 14)
}

function halo(bag: GeoBag) {
  bag.torus('halo', [0, CY + 0.03, -0.15], 0.178, 0.0065, [0, 0, 0], Math.PI * 2, 72)
  bag.torus('halo', [0, CY + 0.03, -0.155], 0.198, 0.0032, [0, 0, 0], Math.PI * 2, 72)
}

// ===========================================================================
// ŚIVA
// ===========================================================================

export function buildShiva(): Record<string, THREE.BufferGeometry> {
  const bag = new GeoBag()

  // ---- legs in padmāsana -----------------------------------------------
  taperTube(bag, 'skin', [[0.09, 0.15, 0.0], [0.26, 0.12, 0.1], [0.4, 0.1, 0.2]], (t) => 0.09 - 0.032 * t)
  taperTube(bag, 'skin', [[-0.09, 0.14, 0.0], [-0.26, 0.11, 0.1], [-0.4, 0.09, 0.2]], (t) => 0.09 - 0.032 * t)
  taperTube(bag, 'skin', [[0.4, 0.09, 0.21], [0.16, 0.135, 0.275], [-0.1, 0.17, 0.225]], (t) => 0.057 - 0.021 * t)
  taperTube(bag, 'skin', [[-0.4, 0.08, 0.21], [-0.16, 0.1, 0.295], [0.1, 0.125, 0.255]], (t) => 0.055 - 0.02 * t)
  foot(bag, 'skin', [-0.105, 0.19, 0.215], [-0.95, 0.12, -0.32], [0, 1, 0.1])
  foot(bag, 'skin', [0.105, 0.148, 0.245], [0.95, 0.1, -0.3], [0, 1, 0.1])

  // tiger skin around the hips, a flap hanging over the crossed shins
  bag.sphere('tiger', [0, 0.155, 0.0], 1, [0.27, 0.11, 0.21], 32)
  bag.sphere('tiger', [0, 0.14, 0.215], 1, [0.15, 0.09, 0.022], 24, [-0.3, 0, 0])
  bag.sphere('tiger', [0.24, 0.12, 0.16], 1, [0.07, 0.06, 0.03], 16, [0, 0.5, 0.2])
  bag.sphere('tiger', [-0.24, 0.12, 0.16], 1, [0.07, 0.06, 0.03], 16, [0, -0.5, -0.2])

  // ---- torso -----------------------------------------------------------
  bag.add('skin', sculptTorso())
  // a serpent for a belt
  bag.torus('snake', [0, 0.208, 0.004], 0.198, 0.013, [Math.PI / 2, 0, 0], Math.PI * 2, 64, [1.12, 0.76, 1])
  // sacred thread
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
  // rudrākṣa mālās: a long strand to the belly, a short one at the collar
  beadChain(
    bag,
    'rudraksha',
    chestLoop(false, [[0.385, 0], [0.42, 0.22], [0.5, 0.46], [0.6, 0.85], [0.655, 1.5], [0.67, 2.3], [0.672, Math.PI]], 0.011),
    108,
    0.0074,
    true,
  )
  beadChain(bag, 'rudraksha', chestLoop(false, [[0.6, 0], [0.615, 0.5], [0.64, 1.05], [0.66, 1.8], [0.668, Math.PI]], 0.009), 66, 0.0062, true)

  // ---- neck & head -------------------------------------------------------
  bag.cyl('throat', [0, 0.73, 0.004], 0.05, 0.058, 0.1, 24) // Nīlakaṇṭha, the blue throat
  bag.add('skin', sculptHead())
  addFace(bag, { meditative: true })
  // tripuṇḍra: three lines of sacred ash across the forehead
  for (let k = 0; k < 3; k++) {
    const y = CY + 0.046 + k * 0.0078
    bag.tube('ash', [-0.046, -0.024, 0, 0.024, 0.046].map((x) => onFace(x * (1 - k * 0.04), y, false, 0.0016)), 0.0017, 24, 5)
  }
  // the third eye
  bag.sphere('third', onFace(0, CY + 0.038, false, 0.0012), 1, [0.0042, 0.0105, 0.003], 10)
  // earrings
  for (const s of [-1, 1]) bag.torus('gold', [s * 0.088, CY - 0.046, -0.01], 0.021, 0.0045, [0, Math.PI / 2, 0], Math.PI * 2, 28)

  // ---- jaṭā: matted locks coiled into a tall crown --------------------------
  bag.sphere('hair', [0, 0.852, -0.012], 1, [0.0905, 0.1, 0.0965], 32)
  const coil: V3[] = []
  for (let k = 0; k <= 46; k++) {
    const a = k * 0.42
    const r = 0.076 - k * 0.00095
    coil.push([Math.sin(a) * r, 0.922 + k * 0.0037, -0.016 + Math.cos(a) * r * 0.9])
  }
  taperTube(bag, 'hair', coil, (t) => 0.021 - 0.007 * t, 220, 10)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    taperTube(
      bag,
      'hair',
      [
        [Math.sin(a) * 0.072, 0.925, -0.016 + Math.cos(a) * 0.064],
        [Math.sin(a + 0.4) * 0.06, 0.99, -0.016 + Math.cos(a + 0.4) * 0.054],
        [Math.sin(a + 0.8) * 0.038, 1.07, -0.016 + Math.cos(a + 0.8) * 0.034],
      ],
      (t) => 0.011 - 0.004 * t,
      16,
      8,
    )
  }
  bag.sphere('hair', [0, 1.1, -0.016], 1, [0.034, 0.026, 0.032], 16)
  beadRing(bag, 'rudraksha', [0, 0.935, -0.016], [0, 1, 0], 0.084, 26, 0.0068)
  // the crescent moon in his hair
  bag.torus('moon', [0.072, 1.0, 0.036], 0.04, 0.0085, [0, 0.4, 0.9], Math.PI * 1.15, 28)
  // locks falling down the back and over the shoulders
  for (let i = 0; i < 9; i++) {
    const x0 = (i - 4) * 0.019
    const w = Math.sin(i * 1.7) * 0.012
    taperTube(
      bag,
      'hair',
      [
        [x0, 0.88, -0.09 + Math.abs(x0) * 0.2],
        [x0 * 1.4 + w, 0.78, -0.16],
        [x0 * 1.8 - w, 0.66, -0.205],
        [x0 * 2.1 + w, 0.5, -0.205],
      ],
      (t) => 0.017 - 0.01 * t,
      24,
      7,
    )
  }
  for (const s of [-1, 1]) {
    for (let j = 0; j < 2; j++) {
      taperTube(
        bag,
        'hair',
        [
          [s * (0.074 + j * 0.01), 0.83, -0.035 - j * 0.02],
          [s * (0.16 + j * 0.015), 0.67, 0.0 - j * 0.03],
          [s * (0.205 + j * 0.015), 0.53, 0.05 - j * 0.04],
        ],
        (t) => 0.013 - 0.008 * t,
        20,
        7,
      )
    }
  }

  // ---- Vāsuki coiled around his neck, hood raised by his shoulder ---------
  const snake: V3[] = []
  for (let k = 0; k <= 12; k++) {
    const a = Math.PI + (k / 12) * Math.PI * 1.7
    snake.push([Math.sin(a) * 0.084, 0.68 + k * 0.0018, 0.004 + Math.cos(a) * 0.072])
  }
  snake.push([0.118, 0.725, 0.045], [0.146, 0.8, 0.072], [0.152, 0.866, 0.09])
  taperTube(bag, 'snake', snake, (t) => 0.004 + 0.01 * Math.min(1, t * 4), 90, 10)
  bag.sphere('snake', [0.152, 0.892, 0.094], 1, [0.034, 0.043, 0.011], 18)
  bag.sphere('belly', [0.152, 0.889, 0.1], 1, [0.022, 0.032, 0.006], 14)
  bag.sphere('snake', [0.152, 0.87, 0.108], 1, [0.012, 0.009, 0.018], 12)
  for (const s of [-1, 1]) bag.sphere('jewelRed', [0.152 + s * 0.006, 0.874, 0.122], 0.0022, 1, 6)

  // ---- arms & hands --------------------------------------------------------
  // raised hand in abhaya mudrā (becomes his right after mirroring)
  const rS: V3 = [0.235, 0.585, -0.01]
  const rE: V3 = [0.335, 0.37, 0.07]
  const rW: V3 = [0.305, 0.53, 0.175]
  arm(bag, 'skin', [rS, [0.3, 0.47, 0.02], rE, [0.33, 0.46, 0.13], rW], 1)
  hand(bag, 'skin', rW, [-0.08, 1, 0.12], [0, 0.05, 1], { curl: 0.06, side: -1 })
  // the other rests on his knee
  const lS: V3 = [-0.235, 0.585, -0.01]
  const lE: V3 = [-0.335, 0.36, 0.05]
  const lW: V3 = [-0.36, 0.205, 0.2]
  arm(bag, 'skin', [lS, [-0.3, 0.47, 0.01], lE, [-0.355, 0.28, 0.13], lW], 1)
  hand(bag, 'skin', lW, [-0.05, -0.45, 0.9], [0, -1, -0.35], { curl: 0.35, side: 1 })
  for (const [S, E, W] of [
    [rS, rE, rW],
    [lS, lE, lW],
  ] as [V3, V3, V3][]) {
    beadRing(bag, 'rudraksha', lerp3(S, E, 0.42), sub(E, S), 0.062, 18, 0.0072)
    beadRing(bag, 'rudraksha', lerp3(E, W, 0.86), sub(W, E), 0.036, 14, 0.0062)
    bandAround(bag, 'snake', lerp3(S, E, 0.3), sub(E, S), 0.062, 0.006)
  }

  halo(bag)
  return bag.merge()
}

// ===========================================================================
// PĀRVATĪ
// ===========================================================================

/** Sari falling over folded legs: a lathe whose hem carries the gold border (v = 1). */
function sariSkirt() {
  const prof = new THREE.SplineCurve(
    [
      [0.162, 0.245],
      [0.205, 0.205],
      [0.3, 0.168],
      [0.42, 0.132],
      [0.49, 0.088],
      [0.515, 0.036],
      [0.5, 0.0],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
  )
  const ny = 48
  const na = 96
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let k = 0; k <= ny; k++) {
    const p = prof.getPoint(k / ny)
    for (let i = 0; i <= na; i++) {
      let a = (Math.PI + (i / na) * Math.PI * 2) % (Math.PI * 2)
      if (a > Math.PI) a -= Math.PI * 2
      const front = Math.exp(-((a / 1.1) ** 2))
      const pleat = 1 + 0.02 * Math.sin(a * 28) * smoothstep(0.14, 0.02, p.y) * front
      const r = p.x * pleat
      pos.push(Math.sin(a) * r, p.y, Math.cos(a) * r * 0.72 + 0.075 * smoothstep(0.245, 0.11, p.y))
      uv.push((i / na) * 6, k / ny)
    }
  }
  for (let k = 0; k < ny; k++) {
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

export interface GoddessOpts {
  /** 'lotus': one hand raises a lotus, the other rests in the lap. 'seva': both hands reach forward to press the Lord's feet. */
  hands: 'lotus' | 'seva'
  /** Pārvatī's tiered mukuṭa, or Lakṣmī's taller kirīṭa. */
  crown: 'mukuta' | 'kirita'
}

export const buildParvati = () => buildGoddess({ hands: 'lotus', crown: 'mukuta' })
export const buildLakshmi = () => buildGoddess({ hands: 'seva', crown: 'kirita' })

export function buildGoddess(o: GoddessOpts): Record<string, THREE.BufferGeometry> {
  const bag = new GeoBag()
  const F = true

  // ---- lower body: sari over folded legs, feet at the hem -----------------
  bag.add('sari', sariSkirt())
  foot(bag, 'skin', [0.07, 0.02, 0.33], [0.25, -0.06, 1], [0, 1, 0], 0.9)
  foot(bag, 'skin', [-0.12, 0.02, 0.31], [-0.3, -0.06, 1], [0, 1, 0], 0.9)
  bag.torus('gold', [0.07, 0.03, 0.335], 0.028, 0.004, [Math.PI / 2 - 0.2, 0, 0], Math.PI * 2, 20)
  bag.torus('gold', [-0.12, 0.03, 0.315], 0.028, 0.004, [Math.PI / 2 - 0.2, 0, 0], Math.PI * 2, 20)

  // ---- torso, choli and pallu ------------------------------------------------
  bag.add('skin', sculptTorso({ female: F }))
  bag.add('blouse', sculptTorso({ female: F, range: [0.43, 0.6], inflate: 1.035 }))
  beadChain(bag, 'gold', Array.from({ length: 24 }, (_, i) => onTorso(F, 0.434, -Math.PI + (i / 24) * Math.PI * 2, 0.009)), 72, 0.0034, true)
  // kamarbandh: a jewelled waist chain
  beadChain(bag, 'gold', Array.from({ length: 24 }, (_, i) => onTorso(F, 0.245, -Math.PI + (i / 24) * Math.PI * 2, 0.012)), 56, 0.0072, true)
  bag.sphere('jewelRed', onTorso(F, 0.236, 0, 0.02), 0.009, 1, 10)
  // pallu: across the chest and over her left shoulder
  ribbon(
    bag,
    'sari',
    ([
      [0.24, -0.85, 0.018],
      [0.33, -0.45, 0.02],
      [0.42, -0.05, 0.026],
      [0.5, 0.3, 0.03],
      [0.58, 0.62, 0.026],
      [0.632, 1.1, 0.022],
      [0.64, 1.7, 0.034],
      [0.6, 2.3, 0.024],
      [0.5, 2.6, 0.022],
      [0.35, 2.75, 0.02],
    ] as [number, number, number][]).map(([y, a, o]) => onTorso(F, y, a, o)),
    0.115,
    (p) => new THREE.Vector3(p.x, (p.y - 0.4) * 0.3, p.z),
    80,
  )

  // ---- jewellery at the neck ---------------------------------------------------
  beadChain(bag, 'gold', loop(0, 0.698, 0.004, 0.05, 0.047, 0.004, 24), 30, 0.0058, true)
  bag.sphere('jewelRed', [0, 0.69, 0.054], 0.0062, 1, 10)
  beadChain(bag, 'pearl', chestLoop(F, [[0.6, 0], [0.613, 0.5], [0.64, 1.0], [0.66, 1.8], [0.668, Math.PI]], 0.009), 44, 0.0056, true)
  beadChain(bag, 'gold', chestLoop(F, [[0.555, 0], [0.58, 0.45], [0.625, 0.95], [0.655, 1.7], [0.668, Math.PI]], 0.018), 52, 0.0062, true)
  const pend = onTorso(F, 0.535, 0, 0.026)
  bag.sphere('jewelRed', pend, 0.012, 1, 14)
  bag.torus('gold', pend, 0.014, 0.0028, [0, 0, 0], Math.PI * 2, 20)

  // ---- neck & head ---------------------------------------------------------
  bag.cyl('skin', [0, 0.728, 0.004], 0.043, 0.05, 0.1, 24)
  bag.add('skin', sculptHead(true))
  addFace(bag, { female: true })
  bag.sphere('tilak', onFace(0, CY + 0.036, F, 0.0012), 1, [0.0048, 0.0048, 0.002], 10) // bindī
  bag.torus('gold', onFace(0.012, CY - 0.031, F, 0.002), 0.008, 0.0012, [0, 0.4, 0], Math.PI * 2, 16) // nath
  // hair, parted and gathered into a bun with jasmine, a long braid behind
  bag.sphere('hair', [0, 0.852, -0.014], 1, [0.086, 0.097, 0.092], 32)
  for (const s of [-1, 1]) bag.sphere('hair', [s * 0.07, 0.848, -0.02], 1, [0.026, 0.062, 0.07], 16)
  bag.tube('tilak', [onFace(0, CY + 0.088, F, 0.003), [0, 0.948, 0.03], [0, 0.955, -0.01]], 0.0019, 12, 5) // sindoor
  bag.sphere('hair', [0, 0.84, -0.118], 1, [0.066, 0.056, 0.05], 20)
  beadChain(bag, 'flower', Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2
    return [Math.sin(a) * 0.066, 0.84 + Math.cos(a) * 0.058, -0.14] as V3
  }), 34, 0.0074, true)
  for (let k = 0; k < 16; k++) {
    const s = k % 2 ? 1 : -1
    bag.sphere('hair', [s * 0.007, 0.79 - k * 0.022, -0.135 - k * 0.0025], 1, [0.019 - k * 0.0006, 0.017, 0.015], 12, [0, 0, s * 0.35])
  }
  bag.sphere('hair', [0, 0.43, -0.178], 0.012, 1, 10)
  // the crown: a tiered gold mukuṭa (Pārvatī) or a tall kirīṭa (Lakṣmī)
  bag.cyl('gold', [0, 0.936, -0.012], 0.08, 0.089, 0.026, 40)
  bag.torus('gold', [0, 0.95, -0.012], 0.08, 0.0035, [Math.PI / 2, 0, 0], Math.PI * 2, 48)
  if (o.crown === 'mukuta') {
    bag.cyl('gold', [0, 0.966, -0.012], 0.058, 0.076, 0.034, 32)
    bag.cyl('gold', [0, 0.995, -0.012], 0.036, 0.055, 0.026, 24)
    bag.sphere('gold', [0, 1.016, -0.012], 1, [0.026, 0.02, 0.026], 16)
    bag.cone('gold', [0, 1.04, -0.012], 0.01, 0.028, 10)
    bag.sphere('jewelRed', [0, 1.056, -0.012], 0.0065, 1, 10)
  } else {
    bag.cyl('gold', [0, 0.985, -0.012], 0.05, 0.074, 0.075, 12)
    for (let i = 0; i < 3; i++) bag.torus('gold', [0, 0.962 + i * 0.026, -0.012], 0.071 - i * 0.008, 0.003, [Math.PI / 2, 0, 0], Math.PI * 2, 40)
    bag.cyl('gold', [0, 1.04, -0.012], 0.03, 0.05, 0.036, 12)
    bag.sphere('gold', [0, 1.066, -0.012], 1, [0.026, 0.022, 0.026], 16)
    bag.cone('gold', [0, 1.096, -0.012], 0.011, 0.034, 10)
    bag.sphere('jewelGreen', [0, 1.118, -0.012], 0.0065, 1, 10)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      bag.sphere(i % 2 ? 'jewelGreen' : 'jewelRed', [Math.sin(a) * 0.066, 0.99, -0.012 + Math.cos(a) * 0.066], 0.006, 1, 8)
    }
  }
  // the ornate front plate
  bag.sphere('gold', [0, 0.968, 0.068], 1, [0.046, 0.034, 0.008], 20, [-0.25, 0, 0])
  bag.torus('gold', [0, 0.968, 0.075], 0.022, 0.003, [-0.25, 0, 0], Math.PI * 2, 24)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    bag.cone('gold', [Math.sin(a) * 0.084, 0.962, -0.012 + Math.cos(a) * 0.084], 0.007, 0.024, 6, [Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25])
    if (i % 2 === 0) bag.sphere(i % 4 === 0 ? 'jewelRed' : 'jewelGreen', [Math.sin(a) * 0.09, 0.94, -0.012 + Math.cos(a) * 0.09], 0.0055, 1, 8)
  }
  bag.sphere('jewelRed', [0, 0.968, 0.079], 0.0105, 1, 14)
  // māṅg ṭīkā on the forehead
  bag.tube('gold', [[0, 0.946, 0.07], onFace(0, CY + 0.074, F, 0.004), onFace(0, CY + 0.062, F, 0.004)], 0.0012, 10, 4)
  bag.sphere('gold', onFace(0, CY + 0.058, F, 0.004), 1, [0.0075, 0.0075, 0.003], 12)
  bag.sphere('jewelRed', onFace(0, CY + 0.058, F, 0.0065), 0.0032, 1, 8)
  // jhumkā earrings
  for (const s of [-1, 1]) {
    bag.sphere('gold', [s * 0.083, CY - 0.034, -0.01], 0.006, 1, 8)
    bag.cone('gold', [s * 0.083, CY - 0.05, -0.01], 0.012, 0.018, 16, [Math.PI, 0, 0])
    beadRing(bag, 'pearl', [s * 0.083, CY - 0.06, -0.01], [0, 1, 0], 0.011, 10, 0.0026)
  }

  // ---- arms & hands --------------------------------------------------------
  const lS: V3 = [0.2, 0.575, -0.01]
  const rS: V3 = [-0.2, 0.575, -0.01]
  let lE: V3, lW: V3, rE: V3, rW: V3
  if (o.hands === 'lotus') {
    // her left hand holds a lotus
    lE = [0.29, 0.37, 0.05]
    lW = [0.24, 0.51, 0.18]
    arm(bag, 'skin', [lS, [0.255, 0.47, 0.0], lE, [0.28, 0.44, 0.12], lW], 0.82)
    hand(bag, 'skin', lW, [-0.25, 1, 0.15], [-0.85, 0.1, 0.5], { curl: 0.55, side: 1, size: 0.92 })
    bag.between('jade', [lW[0] - 0.012, lW[1] + 0.04, lW[2] + 0.012], [lW[0] - 0.03, lW[1] + 0.15, lW[2] + 0.03], 0.0035, 0.0035, 6)
    addSmallLotus(bag, [lW[0] - 0.03, lW[1] + 0.15, lW[2] + 0.03], 0.06)
    // her right rests in her lap, palm up
    rE = [-0.28, 0.36, 0.07]
    rW = [-0.18, 0.235, 0.24]
    arm(bag, 'skin', [rS, [-0.25, 0.47, 0.01], rE, [-0.25, 0.28, 0.15], rW], 0.82)
    hand(bag, 'skin', rW, [0.55, -0.25, 0.8], [0.1, 1, 0.1], { curl: 0.3, side: 1, size: 0.92 })
  } else {
    // pāda-sevā: both hands reach forward to press the Lord's feet
    lE = [0.27, 0.38, 0.12]
    lW = [0.11, 0.35, 0.33]
    rE = [-0.27, 0.38, 0.12]
    rW = [-0.11, 0.35, 0.33]
    arm(bag, 'skin', [lS, [0.25, 0.47, 0.03], lE, [0.2, 0.36, 0.24], lW], 0.82)
    arm(bag, 'skin', [rS, [-0.25, 0.47, 0.03], rE, [-0.2, 0.36, 0.24], rW], 0.82)
    hand(bag, 'skin', lW, [-0.35, -0.15, 1], [-1, -0.25, 0.1], { curl: 0.4, side: 1, size: 0.92 })
    hand(bag, 'skin', rW, [0.35, -0.15, 1], [1, -0.25, 0.1], { curl: 0.4, side: -1, size: 0.92 })
  }
  for (const [S, E, W] of [
    [lS, lE, lW],
    [rS, rE, rW],
  ] as [V3, V3, V3][]) {
    // short sleeves of the choli, armlets, bangles
    taperTube(bag, 'blouse', [S, lerp3(S, E, 0.3)], (t) => armRadius(0.82)(t * 0.15) * 1.18, 8, 14)
    bandAround(bag, 'gold', lerp3(S, E, 0.4), sub(E, S), 0.047, 0.0045)
    for (let b = 0; b < 5; b++) bandAround(bag, b % 2 ? 'bangleRed' : 'gold', lerp3(E, W, 0.8 + b * 0.035), sub(W, E), 0.031, 0.0035)
  }

  halo(bag)
  return bag.merge()
}
