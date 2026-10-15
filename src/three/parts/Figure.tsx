import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildFigure, type FigureSpec } from './figureBuilder'
import { divineMaterial, glowMaterial, mats, standard } from '../core/materials'
import { Glow } from './Glow'
import type { V3 } from '../core/GeoBag'

export interface Palette {
  skin: string
  rim: string
  cloth: string
  cloth2?: string
  hair?: string
  glow?: number
  aura?: string
}

export const PALETTES = {
  shiva: { skin: '#c9dcf2', rim: '#9fd4ff', cloth: '#7a5a3a', cloth2: '#c98a4b', hair: '#2a2230', glow: 2.4, aura: '#bfe3ff' },
  parvati: { skin: '#f3c9a0', rim: '#ffb07a', cloth: '#c4213f', cloth2: '#f0a020', hair: '#1a1018', glow: 2.2, aura: '#ffc9a0' },
  vishnu: { skin: '#2a4fb8', rim: '#7fc0ff', cloth: '#f2b636', cloth2: '#f7d27a', hair: '#0e0c1a', glow: 2.8, aura: '#8cc4ff' },
  lakshmi: { skin: '#f7cf9c', rim: '#ffd27a', cloth: '#d6264f', cloth2: '#f5b43a', hair: '#1a1012', glow: 2.4, aura: '#ffd8a0' },
  brahma: { skin: '#e8a24c', rim: '#ffd27a', cloth: '#f4f0e6', cloth2: '#d8b25a', hair: '#e8e2d4', glow: 2.2, aura: '#ffe0a0' },
  sarasvati: { skin: '#f6efe6', rim: '#e8f2ff', cloth: '#fbf8f2', cloth2: '#e9d9a8', hair: '#1a1416', glow: 2.0, aura: '#f2f6ff' },
  indra: { skin: '#f0c46a', rim: '#ffe28a', cloth: '#3b6bd6', cloth2: '#f2c031', hair: '#1a140c', glow: 2.0, aura: '#ffe6a0' },
  shachi: { skin: '#f5d2a8', rim: '#ffd8a0', cloth: '#2fb38a', cloth2: '#f2c031', hair: '#1a1012', glow: 1.8, aura: '#ffe6c0' },
  yama: { skin: '#1c2a3a', rim: '#ff5a3c', cloth: '#7a0f12', cloth2: '#c98a2a', hair: '#050406', glow: 2.6, aura: '#ff6040' },
  chitragupta: { skin: '#c99a6a', rim: '#ffb070', cloth: '#5a3a1a', cloth2: '#c98a2a', hair: '#0e0a08', glow: 1.4, aura: '#ffb070' },
  sage: { skin: '#e9c8a0', rim: '#ffe0b0', cloth: '#e07a1f', cloth2: '#f2a64a', hair: '#e8e4dc', glow: 1.6, aura: '#ffd9a0' },
  kumara: { skin: '#efc49a', rim: '#9fd8ff', cloth: '#e39a3e', cloth2: '#f5d27a', hair: '#1a1416', glow: 1.8, aura: '#cfeeff' },
  vamana: { skin: '#2a4fb8', rim: '#7fc0ff', cloth: '#f2b636', cloth2: '#f7d27a', hair: '#0e0c1a', glow: 2.2, aura: '#8cc4ff' },
  bali: { skin: '#b9895a', rim: '#ffcf7a', cloth: '#5a2a8a', cloth2: '#f2c031', hair: '#140c08', glow: 1.6, aura: '#ffcf7a' },
} satisfies Record<string, Palette>

function materialsFor(p: Palette): Record<string, THREE.Material> {
  return {
    skin: divineMaterial(p.skin, p.rim, p.glow ?? 2.2, 1),
    throat: divineMaterial('#2a5ad8', '#8fc8ff', 2.6, 1),
    cloth: standard(p.cloth, 0.5, 0.25, p.cloth, 0.22),
    cloth2: standard(p.cloth2 ?? p.cloth, 0.45, 0.3, p.cloth2 ?? p.cloth, 0.22),
    hair: standard(p.hair ?? '#141018', 0.45, 0.2, '#06040a', 1),
    beard: divineMaterial('#efeae0', '#ffffff', 1.0, 0.3),
    gold: mats.gold(),
    jade: mats.jade(),
    iron: mats.iron(),
    pearl: standard('#fbf6ee', 0.25, 0.1, '#6a645a', 0.5),
    lotus: standard('#f5a8c4', 0.5, 0, '#a83a6a', 0.55),
    wood: standard('#6b4426', 0.6, 0.05),
    snake: standard('#3d7a4f', 0.35, 0.3, '#0e3a1e', 0.6),
    garland: standard('#f2f0e0', 0.6, 0, '#e8a020', 0.35),
    flute: standard('#c99a3a', 0.4, 0.4, '#3a2a0a', 0.5),
    feather: divineMaterial('#127a7a', '#4fe0ff', 2.6, 0.5),
    tilak: glowMaterial('#ff3a2a', 2.2),
    light: glowMaterial(p.aura ?? p.rim, 4),
    halo: glowMaterial(p.aura ?? p.rim, 2.4),
  }
}

export interface FigureProps {
  spec: FigureSpec
  palette: Palette
  position?: V3
  rotation?: V3
  scale?: number
  aura?: number
}

const _wp = new THREE.Vector3()
const _ws = new THREE.Vector3()

export function Figure({ spec, palette, position, rotation, scale = 1, aura = 0.5 }: FigureProps) {
  const specKey = JSON.stringify(spec)
  const ref = useRef<THREE.Group>(null)
  const tick = useRef(Math.floor(Math.random() * 8))
  // Level of detail: figures vanish when they would be only a few pixels tall.
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g || tick.current++ % 8) return
    g.getWorldPosition(_wp)
    const s = Math.abs(g.getWorldScale(_ws).y) || scale
    g.visible = camera.position.distanceTo(_wp) < 70 + s * 95
  })
  const geos = useMemo(() => buildFigure(spec), [specKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const m = useMemo(() => materialsFor(palette), [palette])
  const standing = spec.pose === 'standing'
  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      {Object.entries(geos).map(([k, g]) => (
        <mesh key={k} geometry={g} material={m[k] ?? m.gold} />
      ))}
      {aura > 0 && (
        <Glow position={[0, standing ? 1.0 : 0.55, -0.25]} size={standing ? 3.4 : 2.6} color={palette.aura ?? palette.rim} opacity={aura} />
      )}
    </group>
  )
}
