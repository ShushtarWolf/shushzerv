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

const { cardVars, DEFAULT_SPORT_COLOR } = useSportTheme()
const { color: selectedColor } = useSelectedSportColor()

const resolvedAccent = computed(() => {
  if (props.accent) return props.accent
  if (props.themed) return selectedColor.value ?? DEFAULT_SPORT_COLOR
  return undefined
})

const cardStyle = computed(() => {
  const color = resolvedAccent.value
  if (!color) return undefined
  return cardVars(color)
})
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'div'"
    :to="to"
    class="group sz-card relative block overflow-hidden rounded-ios-lg bg-white shadow-card transition-all duration-300 ease-out"
    :class="[
      interactive ? 'sz-card-interactive' : '',
      resolvedAccent ? 'sz-card-sport' : '',
    ]"
    :style="cardStyle"
  >
    <span
      v-if="resolvedAccent"
      class="sz-card-accent absolute inset-x-0 top-0 h-1.5 transition-all duration-300 group-hover:h-2.5"
      :style="{ backgroundColor: resolvedAccent }"
    />
    <slot />
  </component>
</template>
