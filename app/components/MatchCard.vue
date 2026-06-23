<script setup lang="ts">
import type { OpenMatch } from '~/types'

const props = defineProps<{ match: OpenMatch }>()
const { t } = useI18n()
const { localized, formatDate, formatNumber, formatTime, formatFraction } = useLocaleContent()
const { cityLabel } = useCities()
const { levelLabel } = useSkillLevel()
const localePath = useLocalePath()
const { accent, softBg } = useSportTheme()

const spotsLeft = computed(() => props.match.maxPlayers - props.match.joinedCount)
const levelTone = computed(() => {
  const map: Record<string, 'green' | 'blue' | 'orange' | 'gray'> = {
    BEGINNER: 'green', INTERMEDIATE: 'blue', ADVANCED: 'orange', PRO: 'gray',
  }
  return map[props.match.minLevel] ?? 'gray'
})
</script>

<template>
  <SzCard :to="localePath(`/matches/${match.id}`)" themed class="flex h-full flex-col">
    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="flex items-start gap-3">
        <span
          v-if="match.sport"
          class="sz-sport-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          :style="{ backgroundColor: softBg(accent), color: accent }"
        >
          <SportIcon :slug="match.sport.slug" size="sm" />
        </span>
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex items-start justify-between gap-2">
            <p class="text-base font-bold text-brand-gray-900">{{ cityLabel(match.city) }}</p>
            <SzBadge :tone="levelTone">{{ levelLabel(match.minLevel) }}</SzBadge>
          </div>
          <p v-if="match.club" class="truncate text-xs text-brand-gray-500">
            {{ localized(match.club.nameFa, match.club.nameEn) }}
          </p>
        </div>
      </div>

      <p class="text-xs text-brand-gray-500">
        {{ formatDate(match.date) }} · {{ formatTime(match.startTime) }}
      </p>

      <div class="mt-auto flex items-center justify-between gap-2 pt-3">
        <span class="text-xs font-semibold text-brand-gray-600">
          {{ formatNumber(spotsLeft) }} {{ t('matches.spotsLeft') }}
        </span>
        <span class="rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-bold text-white transition-transform duration-200 group-hover:scale-[1.02]">
          {{ t('matches.join') }}
        </span>
      </div>
    </div>
  </SzCard>
</template>
