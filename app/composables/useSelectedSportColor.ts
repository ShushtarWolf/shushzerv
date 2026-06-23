import type { Sport } from '~/types'

/** Tracks selected sport filter slug only — no per-sport colors. */
export function useSelectedSportColor() {
  const slug = useState<string>('page-sport-slug', () => '')

  function sync(_sports: Sport[] | null | undefined, slugVal: string) {
    slug.value = slugVal
  }

  function toggle(_sports: Sport[] | null | undefined, slugVal: string) {
    slug.value = slug.value === slugVal ? '' : slugVal
  }

  return { slug, sync, toggle }
}
