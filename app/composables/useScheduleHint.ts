const HINT_KEY = 'sz-schedule-hint-dismissed'

export function useScheduleHint() {
  const dismissed = ref(true)

  onMounted(() => {
    dismissed.value = localStorage.getItem(HINT_KEY) === '1'
  })

  function dismiss() {
    dismissed.value = true
    if (import.meta.client) localStorage.setItem(HINT_KEY, '1')
  }

  return { dismissed, dismiss }
}
