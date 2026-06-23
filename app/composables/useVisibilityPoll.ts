export function useVisibilityPoll(refresh: () => void | Promise<void>, intervalMs = 8000) {
  onMounted(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const run = () => {
      void refresh()
    }

    const start = () => {
      if (timer) return
      timer = setInterval(run, intervalMs)
    }

    const stop = () => {
      if (!timer) return
      clearInterval(timer)
      timer = null
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        run()
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)

    onUnmounted(() => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    })
  })
}
