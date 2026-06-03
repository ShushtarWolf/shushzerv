<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { fetch: refreshSession } = useUserSession()

useHead({ title: () => t('auth.loginTitle') })

const email = ref('athlete@shushzerv.local')
const password = ref('demo1234')
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    const { user } = useUserSession()
    if (user.value?.role === 'CLUB_ADMIN') await navigateTo(localePath('/dashboard/club'))
    else if (user.value?.role === 'COACH') await navigateTo(localePath('/dashboard/coach'))
    else await navigateTo(localePath('/dashboard'))
  } catch {
    error.value = t('auth.invalid')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="page-enter mx-auto max-w-md px-4 py-10 sm:px-6">
    <h1 class="ios-large-title mb-2">{{ t('auth.loginTitle') }}</h1>
    <p class="ios-footnote mb-6">{{ t('auth.demoHint') }}</p>
    <form class="glass-panel space-y-4 p-6" @submit.prevent="submit">
      <div>
        <label class="ios-footnote mb-1 block">{{ t('auth.email') }}</label>
        <input v-model="email" type="email" required class="ios-input" autocomplete="email" />
      </div>
      <div>
        <label class="ios-footnote mb-1 block">{{ t('auth.password') }}</label>
        <input v-model="password" type="password" required class="ios-input" autocomplete="current-password" />
      </div>
      <p v-if="error" class="text-sm text-sz-pink">{{ error }}</p>
      <button type="submit" class="ios-btn-primary w-full" :disabled="pending">{{ t('auth.loginAction') }}</button>
    </form>
    <p class="mt-6 text-center text-sm text-sz-gray-600">
      {{ t('auth.noAccount') }}
      <NuxtLink :to="localePath('/register')" class="font-semibold text-sz-blue">{{ t('auth.goRegister') }}</NuxtLink>
    </p>
  </div>
</template>
