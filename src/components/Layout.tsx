import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
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
  Bell,
  Menu,
  X,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../types'

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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    async function fetchRequestCount() {
      const { count, error } = await supabase
        .from('t1_requests')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .not('status', 'in', '("completed","cancelled")')
      if (!error) setRequestCount(count ?? 0)
    }
    fetchRequestCount()
  }, [])

  const role = user?.role ?? 'viewer'

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'operator', 'viewer'] },
    { label: 'Agents', icon: Users, path: '/agents', roles: ['admin', 'operator', 'viewer'] },
    { label: 'Requests', icon: ClipboardList, path: '/requests', roles: ['admin', 'operator', 'viewer'], badge: requestCount },
    { label: 'Activity Log', icon: Activity, path: '/activity', roles: ['admin', 'operator', 'viewer'] },
    { label: 'Email Templates', icon: Mail, path: '/templates', roles: ['admin'] },
    { label: 'Upload Data', icon: Upload, path: '/upload', roles: ['admin', 'operator'] },
    { label: 'Trash', icon: Trash2, path: '/trash', roles: ['admin'] },
    { label: 'Holidays', icon: Calendar, path: '/holidays', roles: ['admin'] },
  ]

  const visibleNav = navItems.filter((n) => n.roles.includes(role))

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-neutral-50 border-r border-neutral-300 flex flex-col transition-transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-14 flex items-center px-4 border-b border-neutral-300 lg:hidden">
          <span className="font-bold text-primary">T1 Tracker</span>
          <button className="ml-auto" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5 text-neutral-700" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      item.badge > 0 ? 'bg-danger text-white' : 'bg-neutral-300 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-neutral-300 flex items-center px-4 gap-4 shrink-0">
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5 text-neutral-700" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-primary text-lg hidden sm:block">T1 Change Tracker</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-1.5 rounded-md hover:bg-neutral-100">
              <Bell className="w-5 h-5 text-neutral-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-neutral-100"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {(user?.full_name ?? 'A').charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-dropdown border border-neutral-300 z-20 py-1">
                    <div className="px-3 py-2 border-b border-neutral-100">
                      <p className="text-sm font-medium text-neutral-900">{user?.full_name ?? 'Admin'}</p>
                      <p className="text-xs text-neutral-500">{user?.email ?? 'admin@era.vn'}</p>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate('/change-password')
                      }}
                    >
                      Đổi mật khẩu
                    </button>
                    <div className="px-3 py-2 text-xs text-neutral-500">
                      Vai trò: <span className="font-medium capitalize">{role}</span>
                    </div>
                    <div className="border-t border-neutral-100">
                      <button
                        className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger-light"
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

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
