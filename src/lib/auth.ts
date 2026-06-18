import { cookies } from 'next/headers'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12)
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash)
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

export async function createSession(userId: string) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  await prisma.session.create({ data: { userId, token, expiresAt } })
  return token
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } }).catch(() => {})
}

export async function requireAuth() {
  const user = await getSession()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}

/** True when user can see all leagues (admin or superplayer) */
export function canSeeAllLeagues(role?: string | null) {
  return role === 'admin' || role === 'superplayer'
}
