<script setup lang="ts">
import type { Club } from '~/types'

const props = defineProps<{ club: Club }>()
const { t } = useI18n()
const { localized, pickName, formatPrice } = useLocaleContent()
const localePath = useLocalePath()

const gradient = computed(() => {
  const palette = ['from-sz-blue to-sz-indigo', 'from-sz-green to-sz-teal', 'from-sz-orange to-sz-pink', 'from-sz-purple to-sz-indigo']
  let h = 0
  for (const c of props.club.slug) h = (h + c.charCodeAt(0)) % palette.length
  return palette[h]
})
</script>

<template>
  <NuxtLink :to="localePath(`/clubs/${club.slug}`)" class="ios-card group block overflow-hidden">
    <div class="relative h-32 bg-gradient-to-br" :class="gradient">
      <span v-if="club.discount" class="absolute top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-sz-pink ltr:right-3 rtl:left-3">
        {{ formatPrice(club.discount) }}٪ {{ t('clubs.discount') }}
      </span>
      <div class="absolute inset-0 flex items-center justify-center text-white/90 text-4xl font-black opacity-30">
        {{ pickName(club).charAt(0) }}
      </div>
    </div>
    <div class="space-y-2 p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="ios-title-3 leading-tight">{{ pickName(club) }}</h3>
        <span class="flex shrink-0 items-center gap-1 text-sm font-semibold text-sz-orange">
          ★ {{ club.rating.toFixed(1) }}
        </span>
      </div>
      <p class="ios-footnote line-clamp-1">{{ localized(club.addressFa, club.addressEn) }}</p>
      <div class="flex items-center justify-between pt-1">
        <span class="text-sm text-sz-gray-500">
          {{ t('clubs.from') }} <span class="font-bold text-sz-gray-900">{{ formatPrice(club.priceFrom) }}</span> {{ t('clubs.currency') }}
        </span>
        <span class="rounded-full bg-sz-accent-soft px-3 py-1 text-xs font-semibold text-sz-blue group-hover:bg-sz-blue group-hover:text-white transition">
          {{ t('clubs.details') }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
