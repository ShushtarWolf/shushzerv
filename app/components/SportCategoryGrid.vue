<script setup lang="ts">
import type { Sport } from '~/types'

defineProps<{ sports: Sport[] }>()
const { pickName } = useLocaleContent()
const localePath = useLocalePath()
const { accent, softBg } = useSportTheme()
</script>

<template>
  <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-8">
    <NuxtLink
      v-for="sport in sports"
      :key="sport.id"
      :to="localePath(`/sports/${sport.slug}`)"
      class="ios-card flex flex-col items-center gap-2 p-4 text-center"
    >
      <span
        class="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        :style="{ backgroundColor: softBg(accent), color: accent }"
      >
        <SportIcon :slug="sport.slug" size="md" />
      </span>
      <span class="text-xs font-medium text-sz-gray-700">{{ pickName(sport) }}</span>
    </NuxtLink>
  </div>
</template>
