import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EGG, Y } from '../../data/layout'
import { uTime } from '../core/time'
import { glowMaterial } from '../core/materials'
import { Glow } from '../parts/Glow'
import { FlowTube } from '../parts/FlowTube'
import { Caption } from '../parts/Labels'
import { Billboards } from '../parts/Billboards'
import type { V3 } from '../core/GeoBag'

// The golden shell of the Brahmāṇḍa, the Virajā river above it, the
// Garbhodaka ocean below, the descending Gaṅgā, and the pole star.

const shellVert = /* glsl */ `
  varying vec3 vW;
  varying vec3 vN;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const shellFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uStrength;
  varying vec3 vW;
  varying vec3 vN;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    vec3 V = normalize(cameraPosition - vW);
    float f = 1.0 - abs(dot(normalize(vN), V));
    float rim = pow(f, 3.2);
    float bands = 0.5 + 0.5 * sin(vW.y * 0.05 + uTime * 0.12);
    float n = vnoise(vW * 0.006 + uTime * 0.01) * 0.6 + vnoise(vW * 0.02) * 0.4;
    vec3 col = mix(uColor2, uColor, rim);
    float k = rim * 1.1 + 0.012 + 0.012 * bands + 0.025 * n;
    gl_FragColor = vec4(col * k * uStrength, 1.0);
    #include <colorspace_fragment>
  }
`

function ellipsoid(radii: V3, seg = 96) {
  const g = new THREE.SphereGeometry(1, seg, Math.floor(seg / 2))
  g.scale(...radii)
  g.computeVertexNormals()
  return g
}

function Shell({ scale = 1, color, color2, strength }: { scale?: number; color: string; color2: string; strength: number }) {
  const geo = useMemo(() => ellipsoid([EGG.radii[0] * scale, EGG.radii[1] * scale, EGG.radii[2] * scale]), [scale])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uColor2: { value: new THREE.Color(color2) },
          uTime,
          uStrength: { value: strength },
        },
        vertexShader: shellVert,
        fragmentShader: shellFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [color, color2, strength],
  )
  return <mesh geometry={geo} material={mat} position={EGG.center} renderOrder={5} />
}

const virajaFrag = /* glsl */ `
  uniform float uTime;
  varying vec3 vW;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  void main() {
    float r = length(vW.xz);
    float a = atan(vW.z, vW.x);
    float flow = vnoise(vec2(a * 30.0 - uTime * 0.6, r * 0.04)) * 0.6 + vnoise(vec2(a * 90.0 - uTime * 1.4, r * 0.12)) * 0.4;
    float band = smoothstep(150.0, 230.0, r) * (1.0 - smoothstep(430.0, 520.0, r));
    float ripple = 0.6 + 0.4 * sin(r * 0.18 - uTime * 0.9 + flow * 3.0);
    vec3 col = mix(vec3(0.45, 0.75, 1.0), vec3(1.0, 0.92, 0.75), flow) * ripple;
    gl_FragColor = vec4(col * band * 0.75, 1.0);
    #include <colorspace_fragment>
  }
`

function Viraja() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime },
        vertexShader: /* glsl */ `
          varying vec3 vW;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
        `,
        fragmentShader: virajaFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  return (
    <group position={[0, Y.viraja, 0]}>
      <mesh rotation-x={-Math.PI / 2} material={mat}>
        <ringGeometry args={[140, 530, 256, 8]} />
      </mesh>
      <Caption at={[0, 12, 470]} text="Virajā" sub="the river between matter and spirit" range={2600} when={['brahmanda', 'vaikuntha']} />
    </group>
  )
}

function Garbhodaka() {
  const y = Y.garbhodaka
  const dy = y - EGG.center[1]
  const r = EGG.radii[0] * Math.sqrt(1 - (dy * dy) / (EGG.radii[1] * EGG.radii[1])) - 2
  return (
    <group position={[0, y, 0]}>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[r, 128]} />
        <meshStandardMaterial color="#0b2348" roughness={0.12} metalness={0.4} emissive="#06204a" emissiveIntensity={0.9} />
      </mesh>
      <Billboards
        seed={61}
        items={(rr) =>
          Array.from({ length: 140 }, () => {
            const a = rr.next() * Math.PI * 2
            const d = Math.sqrt(rr.next()) * r * 0.95
            return { p: [Math.cos(a) * d, 0.6, Math.sin(a) * d], size: rr.range(3, 9), color: '#5ab8ff', alpha: 0.4 }
          })
        }
        twinkle={0.7}
        intensity={1.4}
      />
      <Caption at={[0, 8, r * 0.7]} text="Garbhodaka" sub="the ocean within the egg" range={1600} when={['brahmanda', 'yama', 'patala']} />
    </group>
  )
}

function Dhruva() {
  const rishis = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (rishis.current) rishis.current.rotation.y += dt * 0.05
  })
  // Saptarṣi (the Big Dipper): Kratu, Pulaha, Pulastya, Atri, Aṅgiras, Vasiṣṭha, Marīci
  const dipper: V3[] = [
    [0, 0, 0],
    [0, -1, 0.1],
    [1.2, -1.2, 0],
    [1.3, -0.3, 0.1],
    [2.3, 0, 0],
    [3.2, 0.2, 0.1],
    [4.2, -0.4, 0],
  ]
  return (
    <group>
      <mesh position={[0, Y.dhruva, 0]} material={glowMaterial('#dff0ff', 6)}>
        <sphereGeometry args={[1.6, 16, 12]} />
      </mesh>
      <Glow position={[0, Y.dhruva, 0]} size={46} color="#cfe6ff" opacity={0.9} pulse={0.06} />
      <Caption at={[0, Y.dhruva + 10, 0]} text="Dhruva" sub="the pole star" range={700} when={['bhuvar', 'svarga', 'mahar']} />
      <group ref={rishis} position={[0, Y.saptarishi, 0]}>
        <group position={[16, 0, 0]} rotation={[0, 0.4, 0]}>
          {dipper.map((p, i) => (
            <group key={i} position={[p[0] * 6, p[1] * 6, p[2] * 6]}>
              <mesh material={glowMaterial('#fff6e0', 5)}>
                <sphereGeometry args={[0.7, 10, 8]} />
              </mesh>
              <Glow size={12} color="#fff0d0" opacity={0.75} />
            </group>
          ))}
          <Caption at={[12, 8, 0]} text="Saptarṣi" sub="the seven sages" range={500} when={['bhuvar', 'svarga', 'mahar']} />
        </group>
      </group>
    </group>
  )
}

/** The Gaṅgā enters at the crown of the egg, descends to Dhruva, then falls on Meru. */
function CelestialGanga() {
  const upper: V3[] = [
    [0, EGG.center[1] + EGG.radii[1] - 4, 0],
    [26, 790, 10],
    [48, 680, 22],
    [52, 560, 20],
    [44, 450, 14],
    [22, 360, 6],
    [0, Y.dhruva + 2, 0],
  ]
  const lower: V3[] = [
    [0, Y.dhruva - 2, 0],
    [0, Y.svarga + 30, 0],
    [0, Y.svarga - 10, 0],
    [0, 120, 0],
    [0, 23, 0],
  ]
  return (
    <group>
      <FlowTube points={upper} radius={0.8} speed={1.2} intensity={1.4} opacity={0.65} segments={200} streakScale={0.25} />
      <FlowTube points={lower} radius={0.7} speed={1.5} intensity={2.2} opacity={0.85} segments={160} streakScale={0.25} />
      <Caption at={[56, 600, 22]} text="Gaṅgā" sub="descending from Viṣṇu’s foot" range={900} when={['brahmanda', 'satya', 'tapa', 'jana', 'mahar']} />
    </group>
  )
}

export function Brahmanda() {
  return (
    <group>
      <Shell color="#ffcf73" color2="#7a4a12" strength={1} />
      <Shell scale={1.03} color="#9fd0ff" color2="#1a2a5a" strength={0.28} />
      <Viraja />
      <Garbhodaka />
      <Dhruva />
      <CelestialGanga />
      {/* the effulgence of the spiritual sky (brahmajyoti) */}
      <Glow position={[0, 1160, 0]} size={900} color="#ffe2a8" opacity={0.14} depthTest={false} />
      <Glow position={[0, EGG.center[1], 0]} size={2600} color="#ffb84a" opacity={0.03} />
    </group>
  )
}
