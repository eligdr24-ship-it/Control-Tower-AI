"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthUrl = getAuthUrl;
exports.handleOAuthCallback = handleOAuthCallback;
exports.getClientForAccount = getClientForAccount;
exports.disconnectAccount = disconnectAccount;
exports.listAccounts = listAccounts;
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
const googleapis_1 = require("googleapis");
const prisma_1 = require("../../db/prisma");
const googleOAuth_1 = require("../../lib/googleOAuth");
const crypto_1 = require("../../lib/crypto");
const oauthState_1 = require("../../lib/oauthState");
const audit_1 = require("../../lib/audit");
const logger_1 = require("../../lib/logger");
const errors_1 = require("../../lib/errors");
// ── Auth URL ──────────────────────────────────────────────────
function getAuthUrl(orgId, userId) {
    const client = (0, googleOAuth_1.getOAuthClient)();
    const state = (0, oauthState_1.createOAuthState)(orgId, userId);
    return client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Force refresh token on every connect
        scope: googleOAuth_1.GBP_SCOPES,
        state,
        include_granted_scopes: true,
    });
}
async function handleOAuthCallback(code, organizationId, userId) {
    const client = (0, googleOAuth_1.getOAuthClient)();
    // Exchange authorization code for access + refresh tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    // Fetch the Google identity behind the token
    const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: client });
    const { data: googleUser } = await oauth2.userinfo.get();
    if (!googleUser.id || !googleUser.email) {
        throw new errors_1.AppError(400, 'Google did not return a valid user identity.', 'GOOGLE_AUTH_FAILED');
    }
    if (!tokens.access_token) {
        throw new errors_1.AppError(400, 'Google did not return an access token.', 'GOOGLE_NO_TOKEN');
    }
    // Encrypt tokens before they touch the database
    const encryptedAccess = (0, crypto_1.safeEncrypt)(tokens.access_token);
    const encryptedRefresh = tokens.refresh_token ? (0, crypto_1.safeEncrypt)(tokens.refresh_token) : null;
    const scopes = (tokens.scope ?? googleOAuth_1.GBP_SCOPES.join(' ')).split(' ').filter(Boolean);
    const existing = await prisma_1.prisma.googleAccount.findFirst({
        where: { googleAccountId: googleUser.id },
    });
    const isNew = !existing;
    const googleAccount = await prisma_1.prisma.googleAccount.upsert({
        where: { googleAccountId: googleUser.id },
        create: {
            googleAccountId: googleUser.id,
            organizationId,
            email: googleUser.email,
            displayName: googleUser.name ?? null,
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            scopes,
            isActive: true,
        },
        update: {
            // Allow reconnecting from a different org (org re-assignment)
            organizationId,
            email: googleUser.email,
            displayName: googleUser.name ?? null,
            accessToken: encryptedAccess,
            // Only overwrite refresh token when Google issues a new one.
            // Google only sends it on the first authorization or when prompt=consent.
            ...(encryptedRefresh && { refreshToken: encryptedRefresh }),
            tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            scopes,
            isActive: true,
        },
    });
    await (0, audit_1.writeAuditLog)({
        userId,
        organizationId,
        action: 'GOOGLE_ACCOUNT_CONNECTED',
        entityType: 'GoogleAccount',
        entityId: googleAccount.id,
        metadata: { email: googleUser.email, isNew, scopeCount: scopes.length },
    });
    logger_1.logger.info('Google account connected', {
        googleAccountId: googleAccount.id,
        email: googleUser.email,
        isNew,
    });
    return {
        id: googleAccount.id,
        email: googleAccount.email,
        displayName: googleAccount.displayName,
        scopes,
        isNew,
    };
}
// ── Build authed client for API calls ─────────────────────────
async function getClientForAccount(googleAccountId, organizationId) {
    const account = await prisma_1.prisma.googleAccount.findFirst({
        where: { id: googleAccountId, organizationId, isActive: true },
    });
    if (!account)
        throw new errors_1.NotFoundError('GoogleAccount');
    if (!account.accessToken) {
        throw new errors_1.AppError(400, 'This Google account has no access token. Please disconnect and reconnect it.', 'TOKEN_MISSING');
    }
    // Decrypt stored tokens
    const accessToken = (0, crypto_1.safeDecrypt)(account.accessToken);
    const refreshToken = account.refreshToken ? (0, crypto_1.safeDecrypt)(account.refreshToken) : '';
    const client = (0, googleOAuth_1.buildAuthedClient)(accessToken, refreshToken, account.tokenExpiresAt ?? undefined);
    // When the Google client auto-refreshes the access token, persist the new one
    client.on('tokens', async (newTokens) => {
        if (!newTokens.access_token)
            return;
        logger_1.logger.info('Google access token refreshed', { googleAccountId });
        const newEncrypted = (0, crypto_1.safeEncrypt)(newTokens.access_token);
        await prisma_1.prisma.googleAccount.update({
            where: { id: account.id },
            data: {
                accessToken: newEncrypted,
                tokenExpiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : undefined,
            },
        }).catch((err) => logger_1.logger.error('Failed to persist refreshed token', { err }));
    });
    return client;
}
// ── Disconnect ────────────────────────────────────────────────
async function disconnectAccount(googleAccountId, organizationId, userId) {
    const account = await prisma_1.prisma.googleAccount.findFirst({
        where: { id: googleAccountId, organizationId },
    });
    if (!account)
        throw new errors_1.NotFoundError('GoogleAccount');
    // Wipe tokens from DB immediately — do not wait for Google revocation
    await prisma_1.prisma.googleAccount.update({
        where: { id: googleAccountId },
        data: {
            isActive: false,
            accessToken: null,
            refreshToken: null,
        },
    });
    // Attempt to revoke the token at Google (best-effort, non-blocking)
    if (account.accessToken) {
        const client = (0, googleOAuth_1.getOAuthClient)();
        client.revokeToken((0, crypto_1.safeDecrypt)(account.accessToken)).catch(err => {
            logger_1.logger.warn('Token revocation failed (non-fatal)', { err, googleAccountId });
        });
    }
    await (0, audit_1.writeAuditLog)({
        userId,
        organizationId,
        action: 'GOOGLE_ACCOUNT_DISCONNECTED',
        entityType: 'GoogleAccount',
        entityId: googleAccountId,
    });
    logger_1.logger.info('Google account disconnected', { googleAccountId });
}
// ── List connected accounts ───────────────────────────────────
async function listAccounts(organizationId) {
    return prisma_1.prisma.googleAccount.findMany({
        where: { organizationId, isActive: true },
        select: {
            id: true,
            email: true,
            displayName: true,
            scopes: true,
            lastSyncAt: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });
}
