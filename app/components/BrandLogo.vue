<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-2 tap-highlight">
    <span
      class="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-indigo text-white shadow-float"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M5 8c3 2 11 2 14 0M5 16c3-2 11-2 14 0M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18" />
      </svg>
    </span>
    <span class="text-lg font-bold tracking-tight">{{ $t('brand.name') }}</span>
  </NuxtLink>
</template>
