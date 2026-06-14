<script setup lang="ts">
import type { WalletTransaction } from '~/types'

const props = defineProps<{
  kind: 'user' | 'club'
  canTopUp?: boolean
  canPayout?: boolean
  clubId?: string
}>()

const { t } = useI18n()
const { localized, formatPrice } = useLocaleContent()

const { data: wallet, refresh } = await useApiFetch<{
  kind: 'user' | 'club'
  balance?: number
  totalBalance?: number
  transactions?: WalletTransaction[]
  clubWallets?: Array<{
    clubId: string
    clubNameFa: string
    clubNameEn: string
    balance: number
    transactions: WalletTransaction[]
  }>
}>('/api/wallet')

const topUpAmount = ref(500_000)
const payoutAmount = ref(500_000)
const selectedClubId = ref('')
const message = ref('')
const error = ref('')
const pending = ref(false)

watch(
  () => wallet.value?.clubWallets,
  (list) => {
    if (list?.length && !selectedClubId.value) selectedClubId.value = list[0].clubId
  },
  { immediate: true },
)

const displayBalance = computed(() => {
  if (props.kind === 'club') return wallet.value?.totalBalance ?? 0
  return wallet.value?.balance ?? 0
})

const transactions = computed(() => {
  if (props.kind === 'club' && wallet.value?.clubWallets?.length) {
    const cw = wallet.value.clubWallets.find((c) => c.clubId === selectedClubId.value)
    return cw?.transactions ?? wallet.value.clubWallets[0]?.transactions ?? []
  }
  return wallet.value?.transactions ?? []
})

function txLabel(type: WalletTransaction['type']) {
  return t(`wallet.types.${type}`, type)
}

async function topUp() {
  error.value = ''
  message.value = ''
  pending.value = true
  try {
    await $fetch('/api/wallet/topup', { method: 'POST', body: { amount: topUpAmount.value } })
    message.value = t('wallet.topUpSuccess')
    await refresh()
  } catch {
    error.value = t('wallet.topUpError')
  } finally {
    pending.value = false
  }
}

async function payout() {
  if (!selectedClubId.value) return
  error.value = ''
  message.value = ''
  pending.value = true
  try {
    await $fetch('/api/wallet/payout', {
      method: 'POST',
      body: { clubId: selectedClubId.value, amount: payoutAmount.value },
    })
    message.value = t('wallet.payoutSuccess')
    await refresh()
  } catch {
    error.value = t('wallet.payoutError')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section>
    <div class="ios-card mb-6 overflow-hidden">
      <div class="bg-gradient-to-br from-brand-orange to-brand-yellow p-6 text-white">
        <p class="text-sm font-semibold text-white/80">{{ t('wallet.title') }}</p>
        <p class="mt-1 text-3xl font-black">{{ formatPrice(displayBalance) }}</p>
        <p class="text-sm text-white/80">{{ t('clubs.currency') }}</p>
      </div>
    </div>

    <p v-if="message" class="mb-3 text-sm text-brand-green">{{ message }}</p>
    <p v-if="error" class="mb-3 text-sm text-brand-pink">{{ error }}</p>

    <div v-if="kind === 'club' && wallet?.clubWallets?.length" class="mb-4">
      <label class="ios-footnote mb-2 block">{{ t('search.club') }}</label>
      <select v-model="selectedClubId" class="ios-input max-w-md">
        <option v-for="c in wallet.clubWallets" :key="c.clubId" :value="c.clubId">
          {{ localized(c.clubNameFa, c.clubNameEn) }} — {{ formatPrice(c.balance) }}
        </option>
      </select>
    </div>

    <div v-if="canTopUp" class="glass-panel mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
      <input v-model.number="topUpAmount" type="number" step="50000" min="10000" class="ios-input" :placeholder="t('wallet.topUpAmount')" />
      <button type="button" class="ios-btn-primary" :disabled="pending" @click="topUp">{{ t('wallet.topUp') }}</button>
      <p class="ios-footnote sm:col-span-2">{{ t('wallet.topUpHint') }}</p>
    </div>

    <div v-if="canPayout" class="glass-panel mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
      <input v-model.number="payoutAmount" type="number" step="50000" min="10000" class="ios-input" :placeholder="t('wallet.payoutAmount')" />
      <button type="button" class="ios-btn-primary" :disabled="pending" @click="payout">{{ t('wallet.payout') }}</button>
      <p class="ios-footnote sm:col-span-2">{{ t('wallet.payoutHint') }}</p>
    </div>

    <h3 class="ios-title-3 mb-3">{{ t('wallet.transactions') }}</h3>
    <div v-if="transactions.length" class="space-y-2">
      <div v-for="tx in transactions" :key="tx.id" class="ios-card flex items-center justify-between gap-3 p-4">
        <div class="min-w-0">
          <p class="font-semibold">{{ localized(tx.noteFa, tx.noteEn) || txLabel(tx.type) }}</p>
          <p class="ios-footnote">{{ new Date(tx.createdAt).toLocaleDateString() }}</p>
        </div>
        <p class="shrink-0 font-bold" :class="tx.amount >= 0 ? 'text-brand-green' : 'text-brand-pink'">
          {{ tx.amount >= 0 ? '+' : '' }}{{ formatPrice(tx.amount) }}
        </p>
      </div>
    </div>
    <p v-else class="ios-footnote">{{ t('wallet.noTransactions') }}</p>
  </section>
</template>
