<script setup lang="ts">
import type { Club, Sport } from '~/types'

const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'fa')
const route = useRoute()
const { coords, request, distanceKm } = useGeolocation()

useHead({ title: () => t('nav.clubs') })

const view = ref<'map' | 'list'>('map')
const sportFilter = ref(String(route.query.sport ?? ''))
const cityFilter = ref(String(route.query.city ?? ''))
const dateFilter = ref(String(route.query.date ?? ''))
const q = ref(String(route.query.q ?? ''))
const sortBy = ref<'default' | 'distance' | 'price'>('default')

const { formatDate, localDateISO } = useLocaleContent()

const dateOptions = computed(() => {
  const opts: { value: string; label: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const value = localDateISO(d)
    opts.push({ value, label: formatDate(value) })
  }
  return opts
})

watch([sportFilter, cityFilter, dateFilter, q], () => {
  navigateTo({
    query: {
      ...(sportFilter.value ? { sport: sportFilter.value } : {}),
      ...(cityFilter.value ? { city: cityFilter.value } : {}),
      ...(dateFilter.value ? { date: dateFilter.value } : {}),
      ...(q.value ? { q: q.value } : {}),
    },
    replace: true,
  })
})

onMounted(() => {
  if (route.query.near === '1') request()
})

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: clubs, pending } = await useApiFetch<Club[]>('/api/clubs', {
  query: computed(() => ({
    ...(sportFilter.value ? { sport: sportFilter.value } : {}),
    ...(cityFilter.value ? { city: cityFilter.value } : {}),
    ...(q.value ? { q: q.value } : {}),
  })),
})

const { cities } = useCities()
const { sync } = useSelectedSportColor()

watch(
  [sportFilter, sports],
  () => sync(sports.value, sportFilter.value),
  { immediate: true },
)

const sortedClubs = computed(() => {
  const list = [...(clubs.value ?? [])]
  if (sortBy.value === 'price') return list.sort((a, b) => a.priceFrom - b.priceFrom)
  if (sortBy.value === 'distance' && coords.value) {
    return list
      .filter((c) => c.lat != null && c.lng != null)
      .sort((a, b) =>
        distanceKm(coords.value!.lat, coords.value!.lng, a.lat!, a.lng!) -
        distanceKm(coords.value!.lat, coords.value!.lng, b.lat!, b.lng!),
      )
  }
  return list
})
</script>

<template>
  <div class="page-enter mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="sz-headline">{{ t('nav.clubs') }}</h1>
      <div class="ios-segment">
        <button
          type="button"
          class="ios-segment-item tap-highlight"
          :class="{ 'ios-segment-item-active': view === 'map' }"
          @click="view = 'map'"
        >
          {{ t('clubs.mapView') }}
        </button>
        <button
          type="button"
          class="ios-segment-item tap-highlight"
          :class="{ 'ios-segment-item-active': view === 'list' }"
          @click="view = 'list'"
        >
          {{ t('clubs.listView') }}
        </button>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="ios-segment-item tap-highlight transition-all duration-200"
        :class="{ 'ios-segment-item-active': !sportFilter }"
        @click="sportFilter = ''"
      >
        {{ t('clubs.all') }}
      </button>
      <button
        v-for="s in sports"
        :key="s.id"
        type="button"
        class="ios-segment-item tap-highlight transition-all duration-200"
        :class="sportFilter === s.slug ? 'text-white shadow-sm' : ''"
        :style="sportFilter === s.slug ? { backgroundColor: s.color } : undefined"
        @click="sportFilter = s.slug"
      >
        <span class="inline-flex items-center gap-1.5">
          <SportIcon :slug="s.slug" size="sm" />
          {{ t(`sport.${s.slug}.name`, s.slug) }}
        </span>
      </button>
    </div>

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center" :dir="isRtl ? 'rtl' : 'ltr'">
      <div class="ios-select-wrap w-full sm:max-w-xs">
        <select v-model="cityFilter" class="ios-input">
          <option value="">{{ t('search.allCities') }}</option>
          <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <div class="ios-select-wrap w-full sm:max-w-[11rem]">
        <select v-model="dateFilter" class="ios-input">
          <option value="">{{ t('hero.when') }}</option>
          <option v-for="d in dateOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
        </select>
      </div>
      <input v-model="q" type="search" class="ios-input min-w-0 flex-1" :placeholder="t('search.placeholder')" :dir="isRtl ? 'rtl' : 'ltr'" />
      <div class="ios-select-wrap w-full sm:max-w-[10rem]">
        <select v-model="sortBy" class="ios-input">
          <option value="default">{{ t('clubs.sortDefault') }}</option>
          <option value="distance">{{ t('clubs.sortDistance') }}</option>
          <option value="price">{{ t('clubs.sortPrice') }}</option>
        </select>
      </div>
      <button type="button" class="ios-btn-secondary inline-flex items-center gap-2 text-sm" @click="request">
        <SzIcon name="location" size="sm" />
        {{ t('hero.nearby') }}
      </button>
    </div>

    <SzSkeleton v-if="pending" :lines="3" class="mb-6" />

    <div v-else-if="view === 'map' && sortedClubs.length">
      <ClubsMap :clubs="sortedClubs" />
    </div>
    <div v-else-if="sortedClubs.length" :key="sportFilter" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ClubCard v-for="club in sortedClubs" :key="club.id" :club="club" />
    </div>
    <p v-else class="ios-footnote">{{ t('common.noResults') }}</p>
  </div>
</template>
