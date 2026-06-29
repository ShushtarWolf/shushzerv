<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
}>()
</script>

<template>
  <div class="admin-metric-card">
    <p class="admin-metric-label">{{ label }}</p>
    <p class="admin-metric-value">{{ value }}</p>
    <p v-if="hint" class="admin-metric-hint">{{ hint }}</p>
  </div>
</template>
