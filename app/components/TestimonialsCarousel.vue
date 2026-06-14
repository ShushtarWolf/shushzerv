<script setup lang="ts">
import type { Review } from '~/types'

const { data: reviews } = await useApiFetch<Review[]>('/api/reviews')
const { t } = useI18n()
const { localized } = useLocaleContent()
</script>

<template>
  <SzSection v-if="reviews?.length" :title="t('testimonials.title')" :subtitle="t('testimonials.subtitle')" />
  <div v-if="reviews?.length" class="flex gap-4 overflow-x-auto pb-2 sz-scroll-x -mx-1 px-1">
    <div
      v-for="r in reviews"
      :key="r.id"
      class="ios-card w-72 shrink-0 p-5"
    >
      <div class="mb-2 flex gap-0.5 text-brand-yellow">
        <span v-for="i in r.rating" :key="i">★</span>
      </div>
      <p class="text-sm leading-relaxed text-brand-gray-700">
        "{{ localized(r.bodyFa, r.bodyEn) }}"
      </p>
      <p class="mt-3 text-sm font-bold">{{ r.user?.name ?? t('testimonials.anonymous') }}</p>
    </div>
  </div>
</template>

<style scoped>
.sz-scroll-x::-webkit-scrollbar { display: none; }
.sz-scroll-x { scrollbar-width: none; }
</style>
