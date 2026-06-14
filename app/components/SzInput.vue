<script setup lang="ts">
defineProps<{
  label?: string
  type?: string
  autocomplete?: string
  required?: boolean
  minlength?: number | string
  disabled?: boolean
  placeholder?: string
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label v-if="label" class="ios-footnote mb-1 block">{{ label }}</label>
    <input
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :required="required"
      :minlength="minlength"
      :disabled="disabled"
      :placeholder="placeholder"
      class="ios-input"
    >
  </div>
</template>
