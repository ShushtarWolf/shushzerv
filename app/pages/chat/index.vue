<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
      <SzIcon name="chat" size="lg" />
    </div>
    <p class="font-bold text-brand-gray-900">{{ t('chat.empty') }}</p>
    <SzButton class="mt-4" :to="localePath('/clubs?book=1')" variant="secondary" size="sm">
      {{ t('common.browseClubs') }}
    </SzButton>
  </div>
</template>
