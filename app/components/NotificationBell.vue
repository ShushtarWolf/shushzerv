<script setup lang="ts">
import type { Notification } from '~/types'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { loggedIn } = useUserSession()
const { localized } = useLocaleContent()

const open = ref(false)

const { data: notifications, refresh } = await useApiFetch<Notification[]>('/api/notifications', {
  immediate: false,
  server: false,
})

watch(loggedIn, (v) => {
  if (v) refresh()
}, { immediate: true })

const unreadCount = computed(() => (notifications.value ?? []).filter((n) => !n.readAt).length)

async function markRead(id: string) {
  await $fetch(`/api/notifications/${id}`, { method: 'PATCH' })
  await refresh()
}

function openNotification(n: Notification) {
  markRead(n.id)
  if (n.link) navigateTo(localePath(n.link))
  open.value = false
}
</script>

<template>
  <div v-if="loggedIn" class="relative">
    <button
      type="button"
      class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-fd-soft tap-highlight"
      :aria-label="t('notifications.title')"
      @click="open = !open"
    >
      <SzIcon name="bell" />
      <span v-if="unreadCount" class="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fd-danger px-1 text-[10px] font-bold text-white">
        {{ unreadCount }}
      </span>
    </button>
    <div v-if="open" class="absolute end-0 top-full z-50 mt-2 w-72 rounded-xl border border-fd-primary/10 bg-white p-2 shadow-fd">
      <p class="px-2 py-1 text-xs font-bold uppercase text-fd-muted">{{ t('notifications.title') }}</p>
      <button
        v-for="n in notifications"
        :key="n.id"
        type="button"
        class="block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-[#F5F5F4]"
        :class="!n.readAt ? 'font-semibold' : 'text-fd-muted'"
        @click="openNotification(n)"
      >
        {{ locale === 'fa' ? n.titleFa : n.titleEn }}
      </button>
      <p v-if="!notifications?.length" class="px-3 py-4 text-sm text-fd-muted">{{ t('notifications.empty') }}</p>
    </div>
  </div>
</template>
