<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'

const props = defineProps<{
  type: 'line' | 'area' | 'bar' | 'donut'
  series: ApexOptions['series']
  options: ApexOptions
  height?: number | string
}>()

const height = computed(() => props.height ?? 240)

const mergedOptions = computed(() => ({
  ...props.options,
  chart: {
    ...props.options.chart,
    type: props.type === 'donut' ? 'donut' : props.type,
    height: height.value,
  },
}))
</script>

<template>
  <ClientOnly>
    <ApexChart
      :type="type === 'donut' ? 'donut' : type"
      :series="series"
      :options="mergedOptions"
      :height="height"
    />
    <template #fallback>
      <div class="flex h-[240px] items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-fd-primary/20 border-t-fd-primary" />
      </div>
    </template>
  </ClientOnly>
</template>
