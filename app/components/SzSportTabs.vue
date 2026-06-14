<script setup lang="ts">
import type { Sport } from '~/types'

const props = withDefaults(
  defineProps<{
    sports: Sport[]
    modelValue?: string
    fade?: boolean
    showAll?: boolean
    allLabel?: string
  }>(),
  { showAll: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const { t } = useI18n()
const { pickName } = useLocaleContent()

function select(slug: string) {
  emit('update:modelValue', slug === props.modelValue ? '' : slug)
}
</script>

<template>
  <div
    class="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-1 px-1 sz-scroll-x"
    :class="{ 'sz-scroll-fade': fade }"
  >
    <button
      v-if="showAll"
      type="button"
      class="tap-highlight inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200"
      :class="
        !modelValue
          ? 'border-brand-orange bg-brand-orange text-white shadow-card'
          : 'border-brand-gray-200 bg-white text-brand-gray-700 hover:border-brand-gray-300'
      "
      @click="select('')"
    >
      {{ allLabel ?? t('clubs.all') }}
    </button>
    <button
      v-for="sport in sports"
      :key="sport.id"
      type="button"
      class="tap-highlight inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200"
      :class="
        modelValue === sport.slug
          ? 'border-transparent text-white shadow-card'
          : 'border-brand-gray-200 bg-white text-brand-gray-700 hover:border-brand-gray-300'
      "
      :style="modelValue === sport.slug ? { backgroundColor: sport.color } : undefined"
      @click="select(sport.slug)"
    >
      <SportIcon :slug="sport.slug" size="sm" />
      {{ pickName(sport) }}
    </button>
  </div>
</template>

<style scoped>
.sz-scroll-x::-webkit-scrollbar {
  display: none;
}
.sz-scroll-x {
  scrollbar-width: none;
}
</style>
