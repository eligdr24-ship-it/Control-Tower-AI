import './config/env'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'

import { config } from './config/env'
import { logger } from './lib/logger'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { prisma } from './db/prisma'

import { authRouter }           from './modules/auth/auth.router'
import { profilesRouter }       from './modules/profiles/profiles.router'
import { reviewsRouter }        from './modules/reviews/reviews.router'
import { agentsRouter }         from './modules/agents/agents.router'
import { dashboardRouter }      from './modules/dashboard/dashboard.router'
import { googleAccountsRouter } from './modules/organizations/google-accounts.router'

const app = express()

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy:     config.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}))

// ── CORS ──────────────────────────────────────────────────────
//
// CLIENT_ORIGIN (server env var) must match the exact origin of the
// deployed client. Set it in Render → API service → Environment.
//
// Supports a comma-separated list for multiple origins:
//   CLIENT_ORIGIN=https://control-tower-ai-client.onrender.com,https://app.example.com
//
// The client sends JWT via Authorization header, NOT cookies, so
// credentials:true / withCredentials is not needed and has been removed
// to eliminate the class of CORS failures it causes.
//
function buildCorsOptions(nodeEnv: string, clientOrigin: string): cors.CorsOptions {
  if (nodeEnv !== 'production') {
    // Development: allow all origins, no restrictions
    return {
      origin:      true,
      methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    }
  }

  const allowed = clientOrigin
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  if (allowed.length === 0) {
    logger.error(
      'CLIENT_ORIGIN is not set. CORS will reject all browser requests. ' +
      'Set CLIENT_ORIGIN in Render → API service → Environment.'
    )
  } else {
    logger.info('CORS allow-list', { origins: allowed })
  }

  return {
    origin: (origin, callback) => {
      // No Origin header = same-origin request, server-to-server, or curl → allow
      if (!origin) return callback(null, true)
      if (allowed.includes(origin)) return callback(null, true)
      logger.warn('CORS rejected', { origin, allowed })
      callback(new Error(`CORS: origin "${origin}" is not allowed`))
    },
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    false,   // No cookies — JWT via Authorization header only
  }
}

const corsOptions = buildCorsOptions(config.NODE_ENV, config.CLIENT_ORIGIN)

// Handle preflight OPTIONS for every route BEFORE rate-limiting and auth
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
}))

// ── Request parsing ───────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'))
}
app.use(requestLogger)

// ── API routes ────────────────────────────────────────────────
app.use('/api/v1/auth',            authRouter)
app.use('/api/v1/dashboard',       dashboardRouter)
app.use('/api/v1/profiles',        profilesRouter)
app.use('/api/v1/reviews',         reviewsRouter)
app.use('/api/v1/agents',          agentsRouter)
app.use('/api/v1/google-accounts', googleAccountsRouter)

// ── Health check ──────────────────────────────────────────────
app.get('/healthz', async (_req, res) => {
  let dbOk = true
  try { await prisma.$queryRaw`SELECT 1` } catch { dbOk = false }
  res.status(dbOk ? 200 : 503).json({
    status:    dbOk ? 'ok' : 'degraded',
    version:   '2.0.0',
    db:        dbOk ? 'ok' : 'error',
    cors:      { clientOrigin: config.CLIENT_ORIGIN },
    timestamp: new Date().toISOString(),
  })
})

// ── Static client (production only) ──────────────────────────
if (config.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist, { maxAge: '1y', etag: true }))
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

// ── Error handler (must be last) ─────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────
const server = app.listen(config.PORT, () => {
  logger.info('Server started', {
    port:         config.PORT,
    env:          config.NODE_ENV,
    clientOrigin: config.CLIENT_ORIGIN,
  })
})

async function shutdown(signal: string) {
  logger.info(`${signal} — shutting down`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000)
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT',  () => void shutdown('SIGINT'))

export default app
