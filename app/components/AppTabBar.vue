<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { loggedIn } = useUserSession()

const tabs = computed(() => [
  { to: localePath('/'), label: t('nav.home'), icon: 'home' },
  { to: localePath('/explore'), label: t('nav.explore'), icon: 'search' },
  { to: localePath('/clubs'), label: t('nav.clubs'), icon: 'clubs' },
  { to: localePath('/news'), label: t('nav.news'), icon: 'news' },
  { to: loggedIn.value ? localePath('/dashboard') : localePath('/login'), label: loggedIn.value ? t('nav.profile') : t('nav.login'), icon: 'profile' },
])
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-40 glass-bar border-t border-black/5"
    style="padding-bottom: var(--sz-safe-bottom)"
  >
    <div class="grid grid-cols-5">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.icon"
        :to="tab.to"
        class="flex flex-col items-center justify-center gap-1 py-2.5 text-brand-gray-500 tap-highlight"
        active-class="text-brand-blue"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="tab.icon === 'home'"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></template>
          <template v-else-if="tab.icon === 'search'"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></template>
          <template v-else-if="tab.icon === 'clubs'"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></template>
          <template v-else-if="tab.icon === 'news'"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></template>
          <template v-else><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></template>
        </svg>
        <span class="text-[0.65rem] font-medium">{{ tab.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
