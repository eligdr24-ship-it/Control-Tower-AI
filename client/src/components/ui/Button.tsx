import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: string
  children?: ReactNode
}

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-[inherit] cursor-pointer transition-all duration-100 active:scale-[0.98] whitespace-nowrap border'

  const variants = {
    default: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900',
    primary: 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600',
    ghost:   'bg-transparent border-transparent text-gray-500 hover:bg-gray-100',
    danger:  'bg-red-500 border-red-500 text-white hover:bg-red-600',
  }

  const sizes = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3.5 py-[7px] text-[12px]',
  }

  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''

  return (
    <button
      className={cn(base, variants[variant], sizes[size], disabledCls, className)}
      disabled={disabled}
      {...props}
    >
      {icon && <i className={`ti ${icon} text-[14px]`} aria-hidden="true" />}
      {children}
    </button>
  )
}
