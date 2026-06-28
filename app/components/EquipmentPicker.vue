<script setup lang="ts">
import type { EquipmentPickerItem } from '~/composables/useEquipmentBooking'
import { equipmentItemMode, equipmentMaxQty, equipmentRequiresSelection, equipmentHasSelection } from '~/composables/useEquipmentBooking'

const props = defineProps<{
  items: EquipmentPickerItem[]
  modelValue: Record<string, number>
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [Record<string, number>] }>()

const { t } = useI18n()
const { localized, formatPrice } = useLocaleContent()

function qtyFor(id: string) {
  return props.modelValue[id] ?? 0
}

function setQty(id: string, qty: number) {
  const next = { ...props.modelValue }
  if (qty <= 0) delete next[id]
  else next[id] = qty
  emit('update:modelValue', next)
}

function priceHint(item: EquipmentPickerItem) {
  if (equipmentItemMode(item) === 'PROVIDED') return t('equipment.provided')
  return `${formatPrice(item.price)} ${t('equipment.perSession')}`
}

function stockHint(item: EquipmentPickerItem) {
  if (item.available === 0) return t('equipment.outOfStock')
  if (item.available != null) return t('equipment.leftInStock', { n: item.available })
  if (item.stock != null) return t('equipment.stockCount', { n: item.stock })
  return ''
}

const showRequired = computed(() => props.required ?? equipmentRequiresSelection(props.items))
const missingSelection = computed(
  () => showRequired.value && !equipmentHasSelection(props.modelValue),
)
</script>

<template>
  <div v-if="items.length" class="mt-3 space-y-2 rounded-xl border border-brand-gray-200 bg-brand-gray-50/80 p-3" :class="missingSelection ? 'border-brand-pink/40' : ''">
    <p class="text-xs font-bold uppercase tracking-wide text-brand-gray-600">
      {{ t('equipment.selectGear') }}
      <span v-if="showRequired" class="text-brand-pink">*</span>
    </p>
    <p v-if="showRequired" class="text-[11px] text-brand-gray-500">{{ t('equipment.selectGearHint') }}</p>
    <p v-if="missingSelection" class="text-[11px] font-semibold text-brand-pink">{{ t('equipment.selectGearRequired') }}</p>
    <div
      v-for="item in items"
      :key="item.id"
      class="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
    >
      <div class="min-w-0">
        <p class="text-sm font-semibold text-brand-gray-900">{{ localized(item.nameFa, item.nameEn) }}</p>
        <p class="text-xs text-brand-gray-500">{{ priceHint(item) }}</p>
        <p v-if="stockHint(item)" class="text-[11px] text-brand-gray-400">{{ stockHint(item) }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <label class="sr-only" :for="`eq-qty-${item.id}`">{{ t('equipment.quantity') }}</label>
        <select
          :id="`eq-qty-${item.id}`"
          class="ios-input !w-16 !py-1 text-sm"
          :value="qtyFor(item.id)"
          :disabled="equipmentMaxQty(item) === 0"
          @change="setQty(item.id, Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="n in equipmentMaxQty(item) + 1" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>
  </div>
</template>
