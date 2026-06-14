<script setup lang="ts">
import { isSportSlug, sportIconParts } from '~/utils/sportIcons'

const props = withDefaults(
  defineProps<{
    slug: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { size: 'md' },
)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-4 w-4'
    case 'sm':
      return 'h-5 w-5'
    case 'lg':
      return 'h-10 w-10'
    case 'xl':
      return 'h-14 w-14'
    default:
      return 'h-8 w-8'
  }
})

const sport = computed(() => (isSportSlug(props.slug) ? props.slug : 'tennis'))
const parts = computed(() => sportIconParts[sport.value])
</script>

<template>
  <svg
    :class="[sizeClass, 'shrink-0']"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
    data-sport-icon="v2"
  >
    <path
      v-for="(part, i) in parts"
      :key="i"
      :d="part.d"
      stroke="currentColor"
      :stroke-width="part.strokeWidth ?? 2.25"
      :stroke-linecap="part.strokeLinecap"
      :stroke-linejoin="part.strokeLinejoin"
    />
  </svg>
</template>
