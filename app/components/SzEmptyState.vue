<script setup lang="ts">
defineProps<{
  message: string
  actionLabel?: string
  actionTo?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-ios-lg border border-dashed border-brand-gray-200 bg-white/60 px-6 py-12 text-center">
    <span class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gray-100 text-brand-gray-400">
      <SzIcon name="search" />
    </span>
    <p class="ios-footnote max-w-sm">{{ message }}</p>
    <SzButton v-if="actionLabel && actionTo" :to="actionTo" variant="secondary" size="sm" class="mt-4">
      {{ actionLabel }}
    </SzButton>
  </div>
</template>
