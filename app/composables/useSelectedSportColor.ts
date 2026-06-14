import type { Sport } from '~/types'

export function useSelectedSportColor() {
  const slug = useState<string>('page-sport-slug', () => '')
  const color = useState<string>('page-sport-color', () => '')

  function sync(sports: Sport[] | null | undefined, slugVal: string) {
    slug.value = slugVal
    if (!slugVal) {
      color.value = ''
      return
    }
    color.value = sports?.find((s) => s.slug === slugVal)?.color ?? ''
  }

  function toggle(sports: Sport[] | null | undefined, slugVal: string) {
    sync(sports, slug.value === slugVal ? '' : slugVal)
  }

  const active = computed(() => color.value || null)

  return { slug, color: active, sync, toggle }
}
