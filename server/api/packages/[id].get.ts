import { packageInclude, mapPackage } from '../../utils/classPackage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const pkg = await prisma.classPackage.findUnique({
    where: { id },
    include: packageInclude,
  })
  if (!pkg || pkg.status !== 'ACTIVE') {
    throw createError({ statusCode: 404, statusMessage: 'Package not found' })
  }
  return mapPackage(pkg)
})
