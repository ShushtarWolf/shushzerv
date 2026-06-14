<script setup lang="ts">
const { t } = useI18n()
const { color: sportColor } = useSelectedSportColor()
const { DEFAULT_SPORT_COLOR } = useSportTheme()

const accent = computed(() => sportColor.value ?? DEFAULT_SPORT_COLOR)

const items = [
  { icon: 'star' as const, value: 4.8, suffix: '/5', labelKey: 'trust.rating', decimals: 1 },
  { icon: 'users' as const, value: 10000, prefix: '+', labelKey: 'trust.players' },
  { icon: 'building' as const, value: 50, prefix: '+', labelKey: 'trust.clubs' },
  { icon: 'bolt' as const, value: 0, labelKey: 'trust.realtime', text: true },
]
</script>

<template>
  <div
    class="overflow-hidden rounded-ios-xl p-4 text-white shadow-card transition-colors duration-300"
    :style="{ backgroundColor: accent }"
  >
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/15 px-2 py-3 text-center"
      >
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
          <SzIcon :name="item.icon" />
        </span>
        <SzStatCounter
          v-if="!item.text"
          :value="item.value"
          :prefix="item.prefix || ''"
          :suffix="item.suffix || ''"
          :decimals="item.decimals || 0"
          class="!text-white"
        />
        <span v-else class="sz-stat text-white">{{ t('trust.realtimeValue') }}</span>
        <span class="text-xs font-medium text-white/85">{{ t(item.labelKey) }}</span>
      </div>
    </div>
  </div>
</template>
