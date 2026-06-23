<script setup lang="ts">
const { t } = useI18n()
useHead({ title: () => t('footer.about') })
</script>

<template>
  <div class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <SzPageHeader :title="t('footer.about')" />
    <div class="glass-panel space-y-4 p-6 leading-relaxed text-sz-gray-700">
      <p>{{ t('aboutPage.p1') }}</p>
      <p>{{ t('aboutPage.p2') }}</p>
    </div>
    <div class="mt-8">
      <FaqAccordion />
    </div>
  </div>
</template>
