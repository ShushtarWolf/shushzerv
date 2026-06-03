<script setup lang="ts">
defineProps<{ title: string; to?: string; linkText?: string }>()
</script>

<template>
  <div class="mb-4 flex items-end justify-between gap-4">
    <h2 class="ios-title-2">{{ title }}</h2>
    <NuxtLink v-if="to" :to="to" class="text-sm font-semibold text-brand-blue tap-highlight">
      {{ linkText }}
    </NuxtLink>
  </div>
</template>
