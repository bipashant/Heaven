// Minimal inline line icons (24×24, currentColor).
type P = { size?: number }
const S = ({ size = 18, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)
export const IconUp = (p: P) => <S {...p}><path d="M12 19V5M6 11l6-6 6 6" /></S>
export const IconDown = (p: P) => <S {...p}><path d="M12 5v14M6 13l6 6 6-6" /></S>
export const IconEgg = (p: P) => <S {...p}><path d="M12 3c-4 0-7 6-7 11a7 7 0 0 0 14 0c0-5-3-11-7-11z" /></S>
export const IconPlay = (p: P) => <S {...p}><path d="M7 5l12 7-12 7z" /></S>
export const IconStop = (p: P) => <S {...p}><rect x="6" y="6" width="12" height="12" rx="1.5" /></S>
export const IconOrbit = (p: P) => <S {...p}><ellipse cx="12" cy="12" rx="9" ry="4" /><circle cx="12" cy="12" r="2" /></S>
export const IconSound = (p: P) => <S {...p}><path d="M4 10v4h4l5 4V6L8 10H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></S>
export const IconMute = (p: P) => <S {...p}><path d="M4 10v4h4l5 4V6L8 10H4z" /><path d="M17 9l5 6M22 9l-5 6" /></S>
export const IconInfo = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></S>
export const IconClose = (p: P) => <S {...p}><path d="M6 6l12 12M18 6L6 18" /></S>
export const IconList = (p: P) => <S {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></S>
