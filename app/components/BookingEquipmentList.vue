<script setup lang="ts">
import type { ReservedEquipmentLine } from '~/types'

defineProps<{ lines: ReservedEquipmentLine[] }>()

const { t } = useI18n()
const { localized, formatPrice } = useLocaleContent()
</script>

<template>
  <ul v-if="lines.length" class="mt-2 space-y-1 text-sm text-brand-gray-600">
    <li v-for="line in lines" :key="line.id" class="flex flex-wrap items-center gap-x-2">
      <span class="font-medium text-brand-gray-800">{{ localized(line.nameFa, line.nameEn) }}</span>
      <span v-if="line.quantity > 1" class="text-brand-gray-500">× {{ line.quantity }}</span>
      <SzBadge
        :tone="line.mode === 'PROVIDED' || line.price <= 0 ? 'green' : 'blue'"
        class="!text-[10px]"
      >
        {{ line.mode === 'PROVIDED' || line.price <= 0 ? t('equipment.provided') : formatPrice(line.price * line.quantity) }}
      </SzBadge>
    </li>
  </ul>
</template>
