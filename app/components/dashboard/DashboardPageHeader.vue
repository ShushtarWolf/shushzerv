<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="mb-6 sm:mb-8">
    <p v-if="subtitle" class="mb-1 text-sm font-semibold text-fd-muted">{{ subtitle }}</p>
    <h1 class="text-2xl font-black tracking-tight text-fd-navy sm:text-[1.75rem]">{{ title }}</h1>
  </header>
</template>
