import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  iconName: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ iconName, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty} role="status">
      <div className={styles.icon} aria-hidden="true">
        <i className={`ti ${iconName}`} />
      </div>
      <div className={styles.title}>{title}</div>
      {description && <p className={styles.desc}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
