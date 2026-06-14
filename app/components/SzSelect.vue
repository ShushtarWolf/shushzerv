<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
  disabled?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label v-if="label" class="ios-footnote mb-1 block">{{ label }}</label>
    <div class="ios-select-wrap">
      <select v-model="model" class="ios-input" :required="required" :disabled="disabled">
        <slot />
      </select>
    </div>
  </div>
</template>
