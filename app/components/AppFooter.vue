<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <footer class="mt-16 hidden border-t border-black/5 bg-white/40 md:block">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
      <div class="max-w-xs space-y-3">
        <BrandLogo />
        <p class="ios-footnote">{{ $t('brand.tagline') }}</p>
      </div>
      <div class="flex flex-wrap gap-10">
        <div class="space-y-2 text-sm">
          <NuxtLink :to="localePath('/clubs')" class="block text-brand-gray-600 hover:text-brand-gray-900">{{ $t('footer.clubs') }}</NuxtLink>
          <NuxtLink :to="localePath('/coaches')" class="block text-brand-gray-600 hover:text-brand-gray-900">{{ $t('footer.coaches') }}</NuxtLink>
          <NuxtLink :to="localePath('/news')" class="block text-brand-gray-600 hover:text-brand-gray-900">{{ $t('nav.news') }}</NuxtLink>
        </div>
        <div class="space-y-2 text-sm">
          <NuxtLink :to="localePath('/about')" class="block text-brand-gray-600 hover:text-brand-gray-900">{{ $t('footer.about') }}</NuxtLink>
          <a href="mailto:hello@shushzerv.app" class="block text-brand-gray-600 hover:text-brand-gray-900">{{ $t('footer.contact') }}</a>
        </div>
      </div>
    </div>
    <div class="border-t border-black/5 py-4 text-center text-xs text-brand-gray-500">
      © {{ new Date().getFullYear() }} {{ $t('brand.name') }} — {{ $t('footer.rights') }}
    </div>
  </footer>
</template>
