import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'

import { profilesRouter } from './routes/profiles'
import { reviewsRouter } from './routes/reviews'
import { agentsRouter } from './routes/agents'
import { healthRouter } from './routes/health'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'

const app = express()
const PORT = process.env.PORT ?? 4000
const NODE_ENV = process.env.NODE_ENV ?? 'development'
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000'

// ── Security ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}))

app.use(cors({
  origin: NODE_ENV === 'production' ? CLIENT_ORIGIN : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api', limiter)

// ── Middleware ───────────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(requestLogger)

// ── API Routes ───────────────────────────────────────────────
app.use('/api/v1/profiles', profilesRouter)
app.use('/api/v1/reviews', reviewsRouter)
app.use('/api/v1/agents', agentsRouter)
app.use('/api/v1/health', healthRouter)

// ── Health check ─────────────────────────────────────────────
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// ── Serve static client build in production ──────────────────
if (NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// ── Error handler (must be last) ─────────────────────────────
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`[Control Tower AI] Server running on port ${PORT} (${NODE_ENV})`)
})

export default app
