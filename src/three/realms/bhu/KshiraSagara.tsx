import { useMemo } from 'react'
import * as THREE from 'three'
import { KSHIRA_POS } from '../../../data/layout'
import { HighFigure } from '../../parts/HighFigure'
import { buildVishnuReclining } from '../../parts/divineVishnu'
import { Lotus, Serpent, Forest, BagMesh, Float } from '../../parts/common'
import { Glow, Rays } from '../../parts/Glow'
import { Billboards } from '../../parts/Billboards'
import { Caption } from '../../parts/Labels'
import { compose, type V3 } from '../../core/GeoBag'
import { mats, standard } from '../../core/materials'
import { rng } from '../../core/noise'
import { uTime } from '../../core/time'

/**
 * Anantaśayana: Viṣṇu reclines on the coils of Śeṣa in the Ocean of Milk.
 * Lakṣmī presses his feet; Brahmā sits on the lotus that rises from his navel.
 */

// ---------------------------------------------------------------------------
// The sea of milk: slow swells, ripples spreading from Śeṣa's coils, creamy
// swirls and a soft sheen, fading out into the ocean band of Bhū-maṇḍala.
// ---------------------------------------------------------------------------

const seaVert = /* glsl */ `
  uniform float uTime;
  varying vec3 vW;
  varying vec3 vN;
  varying float vR;
  varying float vH;
  float wave(vec2 p) {
    float r = length(p);
    float h = 0.045 * sin(p.x * 0.9 + uTime * 0.7) * cos(p.y * 0.7 - uTime * 0.5)
            + 0.03 * sin(dot(p, vec2(0.8, 0.6)) * 1.6 - uTime * 1.1)
            + 0.018 * sin(dot(p, vec2(-0.5, 0.9)) * 2.7 + uTime * 1.5)
            + 0.03 * sin(r * 3.2 - uTime * 1.4) * exp(-r * 0.16) * smoothstep(2.0, 3.0, r);
    return h;
  }
  void main() {
    vec3 p = position;
    float h = wave(p.xz);
    p.y += h;
    float e = 0.06;
    vec3 n = normalize(vec3(wave(p.xz - vec2(e, 0.0)) - wave(p.xz + vec2(e, 0.0)), 2.0 * e, wave(p.xz - vec2(0.0, e)) - wave(p.xz + vec2(0.0, e))));
    vN = normalize(mat3(modelMatrix) * n);
    vH = h;
    vR = length(position.xz);
    vec4 w = modelMatrix * vec4(p, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const seaFrag = /* glsl */ `
  uniform float uTime;
  uniform float uR;
  varying vec3 vW;
  varying vec3 vN;
  varying float vR;
  varying float vH;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.1; a *= 0.5; } return s; }
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vW);
    vec3 L = normalize(vec3(0.35, 0.85, 0.4));
    vec3 base = vec3(0.86, 0.84, 0.79);
    vec3 col = base * (0.74 + 0.26 * max(dot(N, L), 0.0));
    col += vec3(1.0, 0.96, 0.88) * max(vH, 0.0) * 1.4;
    col *= 0.93 + 0.07 * fbm(vW.xz * 0.55 + vec2(uTime * 0.04, -uTime * 0.03));
    float fr = pow(1.0 - max(dot(N, V), 0.0), 4.0);
    col = mix(col, vec3(0.74, 0.8, 0.96), fr * 0.45);
    col += pow(max(dot(N, normalize(L + V)), 0.0), 90.0) * 0.55;
    float ring = smoothstep(0.55, 1.0, sin(vR * 6.0 - uTime * 1.8)) * exp(-(vR - 3.2) * (vR - 3.2) * 0.12);
    col += ring * 0.07;
    float alpha = 1.0 - smoothstep(uR * 0.6, uR, vR);
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function MilkSea({ radius = 22 }: { radius?: number }) {
  const { geo, mat } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(radius * 2, radius * 2, 220, 220)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime, uR: { value: radius } },
      vertexShader: seaVert,
      fragmentShader: seaFrag,
      transparent: true,
    })
    return { geo, mat }
  }, [radius])
  return <mesh geometry={geo} material={mat} position={[0, 0.04, 0]} />
}

// ---------------------------------------------------------------------------

const VISHNU = { pos: [0.0, 1.16, 0.05] as V3, rot: [0.55, Math.PI / 2, 0] as V3, scale: 2.3 }

export function KshiraSagara() {
  // where Viṣṇu's head, navel and feet land in this scene
  const anchors = useMemo(() => {
    const M = compose(VISHNU.pos, VISHNU.rot, VISHNU.scale)
    const a = buildVishnuReclining().anchors
    const w = (p: V3) => new THREE.Vector3(...p).applyMatrix4(M)
    return { head: w(a.head), navel: w(a.navel), feet: w(a.feet) }
  }, [])

  const stalk = useMemo(() => {
    const n = anchors.navel
    const curve = new THREE.CatmullRomCurve3([
      n.clone(),
      n.clone().add(new THREE.Vector3(0.1, 0.55, 0.32)),
      n.clone().add(new THREE.Vector3(0.28, 1.3, 0.5)),
      n.clone().add(new THREE.Vector3(0.22, 2.05, 0.45)),
    ])
    return { geo: new THREE.TubeGeometry(curve, 48, 0.04, 10, false), top: curve.getPoint(1) }
  }, [anchors])

  const hood = anchors.head.clone().add(new THREE.Vector3(-0.2, 0.78, -0.38))
  const lakshmi = anchors.feet.clone().add(new THREE.Vector3(0.42, -0.4, 0.24))

  const island = useMemo(() => {
    const r = rng(12)
    return Array.from({ length: 26 }, () => {
      const a = r.next() * Math.PI * 2
      const d = Math.sqrt(r.next()) * 3.2
      return { p: [9 + Math.cos(a) * d, 0.35, -7 + Math.sin(a) * d] as V3, s: r.range(0.35, 0.55), c: '#e9f2e6' }
    })
  }, [])

  const floating = useMemo(() => {
    const r = rng(77)
    const out: { p: V3; r: number; pad: boolean; rot: number }[] = []
    while (out.length < 16) {
      const a = r.next() * Math.PI * 2
      const d = r.range(4.2, 13)
      const p: V3 = [Math.cos(a) * d, 0.08, Math.sin(a) * d]
      if (Math.hypot(p[0] - 9, p[2] + 7) < 4.5) continue
      out.push({ p, r: r.range(0.28, 0.5), pad: out.length % 2 === 1, rot: r.next() * Math.PI * 2 })
    }
    return out
  }, [])

  return (
    <group position={KSHIRA_POS}>
      <MilkSea />

      {/* Śeṣa: coils as a bed, seven hoods as a canopy over the Lord's head */}
      <Serpent
        spec={{
          bodyR: 0.36,
          coil: { rx: 2.6, rz: 1.2, turns: 3.0, rise: 0.24, shrink: 0.3, y0: 0.12, start: Math.PI },
          neck: [
            [-2.55, 1.2, -0.55],
            [-2.75, 2.0, -0.85],
            hood.toArray() as V3,
          ],
          hoods: 7,
          hoodSize: 0.62,
          facing: [0.5, -0.62, 0.6],
          spread: 1.25,
        }}
        color="#efe8d4"
        belly="#fff3d2"
        gem="#9ff6ff"
        emissive="#2a2410"
      />

      {/* Viṣṇu reclining (Anantaśayana) */}
      <HighFigure kind="vishnu" position={VISHNU.pos} rotation={VISHNU.rot} scale={VISHNU.scale} aura={0.25} />

      {/* the lotus from his navel, Brahmā upon it */}
      <mesh geometry={stalk.geo} material={standard('#3f8f4a', 0.55, 0, '#0f3a1a', 0.5)} />
      <Lotus spec={{ radius: 0.62, layers: 3, petals: 14, openness: 0.55 }} position={stalk.top.toArray() as V3} base="#fff3f6" tip="#f57aa8" glow={0.2} />
      <HighFigure kind="brahma" position={[stalk.top.x, stalk.top.y + 0.1, stalk.top.z]} scale={0.72} aura={0.3} />

      {/* Lakṣmī on a lotus at his feet, pressing them */}
      <mesh position={[lakshmi.x, lakshmi.y / 2 - 0.05, lakshmi.z]} material={standard('#3f8f4a', 0.55, 0, '#0f3a1a', 0.5)}>
        <cylinderGeometry args={[0.04, 0.05, Math.max(0.1, lakshmi.y), 8]} />
      </mesh>
      <Lotus spec={{ radius: 0.62, layers: 3, petals: 16, openness: 0.4 }} position={[lakshmi.x, lakshmi.y - 0.07, lakshmi.z]} base="#fff3f6" tip="#f06aa0" glow={0.2} />
      <HighFigure kind="lakshmi" position={lakshmi.toArray() as V3} rotation={[0, -Math.PI / 2 + 0.55, 0]} scale={1.1} aura={0.3} />

      {/* lotuses and lily pads on the milk */}
      {floating.map((f, i) => (
        <Float key={i} amp={0.03} speed={0.6} position={f.p}>
          {f.pad ? (
            <mesh rotation={[-Math.PI / 2, 0, f.rot]} material={standard('#3f8a42', 0.5, 0.05, '#0c2a10', 0.4)}>
              <circleGeometry args={[f.r * 1.2, 24, 0.3, Math.PI * 1.85]} />
            </mesh>
          ) : (
            <Lotus spec={{ radius: f.r, layers: 2, petals: 12, openness: 0.6 }} base="#fff6f8" tip="#f57aa8" glow={0.15} />
          )}
        </Float>
      ))}

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

      {/* soft mist on the ocean, and the Lord's radiance */}
      <Billboards
        seed={33}
        texture="cloud"
        additive={false}
        items={(r) =>
          Array.from({ length: 26 }, () => {
            const a = r.next() * Math.PI * 2
            const d = r.range(6, 17)
            return { p: [Math.cos(a) * d, r.range(0.35, 1.0), Math.sin(a) * d], size: r.range(3, 6), color: '#f8f6f0', alpha: 0.18 }
          })
        }
        drift={0.6}
        opacity={0.8}
      />
      <Glow position={[0, 1.8, -0.2]} size={9} color="#cfe0ff" opacity={0.16} pulse={0.04} depthTest={false} />
      <Rays position={[-0.8, 2.2, -0.8]} size={8} color="#e6f0ff" opacity={0.14} depthTest={false} />
      <pointLight position={[1, 3.2, 3]} color="#dfe8ff" intensity={8} distance={12} decay={1.6} />
      <Caption at={[9, 2.6, -7]} text="Śvetadvīpa" sub="the white island" range={60} when={['kshira']} />
    </group>
  )
}
