<script setup lang="ts">
import type { Club, ScheduleEvent } from '~/types'
import type { EquipmentPickerItem } from '~/composables/useEquipmentBooking'
import { equipmentRentalSubtotal, equipmentSelectionsPayload } from '~/composables/useEquipmentBooking'

const props = defineProps<{ club: Club }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const localePath = useLocalePath()
const { pickName, localized, formatPrice, formatRating, formatTimeRange } = useLocaleContent()
const { loggedIn } = useUserSession()
const { requireLogin, saveBookingIntent } = useAuthRedirect()
const toast = useToast()

const selectedCourtId = ref('')
const selectedSlotId = ref('')
const selectedSlotPrice = ref(0)
const selectedEquipment = ref<Record<string, number>>({})
const availableEquipment = ref<EquipmentPickerItem[]>([])

const selectedSlotDate = computed(() =>
  scheduleEvents.value.find((e) => e.slotId === selectedSlotId.value)?.date ?? '',
)

const equipmentRental = computed(() =>
  equipmentRentalSubtotal(availableEquipment.value, selectedEquipment.value),
)

const bookingGrandTotal = computed(() => selectedSlotPrice.value + equipmentRental.value)
const selectedSlotLabel = ref('')
const bookingError = ref('')
const scheduleFrom = ref('')
const scheduleTo = ref('')
const scheduleFetched = ref(false)

const sportChips = computed(() => {
  const seen = new Set<string>()
  const chips: Array<{ slug: string; name: string }> = []
  for (const court of props.club.courts ?? []) {
    if (court.sport && !seen.has(court.sport.slug)) {
      seen.add(court.sport.slug)
      chips.push({ slug: court.sport.slug, name: pickName(court.sport) })
    }
  }
  return chips.slice(0, 3)
})

function resetForClub() {
  selectedCourtId.value = props.club.courts?.[0]?.id ?? ''
  selectedSlotId.value = ''
  selectedEquipment.value = {}
  bookingError.value = ''
  scheduleFetched.value = false
}

watch(() => props.club.slug, resetForClub, { immediate: true })

const scheduleReady = computed(
  () => !!(selectedCourtId.value && scheduleFrom.value && scheduleTo.value),
)

const { data: scheduleData, pending: schedulePending, refresh: refreshSchedule } = useApiFetch<{ events: ScheduleEvent[] }>(
  () => `/api/clubs/${props.club.slug}/schedule`,
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

const scheduleLoading = computed(
  () => !scheduleReady.value || schedulePending.value || !scheduleFetched.value,
)

function loadSchedule() {
  if (!scheduleReady.value) return
  scheduleFetched.value = false
  refreshSchedule()
}

watch([selectedCourtId, scheduleFrom, scheduleTo], () => {
  selectedSlotId.value = ''
  selectedEquipment.value = {}
  loadSchedule()
})

async function loadEquipmentAvailability() {
  if (!selectedSlotDate.value || !selectedCourtId.value) {
    availableEquipment.value = []
    return
  }
  try {
    availableEquipment.value = await $fetch<EquipmentPickerItem[]>(
      `/api/clubs/${props.club.slug}/equipment-availability`,
      { query: { date: selectedSlotDate.value, courtId: selectedCourtId.value } },
    )
  } catch {
    availableEquipment.value = []
  }
}

watch([selectedSlotId, selectedCourtId], () => {
  if (!selectedSlotId.value) {
    availableEquipment.value = []
    return
  }
  loadEquipmentAvailability()
})

watch(schedulePending, (pending, wasPending) => {
  if (wasPending && !pending && scheduleReady.value) {
    scheduleFetched.value = true
  }
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

async function confirmBooking() {
  bookingError.value = ''
  if (!loggedIn.value) {
    const event = scheduleEvents.value.find((e) => e.slotId === selectedSlotId.value)
    saveBookingIntent({
      slotId: selectedSlotId.value,
      courtId: selectedCourtId.value || undefined,
      date: event?.date,
      equipment: { ...selectedEquipment.value },
    })
    return requireLogin(localePath(`/clubs/${props.club.slug}?book=1`))
  }
  if (!selectedSlotId.value) return
  bookingPending.value = true
  try {
    await $fetch('/api/bookings', {
      method: 'POST',
      body: {
        slotId: selectedSlotId.value,
        equipment: equipmentSelectionsPayload(selectedEquipment.value),
      },
    })
    toast.success(t('booking.success'))
    emit('close')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    const msg = err?.data?.message || err?.statusMessage || t('common.error')
    bookingError.value = msg
    toast.error(msg)
  } finally {
    bookingPending.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="club-map-reserve-overlay" @click.self="emit('close')">
      <div
        class="club-map-reserve-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`${t('booking.title')} — ${pickName(club)}`"
        @click.stop
      >
        <button
          type="button"
          class="club-map-reserve-close"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          ×
        </button>

        <div class="club-map-reserve-header">
          <div class="club-map-reserve-cover">
            <ClubCover :club="club" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold uppercase tracking-wide text-brand-orange">{{ t('map.reserveNow') }}</p>
            <h3 class="club-map-reserve-title">{{ pickName(club) }}</h3>
            <p class="club-map-reserve-address">{{ localized(club.addressFa, club.addressEn) }}</p>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <SzBadge tone="yellow">★ {{ formatRating(club.rating) }}</SzBadge>
              <span class="text-sm font-bold text-brand-orange">
                {{ t('clubs.from') }} {{ formatPrice(club.priceFrom) }} {{ t('clubs.currency') }}
              </span>
            </div>
            <div v-if="sportChips.length" class="mt-2 flex flex-wrap gap-1">
              <SzBadge v-for="s in sportChips" :key="s.slug" tone="blue" class="!text-xs">
                <span class="inline-flex items-center gap-1">
                  <SportIcon :slug="s.slug" size="xs" />
                  {{ s.name }}
                </span>
              </SzBadge>
            </div>
          </div>
        </div>

        <div class="club-map-reserve-body">
          <div v-if="(club.courts?.length ?? 0) > 1" class="mb-3 flex flex-wrap gap-2">
            <button
              v-for="court in club.courts"
              :key="court.id"
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-bold transition tap-highlight"
              :class="selectedCourtId === court.id
                ? 'border-brand-orange bg-brand-orange text-white'
                : 'border-brand-gray-200 bg-white text-brand-gray-700'"
              @click="selectedCourtId = court.id"
            >
              {{ pickName(court) }}
            </button>
          </div>

          <ScheduleCalendar
            compact
            bookable
            hide-court-filter
            :events="scheduleEvents"
            :loading="scheduleLoading"
            :selected-slot-id="selectedSlotId"
            @range-change="onScheduleRange"
            @select-slot="onSelectSlot"
          />

          <div v-if="selectedSlotId" class="club-map-reserve-confirm">
            <p class="text-sm text-brand-gray-600">{{ selectedSlotLabel }}</p>
            <p class="text-lg font-black text-brand-orange">
              {{ formatPrice(bookingGrandTotal) }} {{ t('clubs.currency') }}
            </p>
            <EquipmentPicker v-model="selectedEquipment" :items="availableEquipment" />
            <p v-if="bookingError" class="text-sm text-brand-pink">{{ bookingError }}</p>
            <div class="mt-3 flex flex-col gap-2 sm:flex-row">
              <SzButton block :disabled="bookingPending" @click="confirmBooking">
                {{ loggedIn ? t('booking.confirm') : t('booking.loginRequired') }}
              </SzButton>
              <SzButton :to="localePath(`/clubs/${club.slug}`)" variant="ghost" block>{{ t('map.viewClub') }}</SzButton>
            </div>
          </div>

          <p v-else class="mt-3 text-center text-xs text-brand-gray-500">{{ t('schedule.tapToBook') }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.club-map-reserve-overlay {
  @apply fixed inset-0 z-[2000] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm sm:items-center sm:p-4;
}

.club-map-reserve-modal {
  @apply relative flex max-h-[min(92vh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lifted;
}

.club-map-reserve-close {
  @apply absolute top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-xl leading-none text-brand-gray-600 transition hover:bg-black/10 ltr:right-3 rtl:left-3;
}

.club-map-reserve-header {
  @apply flex shrink-0 gap-3 border-b border-black/5 p-4 pe-12;
}

.club-map-reserve-cover {
  @apply h-20 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5;
}

.club-map-reserve-title {
  @apply text-lg font-extrabold leading-tight text-brand-gray-900;
}

.club-map-reserve-address {
  @apply mt-1 line-clamp-2 text-xs text-brand-gray-500;
}

.club-map-reserve-body {
  @apply overflow-y-auto p-4 pt-3;
}

.club-map-reserve-confirm {
  @apply mt-4 rounded-xl bg-brand-gray-50 p-3;
}
</style>
