<script setup lang="ts">
import type { ScheduleEvent } from '~/types'

const props = withDefaults(
  defineProps<{
    events: ScheduleEvent[]
    loading?: boolean
    bookable?: boolean
    allowSlotSelect?: boolean
    selectedSlotId?: string
    showEmptyGrid?: boolean
    variant?: 'default' | 'dashboard'
    compact?: boolean
    courts?: Array<{ id: string; name: string }>
    hideCourtFilter?: boolean
    initialDate?: string
    manageNotes?: boolean
  }>(),
  { variant: 'default', compact: false, hideCourtFilter: false, manageNotes: false },
)

const emit = defineEmits<{
  'range-change': [{ from: string; to: string }]
  'select-slot': [ScheduleEvent]
  'select-event': [ScheduleEvent]
  'manage-event': [ScheduleEvent]
}>()

const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'fa')
const { formatDate, formatPrice, formatTime, formatTimeRange } = useLocaleContent()
const { eventDurationLabel } = useSlotSchedule()
const { dismissed: scheduleHintDismissed, dismiss: dismissScheduleHint } = useScheduleHint()
const {
  anchor: selectedDate,
  weekStart,
  weekEnd,
  weekDays,
  weekLabel,
  dayLabel,
  dayNumber,
  isToday,
  prevWeek,
  nextWeek,
  goToday,
} = useScheduleWeek(props.initialDate)

watch(
  () => props.initialDate,
  (date) => {
    if (date) selectedDate.value = date
  },
)

const selectedCourtId = ref('')

watch([weekStart, weekEnd], ([from, to]) => {
  if (from && to) emit('range-change', { from, to })
}, { immediate: true })

watch(selectedDate, () => {
  selectedCourtId.value = ''
})

watch(
  () => props.courts,
  (courts) => {
    if (!courts?.some((c) => c.id === selectedCourtId.value)) selectedCourtId.value = ''
  },
)

const dayEvents = computed(() =>
  props.events
    .filter((e) => e.date === selectedDate.value)
    .sort((a, b) => a.startTime.localeCompare(b.startTime)),
)

const selectedCourtName = computed(() =>
  props.courts?.find((c) => c.id === selectedCourtId.value)?.name,
)

const filteredDayEvents = computed(() => {
  if (!selectedCourtName.value) return dayEvents.value
  const court = selectedCourtName.value
  return dayEvents.value.filter((e) => {
    if (e.type === 'slot') return e.title === court
    if (e.type === 'booking') return e.subtitle === court
    return true
  })
})

const showCourtFilter = computed(() => !props.hideCourtFilter && (props.courts?.length ?? 0) > 1)

const emptyMessage = computed(() => {
  if (selectedCourtId.value && dayEvents.value.length) {
    return t('schedule.noEventsForCourt', { date: formatDate(selectedDate.value) })
  }
  return t('schedule.noEvents', { date: formatDate(selectedDate.value) })
})

function typeLabel(event: ScheduleEvent) {
  if (event.type === 'class') return t('schedule.class')
  if (event.type === 'match') return t('matches.title')
  if (event.type === 'session') return t('schedule.coachSession')
  if (event.type === 'tournament') return t('tournaments.title')
  if (event.type === 'slot') return event.status === 'BLOCKED' ? t('schedule.blockedSlot') : t('schedule.openSlot')
  if (event.bookingSource === 'CLUB') return t('schedule.clubBooking')
  return t('schedule.platformBooking')
}

function isInteractiveSlot(event: ScheduleEvent) {
  return (props.bookable || props.allowSlotSelect) && event.type === 'slot' && !!event.slotId
}

function isNavigableEvent(event: ScheduleEvent) {
  return ['class', 'match', 'session', 'tournament', 'booking'].includes(event.type)
}

function isClickable(event: ScheduleEvent) {
  if (props.manageNotes) return true
  return isInteractiveSlot(event) || isNavigableEvent(event)
}

function onEventClick(event: ScheduleEvent) {
  if (props.manageNotes) {
    emit('manage-event', event)
    return
  }
  if (isInteractiveSlot(event)) emit('select-slot', event)
  else if (isNavigableEvent(event)) emit('select-event', event)
}

function eventTypeKey(event: ScheduleEvent): 'platform' | 'club' | 'slot' | 'class' | 'match' | 'session' | 'tournament' {
  if (event.type === 'class') return 'class'
  if (event.type === 'match') return 'match'
  if (event.type === 'session') return 'session'
  if (event.type === 'tournament') return 'tournament'
  if (event.type === 'slot') return 'slot'
  if (event.bookingSource === 'CLUB') return 'club'
  return 'platform'
}

const scheduleTypeStyles = {
  platform: {
    card: 'border-s-[5px] border-brand-orange bg-brand-orange/[0.16] ring-brand-orange/35',
    badge: 'orange' as const,
    legend: 'bg-brand-orange text-brand-primary',
  },
  club: {
    card: 'border-s-[5px] border-brand-blue bg-brand-blue/[0.16] ring-brand-blue/35',
    badge: 'blue' as const,
    legend: 'bg-brand-blue text-white',
  },
  slot: {
    card: 'border-s-[5px] border-brand-gray-500 bg-brand-gray-100 ring-brand-gray-400/40',
    badge: 'gray' as const,
    legend: 'bg-brand-gray-600 text-white',
  },
  class: {
    card: 'border-s-[5px] border-brand-indigo bg-brand-indigo/[0.16] ring-brand-indigo/35',
    badge: 'indigo' as const,
    legend: 'bg-brand-indigo text-white',
  },
  match: {
    card: 'border-s-[5px] border-brand-purple bg-brand-purple/[0.16] ring-brand-purple/35',
    badge: 'purple' as const,
    legend: 'bg-brand-purple text-white',
  },
  session: {
    card: 'border-s-[5px] border-brand-indigo bg-brand-indigo/[0.16] ring-brand-indigo/35',
    badge: 'indigo' as const,
    legend: 'bg-brand-indigo text-white',
  },
  tournament: {
    card: 'border-s-[5px] border-brand-orange bg-brand-orange/[0.16] ring-brand-orange/35',
    badge: 'orange' as const,
    legend: 'bg-brand-orange text-brand-primary',
  },
} as const

const scheduleLegend = computed(() => {
  const items = [
    { key: 'platform' as const, label: t('schedule.platformBooking') },
    { key: 'club' as const, label: t('schedule.clubBooking') },
    { key: 'slot' as const, label: t('schedule.openSlot') },
    { key: 'class' as const, label: t('schedule.class') },
    { key: 'match' as const, label: t('matches.title') },
    { key: 'session' as const, label: t('schedule.coachSession') },
    { key: 'tournament' as const, label: t('tournaments.title') },
  ]
  const present = new Set(props.events.map((e) => eventTypeKey(e)))
  return items.filter((item) => present.has(item.key))
})

function eventCardClass(event: ScheduleEvent) {
  const typeStyle = scheduleTypeStyles[eventTypeKey(event)].card
  const interactive = isClickable(event)
    ? 'cursor-pointer tap-highlight hover:-translate-y-0.5'
    : ''
  const selected = props.selectedSlotId && event.slotId === props.selectedSlotId
    ? props.variant === 'dashboard'
      ? 'ring-[3px] ring-fd-navy ring-offset-2 shadow-fd scale-[1.02] z-10'
      : '!ring-[3px] !ring-brand-orange !ring-offset-2 scale-[1.02] shadow-lifted z-10'
    : ''

  if (props.variant === 'dashboard') {
    return [
      typeStyle,
      'hover:shadow-fd hover:-translate-y-0.5',
      interactive,
      selected,
    ]
  }

  return [
    typeStyle,
    'ring-black/5 shadow-card hover:shadow-card',
    interactive,
    selected,
  ]
}

function eventTitleClass() {
  return props.variant === 'dashboard' ? 'text-fd-navy' : 'text-brand-gray-900'
}

function eventMetaClass() {
  return props.variant === 'dashboard' ? 'text-fd-muted' : 'text-brand-gray-500'
}

function eventPriceClass() {
  return props.variant === 'dashboard' ? 'text-fd-primary' : 'text-brand-orange'
}

function eventTimeClass() {
  return props.variant === 'dashboard' ? 'text-fd-navy' : 'text-brand-gray-900'
}

function badgeTone(event: ScheduleEvent) {
  return scheduleTypeStyles[eventTypeKey(event)].badge
}

function dayButtonClass(day: string) {
  const isSelected = selectedDate.value === day
  const today = isToday(day)

  if (props.variant === 'dashboard') {
    if (isSelected) return 'bg-fd-primary text-white shadow-fd-soft'
    if (today) return 'bg-fd-primary/10 text-fd-primary ring-1 ring-fd-primary/30'
    return 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft'
  }

  if (isSelected) return 'bg-brand-orange text-brand-primary shadow-card'
  if (today) return 'bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange/30'
  return 'bg-white text-brand-gray-700 shadow-card'
}

function dayDotClass(day: string) {
  const isSelected = selectedDate.value === day
  if (props.variant === 'dashboard') {
    return isSelected ? 'bg-white/80' : 'bg-fd-primary'
  }
  return isSelected ? 'bg-white/80' : 'bg-brand-orange'
}

function navBtnClass() {
  return props.variant === 'dashboard'
    ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-fd-primary-soft text-fd-primary tap-highlight hover:bg-fd-primary/15'
    : 'rounded-xl bg-brand-gray-100 p-2 tap-highlight'
}

function courtChipClass(active: boolean) {
  if (props.variant === 'dashboard') {
    return active
      ? 'bg-fd-primary text-white shadow-fd-soft'
      : 'bg-[#F5F5F4] text-fd-navy shadow-fd-soft hover:bg-fd-primary/10'
  }
  return active
    ? 'bg-brand-orange text-brand-primary shadow-card'
    : 'bg-white text-brand-gray-700 shadow-card hover:bg-brand-gray-50'
}
</script>

<template>
  <div :class="variant === 'dashboard' ? 'fd-card p-4 sm:p-5' : ''" class="space-y-4">
    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
      <button type="button" :class="navBtnClass()" :aria-label="t('schedule.prevWeek')" @click="prevWeek">
        <SzIcon :name="isRtl ? 'chevron-end' : 'chevron-start'" />
      </button>
      <span
        class="min-w-[8rem] flex-1 text-center text-sm font-bold sm:flex-none"
        :class="variant === 'dashboard' ? 'text-fd-navy' : 'text-brand-gray-800'"
      >
        {{ weekLabel }}
      </span>
      <button type="button" :class="navBtnClass()" :aria-label="t('schedule.nextWeek')" @click="nextWeek">
        <SzIcon :name="isRtl ? 'chevron-start' : 'chevron-end'" />
      </button>
      <SzButton
        variant="ghost"
        size="sm"
        :class="variant === 'dashboard' ? 'ms-auto' : ''"
        @click="goToday"
      >
        {{ t('schedule.today') }}
      </SzButton>
    </div>

    <div
      class="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory sm:mx-0 sm:gap-2"
      :class="compact ? 'snap-none' : 'sm:grid sm:grid-cols-7 sm:overflow-visible sm:snap-none'"
    >
      <button
        v-for="day in weekDays"
        :key="day"
        type="button"
        class="flex min-w-[3.25rem] shrink-0 snap-center flex-col items-center rounded-xl px-2 py-2 text-center transition tap-highlight sm:min-w-0 sm:px-2"
        :class="dayButtonClass(day)"
        @click="selectedDate = day"
      >
        <span class="text-[0.65rem] font-semibold opacity-80 sm:text-xs">{{ dayLabel(day) }}</span>
        <span class="text-base font-black sm:text-lg">{{ dayNumber(day) }}</span>
        <span
          v-if="events.some((e) => e.date === day)"
          class="mt-1 h-1 w-1 rounded-full"
          :class="dayDotClass(day)"
        />
      </button>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-sm font-bold" :class="variant === 'dashboard' ? 'text-fd-navy' : 'text-brand-gray-800'">
          {{ formatDate(selectedDate) }}
        </p>
        <span
          v-if="filteredDayEvents.length"
          class="rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="variant === 'dashboard' ? 'bg-fd-primary-soft text-fd-primary' : 'bg-brand-gray-100 text-brand-gray-600'"
        >
          {{ t('schedule.eventsCount', { count: filteredDayEvents.length }) }}
        </span>
      </div>
      <div v-if="!compact" class="flex flex-wrap gap-2">
        <span
          v-for="item in scheduleLegend"
          :key="item.key"
          class="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[0.7rem] font-bold shadow-sm"
          :class="scheduleTypeStyles[item.key].legend"
        >
          <span class="h-2.5 w-2.5 rounded-full bg-white/90 ring-1 ring-black/10" />
          {{ item.label }}
        </span>
      </div>
    </div>

    <div v-if="showCourtFilter" class="space-y-2">
      <p class="text-xs font-semibold" :class="variant === 'dashboard' ? 'text-fd-muted' : 'text-brand-gray-500'">
        {{ t('schedule.filterByCourt') }}
      </p>
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          class="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition tap-highlight"
          :class="courtChipClass(!selectedCourtId)"
          @click="selectedCourtId = ''"
        >
          {{ t('schedule.allCourts') }}
        </button>
        <button
          v-for="court in courts"
          :key="court.id"
          type="button"
          class="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition tap-highlight"
          :class="courtChipClass(selectedCourtId === court.id)"
          @click="selectedCourtId = court.id"
        >
          {{ court.name }}
        </button>
      </div>
    </div>

    <div
      v-if="bookable && !scheduleHintDismissed"
      class="flex items-start justify-between gap-3 rounded-xl border border-brand-green/25 bg-brand-green/10 px-4 py-3 text-sm text-brand-gray-800"
    >
      <p>{{ t('schedule.bookingHint') }}</p>
      <button
        type="button"
        class="shrink-0 text-xs font-bold text-brand-gray-500 tap-highlight hover:text-brand-gray-800"
        :aria-label="t('common.close')"
        @click="dismissScheduleHint"
      >
        ✕
      </button>
    </div>

    <p v-if="bookable && scheduleHintDismissed" :class="variant === 'dashboard' ? 'text-sm text-fd-muted' : 'ios-footnote'">{{ t('schedule.tapToBook') }}</p>
    <p v-else-if="allowSlotSelect" :class="variant === 'dashboard' ? 'text-sm text-fd-muted' : 'ios-footnote'">{{ t('schedule.tapToAssign') }}</p>
    <p v-else-if="manageNotes" :class="variant === 'dashboard' ? 'text-sm text-fd-muted' : 'ios-footnote'">{{ t('schedule.tapToComment') }}</p>

    <div
      v-if="loading"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      :aria-label="t('common.loading')"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="min-h-[10rem] animate-pulse rounded-2xl"
        :class="variant === 'dashboard' ? 'bg-[#F5F5F4]' : 'bg-brand-gray-100'"
      />
    </div>

    <div
      v-else-if="filteredDayEvents.length"
      class="schedule-events-scroll overflow-y-auto overscroll-contain"
      :class="compact ? 'max-h-[min(16rem,38vh)]' : 'max-h-[min(36rem,62dvh)] sm:max-h-[min(40rem,68dvh)]'"
    >
      <div
        class="gap-2 p-1"
        :class="compact ? 'flex flex-col' : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'"
      >
        <component
          :is="isClickable(event) ? 'button' : 'div'"
          v-for="event in filteredDayEvents"
          :key="event.id"
          :type="isClickable(event) ? 'button' : undefined"
          class="schedule-slot-card group overflow-hidden rounded-2xl text-start ring-1 transition"
          :class="[
            compact
              ? 'flex w-full items-center gap-3 p-3'
              : 'flex min-h-[10rem] flex-col',
            eventCardClass(event),
            variant === 'dashboard' ? 'shadow-fd-soft' : 'bg-white shadow-card ring-black/5',
          ]"
          @click="onEventClick(event)"
        >
          <template v-if="compact">
            <div class="shrink-0 text-start" dir="ltr">
              <p class="text-lg font-black leading-none tabular-nums" :class="eventTimeClass()">
                {{ formatTime(event.startTime) }}
              </p>
              <p class="mt-1 text-[0.7rem] font-medium tabular-nums" :class="eventMetaClass()">
                {{ formatTimeRange(event.startTime, event.endTime) }}
              </p>
            </div>
            <div class="min-w-0 flex-1 text-start">
              <p class="truncate text-sm font-bold" :class="eventTitleClass()">
                {{ event.title }}
              </p>
              <p class="mt-1 text-[0.65rem]" :class="eventMetaClass()">
                {{ eventDurationLabel(event.startTime, event.endTime) }}
              </p>
              <p v-if="event.note" class="mt-1 line-clamp-1 text-[0.65rem] italic" :class="eventMetaClass()">
                💬 {{ event.note }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <span
                v-if="event.price != null && event.type !== 'booking'"
                class="text-sm font-bold tabular-nums"
                :class="eventPriceClass()"
                dir="ltr"
              >
                {{ formatPrice(event.price) }}
              </span>
              <SzBadge :tone="badgeTone(event)" :soft="false" class="text-[0.6rem]">
                {{ typeLabel(event) }}
              </SzBadge>
            </div>
          </template>
          <div v-else class="flex flex-1 flex-col p-4">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[1.65rem] font-black leading-none tabular-nums tracking-tight" :class="eventTimeClass()" dir="ltr">
                  {{ formatTime(event.startTime) }}
                </p>
                <p class="mt-1.5 text-xs font-medium tabular-nums" :class="eventMetaClass()" dir="ltr">
                  {{ formatTimeRange(event.startTime, event.endTime) }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-lg px-2 py-1 text-[0.65rem] font-bold"
                :class="variant === 'dashboard' ? 'bg-white/80 text-fd-navy ring-1 ring-black/5' : 'bg-white/90 text-brand-gray-800 ring-1 ring-black/5'"
              >
                {{ eventDurationLabel(event.startTime, event.endTime) }}
              </span>
            </div>

            <p class="text-[0.95rem] font-bold leading-snug" :class="eventTitleClass()">
              {{ event.title }}
            </p>

            <p v-if="event.subtitle && event.type !== 'slot'" class="mt-1 truncate text-xs" :class="eventMetaClass()">
              {{ event.subtitle }}
            </p>

            <p v-if="event.note" class="mt-2 line-clamp-2 text-xs italic" :class="eventMetaClass()">
              💬 {{ event.note }}
            </p>

            <div class="mt-auto flex items-center justify-between gap-2 pt-3">
              <SzBadge :tone="badgeTone(event)" :soft="false" class="text-[0.65rem]">
                {{ typeLabel(event) }}
              </SzBadge>
              <span
                v-if="event.price != null && event.type !== 'booking'"
                class="text-sm font-bold tabular-nums"
                :class="eventPriceClass()"
                dir="ltr"
              >
                {{ formatPrice(event.price) }}
              </span>
            </div>
          </div>
        </component>
      </div>
    </div>

    <div v-else class="rounded-ios-lg border border-dashed border-brand-gray-200 bg-white/60 px-6 py-10 text-center">
      <p class="ios-footnote max-w-sm mx-auto">{{ emptyMessage }}</p>
      <div v-if="bookable || allowSlotSelect" class="mt-4 flex flex-wrap justify-center gap-2">
        <SzButton size="sm" variant="secondary" @click="goToday">{{ t('schedule.goToday') }}</SzButton>
        <SzButton size="sm" variant="ghost" @click="nextWeek">{{ t('schedule.tryNextWeek') }}</SzButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-events-scroll {
  padding: 2px;
  scrollbar-gutter: stable;
}

.schedule-slot-card:focus-visible {
  outline: 2px solid rgba(67, 24, 255, 0.35);
  outline-offset: 2px;
}
</style>
