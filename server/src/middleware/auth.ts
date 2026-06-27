import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type JwtPayload } from '../lib/jwt'
import { UnauthorizedError } from '../lib/errors'
import { prisma } from '../db/prisma'
import { logger } from '../lib/logger'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

/**
 * Phase 2: Real JWT verification from Authorization: Bearer <token>
 * Falls back to demo context in development when no token is present.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  // ── Dev fallback: no token → use first org from DB ────────
  if (!authHeader && process.env.NODE_ENV === 'development') {
    try {
      const member = await prisma.organizationMember.findFirst({
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      })
      if (member) {
        req.user = {
          sub:   member.user.id,
          email: member.user.email,
          orgId: member.organizationId,
          role:  member.role,
        }
        next()
        return
      }
    } catch (err) {
      logger.warn('Dev auth fallback failed — DB may not be seeded', { err })
    }
    // DB not seeded yet — use static demo values so app still loads
    req.user = { sub: 'demo', email: 'demo@example.com', orgId: 'demo', role: 'ADMIN' }
    next()
    return
  }

  // ── Real JWT path ──────────────────────────────────────────
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7)
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

export function getOrgId(req: Request): string {
  if (!req.user?.orgId) throw new UnauthorizedError()
  return req.user.orgId
}

export function getUserId(req: Request): string {
  if (!req.user?.sub) throw new UnauthorizedError()
  return req.user.sub
}
