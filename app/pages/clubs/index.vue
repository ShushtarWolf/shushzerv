<script setup lang="ts">
import type { Club, Sport } from '~/types'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const isRtl = computed(() => locale.value === 'fa')
useHead({ title: () => t('nav.clubs') })
const { coords, request, distanceKm } = useGeolocation()

const bookingIntent = computed(() => route.query.book === '1' || route.query.book === 'true')

const view = ref<'map' | 'list'>('list')
const indoorFilter = ref('')
const genderFilter = ref('')
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

watch([sportFilter, cityFilter, dateFilter, q, indoorFilter, genderFilter], () => {
  navigateTo({
    query: {
      ...(sportFilter.value ? { sport: sportFilter.value } : {}),
      ...(cityFilter.value ? { city: cityFilter.value } : {}),
      ...(dateFilter.value ? { date: dateFilter.value } : {}),
      ...(q.value ? { q: q.value } : {}),
      ...(indoorFilter.value ? { indoor: indoorFilter.value } : {}),
      ...(genderFilter.value ? { gender: genderFilter.value } : {}),
    },
    replace: true,
  })
})

onMounted(() => {
  if (route.query.near === '1') request()
  if (bookingIntent.value) view.value = 'list'
})

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: clubs, pending } = await useApiFetch<Club[]>('/api/clubs', {
  query: computed(() => ({
    ...(sportFilter.value ? { sport: sportFilter.value } : {}),
    ...(cityFilter.value ? { city: cityFilter.value } : {}),
    ...(dateFilter.value ? { date: dateFilter.value } : {}),
    ...(indoorFilter.value ? { indoor: indoorFilter.value } : {}),
    ...(genderFilter.value ? { genderPolicy: genderFilter.value } : {}),
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
useSanitizeSportFilter(sportFilter, sports)

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

    <section
      class="mb-6 rounded-2xl border border-brand-orange/25 bg-gradient-to-br from-brand-orange/10 to-white p-4 sm:p-5"
      :class="bookingIntent ? 'ring-2 ring-brand-orange/20' : ''"
    >
      <h2 class="text-sm font-bold text-brand-gray-900 sm:text-base">{{ t('clubs.bookGuideTitle') }}</h2>
      <ol class="mt-3 grid gap-2 text-sm text-brand-gray-700 sm:grid-cols-3">
        <li class="rounded-xl bg-white/80 px-3 py-2 font-semibold shadow-sm">{{ t('clubs.bookStep1') }}</li>
        <li class="rounded-xl bg-white/80 px-3 py-2 font-semibold shadow-sm">{{ t('clubs.bookStep2') }}</li>
        <li class="rounded-xl bg-white/80 px-3 py-2 font-semibold shadow-sm">{{ t('clubs.bookStep3') }}</li>
      </ol>
      <p class="mt-3 text-sm text-brand-gray-600">{{ t('clubs.bookGuideHint') }}</p>
      <button
        v-if="view === 'map'"
        type="button"
        class="mt-3 text-sm font-bold text-brand-orange tap-highlight hover:underline"
        @click="view = 'list'"
      >
        {{ t('clubs.switchToList') }}
      </button>
    </section>

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
        :class="sportFilter === s.slug ? 'ios-segment-item-active bg-brand-orange text-white' : ''"
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
        <select v-model="indoorFilter" class="ios-input">
          <option value="">{{ t('clubs.indoorOutdoor') }}</option>
          <option value="true">{{ t('clubs.indoor') }}</option>
          <option value="false">{{ t('clubs.outdoor') }}</option>
        </select>
      </div>
      <div class="ios-select-wrap w-full sm:max-w-[10rem]">
        <select v-model="genderFilter" class="ios-input">
          <option value="">{{ t('clubs.courtType') }}</option>
          <option value="MEN">{{ t('clubs.men') }}</option>
          <option value="WOMEN">{{ t('clubs.women') }}</option>
          <option value="FAMILY">{{ t('clubs.family') }}</option>
        </select>
      </div>
      <div class="ios-select-wrap w-full sm:max-w-[10rem]">
        <select v-model="sortBy" class="ios-input">
          <option value="default">{{ t('clubs.sortDefault') }}</option>
          <option value="distance">{{ t('clubs.sortDistance') }}</option>
          <option value="price">{{ t('clubs.sortPrice') }}</option>
        </select>
      </div>
      <SzButton variant="secondary" size="sm" class="inline-flex items-center gap-2" @click="request">
        <SzIcon name="location" size="sm" />
        {{ t('hero.nearby') }}
      </SzButton>
    </div>

    <SzSkeleton v-if="pending" :lines="3" class="mb-6" />

    <template v-else-if="sortedClubs.length">
      <p class="mb-3 text-xs text-brand-gray-500">
        <span class="font-extrabold text-brand-gray-700">{{ t('clubs.legendHasClasses') }}</span>
        ·
        <span class="font-medium text-brand-gray-400">{{ t('clubs.legendNoClasses') }}</span>
      </p>

      <ClubsMap v-if="view === 'map'" :clubs="sortedClubs" variant="sidebar" />
      <div v-else :key="sportFilter" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ClubCard v-for="club in sortedClubs" :key="club.id" :club="club" :date="dateFilter" />
      </div>
    </template>

    <SzEmptyState
      v-else
      :message="t('common.noResults')"
      :action-label="t('common.browseClubs')"
      :action-to="localePath('/clubs')"
    />
  </div>
</template>
