import { useMemo } from 'react'
import * as THREE from 'three'
import { uTime } from '../core/time'
import type { V3 } from '../core/GeoBag'

// Luminous flowing stream along a curve: the celestial Gaṅgā, Virajā,
// Vaitaraṇī. Brightest facing the camera, streaks scroll along the length.

const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const frag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uSpeed;
  uniform float uLen;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float facing = abs(dot(normalize(vN), normalize(vV)));
    float core = pow(facing, 1.6);
    float s = vUv.x * uLen;
    float streak = 0.55 + 0.45 * sin(s * 1.7 - uTime * uSpeed * 6.0 + sin(s * 0.37 + vUv.y * 6.283) * 2.0);
    streak *= 0.7 + 0.3 * sin(s * 4.3 - uTime * uSpeed * 9.0 + vUv.y * 12.566);
    vec3 col = mix(uColor2, uColor, core) * (0.6 + 0.8 * streak);
    float a = core * uOpacity * (0.5 + 0.5 * streak);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`

export function FlowTube({
  points,
  radius = 0.2,
  color = '#cfeaff',
  color2 = '#4aa8ff',
  speed = 1,
  opacity = 0.9,
  segments = 96,
  closed = false,
  intensity = 2.2,
  streakScale = 1,
}: {
  points: V3[]
  radius?: number
  color?: string
  color2?: string
  speed?: number
  opacity?: number
  segments?: number
  closed?: boolean
  intensity?: number
  /** Streaks per unit length. */
  streakScale?: number
}) {
  const { geo, mat } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal')
    const geo = new THREE.TubeGeometry(curve, segments, radius, 10, closed)
    const len = curve.getLength()
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime,
        uColor: { value: new THREE.Color(color).multiplyScalar(intensity) },
        uColor2: { value: new THREE.Color(color2).multiplyScalar(intensity * 0.5) },
        uSpeed: { value: speed },
        uLen: { value: (len / Math.max(radius * 6, 0.001)) * streakScale },
        uOpacity: { value: opacity },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    return { geo, mat }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), radius, color, color2, speed, opacity, segments, closed, intensity, streakScale])
  return <mesh geometry={geo} material={mat} frustumCulled={false} />
}
