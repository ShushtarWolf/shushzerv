declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    role: 'ATHLETE' | 'COACH' | 'CLUB_ADMIN' | 'PLATFORM_ADMIN'
    locale?: string
    onboarded?: boolean
  }

  interface UserSession {
    user: User
  }
}

export {}
