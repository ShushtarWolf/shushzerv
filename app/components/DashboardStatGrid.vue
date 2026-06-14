<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; value: string | number; tone?: 'orange' | 'green' | 'blue' | 'indigo' | 'pink' }>
}>()

const toneClass: Record<string, string> = {
  orange: 'text-brand-orange',
  green: 'text-brand-green',
  blue: 'text-brand-blue',
  indigo: 'text-sz-indigo',
  pink: 'text-brand-pink',
}
</script>

<template>
  <div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
    <div v-for="(item, i) in items" :key="i" class="ios-card p-4 text-center">
      <p class="text-2xl font-black" :class="toneClass[item.tone ?? 'orange']">{{ item.value }}</p>
      <p class="ios-footnote mt-1">{{ item.label }}</p>
    </div>
  </div>
</template>
