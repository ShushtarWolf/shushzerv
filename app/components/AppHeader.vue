<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { loggedIn, user, clear } = useUserSession()
const { dashboardPath } = useDashboardPath()
const { firstName } = useUserDisplayName()
const { showGroupClasses, showFindPlayers } = useFeatures()

const showMore = ref(false)
const showMobileNav = ref(false)

const primaryLinks = computed(() => [
  { to: localePath('/'), label: t('nav.home') },
  { to: localePath('/explore'), label: t('nav.explore') },
  { to: localePath('/clubs'), label: t('nav.clubs') },
  ...(showGroupClasses.value ? [{ to: localePath('/classes'), label: t('nav.classes') }] : []),
  ...(showFindPlayers.value ? [{ to: localePath('/matches'), label: t('nav.matches') }] : []),
  { to: localePath('/tournaments'), label: t('tournaments.title') },
])

const moreLinks = computed(() => [
  { to: localePath('/coaches'), label: t('nav.coaches') },
  { to: localePath('/news'), label: t('nav.news') },
  { to: localePath('/chat'), label: t('nav.chat') },
])

const mobileLinks = computed(() => [...primaryLinks.value, ...moreLinks.value])

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch { /* session may already be cleared */ }
  await clear()
  await navigateTo(localePath('/'))
}

function closeMobileNav() {
  showMobileNav.value = false
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="inline-flex rounded-lg p-2 text-brand-gray-700 hover:bg-brand-gray-100 lg:hidden"
          :aria-label="t('nav.menu')"
          @click="showMobileNav = !showMobileNav"
        >
          <SzIcon :name="showMobileNav ? 'close' : 'menu'" />
        </button>
        <InBoxLogo />
      </div>

      <nav class="hidden shrink-0 items-center gap-0.5 lg:flex">
        <NuxtLink
          v-for="link in primaryLinks"
          :key="link.to"
          :to="link.to"
          class="rounded-lg px-2.5 py-2 text-sm font-semibold text-brand-gray-600 transition hover:bg-brand-gray-100 hover:text-brand-gray-900 xl:px-3"
          active-class="!text-brand-orange"
        >
          {{ link.label }}
        </NuxtLink>
        <div class="relative">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-semibold text-brand-gray-600 hover:bg-brand-gray-100 xl:px-3"
            @click="showMore = !showMore"
          >
            {{ t('nav.more') }}
            <SzIcon name="chevron-down" size="sm" />
          </button>
          <div v-if="showMore" class="absolute top-full mt-1 min-w-[10rem] rounded-xl bg-white py-1 shadow-float ltr:right-0 rtl:left-0">
            <NuxtLink
              v-for="link in moreLinks"
              :key="link.to"
              :to="link.to"
              class="block px-4 py-2 text-sm font-medium text-brand-gray-700 hover:bg-brand-gray-50"
              @click="showMore = false"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </nav>

      <div class="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <GlobalSearch />
        <LocaleSwitcher />
        <NotificationBell />
        <SzButton :to="localePath('/clubs?book=1')" variant="secondary" size="sm" class="hidden sm:inline-flex">
          {{ t('nav.book') }}
        </SzButton>
        <template v-if="loggedIn">
          <SzButton :to="dashboardPath" variant="ghost" size="sm" class="hidden sm:inline-flex">
            {{ firstName || t('nav.dashboard') }}
          </SzButton>
          <SzButton variant="ghost" size="sm" @click="logout">{{ t('nav.logout') }}</SzButton>
        </template>
        <template v-else>
          <SzButton :to="localePath('/login')" variant="ghost" size="sm">
            {{ t('nav.login') }}
          </SzButton>
          <SzButton :to="localePath('/register')" size="sm">
            {{ t('nav.register') }}
          </SzButton>
        </template>
      </div>
    </div>

    <nav
      v-if="showMobileNav"
      class="border-t border-black/5 bg-white/95 px-4 py-3 lg:hidden"
    >
      <div class="mx-auto max-w-7xl space-y-1">
        <NuxtLink
          v-for="link in mobileLinks"
          :key="link.to"
          :to="link.to"
          class="block rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-gray-700 hover:bg-brand-gray-50"
          active-class="!text-brand-orange !bg-brand-orange/5"
          @click="closeMobileNav"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>
