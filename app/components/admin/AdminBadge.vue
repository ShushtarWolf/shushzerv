<script setup lang="ts">
defineProps<{
  tone?: 'default' | 'success' | 'warning' | 'critical' | 'info'
}>()
</script>

<template>
  <span class="admin-badge" :class="`admin-badge-${tone ?? 'default'}`">
    <slot />
  </span>
</template>
