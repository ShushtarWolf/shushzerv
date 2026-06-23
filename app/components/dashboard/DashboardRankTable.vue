<script setup lang="ts">
defineProps<{
  items: Array<{ name: string; popularity: number; value: string }>
}>()
</script>

<template>
  <section class="fd-card fd-card-hover h-full overflow-hidden p-5 sm:p-6">
    <h3 class="mb-4 text-base font-bold text-fd-navy sm:text-lg">{{ $t('dashboard.topItems') }}</h3>
    <div class="overflow-x-auto">
      <table class="w-full min-w-[280px] text-sm">
        <thead>
          <tr class="text-start text-xs font-bold uppercase tracking-wide text-fd-muted">
            <th class="pb-3 pe-4">{{ $t('dashboard.itemName') }}</th>
            <th class="pb-3 pe-4">{{ $t('dashboard.popularity') }}</th>
            <th class="pb-3 text-end">{{ $t('dashboard.value') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="i" class="border-t border-fd-primary/5">
            <td class="py-3 pe-4 font-semibold text-fd-navy">{{ item.name }}</td>
            <td class="py-3 pe-4">
              <div class="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-[#F5F5F4]">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-fd-primary-light to-fd-primary transition-all"
                  :style="{ width: `${Math.min(100, item.popularity)}%` }"
                />
              </div>
            </td>
            <td class="py-3 text-end">
              <span class="inline-flex rounded-lg bg-fd-primary-soft px-2.5 py-1 text-xs font-bold text-fd-primary">
                {{ item.value }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
