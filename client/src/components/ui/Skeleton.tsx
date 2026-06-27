interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
}

export function KpiSkeleton() {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-gray-200">
      <Skeleton className="w-3/5 h-[11px] mb-2" />
      <Skeleton className="w-2/5 h-7 mb-2" />
      <Skeleton className="w-1/2 h-[11px]" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-gray-200 flex flex-col gap-2.5">
      <div className="flex gap-2.5 items-center mb-1">
        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="w-3/5 h-3" />
          <Skeleton className="w-2/5 h-2.5" />
        </div>
      </div>
      <Skeleton className="w-full h-2.5" />
      <Skeleton className="w-4/5 h-2.5" />
    </div>
  )
}

export function ReviewSkeleton() {
  return (
    <div className="flex gap-3 py-3.5 border-b border-gray-100 last:border-0">
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="w-1/3 h-2.5" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-2/5 h-2.5" />
      </div>
    </div>
  )
}
