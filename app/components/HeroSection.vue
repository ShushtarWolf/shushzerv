<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <section class="relative overflow-hidden">
    <div class="absolute inset-0 -z-10 bg-gradient-to-br from-brand-blue/15 via-brand-indigo/10 to-brand-teal/10" />
    <div class="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:pt-16">
      <div class="glass-panel p-6 sm:p-10">
        <p class="mb-3 inline-block rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
          {{ $t('brand.tagline') }}
        </p>
        <h1 class="ios-large-title max-w-2xl sm:text-5xl">{{ $t('hero.title') }}</h1>
        <p class="mt-3 max-w-xl text-brand-gray-600">{{ $t('hero.subtitle') }}</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <NuxtLink :to="localePath('/clubs')" class="ios-btn-primary">{{ $t('hero.cta') }}</NuxtLink>
          <NuxtLink :to="localePath('/explore')" class="ios-btn-secondary">{{ $t('hero.secondary') }}</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
