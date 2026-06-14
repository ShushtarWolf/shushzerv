<script setup lang="ts">
import type { Conversation } from '~/types'

definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { localized } = useLocaleContent()

useHead({ title: () => t('chat.title') })

const { data: conversations, refresh } = await useApiFetch<Conversation[]>('/api/chat')

onMounted(() => {
  const timer = setInterval(() => refresh(), 8000)
  onUnmounted(() => clearInterval(timer))
})

function title(c: Conversation) {
  return localized(c.titleFa || t('chat.direct'), c.titleEn || t('chat.direct'))
}
</script>

<template>
  <div class="page-enter mx-auto max-w-2xl px-4 py-8 sm:px-6">
    <h1 class="sz-headline mb-6">{{ t('chat.title') }}</h1>
    <div v-if="conversations?.length" class="space-y-2">
      <NuxtLink
        v-for="c in conversations"
        :key="c.id"
        :to="localePath(`/chat/${c.id}`)"
        class="ios-card flex items-center justify-between gap-3 p-4 tap-highlight"
      >
        <div class="min-w-0">
          <p class="font-bold">{{ title(c) }}</p>
          <p v-if="c.lastMessage" class="truncate text-sm text-brand-gray-500">{{ c.lastMessage.body }}</p>
        </div>
        <span v-if="c.isGroup" class="sz-chip bg-brand-orange/12 text-brand-orange text-xs">#</span>
      </NuxtLink>
    </div>
    <p v-else class="ios-footnote">{{ t('chat.empty') }}</p>
  </div>
</template>
