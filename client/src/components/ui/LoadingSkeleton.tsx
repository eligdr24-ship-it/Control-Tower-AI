import styles from './LoadingSkeleton.module.css'

interface SkeletonProps {
  width?: string
  height?: string
  className?: string
}

export function Skeleton({ width = '100%', height = '16px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function KpiSkeleton() {
  return (
    <div className={styles.kpiSkeleton}>
      <Skeleton width="60%" height="11px" />
      <Skeleton width="40%" height="28px" />
      <Skeleton width="50%" height="11px" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className={styles.cardSkeleton}>
      <div className={styles.cardSkeletonHeader}>
        <Skeleton width="36px" height="36px" className={styles.avatarSkeleton} />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="13px" />
          <Skeleton width="40%" height="11px" />
        </div>
      </div>
      <Skeleton width="100%" height="11px" />
      <Skeleton width="80%" height="11px" />
    </div>
  )
}
