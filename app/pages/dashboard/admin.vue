<script setup lang="ts">
import type { WalletTransaction } from '~/types'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-admin'] })

const { t } = useI18n()
const localePath = useLocalePath()
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

const searchableTabs = ['users', 'clubs', 'coaches']

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
  { id: 'overview', label: t('dashboard.overview'), icon: 'grid', group: 'general' },
  { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet', group: 'general' },
  { id: 'users', label: t('dashboard.allUsers'), icon: 'users', group: 'manage' },
  { id: 'clubs', label: t('dashboard.allClubs'), icon: 'building', group: 'manage' },
  { id: 'coaches', label: t('dashboard.allCoaches'), icon: 'users', group: 'manage' },
  { id: 'bookings', label: t('dashboard.bookingsTab'), icon: 'chart', group: 'operations' },
  { id: 'matches', label: t('matches.title'), icon: 'calendar', group: 'operations' },
  { id: 'classes', label: t('classes.title'), icon: 'users', group: 'operations' },
  { id: 'news', label: t('nav.news'), icon: 'grid', group: 'content' },
])

provideAdminSidebar(tabs, tab)

provideDashboardShellConfig(computed(() => ({
  subtitle: t('dashboard.platformAdmin'),
  homeLink: '/dashboard/admin',
  showSearch: false,
})))

const pageTitle = computed(() => tabs.value.find((item) => item.id === tab.value)?.label ?? t('dashboard.platformAdmin'))

const statItems = computed(() => [
  { label: t('dashboard.platformFees'), value: formatPrice(stats.value?.platformFees ?? 0) },
  { label: t('dashboard.allUsers'), value: formatNumber(stats.value?.users ?? 0) },
  { label: t('dashboard.allClubs'), value: formatNumber(stats.value?.clubs ?? 0) },
  { label: t('dashboard.myBookings'), value: formatNumber(stats.value?.bookings ?? 0) },
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

watch(tab, () => {
  searchQuery.value = ''
})

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
    <AdminPageHeader
      :title="pageTitle"
      :subtitle="tab === 'overview' ? t('dashboard.welcomeUser', { name: displayName }) : undefined"
    />

    <div v-if="message" class="admin-banner-success">
      <span>{{ message }}</span>
      <button type="button" class="admin-btn-plain ms-auto !py-1" @click="message = ''">{{ t('common.close') }}</button>
    </div>

    <AdminCard v-if="searchableTabs.includes(tab)" class="mb-4" flush>
      <template #header>
        <div class="relative w-full max-w-md">
          <SzIcon name="search" class="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-subtle)]" />
          <input
            v-model="searchQuery"
            type="search"
            class="admin-input !py-2 ps-9"
            :placeholder="t('admin.searchInList')"
          />
        </div>
      </template>
    </AdminCard>

    <template v-if="tab === 'overview'">
      <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          v-for="item in statItems"
          :key="item.label"
          :label="item.label"
          :value="item.value"
        />
      </div>

      <AdminCard class="mb-4">
        <p class="text-[0.8125rem] text-[var(--admin-muted)]">
          {{ t('dashboard.walletBalance') }}:
          <span class="font-semibold text-[var(--admin-text)]">{{ formatPrice(stats?.walletBalance ?? 0) }}</span>
        </p>
      </AdminCard>

      <div class="mb-4 grid gap-4 lg:grid-cols-12">
        <AdminCard class="lg:col-span-8">
          <h2 class="mb-1 text-[0.9375rem] font-semibold text-[var(--admin-text)]">{{ t('dashboard.growthTrend') }}</h2>
          <p class="mb-4 text-[0.75rem] text-[var(--admin-muted)]">{{ t('dashboard.last6Months') }}</p>
          <DashboardApexChart
            v-if="!chartsPending && !chartsError"
            type="line"
            :series="growthSeries"
            :options="lineOptions(monthLabels, [colors.primary, colors.orange])"
            :height="260"
          />
          <p v-else-if="chartsError" class="text-sm text-[var(--admin-critical)]">
            {{ t('common.error') }}
            <button type="button" class="admin-btn-plain !px-1" @click="refreshCharts()">{{ t('admin.reload') }}</button>
          </p>
          <p v-else class="text-sm text-[var(--admin-muted)]">{{ t('common.loading') }}</p>
        </AdminCard>

        <AdminCard class="lg:col-span-4">
          <h2 class="mb-1 text-[0.9375rem] font-semibold text-[var(--admin-text)]">{{ t('dashboard.platformActivity') }}</h2>
          <p class="mb-4 text-[0.75rem] text-[var(--admin-muted)]">{{ t('dashboard.last6Months') }}</p>
          <DashboardApexChart
            v-if="!chartsPending && !chartsError"
            type="bar"
            :series="[{ name: t('dashboard.myBookings'), data: chartData?.bookings ?? [] }]"
            :options="barOptions(monthLabels, [colors.success])"
            :height="260"
          />
        </AdminCard>

        <AdminCard class="lg:col-span-5" flush>
          <template #header>
            <h2 class="text-[0.9375rem] font-semibold text-[var(--admin-text)]">{{ t('dashboard.allClubs') }}</h2>
          </template>
          <AdminResourceTable :empty="!topClubs.length" :empty-message="t('admin.noItems')">
            <template #head>
              <tr>
                <th>{{ t('admin.name') }}</th>
                <th>{{ t('dashboard.court') }}</th>
                <th>{{ t('dashboard.popularity') }}</th>
              </tr>
            </template>
            <tr v-for="club in topClubs" :key="club.name">
              <td class="font-medium">{{ club.name }}</td>
              <td>{{ club.value }}</td>
              <td>{{ club.popularity }}%</td>
            </tr>
          </AdminResourceTable>
        </AdminCard>

        <AdminCard class="lg:col-span-7">
          <h2 class="mb-1 text-[0.9375rem] font-semibold text-[var(--admin-text)]">{{ t('dashboard.revenueAndFees') }}</h2>
          <p class="mb-4 text-[0.75rem] text-[var(--admin-muted)]">{{ t('dashboard.last6Months') }}</p>
          <DashboardApexChart
            v-if="!chartsPending && !chartsError"
            type="bar"
            :series="activitySeries"
            :options="barOptions(monthLabels, [colors.primary, colors.pink])"
            :height="240"
          />
        </AdminCard>
      </div>

      <AdminCard flush>
        <template #header>
          <h2 class="text-[0.9375rem] font-semibold text-[var(--admin-text)]">{{ t('dashboard.recentActivity') }}</h2>
        </template>
        <AdminResourceTable :empty="!stats?.recentTransactions?.length" :empty-message="t('admin.noItems')">
          <template #head>
            <tr>
              <th>{{ t('admin.name') }}</th>
              <th>{{ t('admin.customer') }}</th>
              <th class="text-end">{{ t('admin.amount') }}</th>
            </tr>
          </template>
          <tr v-for="tx in stats?.recentTransactions?.slice(0, 10) ?? []" :key="tx.id">
            <td>{{ localized(tx.noteFa, tx.noteEn) || txLabel(tx.type) }}</td>
            <td class="text-[var(--admin-muted)]">{{ tx.user?.name ?? (tx.club ? pickName(tx.club) : '—') }}</td>
            <td class="text-end font-medium" :class="tx.amount >= 0 ? 'text-[#108043]' : 'text-[var(--admin-critical)]'">
              {{ tx.amount >= 0 ? '+' : '' }}{{ formatPrice(tx.amount) }}
            </td>
          </tr>
        </AdminResourceTable>
      </AdminCard>
    </template>

    <template v-else-if="tab === 'wallet'">
      <div class="mb-4 grid gap-3 sm:grid-cols-2">
        <AdminMetricCard :label="t('dashboard.platformFees')" :value="formatPrice(stats?.platformFees ?? 0)" />
        <AdminMetricCard :label="t('dashboard.walletBalance')" :value="formatPrice(stats?.walletBalance ?? 0)" />
      </div>
      <AdminCard>
        <WalletPanel kind="user" variant="fd" />
      </AdminCard>
    </template>

    <template v-else-if="tab === 'users'">
      <AdminCard flush>
        <AdminResourceTable :empty="!users.length" :empty-message="t('admin.noItems')">
          <template #head>
            <tr>
              <th>{{ t('admin.name') }}</th>
              <th>{{ t('admin.email') }}</th>
              <th>{{ t('admin.role') }}</th>
              <th>{{ t('dashboard.myBookings') }}</th>
              <th>{{ t('admin.balance') }}</th>
              <th>{{ t('admin.status') }}</th>
              <th class="text-end">{{ t('admin.actions') }}</th>
            </tr>
          </template>
          <tr v-for="u in users" :key="u.id">
            <td class="font-medium">{{ u.name }}</td>
            <td class="text-[var(--admin-muted)]">{{ u.email }}</td>
            <td>
              <select :value="u.role" class="admin-input !w-auto !py-1.5" @change="updateUserRole(u.id, ($event.target as HTMLSelectElement).value)">
                <option value="ATHLETE">ATHLETE</option>
                <option value="COACH">COACH</option>
                <option value="CLUB_ADMIN">CLUB_ADMIN</option>
                <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
              </select>
            </td>
            <td>{{ formatNumber(u._count.bookings) }}</td>
            <td>{{ formatPrice(u.wallet?.balance ?? 0) }}</td>
            <td>
              <AdminBadge v-if="u.suspendedAt" tone="critical">{{ t('dashboard.suspended') }}</AdminBadge>
              <AdminBadge v-else tone="success">{{ t('admin.active') }}</AdminBadge>
            </td>
            <td class="text-end">
              <button type="button" class="admin-btn-plain !py-1" @click="toggleUserSuspended(u.id, !!u.suspendedAt)">
                {{ u.suspendedAt ? t('dashboard.unsuspend') : t('dashboard.suspend') }}
              </button>
            </td>
          </tr>
        </AdminResourceTable>
        <template v-if="userTotalPages > 1" #footer>
          <div class="admin-pagination w-full">
            <button type="button" class="admin-btn-secondary" :disabled="userPage <= 1" @click="userPage--">{{ t('common.back') }}</button>
            <span>{{ userPage }} / {{ userTotalPages }}</span>
            <button type="button" class="admin-btn-secondary" :disabled="userPage >= userTotalPages" @click="userPage++">{{ t('common.next') }}</button>
          </div>
        </template>
      </AdminCard>
    </template>

    <template v-else-if="tab === 'clubs'">
      <AdminCard flush>
        <AdminResourceTable :empty="!clubs.length" :empty-message="t('admin.noItems')">
          <template #head>
            <tr>
              <th>{{ t('admin.name') }}</th>
              <th>{{ t('admin.city') }}</th>
              <th>{{ t('admin.owner') }}</th>
              <th>{{ t('dashboard.court') }}</th>
              <th>{{ t('admin.featured') }}</th>
              <th class="text-end">{{ t('admin.actions') }}</th>
            </tr>
          </template>
          <tr v-for="c in clubs" :key="c.id">
            <td class="font-medium">{{ pickName(c) }}</td>
            <td>{{ c.city }}</td>
            <td class="text-[var(--admin-muted)]">{{ c.owner?.name ?? '—' }}</td>
            <td>{{ formatNumber(c._count?.courts ?? 0) }}</td>
            <td>
              <AdminBadge :tone="c.featured ? 'success' : 'default'">
                {{ c.featured ? t('admin.featured') : '—' }}
              </AdminBadge>
            </td>
            <td class="text-end">
              <button type="button" class="admin-btn-plain !py-1" @click="toggleClubFeatured(c.id, c.featured)">
                {{ c.featured ? t('dashboard.unfeature') : t('dashboard.feature') }}
              </button>
            </td>
          </tr>
        </AdminResourceTable>
        <template v-if="clubTotalPages > 1" #footer>
          <div class="admin-pagination w-full">
            <button type="button" class="admin-btn-secondary" :disabled="clubPage <= 1" @click="clubPage--">{{ t('common.back') }}</button>
            <span>{{ clubPage }} / {{ clubTotalPages }}</span>
            <button type="button" class="admin-btn-secondary" :disabled="clubPage >= clubTotalPages" @click="clubPage++">{{ t('common.next') }}</button>
          </div>
        </template>
      </AdminCard>
    </template>

    <template v-else-if="tab === 'coaches'">
      <AdminCard flush>
        <AdminResourceTable :empty="!coaches.length" :empty-message="t('admin.noItems')">
          <template #head>
            <tr>
              <th>{{ t('admin.name') }}</th>
              <th>{{ t('admin.city') }}</th>
              <th>{{ t('dashboard.sessionsTab') }}</th>
              <th>{{ t('admin.email') }}</th>
              <th>{{ t('admin.featured') }}</th>
              <th class="text-end">{{ t('admin.actions') }}</th>
            </tr>
          </template>
          <tr v-for="c in coaches" :key="c.id">
            <td class="font-medium">{{ pickName(c) }}</td>
            <td>{{ c.city }}</td>
            <td>★ {{ formatRating(c.rating) }} · {{ formatNumber(c._count?.coachSessions ?? 0) }}</td>
            <td class="text-[var(--admin-muted)]">{{ c.user?.email ?? '—' }}</td>
            <td>
              <AdminBadge :tone="c.featured ? 'success' : 'default'">
                {{ c.featured ? t('admin.featured') : '—' }}
              </AdminBadge>
            </td>
            <td class="text-end">
              <div class="flex justify-end gap-1">
                <NuxtLink :to="localePath(`/coaches/${c.id}`)" class="admin-btn-plain !py-1">{{ t('dashboard.viewPublicProfile') }}</NuxtLink>
                <button type="button" class="admin-btn-plain !py-1" @click="toggleCoachFeatured(c.id, c.featured)">
                  {{ c.featured ? t('dashboard.unfeature') : t('dashboard.feature') }}
                </button>
              </div>
            </td>
          </tr>
        </AdminResourceTable>
        <template v-if="coachTotalPages > 1" #footer>
          <div class="admin-pagination w-full">
            <button type="button" class="admin-btn-secondary" :disabled="coachPage <= 1" @click="coachPage--">{{ t('common.back') }}</button>
            <span>{{ coachPage }} / {{ coachTotalPages }}</span>
            <button type="button" class="admin-btn-secondary" :disabled="coachPage >= coachTotalPages" @click="coachPage++">{{ t('common.next') }}</button>
          </div>
        </template>
      </AdminCard>
    </template>

    <template v-else-if="tab === 'bookings'">
      <AdminCard flush>
        <AdminResourceTable :empty="!(adminBookings?.items?.length)" :empty-message="t('admin.noItems')">
          <template #head>
            <tr>
              <th>{{ t('admin.customer') }}</th>
              <th>{{ t('admin.club') }}</th>
              <th>{{ t('admin.date') }}</th>
              <th>{{ t('admin.time') }}</th>
              <th>{{ t('admin.status') }}</th>
              <th>{{ t('admin.payment') }}</th>
              <th class="text-end">{{ t('admin.amount') }}</th>
            </tr>
          </template>
          <tr v-for="b in adminBookings?.items ?? []" :key="b.id">
            <td class="font-medium">{{ b.user?.name ?? b.guestName ?? 'Guest' }}</td>
            <td>{{ b.slot?.court?.club ? pickName(b.slot.court.club) : '—' }}</td>
            <td>{{ b.slot?.date ?? '—' }}</td>
            <td>{{ b.slot ? `${b.slot.startTime}–${b.slot.endTime}` : '—' }}</td>
            <td><AdminBadge tone="info">{{ b.status }}</AdminBadge></td>
            <td>{{ b.paymentStatus }}</td>
            <td class="text-end font-medium">{{ formatPrice(b.slot?.price ?? 0) }}</td>
          </tr>
        </AdminResourceTable>
      </AdminCard>
    </template>

    <template v-else-if="tab === 'matches'">
      <AdminCard flush>
        <AdminResourceTable :empty="!(adminMatches?.items?.length)" :empty-message="t('admin.noItems')">
          <template #head>
            <tr>
              <th>{{ t('admin.sport') }}</th>
              <th>{{ t('admin.city') }}</th>
              <th>{{ t('admin.date') }}</th>
              <th>{{ t('admin.status') }}</th>
              <th>{{ t('admin.players') }}</th>
            </tr>
          </template>
          <tr v-for="m in adminMatches?.items ?? []" :key="m.id">
            <td class="font-medium">{{ m.sport ? pickName(m.sport) : '—' }}</td>
            <td>{{ m.city }}</td>
            <td>{{ m.date }}</td>
            <td><AdminBadge tone="info">{{ m.status }}</AdminBadge></td>
            <td>{{ formatNumber(m.joinedCount) }}/{{ formatNumber(m.maxPlayers) }}</td>
          </tr>
        </AdminResourceTable>
      </AdminCard>
    </template>

    <template v-else-if="tab === 'classes'">
      <AdminCard flush>
        <AdminResourceTable :empty="!(adminClasses?.items?.length)" :empty-message="t('admin.noItems')">
          <template #head>
            <tr>
              <th>{{ t('admin.title') }}</th>
              <th>{{ t('admin.club') }}</th>
              <th>{{ t('admin.date') }}</th>
              <th>{{ t('admin.status') }}</th>
            </tr>
          </template>
          <tr v-for="c in adminClasses?.items ?? []" :key="c.id">
            <td class="font-medium">{{ localized(c.titleFa, c.titleEn) }}</td>
            <td>{{ c.club ? pickName(c.club) : '—' }}</td>
            <td>{{ c.date }}</td>
            <td><AdminBadge tone="info">{{ c.status }}</AdminBadge></td>
          </tr>
        </AdminResourceTable>
      </AdminCard>
    </template>

    <template v-else-if="tab === 'news'">
      <AdminCard v-if="newsArticles?.length" class="mb-4" flush>
        <AdminResourceTable>
          <template #head>
            <tr>
              <th>{{ t('admin.title') }}</th>
              <th class="text-end">{{ t('admin.actions') }}</th>
            </tr>
          </template>
          <tr v-for="a in newsArticles" :key="a.id">
            <td class="font-medium">{{ localized(a.titleFa, a.titleEn) }}</td>
            <td class="text-end">
              <button type="button" class="admin-btn-plain !py-1" @click="startEditArticle(a)">{{ t('common.edit') }}</button>
              <button type="button" class="admin-btn-critical !py-1" @click="deleteArticle(a.id)">{{ t('common.delete') }}</button>
            </td>
          </tr>
        </AdminResourceTable>
      </AdminCard>

      <AdminCard v-if="editingArticleId">
        <h3 class="mb-4 text-[0.9375rem] font-semibold">{{ t('admin.editArticle') }}</h3>
        <div class="grid gap-3">
          <input v-model="editArticle.titleFa" class="admin-input" :placeholder="t('news.title') + ' (FA)'" />
          <input v-model="editArticle.titleEn" class="admin-input" placeholder="Title EN" />
          <textarea v-model="editArticle.excerptFa" class="admin-input min-h-16" :placeholder="t('news.excerpt')" />
          <textarea v-model="editArticle.bodyFa" class="admin-input min-h-24" :placeholder="t('news.body')" />
          <div class="flex gap-2">
            <button type="button" class="admin-btn-primary" @click="saveArticleEdit">{{ t('common.save') }}</button>
            <button type="button" class="admin-btn-secondary" @click="editingArticleId = ''">{{ t('common.cancel') }}</button>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <h3 class="mb-4 text-[0.9375rem] font-semibold">{{ t('admin.createArticle') }}</h3>
        <div class="grid gap-3">
          <input v-model="newArticle.slug" class="admin-input" :placeholder="t('admin.slug')" />
          <input v-model="newArticle.titleFa" class="admin-input" :placeholder="t('news.title')" />
          <input v-model="newArticle.titleEn" class="admin-input" placeholder="Title EN" />
          <textarea v-model="newArticle.bodyFa" class="admin-input min-h-24" :placeholder="t('news.body')" />
          <button type="button" class="admin-btn-primary w-fit" @click="createArticle">{{ t('common.save') }}</button>
        </div>
      </AdminCard>
    </template>
  </div>
</template>
