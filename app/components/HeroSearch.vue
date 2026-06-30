<script setup lang="ts">
import type { Sport } from '~/types'

const props = withDefaults(
  defineProps<{ sports: Sport[]; embedded?: boolean }>(),
  { embedded: false },
)
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { cities } = useCities()
const { localDateISO, formatDate } = useLocaleContent()
const { loggedIn, user } = useUserSession()
const { firstName } = useUserDisplayName()
const { slug: sport, sync } = useSelectedSportColor()

watch(
  () => props.sports,
  (list) => sync(list, sport.value),
  { immediate: true },
)

function onSportChange(slugVal: string) {
  sync(props.sports, slugVal)
}

const city = ref('')
const date = ref(localDateISO())
const nearMe = ref(false)

const isRtl = computed(() => locale.value === 'fa')

const dateOptions = computed(() => {
  const opts: { value: string; label: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const value = localDateISO(d)
    opts.push({ value, label: formatDate(value) })
  }
  return opts
})

function submit() {
  navigateTo({
    path: localePath('/clubs'),
    query: {
      book: '1',
      ...(sport.value ? { sport: sport.value } : {}),
      ...(city.value ? { city: city.value } : {}),
      ...(date.value ? { date: date.value } : {}),
      ...(nearMe.value ? { near: '1' } : {}),
    },
  })
}
</script>

<template>
  <section
    :class="embedded
      ? 'relative'
      : 'relative overflow-hidden rounded-ios-xl bg-brand-primary p-6 text-white shadow-lifted sm:p-10'"
  >
    <ShapeGridBackground v-if="!embedded" class="absolute inset-0 h-full w-full" />
    <div
      class="relative z-10 space-y-4"
      :class="embedded ? 'rounded-ios-xl border border-white/10 bg-black/45 p-4 shadow-2xl backdrop-blur-xl sm:space-y-5 sm:p-6' : 'space-y-5'"
    >
      <p
        v-if="loggedIn"
        class="text-sm font-semibold"
        :class="embedded ? 'text-white/90' : 'text-white/95'"
      >
        {{ t('hero.greeting', { name: firstName }) }}
      </p>
      <h2
        v-if="embedded"
        class="text-xl font-bold text-white sm:text-2xl"
      >
        {{ t('hero.bookNow') }}
      </h2>
      <h1 v-else class="sz-display text-white">
        {{ t('hero.bookNow') }}
      </h1>
      <p
        class="max-w-xl text-base"
        :class="embedded ? 'text-white/75' : 'text-white/95'"
      >
        {{ t('hero.subtitle') }}
      </p>

      <p
        class="text-sm font-semibold"
        :class="embedded ? 'text-white/70' : 'text-white/80'"
      >
        {{ t('hero.pickSport') }}
      </p>
      <SzSportTabs variant="hero" :model-value="sport" :sports="sports" @update:model-value="onSportChange" />

      <form
        class="grid gap-3 rounded-2xl bg-white p-4 text-brand-gray-900 shadow-card sm:grid-cols-2 lg:grid-cols-4"
        :dir="isRtl ? 'rtl' : 'ltr'"
        @submit.prevent="submit"
      >
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-brand-gray-600">{{ t('hero.where') }}</label>
          <div class="ios-select-wrap">
            <select v-model="city" class="ios-input">
              <option value="">{{ t('search.allCities') }}</option>
              <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-brand-gray-600">{{ t('hero.when') }}</label>
          <div class="ios-select-wrap">
            <select v-model="date" class="ios-input">
              <option v-for="d in dateOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
            </select>
          </div>
        </div>
        <div class="flex items-end sm:col-span-2 lg:col-span-1">
          <button
            type="button"
            class="sz-nearby-toggle"
            :class="nearMe ? 'sz-nearby-toggle-on' : 'sz-nearby-toggle-off'"
            @click="nearMe = !nearMe"
          >
            <SzIcon name="location" size="sm" />
            {{ t('hero.nearby') }}
          </button>
        </div>
        <div class="flex items-end sm:col-span-2 lg:col-span-1">
          <SzButton type="submit" block>
            <SzIcon name="search" size="sm" />
            {{ t('search.action') }}
          </SzButton>
        </div>
      </form>
    </div>
  </section>
</template>
