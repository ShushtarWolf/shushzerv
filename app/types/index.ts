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
  indoor?: boolean
  genderPolicy?: 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED'
  sportId: string
  sport?: Sport
  addons?: CourtAddon[]
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
  slotDurationMinutes?: number
  slotOpenTime?: string
  slotCloseTime?: string
  cancellationPolicyFa?: string | null
  cancellationPolicyEn?: string | null
  cancellationHours?: number
  courts?: Court[]
  activities?: ClubActivity[]
  addons?: CourtAddon[]
  hasGroupClasses?: boolean
}

export type EquipmentMode = 'PROVIDED' | 'RENTAL'

export interface ReservedEquipmentLine {
  id: string
  quantity: number
  nameFa: string
  nameEn: string
  price: number
  mode?: EquipmentMode
}

export interface Coach {
  id: string
  nameFa: string
  nameEn: string
  city: string
  rating: number
  sessions: number
  sessionPrice?: number
  bioFa?: string | null
  bioEn?: string | null
  photo?: string | null
  featured?: boolean
  sportId: string
  sport?: Sport
  userId?: string | null
  equipment?: CoachEquipment[]
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
  coverUrl?: string | null
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
export type BookingSource = 'PLATFORM' | 'CLUB'

export interface Booking {
  id: string
  status: BookingStatus
  paymentStatus: 'PAY_AT_CLUB' | 'PAID'
  source?: BookingSource
  guestName?: string | null
  playerCount?: number
  equipmentTotal?: number
  equipment?: ReservedEquipmentLine[]
  createdAt: string
  slot?: Slot
  user?: { name: string; email?: string }
}

export type ScheduleEventType = 'booking' | 'class' | 'slot' | 'match' | 'session' | 'tournament'

export interface ScheduleEvent {
  id: string
  type: ScheduleEventType
  date: string
  startTime: string
  endTime: string
  title: string
  subtitle?: string
  color: string
  status?: string
  paymentStatus?: string
  slotId?: string
  courtId?: string
  bookingId?: string
  classId?: string
  matchId?: string
  coachId?: string
  sessionId?: string
  tournamentId?: string
  price?: number
  bookingSource?: BookingSource
  note?: string | null
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
  replyFa?: string | null
  replyEn?: string | null
  repliedAt?: string | null
  createdAt: string
  userId: string
  user?: { id: string; name: string; nameEn?: string | null }
  clubId?: string | null
  club?: Club | null
  coachId?: string | null
  coach?: Pick<Coach, 'id' | 'nameFa' | 'nameEn'> | null
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

export interface ClassParticipant {
  initials: string
  level: SkillLevel
  gender: 'MALE' | 'FEMALE' | null
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
  classType: 'GROUP' | 'SEMI_PRIVATE'
  genderPolicy: 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED'
  minLevel: SkillLevel
  maxLevel: SkillLevel
  status: 'OPEN' | 'FULL' | 'CANCELLED'
  clubId: string
  sportId: string
  coachId?: string | null
  club?: Club
  sport?: Sport
  coach?: Coach
  enrolled?: boolean
  participants?: ClassParticipant[]
}

export interface ClassPackage {
  id: string
  titleFa: string
  titleEn: string
  descFa: string
  descEn: string
  price: number
  sessionsPerWeek: number
  durationWeeks: number
  classType: 'GROUP' | 'SEMI_PRIVATE'
  groupMode: 'OPEN' | 'WITH_STUDENTS'
  genderPolicy: 'MEN' | 'WOMEN' | 'FAMILY' | 'MIXED'
  minLevel: SkillLevel
  maxLevel: SkillLevel
  maxSeats: number
  bookedSeats: number
  daysOfWeek: string
  startTime: string
  endTime: string
  status: 'ACTIVE' | 'INACTIVE'
  featured: boolean
  createdAt: string
  clubId?: string | null
  coachId?: string | null
  sportId: string
  club?: Club | null
  sport?: Sport
  coach?: Coach | null
  participants?: ClassParticipant[]
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
  planType?: 'TRAINING' | 'DIET'
  coachId: string
  sportId?: string | null
  coach?: Coach
  sport?: Sport | null
  assignmentId?: string
  completedAt?: string | null
  notes?: string | null
  assignments?: Array<{
    id: string
    completedAt?: string | null
    notes?: string | null
    athlete?: { id: string; name: string; nameEn?: string | null; email?: string }
  }>
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

export interface CourtAddon {
  id: string
  nameFa: string
  nameEn: string
  price: number
  mode?: EquipmentMode
  maxPerBooking?: number
  stock?: number | null
  available?: number | null
  clubId: string
  courtId?: string | null
  court?: Court | null
}

export interface CoachEquipment {
  id: string
  nameFa: string
  nameEn: string
  price: number
  mode?: EquipmentMode
  maxPerBooking?: number
  stock?: number | null
  available?: number | null
  coachId: string
}

export interface Tournament {
  id: string
  titleFa: string
  titleEn: string
  descFa: string
  descEn: string
  date: string
  startTime: string
  maxParticipants: number
  joinedCount: number
  price: number
  status: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED'
  sportId: string
  clubId?: string | null
  sport?: Sport
  club?: Club | null
  _count?: { registrations: number }
}

export interface Notification {
  id: string
  type: 'BOOKING' | 'MATCH' | 'CLASS' | 'PLAN' | 'SYSTEM'
  titleFa: string
  titleEn: string
  bodyFa?: string | null
  bodyEn?: string | null
  link?: string | null
  readAt?: string | null
  createdAt: string
}

export interface ClassEnrollment {
  id: string
  paymentStatus: 'PAY_AT_CLUB' | 'PAID'
  createdAt: string
  classSession?: ClassSession
}

export type WalletTxType =
  | 'TOP_UP'
  | 'BOOKING'
  | 'CLASS'
  | 'COACH_SESSION'
  | 'REFUND'
  | 'PAYOUT'
  | 'COACH_EARNING'
  | 'PLATFORM_FEE'

export interface CoachSession {
  id: string
  date: string
  startTime: string
  endTime: string
  price: number
  equipmentTotal?: number
  equipment?: ReservedEquipmentLine[]
  status: BookingStatus
  paymentStatus: 'PAY_AT_CLUB' | 'PAID'
  createdAt: string
  coachId: string
  coach?: Coach
  athleteId?: string
  athlete?: { id: string; name: string; nameEn?: string | null; email?: string }
  clubId?: string | null
  club?: Club | null
}

export interface CoachBusySlot {
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
}

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
