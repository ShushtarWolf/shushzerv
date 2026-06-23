<script setup lang="ts">
import type { Review } from '~/types'

const props = defineProps<{
  clubId: string
}>()

const emit = defineEmits<{
  rated: []
}>()

const { t, locale } = useI18n()
const { localized } = useLocaleContent()
const { loggedIn } = useUserSession()
const localePath = useLocalePath()
const toast = useToast()
const { requireLogin, loginPath } = useAuthRedirect()

const { data: reviews, refresh } = await useApiFetch<Review[]>(
  () => '/api/reviews',
  { query: { clubId: props.clubId } },
)

const form = ref({ rating: 5, body: '' })
const submitting = ref(false)

function reviewerName(r: Review) {
  if (!r.user) return t('testimonials.anonymous')
  return userDisplayName(r.user, locale.value)
}

async function submitReview() {
  if (!loggedIn.value) return requireLogin()
  if (!form.value.body.trim()) {
    toast.error(t('reviews.bodyRequired'))
    return
  }
  submitting.value = true
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: {
        clubId: props.clubId,
        rating: form.value.rating,
        bodyFa: form.value.body,
        bodyEn: form.value.body,
      },
    })
    form.value.body = ''
    toast.success(t('reviews.submitted'))
    await refresh()
    emit('rated')
  } catch (e: unknown) {
    const err = e as { statusCode?: number; statusMessage?: string; data?: { message?: string } }
    if (err?.statusCode === 409) {
      toast.error(t('reviews.alreadySubmitted'))
    } else {
      toast.error(err?.data?.message || err?.statusMessage || t('common.error'))
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="mt-8">
    <SzSection :title="t('reviews.title')" />
    <div v-if="reviews?.length" class="space-y-3">
      <div v-for="r in reviews" :key="r.id" class="ios-card p-4">
        <div class="mb-2 flex gap-0.5 text-brand-yellow">
          <span v-for="i in r.rating" :key="i">★</span>
        </div>
        <p class="text-sm leading-relaxed text-brand-gray-700">"{{ localized(r.bodyFa, r.bodyEn) }}"</p>
        <p class="mt-2 text-xs font-semibold text-brand-gray-500">{{ reviewerName(r) }}</p>
        <div v-if="r.replyFa" class="mt-3 rounded-xl border border-brand-orange/15 bg-brand-orange/5 px-3 py-2">
          <p class="text-xs font-semibold text-brand-orange">{{ t('dashboard.clubReply') }}</p>
          <p class="mt-1 text-sm text-brand-gray-700">{{ localized(r.replyFa, r.replyEn) }}</p>
        </div>
      </div>
    </div>
    <SzEmptyState v-else :message="t('reviews.empty')" />

    <form v-if="loggedIn" class="mt-6 space-y-3 rounded-xl border border-brand-gray-200 p-4" @submit.prevent="submitReview">
      <h3 class="text-sm font-bold text-brand-gray-900">{{ t('reviews.write') }}</h3>
      <div class="flex items-center gap-2">
        <label class="text-sm text-brand-gray-600">{{ t('reviews.rating') }}</label>
        <select v-model.number="form.rating" class="ios-input w-auto">
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <textarea v-model="form.body" class="ios-input min-h-[5rem]" :placeholder="t('reviews.placeholder')" />
      <SzButton type="submit" size="sm" :disabled="submitting">{{ t('reviews.submit') }}</SzButton>
    </form>
    <p v-else class="mt-4 text-sm text-brand-gray-500">
      <NuxtLink :to="loginPath()" class="font-semibold text-brand-orange hover:underline">{{ t('nav.login') }}</NuxtLink>
      {{ t('reviews.loginToReview') }}
    </p>
  </section>
</template>
