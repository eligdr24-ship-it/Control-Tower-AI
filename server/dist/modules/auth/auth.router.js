"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
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
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const errors_1 = require("../../lib/errors");
const validate_1 = require("../../lib/validate");
const env_1 = require("../../config/env");
const logger_1 = require("../../lib/logger");
const oauthState_1 = require("../../lib/oauthState");
const authSvc = __importStar(require("./auth.service"));
const googleSvc = __importStar(require("./google.service"));
exports.authRouter = (0, express_1.Router)();
// ── Register ──────────────────────────────────────────────────
exports.authRouter.post('/register', async (req, res, next) => {
    try {
        const body = (0, validate_1.validateBody)(zod_1.z.object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
            name: zod_1.z.string().min(1).max(100),
            orgName: zod_1.z.string().min(1).max(200),
            orgSlug: zod_1.z.string().min(2).max(60)
                .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
        }), req);
        (0, errors_1.created)(res, await authSvc.register(body.email, body.password, body.name, body.orgName, body.orgSlug));
    }
    catch (e) {
        next(e);
    }
});
// ── Login ─────────────────────────────────────────────────────
exports.authRouter.post('/login', async (req, res, next) => {
    try {
        const body = (0, validate_1.validateBody)(zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1) }), req);
        (0, errors_1.ok)(res, await authSvc.login(body.email, body.password));
    }
    catch (e) {
        next(e);
    }
});
// ── Me ────────────────────────────────────────────────────────
exports.authRouter.get('/me', auth_1.requireAuth, async (req, res, next) => {
    try {
        (0, errors_1.ok)(res, await authSvc.getMe((0, auth_1.getUserId)(req)));
    }
    catch (e) {
        next(e);
    }
});
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
exports.authRouter.get('/google', auth_1.requireAuth, (req, res, next) => {
    try {
        if (!env_1.googleOAuthEnabled) {
            res.status(501).json({
                error: {
                    code: 'NOT_CONFIGURED',
                    message: 'Google OAuth is not configured. ' +
                        'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your server .env file.',
                    setupUrl: 'https://console.cloud.google.com/apis/credentials',
                },
            });
            return;
        }
        const url = googleSvc.getAuthUrl((0, auth_1.getOrgId)(req), (0, auth_1.getUserId)(req));
        (0, errors_1.ok)(res, { url });
    }
    catch (e) {
        next(e);
    }
});
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
exports.authRouter.get('/google/callback', async (req, res, next) => {
    try {
        const { code, state, error } = req.query;
        // User denied access on the Google consent screen
        if (error) {
            logger_1.logger.warn('Google OAuth denied by user', { error });
            return res.redirect(`${env_1.config.CLIENT_ORIGIN}/profiles?oauth=denied`);
        }
        if (!code || !state) {
            logger_1.logger.warn('Google OAuth callback missing code or state');
            return res.redirect(`${env_1.config.CLIENT_ORIGIN}/profiles?oauth=error&reason=missing_params`);
        }
        // Verify the HMAC-signed state — rejects CSRF attempts and stale requests
        const statePayload = (0, oauthState_1.verifyOAuthState)(state);
        if (!statePayload) {
            logger_1.logger.warn('Google OAuth state verification failed');
            return res.redirect(`${env_1.config.CLIENT_ORIGIN}/profiles?oauth=error&reason=invalid_state`);
        }
        const { orgId, userId } = statePayload;
        await googleSvc.handleOAuthCallback(code, orgId, userId);
        // Redirect back to the app — client reads ?oauth=success and shows a banner
        res.redirect(`${env_1.config.CLIENT_ORIGIN}/profiles?oauth=success`);
    }
    catch (err) {
        logger_1.logger.error('Google OAuth callback error', { err });
        // Never expose error details in the redirect URL
        res.redirect(`${env_1.config.CLIENT_ORIGIN}/profiles?oauth=error`);
        // Still pass to error handler for logging, but don't send a second response
        next(err);
    }
});
// ── Google OAuth: list connected accounts ─────────────────────
/**
 * GET /auth/google/accounts
 * Returns all active Google accounts connected to the user's organization.
 * Token fields are never returned — only safe metadata.
 */
exports.authRouter.get('/google/accounts', auth_1.requireAuth, async (req, res, next) => {
    try {
        (0, errors_1.ok)(res, await googleSvc.listAccounts((0, auth_1.getOrgId)(req)));
    }
    catch (e) {
        next(e);
    }
});
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
exports.authRouter.post('/google/disconnect', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { accountId } = (0, validate_1.validateBody)(zod_1.z.object({ accountId: zod_1.z.string().min(1) }), req);
        await googleSvc.disconnectAccount(accountId, (0, auth_1.getOrgId)(req), (0, auth_1.getUserId)(req));
        (0, errors_1.ok)(res, { disconnected: true });
    }
    catch (e) {
        next(e);
    }
});
