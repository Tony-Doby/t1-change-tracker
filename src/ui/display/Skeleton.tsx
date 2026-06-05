interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
}

export default function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const base = 'animate-skeleton bg-gray-3'
  const shape =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'rounded'
      ? 'rounded-sm'
      : variant === 'rectangular'
      ? 'rounded-none'
      : 'rounded-xs'

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return <div className={`${base} ${shape} ${className}`} style={style} />
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" height={16} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-primary rounded-sm border border-border-hairline p-5 space-y-3 ${className}`}>
      <Skeleton variant="text" height={20} width="40%" />
      <Skeleton variant="text" height={32} width="30%" />
      <Skeleton variant="text" height={16} width="70%" />
    </div>
  )
}
