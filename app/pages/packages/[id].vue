<script setup lang="ts">
import type { ClassPackage } from '~/types'

definePageMeta({ middleware: ['feature-group-classes'] })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { localized, pickName, formatPrice } = useLocaleContent()
const { classTypeLabel, classGroupLabel, groupModeLabel, scheduleLabel, packageSummary, durationLabel, frequencyLabel } = useClassPackage()
const { levelRangeLabel } = useClassSession()
const { levelLabel } = useSkillLevel()

const id = computed(() => String(route.params.id))
const { data: pkg, pending } = await useApiFetch<ClassPackage>(() => `/api/packages/${id.value}`)

useHead({ title: () => (pkg.value ? localized(pkg.value.titleFa, pkg.value.titleEn) : t('packages.title')) })
</script>

<template>
  <div class="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
    <template v-else-if="pkg">
      <NuxtLink :to="localePath('/packages')" class="mb-4 inline-flex text-sm font-semibold text-brand-orange">
        ← {{ t('packages.viewAll') }}
      </NuxtLink>

      <div class="fd-card overflow-hidden">
        <div class="border-b border-brand-gray-100 p-6">
          <div class="flex flex-wrap items-start gap-3">
            <span
              v-if="pkg.sport"
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange"
            >
              <SportIcon :slug="pkg.sport.slug" size="md" />
            </span>
            <div class="min-w-0 flex-1">
              <h1 class="text-2xl font-bold text-brand-gray-900">
                {{ localized(pkg.titleFa, pkg.titleEn) }}
              </h1>
              <p v-if="pkg.club" class="mt-1 text-sm text-brand-gray-500">{{ pickName(pkg.club) }}</p>
              <p v-else-if="pkg.coach" class="mt-1 text-sm text-brand-gray-500">{{ pickName(pkg.coach) }}</p>
            </div>
            <span
              v-if="pkg.featured"
              class="rounded-lg bg-brand-orange/10 px-2.5 py-1 text-xs font-bold text-brand-orange"
            >
              {{ t('packages.featured') }}
            </span>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <SzBadge tone="blue">{{ classTypeLabel(pkg.classType) }}</SzBadge>
            <SzBadge v-if="pkg.classType === 'GROUP'" tone="green">{{ groupModeLabel(pkg.groupMode) }}</SzBadge>
            <SzBadge tone="purple">{{ classGroupLabel(pkg) }}</SzBadge>
          </div>
        </div>

        <div class="space-y-4 p-6">
          <p class="whitespace-pre-line text-sm leading-relaxed text-brand-gray-700">
            {{ localized(pkg.descFa, pkg.descEn) }}
          </p>

          <dl class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl bg-brand-gray-50 px-4 py-3">
              <dt class="text-xs font-semibold uppercase text-brand-gray-500">{{ t('packages.frequency') }}</dt>
              <dd class="mt-1 text-sm font-semibold text-brand-gray-900">{{ frequencyLabel(pkg.sessionsPerWeek) }}</dd>
            </div>
            <div class="rounded-xl bg-brand-gray-50 px-4 py-3">
              <dt class="text-xs font-semibold uppercase text-brand-gray-500">{{ t('packages.duration') }}</dt>
              <dd class="mt-1 text-sm font-semibold text-brand-gray-900">{{ durationLabel(pkg.durationWeeks) }}</dd>
            </div>
            <div class="rounded-xl bg-brand-gray-50 px-4 py-3">
              <dt class="text-xs font-semibold uppercase text-brand-gray-500">{{ t('packages.schedule') }}</dt>
              <dd class="mt-1 text-sm font-semibold text-brand-gray-900">{{ scheduleLabel(pkg) }}</dd>
            </div>
            <div class="rounded-xl bg-brand-gray-50 px-4 py-3">
              <dt class="text-xs font-semibold uppercase text-brand-gray-500">{{ t('classes.levelRange') }}</dt>
              <dd class="mt-1 text-sm font-semibold text-brand-gray-900">{{ levelRangeLabel(pkg.minLevel, pkg.maxLevel) }}</dd>
            </div>
            <div class="rounded-xl bg-brand-gray-50 px-4 py-3">
              <dt class="text-xs font-semibold uppercase text-brand-gray-500">{{ t('classes.seats') }}</dt>
              <dd class="mt-1 text-sm font-semibold text-brand-gray-900">
                {{ pkg.bookedSeats }} / {{ pkg.maxSeats }}
              </dd>
            </div>
            <div v-if="pkg.classType === 'GROUP'" class="rounded-xl bg-brand-gray-50 px-4 py-3">
              <dt class="text-xs font-semibold uppercase text-brand-gray-500">{{ t('packages.groupMode') }}</dt>
              <dd class="mt-1 text-sm font-semibold text-brand-gray-900">{{ groupModeLabel(pkg.groupMode) }}</dd>
            </div>
            <div class="rounded-xl bg-brand-gray-50 px-4 py-3">
              <dt class="text-xs font-semibold uppercase text-brand-gray-500">{{ t('packages.summary') }}</dt>
              <dd class="mt-1 text-sm font-semibold text-brand-gray-900">{{ packageSummary(pkg) }}</dd>
            </div>
          </dl>

          <div v-if="pkg.groupMode === 'WITH_STUDENTS'" class="rounded-xl border border-brand-gray-100 p-4">
            <p class="mb-3 text-sm font-bold text-brand-gray-900">{{ t('packages.roster') }}</p>
            <div v-if="pkg.participants?.length" class="flex flex-wrap gap-2">
              <span
                v-for="(p, i) in pkg.participants"
                :key="i"
                class="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-brand-gray-100 px-2 text-xs font-bold text-brand-gray-700"
                :title="levelLabel(p.level)"
              >
                {{ p.initials }}
              </span>
            </div>
            <p v-else class="text-sm text-brand-gray-500">{{ t('packages.rosterEmpty') }}</p>
          </div>
          <p v-else-if="pkg.classType === 'GROUP' && pkg.groupMode === 'OPEN'" class="text-sm text-brand-gray-600">
            {{ t('packages.openSpots') }}
          </p>

          <div class="flex flex-wrap items-center justify-between gap-4 border-t border-brand-gray-100 pt-4">
            <p class="text-xl font-bold text-brand-gray-900">
              {{ formatPrice(pkg.price) }}
              <span class="text-sm font-semibold text-brand-gray-500">{{ t('clubs.currency') }}</span>
            </p>
            <NuxtLink
              v-if="pkg.club"
              :to="localePath(`/clubs/${pkg.club.slug}`)"
              class="fd-btn-primary text-sm"
            >
              {{ t('packages.contactClub') }}
            </NuxtLink>
            <NuxtLink
              v-else-if="pkg.coach"
              :to="localePath(`/coaches/${pkg.coach.id}`)"
              class="fd-btn-primary text-sm"
            >
              {{ t('packages.contactCoach') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
    <SzEmptyState
      v-else
      :message="t('common.noResults')"
      :action-label="t('packages.viewAll')"
      :action-to="localePath('/packages')"
    />
  </div>
</template>
