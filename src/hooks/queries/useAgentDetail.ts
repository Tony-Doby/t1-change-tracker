import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Agent, T1Change, AgentDeactivationSnapshot } from '../../types'

export interface AgentDetailData {
  agent: Agent | null
  relatedMap: Record<string, { full_name: string; staff_id: string }>
  t1History: T1Change[]
  asT1History: T1Change[]
  m1List: Agent[]
  deactivationHistory: AgentDeactivationSnapshot[]
  rankNamesMap: Record<string, string>
  divisionMap: Record<string, string>
}

export function useAgentDetailQuery(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agent', 'detail', agentId],
    queryFn: async () => {
      if (!agentId) {
        return {
          agent: null,
          relatedMap: {},
          t1History: [],
          asT1History: [],
          m1List: [],
          deactivationHistory: [],
          rankNamesMap: {},
          divisionMap: {},
        }
      }

      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

      const relatedIds = new Set<string>()
      const t1Id = agentData?.current_t1_id ?? null
      if (t1Id) relatedIds.add(t1Id)
      if (agentData?.introducing_agent_id) relatedIds.add(agentData.introducing_agent_id)

      const { data: m1Data } = await supabase
        .from('agents')
        .select('*')
        .eq('current_t1_id', agentId)
        .is('deleted_at', null)

      const { data: histData } = await supabase
        .from('t1_changes')
        .select('*')
        .eq('agent_id', agentId)
        .is('deleted_at', null)
        .order('change_date', { ascending: false })

      histData?.forEach((c: T1Change) => {
        if (c.old_t1_id) relatedIds.add(c.old_t1_id)
        if (c.new_t1_id) relatedIds.add(c.new_t1_id)
      })

      const { data: asT1Data } = await supabase
        .from('t1_changes')
        .select('*')
        .or(`old_t1_id.eq.${agentId},new_t1_id.eq.${agentId}`)
        .is('deleted_at', null)
        .order('change_date', { ascending: false })

      asT1Data?.forEach((c: T1Change) => {
        if (c.agent_id) relatedIds.add(c.agent_id)
      })

      const relatedMap: Record<string, { full_name: string; staff_id: string }> = {}
      if (relatedIds.size > 0) {
        const { data: related } = await supabase
          .from('agents')
          .select('id, full_name, staff_id')
          .in('id', Array.from(relatedIds))
        related?.forEach((a: { id: string; full_name: string; staff_id: string }) => { relatedMap[a.id] = a })
      }

      const { data: ranksData } = await supabase.from('ranks').select('id, name')
      const rankNamesMap: Record<string, string> = {}
      ranksData?.forEach((r: { id: string; name: string }) => { rankNamesMap[r.id] = r.name })

      const { data: divData } = await supabase.from('divisions').select('id, name')
      const divisionMap: Record<string, string> = {}
      divData?.forEach((d: { id: string; name: string }) => { divisionMap[d.id] = d.name })

      const { data: deactData } = await supabase
        .from('agent_deactivation_snapshots')
        .select('*')
        .eq('agent_id', agentId)
        .order('deactivated_at', { ascending: false })

      return {
        agent: agentData as Agent | null,
        relatedMap,
        t1History: histData ?? [],
        asT1History: asT1Data ?? [],
        m1List: (m1Data ?? []) as Agent[],
        deactivationHistory: deactData ?? [],
        rankNamesMap,
        divisionMap,
      }
    },
    enabled: !!agentId,
  })
}
