<script setup lang="ts">
const { t } = useI18n()

const pillars = [
  { key: 'freedom', sport: 'yoga', color: '#34c759' },
  { key: 'pricing', icon: 'star' as const, color: '#007aff' },
  { key: 'realtime', icon: 'bolt' as const, color: '#ff5a1f' },
] as const
</script>

<template>
  <SzSection :title="t('whyBook.title')" :eyebrow="t('whyBook.eyebrow')" />
  <div class="sz-stagger grid gap-4 md:grid-cols-3">
    <div
      v-for="p in pillars"
      :key="p.key"
      class="ios-card overflow-hidden"
    >
      <div class="h-1.5" :style="{ backgroundColor: p.color }" />
      <div class="p-6">
        <span class="inline-flex" :style="{ color: p.color }">
          <SportIcon v-if="'sport' in p" :slug="p.sport" size="lg" />
          <SzIcon v-else :name="p.icon" size="lg" />
        </span>
        <h3 class="mt-3 text-lg font-extrabold">{{ t(`whyBook.${p.key}.title`) }}</h3>
        <p class="mt-2 text-sm text-brand-gray-600">{{ t(`whyBook.${p.key}.desc`) }}</p>
      </div>
    </div>
  </div>
</template>
