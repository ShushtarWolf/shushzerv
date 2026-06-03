const ALLOWED_ROLES = ['ATHLETE', 'COACH', 'CLUB_ADMIN'] as const

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; email?: string; password?: string; role?: string }>(event)
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const role = (ALLOWED_ROLES as readonly string[]).includes(body.role ?? '')
    ? (body.role as (typeof ALLOWED_ROLES)[number])
    : 'ATHLETE'

  if (!name || !email || password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: hashSecret(password) },
  })

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale },
  })

  return { id: user.id, email: user.email, name: user.name, role: user.role }
})
