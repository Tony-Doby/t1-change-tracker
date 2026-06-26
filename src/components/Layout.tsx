import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import { useRequestCountQuery } from '../hooks/queries/useRequestCount'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Activity,
  Mail,
  Upload,
  Trash2,
  Calendar,
  ChevronDown,
  Menu,
  X,
  Search,
  Award,
  Building2,
  FileSpreadsheet,
  PanelLeft,
  HardDrive,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { UserRole } from '../types'
import CommandPalette from './CommandPalette'
import NotificationDropdown from './NotificationDropdown'
import MobileNavigationBar from '../ui/navigation/MobileNavigationBar'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  roles: UserRole[]
  badge?: number
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const { data: requestCount = 0 } = useRequestCountQuery()

  useRealtime({
    table: 't1_requests',
    onChange: () => queryClient.invalidateQueries({ queryKey: ['layout', 'requestCount'] }),
  })

  const role = user?.role ?? 'viewer'

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'operator', 'viewer'] },
    { label: 'Agents', icon: Users, path: '/agents', roles: ['admin', 'operator', 'viewer'] },
    { label: 'Requests', icon: ClipboardList, path: '/requests', roles: ['admin', 'operator', 'viewer'], badge: requestCount },
    { label: 'Activity', icon: Activity, path: '/activity', roles: ['admin', 'operator', 'viewer'] },
    { label: 'Email', icon: Mail, path: '/templates', roles: ['admin'] },
    { label: 'Google Drive', icon: HardDrive, path: '/admin/google-drive', roles: ['admin'] },
    { label: 'Upload', icon: Upload, path: '/upload', roles: ['admin', 'operator'] },
    { label: 'Trash', icon: Trash2, path: '/trash', roles: ['admin'] },
    { label: 'Holidays', icon: Calendar, path: '/holidays', roles: ['admin'] },
    { label: 'Ranks', icon: Award, path: '/ranks', roles: ['admin'] },
    { label: 'Divisions', icon: Building2, path: '/divisions', roles: ['admin'] },
    { label: 'Excel', icon: FileSpreadsheet, path: '/excel-generator', roles: ['admin', 'operator', 'viewer'] },
  ]

  const visibleNav = navItems.filter((n) => n.roles.includes(role))

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-screen bg-bg-tertiary">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-bg-secondary border-r border-border-light flex flex-col transition-all duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: sidebarCollapsed ? 64 : 240 }}
        aria-label="Sidebar navigation"
      >
        <div className="h-14 flex items-center px-4 border-b border-border-light shrink-0">
          {!sidebarCollapsed && (
            <span className="font-semibold text-accent truncate">T1 Tracker</span>
          )}
          <button
            className={`${sidebarCollapsed ? 'mx-auto' : 'ml-auto'} min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-bg-quaternary text-text-tertiary transition-colors hidden lg:flex`}
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            title={sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <PanelLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <button
            className="lg:hidden ml-auto min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
                  active
                    ? 'bg-accent-subtle text-accent font-medium'
                    : 'text-text-secondary hover:bg-bg-quaternary'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.badge > 0 ? 'bg-danger text-white' : 'bg-gray-6 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-bg-primary border-b border-border-light flex items-center px-4 gap-4 shrink-0">
          <button className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-bg-secondary" onClick={() => setMobileMenuOpen(true)} aria-label="Mở menu">
            <Menu className="w-5 h-5 text-text-secondary" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-accent flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-accent text-lg hidden sm:block">T1 Change Tracker</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              className="hidden sm:flex items-center gap-2 px-2.5 h-8 bg-bg-secondary rounded-sm text-xs text-text-tertiary hover:bg-bg-quaternary transition-colors"
              onMouseDown={(e) => {
                e.preventDefault()
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
              }}
            >
              <Search className="w-3.5 h-3.5" />
              Tìm kiếm
              <kbd className="px-1 bg-bg-primary rounded-xs text-[10px] font-mono border border-border-light">Ctrl K</kbd>
            </button>
            <NotificationDropdown />

            <div className="relative">
              <button
                className="flex items-center gap-2 min-h-[40px] px-1.5 rounded-sm hover:bg-bg-secondary transition-colors"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="Menu ngườii dùng"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-medium">
                  {(user?.full_name ?? 'A').charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-bg-primary rounded-sm shadow-dropdown border border-border-light z-20 py-1">
                    <div className="px-3 py-2 border-b border-border-hairline">
                      <p className="text-sm font-medium text-text-primary">{user?.full_name ?? 'Admin'}</p>
                      <p className="text-xs text-text-tertiary">{user?.email ?? 'admin@era.vn'}</p>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate('/change-password')
                      }}
                    >
                      Đổi mật khẩu
                    </button>
                    <div className="px-3 py-2 text-xs text-text-tertiary">
                      Vai trò: <span className="font-medium capitalize">{role}</span>
                    </div>
                    <div className="border-t border-border-hairline">
                      <button
                        className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger-subtle transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false)
                          signOut()
                        }}
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <CommandPalette />
        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <MobileNavigationBar
          items={visibleNav.slice(0, 5).map((item) => ({
            label: item.label,
            icon: <item.icon className="w-5 h-5" />,
            active: isActive(item.path),
            onClick: () => navigate(item.path),
          }))}
        />
      </div>
    </div>
  )
}
