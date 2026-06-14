<script setup lang="ts">
import type { AthleteProfile, Booking, Sport, TrainingPlan, UserBadge } from '~/types'

definePageMeta({ middleware: ['auth', 'role-athlete'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useUserSession()
const { pickName, localized, formatPrice, formatDate, localDateISO } = useLocaleContent()
const { levels, levelLabel } = useSkillLevel()

useHead({ title: () => t('dashboard.title') })

const tab = ref('overview')

interface ProfileResponse {
  profile: AthleteProfile | null
  badges: UserBadge[]
  progress: { level: number; into: number; next: number; ratio: number }
  stats: { classEnrollments: number; matchesJoined: number; bookings: number }
}

interface AthleteStats {
  role: 'ATHLETE'
  bookings: number
  classes: number
  matches: number
  walletBalance: number
  totalSpent: number
}

const { data: bookings, refresh } = await useApiFetch<Booking[]>('/api/bookings')
const { data: profileData, refresh: refreshProfile } = await useApiFetch<ProfileResponse>('/api/profile')
const { data: plans } = await useApiFetch<TrainingPlan[]>('/api/training-plans')
const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: stats, refresh: refreshStats } = await useApiFetch<AthleteStats>('/api/dashboard/stats')

const level = ref(profileData.value?.profile?.level ?? 'BEGINNER')
const sportSlug = ref(profileData.value?.profile?.sport?.slug ?? 'tennis')

watch(() => profileData.value?.profile, (p) => {
  if (p) {
    level.value = p.level
    sportSlug.value = p.sport?.slug ?? 'tennis'
  }
})

const tabs = computed(() => [
  { id: 'overview', label: t('dashboard.overview') },
  { id: 'wallet', label: t('dashboard.walletTab') },
  { id: 'bookings', label: t('dashboard.bookingsTab') },
  { id: 'plans', label: t('dashboard.plansTab') },
])

const statItems = computed(() => [
  { label: t('dashboard.walletBalance'), value: formatPrice(stats.value?.walletBalance ?? 0), tone: 'green' as const },
  { label: t('dashboard.totalSpent'), value: formatPrice(stats.value?.totalSpent ?? 0), tone: 'pink' as const },
  { label: t('dashboard.myBookings'), value: stats.value?.bookings ?? 0, tone: 'blue' as const },
  { label: t('classes.title'), value: stats.value?.classes ?? 0, tone: 'orange' as const },
])

const upcoming = computed(() => {
  const today = localDateISO()
  return (bookings.value ?? []).filter((b) => b.status !== 'CANCELLED' && b.slot && b.slot.date >= today)
})
const past = computed(() => {
  const today = localDateISO()
  return (bookings.value ?? []).filter((b) => b.status === 'CANCELLED' || (b.slot && b.slot.date < today))
})

async function cancelBooking(id: string) {
  await $fetch(`/api/bookings/${id}`, { method: 'DELETE' })
  await Promise.all([refresh(), refreshStats()])
}

async function saveProfile() {
  await $fetch('/api/profile', { method: 'PATCH', body: { level: level.value, sport: sportSlug.value } })
  await refreshProfile()
}
</script>

<template>
  <div class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <h1 class="sz-headline mb-1">{{ t('dashboard.title') }}</h1>
    <p class="mb-6 text-brand-gray-600">{{ t('dashboard.welcomeUser', { name: user?.name ?? '' }) }}</p>

    <DashboardTabs v-model="tab" :tabs="tabs" />

    <template v-if="tab === 'overview'">
      <DashboardStatGrid :items="statItems" />

      <section v-if="profileData?.profile" class="ios-card mb-8 overflow-hidden">
        <div class="bg-brand-orange p-5 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-white/80">{{ t('gamification.level') }}</p>
              <p class="text-3xl font-black">{{ profileData.progress.level }}</p>
            </div>
            <div class="text-end">
              <p class="text-sm font-semibold">{{ profileData.profile.xp }} XP</p>
              <p class="text-xs text-white/70">{{ profileData.progress.into }}/{{ profileData.progress.next }}</p>
            </div>
          </div>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
            <div class="h-full rounded-full bg-brand-yellow transition-all" :style="{ width: `${profileData.progress.ratio * 100}%` }" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 p-4 text-center text-sm">
          <div>
            <p class="font-black text-brand-orange">{{ profileData.profile.matchesPlayed }}</p>
            <p class="text-xs text-brand-gray-500">{{ t('dashboard.matchesPlayed') }}</p>
          </div>
          <div>
            <p class="font-black text-brand-green">{{ profileData.profile.wins }}</p>
            <p class="text-xs text-brand-gray-500">{{ t('dashboard.wins') }}</p>
          </div>
          <div>
            <p class="font-black text-brand-blue">{{ profileData.stats.matchesJoined }}</p>
            <p class="text-xs text-brand-gray-500">{{ t('matches.title') }}</p>
          </div>
        </div>
        <div v-if="profileData.badges?.length" class="flex flex-wrap gap-2 border-t border-brand-gray-100 p-4">
          <SzBadge v-for="b in profileData.badges" :key="b.id" tone="orange">
            {{ t(`badges.${b.code}`, b.code) }}
          </SzBadge>
        </div>
      </section>

      <section class="glass-panel mb-8 p-4">
        <h2 class="ios-title-3 mb-3">{{ t('dashboard.myLevel') }}</h2>
        <div v-if="sports?.length" class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="s in sports"
            :key="s.id"
            type="button"
            class="sz-chip tap-highlight"
            :class="sportSlug === s.slug ? 'text-white shadow-card' : 'bg-white shadow-card'"
            :style="sportSlug === s.slug ? { backgroundColor: s.color } : undefined"
            @click="sportSlug = s.slug"
          >
            <span class="inline-flex items-center gap-1.5">
              <SportIcon :slug="s.slug" size="sm" />
              {{ t(`sport.${s.slug}.name`) }}
            </span>
          </button>
        </div>
        <select v-model="level" class="ios-input">
          <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
        </select>
        <button type="button" class="ios-btn-primary mt-3" @click="saveProfile">{{ t('common.save') }}</button>
      </section>

      <div class="flex flex-wrap gap-3">
        <NuxtLink :to="localePath('/clubs')" class="ios-btn-primary inline-flex">{{ t('hero.cta') }}</NuxtLink>
        <NuxtLink :to="localePath('/matches')" class="ios-btn-ghost inline-flex">{{ t('matches.title') }}</NuxtLink>
        <NuxtLink :to="localePath('/chat')" class="ios-btn-ghost inline-flex">{{ t('nav.chat') }}</NuxtLink>
      </div>
    </template>

    <WalletPanel v-else-if="tab === 'wallet'" kind="user" can-top-up />

    <template v-else-if="tab === 'bookings'">
      <h2 class="ios-title-2 mb-4">{{ t('dashboard.upcoming') }}</h2>
      <div v-if="upcoming.length" class="mb-10 space-y-3">
        <div v-for="b in upcoming" :key="b.id" class="ios-card p-4">
          <p class="font-semibold">{{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }}</p>
          <p class="ios-footnote">
            {{ b.slot?.court ? pickName(b.slot.court) : '' }} ·
            {{ b.slot?.date ? formatDate(b.slot.date) : '' }} ·
            {{ b.slot?.startTime }}–{{ b.slot?.endTime }}
          </p>
          <p class="mt-1 text-sm">
            {{ formatPrice(b.slot?.price ?? 0) }} {{ t('clubs.currency') }} ·
            {{ b.paymentStatus === 'PAID' ? t('wallet.payWithWallet') : t('booking.payAtClub') }}
          </p>
          <button class="mt-3 text-sm font-medium text-brand-pink" @click="cancelBooking(b.id)">{{ t('dashboard.cancel') }}</button>
        </div>
      </div>
      <p v-else class="ios-footnote mb-10">{{ t('dashboard.noBookings') }}</p>

      <h2 class="ios-title-2 mb-4">{{ t('dashboard.past') }}</h2>
      <div v-if="past.length" class="space-y-3">
        <div v-for="b in past" :key="b.id" class="ios-card p-4 opacity-80">
          <p class="font-semibold">{{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }}</p>
          <p class="ios-footnote">
            {{ formatDate(b.slot?.date ?? '') }} · {{ b.status === 'CANCELLED' ? t('dashboard.cancelled') : t('dashboard.past') }}
          </p>
        </div>
      </div>
      <p v-else class="ios-footnote">{{ t('dashboard.noBookings') }}</p>
    </template>

    <template v-else-if="tab === 'plans'">
      <section v-if="plans?.length">
        <div class="space-y-3">
          <div v-for="plan in plans" :key="plan.id" class="ios-card p-4">
            <p class="font-semibold">{{ localized(plan.titleFa, plan.titleEn) }}</p>
            <p v-if="plan.coach" class="ios-footnote">{{ pickName(plan.coach) }}</p>
            <p class="mt-2 whitespace-pre-line text-sm text-brand-gray-700">{{ localized(plan.bodyFa, plan.bodyEn) }}</p>
          </div>
        </div>
      </section>
      <p v-else class="ios-footnote">{{ t('common.noResults') }}</p>
    </template>
  </div>
</template>
