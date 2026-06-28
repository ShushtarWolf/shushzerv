<script setup lang="ts">
import type { ClassPackage } from '~/types'

defineProps<{ pkg: ClassPackage }>()
const { t } = useI18n()
const { pickName, localized, formatPrice, formatFraction } = useLocaleContent()
const localePath = useLocalePath()
const { accent, softBg } = useSportTheme()
const { classTypeLabel, classGroupLabel, groupModeLabel, scheduleLabel, packageSummary } = useClassPackage()
const { levelLabel } = useSkillLevel()
</script>

<template>
  <SzCard
    :to="localePath(`/packages/${pkg.id}`)"
    themed
    class="flex h-full flex-col"
  >
    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="flex items-start gap-3">
        <span
          v-if="pkg.sport"
          class="sz-sport-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          :style="{ backgroundColor: softBg(accent), color: accent }"
        >
          <SportIcon :slug="pkg.sport.slug" size="sm" />
        </span>
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-base font-bold leading-snug text-brand-gray-900">
              {{ localized(pkg.titleFa, pkg.titleEn) }}
            </h3>
            <span
              v-if="pkg.classType === 'GROUP'"
              class="shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums"
              :class="pkg.bookedSeats >= pkg.maxSeats ? 'bg-brand-gray-100 text-brand-gray-600' : 'bg-brand-orange/10 text-brand-orange'"
            >
              {{ formatFraction(pkg.bookedSeats, pkg.maxSeats) }}
            </span>
          </div>
          <p v-if="pkg.club" class="truncate text-xs text-brand-gray-500">
            {{ pickName(pkg.club) }}
          </p>
          <p v-else-if="pkg.coach" class="truncate text-xs text-brand-gray-500">
            {{ pickName(pkg.coach) }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <SzBadge tone="blue" class="!text-[10px]">{{ classTypeLabel(pkg.classType) }}</SzBadge>
        <SzBadge v-if="pkg.classType === 'GROUP'" tone="green" class="!text-[10px]">{{ groupModeLabel(pkg.groupMode) }}</SzBadge>
        <SzBadge tone="purple" class="!text-[10px]">{{ classGroupLabel(pkg) }}</SzBadge>
      </div>

      <p class="text-xs text-brand-gray-500">{{ packageSummary(pkg) }}</p>
      <p class="text-xs text-brand-gray-500">{{ scheduleLabel(pkg) }}</p>

      <div v-if="pkg.groupMode === 'WITH_STUDENTS' && pkg.participants?.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="(p, i) in pkg.participants.slice(0, 6)"
          :key="i"
          class="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-gray-100 px-1.5 text-[10px] font-bold text-brand-gray-700"
          :title="levelLabel(p.level)"
        >
          {{ p.initials }}
        </span>
        <span
          v-if="pkg.participants.length > 6"
          class="inline-flex h-7 items-center rounded-full bg-brand-gray-100 px-2 text-[10px] font-semibold text-brand-gray-500"
        >
          +{{ pkg.participants.length - 6 }}
        </span>
      </div>
      <p v-else-if="pkg.classType === 'GROUP' && pkg.groupMode === 'OPEN'" class="text-xs text-brand-gray-500">
        {{ t('packages.openSpots') }}
      </p>

      <p class="line-clamp-2 text-xs leading-relaxed text-brand-gray-600">
        {{ localized(pkg.descFa, pkg.descEn) }}
      </p>

      <div class="mt-auto pt-3">
        <p class="text-sm font-bold text-brand-gray-900">
          {{ formatPrice(pkg.price) }}
          <span class="text-xs font-semibold text-brand-gray-500">{{ t('clubs.currency') }}</span>
        </p>
      </div>
    </div>
  </SzCard>
</template>
