<script setup lang="ts">
defineProps<{
  flush?: boolean
}>()
</script>

<template>
  <section class="admin-card" :class="{ 'admin-card-flush': flush }">
    <div v-if="$slots.header" class="admin-card-header">
      <slot name="header" />
    </div>
    <div :class="flush ? '' : 'admin-card-body'">
      <slot />
    </div>
    <div v-if="$slots.footer" class="admin-card-footer">
      <slot name="footer" />
    </div>
  </section>
</template>
