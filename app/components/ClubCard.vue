<script setup lang="ts">
import type { Club } from '~/types'

const props = defineProps<{ club: Club }>()
const localePath = useLocalePath()
const { localized, formatPrice } = useLocaleContent()

const gradient = computed(() => {
  const palette = ['from-brand-blue to-brand-indigo', 'from-brand-teal to-brand-blue', 'from-brand-green to-brand-teal', 'from-brand-orange to-brand-pink']
  const i = props.club.id.charCodeAt(0) % palette.length
  return palette[i]
})
</script>

<template>
  <NuxtLink :to="localePath(`/clubs/${club.slug}`)" class="ios-card group block overflow-hidden">
    <div class="relative h-32 bg-gradient-to-br" :class="gradient">
      <span v-if="club.discount" class="absolute end-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-brand-pink">
        {{ club.discount }}٪ {{ $t('clubs.discount') }}
      </span>
      <span class="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
        ★ {{ club.rating.toFixed(1) }}
      </span>
    </div>
    <div class="space-y-1.5 p-4">
      <h3 class="ios-title-3 line-clamp-1">{{ localized(club.nameFa, club.nameEn) }}</h3>
      <p class="ios-footnote line-clamp-1">{{ localized(club.addressFa, club.addressEn) }}</p>
      <div class="flex items-baseline justify-between pt-1">
        <span class="text-sm font-semibold text-brand-gray-900">
          {{ $t('clubs.from') }} {{ formatPrice(club.priceFrom) }} {{ $t('clubs.currency') }}
        </span>
        <span class="text-xs font-semibold text-brand-blue">{{ $t('clubs.details') }} →</span>
      </div>
    </div>
  </NuxtLink>
</template>
