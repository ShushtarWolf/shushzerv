export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !verifySecret(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale },
  })

  return { id: user.id, email: user.email, name: user.name, role: user.role }
})
