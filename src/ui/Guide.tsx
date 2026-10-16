import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { REALMS, type RealmId } from '../data/realms'
import { isCompact, useCosmos } from '../state/store'
import { IconArrowRight, IconCheck, IconClose, IconPlay } from './icons'

// A short first-visit guide: how to look around and zoom (it notices when you
// actually do it), how to travel, and a few places to start. Shown once; the
// “?” button in the toolbar brings it back.

const KEY = 'brahmanda.guide.v1'
const seen = () => {
  try {
    return localStorage.getItem(KEY) === 'done'
  } catch {
    return false
  }
}
const markSeen = () => {
  try {
    localStorage.setItem(KEY, 'done')
  } catch {
    /* private mode: the guide may simply show again next time */
  }
}

type Art = 'om' | 'drag' | 'pinch' | 'scroll' | 'tap'
interface Step {
  id: 'welcome' | 'orbit' | 'zoom' | 'travel' | 'go'
  title: string
  body: string
  art?: Art
  try?: 'orbit' | 'zoom'
  spot?: string
}

function makeSteps(touch: boolean, compact: boolean): Step[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to the Brahmāṇḍa',
      body: 'Fly through the worlds of the Purāṇic cosmos, from the heavens above to Pātāla below.',
      art: 'om',
    },
    {
      id: 'orbit',
      title: 'Look around',
      body: touch
        ? 'Slide one finger to look around. Drag with two fingers to move across the sky.'
        : 'Drag to look around. Right-drag (or Shift-drag) to move across the sky.',
      art: 'drag',
      try: 'orbit',
    },
    {
      id: 'zoom',
      title: touch ? 'Pinch to zoom' : 'Scroll to zoom',
      body: touch
        ? 'Pinch toward anything to fly into it, as close as you like. Double-tap a spot to jump there.'
        : 'Scroll toward anything under the pointer to fly into it. Double-click a spot to jump there.',
      art: touch ? 'pinch' : 'scroll',
      try: 'zoom',
    },
    {
      id: 'travel',
      title: 'Travel between worlds',
      body: compact
        ? 'Tap a glowing name, use Up and Down, or open Worlds for the full list. Zoom right out to see the whole cosmos again.'
        : 'Click a glowing name, press ↑ ↓ to rise or descend, or pick from the list. Zoom right out to see the whole cosmos again.',
      art: 'tap',
      spot: compact ? '.dock' : '.nav',
    },
    { id: 'go', title: 'Where shall we go first?', body: '' },
  ]
}

const PICKS: { id: RealmId; line: string }[] = [
  { id: 'svarga', line: 'Indra’s heaven above the clouds' },
  { id: 'kailash', line: 'Śiva and Pārvatī on the summit' },
  { id: 'kshira', line: 'Viṣṇu resting on Śeṣa' },
  { id: 'vaikuntha', line: 'The eternal abode beyond the egg' },
  { id: 'patala', line: 'The jewel-lit world of the nāgas' },
]

function GuideArt({ kind, done }: { kind?: Art; done: boolean }) {
  if (!kind) return null
  return (
    <div className={`guide__art guide__art--${kind} ${done ? 'is-done' : ''}`} aria-hidden="true">
      {kind === 'om' && <span className="guide__om">ॐ</span>}
      {kind === 'drag' && (
        <svg viewBox="0 0 120 80">
          <path className="g-arc" d="M22 58 Q60 30 98 58" />
          <path className="g-arrow" d="M92 50 L98 58 L89 61" />
          <path className="g-arrow" d="M28 50 L22 58 L31 61" />
          <circle className="g-finger g-finger--drag" cx="60" cy="52" r="9" />
        </svg>
      )}
      {kind === 'pinch' && (
        <svg viewBox="0 0 120 80">
          <path className="g-arc" d="M60 40 L28 62 M60 40 L92 18" />
          <circle className="g-finger g-finger--pinch-a" cx="48" cy="48" r="8" />
          <circle className="g-finger g-finger--pinch-b" cx="72" cy="32" r="8" />
        </svg>
      )}
      {kind === 'scroll' && (
        <svg viewBox="0 0 120 80">
          <rect className="g-mouse" x="44" y="10" width="32" height="54" rx="16" />
          <line className="g-arc" x1="60" y1="10" x2="60" y2="30" />
          <rect className="g-wheel" x="57" y="16" width="6" height="11" rx="3" />
          <path className="g-arrow" d="M88 26 L94 20 L100 26 M88 48 L94 54 L100 48" />
        </svg>
      )}
      {kind === 'tap' && (
        <svg viewBox="0 0 120 80">
          <rect className="g-pill" x="24" y="18" width="72" height="26" rx="13" />
          <circle className="g-pill-dot" cx="38" cy="31" r="4.5" />
          <text className="g-pill-text" x="48" y="35">Svarga</text>
          <circle className="g-ripple" cx="72" cy="40" r="10" />
          <circle className="g-finger g-finger--tap" cx="72" cy="40" r="8" />
        </svg>
      )}
    </div>
  )
}

export function Guide() {
  const ready = useCosmos((s) => s.ready)
  const traveling = useCosmos((s) => s.traveling)
  const open = useCosmos((s) => s.guideOpen)
  const setOpen = useCosmos((s) => s.setGuideOpen)
  const tour = useCosmos((s) => s.tour)
  const [i, setI] = useState(0)
  const [done, setDone] = useState(false)
  const touch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, [])
  const steps = makeSteps(touch, isCompact())
  const step = steps[Math.min(i, steps.length - 1)]
  const primary = useRef<HTMLButtonElement>(null)

  const finish = () => {
    markSeen()
    setOpen(false)
  }
  const next = () => {
    setDone(false)
    if (i < steps.length - 1) setI(i + 1)
    else finish()
  }

  // first visit: open once the opening flight has landed
  const asked = useRef(false)
  useEffect(() => {
    if (asked.current || !ready || traveling) return
    asked.current = true
    if (!seen()) setOpen(true)
  }, [ready, traveling, setOpen])

  useEffect(() => {
    if (open) {
      setI(0)
      setDone(false)
    }
  }, [open])

  useEffect(() => {
    if (tour && open) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour])

  useEffect(() => {
    if (open) primary.current?.focus({ preventScroll: true })
  }, [open, i])

  // “Try it”: notice a real drag or pinch / scroll on the scene
  useEffect(() => {
    if (!open || !step.try) return
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas')
    if (!canvas) return
    let start: { x: number; y: number } | null = null
    let pinch0 = 0
    const ok = () => setDone(true)
    const down = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY }
    }
    const move = (e: PointerEvent) => {
      if (step.try === 'orbit' && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 60) ok()
    }
    const up = () => {
      start = null
    }
    const wheel = () => {
      if (step.try === 'zoom') ok()
    }
    const tmove = (e: TouchEvent) => {
      if (step.try !== 'zoom' || e.touches.length < 2) return
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      if (!pinch0) pinch0 = d
      else if (Math.abs(d - pinch0) > 40) ok()
    }
    const tend = () => {
      pinch0 = 0
    }
    canvas.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    canvas.addEventListener('wheel', wheel, { passive: true })
    canvas.addEventListener('touchmove', tmove, { passive: true })
    canvas.addEventListener('touchend', tend)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      canvas.removeEventListener('wheel', wheel)
      canvas.removeEventListener('touchmove', tmove)
      canvas.removeEventListener('touchend', tend)
    }
  }, [open, step.try])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(next, 1100)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  // spotlight the controls being described
  const [rect, setRect] = useState<DOMRect | null>(null)
  useLayoutEffect(() => {
    if (!open || !step.spot) {
      setRect(null)
      return
    }
    const measure = () => {
      const el = document.querySelector(step.spot!)
      const r = el?.getBoundingClientRect()
      setRect(r && r.width > 0 ? r : null)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open, step.spot])

  if (!open) return null

  const goTo = useCosmos.getState().goTo
  const startTour = useCosmos.getState().startTour

  return (
    <div className={`guide ${step.try ? 'guide--try' : ''} ${rect ? 'guide--spot' : ''}`} role="dialog" aria-modal="false" aria-labelledby="guide-title">
      {!step.try && !rect && <div className="guide__dim" />}
      {rect && <div className="guide__spot" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />}
      <div className={`guide__card panel guide__card--${step.id}`} key={step.id}>
        <button className="icon-btn guide__close" onClick={finish} aria-label="Close guide">
          <IconClose />
        </button>
        <GuideArt kind={step.art} done={done} />
        <h2 className="guide__title" id="guide-title">
          {step.title}
        </h2>
        {step.body && <p className="guide__body">{step.body}</p>}
        {step.try && (
          <div className={`guide__try ${done ? 'is-done' : ''}`} aria-live="polite">
            {done ? (
              <>
                <IconCheck size={16} /> Nicely done
              </>
            ) : (
              'Try it now'
            )}
          </div>
        )}
        {step.id === 'go' && (
          <div className="guide__picks">
            {PICKS.map((p) => {
              const r = REALMS[p.id]
              return (
                <button
                  key={p.id}
                  className="pick"
                  style={{ ['--accent' as string]: r.accent }}
                  onClick={() => {
                    finish()
                    goTo(p.id)
                  }}
                >
                  <span className="pick__dot" />
                  <span className="pick__labels">
                    <span className="pick__name">
                      Visit {r.name} <span className="dev">{r.devanagari}</span>
                    </span>
                    <small>{p.line}</small>
                  </span>
                  <IconArrowRight size={16} />
                </button>
              )
            })}
          </div>
        )}
        <div className="guide__foot">
          <div className="guide__dots" aria-label={`Step ${i + 1} of ${steps.length}`}>
            {steps.map((s, k) => (
              <span key={s.id} className={k === i ? 'is-on' : k < i ? 'is-past' : ''} />
            ))}
          </div>
          <div className="guide__actions">
            {step.id === 'go' ? (
              <>
                <button className="btn-ghost" onClick={finish}>
                  Explore on my own
                </button>
                <button
                  ref={primary}
                  className="btn-primary"
                  onClick={() => {
                    finish()
                    startTour()
                  }}
                >
                  <IconPlay size={14} /> Guided yātrā
                </button>
              </>
            ) : (
              <>
                {i === 0 ? (
                  <button className="btn-ghost" onClick={finish}>
                    Skip
                  </button>
                ) : (
                  <button className="btn-ghost" onClick={() => setI(i - 1)}>
                    Back
                  </button>
                )}
                <button ref={primary} className="btn-primary" onClick={next}>
                  {step.try && !done ? 'Skip step' : i === 0 ? 'Show me' : 'Next'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
