<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section class="glass-panel relative overflow-hidden p-8 md:p-12">
    <div class="absolute -top-16 -end-16 h-56 w-56 rounded-full bg-sz-blue/20 blur-3xl" />
    <div class="absolute -bottom-20 -start-10 h-56 w-56 rounded-full bg-sz-indigo/20 blur-3xl" />
    <div class="relative max-w-xl space-y-4">
      <span class="inline-block rounded-full bg-sz-accent-soft px-3 py-1 text-xs font-semibold text-sz-blue">
        {{ t('brand.tagline') }}
      </span>
      <h1 class="ios-large-title">{{ t('hero.title') }}</h1>
      <p class="text-lg text-sz-gray-600">{{ t('hero.subtitle') }}</p>
      <div class="flex flex-wrap gap-3 pt-2">
        <NuxtLink :to="localePath('/clubs')" class="ios-btn-primary">{{ t('hero.cta') }}</NuxtLink>
        <NuxtLink :to="localePath('/explore')" class="ios-btn-secondary">{{ t('hero.secondary') }}</NuxtLink>
      </div>
    </div>
  </section>
</template>
