import { useMemo } from 'react'
import * as THREE from 'three'
import { Y } from '../../data/layout'
import { divineMaterial, glowMaterial, mats, standard } from '../core/materials'
import { rng } from '../core/noise'
import { Figure, PALETTES, type Palette } from '../parts/Figure'
import { BagMesh, Forest, Lotus, Spin, type TreePoint } from '../parts/common'
import { elephant, gopuram, palace, pavilion, shikhara } from '../parts/builders'
import { Billboards } from '../parts/Billboards'
import { Glow, Rays } from '../parts/Glow'
import { Caption } from '../parts/Labels'

const STONE = { stone: mats.marble(), gold: mats.gold() }

function City() {
  return (
    <BagMesh
      materials={STONE}
      build={(bag) => {
        // ground & terraces
        bag.cyl('stone', [0, -1.5, 0], 52, 50, 3, 96)
        bag.torus('gold', [0, 0, 0], 52, 0.5, [Math.PI / 2, 0, 0], Math.PI * 2, 128)
        bag.cyl('stone', [0, 0.2, -30], 16, 17, 0.4, 48)
        bag.torus('gold', [0, 0, 0], 7.3, 0.35, [Math.PI / 2, 0, 0], Math.PI * 2, 64)
        // Sudharmā, the assembly hall of the devas
        pavilion(bag, [0, 0.4, -27], 6.5, 9, 12)
        // Vaijayanta, Indra’s palace
        palace(bag, [0, 0.4, -40], 20, 7, 6)
        shikhara(bag, [-12, 0.4, -40], 2.4, 11)
        shikhara(bag, [12, 0.4, -40], 2.4, 11)
        // gate towers at the four quarters
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 2
          gopuram(bag, [Math.cos(a) * 49, 0, Math.sin(a) * 49], 7, 4, 12, 5, 'stone', 'gold', -a + Math.PI / 2)
        }
        // mansions of the devas
        const r = rng(240)
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2 + 0.12
          if (Math.sin(a) < -0.55) continue
          const d = r.range(33, 43)
          const x = Math.cos(a) * d
          const z = Math.sin(a) * d
          if (r.next() < 0.5) palace(bag, [x, 0, z], r.range(5, 7), r.range(4, 6), r.range(3, 5))
          else shikhara(bag, [x, 0, z], r.range(1.6, 2.4), r.range(6, 10))
        }
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2
          if (Math.sin(a) < -0.5) continue
          pavilion(bag, [Math.cos(a) * 12, 0, Math.sin(a) * 12], 1.4, 3.4, 6)
        }
        // Indra’s throne dais
        bag.cyl('gold', [0, 0.4, -15], 4.2, 4.5, 0.8, 40)
        bag.box('gold', [0, 3.2, -16.6], [6.5, 5.2, 0.4])
        bag.torus('gold', [0, 5.6, -16.5], 2.6, 0.18, [0, 0, 0], Math.PI, 32)
      }}
    />
  )
}

function KalpaVriksha({ position, leaf = '#ffd56a', flower = '#fff3c0' }: { position: [number, number, number]; leaf?: string; flower?: string }) {
  return (
    <group position={position}>
      <BagMesh
        materials={{ wood: standard('#7a5230', 0.7), gold: mats.gold() }}
        build={(bag) => {
          bag.tube('wood', [[0, 0, 0], [0.3, 2, 0], [-0.2, 4, 0.2], [0, 5.5, 0]], 0.5, 24, 10)
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2
            bag.tube('wood', [[0, 4, 0], [Math.cos(a) * 1.6, 5.2, Math.sin(a) * 1.6], [Math.cos(a) * 2.6, 6, Math.sin(a) * 2.6]], 0.18, 12, 6)
          }
        }}
      />
      <Billboards
        seed={position[0] * 7 + 3}
        texture="glow"
        items={(r) =>
          Array.from({ length: 140 }, () => {
            const v = new THREE.Vector3(r.range(-1, 1), r.range(-0.4, 1), r.range(-1, 1)).normalize().multiplyScalar(r.range(0.5, 3.4))
            return { p: [v.x, 6.2 + v.y * 0.8, v.z], size: r.range(0.6, 1.4), color: r.next() < 0.7 ? leaf : flower, alpha: 0.9 }
          })
        }
        twinkle={0.5}
        intensity={1.8}
      />
      <Glow position={[0, 6, 0]} size={12} color={leaf} opacity={0.4} />
    </group>
  )
}

function Rainbow() {
  const colors = ['#ff3b3b', '#ff9a2e', '#ffe14a', '#4cd964', '#3aa0ff', '#5a5aff', '#b56bff']
  return (
    <group position={[0, -6, -12]}>
      {colors.map((c, i) => (
        <mesh key={c} material={glowMaterial(c, 1.3, { transparent: true, opacity: 0.32 })}>
          <torusGeometry args={[66 - i * 0.9, 0.45, 6, 160, Math.PI]} />
        </mesh>
      ))}
    </group>
  )
}

const APSARA_PALETTES: Palette[] = [
  { skin: '#f6d2b0', rim: '#ffd0e8', cloth: '#e83a7a', cloth2: '#f5c242', glow: 1.6, aura: '#ffd0e8' },
  { skin: '#f3cfa4', rim: '#cfe8ff', cloth: '#3a8ae8', cloth2: '#f5c242', glow: 1.6, aura: '#cfe8ff' },
  { skin: '#f5d6b6', rim: '#fff0b0', cloth: '#f2a020', cloth2: '#e8304a', glow: 1.6, aura: '#fff0b0' },
]

export function Svarga() {
  const garden = useMemo(() => {
    const r = rng(19)
    const pts: TreePoint[] = []
    for (let i = 0; i < 260; i++) {
      const a = r.next() * Math.PI * 2
      const d = r.range(16, 47)
      const x = Math.cos(a) * d
      const z = Math.sin(a) * d
      if (z < -22 && Math.abs(x) < 24) continue
      if (Math.abs(Math.hypot(x, z) - 38) < 4 && r.next() < 0.7) continue
      pts.push({ p: [x, 0, z], s: r.range(0.9, 1.6), c: r.pick(['#3f8f3a', '#4fa046', '#e8a0c8', '#f7d27a', '#5fb45a']) })
    }
    return pts
  }, [])

  return (
    <group position={[0, Y.svarga, 0]}>
      {/* the cloud-sea on which Amarāvatī floats */}
      <Billboards
        seed={240}
        texture="cloud"
        additive={false}
        items={(r) =>
          Array.from({ length: 220 }, () => {
            const a = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * 78
            const warm = r.next()
            return {
              p: [Math.cos(a) * d, r.range(-12, -1) + (d > 52 ? r.range(0, 4) : 0), Math.sin(a) * d] as [number, number, number],
              size: r.range(16, 34),
              color: warm < 0.3 ? '#ffe9c6' : warm < 0.6 ? '#fff6ea' : '#f2f0ff',
              alpha: r.range(0.55, 0.9),
            }
          })
        }
        drift={2}
        opacity={0.95}
      />
      <City />
      {/* Mandākinī: the heavenly Gaṅgā pools at the city’s heart */}
      <mesh position={[0, 0.06, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[7.1, 64]} />
        <meshStandardMaterial color="#3aa8ff" roughness={0.05} metalness={0.3} emissive="#1a6ad0" emissiveIntensity={0.9} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <Lotus key={i} spec={{ radius: 0.6, layers: 2, petals: 10 }} position={[Math.cos(i * 1.3) * 4.5, 0.12, Math.sin(i * 1.3) * 4.5]} />
      ))}
      <Forest points={garden} kind="round" leaf="#4fa046" emissive="#2a3a10" emissiveIntensity={0.4} />
      <KalpaVriksha position={[15, 0, -9]} />
      <KalpaVriksha position={[-17, 0, -6]} leaf="#f7f3ff" flower="#ff9a4a" />

      {/* Indra on his throne with Śacī; Airāvata beside them */}
      <Figure
        spec={{ pose: 'seated', head: 'crown', arms: 2, mudra: 'abhaya', items: { L: 'vajra' }, prabhavali: true }}
        palette={PALETTES.indra}
        position={[-1.6, 0.8, -15]}
        scale={3.5}
        aura={0.4}
      />
      <Figure
        spec={{ pose: 'seated', head: 'crownSmall', female: true, mudra: 'lotuses', items: { R: 'padma' } }}
        palette={PALETTES.shachi}
        position={[2.4, 0.8, -14.7]}
        scale={2.8}
        aura={0.3}
      />
      <BagMesh
        materials={{
          hide: divineMaterial('#f2f0ea', '#ffffff', 1.1, 0.3),
          tusk: standard('#fff8e8', 0.3, 0.1, '#5a5040', 0.4),
          gold: mats.gold(),
          cloth: standard('#c4213f', 0.5, 0.2, '#5a0a1a', 0.4),
        }}
        build={(bag) => elephant(bag, 4)}
        position={[-9, 0, -11]}
        rotation={[0, 0.35, 0]}
        scale={1.8}
      />

      {/* Apsarās dancing around the Mandākinī */}
      <Spin speed={0.12}>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <Figure
              key={i}
              spec={{ pose: 'standing', head: 'bun', female: true, mudra: i % 2 ? 'abhaya' : 'lotuses', lean: 0.12 * (i % 2 ? 1 : -1), halo: false }}
              palette={APSARA_PALETTES[i % 3]}
              position={[Math.cos(a) * 9.5, 0, Math.sin(a) * 9.5]}
              rotation={[0, -a + Math.PI, 0]}
              scale={1.4}
              aura={0.2}
            />
          )
        })}
      </Spin>

      <Rainbow />
      <Glow position={[0, 6, -15]} size={26} color="#ffe2a0" opacity={0.4} pulse={0.04} depthTest={false} />
      <Rays position={[0, 6, -16]} size={30} color="#fff0c0" opacity={0.25} depthTest={false} />
      <Billboards
        seed={242}
        texture="spark"
        items={(r) =>
          Array.from({ length: 260 }, () => {
            const a = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * 55
            return { p: [Math.cos(a) * d, r.range(1, 22), Math.sin(a) * d], size: r.range(0.4, 1.1), color: '#ffe7a0', alpha: 0.9 }
          })
        }
        drift={1.5}
        twinkle={0.8}
        intensity={1.8}
      />
      <pointLight position={[0, 14, -6]} color="#ffe6b0" intensity={30} distance={90} decay={1.4} />
      <Caption at={[0, 15, -27]} text="Sudharmā" sub="assembly hall of the devas" range={140} when={['svarga']} />
      <Caption at={[0, 13, -40]} text="Vaijayanta" sub="palace of Indra" range={140} when={['svarga']} />
      <Caption at={[15, 10, -9]} text="Kalpavṛkṣa" sub="the wish-fulfilling tree" range={110} when={['svarga']} />
      <Caption at={[-17, 10, -6]} text="Pārijāta" sub="tree from the churning of the ocean" range={110} when={['svarga']} />
      <Caption at={[-9, 7.5, -11]} text="Airāvata" sub="Indra’s white elephant" range={90} when={['svarga']} />
    </group>
  )
}
