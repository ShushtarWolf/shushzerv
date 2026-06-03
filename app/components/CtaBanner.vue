<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <section class="mx-auto max-w-6xl px-4">
    <div class="relative overflow-hidden rounded-ios-xl bg-gradient-to-br from-brand-indigo to-brand-blue p-8 text-white shadow-float sm:p-12">
      <h2 class="ios-title-2 max-w-lg">{{ $t('cta.banner') }}</h2>
      <NuxtLink :to="localePath('/register')" class="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 font-semibold text-brand-blue tap-highlight">
        {{ $t('cta.button') }}
      </NuxtLink>
    </div>
  </section>
</template>
