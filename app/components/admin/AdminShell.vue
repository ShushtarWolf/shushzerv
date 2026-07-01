<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const { loggedIn, user, clear } = useUserSession()
const { displayName } = useUserDisplayName()
const adminNav = useAdminSidebar()
const dashboardNav = useDashboardSidebar()
const routeTabs = useDashboardNavTabsForRoute()
const shellConfig = useDashboardShellConfig()
const { showFindPlayers } = useFeatures()

const sidebarNav = computed(() => {
  const provided = adminNav.value ?? dashboardNav.value
  const tabs = provided?.tabs?.length ? provided.tabs : routeTabs.value
  if (!tabs.length) return null
  const raw = route.query.tab
  const fromQuery = Array.isArray(raw) ? raw[0] : raw
  const activeTabId = provided?.activeTabId ?? (fromQuery ? String(fromQuery) : 'overview')
  return { tabs, activeTabId }
})

const sidebarOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<Array<{ type: string; label: string; link: string }>>([])
const searchPending = ref(false)

const subtitle = computed(() => {
  if (shellConfig.value?.subtitle) return shellConfig.value.subtitle
  if (user.value?.role === 'PLATFORM_ADMIN') return t('dashboard.platformAdmin')
  if (user.value?.role === 'CLUB_ADMIN') return t('dashboard.clubAdmin')
  if (user.value?.role === 'COACH') return t('dashboard.coach')
  return t('dashboard.athlete')
})

const homeLink = computed(() => {
  if (shellConfig.value?.homeLink) return localePath(shellConfig.value.homeLink)
  if (user.value?.role === 'PLATFORM_ADMIN') return localePath('/dashboard/admin')
  if (user.value?.role === 'CLUB_ADMIN') return localePath('/dashboard/club')
  if (user.value?.role === 'COACH') return localePath('/dashboard/coach')
  return localePath('/dashboard')
})

const showSearch = computed(() => shellConfig.value?.showSearch !== false && user.value?.role !== 'PLATFORM_ADMIN')

const asideClass = computed(() => {
  if (sidebarOpen.value) return 'max-lg:translate-x-0'
  return 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'
})

const navGroupEntries = computed(() => {
  const tabs = sidebarNav.value?.tabs ?? []
  const groups = new Map<string, typeof tabs>()
  for (const tab of tabs) {
    const group = ('group' in tab ? tab.group : undefined) ?? 'general'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(tab)
  }
  return Array.from(groups.entries())
})

const groupLabels: Record<string, string> = {
  general: 'admin.navGeneral',
  account: 'admin.navAccount',
  business: 'admin.navBusiness',
  manage: 'admin.navManage',
  operations: 'admin.navOperations',
  content: 'admin.navContent',
}

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch { /* session may already be cleared */ }
  await clear()
  await navigateTo(localePath('/'))
}

function selectSidebarTab(id: string) {
  if (sidebarNav.value) sidebarNav.value.activeTabId = id
  router.replace({ query: { ...route.query, tab: id === 'overview' ? undefined : id } })
  closeSidebar()
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (q) => {
  if (!showSearch.value) return
  if (searchTimer) clearTimeout(searchTimer)
  if (!q.trim()) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searchPending.value = true
    try {
      const res = await $fetch<{ results: Array<{ type: string; label: string; link: string }> }>('/api/dashboard/search', { query: { q } })
      searchResults.value = res.results
    } finally {
      searchPending.value = false
    }
  }, 300)
})

function goToResult(link: string) {
  navigateTo(localePath(link))
  searchQuery.value = ''
  searchResults.value = []
}

watch(() => route.path, closeSidebar)
</script>

<template>
  <div class="admin-shell min-h-dvh md:flex">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      aria-hidden="true"
      @click="closeSidebar"
    />

    <aside
      class="admin-sidebar z-50 flex w-[15.5rem] min-w-[15.5rem] shrink-0 flex-col transition-transform duration-200 max-lg:fixed max-lg:inset-y-0 ltr:max-lg:left-0 rtl:max-lg:right-0 md:relative md:min-h-dvh md:translate-x-0"
      :class="asideClass"
    >
      <div class="flex items-center gap-2.5 px-4 py-4">
        <NuxtLink
          :to="homeLink"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#95BF47] tap-highlight"
          @click="closeSidebar"
        >
          <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" aria-hidden="true">
            <path d="M12 2.5C8.41 2.5 5.5 5.41 5.5 9c0 3.94 6.5 11.25 6.5 11.25S18.5 12.94 18.5 9c0-3.59-2.91-6.5-6.5-6.5Z" fill="#fff" opacity="0.95" />
            <circle cx="12" cy="9" r="2.6" fill="#1a1a1a" />
          </svg>
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[0.8125rem] font-semibold text-white">IN BOX S</p>
          <p class="truncate text-[0.6875rem] text-[#b5b5b5]">{{ subtitle }}</p>
        </div>
        <button
          type="button"
          class="admin-icon-btn shrink-0 md:hidden"
          :aria-label="t('common.close')"
          @click="closeSidebar"
        >
          <SzIcon name="close" />
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 pb-4">
        <template v-for="[group, items] in navGroupEntries" :key="group">
          <p v-if="navGroupEntries.length > 1 || group !== 'general'" class="admin-nav-group">{{ t(groupLabels[group] ?? group) }}</p>
          <div class="mb-2 flex flex-col gap-0.5">
            <button
              v-for="item in items"
              :key="item.id"
              type="button"
              class="admin-nav-item"
              :class="{ 'admin-nav-item-active': sidebarNav?.activeTabId === item.id }"
              @click="selectSidebarTab(item.id)"
            >
              <DashboardNavIcon :name="item.icon ?? 'grid'" class="h-[1.125rem] w-[1.125rem]" />
              <span class="min-w-0 flex-1 truncate text-start">{{ item.label }}</span>
            </button>
          </div>
        </template>
      </nav>

      <div v-if="showFindPlayers" class="mx-2 mb-3 rounded-lg bg-white/5 p-3">
        <p class="text-xs font-semibold text-white">{{ t('dashboard.referralTitle') }}</p>
        <p class="mt-1 text-[0.6875rem] text-[#b5b5b5]">{{ t('dashboard.referralDesc') }}</p>
        <NuxtLink :to="localePath('/matches')" class="mt-2 inline-flex rounded-md bg-[#008060] px-3 py-1.5 text-[0.6875rem] font-semibold text-white" @click="closeSidebar">
          {{ t('matches.title') }}
        </NuxtLink>
      </div>

      <div class="border-t border-white/10 px-2 py-3">
        <NuxtLink
          :to="localePath('/')"
          class="admin-nav-item text-[#b5b5b5] hover:text-white"
          @click="closeSidebar"
        >
          <DashboardNavIcon name="home" class="h-[1.125rem] w-[1.125rem]" />
          <span>{{ t('admin.backToStore') }}</span>
        </NuxtLink>
        <button
          type="button"
          class="admin-nav-item w-full text-[#e57373] hover:bg-white/5 hover:text-[#ef9a9a]"
          @click="logout"
        >
          <DashboardNavIcon name="logout" class="h-[1.125rem] w-[1.125rem]" />
          <span>{{ t('nav.logout') }}</span>
        </button>
      </div>

      <div v-if="loggedIn" class="border-t border-white/10 px-4 py-3">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#303030] text-xs font-semibold text-white">
            {{ displayName?.charAt(0)?.toUpperCase() ?? '?' }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[0.8125rem] font-medium text-white">{{ displayName }}</p>
            <p class="truncate text-[0.6875rem] text-[#b5b5b5]">{{ user?.email }}</p>
          </div>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="admin-topbar sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            class="admin-icon-btn-light shrink-0 md:hidden"
            :aria-label="t('nav.menu')"
            :aria-expanded="sidebarOpen"
            @click="toggleSidebar"
          >
            <SzIcon :name="sidebarOpen ? 'close' : 'menu'" />
          </button>
          <div v-if="showSearch" class="relative min-w-0 flex-1 sm:max-w-md">
            <SzIcon name="search" class="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-subtle,#8a8a8a)]" />
            <input
              v-model="searchQuery"
              type="search"
              class="w-full rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white py-2 ps-9 pe-3 text-sm text-[var(--admin-text,#303030)] placeholder:text-[var(--admin-subtle,#8a8a8a)] focus:border-[#008060] focus:outline-none focus:ring-1 focus:ring-[#008060]"
              :placeholder="t('dashboard.searchPlaceholder')"
              @keydown.enter="searchResults[0] && goToResult(searchResults[0].link)"
            />
            <div v-if="searchResults.length" class="absolute inset-x-0 top-full z-50 mt-1 rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white p-1 shadow-lg">
              <button
                v-for="(r, i) in searchResults"
                :key="i"
                type="button"
                class="block w-full rounded-md px-3 py-2 text-start text-sm hover:bg-[#fafafa]"
                @click="goToResult(r.link)"
              >
                {{ r.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <NotificationBell />
          <LocaleSwitcher />
        </div>
      </header>

      <main class="admin-main flex-1 px-4 pb-8 sm:px-5 lg:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>
