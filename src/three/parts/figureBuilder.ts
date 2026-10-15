import * as THREE from 'three'
import { GeoBag, compose, type V3 } from '../core/GeoBag'

// Stylised deity figures assembled from primitives. A seated figure is about
// one unit tall and a standing one about 1.55; both face +z.

export type Pose = 'seated' | 'standing' | 'reclining'
export type Head = 'jata' | 'crown' | 'crownSmall' | 'feather' | 'bun' | 'four' | 'topknot' | 'shaven'
export type Mudra = 'abhaya' | 'dhyana' | 'lap' | 'flute' | 'namaste' | 'lotuses' | 'veena' | 'embrace' | 'recline'
export type Item =
  | 'chakra'
  | 'shankha'
  | 'gada'
  | 'padma'
  | 'vajra'
  | 'book'
  | 'kamandalu'
  | 'mala'
  | 'noose'
  | 'danda'
  | 'damaru'
  | 'trishul'
  | 'sruva'
  | 'ankusha'
  | 'stylus'

export interface FigureSpec {
  pose: Pose
  head: Head
  arms?: 2 | 4
  mudra?: Mudra
  items?: Partial<Record<'R' | 'L' | 'BR' | 'BL', Item>>
  female?: boolean
  thirdEye?: boolean
  moon?: boolean
  snake?: boolean
  beard?: boolean
  garland?: boolean
  halo?: boolean
  prabhavali?: boolean
  /** Lean of the upper body (radians, around z): tribhaṅga or leaning together. */
  lean?: number
  child?: boolean
}

const PI = Math.PI

function ring(bag: GeoBag, key: string, center: THREE.Vector3, dir: THREE.Vector3, R: number, r: number) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize())
  const m = new THREE.Matrix4().compose(center, q, new THREE.Vector3(1, 1, 1))
  bag.add(key, new THREE.TorusGeometry(R, r, 6, 16), m)
}

const v = (a: V3) => new THREE.Vector3(...a)

export function addItem(bag: GeoBag, item: Item, hand: V3, side: 1 | -1 = 1) {
  const [x, y, z] = hand
  switch (item) {
    case 'chakra': {
      const c: V3 = [x, y + 0.085, z]
      bag.torus('light', c, 0.07, 0.011, [0, 0, 0], PI * 2, 28)
      bag.torus('gold', c, 0.045, 0.007, [0, 0, 0], PI * 2, 20)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2
        bag.box('gold', [x + Math.cos(a) * 0.035, y + 0.085 + Math.sin(a) * 0.035, z], [0.07, 0.008, 0.006], [0, 0, a])
      }
      bag.sphere('light', c, 0.016, 1, 10)
      break
    }
    case 'shankha': {
      bag.lathe(
        'pearl',
        [
          [0.0, -0.07],
          [0.02, -0.05],
          [0.036, -0.01],
          [0.034, 0.03],
          [0.02, 0.06],
          [0.006, 0.085],
          [0.0, 0.09],
        ],
        [x, y + 0.06, z],
        1,
        14,
        [0, 0, 0.25 * side],
      )
      bag.torus('pearl', [x, y + 0.075, z + 0.01], 0.022, 0.008, [0.3, 0, 0], PI * 2, 14)
      break
    }
    case 'gada': {
      bag.between('gold', [x, y - 0.1, z], [x + 0.03 * side, y + 0.28, z - 0.02], 0.012)
      bag.sphere('gold', [x + 0.035 * side, y + 0.32, z - 0.02], 0.055, [1, 1.15, 1], 12)
      bag.torus('gold', [x + 0.035 * side, y + 0.28, z - 0.02], 0.04, 0.008, [PI / 2, 0, 0], PI * 2, 14)
      break
    }
    case 'padma': {
      bag.between('jade', [x, y - 0.02, z], [x, y + 0.12, z + 0.02], 0.006)
      addSmallLotus(bag, [x, y + 0.13, z + 0.02], 0.055)
      break
    }
    case 'vajra': {
      bag.sphere('gold', [x, y + 0.05, z], 0.022, 1, 10)
      for (const s of [1, -1]) {
        bag.cone('gold', [x, y + 0.05 + s * 0.06, z], 0.018, 0.08, 8, [s > 0 ? 0 : PI, 0, 0])
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * PI * 2
          bag.between(
            'gold',
            [x, y + 0.05 + s * 0.02, z],
            [x + Math.cos(a) * 0.025, y + 0.05 + s * 0.09, z + Math.sin(a) * 0.025],
            0.006,
            0.003,
          )
        }
      }
      break
    }
    case 'book':
      bag.box('wood', [x, y + 0.03, z + 0.02], [0.13, 0.03, 0.05], [0.2, 0, 0])
      bag.box('gold', [x, y + 0.047, z + 0.02], [0.135, 0.006, 0.052], [0.2, 0, 0])
      break
    case 'kamandalu':
      bag.sphere('gold', [x, y - 0.03, z + 0.02], 0.045, [1, 0.9, 1], 14)
      bag.cyl('gold', [x, y + 0.03, z + 0.02], 0.015, 0.025, 0.05, 10)
      bag.between('gold', [x + 0.03 * side, y - 0.02, z + 0.02], [x + 0.07 * side, y + 0.03, z + 0.02], 0.007)
      break
    case 'mala':
      bag.torus('pearl', [x, y - 0.03, z + 0.02], 0.05, 0.008, [0.3, 0, 0], PI * 2, 18)
      break
    case 'noose':
      bag.torus('gold', [x, y + 0.02, z + 0.02], 0.07, 0.01, [0.2, 0.3, 0], PI * 2, 22)
      bag.torus('gold', [x, y + 0.02, z + 0.02], 0.055, 0.008, [0.5, -0.2, 0], PI * 2, 22)
      break
    case 'danda':
      bag.between('iron', [x, y - 0.35, z], [x, y + 0.3, z], 0.016, 0.022)
      bag.sphere('iron', [x, y + 0.33, z], 0.04, 1, 10)
      break
    case 'damaru':
      bag.cone('wood', [x, y + 0.03, z + 0.02], 0.035, 0.05, 12)
      bag.cone('wood', [x, y - 0.02, z + 0.02], 0.035, 0.05, 12, [PI, 0, 0])
      break
    case 'trishul':
      buildTrishul(bag, [x, y - 0.4, z], 1.1)
      break
    case 'sruva':
      bag.between('wood', [x, y - 0.05, z], [x + 0.02 * side, y + 0.18, z + 0.03], 0.006)
      bag.sphere('gold', [x + 0.022 * side, y + 0.2, z + 0.03], 0.02, [1, 0.5, 1], 10)
      break
    case 'ankusha':
      bag.between('gold', [x, y - 0.06, z], [x, y + 0.16, z], 0.008)
      bag.torus('gold', [x + 0.02, y + 0.16, z], 0.025, 0.007, [0, 0, 0], PI, 12)
      break
    case 'stylus':
      bag.between('gold', [x, y - 0.02, z + 0.02], [x + 0.04 * side, y + 0.1, z + 0.04], 0.005)
      break
  }
}

export function buildTrishul(bag: GeoBag, base: V3, h: number) {
  const [x, y, z] = base
  const top = y + h
  bag.between('gold', [x, y, z], [x, top, z], 0.014 * h)
  bag.cone('gold', [x, top + 0.08 * h, z], 0.025 * h, 0.16 * h, 8)
  for (const s of [1, -1]) {
    bag.tube(
      'gold',
      [
        [x, top - 0.02 * h, z],
        [x + s * 0.09 * h, top, z],
        [x + s * 0.1 * h, top + 0.1 * h, z],
        [x + s * 0.085 * h, top + 0.17 * h, z],
      ],
      0.011 * h,
      12,
      6,
    )
  }
  bag.torus('gold', [x, top - 0.03 * h, z], 0.03 * h, 0.008 * h, [PI / 2, 0, 0], PI * 2, 14)
  // ḍamaru tied to the shaft
  bag.cone('wood', [x + 0.04 * h, top - 0.14 * h, z], 0.03 * h, 0.04 * h, 10, [0, 0, PI / 2])
  bag.cone('wood', [x + 0.08 * h, top - 0.14 * h, z], 0.03 * h, 0.04 * h, 10, [0, 0, -PI / 2])
}

export function addSmallLotus(bag: GeoBag, c: V3, size: number, key = 'lotus') {
  const [x, y, z] = c
  for (let layer = 0; layer < 2; layer++) {
    const n = layer ? 6 : 8
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + layer * 0.3
      const tilt = layer ? 0.45 : 0.95
      bag.sphere(
        key,
        [x + Math.cos(a) * size * 0.45, y + size * 0.25, z + Math.sin(a) * size * 0.45],
        1,
        [size * 0.18, size * 0.5, size * 0.09],
        10,
        [Math.sin(a) * tilt, 0, -Math.cos(a) * tilt],
      )
    }
  }
  bag.cyl('gold', [x, y + size * 0.2, z], size * 0.16, size * 0.12, size * 0.12, 10)
}

/** Builds a deity figure; returns merged geometry per material key. */
export function buildFigure(spec: FigureSpec): Record<string, THREE.BufferGeometry> {
  const bag = new GeoBag()
  const w = spec.female ? 0.86 : 1
  const standing = spec.pose === 'standing'
  const reclining = spec.pose === 'reclining'
  const yo = standing ? 0.66 : 0
  const arms = spec.arms ?? 2

  // ---- lower body -------------------------------------------------------
  if (standing) {
    bag.lathe(
      'cloth',
      [
        [0.001, 0.0],
        [0.13, 0.0],
        [0.165, 0.05],
        [0.17, 0.2],
        [0.19, 0.42],
        [0.205, 0.6],
        [0.2, 0.74],
        [0.19, 0.8],
        [0.001, 0.82],
      ],
      [0, 0, 0],
      [spec.female ? 1.12 : 1.0, 1, 0.78],
      28,
    )
    bag.sphere('skin', [0.075, 0.02, 0.12], 1, [0.045, 0.025, 0.08], 10)
    bag.sphere('skin', [-0.075, 0.02, 0.12], 1, [0.045, 0.025, 0.08], 10)
    bag.torus('gold', [0, 0.06, 0], 0.2, 0.012, [PI / 2, 0, 0], PI * 2, 28, [1.08 * w, 0.82, 1])
  } else if (reclining) {
    // lying along +x (feet) with the upper body propped toward −x
    bag.sphere('cloth', [0.02, 0.22, 0.03], 1, [0.22, 0.19, 0.2], 18)
    bag.capsule('cloth', [0.02, 0.18, 0.0], [0.5, 0.16, 0.04], 0.115)
    bag.capsule('cloth', [0.5, 0.16, 0.04], [0.92, 0.12, 0.02], 0.08)
    bag.capsule('cloth', [0.04, 0.24, 0.08], [0.46, 0.33, 0.17], 0.11)
    bag.capsule('cloth', [0.46, 0.33, 0.17], [0.88, 0.24, 0.12], 0.078)
    bag.sphere('skin', [0.98, 0.12, 0.03], 1, [0.06, 0.045, 0.04], 10)
    bag.sphere('skin', [0.94, 0.24, 0.13], 1, [0.06, 0.045, 0.04], 10)
    bag.torus('gold', [0.92, 0.12, 0.02], 0.045, 0.008, [0, Math.PI / 2, 0], Math.PI * 2, 12)
    bag.torus('gold', [0.88, 0.24, 0.12], 0.045, 0.008, [0, Math.PI / 2, 0], Math.PI * 2, 12)
  } else {
    bag.sphere('cloth', [0, 0.11, 0.05], 1, [0.5 * w, 0.13, 0.32], 22)
    bag.sphere('cloth', [0.33 * w, 0.1, 0.17], 0.13, [1, 0.72, 1], 14)
    bag.sphere('cloth', [-0.33 * w, 0.1, 0.17], 0.13, [1, 0.72, 1], 14)
    bag.sphere('skin', [0.14 * w, 0.18, 0.2], 1, [0.1, 0.035, 0.05], 10, [0, 0.4, 0])
    bag.sphere('skin', [-0.14 * w, 0.18, 0.2], 1, [0.1, 0.035, 0.05], 10, [0, -0.4, 0])
    // anklets
    bag.torus('gold', [0.25 * w, 0.18, 0.18], 0.035, 0.006, [0, PI / 2, 0], PI * 2, 12)
    bag.torus('gold', [-0.25 * w, 0.18, 0.18], 0.035, 0.006, [0, PI / 2, 0], PI * 2, 12)
  }

  // ---- upper body (optionally leaning) ------------------------------------
  bag.push(
    reclining
      ? compose([0, 0.22, 0.03], [0, 0, 1.31]).multiply(compose([0, -0.15, 0]))
      : compose([0, yo + 0.15, 0], [0, 0, spec.lean ?? 0]).multiply(compose([0, -0.15, 0])),
  )

  const torso: [number, number][] = spec.female
    ? [
        [0.001, 0.12],
        [0.2, 0.13],
        [0.205, 0.2],
        [0.16, 0.31],
        [0.19, 0.42],
        [0.205, 0.48],
        [0.2, 0.56],
        [0.18, 0.61],
        [0.1, 0.665],
        [0.05, 0.7],
        [0.001, 0.705],
      ]
    : [
        [0.001, 0.12],
        [0.2, 0.13],
        [0.215, 0.2],
        [0.19, 0.3],
        [0.2, 0.4],
        [0.235, 0.5],
        [0.245, 0.56],
        [0.22, 0.62],
        [0.12, 0.67],
        [0.06, 0.7],
        [0.001, 0.705],
      ]
  bag.lathe('skin', torso, [0, 0, 0], [1.12, 1, 0.74], 28)
  bag.torus('cloth', [0, 0.175, 0], 0.2 * w, 0.055, [PI / 2, 0, 0], PI * 2, 28, [1.12, 0.74, 1])
  bag.torus('gold', [0, 0.215, 0], 0.19 * w, 0.012, [PI / 2, 0, 0], PI * 2, 28, [1.12, 0.74, 1])

  if (spec.female) {
    // upper garment and sari drape
    bag.torus('cloth', [0, 0.47, 0.005], 0.165, 0.05, [PI / 2, 0, 0], PI * 2, 28, [1.12, 0.74, 1])
    bag.capsule('cloth2', [-0.17, 0.6, 0.06], [0.16, 0.2, 0.12], 0.045)
    bag.capsule('cloth2', [-0.17, 0.6, -0.05], [-0.12, 0.2, -0.12], 0.04)
  } else {
    // sacred thread (yajñopavīta)
    bag.capsule('pearl', [-0.16, 0.58, 0.1], [0.19, 0.22, 0.14], 0.006)
    bag.capsule('cloth2', [-0.2, 0.6, -0.02], [-0.24, 0.25, 0.04], 0.03)
  }

  // neck & head
  const throatKey = spec.snake ? 'throat' : 'skin'
  bag.cyl(throatKey, [0, 0.735, 0], 0.05, 0.058, 0.09, 14)

  const headY = 0.835
  if (spec.head === 'four') {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * PI * 2
      const hx = Math.sin(a) * 0.055
      const hz = Math.cos(a) * 0.055
      bag.sphere('skin', [hx, headY, hz], 0.088, [0.92, 1.12, 1], 18, [0, a, 0])
      bag.sphere('skin', [Math.sin(a) * 0.135, headY - 0.01, Math.cos(a) * 0.135], 0.015, [1, 1.4, 1], 8)
      if (spec.beard) bag.sphere('beard', [Math.sin(a) * 0.1, headY - 0.085, Math.cos(a) * 0.1], 1, [0.05, 0.06, 0.035], 10, [0, a, 0])
    }
    bag.cyl('gold', [0, headY + 0.14, 0], 0.06, 0.11, 0.2, 8)
    bag.sphere('gold', [0, headY + 0.25, 0], 0.03, 1, 10)
    bag.torus('gold', [0, headY + 0.06, 0], 0.12, 0.012, [PI / 2, 0, 0], PI * 2, 24)
  } else {
    const hr = spec.child ? 0.112 : 0.1
    bag.sphere('skin', [0, headY, 0.005], hr, [0.92, 1.13, 1.0], 22)
    bag.sphere('skin', [0, headY - 0.01, 0.1], 0.018, [1, 1.4, 1], 8)
    // earrings
    bag.torus('gold', [0.094, headY - 0.045, 0], 0.022, 0.006, [0, PI / 2, 0], PI * 2, 12)
    bag.torus('gold', [-0.094, headY - 0.045, 0], 0.022, 0.006, [0, PI / 2, 0], PI * 2, 12)
    if (spec.thirdEye) bag.sphere('light', [0, headY + 0.045, 0.098], 1, [0.009, 0.02, 0.006], 8)
    else bag.sphere('tilak', [0, headY + 0.045, 0.1], 1, [0.008, 0.016, 0.005], 8)
    if (spec.beard) bag.sphere('beard', [0, headY - 0.075, 0.07], 1, [0.065, 0.075, 0.045], 12)

    const hairCap = () => bag.sphere('hair', [0, headY + 0.018, -0.02], 0.106, [0.96, 1.08, 1.04], 20)
    switch (spec.head) {
      case 'jata': {
        hairCap()
        bag.cyl('hair', [0, headY + 0.15, -0.01], 0.055, 0.085, 0.13, 14)
        bag.torus('hair', [0, headY + 0.12, -0.01], 0.072, 0.024, [PI / 2, 0, 0], PI * 2, 18)
        bag.torus('pearl', [0, headY + 0.17, -0.01], 0.06, 0.01, [PI / 2, 0, 0], PI * 2, 18)
        bag.sphere('hair', [0, headY + 0.235, -0.01], 0.05, [1, 0.8, 1], 12)
        for (const s of [-1, 0, 1]) {
          bag.capsule('hair', [s * 0.05, headY, -0.09], [s * 0.13, headY - 0.3, -0.13], 0.022)
        }
        if (spec.moon) bag.torus('light', [0.075, headY + 0.17, 0.02], 0.045, 0.01, [0, 0.3, 0.9], PI * 1.15, 16)
        break
      }
      case 'crown':
      case 'crownSmall': {
        hairCap()
        const tall = spec.head === 'crown'
        const h = tall ? 0.24 : 0.12
        bag.cyl('gold', [0, headY + 0.08 + h / 2, -0.005], tall ? 0.06 : 0.075, 0.098, h, 8)
        bag.torus('gold', [0, headY + 0.085, -0.005], 0.1, 0.014, [PI / 2, 0, 0], PI * 2, 24)
        bag.sphere('light', [0, headY + 0.1, 0.095], 0.014, 1, 8)
        bag.cone('gold', [0, headY + 0.1 + h, -0.005], 0.03, 0.08, 8)
        if (!tall || spec.female) bag.sphere('hair', [0, headY - 0.02, -0.11], 0.055, 1, 12)
        break
      }
      case 'feather': {
        hairCap()
        bag.torus('gold', [0, headY + 0.08, -0.01], 0.098, 0.013, [PI / 2, 0, 0], PI * 2, 24)
        bag.sphere('feather', [0.045, headY + 0.2, -0.03], 1, [0.035, 0.12, 0.012], 12, [0, 0, -0.35])
        bag.sphere('light', [0.065, headY + 0.27, -0.022], 1, [0.016, 0.022, 0.006], 8, [0, 0, -0.35])
        break
      }
      case 'bun': {
        hairCap()
        bag.sphere('hair', [0, headY + 0.02, -0.12], 0.06, 1, 14)
        bag.torus('gold', [0, headY + 0.07, 0.0], 0.1, 0.01, [PI / 2 - 0.25, 0, 0], PI * 2, 24)
        bag.sphere('light', [0, headY + 0.07, 0.1], 0.012, 1, 8)
        break
      }
      case 'topknot':
        hairCap()
        bag.sphere('hair', [0, headY + 0.12, -0.02], 0.045, 1, 12)
        break
      case 'shaven':
        bag.sphere('hair', [0, headY + 0.1, -0.06], 0.02, [1, 2, 1], 8)
        break
    }
  }

  // necklaces & garland
  bag.torus('gold', [0, 0.655, 0.012], 0.11, 0.013, [PI / 2 - 0.45, 0, 0], PI * 2, 24, [1.15, 1, 1])
  bag.torus('gold', [0, 0.6, 0.03], 0.14, 0.009, [PI / 2 - 0.6, 0, 0], PI * 2, 24, [1.1, 1, 1])
  if (spec.garland) bag.torus('garland', [0, 0.45, 0.06], 0.2, 0.022, [PI / 2 - 1.05, 0, 0], PI * 2, 28, [1.05, 1, 1])
  if (spec.snake) {
    bag.torus('snake', [0, 0.68, 0.01], 0.105, 0.02, [PI / 2 - 0.3, 0, 0], PI * 2, 24, [1.1, 1, 1])
    bag.capsule('snake', [0.12, 0.66, 0.06], [0.16, 0.8, 0.1], 0.018)
    bag.sphere('snake', [0.165, 0.83, 0.11], 1, [0.045, 0.05, 0.015], 10)
  }

  // ---- arms ---------------------------------------------------------------
  const sh = (s: number): V3 => [s * 0.235 * w, 0.585, -0.01]
  const upperR = 0.052 * w
  const foreR = 0.043 * w
  type Arm = { elbow: V3; hand: V3 }
  const mudra = spec.mudra ?? 'abhaya'
  const pick = (s: 1 | -1): Arm => {
    const m = (a: V3): V3 => [a[0] * s, a[1], a[2]]
    switch (mudra) {
      case 'dhyana':
        return { elbow: m([0.31, 0.34, 0.1]), hand: m([0.07, 0.2, 0.22]) }
      case 'lap':
        return { elbow: m([0.32, 0.35, 0.08]), hand: m([0.3, 0.2, 0.25]) }
      case 'namaste':
        return { elbow: m([0.24, 0.4, 0.14]), hand: m([0.025, 0.52, 0.2]) }
      case 'lotuses':
        return { elbow: m([0.32, 0.37, 0.08]), hand: m([0.3, 0.5, 0.2]) }
      case 'flute':
        return s === 1
          ? { elbow: [0.29, 0.46, 0.2], hand: [0.2, 0.71, 0.26] }
          : { elbow: [-0.24, 0.5, 0.22], hand: [-0.02, 0.73, 0.25] }
      case 'veena':
        return s === 1
          ? { elbow: [0.3, 0.38, 0.12], hand: [0.12, 0.38, 0.24] }
          : { elbow: [-0.3, 0.42, 0.14], hand: [-0.24, 0.6, 0.22] }
      case 'recline':
        // +x arm rests along the body; −x arm props the head
        return s === 1
          ? { elbow: [0.31, 0.38, 0.12], hand: [0.25, 0.17, 0.17] }
          : { elbow: [-0.36, 0.72, 0.12], hand: [-0.12, 0.86, 0.11] }
      case 'embrace':
        return s === 1
          ? { elbow: [0.33, 0.37, 0.06], hand: [0.31, 0.56, 0.19] }
          : { elbow: [-0.33, 0.37, 0.05], hand: [-0.36, 0.2, 0.24] }
      case 'abhaya':
      default:
        return s === 1
          ? { elbow: [0.33, 0.37, 0.06], hand: [0.31, 0.56, 0.19] }
          : { elbow: [-0.33, 0.37, 0.05], hand: [-0.34, 0.2, 0.25] }
    }
  }

  const drawArm = (shoulder: V3, a: Arm) => {
    bag.capsule('skin', shoulder, a.elbow, upperR, 10)
    bag.capsule('skin', a.elbow, a.hand, foreR, 10)
    bag.sphere('skin', a.hand, 0.042 * w, [1, 1.15, 0.7], 10)
    const s = v(shoulder)
    const e = v(a.elbow)
    const h = v(a.hand)
    ring(bag, 'gold', s.clone().lerp(e, 0.45), e.clone().sub(s), upperR + 0.006, 0.008)
    ring(bag, 'gold', e.clone().lerp(h, 0.85), h.clone().sub(e), foreR + 0.004, 0.007)
  }

  const R = pick(1)
  const L = pick(-1)
  drawArm(sh(1), R)
  drawArm(sh(-1), L)
  if (spec.items?.R) addItem(bag, spec.items.R, R.hand, 1)
  if (spec.items?.L) addItem(bag, spec.items.L, L.hand, -1)

  if (arms === 4) {
    for (const s of [1, -1] as const) {
      const shoulder: V3 = [s * 0.2 * w, 0.57, -0.06]
      const a: Arm = { elbow: [s * 0.4 * w, 0.62, -0.12], hand: [s * 0.43 * w, 0.82, -0.08] }
      drawArm(shoulder, a)
      const it = s === 1 ? spec.items?.BR : spec.items?.BL
      if (it) addItem(bag, it, a.hand, s)
    }
  }

  if (mudra === 'flute') {
    bag.between('flute', [-0.08, 0.755, 0.26], [0.36, 0.71, 0.25], 0.011)
    bag.torus('gold', [0.3, 0.715, 0.25], 0.013, 0.004, [0, PI / 2, 0], PI * 2, 10)
  }
  if (mudra === 'veena') {
    bag.between('wood', [0.32, 0.18, 0.26], [-0.34, 0.86, 0.18], 0.018)
    bag.sphere('wood', [0.28, 0.2, 0.27], 0.11, [1, 0.9, 0.8], 14)
    bag.sphere('wood', [-0.3, 0.84, 0.17], 0.07, 1, 12)
    for (let i = 0; i < 4; i++) bag.between('gold', [0.3, 0.24 + i * 0.004, 0.31], [-0.32, 0.84 + i * 0.004, 0.22], 0.002)
  }

  // ---- halo & aureole -------------------------------------------------------
  if (spec.halo !== false) {
    bag.torus('halo', [0, headY + 0.03, -0.13], 0.17, 0.008, [0, 0, 0], PI * 2, 40)
    bag.torus('halo', [0, headY + 0.03, -0.135], 0.19, 0.004, [0, 0, 0], PI * 2, 40)
  }
  bag.pop()

  if (spec.prabhavali) {
    const arc = PI * 1.3
    const R0 = 0.66
    const cy = yo + 0.48
    bag.torus('halo', [0, cy, -0.24], R0, 0.012, [0, 0, PI / 2 - arc / 2], arc, 64)
    for (let i = 0; i <= 18; i++) {
      const a = PI / 2 - arc / 2 + (i / 18) * arc
      bag.cone('halo', [Math.cos(a) * (R0 + 0.035), cy + Math.sin(a) * (R0 + 0.035), -0.24], 0.016, 0.07, 6, [0, 0, a - PI / 2])
    }
  }

  return bag.merge()
}
