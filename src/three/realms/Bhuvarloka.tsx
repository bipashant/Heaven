import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SUN_ORBIT_R, Y } from '../../data/layout'
import { cosmos } from '../core/cosmos'
import { uTime } from '../core/time'
import { glowMaterial, mats, standard } from '../core/materials'
import { Glow, Rays } from '../parts/Glow'
import { Billboards } from '../parts/Billboards'
import { Caption } from '../parts/Labels'
import { BagMesh } from '../parts/common'

const sunFrag = /* glsl */ `
  uniform float uTime;
  varying vec3 vP;
  varying vec3 vN;
  varying vec3 vV;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.1; a *= 0.5; } return s; }
  void main() {
    float n = fbm(vP * 0.45 + vec3(uTime * 0.15, -uTime * 0.1, uTime * 0.05));
    float g = fbm(vP * 1.6 - uTime * 0.2);
    vec3 col = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.9, 0.55), smoothstep(0.35, 0.75, n));
    col += vec3(1.0, 0.8, 0.4) * smoothstep(0.6, 0.8, g) * 0.6;
    float limb = pow(abs(dot(normalize(vN), normalize(vV))), 0.4);
    gl_FragColor = vec4(col * (2.2 + 1.6 * limb), 1.0);
  }
`

function Sun() {
  const group = useRef<THREE.Group>(null)
  const wheel = useRef<THREE.Group>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime },
        vertexShader: /* glsl */ `
          varying vec3 vP; varying vec3 vN; varying vec3 vV;
          void main() {
            vP = position;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: sunFrag,
        toneMapped: false,
      }),
    [],
  )
  useFrame((_, dt) => {
    if (!group.current) return
    group.current.position.copy(cosmos.sun)
    // the wheel’s axle points to Meru: it rolls along the Mānasottara orbit
    group.current.rotation.y = -cosmos.sunAngle
    if (wheel.current) wheel.current.rotation.x -= dt * 0.25
  })
  return (
    <group ref={group}>
      <mesh material={mat}>
        <sphereGeometry args={[10, 64, 32]} />
      </mesh>
      <Glow size={120} color="#ffb347" opacity={0.85} pulse={0.03} />
      <Glow size={34} color="#fff0c8" opacity={0.9} />
      <Rays size={150} color="#ffcf7a" opacity={0.32} speed={0.02} />
      {/* The one-wheeled chariot: twelve spokes for the twelve months */}
      <group ref={wheel} rotation={[0, 0, 0]}>
        <BagMesh
          materials={{ gold: mats.gold() }}
          rotation={[0, Math.PI / 2, 0]}
          build={(bag) => {
            bag.torus('gold', [0, 0, 0], 17, 0.55, [0, 0, 0], Math.PI * 2, 96)
            bag.torus('gold', [0, 0, 0], 15.8, 0.25, [0, 0, 0], Math.PI * 2, 96)
            for (let i = 0; i < 12; i++) {
              const a = (i / 12) * Math.PI * 2
              bag.between('gold', [Math.cos(a) * 10.6, Math.sin(a) * 10.6, 0], [Math.cos(a) * 16.6, Math.sin(a) * 16.6, 0], 0.32, 0.22)
            }
          }}
        />
      </group>
      <Caption at={[0, 26, 0]} text="Sūrya" sub="the sun’s chariot circles Meru" range={900} when={['bhuvar']} />
    </group>
  )
}

function Moon() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => ref.current?.position.copy(cosmos.moon))
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[6, 48, 24]} />
        <meshStandardMaterial color="#d9dbe6" roughness={0.9} emissive="#8a90b0" emissiveIntensity={0.55} />
      </mesh>
      <Glow size={40} color="#cfd8ff" opacity={0.55} />
      <Caption at={[0, 12, 0]} text="Candra" sub="the moon" range={800} when={['bhuvar']} />
    </group>
  )
}

function Rahu() {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const a = cosmos.sunAngle - 0.5
    ref.current?.position.set(Math.cos(a) * (SUN_ORBIT_R - 8), Y.rahu, Math.sin(a) * (SUN_ORBIT_R - 8))
  })
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[5, 32, 16]} />
        <meshStandardMaterial color="#120a1a" roughness={0.6} emissive="#2a0a3a" emissiveIntensity={0.6} />
      </mesh>
      <Glow size={22} color="#7a3aff" opacity={0.35} />
      <Caption at={[0, 9, 0]} text="Rāhu" sub="the shadow planet" range={700} when={['bhuvar']} />
    </group>
  )
}

const PLANETS = [
  { name: 'Śukra', sub: 'Venus', y: 145, r: 118, size: 3.0, color: '#fff6e8', speed: 0.05 },
  { name: 'Budha', sub: 'Mercury', y: 155, r: 132, size: 2.4, color: '#b9e6a8', speed: 0.06 },
  { name: 'Maṅgala', sub: 'Mars', y: 165, r: 146, size: 2.8, color: '#ff6a4a', speed: 0.035 },
  { name: 'Bṛhaspati', sub: 'Jupiter', y: 176, r: 160, size: 4.4, color: '#ffd27a', speed: 0.02 },
  { name: 'Śani', sub: 'Saturn', y: 188, r: 176, size: 3.8, color: '#7d8ac8', speed: 0.012 },
]

function Planets() {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(({ clock }) => {
    PLANETS.forEach((p, i) => {
      const g = refs.current[i]
      if (!g) return
      const a = clock.elapsedTime * p.speed + i * 1.7
      g.position.set(Math.cos(a) * p.r, p.y, Math.sin(a) * p.r)
    })
  })
  return (
    <>
      {PLANETS.map((p, i) => (
        <group key={p.name} ref={(el) => {
            refs.current[i] = el
          }}>
          <mesh material={standard(p.color, 0.6, 0.1, p.color, 0.55)}>
            <sphereGeometry args={[p.size, 32, 16]} />
          </mesh>
          {p.name === 'Śani' && (
            <mesh rotation={[1.2, 0.2, 0]} material={glowMaterial('#c9cff0', 1.4, { transparent: true, opacity: 0.6, side: THREE.DoubleSide })}>
              <ringGeometry args={[p.size * 1.4, p.size * 2.2, 64]} />
            </mesh>
          )}
          <Glow size={p.size * 7} color={p.color} opacity={0.6} />
          <Caption at={[0, p.size + 5, 0]} text={p.name} sub={p.sub} range={700} when={['bhuvar']} />
        </group>
      ))}
    </>
  )
}

function Nakshatras() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01
  })
  return (
    <group ref={ref} position={[0, 135, 0]}>
      <Billboards
        seed={28}
        texture="spark"
        items={() =>
          Array.from({ length: 28 }, (_, i) => {
            const a = (i / 28) * Math.PI * 2
            return { p: [Math.cos(a) * 205, Math.sin(i * 2.1) * 2, Math.sin(a) * 205] as [number, number, number], size: 9, color: '#fff2d8', alpha: 1 }
          })
        }
        twinkle={0.4}
        intensity={2.2}
      />
      <Caption at={[205, 10, 0]} text="Nakṣatras" sub="the 28 lunar mansions" range={800} when={['bhuvar']} />
    </group>
  )
}

export function Bhuvarloka() {
  return (
    <group>
      <Sun />
      <Moon />
      <Rahu />
      <Planets />
      <Nakshatras />
      {/* siddhas, cāraṇas and vidyādharas */}
      <Billboards
        seed={44}
        texture="spark"
        items={(r) =>
          Array.from({ length: 420 }, () => {
            const a = r.next() * Math.PI * 2
            const d = Math.sqrt(r.next()) * 260
            return {
              p: [Math.cos(a) * d, r.range(28, 100), Math.sin(a) * d] as [number, number, number],
              size: r.range(1.2, 3.2),
              color: r.pick(['#fff3c4', '#cfe6ff', '#ffd6f0']),
              alpha: 0.8,
            }
          })
        }
        drift={6}
        twinkle={0.7}
        intensity={1.6}
      />
    </group>
  )
}
