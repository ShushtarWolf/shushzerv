const DEFAULT_SPORT_COLOR = '#ff5a1f'

export function useSportTheme() {
  const { color: pageColor } = useSelectedSportColor()

  function sportColor(sport?: { color?: string } | null, fallback = DEFAULT_SPORT_COLOR) {
    return sport?.color ?? fallback
  }

  function resolveAccent(sport?: { color?: string } | null, fallback = DEFAULT_SPORT_COLOR) {
    return pageColor.value ?? sportColor(sport, fallback)
  }

  function softBg(color: string, alpha = '22') {
    return `${color}${alpha}`
  }

  /** Flat tinted surface — no gradients */
  function surfaceBg(color: string, alpha = '14') {
    return `${color}${alpha}`
  }

  /** Solid hero / banner background */
  function heroBg(color: string) {
    return color
  }

  function cardVars(color?: string | null) {
    const c = color ?? DEFAULT_SPORT_COLOR
    return {
      '--sport-color': c,
      '--sport-soft': `${c}22`,
      '--sport-tint': `${c}18`,
    } as Record<string, string>
  }

  function darken(color: string, amount = 0.25) {
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.slice(0, 2), 16) * (1 - amount))
    const g = Math.max(0, parseInt(hex.slice(2, 4), 16) * (1 - amount))
    const b = Math.max(0, parseInt(hex.slice(4, 6), 16) * (1 - amount))
    return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
  }

  return { sportColor, resolveAccent, softBg, surfaceBg, heroBg, cardVars, darken, DEFAULT_SPORT_COLOR }
}
