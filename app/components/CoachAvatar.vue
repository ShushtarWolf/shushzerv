<script setup lang="ts">
import type { Coach } from '~/types'

const props = defineProps<{ coach: Coach; size?: number }>()
const size = computed(() => props.size ?? 128)

const sport = computed(() => props.coach.sport?.slug ?? 'fitness')

const { accent, darken } = useSportTheme()

const palette = computed(() => {
  const skins = [
    { skin: '#f5c8a8', hair: '#3d2c1e', shirt: '#ffffff' },
    { skin: '#e8b796', hair: '#1a1a1a', shirt: '#f2f2f7' },
    { skin: '#d4a574', hair: '#2c1810', shirt: '#e8f5e9' },
    { skin: '#f0c9a0', hair: '#4a3728', shirt: '#fff3e0' },
    { skin: '#e5b48a', hair: '#1f1f1f', shirt: '#fce4ec' },
  ]
  let h = 0
  for (const c of props.coach.id) h = (h + c.charCodeAt(0)) % skins.length
  const bg = accent
  return { bg, bgDark: darken(bg, 0.25), ...skins[h]! }
})
</script>

<template>
  <img
    v-if="coach.photo"
    :src="coach.photo"
    :alt="coach.nameEn"
    :width="size"
    :height="size"
    class="block object-cover"
    loading="lazy"
  />
  <svg
    v-else
    :width="size"
    :height="size"
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    class="block"
    role="img"
    :aria-label="coach.nameEn"
  >
    <defs>
      <linearGradient :id="`bg-${coach.id}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" :stop-color="palette.bg" />
        <stop offset="100%" :stop-color="palette.bgDark" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" :fill="`url(#bg-${coach.id})`" />

    <!-- Sport scene (background) -->
    <g v-if="sport === 'tennis' || sport === 'padel'" opacity="0.25">
      <rect x="8" y="88" width="112" height="28" rx="2" fill="#fff" />
      <line x1="64" y1="88" x2="64" y2="116" stroke="#fff" stroke-width="1.5" />
    </g>
    <g v-else-if="sport === 'football'" opacity="0.2">
      <ellipse cx="64" cy="104" rx="48" ry="14" fill="#fff" />
    </g>
    <g v-else-if="sport === 'swim'" opacity="0.25">
      <path d="M0 96 Q32 88 64 96 T128 96 V128 H0Z" fill="#fff" />
    </g>
    <g v-else-if="sport === 'basketball'" opacity="0.2">
      <rect x="40" y="78" width="48" height="32" rx="2" fill="none" stroke="#fff" stroke-width="2" />
      <circle cx="64" cy="86" r="10" fill="none" stroke="#fff" stroke-width="2" />
    </g>
    <g v-else-if="sport === 'boxing'" opacity="0.2">
      <rect x="20" y="80" width="88" height="40" rx="4" fill="none" stroke="#fff" stroke-width="2" />
    </g>
    <g v-else-if="sport === 'yoga'" opacity="0.2">
      <ellipse cx="64" cy="108" rx="40" ry="8" fill="#fff" />
    </g>
    <g v-else opacity="0.2">
      <rect x="24" y="82" width="80" height="36" rx="4" fill="#fff" />
    </g>

    <!-- Coach figure -->
    <circle cx="64" cy="44" r="18" :fill="palette.skin" />
    <path :d="`M46 62 Q64 54 82 62 L88 96 Q64 100 40 96 Z`" :fill="palette.shirt" />
    <ellipse cx="64" cy="38" rx="20" ry="10" :fill="palette.hair" />
    <circle cx="58" cy="44" r="2" fill="#333" />
    <circle cx="70" cy="44" r="2" fill="#333" />
    <path d="M58 50 Q64 54 70 50" fill="none" stroke="#333" stroke-width="1.2" stroke-linecap="round" />

    <!-- Sport prop -->
    <g v-if="sport === 'tennis' || sport === 'padel'">
      <rect x="88" y="52" width="6" height="36" rx="2" fill="#fff" opacity="0.9" />
      <ellipse cx="91" cy="50" rx="14" ry="10" fill="none" stroke="#fff" stroke-width="2" opacity="0.9" />
    </g>
    <g v-else-if="sport === 'football'">
      <circle cx="92" cy="58" r="12" fill="#fff" opacity="0.9" />
      <path d="M92 50 L92 66 M86 54 L98 62 M86 62 L98 54" stroke="#333" stroke-width="1" opacity="0.5" />
    </g>
    <g v-else-if="sport === 'fitness'">
      <rect x="84" y="56" width="20" height="4" rx="2" fill="#fff" opacity="0.9" />
      <rect x="82" y="54" width="4" height="8" rx="1" fill="#fff" opacity="0.9" />
      <rect x="102" y="54" width="4" height="8" rx="1" fill="#fff" opacity="0.9" />
    </g>
    <g v-else-if="sport === 'yoga'">
      <path d="M88 70 Q96 58 104 70" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.9" />
    </g>
    <g v-else-if="sport === 'swim'">
      <ellipse cx="90" cy="60" rx="10" ry="6" fill="none" stroke="#fff" stroke-width="2" opacity="0.9" />
      <path d="M80 60 L100 60" stroke="#fff" stroke-width="1.5" opacity="0.7" />
    </g>
    <g v-else-if="sport === 'basketball'">
      <circle cx="90" cy="58" r="11" fill="#A67C52" opacity="0.9" />
      <path d="M90 47 L90 69 M79 58 L101 58" stroke="#333" stroke-width="1" opacity="0.4" />
    </g>
    <g v-else-if="sport === 'boxing'">
      <circle cx="86" cy="58" r="10" fill="#ff3b30" opacity="0.85" />
      <circle cx="102" cy="58" r="10" fill="#ff3b30" opacity="0.85" />
    </g>
  </svg>
</template>
