<script setup lang="ts">
import type { Coach } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { pickName, localized } = useLocaleContent()

const id = computed(() => String(route.params.id))
const { data: coach, error } = await useApiFetch<Coach>(() => `/api/coaches/${id.value}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach not found' })
}

useHead({ title: () => (coach.value ? pickName(coach.value) : t('coaches.title')) })
</script>

<template>
  <div v-if="coach" class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <NuxtLink :to="localePath('/coaches')" class="ios-footnote mb-4 inline-flex text-sz-blue">← {{ t('common.back') }}</NuxtLink>
    <div class="glass-panel p-8">
      <div class="flex items-center gap-4">
        <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-sz-accent-soft text-2xl font-bold text-sz-blue">
          {{ pickName(coach).charAt(0) }}
        </span>
        <div>
          <h1 class="ios-title-2">{{ pickName(coach) }}</h1>
          <p class="ios-footnote">{{ coach.city }} · ★ {{ coach.rating.toFixed(1) }}</p>
          <p class="ios-footnote">{{ coach.sessions }} {{ t('coaches.sessions') }}</p>
        </div>
      </div>
      <p v-if="coach.bioFa || coach.bioEn" class="mt-6 leading-relaxed text-sz-gray-700">
        {{ localized(coach.bioFa || '', coach.bioEn || '') }}
      </p>
      <NuxtLink :to="localePath('/clubs')" class="ios-btn-primary mt-8 inline-flex">
        {{ t('coaches.bookSession') }}
      </NuxtLink>
    </div>
  </div>
</template>
