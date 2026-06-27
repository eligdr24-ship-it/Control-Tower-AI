import type { ReactNode } from 'react'

interface EmptyStateProps {
  iconName: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ iconName, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-xl border border-gray-200" role="status">
      <div className="text-[32px] text-gray-300 mb-3" aria-hidden="true">
        <i className={`ti ${iconName}`} />
      </div>
      <div className="text-[14px] font-medium text-gray-500 mb-1">{title}</div>
      {description && (
        <p className="text-[12px] text-gray-400 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
