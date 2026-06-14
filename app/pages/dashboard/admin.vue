<script setup lang="ts">
import type { WalletTransaction } from '~/types'

definePageMeta({ middleware: ['auth', 'role-admin'] })

const { t } = useI18n()
const { user } = useUserSession()
const { pickName, localized, formatPrice } = useLocaleContent()

useHead({ title: () => t('dashboard.platformAdmin') })

const tab = ref('overview')

interface PlatformStats {
  role: 'PLATFORM_ADMIN'
  users: number
  clubs: number
  bookings: number
  classEnrollments: number
  platformFees: number
  walletBalance: number
  recentTransactions: WalletTransaction[]
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  wallet?: { balance: number } | null
  _count: { bookings: number }
}

interface AdminClub {
  id: string
  nameFa: string
  nameEn: string
  city: string
  owner?: { name: string; email: string } | null
  wallet?: { balance: number } | null
  _count?: { courts: number; classSessions: number }
}

const { data: stats } = await useApiFetch<PlatformStats>('/api/dashboard/stats')
const { data: users } = await useApiFetch<AdminUser[]>('/api/admin/users')
const { data: clubs } = await useApiFetch<AdminClub[]>('/api/admin/clubs')

const tabs = computed(() => [
  { id: 'overview', label: t('dashboard.overview') },
  { id: 'wallet', label: t('dashboard.walletTab') },
  { id: 'users', label: t('dashboard.allUsers') },
  { id: 'clubs', label: t('dashboard.allClubs') },
])

const statItems = computed(() => [
  { label: t('dashboard.allUsers'), value: stats.value?.users ?? 0, tone: 'blue' as const },
  { label: t('dashboard.allClubs'), value: stats.value?.clubs ?? 0, tone: 'orange' as const },
  { label: t('dashboard.platformFees'), value: formatPrice(stats.value?.platformFees ?? 0), tone: 'green' as const },
  { label: t('dashboard.walletBalance'), value: formatPrice(stats.value?.walletBalance ?? 0), tone: 'indigo' as const },
])

function txLabel(type: WalletTransaction['type']) {
  return t(`wallet.types.${type}`, type)
}
</script>

<template>
  <div class="page-enter mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-1">{{ t('dashboard.platformAdmin') }}</h1>
    <p class="ios-footnote mb-6">{{ t('dashboard.welcomeUser', { name: user?.name ?? '' }) }}</p>

    <DashboardTabs v-model="tab" :tabs="tabs" />

    <template v-if="tab === 'overview'">
      <DashboardStatGrid :items="statItems" />
      <div class="ios-card mb-8 grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
        <div class="text-center">
          <p class="text-xl font-bold">{{ stats?.bookings ?? 0 }}</p>
          <p class="ios-footnote">{{ t('dashboard.myBookings') }}</p>
        </div>
        <div class="text-center">
          <p class="text-xl font-bold">{{ stats?.classEnrollments ?? 0 }}</p>
          <p class="ios-footnote">{{ t('classes.title') }}</p>
        </div>
      </div>

      <h2 class="ios-title-2 mb-4">{{ t('dashboard.recentActivity') }}</h2>
      <div v-if="stats?.recentTransactions?.length" class="space-y-2">
        <div v-for="tx in stats.recentTransactions.slice(0, 10)" :key="tx.id" class="ios-card flex items-center justify-between gap-3 p-4">
          <div class="min-w-0">
            <p class="font-semibold">{{ localized(tx.noteFa, tx.noteEn) || txLabel(tx.type) }}</p>
            <p class="ios-footnote">
              {{ tx.user?.name ?? (tx.club ? pickName(tx.club) : '') }}
            </p>
          </div>
          <p class="shrink-0 font-bold" :class="tx.amount >= 0 ? 'text-brand-green' : 'text-brand-pink'">
            {{ tx.amount >= 0 ? '+' : '' }}{{ formatPrice(tx.amount) }}
          </p>
        </div>
      </div>
    </template>

    <WalletPanel v-else-if="tab === 'wallet'" kind="user" />

    <template v-else-if="tab === 'users'">
      <div class="space-y-2">
        <div v-for="u in users" :key="u.id" class="ios-card flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <p class="font-semibold">{{ u.name }}</p>
            <p class="ios-footnote">{{ u.email }} · {{ u.role }}</p>
          </div>
          <div class="text-end text-sm">
            <p>{{ formatPrice(u.wallet?.balance ?? 0) }} {{ t('clubs.currency') }}</p>
            <p class="ios-footnote">{{ u._count.bookings }} {{ t('dashboard.myBookings') }}</p>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="tab === 'clubs'">
      <div class="space-y-2">
        <div v-for="c in clubs" :key="c.id" class="ios-card p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-semibold">{{ pickName(c) }}</p>
              <p class="ios-footnote">{{ c.city }} · {{ c.owner?.name ?? '—' }}</p>
            </div>
            <p class="font-bold text-brand-green">{{ formatPrice(c.wallet?.balance ?? 0) }} {{ t('clubs.currency') }}</p>
          </div>
          <p class="ios-footnote mt-2">{{ c._count?.courts ?? 0 }} {{ t('dashboard.court') }} · {{ c._count?.classSessions ?? 0 }} {{ t('classes.title') }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
