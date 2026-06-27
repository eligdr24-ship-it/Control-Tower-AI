import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'critical' | 'warning' | 'info' | 'success' | 'neutral'

const styles: Record<BadgeVariant, string> = {
  critical: 'bg-red-500/12 text-red-300 border-red-500/30',
  warning:  'bg-amber-500/12 text-amber-300 border-amber-500/30',
  info:     'bg-blue-500/12 text-blue-300 border-blue-500/30',
  success:  'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  neutral:  'bg-gray-100 text-gray-600 border-gray-200',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap',
      styles[variant],
      className
    )}>
      {children}
    </span>
  )
}
