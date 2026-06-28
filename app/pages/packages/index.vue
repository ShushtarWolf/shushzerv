<script setup lang="ts">
import type { ClassPackage } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: () => t('packages.title') })

const groupFilter = ref<'ALL' | 'OPEN' | 'WITH_STUDENTS'>('ALL')

const { data: packages, pending } = await useApiFetch<ClassPackage[]>('/api/packages', {
  query: computed(() => ({
    groupMode: groupFilter.value === 'ALL' ? undefined : groupFilter.value,
    classType: groupFilter.value === 'ALL' ? undefined : 'GROUP',
  })),
  watch: [groupFilter],
})

const filterOptions = computed(() => [
  { id: 'ALL' as const, label: t('packages.filterAll') },
  { id: 'OPEN' as const, label: t('packages.withoutStudents') },
  { id: 'WITH_STUDENTS' as const, label: t('packages.withStudents') },
])
</script>

<template>
  <div class="page-enter mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <SzPageHeader :title="t('packages.title')" :subtitle="t('packages.subtitle')" />

    <div class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="opt in filterOptions"
        :key="opt.id"
        type="button"
        class="sz-chip tap-highlight"
        :class="groupFilter === opt.id ? 'bg-brand-orange text-white shadow-fd-soft' : 'bg-brand-gray-100 text-brand-gray-700'"
        @click="groupFilter = opt.id"
      >
        {{ opt.label }}
      </button>
    </div>

    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <div v-else-if="packages?.length" class="sz-stagger grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PackageCard v-for="pkg in packages" :key="pkg.id" :pkg="pkg" />
    </div>
    <SzEmptyState
      v-else
      :message="t('common.noResults')"
      :action-label="t('nav.home')"
      :action-to="localePath('/')"
    />
  </div>
</template>
