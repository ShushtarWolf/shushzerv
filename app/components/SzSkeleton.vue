<script setup lang="ts">
withDefaults(defineProps<{ lines?: number; class?: string }>(), { lines: 1 })
</script>

<template>
  <div class="animate-pulse space-y-2" :class="$props.class">
    <div v-for="i in lines" :key="i" class="h-4 rounded-lg bg-brand-gray-200" :class="i === lines ? 'w-3/4' : 'w-full'" />
  </div>
</template>
