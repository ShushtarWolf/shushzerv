import { assignPackageStudents, mapPackage, packageInclude, parsePackageFields, parseStudentEmails } from '../../../utils/classPackage'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'COACH')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach profile not found' })

  const existing = await prisma.classPackage.findFirst({ where: { id, coachId: coach.id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const body = await readBody<Record<string, unknown>>(event)
  const fields = parsePackageFields({ ...existing, ...body })

  await prisma.classPackage.update({
    where: { id },
    data: {
      ...(body.titleFa ? { titleFa: String(body.titleFa) } : {}),
      ...(body.titleEn ? { titleEn: String(body.titleEn) } : {}),
      ...(body.descFa ? { descFa: String(body.descFa) } : {}),
      ...(body.descEn ? { descEn: String(body.descEn) } : {}),
      ...(body.sportId ? { sportId: String(body.sportId) } : {}),
      ...(body.clubId !== undefined ? { clubId: body.clubId ? String(body.clubId) : null } : {}),
      ...fields,
    },
  })

  if (body.studentEmails !== undefined) {
    await assignPackageStudents(id, parseStudentEmails(body.studentEmails))
  }

  const updated = await prisma.classPackage.findUnique({ where: { id }, include: packageInclude })
  return mapPackage(updated!)
})
