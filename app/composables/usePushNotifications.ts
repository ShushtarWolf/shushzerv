const PUSH_OPT_IN_KEY = 'shushzerv_push_opt_in'

export function usePushNotifications() {
  const enabled = ref(false)

  onMounted(() => {
    if (!import.meta.client) return
    enabled.value = localStorage.getItem(PUSH_OPT_IN_KEY) === '1'
    if (enabled.value) initPush()
  })

  function initPush() {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.catch(() => {})
  }

  async function setEnabled(value: boolean) {
    enabled.value = value
    if (import.meta.client) {
      localStorage.setItem(PUSH_OPT_IN_KEY, value ? '1' : '0')
    }
    if (value) initPush()
  }

  return { enabled, setEnabled }
}
