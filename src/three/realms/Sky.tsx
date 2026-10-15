import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { uTime } from '../core/time'
import { rng } from '../core/noise'
import { Billboards } from '../parts/Billboards'

// The Causal Ocean (Kāraṇa-samudra): a deep nebula sky in which countless
// other Brahmāṇḍas float as distant golden motes.

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`
const skyFrag = /* glsl */ `
  uniform float uTime;
  varying vec3 vDir;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; } return s; }
  void main() {
    vec3 d = normalize(vDir);
    float n1 = fbm(d * 2.2 + vec3(0.0, 0.0, uTime * 0.002));
    float n2 = fbm(d * 5.5 + vec3(3.1, 1.7, -2.0));
    float n3 = fbm(d * 12.0 - 4.0);
    vec3 base = mix(vec3(0.006, 0.005, 0.018), vec3(0.03, 0.016, 0.06), smoothstep(-0.6, 0.9, d.y));
    float cloud = pow(smoothstep(0.42, 0.85, n1), 1.6);
    vec3 neb = mix(vec3(0.20, 0.05, 0.30), vec3(0.04, 0.14, 0.36), smoothstep(0.3, 0.7, n2)) * cloud * 0.55;
    neb += vec3(0.9, 0.55, 0.22) * pow(smoothstep(0.55, 0.9, n2 * n1 * 1.7), 3.0) * 0.35;
    neb *= 0.75 + 0.5 * n3;
    gl_FragColor = vec4(base + neb, 1.0);
    #include <colorspace_fragment>
  }
`

const starVert = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPx;
  varying vec3 vColor;
  void main() {
    vColor = aColor * (0.75 + 0.25 * sin(uTime * (0.5 + aSize) + position.x));
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPx;
    gl_Position = projectionMatrix * mv;
  }
`
const starFrag = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a;
    gl_FragColor = vec4(vColor * a, a);
  }
`

export function Sky() {
  const dpr = useThree((s) => s.viewport.dpr)
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  )
  const stars = useMemo(() => {
    const r = rng(1234)
    const n = 9000
    const pos = new Float32Array(n * 3)
    const size = new Float32Array(n)
    const col = new Float32Array(n * 3)
    const palette = [new THREE.Color('#ffffff'), new THREE.Color('#ffe9c4'), new THREE.Color('#c9dcff'), new THREE.Color('#ffd0a8')]
    const v = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      v.set(r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)).normalize().multiplyScalar(r.range(22000, 26000))
      pos.set([v.x, v.y, v.z], i * 3)
      size[i] = Math.pow(r.next(), 6) * 4.5 + 0.9
      const c = r.pick(palette).clone().multiplyScalar(0.6 + r.next() * 1.4)
      col.set([c.r, c.g, c.b], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime, uPx: { value: dpr } },
      vertexShader: starVert,
      fragmentShader: starFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { g, m }
  }, [dpr])

  return (
    <group>
      <mesh material={skyMat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[30000, 48, 24]} />
      </mesh>
      <points geometry={stars.g} material={stars.m} frustumCulled={false} />
      {/* Other universes, each a golden egg in the Causal Ocean */}
      <Billboards
        seed={88}
        items={(r) =>
          Array.from({ length: 70 }, () => {
            const v = new THREE.Vector3(r.range(-1, 1), r.range(-0.6, 0.8), r.range(-1, 1)).normalize().multiplyScalar(r.range(7000, 16000))
            return {
              p: [v.x, v.y, v.z] as [number, number, number],
              size: r.range(160, 520),
              color: r.pick(['#ffcf7a', '#ffd9a0', '#ffe7c2', '#f7b860']),
              alpha: r.range(0.35, 0.8),
            }
          })
        }
        twinkle={0.25}
        intensity={1.6}
      />
    </group>
  )
}
