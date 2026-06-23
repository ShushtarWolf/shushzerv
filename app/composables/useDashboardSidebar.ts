export interface DashboardSidebarTab {
  id: string
  label: string
  icon?: string
}

interface DashboardSidebarState {
  tabs: DashboardSidebarTab[]
  activeTabId: string
}

const SIDEBAR_STATE_KEY = 'dashboard-sidebar'

export function provideDashboardSidebar(
  tabs: MaybeRefOrGetter<DashboardSidebarTab[]>,
  activeTab: Ref<string>,
) {
  const sidebar = useState<DashboardSidebarState | null>(SIDEBAR_STATE_KEY, () => null)

  function sync() {
    sidebar.value = {
      tabs: toValue(tabs),
      activeTabId: activeTab.value,
    }
  }

  sync()

  watch([() => toValue(tabs), activeTab], () => {
    if (!sidebar.value) {
      sync()
      return
    }
    sidebar.value.tabs = toValue(tabs)
    sidebar.value.activeTabId = activeTab.value
  })

  watch(
    () => sidebar.value?.activeTabId,
    (id) => {
      if (id && id !== activeTab.value) activeTab.value = id
    },
  )

  onScopeDispose(() => {
    sidebar.value = null
  })
}

export function useDashboardSidebar() {
  return useState<DashboardSidebarState | null>(SIDEBAR_STATE_KEY, () => null)
}
