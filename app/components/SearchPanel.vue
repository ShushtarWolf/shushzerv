<script setup lang="ts">
import type { Sport } from '~/types'

defineProps<{ sports: Sport[] }>()
const { t, locale } = useI18n()
const { pickName } = useLocaleContent()
const localePath = useLocalePath()

const query = ref('')
const sport = ref('')
const city = ref('')

const { cities } = useCities()
const isRtl = computed(() => locale.value === 'fa')

function submit() {
  navigateTo({
    path: localePath('/clubs'),
    query: {
      ...(query.value ? { q: query.value } : {}),
      ...(sport.value ? { sport: sport.value } : {}),
      ...(city.value ? { city: city.value } : {}),
    },
  })
}
</script>

<template>
  <form
    class="glass-panel flex flex-col gap-3 p-4 md:flex-row md:items-center"
    :dir="isRtl ? 'rtl' : 'ltr'"
    @submit.prevent="submit"
  >
    <input
      v-model="query"
      type="search"
      :placeholder="t('search.placeholder')"
      class="ios-input min-w-0 flex-1"
      :dir="isRtl ? 'rtl' : 'ltr'"
    />
    <select v-model="sport" class="ios-input w-full md:w-40">
      <option value="">{{ t('search.allSports') }}</option>
      <option v-for="s in sports" :key="s.id" :value="s.slug">{{ pickName(s) }}</option>
    </select>
    <select v-model="city" class="ios-input w-full md:w-36">
      <option value="">{{ t('search.allCities') }}</option>
      <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
    </select>
    <SzButton type="submit" block class="shrink-0 md:w-auto md:px-8">{{ t('search.action') }}</SzButton>
  </form>
</template>
