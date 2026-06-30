<script setup lang="ts">
import type { Club, ScheduleEvent } from '~/types'

const props = defineProps<{
  mode: 'athlete' | 'coach'
  coachId: string
  sportSlug: string
  sessionPrice: number
  students?: Array<{ id: string; name: string; email: string }>
}>()

const emit = defineEmits<{
  booked: []
}>()

const { t } = useI18n()
const { pickName, formatPrice, formatDate, formatTimeRange, localDateISO } = useLocaleContent()
const { loggedIn } = useUserSession()
const toast = useToast()
const { requireLogin } = useAuthRedirect()

const bookingMode = ref<'club' | 'time'>('club')
const selectedClubSlug = ref('')
const selectedSlotId = ref('')
const scheduleDate = ref(localDateISO())
const selectedStudentId = ref('')
const payWithWallet = ref(false)
const bookingPending = ref(false)

const { data: clubs } = await useApiFetch<Club[]>(() =>
  `/api/clubs?sport=${props.sportSlug}&date=${scheduleDate.value}`,
  { watch: [() => props.sportSlug, scheduleDate] },
)

const selectedClub = computed(() => clubs.value?.find((c) => c.slug === selectedClubSlug.value))

const scheduleFrom = computed(() => scheduleDate.value)
const scheduleTo = computed(() => scheduleDate.value)

const { data: scheduleData, refresh: refreshSchedule } = await useApiFetch<{ events: ScheduleEvent[] }>(
  () => selectedClubSlug.value
    ? `/api/clubs/${selectedClubSlug.value}/schedule?from=${scheduleFrom.value}&to=${scheduleTo.value}`
    : null,
  { watch: [selectedClubSlug, scheduleFrom, scheduleTo] },
)

const availableSlots = computed(() =>
  (scheduleData.value?.events ?? []).filter((e) => e.type === 'slot' && e.slotId),
)

const sessionForm = ref({ date: localDateISO(), startTime: '10:00', endTime: '11:00' })

const { data: wallet, refresh: refreshWallet } = await useApiFetch<{ balance?: number }>('/api/wallet', {
  immediate: false,
  lazy: true,
  server: false,
})

watch(loggedIn, (v) => {
  if (v) refreshWallet()
}, { immediate: true })

const walletBalance = computed(() => wallet.value?.balance ?? 0)

const selectedSlot = computed(() => availableSlots.value.find((s) => s.slotId === selectedSlotId.value))

const courtFee = computed(() => selectedSlot.value?.price ?? 0)
const grandTotal = computed(() => {
  if (bookingMode.value === 'club' && selectedSlot.value) {
    return courtFee.value + props.sessionPrice
  }
  return props.sessionPrice
})

const canPayWithWallet = computed(() => loggedIn.value && walletBalance.value >= grandTotal.value)

watch(scheduleDate, (d) => {
  sessionForm.value.date = d
  selectedSlotId.value = ''
})

watch(selectedClubSlug, () => {
  selectedSlotId.value = ''
  refreshSchedule()
})

function selectSlot(event: ScheduleEvent) {
  if (!event.slotId) return
  selectedSlotId.value = event.slotId
  sessionForm.value = {
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
  }
}

async function book() {
  if (props.mode === 'athlete' && !loggedIn.value) return requireLogin()
  if (props.mode === 'coach' && !selectedStudentId.value) {
    toast.error(t('coaches.selectStudent'))
    return
  }
  if (bookingMode.value === 'club' && !selectedSlotId.value) {
    toast.error(t('coaches.selectClubSlot'))
    return
  }

  bookingPending.value = true
  try {
    if (props.mode === 'coach') {
      await $fetch('/api/coach/club-bookings', {
        method: 'POST',
        body: {
          slotId: selectedSlotId.value,
          athleteId: selectedStudentId.value,
          payAtClub: true,
        },
      })
      toast.success(t('coaches.clubSessionBooked'))
    } else {
      const body: Record<string, unknown> = {
        coachId: props.coachId,
        payWithWallet: payWithWallet.value && canPayWithWallet.value,
      }
      if (bookingMode.value === 'club' && selectedSlot.value) {
        body.slotId = selectedSlotId.value
        body.clubId = selectedClub.value?.id
        body.date = selectedSlot.value.date
        body.startTime = selectedSlot.value.startTime
        body.endTime = selectedSlot.value.endTime
      } else {
        Object.assign(body, sessionForm.value)
      }
      await $fetch('/api/coach/sessions', { method: 'POST', body })
      toast.success(t('coaches.sessionBooked'))
      await refreshWallet()
    }
    selectedSlotId.value = ''
    emit('booked')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    toast.error(err?.data?.message || err?.statusMessage || t('common.error'))
  } finally {
    bookingPending.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
        :class="bookingMode === 'club' ? 'bg-[var(--admin-accent,#008060)] text-white' : 'bg-[#f1f1f1] text-[var(--admin-muted,#616161)]'"
        @click="bookingMode = 'club'"
      >
        {{ t('coaches.bookAtClub') }}
      </button>
      <button
        v-if="mode === 'athlete'"
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
        :class="bookingMode === 'time' ? 'bg-[var(--admin-accent,#008060)] text-white' : 'bg-[#f1f1f1] text-[var(--admin-muted,#616161)]'"
        @click="bookingMode = 'time'"
      >
        {{ t('coaches.bookTimeOnly') }}
      </button>
    </div>

    <template v-if="bookingMode === 'club'">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-[var(--admin-muted,#616161)]">{{ t('coaches.pickClub') }}</label>
          <select v-model="selectedClubSlug" class="w-full rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white px-3 py-2 text-sm">
            <option value="">{{ t('coaches.selectClub') }}</option>
            <option v-for="club in clubs" :key="club.id" :value="club.slug">{{ pickName(club) }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-[var(--admin-muted,#616161)]">{{ t('hero.when') }}</label>
          <input v-model="scheduleDate" type="date" class="w-full rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white px-3 py-2 text-sm" />
        </div>
      </div>

      <div v-if="mode === 'coach' && students?.length" class="grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-xs font-semibold text-[var(--admin-muted,#616161)]">{{ t('dashboard.myStudents') }}</label>
          <select v-model="selectedStudentId" class="w-full rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white px-3 py-2 text-sm">
            <option value="">{{ t('coaches.selectStudent') }}</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }} ({{ s.email }})</option>
          </select>
        </div>
      </div>

      <div v-if="selectedClubSlug" class="rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white">
        <p class="border-b border-[var(--admin-border,#e3e3e3)] px-4 py-2 text-xs font-semibold text-[var(--admin-muted,#616161)]">
          {{ t('coaches.availableSlots') }}
        </p>
        <ul v-if="availableSlots.length" class="max-h-48 divide-y divide-[var(--admin-border,#e3e3e3)] overflow-y-auto">
          <li v-for="slot in availableSlots" :key="slot.id">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-start text-sm transition hover:bg-[#fafafa]"
              :class="selectedSlotId === slot.slotId ? 'bg-[#f0fdf8] font-semibold text-[var(--admin-accent,#008060)]' : ''"
              @click="selectSlot(slot)"
            >
              <span>{{ slot.title }} · {{ formatDate(slot.date) }}</span>
              <span>{{ formatTimeRange(slot.startTime, slot.endTime) }} · {{ formatPrice(slot.price ?? 0) }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="px-4 py-6 text-center text-sm text-[var(--admin-muted,#616161)]">{{ t('coaches.noClubSlots') }}</p>
      </div>
    </template>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-[var(--admin-muted,#616161)]">{{ t('hero.when') }}</label>
          <input v-model="sessionForm.date" type="date" class="w-full rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-[var(--admin-muted,#616161)]">{{ t('schedule.start') }}</label>
          <input v-model="sessionForm.startTime" type="time" class="w-full rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-[var(--admin-muted,#616161)]">{{ t('schedule.end') }}</label>
          <input v-model="sessionForm.endTime" type="time" class="w-full rounded-lg border border-[var(--admin-border,#e3e3e3)] bg-white px-3 py-2 text-sm" />
        </div>
      </div>
    </template>

    <p class="text-sm font-semibold text-[var(--admin-text,#303030)]">
      {{ t('equipment.bookingTotal') }}: {{ formatPrice(grandTotal) }}
      <span v-if="bookingMode === 'club' && courtFee > 0" class="font-normal text-[var(--admin-muted,#616161)]">
        ({{ t('coaches.courtFee') }} {{ formatPrice(courtFee) }} + {{ t('coaches.sessionPrice') }} {{ formatPrice(sessionPrice) }})
      </span>
    </p>

    <label v-if="mode === 'athlete' && loggedIn" class="flex items-center gap-2 text-sm text-[var(--admin-muted,#616161)]">
      <input v-model="payWithWallet" type="checkbox" class="rounded border-[var(--admin-border,#e3e3e3)]" />
      {{ t('wallet.payWithWallet') }} ({{ formatPrice(walletBalance) }})
    </label>

    <button
      type="button"
      class="inline-flex items-center justify-center rounded-lg bg-[var(--admin-accent,#008060)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--admin-accent-hover,#006e52)] disabled:opacity-50"
      :disabled="bookingPending || (bookingMode === 'club' && !selectedSlotId) || (mode === 'coach' && !selectedStudentId)"
      @click="book"
    >
      {{ mode === 'coach' ? t('coaches.bookClubForStudent') : t('coaches.bookSession') }}
    </button>
  </div>
</template>
