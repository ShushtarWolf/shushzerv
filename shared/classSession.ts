import type { ClassType, GenderPolicy, SkillLevel, UserGender } from '@prisma/client'

export const SKILL_LEVEL_ORDER: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']

export function skillLevelInRange(level: SkillLevel, min: SkillLevel, max: SkillLevel) {
  return SKILL_LEVEL_ORDER.indexOf(level) >= SKILL_LEVEL_ORDER.indexOf(min)
    && SKILL_LEVEL_ORDER.indexOf(level) <= SKILL_LEVEL_ORDER.indexOf(max)
}

export function genderMatchesClassPolicy(gender: UserGender | null | undefined, policy: GenderPolicy) {
  if (policy === 'MIXED' || policy === 'FAMILY') return true
  if (!gender) return false
  if (policy === 'MEN') return gender === 'MALE'
  if (policy === 'WOMEN') return gender === 'FEMALE'
  return false
}

export function validateClassMaxSeats(classType: ClassType, maxSeats: number) {
  if (classType === 'SEMI_PRIVATE') return maxSeats >= 2 && maxSeats <= 4
  return maxSeats >= 5
}

export function defaultMaxSeatsForType(classType: ClassType) {
  return classType === 'SEMI_PRIVATE' ? 3 : 12
}

const ARABIC_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F]/

function graphemes(text: string) {
  return [...text.replace(/\u200c/g, '')]
}

export function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const given = parts[0]!
  if (ARABIC_SCRIPT_RE.test(given)) {
    const chars = graphemes(given)
    return chars.slice(0, 2).join('') || '?'
  }
  if (parts.length === 1) return given.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

export function isBeginnerTier(minLevel: SkillLevel, maxLevel: SkillLevel) {
  return minLevel === 'BEGINNER' && maxLevel === 'INTERMEDIATE'
}

export function isAdvancedTier(minLevel: SkillLevel, maxLevel: SkillLevel) {
  return minLevel === 'ADVANCED' && maxLevel === 'PRO'
}

export type ClassParticipantView = {
  initials: string
  level: SkillLevel
  gender: UserGender | null
}

export function toClassParticipantView(user: {
  name: string
  gender?: UserGender | null
  athleteProfile?: { level: SkillLevel } | null
}): ClassParticipantView {
  return {
    initials: userInitials(user.name),
    level: user.athleteProfile?.level ?? 'BEGINNER',
    gender: user.gender ?? null,
  }
}
