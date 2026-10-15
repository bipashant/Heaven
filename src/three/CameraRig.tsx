import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { REALMS } from '../data/realms'
import { useCosmos } from '../state/store'

const BASE_FOV = 50

interface Flight {
  t: number
  duration: number
  dist: number
  fromPos: THREE.Vector3
  toPos: THREE.Vector3
  c1: THREE.Vector3
  c2: THREE.Vector3
  fromTarget: THREE.Vector3
  toTarget: THREE.Vector3
}

const v = (a: readonly number[]) => new THREE.Vector3(a[0], a[1], a[2])
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

function bezier(p0: THREE.Vector3, c1: THREE.Vector3, c2: THREE.Vector3, p1: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return out.set(
    a * p0.x + b * c1.x + c * c2.x + d * p1.x,
    a * p0.y + b * c1.y + c * c2.y + d * p1.y,
    a * p0.z + b * c1.z + c * c2.z + d * p1.z,
  )
}

/**
 * Flies the camera between realms along a cubic Bézier that first pulls back
 * (rising “into space”) and then descends onto the destination, then hands
 * over to orbit controls for a free bird’s-eye view.
 */
export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const requestId = useCosmos((s) => s.requestId)
  const flight = useRef<Flight | null>(null)
  const interacting = useRef(false)
  const lastInteract = useRef(-10)
  const first = useRef(true)

  useLayoutEffect(() => {
    const r = REALMS.brahmanda
    const focus = v(r.focus)
    camera.position.copy(focus.clone().add(v(r.view).multiplyScalar(2.8)).add(new THREE.Vector3(0, 900, 0)))
    controls.current?.target.copy(focus)
    camera.lookAt(focus)
  }, [camera])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as Record<string, unknown>).__setView = (p: number[], t: number[]) => {
      const ctr = controls.current
      if (!ctr) return
      ctr.minDistance = 0
      ctr.maxDistance = Infinity
      ctr.minPolarAngle = 0
      ctr.maxPolarAngle = Math.PI
      camera.position.set(p[0], p[1], p[2])
      ctr.target.set(t[0], t[1], t[2])
      ctr.update()
    }
  }, [camera])

  useEffect(() => {
    const ctr = controls.current
    if (!ctr) return
    const realm = REALMS[useCosmos.getState().current]
    const toTarget = v(realm.focus)
    const toPos = toTarget.clone().add(v(realm.view))
    const fromPos = camera.position.clone()
    const fromTarget = ctr.target.clone()
    const dist = fromPos.distanceTo(toPos)
    const intro = first.current
    first.current = false
    const duration = intro ? 6.5 : THREE.MathUtils.clamp(2.0 + Math.sqrt(dist) * 0.08, 2.2, 7.5)
    const k = Math.min(dist * 0.38, 1400)
    const back0 = fromPos.clone().sub(fromTarget).normalize()
    const back1 = toPos.clone().sub(toTarget).normalize()
    flight.current = {
      t: 0,
      duration,
      dist,
      fromPos,
      toPos,
      c1: fromPos.clone().addScaledVector(back0, intro ? 0 : k),
      c2: toPos.clone().addScaledVector(back1, k),
      fromTarget,
      toTarget,
    }
    ctr.enabled = false
    ctr.autoRotate = false
    ctr.minDistance = 0
    ctr.maxDistance = Infinity
    ctr.minPolarAngle = 0
    ctr.maxPolarAngle = Math.PI
    useCosmos.getState().setTraveling(true)
  }, [requestId, camera])

  useFrame((_, delta) => {
    const ctr = controls.current
    if (!ctr) return
    const f = flight.current
    const state = useCosmos.getState()
    if (f && state.ready) {
      f.t = Math.min(1, f.t + Math.min(delta, 0.05) / f.duration)
      const e = easeInOutCubic(f.t)
      bezier(f.fromPos, f.c1, f.c2, f.toPos, e, camera.position)
      ctr.target.lerpVectors(f.fromTarget, f.toTarget, easeInOutSine(Math.min(1, f.t * 1.08)))
      camera.lookAt(ctr.target)
      camera.fov = BASE_FOV + 12 * Math.sin(Math.PI * e) * Math.min(1, f.dist / 900)
      if (f.t >= 1) {
        flight.current = null
        camera.fov = BASE_FOV
        const realm = REALMS[state.current]
        ctr.minDistance = realm.orbit.min
        ctr.maxDistance = realm.orbit.max
        ctr.minPolarAngle = realm.orbit.minPolar ?? 0
        ctr.maxPolarAngle = realm.orbit.maxPolar ?? Math.PI - 0.05
        ctr.enabled = true
        ctr.update()
        state.setTraveling(false)
      }
    }

    const idle = performance.now() / 1000 - lastInteract.current > 5
    ctr.autoRotate = !flight.current && state.autoOrbit && !interacting.current && idle

    // Keep depth precision high across scales from a lotus petal to the egg.
    const d = camera.position.distanceTo(ctr.target)
    const near = THREE.MathUtils.clamp(d * 0.01, 0.04, 12)
    if (Math.abs(near - camera.near) / camera.near > 0.05 || camera.fov !== (camera.userData.fov as number)) {
      camera.near = near
      camera.far = 80000
      camera.userData.fov = camera.fov
      camera.updateProjectionMatrix()
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.55}
      zoomSpeed={0.9}
      panSpeed={0.7}
      autoRotateSpeed={0.3}
      onStart={() => {
        interacting.current = true
      }}
      onEnd={() => {
        interacting.current = false
        lastInteract.current = performance.now() / 1000
      }}
    />
  )
}
