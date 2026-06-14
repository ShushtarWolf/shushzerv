/**
 * XP + badge awards. XP is stored on the athlete profile; non-athletes are
 * silently skipped. Badge codes are referenced in the UI via i18n keys
 * `badges.<code>`.
 */
export const XP_REWARDS = {
  booking: 20,
  createMatch: 15,
  joinMatch: 10,
} as const

export type XpReason = keyof typeof XP_REWARDS

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1)
}

export function xpProgress(xp: number) {
  const level = levelFromXp(xp)
  const into = xp % 100
  return { level, into, next: 100, ratio: into / 100 }
}

/**
 * Increment XP for a user's athlete profile (if any), then evaluate badges.
 * Safe to call for any authenticated user.
 */
export async function awardXp(userId: string, reason: XpReason) {
  const profile = await prisma.athleteProfile.findUnique({ where: { userId } })
  if (!profile) return null

  const updated = await prisma.athleteProfile.update({
    where: { userId },
    data: { xp: { increment: XP_REWARDS[reason] } },
  })

  await evaluateBadges(userId)
  return updated
}

async function grant(userId: string, code: string) {
  await prisma.userBadge.upsert({
    where: { userId_code: { userId, code } },
    create: { userId, code },
    update: {},
  })
}

export async function evaluateBadges(userId: string) {
  const [bookings, matches, profile] = await Promise.all([
    prisma.booking.count({ where: { userId } }),
    prisma.matchParticipant.count({ where: { userId } }),
    prisma.athleteProfile.findUnique({ where: { userId } }),
  ])

  if (bookings >= 1) await grant(userId, 'first_booking')
  if (bookings >= 5) await grant(userId, 'regular')
  if (matches >= 3) await grant(userId, 'social_player')
  if ((profile?.xp ?? 0) >= 100) await grant(userId, 'rising_star')
}
