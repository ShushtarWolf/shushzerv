import type { ClassSession } from '~/types'
import type { SkillLevel } from '~/composables/useSkillLevel'
import { isAdvancedTier, isBeginnerTier } from '#shared/classSession'

export function useClassSession() {
  const { t } = useI18n()
  const { levelLabel } = useSkillLevel()

  function classTypeLabel(type: ClassSession['classType']) {
    return type === 'SEMI_PRIVATE' ? t('classes.semiPrivate') : t('classes.group')
  }

  function genderPolicyLabel(policy: ClassSession['genderPolicy']) {
    const map: Record<ClassSession['genderPolicy'], string> = {
      MEN: t('dashboard.genderMen'),
      WOMEN: t('dashboard.genderWomen'),
      FAMILY: t('dashboard.genderFamily'),
      MIXED: t('dashboard.genderMixed'),
    }
    return map[policy]
  }

  function userGenderLabel(gender: 'MALE' | 'FEMALE' | null | undefined) {
    if (gender === 'MALE') return t('profile.genderMale')
    if (gender === 'FEMALE') return t('profile.genderFemale')
    return '—'
  }

  function tierLabel(minLevel: SkillLevel, maxLevel: SkillLevel) {
    if (isBeginnerTier(minLevel, maxLevel)) return t('classes.tierBeginner')
    if (isAdvancedTier(minLevel, maxLevel)) return t('classes.tierAdvanced')
    return `${levelLabel(minLevel)} – ${levelLabel(maxLevel)}`
  }

  function classGroupLabel(cls: Pick<ClassSession, 'genderPolicy' | 'minLevel' | 'maxLevel'>) {
    return `${genderPolicyLabel(cls.genderPolicy)} · ${tierLabel(cls.minLevel, cls.maxLevel)}`
  }

  function levelRangeLabel(minLevel: SkillLevel, maxLevel: SkillLevel) {
    return `${levelLabel(minLevel)} – ${levelLabel(maxLevel)}`
  }

  return {
    classTypeLabel,
    genderPolicyLabel,
    userGenderLabel,
    tierLabel,
    classGroupLabel,
    levelRangeLabel,
  }
}
