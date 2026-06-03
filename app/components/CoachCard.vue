<script setup lang="ts">
import type { Coach } from '~/types'

const props = defineProps<{ coach: Coach }>()
const { t } = useI18n()
const { pickName, localized } = useLocaleContent()
const localePath = useLocalePath()

const initials = computed(() => pickName(props.coach).split(' ').map(s => s[0]).slice(0, 2).join(''))
</script>

<template>
  <NuxtLink :to="localePath(`/coaches/${coach.id}`)" class="ios-card flex items-center gap-4 p-4">
    <span class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sz-indigo to-sz-blue text-lg font-bold text-white">
      {{ initials }}
    </span>
    <div class="min-w-0 flex-1">
      <h3 class="ios-title-3 truncate">{{ pickName(coach) }}</h3>
      <p class="ios-footnote">
        {{ coach.sport ? localized(coach.sport.nameFa, coach.sport.nameEn) : '' }} · {{ coach.city }}
      </p>
    </div>
    <div class="text-end">
      <div class="text-sm font-semibold text-sz-orange">★ {{ coach.rating.toFixed(1) }}</div>
      <div class="ios-footnote">{{ coach.sessions }} {{ t('coaches.sessions') }}</div>
    </div>
  </NuxtLink>
</template>
