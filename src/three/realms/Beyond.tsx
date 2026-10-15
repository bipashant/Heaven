import { useMemo } from 'react'
import * as THREE from 'three'
import { Y } from '../../data/layout'
import { divineMaterial, mats, standard } from '../core/materials'
import { fbm2, noise2, rng } from '../core/noise'
import { Figure, PALETTES } from '../parts/Figure'
import { BagMesh, Forest, Lotus, Serpent, Spin, Float, type TreePoint } from '../parts/common'
import { gopuram, palace, pavilion, ringWall, shikhara } from '../parts/builders'
import { Billboards } from '../parts/Billboards'
import { Glow, Rays } from '../parts/Glow'
import { Caption } from '../parts/Labels'
import type { V3 } from '../core/GeoBag'

// ===========================================================================
// VAIKUṆṬHA
// ===========================================================================

function VaikunthaIsland() {
  const under = useMemo(() => {
    const g = new THREE.ConeGeometry(84, 90, 40, 12)
    g.rotateX(Math.PI)
    g.translate(0, -47, 0)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      if (y > -3) continue
      const k = 1 + 0.22 * fbm2(x * 0.05 + y * 0.03, z * 0.05, 3)
      pos.setXYZ(i, x * k, y + 6 * noise2(x * 0.04, z * 0.04), z * k)
    }
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group>
      <mesh geometry={under} material={new THREE.MeshStandardMaterial({ color: '#2a4ab8', metalness: 0.5, roughness: 0.2, flatShading: true, emissive: '#1a2a8a', emissiveIntensity: 0.6 })} />
      <mesh position={[0, -1.5, 0]} material={standard('#18307a', 0.35, 0.4, '#13308a', 0.5)}>
        <cylinderGeometry args={[84, 84, 3, 96]} />
      </mesh>
      <Glow position={[0, -70, 0]} size={180} color="#6fa8ff" opacity={0.35} />
      <Billboards
        seed={1050}
        items={(r) =>
          Array.from({ length: 160 }, () => {
            const a = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * 70
            return { p: [Math.cos(a) * d, r.range(-60, -6), Math.sin(a) * d], size: r.range(0.8, 2), color: '#bfe0ff', alpha: 0.8 }
          })
        }
        rise={-2}
        riseHeight={60}
        intensity={1.8}
      />
    </group>
  )
}

const WALL_RADII = [76, 66, 56, 46, 36, 28, 21]

function VaikunthaCity() {
  return (
    <BagMesh
      materials={{ stone: mats.paleGold(), gold: mats.gold(), jewel: mats.sapphire(), white: mats.marble() }}
      build={(bag) => {
        WALL_RADII.forEach((r, i) => {
          ringWall(bag, [0, 0, 0], r, 2.2 - i * 0.1, 0.8, 8, i % 2 ? 'jewel' : 'stone', 'gold')
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2 + Math.PI / 2
            gopuram(bag, [Math.cos(a) * r, 0, Math.sin(a) * r], 4.5 - i * 0.3, 2.6, 8 - i * 0.5, 5, 'white', 'gold', -a + Math.PI / 2)
          }
        })
        const rr = rng(1050)
        for (let ring = 0; ring < WALL_RADII.length - 1; ring++) {
          const mid = (WALL_RADII[ring] + WALL_RADII[ring + 1]) / 2
          const n = Math.floor(mid / 3.2)
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + rr.next() * 0.1
            if (Math.abs(Math.cos(a)) < 0.06 || Math.abs(Math.sin(a)) < 0.06) continue
            if (rr.next() < 0.45) continue
            const x = Math.cos(a) * mid
            const z = Math.sin(a) * mid
            if (rr.next() < 0.5) palace(bag, [x, 0, z], 2.6, 2.2, 2.2, 'white', 'gold')
            else shikhara(bag, [x, 0, z], 1.1, rr.range(4, 6.5), 'stone', 'gold')
          }
        }
        // central stepped pedestal
        bag.cyl('white', [0, 1, 0], 15, 16, 2, 64)
        bag.cyl('gold', [0, 2.6, 0], 12.5, 13, 1.2, 64)
        bag.cyl('white', [0, 3.8, 0], 10.5, 11, 1.2, 64)
        // Garuḍa-stambha before the inner gate
        bag.cyl('gold', [0, 3.5, 25.5], 0.45, 0.6, 7, 12)
        bag.cyl('gold', [0, 7.1, 25.5], 1.1, 0.7, 0.4, 16)
      }}
    />
  )
}

function Vimanas() {
  return (
    <Spin speed={0.04}>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        const d = 98 + (i % 3) * 12
        return (
          <Float key={i} amp={3} speed={0.25} position={[Math.cos(a) * d, 8 + (i % 4) * 9, Math.sin(a) * d]}>
            <BagMesh
              materials={{ stone: mats.paleGold(), gold: mats.gold(), white: mats.marble() }}
              rotation={[0, -a, 0]}
              build={(bag) => {
                bag.cyl('gold', [0, 0, 0], 3.2, 1.2, 1.6, 16)
                pavilion(bag, [0, 0.8, 0], 2.0, 4.4, 8, 'white', 'gold')
              }}
            />
            <Glow position={[0, -1, 0]} size={12} color="#9fd0ff" opacity={0.6} />
          </Float>
        )
      })}
    </Spin>
  )
}

function Garuda({ position, rotation }: { position: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Figure
        spec={{ pose: 'standing', head: 'crownSmall', mudra: 'namaste', halo: false }}
        palette={{ skin: '#2fa86a', rim: '#ffd27a', cloth: '#d6264f', cloth2: '#f2c031', glow: 2, aura: '#ffd27a' }}
        scale={2.6}
        aura={0.3}
      />
      <BagMesh
        materials={{ wing: divineMaterial('#e8a02a', '#ffd27a', 1.8, 0.6), red: standard('#c4213f', 0.5, 0.2, '#5a0a1a', 0.5) }}
        build={(bag) => {
          for (const s of [1, -1]) {
            for (let k = 0; k < 4; k++) {
              bag.sphere(k % 2 ? 'red' : 'wing', [s * (1.0 + k * 0.32), 3.4 + k * 0.3, -0.35], 1, [0.7 - k * 0.08, 0.16, 0.05], 12, [0, s * 0.25, s * (0.5 + k * 0.12)])
            }
          }
        }}
      />
    </group>
  )
}

export function Vaikuntha() {
  return (
    <group position={[0, Y.vaikuntha, 0]}>
      <VaikunthaIsland />
      <VaikunthaCity />
      <Forest
        kind="round"
        emissive="#3a8aff"
        emissiveIntensity={0.5}
        points={useMemo(() => {
          const r = rng(7)
          const pts: TreePoint[] = []
          for (let i = 0; i < 360; i++) {
            const a = r.next() * Math.PI * 2
            const d = r.range(17, 80)
            if (WALL_RADII.some((w) => Math.abs(d - w) < 2)) continue
            pts.push({ p: [Math.cos(a) * d, 0, Math.sin(a) * d], s: r.range(0.8, 1.4), c: r.pick(['#3ad6b0', '#ff8ad8', '#ffd36e', '#6fb6ff', '#4fd36a']) })
          }
          return pts
        }, [])}
      />

      {/* Nārāyaṇa seated on Śeṣa with Lakṣmī */}
      <group position={[0, 4.4, 0]} scale={1.6}>
      <Serpent
        position={[0, 0, -1]}
        spec={{
          bodyR: 0.9,
          coil: { rx: 3.4, rz: 3.0, turns: 2.2, rise: 0.75, shrink: 0.35, y0: 0.4 },
          neck: [
            [0, 2.6, -3.6],
            [0, 6.2, -4.2],
            [0, 10.4, -3.0],
          ],
          hoods: 7,
          hoodSize: 2.3,
          facing: [0, -0.35, 1],
          spread: 1.15,
        }}
        color="#ece4cf"
        belly="#fff4d0"
        gem="#8ff6ff"
        emissive="#2a2410"
      />
      <Figure
        spec={{ pose: 'seated', head: 'crown', arms: 4, garland: true, mudra: 'abhaya', items: { BR: 'chakra', BL: 'shankha', L: 'gada' } }}
        palette={PALETTES.vishnu}
        position={[-0.6, 2.9, -0.8]}
        scale={6.2}
        aura={0.4}
      />
      <Lotus spec={{ radius: 3, layers: 2, petals: 14 }} position={[5.2, 0, 0.6]} base="#fff6f6" tip="#ff7aa8" />
      <Figure
        spec={{ pose: 'seated', head: 'crownSmall', female: true, mudra: 'lotuses', items: { R: 'padma', L: 'padma' }, lean: 0.06 }}
        palette={PALETTES.lakshmi}
        position={[5.2, 0.6, 0.6]}
        rotation={[0, -0.25, 0]}
        scale={4.2}
        aura={0.35}
      />
      </group>

      <Garuda position={[0, 7.3, 25.5]} rotation={[0, Math.PI, 0]} />
      {/* Jaya and Vijaya at the seventh gate */}
      {[-1, 1].map((s) => (
        <Figure
          key={s}
          spec={{ pose: 'standing', head: 'crown', arms: 4, mudra: 'abhaya', items: { L: 'gada', BR: 'chakra', BL: 'shankha' } }}
          palette={PALETTES.vishnu}
          position={[s * 3.6, 0, 22.5]}
          rotation={[0, s * -0.2, 0]}
          scale={2.2}
          aura={0.3}
        />
      ))}

      <Vimanas />
      <Glow position={[0, 16, -4]} size={60} color="#9fc8ff" opacity={0.28} pulse={0.03} depthTest={false} />
      <Rays position={[0, 16, -5]} size={70} color="#dfeaff" opacity={0.2} depthTest={false} />
      <Billboards
        seed={1051}
        texture="spark"
        items={(r) =>
          Array.from({ length: 300 }, () => {
            const a = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * 90
            return { p: [Math.cos(a) * d, r.range(1, 40), Math.sin(a) * d], size: r.range(0.6, 1.6), color: r.pick(['#cfe6ff', '#ffe7a0', '#ffffff']), alpha: 0.9 }
          })
        }
        drift={2}
        twinkle={0.8}
        intensity={1.8}
      />
      <pointLight position={[0, 22, 18]} color="#dfe8ff" intensity={90} distance={120} decay={1.4} />
      <Caption at={[0, 11, 27]} text="Garuḍa" sub="Viṣṇu’s eagle-mount" range={160} when={['vaikuntha']} />
      <Caption at={[0, 7, 22.5]} text="Jaya & Vijaya" sub="gatekeepers of the seventh gate" range={130} when={['vaikuntha']} />
      <Caption at={[0, 6, 76]} text="Seven gates" sub="concentric walls of Vaikuṇṭha" range={300} when={['vaikuntha']} />
    </group>
  )
}
