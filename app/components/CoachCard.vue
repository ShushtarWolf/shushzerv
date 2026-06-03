<script setup lang="ts">
import type { Coach } from '~/types'

const props = defineProps<{ coach: Coach }>()
const { localized } = useLocaleContent()

const initials = computed(() => localized(props.coach.nameFa, props.coach.nameEn).trim().charAt(0))
</script>

<template>
  <div class="ios-card flex items-center gap-4 p-4">
    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-blue text-xl font-bold text-white">
      {{ initials }}
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="ios-title-3 line-clamp-1">{{ localized(coach.nameFa, coach.nameEn) }}</h3>
      <p class="ios-footnote">
        {{ coach.sport ? localized(coach.sport.nameFa, coach.sport.nameEn) : '' }} · {{ coach.city }}
      </p>
      <div class="mt-1 flex items-center gap-3 text-xs text-brand-gray-500">
        <span>★ {{ coach.rating.toFixed(1) }}</span>
        <span>{{ coach.sessions }} {{ $t('coaches.sessions') }}</span>
      </div>
    </div>
  </div>
</template>
