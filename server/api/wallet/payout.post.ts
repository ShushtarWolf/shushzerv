export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const { clubId, amount } = await readBody<{ clubId?: string; amount?: number }>(event)
  if (!clubId || !amount || !Number.isFinite(amount)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }
  return payoutClubWallet(user.id, clubId, Math.round(amount))
})
