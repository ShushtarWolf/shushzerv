<script setup lang="ts">
import type { Club, Slot } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { pickName, localized, formatPrice, formatDate, localDateISO } = useLocaleContent()
const { loggedIn } = useUserSession()
const payWithWallet = ref(true)

const { data: wallet, refresh: refreshWallet } = await useApiFetch<{ balance?: number }>('/api/wallet', {
  immediate: false,
  lazy: true,
  server: false,
})

watch(loggedIn, (v) => {
  if (v) refreshWallet()
}, { immediate: true })

const walletBalance = computed(() => wallet.value?.balance ?? 0)
const canPayWithWallet = computed(() => loggedIn.value && selectedSlot.value && walletBalance.value >= (selectedSlot.value?.price ?? 0))

const slug = computed(() => String(route.params.slug))

const { data: club, error } = await useApiFetch<Club>(() => `/api/clubs/${slug.value}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Club not found' })
}

useHead({ title: () => (club.value ? pickName(club.value) : t('clubs.details')) })

const accent = computed(() => club.value?.courts?.[0]?.sport?.color ?? '#ff5a1f')

const clubSports = computed(() => {
  const seen = new Set<string>()
  const sports: Array<{ slug: string; name: string; color: string }> = []
  for (const court of club.value?.courts ?? []) {
    if (court.sport && !seen.has(court.sport.slug)) {
      seen.add(court.sport.slug)
      sports.push({ slug: court.sport.slug, name: pickName(court.sport), color: court.sport.color })
    }
  }
  return sports
})

const selectedCourtId = ref<string>('')
const selectedDate = ref(localDateISO())
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

const { data: slots, refresh: refreshSlots, pending: slotsPending } = await useApiFetch<Slot[]>('/api/slots', {
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
    opts.push(localDateISO(d))
  }
  return opts
})

const selectedSlot = computed(() => slots.value?.find((s) => s.id === selectedSlotId.value))

async function confirmBooking() {
  bookingError.value = ''
  if (!loggedIn.value) return navigateTo(localePath('/login'))
  if (!selectedSlotId.value) return
  bookingPending.value = true
  try {
    await $fetch('/api/bookings', {
      method: 'POST',
      body: { slotId: selectedSlotId.value, payWithWallet: payWithWallet.value && canPayWithWallet.value },
    })
    bookingDone.value = true
    selectedSlotId.value = ''
    await Promise.all([refreshSlots(), refreshWallet()])
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { message?: string }; statusMessage?: string }
    if (err?.statusCode === 402) {
      bookingError.value = t('wallet.insufficientBalance')
    } else {
      bookingError.value = err?.data?.message || err?.statusMessage || 'Error'
    }
  } finally {
    bookingPending.value = false
  }
}
</script>

<template>
  <div v-if="club" class="page-enter mx-auto max-w-6xl px-4 py-8 pb-36 sm:px-6">
    <BackLink to="/clubs" />

    <div class="mb-6 overflow-hidden rounded-ios-lg ring-2 ring-inset" :style="{ '--tw-ring-color': accent }">
      <div class="h-44 sm:h-56">
        <ClubCover :club="club" />
      </div>
    </div>

    <div class="glass-panel mb-8 overflow-hidden p-6 md:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h1 class="sz-headline">{{ pickName(club) }}</h1>
          <p class="mt-2 flex items-center gap-1.5 text-brand-gray-600">
            <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            {{ localized(club.addressFa, club.addressEn) }}
          </p>
          <div v-if="clubSports.length" class="mt-3 flex flex-wrap gap-2">
            <SzBadge v-for="s in clubSports" :key="s.slug" tone="sport" :sport-color="s.color">
              <span class="inline-flex items-center gap-1" :style="{ color: s.color }">
                <SportIcon :slug="s.slug" size="xs" />
                {{ s.name }}
              </span>
            </SzBadge>
          </div>
        </div>
        <div class="shrink-0 text-end">
          <span class="sz-stat text-brand-orange">★ {{ club.rating.toFixed(1) }}</span>
          <p class="text-sm font-bold text-brand-gray-600">
            {{ t('clubs.from') }} {{ formatPrice(club.priceFrom) }} {{ t('clubs.currency') }}
          </p>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="bookingDone" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-ios-lg bg-white p-8 text-center shadow-lifted animate-success-check">
          <p class="text-5xl">✅</p>
          <p class="mt-4 text-xl font-extrabold text-brand-green">{{ t('booking.success') }}</p>
          <p class="mt-2 text-sm text-brand-gray-600">
            {{ payWithWallet && canPayWithWallet ? t('wallet.payWithWallet') : t('booking.payAtClub') }}
          </p>
          <p class="mt-4 text-sm font-semibold text-brand-orange">{{ t('booking.shareMatchHint') }}</p>
          <div class="mt-6 flex flex-col gap-2">
            <NuxtLink :to="localePath('/matches')" class="ios-btn-primary">{{ t('matches.create') }}</NuxtLink>
            <NuxtLink :to="localePath('/dashboard')" class="ios-btn-ghost">{{ t('booking.viewBookings') }}</NuxtLink>
            <button type="button" class="text-sm text-brand-gray-500" @click="bookingDone = false">{{ t('common.close') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <section class="mb-6">
      <h2 class="ios-title-3 mb-3">{{ t('clubs.selectCourt') }}</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="court in club.courts"
          :key="court.id"
          type="button"
          class="rounded-full border px-4 py-2 text-sm font-bold transition tap-highlight"
          :class="selectedCourtId === court.id ? 'border-brand-orange bg-brand-orange text-white' : 'border-brand-gray-200 bg-white'"
          @click="selectedCourtId = court.id; selectedSlotId = ''"
        >
          <span
            class="inline-flex items-center gap-1.5"
            :class="selectedCourtId === court.id ? 'text-white' : ''"
            :style="selectedCourtId !== court.id && court.sport ? { color: court.sport.color } : undefined"
          >
            <SportIcon v-if="court.sport" :slug="court.sport.slug" size="xs" />
            {{ pickName(court) }}
          </span>
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
          class="shrink-0 rounded-full border px-4 py-2 text-sm font-bold whitespace-nowrap tap-highlight"
          :class="selectedDate === d ? 'border-brand-orange bg-brand-orange text-white' : 'border-brand-gray-200 bg-white'"
          @click="selectedDate = d; selectedSlotId = ''"
        >
          {{ formatDate(d) }}
        </button>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="ios-title-3 mb-3">{{ t('clubs.selectSlot') }}</h2>
      <SzSkeleton v-if="slotsPending" :lines="2" />
      <div v-else-if="slots?.length" class="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="slot in slots"
          :key="slot.id"
          type="button"
          class="rounded-2xl border-2 p-3 text-start font-semibold transition tap-highlight"
          :class="selectedSlotId === slot.id
            ? 'border-brand-orange bg-brand-orange/10 ring-2 ring-brand-orange'
            : 'border-brand-green/40 bg-brand-green/5 hover:border-brand-green'"
          @click="selectedSlotId = slot.id"
        >
          <span class="block text-sm font-bold">{{ slot.startTime }} – {{ slot.endTime }}</span>
          <span class="mt-1 block text-xs text-brand-gray-600">
            {{ formatPrice(slot.price) }} {{ t('clubs.currency') }}
          </span>
        </button>
      </div>
      <p v-else class="ios-footnote">{{ t('clubs.noSlots') }}</p>
    </section>

    <div
      v-if="selectedSlot"
      class="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 p-4 shadow-lifted backdrop-blur-xl md:bottom-6 md:inset-x-auto md:mx-auto md:max-w-lg md:rounded-2xl md:border"
      style="padding-bottom: calc(1rem + var(--sz-safe-bottom))"
    >
      <div class="mx-auto max-w-6xl md:max-w-none">
        <p class="text-sm text-brand-gray-600">
          {{ pickName(selectedSlot.court!) }} · {{ selectedSlot.startTime }}–{{ selectedSlot.endTime }}
        </p>
        <p class="text-xl font-black text-brand-orange">
          {{ formatPrice(selectedSlot.price) }} {{ t('clubs.currency') }}
        </p>
        <p v-if="bookingError" class="mt-1 text-sm text-brand-pink">{{ bookingError }}</p>
        <label v-if="loggedIn" class="mt-2 flex cursor-pointer items-center gap-2 text-sm">
          <input v-model="payWithWallet" type="checkbox" class="rounded border-brand-gray-300" />
          <span>{{ t('wallet.payWithWallet') }} ({{ formatPrice(walletBalance) }})</span>
        </label>
        <SzButton class="mt-3" block :disabled="bookingPending" @click="confirmBooking">
          {{ loggedIn ? t('booking.confirm') : t('booking.loginRequired') }}
        </SzButton>
      </div>
    </div>
  </div>
</template>
