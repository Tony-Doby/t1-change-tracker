import { HardDrive, Search, FileJson, History } from 'lucide-react'

export type DriveManagerTab = 'trees' | 'scan' | 'templates' | 'logs'

interface Tab {
  id: DriveManagerTab
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'trees', label: 'Cây Drive', icon: <HardDrive className="w-4 h-4" /> },
  { id: 'scan', label: 'Quét folder', icon: <Search className="w-4 h-4" /> },
  { id: 'templates', label: 'Template', icon: <FileJson className="w-4 h-4" /> },
  { id: 'logs', label: 'Lịch sử', icon: <History className="w-4 h-4" /> },
]

interface DriveManagerTabsProps {
  activeTab: DriveManagerTab
  onChange: (tab: DriveManagerTab) => void
}

export default function DriveManagerTabs({ activeTab, onChange }: DriveManagerTabsProps) {
  return (
    <div className="border-b border-border-hairline mb-6">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 h-10 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
