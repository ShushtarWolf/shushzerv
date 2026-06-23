<script setup lang="ts">
import type { Coach } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const { loggedIn, user, clear } = useUserSession()
const { displayName } = useUserDisplayName()
const sidebarNav = useDashboardSidebar()

const sidebarOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<Array<{ type: string; label: string; link: string }>>([])
const searchPending = ref(false)
const coachPublicProfileId = ref<string | null>(null)

watch(() => user.value?.role, async (role) => {
  if (role === 'COACH' && user.value?.id) {
    try {
      const list = await $fetch<Coach[]>('/api/coaches')
      coachPublicProfileId.value = list.find((c) => c.userId === user.value?.id)?.id ?? null
    } catch {
      coachPublicProfileId.value = null
    }
  } else {
    coachPublicProfileId.value = null
  }
}, { immediate: true })

const navLinks = computed(() => [
  { to: localePath('/'), label: t('nav.home'), icon: 'home' },
  { to: localePath('/explore'), label: t('nav.explore'), icon: 'search' },
])

const roleLabel = computed(() => {
  const role = user.value?.role
  if (role === 'CLUB_ADMIN') return t('dashboard.clubAdmin')
  if (role === 'COACH') return t('dashboard.coach')
  if (role === 'PLATFORM_ADMIN') return t('dashboard.platformAdmin')
  return t('dashboard.athlete')
})

const asideClass = computed(() => {
  if (sidebarOpen.value) return 'max-lg:translate-x-0'
  return 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'
})

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
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
  <div class="fd-shell min-h-dvh md:flex">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-fd-navy/30 backdrop-blur-sm md:hidden"
      aria-hidden="true"
      @click="closeSidebar"
    />

    <aside
      class="z-50 flex w-[17.5rem] shrink-0 flex-col border-fd-primary/5 bg-white p-5 shadow-fd transition-transform duration-300 ltr:border-r rtl:border-l max-lg:fixed max-lg:inset-y-0 ltr:max-lg:left-0 rtl:max-lg:right-0 md:relative md:min-h-dvh md:translate-x-0 md:shadow-none"
      :class="asideClass"
    >
      <div class="mb-8 flex items-center gap-3">
        <NuxtLink :to="localePath('/')" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fd-primary-soft tap-highlight" @click="closeSidebar">
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" aria-hidden="true">
            <path d="M12 2.5C8.41 2.5 5.5 5.41 5.5 9c0 3.94 6.5 11.25 6.5 11.25S18.5 12.94 18.5 9c0-3.59-2.91-6.5-6.5-6.5Z" fill="#2C4A6E" opacity="0.95" />
            <circle cx="12" cy="9" r="2.6" fill="#868CFF" />
          </svg>
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <p class="truncate text-lg font-black text-fd-navy">Shushzerv</p>
          <p class="truncate text-xs font-semibold text-fd-muted">{{ t('dashboard.title') }}</p>
        </div>
        <button
          type="button"
          class="fd-icon-btn shrink-0 md:hidden"
          :aria-label="t('common.close')"
          @click="closeSidebar"
        >
          <SzIcon name="close" />
        </button>
      </div>

      <p class="mb-3 px-2 text-xs font-bold uppercase tracking-[0.14em] text-fd-muted">{{ t('dashboard.mainMenu') }}</p>
      <nav class="flex flex-col gap-1">
        <NuxtLink
          v-if="user?.role === 'COACH' && coachPublicProfileId"
          :to="localePath(`/coaches/${coachPublicProfileId}`)"
          class="fd-nav-item hover:bg-[#F5F5F4] hover:text-fd-navy"
          @click="closeSidebar"
        >
          <DashboardNavIcon name="building" />
          <span>{{ t('dashboard.viewPublicProfile') }}</span>
        </NuxtLink>
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="fd-nav-item"
          :class="isActive(link.to) ? 'fd-nav-item-active' : 'hover:bg-[#F5F5F4] hover:text-fd-navy'"
          @click="closeSidebar"
        >
          <DashboardNavIcon :name="link.icon" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>

      <template v-if="sidebarNav">
        <p class="mb-3 mt-6 px-2 text-xs font-bold uppercase tracking-[0.14em] text-fd-muted">{{ t('dashboard.sections') }}</p>
        <nav class="flex flex-col gap-1">
          <button
            v-for="item in sidebarNav.tabs"
            :key="item.id"
            type="button"
            class="fd-nav-item w-full text-start"
            :class="sidebarNav.activeTabId === item.id ? 'fd-nav-item-active' : 'hover:bg-[#F5F5F4] hover:text-fd-navy'"
            @click="selectSidebarTab(item.id)"
          >
            <DashboardNavIcon :name="item.icon ?? 'grid'" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </template>

      <div class="mt-6 rounded-[1.25rem] bg-[#F5F5F4] p-4">
        <p class="text-sm font-bold text-fd-navy">{{ t('dashboard.referralTitle') }}</p>
        <p class="mt-1 text-xs text-fd-muted">{{ t('dashboard.referralDesc') }}</p>
        <NuxtLink :to="localePath('/matches')" class="mt-3 inline-flex rounded-xl bg-fd-primary px-4 py-2 text-xs font-bold text-white tap-highlight" @click="closeSidebar">
          {{ t('matches.title') }}
        </NuxtLink>
      </div>

      <nav class="mt-5 flex flex-col gap-1">
        <button
          type="button"
          class="fd-nav-item text-fd-danger hover:bg-fd-danger/10"
          @click="logout"
        >
          <DashboardNavIcon name="logout" />
          <span>{{ t('nav.logout') }}</span>
        </button>
      </nav>

      <div v-if="loggedIn" class="mt-auto flex items-center gap-3 rounded-2xl bg-[#F5F5F4] p-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fd-primary text-sm font-bold text-white">
          {{ displayName?.charAt(0)?.toUpperCase() ?? '?' }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-fd-navy">{{ displayName }}</p>
          <p class="truncate text-xs text-fd-muted">{{ roleLabel }}</p>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-fd-primary/5 bg-[#F5F5F4]/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div class="flex min-w-0 items-center gap-3">
          <button
            type="button"
            class="fd-icon-btn shrink-0 md:hidden"
            :aria-label="t('nav.menu')"
            :aria-expanded="sidebarOpen"
            @click="toggleSidebar"
          >
            <SzIcon :name="sidebarOpen ? 'close' : 'menu'" />
          </button>
          <div class="relative min-w-0 flex-1 sm:max-w-md lg:min-w-[14rem]">
            <SzIcon name="search" class="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fd-muted" />
            <input
              v-model="searchQuery"
              type="search"
              class="fd-input !py-2.5 ps-11"
              :placeholder="t('dashboard.searchPlaceholder')"
              @keydown.enter="searchResults[0] && goToResult(searchResults[0].link)"
            />
            <div v-if="searchResults.length" class="absolute inset-x-0 top-full z-50 mt-1 rounded-xl border border-fd-primary/10 bg-white p-2 shadow-fd">
              <button
                v-for="(r, i) in searchResults"
                :key="i"
                type="button"
                class="block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-[#F5F5F4]"
                @click="goToResult(r.link)"
              >
                {{ r.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationBell />
          <LocaleSwitcher />
          <div v-if="loggedIn" class="hidden items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-fd-soft sm:flex">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-fd-primary text-xs font-bold text-white">
              {{ displayName?.charAt(0)?.toUpperCase() ?? '?' }}
            </div>
            <div class="min-w-0 text-start">
              <p class="truncate text-sm font-bold text-fd-navy">{{ displayName }}</p>
              <p class="truncate text-xs text-fd-muted">{{ roleLabel }}</p>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
