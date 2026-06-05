import Skeleton from '../display/Skeleton'

interface TableSkeletonLoaderProps {
  rows?: number
  cols?: number
  className?: string
}

export default function TableSkeletonLoader({ rows = 5, cols = 6, className = '' }: TableSkeletonLoaderProps) {
  return (
    <div className={`bg-bg-primary rounded-sm shadow-card border border-border-hairline overflow-hidden ${className}`}>
      <table className="w-full">
        <thead className="bg-bg-secondary">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-3 py-3">
                <Skeleton variant="text" height={12} width={i === 0 ? '60%' : '40%'} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-border-hairline">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-3 py-3">
                  <Skeleton variant="text" height={16} width={c === 0 ? '80%' : '60%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
