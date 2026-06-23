<script setup lang="ts">
import type { ClassSession } from '~/types'

const props = defineProps<{ classSession: ClassSession }>()
const { t } = useI18n()
const { pickName, localized, formatPrice, formatDate, formatTimeRange, formatFraction } = useLocaleContent()
const localePath = useLocalePath()
const { accent, softBg } = useSportTheme()
</script>

<template>
  <SzCard
    :to="localePath(`/classes/${classSession.id}`)"
    themed
    class="flex h-full flex-col"
  >
    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="flex items-start gap-3">
        <span
          v-if="classSession.sport"
          class="sz-sport-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          :style="{ backgroundColor: softBg(accent), color: accent }"
        >
          <SportIcon :slug="classSession.sport.slug" size="sm" />
        </span>
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-base font-bold leading-snug text-brand-gray-900">
              {{ localized(classSession.titleFa, classSession.titleEn) }}
            </h3>
            <span
              class="shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums"
              :class="classSession.status === 'FULL' ? 'bg-brand-gray-100 text-brand-gray-600' : 'bg-brand-orange/10 text-brand-orange'"
            >
              {{ formatFraction(classSession.bookedSeats, classSession.maxSeats) }}
            </span>
          </div>
          <p v-if="classSession.club" class="truncate text-xs text-brand-gray-500">
            {{ pickName(classSession.club) }}
          </p>
        </div>
      </div>

      <p class="text-xs text-brand-gray-500">
        {{ formatDate(classSession.date) }} · {{ formatTimeRange(classSession.startTime, classSession.endTime) }}
      </p>

      <div class="mt-auto pt-3">
        <p class="text-sm font-bold text-brand-gray-900">
          {{ formatPrice(classSession.price) }}
          <span class="text-xs font-semibold text-brand-gray-500">{{ t('clubs.currency') }}</span>
        </p>
      </div>
    </div>
  </SzCard>
</template>
