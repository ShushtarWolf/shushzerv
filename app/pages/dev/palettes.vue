<script setup lang="ts">
definePageMeta({ layout: false })

const palettes = [
  {
    id: 'A',
    label: 'Current — Slate Blue',
    labelFa: 'فعلی — آبی سنگی',
    primary: '#2C4A6E',
    primaryDark: '#1E3349',
    primaryLight: '#4A6B8A',
    bg: '#FAFAF9',
  },
  {
    id: 'B',
    label: 'Sport Orange',
    labelFa: 'نارنجی ورزشی',
    primary: '#E85D04',
    primaryDark: '#C2410C',
    primaryLight: '#FB923C',
    bg: '#FAFAF9',
  },
  {
    id: 'C',
    label: 'Fresh Emerald',
    labelFa: 'زمرد تازه',
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#34D399',
    bg: '#F8FAF9',
  },
  {
    id: 'D',
    label: 'Teal Pulse',
    labelFa: 'فیروزه‌ای',
    primary: '#0D9488',
    primaryDark: '#0F766E',
    primaryLight: '#2DD4BF',
    bg: '#F8FAFB',
  },
  {
    id: 'E',
    label: 'Trust Blue',
    labelFa: 'آبی اعتماد',
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#60A5FA',
    bg: '#F8FAFC',
  },
  {
    id: 'F',
    label: 'Navy + Lime',
    labelFa: 'سرمه‌ای + لیمویی',
    primary: '#1E3A5F',
    primaryDark: '#152A45',
    primaryLight: '#3B5F8C',
    accent: '#84CC16',
    bg: '#F9FAFB',
  },
  {
    id: 'G',
    label: 'Coral Bloom',
    labelFa: 'مرجانی',
    primary: '#F43F5E',
    primaryDark: '#E11D48',
    primaryLight: '#FB7185',
    bg: '#FFF1F2',
  },
  {
    id: 'H',
    label: 'Royal Violet',
    labelFa: 'بنفش سلطنتی',
    primary: '#7C3AED',
    primaryDark: '#6D28D9',
    primaryLight: '#A78BFA',
    bg: '#FAF5FF',
  },
  {
    id: 'I',
    label: 'Golden Sand',
    labelFa: 'طلایی شنی',
    primary: '#CA8A04',
    primaryDark: '#A16207',
    primaryLight: '#FACC15',
    bg: '#FFFBEB',
  },
  {
    id: 'J',
    label: 'Midnight Sky',
    labelFa: 'نیمه‌شب آسمانی',
    primary: '#1E293B',
    primaryDark: '#0F172A',
    primaryLight: '#475569',
    accent: '#38BDF8',
    bg: '#F8FAFC',
  },
  {
    id: 'K',
    label: 'Meadow Olive',
    labelFa: 'زیتونی چمنزار',
    primary: '#4D7C0F',
    primaryDark: '#3F6212',
    primaryLight: '#84CC16',
    bg: '#F7FEE7',
  },
  {
    id: 'L',
    label: 'Wine Sport',
    labelFa: 'شرابی ورزشی',
    primary: '#9F1239',
    primaryDark: '#881337',
    primaryLight: '#FB7185',
    bg: '#FFF1F2',
  },
  {
    id: 'M',
    label: 'Electric Aqua',
    labelFa: 'آبی برقی',
    primary: '#0891B2',
    primaryDark: '#0E7490',
    primaryLight: '#22D3EE',
    bg: '#ECFEFF',
  },
  {
    id: 'N',
    label: 'Copper Clay',
    labelFa: 'گلی مسی',
    primary: '#9A3412',
    primaryDark: '#7C2D12',
    primaryLight: '#EA580C',
    bg: '#FFF7ED',
  },
  {
    id: 'O',
    label: 'Lilac Dream',
    labelFa: 'یاسی رویایی',
    primary: '#9333EA',
    primaryDark: '#7E22CE',
    primaryLight: '#C084FC',
    bg: '#FAF5FF',
  },
  {
    id: 'P',
    label: 'Carbon Amber',
    labelFa: 'ذغالی کهربایی',
    primary: '#27272A',
    primaryDark: '#18181B',
    primaryLight: '#52525B',
    accent: '#F59E0B',
    bg: '#FAFAFA',
  },
  {
    id: 'Q',
    label: 'Ocean Deep',
    labelFa: 'اقیانوس عمیق',
    primary: '#1E40AF',
    primaryDark: '#1E3A8A',
    primaryLight: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'R',
    label: 'Sage Mist',
    labelFa: 'مریم‌گیاه مه‌آلود',
    primary: '#5B7553',
    primaryDark: '#4A6044',
    primaryLight: '#86A17D',
    bg: '#F6F7F4',
  },
  {
    id: 'S',
    label: 'iMac Blue',
    labelFa: 'آبی آیمک',
    primary: '#3994D8',
    primaryDark: '#2474B8',
    primaryLight: '#9CC9EB',
    bg: '#EBF4FA',
  },
  {
    id: 'T',
    label: 'iMac Green',
    labelFa: 'سبز آیمک',
    primary: '#4DB86A',
    primaryDark: '#3A9A55',
    primaryLight: '#A8DFB8',
    bg: '#E8F5EC',
  },
  {
    id: 'U',
    label: 'iMac Pink',
    labelFa: 'صورتی آیمک',
    primary: '#E8789A',
    primaryDark: '#D45B80',
    primaryLight: '#F5B8CC',
    bg: '#FDF0F4',
  },
  {
    id: 'V',
    label: 'iMac Yellow',
    labelFa: 'زرد آیمک',
    primary: '#D4940A',
    primaryDark: '#A67108',
    primaryLight: '#F0C84A',
    bg: '#FFFBEB',
  },
  {
    id: 'W',
    label: 'iMac Orange',
    labelFa: 'نارنجی آیمک',
    primary: '#FF6B2C',
    primaryDark: '#E05A20',
    primaryLight: '#FFAB80',
    bg: '#FFF4ED',
  },
  {
    id: 'X',
    label: 'iMac Purple',
    labelFa: 'بنفش آیمک',
    primary: '#9B7BB8',
    primaryDark: '#7E5A9E',
    primaryLight: '#CDB8DE',
    bg: '#F5F0FA',
  },
] as const
</script>

<template>
  <div class="min-h-dvh bg-brand-gray-100 px-4 py-10 sm:px-8">
    <div class="mx-auto max-w-6xl space-y-8">
      <header class="text-center">
        <p class="text-sm font-bold uppercase tracking-widest text-brand-gray-500">Shushzerv</p>
        <h1 class="mt-2 text-3xl font-extrabold text-brand-gray-900">Choose a palette</h1>
        <p class="mt-2 text-brand-gray-600">Pick A–X · newest row is iMac colors (S–X)</p>
      </header>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="p in palettes"
          :key="p.id"
          class="overflow-hidden rounded-2xl bg-white shadow-card"
        >
          <div class="flex items-center gap-3 px-4 py-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
              :style="{ backgroundColor: p.primary }"
            >
              {{ p.id }}
            </span>
            <div class="min-w-0">
              <h2 class="truncate text-sm font-bold text-brand-gray-900">{{ p.label }}</h2>
              <p class="truncate text-xs text-brand-gray-500">{{ p.labelFa }}</p>
            </div>
          </div>

          <div class="flex gap-1 px-4 pb-3">
            <span
              v-for="(c, i) in [p.primary, p.primaryDark, p.primaryLight, p.accent ?? p.primaryLight, p.bg]"
              :key="i"
              class="h-8 flex-1 rounded-lg"
              :style="{ backgroundColor: c }"
            />
          </div>

          <div class="p-4 pt-0" :style="{ backgroundColor: p.bg }">
            <div
              class="overflow-hidden rounded-2xl p-4 text-white shadow-card"
              :style="{ backgroundColor: p.primary }"
            >
              <p class="text-lg font-extrabold leading-tight">زمین رزرو کن — همین حالا!</p>
              <p class="mt-1 text-xs text-white/80">کلاس و مربی در شهرت</p>
              <div class="mt-3 rounded-xl bg-white p-3 text-brand-gray-900">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-bold">فیتنس گروهی</p>
                    <p class="text-xs text-brand-gray-500">باشگاه آیرون هاوس</p>
                  </div>
                  <span
                    class="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                    :style="{ backgroundColor: `${p.primary}18`, color: p.primary }"
                  >
                    ۱۲/۲۰
                  </span>
                </div>
                <button
                  type="button"
                  class="mt-3 w-full rounded-xl py-2 text-xs font-bold text-white"
                  :style="{ backgroundColor: p.accent ?? p.primaryDark }"
                >
                  جستجو
                </button>
              </div>
            </div>

            <div class="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                :style="{ backgroundColor: p.primaryLight }"
              >
                س
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">سارا محمدی</p>
                <p class="text-xs text-brand-gray-500">تنیس · تهران</p>
              </div>
              <span
                class="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold"
                :style="{ backgroundColor: `${p.primary}14`, color: p.primary }"
              >
                ★ ۴٫۹
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
