import * as THREE from 'three'
import { uTime } from './time'
import { scaleTexture } from './textures'

// ---------------------------------------------------------------------------
// Divine “light-body” material: deities are rendered as beings of light: a
// softly lit inner colour, a slow flowing shimmer and a bright fresnel rim that
// blooms. Works on regular meshes and InstancedMesh (with instanceColor).
// ---------------------------------------------------------------------------

const divineVert = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewV;
  varying vec3 vLocal;
  varying vec3 vTint;
  void main() {
    vec4 p = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      n = mat3(instanceMatrix) * n;
    #endif
    vTint = vec3(1.0);
    #ifdef USE_INSTANCING_COLOR
      vTint = instanceColor;
    #endif
    vLocal = position;
    vec4 mv = modelViewMatrix * p;
    vNormalV = normalize(normalMatrix * n);
    vViewV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const divineFrag = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRim;
  uniform float uGlow;
  uniform float uFlow;
  uniform float uTime;
  varying vec3 vNormalV;
  varying vec3 vViewV;
  varying vec3 vLocal;
  varying vec3 vTint;
  void main() {
    vec3 N = normalize(vNormalV);
    vec3 V = normalize(vViewV);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.3);
    vec3 base = uBase * vTint;
    vec3 L = normalize(vec3(0.35, 0.8, 0.5));
    float key = clamp((dot(N, L) + 0.3) / 1.3, 0.0, 1.0);
    float fill = clamp(dot(N, normalize(vec3(-0.6, -0.2, 0.4))), 0.0, 1.0);
    float spec = pow(max(dot(N, normalize(L + V)), 0.0), 42.0);
    float wave = 0.5 + 0.5 * sin(vLocal.y * 16.0 - uTime * 1.4 + sin(vLocal.x * 11.0 + uTime * 0.6) * 1.6);
    vec3 col = base * (0.3 + 0.66 * key * key + 0.12 * fill);
    col += base * uFlow * wave * 0.22;
    col += vec3(1.0, 0.98, 0.95) * spec * 0.16;
    col += uRim * vTint * (fres * uGlow + 0.06 * uGlow);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const divineCache = new Map<string, THREE.ShaderMaterial>()

export function divineMaterial(base: string, rim: string, glow = 2.2, flow = 1) {
  const key = `${base}|${rim}|${glow}|${flow}`
  const hit = divineCache.get(key)
  if (hit) return hit
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: new THREE.Color(base) },
      uRim: { value: new THREE.Color(rim) },
      uGlow: { value: glow },
      uFlow: { value: flow },
      uTime,
    },
    vertexShader: divineVert,
    fragmentShader: divineFrag,
  })
  divineCache.set(key, m)
  return m
}

// ---------------------------------------------------------------------------
// Physically based materials, shared across the scene.
// ---------------------------------------------------------------------------

const stdCache = new Map<string, THREE.Material>()
function cached<T extends THREE.Material>(key: string, make: () => T): T {
  const hit = stdCache.get(key)
  if (hit) return hit as T
  const m = make()
  stdCache.set(key, m)
  return m
}

export const mats = {
  gold: () =>
    cached('gold', () =>
      new THREE.MeshStandardMaterial({
        color: '#e8b54a',
        metalness: 1,
        roughness: 0.26,
        emissive: '#5a3a06',
        emissiveIntensity: 0.55,
      }),
    ),
  paleGold: () =>
    cached('paleGold', () =>
      new THREE.MeshStandardMaterial({
        color: '#f3dca0',
        metalness: 0.75,
        roughness: 0.32,
        emissive: '#4a3a14',
        emissiveIntensity: 0.4,
      }),
    ),
  marble: () =>
    cached('marble', () =>
      new THREE.MeshStandardMaterial({ color: '#efe8dc', metalness: 0.05, roughness: 0.42, emissive: '#2a2620', emissiveIntensity: 0.15 }),
    ),
  roseStone: () =>
    cached('roseStone', () =>
      new THREE.MeshStandardMaterial({ color: '#e8b3a0', metalness: 0.1, roughness: 0.5, emissive: '#3a1a14', emissiveIntensity: 0.35 }),
    ),
  silver: () =>
    cached('silver', () =>
      new THREE.MeshStandardMaterial({ color: '#d7dce6', metalness: 1, roughness: 0.22, emissive: '#1c2230', emissiveIntensity: 0.5 }),
    ),
  iron: () =>
    cached('iron', () => new THREE.MeshStandardMaterial({ color: '#4a4f58', metalness: 0.85, roughness: 0.45 })),
  darkStone: () =>
    cached('darkStone', () => new THREE.MeshStandardMaterial({ color: '#2a2526', metalness: 0.1, roughness: 0.85 })),
  basalt: () =>
    cached('basalt', () => new THREE.MeshStandardMaterial({ color: '#1a1414', metalness: 0.2, roughness: 0.75, emissive: '#200604', emissiveIntensity: 0.6 })),
  sapphire: () =>
    cached('sapphire', () =>
      new THREE.MeshStandardMaterial({ color: '#2d5bd6', metalness: 0.4, roughness: 0.18, emissive: '#1a3cb0', emissiveIntensity: 0.7 }),
    ),
  jade: () =>
    cached('jade', () =>
      new THREE.MeshStandardMaterial({ color: '#2fa58a', metalness: 0.25, roughness: 0.3, emissive: '#0c5a4a', emissiveIntensity: 0.6 }),
    ),
  serpent: (color: string, emissive = '#000000') =>
    cached(`serpent:${color}:${emissive}`, () => {
      const t = scaleTexture().clone()
      t.needsUpdate = true
      t.repeat.set(110, 5)
      return new THREE.MeshStandardMaterial({
        color,
        map: t,
        metalness: 0.25,
        roughness: 0.38,
        emissive,
        emissiveIntensity: 0.8,
      })
    }),
}

/** Unlit glowing colour for bloom (values above 1 bloom brightly). */
export function glowMaterial(color: string, intensity = 3, opts: { transparent?: boolean; opacity?: number; side?: THREE.Side } = {}) {
  const key = `glow:${color}:${intensity}:${opts.transparent}:${opts.opacity}:${opts.side}`
  return cached(key, () => {
    const c = new THREE.Color(color).multiplyScalar(intensity)
    return new THREE.MeshBasicMaterial({
      color: c,
      toneMapped: false,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
      depthWrite: !(opts.transparent ?? false),
    })
  })
}

export function standard(color: string, roughness = 0.8, metalness = 0, emissive = '#000000', emissiveIntensity = 1) {
  return cached(`std:${color}:${roughness}:${metalness}:${emissive}:${emissiveIntensity}`, () =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity }),
  )
}
