import { canAccessGroupClasses } from '#shared/features'

export default defineNuxtRouteMiddleware(() => {
  const localePath = useLocalePath()
  const { user } = useUserSession()
  if (!canAccessGroupClasses(user.value?.role)) {
    return navigateTo(localePath('/'))
  }
})
