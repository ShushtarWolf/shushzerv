<script setup lang="ts">
import type { Club } from '~/types'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'

const props = defineProps<{ clubs: Club[] }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { pickName, formatPrice } = useLocaleContent()

const mapRoot = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let markers: LeafletMarker[] = []
let leaflet: typeof import('leaflet') | null = null
let didSetInitialView = false

const TEHRAN_CENTER: [number, number] = [35.6892, 51.389]
const TEHRAN_ZOOM = 11

const isRtl = computed(() => locale.value === 'fa')

const mappableClubs = computed(() =>
  props.clubs.filter((c) => c.lat != null && c.lng != null),
)

function priceLabel(club: Club) {
  const price = `${formatPrice(club.priceFrom)} ${t('clubs.currency')}`
  return t('map.fromPrice', { price })
}

function markerHtml(club: Club) {
  const name = pickName(club).replace(/"/g, '&quot;')
  const price = priceLabel(club)
  const dir = isRtl.value ? 'rtl' : 'ltr'
  return `<button type="button" class="club-map-pin" dir="${dir}" data-slug="${club.slug}" title="${name}" aria-label="${name} — ${price}">
    <span class="club-map-pin-price">${price}</span>
    <span class="club-map-pin-dot"></span>
  </button>`
}

function bindMarkerClick(el: HTMLElement, slug: string) {
  el.addEventListener('click', () => {
    navigateTo(localePath(`/clubs/${slug}`))
  })
}

function tehranBounds(): [number, number][] {
  return mappableClubs.value
    .filter((c) => c.city === 'تهران')
    .map((c) => [c.lat!, c.lng!] as [number, number])
}

function setInitialView() {
  if (!map || !leaflet || didSetInitialView) return
  const L = leaflet.default

  const bounds = tehranBounds()
  if (bounds.length === 1) {
    map.setView(bounds[0], 12)
  } else if (bounds.length > 1) {
    map.fitBounds(L.latLngBounds(bounds), { padding: [20, 20], maxZoom: 12 })
  } else {
    map.setView(TEHRAN_CENTER, TEHRAN_ZOOM)
  }

  didSetInitialView = true
  nextTick(() => map?.invalidateSize())
}

function syncMarkers() {
  if (!map || !leaflet) return
  const L = leaflet.default

  for (const m of markers) m.remove()
  markers = []

  for (const club of mappableClubs.value) {
    const lat = club.lat!
    const lng = club.lng!

    const icon = L.divIcon({
      className: 'club-map-marker-wrap',
      html: markerHtml(club),
      iconSize: [1, 1],
      iconAnchor: [0, 0],
    })

    const marker = L.marker([lat, lng], { icon }).addTo(map)
    markers.push(marker)

    const el = marker.getElement()?.querySelector('.club-map-pin') as HTMLElement | null
    if (el) bindMarkerClick(el, club.slug)
  }

  nextTick(() => map?.invalidateSize())
}

async function initMap() {
  if (!import.meta.client || !mapRoot.value || map) return

  leaflet = await import('leaflet')
  const L = leaflet.default

  map = L.map(mapRoot.value, {
    scrollWheelZoom: true,
    zoomControl: false,
  })

  L.control.zoom({
    position: isRtl.value ? 'topright' : 'topleft',
  }).addTo(map)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  syncMarkers()
  setInitialView()

  setTimeout(() => map?.invalidateSize(), 150)
}

async function refreshMap() {
  await nextTick()
  if (!map) await initMap()
  else syncMarkers()
}

watch(mappableClubs, () => refreshMap(), { deep: true })

onMounted(() => {
  refreshMap()
})

onUnmounted(() => {
  for (const m of markers) m.remove()
  markers = []
  map?.remove()
  map = null
  leaflet = null
  didSetInitialView = false
})
</script>

<template>
  <section class="club-map-section">
    <div class="club-map-header">
      <h2 class="club-map-title">{{ t('map.title') }}</h2>
      <p v-if="mappableClubs.length" class="club-map-count">
        {{ t('map.clubsCount', { n: mappableClubs.length }) }}
      </p>
    </div>
    <div ref="mapRoot" class="club-map-canvas" role="application" :aria-label="t('map.title')" />
    <p v-if="!mappableClubs.length" class="club-map-empty">{{ t('common.noResults') }}</p>
  </section>
</template>

<style>
.club-map-section {
  @apply overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card;
}

.club-map-header {
  @apply flex items-center justify-between gap-3 border-b border-black/5 px-4 py-2.5 sm:px-5;
}

.club-map-title {
  @apply text-sm font-semibold text-brand-gray-900;
}

.club-map-count {
  @apply text-xs text-brand-gray-500;
}

.club-map-canvas {
  @apply relative z-0 w-full;
  height: 14rem;
  min-height: 14rem;
}

@media (min-width: 640px) {
  .club-map-canvas {
    height: 16rem;
    min-height: 16rem;
  }
}

.club-map-canvas.leaflet-container {
  width: 100%;
  font-family: inherit;
}

.club-map-empty {
  @apply border-t border-black/5 px-4 py-3 text-center text-sm text-brand-gray-500;
}

.club-map-marker-wrap {
  background: transparent !important;
  border: none !important;
}

.club-map-pin {
  @apply relative flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 outline-none;
  transform: translate(-50%, -100%);
}

.club-map-pin:focus-visible .club-map-pin-price {
  @apply ring-2 ring-sz-blue ring-offset-2;
}

.club-map-pin-price {
  @apply whitespace-nowrap rounded-full bg-sz-blue px-2 py-0.5 text-[10px] font-bold text-white shadow-md transition hover:bg-blue-600 sm:text-[11px];
}

.club-map-pin-dot {
  @apply mt-0.5 h-2 w-2 rounded-full border-2 border-white bg-sz-blue shadow;
}

.leaflet-control-zoom a {
  border-radius: 0.5rem !important;
}
</style>
