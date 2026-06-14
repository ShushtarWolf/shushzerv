export function useDashboardPath() {
  const localePath = useLocalePath()
  const { user } = useUserSession()

  const dashboardPath = computed(() => {
    if (user.value?.role === 'PLATFORM_ADMIN') return localePath('/dashboard/admin')
    if (user.value?.role === 'CLUB_ADMIN') return localePath('/dashboard/club')
    if (user.value?.role === 'COACH') return localePath('/dashboard/coach')
    return localePath('/dashboard')
  })

  return { dashboardPath }
}
