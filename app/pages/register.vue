<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { fetch: refreshSession } = useUserSession()

useHead({ title: () => t('auth.registerTitle') })

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref<'ATHLETE' | 'COACH' | 'CLUB_ADMIN'>('ATHLETE')
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { name: name.value, email: email.value, password: password.value, role: role.value },
    })
    await refreshSession()
    await navigateTo(localePath('/dashboard'))
  } catch (e: unknown) {
    const err = e as { statusCode?: number }
    error.value = err?.statusCode === 409 ? t('auth.emailTaken') : t('auth.invalid')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="page-enter mx-auto max-w-md px-4 py-10 sm:px-6">
    <h1 class="ios-large-title mb-6">{{ t('auth.registerTitle') }}</h1>
    <form class="glass-panel space-y-4 p-6" @submit.prevent="submit">
      <div>
        <label class="ios-footnote mb-1 block">{{ t('auth.name') }}</label>
        <input v-model="name" type="text" required class="ios-input" />
      </div>
      <div>
        <label class="ios-footnote mb-1 block">{{ t('auth.email') }}</label>
        <input v-model="email" type="email" required class="ios-input" autocomplete="email" />
      </div>
      <div>
        <label class="ios-footnote mb-1 block">{{ t('auth.password') }}</label>
        <input v-model="password" type="password" required minlength="6" class="ios-input" />
      </div>
      <div>
        <label class="ios-footnote mb-1 block">{{ t('auth.role') }}</label>
        <select v-model="role" class="ios-input">
          <option value="ATHLETE">{{ t('auth.roleAthlete') }}</option>
          <option value="COACH">{{ t('auth.roleCoach') }}</option>
          <option value="CLUB_ADMIN">{{ t('auth.roleClubAdmin') }}</option>
        </select>
      </div>
      <p v-if="error" class="text-sm text-sz-pink">{{ error }}</p>
      <button type="submit" class="ios-btn-primary w-full" :disabled="pending">{{ t('auth.registerAction') }}</button>
    </form>
    <p class="mt-6 text-center text-sm text-sz-gray-600">
      {{ t('auth.haveAccount') }}
      <NuxtLink :to="localePath('/login')" class="font-semibold text-sz-blue">{{ t('auth.goLogin') }}</NuxtLink>
    </p>
  </div>
</template>
