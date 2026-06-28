import { assignPackageStudents, mapPackage, packageInclude, parsePackageFields, parseStudentEmails } from '../../utils/classPackage'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const body = await readBody<Record<string, unknown>>(event)

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  if (!body.titleFa || !body.descFa || !body.startTime || !body.endTime) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const sportId = body.sportId ? String(body.sportId) : coach.sportId
  const fields = parsePackageFields(body)

  if (fields.groupMode === 'WITH_STUDENTS' && fields.classType === 'GROUP') {
    const emails = parseStudentEmails(body.studentEmails)
    if (!emails.length) {
      throw createError({ statusCode: 400, statusMessage: 'Student emails required for group with students' })
    }
  }

  const pkg = await prisma.classPackage.create({
    data: {
      coachId: coach.id,
      clubId: body.clubId ? String(body.clubId) : null,
      sportId,
      titleFa: String(body.titleFa),
      titleEn: body.titleEn ? String(body.titleEn) : String(body.titleFa),
      descFa: String(body.descFa),
      descEn: body.descEn ? String(body.descEn) : String(body.descFa),
      ...fields,
    },
    include: packageInclude,
  })

  if (fields.groupMode === 'WITH_STUDENTS') {
    await assignPackageStudents(pkg.id, parseStudentEmails(body.studentEmails))
  }

  const updated = await prisma.classPackage.findUnique({
    where: { id: pkg.id },
    include: packageInclude,
  })
  return mapPackage(updated!)
})
