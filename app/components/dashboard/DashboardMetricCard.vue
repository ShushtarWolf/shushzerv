<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  delta?: string
  tone?: 'pink' | 'orange' | 'green' | 'purple' | 'blue' | 'teal'
  icon?: string
}>()

const toneStyles: Record<string, { bg: string; icon: string; text: string }> = {
  pink: { bg: 'bg-[#F5ECEE]', icon: 'text-[#9E5B6B]', text: 'text-[#9E5B6B]' },
  orange: { bg: 'bg-[#F5F0EA]', icon: 'text-[#A67C52]', text: 'text-[#A67C52]' },
  green: { bg: 'bg-[#EAF2EF]', icon: 'text-[#3D7A6A]', text: 'text-[#3D7A6A]' },
  purple: { bg: 'bg-[#F0ECF4]', icon: 'text-[#7D6B8F]', text: 'text-[#7D6B8F]' },
  blue: { bg: 'bg-[#E8EEF3]', icon: 'text-[#2C4A6E]', text: 'text-[#2C4A6E]' },
  teal: { bg: 'bg-[#E8F0F3]', icon: 'text-[#3D728A]', text: 'text-[#3D728A]' },
}
</script>

<template>
  <div class="fd-metric-card rounded-[1.25rem] p-4 sm:p-5" :class="toneStyles[tone ?? 'blue'].bg">
    <div class="mb-3 flex items-start justify-between gap-2">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm"
        :class="toneStyles[tone ?? 'blue'].icon"
      >
        <DashboardNavIcon v-if="icon" :name="icon" class="h-5 w-5" />
        <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 19V5M4 19h16M8 15V9M12 17V7M16 13v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </span>
      <p v-if="delta" class="text-xs font-semibold" :class="toneStyles[tone ?? 'blue'].text">{{ delta }}</p>
    </div>
    <p class="text-xl font-black tabular-nums tracking-tight text-fd-navy sm:text-2xl">{{ value }}</p>
    <p class="mt-1 text-xs font-semibold text-fd-muted sm:text-sm">{{ label }}</p>
  </div>
</template>
