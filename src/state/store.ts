import { create } from 'zustand'
import { ORDER, TOUR, type RealmId } from '../data/realms'

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
}

export const useCosmos = create<CosmosState>((set, get) => ({
  current: 'brahmanda',
  traveling: true,
  requestId: 0,
  tour: false,
  tourIndex: 0,
  autoOrbit: true,
  sound: false,
  infoOpen: typeof window === 'undefined' || window.innerWidth > 860,
  navOpen: false,
  ready: false,

  goTo: (id, opts) =>
    set((s) => ({
      current: id,
      requestId: s.requestId + 1,
      tour: opts?.fromTour ? s.tour : false,
      navOpen: false,
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
  setInfoOpen: (v) => set({ infoOpen: v }),
  setNavOpen: (v) => set({ navOpen: v }),
  setReady: () => set({ ready: true }),
}))
