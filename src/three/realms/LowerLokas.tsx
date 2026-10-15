import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { LOWER_DISC_RADIUS as R, LOWER_DISC_THICKNESS as T, Y } from '../../data/layout'
import { uTime } from '../core/time'
import { glowMaterial, mats, standard } from '../core/materials'
import { rng } from '../core/noise'
import { Figure, PALETTES } from '../parts/Figure'
import { BagMesh, Forest, Serpent, Spin, Float, type TreePoint } from '../parts/common'
import { gopuram, palace, pavilion, ringWall, shikhara } from '../parts/builders'
import { Billboards } from '../parts/Billboards'
import { FlowTube } from '../parts/FlowTube'
import { Glow } from '../parts/Glow'
import { Caption } from '../parts/Labels'
import type { V3 } from '../core/GeoBag'

// ---------------------------------------------------------------------------
// Subterranean disc: no sun reaches here; jewels and glowing veins light it.
// ---------------------------------------------------------------------------

const groundFrag = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uGem;
  uniform float uTime;
  varying vec3 vL;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 11.3; a *= 0.5; } return s; }
  void main() {
    vec2 p = vL.xy;
    float n = fbm(p * 0.04);
    float m = fbm(p * 0.25 + 5.0);
    vec3 col = mix(uA, uB, smoothstep(0.3, 0.7, n)) * (0.75 + 0.5 * m);
    float v = abs(fbm(p * 0.07 + 9.0) - 0.5);
    float vein = 1.0 - smoothstep(0.0, 0.025, v);
    col += uGem * vein * (0.55 + 0.45 * sin(uTime * 1.3 + p.x * 0.05 + p.y * 0.03)) * 1.4;
    vec2 cell = floor(p * 0.9);
    float h = hash(cell);
    float sp = step(0.975, h) * (0.5 + 0.5 * sin(uTime * 2.5 + h * 40.0));
    vec2 f = fract(p * 0.9) - 0.5;
    col += uGem * sp * smoothstep(0.4, 0.0, length(f)) * 3.0;
    float r = length(p) / ${R.toFixed(1)};
    col *= 1.0 - smoothstep(0.92, 1.0, r) * 0.6;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function LowerDisc({ a, b, gem, seed }: { a: string; b: string; gem: string; seed: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uA: { value: new THREE.Color(a) },
          uB: { value: new THREE.Color(b) },
          uGem: { value: new THREE.Color(gem) },
          uTime,
        },
        vertexShader: /* glsl */ `varying vec3 vL; void main(){ vL = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: groundFrag,
      }),
    [a, b, gem],
  )
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={mat}>
        <circleGeometry args={[R, 160]} />
      </mesh>
      <mesh position={[0, -T / 2, 0]} material={mats.darkStone()}>
        <cylinderGeometry args={[R, R - 6, T, 128, 1, true]} />
      </mesh>
      <mesh position={[0, -T, 0]} rotation-x={Math.PI / 2} material={standard('#151214', 0.9)}>
        <circleGeometry args={[R - 6, 96]} />
      </mesh>
      {/* jagged rim and the gem-studded ceiling seen from the world below */}
      <BagMesh
        materials={{ rock: standard('#2a2427', 0.9, 0.05) }}
        build={(bag) => {
          const r = rng(seed)
          for (let i = 0; i < 70; i++) {
            const ang = (i / 70) * Math.PI * 2 + r.next() * 0.05
            const d = R - r.range(2, 8)
            const h = r.range(3, 11)
            bag.cone('rock', [Math.cos(ang) * d, h / 2 - 0.5, Math.sin(ang) * d], r.range(2, 4.5), h, 6)
          }
        }}
      />
      <Billboards
        seed={seed + 3}
        items={(r) =>
          Array.from({ length: 160 }, () => {
            const ang = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * (R - 10)
            return { p: [Math.cos(ang) * d, -T - 0.6, Math.sin(ang) * d], size: r.range(1.2, 3.2), color: gem, alpha: 0.85 }
          })
        }
        twinkle={0.6}
        intensity={2.2}
      />
    </group>
  )
}

function Loka({ y, children, a, b, gem, seed }: { y: number; children?: ReactNode; a: string; b: string; gem: string; seed: number }) {
  return (
    <group position={[0, y, 0]}>
      <LowerDisc a={a} b={b} gem={gem} seed={seed} />
      <Billboards
        seed={seed + 7}
        items={(r) =>
          Array.from({ length: 140 }, () => {
            const ang = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * (R - 20)
            return { p: [Math.cos(ang) * d, r.range(1, 30), Math.sin(ang) * d], size: r.range(0.4, 1.2), color: gem, alpha: 0.8 }
          })
        }
        drift={2}
        twinkle={0.7}
        intensity={1.6}
      />
      {children}
    </group>
  )
}

// ---------------------------------------------------------------------------

function Atala() {
  return (
    <Loka y={Y.atala} a="#1c1028" b="#3a1f4f" gem="#c58bff" seed={101}>
      <BagMesh materials={{ stone: standard('#2a2036', 0.6, 0.3), gold: mats.gold() }} build={(bag) => palace(bag, [0, 0, -14], 22, 9, 7)} />
      {/* ninety-six illusions: shimmering mirages that never stay still */}
      <Spin speed={0.06}>
        {Array.from({ length: 24 }, (_, i) => {
          const ang = (i / 24) * Math.PI * 2
          const d = 20 + (i % 4) * 14
          return (
            <Float key={i} amp={2} speed={0.4 + (i % 3) * 0.1} position={[Math.cos(ang) * d, 6 + (i % 5) * 3, Math.sin(ang) * d]}>
              <mesh rotation={[i, i * 0.7, 0]} material={i % 2 ? glowMaterial('#c58bff', 1.4, { transparent: true, opacity: 0.35 }) : mats.silver()}>
                {i % 3 === 0 ? <torusKnotGeometry args={[1.6, 0.35, 64, 8]} /> : i % 3 === 1 ? <octahedronGeometry args={[2]} /> : <icosahedronGeometry args={[1.8, 0]} />}
              </mesh>
            </Float>
          )
        })}
      </Spin>
      <Caption at={[0, 13, -14]} text="Palace of Bala" sub="master of 96 illusions" range={140} when={['atala']} />
    </Loka>
  )
}

function Vitala() {
  const river = useMemo<V3[]>(() => {
    const pts: V3[] = []
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2
      const d = 62 + 10 * Math.sin(ang * 5)
      pts.push([Math.cos(ang) * d, 0.4, Math.sin(ang) * d])
    }
    return pts
  }, [])
  return (
    <Loka y={Y.vitala} a="#2a1a08" b="#4a3210" gem="#ffc94a" seed={202}>
      {/* Hāṭakeśvara: Śiva as the Lord of Gold */}
      <BagMesh
        materials={{ stone: standard('#141216', 0.15, 0.6, '#0a0a12', 0.5), gold: mats.gold() }}
        build={(bag) => {
          bag.cyl('gold', [0, 0.8, 0], 9, 9.6, 1.6, 48)
          bag.cyl('gold', [0, 2.2, 0], 7.4, 8, 1.2, 48)
          bag.box('gold', [0, 2.0, 9], [2.4, 0.9, 6])
          bag.cyl('stone', [0, 6.5, 0], 3.4, 3.6, 7.5, 40)
          bag.sphere('stone', [0, 10.2, 0], 3.4, [1, 0.8, 1], 32)
          bag.torus('gold', [0, 7, 0], 3.55, 0.25, [Math.PI / 2, 0, 0], Math.PI * 2, 48)
          for (let i = 0; i < 3; i++) bag.box('gold', [0, 8.4 + i * 0.5, 3.4], [3.6, 0.18, 0.15])
        }}
      />
      <Figure spec={{ pose: 'seated', head: 'jata', moon: true, thirdEye: true, mudra: 'abhaya' }} palette={{ ...PALETTES.shiva, rim: '#ffd36e', aura: '#ffd36e' }} position={[-12, 0, 6]} rotation={[0, 0.5, 0]} scale={3} aura={0.4} />
      <Figure spec={{ pose: 'seated', head: 'crownSmall', female: true, mudra: 'lotuses', items: { R: 'padma' } }} palette={PALETTES.parvati} position={[-7.5, 0, 9.5]} rotation={[0, 0.3, 0]} scale={2.5} aura={0.35} />
      <FlowTube points={river} closed radius={1.6} color="#ffd36e" color2="#ff9a1a" speed={0.6} intensity={2} segments={240} streakScale={0.5} />
      <Glow position={[0, 10, 0]} size={40} color="#ffcf6a" opacity={0.45} pulse={0.05} />
      <Caption at={[0, 17, 0]} text="Hāṭakeśvara" sub="Śiva, Lord of Gold" range={160} when={['vitala']} />
      <Caption at={[62, 4, 0]} text="Hāṭakī" sub="the river of gold" range={160} when={['vitala']} />
    </Loka>
  )
}

function Sutala() {
  const garden = useMemo(() => {
    const r = rng(303)
    const pts: TreePoint[] = []
    for (let i = 0; i < 260; i++) {
      const ang = r.next() * Math.PI * 2
      const d = r.range(36, 150)
      pts.push({ p: [Math.cos(ang) * d, 0, Math.sin(ang) * d], s: r.range(1.6, 2.8), c: r.pick(['#2fa58a', '#3ad6b0', '#1f7a6a', '#ffd36e']) })
    }
    return pts
  }, [])
  return (
    <Loka y={Y.sutala} a="#0c201c" b="#123a30" gem="#7ee0c3" seed={303}>
      <BagMesh
        materials={{ stone: mats.marble(), gold: mats.gold(), jewel: mats.jade() }}
        build={(bag) => {
          ringWall(bag, [0, 0, 0], 30, 4, 1.4, 10, 'stone', 'gold')
          gopuram(bag, [0, 0, 30], 7, 4, 7.5, 3, 'stone', 'gold')
          palace(bag, [0, 0, -16], 26, 10, 8, 'stone', 'gold')
          shikhara(bag, [-16, 0, -16], 3, 15, 'jewel', 'gold')
          shikhara(bag, [16, 0, -16], 3, 15, 'jewel', 'gold')
          bag.cyl('gold', [0, 0.6, -4], 4, 4.4, 1.2, 32)
        }}
      />
      <Forest points={garden} kind="round" leaf="#2fa58a" emissive="#0c4a3a" emissiveIntensity={0.6} />
      {/* Bali enthroned; Vāmana (Viṣṇu) keeps his gate */}
      <Figure spec={{ pose: 'seated', head: 'crown', mudra: 'abhaya', prabhavali: true }} palette={PALETTES.bali} position={[0, 1.2, -4]} scale={4.2} aura={0.35} />
      <group position={[3.5, 0, 35]}>
        <Figure spec={{ pose: 'standing', head: 'topknot', child: true, mudra: 'abhaya', items: { L: 'gada' } }} palette={PALETTES.vamana} scale={2.6} aura={0.5} />
        <BagMesh
          materials={{ gold: mats.gold(), wood: standard('#6b4426', 0.6) }}
          build={(bag) => {
            bag.between('wood', [0.75, 0.6, 0.3], [0.75, 5.4, 0.3], 0.05)
            bag.cone('gold', [0.75, 5.6, 0.3], 1.4, 0.7, 16)
          }}
        />
      </group>
      <Caption at={[0, 8, -4]} text="Bali Mahārāja" sub="the generous king" range={140} when={['sutala']} />
      <Caption at={[3.5, 7.5, 35]} text="Vāmana at the gate" sub="Viṣṇu as doorkeeper" range={140} when={['sutala']} />
    </Loka>
  )
}

function Talatala() {
  const cities: { pos: V3; key: string; name: string }[] = [
    { pos: [0, 0, -36], key: 'gold', name: 'City of gold' },
    { pos: [31, 0, 18], key: 'silver', name: 'City of silver' },
    { pos: [-31, 0, 18], key: 'iron', name: 'City of iron' },
  ]
  return (
    <Loka y={Y.talatala} a="#14161c" b="#2a2e38" gem="#c0c6d6" seed={404}>
      <BagMesh
        materials={{ gold: mats.gold(), silver: mats.silver(), iron: mats.iron(), stone: standard('#3a3e48', 0.6, 0.4) }}
        build={(bag) => {
          for (const c of cities) {
            ringWall(bag, c.pos, 13, 3, 1, 8, c.key, c.key)
            shikhara(bag, c.pos, 3.2, 14, c.key, c.key)
            for (let i = 0; i < 6; i++) {
              const ang = (i / 6) * Math.PI * 2
              palace(bag, [c.pos[0] + Math.cos(ang) * 8, 0, c.pos[2] + Math.sin(ang) * 8], 3, 3, 2.6, c.key, c.key)
            }
          }
          pavilion(bag, [0, 0, 6], 5, 7, 10, 'stone', 'iron')
        }}
      />
      {cities.map((c) => (
        <Float key={c.key} amp={0.6} speed={0.3} position={[c.pos[0], 0, c.pos[2]]}>
          <Glow position={[0, 6, 0]} size={36} color={c.key === 'gold' ? '#ffcf6a' : c.key === 'silver' ? '#dfe8ff' : '#8a9aaa'} opacity={0.3} />
        </Float>
      ))}
      <Glow position={[0, 3, 6]} size={14} color="#ff8a2a" opacity={0.7} pulse={0.1} />
      <Caption at={[0, 18, -36]} text="Tripura" sub="the three cities built by Maya" range={180} when={['talatala']} />
      <Caption at={[0, 11, 6]} text="Maya’s forge" range={120} when={['talatala']} />
    </Loka>
  )
}

function Mahatala() {
  const spots: { p: V3; r: number; c: string }[] = [
    { p: [0, 0, -10], r: 1, c: '#2f8a5a' },
    { p: [-40, 0, 20], r: 0.8, c: '#3a6a8a' },
    { p: [42, 0, 16], r: 0.85, c: '#5a8a2a' },
    { p: [-6, 0, 48], r: 0.7, c: '#2a7a7a' },
  ]
  return (
    <Loka y={Y.mahatala} a="#071a10" b="#0f2a1a" gem="#6fe39a" seed={505}>
      {spots.map((s, i) => (
        <Serpent
          key={i}
          position={s.p}
          scale={s.r}
          spec={{
            bodyR: 1.6,
            coil: { rx: 9, rz: 9, turns: 2.4, rise: 1.6, shrink: 0.45, y0: 1.2, start: i },
            neck: [
              [0, 6, -4],
              [0, 11, -3],
              [0, 15, 0],
            ],
            hoods: 5,
            hoodSize: 4,
            facing: [0, -0.3, 1],
          }}
          color={s.c}
          belly="#d8e8a0"
          gem="#aaffcc"
          emissive="#06200f"
        />
      ))}
      <Caption at={[0, 26, -10]} text="Takṣaka · Kāliya · Kuhaka · Suṣeṇa" sub="sons of Kadru" range={170} when={['mahatala']} />
    </Loka>
  )
}

function Rasatala() {
  return (
    <Loka y={Y.rasatala} a="#1a0606" b="#3a0c0a" gem="#ff4a2a" seed={606}>
      <BagMesh
        materials={{ stone: mats.basalt(), gold: standard('#8a1a10', 0.5, 0.4, '#ff3a1a', 0.8) }}
        build={(bag) => {
          ringWall(bag, [0, 0, 0], 44, 7, 2.2, 12, 'stone', 'gold')
          for (let i = 0; i < 4; i++) {
            const ang = (i / 4) * Math.PI * 2
            gopuram(bag, [Math.cos(ang) * 44, 0, Math.sin(ang) * 44], 9, 5, 18, 6, 'stone', 'gold', -ang + Math.PI / 2)
          }
          for (let i = 0; i < 7; i++) {
            const ang = (i / 7) * Math.PI * 2
            shikhara(bag, [Math.cos(ang) * 12, 0, Math.sin(ang) * 12], 3, 18 + (i % 3) * 4, 'stone', 'gold')
          }
          shikhara(bag, [0, 0, 0], 6, 30, 'stone', 'gold')
        }}
      />
      <Billboards
        seed={607}
        items={(r) =>
          Array.from({ length: 220 }, () => {
            const ang = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * 120
            return { p: [Math.cos(ang) * d, 0.5, Math.sin(ang) * d], size: r.range(0.3, 0.8), color: r.pick(['#ff6a2a', '#ffb347', '#ff3a1a']), alpha: 1 }
          })
        }
        rise={2.5}
        riseHeight={30}
        drift={1}
        intensity={2.2}
      />
      <Caption at={[0, 36, 0]} text="Fortress of the Dānavas" sub="Paṇis · Nivātakavacas · Kāleyas" range={200} when={['rasatala']} />
    </Loka>
  )
}

function Patala() {
  const garden = useMemo(() => {
    const r = rng(707)
    const pts: TreePoint[] = []
    for (let i = 0; i < 320; i++) {
      const ang = r.next() * Math.PI * 2
      const d = r.range(32, 160)
      pts.push({ p: [Math.cos(ang) * d, 0, Math.sin(ang) * d], s: r.range(1.6, 3), c: r.pick(['#3ee0d0', '#ff7ad8', '#7ab8ff', '#9dff9a']) })
    }
    return pts
  }, [])
  return (
    <Loka y={Y.patala} a="#04161c" b="#08303a" gem="#3ee0d0" seed={707}>
      <BagMesh
        materials={{ stone: standard('#1a3a44', 0.5, 0.3), gold: mats.gold(), jewel: mats.jade() }}
        build={(bag) => {
          const r = rng(708)
          for (let i = 0; i < 26; i++) {
            const ang = (i / 26) * Math.PI * 2
            const d = 44 + (i % 3) * 14
            if (r.next() < 0.5) palace(bag, [Math.cos(ang) * d, 0, Math.sin(ang) * d], 7, 6, 4.5, 'stone', 'jewel')
            else shikhara(bag, [Math.cos(ang) * d, 0, Math.sin(ang) * d], 2.4, r.range(9, 14), 'jewel', 'gold')
          }
          bag.cyl('stone', [0, 0.6, 0], 26, 27, 1.2, 64)
          bag.torus('gold', [0, 1.2, 0], 26, 0.4, [Math.PI / 2, 0, 0], Math.PI * 2, 96)
        }}
      />
      <Forest points={garden} kind="round" leaf="#3ee0d0" emissive="#0a6a6a" emissiveIntensity={0.9} />
      {/* Vāsuki, king of the nāgas */}
      <Serpent
        position={[0, 1.2, 0]}
        spec={{
          bodyR: 2.2,
          coil: { rx: 15, rz: 15, turns: 2.8, rise: 2.2, shrink: 0.5, y0: 1.5 },
          neck: [
            [0, 8, -6],
            [0, 15, -5],
            [0, 21, -1],
          ],
          hoods: 7,
          hoodSize: 5.5,
          facing: [0, -0.3, 1],
        }}
        color="#1a6a7a"
        belly="#cfe8c0"
        gem="#aaffff"
        emissive="#04262a"
      />
      {[[60, 30], [-55, 40], [20, -70], [-60, -45], [75, -20]].map(([x, z], i) => (
        <group key={i} position={[x, 0.15, z]}>
          <mesh rotation-x={-Math.PI / 2} material={glowMaterial('#3ee0d0', 1.6)}>
            <circleGeometry args={[5, 32]} />
          </mesh>
          <Glow position={[0, 2, 0]} size={20} color="#3ee0d0" opacity={0.4} />
        </group>
      ))}
      <pointLight position={[0, 30, 30]} color="#7ff0ff" intensity={70} distance={140} decay={1.3} />
      <Caption at={[0, 34, 0]} text="Vāsuki" sub="king of the serpents" range={200} when={['patala']} />
      <Ananta />
    </Loka>
  )
}

/** Ananta Śeṣa beneath all the worlds, his hoods rising at the north. */
function Ananta() {
  const dy = Y.ananta - Y.patala
  return (
    <group position={[0, dy, 0]}>
      <Serpent
        spec={{
          bodyR: 9,
          coil: { rx: 150, rz: 150, turns: 1.7, rise: 10, shrink: 0.25, y0: 0, start: Math.PI / 2 + 0.6 },
          neck: [
            [-40, 30, -150],
            [-10, 55, -205],
            [0, 95, -215],
          ],
          hoods: 9,
          hoodSize: 20,
          facing: [0, -0.15, 1],
          spread: 1.3,
          rows: 2,
        }}
        color="#e8e2f2"
        belly="#fff2d0"
        gem="#9ff6ff"
        emissive="#2a2440"
      />
      <Glow position={[0, 110, -210]} size={260} color="#c8d8ff" opacity={0.25} />
      <Caption at={[0, 140, -215]} text="Ananta Śeṣa" sub="the serpent of a thousand hoods" range={1400} when={['patala']} />
    </group>
  )
}

export function LowerLokas() {
  return (
    <>
      <Atala />
      <Vitala />
      <Sutala />
      <Talatala />
      <Mahatala />
      <Rasatala />
      <Patala />
    </>
  )
}

