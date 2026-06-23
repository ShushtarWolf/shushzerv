<script setup lang="ts">
import type { ScheduleEvent } from '~/types'

const props = defineProps<{
  event: ScheduleEvent
  modelValue: string
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
  save: []
  close: []
}>()

const { t } = useI18n()
const { formatDate, formatTimeRange } = useLocaleContent()
const { eventDurationLabel } = useSlotSchedule()
</script>

<template>
  <div
    class="fixed inset-0 z-[60] flex items-end justify-center bg-fd-navy/40 p-4 backdrop-blur-sm sm:items-center"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md animate-slide-up rounded-[1.25rem] bg-white p-5 shadow-fd sm:p-6"
      role="dialog"
      aria-modal="true"
      :aria-label="t('schedule.eventNote')"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-lg font-bold text-fd-navy">{{ event.title }}</h2>
          <p class="mt-1 text-sm text-fd-muted">
            {{ formatDate(event.date) }}
            ·
            <span dir="ltr">{{ formatTimeRange(event.startTime, event.endTime) }}</span>
            ·
            {{ eventDurationLabel(event.startTime, event.endTime) }}
          </p>
          <p v-if="event.subtitle" class="mt-0.5 truncate text-xs text-fd-muted">{{ event.subtitle }}</p>
        </div>
        <button type="button" class="fd-icon-btn !h-10 !w-10 shrink-0" :aria-label="t('common.close')" @click="emit('close')">
          <SzIcon name="close" />
        </button>
      </div>

      <label class="mb-1 block text-xs font-semibold text-fd-muted">{{ t('schedule.eventNote') }}</label>
      <p class="mb-2 text-xs text-fd-muted">{{ t('schedule.eventNoteHint') }}</p>
      <textarea
        :value="modelValue"
        class="fd-input min-h-28 resize-y"
        :placeholder="t('schedule.eventNotePlaceholder')"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />

      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="fd-btn-primary" :disabled="saving" @click="emit('save')">
          {{ t('schedule.saveNote') }}
        </button>
        <button type="button" class="fd-btn-ghost" @click="emit('close')">{{ t('common.close') }}</button>
      </div>

      <slot />
    </div>
  </div>
</template>
