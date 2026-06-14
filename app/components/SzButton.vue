<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'ghost' | 'sport'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    to?: string
    type?: 'button' | 'submit'
    block?: boolean
    pulse?: boolean
    sportColor?: string
    disabled?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', block: false, pulse: false },
)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-4 py-2 text-sm rounded-xl'
    case 'lg':
      return 'px-7 py-4 text-base rounded-2xl'
    default:
      return 'px-5 py-3 text-sm rounded-xl'
  }
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-white text-brand-orange border border-brand-orange/25 shadow-card hover:bg-brand-gray-50'
    case 'ghost':
      return 'bg-brand-gray-100 text-brand-gray-900 hover:bg-brand-gray-200'
    case 'sport':
      return 'text-white shadow-card'
    default:
      return 'bg-brand-orange text-white shadow-card hover:bg-brand-orange-dark'
  }
})

const sportStyle = computed(() =>
  props.variant === 'sport' && props.sportColor ? { backgroundColor: props.sportColor } : undefined,
)
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled"
    :style="sportStyle"
    class="inline-flex items-center justify-center gap-2 font-semibold transition-transform duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
    :class="[sizeClass, variantClass, { 'w-full': block, 'animate-pulse-soft motion-reduce:animate-none': pulse }]"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>
