<script setup lang="ts">
import type { SkillLevel } from '~/composables/useSkillLevel'

export type SkillQuizQuestion = {
  id: string
  textFa: string
  textEn: string
  options: Array<{ id: string; textFa: string; textEn: string }>
}

const props = defineProps<{
  questions: SkillQuizQuestion[]
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const { localized } = useLocaleContent()
const step = ref(0)

const current = computed(() => props.questions[step.value])
const allAnswered = computed(() => props.questions.every((q) => props.modelValue[q.id]))

function pick(optionId: string) {
  if (!current.value) return
  emit('update:modelValue', { ...props.modelValue, [current.value.id]: optionId })
  if (step.value < props.questions.length - 1) {
    step.value += 1
  }
}

function back() {
  if (step.value > 0) step.value -= 1
}
</script>

<template>
  <div v-if="current" class="space-y-4">
    <div class="flex items-center justify-between text-sm text-brand-gray-600">
      <span>{{ step + 1 }} / {{ questions.length }}</span>
      <button v-if="step > 0" type="button" class="font-semibold text-brand-orange tap-highlight" @click="back">
        {{ $t('skillQuiz.back') }}
      </button>
    </div>

    <div class="h-1.5 overflow-hidden rounded-full bg-brand-gray-100">
      <div
        class="h-full rounded-full bg-brand-orange transition-all"
        :style="{ width: `${((step + 1) / questions.length) * 100}%` }"
      />
    </div>

    <h3 class="ios-title-3">{{ localized(current.textFa, current.textEn) }}</h3>

    <div class="grid gap-2">
      <button
        v-for="opt in current.options"
        :key="opt.id"
        type="button"
        class="ios-card p-4 text-start font-medium tap-highlight"
        :class="modelValue[current.id] === opt.id ? 'ring-2 ring-brand-orange' : ''"
        @click="pick(opt.id)"
      >
        {{ localized(opt.textFa, opt.textEn) }}
      </button>
    </div>

    <p v-if="allAnswered" class="text-sm text-brand-gray-600">{{ $t('skillQuiz.done') }}</p>
  </div>
</template>
