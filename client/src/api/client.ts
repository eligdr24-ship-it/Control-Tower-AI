import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

// ── Base URL resolution ───────────────────────────────────────
//
// Priority order:
//   1. VITE_API_URL env var  (set in Render → client service → Environment)
//   2. Empty string fallback (relative URLs — works for local dev via Vite proxy)
//
// In production on Render the static site and the API are separate services,
// so VITE_API_URL MUST be set to the full API URL, e.g.:
//   https://control-tower-ai-api.onrender.com
//
// In local dev leave VITE_API_URL unset — Vite's proxy (vite.config.ts)
// forwards /api/* to localhost:4000 automatically.
//
const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

// Strip trailing slash so path joins are always clean
const API_ORIGIN = RAW_API_URL.replace(/\/$/, '')

// Warn loudly in the browser console when the var is missing in production
if (import.meta.env.PROD && !API_ORIGIN) {
  console.error(
    '[Control Tower AI] VITE_API_URL is not set.\n' +
    'Set it in Render → your client service → Environment:\n' +
    '  VITE_API_URL = https://<your-api-service>.onrender.com\n' +
    'Without it, all API calls will fail in production.'
  )
}

export const apiClient = axios.create({
  baseURL:         `${API_ORIGIN}/api/v1`,
  timeout:         20_000,
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ── Request interceptor — attach JWT ─────────────────────────
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('ct_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Development-only: log every outgoing request so you can verify the URL
  if (import.meta.env.DEV) {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
  }

  return config
})

// ── Response interceptor — normalize + log errors ─────────────
apiClient.interceptors.response.use(
  res => res,
  (err: AxiosError<{ error?: { message?: string } }>) => {
    // Network error = no response at all (wrong URL, CORS, server down, timeout)
    if (!err.response) {
      const requestUrl = `${err.config?.baseURL ?? ''}${err.config?.url ?? ''}`

      console.error(
        '[API] Network error — no response received.\n' +
        `  Request: ${err.config?.method?.toUpperCase()} ${requestUrl}\n` +
        `  VITE_API_URL: "${API_ORIGIN || '(empty — using relative URLs)'}"\n` +
        `  Axios message: ${err.message}\n` +
        '  Possible causes:\n' +
        '    • VITE_API_URL is not set or wrong in Render environment\n' +
        '    • API server is not running or not yet deployed\n' +
        '    • CORS: CLIENT_ORIGIN on the server does not match this page origin\n' +
        `    • This page origin: ${window.location.origin}`
      )

      return Promise.reject(
        new Error(
          'Cannot reach the server. ' +
          (import.meta.env.PROD
            ? 'Check that the API service is running on Render and VITE_API_URL is set correctly.'
            : 'Check that the local API server is running on port 4000.')
        )
      )
    }

    // HTTP error (4xx / 5xx) — extract the server's message
    const serverMessage = err.response.data?.error?.message
    const httpStatus    = err.response.status

    console.error(
      `[API] HTTP ${httpStatus} error.\n` +
      `  Request: ${err.config?.method?.toUpperCase()} ${err.config?.baseURL ?? ''}${err.config?.url ?? ''}\n` +
      `  Server message: ${serverMessage ?? '(none)'}`
    )

    return Promise.reject(
      new Error(serverMessage ?? `Request failed with status ${httpStatus}`)
    )
  }
)

// ── Typed request helpers ─────────────────────────────────────

export async function apiGet<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<T> {
  const res = await apiClient.get<{ data: T }>(path, { params })
  return res.data.data
}

export async function apiPost<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const res = await apiClient.post<{ data: T }>(path, body)
  return res.data.data
}

export async function apiPatch<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const res = await apiClient.patch<{ data: T }>(path, body)
  return res.data.data
}

export async function apiDelete<T>(
  path: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.delete<{ data: T }>(path, config)
  return res.data.data
}

export async function apiGetPaginated<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<{
  data: T[]
  meta: { total: number; page: number; pageSize: number; totalPages: number }
}> {
  const res = await apiClient.get(path, { params })
  return res.data as {
    data: T[]
    meta: { total: number; page: number; pageSize: number; totalPages: number }
  }
}
