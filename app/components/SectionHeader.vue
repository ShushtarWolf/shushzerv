<script setup lang="ts">
defineProps<{ title: string; to?: string; linkText?: string }>()
const localePath = useLocalePath()
</script>

<template>
  <div class="mb-4 flex items-end justify-between gap-4">
    <h2 class="ios-title-2">{{ title }}</h2>
    <NuxtLink
      v-if="to && linkText"
      :to="localePath(to)"
      class="text-sm font-medium text-sz-blue hover:underline"
    >
      {{ linkText }}
    </NuxtLink>
  </div>
</template>
