<script setup lang="ts">
type IconName =
  | 'search'
  | 'location'
  | 'star'
  | 'users'
  | 'building'
  | 'bolt'
  | 'chevron-down'
  | 'chevron-start'
  | 'chevron-end'
  | 'menu'
  | 'close'
  | 'chat'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-4 w-4'
    case 'lg':
      return 'h-6 w-6'
    default:
      return 'h-5 w-5'
  }
})

const paths: Record<IconName, string> = {
  search:
    'M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm7.78 13.22a1 1 0 0 1 1.32-.08l3.2 2.8a1 1 0 0 1-1.32 1.52l-3.2-2.8a1 1 0 0 1 .08-1.44Z',
  location:
    'M12 2.5C8.41 2.5 5.5 5.41 5.5 9c0 3.94 6.5 11.25 6.5 11.25S18.5 12.94 18.5 9c0-3.59-2.91-6.5-6.5-6.5Zm0 2.6a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8Z',
  star: 'M12 3.2l2.38 4.82 5.32.77-3.85 3.75.91 5.3L12 15.9l-4.76 2.5.91-5.3L4.3 8.79l5.32-.77L12 3.2Z',
  users:
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5 1.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM4.5 14.5a4 4 0 0 1 4.5-3.97 5.2 5.2 0 0 0-1.02.97A4.5 4.5 0 0 0 4.5 19h7a4.47 4.47 0 0 0 2.02-.5 5.2 5.2 0 0 0-1.02-.97A4 4 0 0 1 4.5 14.5Zm9.5 0a3.5 3.5 0 0 1 3.5 3.5H14a3.5 3.5 0 0 1-3.5-3.5 3.5 3.5 0 0 1 3.5-3.5 3.5 3.5 0 0 1 3.5 3.5Z',
  building:
    'M5 20V8.5l7-4.5 7 4.5V20h-5v-6h-4v6H5Zm2-2h2v-2H7v2Zm0-4h2v-2H7v2Zm4 4h2v-2h-2v2Zm0-4h2v-2h-2v2Zm4 4h2v-2h-2v2Zm0-4h2v-2h-2v2Z',
  bolt: 'M13 2 5 14h6l-1 8 8-12h-6l1-8Z',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-start': 'M15 6l-6 6 6 6',
  'chevron-end': 'M9 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  chat: 'M12 3a7 7 0 0 1 7 7c0 2.5-1.2 4.7-3 6.1V19l-3.5-2H9a7 7 0 0 1-3-5.2A7 7 0 0 1 12 3Z',
}

const isStroke = computed(() =>
  ['chevron-down', 'chevron-start', 'chevron-end', 'menu', 'close', 'chat'].includes(props.name),
)
</script>

<template>
  <svg
    :class="sizeClass"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    :stroke="isStroke ? 'currentColor' : undefined"
    :stroke-width="isStroke ? 2 : undefined"
    :stroke-linecap="isStroke ? 'round' : undefined"
    :stroke-linejoin="isStroke ? 'round' : undefined"
  >
    <path v-if="isStroke" :d="paths[name]" />
    <path v-else :d="paths[name]" fill="currentColor" />
  </svg>
</template>
