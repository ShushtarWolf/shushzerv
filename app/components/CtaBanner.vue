<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section class="relative overflow-hidden rounded-ios-lg bg-gradient-to-br from-sz-blue to-sz-indigo p-8 text-white md:p-12">
    <div class="absolute -top-10 -end-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <div class="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <h2 class="text-2xl font-bold leading-tight md:max-w-md">{{ t('cta.banner') }}</h2>
      <NuxtLink :to="localePath('/clubs')" class="ios-btn bg-white text-sz-blue hover:bg-white/90">
        {{ t('cta.button') }}
      </NuxtLink>
    </div>
  </section>
</template>
