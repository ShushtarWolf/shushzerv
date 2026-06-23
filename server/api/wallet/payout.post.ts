import { payoutClubWallet, payoutUserWallet } from '../../utils/wallet'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { clubId, amount } = await readBody<{ clubId?: string; amount?: number }>(event)
  if (!amount || !Number.isFinite(amount)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  if (user.role === 'COACH') {
    return payoutUserWallet(user.id, Math.round(amount))
  }

  if (user.role === 'CLUB_ADMIN') {
    if (!clubId) throw createError({ statusCode: 400, statusMessage: 'clubId is required' })
    return payoutClubWallet(user.id, clubId, Math.round(amount))
  }

  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
})
