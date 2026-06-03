<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { loggedIn } = useUserSession()

const tabs = computed(() => [
  { to: '/', label: t('nav.home'), icon: 'home' },
  { to: '/explore', label: t('nav.explore'), icon: 'explore' },
  { to: '/clubs', label: t('nav.clubs'), icon: 'clubs' },
  { to: '/news', label: t('nav.news'), icon: 'news' },
  { to: loggedIn.value ? '/dashboard' : '/login', label: loggedIn.value ? t('nav.dashboard') : t('nav.login'), icon: 'profile' },
])

const paths: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9',
  explore: 'M12 12 9 9m6 6-3-3m9 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  clubs: 'M4 20V8l8-5 8 5v12M9 20v-6h6v6',
  news: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
}
</script>

<template>
  <nav
    class="glass-bar fixed inset-x-0 bottom-0 z-40 md:hidden"
    :style="{ paddingBottom: 'var(--sz-safe-bottom)' }"
  >
    <div class="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="localePath(tab.to)"
        class="flex flex-1 flex-col items-center gap-1 rounded-xl py-1 text-[0.65rem] font-medium text-sz-gray-500 transition"
        active-class="text-sz-blue"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <path :d="paths[tab.icon]" />
        </svg>
        {{ tab.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
