export function useLocaleContent() {
  const { locale } = useI18n()

  function localized(fa: string, en: string) {
    return locale.value === 'fa' ? fa : en
  }

  function formatPrice(amount: number) {
    if (locale.value === 'fa') {
      return new Intl.NumberFormat('fa-IR').format(amount)
    }
    return new Intl.NumberFormat('en-US').format(amount)
  }

  function pickName(obj: { nameFa: string; nameEn: string }) {
    return localized(obj.nameFa, obj.nameEn)
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d)
  }

  return { locale, localized, pickName, formatPrice, formatDate }
}
