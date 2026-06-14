export default defineNuxtRouteMiddleware((to) => {
  const localePath = useLocalePath()
  const { user } = useUserSession()

  if (user.value?.role !== 'ATHLETE') return
  if (to.path === localePath('/onboarding')) return
  if (user.value.onboarded) return

  return navigateTo(localePath('/onboarding'))
})
