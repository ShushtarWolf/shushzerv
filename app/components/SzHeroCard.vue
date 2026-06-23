<script setup lang="ts">
defineProps<{
  color: string
  to?: string
  interactive?: boolean
}>()
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="group block overflow-hidden rounded-ios-xl text-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted-soft active:scale-[0.98]"
    :style="{ backgroundColor: color }"
  >
    <slot />
  </NuxtLink>
  <div
    v-else
    class="group block overflow-hidden rounded-ios-xl text-white shadow-card transition-all duration-300"
    :class="interactive !== false ? 'hover:-translate-y-1 hover:shadow-lifted-soft active:scale-[0.98]' : ''"
    :style="{ backgroundColor: color }"
  >
    <slot />
  </div>
</template>
