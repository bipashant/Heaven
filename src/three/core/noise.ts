import { createNoise2D, createNoise3D } from 'simplex-noise'

/** Small deterministic PRNG so the cosmos looks the same on every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const noise2 = createNoise2D(mulberry32(7))
export const noise3 = createNoise3D(mulberry32(11))

export function fbm2(x: number, y: number, octaves = 5) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * freq, y * freq)
    freq *= 2.03
    amp *= 0.5
  }
  return sum
}

export function ridged2(x: number, y: number, octaves = 4) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2(x * freq + 31.7, y * freq - 12.3))
    sum += amp * n * n
    freq *= 2.1
    amp *= 0.5
  }
  return sum
}

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))

/** Seeded random helper with a few conveniences. */
export function rng(seed: number) {
  const r = mulberry32(seed)
  return {
    next: r,
    range: (a: number, b: number) => a + (b - a) * r(),
    pick: <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)],
  }
}
