import { supabase } from './supabase'
import type { EligibilityResult } from '../types'

function isNotASC(rankName: string | null, rankId: string | null, rankNamesMap?: Map<string, string>): boolean {
  if (rankName) {
    return rankName.toLowerCase().trim() !== 'asc'
  }
  if (rankId && rankNamesMap) {
    const name = rankNamesMap.get(rankId)
    if (name) {
      return name.toLowerCase().trim() !== 'asc'
    }
  }
  return false
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export interface AgentLike {
  id: string
  staff_id: string
  full_name: string
  current_t1_id: string | null
  referrer_id: string | null
  contract_signing_date: string | null
  rank_name: string | null
  rank_id: string | null
  deleted_at: string | null
  status: string | null
}

export interface ChangeLike {
  agent_id: string
  new_t1_id: string | null
  change_date: string
  is_counted_for_quota: boolean | null
  deleted_at: string | null
}

/** Source of truth for T1 is `current_t1_id`. `referrer_id` is kept for backward compatibility and synced via DB trigger. */
function getAgentT1(agent: AgentLike): string | null {
  return agent.current_t1_id ?? null
}

/**
 * Call the RPC `check_eligibility` on Supabase — this is the single source of truth for eligibility rules.
 * Use this for the main eligibility check in UI. For offline bulk calc (M1 impact preview), use `checkCanChooseNewT1`.
 */
export async function checkEligibilityRpc(
  agentId: string,
  proposedT1Id: string | null
): Promise<EligibilityResult> {
  const { data, error } = await supabase.rpc('check_eligibility', {
    p_agent_id: agentId,
    p_proposed_t1_id: proposedT1Id,
  })
  if (error) {
    return { eligible: false, reasons: ['Lỗi kiểm tra điều kiện: ' + error.message] }
  }
  const result = data as { eligible: boolean; reasons: string[] } | null
  if (!result) {
    return { eligible: false, reasons: ['Không nhận được kết quả từ server'] }
  }
  return { eligible: result.eligible, reasons: result.reasons }
}

export function checkEligibility(
  agentId: string,
  proposedT1Id: string | null,
  agents: AgentLike[],
  t1Changes: ChangeLike[],
  rankNamesMap?: Map<string, string>
): EligibilityResult {
  const agent = agents.find((a) => a.id === agentId && !a.deleted_at)
  if (!agent) {
    return { eligible: false, reasons: ['Agent không tồn tại'] }
  }

  const reasons: string[] = []

  if (!proposedT1Id) {
    return { eligible: false, reasons: ['Vui lòng chọn T1 mới'] }
  }
  if (proposedT1Id === agentId) {
    return { eligible: false, reasons: ['Không thể chọn chính mình làm T1'] }
  }
  if (proposedT1Id === getAgentT1(agent)) {
    return { eligible: false, reasons: ['T1 mới không được trùng với T1 hiện tại'] }
  }

  const days = daysSince(agent.contract_signing_date)
  const changes = t1Changes.filter(
    (c) => c.agent_id === agentId && c.is_counted_for_quota && !c.deleted_at
  )
  const changeCount = changes.length
  const lastChange = changes.sort(
    (a, b) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime()
  )[0]
  const daysSinceLastChange = lastChange ? daysSince(lastChange.change_date) : null

  if (days <= 90) {
    if (changeCount >= 1) {
      reasons.push(`❌ Đã đổi T1 ${changeCount} lần trong 90 ngày đầu (tối đa 1 lần)`)
    } else {
      reasons.push(`✅ Trong 90 ngày đầu, chưa đổi T1 lần nào`)
    }
  } else {
    if (changeCount >= 3) {
      reasons.push(`❌ Đã đổi T1 ${changeCount} lần (tối đa 3 lần)`)
    } else {
      reasons.push(`✅ Đã đổi T1 ${changeCount}/3 lần`)
    }

    if (!isNotASC(agent.rank_name, agent.rank_id, rankNamesMap)) {
      const displayRank = agent.rank_name ?? (agent.rank_id && rankNamesMap ? rankNamesMap.get(agent.rank_id) : '—')
      reasons.push(`❌ Cấp bậc hiện tại "${displayRank ?? '—'}" không đạt yêu cầu (không được là ASC)`)
    } else {
      const displayRank = agent.rank_name ?? (agent.rank_id && rankNamesMap ? rankNamesMap.get(agent.rank_id) : '—')
      reasons.push(`✅ Cấp bậc: ${displayRank} (đạt yêu cầu)`)
    }

    if (daysSinceLastChange !== null && daysSinceLastChange < 180) {
      reasons.push(`❌ Mới đổi T1 cách đây ${daysSinceLastChange} ngày (cần >= 180 ngày)`)
    } else {
      reasons.push(`✅ ${daysSinceLastChange !== null ? `Đã ${daysSinceLastChange} ngày từ lần đổi trước (>180 ngày)` : 'Chưa từng đổi T1'}`)
    }
  }

  reasons.unshift(`✅ Tham gia ${days} ngày ${days <= 90 ? '(trong 90 ngày ưu đãi)' : '(>91 ngày)'}`)

  const hasErrors = reasons.some((r) => r.startsWith('❌'))
  return { eligible: !hasErrors, reasons }
}

export interface T1Capacity {
  menteeCount: number
  recentAcceptCount: number
  warning: boolean
}

export function getT1Capacity(
  t1Id: string,
  agents: AgentLike[],
  t1Changes: ChangeLike[]
): T1Capacity {
  const menteeCount = agents.filter(
    (a) => getAgentT1(a) === t1Id && !a.deleted_at && a.status === 'active'
  ).length

  const recentAcceptCount = t1Changes.filter((c) => {
    if (c.new_t1_id !== t1Id || c.deleted_at) return false
    return daysSince(c.change_date) <= 30
  }).length

  return {
    menteeCount,
    recentAcceptCount,
    warning: menteeCount > 10 || recentAcceptCount > 3,
  }
}

export function isBusinessDay(dateStr: string, holidays: Set<string>): boolean {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) return false
  return !holidays.has(dateStr.slice(0, 10))
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addBusinessDays(
  startDateStr: string,
  days: number,
  holidays: Set<string>
): Date {
  const dateOnly = startDateStr.slice(0, 10)
  const [y, m, d] = dateOnly.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  let remaining = days
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    const dStr = formatLocalDate(date)
    if (isBusinessDay(dStr, holidays)) {
      remaining--
    }
  }
  return date
}

export function checkCanChooseNewT1(
  agent: AgentLike,
  t1Changes: ChangeLike[],
  rankNamesMap?: Map<string, string>
): { eligible: boolean; reasons: string[]; notes: string[] } {
  const reasons: string[] = []
  const notes: string[] = []
  const days = daysSince(agent.contract_signing_date)
  const changes = t1Changes.filter(
    (c) => c.agent_id === agent.id && c.is_counted_for_quota && !c.deleted_at
  )
  const changeCount = changes.length
  const lastChange = changes.sort(
    (a, b) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime()
  )[0]
  const daysSinceLastChange = lastChange ? daysSince(lastChange.change_date) : null

  if (days <= 90) {
    if (!isNotASC(agent.rank_name, agent.rank_id, rankNamesMap)) {
      notes.push('Cấp bậc ASC — trong 90 ngày đầu vẫn được phép đổi T1')
    }
    if (changeCount >= 1) {
      reasons.push(`Đã đổi T1 ${changeCount} lần trong 90 ngày đầu`)
    }
  } else {
    if (changeCount >= 3) {
      reasons.push(`Đã đổi T1 ${changeCount} lần (tối đa 3 lần)`)
    }
    if (!isNotASC(agent.rank_name, agent.rank_id, rankNamesMap)) {
      const displayRank = agent.rank_name ?? (agent.rank_id && rankNamesMap ? rankNamesMap.get(agent.rank_id) : '—')
      reasons.push(`Cấp bậc ${displayRank} không đạt (không được là ASC)`)
    }
    if (daysSinceLastChange !== null && daysSinceLastChange < 180) {
      reasons.push(`Mới đổi T1 cách đây ${daysSinceLastChange} ngày (cần >= 180)`)
    }
  }

  return { eligible: reasons.length === 0, reasons, notes }
}

export interface M1ImpactDetail {
  agent: AgentLike
  eligible: boolean
  reasons: string[]
  notes: string[]
}

export interface M1ImpactSummary {
  total: number
  eligibleCount: number
  ineligibleCount: number
  details: M1ImpactDetail[]
}

export function getM1ImpactSummary(
  t1Id: string,
  agents: AgentLike[],
  t1Changes: ChangeLike[],
  rankNamesMap?: Map<string, string>
): M1ImpactSummary {
  const m1s = agents.filter(
    (a) => getAgentT1(a) === t1Id && !a.deleted_at && a.status === 'active'
  )
  const details: M1ImpactDetail[] = m1s.map((m1) => {
    const res = checkCanChooseNewT1(m1, t1Changes, rankNamesMap)
    return { agent: m1, eligible: res.eligible, reasons: res.reasons, notes: res.notes }
  })
  const eligibleCount = details.filter((d) => d.eligible).length
  return {
    total: m1s.length,
    eligibleCount,
    ineligibleCount: m1s.length - eligibleCount,
    details,
  }
}
