import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

// Framework-agnostic password hashing (node:crypto scrypt) so the same
// implementation can be used by the Prisma seed script and the server API.
// Named hashSecret/verifySecret to avoid clashing with nuxt-auth-utils'
// auto-imported hashPassword/verifyPassword.

export function hashSecret(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${derived}`
}

export function verifySecret(password: string, stored: string): boolean {
  const parts = stored.split(':')
  if (parts.length !== 3) return false
  const [, salt, key] = parts
  const derived = scryptSync(password, salt, 64)
  const keyBuf = Buffer.from(key, 'hex')
  if (keyBuf.length !== derived.length) return false
  return timingSafeEqual(keyBuf, derived)
}
