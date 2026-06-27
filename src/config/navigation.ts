import type { ElementType } from 'react'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Activity,
  FileSpreadsheet,
  HardDrive,
  Mail,
  Upload,
  Award,
  Building2,
  Calendar,
  Trash2,
  LayoutGrid,
  Wrench,
  Settings,
} from 'lucide-react'
import type { UserRole } from '../types'

// FEAT-038: Nguồn dữ liệu điều hướng DUY NHẤT cho sidebar + page-tabs.
// Sidebar render theo `NAV_GROUPS` (3 nhóm); mỗi nhóm có các tab (tính năng con) hiện dạng page-tabs.
// Giữ nguyên route trong App.tsx — đây chỉ là lớp gom nhóm/khớp active.

export interface NavTab {
  label: string
  icon: ElementType
  path: string
  roles: UserRole[]
}

export interface NavGroup {
  id: string
  label: string
  icon: ElementType
  tabs: NavTab[]
}

const ALL: UserRole[] = ['admin', 'operator', 'viewer']

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'agent-panel',
    label: 'Agent Panel',
    icon: LayoutGrid,
    tabs: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ALL },
      { label: 'Agents', icon: Users, path: '/agents', roles: ALL },
      { label: 'Requests', icon: ClipboardList, path: '/requests', roles: ALL },
      { label: 'Activity', icon: Activity, path: '/activity', roles: ALL },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Wrench,
    tabs: [
      { label: 'Excel', icon: FileSpreadsheet, path: '/excel-generator', roles: ALL },
      { label: 'Google Drive', icon: HardDrive, path: '/admin/google-drive', roles: ['admin'] },
      { label: 'Email Templates', icon: Mail, path: '/templates', roles: ['admin'] },
      { label: 'Import', icon: Upload, path: '/upload', roles: ['admin', 'operator'] },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    tabs: [
      { label: 'Ranks', icon: Award, path: '/ranks', roles: ['admin'] },
      { label: 'Divisions', icon: Building2, path: '/divisions', roles: ['admin'] },
      { label: 'Holidays', icon: Calendar, path: '/holidays', roles: ['admin'] },
      { label: 'Trash', icon: Trash2, path: '/trash', roles: ['admin'] },
    ],
  },
]

// Khớp 1 tab với pathname hiện tại. Tab '/' chỉ khớp tuyệt đối (tránh prefix nuốt mọi route);
// tab khác khớp khi bằng path hoặc là tiền tố thư mục con → tự phủ detail route (/agents/:id, /requests/:id).
export function tabMatchesPath(tabPath: string, pathname: string): boolean {
  if (tabPath === '/') return pathname === '/'
  return pathname === tabPath || pathname.startsWith(tabPath + '/')
}

export interface ResolvedNav {
  /** Nhóm hiển thị cho role hiện tại, mỗi nhóm đã lọc tab theo role (nhóm rỗng bị loại). */
  visibleGroups: NavGroup[]
  /** id nhóm đang active theo pathname (null nếu không khớp route nào). */
  activeGroupId: string | null
  /** path của tab đang active — dùng để tô sáng page-tab kể cả khi ở detail route. */
  activeTabPath: string | null
}

export function resolveActiveNav(pathname: string, role: UserRole): ResolvedNav {
  const visibleGroups: NavGroup[] = NAV_GROUPS.map((g) => ({
    ...g,
    tabs: g.tabs.filter((t) => t.roles.includes(role)),
  })).filter((g) => g.tabs.length > 0)

  let activeGroupId: string | null = null
  let activeTabPath: string | null = null
  for (const group of visibleGroups) {
    const tab = group.tabs.find((t) => tabMatchesPath(t.path, pathname))
    if (tab) {
      activeGroupId = group.id
      activeTabPath = tab.path
      break
    }
  }

  return { visibleGroups, activeGroupId, activeTabPath }
}
