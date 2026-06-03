import type { UseFetchOptions } from '#app'

/** Avoid SSR deadlock when calling this app's own API routes. */
export function useApiFetch<T>(url: string | (() => string), options?: UseFetchOptions<T>) {
  return useFetch<T>(url, {
    ...options,
    $fetch: useRequestFetch(),
  })
}
