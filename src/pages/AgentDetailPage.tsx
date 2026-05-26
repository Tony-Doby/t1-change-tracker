import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CreateRequestModal from '../components/CreateRequestModal'

export default function AgentDetailPage() {
  const { id } = useParams()
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'history' | 'm1' | 'as_t1'>('history')
  const [agent, setAgent] = useState<any>(null)
  const [t1History, setT1History] = useState<any[]>([])
  const [asT1History, setAsT1History] = useState<any[]>([])
  const [m1List, setM1List] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const { data: agentData } = await supabase.from('agents').select('*').eq('id', id).single()
    setAgent(agentData)

    const { data: m1Data } = await supabase.from('agents').select('*').eq('current_t1_id', id).is('deleted_at', null)
    setM1List(m1Data ?? [])

    const { data: histData } = await supabase.from('t1_changes').select('*').eq('agent_id', id).is('deleted_at', null).order('change_date', { ascending: false })
    setT1History(histData ?? [])

    const { data: asT1Data } = await supabase.from('t1_changes').select('*').or(`old_t1_id.eq.${id},new_t1_id.eq.${id}`).is('deleted_at', null).order('change_date', { ascending: false })
    setAsT1History(asT1Data ?? [])

    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Không tìm thấy agent</p>
        <Link to="/agents" className="text-primary hover:underline text-sm">Quay lại danh sách</Link>
      </div>
    )
  }

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return '—'
    if (agentId === agent.id) return `${agent.full_name} (${agent.staff_id})`
    return agentId.slice(0, 8)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/agents" className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Agent: {agent.full_name} ({agent.staff_id})</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md hover:bg-neutral-100 text-neutral-300">
            <Star className="w-5 h-5" />
          </button>
          <button onClick={() => setShowModal(true)} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">
            Tạo đề xuất đổi T1
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Thông tin Agent</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Mã NV</span><span className="text-neutral-900 font-medium">{agent.staff_id}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Cấp bậc</span><span className="text-neutral-900 font-medium">{agent.rank_name ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Ngày ký HĐ</span><span className="text-neutral-900 font-medium">{agent.contract_signing_date}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Trạng thái</span><span className={`font-medium ${agent.status === 'active' ? 'text-success' : 'text-neutral-500'}`}>{agent.status === 'active' ? 'Active' : 'Inactive'}</span></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-5 shadow-card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">T1 Hiện tại</h2>
            <p className="text-neutral-900 font-medium">{agent.current_t1_id?.slice(0, 8) ?? '—'}</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Ngưởi giới thiệu</h2>
            <p className="text-neutral-900 font-medium">{agent.introducing_agent_id?.slice(0, 8) ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card">
        <div className="flex border-b border-neutral-200">
          {[
            { key: 'history' as const, label: 'Lịch sử T1' },
            { key: 'm1' as const, label: `M1 (${m1List.length})` },
            { key: 'as_t1' as const, label: `Lịch sử làm T1 (${asT1History.length})` },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><div className="w-0.5 flex-1 bg-neutral-300" /></div>
                <div className="pb-4">
                  <p className="text-xs text-neutral-500">{agent.contract_signing_date}</p>
                  <p className="text-sm text-neutral-900">Tạo tài khoản, T1: {getAgentName(agent.current_t1_id)}</p>
                </div>
              </div>
              {t1History.map((c) => (
                <div key={c.id} className="flex gap-4">
                  <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><div className="w-0.5 flex-1 bg-neutral-300" /></div>
                  <div className="pb-4">
                    <p className="text-xs text-neutral-500">{new Date(c.change_date).toLocaleDateString('vi-VN')}</p>
                    <p className="text-sm text-neutral-900">Đổi T1 từ {getAgentName(c.old_t1_id)} sang {getAgentName(c.new_t1_id)}</p>
                  </div>
                </div>
              ))}
              {t1History.length === 0 && <p className="text-sm text-neutral-500 italic">Chưa có lịch sử đổi T1</p>}
            </div>
          )}

          {activeTab === 'm1' && (
            m1List.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50 border-b border-neutral-200"><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Mã</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Họ tên</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Cấp bậc</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Ngày ký HĐ</th></tr></thead>
                <tbody>{m1List.map((m) => (<tr key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50"><td className="px-3 py-2"><Link to={`/agents/${m.id}`} className="text-primary hover:underline">{m.staff_id}</Link></td><td className="px-3 py-2 text-neutral-900">{m.full_name}</td><td className="px-3 py-2 text-neutral-700">{m.rank_name ?? '—'}</td><td className="px-3 py-2 text-neutral-700">{m.contract_signing_date}</td></tr>))}</tbody>
              </table>
            ) : <p className="text-sm text-neutral-500 italic">Không có M1 nào</p>
          )}

          {activeTab === 'as_t1' && (
            asT1History.length > 0 ? (
              <div className="space-y-4">
                {asT1History.map((c) => (
                  <div key={c.id} className="flex gap-4">
                    <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><div className="w-0.5 flex-1 bg-neutral-300" /></div>
                    <div className="pb-4">
                      <p className="text-xs text-neutral-500">{new Date(c.change_date).toLocaleDateString('vi-VN')}</p>
                      <p className="text-sm text-neutral-900">{c.new_t1_id === id ? `Nhận agent ${getAgentName(c.agent_id)}` : `Agent ${getAgentName(c.agent_id)} chuyển đi`}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-neutral-500 italic">Agent này chưa từng làm T1 của ai</p>
          )}
        </div>
      </div>

      {showModal && id && <CreateRequestModal agentId={id} onClose={() => setShowModal(false)} />}
    </div>
  )
}
