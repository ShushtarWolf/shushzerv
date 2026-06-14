<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { loggedIn, user, clear } = useUserSession()
const { dashboardPath } = useDashboardPath()

const showMore = ref(false)
const showMobileNav = ref(false)

const primaryLinks = computed(() => [
  { to: localePath('/'), label: t('nav.home') },
  { to: localePath('/explore'), label: t('nav.explore') },
  { to: localePath('/clubs'), label: t('nav.clubs') },
  { to: localePath('/matches'), label: t('nav.matches') },
])

const moreLinks = computed(() => [
  { to: localePath('/classes'), label: t('nav.classes') },
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
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex rounded-lg p-2 text-brand-gray-700 hover:bg-brand-gray-100 md:hidden"
          :aria-label="t('nav.menu')"
          @click="showMobileNav = !showMobileNav"
        >
          <SzIcon :name="showMobileNav ? 'close' : 'menu'" />
        </button>
        <ShushLogo />
      </div>

      <nav class="hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="link in primaryLinks"
          :key="link.to"
          :to="link.to"
          class="rounded-lg px-3 py-2 text-sm font-semibold text-brand-gray-600 transition hover:bg-brand-gray-100 hover:text-brand-gray-900"
          active-class="!text-brand-orange"
        >
          {{ link.label }}
        </NuxtLink>
        <div class="relative">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-brand-gray-600 hover:bg-brand-gray-100"
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

      <div class="flex items-center gap-1.5 sm:gap-2">
        <LocaleSwitcher />
        <NuxtLink :to="localePath('/clubs')" class="hidden sm:inline-flex ios-btn-secondary py-2 px-4 text-sm">
          {{ t('nav.book') }}
        </NuxtLink>
        <template v-if="loggedIn">
          <NuxtLink :to="dashboardPath" class="hidden sm:inline-flex ios-btn-ghost py-2 px-3 text-sm">
            {{ user?.name?.split(' ')[0] || t('nav.dashboard') }}
          </NuxtLink>
          <button class="ios-btn-ghost py-2 px-3 text-sm" @click="logout">{{ t('nav.logout') }}</button>
        </template>
        <template v-else>
          <NuxtLink :to="localePath('/login')" class="ios-btn-ghost py-2 px-3 text-sm">
            {{ t('nav.login') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/register')" class="ios-btn-primary py-2 px-4 text-sm">
            {{ t('nav.register') }}
          </NuxtLink>
        </template>
      </div>
    </div>

    <nav
      v-if="showMobileNav"
      class="border-t border-black/5 bg-white/95 px-4 py-3 md:hidden"
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
