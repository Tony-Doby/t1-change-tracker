export type UserRole = 'admin' | 'operator' | 'viewer'

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  must_change_password: boolean
  created_at: string
}

export interface Agent {
  id: string
  staff_id: string
  full_name: string
  email: string | null
  phone: string | null
  rank_name: string | null
  contract_signing_date: string
  current_t1_id: string | null
  introducing_agent_id: string | null
  division_id: number | null
  cumulative_personal_revenue: number | null
  my_era_points: number | null
  status: 'active' | 'inactive'
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type RequestStatus = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'completed' | 'cancelled'

export interface T1Request {
  id: string
  agent_id: string
  proposed_new_t1_id: string
  old_t1_id: string | null
  status: RequestStatus
  step1_sent_at: string | null
  step2_confirmed_at: string | null
  step3_era_notified_at: string | null
  step4_agent_confirmed_at: string | null
  step5_completed_at: string | null
  created_by: string | null
  cancelled_by: string | null
  cancelled_reason: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface T1Change {
  id: string
  agent_id: string
  old_t1_id: string | null
  new_t1_id: string
  request_id: string | null
  change_date: string
  reason: 'agent_request' | 't1_cut' | 'within_90d'
  is_grace_period: boolean
  is_counted_for_quota: boolean
  deleted_at: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  agent_id: string | null
  related_agent_id: string | null
  action_type: string
  old_t1_id: string | null
  new_t1_id: string | null
  request_id: string | null
  description: string | null
  created_by: string | null
  created_at: string
}

export interface RequestComment {
  id: string
  request_id: string
  content: string
  created_by: string
  created_at: string
}

export interface EmailTemplate {
  id: string
  template_key: string
  name: string
  subject: string
  body: string
  version: number
  created_at: string
  updated_at: string
}

export interface Holiday {
  id: string
  holiday_date: string
  name: string
  year: number
}

export interface M1TransitionTask {
  id: string
  parent_request_id: string
  departed_agent_id: string
  m1_agent_id: string
  temp_t1_id: string
  notify_date: string | null
  deadline_date: string
  status: 'pending' | 't2_assigned' | 'm1_changed' | 'expired'
  m1_decision: 'keep_t2' | 'choose_new_t1' | null
  new_t1_id: string | null
  new_request_id: string | null
  resolved_at: string | null
  depth: number
  created_at: string
}

export interface UserBookmark {
  id: string
  user_id: string
  agent_id: string
  created_at: string
}

export interface EligibilityResult {
  eligible: boolean
  reasons: string[]
}
