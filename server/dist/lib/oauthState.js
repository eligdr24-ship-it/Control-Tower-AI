"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOAuthState = createOAuthState;
exports.verifyOAuthState = verifyOAuthState;
/**
 * CSRF-protected OAuth state parameter.
 *
 * The "state" value in the OAuth flow must be:
 *   1. Unpredictable  — so an attacker cannot forge a callback
 *   2. Verifiable     — so the callback can confirm it came from us
 *   3. Carrying data  — so we know which user/org initiated the flow
 *
 * We use HMAC-SHA256 over the payload using JWT_SECRET as the key.
 * Format:  base64(JSON payload) + "." + base64(HMAC)
 */
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const crypto_2 = require("crypto");
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
function sign(data) {
    return (0, crypto_1.createHmac)('sha256', env_1.config.JWT_SECRET).update(data).digest('base64url');
}
/** Create a signed, base64-encoded state string */
function createOAuthState(orgId, userId) {
    const payload = {
        orgId,
        userId,
        nonce: (0, crypto_2.randomBytes)(16).toString('base64url'),
        ts: Date.now(),
    };
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = sign(data);
    return `${data}.${sig}`;
}
/** Verify and decode a state string. Returns null if invalid or expired. */
function verifyOAuthState(state) {
    try {
        const dotIdx = state.lastIndexOf('.');
        if (dotIdx === -1)
            return null;
        const data = state.slice(0, dotIdx);
        const sig = state.slice(dotIdx + 1);
        const expectedSig = sign(data);
        // Constant-time comparison to prevent timing attacks
        if (!(0, crypto_1.timingSafeEqual)(Buffer.from(sig), Buffer.from(expectedSig)))
            return null;
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
        // Reject stale states
        if (Date.now() - payload.ts > STATE_TTL_MS)
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
