<script setup lang="ts">
import type { OpenMatch } from '~/types'

definePageMeta({ middleware: ['feature-find-players'] })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { loggedIn } = useUserSession()
const { requireLogin } = useAuthRedirect()
const { localized, formatDate, formatTime, formatFraction } = useLocaleContent()
const { levelLabel } = useSkillLevel()
const { cityLabel } = useCities()

const token = computed(() => String(route.params.token))

const { data: match, refresh } = await useApiFetch<OpenMatch & { joined?: boolean }>(
  () => `/api/matches/by-token/${token.value}`,
)

useHead({
  title: () => {
    if (!match.value) return t('matchShare.title')
    const sport = match.value.sport ? localized(match.value.sport.nameFa, match.value.sport.nameEn) : ''
    const place = cityLabel(match.value.city)
    const when = `${formatDate(match.value.date)} · ${formatTime(match.value.startTime)}`
    return sport ? `${t('matchShare.title')} — ${sport} · ${place}` : `${t('matchShare.title')} — ${place} · ${when}`
  },
})

const pending = ref(false)
const joined = ref(false)
const error = ref('')

watch(() => match.value?.joined, (v) => { if (v) joined.value = true }, { immediate: true })

async function join() {
  if (!loggedIn.value) return requireLogin()
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/matches/join-by-token', { method: 'POST', body: { token: token.value } })
    joined.value = true
    await refresh()
  } catch (e: unknown) {
    const err = e as { statusMessage?: string }
    error.value = err?.statusMessage || 'Error'
  } finally {
    pending.value = false
  }
}

const shareUrl = ref('')
onMounted(() => { shareUrl.value = window.location.href })
</script>

<template>
  <div v-if="match" class="page-enter mx-auto max-w-lg px-4 py-10 sm:px-6">
    <div class="ios-card overflow-hidden">
      <div class="bg-brand-primary p-6 text-white">
        <span v-if="match.sport" class="inline-flex text-white">
          <SportIcon :slug="match.sport.slug" size="xl" />
        </span>
        <h1 class="sz-headline mt-3 text-white">{{ t('matchShare.title') }}</h1>
        <p class="mt-2 text-white/85">{{ cityLabel(match.city) }} · {{ formatDate(match.date) }} · {{ formatTime(match.startTime) }}</p>
      </div>
      <div class="space-y-3 p-6">
        <p v-if="match.club" class="font-bold">{{ localized(match.club.nameFa, match.club.nameEn) }}</p>
        <p class="text-sm text-brand-gray-600">
          {{ levelLabel(match.minLevel) }} – {{ levelLabel(match.maxLevel) }} ·
          {{ formatFraction(match.joinedCount, match.maxPlayers) }} {{ t('matches.players') }}
        </p>
        <p v-if="error" class="text-sm text-brand-pink">{{ error }}</p>
        <SzButton v-if="!joined" block :disabled="pending" @click="join">{{ t('matches.join') }}</SzButton>
        <div v-else class="animate-success-check text-center">
          <p class="text-2xl">✅</p>
          <p class="mt-2 font-bold text-brand-green">{{ t('matchShare.joined') }}</p>
          <NuxtLink :to="localePath(`/matches/${match.id}`)" class="mt-4 inline-block text-sm font-semibold text-brand-orange">
            {{ t('matchShare.viewMatch') }}
          </NuxtLink>
        </div>
        <SzButton
          v-if="shareUrl"
          variant="secondary"
          block
          class="text-sm"
          @click="navigator.clipboard.writeText(shareUrl)"
        >
          {{ t('matchShare.copyLink') }}
        </SzButton>
      </div>
    </div>
  </div>
</template>
