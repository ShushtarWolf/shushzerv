import { BRAND_PRIMARY, palette } from '#shared/palette'

export function useSportTheme() {
  const accent = BRAND_PRIMARY

  function softBg(color: string = accent, alpha = '22') {
    return `${color}${alpha}`
  }

  function surfaceBg(color: string = accent, alpha = '14') {
    return `${color}${alpha}`
  }

  function cardVars(color: string = accent) {
    return {
      '--sport-color': color,
      '--sport-soft': `${color}22`,
      '--sport-tint': `${color}18`,
    } as Record<string, string>
  }

  function darken(color: string, amount = 0.25) {
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.slice(0, 2), 16) * (1 - amount))
    const g = Math.max(0, parseInt(hex.slice(2, 4), 16) * (1 - amount))
    const b = Math.max(0, parseInt(hex.slice(4, 6), 16) * (1 - amount))
    return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
  }

  return {
    accent,
    softBg,
    surfaceBg,
    cardVars,
    darken,
    palette,
    BRAND_PRIMARY,
    DEFAULT_SPORT_COLOR: BRAND_PRIMARY,
  }
}
