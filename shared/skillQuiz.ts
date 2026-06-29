import type { SkillLevel } from '@prisma/client'
import { SKILL_LEVEL_ORDER } from './classSession'

export type SkillQuizOption = {
  id: string
  textFa: string
  textEn: string
  score: number
}

export type SkillQuizQuestion = {
  id: string
  textFa: string
  textEn: string
  options: SkillQuizOption[]
}

/** Generic experience-based questions — work for any sport. */
export const SKILL_QUIZ_QUESTIONS: SkillQuizQuestion[] = [
  {
    id: 'experience',
    textFa: 'چند وقت است که این ورزش را انجام می‌دهید؟',
    textEn: 'How long have you been playing this sport?',
    options: [
      { id: 'exp-0', textFa: 'تازه شروع کرده‌ام', textEn: 'Just started', score: 0 },
      { id: 'exp-1', textFa: 'کمتر از ۶ ماه', textEn: 'Less than 6 months', score: 1 },
      { id: 'exp-2', textFa: '۶ ماه تا ۲ سال', textEn: '6 months to 2 years', score: 2 },
      { id: 'exp-3', textFa: 'بیش از ۲ سال', textEn: 'More than 2 years', score: 3 },
    ],
  },
  {
    id: 'frequency',
    textFa: 'هفته‌ای چند بار تمرین یا بازی می‌کنید؟',
    textEn: 'How often do you train or play per week?',
    options: [
      { id: 'freq-0', textFa: 'کمتر از یک بار', textEn: 'Less than once', score: 0 },
      { id: 'freq-1', textFa: '۱–۲ بار', textEn: '1–2 times', score: 1 },
      { id: 'freq-2', textFa: '۳–۴ بار', textEn: '3–4 times', score: 2 },
      { id: 'freq-3', textFa: '۵ بار یا بیشتر', textEn: '5+ times', score: 3 },
    ],
  },
  {
    id: 'competition',
    textFa: 'سطح رقابت‌هایی که در آن شرکت می‌کنید چیست؟',
    textEn: 'What level of competition do you play in?',
    options: [
      { id: 'comp-0', textFa: 'فقط تفریحی / با دوستان', textEn: 'Casual / with friends only', score: 0 },
      { id: 'comp-1', textFa: 'کلاس‌های گروهی یا باشگاهی', textEn: 'Group classes or club play', score: 1 },
      { id: 'comp-2', textFa: 'مسابقات محلی یا لیگ باشگاه', textEn: 'Local tournaments or club league', score: 2 },
      { id: 'comp-3', textFa: 'مسابقات استانی یا حرفه‌ای', textEn: 'Regional or professional events', score: 3 },
    ],
  },
  {
    id: 'technique',
    textFa: 'مهارت فنی شما در این ورزش را چطور ارزیابی می‌کنید؟',
    textEn: 'How would you rate your technical skill?',
    options: [
      { id: 'tech-0', textFa: 'هنوز اصول اولیه را یاد می‌گیرم', textEn: 'Still learning the basics', score: 0 },
      { id: 'tech-1', textFa: 'حرکات پایه را بلدم', textEn: 'I know the basic moves', score: 1 },
      { id: 'tech-2', textFa: 'تکنیک‌های پیشرفته را می‌شناسم', textEn: 'I know advanced techniques', score: 2 },
      { id: 'tech-3', textFa: 'تکنیک کامل و رقابتی دارم', textEn: 'Competition-ready technique', score: 3 },
    ],
  },
  {
    id: 'self',
    textFa: 'در مقایسه با دیگران در باشگاه، سطح شما کجاست؟',
    textEn: 'Compared to others at your club, where do you stand?',
    options: [
      { id: 'self-0', textFa: 'مبتدی — تازه‌کارترین‌ها', textEn: 'Beginner — among the newest', score: 0 },
      { id: 'self-1', textFa: 'پایین‌تر از میانگین', textEn: 'Below average', score: 1 },
      { id: 'self-2', textFa: 'بالای میانگین', textEn: 'Above average', score: 2 },
      { id: 'self-3', textFa: 'از بهترین‌های باشگاه', textEn: 'Among the best at my club', score: 3 },
    ],
  },
]

export function quizQuestionsForClient() {
  return SKILL_QUIZ_QUESTIONS.map(({ id, textFa, textEn, options }) => ({
    id,
    textFa,
    textEn,
    options: options.map(({ id: optId, textFa: fa, textEn: en }) => ({ id: optId, textFa: fa, textEn: en })),
  }))
}

export function scoreQuizAnswers(answers: Record<string, string>): SkillLevel {
  let total = 0
  let count = 0
  for (const q of SKILL_QUIZ_QUESTIONS) {
    const optionId = answers[q.id]
    if (!optionId) continue
    const opt = q.options.find((o) => o.id === optionId)
    if (opt) {
      total += opt.score
      count += 1
    }
  }
  if (!count) return 'BEGINNER'
  const avg = total / count
  const idx = Math.min(SKILL_LEVEL_ORDER.length - 1, Math.round(avg))
  return SKILL_LEVEL_ORDER[idx]!
}

export function levelToScore(level: SkillLevel): number {
  return SKILL_LEVEL_ORDER.indexOf(level)
}

export function scoreToLevel(score: number): SkillLevel {
  const idx = Math.max(0, Math.min(SKILL_LEVEL_ORDER.length - 1, Math.round(score)))
  return SKILL_LEVEL_ORDER[idx]!
}
