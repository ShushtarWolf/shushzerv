import { assignPackageStudents, mapPackage, packageInclude, parsePackageFields, parseStudentEmails } from '../../utils/classPackage'
import { requireClubOwner } from '../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const body = await readBody<Record<string, unknown>>(event)

  if (!body.clubId || !body.sportId || !body.titleFa || !body.descFa || !body.startTime || !body.endTime) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  await requireClubOwner(user.id, String(body.clubId))
  const fields = parsePackageFields(body)

  if (fields.groupMode === 'WITH_STUDENTS' && fields.classType === 'GROUP') {
    const emails = parseStudentEmails(body.studentEmails)
    if (!emails.length) {
      throw createError({ statusCode: 400, statusMessage: 'Student emails required for group with students' })
    }
  }

  const pkg = await prisma.classPackage.create({
    data: {
      clubId: String(body.clubId),
      sportId: String(body.sportId),
      coachId: body.coachId ? String(body.coachId) : null,
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
