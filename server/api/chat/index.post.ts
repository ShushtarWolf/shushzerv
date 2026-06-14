export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ userId?: string }>(event)
  const otherId = body.userId
  if (!otherId || otherId === user.id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid recipient' })
  }

  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true, name: true } })
  if (!other) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Find an existing 1:1 conversation that contains exactly these two members.
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      members: { every: { userId: { in: [user.id, otherId] } } },
      AND: [
        { members: { some: { userId: user.id } } },
        { members: { some: { userId: otherId } } },
      ],
    },
  })
  if (existing) return { id: existing.id }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: { create: [{ userId: user.id }, { userId: otherId }] },
    },
  })

  return { id: conversation.id }
})
