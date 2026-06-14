type SessionUser = {
  id: string
  email: string
  name: string
  role: string
  locale: string
  onboarded?: boolean
}

export function toSessionUser(user: {
  id: string
  email: string
  name: string
  role: string
  locale: string
  onboardedAt?: Date | null
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    locale: user.locale,
    onboarded: !!user.onboardedAt,
  }
}
