<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <footer class="mt-16 border-t border-black/5 bg-white/40 px-4 py-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div class="space-y-2">
        <ShushzervLogo />
        <p class="ios-footnote max-w-xs">{{ t('brand.tagline') }}</p>
      </div>
      <nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-sz-gray-600">
        <NuxtLink :to="localePath('/about')" class="hover:text-sz-gray-900">{{ t('footer.about') }}</NuxtLink>
        <NuxtLink :to="localePath('/clubs')" class="hover:text-sz-gray-900">{{ t('footer.clubs') }}</NuxtLink>
        <NuxtLink :to="localePath('/coaches')" class="hover:text-sz-gray-900">{{ t('footer.coaches') }}</NuxtLink>
        <a href="mailto:hello@shushzerv.local" class="hover:text-sz-gray-900">{{ t('footer.contact') }}</a>
      </nav>
    </div>
    <p class="mx-auto mt-6 max-w-6xl ios-footnote">© {{ new Date().getFullYear() }} {{ t('brand.name') }}. {{ t('footer.rights') }}</p>
  </footer>
</template>
