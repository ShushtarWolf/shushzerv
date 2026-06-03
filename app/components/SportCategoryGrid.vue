<script setup lang="ts">
import type { Sport } from '~/types'

defineProps<{ sports: Sport[] }>()
const localePath = useLocalePath()
const { localized } = useLocaleContent()
</script>

<template>
  <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-8">
    <NuxtLink
      v-for="s in sports"
      :key="s.id"
      :to="localePath(`/sports/${s.slug}`)"
      class="ios-card flex flex-col items-center gap-2 p-4 text-center tap-highlight"
    >
      <span
        class="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
        :style="{ backgroundColor: s.color + '22', color: s.color }"
      >
        {{ s.icon }}
      </span>
      <span class="text-xs font-semibold text-brand-gray-700">{{ localized(s.nameFa, s.nameEn) }}</span>
    </NuxtLink>
  </div>
</template>
