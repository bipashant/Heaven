import { create } from 'zustand'
import { ORDER, TOUR, type RealmId } from '../data/realms'

/** Phone-sized layout: bottom dock and bottom sheets instead of side panels. */
export const isCompact = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches

interface CosmosState {
  current: RealmId
  traveling: boolean
  /** Bumped on every request so re-selecting the same realm re-frames the camera. */
  requestId: number
  tour: boolean
  tourIndex: number
  autoOrbit: boolean
  sound: boolean
  infoOpen: boolean
  navOpen: boolean
  ready: boolean
  /** First-visit / help guide */
  guideOpen: boolean
  goTo: (id: RealmId, opts?: { fromTour?: boolean }) => void
  step: (dir: 1 | -1) => void
  setTraveling: (v: boolean) => void
  startTour: () => void
  stopTour: () => void
  nextTourStop: () => void
  toggleAutoOrbit: () => void
  toggleSound: () => void
  setInfoOpen: (v: boolean) => void
  setNavOpen: (v: boolean) => void
  setReady: () => void
  setGuideOpen: (v: boolean) => void
}

export const useCosmos = create<CosmosState>((set, get) => ({
  current: 'brahmanda',
  traveling: true,
  requestId: 0,
  tour: false,
  tourIndex: 0,
  autoOrbit: true,
  sound: false,
  infoOpen: !isCompact(),
  navOpen: false,
  ready: false,
  guideOpen: false,

  goTo: (id, opts) =>
    set((s) => ({
      current: id,
      requestId: s.requestId + 1,
      tour: opts?.fromTour ? s.tour : false,
      navOpen: false,
      // on phones, close the story sheet so the journey is visible
      infoOpen: isCompact() ? false : s.infoOpen,
    })),

  step: (dir) => {
    const { current } = get()
    const i = ORDER.indexOf(current)
    // From the overview, “ascend” goes to the very top and “descend” to the very bottom.
    const next = i === -1 ? (dir === -1 ? 0 : ORDER.length - 1) : i + dir
    if (next < 0 || next >= ORDER.length) return
    get().goTo(ORDER[next])
  },

  setTraveling: (v) => set({ traveling: v }),

  startTour: () => {
    set({ tour: true, tourIndex: 0 })
    get().goTo(TOUR[0], { fromTour: true })
  },
  stopTour: () => set({ tour: false }),
  nextTourStop: () => {
    const { tourIndex } = get()
    const next = tourIndex + 1
    if (next >= TOUR.length) {
      set({ tour: false })
      return
    }
    set({ tourIndex: next })
    get().goTo(TOUR[next], { fromTour: true })
  },

  toggleAutoOrbit: () => set((s) => ({ autoOrbit: !s.autoOrbit })),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  setInfoOpen: (v) => set(v && isCompact() ? { infoOpen: true, navOpen: false } : { infoOpen: v }),
  setNavOpen: (v) => set(v && isCompact() ? { navOpen: true, infoOpen: false } : { navOpen: v }),
  setReady: () => set({ ready: true }),
  setGuideOpen: (v) => set({ guideOpen: v }),
}))
