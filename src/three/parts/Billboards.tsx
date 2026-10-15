import { useMemo } from 'react'
import * as THREE from 'three'
import { uTime } from '../core/time'
import { cloudTexture, glowTexture, sparkTexture } from '../core/textures'
import { rng } from '../core/noise'
import type { V3 } from '../core/GeoBag'

// One draw call for hundreds of camera-facing quads: clouds, embers, sparkles,
// smoke, distant stars. Animation (drift, rising, twinkle) runs in the shader.

const vert = /* glsl */ `
  attribute vec3 aOffset;
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSeed;
  uniform float uTime;
  uniform float uDrift;
  uniform float uRise;
  uniform float uRiseH;
  uniform float uSpin;
  uniform float uTwinkle;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 c = aOffset;
    float t = uTime + aSeed * 37.0;
    c.x += sin(t * 0.13 + aSeed * 6.0) * uDrift;
    c.z += cos(t * 0.11 + aSeed * 4.0) * uDrift;
    float fade = 1.0;
    if (uRise != 0.0) {
      float ph = fract(uTime * uRise / uRiseH + aSeed);
      c.y += ph * uRiseH * sign(uRise);
      fade = smoothstep(0.0, 0.15, ph) * (1.0 - smoothstep(0.65, 1.0, ph));
    }
    vec4 mv = modelViewMatrix * vec4(c, 1.0);
    float a = aSeed * 6.2831 + uTime * uSpin * (fract(aSeed * 7.0) - 0.5);
    vec2 q = position.xy;
    q = vec2(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a));
    float ms = length(modelMatrix[0].xyz);
    float s = aSize * ms;
    mv.xy += q * s;
    float tw = 1.0 - uTwinkle + uTwinkle * (0.5 + 0.5 * sin(uTime * 2.3 + aSeed * 50.0));
    float nearFade = smoothstep(s * 0.12, s * 0.8, -mv.z);
    vAlpha = aAlpha * fade * tw * nearFade;
    vColor = aColor;
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }
`

const frag = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 t = texture2D(uMap, vUv);
    float a = t.a * vAlpha * uOpacity;
    if (a < 0.002) discard;
    gl_FragColor = vec4(vColor * t.rgb, a);
    #include <colorspace_fragment>
  }
`

export interface BillboardItem {
  p: V3
  size: number
  color: THREE.ColorRepresentation
  alpha?: number
}

export interface BillboardsProps {
  items: BillboardItem[] | ((r: ReturnType<typeof rng>) => BillboardItem[])
  texture?: 'cloud' | 'glow' | 'spark'
  additive?: boolean
  drift?: number
  rise?: number
  riseHeight?: number
  spin?: number
  twinkle?: number
  opacity?: number
  seed?: number
  position?: V3
  renderOrder?: number
  /** Colour multiplier so additive sprites can exceed 1 and bloom. */
  intensity?: number
}

export function Billboards({
  items,
  texture = 'glow',
  additive = true,
  drift = 0,
  rise = 0,
  riseHeight = 10,
  spin = 0,
  twinkle = 0,
  opacity = 1,
  seed = 1,
  position,
  renderOrder = 0,
  intensity = 1,
}: BillboardsProps) {
  const { geo, mat } = useMemo(() => {
    const list = typeof items === 'function' ? items(rng(seed)) : items
    const n = list.length
    const off = new Float32Array(n * 3)
    const size = new Float32Array(n)
    const col = new Float32Array(n * 3)
    const alpha = new Float32Array(n)
    const sd = new Float32Array(n)
    const c = new THREE.Color()
    const r = rng(seed + 99)
    list.forEach((it, i) => {
      off.set(it.p, i * 3)
      size[i] = it.size
      c.set(it.color).multiplyScalar(intensity)
      col.set([c.r, c.g, c.b], i * 3)
      alpha[i] = it.alpha ?? 1
      sd[i] = r.next()
    })
    const base = new THREE.PlaneGeometry(1, 1)
    const g = new THREE.InstancedBufferGeometry()
    g.index = base.index
    g.setAttribute('position', base.attributes.position)
    g.setAttribute('uv', base.attributes.uv)
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 3))
    g.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 1))
    g.setAttribute('aColor', new THREE.InstancedBufferAttribute(col, 3))
    g.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alpha, 1))
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 1))
    g.instanceCount = n
    const map = texture === 'cloud' ? cloudTexture() : texture === 'spark' ? sparkTexture() : glowTexture()
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime,
        uMap: { value: map },
        uOpacity: { value: opacity },
        uDrift: { value: drift },
        uRise: { value: rise },
        uRiseH: { value: riseHeight },
        uSpin: { value: spin },
        uTwinkle: { value: twinkle },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      toneMapped: false,
    })
    return { geo: g, mat: m }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, texture, additive, drift, rise, riseHeight, spin, twinkle, opacity, intensity])

  return <mesh geometry={geo} material={mat} position={position} frustumCulled={false} renderOrder={renderOrder} />
}
