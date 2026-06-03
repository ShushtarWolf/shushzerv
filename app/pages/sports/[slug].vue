<script setup lang="ts">
import type { Club, Coach, Sport } from '~/types'

const { t } = useI18n()
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

useHead({
  title: () => (sport.value ? t(`sport.${slug.value}.name`) : slug.value),
})
</script>

<template>
  <div v-if="sport" class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <NuxtLink :to="localePath('/explore')" class="ios-footnote mb-4 inline-flex text-sz-blue">← {{ t('common.back') }}</NuxtLink>
    <div class="glass-panel mb-8 p-8">
      <span class="text-4xl">{{ sport.icon }}</span>
      <h1 class="ios-large-title mt-4">{{ t(`sport.${slug}.headline`) }}</h1>
      <p class="mt-2 text-lg text-sz-gray-600">{{ t(`sport.${slug}.desc`) }}</p>
    </div>

    <SectionHeader :title="t('clubs.title')" :to="localePath(`/clubs?sport=${slug}`)" :link-text="t('clubs.viewAll')" />
    <div class="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ClubCard v-for="club in clubs" :key="club.id" :club="club" />
    </div>
    <p v-if="!clubs?.length" class="ios-footnote mb-10">{{ t('common.noResults') }}</p>

    <SectionHeader :title="t('coaches.title')" :to="localePath('/coaches')" :link-text="t('coaches.viewAll')" />
    <div class="grid gap-3 sm:grid-cols-2">
      <CoachCard v-for="coach in coaches" :key="coach.id" :coach="coach" />
    </div>
    <p v-if="!coaches?.length" class="ios-footnote">{{ t('common.noResults') }}</p>

    <div class="mt-10">
      <CtaBanner />
    </div>
  </div>
</template>
