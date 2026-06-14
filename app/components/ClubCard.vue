<script setup lang="ts">
import type { Club } from '~/types'

const props = defineProps<{ club: Club }>()
const { t, locale } = useI18n()
const { localized, pickName, formatPrice } = useLocaleContent()
const localePath = useLocalePath()

const { resolveAccent } = useSportTheme()

const accent = computed(() => resolveAccent(props.club.courts?.[0]?.sport))

const sportChips = computed(() => {
  const seen = new Set<string>()
  const chips: Array<{ slug: string; name: string; color: string }> = []
  for (const court of props.club.courts ?? []) {
    if (court.sport && !seen.has(court.sport.slug)) {
      seen.add(court.sport.slug)
      chips.push({ slug: court.sport.slug, name: pickName(court.sport), color: court.sport.color })
    }
  }
  return chips.slice(0, 3)
})
</script>

<template>
  <SzCard :to="localePath(`/clubs/${club.slug}`)" :accent="accent" themed class="flex h-full flex-col overflow-hidden">
    <div class="relative h-36 overflow-hidden">
      <div class="h-full transition-transform duration-500 group-hover:scale-105">
        <ClubCover :club="club" />
      </div>
      <span
        v-if="club.discount"
        class="absolute top-3 z-10 rounded-full bg-brand-orange px-2.5 py-1 text-xs font-bold text-white ltr:right-3 rtl:left-3"
      >
        {{ club.discount }}{{ locale === 'fa' ? '٪' : '%' }} {{ t('clubs.discount') }}
      </span>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-lg font-extrabold leading-tight">{{ pickName(club) }}</h3>
        <SzBadge tone="yellow">★ {{ club.rating.toFixed(1) }}</SzBadge>
      </div>
      <p class="text-xs text-brand-gray-500 line-clamp-1">{{ localized(club.addressFa, club.addressEn) }}</p>
      <div v-if="sportChips.length" class="flex flex-wrap gap-1">
        <SzBadge v-for="s in sportChips" :key="s.slug" tone="sport" :sport-color="s.color" class="!text-xs">
          <span class="inline-flex items-center gap-1" :style="{ color: s.color }">
            <SportIcon :slug="s.slug" size="xs" />
            {{ s.name }}
          </span>
        </SzBadge>
      </div>
      <div class="mt-auto flex items-center justify-between gap-2 pt-2">
        <span class="text-sm">
          {{ t('clubs.from') }}
          <span class="text-lg font-black text-brand-orange">{{ formatPrice(club.priceFrom) }}</span>
          {{ t('clubs.currency') }}
        </span>
        <span class="text-xs font-bold transition-transform duration-200 group-hover:translate-x-0.5" :style="{ color: accent }">
          {{ t('clubs.reserve') }} →
        </span>
      </div>
    </div>
  </SzCard>
</template>
