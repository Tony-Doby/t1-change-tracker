import Skeleton, { SkeletonCard } from '../display/Skeleton'

export default function PageContentSkeletonLoader() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" height={32} width="30%" />
        <Skeleton variant="text" height={32} width="15%" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="bg-bg-primary rounded-sm shadow-card border border-border-hairline overflow-hidden">
        <div className="px-3 py-3 border-b border-border-hairline">
          <Skeleton variant="text" height={16} width="20%" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-3 py-3 flex items-center gap-4 border-b border-border-hairline">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" height={16} width="25%" />
            <Skeleton variant="text" height={16} width="20%" />
            <Skeleton variant="text" height={16} width="15%" />
            <div className="ml-auto">
              <Skeleton variant="text" height={16} width="10%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
