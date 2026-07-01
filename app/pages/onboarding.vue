<script setup lang="ts">
import type { Sport } from '~/types'
import type { SkillQuizQuestion } from '~/components/SkillQuiz.vue'

definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()
const localePath = useLocalePath()
const { pickName } = useLocaleContent()
const { dashboardPath } = useDashboardPath()
const { resolvePostAuthRedirect } = useAuthRedirect()

useHead({ title: () => t('onboarding.title') })

const { data: sports } = await useApiFetch<Sport[]>('/api/sports')
const { data: quizQuestions } = await useApiFetch<SkillQuizQuestion[]>('/api/skill-quiz')

const step = ref<'profile' | 'quiz'>('profile')
const selectedSports = ref<string[]>(['tennis'])
const gender = ref<'MALE' | 'FEMALE' | ''>('')
const quizAnswers = ref<Record<string, string>>({})
const pending = ref(false)

function toggleSport(slug: string) {
  if (selectedSports.value.includes(slug)) {
    selectedSports.value = selectedSports.value.filter((s) => s !== slug)
  } else if (selectedSports.value.length < 4) {
    selectedSports.value.push(slug)
  }
}

const quizComplete = computed(() =>
  (quizQuestions.value ?? []).every((q) => quizAnswers.value[q.id]),
)

function goToQuiz() {
  if (!selectedSports.value.length || !gender.value) return
  step.value = 'quiz'
}

async function finish() {
  pending.value = true
  try {
    await $fetch('/api/profile/onboard', {
      method: 'POST',
      body: {
        sports: selectedSports.value,
        gender: gender.value || undefined,
        quizAnswers: quizAnswers.value,
      },
    })
    await navigateTo(resolvePostAuthRedirect(dashboardPath.value))
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="page-enter mx-auto max-w-lg px-4 py-10 sm:px-6">
    <p class="sz-eyebrow">{{ t('onboarding.eyebrow') }}</p>
    <h1 class="sz-headline mt-2">{{ t('onboarding.title') }}</h1>
    <p class="mt-2 text-brand-gray-600">
      {{ step === 'quiz' ? t('onboarding.quizSubtitle') : t('onboarding.subtitle') }}
    </p>

    <template v-if="step === 'profile'">
      <section class="mt-8">
        <h2 class="ios-title-3 mb-3">{{ t('onboarding.pickSports') }}</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in sports"
            :key="s.id"
            type="button"
            class="sz-chip tap-highlight"
            :class="selectedSports.includes(s.slug) ? 'bg-brand-orange text-white shadow-card' : 'bg-white shadow-card'"
            @click="toggleSport(s.slug)"
          >
            <span class="inline-flex items-center gap-1.5">
              <SportIcon :slug="s.slug" size="sm" />
              {{ pickName(s) }}
            </span>
          </button>
        </div>
      </section>

      <section class="mt-8">
        <h2 class="ios-title-3 mb-3">{{ t('onboarding.pickGender') }}</h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="ios-card p-4 text-center font-bold tap-highlight"
            :class="gender === 'MALE' ? 'ring-2 ring-brand-orange' : ''"
            @click="gender = 'MALE'"
          >
            {{ t('profile.genderMale') }}
          </button>
          <button
            type="button"
            class="ios-card p-4 text-center font-bold tap-highlight"
            :class="gender === 'FEMALE' ? 'ring-2 ring-brand-orange' : ''"
            @click="gender = 'FEMALE'"
          >
            {{ t('profile.genderFemale') }}
          </button>
        </div>
      </section>

      <SzButton
        class="mt-10"
        block
        size="lg"
        :disabled="!selectedSports.length || !gender"
        @click="goToQuiz"
      >
        {{ t('onboarding.continueToQuiz') }}
      </SzButton>
    </template>

    <template v-else>
      <section class="mt-8">
        <h2 class="ios-title-3 mb-3">{{ t('onboarding.skillQuiz') }}</h2>
        <p class="mb-4 text-sm text-brand-gray-600">{{ t('onboarding.quizHint') }}</p>
        <SkillQuiz v-if="quizQuestions?.length" v-model="quizAnswers" :questions="quizQuestions" />
      </section>

      <div class="mt-10 flex gap-2">
        <SzButton variant="secondary" block size="lg" @click="step = 'profile'">
          {{ t('skillQuiz.back') }}
        </SzButton>
        <SzButton block size="lg" :disabled="pending || !quizComplete" @click="finish">
          {{ t('onboarding.finish') }}
        </SzButton>
      </div>
    </template>
  </div>
</template>
