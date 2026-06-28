import type { ClassPackage } from '~/types'

const WEEKDAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
type WeekdayCode = (typeof WEEKDAY_CODES)[number]

function toggleDayOfWeek(current: string, code: WeekdayCode): string {
  const set = new Set(current.split(',').map((d) => d.trim()).filter(Boolean))
  if (set.has(code)) set.delete(code)
  else set.add(code)
  const ordered = WEEKDAY_CODES.filter((c) => set.has(c))
  return ordered.length ? ordered.join(',') : code
}

function isDaySelected(current: string, code: WeekdayCode): boolean {
  return current.split(',').map((d) => d.trim()).includes(code)
}

export function defaultPackageForm() {
  return {
    titleFa: '',
    titleEn: '',
    descFa: '',
    descEn: '',
    sportId: '',
    coachId: '',
    clubId: '',
    price: 800_000,
    sessionsPerWeek: 1,
    durationWeeks: 4,
    classType: 'GROUP' as 'GROUP' | 'SEMI_PRIVATE',
    groupMode: 'OPEN' as 'OPEN' | 'WITH_STUDENTS',
    genderPolicy: 'MIXED' as 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED',
    minLevel: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
    maxLevel: 'PRO' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO',
    maxSeats: 12,
    daysOfWeek: 'SAT',
    startTime: '10:00',
    endTime: '11:00',
    featured: false,
    studentEmails: '',
  }
}

export function useClassPackage() {
  const { t } = useI18n()
  const { formatTimeRange } = useLocaleContent()
  const { classTypeLabel, classGroupLabel } = useClassSession()

  const weekdayOptions = computed(() => [
    { value: 'SAT', label: t('packages.days.sat') },
    { value: 'SUN', label: t('packages.days.sun') },
    { value: 'MON', label: t('packages.days.mon') },
    { value: 'TUE', label: t('packages.days.tue') },
    { value: 'WED', label: t('packages.days.wed') },
    { value: 'THU', label: t('packages.days.thu') },
    { value: 'FRI', label: t('packages.days.fri') },
  ])

  function weekdayLabel(code: string) {
    const map: Record<string, string> = {
      MON: t('packages.days.mon'),
      TUE: t('packages.days.tue'),
      WED: t('packages.days.wed'),
      THU: t('packages.days.thu'),
      FRI: t('packages.days.fri'),
      SAT: t('packages.days.sat'),
      SUN: t('packages.days.sun'),
    }
    return map[code] ?? code
  }

  function daysLabel(daysOfWeek: string) {
    return daysOfWeek.split(',').map((d) => weekdayLabel(d.trim())).join(' · ')
  }

  function scheduleLabel(pkg: Pick<ClassPackage, 'daysOfWeek' | 'startTime' | 'endTime'>) {
    return `${daysLabel(pkg.daysOfWeek)} · ${formatTimeRange(pkg.startTime, pkg.endTime)}`
  }

  function frequencyLabel(sessionsPerWeek: number) {
    if (sessionsPerWeek === 1) return t('packages.weeklyOne')
    return t('packages.weeklyMany', { n: sessionsPerWeek })
  }

  function durationLabel(weeks: number) {
    return t('packages.durationWeeks', { n: weeks })
  }

  function packageSummary(pkg: ClassPackage) {
    return `${frequencyLabel(pkg.sessionsPerWeek)} · ${durationLabel(pkg.durationWeeks)}`
  }

  function groupModeLabel(mode: ClassPackage['groupMode']) {
    return mode === 'WITH_STUDENTS' ? t('packages.withStudents') : t('packages.withoutStudents')
  }

  function isGroupReservation(pkg: Pick<ClassPackage, 'classType'>) {
    return pkg.classType === 'GROUP'
  }

  function toggleDay(current: string, code: string) {
    return toggleDayOfWeek(current, code as WeekdayCode)
  }

  function daySelected(current: string, code: string) {
    return isDaySelected(current, code as WeekdayCode)
  }

  return {
    weekdayOptions,
    weekdayLabel,
    daysLabel,
    scheduleLabel,
    frequencyLabel,
    durationLabel,
    packageSummary,
    groupModeLabel,
    isGroupReservation,
    classTypeLabel,
    classGroupLabel,
    toggleDay,
    daySelected,
    defaultPackageForm,
  }
}
