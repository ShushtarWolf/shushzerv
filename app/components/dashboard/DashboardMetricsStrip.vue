<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <section class="fd-card mb-6 overflow-hidden p-5 sm:p-6">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-fd-navy sm:text-xl">{{ title }}</h2>
        <p v-if="subtitle" class="mt-0.5 text-sm font-medium text-fd-muted">{{ subtitle }}</p>
      </div>
      <slot name="action" />
    </div>
    <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <slot />
    </div>
  </section>
</template>
