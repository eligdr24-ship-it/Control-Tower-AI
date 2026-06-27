/**
 * Control Tower AI — Express server entry point
 *
 * Startup order:
 *   1. Validate environment variables (crashes clearly on bad config)
 *   2. Apply security middleware (helmet, cors, rate-limit)
 *   3. Mount API routers
 *   4. Serve React client in production
 *   5. Global error handler
 *   6. Listen + graceful shutdown
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
// In production, only allow requests from the configured client origin.
// In development, allow all origins so Vite's dev server works without config.
app.use(cors({
  origin:         config.NODE_ENV === 'production' ? config.CLIENT_ORIGIN : true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,
}))

// ── Rate limiting ─────────────────────────────────────────────
// 300 requests per 15 minutes per IP across all /api routes.
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
// Auth (login, register, Google OAuth) — /api/v1/auth/*
app.use('/api/v1/auth',            authRouter)

// Core data routes
app.use('/api/v1/dashboard',       dashboardRouter)
app.use('/api/v1/profiles',        profilesRouter)
app.use('/api/v1/reviews',         reviewsRouter)
app.use('/api/v1/agents',          agentsRouter)

// Google account data operations (discover, sync-jobs)
app.use('/api/v1/google-accounts', googleAccountsRouter)

// ── Infrastructure health check ───────────────────────────────
// Used by Render (and load balancers) to verify the service is alive.
// Returns 503 if the database is unreachable.
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
// In development, the Vite dev server handles the client.
if (config.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist, { maxAge: '1y', etag: true }))
  // SPA fallback — all non-API routes return index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// ── Global error handler ──────────────────────────────────────
// Must be registered AFTER all routes.
app.use(errorHandler)

// ── Start server ──────────────────────────────────────────────
const server = app.listen(config.PORT, () => {
  logger.info('Control Tower AI server started', {
    port: config.PORT,
    env:  config.NODE_ENV,
  })
})

// ── Graceful shutdown ─────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down gracefully`)
  server.close(async () => {
    await prisma.$disconnect()
    logger.info('Server closed')
    process.exit(0)
  })
  // Force exit after 10 s if connections don't drain
  setTimeout(() => {
    logger.error('Forced exit after timeout')
    process.exit(1)
  }, 10_000)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT',  () => void shutdown('SIGINT'))

export default app
