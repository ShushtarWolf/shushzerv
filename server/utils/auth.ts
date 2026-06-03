import type { H3Event } from 'h3'
import type { Role } from '@prisma/client'

export async function requireAuth(event: H3Event) {
  const session = await requireUserSession(event)
  const user = session.user as { id: string; role: Role; email: string; name: string } | undefined
  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

export async function requireRole(event: H3Event, ...roles: Role[]) {
  const user = await requireAuth(event)
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
