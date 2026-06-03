<script setup lang="ts">
import type { NewsArticle } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { localized, formatDate } = useLocaleContent()

const slug = computed(() => String(route.params.slug))
const { data: article, error } = await useApiFetch<NewsArticle>(() => `/api/news/${slug.value}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}

useHead({
  title: () => (article.value ? localized(article.value.titleFa, article.value.titleEn) : t('news.title')),
})
</script>

<template>
  <article v-if="article" class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <NuxtLink :to="localePath('/news')" class="ios-footnote mb-4 inline-flex text-sz-blue">← {{ t('common.back') }}</NuxtLink>
    <p class="ios-footnote mb-2">{{ formatDate(article.date) }}</p>
    <h1 class="ios-large-title mb-4">{{ localized(article.titleFa, article.titleEn) }}</h1>
    <p class="text-lg text-sz-gray-600 mb-6">{{ localized(article.excerptFa, article.excerptEn) }}</p>
    <div class="prose prose-sz max-w-none whitespace-pre-line text-sz-gray-800 leading-relaxed">
      {{ localized(article.bodyFa, article.bodyEn) }}
    </div>
  </article>
</template>
