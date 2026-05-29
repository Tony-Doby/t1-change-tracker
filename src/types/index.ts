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
  agent_code: string | null
  full_name: string
  email: string | null
  phone: string | null
  rank_name: string | null
  rank_id: string | null
  contract_signing_date: string
  current_t1_id: string | null
  referrer_id: string | null
  introducing_agent_id: string | null
  division_id: string | null
  cumulative_personal_revenue: number | null
  status: 'active' | 'inactive'
  register_date: string | null
  agent_start_date: string | null
  end_date: string | null
  deactivation_reason: string | null
  business_email: string | null
  id_card_number: string | null
  date_of_birth: string | null
  id_card_issue_date: string | null
  id_card_issue_place: string | null
  permanent_address: string | null
  place_of_origin: string | null
  gender: string | null
  tax_code: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_branch_name: string | null
  active_area: string | null
  real_estate_experience: string | null
  broker_licence_number: string | null
  broker_licence_expiry_date: string | null
  success_seminar_date: string | null
  source: string | null
  special_bonus_profile_id: string | null
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
  parent_request_id: string | null
  departed_agent_id: string
  m1_agent_id: string
  temp_t1_id: string | null
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

// FEAT-006: Schema v2 new tables

export interface Division {
  id: string
  name: string
  head_agent_id: string | null
  is_official: boolean
  is_default: boolean
  established_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DivisionHeadHistory {
  id: string
  division_id: string
  head_agent_id: string | null
  started_at: string
  ended_at: string | null
  reason: string | null
  created_by: string | null
}

export interface RankProfile {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface Rank {
  id: string
  rank_profile_id: string | null
  name: string
  rank_type: string | null
  revenue_threshold: number | null
  commission_tier: number | null
  t0_rate: number | null
  t1_rate: number | null
  t2_rate: number | null
  t3_rate: number | null
  t4_rate: number | null
  t1_unlock: number | null
  t2_unlock: number | null
  t3_unlock: number | null
  t4_unlock: number | null
  head_rate: number | null
  division_rate: number | null
  group_division_rate: number | null
  profit_sharing_pool_rate: number | null
  sort_order: number | null
  non_upgradable: boolean
  created_at: string
}

export interface AgentReferrerLog {
  id: string
  agent_id: string
  referrer_id: string | null
  effective_date: string | null
  end_date: string | null
  reason: string | null
  created_at: string
}

export interface AgentInfoHistoryLog {
  id: string
  agent_id: string
  changed_field: string
  old_value: string | null
  new_value: string | null
  changed_by_id: string | null
  changed_at: string
}

export interface AgentTimelineEvent {
  id: string
  agent_id: string
  user_id: string | null
  kind: string
  status: string | null
  action: string | null
  message: string | null
  message_ref: string | null
  created_at: string
}

// FEAT-003: In-app Notifications

export interface Notification {
  id: string
  user_id: string
  type: 'request_new' | 'comment_new' | 'b2_alert' | 'm1_expired' | 'request_completed' | 'request_cancelled' | 'agent_deactivated' | 'agent_restored'
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

// FEAT-007: Agent Deactivation

export interface AgentDeactivationSnapshot {
  id: string
  agent_id: string
  deactivated_at: string
  deactivated_by: string | null
  end_date: string
  deactivation_reason: string
  referrer_id: string | null
  division_id: string | null
  rank_id: string | null
  cumulative_personal_revenue: number | null
  snapshot_data: Record<string, unknown>
  restored_at: string | null
  restored_by: string | null
}
