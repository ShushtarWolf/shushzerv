<script setup lang="ts">
import type { Club } from '~/types'

const props = withDefaults(defineProps<{ club: Club; illustration?: boolean }>(), {
  illustration: false,
})

const sport = computed(() => {
  const map: Record<string, string> = {
    'azadi-tennis': 'tennis', 'enghelab-tennis': 'tennis', 'shiraz-tennis-academy': 'tennis',
    'padel-zone-tehran': 'padel', 'isfahan-padel-club': 'padel',
    'green-turf-arena': 'football', 'mashhad-football-center': 'football', 'tabriz-mini-football': 'football',
    'iron-house-gym': 'fitness', 'isfahan-fit-club': 'fitness',
    'zen-yoga-studio': 'yoga', 'shiraz-yoga-house': 'yoga',
    'aqua-swim-center': 'swim', 'mashhad-aquatics': 'swim',
    'hoops-basketball-arena': 'basketball', 'knockout-boxing-club': 'boxing',
  }
  return props.club.courts?.[0]?.sport?.slug ?? map[props.club.slug] ?? 'fitness'
})

const { accent, darken } = useSportTheme()

const colors = computed(() => {
  const primary = accent
  return { a: primary, b: darken(primary, 0.25) }
})

const coverSrc = computed(
  () => props.club.image || `/demo/clubs/${props.club.slug}.jpg`,
)
</script>

<template>
  <img
    v-if="!illustration"
    :src="coverSrc"
    :alt="club.nameEn"
    class="h-full w-full object-cover"
    loading="lazy"
  />
  <svg v-else viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" class="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img">
    <defs>
      <linearGradient :id="`sky-${club.slug}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="colors.a" />
        <stop offset="100%" :stop-color="colors.b" />
      </linearGradient>
    </defs>
    <rect width="640" height="360" :fill="`url(#sky-${club.slug})`" />

    <!-- Tennis / Padel court -->
    <g v-if="sport === 'tennis' || sport === 'padel'">
      <rect x="40" y="120" width="560" height="200" fill="#2d6a4f" rx="4" />
      <rect x="60" y="140" width="520" height="160" fill="#40916c" />
      <line x1="320" y1="140" x2="320" y2="300" stroke="#fff" stroke-width="3" opacity="0.7" />
      <line x1="60" y1="220" x2="580" y2="220" stroke="#fff" stroke-width="2" opacity="0.5" />
      <circle cx="500" cy="80" r="28" fill="#fff" opacity="0.15" />
    </g>

    <!-- Football pitch -->
    <g v-else-if="sport === 'football'">
      <rect x="30" y="100" width="580" height="230" fill="#2d6a4f" rx="6" />
      <rect x="50" y="120" width="540" height="190" fill="none" stroke="#fff" stroke-width="3" opacity="0.6" />
      <circle cx="320" cy="215" r="50" fill="none" stroke="#fff" stroke-width="2" opacity="0.5" />
      <line x1="320" y1="120" x2="320" y2="310" stroke="#fff" stroke-width="2" opacity="0.4" />
    </g>

    <!-- Gym -->
    <g v-else-if="sport === 'fitness'">
      <rect x="0" y="200" width="640" height="160" fill="#1c1c1e" opacity="0.3" />
      <rect x="80" y="160" width="120" height="8" rx="4" fill="#fff" opacity="0.8" />
      <rect x="60" y="148" width="8" height="32" rx="2" fill="#fff" opacity="0.7" />
      <rect x="172" y="148" width="8" height="32" rx="2" fill="#fff" opacity="0.7" />
      <rect x="400" y="180" width="160" height="100" rx="4" fill="none" stroke="#fff" stroke-width="3" opacity="0.5" />
      <line x1="420" y1="200" x2="540" y2="260" stroke="#fff" stroke-width="2" opacity="0.4" />
    </g>

    <!-- Yoga studio -->
    <g v-else-if="sport === 'yoga'">
      <ellipse cx="320" cy="300" rx="200" ry="30" fill="#fff" opacity="0.15" />
      <circle cx="320" cy="200" r="40" fill="#fff" opacity="0.25" />
      <path d="M280 240 Q320 220 360 240 L370 300 Q320 310 270 300 Z" fill="#fff" opacity="0.2" />
      <circle cx="500" cy="60" r="40" fill="#fff" opacity="0.12" />
    </g>

    <!-- Swimming pool -->
    <g v-else-if="sport === 'swim'">
      <rect x="60" y="140" width="520" height="180" fill="#0077b6" rx="8" opacity="0.7" />
      <path d="M80 200 Q160 180 240 200 T400 200 T560 200" fill="none" stroke="#fff" stroke-width="2" opacity="0.4" />
      <path d="M80 240 Q160 220 240 240 T400 240 T560 240" fill="none" stroke="#fff" stroke-width="2" opacity="0.3" />
      <rect x="60" y="130" width="520" height="12" rx="4" fill="#fff" opacity="0.3" />
    </g>

    <!-- Basketball -->
    <g v-else-if="sport === 'basketball'">
      <rect x="40" y="180" width="560" height="140" fill="#b5651d" opacity="0.6" rx="4" />
      <rect x="280" y="60" width="8" height="200" fill="#fff" opacity="0.5" />
      <rect x="240" y="60" width="88" height="50" fill="none" stroke="#fff" stroke-width="3" opacity="0.6" />
      <circle cx="284" cy="85" r="20" fill="none" stroke="#fff" stroke-width="2" opacity="0.5" />
      <circle cx="520" cy="280" r="30" fill="#A67C52" opacity="0.7" />
    </g>

    <!-- Boxing ring -->
    <g v-else-if="sport === 'boxing'">
      <rect x="100" y="160" width="440" height="160" fill="none" stroke="#fff" stroke-width="4" opacity="0.5" />
      <line x1="100" y1="160" x2="80" y2="120" stroke="#fff" stroke-width="3" opacity="0.4" />
      <line x1="540" y1="160" x2="560" y2="120" stroke="#fff" stroke-width="3" opacity="0.4" />
      <rect x="280" y="200" width="80" height="80" fill="#ff3b30" opacity="0.3" rx="4" />
    </g>

    <!-- Default -->
    <g v-else>
      <rect x="80" y="140" width="480" height="160" fill="#fff" opacity="0.15" rx="8" />
    </g>
  </svg>
</template>
