import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, getOrgId } from '../../middleware/auth'
import { ok, created, paginated } from '../../lib/errors'
import { validateBody, validateQuery, paginationSchema } from '../../lib/validate'
import * as svc from './profiles.service'

export const profilesRouter = Router()
profilesRouter.use(requireAuth)

profilesRouter.get('/kpis', async (req, res, next) => {
  try { ok(res, await svc.getDashboardKpis(getOrgId(req))) } catch (e) { next(e) }
})

profilesRouter.get('/', async (req, res, next) => {
  try {
    const orgId = getOrgId(req)
    const q = validateQuery(paginationSchema.extend({
      health: z.string().optional(), search: z.string().optional(),
    }), req)
    const opts = { health: q.health, search: q.search, page: q.page ?? 1, pageSize: q.pageSize ?? 20 }
    const { profiles, total } = await svc.listProfiles(orgId, opts)
    paginated(res, profiles, total, q.page ?? 1, q.pageSize ?? 20)
  } catch (e) { next(e) }
})

profilesRouter.get('/:id', async (req, res, next) => {
  try { ok(res, await svc.getProfile(req.params.id, getOrgId(req))) } catch (e) { next(e) }
})

profilesRouter.post('/', async (req, res, next) => {
  try {
    const body = validateBody(z.object({
      displayName: z.string().min(1).max(200), category: z.string().optional(),
      city: z.string().optional(), address: z.string().optional(),
      phone: z.string().optional(), website: z.string().url().optional(),
    }), req)
    created(res, await svc.createProfile(getOrgId(req), body))
  } catch (e) { next(e) }
})

profilesRouter.patch('/:id', async (req, res, next) => {
  try {
    const body = validateBody(z.object({
      displayName: z.string().min(1).max(200).optional(), category: z.string().optional(),
      city: z.string().optional(), phone: z.string().optional(),
      website: z.string().url().optional(),
    }), req)
    ok(res, await svc.updateProfile(req.params.id, getOrgId(req), body))
  } catch (e) { next(e) }
})
