import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EGG } from '../../data/layout'
import { uTime } from '../core/time'
import { rng } from '../core/noise'

// Other Brahmāṇḍas far off in the Causal Ocean: soft egg-shaped lights in the
// background, nothing more. “Unlimited universes pass through the pores of
// Your body like particles of dust through a lattice window” (Bhāgavata 10.14.11).

const COUNT = 200

const vert = /* glsl */ `
  attribute vec3 aOffset;
  attribute float aSize;
  attribute float aRot;
  attribute vec3 aColor;
  attribute float aFade;
  attribute float aSeed;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(aOffset, 1.0);
    vec2 q = position.xy;
    q = vec2(q.x * cos(aRot) - q.y * sin(aRot), q.x * sin(aRot) + q.y * cos(aRot));
    mv.xy += q * aSize;
    float breathe = 0.82 + 0.18 * sin(uTime * (0.25 + aSeed * 0.3) + aSeed * 40.0);
    vColor = aColor * aFade * breathe;
    vUv = position.xy * 2.0;
    gl_Position = projectionMatrix * mv;
  }
`

const frag = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    // egg silhouette: a little broader below than above, proportioned like ours
    vec2 p = vUv;
    float halfW = 0.62 * (1.0 - 0.12 * p.y);
    float d = length(vec2(p.x / halfW, p.y / 0.88));
    float body = pow(clamp(1.0 - d, 0.0, 1.0), 0.9);
    float core = exp(-d * d * 4.0);
    float halo = exp(-max(d - 1.0, 0.0) * 6.0) * 0.18;
    float a = body * 0.55 + core * 0.45 + halo;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor * a, 1.0);
    #include <colorspace_fragment>
  }
`

const OUR_EGG = new THREE.Vector3(...EGG.center)
const OUR_R = (EGG.radii[0] + EGG.radii[1]) / 2
const _p = new THREE.Vector3()
const _v = new THREE.Vector3()
const _e = new THREE.Vector3()

export function Multiverse() {
  const group = useRef<THREE.Group>(null)
  const tick = useRef(0)

  const { geo, mat, positions, fade } = useMemo(() => {
    const r = rng(108)
    const tints = ['#ffc65a', '#ffb84a', '#ffd38a', '#f0a860', '#ffe2b0']
    const offsets = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const rots = new Float32Array(COUNT)
    const colors = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    const fade = new Float32Array(COUNT).fill(1)
    const positions: THREE.Vector3[] = []
    const c = new THREE.Color()
    let tries = 0
    while (positions.length < COUNT && tries++ < 6000) {
      const dir = new THREE.Vector3(r.range(-1, 1), r.range(-0.8, 0.85), r.range(-1, 1)).normalize()
      const d = r.range(12000, 21500)
      const pos = dir.multiplyScalar(d)
      if (positions.some((q) => q.distanceTo(pos) < 900)) continue
      const n = positions.length
      positions.push(pos)
      offsets.set([pos.x, pos.y, pos.z], n * 3)
      // nearer ones a little larger and brighter
      const near = 1 - (d - 12000) / 9500
      sizes[n] = r.range(220, 560) * (0.6 + near * 0.8)
      rots[n] = r.range(-0.6, 0.6)
      c.set(r.pick(tints)).multiplyScalar(0.55 + near * 0.75)
      colors.set([c.r, c.g, c.b], n * 3)
      seeds[n] = r.next()
    }
    const base = new THREE.PlaneGeometry(1, 1)
    const geo = new THREE.InstancedBufferGeometry()
    geo.index = base.index
    geo.setAttribute('position', base.attributes.position)
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3))
    geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1))
    geo.setAttribute('aRot', new THREE.InstancedBufferAttribute(rots, 1))
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3))
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
    const fadeAttr = new THREE.InstancedBufferAttribute(fade, 1)
    fadeAttr.setUsage(THREE.DynamicDrawUsage)
    geo.setAttribute('aFade', fadeAttr)
    geo.instanceCount = positions.length
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
    return { geo, mat, positions, fade }
  }, [])

  // Slow drift of the Causal Ocean. Lights behind our own egg fade out, and
  // from inside our egg they are dimmed, as if seen through its golden shell.
  useFrame(({ camera }, dt) => {
    const g = group.current
    if (!g) return
    g.rotation.y += dt * 0.0005
    if (tick.current++ % 3) return
    g.updateMatrixWorld()
    _e.copy(OUR_EGG).sub(camera.position)
    const dE = _e.length()
    _e.normalize()
    const outside = THREE.MathUtils.smoothstep(dE, OUR_R * 0.9, OUR_R * 1.5)
    const global = 0.4 + 0.6 * outside
    const halfAngle = Math.atan2(OUR_R * 0.92, Math.max(dE, 1))
    positions.forEach((pos, i) => {
      let k = global
      if (outside > 0) {
        _v.copy(_p.copy(pos).applyMatrix4(g.matrixWorld)).sub(camera.position).normalize()
        const ang = Math.acos(THREE.MathUtils.clamp(_v.dot(_e), -1, 1))
        k *= 1 - (1 - THREE.MathUtils.smoothstep(ang, halfAngle * 0.85, halfAngle * 1.12)) * outside * 0.95
      }
      fade[i] = k
    })
    ;(geo.getAttribute('aFade') as THREE.InstancedBufferAttribute).needsUpdate = true
  })

  return (
    <group ref={group}>
      <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={-4} />
    </group>
  )
}
