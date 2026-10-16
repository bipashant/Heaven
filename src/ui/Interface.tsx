import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { GROUPS, ORDER, REALMS, TOUR, type RealmId } from '../data/realms'
import { isCompact, useCosmos } from '../state/store'
import { Guide } from './Guide'
import { drone } from '../audio/drone'
import { IconClose, IconDown, IconEgg, IconHelp, IconInfo, IconList, IconMute, IconOrbit, IconPlay, IconSound, IconStop, IconUp } from './icons'

// ---------------------------------------------------------------------------
// Phone layout helpers
// ---------------------------------------------------------------------------

function useCompact() {
  const [compact, setCompact] = useState(isCompact)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const on = () => setCompact(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return compact
}

/** Drag a bottom sheet down by its handle to dismiss it. */
function useSheetDrag(onClose: () => void) {
  const ref = useRef<HTMLElement>(null)
  const start = useRef<number | null>(null)
  const onPointerDown = (e: RPointerEvent) => {
    start.current = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: RPointerEvent) => {
    if (start.current === null || !ref.current) return
    const dy = Math.max(0, e.clientY - start.current)
    ref.current.style.transition = 'none'
    ref.current.style.transform = `translateY(${dy}px)`
  }
  const end = (e: RPointerEvent) => {
    if (start.current === null || !ref.current) return
    const dy = e.clientY - start.current
    start.current = null
    ref.current.style.transition = ''
    ref.current.style.transform = ''
    if (dy > 70) onClose()
  }
  return { ref, handle: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } }
}

function SheetHandle(props: ReturnType<typeof useSheetDrag>['handle']) {
  return (
    <div className="sheet-handle" {...props} aria-hidden="true">
      <span />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Navigator: the cosmic axis, top to bottom.
// ---------------------------------------------------------------------------

function Navigator() {
  const current = useCosmos((s) => s.current)
  const goTo = useCosmos((s) => s.goTo)
  const navOpen = useCosmos((s) => s.navOpen)
  const setNavOpen = useCosmos((s) => s.setNavOpen)
  const sheet = useSheetDrag(() => setNavOpen(false))
  useEffect(() => {
    if (!navOpen) return
    const el = sheet.ref.current?.querySelector('.nav__item.is-active')
    el?.scrollIntoView({ block: 'center' })
  }, [navOpen, sheet.ref])
  return (
    <nav ref={sheet.ref as React.RefObject<HTMLElement>} className={`nav panel ${navOpen ? 'is-open' : ''}`} aria-label="Realms">
      <SheetHandle {...sheet.handle} />
      <div className="nav__head">
        <span className="eyebrow">Choose a destination</span>
        <button className="icon-btn nav__close" onClick={() => setNavOpen(false)} aria-label="Close list">
          <IconClose />
        </button>
      </div>
      <button className={`nav__item nav__item--cosmos ${current === 'brahmanda' ? 'is-active' : ''}`} onClick={() => goTo('brahmanda')}>
        <span className="nav__dot" style={{ ['--accent' as string]: REALMS.brahmanda.accent }} />
        <span className="nav__labels">
          <span className="nav__name">
            The whole cosmos <span className="dev">ब्रह्माण्ड</span>
          </span>
          <span className="nav__epithet">View the cosmic egg from outside</span>
        </span>
      </button>
      <div className="nav__scroll">
        {GROUPS.map((g) => (
          <section key={g.id} className="nav__group">
            <h3 className="nav__group-title">
              {g.title} <small>{g.subtitle}</small>
            </h3>
            <ul>
              {ORDER.filter((id) => REALMS[id].group === g.id).map((id) => {
                const r = REALMS[id]
                return (
                  <li key={id}>
                    <button className={`nav__item ${current === id ? 'is-active' : ''}`} onClick={() => goTo(id)} aria-current={current === id ? 'true' : undefined}>
                      <span className="nav__dot" style={{ ['--accent' as string]: r.accent }} />
                      <span className="nav__labels">
                        <span className="nav__name">
                          {r.name} <span className="dev">{r.devanagari}</span>
                        </span>
                        <span className="nav__epithet">{r.epithet}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Info panel
// ---------------------------------------------------------------------------

function InfoPanel() {
  const current = useCosmos((s) => s.current)
  const open = useCosmos((s) => s.infoOpen)
  const setOpen = useCosmos((s) => s.setInfoOpen)
  const r = REALMS[current]
  const bodyRef = useRef<HTMLDivElement>(null)
  const sheet = useSheetDrag(() => setOpen(false))
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [current])

  return (
    <>
      {!open && (
        <button className="info-tab panel desktop-only" onClick={() => setOpen(true)} style={{ ['--accent' as string]: r.accent }}>
          <IconInfo size={16} /> About {r.name}
        </button>
      )}
    <aside
      ref={sheet.ref as React.RefObject<HTMLElement>}
      className={`info panel ${open ? 'is-open' : ''}`}
      style={{ ['--accent' as string]: r.accent }}
      aria-hidden={!open}
      aria-live="polite"
    >
      <SheetHandle {...sheet.handle} />
      <button className="icon-btn info__close" onClick={() => setOpen(false)} aria-label="Hide details">
        <IconClose />
      </button>
      <div className="info__body" ref={bodyRef} key={current}>
        <span className="eyebrow">{r.tier}</span>
        <h1 className="info__title">{r.name}</h1>
        <div className="info__dev">{r.devanagari}</div>
        <div className="info__iast">
          {r.iast} · <em>{r.epithet}</em>
        </div>

        <div className="chips">
          {r.deities.map((d) => (
            <span className="chip" key={d}>
              {d}
            </span>
          ))}
        </div>

        {r.description.map((p, i) => (
          <p key={i} className="info__p">
            {p}
          </p>
        ))}

        <ul className="facts">
          {r.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        {r.verse && (
          <figure className="verse">
            <blockquote>
              <p className="verse__dev">{r.verse.devanagari}</p>
              <p className="verse__iast">{r.verse.iast}</p>
              <p className="verse__tr">“{r.verse.translation}”</p>
            </blockquote>
            <figcaption>— {r.verse.source}</figcaption>
          </figure>
        )}
        {r.textNote && (
          <figure className="verse verse--note">
            <blockquote>
              <p className="verse__tr">{r.textNote.text}</p>
            </blockquote>
            <figcaption>— {r.textNote.source}</figcaption>
          </figure>
        )}
        <p className="disclaimer">
          A conceptual visualisation. Purāṇic cosmology is described differently across texts and traditions; deities are shown as
          reverent forms of light, not as portraits.
        </p>
      </div>
    </aside>
    </>
  )
}

// ---------------------------------------------------------------------------
// Top bar & bottom controls
// ---------------------------------------------------------------------------

function TopBar() {
  const s = useCosmos()
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand__om" aria-hidden="true">
          ॐ
        </span>
        <div>
          <div className="brand__title">
            Brahmāṇḍa <span className="dev">ब्रह्माण्ड</span>
          </div>
          <div className="brand__sub">A journey through the Purāṇic cosmos</div>
        </div>
      </div>
      <div className="toolbar panel" role="toolbar" aria-label="View controls">
        <button className={`tool ${s.tour ? 'is-on' : ''}`} onClick={() => (s.tour ? s.stopTour() : s.startTour())} title="Guided yātrā through the worlds">
          {s.tour ? <IconStop size={16} /> : <IconPlay size={16} />}
          <span>{s.tour ? `Yātrā ${s.tourIndex + 1}/${TOUR.length}` : 'Yātrā tour'}</span>
        </button>
        <button className="icon-btn desktop-only" onClick={() => s.goTo('brahmanda')} aria-label="Cosmic overview" title="Cosmic overview (Esc)">
          <IconEgg />
        </button>
        <button className={`icon-btn ${s.autoOrbit ? 'is-on' : ''}`} onClick={s.toggleAutoOrbit} aria-label="Auto orbit" aria-pressed={s.autoOrbit} title="Slowly circle the view">
          <IconOrbit />
        </button>
        <button className={`icon-btn ${s.sound ? 'is-on' : ''}`} onClick={s.toggleSound} aria-label="Sound" aria-pressed={s.sound} title="Tanpura drone">
          {s.sound ? <IconSound /> : <IconMute />}
        </button>
        <button className={`icon-btn ${s.guideOpen ? 'is-on' : ''}`} onClick={() => s.setGuideOpen(!s.guideOpen)} aria-label="How to explore" title="How to explore">
          <IconHelp />
        </button>
      </div>
    </header>
  )
}

function neighbour(current: RealmId, dir: 1 | -1): RealmId | null {
  const i = ORDER.indexOf(current)
  const j = i === -1 ? (dir === -1 ? 0 : ORDER.length - 1) : i + dir
  return j >= 0 && j < ORDER.length ? ORDER[j] : null
}

function StepControls() {
  const current = useCosmos((s) => s.current)
  const step = useCosmos((s) => s.step)
  const up = neighbour(current, -1)
  const down = neighbour(current, 1)
  return (
    <div className="stepper">
      <button className="step panel" disabled={!up} onClick={() => step(-1)} title="Ascend (↑)">
        <IconUp size={16} />
        <span>
          <small>Ascend</small>
          {up ? REALMS[up].name : '—'}
        </span>
      </button>
      <button className="step panel" disabled={!down} onClick={() => step(1)} title="Descend (↓)">
        <IconDown size={16} />
        <span>
          <small>Descend</small>
          {down ? REALMS[down].name : '—'}
        </span>
      </button>
    </div>
  )
}

function TravelOverlay() {
  const traveling = useCosmos((s) => s.traveling)
  const ready = useCosmos((s) => s.ready)
  const current = useCosmos((s) => s.current)
  const r = REALMS[current]
  return (
    <div className={`travel ${traveling && ready ? 'is-on' : ''}`} aria-hidden={!traveling}>
      <span className="eyebrow">Journeying to</span>
      <div className="travel__dev">{r.devanagari}</div>
      <div className="travel__name">{r.name}</div>
    </div>
  )
}

function Loader() {
  const ready = useCosmos((s) => s.ready)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setGone(true), 1600)
    return () => clearTimeout(t)
  }, [ready])
  if (gone) return null
  return (
    <div className={`loader ${ready ? 'is-done' : ''}`}>
      <div className="loader__om">ॐ</div>
      <div className="loader__text">Shaping the fourteen worlds…</div>
    </div>
  )
}

/** Phone navigation, within thumb reach. */
function Dock() {
  const current = useCosmos((s) => s.current)
  const step = useCosmos((s) => s.step)
  const goTo = useCosmos((s) => s.goTo)
  const navOpen = useCosmos((s) => s.navOpen)
  const infoOpen = useCosmos((s) => s.infoOpen)
  const setNavOpen = useCosmos((s) => s.setNavOpen)
  const setInfoOpen = useCosmos((s) => s.setInfoOpen)
  const r = REALMS[current]
  const up = neighbour(current, -1)
  const down = neighbour(current, 1)
  return (
    <nav className="dock panel" aria-label="Navigation">
      <button className={`dock__btn ${navOpen ? 'is-on' : ''}`} onClick={() => setNavOpen(!navOpen)} aria-expanded={navOpen}>
        <IconList size={20} />
        <span>Worlds</span>
      </button>
      <button className="dock__btn" disabled={!up} onClick={() => step(-1)} aria-label={up ? `Ascend to ${REALMS[up].name}` : 'Already at the top'}>
        <IconUp size={20} />
        <span>Up</span>
      </button>
      <button
        className={`dock__here ${infoOpen ? 'is-on' : ''}`}
        style={{ ['--accent' as string]: r.accent }}
        onClick={() => setInfoOpen(!infoOpen)}
        aria-expanded={infoOpen}
        aria-label={`About ${r.name}`}
      >
        <span className="dock__dot" />
        <span className="dock__labels">
          <span className="dock__dev">{r.devanagari}</span>
          <span className="dock__name">{r.name}</span>
        </span>
        <IconInfo size={16} />
      </button>
      <button className="dock__btn" disabled={!down} onClick={() => step(1)} aria-label={down ? `Descend to ${REALMS[down].name}` : 'Already at the bottom'}>
        <IconDown size={20} />
        <span>Down</span>
      </button>
      <button className={`dock__btn ${current === 'brahmanda' ? 'is-on' : ''}`} onClick={() => goTo('brahmanda')} aria-label="Cosmic overview">
        <IconEgg size={20} />
        <span>Cosmos</span>
      </button>
    </nav>
  )
}

/** A short card naming the world you have just arrived in. */
function ArrivalCard() {
  const traveling = useCosmos((s) => s.traveling)
  const ready = useCosmos((s) => s.ready)
  const current = useCosmos((s) => s.current)
  const infoOpen = useCosmos((s) => s.infoOpen)
  const guideOpen = useCosmos((s) => s.guideOpen)
  const setInfoOpen = useCosmos((s) => s.setInfoOpen)
  const [show, setShow] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (!ready || traveling) {
      setShow(false)
      return
    }
    if (first.current) {
      first.current = false
      return
    }
    const s = useCosmos.getState()
    if (s.infoOpen || s.guideOpen) return
    setShow(true)
    const t = setTimeout(() => setShow(false), 5200)
    return () => clearTimeout(t)
  }, [ready, traveling, current])
  const r = REALMS[current]
  const visible = show && !infoOpen && !guideOpen && !traveling
  return (
    <button
      className={`arrival panel ${visible ? 'is-on' : ''}`}
      style={{ ['--accent' as string]: r.accent }}
      onClick={() => setInfoOpen(true)}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <span className="arrival__eyebrow">You are in</span>
      <span className="arrival__name">
        {r.name} <span className="dev">{r.devanagari}</span>
      </span>
      <span className="arrival__epithet">{r.epithet}</span>
      <span className="arrival__cta">
        Read its story <IconInfo size={14} />
      </span>
    </button>
  )
}

/** First time you hit a realm's zoom limit, hints that zooming out again returns to the cosmos. */
function EdgeHint() {
  const nudge = useCosmos((s) => s.boundaryNudge)
  const current = useCosmos((s) => s.current)
  const [show, setShow] = useState(false)
  const prev = useRef(nudge)
  useEffect(() => {
    if (nudge === prev.current) return
    prev.current = nudge
    if (current === 'brahmanda') return
    // skip if the arrival card is already showing, so they don't overlap
    if (document.querySelector('.arrival.is-on')) return
    setShow(true)
    const t = setTimeout(() => setShow(false), 3200)
    return () => clearTimeout(t)
  }, [nudge, current])
  return (
    <div className={`edge-hint panel ${show ? 'is-on' : ''}`} aria-hidden={!show}>
      Keep zooming out to return to the cosmic view
    </div>
  )
}

function SheetBackdrop() {
  const compact = useCompact()
  const navOpen = useCosmos((s) => s.navOpen)
  const infoOpen = useCosmos((s) => s.infoOpen)
  const on = compact && (navOpen || infoOpen)
  return (
    <div
      className={`sheet-backdrop ${on ? 'is-on' : ''}`}
      onClick={() => {
        const s = useCosmos.getState()
        s.setNavOpen(false)
        s.setInfoOpen(false)
      }}
      aria-hidden="true"
    />
  )
}

// ---------------------------------------------------------------------------
// Behaviours: tour timing, keyboard, sound
// ---------------------------------------------------------------------------

function useBehaviours() {
  const tour = useCosmos((s) => s.tour)
  const traveling = useCosmos((s) => s.traveling)
  const tourIndex = useCosmos((s) => s.tourIndex)
  const sound = useCosmos((s) => s.sound)
  const current = useCosmos((s) => s.current)

  useEffect(() => {
    if (!tour || traveling) return
    const t = setTimeout(() => useCosmos.getState().nextTourStop(), tourIndex === 0 ? 7000 : 11000)
    return () => clearTimeout(t)
  }, [tour, traveling, tourIndex])

  useEffect(() => {
    if (sound) drone.start()
    else drone.stop()
  }, [sound])

  useEffect(() => {
    drone.setTone(REALMS[current].tone)
  }, [current])

  useEffect(() => {
    if (!traveling && sound) drone.bell()
  }, [traveling, sound])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      const s = useCosmos.getState()
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        s.step(-1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        s.step(1)
      } else if (e.key === 'Escape') {
        if (s.guideOpen) s.setGuideOpen(false)
        else if (s.navOpen && isCompact()) s.setNavOpen(false)
        else if (s.infoOpen && isCompact()) s.setInfoOpen(false)
        else s.goTo('brahmanda')
      }
      else if (e.key.toLowerCase() === 'i') s.setInfoOpen(!s.infoOpen)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export function Interface() {
  useBehaviours()
  return (
    <div className="ui">
      <TopBar />
      <SheetBackdrop />
      <Navigator />
      <InfoPanel />
      <StepControls />
      <Dock />
      <ArrivalCard />
      <EdgeHint />
      <TravelOverlay />
      <Guide />
      <Loader />
    </div>
  )
}
