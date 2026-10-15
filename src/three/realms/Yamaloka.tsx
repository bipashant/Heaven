import { useMemo } from 'react'
import * as THREE from 'three'
import { Y } from '../../data/layout'
import { uTime } from '../core/time'
import { divineMaterial, mats, standard } from '../core/materials'
import { Figure, PALETTES } from '../parts/Figure'
import { BagMesh } from '../parts/common'
import { bovine, gopuram, ringWall, shikhara } from '../parts/builders'
import { Billboards } from '../parts/Billboards'
import { FlowTube } from '../parts/FlowTube'
import { Glow, Rays } from '../parts/Glow'
import { Caption } from '../parts/Labels'
import type { V3 } from '../core/GeoBag'

// Saṁyamanī, the city of Yama, south of the lower worlds above the Garbhodaka.
// The Narakas appear as fiery chasms: places of purification, not eternity.

const groundFrag = /* glsl */ `
  uniform float uTime;
  varying vec3 vL;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 7.7; a *= 0.5; } return s; }
  void main() {
    vec2 p = vL.xy;
    float r = length(p);
    float n = fbm(p * 0.08);
    vec3 col = mix(vec3(0.05, 0.03, 0.03), vec3(0.14, 0.08, 0.07), n);
    // lava cracks, only outside the city walls
    float c = abs(fbm(p * 0.09 + 3.0) - 0.5);
    float crack = (1.0 - smoothstep(0.0, 0.03, c)) * smoothstep(40.0, 48.0, r);
    float pulse = 0.65 + 0.35 * sin(uTime * 1.6 + p.x * 0.1);
    col += vec3(2.4, 0.6, 0.12) * crack * pulse;
    // glowing pits (narakas)
    float pits = smoothstep(0.72, 0.8, fbm(p * 0.05 + 21.0)) * smoothstep(46.0, 52.0, r);
    col += vec3(1.8, 0.35, 0.05) * pits * pulse;
    col *= 1.0 - smoothstep(70.0, 78.0, r) * 0.7;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const ISLAND_R = 78

export function Yamaloka() {
  const groundMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime },
        vertexShader: /* glsl */ `varying vec3 vL; void main(){ vL = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: groundFrag,
      }),
    [],
  )
  const under = useMemo(() => {
    const g = new THREE.ConeGeometry(ISLAND_R, 60, 32, 8)
    g.rotateX(Math.PI)
    g.translate(0, -30, 0)
    return g
  }, [])
  const vaitarani = useMemo<V3[]>(() => {
    const pts: V3[] = []
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      const d = 36 + 2.5 * Math.sin(a * 6)
      pts.push([Math.cos(a) * d, 0.5, Math.sin(a) * d])
    }
    return pts
  }, [])

  return (
    <group position={[0, Y.yama, 190]}>
      <mesh rotation-x={-Math.PI / 2} material={groundMat}>
        <circleGeometry args={[ISLAND_R, 128]} />
      </mesh>
      <mesh geometry={under} material={mats.basalt()} />

      <BagMesh
        materials={{ stone: mats.basalt(), gold: standard('#9a5a1a', 0.4, 0.7, '#ff5a1a', 0.5), bronze: standard('#6a3a1a', 0.45, 0.7, '#3a1a08', 0.5) }}
        build={(bag) => {
          ringWall(bag, [0, 0, 0], 30, 6, 1.8, 12, 'stone', 'gold')
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 2
            gopuram(bag, [Math.cos(a) * 30, 0, Math.sin(a) * 30], 8, 4.5, 15, 6, 'stone', 'gold', -a + Math.PI / 2)
          }
          // court of Dharmarāja
          bag.cyl('stone', [0, 0.6, -6], 13, 14, 1.2, 48)
          bag.cyl('bronze', [0, 1.5, -6], 6, 6.5, 0.6, 32)
          bag.box('gold', [0, 4.8, -9.2], [6.5, 6, 0.5])
          bag.torus('gold', [0, 7.8, -9.1], 3.2, 0.2, [0, 0, 0], Math.PI, 32)
          shikhara(bag, [-16, 0, -14], 3.6, 20, 'stone', 'gold')
          shikhara(bag, [16, 0, -14], 3.6, 20, 'stone', 'gold')
          bag.box('stone', [0, 4, -20], [24, 8, 6])
          // Citragupta’s desk
          bag.box('bronze', [9, 1.6, -2], [3, 0.3, 1.6])
        }}
      />

      {/* Yama with noose and staff; his buffalo; Citragupta with the book of deeds */}
      <Figure
        spec={{ pose: 'seated', head: 'crown', mudra: 'abhaya', items: { R: 'noose', L: 'danda' }, prabhavali: true }}
        palette={PALETTES.yama}
        position={[0, 1.8, -6.5]}
        scale={3.6}
        aura={0.45}
      />
      <BagMesh
        materials={{ hide: divineMaterial('#1a1a22', '#ff5a3c', 1.4, 0.3), horn: standard('#3a3030', 0.4, 0.3), gold: mats.gold() }}
        build={(bag) => bovine(bag, { seated: true, hump: false, buffalo: true })}
        position={[-7.5, 1.2, -4]}
        rotation={[0, 0.6, 0]}
        scale={2.4}
      />
      <Figure
        spec={{ pose: 'seated', head: 'crownSmall', mudra: 'lap', items: { R: 'stylus', L: 'book' } }}
        palette={PALETTES.chitragupta}
        position={[9, 1.2, -3.5]}
        rotation={[0, -0.5, 0]}
        scale={2}
        aura={0.3}
      />

      <FlowTube points={vaitarani} closed radius={2.4} color="#ff4a2a" color2="#8a0a0a" speed={0.5} intensity={1.8} segments={200} streakScale={0.5} />

      <Billboards
        seed={565}
        items={(r) =>
          Array.from({ length: 320 }, () => {
            const a = r.next() * Math.PI * 2
            const d = r.range(40, 74)
            return { p: [Math.cos(a) * d, 0.5, Math.sin(a) * d], size: r.range(0.3, 0.9), color: r.pick(['#ff6a2a', '#ffb347', '#ff3a1a']), alpha: 1 }
          })
        }
        rise={3}
        riseHeight={28}
        drift={1.4}
        intensity={2.4}
      />
      <Billboards
        seed={566}
        texture="cloud"
        additive={false}
        items={(r) =>
          Array.from({ length: 50 }, () => {
            const a = r.next() * Math.PI * 2
            const d = r.range(44, 80)
            return { p: [Math.cos(a) * d, r.range(4, 14), Math.sin(a) * d], size: r.range(10, 20), color: '#2a1a1a', alpha: 0.5 }
          })
        }
        drift={2}
        opacity={0.8}
      />
      <Glow position={[0, 8, -7]} size={30} color="#ff6a3a" opacity={0.4} pulse={0.06} />
      <Rays position={[0, 8, -8]} size={30} color="#ff9a6a" opacity={0.2} />
      <pointLight position={[0, 18, 18]} color="#ff7a4a" intensity={60} distance={110} decay={1.4} />
      <Caption at={[0, 15, -6]} text="Yama Dharmarāja" sub="lord of justice" range={150} when={['yama']} />
      <Caption at={[9, 6.5, -3.5]} text="Citragupta" sub="keeper of the record of deeds" range={110} when={['yama']} />
      <Caption at={[36, 4, 10]} text="Vaitaraṇī" sub="the river souls must cross" range={160} when={['yama']} />
      <Caption at={[-55, 6, 40]} text="Narakas" sub="realms of purification" range={200} when={['yama']} />
    </group>
  )
}
