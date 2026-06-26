const PUSH_OPT_IN_KEY = 'inboxs_push_opt_in'

export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return
  if (localStorage.getItem(PUSH_OPT_IN_KEY) !== '1') return

  navigator.serviceWorker.ready.catch(() => {})
})
