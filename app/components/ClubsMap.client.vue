<script setup lang="ts">
import type { Club } from '~/types'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'

const props = withDefaults(defineProps<{ clubs: Club[]; variant?: 'default' | 'sidebar' }>(), {
  variant: 'default',
})

const { t, locale } = useI18n()
const { pickName, formatNumber, formatRating, localized } = useLocaleContent()

const mapRoot = ref<HTMLElement | null>(null)
const selectedClub = ref<Club | null>(null)
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

const PIN_WIDTH = 132
const PIN_HEIGHT = 74

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function markerLabel(club: Club) {
  const name = pickName(club)
  return name.length > 16 ? `${name.slice(0, 14)}…` : name
}

function markerHtml(club: Club, selected: boolean) {
  const name = escapeHtml(markerLabel(club))
  const fullName = escapeHtml(pickName(club))
  const rating = formatRating(club.rating)
  const dir = isRtl.value ? 'rtl' : 'ltr'
  const selectedClass = selected ? ' club-map-pin--selected' : ''
  const classesClass = club.hasGroupClasses ? ' club-map-pin--has-classes' : ' club-map-pin--no-classes'
  return `<div class="club-map-pin${selectedClass}${classesClass}" dir="${dir}" data-slug="${club.slug}" title="${fullName}" role="button" tabindex="0" aria-label="${fullName} — ★ ${rating}">
    <span class="club-map-pin-bubble">
      <span class="club-map-pin-name">${name}</span>
      <span class="club-map-pin-rating">★ ${rating}</span>
    </span>
    <span class="club-map-pin-stem"></span>
    <span class="club-map-pin-dot"></span>
  </div>`
}

function selectClub(club: Club) {
  selectedClub.value = club
  if (map) {
    map.panTo([club.lat!, club.lng!], { animate: true, duration: 0.4 })
    map.setZoom(Math.max(map.getZoom(), 13), { animate: true })
  }
  syncMarkerStyles()
}

function closePopup() {
  selectedClub.value = null
  syncMarkerStyles()
}

function bindMarkerClick(marker: LeafletMarker, club: Club) {
  marker.on('click', (e) => {
    if (leaflet) leaflet.default.DomEvent.stopPropagation(e)
    selectClub(club)
  })

  const el = marker.getElement()?.querySelector('.club-map-pin') as HTMLElement | null
  if (!el) return
  el.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    selectClub(club)
  })
}

function syncMarkerStyles() {
  if (!leaflet) return
  const slug = selectedClub.value?.slug
  for (const marker of markers) {
    const el = marker.getElement()?.querySelector('.club-map-pin') as HTMLElement | null
    if (!el) continue
    const pinSlug = el.dataset.slug
    el.classList.toggle('club-map-pin--selected', !!slug && pinSlug === slug)
  }
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
    map.fitBounds(L.latLngBounds(bounds), { padding: [80, 20, 20, 20], maxZoom: 12 })
  } else {
    map.setView(TEHRAN_CENTER, TEHRAN_ZOOM)
  }

  map.setPadding({ top: 80, bottom: 16, left: 16, right: 16 })

  didSetInitialView = true
  nextTick(() => map?.invalidateSize())
}

function syncMarkers() {
  if (!map || !leaflet) return
  const L = leaflet.default
  const selectedSlug = selectedClub.value?.slug

  if (selectedClub.value && !mappableClubs.value.some((c) => c.slug === selectedSlug)) {
    selectedClub.value = null
  }

  for (const m of markers) m.remove()
  markers = []

  for (const club of mappableClubs.value) {
    const lat = club.lat!
    const lng = club.lng!
    const selected = club.slug === selectedClub.value?.slug

    const icon = L.divIcon({
      className: 'club-map-marker-wrap',
      html: markerHtml(club, selected),
      iconSize: [PIN_WIDTH, PIN_HEIGHT],
      iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT],
    })

    const marker = L.marker([lat, lng], { icon, zIndexOffset: selected ? 1000 : 0 }).addTo(map)
    markers.push(marker)

    bindMarkerClick(marker, club)
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
  <section :class="variant === 'sidebar' ? 'ds-map-split' : 'club-map-section'">
    <div v-if="variant === 'sidebar'" class="ds-map-sidebar hidden lg:flex">
      <div class="border-b border-black/5 px-4 py-3">
        <h2 class="text-sm font-bold text-brand-gray-900">{{ t('nav.clubs') }}</h2>
        <p class="text-xs text-brand-gray-500">{{ t('map.clubsCount', { n: formatNumber(mappableClubs.length) }) }}</p>
      </div>
      <div class="ds-map-sidebar-list">
        <button
          v-for="club in mappableClubs"
          :key="club.id"
          type="button"
          class="ds-map-venue-row w-full text-start"
          :class="{ 'ds-map-venue-row--active': selectedClub?.slug === club.slug }"
          @click="selectClub(club)"
        >
          <div class="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-gray-100">
            <ClubCover :club="club" class="h-full w-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-brand-gray-900">{{ pickName(club) }}</p>
            <p class="truncate text-xs text-brand-gray-500">{{ localized(club.addressFa, club.addressEn) }}</p>
            <p class="mt-0.5 text-xs font-semibold text-brand-orange">★ {{ formatRating(club.rating) }}</p>
          </div>
        </button>
      </div>
    </div>

    <div :class="variant === 'sidebar' ? 'relative min-h-[28rem]' : 'club-map-stage'">
      <div v-if="variant === 'default'" class="club-map-header">
        <div>
          <h2 class="club-map-title">{{ t('map.title') }}</h2>
          <p class="mt-0.5 text-xs text-brand-gray-500">{{ t('map.tapPinHint') }}</p>
        </div>
        <div v-if="mappableClubs.length" class="text-end">
          <p class="club-map-count">
            {{ t('map.clubsCount', { n: formatNumber(mappableClubs.length) }) }}
          </p>
          <p class="mt-1 text-[10px] text-brand-gray-400">
            <span class="font-extrabold text-brand-gray-600">{{ t('map.legendBold') }}</span>
            ·
            <span class="font-medium text-brand-gray-400">{{ t('map.legendNormal') }}</span>
          </p>
        </div>
      </div>
      <div ref="mapRoot" class="club-map-canvas h-full min-h-[28rem]" role="application" :aria-label="t('map.title')" />
    </div>

    <ClubMapPopup
      v-if="selectedClub && variant === 'default'"
      :club="selectedClub"
      @close="closePopup"
    />
    <p v-if="!mappableClubs.length" class="border-t border-black/5 px-4 py-3 text-center text-sm text-brand-gray-500">
      {{ t('common.noResults') }}
    </p>
  </section>
</template>

<style>
.club-map-section {
  @apply overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card;
}

.club-map-header {
  @apply pointer-events-none flex items-center justify-between gap-3 border-b border-black/5 px-4 py-2.5 sm:px-5;
}

.club-map-title {
  @apply text-sm font-semibold text-brand-gray-900;
}

.club-map-count {
  @apply text-xs text-brand-gray-500;
}

.club-map-stage {
  @apply relative z-[1];
}

.club-map-canvas {
  @apply relative z-[1] w-full;
  height: 18rem;
  min-height: 18rem;
}

@media (min-width: 640px) {
  .club-map-canvas {
    height: 22rem;
    min-height: 22rem;
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
  pointer-events: auto !important;
}

.club-map-section .leaflet-marker-pane {
  z-index: 650 !important;
}

.club-map-pin {
  @apply relative flex h-full w-full cursor-pointer flex-col items-center justify-end border-0 bg-transparent p-0 outline-none transition-transform duration-200;
  pointer-events: auto;
}

.club-map-pin:hover {
  @apply scale-105;
}

.club-map-pin--selected {
  @apply scale-110;
  z-index: 1000;
}

.club-map-pin--selected:hover {
  @apply scale-110;
}

.club-map-pin:focus-visible .club-map-pin-bubble {
  @apply ring-2 ring-sz-blue ring-offset-2;
}

.club-map-pin-bubble {
  @apply flex max-w-[8.25rem] flex-col items-center rounded-2xl bg-sz-blue px-2.5 py-1.5 text-white shadow-lg transition;
}

.club-map-pin--selected .club-map-pin-bubble {
  @apply bg-brand-orange shadow-xl ring-2 ring-white ring-offset-2 ring-offset-brand-orange/30;
}

.club-map-pin-name {
  @apply max-w-[7.5rem] truncate text-center text-[11px] leading-tight sm:text-xs;
}

.club-map-pin--has-classes .club-map-pin-name {
  @apply font-extrabold;
}

.club-map-pin--no-classes .club-map-pin-name {
  @apply font-medium opacity-90;
}

.club-map-pin-rating {
  @apply mt-0.5 text-[10px] font-semibold opacity-90 sm:text-[11px];
}

.club-map-pin-stem {
  @apply h-3 w-0.5 bg-sz-blue;
}

.club-map-pin--selected .club-map-pin-stem {
  @apply bg-brand-orange;
}

.club-map-pin-dot {
  @apply -mt-px h-3.5 w-3.5 rounded-full border-[3px] border-white bg-sz-blue shadow-md;
}

.club-map-pin--selected .club-map-pin-dot {
  @apply h-4 w-4 border-[3px] bg-brand-orange;
}

.leaflet-control-zoom a {
  border-radius: 0.5rem !important;
}
</style>
