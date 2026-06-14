export default defineNuxtRouteMiddleware(() => {
  const localePath = useLocalePath()
  const { loggedIn, user } = useUserSession()
  if (!loggedIn.value) return navigateTo(localePath('/login'))
  if (user.value?.role !== 'ATHLETE') {
    if (user.value?.role === 'PLATFORM_ADMIN') return navigateTo(localePath('/dashboard/admin'))
    if (user.value?.role === 'COACH') return navigateTo(localePath('/dashboard/coach'))
    if (user.value?.role === 'CLUB_ADMIN') return navigateTo(localePath('/dashboard/club'))
  }
})
