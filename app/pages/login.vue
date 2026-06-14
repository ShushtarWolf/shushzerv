<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { fetch: refreshSession, user } = useUserSession()
const { dashboardPath } = useDashboardPath()

useHead({ title: () => t('auth.loginTitle') })

const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    if (user.value?.role === 'ATHLETE' && !user.value.onboarded) {
      await navigateTo(localePath('/onboarding'))
    } else {
      await navigateTo(dashboardPath.value)
    }
  } catch {
    error.value = t('auth.invalid')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="page-enter mx-auto max-w-md px-4 py-10 sm:px-6">
    <SzPageHeader :title="t('auth.loginTitle')" :subtitle="t('auth.demoHint')" />
    <form class="glass-panel space-y-4 p-6" @submit.prevent="submit">
      <SzInput v-model="email" :label="t('auth.email')" type="email" required autocomplete="email" />
      <SzInput v-model="password" :label="t('auth.password')" type="password" required autocomplete="current-password" />
      <p v-if="error" class="text-sm text-brand-pink">{{ error }}</p>
      <SzButton type="submit" block :disabled="pending">{{ t('auth.loginAction') }}</SzButton>
    </form>
    <p class="mt-6 text-center text-sm text-brand-gray-600">
      {{ t('auth.noAccount') }}
      <NuxtLink :to="localePath('/register')" class="font-semibold text-brand-orange">{{ t('auth.goRegister') }}</NuxtLink>
    </p>
  </div>
</template>
