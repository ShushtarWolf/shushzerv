<script setup lang="ts">
import type { Coach } from '~/types'

const props = defineProps<{ coach: Coach }>()
const { t } = useI18n()
const { pickName, localized } = useLocaleContent()
const { cityLabel } = useCities()
const localePath = useLocalePath()
const { resolveAccent, softBg } = useSportTheme()

const accent = computed(() => resolveAccent(props.coach.sport))
</script>

<template>
  <SzCard
    :to="localePath(`/coaches/${coach.id}`)"
    :accent="accent"
    themed
    class="flex h-full items-center gap-3 p-4 sm:gap-4"
  >
    <div class="relative shrink-0">
      <CoachAvatar :coach="coach" :size="64" class="h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-white" />
      <span
        v-if="coach.sport"
        class="sz-sport-icon absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full shadow-card"
        :style="{ backgroundColor: softBg(accent), border: `2px solid ${accent}`, color: accent }"
      >
        <SportIcon :slug="coach.sport.slug" size="xs" />
      </span>
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="ios-title-3 truncate">{{ pickName(coach) }}</h3>
      <p class="ios-footnote truncate">
        {{ coach.sport ? localized(coach.sport.nameFa, coach.sport.nameEn) : '' }} · {{ cityLabel(coach.city) }}
      </p>
    </div>
    <div class="flex shrink-0 flex-col items-end gap-0.5">
      <span class="text-sm font-semibold" :style="{ color: accent }">★ {{ coach.rating.toFixed(1) }}</span>
      <span class="ios-footnote whitespace-nowrap">{{ coach.sessions }} {{ t('coaches.sessions') }}</span>
    </div>
  </SzCard>
</template>
