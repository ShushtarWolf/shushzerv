<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { color: selectedColor } = useSelectedSportColor()

const cards = [
  { key: 'classes', sport: 'fitness', to: '/classes', color: '#ff9500' },
  { key: 'matches', sport: 'football', to: '/matches', color: '#34c759' },
  { key: 'coaches', sport: 'tennis', to: '/coaches', color: '#007aff' },
  { key: 'clubs', sport: 'padel', to: '/clubs', color: '#ff5a1f' },
] as const
</script>

<template>
  <div :key="selectedColor ?? 'default'" class="sz-stagger sz-grid-enter grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <SzHeroCard
      v-for="card in cards"
      :key="card.key"
      :to="localePath(card.to)"
      :color="selectedColor ?? card.color"
      class="h-full"
    >
      <div class="flex h-full flex-col p-5">
        <span class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
          <SportIcon :slug="card.sport" size="md" />
        </span>
        <h3 class="ios-title-3 mb-1 text-white">{{ t(`features.${card.key}.title`) }}</h3>
        <p class="ios-footnote text-white/80">{{ t(`features.${card.key}.desc`) }}</p>
      </div>
    </SzHeroCard>
  </div>
</template>
