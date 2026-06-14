<script setup lang="ts">
import type { Conversation } from '~/types'

definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { user } = useUserSession()
const { localized } = useLocaleContent()

const id = computed(() => String(route.params.id))

const { data: conversation, refresh } = await useApiFetch<Conversation>(() => `/api/chat/${id.value}`)

useHead({ title: () => t('chat.thread') })

const draft = ref('')
const sending = ref(false)

onMounted(() => {
  const timer = setInterval(() => refresh(), 4000)
  onUnmounted(() => clearInterval(timer))
})

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
  <div class="page-enter mx-auto flex max-w-2xl flex-col px-4 py-6 sm:px-6" style="min-height: calc(100dvh - 12rem)">
    <BackLink :to="localePath('/chat')" />
    <h1 class="ios-title-2 mb-4">{{ title }}</h1>

    <div class="flex-1 space-y-3 overflow-y-auto pb-4">
      <div
        v-for="msg in conversation?.messages"
        :key="msg.id"
        class="flex"
        :class="msg.senderId === user?.id ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
          :class="msg.senderId === user?.id ? 'bg-brand-orange text-white rounded-ee-sm' : 'bg-white shadow-card rounded-es-sm'"
        >
          <p v-if="msg.senderId !== user?.id" class="mb-0.5 text-xs font-bold opacity-70">{{ msg.sender?.name }}</p>
          {{ msg.body }}
        </div>
      </div>
    </div>

    <form class="glass-panel flex gap-2 p-3" @submit.prevent="send">
      <input v-model="draft" type="text" class="ios-input flex-1" :placeholder="t('chat.placeholder')" />
      <SzButton type="submit" size="sm" :disabled="sending">{{ t('chat.send') }}</SzButton>
    </form>
  </div>
</template>
