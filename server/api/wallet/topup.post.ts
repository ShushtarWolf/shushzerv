export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { amount } = await readBody<{ amount?: number }>(event)
  if (!amount || !Number.isFinite(amount)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid amount' })
  }
  return topUpUserWallet(user.id, Math.round(amount))
})
