import { useState } from 'react'
import T1History from './T1History'
import M1List from './M1List'
import AsT1History from './AsT1History'
import DeactivationHistory from './DeactivationHistory'
import type { Agent } from '../../types'

export default function AgentHistoryTab({
  agentId,
  contractSigningDate,
  agentT1Name,
  t1History,
  asT1History,
  m1List,
  deactivationHistory,
  getAgentName,
  rankNamesMap,
}: {
  agentId: string
  contractSigningDate?: string | null
  agentT1Name: string
  t1History: any[]
  asT1History: any[]
  m1List: Agent[]
  deactivationHistory: any[]
  getAgentName: (id: string | null) => string
  rankNamesMap: Record<string, string>
}) {
  const [subTab, setSubTab] = useState<'t1_history' | 'm1' | 'as_t1' | 'deactivation'>('t1_history')

  const tabs: { key: typeof subTab; label: string }[] = [
    { key: 't1_history', label: 'Lịch sử T1' },
    { key: 'm1', label: `M1 (${m1List.length})` },
    { key: 'as_t1', label: `Lịch sử làm T1 (${asT1History.length})` },
  ]
  if (deactivationHistory.length > 0) {
    tabs.push({ key: 'deactivation', label: `Lịch sử chấm dứt (${deactivationHistory.length})` })
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-neutral-200">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setSubTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      {subTab === 't1_history' && <T1History contractSigningDate={contractSigningDate} agentT1Name={agentT1Name} t1History={t1History} getAgentName={getAgentName} />}
      {subTab === 'm1' && <M1List m1List={m1List} rankNamesMap={rankNamesMap} />}
      {subTab === 'as_t1' && <AsT1History asT1History={asT1History} agentId={agentId} getAgentName={getAgentName} />}
      {subTab === 'deactivation' && <DeactivationHistory history={deactivationHistory} />}
    </div>
  )
}
