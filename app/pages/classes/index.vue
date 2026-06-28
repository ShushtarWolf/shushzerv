<script setup lang="ts">
import type { ClassSession } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: () => t('classes.title') })

const sportFilter = ref('')
const typeFilter = ref('')
const genderFilter = ref('')
const { data: classes, pending } = await useApiFetch<ClassSession[]>('/api/classes', {
  query: computed(() => ({
    ...(sportFilter.value ? { sport: sportFilter.value } : {}),
    ...(typeFilter.value ? { classType: typeFilter.value } : {}),
    ...(genderFilter.value ? { genderPolicy: genderFilter.value } : {}),
  })),
})
const { data: sports } = await useApiFetch('/api/sports')
const { sync } = useSelectedSportColor()

watch(
  [sportFilter, sports],
  () => sync(sports.value, sportFilter.value),
  { immediate: true },
)

const typeOptions = [
  { value: '', label: 'classes.filterAll' },
  { value: 'GROUP', label: 'classes.group' },
  { value: 'SEMI_PRIVATE', label: 'classes.semiPrivate' },
]

const genderOptions = [
  { value: '', label: 'classes.filterAll' },
  { value: 'MEN', label: 'dashboard.genderMen' },
  { value: 'WOMEN', label: 'dashboard.genderWomen' },
  { value: 'FAMILY', label: 'dashboard.genderFamily' },
  { value: 'MIXED', label: 'dashboard.genderMixed' },
]
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
      class="mb-4"
    />

    <div class="mb-6 flex flex-wrap gap-3">
      <div>
        <label class="mb-1 block text-xs font-semibold text-brand-gray-500">{{ t('classes.filterType') }}</label>
        <select v-model="typeFilter" class="ios-input min-w-[9rem]">
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ t(opt.label) }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs font-semibold text-brand-gray-500">{{ t('classes.filterGender') }}</label>
        <select v-model="genderFilter" class="ios-input min-w-[9rem]">
          <option v-for="opt in genderOptions" :key="opt.value" :value="opt.value">{{ t(opt.label) }}</option>
        </select>
      </div>
    </div>

    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <div v-else-if="classes?.length" :key="`${sportFilter}-${typeFilter}-${genderFilter}`" class="sz-stagger sz-grid-enter grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
