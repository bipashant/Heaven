import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { PostHogProvider } from '@posthog/react'
import App from './App'
import { POSTHOG_ENABLED } from './analytics'
import './styles.css'
import { useCosmos } from './state/store'

// Dev-only hook for automated visual checks.
if (import.meta.env.DEV) (window as unknown as { __cosmos: typeof useCosmos }).__cosmos = useCosmos

const posthogOptions = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-05-30',
  session_recording: {
    captureCanvas: {
      recordCanvas: true,
      canvasFps: 4,
      canvasQuality: '0.4',
    },
    canvasCapture: {
      resolutionScale: 0.6,
    },
  },
} as const

const app = (
  <>
    <App />
    <Analytics />
  </>
)

createRoot(document.getElementById('root')!).render(
  POSTHOG_ENABLED ? (
    <PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_PROJECT_TOKEN} options={posthogOptions}>
      {app}
    </PostHogProvider>
  ) : (
    app
  ),
)
