<script setup lang="ts">
import type { AthleteProfile, Booking, ClassEnrollment, CoachSession, OpenMatch, ScheduleEvent, Sport, TrainingPlan, UserBadge } from '~/types'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role-athlete', 'onboarding-gate'] })

const { t, locales } = useI18n()
const localePath = useLocalePath()
const { user, fetch: refreshSession } = useUserSession()
const { displayName } = useUserDisplayName()
const { pickName, localized, formatPrice, formatDate, formatTimeRange, formatFraction, formatNumber, localDateISO } = useLocaleContent()
const { levels, levelLabel } = useSkillLevel()

useHead({ title: () => t('dashboard.title') })

const tab = useDashboardTab('overview')

interface ProfileResponse {
  profile: AthleteProfile | null
  user?: { phone?: string | null; favoriteSports?: string | null; locale?: string; name?: string }
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
const { data: coachSessions, refresh: refreshCoachSessions } = await useApiFetch<CoachSession[]>('/api/coach/sessions')
const { data: enrollments, refresh: refreshEnrollments } = await useApiFetch<ClassEnrollment[]>('/api/profile/enrollments')
const { data: matchList, refresh: refreshMatches } = await useApiFetch<Array<{ id: string; joinedAt: string; match: OpenMatch }>>('/api/profile/matches')
const { data: profileData, refresh: refreshProfile } = await useApiFetch<ProfileResponse>('/api/profile')
const { data: plans, refresh: refreshPlans } = await useApiFetch<TrainingPlan[]>('/api/training-plans')
const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: stats, refresh: refreshStats } = await useApiFetch<AthleteStats>('/api/dashboard/stats')
const { data: chartData, error: chartsError, pending: chartsPending, refresh: refreshCharts } = await useApiFetch<{
  labels: string[]
  spending: number[]
  bookingTrend: number[]
  classTrend: number[]
  matchTrend: number[]
  breakdown: Array<{ key: string; value: number }>
}>('/api/dashboard/charts')

const { formatDayLabels } = useDashboardChartLabels()
const { lineOptions, areaOptions, donutOptions, colors } = useDashboardChartTheme()

const dayLabels = computed(() => formatDayLabels(chartData.value?.labels ?? []))

const activitySeries = computed(() => [
  { name: t('dashboard.myBookings'), data: chartData.value?.bookingTrend ?? [] },
  { name: t('classes.title'), data: chartData.value?.classTrend ?? [] },
  { name: t('matches.title'), data: chartData.value?.matchTrend ?? [] },
])

const spendingSeries = computed(() => [
  { name: t('dashboard.totalSpent'), data: chartData.value?.spending ?? [] },
])

const breakdownSeries = computed(() => chartData.value?.breakdown?.map((b) => b.value) ?? [])
const breakdownLabels = computed(() =>
  (chartData.value?.breakdown ?? []).map((b) =>
    b.key === 'bookings' ? t('dashboard.myBookings') : b.key === 'classes' ? t('classes.title') : t('matches.title'),
  ),
)

const level = ref(profileData.value?.profile?.level ?? 'BEGINNER')
const sportSlug = ref(profileData.value?.profile?.sport?.slug ?? 'tennis')
const profileName = ref(user.value?.name ?? '')
const profilePhone = ref(profileData.value?.user?.phone ?? '')
const profileLocale = ref(user.value?.locale ?? 'fa')
const profileMessage = ref('')
const profileError = ref('')
const { enabled: pushEnabled, setEnabled: setPushEnabled } = usePushNotifications()

function onPushToggle() {
  setPushEnabled(pushEnabled.value)
}
const favoriteSportSlugs = ref<string[]>([])

watch(() => profileData.value, (data) => {
  if (data?.user?.phone !== undefined) profilePhone.value = data.user.phone ?? ''
  if (data?.user?.favoriteSports) {
    favoriteSportSlugs.value = data.user.favoriteSports.split(',').filter(Boolean)
  }
}, { immediate: true })

watch(() => profileData.value?.profile, (p) => {
  if (p) {
    level.value = p.level
    sportSlug.value = p.sport?.slug ?? 'tennis'
  }
})

watch(user, (u) => {
  if (u) {
    profileName.value = u.name ?? ''
    profileLocale.value = u.locale ?? 'fa'
  }
}, { immediate: true })

const tabs = computed(() => [
  { id: 'overview', label: t('dashboard.overview'), icon: 'grid' },
  { id: 'schedule', label: t('dashboard.scheduleTab'), icon: 'calendar' },
  { id: 'bookings', label: t('dashboard.bookingsTab'), icon: 'chart' },
  { id: 'enrollments', label: t('dashboard.enrollmentsTab'), icon: 'users' },
  { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet' },
  { id: 'plans', label: t('dashboard.plansTab'), icon: 'users' },
  { id: 'profile', label: t('dashboard.profileTab'), icon: 'building' },
])

provideDashboardSidebar(tabs, tab)

const statItems = computed(() => [
  { label: t('dashboard.walletBalance'), value: formatPrice(stats.value?.walletBalance ?? 0), tone: 'blue' as const, icon: 'wallet' },
  { label: t('dashboard.totalSpent'), value: formatPrice(stats.value?.totalSpent ?? 0), tone: 'pink' as const, icon: 'chart' },
  { label: t('dashboard.myBookings'), value: formatNumber(stats.value?.bookings ?? 0), tone: 'orange' as const, icon: 'chart' },
  { label: t('classes.title'), value: formatNumber(stats.value?.classes ?? 0), tone: 'green' as const, icon: 'users' },
])

const quickActions = computed(() => [
  { id: 'book', label: t('dashboard.bookCourt'), icon: 'building', to: localePath('/clubs?book=1') },
  { id: 'wallet', label: t('dashboard.viewWallet'), icon: 'wallet', onClick: () => { tab.value = 'wallet' } },
  { id: 'schedule', label: t('dashboard.viewSchedule'), icon: 'calendar', onClick: () => { tab.value = 'schedule' } },
  { id: 'matches', label: t('dashboard.viewMatches'), icon: 'users', to: localePath('/matches') },
])

const today = computed(() => localDateISO())

const upcomingBookings = computed(() =>
  (bookings.value ?? []).filter((b) => b.status !== 'CANCELLED' && b.slot && b.slot.date >= today.value),
)
const pastBookings = computed(() =>
  (bookings.value ?? []).filter((b) => b.status === 'CANCELLED' || (b.slot && b.slot.date < today.value)),
)

const upcomingCoachSessions = computed(() =>
  (coachSessions.value ?? []).filter((s) => s.status !== 'CANCELLED' && s.date >= today.value),
)

const pastCoachSessions = computed(() =>
  (coachSessions.value ?? []).filter((s) => s.status === 'CANCELLED' || s.date < today.value),
)

const reviewClubId = ref('')
const reviewCoachId = ref('')
const reviewRating = ref(5)
const reviewBody = ref('')
const reviewMessage = ref('')

async function cancelBooking(id: string) {
  await $fetch(`/api/bookings/${id}`, { method: 'DELETE' })
  await Promise.all([refresh(), refreshStats(), refreshSchedule()])
}

async function cancelCoachSession(id: string) {
  await $fetch(`/api/coach/sessions/${id}`, { method: 'DELETE' })
  await Promise.all([refreshCoachSessions(), refreshStats(), refreshSchedule()])
}

async function cancelEnrollment(classSessionId: string) {
  await $fetch(`/api/classes/enroll/${classSessionId}`, { method: 'DELETE' })
  await Promise.all([refreshEnrollments(), refreshStats(), refreshSchedule()])
}

function onScheduleEvent(event: ScheduleEvent) {
  if (event.classId) navigateTo(localePath(`/classes/${event.classId}`))
  else if (event.matchId) navigateTo(localePath(`/matches/${event.matchId}`))
  else if (event.coachId) navigateTo(localePath(`/coaches/${event.coachId}`))
  else if (event.tournamentId) navigateTo(localePath('/tournaments'))
  else if (event.type === 'booking') tab.value = 'bookings'
}

function toggleFavoriteSport(slug: string) {
  if (favoriteSportSlugs.value.includes(slug)) {
    favoriteSportSlugs.value = favoriteSportSlugs.value.filter((s) => s !== slug)
  } else if (favoriteSportSlugs.value.length < 8) {
    favoriteSportSlugs.value.push(slug)
  }
}

const upcomingEnrollments = computed(() =>
  (enrollments.value ?? []).filter((e) => e.classSession && e.classSession.status !== 'CANCELLED' && e.classSession.date >= today.value),
)
const pastEnrollments = computed(() =>
  (enrollments.value ?? []).filter((e) => !e.classSession || e.classSession.status === 'CANCELLED' || e.classSession.date < today.value),
)

interface NextUpItem {
  kind: 'booking' | 'class'
  date: string
  startTime: string
  endTime: string
  title: string
  subtitle?: string
  to: string
}

const nextUp = computed<NextUpItem | null>(() => {
  const items: NextUpItem[] = []
  for (const b of upcomingBookings.value) {
    if (!b.slot) continue
    const club = b.slot.court?.club
    items.push({
      kind: 'booking',
      date: b.slot.date,
      startTime: b.slot.startTime,
      endTime: b.slot.endTime,
      title: club ? pickName(club) : t('booking.title'),
      subtitle: b.slot.court ? pickName(b.slot.court) : undefined,
      to: localePath('/dashboard?tab=bookings'),
    })
  }
  for (const e of upcomingEnrollments.value) {
    const c = e.classSession
    if (!c) continue
    items.push({
      kind: 'class',
      date: c.date,
      startTime: c.startTime,
      endTime: c.endTime,
      title: localized(c.titleFa, c.titleEn),
      subtitle: c.club ? pickName(c.club) : undefined,
      to: localePath(`/classes/${c.id}`),
    })
  }
  items.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    return byDate !== 0 ? byDate : a.startTime.localeCompare(b.startTime)
  })
  return items[0] ?? null
})

async function savePlanNotes(plan: TrainingPlan) {
  if (!plan.assignmentId) return
  await $fetch(`/api/plans/assignments/${plan.assignmentId}`, {
    method: 'PATCH',
    body: { notes: plan.notes ?? '' },
  })
}

const scheduleFrom = ref('')
const scheduleTo = ref('')

const { data: scheduleData, pending: schedulePending, refresh: refreshSchedule } = await useApiFetch<{ events: ScheduleEvent[] }>(
  '/api/schedule',
  {
    query: computed(() => ({
      from: scheduleFrom.value || undefined,
      to: scheduleTo.value || undefined,
    })),
    watch: [scheduleFrom, scheduleTo],
    immediate: false,
  },
)

const scheduleEvents = computed(() => scheduleData.value?.events ?? [])

function onScheduleRange({ from, to }: { from: string; to: string }) {
  scheduleFrom.value = from
  scheduleTo.value = to
}

watch([scheduleFrom, scheduleTo], () => {
  if (scheduleFrom.value && scheduleTo.value) refreshSchedule()
})

async function saveProfile() {
  profileMessage.value = ''
  profileError.value = ''
  try {
    await $fetch('/api/profile', {
      method: 'PATCH',
      body: {
        level: level.value,
        sport: sportSlug.value,
        name: profileName.value,
        phone: profilePhone.value,
        locale: profileLocale.value,
        favoriteSports: favoriteSportSlugs.value.join(','),
      },
    })
    await Promise.all([refreshProfile(), refreshSession()])
    profileMessage.value = t('common.save')
  } catch {
    profileError.value = t('common.error')
  }
}

async function togglePlanComplete(plan: TrainingPlan) {
  if (!plan.assignmentId) return
  await $fetch(`/api/plans/assignments/${plan.assignmentId}`, {
    method: 'PATCH',
    body: { completed: !plan.completedAt },
  })
  await refreshPlans()
}

async function submitReview() {
  if (!reviewClubId.value && !reviewCoachId.value) return
  reviewMessage.value = ''
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: reviewCoachId.value
        ? { coachId: reviewCoachId.value, rating: reviewRating.value, bodyFa: reviewBody.value, bodyEn: reviewBody.value }
        : { clubId: reviewClubId.value, rating: reviewRating.value, bodyFa: reviewBody.value, bodyEn: reviewBody.value },
    })
    reviewMessage.value = t('dashboard.reviewSubmitted')
    reviewBody.value = ''
    reviewCoachId.value = ''
    reviewClubId.value = ''
  } catch {
    reviewMessage.value = t('dashboard.reviewError')
  }
}

const reviewableClubs = computed(() => {
  const seen = new Set<string>()
  const list: Array<{ id: string; name: string }> = []
  for (const b of pastBookings.value) {
    const club = b.slot?.court?.club
    if (club && !seen.has(club.id)) {
      seen.add(club.id)
      list.push({ id: club.id, name: pickName(club) })
    }
  }
  return list
})

const reviewableCoaches = computed(() => {
  const seen = new Set<string>()
  const list: Array<{ id: string; name: string }> = []
  for (const s of pastCoachSessions.value) {
    if (s.coach && !seen.has(s.coach.id)) {
      seen.add(s.coach.id)
      list.push({ id: s.coach.id, name: pickName(s.coach) })
    }
  }
  return list
})

const hasReviewTargets = computed(() => reviewableClubs.value.length > 0 || reviewableCoaches.value.length > 0)
</script>

<template>
  <div class="page-enter">
    <DashboardPageHeader :title="t('dashboard.title')" :subtitle="t('dashboard.welcomeUser', { name: displayName })" />

    <template v-if="tab === 'overview'">
      <section class="fd-card mb-6 overflow-hidden">
        <div class="bg-gradient-to-br from-fd-primary-light to-fd-primary p-6 text-white">
          <p class="text-xs font-bold uppercase tracking-wide text-white/75">{{ t('dashboard.nextUp') }}</p>
          <template v-if="nextUp">
            <p class="mt-2 text-xl font-black">{{ nextUp.title }}</p>
            <p v-if="nextUp.subtitle" class="mt-1 text-sm text-white/85">{{ nextUp.subtitle }}</p>
            <p class="mt-2 text-sm font-semibold text-white/90">
              {{ formatDate(nextUp.date) }} · {{ formatTimeRange(nextUp.startTime, nextUp.endTime) }}
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <NuxtLink :to="nextUp.to" class="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-fd-primary">
                {{ nextUp.kind === 'booking' ? t('dashboard.myBookings') : t('classes.title') }}
              </NuxtLink>
              <NuxtLink :to="localePath('/clubs?book=1')" class="inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/25">
                {{ t('dashboard.bookAgain') }}
              </NuxtLink>
            </div>
          </template>
          <template v-else>
            <p class="mt-3 text-sm text-white/90">{{ t('dashboard.nextUpEmpty') }}</p>
            <NuxtLink :to="localePath('/clubs?book=1')" class="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-fd-primary">
              {{ t('dashboard.bookAgain') }}
            </NuxtLink>
          </template>
        </div>
      </section>

      <DashboardMetricsStrip :title="t('dashboard.activitySummary')" :subtitle="t('dashboard.last7Days')">
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
            :title="t('dashboard.activityTrend')"
            :subtitle="t('dashboard.weeklyActivity')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="line"
              :series="activitySeries"
              :options="lineOptions(dayLabels, [colors.primary, colors.orange, colors.success])"
              :height="260"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-4">
          <DashboardChartCard
            :title="t('dashboard.activityMix')"
            :subtitle="t('dashboard.allTime')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="donut"
              :series="breakdownSeries"
              :options="donutOptions(breakdownLabels, [colors.primary, colors.success, colors.pink])"
              :height="260"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-6">
          <DashboardChartCard
            :title="t('dashboard.spendingTrend')"
            :subtitle="t('dashboard.last7Days')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="area"
              :series="spendingSeries"
              :options="areaOptions(dayLabels, [colors.primary])"
              :height="240"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-6">
          <DashboardQuickActions :actions="quickActions" compact />
        </div>
      </div>

      <section v-if="profileData?.profile" class="fd-card mb-8 overflow-hidden">
        <div class="bg-gradient-to-br from-fd-primary-light to-fd-primary p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-white/80">{{ t('gamification.level') }}</p>
              <p class="text-3xl font-black">{{ formatNumber(profileData.progress.level) }}</p>
            </div>
            <div class="text-end">
              <p class="text-sm font-semibold">{{ formatNumber(profileData.profile.xp) }} XP</p>
              <p class="text-xs text-white/70">{{ formatFraction(profileData.progress.into, profileData.progress.next) }}</p>
            </div>
          </div>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
            <div class="h-full rounded-full bg-white transition-all" :style="{ width: `${profileData.progress.ratio * 100}%` }" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 p-4 text-center text-sm">
          <div>
            <p class="font-black text-fd-primary">{{ formatNumber(profileData.profile.matchesPlayed) }}</p>
            <p class="text-xs text-fd-muted">{{ t('dashboard.matchesPlayed') }}</p>
          </div>
          <div>
            <p class="font-black text-fd-success">{{ formatNumber(profileData.profile.wins) }}</p>
            <p class="text-xs text-fd-muted">{{ t('dashboard.wins') }}</p>
          </div>
          <div>
            <p class="font-black text-fd-warning">{{ formatNumber(profileData.stats.matchesJoined) }}</p>
            <p class="text-xs text-fd-muted">{{ t('matches.title') }}</p>
          </div>
        </div>
        <div v-if="profileData.badges?.length" class="flex flex-wrap gap-2 border-t border-fd-primary/5 p-4">
          <SzBadge v-for="b in profileData.badges" :key="b.id" tone="orange">
            {{ t(`badges.${b.code}`, b.code) }}
          </SzBadge>
        </div>
      </section>

    </template>

    <WalletPanel v-else-if="tab === 'wallet'" kind="user" can-top-up variant="fd" />

    <template v-else-if="tab === 'schedule'">
      <ScheduleCalendar
        variant="dashboard"
        :events="scheduleEvents"
        :loading="schedulePending"
        @range-change="onScheduleRange"
        @select-event="onScheduleEvent"
      />
    </template>

    <template v-else-if="tab === 'bookings'">
      <h2 class="fd-section-title mb-4">{{ t('dashboard.upcoming') }}</h2>
      <div v-if="upcomingBookings.length" class="mb-10 space-y-3">
        <div v-for="b in upcomingBookings" :key="`b-${b.id}`" class="fd-card p-4">
          <p class="font-semibold text-fd-navy">{{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }}</p>
          <p class="text-sm text-fd-muted">
            {{ b.slot?.court ? pickName(b.slot.court) : '' }} ·
            {{ b.slot?.date ? formatDate(b.slot.date) : '' }} ·
            {{ b.slot?.startTime ? formatTimeRange(b.slot.startTime, b.slot.endTime) : '' }}
          </p>
          <p class="mt-1 text-sm text-fd-navy">
            {{ formatPrice((b.slot?.price ?? 0) + (b.equipmentTotal ?? 0)) }} {{ t('clubs.currency') }} ·
            {{ b.paymentStatus === 'PAID' ? t('wallet.payWithWallet') : t('booking.payAtClub') }}
          </p>
          <BookingEquipmentList v-if="b.equipment?.length" :lines="b.equipment" />
          <button class="mt-3 text-sm font-semibold text-fd-danger" @click="cancelBooking(b.id)">{{ t('dashboard.cancel') }}</button>
        </div>
      </div>
      <SzEmptyState
        v-else
        class="mb-10"
        :message="t('dashboard.noBookings')"
        :action-label="t('nav.book')"
        :action-to="localePath('/clubs?book=1')"
      />

      <h2 class="fd-section-title mb-4">{{ t('schedule.coachSession') }}</h2>
      <div v-if="upcomingCoachSessions.length" class="mb-10 space-y-3">
        <div v-for="s in upcomingCoachSessions" :key="`cs-${s.id}`" class="fd-card p-4">
          <p class="font-semibold text-fd-navy">{{ s.coach ? pickName(s.coach) : '' }}</p>
          <p class="text-sm text-fd-muted">
            {{ formatDate(s.date) }} · {{ formatTimeRange(s.startTime, s.endTime) }}
          </p>
          <p class="mt-1 text-sm text-fd-navy">
            {{ formatPrice(s.price + (s.equipmentTotal ?? 0)) }} {{ t('clubs.currency') }} ·
            {{ s.paymentStatus === 'PAID' ? t('wallet.payWithWallet') : t('booking.payAtClub') }} ·
            {{ s.status === 'PENDING' ? t('dashboard.pending') : t('dashboard.confirmed') }}
          </p>
          <BookingEquipmentList v-if="s.equipment?.length" :lines="s.equipment" />
          <button class="mt-3 text-sm font-semibold text-fd-danger" @click="cancelCoachSession(s.id)">{{ t('dashboard.cancel') }}</button>
        </div>
      </div>
      <SzEmptyState v-else class="mb-10" :message="t('common.noResults')" :action-label="t('coaches.title')" :action-to="localePath('/coaches')" />

      <h2 class="fd-section-title mb-4">{{ t('matches.title') }}</h2>
      <div v-if="matchList?.length" class="mb-10 space-y-3">
        <div v-for="item in matchList.filter((m) => m.match.status !== 'CANCELLED' && m.match.date >= today)" :key="item.id" class="fd-card p-4">
          <p class="font-semibold text-fd-navy">{{ item.match.sport ? pickName(item.match.sport) : '' }} · {{ item.match.city }}</p>
          <p class="text-sm text-fd-muted">{{ formatDate(item.match.date) }} · {{ item.match.startTime }}</p>
          <NuxtLink :to="localePath(`/matches/${item.match.id}`)" class="mt-2 inline-block text-sm font-semibold text-fd-primary">{{ t('matches.view') }}</NuxtLink>
        </div>
      </div>
      <SzEmptyState v-else class="mb-10" :message="t('common.noResults')" />

      <h2 class="fd-section-title mb-4">{{ t('dashboard.past') }}</h2>
      <div v-if="pastBookings.length" class="space-y-3">
        <div v-for="b in pastBookings" :key="`p-${b.id}`" class="fd-card p-4 opacity-80">
          <p class="font-semibold text-fd-navy">{{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }}</p>
          <p class="text-sm text-fd-muted">
            {{ formatDate(b.slot?.date ?? '') }} · {{ b.status === 'CANCELLED' ? t('dashboard.cancelled') : t('dashboard.past') }}
          </p>
        </div>
      </div>
      <SzEmptyState
        v-else
        :message="t('dashboard.noBookings')"
        :action-label="t('nav.book')"
        :action-to="localePath('/clubs?book=1')"
      />

      <section v-if="hasReviewTargets" class="fd-panel mt-8">
        <h2 class="fd-section-title mb-3">{{ t('dashboard.writeReview') }}</h2>
        <p v-if="reviewMessage" class="mb-2 text-sm text-fd-success">{{ reviewMessage }}</p>
        <select v-if="reviewableCoaches.length" v-model="reviewCoachId" class="fd-input mb-3" @change="reviewClubId = ''">
          <option value="">{{ t('dashboard.coach') }}</option>
          <option v-for="c in reviewableCoaches" :key="`coach-${c.id}`" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-if="reviewableClubs.length" v-model="reviewClubId" class="fd-input mb-3" @change="reviewCoachId = ''">
          <option value="">{{ t('search.club') }}</option>
          <option v-for="c in reviewableClubs" :key="`club-${c.id}`" :value="c.id">{{ c.name }}</option>
        </select>
        <div class="mb-3 flex gap-2">
          <button v-for="n in 5" :key="n" type="button" class="text-xl" :class="n <= reviewRating ? 'text-fd-warning' : 'text-fd-muted'" @click="reviewRating = n">★</button>
        </div>
        <textarea v-model="reviewBody" class="fd-input mb-3 min-h-20" :placeholder="t('dashboard.reviewPlaceholder')" />
        <button type="button" class="fd-btn-primary" @click="submitReview">{{ t('dashboard.submitReview') }}</button>
      </section>
    </template>

    <template v-else-if="tab === 'enrollments'">
      <h2 class="fd-section-title mb-4">{{ t('dashboard.upcoming') }}</h2>
      <div v-if="upcomingEnrollments.length" class="mb-10 space-y-3">
        <div v-for="e in upcomingEnrollments" :key="e.id" class="fd-card p-4">
          <p class="font-semibold text-fd-navy">{{ e.classSession ? localized(e.classSession.titleFa, e.classSession.titleEn) : '' }}</p>
          <p class="text-sm text-fd-muted">
            {{ e.classSession?.club ? pickName(e.classSession.club) : '' }} ·
            {{ e.classSession?.date ? formatDate(e.classSession.date) : '' }} ·
            {{ e.classSession ? formatTimeRange(e.classSession.startTime, e.classSession.endTime) : '' }}
          </p>
          <p class="mt-1 text-sm text-fd-navy">
            {{ formatPrice(e.classSession?.price ?? 0) }} {{ t('clubs.currency') }} ·
            {{ e.paymentStatus === 'PAID' ? t('wallet.payWithWallet') : t('booking.payAtClub') }}
          </p>
          <div class="mt-3 flex flex-wrap gap-3">
            <NuxtLink v-if="e.classSession" :to="localePath(`/classes/${e.classSession.id}`)" class="text-sm font-semibold text-fd-primary">{{ t('classes.title') }}</NuxtLink>
            <button
              v-if="e.classSession"
              class="text-sm font-semibold text-fd-danger"
              @click="cancelEnrollment(e.classSession.id)"
            >
              {{ t('dashboard.cancel') }}
            </button>
          </div>
        </div>
      </div>
      <SzEmptyState v-else class="mb-10" :message="t('common.noResults')" />

      <h2 class="fd-section-title mb-4">{{ t('dashboard.past') }}</h2>
      <div v-if="pastEnrollments.length" class="space-y-3">
        <div v-for="e in pastEnrollments" :key="`p-${e.id}`" class="fd-card p-4 opacity-80">
          <p class="font-semibold text-fd-navy">{{ e.classSession ? localized(e.classSession.titleFa, e.classSession.titleEn) : '' }}</p>
          <p class="text-sm text-fd-muted">
            {{ e.classSession?.club ? pickName(e.classSession.club) : '' }} ·
            {{ e.classSession?.date ? formatDate(e.classSession.date) : '' }}
          </p>
        </div>
      </div>
      <SzEmptyState v-else :message="t('common.noResults')" />
    </template>

    <template v-else-if="tab === 'plans'">
      <section v-if="plans?.length">
        <div class="space-y-3">
          <div v-for="plan in plans" :key="plan.id" class="fd-card p-4">
            <div class="flex items-start justify-between gap-2">
              <p class="font-semibold text-fd-navy">{{ localized(plan.titleFa, plan.titleEn) }}</p>
              <SzBadge v-if="plan.planType === 'DIET'" tone="green">{{ t('dashboard.dietPlan') }}</SzBadge>
            </div>
            <p v-if="plan.coach" class="text-sm text-fd-muted">{{ pickName(plan.coach) }}</p>
            <p class="mt-2 whitespace-pre-line text-sm text-fd-navy/80">{{ localized(plan.bodyFa, plan.bodyEn) }}</p>
            <label v-if="plan.assignmentId" class="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" :checked="!!plan.completedAt" @change="togglePlanComplete(plan)" />
              {{ t('dashboard.markComplete') }}
            </label>
            <textarea
              v-if="plan.assignmentId"
              v-model="plan.notes"
              class="fd-input mt-3 min-h-16 text-sm"
              :placeholder="t('dashboard.planNotes')"
              @blur="savePlanNotes(plan)"
            />
          </div>
        </div>
      </section>
      <SzEmptyState v-else :message="t('common.noResults')" />
    </template>

    <template v-else-if="tab === 'profile'">
      <section class="fd-panel mb-6">
        <h2 class="fd-section-title mb-3">{{ t('dashboard.profileTab') }}</h2>
        <p v-if="profileMessage" class="mb-2 text-sm text-fd-success">{{ profileMessage }}</p>
        <p v-if="profileError" class="mb-2 text-sm text-fd-danger">{{ profileError }}</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="profileName" class="fd-input" :placeholder="t('auth.name')" />
          <input v-model="profilePhone" class="fd-input" :placeholder="t('dashboard.phone')" />
          <select v-model="profileLocale" class="fd-input">
            <option v-for="loc in locales" :key="loc.code" :value="loc.code">{{ loc.name }}</option>
          </select>
        </div>
      </section>
      <section class="fd-panel mb-6">
        <h2 class="fd-section-title mb-3">{{ t('onboarding.pickSports') }}</h2>
        <div v-if="sports?.length" class="flex flex-wrap gap-2">
          <button
            v-for="s in sports"
            :key="`fav-${s.id}`"
            type="button"
            class="sz-chip tap-highlight"
            :class="favoriteSportSlugs.includes(s.slug) ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
            @click="toggleFavoriteSport(s.slug)"
          >
            <span class="inline-flex items-center gap-1.5">
              <SportIcon :slug="s.slug" size="sm" />
              {{ t(`sport.${s.slug}.name`) }}
            </span>
          </button>
        </div>
      </section>
      <section class="fd-panel mb-6">
        <h2 class="fd-section-title mb-3">{{ t('notifications.pushTitle') }}</h2>
        <p class="mb-3 text-sm text-fd-muted">{{ t('notifications.pushHint') }}</p>
        <label class="flex cursor-pointer items-center gap-3">
          <input v-model="pushEnabled" type="checkbox" class="rounded border-fd-primary/30" @change="onPushToggle" />
          <span class="text-sm font-medium text-fd-navy">{{ t('notifications.pushEnable') }}</span>
        </label>
      </section>
      <section class="fd-panel">
        <h2 class="fd-section-title mb-3">{{ t('dashboard.myLevel') }}</h2>
        <div v-if="sports?.length" class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="s in sports"
            :key="s.id"
            type="button"
            class="sz-chip tap-highlight"
            :class="sportSlug === s.slug ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
            @click="sportSlug = s.slug"
          >
            <span class="inline-flex items-center gap-1.5">
              <SportIcon :slug="s.slug" size="sm" />
              {{ t(`sport.${s.slug}.name`) }}
            </span>
          </button>
        </div>
        <select v-model="level" class="fd-input">
          <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
        </select>
        <button type="button" class="fd-btn-primary mt-3" @click="saveProfile">{{ t('common.save') }}</button>
      </section>
    </template>
  </div>
</template>
