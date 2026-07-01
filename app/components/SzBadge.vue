<script setup lang="ts">
type Tone = 'orange' | 'green' | 'blue' | 'teal' | 'indigo' | 'purple' | 'yellow' | 'gray'

withDefaults(
  defineProps<{
    tone?: Tone
    soft?: boolean
  }>(),
  { tone: 'gray', soft: true },
)

const toneMap: Record<string, { soft: string; solid: string }> = {
  orange: { soft: 'bg-brand-orange/12 text-brand-orange', solid: 'bg-brand-orange text-white' },
  green: { soft: 'bg-brand-green/15 text-brand-green', solid: 'bg-brand-green text-white' },
  blue: { soft: 'bg-brand-blue/12 text-brand-blue', solid: 'bg-brand-blue text-white' },
  teal: { soft: 'bg-brand-teal/15 text-brand-teal', solid: 'bg-brand-teal text-white' },
  indigo: { soft: 'bg-brand-indigo/15 text-brand-indigo', solid: 'bg-brand-indigo text-white' },
  purple: { soft: 'bg-brand-purple/15 text-brand-purple', solid: 'bg-brand-purple text-white' },
  yellow: { soft: 'bg-brand-yellow/25 text-brand-gray-900', solid: 'bg-brand-yellow text-brand-gray-900' },
  gray: { soft: 'bg-brand-gray-100 text-brand-gray-700', solid: 'bg-brand-gray-700 text-white' },
}
</script>

<template>
  <span
    class="sz-chip"
    :class="soft ? toneMap[tone].soft : toneMap[tone].solid"
  >
    <slot />
  </span>
</template>
