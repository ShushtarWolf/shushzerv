<script setup lang="ts">
definePageMeta({ layout: false })

const basketballColor = '#FF6B00'

const options = [
  {
    id: 'a',
    label: 'A · Classic Seam',
    desc: 'Clean line-art ball with traditional seam curves. Minimal, works at any size.',
    src: '/icons/sports/previews/basketball-a.svg',
  },
  {
    id: 'b',
    label: 'B · Hoop Shot',
    desc: 'Ball above rim and net. More narrative — instantly reads as basketball.',
    src: '/icons/sports/previews/basketball-b.svg',
  },
  {
    id: 'c',
    label: 'C · Motion',
    desc: 'Ball mid-dribble with bounce arc. Energetic, stands out from static icons.',
    src: '/icons/sports/previews/basketball-c.svg',
  },
] as const
</script>

<template>
  <div class="min-h-screen bg-brand-gray-50 px-4 py-10 sm:px-8">
    <div class="mx-auto max-w-4xl">
      <p class="text-xs font-bold uppercase tracking-widest text-brand-gray-500">Sport icon review</p>
      <h1 class="sz-headline mt-2">Basketball — pick one</h1>
      <p class="mt-2 max-w-xl text-sm text-brand-gray-600">
        Three designs shown in app context. Reply with <strong>A</strong>, <strong>B</strong>, or <strong>C</strong> (or feedback) and we'll apply it, then move to the next sport.
      </p>

      <div class="mt-10 grid gap-6 sm:grid-cols-3">
        <div
          v-for="opt in options"
          :key="opt.id"
          class="ios-card overflow-hidden"
        >
          <div class="border-b border-brand-gray-100 bg-white px-4 py-3">
            <p class="font-extrabold">{{ opt.label }}</p>
            <p class="mt-1 text-xs text-brand-gray-600">{{ opt.desc }}</p>
          </div>

          <!-- Large card context -->
          <div class="p-4">
            <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-gray-400">Explore card</p>
            <div class="flex flex-col items-center gap-2 rounded-2xl border border-brand-gray-100 bg-white p-5 text-center shadow-card">
              <span
                class="flex h-14 w-14 items-center justify-center rounded-2xl"
                :style="{ backgroundColor: basketballColor + '22', color: basketballColor }"
              >
                <img :src="opt.src" alt="" class="h-10 w-10" />
              </span>
              <span class="text-sm font-semibold">Basketball</span>
            </div>
          </div>

          <!-- Hero context -->
          <div class="px-4 pb-4">
            <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-gray-400">Hero banner</p>
            <div
              class="flex items-center gap-4 rounded-2xl p-5 text-white"
              :style="{ backgroundColor: basketballColor }"
            >
              <span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <img :src="opt.src" alt="" class="h-14 w-14 brightness-0 invert" />
              </span>
              <div>
                <p class="text-lg font-extrabold">Basketball</p>
                <p class="text-sm text-white/80">Find courts & matches</p>
              </div>
            </div>
          </div>

          <!-- Small badge context -->
          <div class="border-t border-brand-gray-100 px-4 py-4">
            <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-gray-400">Small badge</p>
            <span
              class="inline-flex h-7 w-7 items-center justify-center rounded-full shadow-card"
              :style="{ backgroundColor: basketballColor + '22', color: basketballColor, border: `2px solid ${basketballColor}` }"
            >
              <img :src="opt.src" alt="" class="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
