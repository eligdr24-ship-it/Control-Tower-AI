import type { HealthLevel, IssueSeverity } from '@/types'

/**
 * Format a relative timestamp ("3h ago", "2d ago")
 */
export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Map a health score (0–100) to a HealthLevel
 */
export function scoreToHealthLevel(score: number): HealthLevel {
  if (score >= 85) return 'good'
  if (score >= 70) return 'warning'
  return 'critical'
}

/**
 * Map a ranking position to a bar percentage (position 1 = 100%)
 */
export function positionToPercent(position: number): number {
  return Math.max(5, Math.round(100 - (position - 1) * 8))
}

/**
 * Severity to label map
 */
export const severityLabel: Record<IssueSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Truncate text to a max character count
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '…'
}

/**
 * Format large numbers compactly (1400 → "1.4k")
 */
export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
