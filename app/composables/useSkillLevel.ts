export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'

export function useSkillLevel() {
  const { t } = useI18n()

  const levels: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO']

  function levelLabel(level: SkillLevel) {
    return t(`levels.${level.toLowerCase()}`)
  }

  return { levels, levelLabel }
}
