import * as THREE from 'three'
import { mulberry32 } from './noise'

// Procedural canvas textures, so the app needs no image assets.

const cache = new Map<string, THREE.Texture>()

function canvasTex(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, srgb = true) {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  draw(ctx, size)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  t.needsUpdate = true
  cache.set(key, t)
  return t
}

/** Soft radial glow, white centre fading to transparent. */
export const glowTexture = () =>
  canvasTex('glow', 128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.18, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.22)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })

/** Fluffy cloud puff built from many soft blobs. */
export const cloudTexture = () =>
  canvasTex('cloud', 256, (ctx, s) => {
    const r = mulberry32(3)
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2
      const d = Math.pow(r(), 0.7) * s * 0.26
      const x = s / 2 + Math.cos(a) * d
      const y = s / 2 + Math.sin(a) * d * 0.8
      const rad = s * (0.08 + r() * 0.16)
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      const o = 0.1 + r() * 0.12
      g.addColorStop(0, `rgba(255,255,255,${o})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
    }
  })

/** Four-pointed sparkle. */
export const sparkTexture = () =>
  canvasTex('spark', 128, (ctx, s) => {
    const c = s / 2
    const g = ctx.createRadialGradient(c, c, 0, c, c, c)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.12, 'rgba(255,255,255,0.6)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.08)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    ctx.globalCompositeOperation = 'lighter'
    for (const [w, h] of [
      [s * 0.9, s * 0.03],
      [s * 0.03, s * 0.9],
    ]) {
      const lg = ctx.createRadialGradient(c, c, 0, c, c, Math.max(w, h) / 2)
      lg.addColorStop(0, 'rgba(255,255,255,0.9)')
      lg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = lg
      ctx.fillRect(c - w / 2, c - h / 2, w, h)
    }
  })

/** Serpent scales: rows of overlapping arcs, used as a colour/roughness map. */
export const scaleTexture = () => {
  const t = canvasTex('scales', 256, (ctx, s) => {
    ctx.fillStyle = '#8a8a8a'
    ctx.fillRect(0, 0, s, s)
    const rows = 8
    const cols = 8
    const w = s / cols
    const h = s / rows
    for (let j = -1; j <= rows; j++) {
      for (let i = -1; i <= cols; i++) {
        const x = i * w + (j % 2 ? w / 2 : 0)
        const y = j * h
        const g = ctx.createRadialGradient(x + w / 2, y + h * 0.2, w * 0.05, x + w / 2, y + h * 0.6, w * 0.7)
        g.addColorStop(0, '#ffffff')
        g.addColorStop(0.7, '#b9b9b9')
        g.addColorStop(1, '#4a4a4a')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(x + w / 2, y + h * 0.5, w * 0.55, h * 0.75, 0, 0, Math.PI)
        ctx.fill()
      }
    }
  })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Tiger skin (Śiva’s seat). */
export const tigerTexture = () =>
  canvasTex('tiger', 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s / 2)
    g.addColorStop(0, '#f2b45a')
    g.addColorStop(1, '#c46a1f')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    const r = mulberry32(5)
    ctx.fillStyle = '#1b1008'
    for (let i = 0; i < 26; i++) {
      const x = r() * s
      const y = r() * s
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((r() - 0.5) * 0.6)
      ctx.beginPath()
      ctx.ellipse(0, 0, 3 + r() * 4, 18 + r() * 22, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  })

/** Text rendered to a texture (system fonts render Devanagari). */
export function textTexture(text: string, opts: { size?: number; color?: string; font?: string; glow?: string } = {}) {
  const { size = 256, color = '#fff6d8', font = 'serif', glow = 'rgba(255,200,90,0.9)' } = opts
  return canvasTex(`text:${text}:${size}:${color}:${font}`, size, (ctx, s) => {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let px = Math.floor(s * 0.62)
    ctx.font = `600 ${px}px "Noto Serif Devanagari", ${font}`
    const w = ctx.measureText(text).width
    if (w > s * 0.86) {
      px = Math.floor((px * s * 0.86) / w)
      ctx.font = `600 ${px}px "Noto Serif Devanagari", ${font}`
    }
    ctx.shadowColor = glow
    ctx.shadowBlur = s * 0.08
    ctx.fillStyle = color
    ctx.fillText(text, s / 2, s * 0.55)
    ctx.fillText(text, s / 2, s * 0.55)
  })
}

/** Light rays fanning out from the centre (for aureoles). */
export const raysTexture = () =>
  canvasTex('rays', 512, (ctx, s) => {
    const c = s / 2
    const r = mulberry32(9)
    ctx.translate(c, c)
    ctx.globalCompositeOperation = 'lighter'
    const n = 48
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.05
      const len = c * (0.55 + r() * 0.45)
      const w = 0.012 + r() * 0.03
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len)
      g.addColorStop(0, 'rgba(255,255,255,0.55)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len)
      ctx.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len)
      ctx.closePath()
      ctx.fill()
    }
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, c)
    g.addColorStop(0, 'rgba(255,255,255,0.5)')
    g.addColorStop(0.3, 'rgba(255,255,255,0.1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(-c, -c, s, s)
  })
