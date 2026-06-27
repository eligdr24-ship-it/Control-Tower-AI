import { Router } from 'express'

export const healthRouter = Router()

// GET /api/v1/health — application-level health (distinct from /healthz infra check)
healthRouter.get('/', (_req, res) => {
  res.json({
    data: {
      status: 'healthy',
      services: {
        database: 'mock',   // will be 'connected' once PostgreSQL is wired
        redis: 'mock',      // will be 'connected' once Redis is wired
        googleApi: 'mock',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  })
})
