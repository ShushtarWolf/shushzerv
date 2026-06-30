import { describe, expect, it } from 'vitest'
import {
  genderMatchesClassPolicy,
  isAdvancedTier,
  isBeginnerTier,
  skillLevelInRange,
  userInitials,
  validateClassMaxSeats,
} from '../shared/classSession'

describe('classSession utils', () => {
  it('userInitials returns first and last initial', () => {
    expect(userInitials('Ali Rezaei')).toBe('AR')
    expect(userInitials('Sara')).toBe('SA')
  })

  it('userInitials uses given-name graphemes for Persian names', () => {
    expect(userInitials('آرش ورزشکار')).toBe('آر')
    expect(userInitials('پریسا کریمی')).toBe('پر')
  })

  it('skillLevelInRange checks bounds', () => {
    expect(skillLevelInRange('INTERMEDIATE', 'BEGINNER', 'ADVANCED')).toBe(true)
    expect(skillLevelInRange('PRO', 'BEGINNER', 'INTERMEDIATE')).toBe(false)
  })

  it('genderMatchesClassPolicy enforces men/women/mixed', () => {
    expect(genderMatchesClassPolicy('MALE', 'MEN')).toBe(true)
    expect(genderMatchesClassPolicy('FEMALE', 'MEN')).toBe(false)
    expect(genderMatchesClassPolicy('FEMALE', 'MIXED')).toBe(true)
  })

  it('validateClassMaxSeats by type', () => {
    expect(validateClassMaxSeats('SEMI_PRIVATE', 3)).toBe(true)
    expect(validateClassMaxSeats('SEMI_PRIVATE', 8)).toBe(false)
    expect(validateClassMaxSeats('GROUP', 12)).toBe(true)
  })

  it('tier helpers', () => {
    expect(isBeginnerTier('BEGINNER', 'INTERMEDIATE')).toBe(true)
    expect(isAdvancedTier('ADVANCED', 'PRO')).toBe(true)
  })
})
