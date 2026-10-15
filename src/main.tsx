import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { useCosmos } from './state/store'

// Dev-only hook for automated visual checks.
if (import.meta.env.DEV) (window as unknown as { __cosmos: typeof useCosmos }).__cosmos = useCosmos

createRoot(document.getElementById('root')!).render(
  <App />,
)
