import type { Club, Sport, Tournament } from '~/types'
import type { ClubDashboardStats } from '~/types/dashboard'

export function useClubDashboard() {
  const { t } = useI18n()

  const tab = useDashboardTab('overview')

  const { data: clubs, pending: clubsPending, error: clubsError, refresh: refreshClubs } = useApiFetch<Club[]>('/api/club', {
    server: false,
  })
  const { data: sports } = useApiFetch<Sport[]>('/api/sports')

  const selectedClubId = ref('')

  const { data: stats, refresh: refreshStats } = useApiFetch<ClubDashboardStats & {
    todayRevenue: number
    monthRevenue: number
    totalRevenue: number
    walletBalance: number
    pendingBookings: number
    classEnrollments: number
    role: 'CLUB_ADMIN'
  }>('/api/dashboard/stats', {
    query: computed(() => ({ clubId: selectedClubId.value || undefined })),
    watch: [selectedClubId],
  })

  const { data: chartData, error: chartsError, pending: chartsPending, refresh: refreshCharts } = useApiFetch<{
    labels: string[]
    revenue: number[]
    bookingTrend: number[]
    classTrend: number[]
    dowLabels: string[]
    bookingByDow: number[]
    classByDow: number[]
    breakdown: Array<{ key: string; value: number }>
  }>('/api/dashboard/charts', {
    query: computed(() => ({ clubId: selectedClubId.value || undefined })),
    watch: [selectedClubId],
  })

  const { data: tournaments, refresh: refreshTournaments } = useApiFetch<Tournament[]>('/api/tournaments', {
    query: computed(() => ({ clubId: selectedClubId.value || undefined })),
    watch: [selectedClubId],
  })

  watch(
    () => clubs.value,
    (list) => {
      if (list?.length && !selectedClubId.value) selectedClubId.value = list[0]!.id
    },
    { immediate: true },
  )

  watch(selectedClubId, (id) => {
    if (!id && clubs.value?.[0]?.id) selectedClubId.value = clubs.value[0].id
  })

  const tabs = computed(() => [
    { id: 'overview', label: t('dashboard.overview'), icon: 'grid' },
    { id: 'schedule', label: t('dashboard.scheduleTab'), icon: 'calendar' },
    { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet' },
    { id: 'finance', label: t('dashboard.financeTab'), icon: 'chart' },
    { id: 'manage', label: t('dashboard.manageTab'), icon: 'building' },
    { id: 'bookings', label: t('dashboard.bookingsTab'), icon: 'chart' },
    { id: 'reviews', label: t('reviews.title'), icon: 'users' },
    { id: 'tournaments', label: t('tournaments.title'), icon: 'calendar' },
  ])

  return {
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
  }
}
