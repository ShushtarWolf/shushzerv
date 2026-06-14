<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header :class="subtitle ? 'mb-6' : 'mb-6'">
    <h1 class="sz-headline mb-2">{{ title }}</h1>
    <p v-if="subtitle" class="text-brand-gray-600">{{ subtitle }}</p>
  </header>
</template>
