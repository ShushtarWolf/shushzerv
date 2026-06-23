<script setup lang="ts">
const { toasts, dismiss } = useToast()

const toneClass: Record<string, string> = {
  success: 'border-brand-green/30 bg-brand-green/10 text-brand-green',
  error: 'border-brand-pink/30 bg-brand-pink/10 text-brand-pink',
  info: 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue',
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-float backdrop-blur-sm"
        :class="toneClass[item.tone]"
        role="status"
      >
        <span class="flex-1">{{ item.message }}</span>
        <button
          type="button"
          class="rounded-lg p-1 opacity-70 hover:opacity-100"
          :aria-label="$t('common.close')"
          @click="dismiss(item.id)"
        >
          <SzIcon name="close" size="sm" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
