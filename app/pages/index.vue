<script setup lang="ts">
import type { Club, Coach, NewsArticle, Sport } from '~/types'

const { t } = useI18n()
useHead({ title: () => `${t('brand.name')} — ${t('brand.tagline')}` })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: clubs } = await useApiFetch<Club[]>('/api/clubs', { query: { featured: 'true' } })
const { data: coaches } = await useApiFetch<Coach[]>('/api/coaches')
const { data: news } = await useApiFetch<NewsArticle[]>('/api/news')

const featuredClubs = computed(() => (clubs.value ?? []).slice(0, 6))
const topCoaches = computed(() => (coaches.value ?? []).slice(0, 4))
const latestNews = computed(() => (news.value ?? []).slice(0, 4))
</script>

<template>
  <div class="page-enter">
    <section class="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <HeroSection />
    </section>
    <section class="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <SearchPanel :sports="sports ?? []" />
    </section>
    <FeatureCards />
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <SectionHeader :title="t('categories.title')" to="/explore" :link-text="t('categories.showMore')" />
      <SportCategoryGrid :sports="sports ?? []" />
    </section>
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <SectionHeader :title="t('clubs.title')" to="/clubs" :link-text="t('clubs.viewAll')" />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ClubCard v-for="club in featuredClubs" :key="club.id" :club="club" />
      </div>
    </section>
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <SectionHeader :title="t('coaches.title')" to="/coaches" :link-text="t('coaches.viewAll')" />
      <div class="grid gap-3 sm:grid-cols-2">
        <CoachCard v-for="coach in topCoaches" :key="coach.id" :coach="coach" />
      </div>
    </section>
    <WhyShushzervSection />
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <SectionHeader :title="t('news.title')" to="/news" :link-text="t('news.viewAll')" />
      <div class="grid gap-4 sm:grid-cols-2">
        <NewsCard v-for="article in latestNews" :key="article.id" :article="article" />
      </div>
    </section>
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <FaqAccordion />
    </section>
    <section class="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      <CtaBanner />
    </section>
  </div>
</template>
