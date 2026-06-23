<script setup lang="ts">
import type { Club, Sport } from '~/types'
import { DEFAULT_CITY } from '~/composables/useCities'

definePageMeta({ middleware: ['auth', 'role-club'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { pickName, formatPrice, localDateISO } = useLocaleContent()
const { cities } = useCities()
const { SLOT_DURATION_OPTIONS, buildSlotTimes, durationLabel } = useSlotSchedule()
const { weekDays } = useScheduleWeek()
const { dashboardPath } = useDashboardPath()
const { resolvePostAuthRedirect } = useAuthRedirect()
const { fetch: refreshSession } = useUserSession()

useHead({ title: () => t('clubOnboarding.title') })

const { data: clubs, pending: clubsPending } = await useApiFetch<Club[]>('/api/club', { server: false })
const { data: sports } = await useApiFetch<Sport[]>('/api/sports')

const step = ref(1)
const pending = ref(false)
const error = ref('')

const club = computed(() => clubs.value?.[0])
const primaryCourt = computed(() => club.value?.courts?.[0])

const form = ref({
  addressFa: '',
  addressEn: '',
  city: DEFAULT_CITY,
  district: '',
  priceFrom: 200_000,
  image: '',
  courtNameFa: '',
  courtNameEn: '',
  courtSportId: '',
  slotDurationMinutes: 120,
  slotOpenTime: '08:00',
  slotCloseTime: '22:00',
  generateSlots: true,
  generateFromDate: localDateISO(),
  generateToDate: '',
  slotPrice: 0,
})

watch(club, (c) => {
  if (!c) return
  form.value.addressFa = c.addressFa
  form.value.addressEn = c.addressEn
  form.value.city = c.city
  form.value.district = c.district ?? ''
  form.value.priceFrom = c.priceFrom
  form.value.image = c.image ?? ''
  form.value.slotDurationMinutes = c.slotDurationMinutes ?? 120
  form.value.slotOpenTime = c.slotOpenTime ?? '08:00'
  form.value.slotCloseTime = c.slotCloseTime ?? '22:00'
  form.value.slotPrice = c.priceFrom
  if (primaryCourt.value) {
    form.value.courtNameFa = primaryCourt.value.nameFa
    form.value.courtNameEn = primaryCourt.value.nameEn
    form.value.courtSportId = primaryCourt.value.sportId
  }
  if (!form.value.generateToDate) {
    form.value.generateToDate = weekDays.value[6] ?? localDateISO()
  }
}, { immediate: true })

const slotPreviewCount = computed(() =>
  buildSlotTimes(form.value.slotDurationMinutes, form.value.slotOpenTime, form.value.slotCloseTime).length,
)

const steps = computed(() => [
  t('clubOnboarding.stepClub'),
  t('clubOnboarding.stepCourt'),
  t('clubOnboarding.stepSchedule'),
  t('clubOnboarding.stepLaunch'),
])

function nextStep() {
  error.value = ''
  if (step.value === 1 && !form.value.addressFa.trim()) {
    error.value = t('clubOnboarding.addressRequired')
    return
  }
  if (step.value === 2 && (!form.value.courtNameFa.trim() || !form.value.courtSportId)) {
    error.value = t('clubOnboarding.courtRequired')
    return
  }
  if (step.value === 3 && !slotPreviewCount.value) {
    error.value = t('clubOnboarding.scheduleInvalid')
    return
  }
  if (step.value < 4) step.value += 1
}

function prevStep() {
  error.value = ''
  if (step.value > 1) step.value -= 1
}

async function finish() {
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/club/onboard', {
      method: 'POST',
      body: {
        addressFa: form.value.addressFa,
        addressEn: form.value.addressEn || form.value.addressFa,
        city: form.value.city,
        district: form.value.district || undefined,
        priceFrom: form.value.priceFrom,
        image: form.value.image || undefined,
        courtNameFa: form.value.courtNameFa,
        courtNameEn: form.value.courtNameEn || form.value.courtNameFa,
        courtSportId: form.value.courtSportId,
        slotDurationMinutes: form.value.slotDurationMinutes,
        slotOpenTime: form.value.slotOpenTime,
        slotCloseTime: form.value.slotCloseTime,
        ...(form.value.generateSlots
          ? {
              generateFromDate: form.value.generateFromDate,
              generateToDate: form.value.generateToDate,
              slotPrice: form.value.slotPrice || form.value.priceFrom,
            }
          : {}),
      },
    })
    await refreshSession()
    await navigateTo(resolvePostAuthRedirect(dashboardPath.value))
  } catch {
    error.value = t('common.error')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="page-enter mx-auto max-w-lg px-4 py-10 sm:px-6">
    <p class="sz-eyebrow">{{ t('clubOnboarding.eyebrow') }}</p>
    <h1 class="sz-headline mt-2">{{ t('clubOnboarding.title') }}</h1>
    <p class="mt-2 text-brand-gray-600">{{ t('clubOnboarding.subtitle') }}</p>

    <div class="mt-6 flex gap-2">
      <div
        v-for="(label, i) in steps"
        :key="label"
        class="h-1.5 flex-1 rounded-full transition"
        :class="i + 1 <= step ? 'bg-fd-primary' : 'bg-brand-gray-200'"
        :title="label"
      />
    </div>
    <p class="mt-2 text-xs font-semibold text-brand-gray-500">{{ steps[step - 1] }}</p>

    <p v-if="clubsPending" class="mt-8 text-sm text-brand-gray-500">{{ t('common.loading') }}</p>

    <form v-else class="mt-8 space-y-4 glass-panel p-6" @submit.prevent="step === 4 ? finish() : nextStep()">
      <template v-if="step === 1">
        <div>
          <label class="ios-footnote mb-2 block">{{ t('dashboard.address') }} (FA)</label>
          <input v-model="form.addressFa" class="ios-input" required />
        </div>
        <div>
          <label class="ios-footnote mb-2 block">{{ t('dashboard.address') }} (EN)</label>
          <input v-model="form.addressEn" class="ios-input" />
        </div>
        <div>
          <label class="ios-footnote mb-2 block">{{ t('search.city') }}</label>
          <select v-model="form.city" class="ios-input">
            <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>
        <SzInput v-model="form.district" :label="t('dashboard.district')" />
        <SzInput v-model.number="form.priceFrom" type="number" min="0" :label="t('dashboard.priceFrom')" required />
        <SzInput v-model="form.image" :label="t('dashboard.coverImageUrl')" />
      </template>

      <template v-else-if="step === 2">
        <p class="text-sm text-brand-gray-600">{{ t('clubOnboarding.courtHint') }}</p>
        <SzInput v-model="form.courtNameFa" :label="t('dashboard.court') + ' (FA)'" required />
        <SzInput v-model="form.courtNameEn" :label="t('dashboard.court') + ' (EN)'" />
        <div>
          <p class="ios-footnote mb-2">{{ t('search.sport') }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in sports"
              :key="s.id"
              type="button"
              class="sz-chip tap-highlight"
              :class="form.courtSportId === s.id ? 'bg-fd-primary text-white' : 'bg-brand-gray-100'"
              @click="form.courtSportId = s.id"
            >
              {{ pickName(s) }}
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="step === 3">
        <p class="text-sm text-brand-gray-600">{{ t('clubOnboarding.scheduleHint') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="mins in SLOT_DURATION_OPTIONS"
            :key="mins"
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-bold"
            :class="form.slotDurationMinutes === mins ? 'bg-fd-primary text-white' : 'bg-brand-gray-100'"
            @click="form.slotDurationMinutes = mins"
          >
            {{ durationLabel(mins) }}
          </button>
        </div>
        <p class="text-xs font-semibold text-fd-primary">
          {{ t('dashboard.slotsPerDay', { count: slotPreviewCount }) }}
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <SzInput v-model="form.slotOpenTime" type="time" :label="t('dashboard.slotOpenTime')" />
          <SzInput v-model="form.slotCloseTime" type="time" :label="t('dashboard.slotCloseTime')" />
        </div>
      </template>

      <template v-else>
        <p class="text-sm text-brand-gray-600">{{ t('clubOnboarding.launchHint') }}</p>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.generateSlots" type="checkbox" class="rounded" />
          {{ t('clubOnboarding.generateWeek') }}
        </label>
        <div v-if="form.generateSlots" class="grid gap-3 sm:grid-cols-2">
          <SzInput v-model="form.generateFromDate" type="date" :label="t('dashboard.fromDate')" />
          <SzInput v-model="form.generateToDate" type="date" :label="t('dashboard.toDate')" />
          <SzInput v-model.number="form.slotPrice" type="number" min="0" class="sm:col-span-2" :label="t('dashboard.slotPrice')" />
        </div>
        <p class="text-xs text-brand-gray-500">
          {{ t('clubOnboarding.summary', { price: formatPrice(form.priceFrom) }) }}
        </p>
      </template>

      <p v-if="error" class="text-sm text-brand-pink">{{ error }}</p>

      <div class="flex gap-2 pt-2">
        <SzButton v-if="step > 1" type="button" variant="secondary" class="flex-1" @click="prevStep">
          {{ t('common.back') }}
        </SzButton>
        <SzButton type="submit" block class="flex-1" :disabled="pending">
          {{ step === 4 ? t('clubOnboarding.finish') : t('common.next') }}
        </SzButton>
      </div>
    </form>
  </div>
</template>
