<script setup lang="ts">
import type { CoachEquipment, CourtAddon, EquipmentMode } from '~/types'

type Item = Pick<CourtAddon | CoachEquipment, 'id' | 'nameFa' | 'nameEn' | 'price' | 'mode'> & {
  court?: { nameFa: string; nameEn: string } | null
}

const props = defineProps<{
  items: Item[]
  hint?: string
}>()

const { t } = useI18n()
const { localized, pickName, formatPrice } = useLocaleContent()

function itemMode(item: Item): EquipmentMode {
  if (item.mode) return item.mode
  return item.price > 0 ? 'RENTAL' : 'PROVIDED'
}

function priceLabel(item: Item) {
  if (itemMode(item) === 'PROVIDED') return t('equipment.provided')
  if (item.price <= 0) return t('equipment.free')
  return `${formatPrice(item.price)} ${t('equipment.perSession')}`
}
</script>

<template>
  <section v-if="items.length" class="mb-8">
    <h2 class="ios-title-3 mb-1">{{ t('equipment.title') }}</h2>
    <p class="mb-4 text-sm text-brand-gray-600">{{ hint ?? t('equipment.hint') }}</p>
    <div class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="item in items"
        :key="item.id"
        class="glass-panel flex items-start justify-between gap-3 p-4"
      >
        <div class="min-w-0">
          <p class="font-bold text-brand-gray-900">{{ localized(item.nameFa, item.nameEn) }}</p>
          <p v-if="item.court" class="mt-0.5 text-xs text-brand-gray-500">{{ pickName(item.court) }}</p>
        </div>
        <div class="shrink-0 text-end">
          <SzBadge :tone="itemMode(item) === 'PROVIDED' ? 'green' : 'blue'" class="!text-xs">
            {{ priceLabel(item) }}
          </SzBadge>
          <p class="mt-1 text-[11px] text-brand-gray-500">
            {{ itemMode(item) === 'PROVIDED' ? t('equipment.modeProvided') : t('equipment.modeRental') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
