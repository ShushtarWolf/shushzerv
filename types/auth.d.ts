declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    role: 'ATHLETE' | 'COACH' | 'CLUB_ADMIN'
  }

  interface UserSession {
    user: User
  }
}

export {}
