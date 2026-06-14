<script setup lang="ts">
import type { NewsArticle } from '~/types'

const props = defineProps<{ article: NewsArticle }>()
const { resolveAccent, darken } = useSportTheme()

const topicColor = computed(() => resolveAccent(props.article.sport))
const topicColorDark = computed(() => darken(topicColor.value, 0.2))
</script>

<template>
  <svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" class="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img">
    <defs>
      <linearGradient :id="`news-${article.slug}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" :stop-color="topicColor" />
        <stop offset="100%" :stop-color="topicColorDark" />
      </linearGradient>
    </defs>
    <rect width="600" height="200" :fill="`url(#news-${article.slug})`" />
    <circle cx="480" cy="50" r="60" fill="#fff" opacity="0.08" />
    <circle cx="100" cy="160" r="40" fill="#fff" opacity="0.06" />
    <rect x="40" y="80" width="200" height="4" rx="2" fill="#fff" opacity="0.3" />
    <rect x="40" y="100" width="140" height="4" rx="2" fill="#fff" opacity="0.2" />
    <rect x="40" y="120" width="170" height="4" rx="2" fill="#fff" opacity="0.15" />
  </svg>
</template>
