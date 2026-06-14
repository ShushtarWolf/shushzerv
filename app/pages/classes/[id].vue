<script setup lang="ts">
import type { ClassSession } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { localized, pickName, formatPrice, formatDate } = useLocaleContent()
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

const id = computed(() => String(route.params.id))
const { data: classSession, refresh } = await useApiFetch<ClassSession>(() => `/api/classes/${id.value}`)

useHead({ title: () => (classSession.value ? localized(classSession.value.titleFa, classSession.value.titleEn) : t('classes.title')) })

const pending = ref(false)
const error = ref('')

async function enroll() {
  if (!loggedIn.value) return navigateTo(localePath('/login'))
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/classes/enroll', {
      method: 'POST',
      body: { classSessionId: id.value, payWithWallet: payWithWallet.value },
    })
    await refresh()
    await refreshWallet()
  } catch (e: unknown) {
    const err = e as { statusCode?: number }
    error.value = err?.statusCode === 402 ? t('wallet.insufficientBalance') : t('classes.enrollError')
  } finally {
    pending.value = false
  }
}

async function cancel() {
  pending.value = true
  try {
    await $fetch(`/api/classes/enroll/${id.value}`, { method: 'DELETE' })
    await refresh()
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
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          :style="{ backgroundColor: classSession.sport.color + '22', color: classSession.sport.color }"
        >
          <SportIcon :slug="classSession.sport.slug" size="lg" />
        </span>
        <span class="text-sm font-bold" :style="{ color: classSession.sport.color }">
          {{ localized(classSession.sport.nameFa, classSession.sport.nameEn) }}
        </span>
      </div>
      <h1 class="sz-headline">{{ localized(classSession.titleFa, classSession.titleEn) }}</h1>
      <p v-if="classSession.club" class="mt-2 text-sz-gray-600">{{ pickName(classSession.club) }}</p>
      <p v-if="classSession.coach" class="ios-footnote mt-1">{{ pickName(classSession.coach) }}</p>
      <p class="mt-4">{{ formatDate(classSession.date) }} · {{ classSession.startTime }}–{{ classSession.endTime }}</p>
      <p class="mt-2 font-bold">{{ formatPrice(classSession.price) }} {{ t('clubs.currency') }}</p>
      <p class="ios-footnote mt-2">{{ t('classes.seats') }}: {{ classSession.bookedSeats }}/{{ classSession.maxSeats }}</p>

      <p v-if="error" class="mt-4 text-sm text-sz-pink">{{ error }}</p>
      <label v-if="loggedIn && !classSession.enrolled" class="mt-4 flex cursor-pointer items-center gap-2 text-sm">
        <input v-model="payWithWallet" type="checkbox" class="rounded border-brand-gray-300" />
        <span>{{ t('wallet.payWithWallet') }} ({{ formatPrice(walletBalance) }})</span>
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
