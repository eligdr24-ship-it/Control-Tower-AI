"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GBP_SCOPES = void 0;
exports.getOAuthClient = getOAuthClient;
exports.buildAuthedClient = buildAuthedClient;
const googleapis_1 = require("googleapis");
const env_1 = require("../config/env");
/**
 * The exact scope required by Google Business Profile API.
 * "openid email profile" are needed to fetch the Google user's identity
 * after authorization so we can store their email and Google account ID.
 */
exports.GBP_SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/business.manage',
];
/**
 * Singleton OAuth2Client for initiating the auth flow.
 * Created lazily so the server starts without crashing when
 * GOOGLE_CLIENT_ID is not yet set.
 */
let _authFlowClient = null;
function getOAuthClient() {
    if (!env_1.googleOAuthEnabled) {
        throw new Error('Google OAuth is not configured. ' +
            'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your .env file.');
    }
    if (!_authFlowClient) {
        _authFlowClient = new googleapis_1.google.auth.OAuth2(env_1.config.GOOGLE_CLIENT_ID, env_1.config.GOOGLE_CLIENT_SECRET, env_1.config.GOOGLE_REDIRECT_URI);
    }
    return _authFlowClient;
}
/**
 * Build an OAuth2Client pre-loaded with a stored user's tokens.
 * Used when making GBP API calls on behalf of a connected account.
 */
function buildAuthedClient(accessToken, refreshToken, expiryDate) {
    // Always build a fresh client — never reuse _authFlowClient for user tokens
    const client = new googleapis_1.google.auth.OAuth2(env_1.config.GOOGLE_CLIENT_ID, env_1.config.GOOGLE_CLIENT_SECRET, env_1.config.GOOGLE_REDIRECT_URI);
    client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate?.getTime(),
    });
    return client;
}
