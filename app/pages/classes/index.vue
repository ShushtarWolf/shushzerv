<script setup lang="ts">
import type { ClassSession } from '~/types'

const { t } = useI18n()
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
    <h1 class="ios-large-title mb-6">{{ t('classes.title') }}</h1>
    <p class="mb-6 text-sz-gray-600">{{ t('classes.subtitle') }}</p>

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
        :class="sportFilter === s.slug ? 'text-white shadow-sm' : ''"
        :style="sportFilter === s.slug ? { backgroundColor: s.color } : undefined"
        @click="sportFilter = s.slug"
      >
        <span class="inline-flex items-center gap-1.5">
          <SportIcon :slug="s.slug" size="sm" />
          {{ t(`sport.${s.slug}.name`, s.slug) }}
        </span>
      </button>
    </div>

    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <div v-else-if="classes?.length" :key="sportFilter" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ClassCard v-for="c in classes" :key="c.id" :class-session="c" />
    </div>
    <p v-else class="ios-footnote">{{ t('common.noResults') }}</p>
  </div>
</template>
