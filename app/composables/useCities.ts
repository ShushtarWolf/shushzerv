const CITY_KEYS: Record<string, string> = {
  'تهران': 'tehran',
  'اصفهان': 'isfahan',
  'شیراز': 'shiraz',
  'مشهد': 'mashhad',
  'تبریز': 'tabriz',
}

export const CITY_VALUES = Object.keys(CITY_KEYS)
export const DEFAULT_CITY = CITY_VALUES[0]!

export function useCities() {
  const { t } = useI18n()

  const cities = computed(() =>
    CITY_VALUES.map((value) => ({
      value,
      label: t(`cities.${CITY_KEYS[value]}`),
    })),
  )

  function cityLabel(city: string) {
    const key = CITY_KEYS[city]
    return key ? t(`cities.${key}`) : city
  }

  return { cities, cityLabel }
}
