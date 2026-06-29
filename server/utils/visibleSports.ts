import { isVisibleSportSlug, visibleSportSlugList } from '#shared/visibleSports'

export { isVisibleSportSlug, visibleSportSlugList }

export function visibleSportWhere() {
  return { slug: { in: [...visibleSportSlugList()] } }
}

export function visibleSportRelationWhere() {
  return { sport: visibleSportWhere() }
}

/** Prisma `where` for court → sport, with optional slug filter. Returns null if slug is hidden. */
export function courtSportWhere(sport: unknown) {
  if (!sport) return { sport: visibleSportWhere() }
  const slug = String(sport)
  if (!isVisibleSportSlug(slug)) return null
  return { sport: { slug } }
}

/** Prisma `where` for entities with a direct `sport` relation. Returns null if slug is hidden. */
export function entitySportWhere(sport: unknown) {
  if (!sport) return visibleSportRelationWhere()
  const slug = String(sport)
  if (!isVisibleSportSlug(slug)) return null
  return { sport: { slug } }
}
