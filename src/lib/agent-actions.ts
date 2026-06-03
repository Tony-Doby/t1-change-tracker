import { supabase } from './supabase'
import { createNotificationsForAdmins } from './notifications'

export interface DeactivateInput {
  agentId: string
  endDate: string
  reason: string
  userId?: string
}

export async function deactivateAgent({ agentId, endDate, reason, userId }: DeactivateInput) {
  const now = new Date().toISOString()

  // 1. Create snapshot
  const { data: snapshot, error: snapshotError } = await supabase.rpc('create_deactivation_snapshot', {
    p_agent_id: agentId,
    p_deactivated_by: userId ?? null,
    p_end_date: endDate,
    p_reason: reason,
  })
  if (snapshotError) throw snapshotError

  // 2. Update agent status
  const { error: agentError } = await supabase
    .from('agents')
    .update({
      status: 'inactive',
      end_date: endDate,
      deactivation_reason: reason,
      updated_at: now,
    })
    .eq('id', agentId)
  if (agentError) throw agentError

  // 3. Insert timeline event
  await supabase.from('agent_timeline_events').insert({
    agent_id: agentId,
    user_id: userId ?? null,
    kind: 'deactivated',
    action: 'deactivate',
    message: `Agent deactivated: ${reason}`,
    created_at: now,
  })

  // 4. Query deactivated agent's T1 (will become temp T1 for M1s)
  const { data: deactivatedAgent } = await supabase
    .from('agents')
    .select('current_t1_id')
    .eq('id', agentId)
    .single()

  const deactivatedAgentT1 = deactivatedAgent?.current_t1_id ?? null

  // 5. Query M1s and create transition tasks
  const { data: m1s } = await supabase
    .from('agents')
    .select('id')
    .eq('current_t1_id', agentId)
    .is('deleted_at', null)
    .eq('status', 'active')

  if (m1s && m1s.length > 0) {
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const tasks = m1s.map((m1) => ({
      parent_request_id: null as string | null,
      departed_agent_id: agentId,
      m1_agent_id: m1.id,
      temp_t1_id: deactivatedAgentT1,
      notify_date: now,
      deadline_date: deadline,
      status: 'pending' as const,
      depth: 1,
    }))
    const { error: taskError } = await supabase.from('m1_transition_tasks').insert(tasks)
    if (taskError) throw taskError
  }

  createNotificationsForAdmins([{
    type: 'agent_deactivated',
    title: 'Agent đã bị chấm dứt hoạt động',
    message: `Agent đã bị chấm dứt hoạt động từ ngày ${endDate}`,
  }])

  return { snapshotId: snapshot }
}

export interface RestoreInput {
  agentId: string
  mode: 'full' | 'light'
  userId?: string
}

export async function restoreAgent({ agentId, mode, userId }: RestoreInput) {
  const now = new Date().toISOString()

  // 1. Update agent status
  const { error: agentError } = await supabase
    .from('agents')
    .update({
      status: 'active',
      end_date: null,
      deactivation_reason: null,
      updated_at: now,
    })
    .eq('id', agentId)
  if (agentError) throw agentError

  // 2. Mark snapshot as restored
  const { error: snapshotError } = await supabase
    .from('agent_deactivation_snapshots')
    .update({ restored_at: now, restored_by: userId ?? null })
    .eq('agent_id', agentId)
    .is('restored_at', null)
  if (snapshotError) throw snapshotError

  // 3. Insert timeline event
  await supabase.from('agent_timeline_events').insert({
    agent_id: agentId,
    user_id: userId ?? null,
    kind: 'restored',
    action: 'restore',
    message: `Agent restored (${mode})`,
    created_at: now,
  })

  // 4. Cancel pending transition tasks for this departed agent
  const { error: cancelError } = await supabase
    .from('m1_transition_tasks')
    .update({ status: 'expired', resolved_at: now })
    .eq('departed_agent_id', agentId)
    .eq('status', 'pending')
  if (cancelError) throw cancelError

  // 5. Restore downline if full mode
  if (mode === 'full') {
    const { error: restoreError } = await supabase
      .from('agents')
      .update({ current_t1_id: agentId })
      .eq('current_t1_id', agentId)
      .is('deleted_at', null)
    if (restoreError) throw restoreError
  } else {
    // Light mode: only restore M1s that haven't chosen a new T1
    const { data: pendingM1s } = await supabase
      .from('m1_transition_tasks')
      .select('m1_agent_id')
      .eq('departed_agent_id', agentId)
      .eq('status', 'expired')

    if (pendingM1s && pendingM1s.length > 0) {
      const m1Ids = pendingM1s.map((t) => t.m1_agent_id)
      const { error: lightError } = await supabase
        .from('agents')
        .update({ current_t1_id: agentId })
        .in('id', m1Ids)
      if (lightError) throw lightError
    }
  }

  createNotificationsForAdmins([{
    type: 'agent_restored',
    title: 'Agent đã được kích hoạt lại',
    message: `Agent đã được kích hoạt lại (mode: ${mode})`,
  }])

  return { success: true }
}
