<script setup lang="ts">
import type { ClassPackage, ClassSession, Club, Coach, NewsArticle, Sport } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const { showGroupClasses, showPublicPackages } = useFeatures()
useHead({ title: () => `${t('brand.name')} — ${t('brand.tagline')}` })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: allClubs } = await useApiFetch<Club[]>('/api/clubs')
const { data: clubs, pending: clubsPending } = await useApiFetch<Club[]>('/api/clubs', { query: { featured: 'true' } })
const { data: coaches, pending: coachesPending } = await useApiFetch<Coach[]>('/api/coaches')
const { data: news, pending: newsPending } = await useApiFetch<NewsArticle[]>('/api/news')
const { data: classes, pending: classesPending } = await useApiFetch<ClassSession[]>('/api/classes', {
  immediate: showGroupClasses.value,
})
const { data: packages, pending: packagesPending } = await useApiFetch<ClassPackage[]>('/api/packages', {
  immediate: showPublicPackages.value,
})

const featuredClubs = computed(() => (clubs.value ?? []).slice(0, 6))
const featuredClasses = computed(() => (classes.value ?? []).slice(0, 3))
const featuredPackages = computed(() => (packages.value ?? []).slice(0, 6))
const topCoaches = computed(() => (coaches.value ?? []).slice(0, 4))
const latestNews = computed(() => (news.value ?? []).slice(0, 4))
</script>

<template>
  <div class="page-enter mx-auto max-w-7xl space-y-8 px-4 pb-10 pt-5 sm:space-y-10 sm:px-6 sm:pt-6">
    <HeroSearch :sports="sports ?? []" />

    <FeatureCards />

    <ClubsMap :clubs="allClubs ?? []" />

    <section>
      <SzSection :title="t('clubs.title')" :to="localePath('/clubs')" :link-text="t('clubs.viewAll')" />
      <HomeSectionSkeleton v-if="clubsPending" :count="6" />
      <div v-else-if="featuredClubs.length" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ClubCard v-for="club in featuredClubs" :key="club.id" :club="club" />
      </div>
      <SzEmptyState
        v-else
        :message="t('common.noResults')"
        :action-label="t('common.browseClubs')"
        :action-to="localePath('/clubs')"
      />
    </section>

    <section v-if="showPublicPackages">
      <SzSection :title="t('packages.title')" :to="localePath('/packages')" :link-text="t('packages.viewAll')" />
      <HomeSectionSkeleton v-if="packagesPending" :count="3" />
      <div v-else-if="featuredPackages.length" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PackageCard v-for="pkg in featuredPackages" :key="pkg.id" :pkg="pkg" />
      </div>
      <SzEmptyState
        v-else
        :message="t('common.noResults')"
        :action-label="t('packages.viewAll')"
        :action-to="localePath('/packages')"
      />
    </section>

    <section v-if="showGroupClasses">
      <SzSection :title="t('classes.title')" :to="localePath('/classes')" :link-text="t('classes.viewAll')" />
      <HomeSectionSkeleton v-if="classesPending" :count="3" />
      <div v-else-if="featuredClasses.length" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ClassCard v-for="c in featuredClasses" :key="c.id" :class-session="c" />
      </div>
      <SzEmptyState
        v-else
        :message="t('common.noResults')"
        :action-label="t('common.browseClubs')"
        :action-to="localePath('/clubs?book=1')"
      />
    </section>

    <section>
      <SzSection :title="t('coaches.title')" :to="localePath('/coaches')" :link-text="t('coaches.viewAll')" />
      <HomeSectionSkeleton v-if="coachesPending" variant="coach" :count="4" />
      <div v-else class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CoachCard v-for="coach in topCoaches" :key="coach.id" :coach="coach" />
      </div>
    </section>

    <section>
      <SzSection :title="t('news.title')" :to="localePath('/news')" :link-text="t('news.viewAll')" />
      <HomeSectionSkeleton v-if="newsPending" variant="list" :count="4" />
      <div v-else class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2">
        <NewsCard v-for="article in latestNews" :key="article.id" :article="article" />
      </div>
    </section>

    <FaqAccordion />

    <CtaBanner />
  </div>
</template>
