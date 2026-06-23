<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { loggedIn } = useUserSession()
const { dashboardPath } = useDashboardPath()

const tabs = computed(() => [
  { to: localePath('/'), label: t('nav.home'), icon: 'home' },
  { to: localePath('/explore'), label: t('nav.explore'), icon: 'explore' },
  { to: localePath('/clubs?book=1'), label: t('nav.book'), icon: 'book', center: true },
  { to: localePath('/matches'), label: t('nav.matches'), icon: 'matches' },
  { to: loggedIn.value ? dashboardPath.value : localePath('/login'), label: loggedIn.value ? t('nav.profile') : t('nav.login'), icon: 'profile' },
])
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 backdrop-blur-xl md:hidden"
    style="padding-bottom: var(--sz-safe-bottom)"
  >
    <div class="grid grid-cols-5">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.icon"
        :to="tab.to"
        class="relative flex flex-col items-center justify-center gap-0.5 py-2 tap-highlight"
        :class="tab.center ? '-mt-3' : 'text-brand-gray-500'"
        active-class="!text-brand-orange"
      >
        <span
          v-if="tab.center"
          class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-brand-primary shadow-lifted"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 14h8" /></svg>
        </span>
        <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="tab.icon === 'home'"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></template>
          <template v-else-if="tab.icon === 'explore'"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></template>
          <template v-else-if="tab.icon === 'matches'"><circle cx="9" cy="8" r="3" /><circle cx="15" cy="8" r="3" /><path d="M4 20v-1a5 5 0 0 1 10 0v1" /></template>
          <template v-else><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></template>
        </svg>
        <span class="text-[0.6rem] font-bold" :class="tab.center ? 'text-brand-orange' : ''">{{ tab.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
