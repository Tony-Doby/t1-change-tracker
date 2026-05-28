-- ============================================
-- FEAT-006: Schema v2 — Align agents table with eravnTrans
-- ============================================

-- ============================================
-- 1. New tables
-- ============================================

-- divisions (eravnTrans + custom fields for T1 Tracker)
CREATE TABLE IF NOT EXISTS public.divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  head_agent_id UUID REFERENCES public.agents(id),
  is_official BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  established_at DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- division_head_history
CREATE TABLE IF NOT EXISTS public.division_head_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  head_agent_id UUID REFERENCES public.agents(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- rank_profiles
CREATE TABLE IF NOT EXISTS public.rank_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ranks (aligned with eravnTrans)
CREATE TABLE IF NOT EXISTS public.ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_profile_id UUID REFERENCES public.rank_profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  rank_type VARCHAR(20),
  revenue_threshold NUMERIC(18,0),
  commission_tier INTEGER,
  t0_rate NUMERIC(10,4),
  t1_rate NUMERIC(10,4),
  t2_rate NUMERIC(10,4),
  t3_rate NUMERIC(10,4),
  t4_rate NUMERIC(10,4),
  t1_unlock NUMERIC(18,0),
  t2_unlock NUMERIC(18,0),
  t3_unlock NUMERIC(18,0),
  t4_unlock NUMERIC(18,0),
  head_rate NUMERIC(10,4),
  division_rate NUMERIC(10,4),
  group_division_rate NUMERIC(10,4),
  profit_sharing_pool_rate NUMERIC(10,4),
  sort_order INTEGER,
  non_upgradable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- agent_referrer_log (T1/upline history)
CREATE TABLE IF NOT EXISTS public.agent_referrer_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES public.agents(id),
  effective_date DATE,
  end_date DATE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- agent_info_history_log (field change history)
CREATE TABLE IF NOT EXISTS public.agent_info_history_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  changed_field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- agent_timeline_events (audit log)
CREATE TABLE IF NOT EXISTS public.agent_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind VARCHAR(20) NOT NULL,
  status VARCHAR(30),
  action TEXT,
  message TEXT,
  message_ref UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Seed default divisions
-- ============================================
INSERT INTO public.divisions (name, is_default, is_active)
VALUES ('Khác', true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ALTER agents — add new columns
-- ============================================
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS agent_code TEXT,
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.agents(id),
  ADD COLUMN IF NOT EXISTS rank_id UUID REFERENCES public.ranks(id),
  ADD COLUMN IF NOT EXISTS register_date DATE,
  ADD COLUMN IF NOT EXISTS agent_start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
  ADD COLUMN IF NOT EXISTS business_email TEXT,
  ADD COLUMN IF NOT EXISTS id_card_number TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS id_card_issue_date DATE,
  ADD COLUMN IF NOT EXISTS id_card_issue_place TEXT,
  ADD COLUMN IF NOT EXISTS permanent_address TEXT,
  ADD COLUMN IF NOT EXISTS place_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS tax_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch_name TEXT,
  ADD COLUMN IF NOT EXISTS active_area TEXT,
  ADD COLUMN IF NOT EXISTS real_estate_experience TEXT,
  ADD COLUMN IF NOT EXISTS broker_licence_number TEXT,
  ADD COLUMN IF NOT EXISTS broker_licence_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS success_seminar_date DATE,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS special_bonus_profile_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create unique index on agent_code (nullable unique requires partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_agent_code ON public.agents(agent_code) WHERE agent_code IS NOT NULL;

-- ============================================
-- 4. Seed ranks from existing rank_name values
-- ============================================
INSERT INTO public.ranks (name)
SELECT DISTINCT rank_name FROM public.agents WHERE rank_name IS NOT NULL AND rank_name <> ''
ON CONFLICT DO NOTHING;

-- Update agents.rank_id from rank_name
UPDATE public.agents a
SET rank_id = r.id
FROM public.ranks r
WHERE a.rank_name = r.name AND a.rank_id IS NULL;

-- ============================================
-- 5. Copy existing data to new columns
-- ============================================
UPDATE public.agents
SET referrer_id = current_t1_id
WHERE referrer_id IS NULL AND current_t1_id IS NOT NULL;

UPDATE public.agents
SET agent_code = staff_id
WHERE agent_code IS NULL;

-- ============================================
-- 6. Sync trigger: current_t1_id <=> referrer_id
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_agent_t1_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.current_t1_id IS DISTINCT FROM OLD.current_t1_id AND NEW.referrer_id IS NOT DISTINCT FROM OLD.referrer_id THEN
      NEW.referrer_id := NEW.current_t1_id;
    ELSIF NEW.referrer_id IS DISTINCT FROM OLD.referrer_id AND NEW.current_t1_id IS NOT DISTINCT FROM OLD.current_t1_id THEN
      NEW.current_t1_id := NEW.referrer_id;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.referrer_id IS NULL AND NEW.current_t1_id IS NOT NULL THEN
      NEW.referrer_id := NEW.current_t1_id;
    ELSIF NEW.current_t1_id IS NULL AND NEW.referrer_id IS NOT NULL THEN
      NEW.current_t1_id := NEW.referrer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_agent_t1_fields ON public.agents;
CREATE TRIGGER trg_sync_agent_t1_fields
  BEFORE INSERT OR UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.sync_agent_t1_fields();

-- ============================================
-- 7. Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agents_updated_at ON public.agents;
CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 8. Division recomputation trigger on referrer_id change
-- ============================================
CREATE OR REPLACE FUNCTION public.recompute_division_on_referrer_change()
RETURNS TRIGGER AS $$
DECLARE
  v_division_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.referrer_id IS DISTINCT FROM OLD.referrer_id THEN
    -- Logic: if agent has a T1, find the first head_agent_id up the tree
    -- If none found, fallback to explicit division_id or default division
    WITH RECURSIVE upline AS (
      SELECT id, referrer_id, division_id FROM public.agents WHERE id = NEW.id
      UNION ALL
      SELECT a.id, a.referrer_id, a.division_id
      FROM public.agents a
      INNER JOIN upline u ON a.id = u.referrer_id
      WHERE u.referrer_id IS NOT NULL
    )
    SELECT d.id INTO v_division_id
    FROM upline u
    JOIN public.divisions d ON d.head_agent_id = u.id
    WHERE d.is_active = true
    LIMIT 1;

    IF v_division_id IS NOT NULL THEN
      NEW.division_id := v_division_id;
    ELSIF NEW.division_id IS NULL THEN
      SELECT id INTO v_division_id FROM public.divisions WHERE is_default = true LIMIT 1;
      NEW.division_id := v_division_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recompute_division ON public.agents;
CREATE TRIGGER trg_recompute_division
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  WHEN (pg_trigger_depth() < 1)
  EXECUTE FUNCTION public.recompute_division_on_referrer_change();

-- ============================================
-- 9. Update RPC functions to support new schema
-- ============================================

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
  v_rank_name TEXT;
BEGIN
  SELECT * INTO v_agent FROM public.agents WHERE id = p_agent_id AND deleted_at IS NULL;
  IF v_agent IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['Agent không tồn tại']);
  END IF;

  -- Resolve rank name from rank_id or rank_name
  v_rank_name := COALESCE(v_agent.rank_name, '');
  IF v_rank_name = '' AND v_agent.rank_id IS NOT NULL THEN
    SELECT name INTO v_rank_name FROM public.ranks WHERE id = v_agent.rank_id;
  END IF;
  v_rank_lower := LOWER(COALESCE(v_rank_name, ''));

  IF p_proposed_t1_id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['Vui lòng chọn T1 mới']);
  END IF;
  IF p_proposed_t1_id = p_agent_id THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['Không thể chọn chính mình làm T1']);
  END IF;
  IF p_proposed_t1_id = COALESCE(v_agent.referrer_id, v_agent.current_t1_id) THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['T1 mới không được trùng với T1 hiện tại']);
  END IF;

  v_days := CURRENT_DATE - v_agent.contract_signing_date;

  SELECT COUNT(*) INTO v_change_count
  FROM public.t1_changes
  WHERE agent_id = p_agent_id AND is_counted_for_quota = true AND deleted_at IS NULL;

  SELECT change_date INTO v_last_change
  FROM public.t1_changes
  WHERE agent_id = p_agent_id AND deleted_at IS NULL
  ORDER BY change_date DESC LIMIT 1;

  v_days_since_last := CASE WHEN v_last_change IS NOT NULL THEN CURRENT_DATE - v_last_change ELSE NULL END;

  v_reasons := array_append(v_reasons, format('✅ Tham gia %s ngày %s', v_days, CASE WHEN v_days <= 90 THEN '(trong 90 ngày ưu đãi)' ELSE '(>91 ngày)' END));

  IF v_days <= 90 THEN
    IF v_change_count >= 1 THEN
      v_reasons := array_append(v_reasons, format('❌ Đã đổi T1 %s lần trong 90 ngày đầu (tối đa 1 lần)', v_change_count));
      v_eligible := false;
    ELSE
      v_reasons := array_append(v_reasons, '✅ Trong 90 ngày đầu, chưa đổi T1 lần nào');
    END IF;
  ELSE
    IF v_change_count >= 3 THEN
      v_reasons := array_append(v_reasons, format('❌ Đã đổi T1 %s lần (tối đa 3 lần)', v_change_count));
      v_eligible := false;
    ELSE
      v_reasons := array_append(v_reasons, format('✅ Đã đổi T1 %s/3 lần', v_change_count));
    END IF;

    IF v_rank_lower = 'asc' THEN
      v_reasons := array_append(v_reasons, format('❌ Cấp bậc hiện tại "%s" không đạt yêu cầu (không được là ASC)', COALESCE(v_rank_name, '—')));
      v_eligible := false;
    ELSE
      v_reasons := array_append(v_reasons, format('✅ Cấp bậc: %s (đạt yêu cầu)', v_rank_name));
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

CREATE OR REPLACE FUNCTION public.get_t1_capacity(p_t1_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_mentee_count INTEGER;
  v_recent_accept_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mentee_count
  FROM public.agents
  WHERE COALESCE(referrer_id, current_t1_id) = p_t1_id AND deleted_at IS NULL AND status = 'active';

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
-- 10. RLS for new tables
-- ============================================
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_head_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_referrer_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_info_history_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_timeline_events ENABLE ROW LEVEL SECURITY;

-- divisions: admin full, all read
CREATE POLICY "divisions_admin" ON public.divisions FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "divisions_read" ON public.divisions FOR SELECT TO authenticated USING (true);

-- division_head_history: admin full, all read
CREATE POLICY "division_head_history_admin" ON public.division_head_history FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "division_head_history_read" ON public.division_head_history FOR SELECT TO authenticated USING (true);

-- rank_profiles: admin full, all read
CREATE POLICY "rank_profiles_admin" ON public.rank_profiles FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "rank_profiles_read" ON public.rank_profiles FOR SELECT TO authenticated USING (true);

-- ranks: admin full, all read
CREATE POLICY "ranks_admin" ON public.ranks FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "ranks_read" ON public.ranks FOR SELECT TO authenticated USING (true);

-- agent_referrer_log: admin full, all read
CREATE POLICY "agent_referrer_log_admin" ON public.agent_referrer_log FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "agent_referrer_log_read" ON public.agent_referrer_log FOR SELECT TO authenticated USING (true);

-- agent_info_history_log: admin full, all read
CREATE POLICY "agent_info_history_log_admin" ON public.agent_info_history_log FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "agent_info_history_log_read" ON public.agent_info_history_log FOR SELECT TO authenticated USING (true);

-- agent_timeline_events: admin full, all read
CREATE POLICY "agent_timeline_events_admin" ON public.agent_timeline_events FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "agent_timeline_events_read" ON public.agent_timeline_events FOR SELECT TO authenticated USING (true);

-- ============================================
-- 11. Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agents_referrer_id ON public.agents(referrer_id);
CREATE INDEX IF NOT EXISTS idx_agents_rank_id ON public.agents(rank_id);
CREATE INDEX IF NOT EXISTS idx_agent_timeline_events_agent ON public.agent_timeline_events(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_info_history_log_agent ON public.agent_info_history_log(agent_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_agent_referrer_log_agent ON public.agent_referrer_log(agent_id, effective_date);
