import type { H3Event } from 'h3'
import { FIND_PLAYERS_ENABLED, canAccessGroupClasses } from '#shared/features'

export function assertFindPlayersEnabled() {
  if (!FIND_PLAYERS_ENABLED) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
}

export async function assertGroupClassesPublicAccess(event: H3Event) {
  const session = await getUserSession(event)
  if (!canAccessGroupClasses(session?.user?.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}
