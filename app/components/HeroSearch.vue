<script setup lang="ts">
import type { Sport } from '~/types'

const props = defineProps<{ sports: Sport[] }>()
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
  <section class="ds-hero px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
    <div class="ds-hero-media" aria-hidden="true" />
    <div class="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <div class="space-y-4 text-center lg:text-start">
        <p v-if="loggedIn" class="text-sm font-semibold text-brand-orange">
          {{ t('hero.greeting', { name: firstName }) }}
        </p>
        <h1 class="sz-display text-white lg:text-[2.75rem]">
          {{ t('hero.bookNow') }}
        </h1>
        <p class="mx-auto max-w-md text-base text-white/90 lg:mx-0 lg:text-lg">
          {{ t('hero.subtitle') }}
        </p>
        <div class="hidden flex-wrap gap-2 lg:flex">
          <span
            v-for="s in sports.slice(0, 4)"
            :key="s.id"
            class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15"
          >
            <SportIcon :slug="s.slug" size="xs" />
            {{ t(`sport.${s.slug}.name`, s.slug) }}
          </span>
        </div>
      </div>

      <div class="w-full space-y-3">
        <p class="text-center text-sm font-semibold text-white/85 lg:text-start">{{ t('hero.pickSport') }}</p>
        <div class="flex justify-center lg:justify-start">
          <SzSportTabs variant="hero" :model-value="sport" :sports="sports" @update:model-value="onSportChange" />
        </div>

        <form
          class="ds-hero-search grid gap-3 sm:grid-cols-2"
          :dir="isRtl ? 'rtl' : 'ltr'"
          @submit.prevent="submit"
        >
          <div class="space-y-1.5 sm:col-span-2">
            <label class="text-xs font-bold uppercase tracking-wide text-brand-gray-500">{{ t('hero.where') }}</label>
            <div class="ios-select-wrap">
              <select v-model="city" class="ios-input">
                <option value="">{{ t('search.allCities') }}</option>
                <option v-for="c in cities" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wide text-brand-gray-500">{{ t('hero.when') }}</label>
            <div class="ios-select-wrap">
              <select v-model="date" class="ios-input">
                <option v-for="d in dateOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </div>
          </div>
          <div class="flex items-end">
            <button
              type="button"
              class="sz-nearby-toggle w-full"
              :class="nearMe ? 'sz-nearby-toggle-on' : 'sz-nearby-toggle-off'"
              @click="nearMe = !nearMe"
            >
              <SzIcon name="location" size="sm" />
              {{ t('hero.nearby') }}
            </button>
          </div>
          <div class="sm:col-span-2">
            <SzButton type="submit" block size="lg">
              <SzIcon name="search" size="sm" />
              {{ t('search.action') }}
            </SzButton>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
