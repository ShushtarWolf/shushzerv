<script setup lang="ts">
import type { NewsArticle } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: () => t('news.title') })

const { data: articles, pending } = await useApiFetch<NewsArticle[]>('/api/news')
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <SzPageHeader :title="t('news.title')" />
    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <div v-else-if="articles?.length" class="sz-stagger grid items-stretch gap-4 sm:grid-cols-2">
      <NewsCard v-for="article in articles" :key="article.id" :article="article" />
    </div>
    <SzEmptyState
      v-else
      :message="t('common.noResults')"
      :action-label="t('nav.home')"
      :action-to="localePath('/')"
    />
  </div>
</template>
