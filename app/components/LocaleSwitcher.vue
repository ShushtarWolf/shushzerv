<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const available = computed(() => locales.value as Array<{ code: string; name: string }>)
</script>

<template>
  <div class="ios-segment">
    <NuxtLink
      v-for="l in available"
      :key="l.code"
      :to="switchLocalePath(l.code)"
      class="ios-segment-item"
      :class="{ 'ios-segment-item-active': locale === l.code }"
      @click="setLocale(l.code as any)"
    >
      {{ l.code === 'fa' ? 'فا' : 'EN' }}
    </NuxtLink>
  </div>
</template>
