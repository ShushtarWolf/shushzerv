<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  loading?: boolean
  error?: boolean
}>()

defineEmits<{
  retry: []
}>()

const { t } = useI18n()
</script>

<template>
  <section class="fd-card fd-card-hover flex h-full flex-col overflow-hidden p-5 sm:p-6">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 class="text-base font-bold text-fd-navy sm:text-lg">{{ title }}</h3>
        <p v-if="subtitle" class="mt-0.5 text-xs font-medium text-fd-muted sm:text-sm">{{ subtitle }}</p>
      </div>
      <slot name="action" />
    </div>
    <div class="relative min-h-[220px] flex-1">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-fd-primary/20 border-t-fd-primary" />
      </div>
      <div v-else-if="error" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p class="text-sm text-fd-muted">{{ t('dashboard.chartsLoadError') }}</p>
        <button type="button" class="text-sm font-semibold text-fd-primary" @click="$emit('retry')">
          {{ t('dashboard.chartsRetry') }}
        </button>
      </div>
      <slot v-else />
    </div>
  </section>
</template>
