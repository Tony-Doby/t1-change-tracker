import type { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  title?: string
  className?: string
  gap?: 'sm' | 'md' | 'lg'
}

const gapMap = {
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-10',
}

export default function Section({ children, title, className = '', gap = 'md' }: SectionProps) {
  return (
    <section className={`flex flex-col ${gapMap[gap]} ${className}`}>
      {title && <h2 className="text-[1.23rem] font-medium text-text-primary">{title}</h2>}
      {children}
    </section>
  )
}
