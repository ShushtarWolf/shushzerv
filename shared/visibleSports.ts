export const VISIBLE_SPORT_SLUGS = ['tennis', 'padel'] as const

export type VisibleSportSlug = (typeof VISIBLE_SPORT_SLUGS)[number]

export function isVisibleSportSlug(slug: string): slug is VisibleSportSlug {
  return (VISIBLE_SPORT_SLUGS as readonly string[]).includes(slug)
}

export function visibleSportSlugList(): readonly string[] {
  return VISIBLE_SPORT_SLUGS
}
