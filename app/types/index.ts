export interface Sport {
  id: string
  slug: string
  nameFa: string
  nameEn: string
  icon: string
  color: string
  group: string
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
