<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="admin-page-header">
    <div>
      <p v-if="subtitle" class="admin-page-subtitle">{{ subtitle }}</p>
      <h1 class="admin-page-title">{{ title }}</h1>
    </div>
  </header>
</template>
