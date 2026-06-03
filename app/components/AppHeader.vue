<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { loggedIn, user, clear } = useUserSession()

const navLinks = computed(() => [
  { to: localePath('/'), label: t('nav.home') },
  { to: localePath('/explore'), label: t('nav.explore') },
  { to: localePath('/clubs'), label: t('nav.clubs') },
  { to: localePath('/coaches'), label: t('nav.coaches') },
  { to: localePath('/news'), label: t('nav.news') },
])

async function logout() {
  await clear()
  await navigateTo(localePath('/'))
}
</script>

<template>
  <header class="sticky top-0 z-40 glass-bar">
    <div class="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
      <ShushLogo />

      <nav class="hidden md:flex items-center gap-1">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="px-3 py-2 rounded-lg text-sm font-medium text-brand-gray-600 hover:text-brand-gray-900 hover:bg-brand-gray-100 transition-colors"
          active-class="text-brand-blue"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <LocaleSwitcher />
        <template v-if="loggedIn">
          <NuxtLink :to="localePath('/dashboard')" class="hidden sm:inline-flex ios-btn-ghost py-2 px-3 text-sm">
            {{ user?.name?.split(' ')[0] || t('nav.dashboard') }}
          </NuxtLink>
          <button class="ios-btn-ghost py-2 px-3 text-sm" @click="logout">{{ t('nav.logout') }}</button>
        </template>
        <template v-else>
          <NuxtLink :to="localePath('/login')" class="ios-btn-primary py-2 px-4 text-sm">
            {{ t('nav.login') }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>
