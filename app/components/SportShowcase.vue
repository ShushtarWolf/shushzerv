<script setup lang="ts">
import type { Sport } from '~/types'
import { brandSurface } from '#shared/palette'

const props = defineProps<{ sports: Sport[] }>()
const { t, locale } = useI18n()
const { pickName, formatNumber } = useLocaleContent()
const localePath = useLocalePath()

const isRtl = computed(() => locale.value === 'fa')

const popular = computed(() => props.sports)

function courtCount(sport: Sport) {
  return sport.courtCount && sport.courtCount > 0 ? sport.courtCount : null
}
</script>

<template>
  <div class="space-y-6">
    <SzSection :title="t('categories.title')" :to="localePath('/explore')" :link-text="t('categories.showMore')" />
    <div class="sz-stagger sz-grid-enter grid gap-4 sm:grid-cols-2">
      <SzHeroCard
        v-for="(sport, i) in popular"
        :key="sport.id"
        :to="localePath(`/sports/${sport.slug}`)"
        :color="brandSurface(i)"
      >
        <div class="flex items-center gap-4 p-5">
          <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
            <SportIcon :slug="sport.slug" size="xl" />
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="text-xl font-extrabold text-white">{{ pickName(sport) }}</h3>
            <p v-if="courtCount(sport)" class="mt-1 text-sm font-semibold text-white/80">
              {{ t('sportShowcase.courts', { n: formatNumber(courtCount(sport)!) }) }}
            </p>
            <span class="mt-2 inline-flex items-center gap-1 text-sm font-bold text-white/90">
              {{ t('sportShowcase.cta') }}
              <SzIcon :name="isRtl ? 'chevron-start' : 'chevron-end'" size="sm" />
            </span>
          </div>
        </div>
      </SzHeroCard>
    </div>
  </div>
</template>
