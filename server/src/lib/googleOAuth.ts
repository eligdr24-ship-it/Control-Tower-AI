import { google, type Auth } from 'googleapis'
import { config, googleOAuthEnabled } from '../config/env'

/**
 * The exact scope required by Google Business Profile API.
 * "openid email profile" are needed to fetch the Google user's identity
 * after authorization so we can store their email and Google account ID.
 */
export const GBP_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/business.manage',
]

/**
 * Singleton OAuth2Client for initiating the auth flow.
 * Created lazily so the server starts without crashing when
 * GOOGLE_CLIENT_ID is not yet set.
 */
let _authFlowClient: Auth.OAuth2Client | null = null

export function getOAuthClient(): Auth.OAuth2Client {
  if (!googleOAuthEnabled) {
    throw new Error(
      'Google OAuth is not configured. ' +
      'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your .env file.',
    )
  }
  if (!_authFlowClient) {
    _authFlowClient = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID!,
      config.GOOGLE_CLIENT_SECRET!,
      config.GOOGLE_REDIRECT_URI!,
    )
  }
  return _authFlowClient
}

/**
 * Build an OAuth2Client pre-loaded with a stored user's tokens.
 * Used when making GBP API calls on behalf of a connected account.
 */
export function buildAuthedClient(
  accessToken: string,
  refreshToken: string,
  expiryDate?: Date,
): Auth.OAuth2Client {
  // Always build a fresh client — never reuse _authFlowClient for user tokens
  const client = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID!,
    config.GOOGLE_CLIENT_SECRET!,
    config.GOOGLE_REDIRECT_URI!,
  )
  client.setCredentials({
    access_token:  accessToken,
    refresh_token: refreshToken,
    expiry_date:   expiryDate?.getTime(),
  })
  return client
}
