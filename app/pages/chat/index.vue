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
    <SzPageHeader :title="t('chat.title')" />
    <div v-if="conversations?.length" class="space-y-2">
      <SzCard
        v-for="c in conversations"
        :key="c.id"
        :to="localePath(`/chat/${c.id}`)"
        class="flex items-center justify-between gap-3 p-4"
      >
        <div class="min-w-0">
          <p class="font-bold">{{ title(c) }}</p>
          <p v-if="c.lastMessage" class="truncate text-sm text-brand-gray-500">{{ c.lastMessage.body }}</p>
        </div>
        <SzBadge v-if="c.isGroup" tone="orange">#</SzBadge>
      </SzCard>
    </div>
    <SzEmptyState v-else :message="t('chat.empty')" />
  </div>
</template>
