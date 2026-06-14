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
    <SzPageHeader :title="t('auth.registerTitle')" />
    <form class="glass-panel space-y-4 p-6" @submit.prevent="submit">
      <SzInput v-model="name" :label="t('auth.name')" required />
      <SzInput v-model="email" :label="t('auth.email')" type="email" required autocomplete="email" />
      <SzInput v-model="password" :label="t('auth.password')" type="password" required :minlength="6" />
      <SzSelect v-model="role" :label="t('auth.role')">
        <option value="ATHLETE">{{ t('auth.roleAthlete') }}</option>
        <option value="COACH">{{ t('auth.roleCoach') }}</option>
        <option value="CLUB_ADMIN">{{ t('auth.roleClubAdmin') }}</option>
      </SzSelect>
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
        <SzSelect v-model="city" :label="t('search.city')">
          <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
        </SzSelect>
      </template>
      <p v-if="error" class="text-sm text-brand-pink">{{ error }}</p>
      <SzButton type="submit" block :disabled="pending">{{ t('auth.registerAction') }}</SzButton>
    </form>
    <p class="mt-6 text-center text-sm text-brand-gray-600">
      {{ t('auth.haveAccount') }}
      <NuxtLink :to="localePath('/login')" class="font-semibold text-brand-orange">{{ t('auth.goLogin') }}</NuxtLink>
    </p>
  </div>
</template>
