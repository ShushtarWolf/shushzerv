/**
 * Shushzerv design tokens — Navy + Lime (palette F).
 * Navy for brand surfaces; lime for CTAs, links, and highlights.
 */
export const palette = {
  brand: {
    primary: '#1E3A5F',
    primaryDark: '#152A45',
    primaryLight: '#3B5F8C',
    primarySoft: 'rgba(30, 58, 95, 0.10)',
    accent: '#84CC16',
    accentDark: '#65A30D',
    accentSoft: 'rgba(132, 204, 22, 0.12)',
    surface: ['#1E3A5F', '#3B5F8C', '#152A45', '#2A4A72'] as const,
  },
  gray: {
    50: '#F9FAFB',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  semantic: {
    success: '#65A30D',
    danger: '#DC2626',
    warning: '#D97706',
    info: '#3B5F8C',
  },
  schedule: {
    platformBooking: '#1E3A5F',
    clubBooking: '#3B5F8C',
    openSlot: '#78716C',
    class: '#1E3A5F',
    blocked: '#A8A29E',
    match: '#152A45',
    tournament: '#2A4A72',
    session: '#84CC16',
  },
} as const

export const BRAND_PRIMARY = palette.brand.primary
export const BRAND_ACCENT = palette.brand.accent

/** @deprecated Use BRAND_PRIMARY — kept for gradual migration */
export const DEFAULT_SPORT_COLOR = BRAND_PRIMARY

export function brandSurface(index: number) {
  const tones = palette.brand.surface
  return tones[index % tones.length]!
}

/** @deprecated No per-sport colors — returns brand primary for any sport key. */
export const SPORT_COLORS: Record<string, string> = new Proxy(
  {},
  { get: () => BRAND_PRIMARY },
)
