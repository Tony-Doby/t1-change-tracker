import Skeleton from '../display/Skeleton'

export default function LeftPanelSkeletonLoader() {
  return (
    <div className="w-[240px] h-full bg-bg-secondary border-r border-border-light p-3 space-y-2 animate-fade-in">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" height={14} width="70%" />
        </div>
      ))}
    </div>
  )
}
