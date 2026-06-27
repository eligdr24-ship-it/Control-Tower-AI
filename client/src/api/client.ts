import axios, { type AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ── Request interceptor — attach JWT in Phase 2 ───────────────
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('ct_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — normalize errors ───────────────────
apiClient.interceptors.response.use(
  res => res,
  (err: AxiosError<{ error?: { message?: string } }>) => {
    const message =
      err.response?.data?.error?.message ??
      err.message ??
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ── Typed helpers ─────────────────────────────────────────────
export async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
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

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await apiClient.delete<{ data: T }>(path)
  return res.data.data
}

// Paginated helper — returns { data, meta }
export async function apiGetPaginated<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<{ data: T[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }> {
  const res = await apiClient.get(path, { params })
  return res.data as { data: T[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }
}
