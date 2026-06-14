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

const { cardVars } = useSportTheme()

const cardStyle = computed(() => {
  if (!props.accent) return undefined
  return cardVars(props.accent)
})
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'div'"
    :to="to"
    class="group sz-card relative block overflow-hidden rounded-ios-lg bg-white shadow-card transition-all duration-300 ease-out"
    :class="[
      interactive ? 'sz-card-interactive' : '',
      accent ? 'sz-card-sport' : '',
    ]"
    :style="cardStyle"
  >
    <span
      v-if="accent"
      class="sz-card-accent absolute inset-x-0 top-0 h-1.5 transition-all duration-300 group-hover:h-2.5"
      :style="{ backgroundColor: accent }"
    />
    <slot />
  </component>
</template>
