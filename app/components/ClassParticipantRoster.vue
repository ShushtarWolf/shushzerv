<script setup lang="ts">
import type { ClassParticipant } from '~/types'

const props = defineProps<{
  participants: ClassParticipant[]
  maxSeats: number
  bookedSeats: number
}>()

const { t } = useI18n()
const { levelLabel } = useSkillLevel()
const { userGenderLabel } = useClassSession()

const openSpotCount = computed(() => Math.max(0, props.maxSeats - props.bookedSeats))
</script>

<template>
  <section class="mt-6 border-t border-brand-gray-100 pt-5">
    <div class="mb-3 flex items-center justify-between gap-2">
      <h2 class="text-sm font-bold text-brand-gray-900">{{ t('classes.roster') }}</h2>
      <span class="text-xs font-semibold tabular-nums text-brand-gray-500">
        {{ t('classes.rosterCount', { count: bookedSeats, max: maxSeats }) }}
      </span>
    </div>

    <ul v-if="participants.length" class="space-y-2">
      <li
        v-for="(p, i) in participants"
        :key="i"
        class="flex items-center gap-3 rounded-xl bg-brand-gray-50 px-3 py-2.5"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange/10 text-xs font-bold text-brand-orange"
          :aria-label="p.initials"
        >
          {{ p.initials }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-brand-gray-900">{{ p.initials }}</p>
          <p class="text-xs text-brand-gray-500">
            {{ levelLabel(p.level) }} · {{ userGenderLabel(p.gender) }}
          </p>
        </div>
      </li>
    </ul>
    <p v-else class="text-sm text-brand-gray-500">{{ t('classes.rosterEmpty') }}</p>

    <div v-if="openSpotCount > 0" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="n in openSpotCount"
        :key="`open-${n}`"
        class="inline-flex items-center rounded-lg border border-dashed border-brand-gray-200 px-3 py-1.5 text-xs font-medium text-brand-gray-400"
      >
        {{ t('classes.openSpot') }}
      </span>
    </div>
  </section>
</template>
