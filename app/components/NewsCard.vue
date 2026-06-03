<script setup lang="ts">
import type { NewsArticle } from '~/types'

defineProps<{ article: NewsArticle }>()
const localePath = useLocalePath()
const { localized, formatDate } = useLocaleContent()
</script>

<template>
  <NuxtLink :to="localePath(`/news/${article.slug}`)" class="ios-card block p-4">
    <p class="ios-footnote mb-1">{{ formatDate(article.date) }}</p>
    <h3 class="ios-title-3 line-clamp-2">{{ localized(article.titleFa, article.titleEn) }}</h3>
    <p class="mt-1.5 line-clamp-2 text-sm text-brand-gray-600">{{ localized(article.excerptFa, article.excerptEn) }}</p>
    <span class="mt-2 inline-block text-xs font-semibold text-brand-blue">{{ $t('news.readMore') }} →</span>
  </NuxtLink>
</template>
