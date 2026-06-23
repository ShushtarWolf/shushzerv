<script setup lang="ts">
const { t } = useI18n()

const pillars = [
  { key: 'freedom', sport: 'yoga' as const },
  { key: 'pricing', icon: 'star' as const },
  { key: 'realtime', icon: 'bolt' as const },
] as const
</script>

<template>
  <SzSection :title="t('whyBook.title')" :eyebrow="t('whyBook.eyebrow')" />
  <div class="sz-stagger grid gap-4 md:grid-cols-3">
    <div
      v-for="p in pillars"
      :key="p.key"
      class="ios-card overflow-hidden rounded-2xl p-6"
    >
      <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
        <SportIcon v-if="'sport' in p" :slug="p.sport" size="md" />
        <SzIcon v-else :name="p.icon" size="md" />
      </span>
      <h3 class="mt-4 text-lg font-extrabold text-brand-gray-900">{{ t(`whyBook.${p.key}.title`) }}</h3>
      <p class="mt-2 text-sm leading-relaxed text-brand-gray-600">{{ t(`whyBook.${p.key}.desc`) }}</p>
    </div>
  </div>
</template>
