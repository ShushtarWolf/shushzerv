export interface Sport {
  id: string
  slug: string
  nameFa: string
  nameEn: string
  icon: string
  color: string
  group: string
  courtCount?: number
}

export interface Court {
  id: string
  nameFa: string
  nameEn: string
  surface?: string | null
  sportId: string
  sport?: Sport
}

export interface Club {
  id: string
  slug: string
  nameFa: string
  nameEn: string
  addressFa: string
  addressEn: string
  city: string
  district?: string | null
  lat?: number | null
  lng?: number | null
  rating: number
  priceFrom: number
  discount?: number | null
  image?: string | null
  featured: boolean
  courts?: Court[]
}

export interface Coach {
  id: string
  nameFa: string
  nameEn: string
  city: string
  rating: number
  sessions: number
  bioFa?: string | null
  bioEn?: string | null
  sportId: string
  sport?: Sport
  userId?: string | null
}

export interface NewsArticle {
  id: string
  slug: string
  titleFa: string
  titleEn: string
  excerptFa: string
  excerptEn: string
  bodyFa: string
  bodyEn: string
  date: string
  sport?: Sport | null
}

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED'

export interface Slot {
  id: string
  date: string
  startTime: string
  endTime: string
  price: number
  status: SlotStatus
  courtId: string
  court?: Court & { club?: Club }
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export interface Booking {
  id: string
  status: BookingStatus
  paymentStatus: 'PAY_AT_CLUB' | 'PAID'
  createdAt: string
  slot?: Slot
}

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'

export interface AthleteProfile {
  id: string
  level: SkillLevel
  matchesPlayed: number
  wins: number
  xp: number
  sportId: string
  sport?: Sport
}

export interface UserBadge {
  id: string
  code: string
  earnedAt: string
}

export interface Review {
  id: string
  rating: number
  bodyFa: string
  bodyEn: string
  createdAt: string
  userId: string
  user?: { id: string; name: string }
  clubId?: string | null
  club?: Club | null
}

export interface ChatMessage {
  id: string
  body: string
  createdAt: string
  senderId: string
  sender?: { id: string; name: string }
}

export interface Conversation {
  id: string
  titleFa?: string | null
  titleEn?: string | null
  isGroup: boolean
  matchId?: string | null
  updatedAt: string
  members?: Array<{ userId: string; user?: { id: string; name: string } }>
  messages?: ChatMessage[]
  lastMessage?: ChatMessage | null
}

export interface ClassSession {
  id: string
  titleFa: string
  titleEn: string
  date: string
  startTime: string
  endTime: string
  price: number
  maxSeats: number
  bookedSeats: number
  status: 'OPEN' | 'FULL' | 'CANCELLED'
  clubId: string
  sportId: string
  coachId?: string | null
  club?: Club
  sport?: Sport
  coach?: Coach
  enrolled?: boolean
}

export interface OpenMatch {
  id: string
  city: string
  date: string
  startTime: string
  maxPlayers: number
  joinedCount: number
  minLevel: SkillLevel
  maxLevel: SkillLevel
  status: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED'
  notesFa?: string | null
  notesEn?: string | null
  shareToken?: string | null
  sportId: string
  clubId?: string | null
  creatorId: string
  sport?: Sport
  club?: Club | null
  creator?: { id: string; name: string }
  joined?: boolean
}

export interface TrainingPlan {
  id: string
  titleFa: string
  titleEn: string
  bodyFa: string
  bodyEn: string
  coachId: string
  sportId?: string | null
  coach?: Coach
  sport?: Sport | null
  assignments?: Array<{ id: string; athlete?: { id: string; name: string } }>
}

export interface ClubActivity {
  id: string
  titleFa: string
  titleEn: string
  descFa: string
  descEn: string
  date: string
  startTime: string
  clubId: string
  club?: Club
}

export type WalletTxType =
  | 'TOP_UP'
  | 'BOOKING'
  | 'CLASS'
  | 'REFUND'
  | 'PAYOUT'
  | 'COACH_EARNING'
  | 'PLATFORM_FEE'

export interface WalletTransaction {
  id: string
  type: WalletTxType
  amount: number
  balanceAfter: number
  noteFa?: string | null
  noteEn?: string | null
  referenceId?: string | null
  createdAt: string
  user?: { name: string; role?: string } | null
  club?: { nameFa: string; nameEn: string } | null
}
