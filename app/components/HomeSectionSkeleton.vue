<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'grid' | 'list' | 'coach'
    count?: number
  }>(),
  { variant: 'grid', count: 3 },
)
</script>

<template>
  <div
    class="grid gap-4"
    :class="variant === 'coach' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'"
  >
    <div
      v-for="i in count"
      :key="i"
      class="ios-card animate-pulse p-5"
      :class="variant === 'list' ? 'flex gap-4' : ''"
    >
      <div
        class="rounded-xl bg-brand-gray-200"
        :class="variant === 'list' ? 'h-16 w-16 shrink-0' : 'mb-3 h-32 w-full'"
      />
      <div class="flex-1 space-y-2">
        <div class="h-4 w-3/4 rounded bg-brand-gray-200" />
        <div class="h-3 w-1/2 rounded bg-brand-gray-100" />
        <div v-if="variant !== 'list'" class="h-3 w-2/3 rounded bg-brand-gray-100" />
      </div>
    </div>
  </div>
</template>
