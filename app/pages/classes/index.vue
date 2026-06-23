<script setup lang="ts">
import type { ClassSession } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: () => t('classes.title') })

const sportFilter = ref('')
const { data: classes, pending } = await useApiFetch<ClassSession[]>('/api/classes', {
  query: computed(() => ({ ...(sportFilter.value ? { sport: sportFilter.value } : {}) })),
})
const { data: sports } = await useApiFetch('/api/sports')
const { sync } = useSelectedSportColor()

watch(
  [sportFilter, sports],
  () => sync(sports.value, sportFilter.value),
  { immediate: true },
)
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <SzPageHeader :title="t('classes.title')" :subtitle="t('classes.subtitle')" />

    <SzSportTabs
      v-if="sports?.length"
      v-model="sportFilter"
      :sports="sports"
      show-all
      fade
      class="mb-6"
    />

    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <div v-else-if="classes?.length" :key="sportFilter" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ClassCard v-for="c in classes" :key="c.id" :class-session="c" />
    </div>
    <SzEmptyState
      v-else
      :message="t('common.noResults')"
      :action-label="t('common.browseClubs')"
      :action-to="localePath('/clubs?book=1')"
    />
  </div>
</template>
