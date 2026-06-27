import { describe, it, expect } from 'vitest'
import { resolveActiveNav, NAV_GROUPS } from './navigation'

describe('resolveActiveNav — khớp active theo route', () => {
  it('"/" → Agent Panel / Dashboard active', () => {
    const { activeGroupId, activeTabPath } = resolveActiveNav('/', 'admin')
    expect(activeGroupId).toBe('agent-panel')
    expect(activeTabPath).toBe('/')
  })

  it('detail route /agents/123 → tab Agents (/agents) active', () => {
    const { activeGroupId, activeTabPath } = resolveActiveNav('/agents/123', 'admin')
    expect(activeGroupId).toBe('agent-panel')
    expect(activeTabPath).toBe('/agents')
  })

  it('detail route /requests/9 → tab Requests (/requests) active', () => {
    const { activeTabPath } = resolveActiveNav('/requests/9', 'operator')
    expect(activeTabPath).toBe('/requests')
  })

  it('/admin/google-drive → Tools / Google Drive active', () => {
    const { activeGroupId, activeTabPath } = resolveActiveNav('/admin/google-drive', 'admin')
    expect(activeGroupId).toBe('tools')
    expect(activeTabPath).toBe('/admin/google-drive')
  })

  it('"/" KHÔNG bị nuốt bởi prefix — chỉ khớp tuyệt đối', () => {
    // '/agents' không được coi là active của tab '/'
    const { activeTabPath } = resolveActiveNav('/agents', 'admin')
    expect(activeTabPath).toBe('/agents')
  })
})

describe('resolveActiveNav — lọc nhóm/tab theo role', () => {
  it('admin thấy đủ 3 nhóm', () => {
    const { visibleGroups } = resolveActiveNav('/', 'admin')
    expect(visibleGroups.map((g) => g.id)).toEqual(['agent-panel', 'tools', 'settings'])
  })

  it('operator: thấy Agent Panel + Tools, KHÔNG thấy Settings; Tools chỉ có Excel + Import', () => {
    const { visibleGroups } = resolveActiveNav('/', 'operator')
    expect(visibleGroups.map((g) => g.id)).toEqual(['agent-panel', 'tools'])
    const tools = visibleGroups.find((g) => g.id === 'tools')!
    expect(tools.tabs.map((t) => t.path)).toEqual(['/excel-generator', '/upload'])
  })

  it('viewer: Tools chỉ có Excel, không thấy Settings', () => {
    const { visibleGroups } = resolveActiveNav('/', 'viewer')
    expect(visibleGroups.map((g) => g.id)).toEqual(['agent-panel', 'tools'])
    const tools = visibleGroups.find((g) => g.id === 'tools')!
    expect(tools.tabs.map((t) => t.path)).toEqual(['/excel-generator'])
  })

  it('viewer truy cập route admin (vd /ranks) → không khớp nhóm nào', () => {
    const { activeGroupId, activeTabPath } = resolveActiveNav('/ranks', 'viewer')
    expect(activeGroupId).toBeNull()
    expect(activeTabPath).toBeNull()
  })

  it('không đột biến NAV_GROUPS gốc khi lọc theo role', () => {
    const before = NAV_GROUPS.find((g) => g.id === 'tools')!.tabs.length
    resolveActiveNav('/', 'viewer')
    const after = NAV_GROUPS.find((g) => g.id === 'tools')!.tabs.length
    expect(after).toBe(before)
  })
})
