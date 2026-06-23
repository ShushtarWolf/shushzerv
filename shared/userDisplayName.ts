export function userDisplayName(user: { name: string; nameEn?: string | null } | null | undefined, locale: string) {
  if (!user) return ''
  if (locale === 'en' && user.nameEn?.trim()) return user.nameEn.trim()
  return user.name
}
