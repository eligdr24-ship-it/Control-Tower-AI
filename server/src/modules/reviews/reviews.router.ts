import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, getOrgId } from '../../middleware/auth'
import { ok, paginated } from '../../lib/errors'
import { validateBody, validateQuery, paginationSchema } from '../../lib/validate'
import * as svc from './reviews.service'

export const reviewsRouter = Router()
reviewsRouter.use(requireAuth)

reviewsRouter.get('/', async (req, res, next) => {
  try {
    const orgId = getOrgId(req)
    const q = validateQuery(paginationSchema.extend({ status: z.string().optional(), profileId: z.string().optional() }), req)
    const { reviews, total } = await svc.listReviews(orgId, { status: q.status, profileId: q.profileId, page: q.page ?? 1, pageSize: q.pageSize ?? 20 })
    paginated(res, reviews, total, q.page ?? 1, q.pageSize ?? 20)
  } catch (e) { next(e) }
})

reviewsRouter.post('/:id/reply', async (req, res, next) => {
  try {
    const orgId  = getOrgId(req)
    const userId = req.user?.sub ?? 'demo-user-id'
    const body   = validateBody(z.object({ text: z.string().min(1).max(4000), isAiDraft: z.boolean().default(false) }), req)
    ok(res, await svc.createReply(req.params.id, orgId, userId, body.text, body.isAiDraft === true))
  } catch (e) { next(e) }
})

reviewsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const orgId = getOrgId(req)
    const body  = validateBody(z.object({ status: z.string() }), req)
    ok(res, await svc.updateReviewStatus(req.params.id, orgId, body.status))
  } catch (e) { next(e) }
})
