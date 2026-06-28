import type { ClassType, GenderPolicy, SkillLevel } from '@prisma/client'
import {
  defaultMaxSeatsForType,
  genderMatchesClassPolicy,
  skillLevelInRange,
  toClassParticipantView,
  validateClassMaxSeats,
} from '#shared/classSession'

const LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']
const CLASS_TYPES: ClassType[] = ['GROUP', 'SEMI_PRIVATE']
const GENDER_POLICIES: GenderPolicy[] = ['MEN', 'WOMEN', 'FAMILY', 'MIXED']

export function parseClassType(value: unknown): ClassType | null {
  return typeof value === 'string' && CLASS_TYPES.includes(value as ClassType) ? value as ClassType : null
}

export function parseGenderPolicy(value: unknown): GenderPolicy | null {
  return typeof value === 'string' && GENDER_POLICIES.includes(value as GenderPolicy) ? value as GenderPolicy : null
}

export function parseSkillLevel(value: unknown): SkillLevel | null {
  return typeof value === 'string' && LEVELS.includes(value as SkillLevel) ? value as SkillLevel : null
}

export function parseClassSessionFields(body: Record<string, unknown>) {
  const classType = parseClassType(body.classType)
  const genderPolicy = parseGenderPolicy(body.genderPolicy)
  const minLevel = parseSkillLevel(body.minLevel)
  const maxLevel = parseSkillLevel(body.maxLevel)
  const maxSeats = body.maxSeats !== undefined ? Number(body.maxSeats) : undefined

  if (classType && maxSeats !== undefined && !validateClassMaxSeats(classType, maxSeats)) {
    throw createError({
      statusCode: 400,
      statusMessage: classType === 'SEMI_PRIVATE' ? 'Semi-private classes allow 2–4 seats' : 'Group classes need at least 5 seats',
    })
  }

  if (minLevel && maxLevel && LEVELS.indexOf(minLevel) > LEVELS.indexOf(maxLevel)) {
    throw createError({ statusCode: 400, statusMessage: 'minLevel cannot exceed maxLevel' })
  }

  return {
    ...(classType ? { classType } : {}),
    ...(genderPolicy ? { genderPolicy } : {}),
    ...(minLevel ? { minLevel } : {}),
    ...(maxLevel ? { maxLevel } : {}),
    ...(maxSeats !== undefined && Number.isFinite(maxSeats) ? { maxSeats } : {}),
  }
}

export function mapClassParticipants(
  enrollments: Array<{
    user: {
      name: string
      gender?: 'MALE' | 'FEMALE' | null
      athleteProfile?: { level: SkillLevel } | null
    }
  }>,
) {
  return enrollments.map((e) => toClassParticipantView(e.user))
}

export async function assertCanEnrollInClass(
  userId: string,
  classSession: {
    sportId: string
    genderPolicy: GenderPolicy
    minLevel: SkillLevel
    maxLevel: SkillLevel
    bookedSeats: number
    maxSeats: number
    status: string
  },
) {
  if (classSession.status === 'CANCELLED') {
    throw createError({ statusCode: 404, statusMessage: 'Class not found' })
  }
  if (classSession.bookedSeats >= classSession.maxSeats) {
    throw createError({ statusCode: 409, statusMessage: 'Class is full' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { athleteProfile: true },
  })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const needsGender = classSession.genderPolicy === 'MEN' || classSession.genderPolicy === 'WOMEN'
  if (needsGender && !user.gender) {
    throw createError({ statusCode: 400, statusMessage: 'Gender required' })
  }
  if (!genderMatchesClassPolicy(user.gender, classSession.genderPolicy)) {
    throw createError({ statusCode: 403, statusMessage: 'Gender not allowed for this class' })
  }

  const level = user.athleteProfile?.level ?? 'BEGINNER'
  if (!skillLevelInRange(level, classSession.minLevel, classSession.maxLevel)) {
    throw createError({ statusCode: 403, statusMessage: 'Skill level not in range for this class' })
  }
}

export { defaultMaxSeatsForType, validateClassMaxSeats }
