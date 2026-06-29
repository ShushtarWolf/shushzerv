<script setup lang="ts">
import type { ClassPackage, Coach, CoachEquipment, CoachSession, ScheduleEvent, Sport, TrainingPlan } from '~/types'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role-coach', 'onboarding-gate'] })

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const { user } = useUserSession()
const { displayName } = useUserDisplayName()
const { pickName, localized, formatPrice, formatRating, formatNumber, formatDate, formatTimeRange, localDateISO } = useLocaleContent()
const { cityLabel } = useCities()
const toast = useToast()

useHead({ title: () => t('dashboard.coach') })

const tab = useDashboardTab('overview')

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

interface CoachStudentRow {
  id: string
  assignmentId: string
  completedAt?: string | null
  notes?: string | null
  athlete: { id: string; name: string; nameEn?: string | null; email: string }
  plan: { id: string; titleFa: string; titleEn: string; planType?: string }
}

const { data: coaches, refresh: refreshCoaches } = await useApiFetch<Coach[]>('/api/coaches')
const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: plans, refresh: refreshPlans } = await useApiFetch<TrainingPlan[]>('/api/training-plans')
const { data: coachPackages, refresh: refreshCoachPackages } = await useApiFetch<ClassPackage[]>('/api/coach/packages')
const { data: students, refresh: refreshStudents } = await useApiFetch<CoachStudentRow[]>('/api/coach/students')
const { data: coachSessions, refresh: refreshCoachSessions } = await useApiFetch<CoachSession[]>('/api/coach/sessions')
const { data: equipment, refresh: refreshEquipment } = await useApiFetch<CoachEquipment[]>('/api/coach/equipment', {
  immediate: false,
  lazy: true,
  server: false,
})
const { data: stats, refresh: refreshStats } = await useApiFetch<CoachStats>('/api/dashboard/stats')
const { data: chartData, error: chartsError, pending: chartsPending, refresh: refreshCharts } = await useApiFetch<{
  labels: string[]
  earnings: number[]
  sessionTrend: number[]
  breakdown: Array<{ key: string; value: number }>
}>('/api/dashboard/charts')

const { formatDayLabels } = useDashboardChartLabels()
const { lineOptions, areaOptions, donutOptions, colors } = useDashboardChartTheme()

const dayLabels = computed(() => formatDayLabels(chartData.value?.labels ?? []))

const earningsSeries = computed(() => [
  { name: t('dashboard.totalEarnings'), data: chartData.value?.earnings ?? [] },
])

const sessionSeries = computed(() => [
  { name: t('dashboard.studentGrowth'), data: chartData.value?.sessionTrend ?? [] },
])

const breakdownSeries = computed(() => chartData.value?.breakdown?.map((b) => b.value) ?? [])
const breakdownLabels = computed(() =>
  (chartData.value?.breakdown ?? []).map((b) => t(`dashboard.breakdown.${b.key}`, b.key)),
)

const profile = computed(() => coaches.value?.find((c) => c.userId === user.value?.id))

const editProfile = ref({
  nameFa: '',
  nameEn: '',
  city: '',
  bioFa: '',
  bioEn: '',
  sportId: '',
  sessionPrice: 300000,
  photo: '',
})

const { enabled: pushEnabled, setEnabled: setPushEnabled } = usePushNotifications()

function onPushToggle() {
  setPushEnabled(pushEnabled.value)
}

watch(profile, (p) => {
  if (p) {
    editProfile.value = {
      nameFa: p.nameFa,
      nameEn: p.nameEn,
      city: p.city,
      bioFa: p.bioFa ?? '',
      bioEn: p.bioEn ?? '',
      sportId: p.sportId,
      sessionPrice: p.sessionPrice ?? 300000,
      photo: p.photo ?? '',
    }
  }
}, { immediate: true })

const tabs = computed(() => [
  { id: 'overview', label: t('dashboard.overview'), icon: 'grid' },
  { id: 'sessions', label: t('dashboard.sessionsTab'), icon: 'chart' },
  { id: 'schedule', label: t('dashboard.scheduleTab'), icon: 'calendar' },
  { id: 'students', label: t('dashboard.myStudents'), icon: 'users' },
  { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet' },
  { id: 'plans', label: t('dashboard.plansTab'), icon: 'users' },
  { id: 'packages', label: t('packages.title'), icon: 'calendar' },
  { id: 'profile', label: t('dashboard.profileTab'), icon: 'building' },
])

provideDashboardSidebar(tabs, tab)

const statItems = computed(() => [
  { label: t('dashboard.walletBalance'), value: formatPrice(stats.value?.walletBalance ?? 0), tone: 'blue' as const, icon: 'wallet' },
  { label: t('dashboard.mySessions'), value: formatNumber(stats.value?.sessions ?? profile.value?.sessions ?? 0), tone: 'orange' as const, icon: 'calendar' },
  { label: t('dashboard.myStudents'), value: formatNumber(stats.value?.students ?? 0), tone: 'green' as const, icon: 'users' },
  { label: t('dashboard.myClasses'), value: formatNumber(stats.value?.classes ?? 0), tone: 'purple' as const, icon: 'chart' },
])

const quickActions = computed(() => [
  { id: 'sessions', label: t('dashboard.sessionsTab'), icon: 'chart', onClick: () => { tab.value = 'sessions' } },
  { id: 'plan', label: t('trainingPlans.create'), icon: 'users', onClick: () => { tab.value = 'plans' } },
  { id: 'schedule', label: t('dashboard.viewSchedule'), icon: 'calendar', onClick: () => { tab.value = 'schedule' } },
  { id: 'profile', label: t('dashboard.viewPublicProfile'), icon: 'building', onClick: () => {
    if (profile.value?.id) navigateTo(localePath(`/coaches/${profile.value.id}`))
  } },
])

const newPlan = ref({ titleFa: '', titleEn: '', bodyFa: '', bodyEn: '', athleteEmail: '', planType: 'TRAINING' as 'TRAINING' | 'DIET' })
const newEquipment = ref({
  nameFa: '',
  nameEn: '',
  price: 0,
  mode: 'PROVIDED' as 'PROVIDED' | 'RENTAL',
  stock: null as number | null,
  maxPerBooking: 4,
})
const editingPlanId = ref('')
const editPlan = ref({ titleFa: '', titleEn: '', bodyFa: '', bodyEn: '', athleteEmail: '', planType: 'TRAINING' as 'TRAINING' | 'DIET' })
const message = ref('')
const errorMessage = ref('')
const scheduleFrom = ref('')
const scheduleTo = ref('')
const today = computed(() => localDateISO())

const selectedSession = ref<CoachSession | null>(null)
const rescheduleForm = ref({ date: '', startTime: '', endTime: '' })

const { data: scheduleData, pending: schedulePending, refresh: refreshSchedule } = await useApiFetch<{ events: ScheduleEvent[] }>(
  '/api/coach/schedule',
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

const upcomingSessions = computed(() =>
  (coachSessions.value ?? []).filter((s) => s.status !== 'CANCELLED' && s.date >= today.value),
)

const pendingSessions = computed(() => upcomingSessions.value.filter((s) => s.status === 'PENDING'))

interface NextUpItem {
  kind: 'session' | 'class'
  date: string
  startTime: string
  endTime: string
  title: string
  subtitle?: string
  sessionId?: string
  classId?: string
}

const nextUp = computed<NextUpItem | null>(() => {
  const items: NextUpItem[] = []
  for (const s of upcomingSessions.value) {
    items.push({
      kind: 'session',
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      title: s.athlete?.name ?? t('schedule.coachSession'),
      subtitle: s.status === 'PENDING' ? t('dashboard.pending') : undefined,
      sessionId: s.id,
    })
  }
  for (const e of scheduleEvents.value) {
    if (e.type !== 'class' || e.date < today.value) continue
    items.push({
      kind: 'class',
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      title: e.title,
      subtitle: e.subtitle,
      classId: e.classId,
    })
  }
  items.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    return byDate !== 0 ? byDate : a.startTime.localeCompare(b.startTime)
  })
  return items[0] ?? null
})

function onScheduleRange({ from, to }: { from: string; to: string }) {
  scheduleFrom.value = from
  scheduleTo.value = to
}

watch([scheduleFrom, scheduleTo], () => {
  if (scheduleFrom.value && scheduleTo.value) refreshSchedule()
})

function openSession(session: CoachSession) {
  selectedSession.value = session
  rescheduleForm.value = { date: session.date, startTime: session.startTime, endTime: session.endTime }
  tab.value = 'sessions'
}

const focusedScheduleEvent = ref<ScheduleEvent | null>(null)
const scheduleNoteDraft = ref('')
const scheduleNotePending = ref(false)

function onCoachScheduleManage(event: ScheduleEvent) {
  focusedScheduleEvent.value = event
  scheduleNoteDraft.value = event.note ?? ''
}

function closeCoachScheduleFocus() {
  focusedScheduleEvent.value = null
  scheduleNoteDraft.value = ''
}

async function saveCoachScheduleNote() {
  const event = focusedScheduleEvent.value
  if (!event) return
  const target = scheduleNoteTarget(event, 'coach')
  if (!target) return
  scheduleNotePending.value = true
  try {
    await $fetch('/api/coach/schedule-note', {
      method: 'PATCH',
      body: { ...target, note: scheduleNoteDraft.value },
    })
    message.value = t('schedule.noteSaved')
    await refreshSchedule()
    closeCoachScheduleFocus()
  } catch {
    errorMessage.value = t('common.error')
  } finally {
    scheduleNotePending.value = false
  }
}

async function refreshSessionData() {
  await Promise.all([refreshCoachSessions(), refreshSchedule(), refreshStats()])
}

async function confirmSession(id: string) {
  errorMessage.value = ''
  try {
    await $fetch(`/api/coach/sessions/${id}`, { method: 'PATCH', body: { status: 'CONFIRMED' } })
    message.value = t('dashboard.confirmed')
    await refreshSessionData()
    if (selectedSession.value?.id === id) {
      selectedSession.value = coachSessions.value?.find((s) => s.id === id) ?? null
    }
  } catch {
    errorMessage.value = t('common.error')
  }
}

async function cancelSession(id: string) {
  errorMessage.value = ''
  try {
    await $fetch(`/api/coach/sessions/${id}`, { method: 'DELETE' })
    message.value = t('dashboard.cancelled')
    if (selectedSession.value?.id === id) selectedSession.value = null
    await refreshSessionData()
  } catch {
    errorMessage.value = t('common.error')
  }
}

async function rescheduleSession() {
  if (!selectedSession.value) return
  errorMessage.value = ''
  try {
    await $fetch(`/api/coach/sessions/${selectedSession.value.id}`, {
      method: 'PATCH',
      body: rescheduleForm.value,
    })
    message.value = t('common.save')
    await refreshSessionData()
    selectedSession.value = coachSessions.value?.find((s) => s.id === selectedSession.value?.id) ?? null
  } catch {
    errorMessage.value = t('common.error')
  }
}

async function createPlan() {
  if (!newPlan.value.titleFa || !newPlan.value.bodyFa) return
  errorMessage.value = ''
  try {
    await $fetch('/api/coach/plans', { method: 'POST', body: newPlan.value })
    newPlan.value = { titleFa: '', titleEn: '', bodyFa: '', bodyEn: '', athleteEmail: '', planType: 'TRAINING' }
    message.value = t('common.save')
    await Promise.all([refreshPlans(), refreshStudents()])
  } catch {
    errorMessage.value = t('common.error')
  }
}

async function deletePlan(id: string) {
  await $fetch(`/api/coach/plans/${id}`, { method: 'DELETE' })
  message.value = t('common.save')
  if (editingPlanId.value === id) editingPlanId.value = ''
  await Promise.all([refreshPlans(), refreshStudents()])
}

function startEditPlan(plan: TrainingPlan) {
  editingPlanId.value = plan.id
  editPlan.value = {
    titleFa: plan.titleFa,
    titleEn: plan.titleEn,
    bodyFa: plan.bodyFa,
    bodyEn: plan.bodyEn,
    athleteEmail: '',
    planType: plan.planType ?? 'TRAINING',
  }
}

async function updatePlan() {
  if (!editingPlanId.value || !editPlan.value.titleFa || !editPlan.value.bodyFa) return
  errorMessage.value = ''
  try {
    await $fetch(`/api/coach/plans/${editingPlanId.value}`, { method: 'PATCH', body: editPlan.value })
    editingPlanId.value = ''
    message.value = t('common.save')
    await Promise.all([refreshPlans(), refreshStudents()])
  } catch {
    errorMessage.value = t('common.error')
  }
}

async function unassignPlan(assignmentId: string) {
  await $fetch(`/api/coach/assignments/${assignmentId}`, { method: 'DELETE' })
  message.value = t('common.save')
  await Promise.all([refreshPlans(), refreshStudents(), refreshStats()])
}

async function messageStudent(athleteUserId: string) {
  const res = await $fetch<{ id: string }>('/api/chat', { method: 'POST', body: { userId: athleteUserId } })
  await router.push(localePath(`/chat/${res.id}`))
}

async function saveProfile() {
  errorMessage.value = ''
  try {
    await $fetch('/api/coach/profile', { method: 'PATCH', body: editProfile.value })
    message.value = t('common.save')
    await refreshCoaches()
  } catch {
    errorMessage.value = t('common.error')
  }
}

async function addEquipment() {
  if (!newEquipment.value.nameFa.trim()) return
  await $fetch('/api/coach/equipment', {
    method: 'POST',
    body: {
      nameFa: newEquipment.value.nameFa,
      nameEn: newEquipment.value.nameEn || newEquipment.value.nameFa,
      price: newEquipment.value.price,
      mode: newEquipment.value.mode,
      stock: newEquipment.value.stock,
      maxPerBooking: newEquipment.value.maxPerBooking,
    },
  })
  newEquipment.value = {
    nameFa: '',
    nameEn: '',
    price: 0,
    mode: 'PROVIDED',
    stock: null,
    maxPerBooking: 4,
  }
  message.value = t('equipment.equipmentCreated')
  await refreshEquipment()
}

async function deleteEquipment(id: string) {
  await $fetch(`/api/coach/equipment/${id}`, { method: 'DELETE' })
  message.value = t('common.save')
  await refreshEquipment()
}

watch(tab, (v) => {
  if (v === 'profile') refreshEquipment()
}, { immediate: true })

function sessionStatusLabel(s: CoachSession) {
  if (s.status === 'CANCELLED') return t('dashboard.cancelled')
  if (s.status === 'PENDING') return t('dashboard.pending')
  return t('dashboard.confirmed')
}

async function exportCoachData() {
  window.open('/api/coach/export', '_blank')
}

function goNextUp(item: NextUpItem) {
  if (item.sessionId) {
    const session = coachSessions.value?.find((s) => s.id === item.sessionId)
    if (session) openSession(session)
  } else if (item.classId) {
    navigateTo(localePath(`/classes/${item.classId}`))
  }
}
</script>

<template>
  <div class="page-enter">
    <DashboardPageHeader :title="t('dashboard.coach')" :subtitle="t('dashboard.welcomeUser', { name: displayName })" />
    <p v-if="message" class="mb-4 text-sm text-fd-success">{{ message }}</p>
    <p v-if="errorMessage" class="mb-4 text-sm text-fd-danger">{{ errorMessage }}</p>

    <template v-if="tab === 'overview'">
      <div class="mb-6 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-fd-primary to-[#5a6fd6] p-6 text-white shadow-fd">
        <p class="text-xs font-bold uppercase tracking-wide text-white/75">{{ t('dashboard.nextUp') }}</p>
        <template v-if="nextUp">
          <p class="mt-2 text-xl font-black">{{ nextUp.title }}</p>
          <p v-if="nextUp.subtitle" class="mt-1 text-sm text-white/85">{{ nextUp.subtitle }}</p>
          <p class="mt-2 text-sm text-white/90">
            {{ formatDate(nextUp.date) }} · {{ formatTimeRange(nextUp.startTime, nextUp.endTime) }}
          </p>
          <button type="button" class="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-fd-primary" @click="goNextUp(nextUp)">
            {{ nextUp.kind === 'session' ? t('dashboard.sessionsTab') : t('classes.title') }}
          </button>
        </template>
        <p v-else class="mt-3 text-sm text-white/90">{{ t('dashboard.coachNextUpEmpty') }}</p>
      </div>

      <DashboardMetricsStrip
        :title="t('dashboard.performanceSummary')"
        :subtitle="t('dashboard.totalEarnings') + ': ' + formatPrice(stats?.totalEarnings ?? 0) + ' · ★ ' + formatRating(stats?.rating ?? profile?.rating ?? 0)"
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

      <SkillRatingPanel class="mb-6" />

      <div v-if="pendingSessions.length" class="fd-panel mb-6">
        <h2 class="fd-section-title mb-3">{{ t('dashboard.pendingSessions') }}</h2>
        <div class="space-y-2">
          <div v-for="s in pendingSessions" :key="s.id" class="rounded-xl bg-[#F5F5F4] p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-semibold text-fd-navy">{{ s.athlete?.name }}</p>
                <p class="text-sm text-fd-muted">{{ formatDate(s.date) }} · {{ formatTimeRange(s.startTime, s.endTime) }}</p>
              </div>
              <div class="flex gap-2">
                <button type="button" class="fd-btn-primary !py-2 text-xs" @click="confirmSession(s.id)">{{ t('dashboard.confirmSession') }}</button>
                <button type="button" class="text-xs font-semibold text-fd-danger" @click="cancelSession(s.id)">{{ t('dashboard.cancel') }}</button>
              </div>
            </div>
            <BookingEquipmentList v-if="s.equipment?.length" :lines="s.equipment" class="mt-2" />
          </div>
        </div>
      </div>

      <div class="mb-6 grid gap-4 lg:grid-cols-12">
        <div class="lg:col-span-8">
          <DashboardChartCard
            :title="t('dashboard.earningsTrend')"
            :subtitle="t('dashboard.last7Days')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="area"
              :series="earningsSeries"
              :options="areaOptions(dayLabels, [colors.primary])"
              :height="260"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-4">
          <DashboardChartCard
            :title="t('dashboard.earningsBreakdown')"
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
            :title="t('dashboard.studentGrowth')"
            :subtitle="t('dashboard.last7Days')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="line"
              :series="sessionSeries"
              :options="lineOptions(dayLabels, [colors.success])"
              :height="240"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-6">
          <DashboardQuickActions :actions="quickActions" compact />
        </div>
      </div>

      <div v-if="profile" class="fd-panel mb-8">
        <h2 class="fd-section-title">{{ pickName(profile) }}</h2>
        <p class="mt-2 text-sm text-fd-muted">{{ cityLabel(profile.city) }} · ★ {{ formatRating(profile.rating) }}</p>
        <p class="mt-4 text-fd-navy/80">{{ localized(profile.bioFa || '', profile.bioEn || '') }}</p>
      </div>
    </template>

    <template v-else-if="tab === 'sessions'">
      <h2 class="fd-section-title mb-4">{{ t('dashboard.sessionsTab') }}</h2>
      <div v-if="selectedSession" class="fd-panel mb-6 grid gap-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-bold text-fd-navy">{{ selectedSession.athlete?.name }}</p>
            <p class="text-sm text-fd-muted">{{ selectedSession.athlete?.email }}</p>
          </div>
          <button type="button" class="text-sm text-fd-muted" @click="selectedSession = null">{{ t('common.close') }}</button>
        </div>
        <p class="text-sm text-fd-navy">
          {{ formatPrice(selectedSession.price + (selectedSession.equipmentTotal ?? 0)) }} ·
          {{ selectedSession.paymentStatus === 'PAID' ? t('wallet.payWithWallet') : t('booking.payAtClub') }} ·
          {{ sessionStatusLabel(selectedSession) }}
        </p>
        <BookingEquipmentList v-if="selectedSession.equipment?.length" :lines="selectedSession.equipment" />
        <div class="grid gap-3 sm:grid-cols-3">
          <input v-model="rescheduleForm.date" type="date" class="fd-input" />
          <input v-model="rescheduleForm.startTime" type="time" class="fd-input" />
          <input v-model="rescheduleForm.endTime" type="time" class="fd-input" />
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-if="selectedSession.status === 'PENDING'" type="button" class="fd-btn-primary" @click="confirmSession(selectedSession.id)">{{ t('dashboard.confirmSession') }}</button>
          <button type="button" class="fd-btn-ghost" @click="rescheduleSession">{{ t('dashboard.reschedule') }}</button>
          <button type="button" class="text-sm font-semibold text-fd-danger" @click="cancelSession(selectedSession.id)">{{ t('dashboard.cancel') }}</button>
          <button v-if="selectedSession.athlete?.id" type="button" class="text-sm font-semibold text-fd-primary" @click="messageStudent(selectedSession.athlete!.id)">{{ t('dashboard.messageStudent') }}</button>
        </div>
      </div>

      <div v-if="upcomingSessions.length" class="mb-6 space-y-3">
        <h3 class="text-sm font-bold text-fd-muted">{{ t('dashboard.upcoming') }}</h3>
        <div v-for="s in upcomingSessions" :key="s.id" class="fd-card cursor-pointer p-4 transition hover:shadow-fd-soft" @click="openSession(s)">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-fd-navy">{{ s.athlete?.name }}</p>
              <p class="text-sm text-fd-muted">{{ formatDate(s.date) }} · {{ formatTimeRange(s.startTime, s.endTime) }}</p>
            </div>
            <SzBadge :tone="s.status === 'PENDING' ? 'orange' : 'green'">{{ sessionStatusLabel(s) }}</SzBadge>
          </div>
          <BookingEquipmentList v-if="s.equipment?.length" :lines="s.equipment" class="mt-2" />
        </div>
      </div>
      <SzEmptyState v-else :message="t('common.noResults')" />
    </template>

    <template v-else-if="tab === 'wallet'">
      <WalletPanel kind="user" can-payout variant="fd" />
      <button type="button" class="fd-btn-ghost mt-4 text-sm" @click="exportCoachData">{{ t('dashboard.exportCsv') }}</button>
    </template>

    <template v-else-if="tab === 'schedule'">
      <ScheduleCalendar
        variant="dashboard"
        manage-notes
        :events="scheduleEvents"
        :loading="schedulePending"
        @range-change="onScheduleRange"
        @manage-event="onCoachScheduleManage"
      />

      <ScheduleEventNoteDialog
        v-if="focusedScheduleEvent"
        :event="focusedScheduleEvent"
        v-model="scheduleNoteDraft"
        :saving="scheduleNotePending"
        @save="saveCoachScheduleNote"
        @close="closeCoachScheduleFocus"
      />
    </template>

    <template v-else-if="tab === 'students'">
      <h2 class="fd-section-title mb-4">{{ t('dashboard.myStudents') }}</h2>
      <div v-if="students?.length" class="space-y-3">
        <div v-for="s in students" :key="s.id" class="fd-card p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-fd-navy">{{ s.athlete.name }}</p>
              <p class="text-sm text-fd-muted">{{ s.athlete.email }}</p>
              <p class="mt-1 text-sm text-fd-navy">{{ localized(s.plan.titleFa, s.plan.titleEn) }}</p>
              <p v-if="s.completedAt" class="mt-1 text-xs font-semibold text-fd-success">{{ t('dashboard.planCompleted') }}</p>
              <p v-if="s.notes" class="mt-2 text-sm text-fd-muted">{{ s.notes }}</p>
            </div>
            <button type="button" class="text-sm font-semibold text-fd-primary" @click="messageStudent(s.athlete.id)">{{ t('dashboard.messageStudent') }}</button>
          </div>
        </div>
      </div>
      <SzEmptyState v-else :message="t('common.noResults')" />
    </template>

    <template v-else-if="tab === 'plans'">
      <section>
        <h2 class="fd-section-title mb-4">{{ t('trainingPlans.manage') }}</h2>
        <div v-if="plans?.length" class="mb-4 space-y-3">
          <div v-for="plan in plans" :key="plan.id" class="fd-card p-4">
            <div class="flex items-start justify-between gap-2">
              <p class="font-semibold text-fd-navy">{{ localized(plan.titleFa, plan.titleEn) }}</p>
              <div class="flex gap-2">
                <button type="button" class="text-xs font-semibold text-fd-primary" @click="startEditPlan(plan)">{{ t('common.edit') }}</button>
                <button type="button" class="text-xs font-semibold text-fd-danger" @click="deletePlan(plan.id)">{{ t('common.delete') }}</button>
              </div>
            </div>
            <p class="mt-1 whitespace-pre-line text-sm text-fd-navy/80">{{ localized(plan.bodyFa, plan.bodyEn) }}</p>
            <div v-if="plan.assignments?.length" class="mt-3 space-y-2 border-t border-fd-primary/10 pt-3">
              <p class="text-xs font-bold uppercase text-fd-muted">{{ t('dashboard.myStudents') }}</p>
              <div v-for="a in plan.assignments" :key="a.id" class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F5F5F4] px-3 py-2">
                <div>
                  <p class="text-sm font-semibold text-fd-navy">{{ a.athlete?.name }}</p>
                  <p v-if="a.completedAt" class="text-xs text-fd-success">{{ t('dashboard.planCompleted') }}</p>
                  <p v-if="a.notes" class="text-xs text-fd-muted">{{ a.notes }}</p>
                </div>
                <button type="button" class="text-xs font-semibold text-fd-danger" @click="unassignPlan(a.id)">{{ t('dashboard.unassign') }}</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="editingPlanId" class="fd-panel mb-4 grid gap-3">
          <h3 class="text-sm font-bold text-fd-navy">{{ t('common.edit') }}</h3>
          <input v-model="editPlan.titleFa" class="fd-input" :placeholder="t('trainingPlans.titleField') + ' (FA)'" />
          <input v-model="editPlan.titleEn" class="fd-input" placeholder="Title (EN)" />
          <textarea v-model="editPlan.bodyFa" class="fd-input min-h-24" :placeholder="t('trainingPlans.bodyField') + ' (FA)'" />
          <textarea v-model="editPlan.bodyEn" class="fd-input min-h-24" placeholder="Body (EN)" />
          <select v-model="editPlan.planType" class="fd-input">
            <option value="TRAINING">{{ t('dashboard.trainingPlan') }}</option>
            <option value="DIET">{{ t('dashboard.dietPlan') }}</option>
          </select>
          <input v-model="editPlan.athleteEmail" type="email" class="fd-input" :placeholder="t('trainingPlans.assignEmail')" />
          <div class="flex gap-2">
            <button type="button" class="fd-btn-primary" @click="updatePlan">{{ t('common.save') }}</button>
            <button type="button" class="fd-btn-ghost" @click="editingPlanId = ''">{{ t('common.cancel') }}</button>
          </div>
        </div>
        <div class="fd-panel grid gap-3">
          <input v-model="newPlan.titleFa" class="fd-input" :placeholder="t('trainingPlans.titleField') + ' (FA)'" />
          <input v-model="newPlan.titleEn" class="fd-input" placeholder="Title (EN)" />
          <textarea v-model="newPlan.bodyFa" class="fd-input min-h-24" :placeholder="t('trainingPlans.bodyField') + ' (FA)'" />
          <textarea v-model="newPlan.bodyEn" class="fd-input min-h-24" placeholder="Body (EN)" />
          <select v-model="newPlan.planType" class="fd-input">
            <option value="TRAINING">{{ t('dashboard.trainingPlan') }}</option>
            <option value="DIET">{{ t('dashboard.dietPlan') }}</option>
          </select>
          <input v-model="newPlan.athleteEmail" type="email" class="fd-input" :placeholder="t('trainingPlans.assignEmail')" />
          <button type="button" class="fd-btn-primary" @click="createPlan">{{ t('trainingPlans.create') }}</button>
        </div>
      </section>
    </template>

    <template v-else-if="tab === 'packages'">
      <PackageManagerPanel
        mode="coach"
        :packages="coachPackages"
        :sports="sports"
        @refresh="refreshCoachPackages"
      />
    </template>

    <template v-else-if="tab === 'profile'">
      <section class="mb-8">
        <h2 class="fd-section-title mb-4">{{ t('equipment.manage') }}</h2>
        <div v-if="equipment?.length" class="mb-4 space-y-2">
          <div v-for="item in equipment" :key="item.id" class="fd-card flex items-start justify-between gap-2 p-4">
            <div>
              <p class="font-semibold text-fd-navy">{{ localized(item.nameFa, item.nameEn) }}</p>
              <p class="text-sm text-fd-muted">
                <span v-if="(item.mode ?? (item.price > 0 ? 'RENTAL' : 'PROVIDED')) === 'PROVIDED'">{{ t('equipment.provided') }}</span>
                <span v-else>{{ formatPrice(item.price) }} {{ t('clubs.currency') }}</span>
              </p>
            </div>
            <button type="button" class="text-xs font-semibold text-fd-danger" @click="deleteEquipment(item.id)">{{ t('common.delete') }}</button>
          </div>
        </div>
        <p v-else class="mb-4 rounded-[1.25rem] border border-dashed border-fd-primary/10 bg-[#F5F5F4]/50 px-4 py-6 text-center text-sm text-fd-muted">
          {{ t('equipment.noEquipmentYet') }}
        </p>
        <div class="fd-panel grid gap-3 sm:grid-cols-2">
          <input v-model="newEquipment.nameFa" class="fd-input sm:col-span-2" :placeholder="t('equipment.equipmentName') + ' (FA)'" />
          <input v-model="newEquipment.nameEn" class="fd-input sm:col-span-2" placeholder="Equipment name (EN)" />
          <select v-model="newEquipment.mode" class="fd-input">
            <option value="PROVIDED">{{ t('equipment.modeProvided') }}</option>
            <option value="RENTAL">{{ t('equipment.modeRental') }}</option>
          </select>
          <input
            v-model.number="newEquipment.price"
            type="number"
            class="fd-input"
            min="0"
            :placeholder="t('dashboard.price')"
            :disabled="newEquipment.mode === 'PROVIDED'"
          />
          <input
            v-model.number="newEquipment.stock"
            type="number"
            class="fd-input"
            min="0"
            :placeholder="t('equipment.stock')"
          />
          <input
            v-model.number="newEquipment.maxPerBooking"
            type="number"
            class="fd-input"
            min="1"
            :placeholder="t('equipment.maxPerBooking')"
          />
          <button type="button" class="fd-btn-primary sm:col-span-2" @click="addEquipment">{{ t('equipment.addEquipment') }}</button>
        </div>
      </section>

      <section class="fd-panel grid gap-3">
        <input v-model="editProfile.nameFa" class="fd-input" placeholder="Name (FA)" />
        <input v-model="editProfile.nameEn" class="fd-input" placeholder="Name (EN)" />
        <input v-model="editProfile.city" class="fd-input" :placeholder="t('search.city')" />
        <input v-model.number="editProfile.sessionPrice" type="number" step="50000" min="0" class="fd-input" :placeholder="t('coaches.sessionPrice')" />
        <input v-model="editProfile.photo" class="fd-input" :placeholder="t('dashboard.photoUrl')" />
        <textarea v-model="editProfile.bioFa" class="fd-input min-h-24" placeholder="Bio (FA)" />
        <textarea v-model="editProfile.bioEn" class="fd-input min-h-24" placeholder="Bio (EN)" />
        <select v-model="editProfile.sportId" class="fd-input">
          <option v-for="s in sports" :key="s.id" :value="s.id">{{ pickName(s) }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-fd-navy">
          <input v-model="pushEnabled" type="checkbox" class="rounded border-fd-primary/20" @change="onPushToggle" />
          {{ t('dashboard.pushEnable') }}
        </label>
        <button type="button" class="fd-btn-primary" @click="saveProfile">{{ t('common.save') }}</button>
        <NuxtLink v-if="profile?.id" :to="localePath(`/coaches/${profile.id}`)" class="text-center text-sm font-semibold text-fd-primary">
          {{ t('dashboard.viewPublicProfile') }}
        </NuxtLink>
      </section>
    </template>
  </div>
</template>
