import type { H3Event } from 'h3'
import type { Role } from '@prisma/client'

export async function requireUser(event: H3Event) {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session.user as { id: string; email: string; name: string; role: Role }
}

export const requireAuth = requireUser

export async function requireRole(event: H3Event, ...roles: Role[]) {
  const user = await requireUser(event)
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
