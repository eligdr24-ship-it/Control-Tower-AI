/**
 * AES-256-GCM encryption for OAuth tokens stored in the database.
 *
 * Why GCM:
 *   - Authenticated encryption: any tampering with the ciphertext is detected
 *   - Produces an auth tag that must match on decryption
 *   - Industry standard for symmetric encryption
 *
 * Format stored in DB:   base64(iv) : base64(authTag) : base64(ciphertext)
 *
 * Requires ENCRYPTION_KEY = 64 hex chars (= 32 bytes).
 * Generate:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { config } from '../config/env'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES   = 12   // 96-bit IV — GCM recommended size
const SEP        = ':'

function getKey(): Buffer {
  const key = config.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  return Buffer.from(key, 'hex')
}

/** Encrypt plaintext → "iv:tag:ciphertext" (all base64) */
export function encrypt(plaintext: string): string {
  const key    = getKey()
  const iv     = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(SEP)
}

/** Decrypt "iv:tag:ciphertext" → plaintext, or null if tampered/wrong key */
export function decrypt(ciphertext: string): string | null {
  try {
    const key  = getKey()
    const parts = ciphertext.split(SEP)
    if (parts.length !== 3) return null

    const [ivB64, tagB64, encB64] = parts
    const iv        = Buffer.from(ivB64,  'base64')
    const tag       = Buffer.from(tagB64, 'base64')
    const encrypted = Buffer.from(encB64, 'base64')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    // Authentication tag mismatch, wrong key, or malformed ciphertext
    return null
  }
}

/**
 * Encrypt if ENCRYPTION_KEY is configured, otherwise store plaintext.
 * When the key is later set, tokens will be encrypted on next OAuth reconnect.
 * Plaintext fallback allows the server to start without the key during development.
 */
export function safeEncrypt(plaintext: string): string {
  if (!config.ENCRYPTION_KEY) return plaintext
  return encrypt(plaintext)
}

/**
 * Decrypt if the value looks encrypted (contains the iv:tag:ct separator pattern).
 * Falls through to returning the value as-is for plaintext values stored
 * before ENCRYPTION_KEY was configured.
 */
export function safeDecrypt(value: string): string {
  if (!config.ENCRYPTION_KEY) return value
  // Encrypted values always have exactly 2 ":" separators
  if ((value.match(/:/g) ?? []).length !== 2) return value
  return decrypt(value) ?? value
}
