import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV:       z.enum(['development', 'production', 'test']).default('development'),
  PORT:           z.coerce.number().default(4000),
  DATABASE_URL:   z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL:     z.string().optional(),
  JWT_SECRET:     z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN:  z.string().default('http://localhost:3000'),
  LOG_LEVEL:      z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Phase 2 — Google OAuth (optional; routes return 501 if not set)
  GOOGLE_CLIENT_ID:     z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI:  z.string().optional(),

  // Encryption key for storing OAuth tokens: 64 hex chars (32 bytes)
  // node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ENCRYPTION_KEY: z.string().optional(),

  // Phase 3
  ANTHROPIC_API_KEY: z.string().optional(),
})

function parseConfig() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    result.error.issues.forEach(issue => {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`)
    })
    process.exit(1)
  }
  return result.data
}

export const config = parseConfig()
export type Config = typeof config

export const googleOAuthEnabled =
  Boolean(config.GOOGLE_CLIENT_ID) &&
  Boolean(config.GOOGLE_CLIENT_SECRET) &&
  Boolean(config.GOOGLE_REDIRECT_URI)
