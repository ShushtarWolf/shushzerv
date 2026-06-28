<script setup lang="ts">
import type { ClassPackage, Coach, Sport } from '~/types'

const props = defineProps<{
  packages: ClassPackage[] | null | undefined
  sports: Sport[] | null | undefined
  coaches?: Coach[] | null | undefined
  clubId?: string
  mode: 'club' | 'coach'
}>()

const emit = defineEmits<{ refresh: [] }>()

const { t } = useI18n()
const { localized, formatPrice } = useLocaleContent()
const { levels, levelLabel } = useSkillLevel()
const {
  weekdayOptions,
  classTypeLabel,
  classGroupLabel,
  groupModeLabel,
  packageSummary,
  scheduleLabel,
  toggleDay,
  daySelected,
  defaultPackageForm,
} = useClassPackage()

const form = ref(defaultPackageForm())
const message = ref('')

const genderPolicyOptions = computed(() => [
  { value: 'MIXED', label: t('dashboard.genderMixed') },
  { value: 'MEN', label: t('dashboard.genderMen') },
  { value: 'WOMEN', label: t('dashboard.genderWomen') },
  { value: 'FAMILY', label: t('dashboard.genderFamily') },
])

function onClassTypeChange() {
  form.value.maxSeats = form.value.classType === 'SEMI_PRIVATE' ? 4 : 12
  if (form.value.classType !== 'GROUP') {
    form.value.groupMode = 'OPEN'
    form.value.studentEmails = ''
  }
}

async function createPackage() {
  if (!form.value.titleFa || !form.value.descFa || !form.value.sportId) return
  if (form.value.classType === 'GROUP' && form.value.groupMode === 'WITH_STUDENTS' && !form.value.studentEmails.trim()) {
    message.value = t('packages.studentEmailsRequired')
    return
  }
  const endpoint = props.mode === 'club' ? '/api/club/packages' : '/api/coach/packages'
  const body = props.mode === 'club'
    ? { clubId: props.clubId, ...form.value }
    : { ...form.value, clubId: form.value.clubId || undefined }
  await $fetch(endpoint, { method: 'POST', body })
  form.value = defaultPackageForm()
  message.value = t('packages.created')
  emit('refresh')
}

async function deletePackage(id: string) {
  const endpoint = props.mode === 'club' ? `/api/club/packages/${id}` : `/api/coach/packages/${id}`
  await $fetch(endpoint, { method: 'DELETE' })
  message.value = t('packages.deleted')
  emit('refresh')
}

async function toggleFeatured(pkg: ClassPackage) {
  const endpoint = props.mode === 'club' ? `/api/club/packages/${pkg.id}` : `/api/coach/packages/${pkg.id}`
  await $fetch(endpoint, { method: 'PATCH', body: { featured: !pkg.featured } })
  emit('refresh')
}
</script>

<template>
  <section>
    <h2 class="fd-section-title mb-4">{{ t('packages.manage') }}</h2>
    <p v-if="message" class="mb-4 text-sm font-semibold text-fd-success">{{ message }}</p>

    <div v-if="packages?.length" class="mb-6 space-y-3">
      <div v-for="pkg in packages" :key="pkg.id" class="fd-card p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-fd-navy">{{ localized(pkg.titleFa, pkg.titleEn) }}</p>
            <p class="text-sm text-fd-muted">{{ packageSummary(pkg) }} · {{ scheduleLabel(pkg) }}</p>
            <p class="text-sm text-fd-muted">
              {{ classTypeLabel(pkg.classType) }}
              <template v-if="pkg.classType === 'GROUP'"> · {{ groupModeLabel(pkg.groupMode) }}</template>
              · {{ classGroupLabel(pkg) }} · {{ formatPrice(pkg.price) }} {{ t('clubs.currency') }}
            </p>
            <p v-if="pkg.classType === 'GROUP'" class="text-xs text-fd-muted">
              {{ pkg.bookedSeats }} / {{ pkg.maxSeats }} {{ t('classes.enrolled') }}
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-1">
            <button type="button" class="text-xs font-semibold text-fd-primary" @click="toggleFeatured(pkg)">
              {{ pkg.featured ? t('packages.unfeature') : t('packages.feature') }}
            </button>
            <button type="button" class="text-xs font-semibold text-fd-danger" @click="deletePackage(pkg.id)">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="fd-panel grid gap-3 sm:grid-cols-2">
      <input v-model="form.titleFa" class="fd-input sm:col-span-2" :placeholder="t('packages.titleField')" />
      <input v-model="form.titleEn" class="fd-input sm:col-span-2" placeholder="Title (EN)" />
      <textarea v-model="form.descFa" class="fd-input min-h-20 sm:col-span-2" :placeholder="t('packages.descField') + ' (FA)'" />
      <textarea v-model="form.descEn" class="fd-input min-h-20 sm:col-span-2" placeholder="Description (EN)" />

      <div class="sm:col-span-2">
        <p class="mb-2 text-sm text-fd-muted">{{ t('search.sport') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in sports"
            :key="s.id"
            type="button"
            class="sz-chip tap-highlight"
            :class="form.sportId === s.id ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
            @click="form.sportId = s.id"
          >
            <span class="inline-flex items-center gap-1.5">
              <SportIcon :slug="s.slug" size="sm" />
              {{ localized(s.nameFa, s.nameEn) }}
            </span>
          </button>
        </div>
      </div>

      <select v-if="mode === 'club' && coaches?.length" v-model="form.coachId" class="fd-input sm:col-span-2">
        <option value="">{{ t('coaches.title') }}</option>
        <option v-for="c in coaches" :key="c.id" :value="c.id">{{ localized(c.nameFa, c.nameEn) }}</option>
      </select>

      <input v-model.number="form.price" type="number" class="fd-input" min="0" :placeholder="t('dashboard.price')" />
      <input v-model.number="form.sessionsPerWeek" type="number" class="fd-input" min="1" max="7" :placeholder="t('packages.sessionsPerWeek')" />
      <input v-model.number="form.durationWeeks" type="number" class="fd-input" min="1" max="52" :placeholder="t('packages.durationWeeksField')" />
      <input v-model="form.startTime" type="time" class="fd-input" />
      <input v-model="form.endTime" type="time" class="fd-input" />

      <div class="sm:col-span-2">
        <p class="mb-2 text-sm text-fd-muted">{{ t('packages.daysOfWeek') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in weekdayOptions"
            :key="opt.value"
            type="button"
            class="sz-chip tap-highlight"
            :class="daySelected(form.daysOfWeek, opt.value) ? 'bg-fd-primary text-white shadow-fd-soft' : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'"
            @click="form.daysOfWeek = toggleDay(form.daysOfWeek, opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <select v-model="form.classType" class="fd-input" @change="onClassTypeChange">
        <option value="GROUP">{{ t('classes.group') }}</option>
        <option value="SEMI_PRIVATE">{{ t('classes.semiPrivate') }}</option>
      </select>
      <select v-if="form.classType === 'GROUP'" v-model="form.groupMode" class="fd-input sm:col-span-2">
        <option value="OPEN">{{ t('packages.withoutStudents') }}</option>
        <option value="WITH_STUDENTS">{{ t('packages.withStudents') }}</option>
      </select>
      <p v-if="form.classType === 'GROUP'" class="text-xs text-fd-muted sm:col-span-2">
        {{ form.groupMode === 'OPEN' ? t('packages.withoutStudentsHint') : t('packages.withStudentsHint') }}
      </p>
      <input
        v-model.number="form.maxSeats"
        type="number"
        class="fd-input"
        :min="form.classType === 'SEMI_PRIVATE' ? 2 : 5"
        :max="form.classType === 'SEMI_PRIVATE' ? 4 : 50"
        :placeholder="t('classes.seats')"
      />
      <select v-model="form.genderPolicy" class="fd-input">
        <option v-for="opt in genderPolicyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select v-model="form.minLevel" class="fd-input">
        <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
      </select>
      <select v-model="form.maxLevel" class="fd-input">
        <option v-for="l in levels" :key="l" :value="l">{{ levelLabel(l) }}</option>
      </select>

      <input
        v-if="form.classType === 'GROUP' && form.groupMode === 'WITH_STUDENTS'"
        v-model="form.studentEmails"
        type="text"
        class="fd-input sm:col-span-2"
        :placeholder="t('packages.studentEmails')"
      />

      <label class="flex items-center gap-2 text-sm text-fd-navy sm:col-span-2">
        <input v-model="form.featured" type="checkbox" class="rounded border-fd-primary/20" />
        {{ t('packages.featureOnHome') }}
      </label>

      <button type="button" class="fd-btn-primary sm:col-span-2" @click="createPackage">{{ t('packages.create') }}</button>
    </div>
  </section>
</template>
