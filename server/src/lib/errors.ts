import type { Response } from 'express'

// ── Error classes ─────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT')
  }
}

// ── Response helpers ──────────────────────────────────────────

export function ok<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ data })
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201)
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return res.json({
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}
