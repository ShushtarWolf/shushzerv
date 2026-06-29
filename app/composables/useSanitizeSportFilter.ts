import type { Sport } from '~/types'

/** Clears sport filter when it is not in the visible sports list (e.g. stale ?sport=football URL). */
export function useSanitizeSportFilter(
  sportFilter: Ref<string>,
  sports: Ref<Sport[] | null | undefined>,
) {
  watch(
    [sportFilter, sports],
    () => {
      if (!sportFilter.value) return
      const list = sports.value ?? []
      if (!list.some((s) => s.slug === sportFilter.value)) {
        sportFilter.value = ''
      }
    },
    { immediate: true },
  )
}
