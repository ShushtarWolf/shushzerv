<script setup lang="ts">
import type { Sport } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const { fetch: refreshSession } = useUserSession()
const { pickName } = useLocaleContent()
const { cities } = useCities()

useHead({ title: () => t('auth.registerTitle') })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref<'ATHLETE' | 'COACH' | 'CLUB_ADMIN'>('ATHLETE')
const sport = ref('fitness')
const city = ref('تهران')
const error = ref('')
const pending = ref(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
        role: role.value,
        ...(role.value === 'COACH' ? { sport: sport.value, city: city.value } : {}),
      },
    })
    await refreshSession()
    if (role.value === 'ATHLETE') {
      await navigateTo(localePath('/onboarding'))
    } else {
      const { dashboardPath } = useDashboardPath()
      await navigateTo(dashboardPath.value)
    }
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
      <template v-if="role === 'COACH'">
        <div>
          <label class="ios-footnote mb-2 block">{{ t('search.sport') }}</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in sports"
              :key="s.id"
              type="button"
              class="sz-chip tap-highlight"
              :class="sport === s.slug ? 'text-white shadow-card' : 'bg-white shadow-card'"
              :style="sport === s.slug ? { backgroundColor: s.color } : undefined"
              @click="sport = s.slug"
            >
              <span class="inline-flex items-center gap-1.5">
                <SportIcon :slug="s.slug" size="sm" />
                {{ pickName(s) }}
              </span>
            </button>
          </div>
        </div>
        <div>
          <label class="ios-footnote mb-1 block">{{ t('search.city') }}</label>
          <select v-model="city" class="ios-input">
            <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>
      </template>
      <p v-if="error" class="text-sm text-sz-pink">{{ error }}</p>
      <button type="submit" class="ios-btn-primary w-full" :disabled="pending">{{ t('auth.registerAction') }}</button>
    </form>
    <p class="mt-6 text-center text-sm text-sz-gray-600">
      {{ t('auth.haveAccount') }}
      <NuxtLink :to="localePath('/login')" class="font-semibold text-sz-blue">{{ t('auth.goLogin') }}</NuxtLink>
    </p>
  </div>
</template>
