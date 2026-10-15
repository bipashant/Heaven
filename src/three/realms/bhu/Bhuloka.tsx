import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BHU_BANDS, BHU_RADIUS, MANASOTTARA_R, MERU_HEIGHT, Y } from '../../../data/layout'
import { uTime } from '../../core/time'
import { cosmos } from '../../core/cosmos'
import { mats, standard } from '../../core/materials'
import { fbm2, rng } from '../../core/noise'
import { buildTerrainGeometry, coastRadius, heightAt, nearKailash } from './terrain'
import { Billboards } from '../../parts/Billboards'
import { Forest, BagMesh, type TreePoint } from '../../parts/common'
import { FlowTube } from '../../parts/FlowTube'
import { Glow } from '../../parts/Glow'
import { Caption } from '../../parts/Labels'
import { gopuram, shikhara } from '../../parts/builders'
import { Kailash } from './Kailash'
import { KshiraSagara } from './KshiraSagara'

// ---------------------------------------------------------------------------
// Bhū-maṇḍala disc: concentric dvīpas & oceans, lit by the sun circling Meru.
// ---------------------------------------------------------------------------

const diskVert = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const diskFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSun;
  uniform vec3 uMoon;
  uniform float uEdges[16];
  uniform vec3 uCols[16];
  uniform float uKinds[16];
  varying vec3 vW;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return s;
  }

  void main() {
    vec2 xz = vW.xz;
    float r = length(xz);
    float rr = r + (fbm(xz * 0.035) - 0.5) * 6.0;
    int idx = 15;
    for (int i = 0; i < 16; i++) { if (rr < uEdges[i]) { idx = i; break; } }
    vec3 col = uCols[idx];
    float kind = uKinds[idx];
    float lo = idx > 0 ? uEdges[idx - 1] : 0.0;
    float hi = uEdges[idx];
    float edgeD = min(rr - lo, hi - rr);
    vec3 N = vec3(0.0, 1.0, 0.0);
    float spec = 0.0;
    if (kind < 0.5) {
      vec2 q = xz * 0.35;
      float t = uTime * 0.12;
      float n1 = fbm(q + vec2(t, t * 0.7));
      float n2 = fbm(q * 1.3 - vec2(t * 0.8, -t));
      N = normalize(vec3((n1 - 0.5) * 0.45, 1.0, (n2 - 0.5) * 0.45));
      col *= 0.85 + 0.3 * fbm(xz * 0.05 + t * 0.2);
      spec = 1.0;
      col = mix(col, vec3(0.95), (1.0 - smoothstep(0.0, 1.4, edgeD)) * 0.35);
    } else if (kind < 1.5) {
      float n = fbm(xz * 0.08);
      float m = fbm(xz * 0.3 + 3.0);
      col *= 0.7 + 0.6 * n;
      col = mix(col, col * 0.55, smoothstep(0.55, 0.75, m));
      col = mix(col, vec3(0.62, 0.55, 0.42), smoothstep(0.7, 0.85, fbm(xz * 0.6)) * 0.3);
      float e = 0.6;
      float h0 = fbm(xz * 0.2);
      float hx = fbm((xz + vec2(e, 0.0)) * 0.2);
      float hz = fbm((xz + vec2(0.0, e)) * 0.2);
      N = normalize(vec3((h0 - hx) * 5.0, 1.0, (h0 - hz) * 5.0));
      col = mix(col, vec3(0.78, 0.7, 0.5), (1.0 - smoothstep(0.0, 1.0, edgeD)) * 0.6);
    } else if (kind < 2.5) {
      col *= 0.85 + 0.3 * fbm(xz * 0.2);
      spec = 0.6;
    } else {
      col *= 0.6;
    }

    vec3 L = normalize(uSun - vW);
    float dSun = length(uSun.xz - xz);
    float day = exp(-dSun * dSun / (2.0 * 210.0 * 210.0));
    float dMoon = length(uMoon.xz - xz);
    float night = exp(-dMoon * dMoon / (2.0 * 200.0 * 200.0));
    float diff = max(dot(N, L), 0.0);
    vec3 sunCol = vec3(1.0, 0.94, 0.84);
    vec3 lit = sunCol * (0.3 + 1.1 * diff) * (0.12 + 1.05 * day)
             + vec3(0.32, 0.42, 0.75) * 0.32 * night
             + vec3(0.05, 0.06, 0.1);
    col *= lit;
    if (spec > 0.0) {
      vec3 V = normalize(cameraPosition - vW);
      vec3 H = normalize(L + V);
      col += pow(max(dot(N, H), 0.0), 140.0) * day * 2.0 * spec * sunCol;
      float fr = pow(1.0 - max(dot(N, V), 0.0), 5.0);
      col = mix(col, vec3(0.1, 0.12, 0.25) * (0.4 + day), fr * 0.5 * spec);
    }
    col *= 1.0 - smoothstep(277.0, 283.0, r);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const KIND = { water: 0, land: 1, gold: 2, mountain: 3 } as const

const MERU_GOLD = new THREE.MeshStandardMaterial({ color: '#f2c45a', metalness: 0.65, roughness: 0.4, emissive: '#6a4a10', emissiveIntensity: 0.7 })

function BhuDisk() {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime,
        uSun: { value: cosmos.sun },
        uMoon: { value: cosmos.moon },
        uEdges: { value: BHU_BANDS.map((b) => b.outer) },
        uCols: { value: BHU_BANDS.map((b) => new THREE.Color(b.color)) },
        uKinds: { value: BHU_BANDS.map((b) => KIND[b.kind]) },
      },
      vertexShader: diskVert,
      fragmentShader: diskFrag,
    })
  }, [])
  return (
    <mesh rotation-x={-Math.PI / 2} material={mat}>
      <circleGeometry args={[BHU_RADIUS + 4, 256]} />
    </mesh>
  )
}

/** The underside & rim of the Earth-disc (Atala’s sky). */
function Slab() {
  return (
    <group>
      <mesh position={[0, -5, 0]} material={mats.darkStone()}>
        <cylinderGeometry args={[BHU_RADIUS + 4, BHU_RADIUS - 6, 10, 128, 1, true]} />
      </mesh>
      <mesh position={[0, -10, 0]} rotation-x={Math.PI / 2} material={standard('#1a1517', 0.9, 0.1, '#140a14', 1)}>
        <circleGeometry args={[BHU_RADIUS - 6, 128]} />
      </mesh>
      <Billboards
        seed={21}
        items={(r) =>
          Array.from({ length: 260 }, () => {
            const a = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * (BHU_RADIUS - 12)
            return {
              p: [Math.cos(a) * d, -10.6, Math.sin(a) * d],
              size: r.range(1.5, 4),
              color: r.pick(['#7ff0ff', '#ff8adf', '#ffd36e', '#9dff9a']),
              alpha: 0.9,
            }
          })
        }
        twinkle={0.6}
        intensity={2.5}
      />
    </group>
  )
}

function RingMountains() {
  const loka = useMemo(() => {
    const pts = [
      [270, -1],
      [272.5, 6],
      [274.5, 13],
      [276.5, 8],
      [279.5, 1],
      [283, -2],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return new THREE.LatheGeometry(pts, 256)
  }, [])
  const manasottara = useMemo(() => {
    const pts = [
      [MANASOTTARA_R - 3, -0.2],
      [MANASOTTARA_R - 1.2, 2.0],
      [MANASOTTARA_R, 3.4],
      [MANASOTTARA_R + 1.3, 2.0],
      [MANASOTTARA_R + 3, -0.2],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return new THREE.LatheGeometry(pts, 256)
  }, [])
  return (
    <group>
      <mesh geometry={loka} material={standard('#3e3631', 0.85, 0.05, '#1a120a', 0.6)} />
      <mesh geometry={manasottara} material={standard('#8a7650', 0.85, 0.05)} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Jambūdvīpa & Meru
// ---------------------------------------------------------------------------

function Jambudvipa() {
  const geo = useMemo(() => buildTerrainGeometry(), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }), [])

  const trees = useMemo(() => {
    const r = rng(42)
    const round: TreePoint[] = []
    const conifer: TreePoint[] = []
    for (let i = 0; i < 9000; i++) {
      const x = r.range(-38, 38)
      const z = r.range(-38, 38)
      const rad = Math.hypot(x, z)
      if (rad < 10 || rad > coastRadius(x, z) - 1.5 || nearKailash(x, z, 3.6)) continue
      const h = heightAt(x, z)
      if (h < 0.12 || h > 1.9) continue
      const slope = Math.abs(heightAt(x + 0.3, z) - h) + Math.abs(heightAt(x, z + 0.3) - h)
      if (slope > 0.22) continue
      const dens = fbm2(x * 0.12 + 7, z * 0.12, 3)
      if (dens < 0.02 + r.next() * 0.12) continue
      const s = r.range(0.16, 0.28)
      const shade = 0.75 + r.next() * 0.4
      const c = new THREE.Color(h > 1.0 ? '#2e4a2a' : '#3b6a2a').multiplyScalar(shade)
      ;(h > 1.0 ? conifer : round).push({ p: [x, h - 0.02, z], s, c })
    }
    return { round, conifer }
  }, [])

  const clouds = useMemo(() => {
    const r = rng(77)
    const list = []
    for (let i = 0; i < 70; i++) {
      const a = r.next() * Math.PI * 2
      const d = r.range(10, 44)
      const x = Math.cos(a) * d
      const z = Math.sin(a) * d
      if (Math.hypot(x + 6, z - 27) < 9) continue
      list.push({ p: [x, r.range(4.2, 6.5), z] as [number, number, number], size: r.range(3.5, 7.5), color: '#ffffff', alpha: r.range(0.35, 0.7) })
    }
    return list
  }, [])

  return (
    <group>
      <mesh geometry={geo} material={mat} />
      <Forest points={trees.round} kind="round" leaf="#3b6a2a" />
      <Forest points={trees.conifer} kind="conifer" leaf="#2e4a2a" />
      <Billboards items={clouds} texture="cloud" additive={false} drift={1.2} opacity={0.85} />
      <Meru />
      <Caption at={[0, 1.8, 33]} text="Bhārata-varṣa" sub="the land of karma" range={140} when={['bhu']} />
      <Caption at={[0, 3.5, -5]} text="Ilāvṛta" sub="plain around Meru" range={120} when={['bhu']} />
      <Caption at={[22, 1.6, -1]} text="Sītā" sub="Gaṅgā flowing east" range={110} when={['bhu']} />
      <Caption at={[4.4, 1.2, 14]} text="Alakanandā" sub="Gaṅgā flowing south" range={110} when={['bhu']} />
    </group>
  )
}

function Meru() {
  const meruGeo = useMemo(() => {
    const pts = [
      [0.001, -0.5],
      [3.0, -0.5],
      [3.05, 1.2],
      [3.5, 5],
      [4.4, 10.5],
      [5.6, 16.5],
      [6.6, 20.6],
      [6.9, 21.5],
      [6.4, 22.0],
      [0.001, 22.2],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    const g = new THREE.LatheGeometry(pts, 64)
    // faceted golden strata
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const a = Math.atan2(z, x)
      const k = 1 + 0.012 * Math.sin(a * 8) + 0.03 * Math.sin(y * 2.3) + 0.04 * fbm2(a * 3, y * 0.4, 3)
      pos.setX(i, x * k)
      pos.setZ(i, z * k)
    }
    g.computeVertexNormals()
    return g
  }, [])

  const buttressGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(2.4, 6, 24, 8)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const k = 1 + 0.18 * fbm2(x * 0.9 + y, z * 0.9, 3)
      pos.setXYZ(i, x * k, y, z * k)
    }
    g.computeVertexNormals()
    g.translate(0, 3, 0)
    return g
  }, [])

  const buttresses: [number, number, string][] = [
    [6.8, 0, 'Mandara'],
    [0, 6.8, 'Merumandara'],
    [-6.8, 0, 'Supārśva'],
    [0, -6.8, 'Kumuda'],
  ]
  const top = MERU_HEIGHT

  return (
    <group>
      <mesh geometry={meruGeo} material={MERU_GOLD} />
      {buttresses.map(([x, z, name]) => (
        <group key={name} position={[x, 0.3, z]}>
          <mesh geometry={buttressGeo} material={standard('#6f6a4e', 0.9)} />
          <Forest points={[{ p: [0, 5.6, 0], s: 1.1, c: '#3f7a2e' }]} />
        </group>
      ))}
      {/* Brahmapurī on the summit, ringed by the eight cities of the lokapālas */}
      <BagMesh
        materials={{ stone: mats.paleGold(), gold: mats.gold() }}
        build={(bag) => {
          shikhara(bag, [0, top, 0], 1.0, 3.2, 'stone', 'gold')
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2
            gopuram(bag, [Math.cos(a) * 4.6, top - 0.1, Math.sin(a) * 4.6], 0.9, 0.6, 1.3, 3, 'stone', 'gold', -a)
          }
        }}
      />
      <Glow position={[0, top + 2, 0]} size={26} color="#ffcf6a" opacity={0.55} pulse={0.05} />
      {/* The Gaṅgā falls on Meru and divides into four */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2
        const c = Math.cos(a)
        const s = Math.sin(a)
        return (
          <FlowTube
            key={i}
            radius={0.28}
            points={[
              [c * 3, top + 0.2, s * 3],
              [c * 6.9, top - 0.2, s * 6.9],
              [c * 7.3, top - 4, s * 7.3],
              [c * 7.4, 6, s * 7.4],
              [c * 7.5, 0.5, s * 7.5],
            ]}
            speed={1.6}
            opacity={0.75}
          />
        )
      })}
      <Caption at={[0, top + 6, 0]} text="Mount Meru" sub="the golden axis of the world" range={180} when={['bhu', 'bhuvar']} />
    </group>
  )
}

// ---------------------------------------------------------------------------

function OceanCaptions() {
  const items = useMemo(() => {
    const out: { at: [number, number, number]; text: string; sub: string }[] = []
    let inner = 0
    BHU_BANDS.forEach((b, i) => {
      if (i === 0) {
        inner = b.outer
        return
      }
      const mid = (inner + b.outer) / 2
      inner = b.outer
      if (b.kind === 'mountain') return
      const a = Math.PI * 0.5 + (i - 7.5) * 0.21
      const [main, sub] = b.name.split(' — ')
      out.push({ at: [Math.cos(a) * mid, 3, Math.sin(a) * mid], text: main, sub: sub ?? b.kind })
    })
    return out
  }, [])
  return (
    <>
      {items.map((it) => (
        <Caption key={it.text} at={it.at} text={it.text} sub={it.sub} range={620} when={['bhu']} />
      ))}
    </>
  )
}

/** The directional sunlight follows the sun as it circles Meru. */
function SunLight() {
  const light = useMemo(() => {
    const l = new THREE.DirectionalLight('#fff1dc', 2.2)
    l.target.position.set(0, 0, 0)
    return l
  }, [])
  const moon = useMemo(() => {
    const l = new THREE.DirectionalLight('#9fb4ff', 0.45)
    l.target.position.set(0, 0, 0)
    return l
  }, [])
  useFrame(() => {
    light.position.copy(cosmos.sun)
    moon.position.copy(cosmos.moon)
  })
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
      <primitive object={moon} />
      <primitive object={moon.target} />
    </>
  )
}

export function Bhuloka() {
  return (
    <group position={[0, Y.bhu, 0]}>
      <SunLight />
      <BhuDisk />
      <Slab />
      <RingMountains />
      <Jambudvipa />
      <OceanCaptions />
      <Kailash />
      <KshiraSagara />
      <Caption at={[0, 18, -279]} text="Lokāloka" sub="the boundary of light and darkness" range={900} when={['bhu']} />
    </group>
  )
}
