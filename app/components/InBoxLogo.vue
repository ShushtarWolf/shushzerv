<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <NuxtLink :to="localePath('/')" class="flex items-center gap-2 tap-highlight">
    <span class="grid place-items-center w-9 h-9 rounded-xl bg-brand-primary shadow-card">
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none">
        <path d="M12 2.5C8.41 2.5 5.5 5.41 5.5 9c0 3.94 6.5 11.25 6.5 11.25S18.5 12.94 18.5 9c0-3.59-2.91-6.5-6.5-6.5Z" fill="#fff" opacity="0.95"/>
        <circle cx="12" cy="9" r="2.6" fill="#84CC16"/>
        <path d="M10.2 12.8c.9 1.35 1.8 1.9 1.8 1.9s.9-.55 1.8-1.9" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M14.2 13.8l2.2 1.1-.7 1.8-1.8-.4" fill="#fff" opacity="0.9"/>
      </svg>
    </span>
    <span class="text-lg font-bold tracking-tight">{{ t('brand.name') }}</span>
  </NuxtLink>
</template>
