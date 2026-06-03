<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { loggedIn, user, clear } = useUserSession()

const navLinks = computed(() => [
  { to: '/', label: t('nav.home') },
  { to: '/explore', label: t('nav.explore') },
  { to: '/clubs', label: t('nav.clubs') },
  { to: '/coaches', label: t('nav.coaches') },
  { to: '/news', label: t('nav.news') },
])

async function logout() {
  await clear()
  await navigateTo(localePath('/'))
}
</script>

<template>
  <header class="glass-bar sticky top-0 z-40" :style="{ paddingTop: 'var(--sz-safe-top)' }">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <ShushzervLogo />

      <nav class="hidden md:flex items-center gap-1">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="localePath(link.to)"
          class="rounded-full px-3 py-2 text-sm font-medium text-sz-gray-600 transition hover:bg-white/60 hover:text-sz-gray-900"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <LocaleSwitcher />
        <template v-if="loggedIn">
          <NuxtLink :to="localePath('/dashboard')" class="hidden sm:inline-flex rounded-full px-3 py-2 text-sm font-medium text-sz-blue hover:bg-sz-accent-soft">
            {{ user?.name || t('nav.dashboard') }}
          </NuxtLink>
          <button class="ios-btn-secondary !px-3 !py-2 text-sm" @click="logout">{{ t('nav.logout') }}</button>
        </template>
        <template v-else>
          <NuxtLink :to="localePath('/login')" class="ios-btn-primary !px-4 !py-2 text-sm">
            {{ t('nav.login') }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>
