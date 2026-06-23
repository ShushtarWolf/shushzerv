export function useDashboardChartLabels() {
  const { locale } = useI18n()

  function formatDayLabels(isoDates: string[]) {
    return isoDates.map((d) => {
      const date = new Date(`${d}T12:00:00`)
      return new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(date)
    })
  }

  function formatMonthLabels(yyyyMm: string[]) {
    return yyyyMm.map((m) => {
      const [y, mo] = m.split('-').map(Number)
      const date = new Date(y!, mo! - 1, 1)
      return new Intl.DateTimeFormat(locale.value, { month: 'short' }).format(date)
    })
  }

  const dowLabels = computed(() => {
    const sunday = new Date('2024-01-07T12:00:00')
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      return new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(d)
    })
  })

  return { formatDayLabels, formatMonthLabels, dowLabels }
}
