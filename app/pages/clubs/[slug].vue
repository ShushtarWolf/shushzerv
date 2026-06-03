<script setup lang="ts">
import type { Club, Slot } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { pickName, localized, formatPrice, formatDate } = useLocaleContent()
const { loggedIn } = useUserSession()

const slug = computed(() => String(route.params.slug))

const { data: club, error } = await useApiFetch<Club>(() => `/api/clubs/${slug.value}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Club not found' })
}

useHead({ title: () => (club.value ? pickName(club.value) : t('clubs.details')) })

const selectedCourtId = ref<string>('')
const selectedDate = ref(isoToday())
const selectedSlotId = ref<string>('')
const bookingDone = ref(false)
const bookingError = ref('')
const bookingPending = ref(false)

watch(
  () => club.value?.courts,
  (courts) => {
    if (courts?.length && !selectedCourtId.value) {
      selectedCourtId.value = courts[0].id
    }
  },
  { immediate: true },
)

const { data: slots, refresh: refreshSlots } = await useApiFetch<Slot[]>('/api/slots', {
  query: computed(() => ({
    clubId: club.value?.id,
    courtId: selectedCourtId.value || undefined,
    date: selectedDate.value,
    status: 'AVAILABLE',
  })),
  watch: [selectedCourtId, selectedDate, () => club.value?.id],
})

const dateOptions = computed(() => {
  const opts: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    opts.push(d.toISOString().slice(0, 10))
  }
  return opts
})

const selectedSlot = computed(() => slots.value?.find((s) => s.id === selectedSlotId.value))

async function confirmBooking() {
  bookingError.value = ''
  if (!loggedIn.value) {
    return navigateTo(localePath('/login'))
  }
  if (!selectedSlotId.value) return
  bookingPending.value = true
  try {
    await $fetch('/api/bookings', { method: 'POST', body: { slotId: selectedSlotId.value } })
    bookingDone.value = true
    selectedSlotId.value = ''
    await refreshSlots()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    bookingError.value = err?.data?.message || err?.statusMessage || 'Error'
  } finally {
    bookingPending.value = false
  }
}

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}
</script>

<template>
  <div v-if="club" class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <NuxtLink :to="localePath('/clubs')" class="ios-footnote mb-4 inline-flex items-center gap-1 text-sz-blue">
      ← {{ t('common.back') }}
    </NuxtLink>

    <div class="glass-panel mb-8 overflow-hidden p-6 md:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="ios-large-title">{{ pickName(club) }}</h1>
          <p class="mt-2 text-sz-gray-600">{{ localized(club.addressFa, club.addressEn) }}</p>
          <p v-if="club.district" class="ios-footnote">{{ club.city }} · {{ club.district }}</p>
        </div>
        <div class="text-end">
          <span class="text-lg font-bold text-sz-orange">★ {{ club.rating.toFixed(1) }}</span>
          <p class="text-sm text-sz-gray-500">
            {{ t('clubs.from') }} {{ formatPrice(club.priceFrom) }} {{ t('clubs.currency') }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="bookingDone" class="ios-card mb-8 border-2 border-sz-green/30 p-6 text-center">
      <p class="ios-title-2 text-sz-green">{{ t('booking.success') }}</p>
      <p class="ios-footnote mt-2">{{ t('booking.payAtClub') }}</p>
      <NuxtLink :to="localePath('/dashboard')" class="ios-btn-primary mt-4 inline-flex">
        {{ t('booking.viewBookings') }}
      </NuxtLink>
    </div>

    <section class="mb-8">
      <h2 class="ios-title-2 mb-4">{{ t('clubs.selectCourt') }}</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="court in club.courts"
          :key="court.id"
          type="button"
          class="ios-segment-item tap-highlight"
          :class="{ 'ios-segment-item-active': selectedCourtId === court.id }"
          @click="selectedCourtId = court.id; selectedSlotId = ''"
        >
          {{ pickName(court) }}
        </button>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="ios-title-3 mb-3">{{ t('dashboard.date') }}</h2>
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="d in dateOptions"
          :key="d"
          type="button"
          class="ios-segment-item shrink-0 tap-highlight whitespace-nowrap"
          :class="{ 'ios-segment-item-active': selectedDate === d }"
          @click="selectedDate = d; selectedSlotId = ''"
        >
          {{ formatDate(d) }}
        </button>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="ios-title-3 mb-3">{{ t('clubs.selectSlot') }}</h2>
      <div v-if="slots?.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="slot in slots"
          :key="slot.id"
          type="button"
          class="ios-card p-4 text-start tap-highlight"
          :class="selectedSlotId === slot.id ? 'ring-2 ring-sz-blue' : ''"
          @click="selectedSlotId = slot.id"
        >
          <span class="font-semibold">{{ slot.startTime }} – {{ slot.endTime }}</span>
          <span class="block text-sm text-sz-gray-500 mt-1">
            {{ formatPrice(slot.price) }} {{ t('clubs.currency') }}
          </span>
        </button>
      </div>
      <p v-else class="ios-footnote">{{ t('clubs.noSlots') }}</p>
    </section>

    <div v-if="selectedSlot" class="glass-panel sticky bottom-24 md:bottom-6 p-4 md:p-6">
      <h3 class="ios-title-3 mb-2">{{ t('booking.summary') }}</h3>
      <p class="text-sm text-sz-gray-600">
        {{ pickName(selectedSlot.court!) }} · {{ selectedSlot.startTime }}–{{ selectedSlot.endTime }} ·
        {{ formatDate(selectedSlot.date) }}
      </p>
      <p class="mt-1 font-bold">{{ formatPrice(selectedSlot.price) }} {{ t('clubs.currency') }}</p>
      <p class="ios-footnote mt-2">{{ t('booking.payAtClub') }}</p>
      <p v-if="bookingError" class="mt-2 text-sm text-sz-pink">{{ bookingError }}</p>
      <button
        class="ios-btn-primary mt-4 w-full sm:w-auto"
        :disabled="bookingPending"
        @click="confirmBooking"
      >
        {{ loggedIn ? t('booking.confirm') : t('booking.loginRequired') }}
      </button>
    </div>
  </div>
</template>
