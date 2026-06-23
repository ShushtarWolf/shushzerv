<script setup lang="ts">
import type { Tournament } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { pickName, localized, formatPrice, formatNumber, formatDate, formatTime } = useLocaleContent()
const { loggedIn } = useUserSession()
const { requireLogin } = useAuthRedirect()

const id = computed(() => String(route.params.id))

const { data: tournament, error, refresh } = await useApiFetch<Tournament>(() => `/api/tournaments/${id.value}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
}

useHead({ title: () => (tournament.value ? localized(tournament.value.titleFa, tournament.value.titleEn) : t('tournaments.details')) })

const statusLabel = computed(() => {
  const status = tournament.value?.status
  if (!status) return ''
  return t(`tournaments.status.${status}`)
})

const statusTone = computed(() => {
  const status = tournament.value?.status
  if (status === 'OPEN') return 'green'
  if (status === 'FULL') return 'orange'
  if (status === 'CANCELLED') return 'pink'
  return 'gray'
})

async function register() {
  if (!tournament.value) return
  if (!loggedIn.value) return requireLogin()
  try {
    await $fetch('/api/tournaments/register', { method: 'POST', body: { tournamentId: tournament.value.id } })
    const toast = useToast()
    toast.success(t('tournaments.registered'))
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    const toast = useToast()
    toast.error(err?.data?.message || err?.statusMessage || t('common.error'))
  }
}
</script>

<template>
  <div v-if="tournament" class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <BackLink :to="localePath('/tournaments')" />
    <div class="glass-panel p-6 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="sz-headline">{{ localized(tournament.titleFa, tournament.titleEn) }}</h1>
          <p class="mt-2 text-sm text-brand-gray-600">
            {{ tournament.sport ? pickName(tournament.sport) : '' }}
            <span v-if="tournament.club"> · {{ pickName(tournament.club) }}</span>
          </p>
        </div>
        <SzBadge :tone="statusTone">{{ statusLabel }}</SzBadge>
      </div>

      <p class="mt-6 leading-relaxed text-brand-gray-700">
        {{ localized(tournament.descFa, tournament.descEn) }}
      </p>

      <dl class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl bg-brand-gray-50 p-4">
          <dt class="text-xs font-semibold text-brand-gray-500">{{ t('hero.when') }}</dt>
          <dd class="mt-1 font-semibold">{{ formatDate(tournament.date) }} · {{ formatTime(tournament.startTime) }}</dd>
        </div>
        <div class="rounded-xl bg-brand-gray-50 p-4">
          <dt class="text-xs font-semibold text-brand-gray-500">{{ t('tournaments.capacity') }}</dt>
          <dd class="mt-1 font-semibold">{{ formatNumber(tournament.joinedCount) }}/{{ formatNumber(tournament.maxParticipants) }}</dd>
        </div>
        <div class="rounded-xl bg-brand-gray-50 p-4 sm:col-span-2">
          <dt class="text-xs font-semibold text-brand-gray-500">{{ t('clubs.priceFrom') }}</dt>
          <dd class="mt-1 text-lg font-bold text-brand-orange">{{ formatPrice(tournament.price) }} {{ t('clubs.currency') }}</dd>
        </div>
      </dl>

      <SzButton
        v-if="tournament.status === 'OPEN'"
        class="mt-6"
        block
        @click="register"
      >
        {{ t('tournaments.register') }}
      </SzButton>
    </div>
  </div>
</template>
