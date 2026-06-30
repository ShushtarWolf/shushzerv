<script setup lang="ts">
import type { Club, ClubActivity, Court, CourtAddon, ClassPackage, Review, ScheduleEvent, Sport, Tournament } from '~/types'
import { weekdayCodeFromDate } from '#shared/scheduleWeekday'
import { DEFAULT_CITY } from '~/composables/useCities'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role-club', 'onboarding-gate'] })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { requireLogin } = useAuthRedirect()
const { pickName, localized, formatPrice, formatRating, formatNumber, formatDate, formatTime, formatTimeRange, localDateISO, parseLocalDate } = useLocaleContent()
const { cities } = useCities()
const { levels, levelLabel } = useSkillLevel()
const { classTypeLabel, classGroupLabel } = useClassSession()
const { weekdayOptions, toggleDay, daySelected } = useClassPackage()
const { SLOT_DURATION_OPTIONS, buildSlotTimes, durationLabel, eventDurationLabel } = useSlotSchedule()
const { user, fetch: refreshSession } = useUserSession()
const { displayName } = useUserDisplayName()

useHead({ title: () => t('dashboard.clubAdmin') })

provideDashboardShellConfig(computed(() => ({
  subtitle: t('dashboard.clubAdmin'),
  homeLink: '/dashboard/club',
  showSearch: true,
})))

const {
  tab,
  clubs,
  clubsPending,
  clubsError,
  refreshClubs,
  sports,
  selectedClubId,
  stats,
  refreshStats,
  chartData,
  chartsError,
  chartsPending,
  refreshCharts,
  tournaments,
  refreshTournaments,
  tabs,
} = useClubDashboard()

provideDashboardSidebar(tabs, tab)

const { data: bookings, refresh: refreshBookings } = await useApiFetch('/api/club/bookings', {
  query: computed(() => ({ clubId: selectedClubId.value || undefined })),
  watch: [selectedClubId],
})

const { formatDayLabels, dowLabels } = useDashboardChartLabels()
const { lineOptions, barOptions, areaOptions, donutOptions, colors } = useDashboardChartTheme()

const dayLabels = computed(() => formatDayLabels(chartData.value?.labels ?? []))

const revenueSeries = computed(() => [
  { name: t('dashboard.totalRevenue'), data: chartData.value?.revenue ?? [] },
])

const bookingSeries = computed(() => [
  { name: t('dashboard.myBookings'), data: chartData.value?.bookingByDow ?? [] },
  { name: t('classes.title'), data: chartData.value?.classByDow ?? [] },
])

const scheduleClubId = computed(() => selectedClubId.value || clubs.value?.[0]?.id || '')

const { data: activities, refresh: refreshActivities } = await useApiFetch<ClubActivity[]>('/api/club/activities', {
  query: computed(() => ({ clubId: selectedClubId.value || undefined })),
  watch: [selectedClubId],
})

const { data: classSessions, refresh: refreshClasses } = await useApiFetch('/api/club/classes', {
  query: computed(() => ({ clubId: selectedClubId.value || undefined })),
  watch: [selectedClubId],
})

const { data: clubPackages, refresh: refreshPackages } = await useApiFetch<ClassPackage[]>('/api/club/packages', {
  query: computed(() => ({ clubId: selectedClubId.value || undefined })),
  watch: [selectedClubId],
})

const { data: coaches } = await useApiFetch('/api/coaches')

const { data: addons, refresh: refreshAddons } = await useApiFetch<CourtAddon[]>('/api/club/addons', {
  query: computed(() => ({ clubId: selectedClubId.value || undefined })),
  watch: [selectedClubId],
})

const { data: clubReviews, refresh: refreshReviews } = await useApiFetch<Review[]>('/api/club/reviews', {
  query: computed(() => ({ clubId: selectedClubId.value || undefined })),
  watch: [selectedClubId],
})

const editingCourtId = ref('')
const editCourt = ref({
  nameFa: '',
  nameEn: '',
  sportId: '',
  indoor: false,
  genderPolicy: 'MIXED' as Court['genderPolicy'],
})
const editModal = ref<'activity' | 'class' | 'tournament' | null>(null)
const editActivity = ref({ id: '', titleFa: '', titleEn: '', descFa: '', date: '', startTime: '' })
const editClass = ref({
  id: '',
  titleFa: '',
  titleEn: '',
  date: '',
  startTime: '',
  endTime: '',
  price: 0,
  maxSeats: 12,
  coachId: '',
  classType: 'GROUP' as 'GROUP' | 'SEMI_PRIVATE',
  genderPolicy: 'MIXED' as 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED',
  minLevel: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
  maxLevel: 'PRO' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
})
const editTournament = ref({
  id: '',
  titleFa: '',
  titleEn: '',
  descFa: '',
  descEn: '',
  date: '',
  startTime: '',
  maxParticipants: 32,
  price: 0,
  sportId: '',
})
const editPending = ref(false)
const expandedTournamentId = ref('')
const tournamentRegistrations = ref<Array<{
  id: string
  registeredAt: string
  user?: { name: string; nameEn?: string | null; email: string }
}>>([])
const tournamentRegsPending = ref(false)

const clubProfile = ref({
  nameFa: '',
  nameEn: '',
  addressFa: '',
  addressEn: '',
  city: DEFAULT_CITY,
  district: '',
  lat: null as number | null,
  lng: null as number | null,
  priceFrom: 0,
  discount: null as number | null,
  image: '',
})
const profilePending = ref(false)
const newAddon = ref({
  nameFa: '',
  nameEn: '',
  price: 50_000,
  courtId: '',
  mode: 'RENTAL' as 'PROVIDED' | 'RENTAL',
  stock: null as number | null,
  maxPerBooking: 4,
})
const slotPrice = ref(0)

const statItems = computed(() => [
  { label: t('dashboard.todayRevenue'), value: formatPrice(stats.value?.todayRevenue ?? 0), tone: 'pink' as const, icon: 'wallet' },
  { label: t('dashboard.monthRevenue'), value: formatPrice(stats.value?.monthRevenue ?? 0), tone: 'orange' as const, icon: 'chart' },
  { label: t('dashboard.myBookings'), value: formatNumber(stats.value?.bookingCount ?? 0), tone: 'green' as const, icon: 'calendar' },
  { label: t('dashboard.pendingPayAtClub'), value: formatNumber(stats.value?.pendingBookings ?? 0), tone: 'purple' as const, icon: 'building' },
])

const quickActions = computed(() => [
  { id: 'schedule', label: t('dashboard.viewSchedule'), icon: 'calendar', onClick: () => { tab.value = 'schedule' } },
  { id: 'bookings', label: t('dashboard.incomingBookings'), icon: 'chart', onClick: () => { tab.value = 'bookings' } },
  { id: 'manage', label: t('dashboard.manageTab'), icon: 'building', onClick: () => { tab.value = 'manage' } },
  { id: 'wallet', label: t('dashboard.viewWallet'), icon: 'wallet', onClick: () => { tab.value = 'wallet' } },
])

const scheduleCourts = computed(() =>
  selectedClub.value?.courts?.map((c) => ({ id: c.id, name: pickName(c) })) ?? [],
)

const scheduleGridSettings = computed(() => {
  const club = selectedClub.value
  if (!club) return undefined
  return {
    durationMinutes: club.slotDurationMinutes ?? 120,
    openTime: club.slotOpenTime ?? '08:00',
    closeTime: club.slotCloseTime ?? '22:00',
  }
})

type GridCellSelection = { courtId: string; courtName: string; date: string; startTime: string; endTime: string }

const clubBookSlotIds = ref<string[]>([])
const selectedGridCells = ref<GridCellSelection[]>([])
const showBulkReservePanel = ref(false)
const showRecurringClassPanel = ref(false)
const clubBookGuestName = ref('')
const clubBookAthletePhone = ref('')
const clubBookCoachId = ref('')
const clubBookAthleteKnown = ref(false)
const clubBookError = ref('')
const clubBookPending = ref(false)
const recurringClassPending = ref(false)
const recurringClassError = ref('')

function defaultRecurringClassForm() {
  const end = parseLocalDate(localDateISO())
  end.setDate(end.getDate() + 28)
  return {
    titleFa: '',
    titleEn: '',
    sportId: '',
    coachId: '',
    fromDate: localDateISO(),
    toDate: localDateISO(end),
    daysOfWeek: 'SAT',
    startTime: '14:00',
    endTime: '15:30',
    price: 200000,
    maxSeats: 12,
    classType: 'GROUP' as 'GROUP' | 'SEMI_PRIVATE',
    genderPolicy: 'MIXED' as 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED',
    minLevel: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
    maxLevel: 'PRO' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
  }
}

const recurringClassForm = ref(defaultRecurringClassForm())

const totalScheduleSelection = computed(() => clubBookSlotIds.value.length + selectedGridCells.value.length)

const newActivity = ref({ titleFa: '', titleEn: '', descFa: '', date: localDateISO(), startTime: '18:00' })
const newClass = ref({
  titleFa: '',
  titleEn: '',
  sportId: '',
  coachId: '',
  date: localDateISO(),
  startTime: '10:00',
  endTime: '11:30',
  price: 200000,
  maxSeats: 12,
  classType: 'GROUP' as 'GROUP' | 'SEMI_PRIVATE',
  genderPolicy: 'MIXED' as 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED',
  minLevel: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
  maxLevel: 'PRO' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
})
const newTournament = ref({ titleFa: '', titleEn: '', sportId: '', date: localDateISO(), startTime: '10:00', maxParticipants: 32, price: 0 })
const cancellationPolicyFa = ref('')
const cancellationPolicyEn = ref('')
const cancellationHours = ref(24)
const selectedClub = computed(() => clubs.value?.find((c) => c.id === selectedClubId.value))
const newCourt = ref({ nameFa: '', nameEn: '', sportId: '' })
const slotDate = ref(localDateISO())
const bulkFromDate = ref(localDateISO())
const bulkToDate = ref('')
const bulkPending = ref(false)
const replyingReviewId = ref('')
const replyText = ref('')
const replyPending = ref(false)
const slotCourtId = ref('')
const slotDurationMinutes = ref(120)
const slotOpenTime = ref('08:00')
const slotCloseTime = ref('22:00')
const slotSettingsPending = ref(false)
const message = ref('')
const scheduleFrom = ref('')
const scheduleTo = ref('')
const focusedScheduleEvent = ref<ScheduleEvent | null>(null)
const scheduleNoteDraft = ref('')
const scheduleNotePending = ref(false)

const { data: scheduleData, pending: schedulePending, refresh: refreshSchedule } = await useApiFetch<{ events: ScheduleEvent[] }>(
  '/api/club/schedule',
  {
    query: computed(() => ({
      clubId: scheduleClubId.value || undefined,
      from: scheduleFrom.value || undefined,
      to: scheduleTo.value || undefined,
    })),
    watch: [scheduleClubId, scheduleFrom, scheduleTo],
    immediate: false,
  },
)

const scheduleEvents = computed(() => scheduleData.value?.events ?? [])

function onScheduleRange({ from, to }: { from: string; to: string }) {
  scheduleFrom.value = from
  scheduleTo.value = to
}

watch([scheduleClubId, scheduleFrom, scheduleTo], () => {
  if (scheduleClubId.value && scheduleFrom.value && scheduleTo.value) refreshSchedule()
})

watch(tab, (t) => {
  if (t === 'schedule' && scheduleClubId.value && scheduleFrom.value && scheduleTo.value) refreshSchedule()
})

onMounted(async () => {
  await refreshSession()
  await refreshClubs()
})

watch(clubsError, (err) => {
  const status = (err as { statusCode?: number } | null)?.statusCode
  if (status === 401) requireLogin()
})

watch(selectedClub, (c) => {
  if (c?.courts?.length) slotCourtId.value = c.courts[0].id
  if (c) {
    slotDurationMinutes.value = c.slotDurationMinutes ?? 120
    slotOpenTime.value = c.slotOpenTime ?? '08:00'
    slotCloseTime.value = c.slotCloseTime ?? '22:00'
    cancellationPolicyFa.value = c.cancellationPolicyFa ?? ''
    cancellationPolicyEn.value = c.cancellationPolicyEn ?? ''
    cancellationHours.value = c.cancellationHours ?? 24
    slotPrice.value = c.priceFrom ?? 0
    if (!bulkToDate.value) {
      const end = parseLocalDate(localDateISO())
      end.setDate(end.getDate() + 6)
      bulkToDate.value = localDateISO(end)
    }
    clubProfile.value = {
      nameFa: c.nameFa,
      nameEn: c.nameEn,
      addressFa: c.addressFa,
      addressEn: c.addressEn,
      city: c.city,
      district: c.district ?? '',
      lat: c.lat ?? null,
      lng: c.lng ?? null,
      priceFrom: c.priceFrom,
      discount: c.discount ?? null,
      image: c.image ?? '',
    }
  }
}, { immediate: true })

const financeBreakdownLabels = computed(() =>
  (chartData.value?.breakdown ?? []).map((b) =>
    b.key === 'bookings' ? t('dashboard.myBookings') : t('classes.title'),
  ),
)

const genderPolicyOptions = computed(() => [
  { value: 'MEN', label: t('dashboard.genderMen') },
  { value: 'WOMEN', label: t('dashboard.genderWomen') },
  { value: 'FAMILY', label: t('dashboard.genderFamily') },
  { value: 'MIXED', label: t('dashboard.genderMixed') },
] as const)

function reviewerLabel(user?: { name: string; nameEn?: string | null; email?: string }) {
  if (!user) return t('testimonials.anonymous')
  return userDisplayName(user, locale.value) || user.email
}

function startReply(review: Review) {
  replyingReviewId.value = review.id
  replyText.value = review.replyFa ?? ''
}

function cancelReply() {
  replyingReviewId.value = ''
  replyText.value = ''
}

async function saveReviewReply(reviewId: string) {
  if (!replyText.value.trim()) return
  replyPending.value = true
  try {
    await $fetch(`/api/club/reviews/${reviewId}`, {
      method: 'PATCH',
      body: { replyFa: replyText.value.trim(), replyEn: replyText.value.trim() },
    })
    message.value = t('dashboard.replySaved')
    cancelReply()
    await refreshReviews()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    message.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    replyPending.value = false
  }
}

function startEditCourt(court: Court) {
  editingCourtId.value = court.id
  editCourt.value = {
    nameFa: court.nameFa,
    nameEn: court.nameEn,
    sportId: court.sportId,
    indoor: court.indoor ?? false,
    genderPolicy: court.genderPolicy ?? 'MIXED',
  }
}

function cancelEditCourt() {
  editingCourtId.value = ''
}

async function saveCourt() {
  if (!editingCourtId.value || !editCourt.value.nameFa || !editCourt.value.sportId) return
  editPending.value = true
  try {
    await $fetch(`/api/club/courts/${editingCourtId.value}`, {
      method: 'PATCH',
      body: editCourt.value,
    })
    editingCourtId.value = ''
    message.value = t('common.save')
    await refreshClubs()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    message.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    editPending.value = false
  }
}

function openEditActivity(a: ClubActivity) {
  editActivity.value = {
    id: a.id,
    titleFa: a.titleFa,
    titleEn: a.titleEn,
    descFa: a.descFa,
    date: a.date,
    startTime: a.startTime,
  }
  editModal.value = 'activity'
}

function applyClassTierPreset(
  target: typeof newClass.value,
  genderPolicy: 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED',
  tier: 'beginner' | 'advanced',
) {
  target.genderPolicy = genderPolicy
  if (tier === 'beginner') {
    target.minLevel = 'BEGINNER'
    target.maxLevel = 'INTERMEDIATE'
  } else {
    target.minLevel = 'ADVANCED'
    target.maxLevel = 'PRO'
  }
}

function onClassTypeChange(target: typeof newClass.value) {
  target.maxSeats = target.classType === 'SEMI_PRIVATE' ? 3 : 12
}

function openEditClass(cls: {
  id: string
  titleFa: string
  titleEn: string
  date: string
  startTime: string
  endTime: string
  price: number
  maxSeats: number
  coachId?: string | null
  classType?: 'GROUP' | 'SEMI_PRIVATE'
  genderPolicy?: 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED'
  minLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'
  maxLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'
}) {
  editClass.value = {
    id: cls.id,
    titleFa: cls.titleFa,
    titleEn: cls.titleEn,
    date: cls.date,
    startTime: cls.startTime,
    endTime: cls.endTime,
    price: cls.price,
    maxSeats: cls.maxSeats,
    coachId: cls.coachId ?? '',
    classType: cls.classType ?? 'GROUP',
    genderPolicy: cls.genderPolicy ?? 'MIXED',
    minLevel: cls.minLevel ?? 'BEGINNER',
    maxLevel: cls.maxLevel ?? 'PRO',
  }
  editModal.value = 'class'
}

function openEditTournament(tr: Tournament) {
  editTournament.value = {
    id: tr.id,
    titleFa: tr.titleFa,
    titleEn: tr.titleEn,
    descFa: tr.descFa,
    descEn: tr.descEn,
    date: tr.date,
    startTime: tr.startTime,
    maxParticipants: tr.maxParticipants,
    price: tr.price,
    sportId: tr.sportId,
  }
  editModal.value = 'tournament'
}

function closeEditModal() {
  editModal.value = null
}

async function saveEditModal() {
  editPending.value = true
  try {
    if (editModal.value === 'activity' && editActivity.value.id) {
      await $fetch(`/api/club/activities/${editActivity.value.id}`, {
        method: 'PATCH',
        body: {
          titleFa: editActivity.value.titleFa,
          titleEn: editActivity.value.titleEn || editActivity.value.titleFa,
          descFa: editActivity.value.descFa,
          date: editActivity.value.date,
          startTime: editActivity.value.startTime,
        },
      })
      message.value = t('common.save')
      await refreshActivities()
    } else if (editModal.value === 'class' && editClass.value.id) {
      const { id, ...classBody } = editClass.value
      await $fetch(`/api/club/classes/${id}`, {
        method: 'PATCH',
        body: {
          ...classBody,
          coachId: classBody.coachId || null,
        },
      })
      message.value = t('common.save')
      await refreshClasses()
    } else if (editModal.value === 'tournament' && editTournament.value.id) {
      const { id, ...tournamentBody } = editTournament.value
      await $fetch(`/api/club/tournaments/${id}`, {
        method: 'PATCH',
        body: tournamentBody,
      })
      message.value = t('common.save')
      await refreshTournaments()
    }
    closeEditModal()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    message.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    editPending.value = false
  }
}

async function cancelTournament(id: string) {
  await $fetch(`/api/club/tournaments/${id}`, { method: 'PATCH', body: { status: 'CANCELLED' } })
  message.value = t('dashboard.cancelled')
  if (expandedTournamentId.value === id) expandedTournamentId.value = ''
  await refreshTournaments()
}

async function toggleTournamentRegs(id: string) {
  if (expandedTournamentId.value === id) {
    expandedTournamentId.value = ''
    tournamentRegistrations.value = []
    return
  }
  expandedTournamentId.value = id
  tournamentRegsPending.value = true
  try {
    tournamentRegistrations.value = await $fetch(`/api/club/tournaments/${id}/registrations`)
  } finally {
    tournamentRegsPending.value = false
  }
}

const financeBreakdownSeries = computed(() => chartData.value?.breakdown?.map((b) => b.value) ?? [])

async function saveClubProfile() {
  if (!selectedClubId.value || !clubProfile.value.nameFa) return
  profilePending.value = true
  try {
    await $fetch('/api/club/profile', {
      method: 'PATCH',
      body: {
        clubId: selectedClubId.value,
        nameFa: clubProfile.value.nameFa,
        nameEn: clubProfile.value.nameEn,
        addressFa: clubProfile.value.addressFa,
        addressEn: clubProfile.value.addressEn,
        city: clubProfile.value.city,
        district: clubProfile.value.district || null,
        lat: Number.isFinite(clubProfile.value.lat) ? clubProfile.value.lat : null,
        lng: Number.isFinite(clubProfile.value.lng) ? clubProfile.value.lng : null,
        priceFrom: clubProfile.value.priceFrom,
        discount: clubProfile.value.discount,
        image: clubProfile.value.image || null,
      },
    })
    message.value = t('dashboard.clubProfileSaved')
    await refreshClubs()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    message.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    profilePending.value = false
  }
}

async function addAddon() {
  if (!selectedClubId.value || !newAddon.value.nameFa) return
  await $fetch('/api/club/addons', {
    method: 'POST',
    body: {
      clubId: selectedClubId.value,
      nameFa: newAddon.value.nameFa,
      nameEn: newAddon.value.nameEn || newAddon.value.nameFa,
      price: newAddon.value.price,
      courtId: newAddon.value.courtId || undefined,
      mode: newAddon.value.mode,
      stock: newAddon.value.stock,
      maxPerBooking: newAddon.value.maxPerBooking,
    },
  })
  newAddon.value = {
    nameFa: '',
    nameEn: '',
    price: 50_000,
    courtId: '',
    mode: 'RENTAL',
    stock: null,
    maxPerBooking: 4,
  }
  message.value = t('dashboard.addonCreated')
  await refreshAddons()
}

async function deleteAddon(id: string) {
  await $fetch(`/api/club/addons/${id}`, { method: 'DELETE' })
  message.value = t('common.save')
  await refreshAddons()
}

async function deleteCourt(id: string) {
  await $fetch(`/api/club/courts/${id}`, { method: 'DELETE' })
  message.value = t('common.save')
  await refreshClubs()
}

async function deleteActivity(id: string) {
  await $fetch(`/api/club/activities/${id}`, { method: 'DELETE' })
  message.value = t('common.save')
  await refreshActivities()
}

async function cancelClass(id: string) {
  await $fetch(`/api/club/classes/${id}`, { method: 'DELETE' })
  message.value = t('common.save')
  await refreshClasses()
}

async function confirmBookingPayment(id: string) {
  await $fetch(`/api/club/bookings/${id}`, { method: 'PATCH', body: { paymentStatus: 'PAID' } })
  message.value = t('dashboard.paymentConfirmed')
  await refreshBookings()
}

async function cancelClubBooking(id: string) {
  await $fetch(`/api/club/bookings/${id}`, { method: 'PATCH', body: { status: 'CANCELLED' } })
  message.value = t('dashboard.cancelled')
  await Promise.all([refreshBookings(), refreshSchedule()])
}

async function toggleSlotBlock(slotId: string, currentStatus?: string) {
  await $fetch(`/api/club/slots/${slotId}`, {
    method: 'PATCH',
    body: { status: currentStatus === 'BLOCKED' ? 'AVAILABLE' : 'BLOCKED' },
  })
  await refreshSchedule()
}

async function exportBookings() {
  if (!selectedClubId.value) return
  window.open(`/api/club/export?clubId=${selectedClubId.value}`, '_blank')
}

const slotPreviewCount = computed(() =>
  buildSlotTimes(slotDurationMinutes.value, slotOpenTime.value, slotCloseTime.value).length,
)

async function addCourt() {
  if (!selectedClubId.value || !newCourt.value.nameFa || !newCourt.value.sportId) return
  await $fetch('/api/club/courts', {
    method: 'POST',
    body: {
      clubId: selectedClubId.value,
      nameFa: newCourt.value.nameFa,
      nameEn: newCourt.value.nameEn || newCourt.value.nameFa,
      sportId: newCourt.value.sportId,
    },
  })
  newCourt.value = { nameFa: '', nameEn: '', sportId: '' }
  message.value = t('common.save')
  await refreshClubs()
}

async function addActivity() {
  if (!selectedClubId.value || !newActivity.value.titleFa) return
  await $fetch('/api/club/activities', { method: 'POST', body: { clubId: selectedClubId.value, ...newActivity.value } })
  newActivity.value = { titleFa: '', titleEn: '', descFa: '', date: localDateISO(), startTime: '18:00' }
  message.value = t('common.save')
  await refreshActivities()
}

async function addClass() {
  if (!selectedClubId.value || !newClass.value.titleFa || !newClass.value.sportId) return
  await $fetch('/api/club/classes', { method: 'POST', body: { clubId: selectedClubId.value, ...newClass.value } })
  newClass.value = {
    titleFa: '',
    titleEn: '',
    sportId: '',
    coachId: '',
    date: localDateISO(),
    startTime: '10:00',
    endTime: '11:30',
    price: 200000,
    maxSeats: 12,
    classType: 'GROUP',
    genderPolicy: 'MIXED',
    minLevel: 'BEGINNER',
    maxLevel: 'PRO',
  }
  message.value = t('classes.created')
  await Promise.all([refreshClasses(), refreshSchedule()])
}

async function addTournament() {
  if (!selectedClubId.value || !newTournament.value.titleFa || !newTournament.value.sportId) return
  await $fetch('/api/club/tournaments', { method: 'POST', body: { clubId: selectedClubId.value, ...newTournament.value } })
  newTournament.value = { titleFa: '', titleEn: '', sportId: '', date: localDateISO(), startTime: '10:00', maxParticipants: 32, price: 0 }
  message.value = t('tournaments.created')
  await refreshTournaments()
}

async function saveSlotSettings() {
  if (!selectedClubId.value) return
  slotSettingsPending.value = true
  try {
    await $fetch('/api/club/settings', {
      method: 'PATCH',
      body: {
        clubId: selectedClubId.value,
        slotDurationMinutes: slotDurationMinutes.value,
        slotOpenTime: slotOpenTime.value,
        slotCloseTime: slotCloseTime.value,
        cancellationPolicyFa: cancellationPolicyFa.value,
        cancellationPolicyEn: cancellationPolicyEn.value,
        cancellationHours: cancellationHours.value,
      },
    })
    message.value = t('dashboard.slotSettingsSaved')
    await refreshClubs()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    message.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    slotSettingsPending.value = false
  }
}

async function generateSlots() {
  if (!slotCourtId.value || !slotDate.value) return
  const res = await $fetch<{ created: number }>('/api/club/slots', {
    method: 'POST',
    body: {
      courtId: slotCourtId.value,
      date: slotDate.value,
      durationMinutes: slotDurationMinutes.value,
      price: slotPrice.value > 0 ? slotPrice.value : undefined,
    },
  })
  message.value = `${t('dashboard.generateSlots')}: ${formatNumber(res.created)}`
  await Promise.all([refreshBookings(), refreshSchedule()])
}

async function generateBulkSlots() {
  if (!slotCourtId.value || !bulkFromDate.value || !bulkToDate.value) return
  bulkPending.value = true
  try {
    const res = await $fetch<{ created: number; days: number }>('/api/club/slots/bulk', {
      method: 'POST',
      body: {
        courtId: slotCourtId.value,
        fromDate: bulkFromDate.value,
        toDate: bulkToDate.value,
        price: slotPrice.value > 0 ? slotPrice.value : undefined,
        durationMinutes: slotDurationMinutes.value,
      },
    })
    message.value = t('dashboard.bulkSlotsCreated', { count: formatNumber(res.created), days: formatNumber(res.days) })
    await Promise.all([refreshBookings(), refreshSchedule(), refreshStats()])
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    message.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    bulkPending.value = false
  }
}

function onClubScheduleManage(event: ScheduleEvent) {
  focusedScheduleEvent.value = event
  scheduleNoteDraft.value = event.note ?? ''
  clubBookError.value = ''
}

function clearScheduleSelection() {
  clubBookSlotIds.value = []
  selectedGridCells.value = []
  showBulkReservePanel.value = false
  showRecurringClassPanel.value = false
  clubBookGuestName.value = ''
  clubBookAthletePhone.value = ''
  clubBookCoachId.value = ''
  clubBookAthleteKnown.value = false
  clubBookError.value = ''
}

async function lookupClubAthleteByPhone() {
  const phone = clubBookAthletePhone.value.trim()
  if (phone.length < 8) {
    clubBookAthleteKnown.value = false
    return
  }
  try {
    const res = await $fetch<{ found: boolean; athlete?: { name: string } }>('/api/club/athletes', { query: { phone } })
    if (res.found && res.athlete) {
      clubBookGuestName.value = res.athlete.name
      clubBookAthleteKnown.value = true
    } else {
      clubBookAthleteKnown.value = false
    }
  } catch {
    clubBookAthleteKnown.value = false
  }
}

function selectedCourtIdsForClass(): string[] {
  const ids = new Set<string>()
  for (const cell of selectedGridCells.value) ids.add(cell.courtId)
  for (const slotId of clubBookSlotIds.value) {
    const event = scheduleEvents.value.find((e) => e.slotId === slotId)
    if (event?.courtId) ids.add(event.courtId)
  }
  return [...ids]
}

function onToggleScheduleSlot(event: ScheduleEvent) {
  if (!event.slotId) return
  const idx = clubBookSlotIds.value.indexOf(event.slotId)
  if (idx >= 0) clubBookSlotIds.value.splice(idx, 1)
  else clubBookSlotIds.value.push(event.slotId)
}

function onToggleGridCell(cell: GridCellSelection) {
  const idx = selectedGridCells.value.findIndex(
    (c) => c.courtId === cell.courtId && c.date === cell.date && c.startTime === cell.startTime,
  )
  if (idx >= 0) selectedGridCells.value.splice(idx, 1)
  else selectedGridCells.value.push(cell)

  recurringClassForm.value.daysOfWeek = weekdayCodeFromDate(cell.date)
  recurringClassForm.value.startTime = cell.startTime
  recurringClassForm.value.endTime = cell.endTime
}

function openBulkReservePanel() {
  showBulkReservePanel.value = true
  showRecurringClassPanel.value = false
  clubBookError.value = ''
}

function openRecurringClassPanel() {
  showRecurringClassPanel.value = true
  showBulkReservePanel.value = false
  recurringClassError.value = ''

  if (selectedGridCells.value.length || clubBookSlotIds.value.length) {
    const firstCell = selectedGridCells.value[0]
    const firstSlot = clubBookSlotIds.value[0]
      ? scheduleEvents.value.find((e) => e.slotId === clubBookSlotIds.value[0])
      : null

    if (firstCell) {
      recurringClassForm.value.daysOfWeek = weekdayCodeFromDate(firstCell.date)
      recurringClassForm.value.startTime = firstCell.startTime
      recurringClassForm.value.endTime = firstCell.endTime
    } else if (firstSlot) {
      recurringClassForm.value.daysOfWeek = weekdayCodeFromDate(firstSlot.date)
      recurringClassForm.value.startTime = firstSlot.startTime
      recurringClassForm.value.endTime = firstSlot.endTime
    }
  }
}

function closeScheduleFocus() {
  focusedScheduleEvent.value = null
  scheduleNoteDraft.value = ''
  clubBookError.value = ''
}

async function saveScheduleNote() {
  const event = focusedScheduleEvent.value
  if (!event) return
  const target = scheduleNoteTarget(event, 'club')
  if (!target) return
  scheduleNotePending.value = true
  try {
    await $fetch('/api/club/schedule-note', {
      method: 'PATCH',
      body: { ...target, note: scheduleNoteDraft.value },
    })
    message.value = t('schedule.noteSaved')
    await refreshSchedule()
    closeScheduleFocus()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    message.value = err?.data?.message || err?.statusMessage || t('common.error')
  } finally {
    scheduleNotePending.value = false
  }
}

async function unblockFocusedSlot() {
  const slotId = focusedScheduleEvent.value?.slotId
  if (!slotId) return
  await toggleSlotBlock(slotId, 'BLOCKED')
  closeScheduleFocus()
}

async function blockSelectedSlot() {
  const slotId = focusedScheduleEvent.value?.slotId
  if (!slotId) return
  await toggleSlotBlock(slotId, 'AVAILABLE')
  closeScheduleFocus()
}

async function confirmClubBooking() {
  clubBookError.value = ''
  const slotId = focusedScheduleEvent.value?.slotId
  if (!slotId) return
  if (!clubBookGuestName.value.trim() || !clubBookAthletePhone.value.trim()) {
    clubBookError.value = t('dashboard.clubBookNameRequired')
    return
  }
  clubBookPending.value = true
  try {
    await $fetch('/api/club/bookings', {
      method: 'POST',
      body: {
        slotId,
        coachId: clubBookCoachId.value || undefined,
        athleteName: clubBookGuestName.value.trim(),
        athletePhone: clubBookAthletePhone.value.trim(),
      },
    })
    closeScheduleFocus()
    message.value = t('dashboard.clubBookSuccess')
    await Promise.all([refreshBookings(), refreshSchedule(), refreshStats()])
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    clubBookError.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    clubBookPending.value = false
  }
}

async function confirmBulkClubBooking() {
  clubBookError.value = ''
  if (!totalScheduleSelection.value) return
  if (!clubBookGuestName.value.trim() || !clubBookAthletePhone.value.trim()) {
    clubBookError.value = t('dashboard.clubBookNameRequired')
    return
  }
  clubBookPending.value = true
  try {
    const res = await $fetch<{ count: number }>('/api/club/bookings/bulk', {
      method: 'POST',
      body: {
        slotIds: clubBookSlotIds.value,
        reservations: selectedGridCells.value.map((c) => ({
          courtId: c.courtId,
          date: c.date,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
        coachId: clubBookCoachId.value || undefined,
        athleteName: clubBookGuestName.value.trim(),
        athletePhone: clubBookAthletePhone.value.trim(),
      },
    })
    clearScheduleSelection()
    message.value = t('dashboard.bulkBookSuccess', { count: formatNumber(res.count) })
    await Promise.all([refreshBookings(), refreshSchedule(), refreshStats()])
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    clubBookError.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    clubBookPending.value = false
  }
}

async function confirmRecurringClasses() {
  recurringClassError.value = ''
  if (!selectedClubId.value) return
  const form = recurringClassForm.value
  if (!form.titleFa || !form.sportId) {
    recurringClassError.value = t('dashboard.recurringClassRequired')
    return
  }
  recurringClassPending.value = true
  try {
    const courtIds = selectedCourtIdsForClass()
    const res = await $fetch<{ created: number; skipped: number }>('/api/club/classes/bulk', {
      method: 'POST',
      body: { clubId: selectedClubId.value, ...form, courtIds: courtIds.length ? courtIds : undefined },
    })
    clearScheduleSelection()
    showRecurringClassPanel.value = false
    recurringClassForm.value = defaultRecurringClassForm()
    message.value = t('dashboard.recurringClassSuccess', {
      created: formatNumber(res.created),
      skipped: formatNumber(res.skipped),
    })
    await Promise.all([refreshClasses(), refreshSchedule(), refreshStats()])
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    recurringClassError.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    recurringClassPending.value = false
  }
}
</script>

<template>
  <div class="page-enter">
    <DashboardPageHeader :title="t('dashboard.clubAdmin')" :subtitle="t('dashboard.welcomeUser', { name: displayName })" />
    <p v-if="message" class="mb-4 text-sm text-fd-success">{{ message }}</p>

    <p v-if="clubsPending" class="text-sm text-fd-muted">{{ t('common.loading') }}</p>
    <div v-else-if="!clubs?.length" class="fd-card mb-6 p-4">
      <p class="text-sm text-fd-muted">{{ t('dashboard.noOwnedClubs') }}</p>
      <NuxtLink :to="localePath('/login')" class="fd-btn-primary mt-3 inline-flex">{{ t('dashboard.relogin') }}</NuxtLink>
    </div>

    <div v-if="clubs?.length" class="mb-4">
      <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('search.club') }}</label>
      <select v-model="selectedClubId" class="fd-input max-w-md">
        <option v-for="c in clubs" :key="c.id" :value="c.id">{{ pickName(c) }}</option>
      </select>
    </div>

    <template v-if="tab === 'overview'">
      <DashboardMetricsStrip
        :title="t('dashboard.revenueSummary')"
        :subtitle="t('dashboard.totalRevenue') + ': ' + formatPrice(stats?.totalRevenue ?? 0)"
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
            :title="t('dashboard.revenueTrend')"
            :subtitle="t('dashboard.last7Days')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="area"
              :series="revenueSeries"
              :options="areaOptions(dayLabels, [colors.primary])"
              :height="260"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-4">
          <DashboardQuickActions :actions="quickActions" compact />
        </div>
        <div class="lg:col-span-6">
          <DashboardChartCard
            :title="t('dashboard.weeklyBookings')"
            :subtitle="t('dashboard.byDayOfWeek')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="bar"
              :series="bookingSeries"
              :options="barOptions(dowLabels, [colors.primary, colors.success])"
              :height="240"
            />
          </DashboardChartCard>
        </div>
        <div class="lg:col-span-6">
          <DashboardChartCard
            :title="t('dashboard.bookingTrend')"
            :subtitle="t('dashboard.last7Days')"
            :loading="chartsPending"
            :error="!!chartsError"
            @retry="refreshCharts()"
          >
            <DashboardApexChart
              type="line"
              :series="[{ name: t('dashboard.myBookings'), data: chartData?.bookingTrend ?? [] }]"
              :options="lineOptions(dayLabels, [colors.orange])"
              :height="240"
            />
          </DashboardChartCard>
        </div>
      </div>

      <DashboardStatGrid :items="[
        { label: t('dashboard.walletBalance'), value: formatPrice(stats?.walletBalance ?? 0), tone: 'teal', icon: 'wallet' },
        { label: t('classes.title'), value: formatNumber(stats?.classEnrollments ?? 0), tone: 'blue', icon: 'users' },
        { label: t('dashboard.manageCourts'), value: formatNumber(stats?.courts ?? 0), tone: 'green', icon: 'building' },
        { label: t('dashboard.allClubs'), value: formatNumber(stats?.clubs ?? 0), tone: 'purple', icon: 'grid' },
      ]" />
    </template>

    <WalletPanel v-else-if="tab === 'wallet'" kind="club" can-payout variant="fd" />

    <template v-else-if="tab === 'finance'">
      <DashboardChartCard :title="t('dashboard.revenueBreakdown')" :subtitle="t('dashboard.last7Days')">
        <DashboardApexChart
          type="donut"
          :series="financeBreakdownSeries"
          :options="donutOptions(financeBreakdownLabels, [colors.primary, colors.success])"
          :height="280"
        />
      </DashboardChartCard>
      <button type="button" class="fd-btn-secondary mt-4" @click="exportBookings">{{ t('dashboard.exportBookings') }}</button>
    </template>

    <template v-else-if="tab === 'schedule'">
      <div class="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button type="button" class="fd-btn-secondary text-xs" @click="openRecurringClassPanel">
          {{ t('dashboard.scheduleRecurringClass') }}
        </button>
      </div>

      <ScheduleCalendar
        variant="dashboard"
        manage-notes
        multi-select
        show-empty-grid
        :events="scheduleEvents"
        :courts="scheduleCourts"
        :grid-settings="scheduleGridSettings"
        :loading="schedulePending"
        :selected-slot-ids="clubBookSlotIds"
        :selected-grid-cells="selectedGridCells"
        @range-change="onScheduleRange"
        @manage-event="onClubScheduleManage"
        @toggle-slot="onToggleScheduleSlot"
        @toggle-grid-cell="onToggleGridCell"
      />

      <div
        v-if="totalScheduleSelection || showRecurringClassPanel"
        class="fd-panel sticky bottom-4 z-20 mt-4 border border-fd-primary/15 p-4 shadow-fd"
      >
        <div v-if="totalScheduleSelection" class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm font-bold text-fd-navy">
            {{ t('schedule.selectedCount', { count: formatNumber(totalScheduleSelection) }) }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="fd-btn-ghost text-xs" @click="clearScheduleSelection">
              {{ t('schedule.clearSelection') }}
            </button>
            <button type="button" class="fd-btn-secondary text-xs" @click="openBulkReservePanel">
              {{ t('dashboard.reserveSelected') }}
            </button>
            <button type="button" class="fd-btn-primary text-xs" @click="openRecurringClassPanel">
              {{ t('dashboard.scheduleRecurringClass') }}
            </button>
          </div>
        </div>

        <div v-if="showBulkReservePanel" class="mt-4 border-t border-fd-primary/10 pt-4">
          <h3 class="mb-3 text-sm font-bold text-fd-navy">{{ t('dashboard.reserveSelected') }}</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.clubBookGuestName') }}</label>
              <input v-model="clubBookGuestName" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.clubBookPhone') }}</label>
              <input
                v-model="clubBookAthletePhone"
                type="tel"
                class="fd-input"
                inputmode="tel"
                dir="ltr"
                @blur="lookupClubAthleteByPhone"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.clubBookCoach') }}</label>
              <select v-model="clubBookCoachId" class="fd-input">
                <option value="">{{ t('dashboard.clubBookNoCoach') }}</option>
                <option v-for="c in coaches" :key="c.id" :value="c.id">{{ pickName(c) }}</option>
              </select>
            </div>
          </div>
          <p v-if="clubBookAthleteKnown" class="mt-2 text-sm text-fd-success">{{ t('dashboard.clubBookAthleteFound') }}</p>
          <p class="mt-2 text-sm text-fd-muted">{{ t('dashboard.clubBookHint') }}</p>
          <p v-if="clubBookError" class="mt-2 text-sm text-fd-danger">{{ clubBookError }}</p>
          <button
            type="button"
            class="fd-btn-primary mt-4"
            :disabled="clubBookPending"
            @click="confirmBulkClubBooking"
          >
            {{ t('dashboard.clubBookConfirm') }}
          </button>
        </div>

        <div v-if="showRecurringClassPanel" class="mt-4" :class="totalScheduleSelection ? 'border-t border-fd-primary/10 pt-4' : ''">
          <h3 class="mb-1 text-sm font-bold text-fd-navy">{{ t('dashboard.scheduleRecurringClass') }}</h3>
          <p class="mb-3 text-xs text-fd-muted">{{ t('dashboard.recurringClassHint') }}</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.titleField') }}</label>
              <input v-model="recurringClassForm.titleFa" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('search.sport') }}</label>
              <select v-model="recurringClassForm.sportId" class="fd-input">
                <option value="">{{ t('search.sport') }}</option>
                <option v-for="s in sports" :key="s.id" :value="s.id">{{ pickName(s) }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('coaches.title') }}</label>
              <select v-model="recurringClassForm.coachId" class="fd-input">
                <option value="">{{ t('coaches.title') }}</option>
                <option v-for="c in coaches" :key="c.id" :value="c.id">{{ pickName(c) }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.fromDate') }}</label>
              <input v-model="recurringClassForm.fromDate" type="date" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.toDate') }}</label>
              <input v-model="recurringClassForm.toDate" type="date" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('schedule.start') }}</label>
              <input v-model="recurringClassForm.startTime" type="time" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('schedule.end') }}</label>
              <input v-model="recurringClassForm.endTime" type="time" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.price') }}</label>
              <input v-model.number="recurringClassForm.price" type="number" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.seats') }}</label>
              <input v-model.number="recurringClassForm.maxSeats" type="number" class="fd-input" />
            </div>
          </div>
          <div class="mt-3">
            <p class="mb-2 text-xs font-semibold text-fd-muted">{{ t('packages.daysOfWeek') }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in weekdayOptions"
                :key="opt.value"
                type="button"
                class="sz-chip tap-highlight"
                :class="daySelected(recurringClassForm.daysOfWeek, opt.value) ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
                @click="recurringClassForm.daysOfWeek = toggleDay(recurringClassForm.daysOfWeek, opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <p v-if="recurringClassError" class="mt-2 text-sm text-fd-danger">{{ recurringClassError }}</p>
          <button
            type="button"
            class="fd-btn-primary mt-4"
            :disabled="recurringClassPending"
            @click="confirmRecurringClasses"
          >
            {{ t('dashboard.createRecurringClasses') }}
          </button>
        </div>
      </div>

      <ScheduleEventNoteDialog
        v-if="focusedScheduleEvent"
        :event="focusedScheduleEvent"
        v-model="scheduleNoteDraft"
        :saving="scheduleNotePending"
        @save="saveScheduleNote"
        @close="closeScheduleFocus"
      >
        <div
          v-if="focusedScheduleEvent.type === 'slot' && focusedScheduleEvent.status === 'AVAILABLE'"
          class="mt-6 border-t border-fd-primary/10 pt-5"
        >
          <h3 class="mb-3 text-sm font-bold text-fd-navy">{{ t('dashboard.clubBookTitle') }}</h3>
          <div class="grid gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.clubBookGuestName') }}</label>
              <input v-model="clubBookGuestName" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.clubBookPhone') }}</label>
              <input
                v-model="clubBookAthletePhone"
                type="tel"
                class="fd-input"
                inputmode="tel"
                dir="ltr"
                @blur="lookupClubAthleteByPhone"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.clubBookCoach') }}</label>
              <select v-model="clubBookCoachId" class="fd-input">
                <option value="">{{ t('dashboard.clubBookNoCoach') }}</option>
                <option v-for="c in coaches" :key="c.id" :value="c.id">{{ pickName(c) }}</option>
              </select>
            </div>
          </div>
          <p v-if="clubBookAthleteKnown" class="mt-2 text-sm text-fd-success">{{ t('dashboard.clubBookAthleteFound') }}</p>
          <p class="mt-2 text-sm text-fd-muted">{{ t('dashboard.clubBookHint') }}</p>
          <p v-if="clubBookError" class="mt-2 text-sm text-fd-danger">{{ clubBookError }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" class="fd-btn-secondary flex-1" :disabled="clubBookPending" @click="confirmClubBooking">
              {{ t('dashboard.clubBookConfirm') }}
            </button>
            <button type="button" class="fd-btn-ghost" @click="blockSelectedSlot">{{ t('dashboard.blockSlot') }}</button>
          </div>
        </div>
        <div
          v-else-if="focusedScheduleEvent.type === 'slot' && focusedScheduleEvent.status === 'BLOCKED'"
          class="mt-6 border-t border-fd-primary/10 pt-5"
        >
          <button type="button" class="fd-btn-secondary w-full" @click="unblockFocusedSlot">
            {{ t('schedule.unblockSlot') }}
          </button>
        </div>
      </ScheduleEventNoteDialog>
    </template>

    <template v-else-if="tab === 'manage' && selectedClub">
      <section class="mb-10">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 class="fd-section-title">{{ t('dashboard.clubProfile') }}</h2>
          <NuxtLink
            :to="localePath(`/clubs/${selectedClub.slug}`)"
            class="text-xs font-semibold text-fd-primary hover:underline"
            target="_blank"
          >
            {{ t('dashboard.viewPublicPage') }}
          </NuxtLink>
        </div>
        <div class="fd-panel grid gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.clubName') }} (FA)</label>
            <input v-model="clubProfile.nameFa" class="fd-input" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.clubName') }} (EN)</label>
            <input v-model="clubProfile.nameEn" class="fd-input" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.address') }} (FA)</label>
            <input v-model="clubProfile.addressFa" class="fd-input" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.address') }} (EN)</label>
            <input v-model="clubProfile.addressEn" class="fd-input" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('search.city') }}</label>
            <select v-model="clubProfile.city" class="fd-input">
              <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.district') }}</label>
            <input v-model="clubProfile.district" class="fd-input" :placeholder="t('dashboard.district')" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.priceFrom') }}</label>
            <input v-model.number="clubProfile.priceFrom" type="number" class="fd-input" min="0" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.discountPercent') }}</label>
            <input v-model.number="clubProfile.discount" type="number" class="fd-input" min="0" max="100" :placeholder="t('dashboard.optional')" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.latitude') }}</label>
            <input v-model.number="clubProfile.lat" type="number" step="any" class="fd-input" :placeholder="t('dashboard.optional')" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.longitude') }}</label>
            <input v-model.number="clubProfile.lng" type="number" step="any" class="fd-input" :placeholder="t('dashboard.optional')" />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.coverImageUrl') }}</label>
            <input v-model="clubProfile.image" type="url" class="fd-input" :placeholder="t('dashboard.coverImageUrl')" />
          </div>
          <button type="button" class="fd-btn-primary sm:col-span-2" :disabled="profilePending" @click="saveClubProfile">
            {{ t('dashboard.saveClubProfile') }}
          </button>
        </div>
      </section>

      <section class="mb-10">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 class="fd-section-title">{{ t('dashboard.manageCourts') }}</h2>
          <span
            v-if="selectedClub.courts?.length"
            class="rounded-full bg-[#F5F5F4] px-3 py-1 text-xs font-bold text-fd-muted"
          >
            {{ formatNumber(selectedClub.courts.length) }} {{ t('dashboard.court') }}
          </span>
        </div>

        <div v-if="selectedClub.courts?.length" class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="court in selectedClub.courts"
            :key="court.id"
            class="fd-card p-4"
            :class="editingCourtId === court.id ? 'ring-2 ring-fd-primary/30' : ''"
          >
            <template v-if="editingCourtId === court.id">
              <div class="grid gap-3">
                <input v-model="editCourt.nameFa" class="fd-input" :placeholder="t('dashboard.court') + ' (FA)'" />
                <input v-model="editCourt.nameEn" class="fd-input" placeholder="Court (EN)" />
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="s in sports"
                    :key="s.id"
                    type="button"
                    class="sz-chip tap-highlight"
                    :class="editCourt.sportId === s.id ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
                    @click="editCourt.sportId = s.id"
                  >
                    <SportIcon :slug="s.slug" size="sm" />
                    {{ pickName(s) }}
                  </button>
                </div>
                <label class="flex items-center gap-2 text-sm text-fd-navy">
                  <input v-model="editCourt.indoor" type="checkbox" class="rounded" />
                  {{ t('search.indoor') }}
                </label>
                <select v-model="editCourt.genderPolicy" class="fd-input">
                  <option v-for="opt in genderPolicyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <div class="flex gap-2">
                  <button type="button" class="fd-btn-primary flex-1" :disabled="editPending" @click="saveCourt">{{ t('common.save') }}</button>
                  <button type="button" class="fd-btn-ghost" @click="cancelEditCourt">{{ t('common.cancel') }}</button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fd-primary/10 text-fd-primary">
                  <SportIcon v-if="court.sport" :slug="court.sport.slug" size="sm" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-bold text-fd-navy">{{ pickName(court) }}</p>
                  <p v-if="court.sport" class="truncate text-xs text-fd-muted">
                    {{ pickName(court.sport) }}
                    <span v-if="court.indoor"> · {{ t('search.indoor') }}</span>
                  </p>
                </div>
                <div class="flex shrink-0 flex-col gap-1">
                  <button type="button" class="text-xs font-semibold text-fd-primary" @click="startEditCourt(court)">{{ t('common.edit') }}</button>
                  <button type="button" class="text-xs font-semibold text-fd-danger" @click="deleteCourt(court.id)">{{ t('common.delete') }}</button>
                </div>
              </div>
            </template>
          </div>
        </div>
        <p v-else class="mb-6 rounded-[1.25rem] border border-dashed border-fd-primary/10 bg-[#F5F5F4]/50 px-4 py-6 text-center text-sm text-fd-muted">
          {{ t('dashboard.noCourtsYet') }}
        </p>

        <div class="fd-panel border-2 border-dashed border-fd-primary/10">
          <h3 class="mb-1 text-sm font-bold text-fd-navy">{{ t('dashboard.addNewCourt') }}</h3>
          <p class="mb-4 text-xs text-fd-muted">{{ t('dashboard.addNewCourtHint') }}</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.court') }} (FA)</label>
              <input v-model="newCourt.nameFa" class="fd-input" :placeholder="t('dashboard.court') + ' (FA)'" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">Court (EN)</label>
              <input v-model="newCourt.nameEn" class="fd-input" placeholder="Court (EN)" />
            </div>
            <div class="sm:col-span-2">
              <p class="mb-2 text-xs font-semibold text-fd-muted">{{ t('search.sport') }}</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="s in sports"
                  :key="s.id"
                  type="button"
                  class="sz-chip tap-highlight"
                  :class="newCourt.sportId === s.id ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
                  @click="newCourt.sportId = s.id"
                >
                  <span class="inline-flex items-center gap-1.5">
                    <SportIcon :slug="s.slug" size="sm" />
                    {{ pickName(s) }}
                  </span>
                </button>
              </div>
            </div>
            <button type="button" class="fd-btn-primary sm:col-span-2" @click="addCourt">{{ t('dashboard.addCourt') }}</button>
          </div>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="fd-section-title mb-4">{{ t('dashboard.manageSlots') }}</h2>
        <div class="fd-panel space-y-4">
          <div>
            <p class="mb-2 text-sm font-semibold text-fd-muted">{{ t('dashboard.slotDuration') }}</p>
            <p class="mb-3 text-xs text-fd-muted">{{ t('dashboard.slotDurationHint') }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="mins in SLOT_DURATION_OPTIONS"
                :key="mins"
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-bold transition tap-highlight"
                :class="slotDurationMinutes === mins ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy'"
                @click="slotDurationMinutes = mins"
              >
                {{ durationLabel(mins) }}
              </button>
            </div>
            <p class="mt-3 text-xs font-semibold text-fd-primary">
              {{ t('dashboard.slotsPerDay', { count: formatNumber(slotPreviewCount) }) }}
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.slotOpenTime') }}</label>
              <input v-model="slotOpenTime" type="time" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.slotCloseTime') }}</label>
              <input v-model="slotCloseTime" type="time" class="fd-input" />
            </div>
          </div>
          <button type="button" class="fd-btn-secondary" :disabled="slotSettingsPending" @click="saveSlotSettings">
            {{ t('dashboard.saveSlotSettings') }}
          </button>
          <div class="grid gap-3 sm:grid-cols-2">
            <textarea v-model="cancellationPolicyFa" class="fd-input min-h-16" :placeholder="t('dashboard.cancellationPolicy') + ' (FA)'" />
            <textarea v-model="cancellationPolicyEn" class="fd-input min-h-16" :placeholder="t('dashboard.cancellationPolicy') + ' (EN)'" />
            <input v-model.number="cancellationHours" type="number" class="fd-input sm:col-span-2" :placeholder="t('dashboard.cancellationHours')" />
          </div>
          <div class="border-t border-fd-primary/5 pt-4">
            <p class="mb-3 text-sm font-semibold text-fd-navy">{{ t('dashboard.generateSlots') }}</p>
            <div class="flex flex-wrap gap-3">
              <select v-model="slotCourtId" class="fd-input min-w-[10rem] flex-1">
                <option v-for="court in selectedClub.courts" :key="court.id" :value="court.id">{{ pickName(court) }}</option>
              </select>
              <input v-model="slotDate" type="date" class="fd-input w-40" />
              <input v-model.number="slotPrice" type="number" class="fd-input w-36" min="0" :placeholder="t('dashboard.slotPrice')" />
              <button type="button" class="fd-btn-primary" @click="generateSlots">{{ t('dashboard.generateSlots') }}</button>
            </div>
          </div>
          <div class="border-t border-fd-primary/5 pt-4">
            <p class="mb-1 text-sm font-semibold text-fd-navy">{{ t('dashboard.bulkGenerateSlots') }}</p>
            <p class="mb-3 text-xs text-fd-muted">{{ t('dashboard.bulkGenerateHint') }}</p>
            <div class="flex flex-wrap gap-3">
              <select v-model="slotCourtId" class="fd-input min-w-[10rem] flex-1">
                <option v-for="court in selectedClub.courts" :key="court.id" :value="court.id">{{ pickName(court) }}</option>
              </select>
              <input v-model="bulkFromDate" type="date" class="fd-input w-40" />
              <input v-model="bulkToDate" type="date" class="fd-input w-40" />
              <button type="button" class="fd-btn-secondary" :disabled="bulkPending" @click="generateBulkSlots">
                {{ t('dashboard.bulkGenerateSlots') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="fd-section-title mb-4">{{ t('equipment.manage') }}</h2>
        <div v-if="addons?.length" class="mb-4 space-y-2">
          <div v-for="a in addons" :key="a.id" class="fd-card flex items-start justify-between gap-2 p-4">
            <div>
              <p class="font-semibold text-fd-navy">{{ localized(a.nameFa, a.nameEn) }}</p>
              <p class="text-sm text-fd-muted">
                <span v-if="(a.mode ?? (a.price > 0 ? 'RENTAL' : 'PROVIDED')) === 'PROVIDED'">{{ t('equipment.provided') }}</span>
                <span v-else>{{ formatPrice(a.price) }} {{ t('clubs.currency') }}</span>
                <span v-if="a.court"> · {{ pickName(a.court) }}</span>
                <span v-else> · {{ t('dashboard.allCourts') }}</span>
              </p>
            </div>
            <button type="button" class="text-xs font-semibold text-fd-danger" @click="deleteAddon(a.id)">{{ t('common.delete') }}</button>
          </div>
        </div>
        <p v-else class="mb-4 rounded-[1.25rem] border border-dashed border-fd-primary/10 bg-[#F5F5F4]/50 px-4 py-6 text-center text-sm text-fd-muted">
          {{ t('equipment.noEquipmentYet') }}
        </p>
        <div class="fd-panel grid gap-3 sm:grid-cols-2">
          <input v-model="newAddon.nameFa" class="fd-input sm:col-span-2" :placeholder="t('equipment.equipmentName') + ' (FA)'" />
          <input v-model="newAddon.nameEn" class="fd-input sm:col-span-2" placeholder="Equipment name (EN)" />
          <select v-model="newAddon.mode" class="fd-input">
            <option value="PROVIDED">{{ t('equipment.modeProvided') }}</option>
            <option value="RENTAL">{{ t('equipment.modeRental') }}</option>
          </select>
          <input
            v-model.number="newAddon.price"
            type="number"
            class="fd-input"
            min="0"
            :placeholder="t('dashboard.price')"
            :disabled="newAddon.mode === 'PROVIDED'"
          />
          <input
            v-model.number="newAddon.stock"
            type="number"
            class="fd-input"
            min="0"
            :placeholder="t('equipment.stock')"
          />
          <input
            v-model.number="newAddon.maxPerBooking"
            type="number"
            class="fd-input"
            min="1"
            :placeholder="t('equipment.maxPerBooking')"
          />
          <select v-model="newAddon.courtId" class="fd-input sm:col-span-2">
            <option value="">{{ t('dashboard.allCourts') }}</option>
            <option v-for="court in selectedClub.courts" :key="court.id" :value="court.id">{{ pickName(court) }}</option>
          </select>
          <button type="button" class="fd-btn-primary sm:col-span-2" @click="addAddon">{{ t('equipment.addEquipment') }}</button>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="fd-section-title mb-4">{{ t('activities.title') }}</h2>
        <div v-if="activities?.length" class="mb-4 space-y-2">
          <div v-for="a in activities" :key="a.id" class="fd-card flex items-start justify-between gap-2 p-4">
            <div>
              <p class="font-semibold text-fd-navy">{{ localized(a.titleFa, a.titleEn) }}</p>
              <p class="text-sm text-fd-muted">{{ formatDate(a.date) }} · {{ formatTime(a.startTime) }}</p>
            </div>
            <div class="flex shrink-0 flex-col gap-1">
              <button type="button" class="text-xs font-semibold text-fd-primary" @click="openEditActivity(a)">{{ t('common.edit') }}</button>
              <button type="button" class="text-xs font-semibold text-fd-danger" @click="deleteActivity(a.id)">{{ t('common.delete') }}</button>
            </div>
          </div>
        </div>
        <div class="fd-panel grid gap-3 sm:grid-cols-2">
          <input v-model="newActivity.titleFa" class="fd-input sm:col-span-2" :placeholder="t('activities.titleField')" />
          <input v-model="newActivity.descFa" class="fd-input sm:col-span-2" :placeholder="t('activities.descField')" />
          <input v-model="newActivity.date" type="date" class="fd-input" />
          <input v-model="newActivity.startTime" type="time" class="fd-input" />
          <button type="button" class="fd-btn-primary sm:col-span-2" @click="addActivity">{{ t('activities.create') }}</button>
        </div>
      </section>

      <section>
        <h2 class="fd-section-title mb-4">{{ t('classes.manage') }}</h2>
        <div v-if="classSessions?.length" class="mb-6 space-y-3">
          <div v-for="cls in classSessions" :key="cls.id" class="fd-card p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <p class="font-semibold text-fd-navy">{{ localized(cls.titleFa, cls.titleEn) }}</p>
              <div class="flex gap-2">
                <button type="button" class="text-xs font-semibold text-fd-primary" @click="openEditClass(cls)">{{ t('common.edit') }}</button>
                <button type="button" class="text-xs font-semibold text-fd-danger" @click="cancelClass(cls.id)">{{ t('dashboard.cancel') }}</button>
              </div>
            </div>
            <p class="text-sm text-fd-muted">{{ formatDate(cls.date) }} · {{ formatTimeRange(cls.startTime, cls.endTime) }}</p>
            <p class="text-sm text-fd-muted">
              {{ classTypeLabel(cls.classType ?? 'GROUP') }} · {{ classGroupLabel(cls) }}
            </p>
            <p class="text-sm text-fd-muted">{{ formatNumber(cls.enrollments?.length ?? 0) }} / {{ formatNumber(cls.maxSeats) }} {{ t('classes.enrolled') }}</p>
            <div v-if="cls.enrollments?.length" class="mt-2 space-y-1">
              <p v-for="e in cls.enrollments" :key="e.id" class="text-xs text-fd-navy">{{ e.user?.name ?? e.user?.email }}</p>
            </div>
          </div>
        </div>
        <div class="fd-panel grid gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.titleField') }}</label>
            <input v-model="newClass.titleFa" class="fd-input" />
          </div>
          <div class="sm:col-span-2">
            <p class="mb-2 text-sm text-fd-muted">{{ t('search.sport') }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in sports"
                :key="s.id"
                type="button"
                class="sz-chip tap-highlight"
                :class="newClass.sportId === s.id ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
                @click="newClass.sportId = s.id"
              >
                <span class="inline-flex items-center gap-1.5">
                  <SportIcon :slug="s.slug" size="sm" />
                  {{ pickName(s) }}
                </span>
              </button>
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.date') }}</label>
            <input v-model="newClass.date" type="date" class="fd-input" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('schedule.start') }}</label>
            <input v-model="newClass.startTime" type="time" class="fd-input" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('schedule.end') }}</label>
            <input v-model="newClass.endTime" type="time" class="fd-input" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.price') }}</label>
            <input v-model.number="newClass.price" type="number" class="fd-input" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.filterType') }}</label>
            <select v-model="newClass.classType" class="fd-input" @change="onClassTypeChange(newClass)">
              <option value="GROUP">{{ t('classes.group') }}</option>
              <option value="SEMI_PRIVATE">{{ t('classes.semiPrivate') }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.seats') }}</label>
            <input
              v-model.number="newClass.maxSeats"
              type="number"
              class="fd-input"
              :min="newClass.classType === 'SEMI_PRIVATE' ? 2 : 5"
              :max="newClass.classType === 'SEMI_PRIVATE' ? 4 : 50"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.filterGender') }}</label>
            <select v-model="newClass.genderPolicy" class="fd-input">
              <option v-for="opt in genderPolicyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.minLevel') }}</label>
            <select v-model="newClass.minLevel" class="fd-input">
              <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.maxLevel') }}</label>
            <select v-model="newClass.maxLevel" class="fd-input">
              <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
            </select>
          </div>
          <div class="sm:col-span-2 flex flex-wrap gap-2">
            <button type="button" class="fd-btn-ghost text-xs" @click="applyClassTierPreset(newClass, 'MEN', 'beginner')">{{ t('dashboard.genderMen') }} · {{ t('classes.tierBeginner') }}</button>
            <button type="button" class="fd-btn-ghost text-xs" @click="applyClassTierPreset(newClass, 'MEN', 'advanced')">{{ t('dashboard.genderMen') }} · {{ t('classes.tierAdvanced') }}</button>
            <button type="button" class="fd-btn-ghost text-xs" @click="applyClassTierPreset(newClass, 'WOMEN', 'beginner')">{{ t('dashboard.genderWomen') }} · {{ t('classes.tierBeginner') }}</button>
            <button type="button" class="fd-btn-ghost text-xs" @click="applyClassTierPreset(newClass, 'WOMEN', 'advanced')">{{ t('dashboard.genderWomen') }} · {{ t('classes.tierAdvanced') }}</button>
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('coaches.title') }}</label>
            <select v-model="newClass.coachId" class="fd-input">
              <option value="">{{ t('coaches.title') }}</option>
              <option v-for="c in coaches" :key="c.id" :value="c.id">{{ pickName(c) }}</option>
            </select>
          </div>
          <button type="button" class="fd-btn-primary sm:col-span-2" @click="addClass">{{ t('classes.create') }}</button>
        </div>
      </section>

      <PackageManagerPanel
        mode="club"
        :club-id="selectedClubId"
        :packages="clubPackages"
        :sports="sports"
        :coaches="coaches"
        @refresh="refreshPackages"
      />
    </template>

    <template v-else-if="tab === 'reviews' && selectedClub">
      <h2 class="fd-section-title mb-1">{{ t('dashboard.reviewsInbox') }}</h2>
      <p class="mb-4 text-sm text-fd-muted">{{ t('dashboard.reviewsInboxHint') }}</p>
      <div v-if="clubReviews?.length" class="space-y-3">
        <div v-for="r in clubReviews" :key="r.id" class="fd-card p-4">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div class="flex gap-0.5 text-amber-400">
              <span v-for="i in r.rating" :key="i">★</span>
            </div>
            <span class="text-xs text-fd-muted">{{ formatDate(r.createdAt.slice(0, 10)) }}</span>
          </div>
          <p class="text-sm leading-relaxed text-fd-navy">"{{ localized(r.bodyFa, r.bodyEn) }}"</p>
          <p class="mt-2 text-xs font-semibold text-fd-muted">{{ reviewerLabel(r.user) }}</p>
          <div v-if="r.replyFa" class="mt-3 rounded-xl bg-fd-primary/5 px-3 py-2">
            <p class="text-xs font-semibold text-fd-primary">{{ t('dashboard.clubReply') }}</p>
            <p class="mt-1 text-sm text-fd-navy">{{ localized(r.replyFa, r.replyEn) }}</p>
          </div>
          <div v-if="replyingReviewId === r.id" class="mt-3 space-y-2">
            <textarea v-model="replyText" class="fd-input min-h-20" :placeholder="t('dashboard.replyPlaceholder')" />
            <div class="flex gap-2">
              <button type="button" class="fd-btn-primary text-sm" :disabled="replyPending" @click="saveReviewReply(r.id)">
                {{ t('dashboard.saveReply') }}
              </button>
              <button type="button" class="fd-btn-ghost text-sm" @click="cancelReply">{{ t('common.cancel') }}</button>
            </div>
          </div>
          <button
            v-else-if="!r.replyFa"
            type="button"
            class="mt-3 text-sm font-semibold text-fd-primary"
            @click="startReply(r)"
          >
            {{ t('dashboard.replyToReview') }}
          </button>
          <button
            v-else
            type="button"
            class="mt-3 text-sm font-semibold text-fd-muted"
            @click="startReply(r)"
          >
            {{ t('dashboard.editReply') }}
          </button>
        </div>
      </div>
      <SzEmptyState v-else :message="t('reviews.empty')" />
    </template>

    <template v-else-if="tab === 'bookings'">
      <h2 class="fd-section-title mb-4">{{ t('dashboard.incomingBookings') }}</h2>
      <div v-if="bookings?.length" class="space-y-3">
        <div v-for="b in bookings" :key="b.id" class="fd-card p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="font-semibold text-fd-navy">{{ b.user?.name ?? b.guestName ?? t('dashboard.walkInGuest') }}</p>
            <SzBadge :tone="b.source === 'CLUB' ? 'blue' : 'orange'" class="text-xs">
              {{ b.source === 'CLUB' ? t('schedule.clubBooking') : t('schedule.platformBooking') }}
            </SzBadge>
          </div>
          <p class="text-sm text-fd-muted">
            {{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }} ·
            {{ formatDate(b.slot?.date ?? '') }} · {{ b.slot ? formatTimeRange(b.slot.startTime, b.slot.endTime) : '' }}
          </p>
          <p class="text-sm text-fd-navy">
            {{ formatPrice((b.slot?.price ?? 0) + (b.equipmentTotal ?? 0)) }} {{ t('clubs.currency') }} ·
            {{ b.paymentStatus === 'PAID' ? t('wallet.payWithWallet') : t('booking.payAtClub') }}
          </p>
          <BookingEquipmentList v-if="b.equipment?.length" :lines="b.equipment" />
          <div class="mt-3 flex flex-wrap gap-2">
            <button v-if="b.paymentStatus !== 'PAID'" class="text-sm font-semibold text-fd-success" @click="confirmBookingPayment(b.id)">{{ t('dashboard.confirmPayment') }}</button>
            <button class="text-sm font-semibold text-fd-danger" @click="cancelClubBooking(b.id)">{{ t('dashboard.cancel') }}</button>
          </div>
        </div>
      </div>
      <SzEmptyState v-else :message="t('dashboard.noBookings')" :action-label="t('nav.book')" :action-to="localePath('/clubs?book=1')" />
    </template>

    <template v-else-if="tab === 'tournaments' && selectedClub">
      <h2 class="fd-section-title mb-4">{{ t('tournaments.title') }}</h2>
      <div v-if="tournaments?.length" class="mb-6 space-y-3">
        <div v-for="tr in tournaments" :key="tr.id" class="fd-card p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="font-semibold text-fd-navy">{{ localized(tr.titleFa, tr.titleEn) }}</p>
            <SzBadge :tone="tr.status === 'CANCELLED' ? 'gray' : tr.status === 'FULL' ? 'orange' : 'green'" class="text-xs">
              {{ tr.status }}
            </SzBadge>
          </div>
          <p class="text-sm text-fd-muted">
            {{ tr.sport ? pickName(tr.sport) : '' }} · {{ formatDate(tr.date) }} · {{ formatTime(tr.startTime) }}
          </p>
          <p class="text-sm text-fd-navy">
            {{ formatPrice(tr.price) }} {{ t('clubs.currency') }} ·
            {{ formatNumber(tr._count?.registrations ?? tr.joinedCount ?? 0) }}/{{ formatNumber(tr.maxParticipants) }}
          </p>
          <div v-if="tr.status !== 'CANCELLED'" class="mt-3 flex flex-wrap gap-2">
            <button type="button" class="text-sm font-semibold text-fd-primary" @click="openEditTournament(tr)">{{ t('common.edit') }}</button>
            <button type="button" class="text-sm font-semibold text-fd-navy" @click="toggleTournamentRegs(tr.id)">
              {{ expandedTournamentId === tr.id ? t('dashboard.hideRegistrations') : t('dashboard.viewRegistrations') }}
            </button>
            <button type="button" class="text-sm font-semibold text-fd-danger" @click="cancelTournament(tr.id)">{{ t('dashboard.cancelTournament') }}</button>
          </div>
          <div v-if="expandedTournamentId === tr.id" class="mt-4 border-t border-fd-primary/5 pt-3">
            <p v-if="tournamentRegsPending" class="text-sm text-fd-muted">{{ t('common.loading') }}</p>
            <div v-else-if="tournamentRegistrations.length" class="space-y-1">
              <p v-for="reg in tournamentRegistrations" :key="reg.id" class="text-sm text-fd-navy">
                {{ reviewerLabel(reg.user) }}
                <span class="text-fd-muted"> · {{ formatDate(reg.registeredAt.slice(0, 10)) }}</span>
              </p>
            </div>
            <p v-else class="text-sm text-fd-muted">{{ t('dashboard.noRegistrations') }}</p>
          </div>
        </div>
      </div>
      <SzEmptyState v-else class="mb-6" :message="t('common.noResults')" />
      <div class="fd-panel grid gap-3 sm:grid-cols-2">
        <input v-model="newTournament.titleFa" class="fd-input sm:col-span-2" :placeholder="t('tournaments.titleField')" />
        <input v-model="newTournament.titleEn" class="fd-input sm:col-span-2" placeholder="Title (EN)" />
        <div class="sm:col-span-2">
          <p class="mb-2 text-sm text-fd-muted">{{ t('search.sport') }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in sports"
              :key="s.id"
              type="button"
              class="sz-chip tap-highlight"
              :class="newTournament.sportId === s.id ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
              @click="newTournament.sportId = s.id"
            >
              <span class="inline-flex items-center gap-1.5">
                <SportIcon :slug="s.slug" size="sm" />
                {{ pickName(s) }}
              </span>
            </button>
          </div>
        </div>
        <input v-model="newTournament.date" type="date" class="fd-input" />
        <input v-model="newTournament.startTime" type="time" class="fd-input" />
        <input v-model.number="newTournament.maxParticipants" type="number" class="fd-input" :placeholder="t('tournaments.maxParticipants')" />
        <input v-model.number="newTournament.price" type="number" class="fd-input" :placeholder="t('dashboard.price')" />
        <button type="button" class="fd-btn-primary sm:col-span-2" @click="addTournament">{{ t('tournaments.create') }}</button>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="editModal"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-fd-navy/40 p-4 backdrop-blur-sm sm:items-center"
        @click.self="closeEditModal"
      >
        <div
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.25rem] bg-white p-5 shadow-fd sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div class="mb-4 flex items-start justify-between gap-3">
            <h2 class="text-lg font-bold text-fd-navy">
              {{ editModal === 'activity' ? t('activities.title') : editModal === 'class' ? t('classes.manage') : t('tournaments.title') }}
            </h2>
            <button type="button" class="fd-icon-btn !h-10 !w-10 shrink-0" :aria-label="t('common.close')" @click="closeEditModal">
              <SzIcon name="close" />
            </button>
          </div>

          <div v-if="editModal === 'activity'" class="grid gap-3">
            <input v-model="editActivity.titleFa" class="fd-input" :placeholder="t('activities.titleField')" />
            <input v-model="editActivity.titleEn" class="fd-input" placeholder="Title (EN)" />
            <textarea v-model="editActivity.descFa" class="fd-input min-h-16" :placeholder="t('activities.descField')" />
            <input v-model="editActivity.date" type="date" class="fd-input" />
            <input v-model="editActivity.startTime" type="time" class="fd-input" />
          </div>

          <div v-else-if="editModal === 'class'" class="grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.titleField') }}</label>
              <input v-model="editClass.titleFa" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.date') }}</label>
              <input v-model="editClass.date" type="date" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('schedule.start') }}</label>
              <input v-model="editClass.startTime" type="time" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('schedule.end') }}</label>
              <input v-model="editClass.endTime" type="time" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('dashboard.price') }}</label>
              <input v-model.number="editClass.price" type="number" class="fd-input" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.filterType') }}</label>
              <select v-model="editClass.classType" class="fd-input" @change="onClassTypeChange(editClass)">
                <option value="GROUP">{{ t('classes.group') }}</option>
                <option value="SEMI_PRIVATE">{{ t('classes.semiPrivate') }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.seats') }}</label>
              <input
                v-model.number="editClass.maxSeats"
                type="number"
                class="fd-input"
                :min="editClass.classType === 'SEMI_PRIVATE' ? 2 : 5"
                :max="editClass.classType === 'SEMI_PRIVATE' ? 4 : 50"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.filterGender') }}</label>
              <select v-model="editClass.genderPolicy" class="fd-input">
                <option v-for="opt in genderPolicyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.minLevel') }}</label>
              <select v-model="editClass.minLevel" class="fd-input">
                <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('classes.maxLevel') }}</label>
              <select v-model="editClass.maxLevel" class="fd-input">
                <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-xs font-semibold text-fd-muted">{{ t('coaches.title') }}</label>
              <select v-model="editClass.coachId" class="fd-input">
                <option value="">{{ t('coaches.title') }}</option>
                <option v-for="c in coaches" :key="c.id" :value="c.id">{{ pickName(c) }}</option>
              </select>
            </div>
          </div>

          <div v-else-if="editModal === 'tournament'" class="grid gap-3 sm:grid-cols-2">
            <input v-model="editTournament.titleFa" class="fd-input sm:col-span-2" :placeholder="t('tournaments.titleField')" />
            <input v-model="editTournament.titleEn" class="fd-input sm:col-span-2" placeholder="Title (EN)" />
            <textarea v-model="editTournament.descFa" class="fd-input min-h-16 sm:col-span-2" :placeholder="t('activities.descField')" />
            <div class="sm:col-span-2">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="s in sports"
                  :key="s.id"
                  type="button"
                  class="sz-chip tap-highlight"
                  :class="editTournament.sportId === s.id ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
                  @click="editTournament.sportId = s.id"
                >
                  <SportIcon :slug="s.slug" size="sm" />
                  {{ pickName(s) }}
                </button>
              </div>
            </div>
            <input v-model="editTournament.date" type="date" class="fd-input" />
            <input v-model="editTournament.startTime" type="time" class="fd-input" />
            <input v-model.number="editTournament.maxParticipants" type="number" class="fd-input" :placeholder="t('tournaments.maxParticipants')" />
            <input v-model.number="editTournament.price" type="number" class="fd-input" :placeholder="t('dashboard.price')" />
          </div>

          <div class="mt-4 flex gap-2">
            <button type="button" class="fd-btn-primary flex-1" :disabled="editPending" @click="saveEditModal">{{ t('common.save') }}</button>
            <button type="button" class="fd-btn-ghost" @click="closeEditModal">{{ t('common.cancel') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
