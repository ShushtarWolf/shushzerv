export interface Sport {
  id: string
  slug: string
  nameFa: string
  nameEn: string
  icon: string
  color: string
  group: string
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
  sports?: Sport[]
}

export interface Court {
  id: string
  nameFa: string
  nameEn: string
  surface?: string | null
  clubId: string
  sportId: string
  sport?: Sport
}

export interface Slot {
  id: string
  date: string
  startTime: string
  endTime: string
  price: number
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'
  courtId: string
  court?: Court
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
  sport?: Sport
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

export interface Booking {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  paymentStatus: 'PAY_AT_CLUB' | 'PAID'
  createdAt: string
  slot?: Slot & { court?: Court & { club?: Club } }
}
