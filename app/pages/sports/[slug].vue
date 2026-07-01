<script setup lang="ts">
import type { Club, Coach, Sport } from '~/types'

const { t } = useI18n()
const { formatNumber } = useLocaleContent()
const localePath = useLocalePath()
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: sports, status } = await useApiFetch<Sport[]>('/api/sports')
const sport = computed(() => sports.value?.find((s) => s.slug === slug.value))

watchEffect(() => {
  if (status.value === 'success' && sports.value && !sport.value) {
    throw createError({ statusCode: 404, statusMessage: 'Sport not found' })
  }
})

const { data: clubs } = await useApiFetch<Club[]>('/api/clubs', {
  query: computed(() => ({ sport: slug.value })),
})
const { data: coaches } = await useApiFetch<Coach[]>('/api/coaches', {
  query: computed(() => ({ sport: slug.value })),
})

useHead({ title: () => (sport.value ? t(`sport.${slug.value}.name`) : slug.value) })

const steps = ['pick', 'book', 'play'] as const
const { sync } = useSelectedSportColor()
watch(
  [sport, sports],
  () => sync(sports.value, sport.value?.slug ?? ''),
  { immediate: true },
)
</script>

<template>
  <div v-if="sport" class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <BackLink to="/explore" />

    <section class="mb-10 overflow-hidden rounded-ios-xl bg-brand-primary p-8 text-white shadow-lifted">
      <span class="inline-flex text-white">
        <SportIcon :slug="sport.slug" size="xl" />
      </span>
      <h1 class="sz-display mt-4 text-white">{{ t(`sport.${slug}.headline`) }}</h1>
      <p class="mt-3 max-w-xl text-lg text-white/90">{{ t(`sport.${slug}.desc`) }}</p>
      <SzButton :to="localePath(`/clubs?sport=${slug}`)" class="mt-6" variant="secondary">
        {{ t('sportLanding.cta') }}
      </SzButton>
    </section>

    <section class="mb-10">
      <SzSection :title="t('sportLanding.howTitle')" />
      <div class="sz-stagger grid gap-4 md:grid-cols-3">
        <div v-for="(step, i) in steps" :key="step" class="ios-card ios-card-hover p-5">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-lg font-black text-white">{{ formatNumber(i + 1) }}</span>
          <h3 class="mt-3 font-extrabold">{{ t(`sportLanding.steps.${step}.title`) }}</h3>
          <p class="mt-2 text-sm text-brand-gray-600">{{ t(`sportLanding.steps.${step}.desc`) }}</p>
        </div>
      </div>
    </section>

    <SzSection :title="t('clubs.title')" :to="localePath(`/clubs?sport=${slug}`)" :link-text="t('clubs.viewAll')" />
    <div class="mb-10 sz-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ClubCard v-for="club in clubs" :key="club.id" :club="club" />
    </div>
    <SzEmptyState
      v-if="!clubs?.length"
      class="mb-10"
      :message="t('common.noResults')"
      :action-label="t('common.browseClubs')"
      :action-to="localePath(`/clubs?sport=${slug}`)"
    />

    <SzSection :title="t('coaches.title')" :to="localePath('/coaches')" :link-text="t('coaches.viewAll')" />
    <div class="sz-stagger grid gap-3 sm:grid-cols-2">
      <CoachCard v-for="coach in coaches" :key="coach.id" :coach="coach" />
    </div>
    <SzEmptyState
      v-if="!coaches?.length"
      :message="t('common.noResults')"
      :action-label="t('common.browseCoaches')"
      :action-to="localePath('/coaches')"
    />

    <div class="mt-10">
      <FaqAccordion />
    </div>
    <div class="mt-10">
      <CtaBanner />
    </div>
  </div>
</template>
