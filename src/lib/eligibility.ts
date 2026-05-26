import type { EligibilityResult } from '../types'

const CS_RANKS = [
  'consultant specialist',
  'senior consultant',
  'director',
  'senior director',
  'executive director',
  'managing director',
  'cấp 1',
  'cấp 2',
  'cấp 3',
  'cấp 4',
  'cấp 5',
  'dd',
  'sd',
  'ed',
  'md',
]

function isCSOrAbove(rank: string | null): boolean {
  if (!rank) return false
  return CS_RANKS.includes(rank.toLowerCase().trim())
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

interface AgentLike {
  id: string
  current_t1_id: string | null
  contract_signing_date: string | null
  rank_name: string | null
  deleted_at: string | null
  status: string | null
}

interface ChangeLike {
  agent_id: string
  new_t1_id: string | null
  change_date: string
  is_counted_for_quota: boolean | null
  deleted_at: string | null
}

export function checkEligibility(
  agentId: string,
  proposedT1Id: string | null,
  agents: AgentLike[],
  t1Changes: ChangeLike[]
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
  if (proposedT1Id === agent.current_t1_id) {
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

    if (!isCSOrAbove(agent.rank_name)) {
      reasons.push(`❌ Cấp bậc hiện tại "${agent.rank_name ?? '—'}" không đạt yêu cầu (cần >= CS/Cấp 1)`)
    } else {
      reasons.push(`✅ Cấp bậc: ${agent.rank_name} (đạt yêu cầu)`)
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
    (a) => a.current_t1_id === t1Id && !a.deleted_at && a.status === 'active'
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
