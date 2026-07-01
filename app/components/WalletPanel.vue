<script setup lang="ts">
import type { WalletTransaction } from '~/types'

const props = defineProps<{
  kind: 'user' | 'club'
  canTopUp?: boolean
  canPayout?: boolean
  clubId?: string
  variant?: 'default' | 'fd'
}>()

const { t } = useI18n()
const { localized, formatPrice } = useLocaleContent()

const isFd = computed(() => props.variant === 'fd')

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
}>('/api/wallet', { server: false })

const topUpAmount = ref(500_000)
const payoutAmount = ref(500_000)
const selectedClubId = ref('')
const message = ref('')
const error = ref('')
const pending = ref(false)
const txFilter = ref<'all' | 'credit' | 'debit'>('all')

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

const totalCredit = computed(() =>
  transactions.value.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0),
)

const totalDebit = computed(() =>
  Math.abs(transactions.value.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0)),
)

const filteredTransactions = computed(() => {
  if (txFilter.value === 'credit') return transactions.value.filter((tx) => tx.amount > 0)
  if (txFilter.value === 'debit') return transactions.value.filter((tx) => tx.amount < 0)
  return transactions.value
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
  if (props.kind === 'club' && !selectedClubId.value) return
  error.value = ''
  message.value = ''
  pending.value = true
  try {
    await $fetch('/api/wallet/payout', {
      method: 'POST',
      body: props.kind === 'club'
        ? { clubId: selectedClubId.value, amount: payoutAmount.value }
        : { amount: payoutAmount.value },
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
  <section class="space-y-6">
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="ds-wallet-balance">
        <div class="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-white/75">{{ t('wallet.title') }}</p>
            <p class="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{{ formatPrice(displayBalance) }}</p>
            <p class="text-sm text-white/70">{{ t('clubs.currency') }}</p>
          </div>
          <SzButton
            v-if="canTopUp"
            size="sm"
            variant="secondary"
            class="!bg-white/15 !text-white ring-1 ring-white/25 hover:!bg-white/25"
            :disabled="pending"
            @click="topUp"
          >
            {{ t('wallet.topUp') }}
          </SzButton>
        </div>
        <div class="relative z-10 mt-6 grid grid-cols-3 gap-2 border-t border-white/15 pt-5">
          <div class="ds-wallet-stat">
            <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-white/65">{{ t('wallet.totalCredit') }}</p>
            <p class="mt-1 text-lg font-bold">{{ formatPrice(totalCredit) }}</p>
          </div>
          <div class="ds-wallet-stat">
            <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-white/65">{{ t('wallet.totalDebit') }}</p>
            <p class="mt-1 text-lg font-bold">{{ formatPrice(totalDebit) }}</p>
          </div>
          <div class="ds-wallet-stat">
            <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-white/65">{{ t('wallet.totalTransactions') }}</p>
            <p class="mt-1 text-lg font-bold">{{ transactions.length }}</p>
          </div>
        </div>
      </div>

      <div :class="isFd ? 'fd-panel' : 'ios-card p-5'">
        <h3 class="mb-3 font-bold" :class="isFd ? 'fd-section-title' : 'ios-title-3'">{{ t('wallet.topUp') }}</h3>
        <p v-if="message" class="mb-3 text-sm" :class="isFd ? 'text-fd-success' : 'text-brand-green'">{{ message }}</p>
        <p v-if="error" class="mb-3 text-sm" :class="isFd ? 'text-fd-danger' : 'text-brand-pink'">{{ error }}</p>

        <div v-if="kind === 'club' && wallet?.clubWallets?.length" class="mb-4">
          <label class="mb-2 block text-sm font-semibold" :class="isFd ? 'text-fd-muted' : 'ios-footnote'">{{ t('search.club') }}</label>
          <select v-model="selectedClubId" :class="isFd ? 'fd-input max-w-md' : 'ios-input max-w-md'">
            <option v-for="c in wallet.clubWallets" :key="c.clubId" :value="c.clubId">
              {{ localized(c.clubNameFa, c.clubNameEn) }} — {{ formatPrice(c.balance) }}
            </option>
          </select>
        </div>

        <div v-if="canTopUp" class="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input v-model.number="topUpAmount" type="number" step="50000" min="10000" :class="isFd ? 'fd-input' : 'ios-input'" :placeholder="t('wallet.topUpAmount')" />
          <SzButton v-if="!isFd" :disabled="pending" @click="topUp">{{ t('wallet.topUp') }}</SzButton>
          <button v-else type="button" class="fd-btn-primary" :disabled="pending" @click="topUp">{{ t('wallet.topUp') }}</button>
          <p class="text-sm sm:col-span-2" :class="isFd ? 'text-fd-muted' : 'ios-footnote'">{{ t('wallet.topUpHint') }}</p>
        </div>

        <div v-if="canPayout" class="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input v-model.number="payoutAmount" type="number" step="50000" min="10000" :class="isFd ? 'fd-input' : 'ios-input'" :placeholder="t('wallet.payoutAmount')" />
          <SzButton v-if="!isFd" :disabled="pending" @click="payout">{{ t('wallet.payout') }}</SzButton>
          <button v-else type="button" class="fd-btn-primary" :disabled="pending" @click="payout">{{ t('wallet.payout') }}</button>
          <p class="text-sm sm:col-span-2" :class="isFd ? 'text-fd-muted' : 'ios-footnote'">{{ t('wallet.payoutHint') }}</p>
        </div>
      </div>
    </div>

    <div :class="isFd ? 'fd-card overflow-hidden' : 'ios-card overflow-hidden'">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-4 py-4 sm:px-5">
        <div>
          <h3 class="font-bold" :class="isFd ? 'fd-section-title' : 'ios-title-3'">{{ t('wallet.transactions') }}</h3>
          <p class="text-sm" :class="isFd ? 'text-fd-muted' : 'text-brand-gray-500'">{{ t('wallet.transactionsSubtitle') }}</p>
        </div>
        <div class="flex gap-1 rounded-full bg-brand-gray-100 p-1">
          <button
            v-for="f in ([['all', 'filterAll'], ['credit', 'filterCredit'], ['debit', 'filterDebit']] as const)"
            :key="f[0]"
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-bold transition tap-highlight"
            :class="txFilter === f[0] ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-gray-600'"
            @click="txFilter = f[0]"
          >
            {{ t(`wallet.${f[1]}`) }}
          </button>
        </div>
      </div>

      <div v-if="filteredTransactions.length">
        <div v-for="tx in filteredTransactions" :key="tx.id" class="ds-wallet-tx-row">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            :class="tx.amount >= 0 ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-pink/15 text-brand-pink'"
          >
            {{ tx.amount >= 0 ? '+' : '−' }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-brand-gray-900">{{ localized(tx.noteFa, tx.noteEn) || txLabel(tx.type) }}</p>
            <p class="text-xs text-brand-gray-500">{{ new Date(tx.createdAt).toLocaleDateString() }}</p>
          </div>
          <p
            class="shrink-0 font-bold tabular-nums"
            :class="tx.amount >= 0 ? (isFd ? 'text-fd-success' : 'text-brand-green') : (isFd ? 'text-fd-danger' : 'text-brand-pink')"
          >
            {{ tx.amount >= 0 ? '+' : '' }}{{ formatPrice(tx.amount) }}
          </p>
        </div>
      </div>
      <p v-else class="px-5 py-10 text-center text-sm" :class="isFd ? 'text-fd-muted' : 'ios-footnote'">{{ t('wallet.noTransactions') }}</p>
    </div>
  </section>
</template>
