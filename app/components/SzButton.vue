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
      return 'bg-white text-brand-primary border-2 border-brand-primary/35 shadow-card hover:bg-brand-primary/5'
    case 'ghost':
      return 'bg-brand-gray-100 text-brand-gray-900 hover:bg-brand-gray-200'
    case 'sport':
      return 'bg-white text-brand-primary border-2 border-brand-primary/40 shadow-card hover:bg-brand-primary/5 ring-1 ring-brand-primary/20'
    default:
      return 'bg-brand-primary text-white shadow-card hover:bg-brand-primary-dark'
  }
})

const sharedClass = computed(() => [
  sizeClass.value,
  variantClass.value,
  { 'w-full': props.block, 'animate-pulse-soft motion-reduce:animate-none': props.pulse },
])
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="inline-flex items-center justify-center gap-2 font-semibold transition-transform duration-150 active:scale-[0.97]"
    :class="sharedClass"
    v-bind="$attrs"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-2 font-semibold transition-transform duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
    :class="sharedClass"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
