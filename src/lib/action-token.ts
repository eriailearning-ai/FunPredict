/**
 * Secure one-click action tokens for email links.
 *
 * Token format:  base64url(payload) + '.' + hmac-sha256
 * Payload:       userId:action:issuedAtMs
 *
 * Tokens expire after TOKEN_TTL_MS (default 7 days).
 * They are NOT stored in the DB — they are self-validating via HMAC.
 */
import crypto from 'crypto'

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000   // 7 days

function secret() {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET is not set')
  return s
}

export type ActionTokenPayload = {
  userId: string
  action: 'approve' | 'deny'
  issuedAt: number
}

export function createActionToken(userId: string, action: 'approve' | 'deny'): string {
  const payload = `${userId}:${action}:${Date.now()}`
  const payloadB64 = Buffer.from(payload).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(payloadB64).digest('hex')
  return `${payloadB64}.${sig}`
}

export function verifyActionToken(token: string): ActionTokenPayload | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null

    const payloadB64 = token.slice(0, dot)
    const sig        = token.slice(dot + 1)

    // Constant-time comparison to prevent timing attacks
    const expectedSig = crypto.createHmac('sha256', secret()).update(payloadB64).digest('hex')
    const valid = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))
    if (!valid) return null

    const decoded = Buffer.from(payloadB64, 'base64url').toString()
    const parts   = decoded.split(':')
    if (parts.length !== 3) return null

    const [userId, action, issuedAtStr] = parts
    const issuedAt = parseInt(issuedAtStr, 10)

    if (isNaN(issuedAt)) return null
    if (Date.now() - issuedAt > TOKEN_TTL_MS) return null
    if (action !== 'approve' && action !== 'deny') return null

    return { userId, action: action as 'approve' | 'deny', issuedAt }
  } catch {
    return null
  }
}
