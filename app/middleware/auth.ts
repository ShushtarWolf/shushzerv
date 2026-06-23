export default defineNuxtRouteMiddleware((to) => {
  const localePath = useLocalePath()
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo({
      path: localePath('/login'),
      query: { redirect: to.fullPath },
    })
  }
})
