<script setup lang="ts">
import { lerp, easeOutCubic, easeInOutCubic, useScrollProgress } from '~/composables/useScrollProgress'

const { t } = useI18n()
const localePath = useLocalePath()
const sectionRef = ref<HTMLElement | null>(null)
const { progress } = useScrollProgress(sectionRef)

const prefersReducedMotion = ref(false)

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const scrollHeight = computed(() => (prefersReducedMotion.value ? '100vh' : 'min(420vh, 3200px)'))

const introOpacity = computed(() => {
  const t = progress.value
  if (t < 0.12) return easeOutCubic(t / 0.12)
  return lerp(1, 0, easeInOutCubic(Math.max(0, (t - 0.35) / 0.25)))
})

const headlineY = computed(() => lerp(0, -40, easeInOutCubic(Math.min(progress.value / 0.5, 1))))

const midCaptionOpacity = computed(() => {
  const t = progress.value
  if (t < 0.28 || t > 0.62) return 0
  const inT = (t - 0.28) / 0.12
  const outT = (t - 0.5) / 0.12
  if (t < 0.4) return easeOutCubic(inT)
  return lerp(1, 0, easeInOutCubic(outT))
})

const bgOpacity = computed(() => lerp(0.55, 0.08, easeInOutCubic(progress.value)))
const bgScale = computed(() => lerp(1.08, 1.22, progress.value))

const cardOpacity = computed(() => {
  if (prefersReducedMotion.value) return 1
  return easeOutCubic(Math.max(0, (progress.value - 0.72) / 0.28))
})

const cardScale = computed(() => lerp(0.88, 1, cardOpacity.value))
const cardY = computed(() => lerp(32, 0, cardOpacity.value))

const scrollHintOpacity = computed(() => lerp(1, 0, easeInOutCubic(Math.min(progress.value / 0.15, 1))))

const vignetteOpacity = computed(() => lerp(0.35, 0.65, progress.value))

function bookCourt() {
  navigateTo(localePath('/clubs?book=1&sport=padel'))
}
</script>

<template>
  <section
    ref="sectionRef"
    class="pitch-hero relative -mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] md:mx-0 md:w-full"
    :style="{ minHeight: scrollHeight }"
    aria-label="Padel court showcase"
  >
    <div class="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#050508]">
      <!-- Background photograph -->
      <div
        class="pointer-events-none absolute inset-0 bg-cover bg-center will-change-transform"
        :style="{
          backgroundImage: 'url(/images/hero-padel-court.jpg)',
          opacity: bgOpacity,
          transform: `scale(${bgScale})`,
        }"
      />

      <!-- Gradient overlays -->
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/90"
        :style="{ opacity: vignetteOpacity }"
      />
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050508_72%)]" />

      <!-- 3D scene -->
      <ClientOnly>
        <PadelPitchScene v-if="!prefersReducedMotion" :progress="progress" />
        <template #fallback>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="h-12 w-12 animate-pulse rounded-full border-2 border-white/20 border-t-white/80" />
          </div>
        </template>
      </ClientOnly>

      <!-- Intro copy -->
      <div
        class="pointer-events-none absolute inset-x-0 top-[12%] z-10 px-6 text-center sm:top-[14%] md:px-12"
        :style="{ opacity: introOpacity, transform: `translateY(${headlineY}px)` }"
      >
        <p class="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-lime-400/90 sm:text-sm">
          {{ t('pitchHero.eyebrow') }}
        </p>
        <h1 class="mx-auto max-w-4xl text-[2.4rem] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          {{ t('pitchHero.title') }}
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg md:text-xl">
          {{ t('pitchHero.subtitle') }}
        </p>
      </div>

      <!-- Mid-scroll caption -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-[22%] z-10 px-6 text-center"
        :style="{ opacity: midCaptionOpacity }"
      >
        <p class="text-sm font-medium uppercase tracking-[0.22em] text-white/50 sm:text-base">
          {{ t('pitchHero.zoomCaption') }}
        </p>
      </div>

      <!-- Reservation card (convergence target) -->
      <div
        class="absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-6"
        :style="{
          opacity: cardOpacity,
          transform: `translateY(${cardY}px) scale(${cardScale})`,
        }"
      >
        <div
          class="pitch-reserve-card w-full max-w-md rounded-ios-xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
          :class="{ 'pointer-events-none': cardOpacity < 0.4 }"
        >
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-lime-400">
                {{ t('pitchHero.cardEyebrow') }}
              </p>
              <h2 class="mt-1 text-2xl font-bold text-white sm:text-3xl">
                {{ t('pitchHero.cardTitle') }}
              </h2>
            </div>
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400/15 text-lime-300">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3M5 11h14M5 7a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
              </svg>
            </div>
          </div>

          <p class="mb-6 text-sm leading-relaxed text-white/65 sm:text-base">
            {{ t('pitchHero.cardBody') }}
          </p>

          <div class="mb-6 grid grid-cols-3 gap-3 text-center">
            <div class="rounded-xl bg-white/5 px-2 py-3">
              <p class="text-lg font-bold text-white">20m</p>
              <p class="text-[10px] uppercase tracking-wide text-white/45 sm:text-xs">{{ t('pitchHero.statLength') }}</p>
            </div>
            <div class="rounded-xl bg-white/5 px-2 py-3">
              <p class="text-lg font-bold text-white">10m</p>
              <p class="text-[10px] uppercase tracking-wide text-white/45 sm:text-xs">{{ t('pitchHero.statWidth') }}</p>
            </div>
            <div class="rounded-xl bg-white/5 px-2 py-3">
              <p class="text-lg font-bold text-white">3m</p>
              <p class="text-[10px] uppercase tracking-wide text-white/45 sm:text-xs">{{ t('pitchHero.statWalls') }}</p>
            </div>
          </div>

          <button
            type="button"
            class="w-full rounded-2xl bg-lime-400 px-5 py-3.5 text-sm font-bold text-black transition hover:bg-lime-300 active:scale-[0.98] sm:text-base"
            @click="bookCourt"
          >
            {{ t('pitchHero.cta') }}
          </button>
          <NuxtLink
            :to="localePath('/clubs')"
            class="mt-3 block text-center text-sm font-medium text-white/55 transition hover:text-white/80"
          >
            {{ t('pitchHero.secondary') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Scroll hint -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2"
        :style="{ opacity: scrollHintOpacity }"
      >
        <span class="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
          {{ t('pitchHero.scrollHint') }}
        </span>
        <div class="h-9 w-5 rounded-full border border-white/25 p-1">
          <div class="mx-auto h-2 w-1 animate-bounce rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pitch-hero {
  isolation: isolate;
}

.pitch-reserve-card {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 24px 80px -12px rgba(0, 0, 0, 0.65),
    0 0 60px -10px rgba(132, 204, 22, 0.15);
}
</style>
