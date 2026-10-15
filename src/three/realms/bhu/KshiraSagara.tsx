import { useMemo } from 'react'
import * as THREE from 'three'
import { KSHIRA_POS } from '../../../data/layout'
import { Figure, PALETTES } from '../../parts/Figure'
import { Lotus, Serpent, Forest, BagMesh } from '../../parts/common'
import { Glow, Rays } from '../../parts/Glow'
import { Billboards } from '../../parts/Billboards'
import { Caption } from '../../parts/Labels'
import { mats, standard } from '../../core/materials'
import { rng } from '../../core/noise'
import type { V3 } from '../../core/GeoBag'

/**
 * Anantaśayana: Viṣṇu reclines on the coils of Śeṣa in the Ocean of Milk.
 * Lakṣmī serves at his feet; Brahmā sits on the lotus from his navel.
 */
export function KshiraSagara() {
  const stalk = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.27, 1.55, 0.6),
      new THREE.Vector3(0.4, 2.3, 1.1),
      new THREE.Vector3(0.3, 3.1, 1.5),
      new THREE.Vector3(0.45, 3.8, 1.7),
    ])
    return new THREE.TubeGeometry(curve, 32, 0.045, 8, false)
  }, [])

  const island = useMemo(() => {
    const r = rng(12)
    return Array.from({ length: 26 }, () => {
      const a = r.next() * Math.PI * 2
      const d = Math.sqrt(r.next()) * 3.2
      return { p: [9 + Math.cos(a) * d, 0.35, -7 + Math.sin(a) * d] as V3, s: r.range(0.35, 0.55), c: '#e9f2e6' }
    })
  }, [])

  return (
    <group position={KSHIRA_POS}>
      {/* Śeṣa: coils as a bed, seven hoods as a canopy */}
      <Serpent
        spec={{
          bodyR: 0.34,
          coil: { rx: 2.5, rz: 1.15, turns: 2.6, rise: 0.26, shrink: 0.3, y0: 0.15, start: 0 },
          neck: [
            [-2.8, 1.1, -0.1],
            [-3.0, 2.1, -0.6],
            [-2.1, 3.05, -0.55],
          ],
          hoods: 7,
          hoodSize: 0.62,
          facing: [0.55, -0.3, 0.85],
          spread: 1.25,
        }}
        color="#f1ead6"
        belly="#fff6d8"
        gem="#9ff6ff"
        emissive="#2a2410"
      />

      {/* Viṣṇu reclining (Anantaśayana), head toward the hoods */}
      <Figure
        spec={{ pose: 'reclining', head: 'crown', arms: 2, garland: true, mudra: 'recline', items: { R: 'padma' } }}
        palette={PALETTES.vishnu}
        position={[0.55, 1.02, 0.1]}
        scale={2.4}
        aura={0.35}
      />

      {/* Lotus from the navel, Brahmā upon it */}
      <mesh geometry={stalk} material={standard('#3f8f4a', 0.6, 0, '#0f3a1a', 0.5)} />
      <Lotus spec={{ radius: 0.55, layers: 2, petals: 12, openness: 0.8 }} position={[0.45, 3.78, 1.7]} base="#fff3f6" tip="#f57aa8" />
      <Figure
        spec={{ pose: 'seated', head: 'four', arms: 4, beard: true, mudra: 'lap', items: { BR: 'mala', BL: 'book', R: 'kamandalu', L: 'sruva' } }}
        palette={PALETTES.brahma}
        position={[0.45, 3.9, 1.7]}
        scale={0.5}
        aura={0.3}
      />

      {/* Lakṣmī at his feet */}
      <Lotus spec={{ radius: 0.7, layers: 2, petals: 14 }} position={[3.55, 0.55, 0.9]} />
      <Figure
        spec={{ pose: 'seated', head: 'crownSmall', female: true, mudra: 'lotuses', items: { R: 'padma', L: 'padma' } }}
        palette={PALETTES.lakshmi}
        position={[3.55, 0.66, 0.9]}
        rotation={[0, -Math.PI / 2 - 0.35, 0]}
        scale={0.95}
        aura={0.35}
      />

      {/* Śvetadvīpa, the white island */}
      <mesh position={[9, -0.4, -7]} scale={[1, 0.22, 1]}>
        <sphereGeometry args={[3.6, 32, 16]} />
        <meshStandardMaterial color="#f4f1e8" roughness={0.6} emissive="#3a3a34" emissiveIntensity={0.4} />
      </mesh>
      <Forest points={island} kind="round" leaf="#e9f2e6" emissive="#cfe6ff" emissiveIntensity={0.3} />
      <BagMesh
        materials={{ stone: mats.marble(), gold: mats.gold() }}
        build={(bag) => {
          bag.cyl('stone', [9, 0.5, -7], 0.9, 1.0, 0.4, 24)
          bag.cyl('stone', [9, 1.1, -7], 0.55, 0.6, 1.0, 16)
          bag.addT('gold', new THREE.SphereGeometry(0.62, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), [9, 1.6, -7])
        }}
      />

      {/* Milky radiance & foam */}
      <Glow position={[0, 1.6, 0]} size={14} color="#cfe0ff" opacity={0.35} pulse={0.04} depthTest={false} />
      <Rays position={[-1, 2.0, -0.6]} size={9} color="#e6f0ff" opacity={0.22} depthTest={false} />
      <Billboards
        seed={31}
        texture="glow"
        items={(r) =>
          Array.from({ length: 160 }, () => {
            const a = r.next() * Math.PI * 2
            const d = r.range(2.5, 14)
            return { p: [Math.cos(a) * d, r.range(0.05, 0.25), Math.sin(a) * d], size: r.range(0.15, 0.45), color: '#ffffff', alpha: 0.6 }
          })
        }
        twinkle={0.6}
        drift={0.4}
        intensity={1.2}
      />
      <pointLight position={[1, 3, 3]} color="#dfe8ff" intensity={8} distance={12} decay={1.6} />
      <Caption at={[9, 2.6, -7]} text="Śvetadvīpa" sub="the white island" range={60} when={['kshira']} />
    </group>
  )
}
