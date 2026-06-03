<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <NuxtLink :to="localePath('/')" class="flex items-center gap-2 tap-highlight">
    <span class="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-indigo shadow-card">
      <svg viewBox="0 0 24 24" class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.6 8.5c4 1.5 12.8 1.5 16.8 0M3.6 15.5c4-1.5 12.8-1.5 16.8 0" />
      </svg>
    </span>
    <span class="text-lg font-bold tracking-tight">{{ t('brand.name') }}</span>
  </NuxtLink>
</template>
