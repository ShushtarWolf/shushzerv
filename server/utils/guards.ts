import type { H3Event } from 'h3'

export type AppRole = 'ATHLETE' | 'COACH' | 'CLUB_ADMIN'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: AppRole
  locale: string
}

export async function requireRole(event: H3Event, roles: AppRole[]): Promise<SessionUser> {
  const { user } = await requireUserSession(event)
  const sessionUser = user as unknown as SessionUser
  if (!roles.includes(sessionUser.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return sessionUser
}
