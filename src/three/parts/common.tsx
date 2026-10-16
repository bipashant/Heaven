import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GeoBag, type V3 } from '../core/GeoBag'
import { buildLotus, buildSerpent, type LotusSpec, type SerpentSpec } from './builders'
import { glowMaterial, mats, standard } from '../core/materials'
import { rng } from '../core/noise'
import { scaleTexture, textTexture } from '../core/textures'

type MatMap = Record<string, THREE.Material>

/** Renders the merged output of a GeoBag builder: one mesh per material key. */
export function BagMesh({
  build,
  materials,
  deps = [],
  position,
  rotation,
  scale,
  children,
}: {
  build: (bag: GeoBag) => void
  materials: MatMap
  deps?: unknown[]
  position?: V3
  rotation?: V3
  scale?: number | V3
  children?: ReactNode
}) {
  const geos = useMemo(() => {
    const bag = new GeoBag()
    build(bag)
    return bag.merge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {Object.entries(geos).map(([k, g]) => (
        <mesh key={k} geometry={g} material={materials[k] ?? mats.gold()} />
      ))}
      {children}
    </group>
  )
}

// ---------------------------------------------------------------------------

const petalTexCache = new Map<string, THREE.CanvasTexture>()
function petalTexture(base: string, tip: string) {
  const key = base + tip
  const hit = petalTexCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, tip)
  g.addColorStop(0.55, base)
  g.addColorStop(1, base)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 256)
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1
  for (let i = 0; i < 9; i++) {
    const x = 6 + i * 6.5
    ctx.beginPath()
    ctx.moveTo(32 + (x - 32) * 0.3, 256)
    ctx.quadraticCurveTo(x, 128, 32 + (x - 32) * 0.4, 6)
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  petalTexCache.set(key, t)
  return t
}

export function Lotus({
  spec,
  base = '#fff1f4',
  tip = '#f06aa0',
  glow = 0.35,
  position,
  rotation,
  scale,
}: {
  spec: LotusSpec
  base?: string
  tip?: string
  glow?: number
  position?: V3
  rotation?: V3
  scale?: number
}) {
  const materials = useMemo<MatMap>(() => {
    const map = petalTexture(base, tip)
    return {
      petal: new THREE.MeshStandardMaterial({
        map,
        emissiveMap: map,
        emissive: '#ffffff',
        emissiveIntensity: glow,
        roughness: 0.55,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
      pod: standard('#d8c24a', 0.6, 0.1, '#6a5a10', 0.6),
      podDots: standard('#8a7a20', 0.6),
    }
  }, [base, tip, glow])
  return (
    <BagMesh
      build={(bag) => buildLotus(bag, spec)}
      deps={[JSON.stringify(spec)]}
      materials={materials}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  )
}

export function Serpent({
  spec,
  color = '#e9e4d2',
  belly = '#f6edc8',
  gem = '#7ff0ff',
  emissive = '#1a1a10',
  position,
  rotation,
  scale,
}: {
  spec: SerpentSpec
  color?: string
  belly?: string
  gem?: string
  emissive?: string
  position?: V3
  rotation?: V3
  scale?: number
}) {
  const materials = useMemo<MatMap>(() => {
    const scales = scaleTexture().clone()
    scales.needsUpdate = true
    scales.repeat.set(5, 7)
    return {
      body: mats.serpent(color, emissive),
      belly: new THREE.MeshStandardMaterial({ color: belly, map: scales, roughness: 0.4, metalness: 0.15, emissive: belly, emissiveIntensity: 0.18 }),
      gem: glowMaterial(gem, 5),
      eye: glowMaterial('#ff5a2a', 3),
      tongue: standard('#b8102a', 0.4, 0.1, '#4a0010', 0.5),
    }
  }, [color, belly, gem, emissive])
  // Level of detail: skip drawing serpents that are far away.
  const lod = useRef<THREE.Group>(null)
  const tick = useRef(Math.floor(Math.random() * 8))
  const reach = useMemo(() => {
    const ext = Math.max(spec.coil.rx, spec.coil.rz, ...spec.neck.map((p) => Math.hypot(p[0], p[1], p[2])))
    return ext + spec.hoodSize * 2.5
  }, [spec])
  useFrame(({ camera }) => {
    const g = lod.current
    if (!g || tick.current++ % 8) return
    g.getWorldPosition(_lodP)
    g.visible = camera.position.distanceTo(_lodP) < 90 + reach * Math.abs(g.getWorldScale(_lodS).x) * 14
  })
  return (
    <group ref={lod} position={position} rotation={rotation} scale={scale}>
      <BagMesh build={(bag) => buildSerpent(bag, spec)} deps={[JSON.stringify(spec)]} materials={materials} />
    </group>
  )
}

const _lodP = new THREE.Vector3()
const _lodS = new THREE.Vector3()

// ---------------------------------------------------------------------------
// Forests (instanced)
// ---------------------------------------------------------------------------

export interface TreePoint {
  p: V3
  s: number
  c?: THREE.ColorRepresentation
}

export function Forest({
  points,
  kind = 'round',
  trunk = '#4a3020',
  leaf = '#3f6b2a',
  emissive,
  emissiveIntensity = 0.6,
}: {
  points: TreePoint[]
  kind?: 'round' | 'conifer' | 'palm'
  trunk?: string
  leaf?: string
  emissive?: string
  emissiveIntensity?: number
}) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const leafRef = useRef<THREE.InstancedMesh>(null)
  const { trunkGeo, leafGeo, trunkMat, leafMat } = useMemo(() => {
    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.1, 1, 5)
    trunkGeo.translate(0, 0.5, 0)
    let leafGeo: THREE.BufferGeometry
    if (kind === 'conifer') {
      leafGeo = new THREE.ConeGeometry(0.42, 1.3, 7)
      leafGeo.translate(0, 1.15, 0)
    } else {
      leafGeo = new THREE.IcosahedronGeometry(0.55, 1)
      const pos = leafGeo.attributes.position as THREE.BufferAttribute
      const r = rng(4)
      for (let i = 0; i < pos.count; i++) {
        const k = 0.85 + r.next() * 0.3
        pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.8, pos.getZ(i) * k)
      }
      leafGeo.computeVertexNormals()
      leafGeo.translate(0, 1.15, 0)
    }
    const trunkMat = new THREE.MeshStandardMaterial({ color: trunk, roughness: 0.9 })
    const leafMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.75,
      flatShading: true,
      emissive: emissive ?? '#000000',
      emissiveIntensity: emissive ? emissiveIntensity : 0,
    })
    return { trunkGeo, leafGeo, trunkMat, leafMat }
  }, [kind, trunk, emissive, emissiveIntensity])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const c = new THREE.Color()
    const r = rng(points.length)
    points.forEach((pt, i) => {
      q.setFromEuler(e.set(0, r.next() * Math.PI * 2, 0))
      m.compose(new THREE.Vector3(...pt.p), q, new THREE.Vector3(pt.s, pt.s * (0.85 + r.next() * 0.4), pt.s))
      trunkRef.current!.setMatrixAt(i, m)
      leafRef.current!.setMatrixAt(i, m)
      c.set(pt.c ?? leaf)
      leafRef.current!.setColorAt(i, c)
    })
    trunkRef.current!.instanceMatrix.needsUpdate = true
    leafRef.current!.instanceMatrix.needsUpdate = true
    if (leafRef.current!.instanceColor) leafRef.current!.instanceColor.needsUpdate = true
    trunkRef.current!.computeBoundingSphere()
    leafRef.current!.computeBoundingSphere()
  }, [points, leaf])

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, points.length]} />
      <instancedMesh ref={leafRef} args={[leafGeo, leafMat, points.length]} />
    </group>
  )
}

// ---------------------------------------------------------------------------

/** Floating glyph (e.g. ॐ) as a glowing camera-facing sprite. */
export function Glyph({ text, position, size = 1, color = '#fff2c8', glow = 'rgba(255,190,80,0.9)', opacity = 0.9 }: {
  text: string
  position?: V3
  size?: number
  color?: string
  glow?: string
  opacity?: number
}) {
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: textTexture(text, { color, glow }),
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [text, color, glow, opacity],
  )
  return <sprite position={position} scale={size} material={mat} />
}

/** Slowly spins its children around the y axis. */
export function Spin({ speed = 0.1, children, position }: { speed?: number; children: ReactNode; position?: V3 }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

/** Gentle vertical bobbing. */
export function Float({ amp = 0.3, speed = 0.5, children, position }: { amp?: number; speed?: number; children: ReactNode; position?: V3 }) {
  const ref = useRef<THREE.Group>(null)
  const seed = useMemo(() => Math.random() * 10, [])
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = (position?.[1] ?? 0) + Math.sin(clock.elapsedTime * speed + seed) * amp
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}
