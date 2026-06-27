"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAccountsRouter = void 0;
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
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const errors_1 = require("../../lib/errors");
const gbp_sync_service_1 = require("../profiles/gbp-sync.service");
const google_service_1 = require("../auth/google.service");
exports.googleAccountsRouter = (0, express_1.Router)();
exports.googleAccountsRouter.use(auth_1.requireAuth);
// GET /api/v1/google-accounts
// Mirrors /auth/google/accounts — kept for backward compatibility
exports.googleAccountsRouter.get('/', async (req, res, next) => {
    try {
        (0, errors_1.ok)(res, await (0, google_service_1.listAccounts)((0, auth_1.getOrgId)(req)));
    }
    catch (e) {
        next(e);
    }
});
// POST /api/v1/google-accounts/:id/discover
// Trigger GBP location discovery for a connected account
exports.googleAccountsRouter.post('/:id/discover', async (req, res, next) => {
    try {
        const result = await (0, gbp_sync_service_1.discoverProfiles)(req.params.id, (0, auth_1.getOrgId)(req), (0, auth_1.getUserId)(req));
        (0, errors_1.ok)(res, result);
    }
    catch (e) {
        next(e);
    }
});
// GET /api/v1/google-accounts/:id/sync-jobs
// List sync job history for an account
exports.googleAccountsRouter.get('/:id/sync-jobs', async (req, res, next) => {
    try {
        (0, errors_1.ok)(res, await (0, gbp_sync_service_1.getSyncJobs)(req.params.id, (0, auth_1.getOrgId)(req)));
    }
    catch (e) {
        next(e);
    }
});
