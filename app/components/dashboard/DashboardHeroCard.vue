<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
  badge?: string
}>()
</script>

<template>
  <section class="fd-hero mb-8">
    <div class="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p v-if="badge" class="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/90">
          {{ badge }}
        </p>
        <p class="text-sm font-semibold text-white/80">{{ label }}</p>
        <p class="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{{ value }}</p>
        <p v-if="hint" class="mt-2 text-sm text-white/75">{{ hint }}</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <slot name="actions" />
      </div>
    </div>
    <div class="pointer-events-none absolute -end-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <div class="pointer-events-none absolute bottom-0 end-12 h-24 w-24 rounded-full bg-white/10 blur-xl" />
  </section>
</template>
