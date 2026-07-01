<script setup lang="ts">
import type { Conversation } from '~/types'

definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { localized } = useLocaleContent()

useHead({ title: () => t('chat.title') })

const { data: conversations, refresh } = await useApiFetch<Conversation[]>('/api/chat')

useVisibilityPoll(refresh, 8000)

function title(c: Conversation) {
  return localized(c.titleFa || t('chat.direct'), c.titleEn || t('chat.direct'))
}

const activeId = computed(() => {
  const id = route.params.id
  return id ? String(id) : ''
})
</script>

<template>
  <div class="page-enter mx-auto max-w-5xl px-4 py-6 sm:px-6">
    <SzPageHeader :title="t('chat.title')" class="mb-4" />

    <div class="ds-chat-shell">
      <aside class="ds-chat-sidebar">
        <div class="border-b border-black/5 px-4 py-3">
          <p class="text-sm font-bold text-brand-gray-900">{{ t('chat.title') }}</p>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <NuxtLink
            v-for="c in conversations"
            :key="c.id"
            :to="localePath(`/chat/${c.id}`)"
            class="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition tap-highlight hover:bg-brand-gray-50"
            :class="activeId === c.id ? 'bg-brand-primary/10 ring-1 ring-brand-primary/15' : ''"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-sm font-bold text-brand-primary">
              {{ title(c).charAt(0) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-brand-gray-900">{{ title(c) }}</p>
              <p v-if="c.lastMessage" class="truncate text-xs text-brand-gray-500">{{ c.lastMessage.body }}</p>
            </div>
            <SzBadge v-if="c.isGroup" tone="orange" class="!text-[0.6rem]">#</SzBadge>
          </NuxtLink>
          <p v-if="!conversations?.length" class="px-3 py-6 text-center text-sm text-brand-gray-500">{{ t('chat.empty') }}</p>
        </div>
      </aside>

      <div class="ds-chat-thread">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>
