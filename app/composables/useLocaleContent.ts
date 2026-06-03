export function useLocaleContent() {
  const { locale } = useI18n()

  function localized(fa: string, en: string) {
    return locale.value === 'fa' ? fa : en
  }

  function pickName(entity: { nameFa: string; nameEn: string }) {
    return locale.value === 'fa' ? entity.nameFa : entity.nameEn
  }

  function formatPrice(amount: number) {
    const nf = locale.value === 'fa'
      ? new Intl.NumberFormat('fa-IR')
      : new Intl.NumberFormat('en-US')
    return nf.format(amount)
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
