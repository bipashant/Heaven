import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { glowTexture, raysTexture } from '../core/textures'
import type { V3 } from '../core/GeoBag'

interface GlowProps {
  position?: V3
  size?: number
  color?: string
  opacity?: number
  /** Gentle breathing of the glow */
  pulse?: number
  /** Large auras skip depth so they never slice through floors. */
  depthTest?: boolean
}

/** Camera-facing additive glow sprite. */
export function Glow({ position, size = 1, color = '#ffffff', opacity = 1, pulse = 0, depthTest = true }: GlowProps) {
  const ref = useRef<THREE.Sprite>(null)
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest,
        toneMapped: false,
      }),
    [color, opacity, depthTest],
  )
  const seed = useMemo(() => Math.random() * 10, [])
  useFrame(({ clock }) => {
    if (!pulse || !ref.current) return
    const k = 1 + Math.sin(clock.elapsedTime * 0.8 + seed) * pulse
    ref.current.scale.setScalar(size * k)
  })
  return <sprite ref={ref} position={position} scale={size} material={mat} />
}

/** Slowly rotating fan of light rays (aureole), camera-facing. */
export function Rays({ position, size = 4, color = '#fff2c0', opacity = 0.5, speed = 0.03, depthTest = true }: GlowProps & { speed?: number }) {
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: raysTexture(),
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest,
        toneMapped: false,
      }),
    [color, opacity, depthTest],
  )
  useFrame((_, dt) => {
    mat.rotation += dt * speed
  })
  return <sprite position={position} scale={size} material={mat} />
}
