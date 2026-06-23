<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role-coach'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { formatPrice } = useLocaleContent()
const { dashboardPath } = useDashboardPath()
const { resolvePostAuthRedirect } = useAuthRedirect()
const { fetch: refreshSession } = useUserSession()

useHead({ title: () => t('coachOnboarding.title') })

const bioFa = ref('')
const bioEn = ref('')
const sessionPrice = ref(300000)
const photo = ref('')
const pending = ref(false)
const error = ref('')

async function finish() {
  if (!bioFa.value.trim()) {
    error.value = t('coachOnboarding.bioRequired')
    return
  }
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/coach/onboard', {
      method: 'POST',
      body: {
        bioFa: bioFa.value,
        bioEn: bioEn.value || bioFa.value,
        sessionPrice: sessionPrice.value,
        photo: photo.value || undefined,
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
    <p class="sz-eyebrow">{{ t('coachOnboarding.eyebrow') }}</p>
    <h1 class="sz-headline mt-2">{{ t('coachOnboarding.title') }}</h1>
    <p class="mt-2 text-brand-gray-600">{{ t('coachOnboarding.subtitle') }}</p>

    <form class="mt-8 space-y-4 glass-panel p-6" @submit.prevent="finish">
      <div>
        <label class="ios-footnote mb-2 block">{{ t('coachOnboarding.bioFa') }}</label>
        <textarea v-model="bioFa" class="ios-input min-h-28" required />
      </div>
      <div>
        <label class="ios-footnote mb-2 block">{{ t('coachOnboarding.bioEn') }}</label>
        <textarea v-model="bioEn" class="ios-input min-h-28" />
      </div>
      <SzInput v-model.number="sessionPrice" type="number" step="50000" min="0" :label="t('coaches.sessionPrice')" required />
      <SzInput v-model="photo" :label="t('dashboard.photoUrl')" />
      <p v-if="error" class="text-sm text-brand-pink">{{ error }}</p>
      <SzButton type="submit" block :disabled="pending">{{ t('coachOnboarding.finish') }}</SzButton>
      <p class="text-center text-xs text-brand-gray-500">{{ t('coachOnboarding.priceHint', { price: formatPrice(sessionPrice) }) }}</p>
    </form>
  </div>
</template>
