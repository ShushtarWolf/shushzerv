<script setup lang="ts">
import type { Coach, CoachBusySlot } from '~/types'
import type { EquipmentPickerItem } from '~/composables/useEquipmentBooking'
import { equipmentRentalSubtotal, equipmentSelectionsPayload } from '~/composables/useEquipmentBooking'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { pickName, localized, formatRating, formatNumber, formatPrice, formatDate, formatTimeRange, localDateISO } = useLocaleContent()
const { cityLabel } = useCities()
const { loggedIn, user } = useUserSession()
const toast = useToast()
const { requireLogin } = useAuthRedirect()

const id = computed(() => String(route.params.id))
const { data: coach, error, refresh: refreshCoach } = await useApiFetch<Coach>(() => `/api/coaches/${id.value}`)
const { data: busySlots } = await useApiFetch<CoachBusySlot[]>(
  () => `/api/coach/sessions?coachId=${id.value}`,
  { watch: [id] },
)
const { data: wallet, refresh: refreshWallet } = await useApiFetch<{ balance?: number }>('/api/wallet', {
  immediate: false,
  lazy: true,
  server: false,
})

watch(loggedIn, (v) => {
  if (v) refreshWallet()
}, { immediate: true })

const walletBalance = computed(() => wallet.value?.balance ?? 0)

const upcomingBusy = computed(() =>
  (busySlots.value ?? [])
    .filter((s) => s.date >= localDateISO())
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 8),
)

const canMessageCoach = computed(() =>
  loggedIn.value
  && user.value?.role === 'ATHLETE'
  && coach.value?.userId
  && coach.value.userId !== user.value?.id,
)

async function messageCoach() {
  if (!loggedIn.value) return requireLogin()
  if (!coach.value?.userId) return
  try {
    const res = await $fetch<{ id: string }>('/api/chat', { method: 'POST', body: { userId: coach.value.userId } })
    await navigateTo(localePath(`/chat/${res.id}`))
  } catch {
    toast.error(t('common.error'))
  }
}

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach not found' })
}

useHead({ title: () => (coach.value ? pickName(coach.value) : t('coaches.title')) })

const sessionPrice = computed(() => coach.value?.sessionPrice ?? 300000)

const sessionForm = ref({ date: localDateISO(), startTime: '10:00', endTime: '11:00' })
const payWithWallet = ref(false)
const bookingPending = ref(false)
const selectedEquipment = ref<Record<string, number>>({})
const availableEquipment = ref<EquipmentPickerItem[]>([])

const equipmentRental = computed(() =>
  equipmentRentalSubtotal(availableEquipment.value, selectedEquipment.value),
)
const sessionGrandTotal = computed(() => sessionPrice.value + equipmentRental.value)
const canPayWithWallet = computed(() => loggedIn.value && walletBalance.value >= sessionGrandTotal.value)

watch(() => sessionForm.value.date, async (date) => {
  selectedEquipment.value = {}
  if (!date) {
    availableEquipment.value = []
    return
  }
  try {
    availableEquipment.value = await $fetch<EquipmentPickerItem[]>(
      `/api/coaches/${id.value}/equipment-availability`,
      { query: { date } },
    )
  } catch {
    availableEquipment.value = []
  }
}, { immediate: true })

async function bookSession() {
  if (!loggedIn.value) return requireLogin()
  bookingPending.value = true
  try {
    await $fetch('/api/coach/sessions', {
      method: 'POST',
      body: {
        coachId: id.value,
        ...sessionForm.value,
        payWithWallet: payWithWallet.value && canPayWithWallet.value,
        equipment: equipmentSelectionsPayload(selectedEquipment.value),
      },
    })
    toast.success(t('coaches.sessionBooked'))
    selectedEquipment.value = {}
    await Promise.all([refreshCoach(), refreshWallet()])
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    toast.error(err?.data?.message || err?.statusMessage || t('common.error'))
  } finally {
    bookingPending.value = false
  }
}
</script>

<template>
  <div v-if="coach" class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <BackLink to="/coaches" />
    <div class="glass-panel p-6 sm:p-8">
      <div class="flex items-center gap-4">
        <CoachAvatar :coach="coach" :size="96" class="h-24 w-24 shrink-0 overflow-hidden rounded-2xl" />
        <div class="min-w-0">
          <h1 class="ios-title-2">{{ pickName(coach) }}</h1>
          <p
            v-if="coach.sport"
            class="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-semibold text-brand-orange"
          >
            <SportIcon :slug="coach.sport.slug" size="xs" />
            {{ localized(coach.sport.nameFa, coach.sport.nameEn) }}
          </p>
          <p class="ios-footnote mt-1">{{ cityLabel(coach.city) }}</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="rounded-xl bg-sz-gray-50 p-4 text-center">
          <div class="text-lg font-bold text-sz-orange">★ {{ formatRating(coach.rating) }}</div>
          <div class="ios-footnote">{{ t('coaches.rating') }}</div>
        </div>
        <div class="rounded-xl bg-sz-gray-50 p-4 text-center">
          <div class="text-lg font-bold text-sz-gray-900">{{ formatNumber(coach.sessions) }}</div>
          <div class="ios-footnote">{{ t('coaches.sessions') }}</div>
        </div>
        <div class="rounded-xl bg-sz-gray-50 p-4 text-center sm:col-span-1 col-span-2">
          <div class="text-lg font-bold text-sz-gray-900">{{ formatPrice(sessionPrice) }}</div>
          <div class="ios-footnote">{{ t('coaches.sessionPrice') }}</div>
        </div>
      </div>
      <p v-if="coach.bioFa || coach.bioEn" class="mt-6 leading-relaxed text-sz-gray-700">
        {{ localized(coach.bioFa || '', coach.bioEn || '') }}
      </p>

      <EquipmentSection
        v-if="coach.equipment?.length"
        class="mt-8"
        :items="coach.equipment"
        :hint="t('equipment.coachHint')"
      />

      <section v-if="upcomingBusy.length" class="mt-8 rounded-xl border border-brand-gray-200 p-4">
        <h2 class="ios-title-3 mb-3">{{ t('coaches.availability') }}</h2>
        <p class="mb-3 text-sm text-brand-gray-600">{{ t('coaches.busySlotsHint') }}</p>
        <ul class="space-y-2">
          <li v-for="(slot, i) in upcomingBusy" :key="i" class="flex justify-between text-sm text-brand-gray-700">
            <span>{{ formatDate(slot.date) }}</span>
            <span>{{ formatTimeRange(slot.startTime, slot.endTime) }}</span>
          </li>
        </ul>
      </section>

      <section class="mt-8 rounded-xl border border-brand-gray-200 p-4">
        <h2 class="ios-title-3 mb-3">{{ t('coaches.bookSession') }}</h2>
        <p class="mb-3 text-sm text-brand-gray-600">
          {{ t('coaches.sessionPriceLabel', { price: formatPrice(sessionPrice) }) }}
        </p>
        <div class="grid gap-3 sm:grid-cols-3">
          <SzInput v-model="sessionForm.date" type="date" :label="t('hero.when')" />
          <SzInput v-model="sessionForm.startTime" type="time" :label="t('schedule.start')" />
          <SzInput v-model="sessionForm.endTime" type="time" :label="t('schedule.end')" />
        </div>
        <EquipmentPicker v-model="selectedEquipment" :items="availableEquipment" />
        <p class="mt-3 text-sm font-semibold text-brand-gray-800">
          {{ t('equipment.bookingTotal') }}: {{ formatPrice(sessionGrandTotal) }} {{ t('clubs.currency') }}
        </p>
        <p v-if="equipmentRental > 0" class="text-xs text-brand-gray-500">
          {{ t('equipment.rentalSubtotal') }}: {{ formatPrice(equipmentRental) }} {{ t('clubs.currency') }}
        </p>
        <label v-if="loggedIn" class="mt-3 flex items-center gap-2 text-sm text-brand-gray-700">
          <input v-model="payWithWallet" type="checkbox" class="rounded border-brand-gray-300" />
          {{ t('wallet.payWithWallet') }} ({{ formatPrice(walletBalance) }})
        </label>
        <p v-if="loggedIn && payWithWallet && sessionGrandTotal > 0 && !canPayWithWallet" class="mt-1 text-sm text-brand-pink">
          {{ t('wallet.insufficientBalance') }}
        </p>
        <SzButton class="mt-3" :disabled="bookingPending" @click="bookSession">
          {{ t('coaches.bookSession') }}
        </SzButton>
        <SzButton v-if="canMessageCoach" variant="ghost" class="mt-2" @click="messageCoach">
          {{ t('coaches.messageCoach') }}
        </SzButton>
      </section>

      <SzButton :to="localePath('/clubs')" variant="ghost" class="mt-4">
        {{ t('coaches.bookAtClub') }}
      </SzButton>

      <CoachReviews :coach-id="coach.id" @rated="refreshCoach()" />
    </div>
  </div>
</template>
