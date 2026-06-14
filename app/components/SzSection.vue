<script setup lang="ts">
defineProps<{
  title?: string
  eyebrow?: string
  subtitle?: string
  to?: string
  linkText?: string
}>()

const { locale } = useI18n()
const isRtl = computed(() => locale.value === 'fa')
</script>

<template>
  <section>
    <div class="mb-4 flex flex-wrap items-end gap-x-3 gap-y-2">
      <div class="min-w-0 space-y-1">
        <p v-if="eyebrow" class="sz-eyebrow">{{ eyebrow }}</p>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 v-if="title" class="sz-headline">{{ title }}</h2>
          <NuxtLink
            v-if="to && linkText"
            :to="to"
            class="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark"
          >
            {{ linkText }}
            <SzIcon :name="isRtl ? 'chevron-start' : 'chevron-end'" size="sm" />
          </NuxtLink>
        </div>
        <p v-if="subtitle" class="text-sm text-brand-gray-600">{{ subtitle }}</p>
      </div>
    </div>
    <slot />
  </section>
</template>
