<script setup lang="ts">
import { brandSurface } from '#shared/palette'

const { t } = useI18n()
const localePath = useLocalePath()
const { showGroupClasses, showFindPlayers } = useFeatures()

const cards = computed(() => [
  ...(showGroupClasses.value ? [{ key: 'classes' as const, sport: 'fitness', to: '/classes' }] : []),
  ...(showFindPlayers.value ? [{ key: 'matches' as const, sport: 'football', to: '/matches' }] : []),
  { key: 'coaches' as const, sport: 'tennis', to: '/coaches' },
  { key: 'clubs' as const, sport: 'padel', to: '/clubs' },
])

const gridClass = computed(() => {
  const n = cards.value.length
  if (n <= 2) return 'sm:grid-cols-2'
  if (n === 3) return 'sm:grid-cols-2 lg:grid-cols-3'
  return 'sm:grid-cols-2 lg:grid-cols-4'
})
</script>

<template>
  <div class="sz-stagger sz-grid-enter grid items-stretch gap-4" :class="gridClass">
    <SzHeroCard
      v-for="(card, i) in cards"
      :key="card.key"
      :to="localePath(card.to)"
      :color="brandSurface(i)"
      class="h-full"
    >
      <div class="flex h-full flex-col justify-center p-5 sm:min-h-[9.5rem]">
        <span class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
          <SportIcon :slug="card.sport" size="md" />
        </span>
        <h3 class="ios-title-3 mb-1 text-white">{{ t(`features.${card.key}.title`) }}</h3>
        <p class="ios-footnote text-white/80">{{ t(`features.${card.key}.desc`) }}</p>
      </div>
    </SzHeroCard>
  </div>
</template>
