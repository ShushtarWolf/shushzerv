export function useLocaleContent() {
  const { locale } = useI18n()

  function localized(fa: string, en: string) {
    return locale.value === 'fa' ? fa : en
  }

  function numberLocale() {
    return locale.value === 'fa' ? 'fa-IR' : 'en-US'
  }

  function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
    return new Intl.NumberFormat(numberLocale(), options).format(value)
  }

  function formatPrice(amount: number) {
    return formatNumber(amount)
  }

  function formatDecimal(value: number, decimals = 1) {
    return formatNumber(value, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  function formatRating(value: number) {
    return formatDecimal(value, 1)
  }

  function formatFraction(numerator: number, denominator: number) {
    return `${formatNumber(numerator)}/${formatNumber(denominator)}`
  }

  function formatTime(time: string) {
    if (locale.value !== 'fa') return time
    return time.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)
  }

  function formatTimeRange(start: string, end: string) {
    return `${formatTime(start)} – ${formatTime(end)}`
  }

  function pickName(obj: { nameFa: string; nameEn: string }) {
    return localized(obj.nameFa, obj.nameEn)
  }

  function parseLocalDate(iso: string) {
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return new Date(NaN)
    return new Date(y, m - 1, d)
  }

  function localDateISO(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  function formatDate(iso: string) {
    const d = parseLocalDate(iso)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(numberLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d)
  }

  return {
    locale,
    localized,
    pickName,
    formatNumber,
    formatPrice,
    formatDecimal,
    formatRating,
    formatFraction,
    formatTime,
    formatTimeRange,
    formatDate,
    localDateISO,
    parseLocalDate,
  }
}
