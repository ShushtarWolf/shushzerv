import { describe, expect, it } from 'vitest'
import { scoreQuizAnswers, scoreToLevel, levelToScore } from '../shared/skillQuiz'

describe('skillQuiz', () => {
  it('scores beginner answers low', () => {
    const level = scoreQuizAnswers({
      experience: 'exp-0',
      frequency: 'freq-0',
      competition: 'comp-0',
      technique: 'tech-0',
      self: 'self-0',
    })
    expect(level).toBe('BEGINNER')
  })

  it('scores advanced answers high', () => {
    const level = scoreQuizAnswers({
      experience: 'exp-3',
      frequency: 'freq-3',
      competition: 'comp-3',
      technique: 'tech-3',
      self: 'self-3',
    })
    expect(level).toBe('PRO')
  })

  it('converts levels to scores and back', () => {
    expect(levelToScore('INTERMEDIATE')).toBe(1)
    expect(scoreToLevel(2.4)).toBe('ADVANCED')
  })
})
