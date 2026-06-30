export interface DashboardShellConfig {
  subtitle: string
  homeLink: string
  showSearch?: boolean
}

const CONFIG_KEY = 'dashboard-shell-config'

export function provideDashboardShellConfig(config: MaybeRefOrGetter<DashboardShellConfig>) {
  const shellConfig = useState<DashboardShellConfig>(CONFIG_KEY, () => toValue(config))

  watch(
    () => toValue(config),
    (v) => {
      shellConfig.value = v
    },
    { deep: true },
  )

  onScopeDispose(() => {
    shellConfig.value = { subtitle: '', homeLink: '/', showSearch: true }
  })
}

export function useDashboardShellConfig() {
  return useState<DashboardShellConfig>(CONFIG_KEY, () => ({
    subtitle: '',
    homeLink: '/',
    showSearch: true,
  }))
}
