<script setup lang="ts">
import type { Coach } from '~/types'

const props = defineProps<{ coach: Coach }>()
const { t } = useI18n()
const { pickName, localized, formatRating, formatNumber } = useLocaleContent()
const { cityLabel } = useCities()
const localePath = useLocalePath()
const { accent, softBg } = useSportTheme()
</script>

<template>
  <SzCard
    :to="localePath(`/coaches/${coach.id}`)"
    themed
    class="flex h-full items-center gap-3 p-5 sm:gap-4"
  >
    <div class="relative shrink-0">
      <CoachAvatar :coach="coach" :size="56" class="h-14 w-14 overflow-hidden rounded-full ring-2 ring-white" />
      <span
        v-if="coach.sport"
        class="sz-sport-icon absolute -bottom-0.5 -end-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white"
        :style="{ backgroundColor: softBg(accent, 'ff'), color: accent }"
      >
        <SportIcon :slug="coach.sport.slug" size="xs" />
      </span>
    </div>

    <div class="min-w-0 flex-1">
      <h3 class="truncate text-base font-bold text-brand-gray-900">{{ pickName(coach) }}</h3>
      <p class="mt-0.5 truncate text-xs text-brand-gray-500">
        {{ coach.sport ? localized(coach.sport.nameFa, coach.sport.nameEn) : '' }}
        <span v-if="coach.sport"> · </span>
        {{ cityLabel(coach.city) }}
      </p>
      <SzBadge v-if="coach.equipment?.length" tone="green" class="mt-1.5 !text-xs">
        {{ t('equipment.badge') }}
      </SzBadge>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-0.5">
      <span class="inline-flex items-center gap-0.5 rounded-lg bg-brand-orange/10 px-2 py-0.5 text-xs font-bold text-brand-orange">
        ★ {{ formatRating(coach.rating) }}
      </span>
      <span class="text-[11px] text-brand-gray-500">{{ formatNumber(coach.sessions) }} {{ t('coaches.sessions') }}</span>
    </div>
  </SzCard>
</template>
