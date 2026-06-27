/**
 * Control Tower AI — Express server entry point
 */
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
// CLIENT_ORIGIN supports a single origin or a comma-separated list.
// Example for Render (set in Dashboard → API service → Environment):
//   CLIENT_ORIGIN=https://control-tower-ai-client.onrender.com
//
// Multiple origins (custom domain + Render URL):
//   CLIENT_ORIGIN=https://control-tower-ai-client.onrender.com,https://app.yourdomain.com
//
function buildCorsOrigin(
  nodeEnv: string,
  clientOrigin: string,
): cors.CorsOptions['origin'] {
  // Development: allow everything so the Vite dev server works with zero config
  if (nodeEnv !== 'production') return true

  // Production: parse the comma-separated allow-list
  const allowed = clientOrigin
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  if (allowed.length === 0) {
    logger.warn(
      'CLIENT_ORIGIN is empty. No origins will be allowed in production. ' +
      'Set CLIENT_ORIGIN in your Render environment variables.'
    )
    return false
  }

  logger.info('CORS allow-list:', { origins: allowed })

  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no Origin header (same-origin, curl, Postman, etc.)
    if (!origin) return callback(null, true)

    if (allowed.includes(origin)) {
      callback(null, true)
    } else {
      logger.warn('CORS blocked request', { origin, allowed })
      callback(new Error(`CORS: origin "${origin}" is not in the allow-list`))
    }
  }
}

app.use(cors({
  origin:         buildCorsOrigin(config.NODE_ENV, config.CLIENT_ORIGIN),
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,
}))

// Explicitly handle preflight for all routes
app.options('*', cors({
  origin:         buildCorsOrigin(config.NODE_ENV, config.CLIENT_ORIGIN),
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,
}))

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         {
    error: {
      code:    'RATE_LIMITED',
      message: 'Too many requests — please try again later.',
    },
  },
}))

// ── Request parsing ───────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ── HTTP logging ──────────────────────────────────────────────
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

// ── Infrastructure health check ───────────────────────────────
app.get('/healthz', async (_req, res) => {
  let dbOk = true
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbOk = false
  }
  res.status(dbOk ? 200 : 503).json({
    status:    dbOk ? 'ok' : 'degraded',
    version:   '2.0.0',
    db:        dbOk ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
  })
})

// ── Serve React client in production ──────────────────────────
if (config.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist, { maxAge: '1y', etag: true }))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// ── Global error handler (must be last) ──────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────
const server = app.listen(config.PORT, () => {
  logger.info('Control Tower AI server started', {
    port:          config.PORT,
    env:           config.NODE_ENV,
    clientOrigins: config.CLIENT_ORIGIN,
  })
})

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down gracefully`)
  server.close(async () => {
    await prisma.$disconnect()
    logger.info('Server closed')
    process.exit(0)
  })
  setTimeout(() => { process.exit(1) }, 10_000)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT',  () => void shutdown('SIGINT'))

export default app
