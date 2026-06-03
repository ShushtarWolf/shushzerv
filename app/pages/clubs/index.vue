<script setup lang="ts">
import type { Club, Sport } from '~/types'

const { t } = useI18n()
const route = useRoute()

useHead({ title: () => t('nav.clubs') })

const sportFilter = ref(String(route.query.sport ?? ''))
const cityFilter = ref(String(route.query.city ?? ''))
const q = ref(String(route.query.q ?? ''))

watch([sportFilter, cityFilter, q], () => {
  navigateTo({
    query: {
      ...(sportFilter.value ? { sport: sportFilter.value } : {}),
      ...(cityFilter.value ? { city: cityFilter.value } : {}),
      ...(q.value ? { q: q.value } : {}),
    },
    replace: true,
  })
})

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: clubs, pending } = await useApiFetch<Club[]>('/api/clubs', {
  query: computed(() => ({
    ...(sportFilter.value ? { sport: sportFilter.value } : {}),
    ...(cityFilter.value ? { city: cityFilter.value } : {}),
    ...(q.value ? { q: q.value } : {}),
  })),
})

const cities = ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز']
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-6">{{ t('nav.clubs') }}</h1>

    <div class="mb-6 flex flex-wrap gap-2">
      <button
        type="button"
        class="ios-segment-item tap-highlight"
        :class="{ 'ios-segment-item-active': !sportFilter }"
        @click="sportFilter = ''"
      >
        {{ t('clubs.all') }}
      </button>
      <button
        v-for="s in sports"
        :key="s.id"
        type="button"
        class="ios-segment-item tap-highlight"
        :class="{ 'ios-segment-item-active': sportFilter === s.slug }"
        @click="sportFilter = s.slug"
      >
        {{ s.icon }} {{ t(`sport.${s.slug}.name`, s.slug) }}
      </button>
    </div>

    <div class="mb-6 flex flex-wrap gap-3">
      <select v-model="cityFilter" class="ios-input max-w-xs">
        <option value="">{{ t('search.allCities') }}</option>
        <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
      </select>
      <input v-model="q" type="search" class="ios-input flex-1 min-w-[12rem]" :placeholder="t('search.placeholder')" />
    </div>

    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <div v-else-if="clubs?.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ClubCard v-for="club in clubs" :key="club.id" :club="club" />
    </div>
    <p v-else class="ios-footnote">{{ t('common.noResults') }}</p>
  </div>
</template>
