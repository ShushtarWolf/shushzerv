export default defineEventHandler(async () => {
  try {
    const clubs = await prisma.club.count()
    const coaches = await prisma.coach.count()
    return {
      ok: true,
      clubs,
      coaches,
      databaseUrl: process.env.DATABASE_URL ?? null,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      databaseUrl: process.env.DATABASE_URL ?? null,
    }
  }
})
