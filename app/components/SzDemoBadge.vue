<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <span
    class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200"
    :title="t('demo.hint')"
  >
    {{ t('demo.badge') }}
  </span>
</template>
