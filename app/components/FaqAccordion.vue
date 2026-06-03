<script setup lang="ts">
const { tm, rt } = useI18n()
const open = ref<number | null>(0)

interface FaqItem { q: string; a: string }
const items = computed(() => (tm('faq.items') as unknown[]).map((it) => ({
  q: rt((it as FaqItem).q),
  a: rt((it as FaqItem).a),
})))

function toggle(i: number) {
  open.value = open.value === i ? null : i
}
</script>

<template>
  <div class="space-y-3">
    <div v-for="(item, i) in items" :key="i" class="ios-card overflow-hidden">
      <button class="flex w-full items-center justify-between gap-4 p-4 text-start" @click="toggle(i)">
        <span class="font-semibold text-brand-gray-900">{{ item.q }}</span>
        <span class="text-brand-gray-400 transition-transform" :class="{ 'rotate-45': open === i }">+</span>
      </button>
      <p v-show="open === i" class="px-4 pb-4 text-sm text-brand-gray-600">{{ item.a }}</p>
    </div>
  </div>
</template>
