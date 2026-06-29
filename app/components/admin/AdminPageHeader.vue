<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="admin-page-header">
    <div class="min-w-0">
      <p v-if="subtitle" class="admin-page-subtitle">{{ subtitle }}</p>
      <h1 class="admin-page-title">{{ title }}</h1>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
