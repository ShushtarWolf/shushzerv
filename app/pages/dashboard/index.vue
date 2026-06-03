<script setup lang="ts">
import type { Booking } from '~/types'

definePageMeta({ middleware: ['auth', 'role-athlete'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useUserSession()
const { pickName, localized, formatPrice, formatDate } = useLocaleContent()

useHead({ title: () => t('dashboard.title') })

const { data: bookings, refresh } = await useApiFetch<Booking[]>('/api/bookings')

const upcoming = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return (bookings.value ?? []).filter(
    (b) => b.status !== 'CANCELLED' && b.slot && b.slot.date >= today,
  )
})
const past = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return (bookings.value ?? []).filter(
    (b) => b.status === 'CANCELLED' || (b.slot && b.slot.date < today),
  )
})

async function cancelBooking(id: string) {
  await $fetch(`/api/bookings/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-1">{{ t('dashboard.title') }}</h1>
    <p class="ios-footnote mb-8">{{ t('dashboard.welcome') }}، {{ user?.name }}</p>

    <h2 class="ios-title-2 mb-4">{{ t('dashboard.upcoming') }}</h2>
    <div v-if="upcoming.length" class="space-y-3 mb-10">
      <div v-for="b in upcoming" :key="b.id" class="ios-card p-4">
        <p class="font-semibold">{{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }}</p>
        <p class="ios-footnote">
          {{ b.slot?.court ? pickName(b.slot.court) : '' }} ·
          {{ b.slot?.date ? formatDate(b.slot.date) : '' }} ·
          {{ b.slot?.startTime }}–{{ b.slot?.endTime }}
        </p>
        <p class="text-sm mt-1">{{ formatPrice(b.slot?.price ?? 0) }} {{ t('clubs.currency') }} · {{ t('booking.payAtClub') }}</p>
        <button class="mt-3 text-sm font-medium text-sz-pink" @click="cancelBooking(b.id)">{{ t('dashboard.cancel') }}</button>
      </div>
    </div>
    <p v-else class="ios-footnote mb-10">{{ t('dashboard.noBookings') }}</p>

    <h2 v-if="past.length" class="ios-title-2 mb-4">{{ t('dashboard.past') }}</h2>
    <div v-if="past.length" class="space-y-3 opacity-75">
      <div v-for="b in past" :key="b.id" class="ios-card p-4">
        <p class="font-semibold">{{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }}</p>
        <p class="ios-footnote">{{ b.status === 'CANCELLED' ? t('dashboard.cancelled') : t('dashboard.confirmed') }}</p>
      </div>
    </div>

    <NuxtLink :to="localePath('/clubs')" class="ios-btn-primary mt-8 inline-flex">{{ t('hero.cta') }}</NuxtLink>
  </div>
</template>
