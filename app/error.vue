<script setup lang="ts">
const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string }
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const title = computed(() => {
  const code = props.error.statusCode ?? 500
  if (code === 404) return t('error.notFoundTitle')
  if (code === 403) return t('error.forbiddenTitle')
  return t('error.serverTitle')
})

const message = computed(() => {
  if (props.error.statusMessage && props.error.statusMessage !== 'Server Error') {
    return props.error.statusMessage
  }
  const code = props.error.statusCode ?? 500
  if (code === 404) return t('error.notFoundMessage')
  if (code === 403) return t('error.forbiddenMessage')
  return t('error.serverMessage')
})
</script>

<template>
  <div class="page-enter mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
    <p class="sz-eyebrow mb-2">{{ error.statusCode ?? 500 }}</p>
    <h1 class="sz-headline mb-3">{{ title }}</h1>
    <p class="mb-8 text-brand-gray-600">{{ message }}</p>
    <div class="flex flex-wrap justify-center gap-3">
      <SzButton :to="localePath('/')">{{ t('error.backHome') }}</SzButton>
      <SzButton variant="secondary" @click="clearError({ redirect: localePath('/') })">
        {{ t('error.tryAgain') }}
      </SzButton>
    </div>
  </div>
</template>
