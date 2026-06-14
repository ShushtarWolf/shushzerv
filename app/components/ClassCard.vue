<script setup lang="ts">
import type { ClassSession } from '~/types'

const props = defineProps<{ classSession: ClassSession }>()
const { t } = useI18n()
const { pickName, localized, formatPrice, formatDate } = useLocaleContent()
const localePath = useLocalePath()
const { resolveAccent, softBg } = useSportTheme()

const accent = computed(() => resolveAccent(props.classSession.sport))
</script>

<template>
  <SzCard
    :to="localePath(`/classes/${classSession.id}`)"
    :accent="accent"
    themed
    class="flex h-full flex-col"
  >
    <div class="flex flex-1 flex-col p-4">
      <div class="mb-3 flex items-start justify-between gap-2">
        <span
          v-if="classSession.sport"
          class="sz-sport-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          :style="{ backgroundColor: softBg(accent), color: accent }"
        >
          <SportIcon :slug="classSession.sport.slug" size="md" />
        </span>
        <span
          class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
          :class="classSession.status === 'FULL' ? 'bg-sz-gray-100 text-sz-gray-600' : 'text-white'"
          :style="classSession.status !== 'FULL' ? { backgroundColor: accent } : undefined"
        >
          {{ classSession.bookedSeats }}/{{ classSession.maxSeats }}
        </span>
      </div>
      <h3 class="ios-title-3 min-w-0 flex-1">{{ localized(classSession.titleFa, classSession.titleEn) }}</h3>
      <p v-if="classSession.club" class="ios-footnote mt-1">{{ pickName(classSession.club) }}</p>
      <p class="ios-footnote mt-1">
        {{ formatDate(classSession.date) }} · {{ classSession.startTime }}–{{ classSession.endTime }}
      </p>
      <p class="mt-auto pt-3 text-sm font-semibold" :style="{ color: accent }">
        {{ formatPrice(classSession.price) }} {{ t('clubs.currency') }}
      </p>
    </div>
  </SzCard>
</template>
