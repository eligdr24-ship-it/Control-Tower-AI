/**
 * auth.router.ts
 *
 * Routes:
 *   POST /auth/register
 *   POST /auth/login
 *   GET  /auth/me
 *
 *   GET  /auth/google              → returns OAuth URL (requires JWT)
 *   GET  /auth/google/callback     → handles Google redirect (no JWT — Google sends here)
 *   GET  /auth/google/accounts     → lists connected accounts (requires JWT)
 *   POST /auth/google/disconnect   → disconnects an account (requires JWT)
 */
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, getOrgId, getUserId } from '../../middleware/auth'
import { ok, created } from '../../lib/errors'
import { validateBody } from '../../lib/validate'
import { config, googleOAuthEnabled } from '../../config/env'
import { logger } from '../../lib/logger'
import { verifyOAuthState } from '../../lib/oauthState'
import * as authSvc   from './auth.service'
import * as googleSvc from './google.service'

export const authRouter = Router()

// ── Register ──────────────────────────────────────────────────
authRouter.post('/register', async (req, res, next) => {
  try {
    const body = validateBody(
      z.object({
        email:    z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        name:     z.string().min(1).max(100),
        orgName:  z.string().min(1).max(200),
        orgSlug:  z.string().min(2).max(60)
          .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
      }),
      req,
    )
    created(res, await authSvc.register(body.email, body.password, body.name, body.orgName, body.orgSlug))
  } catch (e) { next(e) }
})

// ── Login ─────────────────────────────────────────────────────
authRouter.post('/login', async (req, res, next) => {
  try {
    const body = validateBody(
      z.object({ email: z.string().email(), password: z.string().min(1) }),
      req,
    )
    ok(res, await authSvc.login(body.email, body.password))
  } catch (e) { next(e) }
})

// ── Me ────────────────────────────────────────────────────────
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    ok(res, await authSvc.getMe(getUserId(req)))
  } catch (e) { next(e) }
})

// ── Google OAuth: initiate ────────────────────────────────────
/**
 * GET /auth/google
 *
 * Returns the Google consent page URL.
 * The client redirects the user's browser to this URL.
 * We do NOT redirect directly from the server — the client controls navigation.
 *
 * The URL encodes an HMAC-signed "state" parameter that prevents CSRF.
 */
authRouter.get('/google', requireAuth, (req, res, next) => {
  try {
    if (!googleOAuthEnabled) {
      res.status(501).json({
        error: {
          code:    'NOT_CONFIGURED',
          message:
            'Google OAuth is not configured. ' +
            'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your server .env file.',
          setupUrl: 'https://console.cloud.google.com/apis/credentials',
        },
      })
      return
    }

    const url = googleSvc.getAuthUrl(getOrgId(req), getUserId(req))
    ok(res, { url })
  } catch (e) { next(e) }
})

// ── Google OAuth: callback ────────────────────────────────────
/**
 * GET /auth/google/callback
 *
 * Google redirects the user's browser here after authorization.
 * We exchange the code for tokens, save them, then redirect the user
 * back to the client app with a success or error indicator.
 *
 * No JWT required — this route is called by Google, not by our frontend.
 * Security comes from the HMAC-signed state parameter instead.
 */
authRouter.get('/google/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query as Record<string, string | undefined>

    // User denied access on the Google consent screen
    if (error) {
      logger.warn('Google OAuth denied by user', { error })
      return res.redirect(`${config.CLIENT_ORIGIN}/profiles?oauth=denied`)
    }

    if (!code || !state) {
      logger.warn('Google OAuth callback missing code or state')
      return res.redirect(`${config.CLIENT_ORIGIN}/profiles?oauth=error&reason=missing_params`)
    }

    // Verify the HMAC-signed state — rejects CSRF attempts and stale requests
    const statePayload = verifyOAuthState(state)
    if (!statePayload) {
      logger.warn('Google OAuth state verification failed')
      return res.redirect(`${config.CLIENT_ORIGIN}/profiles?oauth=error&reason=invalid_state`)
    }

    const { orgId, userId } = statePayload

    await googleSvc.handleOAuthCallback(code, orgId, userId)

    // Redirect back to the app — client reads ?oauth=success and shows a banner
    res.redirect(`${config.CLIENT_ORIGIN}/profiles?oauth=success`)
  } catch (err) {
    logger.error('Google OAuth callback error', { err })

    // Never expose error details in the redirect URL
    res.redirect(`${config.CLIENT_ORIGIN}/profiles?oauth=error`)

    // Still pass to error handler for logging, but don't send a second response
    next(err)
  }
})

// ── Google OAuth: list connected accounts ─────────────────────
/**
 * GET /auth/google/accounts
 * Returns all active Google accounts connected to the user's organization.
 * Token fields are never returned — only safe metadata.
 */
authRouter.get('/google/accounts', requireAuth, async (req, res, next) => {
  try {
    ok(res, await googleSvc.listAccounts(getOrgId(req)))
  } catch (e) { next(e) }
})

// ── Google OAuth: disconnect ──────────────────────────────────
/**
 * POST /auth/google/disconnect
 *
 * Spec requires POST (not DELETE) for the disconnect action.
 * Body: { accountId: string }
 *
 * - Wipes tokens from DB immediately
 * - Revokes token at Google (best-effort, non-blocking)
 * - Writes audit log
 * - Does NOT delete the business profiles associated with this account
 */
authRouter.post('/google/disconnect', requireAuth, async (req, res, next) => {
  try {
    const { accountId } = validateBody(
      z.object({ accountId: z.string().min(1) }),
      req,
    )
    await googleSvc.disconnectAccount(accountId, getOrgId(req), getUserId(req))
    ok(res, { disconnected: true })
  } catch (e) { next(e) }
})
