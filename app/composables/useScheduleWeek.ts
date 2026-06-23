export function useScheduleWeek(initialDate?: string) {
  const { locale } = useI18n()
  const { localDateISO, parseLocalDate } = useLocaleContent()

  const anchor = ref(initialDate ?? localDateISO())

  function startOfWeek(dateIso: string) {
    const d = parseLocalDate(dateIso)
    const day = d.getDay()
    const diff = locale.value === 'fa' ? (day + 1) % 7 : day
    d.setDate(d.getDate() - diff)
    return localDateISO(d)
  }

  const weekStart = computed(() => startOfWeek(anchor.value))

  const weekDays = computed(() => {
    const start = parseLocalDate(weekStart.value)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return localDateISO(d)
    })
  })

  const weekEnd = computed(() => weekDays.value[6] ?? weekStart.value)

  const weekLabel = computed(() => {
    const fmt = new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
    const start = parseLocalDate(weekStart.value)
    const end = parseLocalDate(weekEnd.value)
    return `${fmt.format(start)} – ${fmt.format(end)}`
  })

  function dayLabel(iso: string) {
    const d = parseLocalDate(iso)
    return new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
      weekday: 'short',
    }).format(d)
  }

  function dayNumber(iso: string) {
    const d = parseLocalDate(iso)
    return new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
      day: 'numeric',
    }).format(d)
  }

  function isToday(iso: string) {
    return iso === localDateISO()
  }

  function prevWeek() {
    const d = parseLocalDate(anchor.value)
    d.setDate(d.getDate() - 7)
    anchor.value = localDateISO(d)
  }

  function nextWeek() {
    const d = parseLocalDate(anchor.value)
    d.setDate(d.getDate() + 7)
    anchor.value = localDateISO(d)
  }

  function goToday() {
    anchor.value = localDateISO()
  }

  return {
    anchor,
    weekStart,
    weekEnd,
    weekDays,
    weekLabel,
    dayLabel,
    dayNumber,
    isToday,
    prevWeek,
    nextWeek,
    goToday,
  }
}
