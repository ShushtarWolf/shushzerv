export default defineNuxtRouteMiddleware((to) => {
  const localePath = useLocalePath()
  const { user } = useUserSession()

  if (user.value?.role === 'ATHLETE') {
    if (to.path === localePath('/onboarding')) return
    if (user.value.onboarded) return
    return navigateTo(localePath('/onboarding'))
  }

  if (user.value?.role === 'COACH') {
    if (to.path === localePath('/coach-onboarding')) return
    if (user.value.onboarded) return
    return navigateTo(localePath('/coach-onboarding'))
  }

  if (user.value?.role === 'CLUB_ADMIN') {
    if (to.path === localePath('/club-onboarding')) return
    if (user.value.onboarded) return
    return navigateTo(localePath('/club-onboarding'))
  }
})
