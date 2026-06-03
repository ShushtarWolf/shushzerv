<script setup lang="ts">
import type { Sport } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const { localized } = useLocaleContent()

useHead({ title: () => t('nav.explore') })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')

const sportGroups = [
  { key: 'racket', labelFa: 'راکتی', labelEn: 'Racket' },
  { key: 'ball', labelFa: 'توپی', labelEn: 'Ball' },
  { key: 'fitness', labelFa: 'تناسب', labelEn: 'Fitness' },
  { key: 'water', labelFa: 'آبی', labelEn: 'Water' },
  { key: 'combat', labelFa: 'رزمی', labelEn: 'Combat' },
]

const activeGroup = ref('racket')
const filteredSports = computed(() =>
  (sports.value ?? []).filter((s) => s.group === activeGroup.value),
)
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-2">{{ t('nav.explore') }}</h1>
    <p class="mb-8 text-sz-gray-600">{{ t('hero.subtitle') }}</p>

    <div class="ios-segment mb-8 flex w-full max-w-lg flex-wrap gap-1">
      <button
        v-for="group in sportGroups"
        :key="group.key"
        type="button"
        class="ios-segment-item tap-highlight flex-1 min-w-[4.5rem]"
        :class="{ 'ios-segment-item-active': activeGroup === group.key }"
        @click="activeGroup = group.key"
      >
        {{ localized(group.labelFa, group.labelEn) }}
      </button>
    </div>

    <div v-if="filteredSports.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <NuxtLink
        v-for="sport in filteredSports"
        :key="sport.id"
        :to="localePath(`/sports/${sport.slug}`)"
        class="ios-card flex flex-col items-center gap-2 p-5 text-center tap-highlight"
      >
        <span class="text-3xl">{{ sport.icon }}</span>
        <span class="font-semibold">{{ t(`sport.${sport.slug}.name`, sport.slug) }}</span>
      </NuxtLink>
    </div>
    <p v-else class="ios-footnote">{{ t('common.noResults') }}</p>
  </div>
</template>
