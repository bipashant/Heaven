// World layout for the Purāṇic cosmos. One unit is arbitrary: distances are
// compressed so every realm can be visited, but the vertical ORDER follows the
// Bhāgavata / Viṣṇu Purāṇa descriptions.

export type Vec3 = [number, number, number]

/** The Brahmāṇḍa (cosmic egg): an ellipsoid around the Meru axis. */
export const EGG = {
  center: [0, 50, 0] as Vec3,
  radii: [560, 780, 560] as Vec3,
}

/** Heights (y) of each world along the Meru axis. */
export const Y = {
  vaikuntha: 1050,
  viraja: 880,
  satya: 640,
  tapa: 545,
  jana: 460,
  mahar: 380,
  dhruva: 318,
  saptarishi: 300,
  svarga: 240,
  planets: 135,
  sun: 110,
  rahu: 98,
  bhu: 0,
  atala: -70,
  vitala: -125,
  sutala: -180,
  talatala: -235,
  mahatala: -290,
  rasatala: -345,
  patala: -410,
  ananta: -478,
  yama: -565,
  garbhodaka: -640,
} as const

export const LOWER_DISC_RADIUS = 190
export const LOWER_DISC_THICKNESS = 5

/** Bhū-maṇḍala: concentric dvīpas and oceans (Bhāgavata Purāṇa 5.20 order). */
export interface Band {
  name: string
  outer: number
  kind: 'land' | 'water' | 'gold' | 'mountain'
  color: string
}

export const BHU_BANDS: Band[] = [
  { name: 'Jambūdvīpa (shallow sea)', outer: 40, kind: 'water', color: '#1d5b86' },
  { name: 'Lavaṇa — salt ocean', outer: 54, kind: 'water', color: '#174a74' },
  { name: 'Plakṣa-dvīpa', outer: 70, kind: 'land', color: '#4c7a37' },
  { name: 'Ikṣu — sugarcane-juice ocean', outer: 82, kind: 'water', color: '#8fae5e' },
  { name: 'Śālmali-dvīpa', outer: 100, kind: 'land', color: '#7a6a3c' },
  { name: 'Surā — wine ocean', outer: 112, kind: 'water', color: '#6e2638' },
  { name: 'Kuśa-dvīpa', outer: 132, kind: 'land', color: '#879748' },
  { name: 'Ghṛta — ghee ocean', outer: 144, kind: 'water', color: '#d9a637' },
  { name: 'Krauñca-dvīpa', outer: 166, kind: 'land', color: '#5f7357' },
  { name: 'Kṣīra — ocean of milk', outer: 182, kind: 'water', color: '#f1eee4' },
  { name: 'Śāka-dvīpa', outer: 206, kind: 'land', color: '#3b6a3e' },
  { name: 'Dadhi — yogurt ocean', outer: 218, kind: 'water', color: '#ece0bf' },
  { name: 'Puṣkara-dvīpa', outer: 246, kind: 'land', color: '#8a7948' },
  { name: 'Svādūdaka — sweet-water ocean', outer: 260, kind: 'water', color: '#2fa9bd' },
  { name: 'Kāñcanī-bhūmi — golden land', outer: 271, kind: 'gold', color: '#c9a33b' },
  { name: 'Lokāloka mountain', outer: 280, kind: 'mountain', color: '#2b2622' },
]

export const BHU_RADIUS = 280
export const MANASOTTARA_R = 232
export const SUN_ORBIT_R = MANASOTTARA_R

/** Kṣīra Sāgara: a point on the milk-ocean band. */
const KSHIRA_ANGLE = 0.5
const KSHIRA_R = 174
export const KSHIRA_POS: Vec3 = [
  Math.cos(KSHIRA_ANGLE) * KSHIRA_R,
  0,
  Math.sin(KSHIRA_ANGLE) * KSHIRA_R,
]

/** Jambūdvīpa island (detailed terrain), centered on Meru. +z is south. */
export const JAMBU_R = 40
export const MERU_HEIGHT = 22
export const KAILASH = { x: -6, z: 24.2 }
export const SHIVA_SEAT = { x: -6, z: 26.7, h: 1.35 }
export const LAKES = [
  { name: 'Mānasarovara', x: -3.0, z: 30.5, r: 1.2 },
  { name: 'Rākṣastāl', x: -9.2, z: 30.2, r: 0.95 },
]
