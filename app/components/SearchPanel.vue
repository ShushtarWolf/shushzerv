<script setup lang="ts">
import type { Sport } from '~/types'

defineProps<{ sports: Sport[] }>()
const { t } = useI18n()
const { pickName } = useLocaleContent()
const localePath = useLocalePath()

const query = ref('')
const sport = ref('')
const city = ref('')

const cities = ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز']

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
  <form class="glass-panel grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto]" @submit.prevent="submit">
    <input v-model="query" type="text" :placeholder="t('search.placeholder')" class="ios-input" />
    <select v-model="sport" class="ios-input md:w-40">
      <option value="">{{ t('search.allSports') }}</option>
      <option v-for="s in sports" :key="s.id" :value="s.slug">{{ pickName(s) }}</option>
    </select>
    <select v-model="city" class="ios-input md:w-40">
      <option value="">{{ t('search.allCities') }}</option>
      <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
    </select>
    <button type="submit" class="ios-btn-primary">{{ t('search.action') }}</button>
  </form>
</template>
