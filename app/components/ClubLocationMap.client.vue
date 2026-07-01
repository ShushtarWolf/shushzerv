<script setup lang="ts">
import type { Club } from '~/types'
import type { Map as LeafletMap } from 'leaflet'

const props = defineProps<{ club: Club }>()

const { t, locale } = useI18n()
const { pickName, localized } = useLocaleContent()

const mapRoot = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let leaflet: typeof import('leaflet') | null = null

const isRtl = computed(() => locale.value === 'fa')

const hasCoords = computed(() => props.club.lat != null && props.club.lng != null)

const mapsUrl = computed(() => {
  if (!hasCoords.value) return ''
  return `https://www.google.com/maps?q=${props.club.lat},${props.club.lng}`
})

async function initMap() {
  if (!import.meta.client || !mapRoot.value || map || !hasCoords.value) return

  leaflet = await import('leaflet')
  const L = leaflet.default
  const lat = props.club.lat!
  const lng = props.club.lng!

  map = L.map(mapRoot.value, {
    scrollWheelZoom: false,
    zoomControl: false,
    dragging: true,
  })

  L.control.zoom({
    position: isRtl.value ? 'topright' : 'topleft',
  }).addTo(map)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  const name = pickName(props.club)
  const icon = L.divIcon({
    className: 'club-map-marker-wrap',
    html: `<div class="club-map-pin club-map-pin--selected" dir="${isRtl.value ? 'rtl' : 'ltr'}"><span class="club-map-pin-bubble"><span class="club-map-pin-name">${name.replace(/</g, '&lt;')}</span></span><span class="club-map-pin-stem"></span><span class="club-map-pin-dot"></span></div>`,
    iconSize: [132, 74],
    iconAnchor: [66, 74],
  })

  L.marker([lat, lng], { icon }).addTo(map)
  map.setView([lat, lng], 14)

  setTimeout(() => map?.invalidateSize(), 150)
}

onMounted(() => {
  nextTick(() => initMap())
})

watch(() => [props.club.lat, props.club.lng], () => {
  if (map) {
    map.remove()
    map = null
    leaflet = null
  }
  nextTick(() => initMap())
})

onUnmounted(() => {
  map?.remove()
  map = null
  leaflet = null
})
</script>

<template>
  <section class="ds-venue-location overflow-hidden rounded-[1.25rem] border border-black/5 bg-white shadow-card">
    <div class="border-b border-black/5 px-5 py-4">
      <h2 class="ios-title-3">{{ t('map.locationTitle') }}</h2>
    </div>

    <div v-if="hasCoords" ref="mapRoot" class="ds-venue-location-map" role="application" :aria-label="t('map.locationTitle')" />

    <div v-else class="ds-venue-location-fallback flex items-center justify-center bg-brand-gray-50 px-6 py-16 text-sm text-brand-gray-500">
      {{ t('map.locationUnavailable') }}
    </div>

    <div class="flex flex-wrap items-center gap-3 border-t border-black/5 p-4 sm:p-5">
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
        <SzIcon name="location" size="md" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-bold text-brand-gray-900">{{ pickName(club) }}</p>
        <p class="text-sm text-brand-gray-600">{{ localized(club.addressFa, club.addressEn) }}</p>
      </div>
      <a
        v-if="mapsUrl"
        :href="mapsUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="shrink-0 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white tap-highlight hover:bg-brand-primary/90"
      >
        {{ t('map.openInMaps') }}
      </a>
    </div>
  </section>
</template>

<style scoped>
.ds-venue-location-map {
  @apply w-full;
  height: 16rem;
  min-height: 16rem;
  font-family: inherit;
}

@media (min-width: 640px) {
  .ds-venue-location-map {
    height: 20rem;
    min-height: 20rem;
  }
}
</style>

<style>
.ds-venue-location-map.leaflet-container {
  width: 100%;
  font-family: inherit;
}

.ds-venue-location .club-map-marker-wrap {
  background: transparent !important;
  border: none !important;
}

.ds-venue-location .club-map-pin {
  @apply relative flex h-full w-full flex-col items-center justify-end border-0 bg-transparent p-0 outline-none;
}

.ds-venue-location .club-map-pin-bubble {
  @apply flex max-w-[8.25rem] flex-col items-center rounded-2xl bg-brand-orange px-2.5 py-1.5 text-white shadow-xl ring-2 ring-white ring-offset-2 ring-offset-brand-orange/30;
}

.ds-venue-location .club-map-pin-name {
  @apply max-w-[7.5rem] truncate text-center text-[11px] font-bold leading-tight sm:text-xs;
}

.ds-venue-location .club-map-pin-stem {
  @apply h-3 w-0.5 bg-brand-orange;
}

.ds-venue-location .club-map-pin-dot {
  @apply -mt-px h-4 w-4 rounded-full border-[3px] border-white bg-brand-orange shadow-md;
}
</style>
