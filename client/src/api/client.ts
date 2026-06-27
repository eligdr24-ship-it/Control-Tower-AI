import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

// ── Base URL ──────────────────────────────────────────────────
// VITE_API_URL must be set in Render → client service → Environment:
//   https://control-tower-ai-api.onrender.com
//
// Local dev: leave it unset. Vite proxies /api/* → localhost:4000.
const RAW = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
export const API_ORIGIN = RAW.replace(/\/$/, '')

if (import.meta.env.PROD && !API_ORIGIN) {
  console.error(
    '[CT] VITE_API_URL is not set — all API calls will fail.\n' +
    'Add it in Render → client service → Environment:\n' +
    '  VITE_API_URL = https://control-tower-ai-api.onrender.com'
  )
}

// ── Axios instance ────────────────────────────────────────────
// withCredentials is intentionally false:
//   • We use Authorization: Bearer <token> headers, not cookies.
//   • withCredentials:true forces the browser to do a CORS preflight
//     and requires Access-Control-Allow-Origin to be a specific origin
//     (not *). Any mismatch silently produces "Network Error".
//   • Removing it eliminates an entire class of production CORS failures.
export const apiClient = axios.create({
  baseURL:         `${API_ORIGIN}/api/v1`,
  timeout:         20_000,
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ── Request interceptor — attach JWT ─────────────────────────
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('ct_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — structured error messages ─────────
apiClient.interceptors.response.use(
  res => res,
  (err: AxiosError<{ error?: { message?: string } }>) => {
    const method     = err.config?.method?.toUpperCase() ?? 'REQUEST'
    const url        = `${err.config?.baseURL ?? ''}${err.config?.url ?? ''}`
    const statusCode = err.response?.status

    if (!err.response) {
      // No response at all — network failure, wrong URL, or CORS preflight blocked
      console.error(
        `[CT] Network error: ${method} ${url}\n` +
        `  API base: ${API_ORIGIN || '(relative — check VITE_API_URL)'}\n` +
        `  Axios:    ${err.message}\n` +
        `  Causes:   wrong VITE_API_URL | API service down | CORS misconfiguration`
      )
      const apiUrl = API_ORIGIN || '(VITE_API_URL not set)'
      return Promise.reject(
        new Error(`Cannot reach the API server at ${apiUrl}. Check that it is running and that VITE_API_URL is set correctly in Render.`)
      )
    }

    const msg = err.response.data?.error?.message ?? `HTTP ${statusCode}`
    console.error(`[CT] ${statusCode} ${method} ${url} — ${msg}`)
    return Promise.reject(new Error(msg))
  }
)

// ── Typed helpers ─────────────────────────────────────────────
export async function apiGet<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const res = await apiClient.get<{ data: T }>(path, { params })
  return res.data.data
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.post<{ data: T }>(path, body)
  return res.data.data
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiClient.patch<{ data: T }>(path, body)
  return res.data.data
}

export async function apiDelete<T>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await apiClient.delete<{ data: T }>(path, config)
  return res.data.data
}

export async function apiGetPaginated<T>(
  path: string,
  params?: Record<string, unknown>,
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
