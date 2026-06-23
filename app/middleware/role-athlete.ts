export default defineNuxtRouteMiddleware((to) => {
  const localePath = useLocalePath()
  const { loggedIn, user } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo({ path: localePath('/login'), query: { redirect: to.fullPath } })
  }
  if (user.value?.role !== 'ATHLETE') {
    if (user.value?.role === 'PLATFORM_ADMIN') return navigateTo(localePath('/dashboard/admin'))
    if (user.value?.role === 'COACH') return navigateTo(localePath('/dashboard/coach'))
    if (user.value?.role === 'CLUB_ADMIN') return navigateTo(localePath('/dashboard/club'))
  }
})
