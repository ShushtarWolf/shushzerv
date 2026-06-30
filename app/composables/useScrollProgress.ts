export function useScrollProgress(sectionRef: Ref<HTMLElement | null | undefined>) {
  const progress = ref(0)
  let raf = 0

  function update() {
    const el = sectionRef.value
    if (!el) return

    const scrollable = el.offsetHeight - window.innerHeight
    if (scrollable <= 0) {
      progress.value = 0
      return
    }

    const scrolled = -el.getBoundingClientRect().top
    progress.value = Math.min(1, Math.max(0, scrolled / scrollable))
  }

  function onScroll() {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
  })

  onUnmounted(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  })

  return { progress }
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}
