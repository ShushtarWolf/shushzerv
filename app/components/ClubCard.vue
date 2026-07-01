<script setup lang="ts">
import type { Club } from '~/types'

const props = withDefaults(defineProps<{ club: Club; date?: string; book?: boolean }>(), {
  date: '',
  book: true,
})
const { t, locale } = useI18n()
const { localized, pickName, formatPrice, formatRating, formatNumber } = useLocaleContent()
const localePath = useLocalePath()
const { accent } = useSportTheme()

const clubTo = computed(() => ({
  path: localePath(`/clubs/${props.club.slug}`),
  query: {
    ...(props.book ? { book: '1' } : {}),
    ...(props.date ? { date: props.date } : {}),
  },
}))

const sportChips = computed(() => {
  const seen = new Set<string>()
  const chips: Array<{ slug: string; name: string }> = []
  for (const court of props.club.courts ?? []) {
    if (court.sport && !seen.has(court.sport.slug)) {
      seen.add(court.sport.slug)
      chips.push({ slug: court.sport.slug, name: pickName(court.sport) })
    }
  }
  return chips.slice(0, 3)
})
</script>

<template>
  <SzCard :to="clubTo" themed class="flex h-full flex-col overflow-hidden">
    <div class="relative aspect-[16/10] overflow-hidden bg-brand-gray-100">
      <div class="h-full transition-transform duration-500 group-hover:scale-105">
        <ClubCover :club="club" />
      </div>
      <span
        v-if="club.discount"
        class="absolute top-3 z-10 rounded-full bg-brand-orange px-2.5 py-1 text-xs font-bold text-white ltr:right-3 rtl:left-3"
      >
        {{ formatNumber(club.discount) }}{{ locale === 'fa' ? '٪' : '%' }} {{ t('clubs.discount') }}
      </span>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <div class="flex items-start justify-between gap-2">
        <h3
          class="text-lg leading-tight"
          :class="club.hasGroupClasses ? 'font-extrabold text-brand-gray-900' : 'font-medium text-brand-gray-600'"
        >
          {{ pickName(club) }}
        </h3>
        <SzBadge tone="yellow">★ {{ formatRating(club.rating) }}</SzBadge>
      </div>
      <p class="text-xs text-brand-gray-500 line-clamp-1">{{ localized(club.addressFa, club.addressEn) }}</p>
      <div v-if="sportChips.length" class="flex flex-wrap gap-1">
        <SzBadge v-for="s in sportChips" :key="s.slug" tone="blue" class="!text-xs">
          <span class="inline-flex items-center gap-1">
            <SportIcon :slug="s.slug" size="xs" />
            {{ s.name }}
          </span>
        </SzBadge>
      </div>
      <div class="flex flex-wrap gap-1">
        <SzBadge v-if="club.hasGroupClasses" tone="purple" class="!text-xs w-fit">
          {{ t('clubs.groupClassesBadge') }}
        </SzBadge>
        <SzBadge v-if="club.addons?.length" tone="green" class="!text-xs w-fit">
          {{ t('equipment.badge') }}
        </SzBadge>
      </div>
      <div class="mt-auto flex items-center justify-between gap-2 pt-2">
        <span class="text-sm">
          {{ t('clubs.from') }}
          <span class="text-lg font-black text-brand-orange">{{ formatPrice(club.priceFrom) }}</span>
          {{ t('clubs.currency') }}
        </span>
        <span class="text-xs font-bold text-brand-orange transition-transform duration-200 group-hover:translate-x-0.5">
          {{ t('clubs.reserve') }} →
        </span>
      </div>
    </div>
  </SzCard>
</template>
