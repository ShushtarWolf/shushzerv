<script setup lang="ts">
defineProps<{ to: string }>()
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <NuxtLink :to="localePath(to)" class="ios-footnote mb-4 inline-flex items-center gap-1 text-sz-blue">
    <span aria-hidden="true" class="inline-block rtl:rotate-180">←</span>
    {{ t('common.back') }}
  </NuxtLink>
</template>
