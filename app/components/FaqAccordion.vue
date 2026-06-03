<script setup lang="ts">
const { t, tm, rt } = useI18n()

const items = computed(() =>
  (tm('faq.items') as Array<{ q: unknown; a: unknown }>).map(i => ({ q: rt(i.q as any), a: rt(i.a as any) })),
)
const open = ref<number | null>(0)
function toggle(i: number) {
  open.value = open.value === i ? null : i
}
</script>

<template>
  <section>
    <h2 class="ios-title-2 mb-4">{{ t('faq.title') }}</h2>
    <div class="space-y-2">
      <div v-for="(item, i) in items" :key="i" class="ios-card overflow-hidden">
        <button class="flex w-full items-center justify-between gap-4 p-4 text-start" @click="toggle(i)">
          <span class="font-medium text-sz-gray-900">{{ item.q }}</span>
          <span class="text-sz-gray-400 transition-transform" :class="{ 'rotate-45': open === i }">+</span>
        </button>
        <p v-if="open === i" class="px-4 pb-4 text-sm text-sz-gray-600">{{ item.a }}</p>
      </div>
    </div>
  </section>
</template>
