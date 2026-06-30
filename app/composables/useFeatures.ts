import { FIND_PLAYERS_ENABLED, PUBLIC_GROUP_CLASSES_ENABLED, canAccessGroupClasses } from '#shared/features'

export function useFeatures() {
  const { user } = useUserSession()

  const showGroupClasses = computed(() => canAccessGroupClasses(user.value?.role))
  const showFindPlayers = computed(() => FIND_PLAYERS_ENABLED)
  const showPublicPackages = computed(() => PUBLIC_GROUP_CLASSES_ENABLED || canAccessGroupClasses(user.value?.role))

  return { showGroupClasses, showFindPlayers, showPublicPackages }
}
