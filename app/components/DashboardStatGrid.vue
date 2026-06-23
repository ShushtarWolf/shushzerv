<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; value: string | number; tone?: 'pink' | 'orange' | 'green' | 'purple' | 'blue' | 'teal'; icon?: string; delta?: string }>
}>()
</script>

<template>
  <div class="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    <DashboardMetricCard
      v-for="(item, i) in items"
      :key="i"
      :label="item.label"
      :value="item.value"
      :tone="item.tone ?? 'blue'"
      :icon="item.icon"
      :delta="item.delta"
    />
  </div>
</template>
