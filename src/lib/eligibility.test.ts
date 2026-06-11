import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  checkEligibility,
  getT1Capacity,
  isBusinessDay,
  addBusinessDays,
  checkCanChooseNewT1,
  getM1ImpactSummary,
} from './eligibility'
import type { AgentLike, ChangeLike } from './eligibility'

function makeAgent(overrides: Partial<AgentLike> = {}): AgentLike {
  return {
    id: 'agent-1',
    staff_id: 'E001',
    full_name: 'Test Agent',
    current_t1_id: 't1-old',
    referrer_id: 't1-old',
    contract_signing_date: '2024-01-01',
    rank_name: 'DD',
    rank_id: 'rank-dd',
    deleted_at: null,
    status: 'active',
    ...overrides,
  }
}

function makeChange(overrides: Partial<ChangeLike> = {}): ChangeLike {
  return {
    agent_id: 'agent-1',
    new_t1_id: 't1-new',
    change_date: '2024-06-01',
    is_counted_for_quota: true,
    deleted_at: null,
    ...overrides,
  }
}

describe('eligibility', () => {
  let mockDate: Date

  beforeEach(() => {
    mockDate = new Date('2024-12-01T00:00:00+07:00')
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkEligibility', () => {
    it('returns false when agent does not exist', () => {
      const result = checkEligibility('agent-1', 't1-new', [], [])
      expect(result.eligible).toBe(false)
      expect(result.reasons).toContain('Agent không tồn tại')
    })

    it('returns false when proposedT1Id is null', () => {
      const agent = makeAgent()
      const result = checkEligibility(agent.id, null, [agent], [])
      expect(result.eligible).toBe(false)
      expect(result.reasons).toContain('Vui lòng chọn T1 mới')
    })

    it('returns false when agent chooses themselves', () => {
      const agent = makeAgent()
      const result = checkEligibility(agent.id, agent.id, [agent], [])
      expect(result.eligible).toBe(false)
      expect(result.reasons).toContain('Không thể chọn chính mình làm T1')
    })

    it('returns false when proposed T1 is same as current T1', () => {
      const agent = makeAgent({ current_t1_id: 't1-same' })
      const result = checkEligibility(agent.id, 't1-same', [agent], [])
      expect(result.eligible).toBe(false)
      expect(result.reasons).toContain('T1 mới không được trùng với T1 hiện tại')
    })

    it('allows change within 90 days if 0 changes', () => {
      const agent = makeAgent({ contract_signing_date: '2024-11-01' })
      const result = checkEligibility(agent.id, 't1-new', [agent], [])
      expect(result.eligible).toBe(true)
      expect(result.reasons.some((r) => r.includes('Trong 90 ngày đầu'))).toBe(true)
    })

    it('blocks change within 90 days if >=1 change', () => {
      const agent = makeAgent({ contract_signing_date: '2024-11-01' })
      const changes = [makeChange({ change_date: '2024-11-15' })]
      const result = checkEligibility(agent.id, 't1-new', [agent], changes)
      expect(result.eligible).toBe(false)
      expect(result.reasons.some((r) => r.includes('Đã đổi T1') && r.includes('90 ngày'))).toBe(true)
    })

    it('allows change after 90 days if <3 changes and last change >=180 days ago', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01' })
      const changes = [
        makeChange({ change_date: '2024-05-01' }),
        makeChange({ change_date: '2024-03-01' }),
      ]
      const result = checkEligibility(agent.id, 't1-new', [agent], changes)
      expect(result.eligible).toBe(true)
      expect(result.reasons.some((r) => r.includes('2/3'))).toBe(true)
    })

    it('blocks change after 90 days if >=3 changes', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01' })
      const changes = [
        makeChange(),
        makeChange({ change_date: '2024-07-01' }),
        makeChange({ change_date: '2024-08-01' }),
      ]
      const result = checkEligibility(agent.id, 't1-new', [agent], changes)
      expect(result.eligible).toBe(false)
      expect(result.reasons.some((r) => r.includes('Đã đổi T1') && r.includes('tối đa 3'))).toBe(true)
    })

    it('blocks ASC rank after 90 days', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01', rank_name: 'ASC' })
      const result = checkEligibility(agent.id, 't1-new', [agent], [])
      expect(result.eligible).toBe(false)
      expect(result.reasons.some((r) => r.includes('ASC'))).toBe(true)
    })

    it('allows non-ASC rank after 90 days', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01', rank_name: 'DD' })
      const result = checkEligibility(agent.id, 't1-new', [agent], [])
      expect(result.eligible).toBe(true)
      expect(result.reasons.some((r) => r.includes('DD') && r.includes('đạt yêu cầu'))).toBe(true)
    })

    it('blocks if last change <180 days ago', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01' })
      const changes = [makeChange({ change_date: '2024-11-15' })]
      const result = checkEligibility(agent.id, 't1-new', [agent], changes)
      expect(result.eligible).toBe(false)
      expect(result.reasons.some((r) => r.includes('180 ngày'))).toBe(true)
    })

    it('allows if last change >=180 days ago', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01' })
      const changes = [makeChange({ change_date: '2024-05-01' })]
      const result = checkEligibility(agent.id, 't1-new', [agent], changes)
      expect(result.eligible).toBe(true)
      expect(result.reasons.some((r) => r.includes('>180 ngày'))).toBe(true)
    })

    it('resolves rank via rankNamesMap when rank_name is null', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01', rank_name: null, rank_id: 'r1' })
      const map = new Map([['r1', 'ASC']])
      const result = checkEligibility(agent.id, 't1-new', [agent], [], map)
      expect(result.eligible).toBe(false)
      expect(result.reasons.some((r) => r.includes('ASC'))).toBe(true)
    })
  })

  describe('getT1Capacity', () => {
    it('counts active M1 agents', () => {
      const t1 = 't1-leader'
      const agents = [
        makeAgent({ id: 'm1-1', current_t1_id: t1, status: 'active' }),
        makeAgent({ id: 'm1-2', current_t1_id: t1, status: 'active' }),
        makeAgent({ id: 'm1-3', current_t1_id: t1, status: 'inactive' }),
        makeAgent({ id: 'other', current_t1_id: 'other-t1', status: 'active' }),
      ]
      const result = getT1Capacity(t1, agents, [])
      expect(result.menteeCount).toBe(2)
      expect(result.warning).toBe(false)
    })

    it('warns when menteeCount > 10', () => {
      const t1 = 't1-leader'
      const agents = Array.from({ length: 11 }, (_, i) =>
        makeAgent({ id: `m1-${i}`, current_t1_id: t1, status: 'active' })
      )
      const result = getT1Capacity(t1, agents, [])
      expect(result.warning).toBe(true)
    })

    it('counts recent accepts within 30 days', () => {
      const t1 = 't1-leader'
      const changes = [
        makeChange({ new_t1_id: t1, change_date: '2024-11-15' }),
        makeChange({ new_t1_id: t1, change_date: '2024-11-20' }),
        makeChange({ new_t1_id: t1, change_date: '2024-10-01' }),
      ]
      const result = getT1Capacity(t1, [], changes)
      expect(result.recentAcceptCount).toBe(2)
    })
  })

  describe('isBusinessDay', () => {
    it('returns false for Sunday', () => {
      expect(isBusinessDay('2024-06-09', new Set())).toBe(false) // Sunday
    })

    it('returns false for Saturday', () => {
      expect(isBusinessDay('2024-06-08', new Set())).toBe(false) // Saturday
    })

    it('returns false for holiday', () => {
      expect(isBusinessDay('2024-06-10', new Set(['2024-06-10']))).toBe(false)
    })

    it('returns true for normal weekday', () => {
      expect(isBusinessDay('2024-06-10', new Set())).toBe(true) // Monday
    })
  })

  describe('addBusinessDays', () => {
    it('adds business days skipping weekends', () => {
      // Friday 2024-06-07 + 1 business day = Monday 2024-06-10
      const result = addBusinessDays('2024-06-07', 1, new Set())
      // Use local getters because the Date is in local timezone
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(5) // June
      expect(result.getDate()).toBe(10)
    })

    it('adds business days skipping holidays', () => {
      // Monday 2024-06-10 + 1 business day, Tuesday is holiday → Wednesday
      const result = addBusinessDays('2024-06-10', 1, new Set(['2024-06-11']))
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(5) // June
      expect(result.getDate()).toBe(12)
    })
  })

  describe('checkCanChooseNewT1', () => {
    it('returns eligible when no restrictions', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01' })
      const result = checkCanChooseNewT1(agent, [])
      expect(result.eligible).toBe(true)
      expect(result.reasons).toHaveLength(0)
    })

    it('notes ASC within 90 days', () => {
      const agent = makeAgent({ contract_signing_date: '2024-11-01', rank_name: 'ASC' })
      const result = checkCanChooseNewT1(agent, [])
      expect(result.notes.some((n) => n.includes('ASC'))).toBe(true)
    })

    it('returns ineligible for >3 changes', () => {
      const agent = makeAgent({ contract_signing_date: '2024-01-01' })
      const changes = [
        makeChange(),
        makeChange({ change_date: '2024-07-01' }),
        makeChange({ change_date: '2024-08-01' }),
      ]
      const result = checkCanChooseNewT1(agent, changes)
      expect(result.eligible).toBe(false)
    })
  })

  describe('getM1ImpactSummary', () => {
    it('summarizes M1 impact correctly', () => {
      const t1 = 't1-leader'
      const agents = [
        makeAgent({ id: 'm1-1', current_t1_id: t1, status: 'active', rank_name: 'DD' }),
        makeAgent({ id: 'm1-2', current_t1_id: t1, status: 'active', rank_name: 'ASC' }),
      ]
      const result = getM1ImpactSummary(t1, agents, [])
      expect(result.total).toBe(2)
      expect(result.eligibleCount).toBe(1)
      expect(result.ineligibleCount).toBe(1)
    })
  })
})
