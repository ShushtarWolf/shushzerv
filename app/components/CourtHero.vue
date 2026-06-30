<script setup lang="ts">
import type { Sport } from '~/types'
import { lerp, easeOutCubic, easeInOutCubic, useScrollProgress } from '~/composables/useScrollProgress'

const props = defineProps<{
  sports: Sport[]
}>()

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const { progress } = useScrollProgress(sectionRef)

const prefersReducedMotion = ref(false)

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const scrollHeight = computed(() => (prefersReducedMotion.value ? 'auto' : 'min(380vh, 3000px)'))

const introOpacity = computed(() => {
  const p = progress.value
  if (p < 0.1) return easeOutCubic(p / 0.1)
  return lerp(1, 0, easeInOutCubic(Math.max(0, (p - 0.32) / 0.22)))
})

const headlineY = computed(() => lerp(0, -28, easeInOutCubic(Math.min(progress.value / 0.45, 1))))

const midCaptionOpacity = computed(() => {
  const p = progress.value
  if (p < 0.3 || p > 0.68) return 0
  if (p < 0.42) return easeOutCubic((p - 0.3) / 0.12)
  return lerp(1, 0, easeInOutCubic((p - 0.55) / 0.13))
})

const searchOpacity = computed(() => {
  if (prefersReducedMotion.value) return 1
  return easeOutCubic(Math.max(0, (progress.value - 0.68) / 0.32))
})

const searchY = computed(() => lerp(48, 0, searchOpacity.value))
const searchScale = computed(() => lerp(0.94, 1, searchOpacity.value))

const scrollHintOpacity = computed(() => lerp(1, 0, easeInOutCubic(Math.min(progress.value / 0.12, 1))))
</script>

<template>
  <section
    ref="sectionRef"
    class="court-hero relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2"
    :class="prefersReducedMotion ? 'min-h-0' : ''"
    :style="prefersReducedMotion ? undefined : { minHeight: scrollHeight }"
    aria-label="Tennis court showcase"
  >
    <div
      class="relative w-full overflow-hidden bg-[#0a0c10]"
      :class="prefersReducedMotion ? '' : 'sticky top-0 h-[100dvh]'"
    >
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#1a2332_0%,#0a0c10_68%)]" />
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />

      <ClientOnly>
        <TennisCourtIsometricScene v-if="!prefersReducedMotion" :progress="progress" />
        <template #fallback>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="h-10 w-10 animate-pulse rounded-full border-2 border-white/15 border-t-emerald-300/80" />
          </div>
        </template>
      </ClientOnly>

      <!-- Static fallback for reduced motion -->
      <div
        v-if="prefersReducedMotion"
        class="pointer-events-none absolute inset-0 flex items-center justify-center px-6 pt-8"
      >
        <img
          src="/images/tennis-court-isometric.jpg"
          alt=""
          class="max-h-[52vh] w-full max-w-3xl object-contain"
        >
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 top-[10%] z-10 px-5 text-center sm:top-[12%] md:px-10"
        :style="{ opacity: introOpacity, transform: `translateY(${headlineY}px)` }"
      >
        <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-300/90 sm:text-xs">
          {{ t('courtHero.eyebrow') }}
        </p>
        <h1 class="mx-auto max-w-4xl text-[2.1rem] font-bold leading-[1.06] tracking-tight text-white sm:text-5xl md:text-[3.25rem] lg:text-6xl">
          {{ t('courtHero.title') }}
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-sm text-white/68 sm:text-lg md:text-xl">
          {{ t('courtHero.subtitle') }}
        </p>
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 bottom-[30%] z-10 px-6 text-center sm:bottom-[28%]"
        :style="{ opacity: midCaptionOpacity }"
      >
        <p class="text-xs font-medium uppercase tracking-[0.24em] text-white/45 sm:text-sm">
          {{ t('courtHero.zoomCaption') }}
        </p>
      </div>

      <div
        class="absolute inset-x-0 bottom-0 z-20 px-4 pb-6 pt-16 sm:px-6 sm:pb-8"
        :style="{
          opacity: searchOpacity,
          transform: `translateY(${searchY}px) scale(${searchScale})`,
        }"
      >
        <div
          class="mx-auto max-w-5xl"
          :class="{ 'pointer-events-none': searchOpacity < 0.35 }"
        >
          <HeroSearch embedded :sports="sports" />
        </div>
      </div>

      <div
        v-if="!prefersReducedMotion"
        class="pointer-events-none absolute inset-x-0 bottom-[42%] z-10 flex flex-col items-center gap-2 sm:bottom-[38%]"
        :style="{ opacity: scrollHintOpacity }"
      >
        <span class="text-[10px] font-medium uppercase tracking-[0.22em] text-white/35 sm:text-[11px]">
          {{ t('courtHero.scrollHint') }}
        </span>
        <div class="h-9 w-5 rounded-full border border-white/20 p-1">
          <div class="mx-auto h-2 w-1 animate-bounce rounded-full bg-emerald-200/70" />
        </div>
      </div>

      <p class="pointer-events-none absolute bottom-2 end-3 z-10 text-[9px] text-white/25 sm:text-[10px]">
        <a
          href="http://www.freepik.com"
          target="_blank"
          rel="noopener noreferrer"
          class="pointer-events-auto hover:text-white/45"
        >
          {{ t('courtHero.attribution') }}
        </a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.court-hero {
  isolation: isolate;
}
</style>
