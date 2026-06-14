<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number
    prefix?: string
    suffix?: string
    duration?: number
    decimals?: number
  }>(),
  { prefix: '', suffix: '', duration: 1200, decimals: 0 },
)

const { locale } = useI18n()
const display = ref(0)
const el = ref<HTMLElement | null>(null)

function format(n: number) {
  const rounded = props.decimals > 0 ? n : Math.round(n)
  return new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  }).format(rounded)
}

function animate() {
  const reduce = import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    display.value = props.value
    return
  }
  const start = performance.now()
  const from = 0
  function tick(now: number) {
    const t = Math.min((now - start) / props.duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = from + (props.value - from) * eased
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  if (!el.value) return animate()
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        animate()
        obs.disconnect()
      }
    },
    { threshold: 0.4 },
  )
  obs.observe(el.value)
})
</script>

<template>
  <span ref="el" class="sz-stat" dir="ltr">{{ prefix }}{{ format(display) }}{{ suffix }}</span>
</template>
