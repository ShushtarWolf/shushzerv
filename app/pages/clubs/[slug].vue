<script setup lang="ts">
import type { Club, ReservedEquipmentLine, ScheduleEvent } from '~/types'
import type { EquipmentPickerItem } from '~/composables/useEquipmentBooking'
import { equipmentRentalSubtotal, equipmentSelectionsPayload } from '~/composables/useEquipmentBooking'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { pickName, localized, formatPrice, formatRating, formatTimeRange, formatDate, formatTime } = useLocaleContent()
const { loggedIn } = useUserSession()
const toast = useToast()
const { requireLogin, saveBookingIntent, consumeBookingIntent } = useAuthRedirect()
const payWithWallet = ref(true)
const playerCount = ref(2)
const createMatchAfterBook = ref(false)
const createdMatchId = ref('')

const { data: wallet, refresh: refreshWallet } = await useApiFetch<{ balance?: number }>('/api/wallet', {
  immediate: false,
  lazy: true,
  server: false,
})

watch(loggedIn, (v) => {
  if (v) refreshWallet()
}, { immediate: true })

const walletBalance = computed(() => wallet.value?.balance ?? 0)

const slug = computed(() => String(route.params.slug))
const initialScheduleDate = computed(() => {
  const raw = route.query.date
  const date = Array.isArray(raw) ? raw[0] : raw
  return typeof date === 'string' && date ? date : undefined
})

const { data: club, error } = await useApiFetch<Club>(() => `/api/clubs/${slug.value}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Club not found' })
}

useHead({ title: () => (club.value ? pickName(club.value) : t('clubs.details')) })

const accent = '#2C4A6E'

const clubSports = computed(() => {
  const seen = new Set<string>()
  const sports: Array<{ slug: string; name: string }> = []
  for (const court of club.value?.courts ?? []) {
    if (court.sport && !seen.has(court.sport.slug)) {
      seen.add(court.sport.slug)
      sports.push({ slug: court.sport.slug, name: pickName(court.sport) })
    }
  }
  return sports
})

const selectedCourtId = ref<string>('')
const selectedSlotId = ref<string>('')
const selectedSlotPrice = ref(0)
const selectedSlotLabel = ref('')
const lastBooking = ref<{
  date: string
  startTime: string
  endTime: string
  title: string
  location: string
  uid: string
} | null>(null)
const bookingDone = ref(false)
const bookingError = ref('')
const bookingPending = ref(false)
const scheduleFrom = ref('')
const scheduleTo = ref('')

watch(
  () => club.value?.courts,
  (courts) => {
    if (courts?.length && !selectedCourtId.value) {
      selectedCourtId.value = courts[0].id
    }
  },
  { immediate: true },
)

const scheduleReady = computed(
  () => !!(selectedCourtId.value && scheduleFrom.value && scheduleTo.value),
)

const { data: scheduleData, pending: schedulePending, refresh: refreshSchedule } = await useApiFetch<{ events: ScheduleEvent[] }>(
  () => `/api/clubs/${slug.value}/schedule`,
  {
    query: computed(() => ({
      from: scheduleFrom.value || undefined,
      to: scheduleTo.value || undefined,
      courtId: selectedCourtId.value || undefined,
    })),
    immediate: false,
  },
)

const scheduleEvents = computed(() => scheduleData.value?.events ?? [])
const scheduleFetched = ref(false)

const scheduleLoading = computed(
  () => !scheduleReady.value || schedulePending.value || !scheduleFetched.value,
)

const bookingStep = computed(() => {
  if (selectedSlotId.value) return 3
  if (selectedCourtId.value) return 2
  return 1
})

const selectedEquipment = ref<Record<string, number>>({})
const availableEquipment = ref<EquipmentPickerItem[]>([])
const lastReservedEquipment = ref<ReservedEquipmentLine[]>([])

const selectedSlotDate = computed(() =>
  scheduleEvents.value.find((e) => e.slotId === selectedSlotId.value)?.date ?? '',
)

const equipmentRental = computed(() =>
  equipmentRentalSubtotal(availableEquipment.value, selectedEquipment.value),
)

const bookingGrandTotal = computed(() => selectedSlotPrice.value + equipmentRental.value)

const canPayWithWallet = computed(() => loggedIn.value && walletBalance.value >= bookingGrandTotal.value)

watch([selectedCourtId, scheduleFrom, scheduleTo, slug], () => {
  selectedSlotId.value = ''
  selectedEquipment.value = {}
  if (scheduleReady.value) {
    scheduleFetched.value = false
    refreshSchedule()
  }
})

async function loadEquipmentAvailability() {
  if (!selectedSlotDate.value || !selectedCourtId.value) {
    availableEquipment.value = []
    selectedEquipment.value = {}
    return
  }
  try {
    availableEquipment.value = await $fetch<EquipmentPickerItem[]>(
      `/api/clubs/${slug.value}/equipment-availability`,
      { query: { date: selectedSlotDate.value, courtId: selectedCourtId.value } },
    )
  } catch {
    availableEquipment.value = []
  }
  const allowed = new Set(availableEquipment.value.map((i) => i.id))
  selectedEquipment.value = Object.fromEntries(
    Object.entries(selectedEquipment.value).filter(([id]) => allowed.has(id)),
  )
}

watch([selectedSlotId, selectedCourtId], () => {
  loadEquipmentAvailability()
})

watch(schedulePending, (pending, wasPending) => {
  if (wasPending && !pending && scheduleReady.value) {
    scheduleFetched.value = true
  }
})

function restoreBookingIntent() {
  const intent = consumeBookingIntent()
  if (!intent) return
  if (intent.courtId && club.value?.courts?.some((c) => c.id === intent.courtId)) {
    selectedCourtId.value = intent.courtId
  }
  if (intent.payWithWallet != null) payWithWallet.value = intent.payWithWallet
  if (intent.playerCount) playerCount.value = intent.playerCount
  if (intent.createMatchAfterBook != null) createMatchAfterBook.value = intent.createMatchAfterBook
  const event = scheduleEvents.value.find((e) => e.slotId === intent.slotId)
  if (event) onSelectSlot(event)
  if (intent.equipment) selectedEquipment.value = { ...intent.equipment }
}

watch(scheduleFetched, (ready) => {
  if (ready) restoreBookingIntent()
})

function onScheduleRange({ from, to }: { from: string; to: string }) {
  scheduleFrom.value = from
  scheduleTo.value = to
}

function onSelectSlot(event: ScheduleEvent) {
  if (!event.slotId) return
  selectedSlotId.value = event.slotId
  selectedSlotPrice.value = event.price ?? 0
  selectedSlotLabel.value = `${event.title} · ${formatTimeRange(event.startTime, event.endTime)}`
  selectedEquipment.value = {}
}

function icsEscape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toIcsDateTime(date: string, time: string) {
  const [y, m, d] = date.split('-')
  const [h, min = '00'] = time.split(':')
  return `${y}${m}${d}T${h.padStart(2, '0')}${min.padStart(2, '0')}00`
}

function icsUtcNow() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')
}

function buildBookingIcs(snapshot: NonNullable<typeof lastBooking.value>) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shushzerv//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${snapshot.uid}`,
    `DTSTAMP:${icsUtcNow()}`,
    `DTSTART:${toIcsDateTime(snapshot.date, snapshot.startTime)}`,
    `DTEND:${toIcsDateTime(snapshot.date, snapshot.endTime)}`,
    `SUMMARY:${icsEscape(snapshot.title)}`,
    `LOCATION:${icsEscape(snapshot.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

const bookingIcsHref = computed(() => {
  const snapshot = lastBooking.value
  if (!snapshot?.date || !snapshot.startTime || !snapshot.endTime) return ''
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildBookingIcs(snapshot))}`
})

function clubReturnPath(date?: string) {
  const params = new URLSearchParams({ book: '1' })
  const d = date || initialScheduleDate.value
  if (d) params.set('date', d)
  return `${localePath(`/clubs/${slug.value}`)}?${params.toString()}`
}

async function confirmBooking() {
  bookingError.value = ''
  if (!loggedIn.value) {
    const event = scheduleEvents.value.find((e) => e.slotId === selectedSlotId.value)
    saveBookingIntent({
      slotId: selectedSlotId.value,
      courtId: selectedCourtId.value || undefined,
      date: event?.date,
      payWithWallet: payWithWallet.value,
      playerCount: playerCount.value,
      createMatchAfterBook: createMatchAfterBook.value,
      equipment: { ...selectedEquipment.value },
    })
    return requireLogin(clubReturnPath(event?.date))
  }
  if (!selectedSlotId.value) return
  bookingPending.value = true
  try {
    const slotId = selectedSlotId.value
    const event = scheduleEvents.value.find(e => e.slotId === slotId)
    const res = await $fetch<{ booking: { equipment?: ReservedEquipmentLine[] }; match?: { id: string } }>('/api/bookings', {
      method: 'POST',
      body: {
        slotId,
        payWithWallet: payWithWallet.value && canPayWithWallet.value,
        playerCount: playerCount.value,
        createMatch: createMatchAfterBook.value,
        equipment: equipmentSelectionsPayload(selectedEquipment.value),
      },
    })
    if (event && club.value) {
      lastBooking.value = {
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        title: `${event.title} — ${pickName(club.value)}`,
        location: localized(club.value.addressFa, club.value.addressEn),
        uid: `booking-${slotId}@shushzerv`,
      }
    } else {
      lastBooking.value = null
    }
    bookingDone.value = true
    createdMatchId.value = res.match?.id ?? ''
    lastReservedEquipment.value = res.booking?.equipment ?? []
    selectedSlotId.value = ''
    selectedEquipment.value = {}
    toast.success(t('booking.success'))
    await Promise.all([refreshSchedule(), refreshWallet()])
  } catch (e: unknown) {
    const err = e as { statusCode?: number; data?: { message?: string }; statusMessage?: string }
    if (err?.statusCode === 402) {
      bookingError.value = t('wallet.insufficientBalance')
      toast.error(t('wallet.insufficientBalance'))
    } else {
      const msg = err?.data?.message || err?.statusMessage || t('common.error')
      bookingError.value = msg
      toast.error(msg)
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
            <SzBadge v-for="s in clubSports" :key="s.slug" tone="blue" class="!text-xs">
              <span class="inline-flex items-center gap-1">
                <SportIcon :slug="s.slug" size="xs" />
                {{ s.name }}
              </span>
            </SzBadge>
          </div>
        </div>
        <div class="shrink-0 text-end">
          <span class="sz-stat text-brand-orange">★ {{ formatRating(club.rating) }}</span>
          <p class="text-sm font-bold text-brand-gray-600">
            {{ t('clubs.from') }} {{ formatPrice(club.priceFrom) }} {{ t('clubs.currency') }}
          </p>
        </div>
      </div>
      <p v-if="club.cancellationPolicyFa || club.cancellationPolicyEn" class="mt-4 rounded-xl bg-sz-gray-50 p-4 text-sm text-sz-gray-700">
        {{ t('dashboard.cancellationPolicy') }}: {{ localized(club.cancellationPolicyFa ?? '', club.cancellationPolicyEn ?? '') }}
        <span v-if="club.cancellationHours"> ({{ club.cancellationHours }}h)</span>
      </p>
    </div>

    <EquipmentSection v-if="club.addons?.length" :items="club.addons" />

    <Teleport to="body">
      <div v-if="bookingDone" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-ios-lg bg-white p-8 text-center shadow-lifted animate-success-check">
          <p class="text-5xl">✅</p>
          <p class="mt-4 text-xl font-extrabold text-brand-green">{{ t('booking.success') }}</p>
          <p class="mt-2 text-sm text-brand-gray-600">
            {{ payWithWallet && canPayWithWallet ? t('wallet.payWithWallet') : t('booking.payAtClub') }}
          </p>
          <BookingEquipmentList v-if="lastReservedEquipment.length" :lines="lastReservedEquipment" />
          <p class="mt-4 text-sm font-semibold text-brand-orange">{{ t('booking.shareMatchHint') }}</p>
          <div class="mt-6 flex flex-col gap-2">
            <SzButton :to="localePath('/dashboard?tab=bookings')" block>{{ t('booking.viewBookings') }}</SzButton>
            <SzButton v-if="createdMatchId" :to="localePath(`/matches/${createdMatchId}`)" variant="ghost" block>{{ t('matches.view') }}</SzButton>
            <SzButton v-else :to="localePath('/matches')" variant="ghost" block>{{ t('matches.create') }}</SzButton>
            <a
              v-if="bookingIcsHref"
              :href="bookingIcsHref"
              download="booking.ics"
              class="text-sm text-brand-gray-500"
            >{{ t('booking.addToCalendar') }}</a>
            <button type="button" class="text-sm text-brand-gray-500" @click="bookingDone = false">{{ t('common.close') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <section class="mb-8">
      <h2 class="ios-title-3 mb-4">{{ t('booking.title') }}</h2>

      <ol class="mb-6 flex items-center justify-center gap-1 text-sm font-bold sm:gap-2">
        <li
          v-for="(step, idx) in [
            { n: 1, label: t('clubs.bookingStepCourt') },
            { n: 2, label: t('clubs.bookingStepSlot') },
            { n: 3, label: t('clubs.bookingStepConfirm') },
          ]"
          :key="step.n"
          class="flex items-center gap-1 sm:gap-2"
        >
          <span
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs transition"
            :class="bookingStep >= step.n
              ? 'bg-brand-orange text-brand-primary shadow-card'
              : 'bg-brand-gray-100 text-brand-gray-500'"
          >{{ step.n }}</span>
          <span
            class="hidden sm:inline"
            :class="bookingStep >= step.n ? 'text-brand-gray-900' : 'text-brand-gray-500'"
          >{{ step.label }}</span>
          <span v-if="idx < 2" class="mx-0.5 text-brand-gray-300 sm:mx-1" aria-hidden="true">→</span>
        </li>
      </ol>

      <div class="mb-6">
        <p class="mb-3 text-sm font-bold text-brand-gray-700">{{ t('clubs.selectCourt') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="court in club.courts"
            :key="court.id"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-bold transition tap-highlight"
            :class="selectedCourtId === court.id
              ? 'border-brand-orange bg-brand-orange text-brand-primary ring-2 ring-brand-orange/30 ring-offset-2'
              : 'border-brand-gray-200 bg-white'"
            @click="selectedCourtId = court.id; selectedSlotId = ''"
          >
            <span class="inline-flex items-center gap-1.5" :class="selectedCourtId === court.id ? 'text-white' : 'text-brand-gray-700'">
              <SportIcon v-if="court.sport" :slug="court.sport.slug" size="xs" />
              {{ pickName(court) }}
            </span>
          </button>
        </div>
      </div>

      <ScheduleCalendar
        bookable
        hide-court-filter
        :events="scheduleEvents"
        :loading="scheduleLoading"
        :selected-slot-id="selectedSlotId"
        :initial-date="initialScheduleDate"
        @range-change="onScheduleRange"
        @select-slot="onSelectSlot"
      />
    </section>

    <ClubReviews v-if="club" :club-id="club.id" @rated="refreshNuxtData()" />

    <section v-if="club.activities?.length" class="mb-8">
      <h2 class="ios-title-3 mb-4">{{ t('activities.title') }}</h2>
      <div class="space-y-3">
        <div v-for="a in club.activities" :key="a.id" class="glass-panel p-4">
          <p class="font-bold text-brand-gray-900">{{ localized(a.titleFa, a.titleEn) }}</p>
          <p class="text-sm text-brand-gray-600">{{ localized(a.descFa, a.descEn) }}</p>
          <p class="mt-1 text-xs text-brand-gray-500">{{ formatDate(a.date) }} · {{ formatTime(a.startTime) }}</p>
        </div>
      </div>
    </section>

    <Transition name="slide-up">
      <div
        v-if="selectedSlotId"
        class="fixed inset-x-0 z-30 border-t-2 border-brand-orange/20 bg-white/95 p-4 shadow-lifted backdrop-blur-xl bottom-[calc(var(--sz-tab-bar-height)+var(--sz-safe-bottom))] md:bottom-6 md:inset-x-auto md:mx-auto md:max-w-lg md:rounded-2xl md:border"
        style="padding-bottom: 1rem"
      >
        <div class="mx-auto max-w-6xl md:max-w-none">
          <p class="text-xs font-bold uppercase tracking-wide text-brand-orange">{{ t('clubs.bookingStepConfirm') }}</p>
          <p class="mt-1 text-sm text-brand-gray-600">{{ selectedSlotLabel }}</p>
          <p class="text-xl font-black text-brand-orange">
            {{ formatPrice(bookingGrandTotal) }} {{ t('clubs.currency') }}
          </p>
          <p v-if="equipmentRental > 0" class="text-xs text-brand-gray-500">
            {{ t('equipment.rentalSubtotal') }}: {{ formatPrice(equipmentRental) }} {{ t('clubs.currency') }}
          </p>
          <EquipmentPicker v-model="selectedEquipment" :items="availableEquipment" />
          <p v-if="bookingError" class="mt-1 text-sm text-brand-pink">{{ bookingError }}</p>
          <label v-if="loggedIn" class="mt-2 flex cursor-pointer items-center gap-2 text-sm">
            <input v-model="payWithWallet" type="checkbox" class="rounded border-brand-gray-300" />
            <span>{{ t('wallet.payWithWallet') }} ({{ formatPrice(walletBalance) }})</span>
            <SzDemoBadge />
          </label>
          <p v-if="loggedIn && payWithWallet && bookingGrandTotal > 0 && !canPayWithWallet" class="mt-1 text-sm text-brand-pink">
            {{ t('wallet.insufficientBalance') }}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <label for="booking-player-count">{{ t('booking.playerCount') }}</label>
            <select id="booking-player-count" v-model.number="playerCount" class="ios-input !py-1" :aria-label="t('booking.playerCount')">
              <option :value="2">2</option>
              <option :value="4">4</option>
            </select>
            <label for="booking-create-match" class="flex items-center gap-2">
              <input id="booking-create-match" v-model="createMatchAfterBook" type="checkbox" />
              {{ t('booking.createMatch') }}
            </label>
          </div>
          <SzButton class="mt-3" block :disabled="bookingPending" @click="confirmBooking">
            {{ loggedIn ? t('booking.confirm') : t('booking.continueToLogin') }}
          </SzButton>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
