<script setup lang="ts">
const { locale } = useI18n()

useHead({
  htmlAttrs: {
    dir: computed(() => (locale.value === 'fa' ? 'rtl' : 'ltr')),
    lang: computed(() => (locale.value === 'fa' ? 'fa-IR' : 'en-US')),
  },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>
