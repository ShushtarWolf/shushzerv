<script setup lang="ts">
import type { Sport } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const { accent, softBg } = useSportTheme()
useHead({ title: () => t('nav.explore') })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const visibleSports = computed(() => sports.value ?? [])
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <SzPageHeader :title="t('nav.explore')" :subtitle="t('hero.subtitle')" />

    <div
      v-if="visibleSports.length"
      class="sz-stagger sz-grid-enter grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      <SzCard
        v-for="sport in visibleSports"
        :key="sport.id"
        :to="localePath(`/sports/${sport.slug}`)"
        themed
        class="flex flex-col items-center gap-2 p-5 text-center"
      >
        <span
          class="sz-sport-icon flex h-14 w-14 items-center justify-center rounded-2xl"
          :style="{ backgroundColor: softBg(accent), color: accent }"
        >
          <SportIcon :slug="sport.slug" size="lg" />
        </span>
        <span class="font-semibold">{{ t(`sport.${sport.slug}.name`, sport.slug) }}</span>
      </SzCard>
    </div>
    <SzEmptyState
      v-else
      :message="t('common.noResults')"
      :action-label="t('common.browseClubs')"
      :action-to="localePath('/clubs')"
    />
  </div>
</template>
