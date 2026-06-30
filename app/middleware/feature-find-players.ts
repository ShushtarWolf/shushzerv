import { FIND_PLAYERS_ENABLED } from '#shared/features'

export default defineNuxtRouteMiddleware(() => {
  const localePath = useLocalePath()
  if (!FIND_PLAYERS_ENABLED) {
    return navigateTo(localePath('/'))
  }
})
