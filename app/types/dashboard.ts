export interface DashboardChartPayload {
  role: string
  labels: string[]
  breakdown?: Array<{ label: string; value: number }>
  spending?: number[]
  bookingTrend?: number[]
  classTrend?: number[]
  matchTrend?: number[]
  earnings?: number[]
  sessionTrend?: number[]
  revenue?: number[]
  dowLabels?: string[]
  bookingByDow?: number[]
  classByDow?: number[]
  users?: number[]
  clubs?: number[]
  bookings?: number[]
  fees?: number[]
}

export interface ClubDashboardStats {
  bookings: number
  revenue: number
  classes: number
  courts: number
}

export interface AdminPlatformStats {
  users: number
  clubs: number
  bookings: number
  fees: number
}
