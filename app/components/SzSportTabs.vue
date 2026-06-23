<script setup lang="ts">
import type { Sport } from '~/types'

const props = withDefaults(
  defineProps<{
    sports: Sport[]
    modelValue?: string
    fade?: boolean
    showAll?: boolean
    allLabel?: string
    variant?: 'default' | 'hero'
  }>(),
  { showAll: false, variant: 'default' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const { t } = useI18n()
const { pickName } = useLocaleContent()

const isHero = computed(() => props.variant === 'hero')

function select(slug: string) {
  emit('update:modelValue', slug === props.modelValue ? '' : slug)
}

function tabClass(active: boolean) {
  if (isHero.value) {
    return active
      ? 'bg-brand-orange-dark !text-brand-gray-600 shadow-card ring-2 ring-white/30'
      : 'bg-brand-orange !text-white shadow-card hover:bg-brand-orange-dark/90'
  }
  return active
    ? 'bg-brand-primary text-white shadow-sm'
    : 'bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200'
}

function tabBaseClass() {
  return isHero.value
    ? 'rounded-xl px-5 py-2.5 text-sm font-semibold'
    : 'rounded-xl px-3.5 py-2 text-sm font-semibold'
}
</script>

<template>
  <div
    class="relative"
    :class="{
      'sz-sport-tabs-fade': fade && !isHero,
      'sz-sport-tabs-fade-hero': fade && isHero,
    }"
  >
    <div class="flex flex-nowrap gap-2 overflow-x-auto pb-1 sz-scroll-x">
      <button
        v-if="showAll"
        type="button"
        class="tap-highlight inline-flex shrink-0 items-center gap-2 transition-colors duration-200"
        :class="[tabBaseClass(), tabClass(!modelValue)]"
        @click="select('')"
      >
        {{ allLabel ?? t('clubs.all') }}
      </button>
      <button
        v-for="sport in sports"
        :key="sport.id"
        type="button"
        class="tap-highlight inline-flex shrink-0 items-center gap-2 transition-colors duration-200"
        :class="[tabBaseClass(), tabClass(modelValue === sport.slug)]"
        @click="select(sport.slug)"
      >
        <SportIcon :slug="sport.slug" size="sm" />
        {{ pickName(sport) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.sz-scroll-x::-webkit-scrollbar {
  display: none;
}
.sz-scroll-x {
  scrollbar-width: none;
}

/* Edge fade via overlay — avoids masking button content */
.sz-sport-tabs-fade::before,
.sz-sport-tabs-fade::after,
.sz-sport-tabs-fade-hero::before,
.sz-sport-tabs-fade-hero::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1.25rem;
  pointer-events: none;
  z-index: 1;
}

.sz-sport-tabs-fade::before {
  inset-inline-start: 0;
  background: linear-gradient(to right, #f9fafb, transparent);
}

.sz-sport-tabs-fade::after {
  inset-inline-end: 0;
  background: linear-gradient(to left, #f9fafb, transparent);
}

.sz-sport-tabs-fade-hero::before {
  inset-inline-start: 0;
  background: linear-gradient(to right, #1e3a5f, transparent);
}

.sz-sport-tabs-fade-hero::after {
  inset-inline-end: 0;
  background: linear-gradient(to left, #1e3a5f, transparent);
}

[dir='rtl'] .sz-sport-tabs-fade::before,
[dir='rtl'] .sz-sport-tabs-fade-hero::before {
  background: linear-gradient(to left, #f9fafb, transparent);
}

[dir='rtl'] .sz-sport-tabs-fade-hero::before {
  background: linear-gradient(to left, #1e3a5f, transparent);
}

[dir='rtl'] .sz-sport-tabs-fade::after,
[dir='rtl'] .sz-sport-tabs-fade-hero::after {
  background: linear-gradient(to right, #f9fafb, transparent);
}

[dir='rtl'] .sz-sport-tabs-fade-hero::after {
  background: linear-gradient(to right, #1e3a5f, transparent);
}
</style>
