<script setup lang="ts">
import type { SkillLevel } from '~/composables/useSkillLevel'

export type PendingSkillRating = {
  ratedUserId: string
  name: string
  nameEn: string | null
  classSessionId?: string
  coachSessionId?: string
  contextFa: string
  contextEn: string
  date: string
  source: 'COACH' | 'PEER'
}

const { t } = useI18n()
const { pickName, formatDate } = useLocaleContent()
const { levels, levelLabel } = useSkillLevel()
const toast = useToast()

const { data: pending, refresh, pending: loading } = await useApiFetch<PendingSkillRating[]>('/api/skill-ratings/pending', {
  lazy: true,
  server: false,
})

const submitting = ref<string | null>(null)
const draftLevels = ref<Record<string, SkillLevel>>({})

function rowKey(item: PendingSkillRating) {
  return `${item.ratedUserId}-${item.classSessionId ?? item.coachSessionId}`
}

async function submitRating(item: PendingSkillRating) {
  const key = rowKey(item)
  const level = draftLevels.value[key]
  if (!level) return

  submitting.value = key
  try {
    await $fetch('/api/skill-ratings', {
      method: 'POST',
      body: {
        ratedUserId: item.ratedUserId,
        level,
        classSessionId: item.classSessionId,
        coachSessionId: item.coachSessionId,
      },
    })
    toast.success(t('skillRating.submitted'))
    await refresh()
  } catch (e: unknown) {
    toast.error((e as { statusMessage?: string })?.statusMessage ?? t('skillRating.error'))
  } finally {
    submitting.value = null
  }
}
</script>

<template>
  <section v-if="pending?.length" class="ios-card p-4 sm:p-5">
    <h2 class="ios-title-3">{{ t('skillRating.pendingTitle') }}</h2>
    <p class="mt-1 text-sm text-brand-gray-600">{{ t('skillRating.pendingHint') }}</p>

    <ul class="mt-4 space-y-3">
      <li
        v-for="item in pending"
        :key="rowKey(item)"
        class="rounded-xl border border-brand-gray-100 p-3 sm:p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-bold">{{ pickName({ nameFa: item.name, nameEn: item.nameEn ?? item.name }) }}</p>
            <p class="text-sm text-brand-gray-600">{{ pickName({ nameFa: item.contextFa, nameEn: item.contextEn }) }}</p>
            <p class="text-xs text-brand-gray-500">{{ formatDate(item.date) }}</p>
          </div>
          <span class="sz-chip bg-brand-gray-100 text-xs">
            {{ item.source === 'COACH' ? t('skillRating.coachRate') : t('skillRating.peerRate') }}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="l in levels"
            :key="l"
            type="button"
            class="sz-chip tap-highlight"
            :class="draftLevels[rowKey(item)] === l ? 'bg-brand-orange text-white' : 'bg-white shadow-card'"
            @click="draftLevels[rowKey(item)] = l"
          >
            {{ levelLabel(l) }}
          </button>
        </div>

        <SzButton
          class="mt-3"
          size="sm"
          :disabled="!draftLevels[rowKey(item)] || submitting === rowKey(item)"
          @click="submitRating(item)"
        >
          {{ t('skillRating.submit') }}
        </SzButton>
      </li>
    </ul>
  </section>
</template>
