import { describe, expect, it } from 'vitest'
import { hasChartFields } from '../shared/dashboardCharts'
import { userDisplayName } from '../shared/userDisplayName'

describe('hasChartFields', () => {
  it('passes when all athlete fields exist', () => {
    const body = {
      labels: [],
      spending: [],
      bookingTrend: [],
      classTrend: [],
      matchTrend: [],
      breakdown: [],
    }
    expect(hasChartFields('ATHLETE', body).ok).toBe(true)
  })

  it('fails when platform admin fields are missing', () => {
    const result = hasChartFields('PLATFORM_ADMIN', { labels: [], users: [] })
    expect(result.ok).toBe(false)
    expect(result.detail).toContain('clubs')
  })
})

describe('userDisplayName', () => {
  it('returns English name on en locale', () => {
    expect(userDisplayName({ name: 'مدیر', nameEn: 'Admin' }, 'en')).toBe('Admin')
  })

  it('falls back to Persian name when nameEn missing', () => {
    expect(userDisplayName({ name: 'آرش' }, 'en')).toBe('آرش')
  })

  it('returns Persian name on fa locale', () => {
    expect(userDisplayName({ name: 'آرش', nameEn: 'Arash' }, 'fa')).toBe('آرش')
  })
})
