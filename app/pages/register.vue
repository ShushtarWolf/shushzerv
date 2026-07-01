<script setup lang="ts">
import type { Sport } from '~/types'
import { DEFAULT_CITY } from '~/composables/useCities'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const { pickName } = useLocaleContent()
const { cities } = useCities()
const { resolvePostAuthRedirect, loginPath } = useAuthRedirect()
const { dashboardPath } = useDashboardPath()

useHead({ title: () => t('auth.registerTitle') })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref<'ATHLETE' | 'COACH' | 'CLUB_ADMIN'>('ATHLETE')
const showBusinessRoles = ref(false)
const sport = ref('fitness')
const city = ref(DEFAULT_CITY)
const bioFa = ref('')
const sessionPrice = ref(300000)
const error = ref('')
const pending = ref(false)
const toast = useToast()

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
        ...(role.value === 'COACH' ? { sport: sport.value, city: city.value, bioFa: bioFa.value, sessionPrice: sessionPrice.value } : {}),
      },
    })
    await refreshSession()
    const redirect = resolvePostAuthRedirect(dashboardPath.value)
    if (role.value === 'ATHLETE') {
      await navigateTo({
        path: localePath('/onboarding'),
        query: route.query.redirect ? { redirect: String(route.query.redirect) } : {},
      })
    } else if (role.value === 'COACH') {
      await navigateTo({
        path: localePath('/coach-onboarding'),
        query: route.query.redirect ? { redirect: String(route.query.redirect) } : {},
      })
    } else if (role.value === 'CLUB_ADMIN') {
      await navigateTo({
        path: localePath('/club-onboarding'),
        query: route.query.redirect ? { redirect: String(route.query.redirect) } : {},
      })
    } else {
      await navigateTo(redirect)
    }
  } catch (e: unknown) {
    const err = e as { statusCode?: number }
    error.value = err?.statusCode === 409 ? t('auth.emailTaken') : t('auth.invalid')
    toast.error(error.value)
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
      <template v-if="showBusinessRoles">
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
                :class="sport === s.slug ? 'bg-brand-orange text-white shadow-card' : 'bg-white shadow-card'"
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
          <textarea v-model="bioFa" class="ios-input min-h-20" :placeholder="t('coachOnboarding.bioFa')" />
          <SzInput v-model.number="sessionPrice" type="number" step="50000" min="0" :label="t('coaches.sessionPrice')" />
        </template>
      </template>
      <button
        v-else
        type="button"
        class="text-sm font-semibold text-brand-orange tap-highlight hover:underline"
        @click="showBusinessRoles = true"
      >
        {{ t('auth.businessAccount') }}
      </button>
      <p v-if="error" class="text-sm text-brand-pink">{{ error }}</p>
      <SzButton type="submit" block :disabled="pending">{{ t('auth.registerAction') }}</SzButton>
    </form>
    <p class="mt-6 text-center text-sm text-brand-gray-600">
      {{ t('auth.haveAccount') }}
      <NuxtLink :to="loginPath()" class="font-semibold text-brand-orange">{{ t('auth.goLogin') }}</NuxtLink>
    </p>
  </div>
</template>
