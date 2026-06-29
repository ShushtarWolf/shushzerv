export interface AdminSidebarTab {
  id: string
  label: string
  icon?: string
  group?: string
}

interface AdminSidebarState {
  tabs: AdminSidebarTab[]
  activeTabId: string
}

const SIDEBAR_STATE_KEY = 'admin-sidebar'

export function provideAdminSidebar(
  tabs: MaybeRefOrGetter<AdminSidebarTab[]>,
  activeTab: Ref<string>,
) {
  const sidebar = useState<AdminSidebarState | null>(SIDEBAR_STATE_KEY, () => null)

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

export function useAdminSidebar() {
  return useState<AdminSidebarState | null>(SIDEBAR_STATE_KEY, () => null)
}
