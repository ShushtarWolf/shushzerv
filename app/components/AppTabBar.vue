<script setup lang="ts">
const localePath = useLocalePath()
const { loggedIn } = useUserSession()

const tabs = computed(() => [
  { to: localePath('/'), label: 'nav.home', icon: 'home' },
  { to: localePath('/explore'), label: 'nav.explore', icon: 'search' },
  { to: localePath('/clubs'), label: 'nav.clubs', icon: 'pin' },
  { to: localePath('/news'), label: 'nav.news', icon: 'news' },
  {
    to: loggedIn.value ? localePath('/dashboard') : localePath('/login'),
    label: loggedIn.value ? 'nav.dashboard' : 'auth.login',
    icon: 'user',
  },
])

const paths: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 9.5V21h14V9.5',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  pin: 'M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  news: 'M4 5h16v14H4zM8 9h8M8 13h8M8 17h5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-5 8-5s8 1.7 8 5',
}
</script>

<template>
  <nav
    class="glass-bar fixed inset-x-0 bottom-0 z-40 border-t pb-[var(--sz-safe-bottom)] md:hidden"
  >
    <div class="mx-auto grid max-w-md grid-cols-5">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to + tab.label"
        :to="tab.to"
        class="flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium text-brand-gray-500 transition"
        active-class="text-brand-blue"
      >
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path :d="paths[tab.icon]" />
        </svg>
        <span>{{ $t(tab.label) }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
