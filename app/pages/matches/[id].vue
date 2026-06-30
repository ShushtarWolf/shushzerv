<script setup lang="ts">
import type { OpenMatch } from '~/types'

definePageMeta({ middleware: ['feature-find-players'] })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { localized, pickName, formatDate, formatTime, formatFraction } = useLocaleContent()
const { cityLabel } = useCities()
const { levelLabel } = useSkillLevel()
const { loggedIn } = useUserSession()
const { requireLogin } = useAuthRedirect()

const id = computed(() => String(route.params.id))
const { data: match, refresh } = await useApiFetch<OpenMatch>(() => `/api/matches/${id.value}`)

useHead({ title: () => t('matches.title') })

const pending = ref(false)

async function join() {
  if (!loggedIn.value) return requireLogin()
  pending.value = true
  try {
    await $fetch(`/api/matches/${id.value}/join`, { method: 'POST' })
    await refresh()
  } finally {
    pending.value = false
  }
}

async function leave() {
  pending.value = true
  try {
    await $fetch(`/api/matches/${id.value}/leave`, { method: 'DELETE' })
    await navigateTo(localePath('/matches'))
  } finally {
    pending.value = false
  }
}

const shareUrl = ref('')
watch(
  () => match.value?.shareToken,
  (token) => {
    if (token && import.meta.client) {
      shareUrl.value = `${window.location.origin}${localePath(`/m/${token}`)}`
    }
  },
  { immediate: true },
)

function copyShare() {
  if (shareUrl.value) navigator.clipboard.writeText(shareUrl.value)
}
</script>

<template>
  <div v-if="match" class="page-enter mx-auto max-w-2xl px-4 py-8 sm:px-6">
    <BackLink to="/matches" />
    <div class="glass-panel p-6">
      <div class="flex items-center gap-3">
        <span
          v-if="match.sport"
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange"
        >
          <SportIcon :slug="match.sport.slug" size="lg" />
        </span>
        <div>
          <h1 class="ios-title-2">{{ match.sport ? t(`sport.${match.sport.slug}.name`) : '' }}</h1>
          <p class="ios-footnote">{{ cityLabel(match.city) }}</p>
        </div>
      </div>
      <p class="mt-4">{{ formatDate(match.date) }} · {{ formatTime(match.startTime) }}</p>
      <p v-if="match.club" class="mt-2">{{ pickName(match.club) }}</p>
      <p class="ios-footnote mt-2">
        {{ levelLabel(match.minLevel) }} – {{ levelLabel(match.maxLevel) }} ·
        {{ formatFraction(match.joinedCount, match.maxPlayers) }} {{ t('matches.players') }}
      </p>
      <p v-if="match.notesFa || match.notesEn" class="mt-4 text-sz-gray-700">
        {{ localized(match.notesFa || '', match.notesEn || '') }}
      </p>

      <SzButton v-if="match.joined" variant="ghost" block class="mt-6" :disabled="pending" @click="leave">
        {{ t('matches.leave') }}
      </SzButton>
      <SzButton
        v-else-if="match.status === 'OPEN'"
        block
        class="mt-6"
        :disabled="pending"
        @click="join"
      >
        {{ loggedIn ? t('matches.join') : t('booking.loginRequired') }}
      </SzButton>
      <p v-else class="mt-6 text-sm text-sz-gray-500">{{ t('matches.full') }}</p>

      <div v-if="match.shareToken && shareUrl" class="mt-4 border-t border-brand-gray-100 pt-4">
        <SzButton variant="secondary" block class="text-sm" @click="copyShare">
          {{ t('matchShare.copyLink') }}
        </SzButton>
        <NuxtLink :to="localePath(`/chat`)" class="mt-2 block text-center text-sm font-semibold text-brand-orange">
          {{ t('nav.chat') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
