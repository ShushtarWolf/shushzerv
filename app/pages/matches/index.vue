<script setup lang="ts">
import type { OpenMatch, Sport } from '~/types'
import { DEFAULT_CITY } from '~/composables/useCities'

const { t } = useI18n()
const localePath = useLocalePath()
const { loggedIn } = useUserSession()
const { requireLogin } = useAuthRedirect()
const { levels, levelLabel } = useSkillLevel()
const { cities } = useCities()
const { localDateISO } = useLocaleContent()

useHead({ title: () => t('matches.title') })

const sportFilter = ref('')
const { data: matches, refresh } = await useApiFetch<OpenMatch[]>('/api/matches', {
  query: computed(() => ({ ...(sportFilter.value ? { sport: sportFilter.value } : {}) })),
})
const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { sync } = useSelectedSportColor()

watch(
  [sportFilter, sports],
  () => sync(sports.value, sportFilter.value),
  { immediate: true },
)
useSanitizeSportFilter(sportFilter, sports)

const showForm = ref(false)
const form = ref({
  sport: 'tennis',
  city: DEFAULT_CITY,
  date: localDateISO(),
  startTime: '18:00',
  maxPlayers: 4,
  minLevel: 'BEGINNER' as const,
  maxLevel: 'PRO' as const,
  notes: '',
})
const pending = ref(false)
const shareMsg = ref('')

async function createMatch() {
  if (!loggedIn.value) return requireLogin()
  pending.value = true
  shareMsg.value = ''
  try {
    const created = await $fetch<OpenMatch>('/api/matches', {
      method: 'POST',
      body: { ...form.value, notesFa: form.value.notes, notesEn: form.value.notes },
    })
    showForm.value = false
    await refresh()
    if (created.shareToken && import.meta.client) {
      const url = `${window.location.origin}${localePath(`/m/${created.shareToken}`)}`
      shareMsg.value = url
    }
  } finally {
    pending.value = false
  }
}

function copyShare() {
  if (shareMsg.value && import.meta.client) navigator.clipboard.writeText(shareMsg.value)
}
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <section class="mb-8 rounded-ios-xl bg-brand-orange/10 p-6 sm:p-8">
      <h1 class="sz-headline">{{ t('matches.title') }}</h1>
      <p class="mt-2 text-brand-gray-600">{{ t('matches.subtitle') }}</p>
      <SzButton class="mt-4" @click="loggedIn ? (showForm = true) : requireLogin()">
        {{ t('matches.create') }}
      </SzButton>
    </section>

    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" @click.self="showForm = false">
        <form
          class="w-full max-w-lg animate-slide-in rounded-t-2xl bg-white p-6 shadow-lifted sm:rounded-2xl"
          style="--sz-slide-from: 0; padding-bottom: calc(1.5rem + var(--sz-safe-bottom))"
          @submit.prevent="createMatch"
        >
          <h2 class="ios-title-2 mb-4">{{ t('matches.create') }}</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <p class="ios-footnote mb-2">{{ t('search.sport') }}</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="s in sports"
                  :key="s.id"
                  type="button"
                  class="sz-chip tap-highlight"
                  :class="form.sport === s.slug ? 'bg-brand-orange text-brand-primary shadow-card' : 'bg-white shadow-card'"
                  @click="form.sport = s.slug"
                >
                  <span class="inline-flex items-center gap-1.5">
                    <SportIcon :slug="s.slug" size="sm" />
                    {{ t(`sport.${s.slug}.name`) }}
                  </span>
                </button>
              </div>
            </div>
            <select v-model="form.city" class="ios-input">
              <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <input v-model="form.date" type="date" class="ios-input" />
            <input v-model="form.startTime" type="time" class="ios-input" />
            <select v-model="form.minLevel" class="ios-input">
              <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
            </select>
            <select v-model="form.maxLevel" class="ios-input">
              <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
            </select>
            <input v-model.number="form.maxPlayers" type="number" min="2" max="22" class="ios-input" />
            <input v-model="form.notes" class="ios-input sm:col-span-2" :placeholder="t('matches.notes')" />
          </div>
          <div class="mt-4 flex gap-2">
            <SzButton type="submit" block :disabled="pending">{{ t('matches.create') }}</SzButton>
            <SzButton variant="ghost" @click="showForm = false">{{ t('common.close') }}</SzButton>
          </div>
        </form>
      </div>
    </Teleport>

    <div v-if="shareMsg" class="ios-card mb-6 border-2 border-brand-orange/30 p-4">
      <p class="text-sm font-bold text-brand-orange">{{ t('matchShare.created') }}</p>
      <p class="mt-1 truncate text-xs text-brand-gray-600">{{ shareMsg }}</p>
      <button type="button" class="mt-2 text-sm font-semibold text-brand-blue" @click="copyShare">{{ t('matchShare.copyLink') }}</button>
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
      <button
        type="button"
        class="ios-segment-item tap-highlight transition-all duration-200"
        :class="{ 'ios-segment-item-active': !sportFilter }"
        @click="sportFilter = ''"
      >
        {{ t('clubs.all') }}
      </button>
      <button
        v-for="s in sports"
        :key="s.id"
        type="button"
        class="ios-segment-item tap-highlight transition-all duration-200"
        :class="sportFilter === s.slug ? 'ios-segment-item-active bg-brand-orange text-brand-primary' : ''"
        @click="sportFilter = s.slug"
      >
        <span class="inline-flex items-center gap-1.5">
          <SportIcon :slug="s.slug" size="sm" />
          {{ t(`sport.${s.slug}.name`, s.slug) }}
        </span>
      </button>
    </div>

    <div v-if="matches?.length" :key="sportFilter" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MatchCard v-for="m in matches" :key="m.id" :match="m" />
    </div>
    <SzEmptyState
      v-else
      :message="t('common.noResults')"
      :action-label="t('common.createMatch')"
      :action-to="localePath('/matches')"
    />
  </div>
</template>
