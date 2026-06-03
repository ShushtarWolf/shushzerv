import type { Role } from '@prisma/client'

const VALID_ROLES: Role[] = ['ATHLETE', 'COACH', 'CLUB_ADMIN']

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; name?: string; role?: Role; locale?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const name = body.name?.trim()
  const role: Role = body.role && VALID_ROLES.includes(body.role) ? body.role : 'ATHLETE'

  if (!email || !password || !name) {
    throw createError({ statusCode: 400, statusMessage: 'Email, password and name are required' })
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 6 characters' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      locale: body.locale === 'en' ? 'en' : 'fa',
      passwordHash: hashSecret(password),
    },
  })

  if (role === 'COACH') {
    const sport = await prisma.sport.findFirst()
    if (sport) {
      await prisma.coach.create({
        data: { nameFa: name, nameEn: name, city: 'Tehran', sportId: sport.id, userId: user.id },
      })
    }
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale },
  })

  return { id: user.id, email: user.email, name: user.name, role: user.role }
})
