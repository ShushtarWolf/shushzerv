<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    to?: string
    accent?: string
    interactive?: boolean
    themed?: boolean
  }>(),
  { interactive: true, themed: false },
)

const { cardVars, BRAND_PRIMARY } = useSportTheme()

const resolvedAccent = computed(() => {
  if (props.accent) return props.accent
  if (props.themed) return BRAND_PRIMARY
  return undefined
})

const cardStyle = computed(() => {
  const color = resolvedAccent.value
  if (!color) return undefined
  return cardVars(color)
})

const cardClass = computed(() => [
  'group sz-card relative block overflow-hidden rounded-2xl border-0 bg-white shadow-card transition-all duration-300 ease-out',
  props.interactive ? 'sz-card-interactive' : '',
  resolvedAccent.value ? 'sz-card-sport' : '',
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="cardClass" :style="cardStyle">
    <slot />
  </NuxtLink>
  <div v-else :class="cardClass" :style="cardStyle">
    <slot />
  </div>
</template>
