<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="hidden md:block border-t border-black/5 mt-12">
    <div class="mx-auto max-w-6xl px-4 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div class="space-y-2">
        <ShushLogo />
        <p class="ios-footnote max-w-xs">{{ t('brand.tagline') }}</p>
      </div>
      <nav class="flex flex-wrap gap-6 text-sm text-brand-gray-600">
        <NuxtLink :to="localePath('/about')" class="hover:text-brand-gray-900">{{ t('footer.about') }}</NuxtLink>
        <NuxtLink :to="localePath('/clubs')" class="hover:text-brand-gray-900">{{ t('footer.clubs') }}</NuxtLink>
        <NuxtLink :to="localePath('/coaches')" class="hover:text-brand-gray-900">{{ t('footer.coaches') }}</NuxtLink>
        <a href="mailto:hello@shushzerv.app" class="hover:text-brand-gray-900">{{ t('footer.contact') }}</a>
      </nav>
    </div>
    <p class="text-center ios-footnote pb-8">© {{ year }} {{ t('brand.name') }} — {{ t('footer.rights') }}</p>
  </footer>
</template>
