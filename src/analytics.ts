// PostHog runs only on the deployed site, never on a local machine: not in the
// dev server, not in `vite preview`, and not on localhost or LAN addresses.

const host = typeof window === 'undefined' ? '' : window.location.hostname

const isLocalHost =
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host === '::1' ||
  host === '[::1]' ||
  host.endsWith('.local') ||
  /^(10|127)\./.test(host) ||
  /^192\.168\./.test(host) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(host)

export const POSTHOG_ENABLED = import.meta.env.PROD && !isLocalHost && Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN)
