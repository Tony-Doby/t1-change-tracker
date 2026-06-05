import Avatar from './Avatar'

interface AvatarGroupProps {
  names: string[]
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  max?: number
  className?: string
}

export default function AvatarGroup({ names, size = 'sm', max = 3, className = '' }: AvatarGroupProps) {
  const visible = names.slice(0, max)
  const overflow = names.length - max

  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {visible.map((name, i) => (
        <div key={i} className="border-2 border-bg-primary rounded-full">
          <Avatar name={name} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className={`border-2 border-bg-primary rounded-full bg-gray-4 text-text-secondary flex items-center justify-center text-xs font-medium ${size === 'xs' ? 'w-6 h-6' : size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : size === 'lg' ? 'w-12 h-12' : 'w-14 h-14'}`}>
          +{overflow}
        </div>
      )}
    </div>
  )
}
