<script setup lang="ts">
const { t, tm, rt } = useI18n()

const keys = ['classes', 'coaches', 'clubs', 'plans'] as const
const icons: Record<string, string> = { classes: '🎽', coaches: '🏅', clubs: '🏟️', plans: '💳' }
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div v-for="key in keys" :key="key" class="ios-card p-5">
      <div class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sz-gray-50 text-xl">
        {{ icons[key] }}
      </div>
      <h3 class="ios-title-3 mb-1">{{ t(`features.${key}.title`) }}</h3>
      <p class="ios-footnote">{{ t(`features.${key}.desc`) }}</p>
    </div>
  </div>
</template>
