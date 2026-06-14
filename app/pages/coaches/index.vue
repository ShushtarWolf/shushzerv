<script setup lang="ts">
import type { Coach } from '~/types'

const { t } = useI18n()
useHead({ title: () => t('nav.coaches') })

const { data: coaches, pending } = await useApiFetch<Coach[]>('/api/coaches')
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <h1 class="ios-large-title mb-6">{{ t('coaches.title') }}</h1>
    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <div v-else-if="coaches?.length" class="sz-stagger grid items-stretch gap-3 sm:grid-cols-2">
      <CoachCard v-for="coach in coaches" :key="coach.id" :coach="coach" />
    </div>
    <p v-else class="ios-footnote">{{ t('common.noResults') }}</p>
  </div>
</template>
