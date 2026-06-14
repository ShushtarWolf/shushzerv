import { SlotStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const { clubId, courtId, date, status } = getQuery(event)
  const slotStatus = status && Object.values(SlotStatus).includes(String(status) as SlotStatus)
    ? (String(status) as SlotStatus)
    : undefined

  const slots = await prisma.slot.findMany({
    where: {
      ...(courtId ? { courtId: String(courtId) } : {}),
      ...(clubId ? { court: { clubId: String(clubId) } } : {}),
      ...(date ? { date: String(date) } : {}),
      ...(slotStatus ? { status: slotStatus } : {}),
    },
    include: { court: { include: { sport: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  return slots
})
