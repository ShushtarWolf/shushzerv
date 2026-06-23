<script setup lang="ts">
defineProps<{
  actions: Array<{ id: string; label: string; icon: string; to?: string; onClick?: () => void }>
  compact?: boolean
}>()
</script>

<template>
  <section class="fd-card fd-card-hover flex h-full flex-col p-5 sm:p-6" :class="compact ? '' : 'mb-8'">
    <h2 class="mb-4 text-base font-bold text-fd-navy sm:text-lg">{{ $t('dashboard.quickActions') }}</h2>
    <div class="grid flex-1 grid-cols-2 gap-3 content-start">
      <NuxtLink
        v-for="action in actions.filter((a) => a.to)"
        :key="action.id"
        :to="action.to!"
        class="flex flex-col items-center gap-2.5 rounded-2xl bg-[#F5F5F4] p-4 text-center tap-highlight transition hover:bg-fd-primary-soft"
      >
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-fd-primary shadow-sm">
          <DashboardNavIcon :name="action.icon" />
        </span>
        <span class="text-xs font-bold text-fd-navy sm:text-sm">{{ action.label }}</span>
      </NuxtLink>
      <button
        v-for="action in actions.filter((a) => !a.to)"
        :key="action.id"
        type="button"
        class="flex flex-col items-center gap-2.5 rounded-2xl bg-[#F5F5F4] p-4 text-center tap-highlight transition hover:bg-fd-primary-soft"
        @click="action.onClick?.()"
      >
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-fd-primary shadow-sm">
          <DashboardNavIcon :name="action.icon" />
        </span>
        <span class="text-xs font-bold text-fd-navy sm:text-sm">{{ action.label }}</span>
      </button>
    </div>
  </section>
</template>
