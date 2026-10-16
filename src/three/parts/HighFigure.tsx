import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildLakshmi, buildParvati, buildShiva } from './divinePair'
import { buildBrahma, buildVishnuReclining, type VishnuAnchors } from './divineVishnu'
import { divineMaterial, glowMaterial, mats, standard } from '../core/materials'
import { tigerTexture } from '../core/textures'
import { mulberry32 } from '../core/noise'
import { Glow } from './Glow'
import { GeoBag, type V3 } from '../core/GeoBag'

const sariCache = new Map<string, THREE.CanvasTexture>()
/** Silk with small gold butīs and a woven gold border on both edges. */
function sariTexture(dark = '#9e0f26', light = '#b8142e', motif = '#7a0a1c') {
  const key = dark + light
  const hit = sariCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, dark)
  g.addColorStop(0.5, light)
  g.addColorStop(1, dark)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const r = mulberry32(17)
  ctx.fillStyle = '#e8b84a'
  for (let y = 40; y < 216; y += 22) {
    for (let x = (y / 22) % 2 ? 8 : 19; x < 256; x += 22) {
      ctx.beginPath()
      ctx.ellipse(x, y, 2.2, 3.2, r() * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  for (const [y0, dir] of [
    [0, 1],
    [256, -1],
  ] as const) {
    ctx.fillStyle = '#d9a43a'
    ctx.fillRect(0, dir > 0 ? y0 : y0 - 26, 256, 26)
    ctx.fillStyle = motif
    for (let x = 0; x < 256; x += 12) {
      ctx.beginPath()
      const yy = y0 + dir * 13
      ctx.moveTo(x, yy)
      ctx.lineTo(x + 6, yy - 6)
      ctx.lineTo(x + 12, yy)
      ctx.lineTo(x + 6, yy + 6)
      ctx.fill()
    }
    ctx.fillStyle = '#f5d27a'
    ctx.fillRect(0, y0 + dir * 28 - (dir > 0 ? 0 : 3), 256, 3)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  sariCache.set(key, tex)
  return tex
}

type Kind = 'shiva' | 'parvati' | 'vishnu' | 'lakshmi' | 'brahma'

const AURA: Record<Kind, string> = { shiva: '#bfe3ff', parvati: '#ffc9a0', vishnu: '#9fc8ff', lakshmi: '#ffd8a0', brahma: '#ffe0a0' }

const SKIN: Record<Kind, [string, string, number]> = {
  shiva: ['#d2e2f4', '#9fd4ff', 1.5],
  parvati: ['#f4c9a0', '#ffb07a', 1.35],
  vishnu: ['#2c52bc', '#86c4ff', 1.7],
  lakshmi: ['#f7d09e', '#ffd27a', 1.35],
  brahma: ['#e6a456', '#ffd27a', 1.4],
}

function materialsFor(kind: Kind): Record<string, THREE.Material> {
  const shiva = kind === 'shiva'
  const aura = AURA[kind]
  const [base, rim, glow] = SKIN[kind]
  const sari = kind === 'lakshmi' ? sariTexture('#a8124e', '#c81d63', '#6a0a30') : sariTexture()
  return {
    skin: divineMaterial(base, rim, glow, 0.25),
    throat: divineMaterial('#2c5fd8', '#8fc8ff', 2.0, 0.25),
    hair: standard(shiva ? '#2a1e1a' : '#140c0e', 0.5, 0.15, '#050306', 1),
    tiger: new THREE.MeshStandardMaterial({ map: tigerTexture(), roughness: 0.82 }),
    rudraksha: standard('#5a2e16', 0.7, 0.05),
    thread: standard('#f6f0e0', 0.6),
    gold: mats.gold(),
    ash: glowMaterial('#ffffff', 1.3),
    eye: standard('#0e0a0c', 0.22, 0.1),
    brow: standard('#1a1012', 0.6),
    lip: shiva ? standard('#8a5a72', 0.45, 0.05, '#3a1a2a', 0.3) : standard('#c2405a', 0.4, 0.05, '#4a1020', 0.35),
    third: glowMaterial('#ff7a3a', 1.5),
    tilak: glowMaterial('#ff2a2a', 2),
    moon: glowMaterial('#f4f8ff', 3.5),
    snake: standard('#2f6a44', 0.35, 0.3, '#0e3a1e', 0.6),
    belly: standard('#d8e8b0', 0.4, 0.1),
    jewelRed: glowMaterial('#ff3a4a', 2.2),
    jewelGreen: glowMaterial('#3aff9a', 1.8),
    pearl: standard('#fbf6ee', 0.25, 0.1, '#6a645a', 0.5),
    flower: standard('#fffaf0', 0.6, 0, '#5a5a50', 0.4),
    sari: new THREE.MeshStandardMaterial({
      map: sari,
      roughness: 0.42,
      metalness: 0.15,
      emissive: '#3a0610',
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
    }),
    blouse: kind === 'lakshmi' ? standard('#d9a43a', 0.35, 0.6, '#4a3008', 0.4) : standard('#7a0c22', 0.42, 0.25, '#3a0610', 0.3),
    pita: new THREE.MeshStandardMaterial({ color: '#f2b62e', roughness: 0.36, metalness: 0.3, emissive: '#5a3a00', emissiveIntensity: 0.35, side: THREE.DoubleSide }),
    kaustubha: glowMaterial('#ff4a6a', 2.6),
    flowerWhite: standard('#fff8ee', 0.6, 0, '#5a5650', 0.45),
    flowerRed: standard('#e8304a', 0.5, 0, '#5a0a14', 0.5),
    flowerYellow: standard('#ffc22a', 0.5, 0, '#5a3a00', 0.5),
    leaf: standard('#2f7a3a', 0.6, 0, '#0a2a10', 0.4),
    cloth: standard('#f4f0e6', 0.6, 0.05, '#3a3630', 0.3),
    cloth2: new THREE.MeshStandardMaterial({ color: '#e8862a', roughness: 0.45, metalness: 0.1, emissive: '#4a2000', emissiveIntensity: 0.3, side: THREE.DoubleSide }),
    beard: standard('#f2efe8', 0.85, 0, '#3a3a36', 0.35),
    hairWhite: standard('#e6e2da', 0.8, 0, '#2a2826', 0.3),
    wood: standard('#7a4a26', 0.6, 0.05),
    bangleRed: standard('#c4102a', 0.2, 0.3, '#5a0010', 0.4),
    lotus: standard('#f5a8c4', 0.5, 0, '#a83a6a', 0.55),
    jade: mats.jade(),
    halo: glowMaterial(aura, 2.2),
    light: glowMaterial(aura, 4),
  }
}

function build(kind: Kind): { geos: Record<string, THREE.BufferGeometry>; anchors?: VishnuAnchors } {
  switch (kind) {
    case 'shiva':
      return { geos: buildShiva() }
    case 'parvati':
      return { geos: buildParvati() }
    case 'lakshmi':
      return { geos: buildLakshmi() }
    case 'brahma':
      return { geos: buildBrahma() }
    case 'vishnu':
      return buildVishnuReclining()
  }
}

/** Sudarśana: the spinning, flaming discus of Viṣṇu. */
function Sudarshana({ position, quaternion }: { position: V3; quaternion: [number, number, number, number] }) {
  const spin = useRef<THREE.Group>(null)
  const { geos, mats: m } = useMemo(() => {
    const bag = new GeoBag()
    bag.torus('rim', [0, 0, 0], 0.072, 0.012, [0, 0, 0], Math.PI * 2, 48)
    bag.torus('gold', [0, 0, 0], 0.05, 0.006, [0, 0, 0], Math.PI * 2, 40)
    bag.torus('gold', [0, 0, 0], 0.022, 0.006, [0, 0, 0], Math.PI * 2, 24)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      bag.box('gold', [Math.cos(a) * 0.036, Math.sin(a) * 0.036, 0], [0.03, 0.006, 0.005], [0, 0, a])
      bag.cone('flame', [Math.cos(a + 0.13) * 0.09, Math.sin(a + 0.13) * 0.09, 0], 0.011, 0.03, 6, [0, 0, a + 0.13 - Math.PI / 2 - 0.5])
    }
    bag.sphere('rim', [0, 0, 0], 0.012, 1, 12)
    return { geos: bag.merge(), mats: { rim: glowMaterial('#ffe08a', 3), gold: mats.gold(), flame: glowMaterial('#ffb347', 3.2) } as Record<string, THREE.Material> }
  }, [])
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.z -= dt * 2.4
  })
  return (
    <group position={position} quaternion={quaternion}>
      <group ref={spin}>
        {Object.entries(geos).map(([k, g]) => (
          <mesh key={k} geometry={g} material={m[k]} />
        ))}
      </group>
      <Glow size={0.4} color="#ffd27a" opacity={0.8} />
    </group>
  )
}

const _wp = new THREE.Vector3()
const _ws = new THREE.Vector3()

/** Detailed, sculpted Śiva or Pārvatī (see divinePair.ts). */
export function HighFigure({ kind, position, rotation, scale = 1, mirror = false, aura = 0.4 }: {
  kind: Kind
  position?: V3
  rotation?: V3
  scale?: number
  mirror?: boolean
  aura?: number
}) {
  const { geos, anchors } = useMemo(() => build(kind), [kind])
  const m = useMemo(() => materialsFor(kind), [kind])
  const ref = useRef<THREE.Group>(null)
  const tick = useRef(0)
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g || tick.current++ % 8) return
    g.getWorldPosition(_wp)
    g.visible = camera.position.distanceTo(_wp) < 70 + Math.abs(g.getWorldScale(_ws).y) * 95
  })
  return (
    <group ref={ref} position={position} rotation={rotation} scale={mirror ? [-scale, scale, scale] : scale}>
      {Object.entries(geos).map(([k, g]) => (
        <mesh key={k} geometry={g} material={m[k] ?? m.gold} />
      ))}
      {anchors && <Sudarshana position={anchors.chakra.pos} quaternion={anchors.chakra.quat} />}
      {aura > 0 && <Glow position={anchors ? [0, 0.35, -0.2] : [0, 0.55, -0.25]} size={anchors ? 2.4 : 2.6} color={AURA[kind]} opacity={aura} />}
    </group>
  )
}
