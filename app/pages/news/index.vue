<script setup lang="ts">
import type { NewsArticle } from '~/types'

const { t } = useI18n()
useHead({ title: () => t('nav.news') })

const { data: articles, pending } = await useApiFetch<NewsArticle[]>('/api/news')
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-6">{{ t('news.title') }}</h1>
    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <div v-else-if="articles?.length" class="sz-stagger grid items-stretch gap-4 sm:grid-cols-2">
      <NewsCard v-for="article in articles" :key="article.id" :article="article" />
    </div>
    <p v-else class="ios-footnote">{{ t('common.noResults') }}</p>
  </div>
</template>
