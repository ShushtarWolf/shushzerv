<script setup lang="ts">
const localePath = useLocalePath()
const { loggedIn, user, clear } = useUserSession()

const nav = computed(() => [
  { to: localePath('/'), label: 'nav.home' },
  { to: localePath('/explore'), label: 'nav.explore' },
  { to: localePath('/clubs'), label: 'nav.clubs' },
  { to: localePath('/coaches'), label: 'nav.coaches' },
  { to: localePath('/news'), label: 'nav.news' },
])

const dashboardPath = computed(() => {
  const role = (user.value as { role?: string } | null)?.role
  if (role === 'COACH') return localePath('/dashboard/coach')
  if (role === 'CLUB_ADMIN') return localePath('/dashboard/club')
  return localePath('/dashboard')
})

async function logout() {
  await clear()
  await navigateTo(localePath('/'))
}
</script>

<template>
  <header class="glass-bar sticky top-0 z-40 pt-[var(--sz-safe-top)]">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
      <BrandLogo />

      <nav class="hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="rounded-full px-3 py-2 text-sm font-medium text-brand-gray-600 transition hover:bg-white/60 hover:text-brand-gray-900"
          active-class="bg-white/70 text-brand-gray-900"
        >
          {{ $t(item.label) }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <LocaleSwitcher class="hidden sm:flex" />
        <template v-if="loggedIn">
          <NuxtLink :to="dashboardPath" class="hidden rounded-full bg-white/70 px-3 py-2 text-sm font-semibold text-brand-gray-900 sm:inline-flex tap-highlight">
            {{ $t('nav.dashboard') }}
          </NuxtLink>
          <button class="ios-btn-secondary px-3 py-2 text-sm" @click="logout">{{ $t('auth.logout') }}</button>
        </template>
        <template v-else>
          <NuxtLink :to="localePath('/login')" class="ios-btn-primary px-4 py-2 text-sm">
            {{ $t('auth.login') }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>
