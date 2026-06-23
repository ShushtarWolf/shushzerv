<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section class="overflow-hidden rounded-ios-lg bg-brand-primary p-8 text-white shadow-lifted md:p-12">
    <div class="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <h2 class="text-2xl font-bold leading-tight md:max-w-md">{{ t('cta.banner') }}</h2>
      <SzButton :to="localePath('/clubs?book=1')" variant="secondary" class="!bg-white !text-brand-orange hover:!bg-white/90">
        {{ t('cta.button') }}
      </SzButton>
    </div>
  </section>
</template>
