<script setup lang="ts">
defineProps<{
  color: string
  to?: string
  interactive?: boolean
}>()
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'div'"
    :to="to"
    class="group block overflow-hidden rounded-ios-xl text-white shadow-card transition-all duration-300"
    :class="interactive !== false ? 'hover:-translate-y-1 hover:shadow-lifted-soft active:scale-[0.98]' : ''"
    :style="{ backgroundColor: color }"
  >
    <slot />
  </component>
</template>
