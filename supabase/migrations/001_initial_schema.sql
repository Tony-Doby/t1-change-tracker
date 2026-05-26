-- ============================================
-- T1 Change Tracker - Initial Schema
-- Supabase PostgreSQL
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. user_profiles (mở rộng auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user_profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. agents
-- ============================================
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rank_name TEXT,
  contract_signing_date DATE NOT NULL,
  current_t1_id UUID REFERENCES public.agents(id),
  introducing_agent_id UUID REFERENCES public.agents(id),
  division_id INTEGER,
  cumulative_personal_revenue NUMERIC DEFAULT 0,
  my_era_points NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. t1_requests (đề xuất đổi T1 - 5 bước)
-- ============================================
CREATE TABLE IF NOT EXISTS public.t1_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  proposed_new_t1_id UUID NOT NULL REFERENCES public.agents(id),
  old_t1_id UUID REFERENCES public.agents(id),
  status TEXT NOT NULL DEFAULT 'step1' CHECK (status IN ('step1', 'step2', 'step3', 'step4', 'step5', 'completed', 'cancelled')),
  step1_sent_at TIMESTAMPTZ,
  step2_confirmed_at TIMESTAMPTZ,
  step3_era_notified_at TIMESTAMPTZ,
  step4_agent_confirmed_at TIMESTAMPTZ,
  step5_completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_reason TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. t1_changes (lịch sử đổi T1 thành công)
-- ============================================
CREATE TABLE IF NOT EXISTS public.t1_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  old_t1_id UUID REFERENCES public.agents(id),
  new_t1_id UUID NOT NULL REFERENCES public.agents(id),
  request_id UUID REFERENCES public.t1_requests(id) ON DELETE SET NULL,
  change_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'agent_request' CHECK (reason IN ('agent_request', 't1_cut', 'within_90d')),
  is_grace_period BOOLEAN NOT NULL DEFAULT false,
  is_counted_for_quota BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. request_comments
-- ============================================
CREATE TABLE IF NOT EXISTS public.request_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.t1_requests(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. request_notifications
-- ============================================
CREATE TABLE IF NOT EXISTS public.request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.t1_requests(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('agent', 'introducer', 'old_upline', 'new_upline', 'old_downline')),
  recipient_agent_id UUID REFERENCES public.agents(id),
  notified_at TIMESTAMPTZ
);

-- ============================================
-- 7. user_bookmarks
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- ============================================
-- 8. activity_logs
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES public.agents(id),
  related_agent_id UUID REFERENCES public.agents(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('t1_changed', 'template_generated', 'm1_chose_new_t1', 'm1_stayed_with_t2', 'request_created', 'request_completed', 'request_step_changed')),
  old_t1_id UUID REFERENCES public.agents(id),
  new_t1_id UUID REFERENCES public.agents(id),
  request_id UUID REFERENCES public.t1_requests(id),
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. email_templates
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. holidays
-- ============================================
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  UNIQUE(holiday_date, year)
);

-- ============================================
-- 11. m1_transition_tasks
-- ============================================
CREATE TABLE IF NOT EXISTS public.m1_transition_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_request_id UUID NOT NULL REFERENCES public.t1_requests(id),
  departed_agent_id UUID NOT NULL REFERENCES public.agents(id),
  m1_agent_id UUID NOT NULL REFERENCES public.agents(id),
  temp_t1_id UUID NOT NULL REFERENCES public.agents(id),
  notify_date TIMESTAMPTZ,
  deadline_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 't2_assigned', 'm1_changed', 'expired')),
  m1_decision TEXT CHECK (m1_decision IN ('keep_t2', 'choose_new_t1')),
  new_t1_id UUID REFERENCES public.agents(id),
  new_request_id UUID REFERENCES public.t1_requests(id),
  resolved_at TIMESTAMPTZ,
  depth INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RLS - Enable on all tables
-- ============================================
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.t1_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.t1_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m1_transition_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- RLS Policies
-- ============================================

-- agents: admin full, operator read+write, viewer read
CREATE POLICY "agents_admin_all" ON public.agents FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "agents_operator_select" ON public.agents FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "agents_operator_write" ON public.agents FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'operator'));
CREATE POLICY "agents_operator_update" ON public.agents FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('admin', 'operator'));

-- t1_changes: admin full, others read only
CREATE POLICY "t1_changes_all" ON public.t1_changes FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "t1_changes_read" ON public.t1_changes FOR SELECT TO authenticated
  USING (true);

-- t1_requests: admin full, operator create/update, viewer read
CREATE POLICY "t1_requests_admin_all" ON public.t1_requests FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "t1_requests_read" ON public.t1_requests FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "t1_requests_operator_write" ON public.t1_requests FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'operator'));
CREATE POLICY "t1_requests_operator_update" ON public.t1_requests FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('admin', 'operator'));

-- request_comments: admin full, operator insert, all read
CREATE POLICY "request_comments_all" ON public.request_comments FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "request_comments_read" ON public.request_comments FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "request_comments_operator_insert" ON public.request_comments FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'operator'));

-- request_notifications: admin full, operator insert/update, all read
CREATE POLICY "request_notifications_all" ON public.request_notifications FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "request_notifications_read" ON public.request_notifications FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "request_notifications_operator_write" ON public.request_notifications FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'operator'));
CREATE POLICY "request_notifications_operator_update" ON public.request_notifications FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('admin', 'operator'));

-- user_bookmarks: each user sees own
CREATE POLICY "user_bookmarks_own" ON public.user_bookmarks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- activity_logs: admin full, all read
CREATE POLICY "activity_logs_admin" ON public.activity_logs FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "activity_logs_read" ON public.activity_logs FOR SELECT TO authenticated
  USING (true);

-- email_templates: admin full, all read
CREATE POLICY "email_templates_admin" ON public.email_templates FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "email_templates_read" ON public.email_templates FOR SELECT TO authenticated
  USING (true);

-- holidays: admin full, all read
CREATE POLICY "holidays_admin" ON public.holidays FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "holidays_read" ON public.holidays FOR SELECT TO authenticated
  USING (true);

-- m1_transition_tasks: admin full, operator update, all read
CREATE POLICY "m1_transition_admin" ON public.m1_transition_tasks FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "m1_transition_read" ON public.m1_transition_tasks FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "m1_transition_operator_update" ON public.m1_transition_tasks FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('admin', 'operator'));

-- user_profiles: admin full, user sees own and can update own profile
CREATE POLICY "user_profiles_admin" ON public.user_profiles FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "user_profiles_own" ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "user_profiles_own_update" ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================
-- RPC Functions
-- ============================================

-- Check eligibility for T1 change
CREATE OR REPLACE FUNCTION public.check_eligibility(p_agent_id UUID, p_proposed_t1_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_agent RECORD;
  v_days INTEGER;
  v_change_count INTEGER;
  v_last_change DATE;
  v_days_since_last INTEGER;
  v_reasons TEXT[] := '{}';
  v_eligible BOOLEAN := true;
  v_rank_lower TEXT;
BEGIN
  -- Get agent info
  SELECT * INTO v_agent FROM public.agents WHERE id = p_agent_id AND deleted_at IS NULL;
  IF v_agent IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['Agent không tồn tại']);
  END IF;
  v_rank_lower := LOWER(COALESCE(v_agent.rank_name, ''));

  -- Basic validation
  IF p_proposed_t1_id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['Vui lòng chọn T1 mới']);
  END IF;
  IF p_proposed_t1_id = p_agent_id THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['Không thể chọn chính mình làm T1']);
  END IF;
  IF p_proposed_t1_id = v_agent.current_t1_id THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['T1 mới không được trùng với T1 hiện tại']);
  END IF;

  v_days := CURRENT_DATE - v_agent.contract_signing_date;

  -- Count changes
  SELECT COUNT(*) INTO v_change_count
  FROM public.t1_changes
  WHERE agent_id = p_agent_id AND is_counted_for_quota = true AND deleted_at IS NULL;

  SELECT change_date INTO v_last_change
  FROM public.t1_changes
  WHERE agent_id = p_agent_id AND deleted_at IS NULL
  ORDER BY change_date DESC LIMIT 1;

  v_days_since_last := CASE WHEN v_last_change IS NOT NULL THEN CURRENT_DATE - v_last_change ELSE NULL END;

  -- Days since contract
  v_reasons := array_append(v_reasons, format('✅ Tham gia %s ngày %s', v_days, CASE WHEN v_days <= 90 THEN '(trong 90 ngày ưu đãi)' ELSE '(>91 ngày)' END));

  -- Within 90 days
  IF v_days <= 90 THEN
    IF v_change_count >= 1 THEN
      v_reasons := array_append(v_reasons, format('❌ Đã đổi T1 %s lần trong 90 ngày đầu (tối đa 1 lần)', v_change_count));
      v_eligible := false;
    ELSE
      v_reasons := array_append(v_reasons, '✅ Trong 90 ngày đầu, chưa đổi T1 lần nào');
    END IF;
  ELSE
    -- After 91 days
    IF v_change_count >= 3 THEN
      v_reasons := array_append(v_reasons, format('❌ Đã đổi T1 %s lần (tối đa 3 lần)', v_change_count));
      v_eligible := false;
    ELSE
      v_reasons := array_append(v_reasons, format('✅ Đã đổi T1 %s/3 lần', v_change_count));
    END IF;

    IF v_rank_lower = 'asc' THEN
      v_reasons := array_append(v_reasons, format('❌ Cấp bậc hiện tại "%s" không đạt yêu cầu (không được là ASC)', COALESCE(v_agent.rank_name, '—')));
      v_eligible := false;
    ELSE
      v_reasons := array_append(v_reasons, format('✅ Cấp bậc: %s (đạt yêu cầu)', v_agent.rank_name));
    END IF;

    IF v_days_since_last IS NOT NULL AND v_days_since_last < 180 THEN
      v_reasons := array_append(v_reasons, format('❌ Mới đổi T1 cách đây %s ngày (cần >= 180 ngày)', v_days_since_last));
      v_eligible := false;
    ELSE
      v_reasons := array_append(v_reasons, format('✅ %s', CASE WHEN v_days_since_last IS NOT NULL THEN format('Đã %s ngày từ lần đổi trước (>180 ngày)', v_days_since_last) ELSE 'Chưa từng đổi T1' END));
    END IF;
  END IF;

  RETURN jsonb_build_object('eligible', v_eligible, 'reasons', v_reasons);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process expired M1 transitions (lazy processing)
CREATE OR REPLACE FUNCTION public.process_expired_m1_transitions()
RETURNS TABLE (
  task_id UUID,
  m1_agent_id UUID,
  new_t1_id UUID,
  processed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.m1_transition_tasks
  SET status = 'expired',
      resolved_at = NOW()
  WHERE status = 'pending'
    AND deadline_date < CURRENT_DATE
  RETURNING public.m1_transition_tasks.id,
            public.m1_transition_tasks.m1_agent_id,
            public.m1_transition_tasks.temp_t1_id,
            true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- T1 Capacity info
CREATE OR REPLACE FUNCTION public.get_t1_capacity(p_t1_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_mentee_count INTEGER;
  v_recent_accept_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mentee_count
  FROM public.agents
  WHERE current_t1_id = p_t1_id AND deleted_at IS NULL AND status = 'active';

  SELECT COUNT(*) INTO v_recent_accept_count
  FROM public.t1_changes
  WHERE new_t1_id = p_t1_id AND deleted_at IS NULL
    AND change_date >= CURRENT_DATE - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'menteeCount', v_mentee_count,
    'recentAcceptCount', v_recent_accept_count,
    'warning', v_mentee_count > 10 OR v_recent_accept_count > 3
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Insert default email templates
-- ============================================
INSERT INTO public.email_templates (template_key, name, subject, body)
VALUES
  ('transfer_complete', 'Thông báo chuyển line (T1 thành công)', '[Thông báo] Agent {{agentName}} đã chuyển T1', 'Kính gửi {{agentName}},\n\nBạn đã được chuyển sang T1 mới là {{newT1Name}}.\nT1 cũ của bạn: {{oldT1Name}}.\n\nTrân trọng,\nPhòng Vận Hành ERA'),
  ('30_days_notice', 'Thông báo 30 ngày suy nghĩ', '[Thông báo] Hạn chót chọn T1 mới', 'Kính gửi {{agentName}},\n\nBạn có 30 ngày kể từ {{notifyDate}} để chọn T1 mới. Hạn chót: {{deadlineDate}}.\nNếu không chọn, T2 {{tempT1Name}} sẽ chính thức trở thành T1 của bạn.\n\nTrân trọng,\nPhòng Vận Hành ERA'),
  ('temp_t1_assigned', 'Thông báo T1 tạm thờii', '[Thông báo] T1 tạm thờii được chỉ định', 'Kính gửi {{agentName}},\n\nDo T1 cũ {{oldT1Name}} đã chuyển line, T2 {{tempT1Name}} sẽ đóng vai trò T1 tạm thờii trong 30 ngày.\n\nTrân trọng,\nPhòng Vận Hành ERA')
ON CONFLICT (template_key) DO NOTHING;
