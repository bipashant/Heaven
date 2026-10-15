import { useEffect, useRef, useState } from 'react'
import { GROUPS, ORDER, REALMS, TOUR, type RealmId } from '../data/realms'
import { useCosmos } from '../state/store'
import { drone } from '../audio/drone'
import { IconClose, IconDown, IconEgg, IconInfo, IconList, IconMute, IconOrbit, IconPlay, IconSound, IconStop, IconUp } from './icons'

// ---------------------------------------------------------------------------
// Navigator: the cosmic axis, top to bottom.
// ---------------------------------------------------------------------------

function Navigator() {
  const current = useCosmos((s) => s.current)
  const goTo = useCosmos((s) => s.goTo)
  const navOpen = useCosmos((s) => s.navOpen)
  const setNavOpen = useCosmos((s) => s.setNavOpen)
  return (
    <nav className={`nav panel ${navOpen ? 'is-open' : ''}`} aria-label="Realms">
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
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [current])

  if (!open) {
    return (
      <button className="info-tab panel" onClick={() => setOpen(true)} style={{ ['--accent' as string]: r.accent }}>
        <IconInfo size={16} /> About {r.name}
      </button>
    )
  }

  return (
    <aside className="info panel" style={{ ['--accent' as string]: r.accent }} aria-live="polite">
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
        <button className="icon-btn mobile-only" onClick={() => s.setNavOpen(!s.navOpen)} aria-label="Realm list" title="Realm list">
          <IconList />
        </button>
        <button className={`tool ${s.tour ? 'is-on' : ''}`} onClick={() => (s.tour ? s.stopTour() : s.startTour())} title="Guided yātrā through the worlds">
          {s.tour ? <IconStop size={16} /> : <IconPlay size={16} />}
          <span>{s.tour ? `Yātrā ${s.tourIndex + 1}/${TOUR.length}` : 'Yātrā tour'}</span>
        </button>
        <button className="icon-btn" onClick={() => s.goTo('brahmanda')} aria-label="Cosmic overview" title="Cosmic overview (Esc)">
          <IconEgg />
        </button>
        <button className={`icon-btn ${s.autoOrbit ? 'is-on' : ''}`} onClick={s.toggleAutoOrbit} aria-label="Auto orbit" aria-pressed={s.autoOrbit} title="Slowly circle the view">
          <IconOrbit />
        </button>
        <button className={`icon-btn ${s.sound ? 'is-on' : ''}`} onClick={s.toggleSound} aria-label="Sound" aria-pressed={s.sound} title="Tanpura drone">
          {s.sound ? <IconSound /> : <IconMute />}
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

function Hint() {
  const [show, setShow] = useState(true)
  const traveling = useCosmos((s) => s.traveling)
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 16000)
    return () => clearTimeout(t)
  }, [])
  if (!show || traveling) return null
  return (
    <div className="hint panel" onClick={() => setShow(false)}>
      Drag to orbit · Scroll to zoom · ↑ ↓ to move between worlds · Click a name to travel
    </div>
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
      } else if (e.key === 'Escape') s.goTo('brahmanda')
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
      <Navigator />
      <InfoPanel />
      <StepControls />
      <TravelOverlay />
      <Hint />
      <Loader />
    </div>
  )
}
