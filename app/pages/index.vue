<script setup lang="ts">
import type { ClassSession, Club, Coach, NewsArticle, OpenMatch, Sport } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: () => `${t('brand.name')} — ${t('brand.tagline')}` })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: allClubs } = await useApiFetch<Club[]>('/api/clubs')
const { data: clubs } = await useApiFetch<Club[]>('/api/clubs', { query: { featured: 'true' } })
const { data: coaches } = await useApiFetch<Coach[]>('/api/coaches')
const { data: news } = await useApiFetch<NewsArticle[]>('/api/news')
const { data: classes } = await useApiFetch<ClassSession[]>('/api/classes')
const { data: matches } = await useApiFetch<OpenMatch[]>('/api/matches')

const featuredClubs = computed(() => (clubs.value ?? []).slice(0, 6))
const featuredClasses = computed(() => (classes.value ?? []).slice(0, 3))
const openMatches = computed(() => (matches.value ?? []).slice(0, 3))
const topCoaches = computed(() => (coaches.value ?? []).slice(0, 4))
const latestNews = computed(() => (news.value ?? []).slice(0, 4))
const { slug: selectedSport } = useSelectedSportColor()
</script>

<template>
  <div class="page-enter">
    <section class="mx-auto max-w-7xl space-y-4 px-4 pt-6 sm:px-6">
      <HeroSearch :sports="sports ?? []" />
    </section>

    <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SportShowcase :sports="sports ?? []" />
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SzTrustStrip />
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SzSection :title="t('matches.title')" :to="localePath('/matches')" :link-text="t('matches.viewAll')" />
      <div :key="selectedSport" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MatchCard v-for="m in openMatches" :key="m.id" :match="m" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SzSection :title="t('map.title')" />
      <ClubsMap :clubs="allClubs ?? []" />
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <FeatureCards />
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SzSection :title="t('clubs.title')" :to="localePath('/clubs')" :link-text="t('clubs.viewAll')" />
      <div :key="selectedSport" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ClubCard v-for="club in featuredClubs" :key="club.id" :club="club" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SzSection :title="t('classes.title')" :to="localePath('/classes')" :link-text="t('classes.viewAll')" />
      <div :key="selectedSport" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ClassCard v-for="c in featuredClasses" :key="c.id" :class-session="c" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SzSection :title="t('coaches.title')" :to="localePath('/coaches')" :link-text="t('coaches.viewAll')" />
      <div :key="selectedSport" class="sz-stagger sz-grid-enter grid items-stretch gap-3 sm:grid-cols-2">
        <CoachCard v-for="coach in topCoaches" :key="coach.id" :coach="coach" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <WhyBookSection />
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <TestimonialsCarousel />
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SzSection :title="t('news.title')" :to="localePath('/news')" :link-text="t('news.viewAll')" />
      <div :key="selectedSport" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2">
        <NewsCard v-for="article in latestNews" :key="article.id" :article="article" />
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <FaqAccordion />
    </section>

    <section class="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <CtaBanner />
    </section>
  </div>
</template>
