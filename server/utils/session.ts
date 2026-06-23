type SessionUser = {
  id: string
  email: string
  name: string
  nameEn?: string | null
  role: string
  locale: string
  onboarded?: boolean
}

export function toSessionUser(user: {
  id: string
  email: string
  name: string
  nameEn?: string | null
  role: string
  locale: string
  onboardedAt?: Date | null
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    nameEn: user.nameEn,
    role: user.role,
    locale: user.locale,
    onboarded: !!user.onboardedAt,
  }
}

export function sessionDisplayName(user: SessionUser, locale = 'fa') {
  if (locale === 'en' && user.nameEn?.trim()) return user.nameEn.trim()
  return user.name
}
