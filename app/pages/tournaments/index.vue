<script setup lang="ts">
import type { Tournament } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const { pickName, localized, formatPrice, formatNumber, formatDate, formatTime } = useLocaleContent()
const { loggedIn } = useUserSession()
const toast = useToast()
const { requireLogin } = useAuthRedirect()

useHead({ title: () => t('tournaments.title') })

const { data: tournaments, refresh } = await useApiFetch<Tournament[]>('/api/tournaments')

function statusLabel(status: string) {
  return t(`tournaments.status.${status}`)
}

function statusTone(status: string) {
  if (status === 'OPEN') return 'green'
  if (status === 'FULL') return 'orange'
  if (status === 'CANCELLED') return 'pink'
  return 'gray'
}

async function register(tournamentId: string) {
  if (!loggedIn.value) return requireLogin()
  try {
    await $fetch('/api/tournaments/register', { method: 'POST', body: { tournamentId } })
    toast.success(t('tournaments.registered'))
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusMessage?: string }
    toast.error(err?.data?.message || err?.statusMessage || t('common.error'))
  }
}
</script>

<template>
  <div class="page-enter mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <h1 class="sz-headline mb-6">{{ t('tournaments.title') }}</h1>

    <div v-if="tournaments?.length" class="space-y-4">
      <div v-for="tr in tournaments" :key="tr.id" class="glass-panel p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <NuxtLink :to="localePath(`/tournaments/${tr.id}`)" class="text-lg font-bold hover:text-brand-orange">
              {{ localized(tr.titleFa, tr.titleEn) }}
            </NuxtLink>
            <p class="text-sm text-brand-gray-600">{{ tr.sport ? pickName(tr.sport) : '' }} · {{ tr.club ? pickName(tr.club) : '' }}</p>
            <p class="mt-2 line-clamp-2 text-sm">{{ localized(tr.descFa, tr.descEn) }}</p>
            <p class="mt-2 text-sm text-brand-gray-500">{{ formatDate(tr.date) }} · {{ formatTime(tr.startTime) }}</p>
            <NuxtLink :to="localePath(`/tournaments/${tr.id}`)" class="mt-2 inline-block text-sm font-semibold text-brand-orange">
              {{ t('tournaments.viewDetails') }} →
            </NuxtLink>
          </div>
          <div class="text-end">
            <p class="font-bold text-brand-orange">{{ formatPrice(tr.price) }} {{ t('clubs.currency') }}</p>
            <p class="text-xs text-brand-gray-500">{{ formatNumber(tr.joinedCount) }}/{{ formatNumber(tr.maxParticipants) }}</p>
            <SzButton v-if="tr.status === 'OPEN'" class="mt-2" size="sm" @click="register(tr.id)">{{ t('tournaments.register') }}</SzButton>
            <SzBadge v-else class="mt-2" :tone="statusTone(tr.status)">{{ statusLabel(tr.status) }}</SzBadge>
          </div>
        </div>
      </div>
    </div>
    <SzEmptyState
      v-else
      :message="t('common.noResults')"
      :action-label="t('common.browseClubs')"
      :action-to="localePath('/clubs')"
    />
  </div>
</template>
