<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section class="overflow-hidden rounded-ios-lg bg-brand-orange p-8 text-white shadow-lifted md:p-12">
    <div class="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <h2 class="text-2xl font-bold leading-tight md:max-w-md">{{ t('cta.banner') }}</h2>
      <NuxtLink :to="localePath('/clubs')" class="ios-btn bg-white text-brand-orange hover:bg-white/90">
        {{ t('cta.button') }}
      </NuxtLink>
    </div>
  </section>
</template>
