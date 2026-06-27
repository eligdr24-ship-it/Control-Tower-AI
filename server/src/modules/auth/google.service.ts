/**
 * google.service.ts
 *
 * Handles all interactions with Google OAuth 2.0 and the
 * Google Business Profile (GBP) APIs.
 *
 * Data flow:
 *   1. getAuthUrl()          → returns the Google consent URL
 *   2. handleOAuthCallback() → exchanges code for tokens, saves to DB (encrypted)
 *   3. getClientForAccount() → builds an authed client from stored tokens (auto-refreshes)
 *   4. disconnectAccount()   → soft-deletes, wipes tokens from DB
 */
import { google } from 'googleapis'
import { prisma } from '../../db/prisma'
import { getOAuthClient, buildAuthedClient, GBP_SCOPES } from '../../lib/googleOAuth'
import { safeEncrypt, safeDecrypt } from '../../lib/crypto'
import { createOAuthState } from '../../lib/oauthState'
import { writeAuditLog } from '../../lib/audit'
import { logger } from '../../lib/logger'
import { NotFoundError, AppError } from '../../lib/errors'

// ── Auth URL ──────────────────────────────────────────────────

export function getAuthUrl(orgId: string, userId: string): string {
  const client = getOAuthClient()
  const state  = createOAuthState(orgId, userId)

  return client.generateAuthUrl({
    access_type:            'offline',
    prompt:                 'consent',   // Force refresh token on every connect
    scope:                  GBP_SCOPES,
    state,
    include_granted_scopes: true,
  })
}

// ── OAuth Callback ────────────────────────────────────────────

export interface ConnectedAccount {
  id:          string
  email:       string
  displayName: string | null
  scopes:      string[]
  isNew:       boolean
}

export async function handleOAuthCallback(
  code: string,
  organizationId: string,
  userId: string,
): Promise<ConnectedAccount> {
  const client = getOAuthClient()

  // Exchange authorization code for access + refresh tokens
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  // Fetch the Google identity behind the token
  const oauth2 = google.oauth2({ version: 'v2', auth: client })
  const { data: googleUser } = await oauth2.userinfo.get()

  if (!googleUser.id || !googleUser.email) {
    throw new AppError(400, 'Google did not return a valid user identity.', 'GOOGLE_AUTH_FAILED')
  }

  if (!tokens.access_token) {
    throw new AppError(400, 'Google did not return an access token.', 'GOOGLE_NO_TOKEN')
  }

  // Encrypt tokens before they touch the database
  const encryptedAccess  = safeEncrypt(tokens.access_token)
  const encryptedRefresh = tokens.refresh_token ? safeEncrypt(tokens.refresh_token) : null
  const scopes = (tokens.scope ?? GBP_SCOPES.join(' ')).split(' ').filter(Boolean)

  const existing = await prisma.googleAccount.findFirst({
    where: { googleAccountId: googleUser.id },
  })
  const isNew = !existing

  const googleAccount = await prisma.googleAccount.upsert({
    where:  { googleAccountId: googleUser.id },
    create: {
      googleAccountId: googleUser.id,
      organizationId,
      email:           googleUser.email,
      displayName:     googleUser.name ?? null,
      accessToken:     encryptedAccess,
      refreshToken:    encryptedRefresh,
      tokenExpiresAt:  tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes,
      isActive:        true,
    },
    update: {
      // Allow reconnecting from a different org (org re-assignment)
      organizationId,
      email:           googleUser.email,
      displayName:     googleUser.name ?? null,
      accessToken:     encryptedAccess,
      // Only overwrite refresh token when Google issues a new one.
      // Google only sends it on the first authorization or when prompt=consent.
      ...(encryptedRefresh && { refreshToken: encryptedRefresh }),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes,
      isActive:       true,
    },
  })

  await writeAuditLog({
    userId,
    organizationId,
    action:     'GOOGLE_ACCOUNT_CONNECTED',
    entityType: 'GoogleAccount',
    entityId:   googleAccount.id,
    metadata:   { email: googleUser.email, isNew, scopeCount: scopes.length },
  })

  logger.info('Google account connected', {
    googleAccountId: googleAccount.id,
    email: googleUser.email,
    isNew,
  })

  return {
    id:          googleAccount.id,
    email:       googleAccount.email,
    displayName: googleAccount.displayName,
    scopes,
    isNew,
  }
}

// ── Build authed client for API calls ─────────────────────────

export async function getClientForAccount(googleAccountId: string, organizationId: string) {
  const account = await prisma.googleAccount.findFirst({
    where: { id: googleAccountId, organizationId, isActive: true },
  })
  if (!account) throw new NotFoundError('GoogleAccount')

  if (!account.accessToken) {
    throw new AppError(
      400,
      'This Google account has no access token. Please disconnect and reconnect it.',
      'TOKEN_MISSING',
    )
  }

  // Decrypt stored tokens
  const accessToken  = safeDecrypt(account.accessToken)
  const refreshToken = account.refreshToken ? safeDecrypt(account.refreshToken) : ''

  const client = buildAuthedClient(
    accessToken,
    refreshToken,
    account.tokenExpiresAt ?? undefined,
  )

  // When the Google client auto-refreshes the access token, persist the new one
  client.on('tokens', async (newTokens) => {
    if (!newTokens.access_token) return
    logger.info('Google access token refreshed', { googleAccountId })
    const newEncrypted = safeEncrypt(newTokens.access_token)
    await prisma.googleAccount.update({
      where: { id: account.id },
      data:  {
        accessToken:    newEncrypted,
        tokenExpiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : undefined,
      },
    }).catch((err: unknown) => logger.error('Failed to persist refreshed token', { err }))
  })

  return client
}

// ── Disconnect ────────────────────────────────────────────────

export async function disconnectAccount(
  googleAccountId: string,
  organizationId: string,
  userId: string,
): Promise<void> {
  const account = await prisma.googleAccount.findFirst({
    where: { id: googleAccountId, organizationId },
  })
  if (!account) throw new NotFoundError('GoogleAccount')

  // Wipe tokens from DB immediately — do not wait for Google revocation
  await prisma.googleAccount.update({
    where: { id: googleAccountId },
    data:  {
      isActive:      false,
      accessToken:   null,
      refreshToken:  null,
    },
  })

  // Attempt to revoke the token at Google (best-effort, non-blocking)
  if (account.accessToken) {
    const client = getOAuthClient()
    client.revokeToken(safeDecrypt(account.accessToken)).catch(err => {
      logger.warn('Token revocation failed (non-fatal)', { err, googleAccountId })
    })
  }

  await writeAuditLog({
    userId,
    organizationId,
    action:     'GOOGLE_ACCOUNT_DISCONNECTED',
    entityType: 'GoogleAccount',
    entityId:   googleAccountId,
  })

  logger.info('Google account disconnected', { googleAccountId })
}

// ── List connected accounts ───────────────────────────────────

export async function listAccounts(organizationId: string) {
  return prisma.googleAccount.findMany({
    where:   { organizationId, isActive: true },
    select:  {
      id:          true,
      email:       true,
      displayName: true,
      scopes:      true,
      lastSyncAt:  true,
      createdAt:   true,
    },
    orderBy: { createdAt: 'asc' },
  })
}
