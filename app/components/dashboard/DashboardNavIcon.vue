<script setup lang="ts">
defineProps<{
  name: string
}>()

const paths: Record<string, string> = {
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  home: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z',
  building: 'M5 20V8.5l7-4.5 7 4.5V20h-5v-6h-4v6H5Zm2-2h2v-2H7v2Zm0-4h2v-2H7v2Zm4 4h2v-2h-2v2Zm0-4h2v-2h-2v2Zm4 4h2v-2h-2v2Zm0-4h2v-2h-2v2Z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5 1.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM4.5 14.5a4 4 0 0 1 4.5-3.97A4.5 4.5 0 0 0 4.5 19h7a4.47 4.47 0 0 0 2.02-.5A4 4 0 0 1 4.5 14.5Z',
  calendar: 'M7 3a1 1 0 0 1 1 1v1h8V4a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Zm12 8H5v7h14v-7Z',
  chat: 'M12 3a7 7 0 0 1 7 7c0 2.5-1.2 4.7-3 6.1V19l-3.5-2H9a7 7 0 0 1-3-5.2A7 7 0 0 1 12 3Z',
  wallet: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H4V7Zm0 3h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Zm12 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  chart: 'M6 20V10M12 20V4M18 20v-6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35',
  logout: 'M9 21H5a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}
</script>

<template>
  <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      v-if="name === 'chat' || name === 'chart' || name === 'logout' || name === 'search'"
      :d="paths[name]"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path v-else :d="paths[name] ?? paths.grid" fill="currentColor" />
  </svg>
</template>
