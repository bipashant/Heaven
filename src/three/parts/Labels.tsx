import { useEffect, useId, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { create } from 'zustand'
import { REALMS, type RealmId } from '../../data/realms'
import { BHU_RADIUS, LOWER_DISC_RADIUS, Y } from '../../data/layout'
import { useCosmos } from '../../state/store'
import type { V3 } from '../core/GeoBag'

// One lightweight label layer: in-scene anchors register here, a single DOM
// overlay renders them, and one per-frame loop projects them onto the screen.

export interface LabelDef {
  id: string
  kind: 'realm' | 'caption'
  text: string
  sub?: string
  realmId?: RealmId
  range: number
  /** Only show while visiting one of these realms. */
  when?: RealmId[]
}

interface Runtime {
  obj: THREE.Object3D | null
  el: HTMLElement | null
  def: LabelDef
  last: string
  lastO: number
}

export const useLabelDefs = create<{ defs: LabelDef[]; add: (d: LabelDef) => void; remove: (id: string) => void }>((set) => ({
  defs: [],
  add: (d) => set((s) => ({ defs: [...s.defs.filter((x) => x.id !== d.id), d] })),
  remove: (id) => set((s) => ({ defs: s.defs.filter((x) => x.id !== id) })),
}))

const runtime = new Map<string, Runtime>()

function useAnchor(def: Omit<LabelDef, 'id'>) {
  const id = useId()
  const ref = useRef<THREE.Group>(null)
  useEffect(() => {
    const full = { ...def, id }
    const prev = runtime.get(id)
    runtime.set(id, { obj: ref.current, el: prev?.el ?? null, def: full, last: '', lastO: -1 })
    useLabelDefs.getState().add(full)
    return () => {
      runtime.delete(id)
      useLabelDefs.getState().remove(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  return ref
}

export function RealmLabels() {
  return (
    <>
      {Object.values(REALMS)
        .filter((r) => r.label.range > 0)
        .map((r) => (
          <RealmAnchor key={r.id} id={r.id} />
        ))}
    </>
  )
}

function RealmAnchor({ id }: { id: RealmId }) {
  const r = REALMS[id]
  const ref = useAnchor({ kind: 'realm', text: r.name, sub: r.devanagari, realmId: id, range: r.label.range })
  return <group ref={ref} position={r.label.at} />
}

/** Small non-interactive caption for features (planets, oceans, rivers). */
export function Caption({ at, text, sub, range = 300, when }: { at: V3; text: string; sub?: string; range?: number; when?: RealmId[] }) {
  const ref = useAnchor({ kind: 'caption', text, sub, range, when })
  return <group ref={ref} position={at} />
}

const _v = new THREE.Vector3()

// Opaque horizontal floors that hide labels behind them (y, radius, centre z).
const FLOORS: [number, number, number][] = [
  [Y.bhu - 4, BHU_RADIUS, 0],
  [Y.atala - 2, LOWER_DISC_RADIUS, 0],
  [Y.vitala - 2, LOWER_DISC_RADIUS, 0],
  [Y.sutala - 2, LOWER_DISC_RADIUS, 0],
  [Y.talatala - 2, LOWER_DISC_RADIUS, 0],
  [Y.mahatala - 2, LOWER_DISC_RADIUS, 0],
  [Y.rasatala - 2, LOWER_DISC_RADIUS, 0],
  [Y.patala - 2, LOWER_DISC_RADIUS, 0],
  [Y.svarga - 1, 50, 0],
  [Y.vaikuntha - 1, 82, 0],
]

function occluded(cam: THREE.Vector3, p: THREE.Vector3) {
  for (const [y, r, cz] of FLOORS) {
    if ((cam.y - y) * (p.y - y) >= 0) continue
    const t = (y - cam.y) / (p.y - cam.y)
    const x = cam.x + (p.x - cam.x) * t
    const z = cam.z + (p.z - cam.z) * t - cz
    if (x * x + z * z < r * r) return true
  }
  return false
}

/** Runs inside the Canvas: projects every anchor and updates its DOM node. */
export function LabelProjector() {
  const size = useThree((s) => s.size)
  useFrame(({ camera }) => {
    const s = useCosmos.getState()
    for (const rt of runtime.values()) {
      const { obj, el, def } = rt
      if (!obj || !el) continue
      obj.getWorldPosition(_v)
      const d = camera.position.distanceTo(_v)
      let f = 0
      const hidden =
        s.traveling ||
        !s.ready ||
        (def.kind === 'realm' && s.current === def.realmId) ||
        (def.when !== undefined && !def.when.includes(s.current))
      if (!hidden && d < def.range && !occluded(camera.position, _v)) f = Math.min(1, (def.range - d) / (def.range * 0.18))
      if (f > 0) f *= Math.min(1, d / (def.range * 0.02 + 1))
      if (f > 0) {
        _v.project(camera)
        if (_v.z > 1 || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2) f = 0
      }
      const o = Math.round(f * 20) / 20
      if (o !== rt.lastO) {
        rt.lastO = o
        el.style.opacity = String(o)
        el.style.visibility = o === 0 ? 'hidden' : 'visible'
        el.style.pointerEvents = o > 0.25 && def.kind === 'realm' ? 'auto' : 'none'
      }
      if (o > 0) {
        const x = Math.round((_v.x * 0.5 + 0.5) * size.width)
        const y = Math.round((-_v.y * 0.5 + 0.5) * size.height)
        const t = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
        if (t !== rt.last) {
          rt.last = t
          el.style.transform = t
        }
      }
    }
  })
  return null
}

/** Rendered outside the Canvas, in the normal DOM. */
export function LabelLayer() {
  const defs = useLabelDefs((s) => s.defs)
  const goTo = useCosmos((s) => s.goTo)
  const bind = (id: string) => (el: HTMLElement | null) => {
    const rt = runtime.get(id)
    if (rt) {
      rt.el = el
      rt.lastO = -1
      rt.last = ''
    }
  }
  return (
    <div className="label-layer" aria-hidden={false}>
      {defs.map((d) =>
        d.kind === 'realm' ? (
          <button
            key={d.id}
            ref={bind(d.id)}
            className="realm-label"
            style={{ ['--accent' as string]: REALMS[d.realmId!].accent }}
            onClick={() => goTo(d.realmId!)}
            aria-label={`Travel to ${d.text}`}
          >
            <span className="realm-label__dot" />
            <span className="realm-label__text">
              <span className="realm-label__dev">{d.sub}</span>
              <span className="realm-label__en">{d.text}</span>
            </span>
          </button>
        ) : (
          <div key={d.id} ref={bind(d.id)} className="caption">
            <span>{d.text}</span>
            {d.sub && <small>{d.sub}</small>}
          </div>
        ),
      )}
    </div>
  )
}
