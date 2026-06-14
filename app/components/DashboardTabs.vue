<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tabs: Array<{ id: string; label: string }>
    modelValue: string
  }>(),
  {},
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition tap-highlight"
      :class="modelValue === tab.id ? 'bg-brand-orange text-white shadow-card' : 'bg-white text-brand-gray-600 shadow-card'"
      @click="emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
