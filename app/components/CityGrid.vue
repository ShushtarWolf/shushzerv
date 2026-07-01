<script setup lang="ts">
import type { Sport } from '~/types'

const props = defineProps<{ sports?: Sport[] }>()
const { t } = useI18n()
const { pickName } = useLocaleContent()
const localePath = useLocalePath()
const { cities } = useCities()
const { slug: sportFilter, sync, toggle } = useSelectedSportColor()

function cityLink(city: string) {
  return localePath({
    path: '/clubs',
    query: {
      city,
      ...(sportFilter.value ? { sport: sportFilter.value } : {}),
    },
  })
}
</script>

<template>
  <SzSection :title="t('cityGrid.title')" :subtitle="t('cityGrid.subtitle')" />
  <div v-if="sports?.length" class="mb-4 flex flex-wrap gap-2">
    <button
      type="button"
      class="sz-chip"
      :class="!sportFilter ? 'bg-brand-orange text-white' : 'bg-white text-brand-gray-700 shadow-card'"
      @click="sync(props.sports, '')"
    >
      {{ t('clubs.all') }}
    </button>
    <button
      v-for="s in sports.slice(0, 6)"
      :key="s.id"
      type="button"
      class="sz-chip"
      :class="sportFilter === s.slug ? 'bg-brand-orange text-white' : 'bg-white text-brand-gray-700 shadow-card'"
      @click="toggle(props.sports, s.slug)"
    >
      <span class="inline-flex items-center gap-1.5">
        <SportIcon :slug="s.slug" size="sm" />
        {{ pickName(s) }}
      </span>
    </button>
  </div>
  <div class="sz-stagger sz-grid-enter grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    <SzCard
      v-for="c in cities"
      :key="c.value"
      :to="cityLink(c.value)"
      class="p-4 text-center font-bold"
    >
      {{ c.label }}
    </SzCard>
  </div>
</template>
