<script setup lang="ts">
const localePath = useLocalePath()
const router = useRouter()

const sport = ref('')
const city = ref('')

function submit() {
  router.push({ path: localePath('/clubs'), query: { sport: sport.value || undefined, city: city.value || undefined } })
}
</script>

<template>
  <section class="mx-auto -mt-4 max-w-6xl px-4">
    <form class="glass-panel grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]" @submit.prevent="submit">
      <select v-model="sport" class="ios-input">
        <option value="">{{ $t('search.sport') }}</option>
        <option value="tennis">{{ $t('sport.tennis.name') }}</option>
        <option value="padel">{{ $t('sport.padel.name') }}</option>
        <option value="football">{{ $t('sport.football.name') }}</option>
        <option value="fitness">{{ $t('sport.fitness.name') }}</option>
      </select>
      <select v-model="city" class="ios-input">
        <option value="">{{ $t('search.city') }}</option>
        <option value="Tehran">{{ $t('cities.tehran') }}</option>
        <option value="Isfahan">{{ $t('cities.isfahan') }}</option>
        <option value="Shiraz">{{ $t('cities.shiraz') }}</option>
        <option value="Mashhad">{{ $t('cities.mashhad') }}</option>
      </select>
      <button type="submit" class="ios-btn-primary">{{ $t('search.action') }}</button>
    </form>
  </section>
</template>
