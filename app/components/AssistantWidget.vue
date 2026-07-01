<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const open = ref(false)
const input = ref('')
const pending = ref(false)
const messages = ref<Array<{ role: 'user' | 'bot'; text: string; link?: string }>>([
  { role: 'bot', text: '' },
])

onMounted(() => {
  messages.value[0]!.text = t('assistant.greeting')
})

async function send(text?: string) {
  const msg = (text ?? input.value).trim()
  if (!msg || pending.value) return
  messages.value.push({ role: 'user', text: msg })
  input.value = ''
  pending.value = true
  try {
    const res = await $fetch<{ reply: string; link?: string; suggestions?: string[] }>('/api/assistant/chat', {
      method: 'POST',
      body: { message: msg, locale: locale.value },
    })
    messages.value.push({ role: 'bot', text: res.reply, link: res.link })
    if (res.suggestions?.length) {
      suggestions.value = res.suggestions
    }
  } catch {
    messages.value.push({ role: 'bot', text: t('assistant.error') })
  } finally {
    pending.value = false
  }
}

const suggestions = ref<string[]>([])

watch(locale, () => {
  if (messages.value.length === 1) messages.value[0]!.text = t('assistant.greeting')
})
</script>

<template>
  <div class="fixed z-40 ltr:right-5 rtl:left-5 bottom-28 md:bottom-8">
    <div v-if="open" class="mb-3 w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card">
      <div class="flex items-center justify-between border-b border-black/5 bg-brand-orange/10 px-4 py-3">
        <span class="font-semibold text-brand-orange">{{ t('assistant.title') }}</span>
        <button type="button" class="text-brand-gray-500" @click="open = false">
          <SzIcon name="close" size="sm" />
        </button>
      </div>
      <div class="max-h-64 space-y-3 overflow-y-auto p-4">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="text-sm"
          :class="m.role === 'user' ? 'text-end font-medium text-brand-orange' : 'text-brand-gray-700'"
        >
          {{ m.text }}
          <NuxtLink v-if="m.link" :to="localePath(m.link)" class="mt-1 block text-brand-orange underline" @click="open = false">
            {{ t('assistant.go') }}
          </NuxtLink>
        </div>
        <p v-if="pending" class="ios-footnote">{{ t('common.loading') }}</p>
      </div>
      <div v-if="suggestions.length" class="flex flex-wrap gap-1 border-t border-black/5 px-3 py-2">
        <button
          v-for="s in suggestions"
          :key="s"
          type="button"
          class="rounded-full bg-brand-gray-50 px-2.5 py-1 text-xs text-brand-gray-700"
          @click="send(s)"
        >
          {{ s }}
        </button>
      </div>
      <form class="flex gap-2 border-t border-black/5 p-3" @submit.prevent="send()">
        <input v-model="input" type="text" class="ios-input min-w-0 flex-1 py-2 text-sm" :placeholder="t('assistant.placeholder')" />
        <SzButton type="submit" size="sm" class="shrink-0" :disabled="pending">{{ t('assistant.send') }}</SzButton>
      </form>
    </div>
    <button
      type="button"
      class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-white shadow-card tap-highlight"
      :aria-label="t('assistant.title')"
      @click="open = !open"
    >
      <SzIcon name="chat" size="lg" />
    </button>
  </div>
</template>
