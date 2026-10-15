import { useMemo } from 'react'
import * as THREE from 'three'
import { Y } from '../../data/layout'
import { uTime } from '../core/time'
import { divineMaterial, mats, standard } from '../core/materials'
import { fbm2 } from '../core/noise'
import { Figure, PALETTES, type Palette } from '../parts/Figure'
import { BagMesh, Glyph, Lotus, Spin, Float } from '../parts/common'
import { swan } from '../parts/builders'
import { Billboards } from '../parts/Billboards'
import { Glow, Rays } from '../parts/Glow'
import { Caption } from '../parts/Labels'
import type { V3 } from '../core/GeoBag'

// ---------------------------------------------------------------------------
// A plane of light with a slowly turning maṇḍala: the subtle upper worlds.
// ---------------------------------------------------------------------------

const discFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uR;
  varying vec3 vP;
  void main() {
    float r = length(vP.xy) / uR;
    float a = atan(vP.y, vP.x);
    float rings = 0.5 + 0.5 * sin(r * 46.0 - uTime * 0.6);
    float petals = 0.5 + 0.5 * cos(a * 24.0 + uTime * 0.05);
    float petals2 = 0.5 + 0.5 * cos(a * 8.0 - uTime * 0.08 + r * 6.0);
    float m = rings * 0.35 + petals * smoothstep(0.55, 0.6, r) * (1.0 - smoothstep(0.66, 0.7, r)) * 0.8
            + petals2 * smoothstep(0.25, 0.3, r) * (1.0 - smoothstep(0.42, 0.46, r)) * 0.7;
    float rim = smoothstep(0.93, 0.985, r) * (1.0 - smoothstep(0.985, 1.0, r));
    float body = (1.0 - smoothstep(0.85, 1.0, r)) * 0.12;
    float k = body + m * 0.16 * (1.0 - smoothstep(0.9, 1.0, r)) + rim * 1.4;
    gl_FragColor = vec4(uColor * k, 1.0);
    #include <colorspace_fragment>
  }
`

function LightDisc({ radius, color }: { radius: number; color: string }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color).multiplyScalar(1.6) }, uTime, uR: { value: radius } },
        vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: discFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [radius, color],
  )
  return (
    <mesh rotation-x={-Math.PI / 2} material={mat}>
      <circleGeometry args={[radius, 128]} />
    </mesh>
  )
}

/** Floating rock islet with a grassy or crystalline top. */
function islandGeometry(seed: number, radius: number, top: string, rock: string) {
  const g = new THREE.SphereGeometry(radius, 36, 18)
  const pos = g.attributes.position as THREE.BufferAttribute
  const cols = new Float32Array(pos.count * 3)
  const ct = new THREE.Color(top)
  const cr = new THREE.Color(rock)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)
    const n = fbm2(x * 0.6 + seed, z * 0.6 - seed, 4)
    if (y > 0) {
      y = radius * 0.08 * n
      c.copy(ct).multiplyScalar(0.85 + n * 0.5)
    } else {
      const k = 1 + 0.25 * n
      x *= k
      z *= k
      y = y * 1.6 * (1 + 0.3 * fbm2(x + seed, z, 3))
      c.copy(cr).multiplyScalar(0.8 + n * 0.4)
    }
    pos.setXYZ(i, x, y, z)
    cols.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3))
  g.computeVertexNormals()
  return g
}

function Islet({ position, radius, seed, top = '#7ea86a', rock = '#6a5e6e', emissive = '#000000' }: {
  position: V3
  radius: number
  seed: number
  top?: string
  rock?: string
  emissive?: string
}) {
  const geo = useMemo(() => islandGeometry(seed, radius, top, rock), [seed, radius, top, rock])
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, emissive, emissiveIntensity: 0.35 }),
    [emissive],
  )
  return <mesh geometry={geo} material={mat} position={position} />
}

function YajnaFire({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <BagMesh
        materials={{ stone: standard('#b07a4a', 0.8), gold: mats.gold() }}
        build={(bag) => {
          bag.box('stone', [0, 0.1, 0], [1.4, 0.2, 1.4])
          bag.box('stone', [0, 0.28, 0], [1.0, 0.16, 1.0])
          bag.box('gold', [0, 0.37, 0], [0.7, 0.04, 0.7])
        }}
      />
      <Glow position={[0, 0.9, 0]} size={3.2} color="#ff8a2a" opacity={0.9} pulse={0.12} />
      <Billboards
        seed={position[0] * 13 + 1}
        items={(r) =>
          Array.from({ length: 50 }, () => ({ p: [r.range(-0.25, 0.25), 0.4, r.range(-0.25, 0.25)], size: r.range(0.25, 0.55), color: r.pick(['#ffb347', '#ff6a1a', '#ffd27a']), alpha: 1 }))
        }
        rise={0.9}
        riseHeight={1.6}
        drift={0.15}
        intensity={2.2}
      />
    </group>
  )
}

function SeatedRing({ count, radius, palette, scale, spec, y = 0, outward = false }: {
  outward?: boolean
  count: number
  radius: number
  palette: Palette
  scale: number
  spec: Parameters<typeof Figure>[0]['spec']
  y?: number
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2
        return (
          <Figure
            key={i}
            spec={spec}
            palette={palette}
            position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
            rotation={[0, outward ? Math.PI / 2 - a : -a - Math.PI / 2, 0]}
            scale={scale}
            aura={0.25}
          />
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------

export function Maharloka() {
  return (
    <group position={[0, Y.mahar, 0]}>
      <LightDisc radius={72} color="#9b7bff" />
      <Islet position={[0, -0.2, 0]} radius={14} seed={3} top="#8a9a7a" rock="#5a4e6a" emissive="#1a1030" />
      <YajnaFire position={[0, 0.6, 0]} scale={2.2} />
      <SeatedRing count={7} radius={7.6} palette={PALETTES.sage} scale={2.6} y={0.6} spec={{ pose: 'seated', head: 'topknot', beard: true, mudra: 'dhyana', halo: true }} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.4
        return (
          <Float key={i} amp={1.2} speed={0.3} position={[Math.cos(a) * 40, -2, Math.sin(a) * 40]}>
            <Islet position={[0, 0, 0]} radius={5} seed={10 + i} top="#9aa88a" rock="#4e4560" emissive="#1a1030" />
            <Figure spec={{ pose: 'seated', head: 'topknot', beard: true, mudra: 'dhyana' }} palette={PALETTES.sage} position={[0, 0.4, 0]} scale={2.4} aura={0.3} />
          </Float>
        )
      })}
      <Glow position={[0, 6, 0]} size={60} color="#b49bff" opacity={0.25} />
      <Caption at={[0, 7, 0]} text="Bhṛgu and the great ṛṣis" range={160} when={['mahar']} />
    </group>
  )
}

export function Janaloka() {
  const kumaraSpec = { pose: 'seated' as const, head: 'topknot' as const, child: true, mudra: 'namaste' as const, halo: true }
  return (
    <group position={[0, Y.jana, 0]}>
      <LightDisc radius={70} color="#7fd0ff" />
      <Lotus spec={{ radius: 13, layers: 2, petals: 22, openness: 0.12, baseElevation: 0.04 }} base="#eaf4ff" tip="#6fb0f0" glow={0.1} />
      <BagMesh materials={{ white: mats.paleGold(), gold: mats.gold() }} build={(bag) => {
        bag.cyl('white', [0, 2.0, 0], 4.6, 5, 2.0, 40)
        bag.torus('gold', [0, 3.0, 0], 4.6, 0.12, [Math.PI / 2, 0, 0], Math.PI * 2, 64)
      }} />
      <SeatedRing count={4} radius={3.0} palette={PALETTES.kumara} scale={2.6} y={3.0} spec={kumaraSpec} outward />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <Float key={i} amp={1} speed={0.25} position={[Math.cos(a) * 36, -1, Math.sin(a) * 36]}>
            <Islet position={[0, 0, 0]} radius={4.5} seed={30 + i} top="#dfeff8" rock="#5a6a80" emissive="#0a2030" />
            <Figure spec={{ pose: 'seated', head: 'topknot', beard: i % 2 === 0, mudra: 'dhyana' }} palette={PALETTES.kumara} position={[0, 0.35, 0]} scale={2.2} aura={0.3} />
          </Float>
        )
      })}
      <Glow position={[0, 6, 0]} size={30} color="#bfe6ff" opacity={0.25} pulse={0.03} depthTest={false} />
      <Caption at={[0, 6.5, 0]} text="The four Kumāras" sub="Sanaka · Sanandana · Sanātana · Sanat-kumāra" range={140} when={['jana']} />
    </group>
  )
}

export function Tapoloka() {
  return (
    <group position={[0, Y.tapa, 0]}>
      <LightDisc radius={74} color="#ff9a4a" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2
        const d = i === 0 ? 0 : 18 + (i % 3) * 9
        const x = i === 0 ? 0 : Math.cos(a) * d
        const z = i === 0 ? 0 : Math.sin(a) * d
        return (
          <Float key={i} amp={i === 0 ? 0 : 0.8} speed={0.3} position={[x, i === 0 ? 0 : -1 + (i % 2) * 2, z]}>
            <Islet position={[0, 0, 0]} radius={i === 0 ? 9 : 4} seed={50 + i} top="#c9a070" rock="#5a3a2a" emissive="#301005" />
            <Figure spec={{ pose: 'seated', head: 'jata', beard: true, mudra: 'dhyana', snake: false }} palette={{ ...PALETTES.sage, cloth: '#d8661a', rim: '#ffb070' }} position={[0, 0.4, 0]} scale={i === 0 ? 3.4 : 2.2} aura={0.35} />
            <Glow position={[0, i === 0 ? 2.5 : 1.5, 0]} size={i === 0 ? 14 : 7} color="#ff8a2a" opacity={0.5} pulse={0.1} />
          </Float>
        )
      })}
      <Billboards
        seed={545}
        items={(r) =>
          Array.from({ length: 220 }, () => {
            const a = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * 60
            return { p: [Math.cos(a) * d, r.range(-2, 6), Math.sin(a) * d], size: r.range(0.3, 0.8), color: r.pick(['#ffb347', '#ff7a2a', '#ffe0a0']), alpha: 1 }
          })
        }
        rise={1.2}
        riseHeight={14}
        drift={0.6}
        intensity={2}
      />
      <Caption at={[0, 6, 0]} text="Ascetics in tapas" sub="untouched by the fire of pralaya" range={140} when={['tapa']} />
    </group>
  )
}

const VEDAS = ['ऋक्', 'यजुः', 'साम', 'अथर्व']

export function Satyaloka() {
  return (
    <group position={[0, Y.satya, 0]}>
      <Billboards
        seed={640}
        texture="cloud"
        additive={false}
        items={(r) =>
          Array.from({ length: 140 }, () => {
            const a = r.next() * Math.PI * 2
            const d = r.range(14, 70)
            return { p: [Math.cos(a) * d, r.range(-10, -2), Math.sin(a) * d], size: r.range(12, 26), color: r.pick(['#ffe2a8', '#fff2d6', '#ffd18a']), alpha: r.range(0.5, 0.85) }
          })
        }
        drift={1.5}
        opacity={0.9}
      />
      <Lotus spec={{ radius: 22, layers: 3, petals: 26, openness: 0.42 }} base="#fff4e6" tip="#ff8ab0" glow={0.22} position={[0, -2, 0]} />
      <BagMesh materials={{ gold: mats.gold(), white: mats.marble() }} build={(bag) => {
        bag.cyl('gold', [0, 2.6, 0], 3.6, 4.2, 1.6, 32)
        bag.cyl('white', [0, 3.6, 0], 3.2, 3.4, 0.5, 32)
      }} />
      <Figure
        spec={{ pose: 'seated', head: 'four', arms: 4, beard: true, mudra: 'lap', items: { BR: 'mala', BL: 'book', R: 'kamandalu', L: 'sruva' }, prabhavali: true }}
        palette={PALETTES.brahma}
        position={[0, 3.85, 0]}
        scale={8}
        aura={0.4}
      />
      {/* Sarasvatī with her vīṇā */}
      <Lotus spec={{ radius: 5, layers: 3, petals: 16 }} base="#ffffff" tip="#dfe9ff" glow={0.3} position={[29, -0.5, 13]} />
      <Figure
        spec={{ pose: 'seated', head: 'crownSmall', female: true, mudra: 'veena', arms: 4, items: { BR: 'mala', BL: 'book' } }}
        palette={PALETTES.sarasvati}
        position={[29, 0.4, 13]}
        rotation={[0, -0.7, 0]}
        scale={4}
        aura={0.45}
      />
      <BagMesh
        materials={{ feather: divineMaterial('#fbfbff', '#ffffff', 1.2, 0.3), beak: standard('#f2a020', 0.4, 0.2, '#6a3a00', 0.4) }}
        build={(bag) => swan(bag)}
        position={[-28, -0.6, 14]}
        rotation={[0, 0.7, 0]}
        scale={5}
      />
      <Spin speed={0.08} position={[0, 12, 0]}>
        {VEDAS.map((v, i) => {
          const a = (i / 4) * Math.PI * 2
          return <Glyph key={v} text={v} position={[Math.cos(a) * 30, Math.sin(i) * 2, Math.sin(a) * 30]} size={5} opacity={0.7} />
        })}
      </Spin>
      <Glyph text="ॐ" position={[0, 22, -4]} size={7} opacity={0.55} />
      <Glow position={[0, 9, -3]} size={60} color="#ffd88a" opacity={0.25} pulse={0.03} depthTest={false} />
      <Rays position={[0, 10, -4]} size={56} color="#fff2c8" opacity={0.22} depthTest={false} />
      <pointLight position={[0, 16, 14]} color="#ffe6b8" intensity={40} distance={70} decay={1.4} />
      <Caption at={[29, 8, 13]} text="Sarasvatī" sub="goddess of learning" range={120} when={['satya']} />
      <Caption at={[-28, 6, 14]} text="Haṁsa" sub="Brahmā’s swan" range={100} when={['satya']} />
      <Caption at={[30, 17, 0]} text="The four Vedas" sub="from Brahmā’s four mouths" range={120} when={['satya']} />
    </group>
  )
}

export function UpperLokas() {
  return (
    <>
      <Maharloka />
      <Janaloka />
      <Tapoloka />
      <Satyaloka />
    </>
  )
}
