import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 bg-white shrink-0 min-h-[62px]">
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-medium text-gray-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
