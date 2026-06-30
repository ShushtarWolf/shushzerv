<script setup lang="ts">
import type { Coach, CoachBusySlot } from '~/types'

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

const upcomingBusy = computed(() =>
  (busySlots.value ?? [])
    .filter((s) => s.date >= localDateISO())
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 8),
)
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
        <p class="mb-4 text-sm text-brand-gray-600">
          {{ t('coaches.sessionPriceLabel', { price: formatPrice(sessionPrice) }) }}
        </p>
        <CoachClubBookingPanel
          v-if="coach.sport"
          mode="athlete"
          :coach-id="coach.id"
          :sport-slug="coach.sport.slug"
          :session-price="sessionPrice"
          @booked="refreshCoach()"
        />
        <SzButton v-if="canMessageCoach" variant="ghost" class="mt-4" @click="messageCoach">
          {{ t('coaches.messageCoach') }}
        </SzButton>
      </section>

      <CoachReviews :coach-id="coach.id" @rated="refreshCoach()" />
    </div>
  </div>
</template>
