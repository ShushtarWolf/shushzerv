<script setup lang="ts">
import type { Club, Sport } from '~/types'

definePageMeta({ middleware: ['auth', 'role-club'] })

const { t } = useI18n()
const { pickName, formatPrice, formatDate } = useLocaleContent()
const { user } = useUserSession()

useHead({ title: () => t('dashboard.clubAdmin') })

const { data: clubs, refresh: refreshClubs } = await useApiFetch<Club[]>('/api/club')
const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: bookings, refresh: refreshBookings } = await useApiFetch('/api/club/bookings')

const selectedClubId = ref('')
watch(clubs, (list) => {
  if (list?.length && !selectedClubId.value) selectedClubId.value = list[0].id
}, { immediate: true })

const selectedClub = computed(() => clubs.value?.find((c) => c.id === selectedClubId.value))

const newCourt = ref({ nameFa: '', nameEn: '', sportId: '' })
const slotDate = ref(new Date().toISOString().slice(0, 10))
const slotCourtId = ref('')
const message = ref('')

watch(selectedClub, (c) => {
  if (c?.courts?.length) slotCourtId.value = c.courts[0].id
}, { immediate: true })

async function addCourt() {
  if (!selectedClubId.value || !newCourt.value.nameFa || !newCourt.value.sportId) return
  await $fetch('/api/club/courts', {
    method: 'POST',
    body: {
      clubId: selectedClubId.value,
      nameFa: newCourt.value.nameFa,
      nameEn: newCourt.value.nameEn || newCourt.value.nameFa,
      sportId: newCourt.value.sportId,
    },
  })
  newCourt.value = { nameFa: '', nameEn: '', sportId: '' }
  message.value = t('common.save')
  await refreshClubs()
}

async function generateSlots() {
  if (!slotCourtId.value || !slotDate.value) return
  const res = await $fetch<{ created: number }>('/api/club/slots', {
    method: 'POST',
    body: { courtId: slotCourtId.value, date: slotDate.value },
  })
  message.value = `${t('dashboard.generateSlots')}: ${res.created}`
  await refreshBookings()
}
</script>

<template>
  <div class="page-enter mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-1">{{ t('dashboard.clubAdmin') }}</h1>
    <p class="ios-footnote mb-6">{{ t('dashboard.welcome') }}، {{ user?.name }}</p>
    <p v-if="message" class="mb-4 text-sm text-sz-green">{{ message }}</p>

    <div v-if="clubs?.length" class="mb-6">
      <label class="ios-footnote mb-2 block">{{ t('search.club') }}</label>
      <select v-model="selectedClubId" class="ios-input max-w-md">
        <option v-for="c in clubs" :key="c.id" :value="c.id">{{ pickName(c) }}</option>
      </select>
    </div>

    <section v-if="selectedClub" class="mb-10">
      <h2 class="ios-title-2 mb-4">{{ t('dashboard.manageCourts') }}</h2>
      <ul class="mb-4 space-y-2">
        <li v-for="court in selectedClub.courts" :key="court.id" class="ios-card px-4 py-3">
          {{ pickName(court) }}
        </li>
      </ul>
      <div class="glass-panel grid gap-3 p-4 sm:grid-cols-2">
        <input v-model="newCourt.nameFa" class="ios-input" :placeholder="t('dashboard.court') + ' (FA)'" />
        <input v-model="newCourt.nameEn" class="ios-input" placeholder="Court (EN)" />
        <select v-model="newCourt.sportId" class="ios-input sm:col-span-2">
          <option value="">{{ t('search.sport') }}</option>
          <option v-for="s in sports" :key="s.id" :value="s.id">{{ s.icon }}</option>
        </select>
        <button type="button" class="ios-btn-primary sm:col-span-2" @click="addCourt">{{ t('dashboard.addCourt') }}</button>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="ios-title-2 mb-4">{{ t('dashboard.manageSlots') }}</h2>
      <div class="glass-panel flex flex-wrap gap-3 p-4">
        <select v-model="slotCourtId" class="ios-input flex-1 min-w-[10rem]">
          <option v-for="court in selectedClub?.courts" :key="court.id" :value="court.id">{{ pickName(court) }}</option>
        </select>
        <input v-model="slotDate" type="date" class="ios-input w-40" />
        <button type="button" class="ios-btn-primary" @click="generateSlots">{{ t('dashboard.generateSlots') }}</button>
      </div>
    </section>

    <section>
      <h2 class="ios-title-2 mb-4">{{ t('dashboard.incomingBookings') }}</h2>
      <div v-if="bookings?.length" class="space-y-3">
        <div v-for="b in bookings" :key="b.id" class="ios-card p-4">
          <p class="font-semibold">{{ b.user?.name }}</p>
          <p class="ios-footnote">
            {{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }} ·
            {{ formatDate(b.slot?.date ?? '') }} · {{ b.slot?.startTime }}–{{ b.slot?.endTime }}
          </p>
          <p class="text-sm">{{ formatPrice(b.slot?.price ?? 0) }} {{ t('clubs.currency') }}</p>
        </div>
      </div>
      <p v-else class="ios-footnote">{{ t('dashboard.noBookings') }}</p>
    </section>
  </div>
</template>
