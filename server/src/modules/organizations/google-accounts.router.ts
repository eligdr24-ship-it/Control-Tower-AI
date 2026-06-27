/**
 * google-accounts.router.ts
 *
 * Mounted at /api/v1/google-accounts.
 * Handles GBP discovery and sync job status.
 *
 * Account connect/disconnect/list live under /api/v1/auth/google/* to keep
 * auth concerns co-located. This router handles data operations on accounts
 * that are already connected.
 */
import { Router } from 'express'
import { requireAuth, getOrgId, getUserId } from '../../middleware/auth'
import { ok } from '../../lib/errors'
import { discoverProfiles, getSyncJobs } from '../profiles/gbp-sync.service'
import { listAccounts } from '../auth/google.service'

export const googleAccountsRouter = Router()
googleAccountsRouter.use(requireAuth)

// GET /api/v1/google-accounts
// Mirrors /auth/google/accounts — kept for backward compatibility
googleAccountsRouter.get('/', async (req, res, next) => {
  try {
    ok(res, await listAccounts(getOrgId(req)))
  } catch (e) { next(e) }
})

// POST /api/v1/google-accounts/:id/discover
// Trigger GBP location discovery for a connected account
googleAccountsRouter.post('/:id/discover', async (req, res, next) => {
  try {
    const result = await discoverProfiles(req.params.id, getOrgId(req), getUserId(req))
    ok(res, result)
  } catch (e) { next(e) }
})

// GET /api/v1/google-accounts/:id/sync-jobs
// List sync job history for an account
googleAccountsRouter.get('/:id/sync-jobs', async (req, res, next) => {
  try {
    ok(res, await getSyncJobs(req.params.id, getOrgId(req)))
  } catch (e) { next(e) }
})
