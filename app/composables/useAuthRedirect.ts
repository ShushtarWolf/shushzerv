export interface BookingIntent {
  slotId: string
  courtId?: string
  date?: string
  payWithWallet?: boolean
  playerCount?: number
  createMatchAfterBook?: boolean
  equipment?: Record<string, number>
}

const BOOKING_INTENT_KEY = 'sz-booking-intent'

function isSafeRedirect(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

export function useAuthRedirect() {
  const route = useRoute()
  const localePath = useLocalePath()

  function redirectQuery(redirectPath?: string) {
    const target = redirectPath ?? route.fullPath
    return isSafeRedirect(target) ? { redirect: target } : {}
  }

  function loginPath(redirectPath?: string) {
    return {
      path: localePath('/login'),
      query: redirectQuery(redirectPath),
    }
  }

  function registerPath(redirectPath?: string) {
    return {
      path: localePath('/register'),
      query: redirectQuery(redirectPath),
    }
  }

  function requireLogin(redirectPath?: string) {
    return navigateTo(loginPath(redirectPath))
  }

  function resolvePostAuthRedirect(fallback?: string) {
    const fb = fallback ?? localePath('/dashboard')
    const raw = route.query.redirect
    const path = Array.isArray(raw) ? raw[0] : raw
    return isSafeRedirect(path) ? path : fb
  }

  function saveBookingIntent(intent: BookingIntent) {
    if (!import.meta.client) return
    sessionStorage.setItem(BOOKING_INTENT_KEY, JSON.stringify(intent))
  }

  function peekBookingIntent(): BookingIntent | null {
    if (!import.meta.client) return null
    const raw = sessionStorage.getItem(BOOKING_INTENT_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as BookingIntent
    } catch {
      return null
    }
  }

  function consumeBookingIntent(): BookingIntent | null {
    const intent = peekBookingIntent()
    if (intent && import.meta.client) sessionStorage.removeItem(BOOKING_INTENT_KEY)
    return intent
  }

  return {
    redirectQuery,
    loginPath,
    registerPath,
    requireLogin,
    resolvePostAuthRedirect,
    saveBookingIntent,
    peekBookingIntent,
    consumeBookingIntent,
  }
}
