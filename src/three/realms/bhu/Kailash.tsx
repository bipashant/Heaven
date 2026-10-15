import { useMemo } from 'react'
import * as THREE from 'three'
import { KAILASH, LAKES, SHIVA_SEAT } from '../../../data/layout'
import { divineMaterial, mats, standard } from '../../core/materials'
import { fbm2, smoothstep } from '../../core/noise'
import { tigerTexture } from '../../core/textures'
import { heightAt } from './terrain'
import { Figure, PALETTES } from '../../parts/Figure'
import { BagMesh, Glyph } from '../../parts/common'
import { bovine } from '../../parts/builders'
import { buildTrishul } from '../../parts/figureBuilder'
import { Glow, Rays } from '../../parts/Glow'
import { Billboards } from '../../parts/Billboards'
import { FlowTube } from '../../parts/FlowTube'
import { Caption } from '../../parts/Labels'
import type { V3 } from '../../core/GeoBag'

/**
 * Kailāsa: a four-faced, dome-capped peak with horizontal strata and the
 * famous vertical gully on its south face, snow lying on its ledges.
 */
function buildKailashGeometry(H = 4.4, R0 = 1.65) {
  const ny = 110
  const skirt = 14
  const na = 160
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
      const ct = Math.cos(th)
      const st = Math.sin(th)
      const p = 3.2
      const sq = 1 / Math.pow(Math.pow(Math.abs(ct), p) + Math.pow(Math.abs(st), p), 1 / p)
      let R = R0 * Math.pow(Math.max(0, 1 - Math.pow(t, 1.7)), 0.62) + R0 * 0.25 * Math.pow(1 - t, 5) + R0 * 0.9 * below
      const strata = 1 + 0.014 * Math.sin(t * 46 + fbm2(th * 2, t * 3, 2) * 3) + 0.006 * Math.sin(t * 131)
      // south face (+z ⇒ th = π/2): vertical gully and horizontal band
      const dS = Math.atan2(Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2))
      const gully = 0.1 * Math.exp(-((dS / 0.05) ** 2)) * smoothstep(0.12, 0.35, t) * (1 - smoothstep(0.72, 0.88, t))
      const band = 0.05 * Math.exp(-(((t - 0.5) / 0.025) ** 2)) * Math.exp(-((dS / 0.32) ** 2))
      const n = fbm2(th * 3 + t * 2, t * 6, 4)
      const crag = fbm2(th * 9 + t * 4, t * 22, 3)
      R *= sq * strata * (1 - gully - band) * (1 + 0.06 * n + 0.035 * crag)
      const y = t * H + 0.05 * n * (1 - t) - below * 2.2
      pos.push(ct * R, y, st * R)
      // colour: dark strata, snow on ledges, cap and gully
      c.copy(rock).lerp(rock2, 0.5 + 0.5 * Math.sin(t * 46 + n * 2))
      const ledge = smoothstep(0.86, 0.99, Math.sin(t * 46 + 0.6 + n * 2.5)) * smoothstep(0.25, 0.4, t) * smoothstep(-0.1, 0.4, fbm2(th * 5, t * 9, 3))
      const cap = smoothstep(0.66 + n * 0.08, 0.74 + n * 0.08, t)
      const gs = Math.exp(-((dS / 0.07) ** 2)) * smoothstep(0.15, 0.3, t)
      const snowK = Math.min(1, cap + ledge * 0.6 + gs * 0.85 + smoothstep(0.45, 0.85, n) * 0.35 * t)
      c.lerp(snow, snowK)
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

const NANDI_MATS = {
  hide: divineMaterial('#e9e4d8', '#fff1c8', 1.3, 0.4),
  horn: standard('#c9b28a', 0.5, 0.2),
  gold: mats.gold(),
}

export function Kailash() {
  const baseY = SHIVA_SEAT.h - 0.3
  const geo = useMemo(() => buildKailashGeometry(), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 }), [])
  const seat: V3 = [SHIVA_SEAT.x, SHIVA_SEAT.h, SHIVA_SEAT.z]
  const shivaPos: V3 = [seat[0] - 0.42, seat[1] + 0.03, seat[2]]
  const parvatiPos: V3 = [seat[0] + 0.4, seat[1] + 0.03, seat[2] + 0.02]

  const tiger = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tigerTexture(), roughness: 0.85, transparent: false }),
    [],
  )

  // The Gaṅgā springs from Śiva's locks and runs down the mountain
  const ganga = useMemo<V3[]>(() => {
    const top: V3 = [shivaPos[0] + 0.05, shivaPos[1] + 1.12, shivaPos[2] - 0.06]
    const pts: V3[] = [
      top,
      [top[0] - 0.25, top[1] + 0.45, top[2] - 0.15],
      [top[0] - 0.75, top[1] + 0.25, top[2] - 0.1],
      [top[0] - 1.05, top[1] - 0.4, top[2] + 0.15],
    ]
    const start = { x: top[0] - 1.15, z: top[2] + 0.4 }
    const end = { x: LAKES[1].x + 0.6, z: LAKES[1].z - 0.6 }
    for (let i = 0; i <= 8; i++) {
      const t = i / 8
      const x = start.x + (end.x - start.x) * t + Math.sin(t * 6) * 0.15
      const z = start.z + (end.z - start.z) * t
      pts.push([x, Math.max(heightAt(x, z), -0.1) + 0.06, z])
    }
    return pts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <group>
      <mesh geometry={geo} material={mat} position={[KAILASH.x, baseY, KAILASH.z]} />

      {/* Tiger-skin seat */}
      <mesh position={[seat[0], seat[1] + 0.012, seat[2] + 0.05]} rotation-x={-Math.PI / 2} scale={[1, 0.62, 1]} material={tiger}>
        <circleGeometry args={[0.95, 40]} />
      </mesh>

      {/* Śiva (mirrored so his raised right hand blesses, Pārvatī on his left) */}
      <group position={shivaPos} scale={[-0.9, 0.9, 0.9]}>
        <Figure
          spec={{ pose: 'seated', head: 'jata', moon: true, thirdEye: true, snake: true, mudra: 'abhaya', lean: 0.05, prabhavali: false }}
          palette={PALETTES.shiva}
          aura={0.45}
        />
      </group>
      <Figure
        spec={{ pose: 'seated', head: 'crownSmall', female: true, mudra: 'abhaya', items: { R: 'padma' }, lean: 0.07 }}
        palette={PALETTES.parvati}
        position={parvatiPos}
        scale={0.78}
        aura={0.4}
      />

      {/* Trident planted beside Śiva */}
      <BagMesh
        materials={{ gold: mats.gold(), wood: standard('#6b4426', 0.6) }}
        build={(bag) => buildTrishul(bag, [shivaPos[0] - 0.62, seat[1], shivaPos[2] - 0.12], 1.65)}
      />

      {/* Nandī faces his lord */}
      <BagMesh
        materials={NANDI_MATS}
        build={(bag) => bovine(bag, { seated: true })}
        position={[seat[0] + 1.25, seat[1], seat[2] + 1.35]}
        rotation={[0, Math.PI + 0.75, 0]}
        scale={0.72}
      />

      {/* Divine radiance */}
      <Glow position={[seat[0], seat[1] + 0.8, seat[2] - 0.4]} size={5.5} color="#cfe6ff" opacity={0.45} pulse={0.04} />
      <Rays position={[seat[0], seat[1] + 0.9, seat[2] - 0.5]} size={6} color="#e8f2ff" opacity={0.28} />
      <pointLight position={[seat[0], seat[1] + 1.6, seat[2] + 1.2]} color="#ffe2b8" intensity={6} distance={7} decay={1.6} />

      <FlowTube points={ganga} radius={0.02} color="#d8f0ff" color2="#3a8ae0" speed={1.3} intensity={1.5} opacity={0.65} streakScale={0.6} />

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

      {/* Snowfall & mountain mist */}
      <Billboards
        seed={5}
        texture="glow"
        items={(r) =>
          Array.from({ length: 420 }, () => ({
            p: [KAILASH.x + r.range(-5, 5), r.range(0.5, 7), KAILASH.z + r.range(-4, 5)],
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
          Array.from({ length: 18 }, () => {
            const a = r.range(Math.PI * 0.95, Math.PI * 2.05)
            const d = r.range(2.2, 4.5)
            return {
              p: [KAILASH.x + Math.cos(a) * d, r.range(2.0, 4.2), KAILASH.z + Math.sin(a) * d * 0.8],
              size: r.range(1.6, 3.2),
              color: '#f4f6ff',
              alpha: 0.55,
            }
          })
        }
        drift={0.25}
        opacity={0.8}
      />
      <Glyph text="ॐ" position={[KAILASH.x, baseY + 5.2, KAILASH.z]} size={1.3} opacity={0.5} />
      <Caption at={[KAILASH.x, baseY + 4.4, KAILASH.z]} text="Kailāsa" sub="6,638 m" range={40} when={['kailash']} />
    </group>
  )
}
