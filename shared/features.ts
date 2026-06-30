export type AppRole = 'ATHLETE' | 'COACH' | 'CLUB_ADMIN' | 'PLATFORM_ADMIN'

/** Public browse/enroll for group classes (athletes). Club admins and coaches always have access. */
export const PUBLIC_GROUP_CLASSES_ENABLED = true

/** Open-match / find-players feature. */
export const FIND_PLAYERS_ENABLED = false

export function canAccessGroupClasses(role?: AppRole | null) {
  if (PUBLIC_GROUP_CLASSES_ENABLED) return true
  return role === 'CLUB_ADMIN' || role === 'COACH' || role === 'PLATFORM_ADMIN'
}
