<script setup lang="ts">
import type { Coach } from '~/types'

definePageMeta({ middleware: ['auth', 'role-coach'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useUserSession()
const { pickName, localized } = useLocaleContent()

useHead({ title: () => t('dashboard.coach') })

const { data: coaches } = await useApiFetch<Coach[]>('/api/coaches')
const profile = computed(() => coaches.value?.find((c) => c.userId === user.value?.id))
</script>

<template>
  <div class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-1">{{ t('dashboard.coach') }}</h1>
    <p class="ios-footnote mb-8">{{ t('dashboard.welcome') }}، {{ user?.name }}</p>

    <div v-if="profile" class="glass-panel mb-8 p-6">
      <h2 class="ios-title-2">{{ pickName(profile) }}</h2>
      <p class="ios-footnote mt-2">{{ profile.city }} · ★ {{ profile.rating.toFixed(1) }}</p>
      <p class="mt-4 text-sz-gray-700">{{ localized(profile.bioFa || '', profile.bioEn || '') }}</p>
      <div class="mt-6 grid grid-cols-2 gap-4">
        <div class="ios-card p-4 text-center">
          <p class="text-2xl font-bold text-sz-blue">{{ profile.sessions }}</p>
          <p class="ios-footnote">{{ t('dashboard.mySessions') }}</p>
        </div>
        <div class="ios-card p-4 text-center">
          <p class="text-2xl font-bold text-sz-indigo">—</p>
          <p class="ios-footnote">{{ t('dashboard.myStudents') }}</p>
        </div>
      </div>
    </div>
    <p v-else class="ios-footnote mb-6">{{ t('common.noResults') }}</p>

    <NuxtLink :to="localePath('/coaches')" class="ios-btn-ghost inline-flex">{{ t('coaches.viewAll') }}</NuxtLink>
  </div>
</template>
