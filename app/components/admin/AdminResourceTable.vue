<script setup lang="ts">
defineProps<{
  empty?: boolean
  emptyMessage?: string
}>()
</script>

<template>
  <div class="admin-table-wrap">
    <table class="admin-table">
      <thead v-if="$slots.head">
        <slot name="head" />
      </thead>
      <tbody v-if="!empty">
        <slot />
      </tbody>
    </table>
    <div v-if="empty" class="admin-table-empty">
      <p>{{ emptyMessage }}</p>
    </div>
  </div>
</template>
