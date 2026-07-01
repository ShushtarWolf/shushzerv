<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <NuxtLink :to="localePath('/')" class="flex items-center gap-2 tap-highlight">
    <svg viewBox="0 0 24 24" class="h-9 w-9 text-brand-gray-900" fill="none" aria-hidden="true">
      <g transform="translate(12 15)" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-5.5 2 H5.5 M-5.5 2 V4.5 M5.5 2 V4.5"/>
        <g transform="translate(0 -2) rotate(14)">
          <path d="M-4.8 -0.4 H4.8 M-4.8 -0.4 V-3.2 M4.8 -0.4 V-3.2"/>
        </g>
        <circle cx="0" cy="-5.8" r="2.3" fill="currentColor" stroke="none"/>
      </g>
    </svg>
    <span class="text-lg font-bold tracking-tight">{{ t('brand.name') }}</span>
  </NuxtLink>
</template>
