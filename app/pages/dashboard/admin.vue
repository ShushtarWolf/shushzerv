<script setup lang="ts">
import type { WalletTransaction } from '~/types'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role-admin'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useUserSession()
const { displayName } = useUserDisplayName()
const { pickName, localized, formatPrice, formatNumber, formatRating } = useLocaleContent()

useHead({ title: () => t('dashboard.platformAdmin') })

const tab = useDashboardTab('overview')
const searchQuery = ref('')
const userPage = ref(1)
const clubPage = ref(1)
const coachPage = ref(1)

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
  suspendedAt?: string | null
  wallet?: { balance: number } | null
  _count: { bookings: number }
}

interface AdminClub {
  id: string
  nameFa: string
  nameEn: string
  city: string
  featured: boolean
  owner?: { name: string; email: string } | null
  wallet?: { balance: number } | null
  _count?: { courts: number; classSessions: number; reviews: number }
}

interface AdminCoach {
  id: string
  nameFa: string
  nameEn: string
  city: string
  rating: number
  sessions: number
  featured: boolean
  sport?: { nameFa: string; nameEn: string; slug: string }
  user?: { id: string; email: string; name: string; suspendedAt?: string | null } | null
  _count?: { coachSessions: number; trainingPlans: number; reviews: number }
}

const { data: stats } = await useApiFetch<PlatformStats>('/api/dashboard/stats')
const { data: chartData, error: chartsError, pending: chartsPending, refresh: refreshCharts } = await useApiFetch<{
  labels: string[]
  users: number[]
  clubs: number[]
  bookings: number[]
  fees: number[]
}>('/api/dashboard/charts')

const { formatMonthLabels } = useDashboardChartLabels()
const { lineOptions, barOptions, colors } = useDashboardChartTheme()

const monthLabels = computed(() => formatMonthLabels(chartData.value?.labels ?? []))

const growthSeries = computed(() => [
  { name: t('dashboard.allUsers'), data: chartData.value?.users ?? [] },
  { name: t('dashboard.allClubs'), data: chartData.value?.clubs ?? [] },
])

const activitySeries = computed(() => [
  { name: t('dashboard.myBookings'), data: chartData.value?.bookings ?? [] },
  { name: t('dashboard.platformFees'), data: chartData.value?.fees ?? [] },
])

const { data: usersData, refresh: refreshUsers } = await useApiFetch<{ items: AdminUser[]; total: number }>('/api/admin/users', {
  query: computed(() => ({ q: searchQuery.value || undefined, page: userPage.value, limit: 20 })),
  watch: [searchQuery, userPage],
})

const { data: clubsData, refresh: refreshClubs } = await useApiFetch<{ items: AdminClub[]; total: number }>('/api/admin/clubs', {
  query: computed(() => ({ q: searchQuery.value || undefined, page: clubPage.value, limit: 20 })),
  watch: [searchQuery, clubPage],
})

const { data: adminBookings } = await useApiFetch('/api/admin/bookings')
const { data: adminMatches } = await useApiFetch('/api/admin/matches')
const { data: adminClasses } = await useApiFetch('/api/admin/classes')
const { data: adminCoaches, refresh: refreshCoaches } = await useApiFetch<{ items: AdminCoach[]; total: number }>('/api/admin/coaches', {
  query: computed(() => ({ q: searchQuery.value || undefined, page: coachPage.value, limit: 20 })),
  watch: [searchQuery, coachPage],
})
const { data: newsArticles, refresh: refreshNews } = await useApiFetch('/api/admin/news')

const users = computed(() => usersData.value?.items ?? [])
const clubs = computed(() => clubsData.value?.items ?? [])
const coaches = computed(() => adminCoaches.value?.items ?? [])
const userTotalPages = computed(() => Math.max(1, Math.ceil((usersData.value?.total ?? 0) / 20)))
const clubTotalPages = computed(() => Math.max(1, Math.ceil((clubsData.value?.total ?? 0) / 20)))
const coachTotalPages = computed(() => Math.max(1, Math.ceil((adminCoaches.value?.total ?? 0) / 20)))

const editingArticleId = ref('')
const editArticle = ref({ titleFa: '', titleEn: '', bodyFa: '', excerptFa: '' })

const tabs = computed(() => [
  { id: 'overview', label: t('dashboard.overview'), icon: 'grid' },
  { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet' },
  { id: 'users', label: t('dashboard.allUsers'), icon: 'users' },
  { id: 'clubs', label: t('dashboard.allClubs'), icon: 'building' },
  { id: 'coaches', label: t('dashboard.allCoaches'), icon: 'users' },
  { id: 'bookings', label: t('dashboard.bookingsTab'), icon: 'chart' },
  { id: 'matches', label: t('matches.title'), icon: 'calendar' },
  { id: 'classes', label: t('classes.title'), icon: 'users' },
  { id: 'news', label: t('nav.news'), icon: 'grid' },
])

provideDashboardSidebar(tabs, tab)

const statItems = computed(() => [
  { label: t('dashboard.platformFees'), value: formatPrice(stats.value?.platformFees ?? 0), tone: 'blue' as const, icon: 'wallet' },
  { label: t('dashboard.allUsers'), value: formatNumber(stats.value?.users ?? 0), tone: 'pink' as const, icon: 'users' },
  { label: t('dashboard.allClubs'), value: formatNumber(stats.value?.clubs ?? 0), tone: 'orange' as const, icon: 'building' },
  { label: t('dashboard.myBookings'), value: formatNumber(stats.value?.bookings ?? 0), tone: 'green' as const, icon: 'chart' },
])

const topClubs = computed(() => {
  const list = clubs.value ?? []
  const maxReviews = Math.max(...list.map((c) => c._count?.reviews ?? 0), 1)
  return list
    .slice()
    .sort((a, b) => (b._count?.reviews ?? 0) - (a._count?.reviews ?? 0))
    .slice(0, 5)
    .map((c) => ({
      name: pickName(c),
      popularity: Math.round(((c._count?.reviews ?? 0) / maxReviews) * 100),
      value: formatNumber(c._count?.courts ?? 0) + ' ' + t('dashboard.court'),
    }))
})

const newArticle = ref({ slug: '', titleFa: '', titleEn: '', excerptFa: '', bodyFa: '' })
const message = ref('')

function txLabel(type: WalletTransaction['type']) {
  return t(`wallet.types.${type}`, type)
}

async function updateUserRole(id: string, role: string) {
  await $fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: { role } })
  message.value = t('common.save')
  await refreshUsers()
}

async function toggleUserSuspended(id: string, suspended: boolean) {
  await $fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: { suspended: !suspended } })
  message.value = t('common.save')
  await refreshUsers()
}

async function toggleClubFeatured(id: string, featured: boolean) {
  await $fetch(`/api/admin/clubs/${id}`, { method: 'PATCH', body: { featured: !featured } })
  message.value = t('common.save')
  await refreshClubs()
}

async function toggleCoachFeatured(id: string, featured: boolean) {
  await $fetch(`/api/admin/coaches/${id}`, { method: 'PATCH', body: { featured: !featured } })
  message.value = t('common.save')
  await refreshCoaches()
}

async function createArticle() {
  if (!newArticle.value.slug || !newArticle.value.titleFa) return
  await $fetch('/api/admin/news', {
    method: 'POST',
    body: {
      ...newArticle.value,
      titleEn: newArticle.value.titleEn || newArticle.value.titleFa,
      excerptEn: newArticle.value.excerptFa,
      bodyEn: newArticle.value.bodyFa,
    },
  })
  newArticle.value = { slug: '', titleFa: '', titleEn: '', excerptFa: '', bodyFa: '' }
  message.value = t('common.save')
  await refreshNews()
}

function startEditArticle(article: { id: string; titleFa: string; titleEn: string; bodyFa: string; excerptFa: string }) {
  editingArticleId.value = article.id
  editArticle.value = {
    titleFa: article.titleFa,
    titleEn: article.titleEn,
    bodyFa: article.bodyFa,
    excerptFa: article.excerptFa,
  }
}

async function saveArticleEdit() {
  if (!editingArticleId.value) return
  await $fetch(`/api/admin/news/${editingArticleId.value}`, { method: 'PATCH', body: editArticle.value })
  editingArticleId.value = ''
  message.value = t('common.save')
  await refreshNews()
}

async function deleteArticle(id: string) {
  await $fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
  await refreshNews()
}
</script>

<template>
  <div class="page-enter">
    <DashboardPageHeader :title="t('dashboard.platformAdmin')" :subtitle="t('dashboard.welcomeUser', { name: displayName })" />
    <p v-if="message" class="mb-4 text-sm text-fd-success">{{ message }}</p>

    <div v-if="['users', 'clubs'].includes(tab)" class="mb-4">
      <input v-model="searchQuery" type="search" class="fd-input max-w-md" :placeholder="t('dashboard.searchPlaceholder')" />
    </div>

    <template v-if="tab === 'overview'">
      <DashboardMetricsStrip
        :title="t('dashboard.platformSummary')"
        :subtitle="t('dashboard.walletBalance') + ': ' + formatPrice(stats?.walletBalance ?? 0)"
      >
        <DashboardMetricCard
          v-for="item in statItems"
          :key="item.label"
          :label="item.label"
          :value="item.value"
          :tone="item.tone"
          :icon="item.icon"
        />
      </DashboardMetricsStrip>

      <div class="mb-6 grid gap-4 lg:grid-cols-12">
        <div class="lg:col-span-8">
          <DashboardChartCard
            :title="t('dashboard.growthTrend')"
            :subtitle="t('dashboard.last6Months')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="line"
              :series="growthSeries"
              :options="lineOptions(monthLabels, [colors.primary, colors.orange])"
              :height="260"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-4">
          <DashboardChartCard
            :title="t('dashboard.platformActivity')"
            :subtitle="t('dashboard.last6Months')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="bar"
              :series="[{ name: t('dashboard.myBookings'), data: chartData?.bookings ?? [] }]"
              :options="barOptions(monthLabels, [colors.success])"
              :height="260"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-5">
          <DashboardRankTable v-if="topClubs.length" :items="topClubs" />
          <SzEmptyState v-else :message="t('common.noResults')" />
        </div>
        <div class="lg:col-span-7">
          <DashboardChartCard
            :title="t('dashboard.revenueAndFees')"
            :subtitle="t('dashboard.last6Months')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="bar"
              :series="activitySeries"
              :options="barOptions(monthLabels, [colors.primary, colors.pink])"
              :height="240"
            />
          </DashboardChartCard>
        </div>
      </div>

      <h2 class="fd-section-title mb-4">{{ t('dashboard.recentActivity') }}</h2>
      <div v-if="stats?.recentTransactions?.length" class="space-y-2">
        <div v-for="tx in stats.recentTransactions.slice(0, 10)" :key="tx.id" class="fd-transaction-row">
          <div class="min-w-0">
            <p class="font-semibold text-fd-navy">{{ localized(tx.noteFa, tx.noteEn) || txLabel(tx.type) }}</p>
            <p class="text-sm text-fd-muted">
              {{ tx.user?.name ?? (tx.club ? pickName(tx.club) : '') }}
            </p>
          </div>
          <p class="shrink-0 font-bold" :class="tx.amount >= 0 ? 'text-fd-success' : 'text-fd-danger'">
            {{ tx.amount >= 0 ? '+' : '' }}{{ formatPrice(tx.amount) }}
          </p>
        </div>
      </div>
    </template>

    <template v-else-if="tab === 'wallet'">
      <div class="fd-panel mb-6 p-5">
        <h2 class="fd-section-title mb-2">{{ t('dashboard.platformFees') }}</h2>
        <p class="text-3xl font-black text-fd-primary">{{ formatPrice(stats?.platformFees ?? 0) }}</p>
        <p class="mt-1 text-sm text-fd-muted">{{ t('dashboard.walletBalance') }}: {{ formatPrice(stats?.walletBalance ?? 0) }}</p>
      </div>
      <WalletPanel kind="user" variant="fd" />
    </template>

    <template v-else-if="tab === 'users'">
      <div class="space-y-2">
        <div v-for="u in users" :key="u.id" class="fd-transaction-row">
          <div>
            <p class="font-semibold text-fd-navy">
              {{ u.name }}
              <SzBadge v-if="u.suspendedAt" tone="pink" class="ms-2 text-xs">{{ t('dashboard.suspended') }}</SzBadge>
            </p>
            <p class="text-sm text-fd-muted">{{ u.email }} · {{ u.role }} · {{ formatNumber(u._count.bookings) }} {{ t('dashboard.myBookings').toLowerCase() }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-end text-sm">
            <select :value="u.role" class="fd-input !py-1 text-xs" @change="updateUserRole(u.id, ($event.target as HTMLSelectElement).value)">
              <option value="ATHLETE">ATHLETE</option>
              <option value="COACH">COACH</option>
              <option value="CLUB_ADMIN">CLUB_ADMIN</option>
              <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
            </select>
            <button type="button" class="fd-btn-ghost text-xs" @click="toggleUserSuspended(u.id, !!u.suspendedAt)">
              {{ u.suspendedAt ? t('dashboard.unsuspend') : t('dashboard.suspend') }}
            </button>
            <p class="font-bold text-fd-navy">{{ formatPrice(u.wallet?.balance ?? 0) }}</p>
          </div>
        </div>
      </div>
      <div v-if="userTotalPages > 1" class="mt-4 flex items-center justify-center gap-3">
        <button type="button" class="fd-btn-ghost text-xs" :disabled="userPage <= 1" @click="userPage--">{{ t('common.back') }}</button>
        <span class="text-sm text-fd-muted">{{ userPage }} / {{ userTotalPages }}</span>
        <button type="button" class="fd-btn-ghost text-xs" :disabled="userPage >= userTotalPages" @click="userPage++">{{ t('common.next') }}</button>
      </div>
    </template>

    <template v-else-if="tab === 'clubs'">
      <div class="space-y-2">
        <div v-for="c in clubs" :key="c.id" class="fd-card p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-fd-navy">{{ pickName(c) }}</p>
              <p class="text-sm text-fd-muted">{{ c.city }} · {{ c.owner?.name ?? '—' }}</p>
            </div>
            <button type="button" class="fd-btn-ghost text-xs" @click="toggleClubFeatured(c.id, c.featured)">
              {{ c.featured ? t('dashboard.unfeature') : t('dashboard.feature') }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="clubTotalPages > 1" class="mt-4 flex items-center justify-center gap-3">
        <button type="button" class="fd-btn-ghost text-xs" :disabled="clubPage <= 1" @click="clubPage--">{{ t('common.back') }}</button>
        <span class="text-sm text-fd-muted">{{ clubPage }} / {{ clubTotalPages }}</span>
        <button type="button" class="fd-btn-ghost text-xs" :disabled="clubPage >= clubTotalPages" @click="clubPage++">{{ t('common.next') }}</button>
      </div>
    </template>

    <template v-else-if="tab === 'coaches'">
      <div class="space-y-2">
        <div v-for="c in coaches" :key="c.id" class="fd-card p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-fd-navy">{{ pickName(c) }}</p>
              <p class="text-sm text-fd-muted">
                {{ c.city }} · ★ {{ formatRating(c.rating) }} ·
                {{ formatNumber(c._count?.coachSessions ?? 0) }} {{ t('dashboard.sessionsTab') }}
              </p>
              <p v-if="c.user" class="text-xs text-fd-muted">{{ c.user.email }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <NuxtLink :to="localePath(`/coaches/${c.id}`)" class="fd-btn-ghost text-xs">{{ t('dashboard.viewPublicProfile') }}</NuxtLink>
              <button type="button" class="fd-btn-ghost text-xs" @click="toggleCoachFeatured(c.id, c.featured)">
                {{ c.featured ? t('dashboard.unfeature') : t('dashboard.feature') }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="coachTotalPages > 1" class="mt-4 flex items-center justify-center gap-3">
        <button type="button" class="fd-btn-ghost text-xs" :disabled="coachPage <= 1" @click="coachPage--">{{ t('common.back') }}</button>
        <span class="text-sm text-fd-muted">{{ coachPage }} / {{ coachTotalPages }}</span>
        <button type="button" class="fd-btn-ghost text-xs" :disabled="coachPage >= coachTotalPages" @click="coachPage++">{{ t('common.next') }}</button>
      </div>
    </template>

    <template v-else-if="tab === 'bookings'">
      <div class="space-y-2">
        <div v-for="b in adminBookings?.items ?? []" :key="b.id" class="fd-card p-4 text-sm">
          <p class="font-semibold text-fd-navy">{{ b.user?.name ?? b.guestName ?? 'Guest' }}</p>
          <p class="text-fd-muted">
            {{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }} ·
            {{ b.slot?.date ?? '' }} · {{ b.slot ? `${b.slot.startTime}–${b.slot.endTime}` : '' }}
          </p>
          <p class="text-fd-navy">{{ b.status }} · {{ b.paymentStatus }} · {{ formatPrice(b.slot?.price ?? 0) }}</p>
        </div>
      </div>
    </template>

    <template v-else-if="tab === 'matches'">
      <div class="space-y-2">
        <div v-for="m in adminMatches?.items ?? []" :key="m.id" class="fd-card p-4 text-sm">
          <p class="font-semibold text-fd-navy">{{ m.sport ? pickName(m.sport) : '' }} · {{ m.city }}</p>
          <p class="text-fd-muted">{{ m.date }} · {{ m.status }} · {{ formatNumber(m.joinedCount) }}/{{ formatNumber(m.maxPlayers) }}</p>
        </div>
      </div>
    </template>

    <template v-else-if="tab === 'classes'">
      <div class="space-y-2">
        <div v-for="c in adminClasses?.items ?? []" :key="c.id" class="fd-card p-4 text-sm">
          <p class="font-semibold text-fd-navy">{{ localized(c.titleFa, c.titleEn) }}</p>
          <p class="text-fd-muted">{{ c.club ? pickName(c.club) : '' }} · {{ c.date }} · {{ c.status }}</p>
        </div>
      </div>
    </template>

    <template v-else-if="tab === 'news'">
      <div v-if="newsArticles?.length" class="mb-6 space-y-2">
        <div v-for="a in newsArticles" :key="a.id" class="fd-card flex items-center justify-between gap-2 p-4">
          <p class="font-semibold text-fd-navy">{{ localized(a.titleFa, a.titleEn) }}</p>
          <div class="flex gap-2">
            <button type="button" class="text-xs font-semibold text-fd-primary" @click="startEditArticle(a)">{{ t('common.edit') }}</button>
            <button type="button" class="text-xs font-semibold text-fd-danger" @click="deleteArticle(a.id)">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
      <div v-if="editingArticleId" class="fd-panel mb-6 grid gap-3">
        <h3 class="text-sm font-bold text-fd-navy">{{ t('common.edit') }}</h3>
        <input v-model="editArticle.titleFa" class="fd-input" :placeholder="t('news.title') + ' (FA)'" />
        <input v-model="editArticle.titleEn" class="fd-input" placeholder="Title EN" />
        <textarea v-model="editArticle.excerptFa" class="fd-input min-h-16" :placeholder="t('news.excerpt')" />
        <textarea v-model="editArticle.bodyFa" class="fd-input min-h-24" :placeholder="t('news.body')" />
        <div class="flex gap-2">
          <button type="button" class="fd-btn-primary" @click="saveArticleEdit">{{ t('common.save') }}</button>
          <button type="button" class="fd-btn-ghost" @click="editingArticleId = ''">{{ t('common.cancel') }}</button>
        </div>
      </div>
      <div class="fd-panel grid gap-3">
        <input v-model="newArticle.slug" class="fd-input" placeholder="slug" />
        <input v-model="newArticle.titleFa" class="fd-input" :placeholder="t('news.title')" />
        <input v-model="newArticle.titleEn" class="fd-input" placeholder="Title EN" />
        <textarea v-model="newArticle.bodyFa" class="fd-input min-h-24" :placeholder="t('news.body')" />
        <button type="button" class="fd-btn-primary" @click="createArticle">{{ t('common.save') }}</button>
      </div>
    </template>
  </div>
</template>
