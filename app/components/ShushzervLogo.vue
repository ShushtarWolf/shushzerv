<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <NuxtLink :to="localePath('/')" class="flex items-center gap-2 tap-highlight">
    <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sz-blue to-sz-indigo text-white shadow-card">
      <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2c1.7 0 3.3.6 4.6 1.5A6 6 0 0012 8a6 6 0 00-4.6-2.5A7.9 7.9 0 0112 4zM5.5 7.4A8 8 0 0010 9.8 8 8 0 005.5 16 8 8 0 014 12c0-1.7.6-3.3 1.5-4.6zM12 20a8 8 0 01-4.6-1.5A6 6 0 0012 16a6 6 0 004.6 2.5A7.9 7.9 0 0112 20zm6.5-4a8 8 0 00-4.5-6.2A8 8 0 0018.5 7.4 8 8 0 0120 12a8 8 0 01-1.5 4z" fill="currentColor"/>
      </svg>
    </span>
    <span class="font-bold text-lg tracking-tight">{{ t('brand.name') }}</span>
  </NuxtLink>
</template>
