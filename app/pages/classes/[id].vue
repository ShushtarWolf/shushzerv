<script setup lang="ts">
import type { ClassSession } from '~/types'

definePageMeta({ middleware: ['feature-group-classes'] })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { localized, pickName, formatPrice, formatDate, formatTimeRange, formatFraction } = useLocaleContent()
const { loggedIn } = useUserSession()
const toast = useToast()
const { requireLogin } = useAuthRedirect()
const { classTypeLabel, classGroupLabel, levelRangeLabel } = useClassSession()
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

const id = computed(() => String(route.params.id))
const { data: classSession, refresh } = await useApiFetch<ClassSession>(() => `/api/classes/${id.value}`)

useHead({ title: () => (classSession.value ? localized(classSession.value.titleFa, classSession.value.titleEn) : t('classes.title')) })

const pending = ref(false)
const error = ref('')

function enrollErrorMessage(err: { statusCode?: number; statusMessage?: string }) {
  if (err?.statusCode === 402) return t('wallet.insufficientBalance')
  if (err?.statusMessage === 'Gender required') return t('classes.enrollGenderRequired')
  if (err?.statusMessage === 'Gender not allowed for this class') return t('classes.enrollGenderError')
  if (err?.statusMessage === 'Skill level not in range for this class') return t('classes.enrollLevelError')
  return t('classes.enrollError')
}

async function enroll() {
  if (!loggedIn.value) return requireLogin()
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/classes/enroll', {
      method: 'POST',
      body: { classSessionId: id.value, payWithWallet: payWithWallet.value },
    })
    await refresh()
    await refreshWallet()
    toast.success(t('classes.enrollSuccess'))
  } catch (e: unknown) {
    const err = e as { statusCode?: number; statusMessage?: string }
    const msg = enrollErrorMessage(err)
    error.value = msg
    toast.error(msg)
  } finally {
    pending.value = false
  }
}

async function cancel() {
  pending.value = true
  try {
    await $fetch(`/api/classes/enroll/${id.value}`, { method: 'DELETE' })
    await refresh()
    toast.info(t('classes.cancelled'))
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div v-if="classSession" class="page-enter mx-auto max-w-2xl px-4 py-8 sm:px-6">
    <BackLink to="/classes" />
    <div class="glass-panel p-6">
      <div v-if="classSession.sport" class="mb-4 flex items-center gap-3">
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
          <SportIcon :slug="classSession.sport.slug" size="lg" />
        </span>
        <span class="text-sm font-bold text-brand-orange">
          {{ localized(classSession.sport.nameFa, classSession.sport.nameEn) }}
        </span>
      </div>
      <h1 class="sz-headline">{{ localized(classSession.titleFa, classSession.titleEn) }}</h1>
      <p v-if="classSession.club" class="mt-2 text-sz-gray-600">{{ pickName(classSession.club) }}</p>
      <p v-if="classSession.coach" class="ios-footnote mt-1">{{ pickName(classSession.coach) }}</p>

      <div class="mt-4 flex flex-wrap gap-2">
        <SzBadge tone="blue">{{ classTypeLabel(classSession.classType) }}</SzBadge>
        <SzBadge tone="purple">{{ classGroupLabel(classSession) }}</SzBadge>
      </div>

      <p class="mt-4">{{ formatDate(classSession.date) }} · {{ formatTimeRange(classSession.startTime, classSession.endTime) }}</p>
      <p class="mt-2 font-bold">{{ formatPrice(classSession.price) }} {{ t('clubs.currency') }}</p>
      <p class="ios-footnote mt-2">
        {{ t('classes.levelRange') }}: {{ levelRangeLabel(classSession.minLevel, classSession.maxLevel) }}
      </p>
      <p class="ios-footnote mt-1">{{ t('classes.seats') }}: {{ formatFraction(classSession.bookedSeats, classSession.maxSeats) }}</p>

      <ClassParticipantRoster
        v-if="classSession.participants"
        :participants="classSession.participants"
        :max-seats="classSession.maxSeats"
        :booked-seats="classSession.bookedSeats"
      />

      <p v-if="error" class="mt-4 text-sm text-sz-pink">{{ error }}</p>
      <label v-if="loggedIn && !classSession.enrolled" class="mt-4 flex cursor-pointer items-center gap-2 text-sm">
        <input v-model="payWithWallet" type="checkbox" class="rounded border-brand-gray-300" />
        <span>{{ t('wallet.payWithWallet') }} ({{ formatPrice(walletBalance) }})</span>
        <SzDemoBadge />
      </label>
      <SzButton
        v-if="classSession.enrolled"
        variant="ghost"
        block
        class="mt-6"
        :disabled="pending"
        @click="cancel"
      >
        {{ t('classes.cancelEnroll') }}
      </SzButton>
      <SzButton
        v-else-if="classSession.status !== 'FULL'"
        block
        class="mt-6"
        :disabled="pending"
        @click="enroll"
      >
        {{ loggedIn ? t('classes.enroll') : t('booking.loginRequired') }}
      </SzButton>
      <p v-else class="mt-6 text-sm text-sz-gray-500">{{ t('classes.full') }}</p>
    </div>
  </div>
</template>
