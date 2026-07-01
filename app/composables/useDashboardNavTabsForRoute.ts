import type { DashboardSidebarTab } from './useDashboardSidebar'

type T = (key: string, ...args: unknown[]) => string

function clubTabs(t: T): DashboardSidebarTab[] {
  return [
    { id: 'overview', label: t('dashboard.overview'), icon: 'grid', group: 'general' },
    { id: 'schedule', label: t('dashboard.scheduleTab'), icon: 'calendar', group: 'general' },
    { id: 'bookings', label: t('dashboard.bookingsTab'), icon: 'chart', group: 'operations' },
    { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet', group: 'account' },
    { id: 'finance', label: t('dashboard.financeTab'), icon: 'chart', group: 'account' },
    { id: 'manage', label: t('dashboard.manageTab'), icon: 'building', group: 'business' },
    { id: 'reviews', label: t('reviews.title'), icon: 'users', group: 'business' },
    { id: 'tournaments', label: t('tournaments.title'), icon: 'calendar', group: 'business' },
  ]
}

function coachTabs(t: T): DashboardSidebarTab[] {
  return [
    { id: 'overview', label: t('dashboard.overview'), icon: 'grid', group: 'general' },
    { id: 'sessions', label: t('dashboard.sessionsTab'), icon: 'chart', group: 'general' },
    { id: 'schedule', label: t('dashboard.scheduleTab'), icon: 'calendar', group: 'general' },
    { id: 'students', label: t('dashboard.myStudents'), icon: 'users', group: 'general' },
    { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet', group: 'general' },
    { id: 'clubs', label: t('coaches.findClubs'), icon: 'building', group: 'business' },
    { id: 'plans', label: t('dashboard.plansTab'), icon: 'users', group: 'business' },
    { id: 'packages', label: t('packages.title'), icon: 'calendar', group: 'business' },
    { id: 'profile', label: t('dashboard.profileTab'), icon: 'building', group: 'account' },
  ]
}

function athleteTabs(t: T): DashboardSidebarTab[] {
  return [
    { id: 'overview', label: t('dashboard.overview'), icon: 'grid', group: 'general' },
    { id: 'schedule', label: t('dashboard.scheduleTab'), icon: 'calendar', group: 'general' },
    { id: 'bookings', label: t('dashboard.bookingsTab'), icon: 'chart', group: 'general' },
    { id: 'enrollments', label: t('dashboard.enrollmentsTab'), icon: 'users', group: 'general' },
    { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet', group: 'account' },
    { id: 'plans', label: t('dashboard.plansTab'), icon: 'users', group: 'account' },
    { id: 'profile', label: t('dashboard.profileTab'), icon: 'building', group: 'account' },
  ]
}

function platformAdminTabs(t: T): DashboardSidebarTab[] {
  return [
    { id: 'overview', label: t('dashboard.overview'), icon: 'grid', group: 'general' },
    { id: 'wallet', label: t('dashboard.walletTab'), icon: 'wallet', group: 'general' },
    { id: 'users', label: t('dashboard.allUsers'), icon: 'users', group: 'manage' },
    { id: 'clubs', label: t('dashboard.allClubs'), icon: 'building', group: 'manage' },
    { id: 'coaches', label: t('dashboard.allCoaches'), icon: 'users', group: 'manage' },
    { id: 'bookings', label: t('dashboard.bookingsTab'), icon: 'chart', group: 'operations' },
    { id: 'matches', label: t('matches.title'), icon: 'calendar', group: 'operations' },
    { id: 'classes', label: t('classes.title'), icon: 'users', group: 'operations' },
    { id: 'news', label: t('nav.news'), icon: 'grid', group: 'content' },
  ]
}

/** Route-based tab list for SSR-safe dashboard sidebar (layout renders before page setup). */
export function useDashboardNavTabsForRoute() {
  const { t } = useI18n()
  const route = useRoute()

  return computed(() => {
    const path = route.path.replace(/^\/en(?=\/|$)/, '') || '/'

    if (path.startsWith('/dashboard/admin')) return platformAdminTabs(t)
    if (path.startsWith('/dashboard/club')) return clubTabs(t)
    if (path.startsWith('/dashboard/coach')) return coachTabs(t)
    if (path === '/dashboard' || path.startsWith('/dashboard?')) return athleteTabs(t)
    if (path.startsWith('/dashboard/')) return athleteTabs(t)

    return []
  })
}
