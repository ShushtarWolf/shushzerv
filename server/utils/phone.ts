/** Normalize Iranian mobile numbers to 989XXXXXXXXX (12 digits). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('98') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 11) return `98${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('9')) return `98${digits}`
  return digits
}

/** Common stored formats for the same normalized Iranian mobile. */
export function phoneLookupVariants(normalized: string): string[] {
  if (!normalized) return []
  const variants = new Set<string>([normalized])
  if (normalized.startsWith('98') && normalized.length === 12) {
    variants.add(`0${normalized.slice(2)}`)
    variants.add(`+${normalized}`)
    variants.add(normalized.slice(2))
  }
  return [...variants]
}

export function isValidIranMobile(normalized: string): boolean {
  return /^989\d{9}$/.test(normalized)
}
