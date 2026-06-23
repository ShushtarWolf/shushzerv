export function useDashboardTab(defaultTab = 'overview') {
  const route = useRoute()
  const router = useRouter()
  const tab = ref(String(route.query.tab ?? defaultTab))

  watch(
    () => route.query.tab,
    (value) => {
      const next = String(value ?? defaultTab)
      if (next !== tab.value) tab.value = next
    },
  )

  watch(tab, (value) => {
    const current = route.query.tab ? String(route.query.tab) : defaultTab
    if (value === current) return
    router.replace({
      query: {
        ...route.query,
        tab: value === defaultTab ? undefined : value,
      },
    })
  })

  return tab
}
