import type { Request } from 'express'
import { z, type ZodSchema } from 'zod'
import { ValidationError } from './errors'

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new ValidationError(message)
  }
  return result.data
}

export function validateBody<T>(schema: ZodSchema<T>, req: Request): T { return validate(schema, req.body) }
export function validateQuery<T>(schema: ZodSchema<T>, req: Request): T { return validate(schema, req.query) }

export const paginationSchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).required()
