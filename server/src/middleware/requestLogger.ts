import type { Request, Response, NextFunction } from 'express'

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  // In a real app this would write to an audit_logs table in PostgreSQL
  if (req.method !== 'GET') {
    console.log(`[Audit] ${new Date().toISOString()} ${req.method} ${req.path}`, {
      body: req.body,
      ip: req.ip,
    })
  }
  next()
}
