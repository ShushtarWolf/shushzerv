export default defineNuxtRouteMiddleware(() => {
  const localePath = useLocalePath()
  const { user } = useUserSession()
  if (user.value?.role !== 'PLATFORM_ADMIN') {
    return navigateTo(localePath('/dashboard'))
  }
})
