import type { HealthLevel } from '@/types'

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function positionToPercent(pos: number): number {
  return Math.max(5, Math.round(100 - (pos - 1) * 8))
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function scoreToHealthLevel(score: number): HealthLevel {
  if (score >= 85) return 'good'
  if (score >= 65) return 'warning'
  return 'critical'
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
