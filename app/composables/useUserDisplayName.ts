import { userDisplayName as pickUserDisplayName } from '#shared/userDisplayName'

type NamedUser = {
  name: string
  nameEn?: string | null
}

export function userDisplayName(user: NamedUser | null | undefined, locale: string) {
  return pickUserDisplayName(user, locale)
}

export function useUserDisplayName() {
  const { locale } = useI18n()
  const { user } = useUserSession()

  const displayName = computed(() => userDisplayName(user.value, locale.value))

  const firstName = computed(() => {
    const full = displayName.value
    if (!full) return ''
    return full.split(/\s+/)[0] ?? full
  })

  return { displayName, firstName }
}
