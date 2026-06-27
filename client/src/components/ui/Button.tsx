import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost'
  size?: 'sm' | 'md'
  icon?: string
  children?: ReactNode
}

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {icon && <i className={`ti ${icon}`} aria-hidden="true" />}
      {children}
    </button>
  )
}
