<script setup lang="ts">
import type { OpenMatch } from '~/types'

const props = defineProps<{ match: OpenMatch }>()
const { t } = useI18n()
const { localized, formatDate } = useLocaleContent()
const { cityLabel } = useCities()
const { levelLabel } = useSkillLevel()
const localePath = useLocalePath()
const { resolveAccent, softBg } = useSportTheme()

const accent = computed(() => resolveAccent(props.match.sport))
const spotsLeft = computed(() => props.match.maxPlayers - props.match.joinedCount)
const levelTone = computed(() => {
  const map: Record<string, 'green' | 'blue' | 'orange' | 'gray'> = {
    BEGINNER: 'green', INTERMEDIATE: 'blue', ADVANCED: 'orange', PRO: 'gray',
  }
  return map[props.match.minLevel] ?? 'gray'
})
</script>

<template>
  <SzCard :to="localePath(`/matches/${match.id}`)" :accent="accent" themed class="flex h-full flex-col p-4">
    <div class="mb-3 flex items-center justify-between gap-2">
      <span
        v-if="match.sport"
        class="sz-sport-icon flex h-12 w-12 items-center justify-center rounded-2xl"
        :style="{ backgroundColor: softBg(accent), color: accent }"
      >
        <SportIcon :slug="match.sport.slug" size="lg" />
      </span>
      <SzBadge :tone="levelTone">{{ levelLabel(match.minLevel) }}</SzBadge>
    </div>
    <p class="font-bold">{{ cityLabel(match.city) }}</p>
    <p class="text-sm text-brand-gray-600">{{ formatDate(match.date) }} · {{ match.startTime }}</p>
    <p v-if="match.club" class="mt-1 text-sm font-semibold">{{ localized(match.club.nameFa, match.club.nameEn) }}</p>
    <div class="mt-auto flex items-center justify-between pt-4">
      <span class="text-sm font-semibold text-brand-gray-600">
        {{ spotsLeft }} {{ t('matches.spotsLeft') }}
      </span>
      <span class="rounded-full px-4 py-1.5 text-xs font-bold text-white transition-transform duration-200 group-hover:scale-105" :style="{ backgroundColor: accent }">
        {{ t('matches.join') }}
      </span>
    </div>
  </SzCard>
</template>
