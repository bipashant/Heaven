import { useMemo } from 'react'
import * as THREE from 'three'
import { KAILASH, KAILASH_PEAK, KAILASH_SUMMIT_Y, LAKES, SHIVA_SEAT } from '../../../data/layout'
import { divineMaterial, mats, standard } from '../../core/materials'
import { fbm2, smoothstep } from '../../core/noise'
import { tigerTexture } from '../../core/textures'
import { heightAt } from './terrain'
import { HighFigure } from '../../parts/HighFigure'
import { BagMesh, Glyph } from '../../parts/common'
import { bovine } from '../../parts/builders'
import { buildTrishul } from '../../parts/figureBuilder'
import { Glow, Rays } from '../../parts/Glow'
import { Billboards } from '../../parts/Billboards'
import { FlowTube } from '../../parts/FlowTube'
import { Caption } from '../../parts/Labels'
import type { V3 } from '../../core/GeoBag'

/**
 * Kailāsa: a four-faced peak with horizontal strata, the famous vertical gully
 * on its south face and snow on its ledges, crowned by a snow-covered summit
 * shelf where Śiva and Pārvatī sit.
 */
const { H, R0, cut: CUT, baseY: BASE_Y } = KAILASH_PEAK

const squircle = (th: number) => {
  const p = 3.2
  return 1 / Math.pow(Math.pow(Math.abs(Math.cos(th)), p) + Math.pow(Math.abs(Math.sin(th)), p), 1 / p)
}
const southDelta = (th: number) => Math.atan2(Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2))

/** Radius of the peak at height fraction t and azimuth th (before rock noise). */
export function peakRadius(t: number, th: number, below = 0) {
  const tc = Math.min(t, CUT)
  const R = R0 * Math.pow(Math.max(0, 1 - Math.pow(tc, 2.0)), 0.58) + R0 * 0.25 * Math.pow(1 - tc, 5) + R0 * 0.9 * below
  const strata = 1 + 0.014 * Math.sin(tc * 46 + fbm2(th * 2, tc * 3, 2) * 3) + 0.006 * Math.sin(tc * 131)
  const dS = southDelta(th)
  const gully = 0.1 * Math.exp(-((dS / 0.05) ** 2)) * smoothstep(0.12, 0.35, tc) * (1 - smoothstep(0.7, 0.8, tc))
  const band = 0.05 * Math.exp(-(((tc - 0.5) / 0.025) ** 2)) * Math.exp(-((dS / 0.32) ** 2))
  return R * squircle(th) * strata * (1 - gully - band)
}

function buildKailashGeometry() {
  const ny = 130
  const skirt = 14
  const na = 180
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const rock = new THREE.Color('#5e544c')
  const rock2 = new THREE.Color('#7a6a5c')
  const snow = new THREE.Color('#f5f7fc')
  const c = new THREE.Color()
  for (let j = -skirt; j <= ny; j++) {
    const t = Math.max(0, j / ny)
    const below = j < 0 ? -j / skirt : 0
    for (let i = 0; i <= na; i++) {
      const th = (i / na) * Math.PI * 2
      const n = fbm2(th * 3 + t * 2, t * 6, 4)
      let R: number
      let y: number
      if (t <= CUT) {
        const crag = fbm2(th * 9 + t * 4, t * 22, 3)
        R = peakRadius(t, th, below) * (1 + 0.06 * n + 0.035 * crag)
        y = t * H + 0.05 * n * (1 - t) - below * 2.2
      } else {
        // the summit shelf: nearly level snow, gently domed
        const u = (t - CUT) / (1 - CUT)
        R = peakRadius(CUT, th) * (1 + 0.045 * n) * Math.pow(Math.cos((u * Math.PI) / 2), 0.75)
        y = CUT * H + 0.12 * Math.pow(Math.sin((u * Math.PI) / 2), 0.7) + 0.006 * n
      }
      pos.push(Math.cos(th) * R, y, Math.sin(th) * R)
      const dS = southDelta(th)
      c.copy(rock).lerp(rock2, 0.5 + 0.5 * Math.sin(t * 46 + n * 2))
      const ledge = smoothstep(0.86, 0.99, Math.sin(t * 46 + 0.6 + n * 2.5)) * smoothstep(0.25, 0.4, t) * smoothstep(-0.1, 0.4, fbm2(th * 5, t * 9, 3))
      const cap = smoothstep(0.62 + n * 0.08, 0.72 + n * 0.08, t)
      const gs = Math.exp(-((dS / 0.07) ** 2)) * smoothstep(0.15, 0.3, t)
      const rib = t < CUT - 0.015 ? smoothstep(-0.05, 0.28, fbm2(th * 14, t * 3, 3)) * smoothstep(CUT - 0.015, CUT - 0.1, t) : 0
      c.lerp(snow, Math.min(1, cap * (1 - 0.85 * rib) + ledge * 0.6 + gs * 0.85 + smoothstep(0.45, 0.85, n) * 0.35 * t))
      c.lerp(SNOW_SHADE, smoothstep(0.0, 0.5, n) * 0.35 * cap)
      col.push(c.r, c.g, c.b)
    }
  }
  for (let j = 0; j < ny + skirt; j++) {
    for (let i = 0; i < na; i++) {
      const a = j * (na + 1) + i
      const b = a + na + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const SNOW_SHADE = new THREE.Color('#c9d6ea')

const NANDI_MATS = {
  hide: divineMaterial('#e9e4d8', '#fff1c8', 1.3, 0.4),
  horn: standard('#c9b28a', 0.5, 0.2),
  gold: mats.gold(),
}

export function Kailash() {
  const geo = useMemo(() => buildKailashGeometry(), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 }), [])
  const KX = KAILASH.x
  const KZ = KAILASH.z
  const SY = KAILASH_SUMMIT_Y
  const shivaPos: V3 = [KX - 0.43, SY, KZ + 0.04]
  const parvatiPos: V3 = [KX + 0.4, SY, KZ + 0.08]
  const SHIVA_SCALE = 0.85

  const tiger = useMemo(() => new THREE.MeshStandardMaterial({ map: tigerTexture(), roughness: 0.85 }), [])

  // The Gaṅgā springs from Śiva's locks, arcs out beside him, pours down the
  // western face and runs across the plain to Rākṣastāl.
  const ganga = useMemo<V3[]>(() => {
    const top: V3 = [shivaPos[0], SY + 1.12 * SHIVA_SCALE, shivaPos[2] - 0.016 * SHIVA_SCALE]
    const th = Math.PI - 0.32
    const edge = peakRadius(CUT, th) * 1.04
    const pts: V3[] = [
      top,
      [top[0] - 0.12, top[1] + 0.34, top[2] - 0.02],
      [KX - 0.92, SY + 0.42, KZ + 0.12],
      [KX + Math.cos(th) * edge, SY + 0.02, KZ + Math.sin(th) * edge],
    ]
    for (let i = 0; i <= 12; i++) {
      const t = (CUT - 0.02) * (1 - i / 12)
      const R = peakRadius(t, th) * 1.08 + 0.02
      pts.push([KX + Math.cos(th) * R, BASE_Y + t * H, KZ + Math.sin(th) * R])
    }
    const lake = LAKES[1]
    const ground: [number, number][] = [
      [KX - 2.9, KZ + 1.6],
      [-8.4, 27.4],
      [-8.8, 28.4],
      [lake.x + 0.05, lake.z - 0.85],
    ]
    for (const [x, z] of ground) pts.push([x, Math.max(heightAt(x, z), -0.1) + 0.06, z])
    return pts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <group>
      <mesh geometry={geo} material={mat} position={[KX, BASE_Y, KZ]} />

      {/* On the summit: Śiva and Pārvatī on a tiger skin, the trident beside them */}
      <mesh position={[KX, SY + 0.004, KZ + 0.1]} rotation-x={-Math.PI / 2} scale={[1, 0.62, 1]} material={tiger}>
        <circleGeometry args={[0.92, 48]} />
      </mesh>
      <HighFigure kind="shiva" position={shivaPos} scale={SHIVA_SCALE} mirror aura={0.35} />
      <HighFigure kind="parvati" position={parvatiPos} scale={0.76} aura={0.3} />
      <BagMesh
        materials={{ gold: mats.gold(), wood: standard('#6b4426', 0.6) }}
        build={(bag) => buildTrishul(bag, [KX - 0.86, SY - 0.05, KZ - 0.2], 1.5)}
      />

      {/* Nandī waits at the foot of the mountain, gazing up at his lord */}
      <BagMesh
        materials={NANDI_MATS}
        build={(bag) => bovine(bag, { seated: true })}
        position={[SHIVA_SEAT.x - 0.4, SHIVA_SEAT.h, SHIVA_SEAT.z + 0.9]}
        rotation={[0, Math.PI, 0]}
        scale={0.75}
      />

      {/* Divine radiance on the summit */}
      <Glow position={[KX, SY + 0.55, KZ - 0.3]} size={3.4} color="#cfe6ff" opacity={0.3} pulse={0.04} />
      <Rays position={[KX, SY + 0.6, KZ - 0.4]} size={4.2} color="#e8f2ff" opacity={0.14} />
      <pointLight position={[KX, SY + 1.3, KZ + 1.3]} color="#ffe2b8" intensity={3} distance={5} decay={1.6} />

      <FlowTube points={ganga} radius={0.02} color="#d8f0ff" color2="#3a8ae0" speed={1.3} intensity={1.5} opacity={0.65} segments={220} streakScale={0.6} />

      {/* Mānasarovara & Rākṣastāl */}
      {LAKES.map((lk, i) => (
        <group key={lk.name}>
          <mesh position={[lk.x, -0.02, lk.z]} rotation-x={-Math.PI / 2} scale={[1, 1 / 1.15, 1]}>
            <circleGeometry args={[lk.r * 1.05, 48]} />
            <meshStandardMaterial
              color={i === 0 ? '#2a7fd0' : '#1b4f8f'}
              roughness={0.08}
              metalness={0.3}
              emissive={i === 0 ? '#0a3a6a' : '#081e3a'}
              emissiveIntensity={0.6}
            />
          </mesh>
          <Caption at={[lk.x, 0.9, lk.z]} text={lk.name} sub={i === 0 ? 'lake of the mind' : 'lake of the rākṣasas'} range={26} when={['kailash']} />
        </group>
      ))}

      {/* Snowfall & mountain mist below the summit */}
      <Billboards
        seed={5}
        texture="glow"
        items={(r) =>
          Array.from({ length: 420 }, () => ({
            p: [KX + r.range(-5, 5), r.range(0.5, 7), KZ + r.range(-4, 5)],
            size: r.range(0.03, 0.07),
            color: '#ffffff',
            alpha: 0.8,
          }))
        }
        rise={-0.35}
        riseHeight={6}
        drift={0.3}
      />
      <Billboards
        seed={8}
        texture="cloud"
        additive={false}
        items={(r) =>
          Array.from({ length: 22 }, () => {
            const a = r.range(Math.PI * 0.9, Math.PI * 2.1)
            const d = r.range(2.2, 4.6)
            return {
              p: [KX + Math.cos(a) * d, r.range(2.0, 4.0), KZ + Math.sin(a) * d * 0.8],
              size: r.range(1.6, 3.2),
              color: '#f4f6ff',
              alpha: 0.55,
            }
          })
        }
        drift={0.25}
        opacity={0.8}
      />
      <Glyph text="ॐ" position={[KX, SY + 2.3, KZ - 0.9]} size={0.8} opacity={0.3} />
      <Caption at={[KX + 1.7, BASE_Y + 2.6, KZ + 0.9]} text="Kailāsa" sub="6,638 m" range={40} when={['kailash']} />
    </group>
  )
}
