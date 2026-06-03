<script setup lang="ts">
import type { NewsArticle } from '~/types'

defineProps<{ article: NewsArticle }>()
const { t } = useI18n()
const { localized, formatDate } = useLocaleContent()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink :to="localePath(`/news/${article.slug}`)" class="ios-card block p-5">
    <p class="ios-footnote mb-1">{{ formatDate(article.date) }}</p>
    <h3 class="ios-title-3 mb-2 leading-tight">{{ localized(article.titleFa, article.titleEn) }}</h3>
    <p class="text-sm text-sz-gray-600 line-clamp-2">{{ localized(article.excerptFa, article.excerptEn) }}</p>
    <span class="mt-3 inline-block text-sm font-medium text-sz-blue">{{ t('news.readMore') }} →</span>
  </NuxtLink>
</template>
