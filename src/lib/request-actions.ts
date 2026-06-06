import { supabase } from './supabase'
import { createNotificationsForAdmins } from './notifications'

export interface CompleteRequestInput {
  id: string
  agent_id: string
  old_t1_id: string | null
  proposed_new_t1_id: string
}

export async function completeRequestAction(
  request: CompleteRequestInput,
  userId: string | undefined
) {
  const now = new Date().toISOString()

  // 0. Guard: check if already completed to prevent duplicates
  const { data: reqCheck } = await supabase
    .from('t1_requests')
    .select('status')
    .eq('id', request.id)
    .single()

  if (reqCheck?.status === 'completed') {
    throw new Error('Request đã được hoàn tất trước đó')
  }

  // 1. Update request to completed
  const { error: reqError } = await supabase
    .from('t1_requests')
    .update({ status: 'completed', step5_completed_at: now, updated_at: now })
    .eq('id', request.id)
  if (reqError) throw reqError

  // 2. Insert t1_changes
  const { error: changeError } = await supabase.from('t1_changes').insert({
    agent_id: request.agent_id,
    old_t1_id: request.old_t1_id,
    new_t1_id: request.proposed_new_t1_id,
    request_id: request.id,
    change_date: now.slice(0, 10),
    reason: 'agent_request',
  })
  if (changeError) throw changeError

  // 3. Update agent current T1 (referrer_id synced via DB trigger)
  const { error: agentError } = await supabase
    .from('agents')
    .update({ current_t1_id: request.proposed_new_t1_id })
    .eq('id', request.agent_id)
  if (agentError) throw agentError

  // 4. Resolve any pending/expired M1 transition tasks for this agent
  // since they now have an official new T1
  const { error: resolveTaskError } = await supabase
    .from('m1_transition_tasks')
    .update({ status: 'm1_changed', resolved_at: now })
    .eq('m1_agent_id', request.agent_id)
    .in('status', ['pending', 'expired'])
  if (resolveTaskError) throw resolveTaskError

  // 5. Log activity
  await supabase.from('activity_logs').insert({
    agent_id: request.agent_id,
    action_type: 't1_changed',
    old_t1_id: request.old_t1_id,
    new_t1_id: request.proposed_new_t1_id,
    request_id: request.id,
    description: 'Hoàn tất đổi T1',
    created_by: userId,
  })

  // 6. Query M1s of the departed agent
  const { data: m1s } = await supabase
    .from('agents')
    .select('id')
    .eq('current_t1_id', request.agent_id)
    .is('deleted_at', null)

  if (m1s && m1s.length > 0) {
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const tasks = m1s.map((m1) => ({
      parent_request_id: request.id,
      departed_agent_id: request.agent_id,
      m1_agent_id: m1.id,
      temp_t1_id: request.old_t1_id,
      notify_date: now,
      deadline_date: deadline,
      status: 'pending' as const,
      depth: 1,
    }))
    const { error: taskError } = await supabase.from('m1_transition_tasks').insert(tasks)
    if (taskError) throw taskError
  }

  // 7. Move M1s under temp T1 (or set null if agent had no old T1)
  const { error: m1UpdateError } = await supabase
    .from('agents')
    .update({ current_t1_id: request.old_t1_id })
    .eq('current_t1_id', request.agent_id)
    .is('deleted_at', null)
  if (m1UpdateError) throw m1UpdateError

  // 8. Notify admins
  createNotificationsForAdmins([{
    type: 'request_completed',
    title: 'Đề xuất đã hoàn tất',
    message: `Đề xuất đổi T1 đã được hoàn tất`,
    link: `/requests/${request.id}`,
  }])
}
