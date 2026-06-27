import { apiGet, apiGetPaginated, apiPost, apiPatch } from './client'
import type {
  BusinessProfile, Review, DashboardData, Agent,
  GoogleAccount, DiscoveryResult, SyncJob,
} from '@/types'

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardKeys = {
  all:  ['dashboard'] as const,
  data: () => [...dashboardKeys.all, 'data'] as const,
}
export const fetchDashboard = () => apiGet<DashboardData>('/dashboard')

// ── Profiles ──────────────────────────────────────────────────
export const profileKeys = {
  all:    ['profiles'] as const,
  list:   (p: Record<string, unknown>) => [...profileKeys.all, 'list', p] as const,
  detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
}
export const fetchProfiles = (params: {
  page?: number; pageSize?: number; health?: string; search?: string
}) => apiGetPaginated<BusinessProfile>('/profiles', params)

export const fetchProfile  = (id: string) => apiGet<BusinessProfile>(`/profiles/${id}`)
export const createProfile = (body: {
  displayName: string; category?: string; city?: string; phone?: string; website?: string
}) => apiPost<BusinessProfile>('/profiles', body)
export const updateProfile = (id: string, body: Partial<BusinessProfile>) =>
  apiPatch<BusinessProfile>(`/profiles/${id}`, body)

// ── Reviews ───────────────────────────────────────────────────
export const reviewKeys = {
  all:  ['reviews'] as const,
  list: (p: Record<string, unknown>) => [...reviewKeys.all, 'list', p] as const,
}
export const fetchReviews = (params: {
  page?: number; pageSize?: number; status?: string; profileId?: string
}) => apiGetPaginated<Review>('/reviews', params)
export const postReviewReply = (reviewId: string, body: { text: string; isAiDraft?: boolean }) =>
  apiPost(`/reviews/${reviewId}/reply`, body)
export const updateReviewStatus = (reviewId: string, status: string) =>
  apiPatch(`/reviews/${reviewId}/status`, { status })

// ── Agents ────────────────────────────────────────────────────
export const agentKeys = {
  all:  ['agents'] as const,
  list: () => [...agentKeys.all, 'list'] as const,
}
export const fetchAgents   = () => apiGet<Agent[]>('/agents')
export const chatWithAgent = (agentId: string, message: string) =>
  apiPost<{ role: string; content: string; timestamp: string }>(`/agents/${agentId}/chat`, { message })

// ── Google Accounts ───────────────────────────────────────────
export const googleAccountKeys = {
  all:      ['google-accounts'] as const,
  list:     () => [...googleAccountKeys.all, 'list'] as const,
  syncJobs: (id: string) => [...googleAccountKeys.all, 'sync-jobs', id] as const,
}

/** List accounts connected to this org */
export const fetchGoogleAccounts = () =>
  apiGet<GoogleAccount[]>('/auth/google/accounts')

/**
 * Get the Google OAuth URL from the server.
 * Never expose GOOGLE_CLIENT_SECRET — only the server builds this URL.
 */
export const fetchGoogleConnectUrl = () =>
  apiGet<{ url: string }>('/auth/google')

/**
 * Disconnect a Google account.
 * Uses POST (not DELETE) per spec requirement #3.
 */
export const disconnectGoogleAccount = (accountId: string) =>
  apiPost<{ disconnected: boolean }>('/auth/google/disconnect', { accountId })

/** Trigger GBP location discovery for a connected account */
export const discoverGbpProfiles = (accountId: string) =>
  apiPost<DiscoveryResult>(`/google-accounts/${accountId}/discover`)

/** Get sync job history for an account */
export const fetchSyncJobs = (accountId: string) =>
  apiGet<SyncJob[]>(`/google-accounts/${accountId}/sync-jobs`)
