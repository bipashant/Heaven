import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { REALMS } from '../data/realms'
import { realmAt } from '../data/zones'
import { useCosmos } from '../state/store'

// Free navigation through the whole Brahmāṇḍa, like a globe or map app:
// - drag to rotate around what you're looking at, right/two-finger drag to pan
// - scroll / pinch zooms toward whatever is under the pointer (or between your
//   fingers), all the way in, and the pivot follows
// - double-click / double-tap flies to that spot
// - choosing a world flies there along a Bézier arc; any input interrupts it
// - the current world is recognised from wherever you navigate to, so zooming
//   far out naturally returns you to the cosmos

const BASE_FOV = 50
const LIMITS = { min: 0.15, max: 6000, minPolar: 0.02, maxPolar: Math.PI - 0.02 }
const MAX_TARGET_FROM_ORIGIN = 6000
const OVERVIEW = new THREE.Vector3(...REALMS.brahmanda.focus)

interface Flight {
  kind: 'realm' | 'focus'
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
const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

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

/** Opaque meshes the pointer can land on (no glows, particles, sky or forests). */
function collectSolids(scene: THREE.Scene) {
  const out: THREE.Mesh[] = []
  scene.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh) return
    const g = m.geometry as THREE.BufferGeometry & { isInstancedBufferGeometry?: boolean }
    if (!g || g.isInstancedBufferGeometry) return
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material
    if (!mat || mat.transparent || mat.side === THREE.BackSide || mat.blending === THREE.AdditiveBlending) return
    if (!g.boundingSphere) g.computeBoundingSphere()
    if (g.boundingSphere && g.boundingSphere.radius > 5000) return
    out.push(m)
  })
  return out
}

const shown = (o: THREE.Object3D | null) => {
  for (let p = o; p; p = p.parent) if (!p.visible) return false
  return true
}

const _fwd = new THREE.Vector3()
const _delta = new THREE.Vector3()

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const requestId = useCosmos((s) => s.requestId)
  const flight = useRef<Flight | null>(null)
  const interacting = useRef(false)
  const lastInteract = useRef(-10)
  const first = useRef(true)
  const solids = useRef<THREE.Mesh[] | null>(null)
  const raycaster = useRef(new THREE.Raycaster())
  const zoomState = useRef({ anchor: new THREE.Vector3(), has: false, sx: 0, sy: 0, t: 0, outT: 0 })
  const detect = useRef({ frame: 0, pending: '' as string, since: 0 })

  // ---------------------------------------------------------------------------
  // picking & zooming
  // ---------------------------------------------------------------------------

  const ndcAt = (clientX: number, clientY: number) => {
    const r = gl.domElement.getBoundingClientRect()
    return new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
  }

  /** First solid surface under a screen point, or null. */
  const pick = (clientX: number, clientY: number): THREE.Vector3 | null => {
    if (!solids.current) solids.current = collectSolids(scene)
    const rc = raycaster.current
    rc.setFromCamera(ndcAt(clientX, clientY), camera)
    rc.far = 20000
    const hits = rc.intersectObjects(solids.current.filter(shown), false)
    return hits.length ? hits[0].point.clone() : null
  }

  /** The point zooming heads toward; re-picked when the pointer moves or after a pause. */
  const anchorAt = (clientX: number, clientY: number, sticky = false) => {
    const z = zoomState.current
    const now = performance.now()
    const ctr = controls.current!
    if (z.has && (sticky || (now - z.t < 320 && Math.hypot(clientX - z.sx, clientY - z.sy) < 6))) {
      z.t = now
      return z.anchor
    }
    camera.getWorldDirection(_fwd)
    const hit = pick(clientX, clientY)
    if (hit) {
      z.anchor.copy(hit)
      // put the pivot at the depth of what you're zooming into (on the view axis, so the view doesn't jump)
      const depth = Math.max(LIMITS.min, hit.clone().sub(camera.position).dot(_fwd))
      ctr.target.copy(camera.position).addScaledVector(_fwd, depth)
    } else {
      const rc = raycaster.current
      rc.setFromCamera(ndcAt(clientX, clientY), camera)
      const r = Math.max(camera.position.distanceTo(ctr.target), 30)
      z.anchor.copy(camera.position).addScaledVector(rc.ray.direction, r / Math.max(0.2, rc.ray.direction.dot(_fwd)))
    }
    z.has = true
    z.sx = clientX
    z.sy = clientY
    z.t = now
    return z.anchor
  }

  /** Scale camera and pivot about P: P stays put on screen and the view direction is unchanged. */
  const zoomAbout = (P: THREE.Vector3, factor: number) => {
    const ctr = controls.current
    if (!ctr || !isFinite(factor) || factor <= 0) return
    const C = camera.position
    const T = ctr.target
    const toP = C.distanceTo(P)
    const r = C.distanceTo(T)
    let f = factor
    if (f < 1) f = Math.max(f, Math.min(1, LIMITS.min / Math.max(toP, 1e-6)))
    f = Math.min(f, LIMITS.max / Math.max(r, 1e-6))
    if (f === 1) return
    C.sub(P).multiplyScalar(f).add(P)
    T.sub(P).multiplyScalar(f).add(P)
    if (f > 1) zoomState.current.outT = performance.now()
  }

  // ---------------------------------------------------------------------------
  // flights
  // ---------------------------------------------------------------------------

  const cancelFlight = () => {
    const f = flight.current
    const ctr = controls.current
    if (!f || !ctr) return
    flight.current = null
    camera.fov = BASE_FOV
    camera.updateProjectionMatrix()
    ctr.enabled = true
    const st = useCosmos.getState()
    if (f.kind === 'realm') {
      if (st.tour) st.stopTour()
      st.setTraveling(false)
    }
  }

  const focusOn = (P: THREE.Vector3) => {
    const ctr = controls.current
    if (!ctr) return
    const C = camera.position.clone()
    const away = C.clone().sub(P)
    const d = away.length()
    const toPos = P.clone().add(away.normalize().multiplyScalar(THREE.MathUtils.clamp(d * 0.3, 0.6, 700)))
    flight.current = {
      kind: 'focus',
      t: 0,
      duration: THREE.MathUtils.clamp(0.7 + Math.log10(1 + d) * 0.25, 0.8, 1.6),
      dist: C.distanceTo(toPos),
      fromPos: C,
      toPos,
      c1: C.clone(),
      c2: toPos.clone(),
      fromTarget: ctr.target.clone(),
      toTarget: P.clone(),
    }
    ctr.enabled = false
  }

  // ---------------------------------------------------------------------------
  // input
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const el = gl.domElement
    const touchState = { pinchD: 0, pinching: false, tapX: 0, tapY: 0, tapT: 0, moved: false, lastTap: { t: 0, x: 0, y: 0 } }

    const touchDist = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    const touchMid = (e: TouchEvent) => [(e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2]

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (!controls.current) return
      cancelFlight()
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 16
      else if (e.deltaMode === 2) dy *= 400
      const factor = Math.exp(THREE.MathUtils.clamp(dy * (e.ctrlKey ? 0.012 : 0.0022), -0.7, 0.7))
      zoomAbout(anchorAt(e.clientX, e.clientY), factor)
    }

    const onPointerDown = () => cancelFlight()

    const onTouchStart = (e: TouchEvent) => {
      cancelFlight()
      if (e.touches.length === 2) {
        touchState.pinchD = touchDist(e)
        touchState.pinching = true
        const [mx, my] = touchMid(e)
        zoomState.current.has = false
        anchorAt(mx, my)
      } else if (e.touches.length === 1) {
        touchState.tapX = e.touches[0].clientX
        touchState.tapY = e.touches[0].clientY
        touchState.tapT = performance.now()
        touchState.moved = false
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && Math.hypot(e.touches[0].clientX - touchState.tapX, e.touches[0].clientY - touchState.tapY) > 10) touchState.moved = true
      if (e.touches.length !== 2 || !touchState.pinching) return
      const d = touchDist(e)
      if (touchState.pinchD > 0 && d > 0) {
        const [mx, my] = touchMid(e)
        zoomAbout(anchorAt(mx, my, true), THREE.MathUtils.clamp(touchState.pinchD / d, 0.75, 1.33))
      }
      touchState.pinchD = d
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) touchState.pinching = false
      // double-tap to fly to a spot
      if (e.touches.length === 0 && e.changedTouches.length === 1 && !touchState.moved && performance.now() - touchState.tapT < 260) {
        const t = e.changedTouches[0]
        const now = performance.now()
        const lt = touchState.lastTap
        if (now - lt.t < 330 && Math.hypot(t.clientX - lt.x, t.clientY - lt.y) < 32) {
          touchState.lastTap = { t: 0, x: 0, y: 0 }
          const hit = pick(t.clientX, t.clientY)
          if (hit) focusOn(hit)
        } else touchState.lastTap = { t: now, x: t.clientX, y: t.clientY }
      }
    }
    const onDblClick = (e: MouseEvent) => {
      const hit = pick(e.clientX, e.clientY)
      if (hit) focusOn(hit)
    }

    // desktop Safari reports trackpad pinch as gesture events rather than ctrl+wheel
    type Gesture = UIEvent & { scale: number; clientX: number; clientY: number }
    let gestureScale = 1
    const desktopSafari = navigator.maxTouchPoints === 0 && 'GestureEvent' in window
    const onGestureStart = (e: Event) => {
      e.preventDefault()
      gestureScale = 1
      zoomState.current.has = false
    }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
      const g = e as Gesture
      zoomAbout(anchorAt(g.clientX, g.clientY), THREE.MathUtils.clamp(gestureScale / g.scale, 0.75, 1.33))
      gestureScale = g.scale
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('dblclick', onDblClick)
    if (desktopSafari) {
      el.addEventListener('gesturestart', onGestureStart)
      el.addEventListener('gesturechange', onGestureChange)
    }
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('dblclick', onDblClick)
      el.removeEventListener('gesturestart', onGestureStart)
      el.removeEventListener('gesturechange', onGestureChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera, scene])

  // ---------------------------------------------------------------------------
  // initial placement, dev hooks, realm flights
  // ---------------------------------------------------------------------------

  useLayoutEffect(() => {
    const r = REALMS.brahmanda
    const focus = v(r.focus)
    camera.position.copy(focus.clone().add(v(r.view).multiplyScalar(2.8)).add(new THREE.Vector3(0, 900, 0)))
    controls.current?.target.copy(focus)
    camera.lookAt(focus)
  }, [camera])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as unknown as Record<string, unknown>
    w.__setView = (p: number[], t: number[]) => {
      const ctr = controls.current
      if (!ctr) return
      camera.position.set(p[0], p[1], p[2])
      ctr.target.set(t[0], t[1], t[2])
      ctr.update()
    }
    w.__project = (x: number, y: number, z: number) => {
      const p = new THREE.Vector3(x, y, z).project(camera)
      const r = gl.domElement.getBoundingClientRect()
      return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height, behind: p.z > 1 }
    }
    w.__camInfo = () => {
      const c = controls.current
      const r = (n: number) => Math.round(n * 10) / 10
      return c && { pos: camera.position.toArray().map(r), target: c.target.toArray().map(r), dist: r(camera.position.distanceTo(c.target)), enabled: c.enabled, flying: !!flight.current }
    }
    w.__pickMs = (x: number, y: number) => {
      const t0 = performance.now()
      const hit = pick(x, y)
      return { ms: Math.round((performance.now() - t0) * 10) / 10, hit: hit && hit.toArray().map((n) => Math.round(n * 10) / 10) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl])

  useEffect(() => {
    const ctr = controls.current
    if (!ctr) return
    const realm = REALMS[useCosmos.getState().current]
    const toTarget = v(realm.focus)
    // portrait screens see less sideways, so step back a little
    const framing = camera.aspect >= 1 ? 1 : Math.min(1.6, Math.pow(1 / camera.aspect, 0.55))
    const toPos = toTarget.clone().add(v(realm.view).multiplyScalar(framing))
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
      kind: 'realm',
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
    zoomState.current.has = false
    ctr.enabled = false
    ctr.autoRotate = false
    useCosmos.getState().setTraveling(true)
  }, [requestId, camera])

  // ---------------------------------------------------------------------------
  // per frame
  // ---------------------------------------------------------------------------

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
      if (f.kind === 'realm') camera.fov = BASE_FOV + 12 * Math.sin(Math.PI * e) * Math.min(1, f.dist / 900)
      if (f.t >= 1) {
        flight.current = null
        camera.fov = BASE_FOV
        ctr.enabled = true
        ctr.update()
        if (f.kind === 'realm') state.setTraveling(false)
      }
    }

    if (!flight.current) {
      const now = performance.now()
      // while zooming far out of the cosmos, drift the pivot back to its centre
      if (state.current === 'brahmanda' && now - zoomState.current.outT < 450) {
        const k = smooth(1300, 3200, camera.position.distanceTo(ctr.target))
        if (k > 0) {
          _delta.copy(OVERVIEW).sub(ctr.target).multiplyScalar(1 - Math.exp(-delta * 3 * k))
          ctr.target.add(_delta)
          camera.position.add(_delta)
        }
      }
      // never lose the cosmos entirely
      const out = ctr.target.length() - MAX_TARGET_FROM_ORIGIN
      if (out > 0) {
        _delta.copy(ctr.target).setLength(-out)
        ctr.target.add(_delta)
        camera.position.add(_delta)
      }
      // recognise which world you're looking at (with a little hysteresis)
      const dt = detect.current
      if (state.ready && dt.frame++ % 8 === 0) {
        const id = realmAt(ctr.target, camera.position.distanceTo(ctr.target))
        if (id === state.current) dt.pending = ''
        else if (dt.pending !== id) {
          dt.pending = id
          dt.since = now
        } else if (now - dt.since > 550) {
          dt.pending = ''
          state.setCurrentSilently(id)
        }
      }
    }

    const idle = performance.now() / 1000 - lastInteract.current > 5
    ctr.autoRotate = !flight.current && state.autoOrbit && !interacting.current && idle

    // keep depth precision high across scales, from a lotus petal to the egg
    const d = camera.position.distanceTo(ctr.target)
    const near = THREE.MathUtils.clamp(d * 0.01, 0.03, 12)
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
      dampingFactor={0.08}
      rotateSpeed={0.6}
      panSpeed={0.9}
      enableZoom={false}
      screenSpacePanning
      minDistance={LIMITS.min}
      maxDistance={LIMITS.max}
      minPolarAngle={LIMITS.minPolar}
      maxPolarAngle={LIMITS.maxPolar}
      mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN }}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
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
