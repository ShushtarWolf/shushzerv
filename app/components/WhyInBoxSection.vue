<script setup lang="ts">
const { t, tm, rt } = useI18n()

const userItems = computed(() => (tm('why.user.items') as unknown[]).map(i => rt(i as any)))
const coachItems = computed(() => (tm('why.coach.items') as unknown[]).map(i => rt(i as any)))
</script>

<template>
  <section>
    <h2 class="ios-title-2 mb-4">{{ t('why.title') }}</h2>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="glass-panel p-6">
        <h3 class="ios-title-3 mb-3">{{ t('why.user.title') }}</h3>
        <ul class="space-y-2">
          <li v-for="(item, i) in userItems" :key="i" class="flex items-center gap-2 text-sm text-sz-gray-700">
            <span class="text-sz-green">✓</span> {{ item }}
          </li>
        </ul>
      </div>
      <div class="glass-panel p-6">
        <h3 class="ios-title-3 mb-3">{{ t('why.coach.title') }}</h3>
        <ul class="space-y-2">
          <li v-for="(item, i) in coachItems" :key="i" class="flex items-center gap-2 text-sm text-sz-gray-700">
            <span class="text-sz-blue">✓</span> {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
