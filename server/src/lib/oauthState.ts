/**
 * CSRF-protected OAuth state parameter.
 *
 * The "state" value in the OAuth flow must be:
 *   1. Unpredictable  — so an attacker cannot forge a callback
 *   2. Verifiable     — so the callback can confirm it came from us
 *   3. Carrying data  — so we know which user/org initiated the flow
 *
 * We use HMAC-SHA256 over the payload using JWT_SECRET as the key.
 * Format:  base64(JSON payload) + "." + base64(HMAC)
 */
import { createHmac, timingSafeEqual } from 'crypto'
import { config } from '../config/env'
import { randomBytes } from 'crypto'

export interface OAuthStatePayload {
  orgId:  string
  userId: string
  nonce:  string   // random bytes — ensures uniqueness per request
  ts:     number   // unix ms — lets us reject stale states
}

const STATE_TTL_MS = 10 * 60 * 1000  // 10 minutes

function sign(data: string): string {
  return createHmac('sha256', config.JWT_SECRET).update(data).digest('base64url')
}

/** Create a signed, base64-encoded state string */
export function createOAuthState(orgId: string, userId: string): string {
  const payload: OAuthStatePayload = {
    orgId,
    userId,
    nonce: randomBytes(16).toString('base64url'),
    ts:    Date.now(),
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig  = sign(data)
  return `${data}.${sig}`
}

/** Verify and decode a state string. Returns null if invalid or expired. */
export function verifyOAuthState(state: string): OAuthStatePayload | null {
  try {
    const dotIdx = state.lastIndexOf('.')
    if (dotIdx === -1) return null

    const data        = state.slice(0, dotIdx)
    const sig         = state.slice(dotIdx + 1)
    const expectedSig = sign(data)

    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as OAuthStatePayload

    // Reject stale states
    if (Date.now() - payload.ts > STATE_TTL_MS) return null

    return payload
  } catch {
    return null
  }
}
