<script setup lang="ts">
import type { Coach, TrainingPlan } from '~/types'

definePageMeta({ middleware: ['auth', 'role-coach'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useUserSession()
const { pickName, localized, formatPrice } = useLocaleContent()
const { cityLabel } = useCities()

useHead({ title: () => t('dashboard.coach') })

const tab = ref('overview')

interface CoachStats {
  role: 'COACH'
  sessions: number
  rating: number
  plans: number
  students: number
  classes: number
  totalEarnings: number
  walletBalance: number
}

const { data: coaches } = await useApiFetch<Coach[]>('/api/coaches')
const { data: plans, refresh: refreshPlans } = await useApiFetch<TrainingPlan[]>('/api/training-plans')
const { data: stats, refresh: refreshStats } = await useApiFetch<CoachStats>('/api/dashboard/stats')

const profile = computed(() => coaches.value?.find((c) => c.userId === user.value?.id))

const tabs = computed(() => [
  { id: 'overview', label: t('dashboard.overview') },
  { id: 'wallet', label: t('dashboard.walletTab') },
  { id: 'plans', label: t('dashboard.plansTab') },
])

const statItems = computed(() => [
  { label: t('dashboard.walletBalance'), value: formatPrice(stats.value?.walletBalance ?? 0), tone: 'green' as const },
  { label: t('dashboard.totalEarnings'), value: formatPrice(stats.value?.totalEarnings ?? 0), tone: 'orange' as const },
  { label: t('dashboard.myStudents'), value: stats.value?.students ?? 0, tone: 'indigo' as const },
  { label: t('classes.title'), value: stats.value?.classes ?? 0, tone: 'blue' as const },
])

const newPlan = ref({ titleFa: '', titleEn: '', bodyFa: '', bodyEn: '', athleteEmail: '' })
const message = ref('')

async function createPlan() {
  if (!newPlan.value.titleFa || !newPlan.value.bodyFa) return
  await $fetch('/api/coach/plans', { method: 'POST', body: newPlan.value })
  newPlan.value = { titleFa: '', titleEn: '', bodyFa: '', bodyEn: '', athleteEmail: '' }
  message.value = t('common.save')
  await refreshPlans()
}
</script>

<template>
  <div class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <SzPageHeader :title="t('dashboard.coach')" :subtitle="t('dashboard.welcomeUser', { name: user?.name ?? '' })" />
    <p v-if="message" class="mb-4 text-sm text-sz-green">{{ message }}</p>

    <DashboardTabs v-model="tab" :tabs="tabs" />

    <template v-if="tab === 'overview'">
      <DashboardStatGrid :items="statItems" />

      <div v-if="profile" class="glass-panel mb-8 p-6">
        <h2 class="ios-title-2">{{ pickName(profile) }}</h2>
        <p class="ios-footnote mt-2">{{ cityLabel(profile.city) }} · ★ {{ profile.rating.toFixed(1) }}</p>
        <p class="mt-4 text-sz-gray-700">{{ localized(profile.bioFa || '', profile.bioEn || '') }}</p>
        <div class="mt-6 grid grid-cols-2 gap-4">
          <div class="ios-card p-4 text-center">
            <p class="text-2xl font-bold text-sz-blue">{{ stats?.sessions ?? profile.sessions }}</p>
            <p class="ios-footnote">{{ t('dashboard.mySessions') }}</p>
          </div>
          <div class="ios-card p-4 text-center">
            <p class="text-2xl font-bold text-sz-indigo">{{ stats?.students ?? 0 }}</p>
            <p class="ios-footnote">{{ t('dashboard.myStudents') }}</p>
          </div>
        </div>
      </div>
      <p v-else class="ios-footnote mb-6">{{ t('common.noResults') }}</p>

      <NuxtLink :to="localePath('/coaches')" class="ios-btn-ghost inline-flex">{{ t('coaches.viewAll') }}</NuxtLink>
    </template>

    <WalletPanel v-else-if="tab === 'wallet'" kind="user" />

    <template v-else-if="tab === 'plans'">
      <section>
        <h2 class="ios-title-2 mb-4">{{ t('trainingPlans.manage') }}</h2>
        <div v-if="plans?.length" class="mb-4 space-y-3">
          <div v-for="plan in plans" :key="plan.id" class="ios-card p-4">
            <p class="font-semibold">{{ localized(plan.titleFa, plan.titleEn) }}</p>
            <p class="mt-1 whitespace-pre-line text-sm text-sz-gray-600">{{ localized(plan.bodyFa, plan.bodyEn) }}</p>
            <p v-if="plan.assignments?.length" class="ios-footnote mt-2">
              {{ plan.assignments.length }} {{ t('dashboard.myStudents') }}
            </p>
          </div>
        </div>
        <div class="glass-panel grid gap-3 p-4">
          <input v-model="newPlan.titleFa" class="ios-input" :placeholder="t('trainingPlans.titleField')" />
          <textarea v-model="newPlan.bodyFa" class="ios-input min-h-24" :placeholder="t('trainingPlans.bodyField')" />
          <input v-model="newPlan.athleteEmail" type="email" class="ios-input" :placeholder="t('trainingPlans.assignEmail')" />
          <button type="button" class="ios-btn-primary" @click="createPlan">{{ t('trainingPlans.create') }}</button>
        </div>
      </section>
    </template>
  </div>
</template>
