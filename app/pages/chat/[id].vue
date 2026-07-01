<script setup lang="ts">
import type { Conversation } from '~/types'

const { t } = useI18n()
const route = useRoute()
const { user } = useUserSession()
const { localized } = useLocaleContent()

const id = computed(() => String(route.params.id))

const { data: conversation, refresh } = await useApiFetch<Conversation>(() => `/api/chat/${id.value}`)

useHead({ title: () => t('chat.thread') })

const draft = ref('')
const sending = ref(false)

useVisibilityPoll(refresh, 4000)

async function send() {
  const text = draft.value.trim()
  if (!text) return
  sending.value = true
  try {
    await $fetch(`/api/chat/${id.value}/messages`, { method: 'POST', body: { body: text } })
    draft.value = ''
    await refresh()
  } finally {
    sending.value = false
  }
}

const title = computed(() => {
  const c = conversation.value
  if (!c) return t('chat.thread')
  return localized(c.titleFa || t('chat.direct'), c.titleEn || t('chat.direct'))
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="border-b border-black/5 bg-white px-4 py-3">
      <h1 class="text-sm font-bold text-brand-gray-900">{{ title }}</h1>
    </div>

    <div class="flex-1 space-y-3 overflow-y-auto p-4">
      <div
        v-for="msg in conversation?.messages"
        :key="msg.id"
        class="flex"
        :class="msg.senderId === user?.id ? 'justify-end' : 'justify-start'"
      >
        <div :class="msg.senderId === user?.id ? 'ds-chat-bubble-out' : 'ds-chat-bubble-in'">
          <p v-if="msg.senderId !== user?.id" class="mb-0.5 text-xs font-bold opacity-70">{{ msg.sender?.name }}</p>
          {{ msg.body }}
        </div>
      </div>
    </div>

    <form class="flex gap-2 border-t border-black/5 bg-white p-3" @submit.prevent="send">
      <input v-model="draft" type="text" class="ios-input flex-1" :placeholder="t('chat.placeholder')" />
      <SzButton type="submit" size="sm" :disabled="sending">{{ t('chat.send') }}</SzButton>
    </form>
  </div>
</template>
