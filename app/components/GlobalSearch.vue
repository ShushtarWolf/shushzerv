<script setup lang="ts">
type SearchResult = {
  type: 'club' | 'coach' | 'class' | 'match' | 'tournament' | 'news' | 'sport'
  labelFa: string
  labelEn: string
  subtitleFa?: string
  subtitleEn?: string
  link: string
}

const props = withDefaults(defineProps<{
  variant?: 'bar' | 'icon'
}>(), {
  variant: 'bar',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { localized } = useLocaleContent()

const query = ref('')
const results = ref<SearchResult[]>([])
const pending = ref(false)
const open = ref(false)
const overlayOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const isRtl = computed(() => locale.value === 'fa')
const isBar = computed(() => props.variant === 'bar')
const isIcon = computed(() => props.variant === 'icon')

const typeLabels: Record<SearchResult['type'], string> = {
  club: 'search.types.club',
  coach: 'search.types.coach',
  class: 'search.types.class',
  match: 'search.types.match',
  tournament: 'search.types.tournament',
  news: 'search.types.news',
  sport: 'search.types.sport',
}

function labelFor(r: SearchResult) {
  return localized(r.labelFa, r.labelEn)
}

function subtitleFor(r: SearchResult) {
  if (!r.subtitleFa && !r.subtitleEn) return ''
  return localized(r.subtitleFa ?? r.labelFa, r.subtitleEn ?? r.labelEn)
}

let timer: ReturnType<typeof setTimeout> | null = null

watch(query, (q) => {
  if (timer) clearTimeout(timer)
  if (!q.trim()) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    pending.value = true
    try {
      const res = await $fetch<{ results: SearchResult[] }>('/api/search', { query: { q } })
      results.value = res.results
    } catch {
      results.value = []
    } finally {
      pending.value = false
    }
  }, 300)
})

function closeDropdown() {
  open.value = false
}

function closeAll() {
  open.value = false
  overlayOpen.value = false
}

function goTo(link: string) {
  navigateTo(localePath(link))
  query.value = ''
  results.value = []
  closeAll()
}

function submitSearch() {
  const q = query.value.trim()
  if (!q) return
  if (results.value.length) {
    goTo(results.value[0]!.link)
    return
  }
  navigateTo({ path: localePath('/clubs'), query: { q } })
  query.value = ''
  results.value = []
  closeAll()
}

function openOverlay() {
  overlayOpen.value = true
  open.value = true
  nextTick(() => inputRef.value?.focus())
}

watch(overlayOpen, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <!-- Full-width search bar (tablet + desktop) -->
  <div v-if="isBar" class="relative w-full">
    <SzIcon name="search" class="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray-500" />
    <input
      v-model="query"
      type="search"
      class="ios-input w-full !border-brand-gray-200 !bg-brand-gray-50 !py-2.5 ps-9 text-sm !shadow-none focus:!border-brand-orange focus:!bg-white"
      :placeholder="t('search.placeholder')"
      :dir="isRtl ? 'rtl' : 'ltr'"
      @focus="open = true"
      @keydown.enter.prevent="submitSearch"
      @keydown.esc="closeDropdown(); query = ''"
    />
    <div
      v-if="open && (results.length || pending || query.trim())"
      class="absolute inset-x-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-black/5 bg-white py-1 shadow-float"
    >
      <p v-if="pending" class="px-4 py-3 text-sm text-brand-gray-500">{{ t('common.loading') }}</p>
      <template v-else-if="results.length">
        <button
          v-for="(r, i) in results"
          :key="`${r.type}-${r.link}-${i}`"
          type="button"
          class="flex w-full items-start gap-3 px-4 py-2.5 text-start hover:bg-brand-gray-50"
          @mousedown.prevent="goTo(r.link)"
        >
          <span class="mt-0.5 shrink-0 rounded-md bg-brand-orange/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-orange">
            {{ t(typeLabels[r.type]) }}
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold text-brand-gray-900">{{ labelFor(r) }}</span>
            <span v-if="subtitleFor(r)" class="block truncate text-xs text-brand-gray-500">{{ subtitleFor(r) }}</span>
          </span>
        </button>
      </template>
      <p v-else-if="query.trim()" class="px-4 py-3 text-sm text-brand-gray-500">{{ t('search.noResults') }}</p>
    </div>
    <div v-if="open" class="fixed inset-0 z-40" @click="closeDropdown" />
  </div>

  <!-- Mobile icon trigger -->
  <button
    v-if="isIcon"
    type="button"
    class="inline-flex rounded-lg p-2 text-brand-gray-700 hover:bg-brand-gray-100"
    :aria-label="t('search.open')"
    @click="openOverlay"
  >
    <SzIcon name="search" />
  </button>

  <!-- Mobile full-screen overlay -->
  <Teleport v-if="isIcon" to="body">
    <div
      v-if="overlayOpen"
      class="fixed inset-0 z-50 flex flex-col bg-white md:hidden"
      style="padding-top: var(--sz-safe-top)"
    >
      <div class="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <SzIcon name="search" class="h-5 w-5 shrink-0 text-brand-gray-500" />
        <input
          ref="inputRef"
          v-model="query"
          type="search"
          class="ios-input min-w-0 flex-1 !border-0 !bg-transparent !py-2 !shadow-none"
          :placeholder="t('search.placeholder')"
          :dir="isRtl ? 'rtl' : 'ltr'"
          @keydown.enter.prevent="submitSearch"
        />
        <button
          type="button"
          class="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-brand-gray-600 hover:bg-brand-gray-100"
          @click="closeAll(); query = ''; results = []"
        >
          {{ t('common.cancel') }}
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-2 py-2">
        <p v-if="pending" class="px-3 py-4 text-sm text-brand-gray-500">{{ t('common.loading') }}</p>
        <template v-else-if="results.length">
          <button
            v-for="(r, i) in results"
            :key="`${r.type}-${r.link}-${i}`"
            type="button"
            class="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-start hover:bg-brand-gray-50"
            @click="goTo(r.link)"
          >
            <span class="mt-0.5 shrink-0 rounded-md bg-brand-orange/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-orange">
              {{ t(typeLabels[r.type]) }}
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-brand-gray-900">{{ labelFor(r) }}</span>
              <span v-if="subtitleFor(r)" class="block text-xs text-brand-gray-500">{{ subtitleFor(r) }}</span>
            </span>
          </button>
        </template>
        <p v-else-if="query.trim()" class="px-3 py-4 text-sm text-brand-gray-500">{{ t('search.noResults') }}</p>
        <p v-else class="px-3 py-4 text-sm text-brand-gray-500">{{ t('search.hint') }}</p>
      </div>
    </div>
  </Teleport>
</template>
