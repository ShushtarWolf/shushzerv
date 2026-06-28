import { assignPackageStudents, mapPackage, packageInclude, parsePackageFields, parseStudentEmails } from '../../../utils/classPackage'
import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const existing = await prisma.classPackage.findUnique({ where: { id } })
  if (!existing?.clubId) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  await requireClubOwner(user.id, existing.clubId)

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
      ...(body.coachId !== undefined ? { coachId: body.coachId ? String(body.coachId) : null } : {}),
      ...fields,
    },
  })

  if (body.studentEmails !== undefined) {
    await assignPackageStudents(id, parseStudentEmails(body.studentEmails))
  }

  const updated = await prisma.classPackage.findUnique({ where: { id }, include: packageInclude })
  return mapPackage(updated!)
})
