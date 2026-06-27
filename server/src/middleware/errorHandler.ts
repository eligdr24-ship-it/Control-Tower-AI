import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../lib/errors'
import { logger } from '../lib/logger'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code ?? 'ERROR', message: err.message } })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.issues } })
    return
  }

  // Prisma unique constraint / not found — detect by error code property
  if (err && typeof err === 'object' && 'code' in err) {
    const prismaErr = err as { code: string; message?: string }
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ error: { code: 'CONFLICT', message: 'A record with that value already exists.' } })
      return
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found.' } })
      return
    }
  }

  logger.error('Unhandled error', { err, method: req.method, path: req.path })

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.' },
  })
}
