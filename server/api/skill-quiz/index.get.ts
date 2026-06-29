import { quizQuestionsForClient } from '../../shared/skillQuiz'

export default defineEventHandler(() => {
  return quizQuestionsForClient()
})
