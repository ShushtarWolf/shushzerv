<script setup lang="ts">
import type { Sport } from '~/types'
import type { SkillLevel } from '~/composables/useSkillLevel'

definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { pickName } = useLocaleContent()
const { levels, levelLabel } = useSkillLevel()
const { dashboardPath } = useDashboardPath()
const { resolvePostAuthRedirect } = useAuthRedirect()

useHead({ title: () => t('onboarding.title') })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')

const selectedSports = ref<string[]>(['tennis'])
const level = ref<SkillLevel>('BEGINNER')
const pending = ref(false)

function toggleSport(slug: string) {
  if (selectedSports.value.includes(slug)) {
    selectedSports.value = selectedSports.value.filter((s) => s !== slug)
  } else if (selectedSports.value.length < 4) {
    selectedSports.value.push(slug)
  }
}

async function finish() {
  pending.value = true
  try {
    await $fetch('/api/profile/onboard', {
      method: 'POST',
      body: { sports: selectedSports.value, level: level.value },
    })
    await navigateTo(resolvePostAuthRedirect(dashboardPath.value))
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="page-enter mx-auto max-w-lg px-4 py-10 sm:px-6">
    <p class="sz-eyebrow">{{ t('onboarding.eyebrow') }}</p>
    <h1 class="sz-headline mt-2">{{ t('onboarding.title') }}</h1>
    <p class="mt-2 text-brand-gray-600">{{ t('onboarding.subtitle') }}</p>

    <section class="mt-8">
      <h2 class="ios-title-3 mb-3">{{ t('onboarding.pickSports') }}</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="s in sports"
          :key="s.id"
          type="button"
          class="sz-chip tap-highlight"
          :class="selectedSports.includes(s.slug) ? 'bg-brand-orange text-brand-primary shadow-card' : 'bg-white shadow-card'"
          @click="toggleSport(s.slug)"
        >
          <span class="inline-flex items-center gap-1.5">
            <SportIcon :slug="s.slug" size="sm" />
            {{ pickName(s) }}
          </span>
        </button>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="ios-title-3 mb-3">{{ t('onboarding.pickLevel') }}</h2>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="l in levels"
          :key="l"
          type="button"
          class="ios-card p-4 text-center font-bold tap-highlight"
          :class="level === l ? 'ring-2 ring-brand-orange' : ''"
          @click="level = l"
        >
          {{ levelLabel(l) }}
        </button>
      </div>
    </section>

    <SzButton class="mt-10" block size="lg" :disabled="pending || !selectedSports.length" @click="finish">
      {{ t('onboarding.finish') }}
    </SzButton>
  </div>
</template>
