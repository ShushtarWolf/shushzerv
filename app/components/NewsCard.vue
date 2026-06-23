<script setup lang="ts">
import type { NewsArticle } from '~/types'

const props = defineProps<{ article: NewsArticle }>()
const { t } = useI18n()
const { localized, formatDate } = useLocaleContent()
const localePath = useLocalePath()
const { accent, softBg } = useSportTheme()
</script>

<template>
  <SzCard
    :to="localePath(`/news/${article.slug}`)"
    themed
    class="flex h-full flex-col overflow-hidden"
  >
    <div class="h-32 shrink-0 overflow-hidden transition-transform duration-500 group-hover:scale-105">
      <NewsCover :article="article" />
    </div>
    <div class="flex flex-1 flex-col p-5">
      <div class="mb-2 flex items-center justify-between gap-2">
        <p class="ios-footnote">{{ formatDate(article.date) }}</p>
        <span
          v-if="article.sport"
          class="inline-flex items-center justify-center rounded-lg p-1"
          :style="{ backgroundColor: softBg(accent), color: accent }"
        >
          <SportIcon :slug="article.sport.slug" size="xs" />
        </span>
      </div>
      <h3 class="ios-title-3 mb-2 leading-tight">{{ localized(article.titleFa, article.titleEn) }}</h3>
      <p class="flex-1 text-sm text-sz-gray-600 line-clamp-2">{{ localized(article.excerptFa, article.excerptEn) }}</p>
      <span class="mt-3 inline-block text-sm font-medium text-brand-orange transition-colors duration-200">
        {{ t('news.readMore') }} <span class="inline-block transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true">→</span>
      </span>
    </div>
  </SzCard>
</template>
