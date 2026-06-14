<script setup lang="ts">
import type { Coach } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { pickName, localized } = useLocaleContent()
const { cityLabel } = useCities()

const id = computed(() => String(route.params.id))
const { data: coach, error } = await useApiFetch<Coach>(() => `/api/coaches/${id.value}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Coach not found' })
}

useHead({ title: () => (coach.value ? pickName(coach.value) : t('coaches.title')) })
</script>

<template>
  <div v-if="coach" class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <BackLink to="/coaches" />
    <div class="glass-panel p-6 sm:p-8">
      <div class="flex items-center gap-4">
        <CoachAvatar :coach="coach" :size="96" class="h-24 w-24 shrink-0 overflow-hidden rounded-2xl" />
        <div class="min-w-0">
          <h1 class="ios-title-2">{{ pickName(coach) }}</h1>
          <p
            v-if="coach.sport"
            class="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            :style="{ backgroundColor: coach.sport.color + '22', color: coach.sport.color }"
          >
            <SportIcon :slug="coach.sport.slug" size="xs" />
            {{ localized(coach.sport.nameFa, coach.sport.nameEn) }}
          </p>
          <p class="ios-footnote mt-1">{{ cityLabel(coach.city) }}</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3">
        <div class="rounded-xl bg-sz-gray-50 p-4 text-center">
          <div class="text-lg font-bold text-sz-orange">★ {{ coach.rating.toFixed(1) }}</div>
          <div class="ios-footnote">{{ t('coaches.rating') }}</div>
        </div>
        <div class="rounded-xl bg-sz-gray-50 p-4 text-center">
          <div class="text-lg font-bold text-sz-gray-900">{{ coach.sessions }}</div>
          <div class="ios-footnote">{{ t('coaches.sessions') }}</div>
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
