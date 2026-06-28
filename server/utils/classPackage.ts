import { parseDaysOfWeek } from '#shared/classPackage'
import { defaultMaxSeatsForType, parseClassSessionFields, mapClassParticipants } from './classSession'

export { parseDaysOfWeek } from '#shared/classPackage'

export function parseGroupMode(value: unknown, classType: 'GROUP' | 'SEMI_PRIVATE'): 'OPEN' | 'WITH_STUDENTS' {
  if (classType !== 'GROUP') return 'OPEN'
  return value === 'WITH_STUDENTS' ? 'WITH_STUDENTS' : 'OPEN'
}

export function parsePackageFields(body: Record<string, unknown>) {
  const classType = body.classType === 'SEMI_PRIVATE' ? 'SEMI_PRIVATE' : 'GROUP'
  const extra = parseClassSessionFields({
    classType,
    genderPolicy: body.genderPolicy,
    minLevel: body.minLevel,
    maxLevel: body.maxLevel,
    maxSeats: body.maxSeats ?? defaultMaxSeatsForType(classType),
  })

  const sessionsPerWeek = Math.min(7, Math.max(1, Math.round(Number(body.sessionsPerWeek) || 1)))
  const durationWeeks = Math.min(52, Math.max(1, Math.round(Number(body.durationWeeks) || 4)))
  const price = Math.max(0, Math.round(Number(body.price) || 0))

  return {
    classType: classType as 'GROUP' | 'SEMI_PRIVATE',
    groupMode: parseGroupMode(body.groupMode, classType),
    genderPolicy: extra.genderPolicy ?? 'MIXED',
    minLevel: extra.minLevel ?? 'BEGINNER',
    maxLevel: extra.maxLevel ?? 'PRO',
    maxSeats: extra.maxSeats ?? defaultMaxSeatsForType(classType),
    sessionsPerWeek,
    durationWeeks,
    price,
    daysOfWeek: parseDaysOfWeek(body.daysOfWeek),
    startTime: typeof body.startTime === 'string' ? body.startTime : '10:00',
    endTime: typeof body.endTime === 'string' ? body.endTime : '11:00',
    featured: body.featured === true,
    status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
  }
}

export const packageInclude = {
  club: true,
  sport: true,
  coach: true,
  enrollments: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          email: true,
          gender: true,
          athleteProfile: { select: { level: true } },
        },
      },
    },
  },
} as const

type PackageWithEnrollments = {
  enrollments: Array<{
    id: string
    user: {
      name: string
      gender?: 'MALE' | 'FEMALE' | null
      athleteProfile?: { level: import('@prisma/client').SkillLevel } | null
    }
  }>
} & Record<string, unknown>

export function mapPackage<T extends PackageWithEnrollments>(pkg: T) {
  const { enrollments, ...rest } = pkg
  return {
    ...rest,
    participants: mapClassParticipants(enrollments),
  }
}

export function parseStudentEmails(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw.split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
  }
  return []
}

export async function assignPackageStudents(packageId: string, emails: string[]) {
  if (!emails.length) return

  const unique = [...new Set(emails)]
  for (const email of unique) {
    const athlete = await prisma.user.findUnique({ where: { email } })
    if (!athlete || athlete.role !== 'ATHLETE') {
      throw createError({ statusCode: 400, statusMessage: `Athlete not found: ${email}` })
    }
    await prisma.packageEnrollment.upsert({
      where: { userId_packageId: { userId: athlete.id, packageId } },
      create: { userId: athlete.id, packageId },
      update: {},
    })
  }

  await syncPackageBookedSeats(packageId)
}

export async function syncPackageBookedSeats(packageId: string) {
  const count = await prisma.packageEnrollment.count({ where: { packageId } })
  await prisma.classPackage.update({
    where: { id: packageId },
    data: { bookedSeats: count },
  })
  return count
}
