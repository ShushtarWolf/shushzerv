<script setup lang="ts">
import type { Club, ClubActivity, Sport } from '~/types'

definePageMeta({ middleware: ['auth', 'role-club'] })

const { t } = useI18n()
const { pickName, localized, formatPrice, formatDate, localDateISO } = useLocaleContent()
const { user } = useUserSession()

useHead({ title: () => t('dashboard.clubAdmin') })

const tab = ref('overview')

interface ClubStats {
  role: 'CLUB_ADMIN'
  clubs: number
  courts: number
  todayRevenue: number
  monthRevenue: number
  totalRevenue: number
  walletBalance: number
  bookingCount: number
  pendingBookings: number
  classEnrollments: number
}

const { data: clubs, refresh: refreshClubs } = await useApiFetch<Club[]>('/api/club')
const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: bookings, refresh: refreshBookings } = await useApiFetch('/api/club/bookings')
const { data: stats, refresh: refreshStats } = await useApiFetch<ClubStats>('/api/dashboard/stats')

const selectedClubId = ref('')
watch(clubs, (list) => {
  if (list?.length && !selectedClubId.value) selectedClubId.value = list[0].id
}, { immediate: true })

const { data: activities, refresh: refreshActivities } = await useApiFetch<ClubActivity[]>('/api/club/activities', {
  query: computed(() => ({ clubId: selectedClubId.value || undefined })),
  watch: [selectedClubId],
})

const tabs = computed(() => [
  { id: 'overview', label: t('dashboard.overview') },
  { id: 'wallet', label: t('dashboard.walletTab') },
  { id: 'manage', label: t('dashboard.manageTab') },
  { id: 'bookings', label: t('dashboard.bookingsTab') },
])

const statItems = computed(() => [
  { label: t('dashboard.walletBalance'), value: formatPrice(stats.value?.walletBalance ?? 0), tone: 'green' as const },
  { label: t('dashboard.todayRevenue'), value: formatPrice(stats.value?.todayRevenue ?? 0), tone: 'orange' as const },
  { label: t('dashboard.monthRevenue'), value: formatPrice(stats.value?.monthRevenue ?? 0), tone: 'blue' as const },
  { label: t('dashboard.pendingPayAtClub'), value: stats.value?.pendingBookings ?? 0, tone: 'pink' as const },
])

const newActivity = ref({ titleFa: '', titleEn: '', descFa: '', date: localDateISO(), startTime: '18:00' })
const newClass = ref({ titleFa: '', titleEn: '', sportId: '', date: localDateISO(), startTime: '10:00', endTime: '11:30', price: 200000, maxSeats: 12 })
const selectedClub = computed(() => clubs.value?.find((c) => c.id === selectedClubId.value))
const newCourt = ref({ nameFa: '', nameEn: '', sportId: '' })
const slotDate = ref(localDateISO())
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

async function addActivity() {
  if (!selectedClubId.value || !newActivity.value.titleFa) return
  await $fetch('/api/club/activities', { method: 'POST', body: { clubId: selectedClubId.value, ...newActivity.value } })
  newActivity.value = { titleFa: '', titleEn: '', descFa: '', date: localDateISO(), startTime: '18:00' }
  message.value = t('common.save')
  await refreshActivities()
}

async function addClass() {
  if (!selectedClubId.value || !newClass.value.titleFa || !newClass.value.sportId) return
  await $fetch('/api/club/classes', { method: 'POST', body: { clubId: selectedClubId.value, ...newClass.value } })
  newClass.value = { titleFa: '', titleEn: '', sportId: '', date: localDateISO(), startTime: '10:00', endTime: '11:30', price: 200000, maxSeats: 12 }
  message.value = t('classes.created')
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
    <p class="ios-footnote mb-6">{{ t('dashboard.welcomeUser', { name: user?.name ?? '' }) }}</p>
    <p v-if="message" class="mb-4 text-sm text-sz-green">{{ message }}</p>

    <p v-if="!clubs?.length" class="ios-footnote">{{ t('common.noResults') }}</p>

    <div v-if="clubs?.length" class="mb-6">
      <label class="ios-footnote mb-2 block">{{ t('search.club') }}</label>
      <select v-model="selectedClubId" class="ios-input max-w-md">
        <option v-for="c in clubs" :key="c.id" :value="c.id">{{ pickName(c) }}</option>
      </select>
    </div>

    <DashboardTabs v-model="tab" :tabs="tabs" />

    <template v-if="tab === 'overview'">
      <DashboardStatGrid :items="statItems" />
      <div class="ios-card p-4">
        <p class="ios-footnote">{{ t('dashboard.totalRevenue') }}</p>
        <p class="text-2xl font-black text-brand-orange">{{ formatPrice(stats?.totalRevenue ?? 0) }} {{ t('clubs.currency') }}</p>
        <div class="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p class="font-bold">{{ stats?.bookingCount ?? 0 }}</p>
            <p class="ios-footnote">{{ t('dashboard.myBookings') }}</p>
          </div>
          <div>
            <p class="font-bold">{{ stats?.classEnrollments ?? 0 }}</p>
            <p class="ios-footnote">{{ t('classes.title') }}</p>
          </div>
          <div>
            <p class="font-bold">{{ stats?.courts ?? 0 }}</p>
            <p class="ios-footnote">{{ t('dashboard.manageCourts') }}</p>
          </div>
        </div>
      </div>
    </template>

    <WalletPanel v-else-if="tab === 'wallet'" kind="club" can-payout />

    <template v-else-if="tab === 'manage' && selectedClub">
      <section class="mb-10">
        <h2 class="ios-title-2 mb-4">{{ t('dashboard.manageCourts') }}</h2>
        <ul class="mb-4 space-y-2">
          <li v-for="court in selectedClub.courts" :key="court.id" class="ios-card px-4 py-3">
            {{ pickName(court) }}
          </li>
        </ul>
        <div class="glass-panel grid gap-3 p-4 sm:grid-cols-2">
          <input v-model="newCourt.nameFa" class="ios-input" :placeholder="t('dashboard.court') + ' (FA)'" />
          <input v-model="newCourt.nameEn" class="ios-input" placeholder="Court (EN)" />
          <div class="sm:col-span-2">
            <p class="ios-footnote mb-2">{{ t('search.sport') }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in sports"
                :key="s.id"
                type="button"
                class="sz-chip tap-highlight"
                :class="newCourt.sportId === s.id ? 'text-white shadow-card' : 'bg-white shadow-card'"
                :style="newCourt.sportId === s.id ? { backgroundColor: s.color } : undefined"
                @click="newCourt.sportId = s.id"
              >
                <span class="inline-flex items-center gap-1.5">
                  <SportIcon :slug="s.slug" size="sm" />
                  {{ pickName(s) }}
                </span>
              </button>
            </div>
          </div>
          <button type="button" class="ios-btn-primary sm:col-span-2" @click="addCourt">{{ t('dashboard.addCourt') }}</button>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="ios-title-2 mb-4">{{ t('dashboard.manageSlots') }}</h2>
        <div class="glass-panel flex flex-wrap gap-3 p-4">
          <select v-model="slotCourtId" class="ios-input flex-1 min-w-[10rem]">
            <option v-for="court in selectedClub.courts" :key="court.id" :value="court.id">{{ pickName(court) }}</option>
          </select>
          <input v-model="slotDate" type="date" class="ios-input w-40" />
          <button type="button" class="ios-btn-primary" @click="generateSlots">{{ t('dashboard.generateSlots') }}</button>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="ios-title-2 mb-4">{{ t('activities.title') }}</h2>
        <div v-if="activities?.length" class="mb-4 space-y-2">
          <div v-for="a in activities" :key="a.id" class="ios-card p-4">
            <p class="font-semibold">{{ localized(a.titleFa, a.titleEn) }}</p>
            <p class="ios-footnote">{{ formatDate(a.date) }} · {{ a.startTime }}</p>
          </div>
        </div>
        <div class="glass-panel grid gap-3 p-4 sm:grid-cols-2">
          <input v-model="newActivity.titleFa" class="ios-input sm:col-span-2" :placeholder="t('activities.titleField')" />
          <input v-model="newActivity.descFa" class="ios-input sm:col-span-2" :placeholder="t('activities.descField')" />
          <input v-model="newActivity.date" type="date" class="ios-input" />
          <input v-model="newActivity.startTime" type="time" class="ios-input" />
          <button type="button" class="ios-btn-primary sm:col-span-2" @click="addActivity">{{ t('activities.create') }}</button>
        </div>
      </section>

      <section>
        <h2 class="ios-title-2 mb-4">{{ t('classes.manage') }}</h2>
        <div class="glass-panel grid gap-3 p-4 sm:grid-cols-2">
          <input v-model="newClass.titleFa" class="ios-input sm:col-span-2" :placeholder="t('classes.titleField')" />
          <div class="sm:col-span-2">
            <p class="ios-footnote mb-2">{{ t('search.sport') }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in sports"
                :key="s.id"
                type="button"
                class="sz-chip tap-highlight"
                :class="newClass.sportId === s.id ? 'text-white shadow-card' : 'bg-white shadow-card'"
                :style="newClass.sportId === s.id ? { backgroundColor: s.color } : undefined"
                @click="newClass.sportId = s.id"
              >
                <span class="inline-flex items-center gap-1.5">
                  <SportIcon :slug="s.slug" size="sm" />
                  {{ pickName(s) }}
                </span>
              </button>
            </div>
          </div>
          <input v-model="newClass.date" type="date" class="ios-input" />
          <input v-model="newClass.startTime" type="time" class="ios-input" />
          <input v-model="newClass.endTime" type="time" class="ios-input" />
          <input v-model.number="newClass.price" type="number" class="ios-input" :placeholder="t('dashboard.price')" />
          <button type="button" class="ios-btn-primary sm:col-span-2" @click="addClass">{{ t('classes.create') }}</button>
        </div>
      </section>
    </template>

    <template v-else-if="tab === 'bookings'">
      <h2 class="ios-title-2 mb-4">{{ t('dashboard.incomingBookings') }}</h2>
      <div v-if="bookings?.length" class="space-y-3">
        <div v-for="b in bookings" :key="b.id" class="ios-card p-4">
          <p class="font-semibold">{{ b.user?.name }}</p>
          <p class="ios-footnote">
            {{ b.slot?.court?.club ? pickName(b.slot.court.club) : '' }} ·
            {{ formatDate(b.slot?.date ?? '') }} · {{ b.slot?.startTime }}–{{ b.slot?.endTime }}
          </p>
          <p class="text-sm">
            {{ formatPrice(b.slot?.price ?? 0) }} {{ t('clubs.currency') }} ·
            {{ b.paymentStatus === 'PAID' ? t('wallet.payWithWallet') : t('booking.payAtClub') }}
          </p>
        </div>
      </div>
      <p v-else class="ios-footnote">{{ t('dashboard.noBookings') }}</p>
    </template>
  </div>
</template>
