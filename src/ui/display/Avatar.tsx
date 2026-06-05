interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-[0.625rem]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
}

export default function Avatar({ src, alt, name = '', size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name}
        className={`rounded-full object-cover bg-gray-4 ${sizeMap[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-accent text-white flex items-center justify-center font-medium ${sizeMap[size]} ${className}`}
      aria-label={name || 'Avatar'}
    >
      {initials || '?'}
    </div>
  )
}
