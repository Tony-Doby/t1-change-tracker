-- ============================================
-- FEAT-007: Agent Deactivation với Restore Point & Downline Transition
-- ============================================

-- ============================================
-- 1. Make parent_request_id nullable for deactivation-created tasks
-- ============================================
ALTER TABLE public.m1_transition_tasks
ALTER COLUMN parent_request_id DROP NOT NULL;

-- ============================================
-- 2. Create agent_deactivation_snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_deactivation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  deactivated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  end_date DATE NOT NULL,
  deactivation_reason TEXT NOT NULL,
  referrer_id UUID,
  division_id UUID,
  rank_id UUID,
  cumulative_personal_revenue NUMERIC,
  snapshot_data JSONB NOT NULL,
  restored_at TIMESTAMPTZ,
  restored_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_deactivation_snapshots_agent
  ON public.agent_deactivation_snapshots(agent_id, deactivated_at DESC);

-- ============================================
-- 3. Seed agent_referrer_log from existing t1_changes
-- ============================================
INSERT INTO public.agent_referrer_log (agent_id, referrer_id, effective_date, reason)
SELECT
  agent_id,
  new_t1_id,
  change_date,
  'migrated_from_t1_changes'
FROM public.t1_changes
WHERE deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. RLS for agent_deactivation_snapshots
-- ============================================
ALTER TABLE public.agent_deactivation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_deactivation_snapshots_admin" ON public.agent_deactivation_snapshots FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "agent_deactivation_snapshots_read" ON public.agent_deactivation_snapshots FOR SELECT TO authenticated
  USING (true);

-- ============================================
-- 5. Helper function: create deactivation snapshot
-- ============================================
CREATE OR REPLACE FUNCTION public.create_deactivation_snapshot(
  p_agent_id UUID,
  p_deactivated_by UUID,
  p_end_date DATE,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_agent RECORD;
BEGIN
  SELECT * INTO v_agent FROM public.agents WHERE id = p_agent_id;
  IF v_agent IS NULL THEN
    RAISE EXCEPTION 'Agent not found';
  END IF;

  INSERT INTO public.agent_deactivation_snapshots (
    agent_id, deactivated_by, end_date, deactivation_reason,
    referrer_id, division_id, rank_id, cumulative_personal_revenue, snapshot_data
  ) VALUES (
    p_agent_id, p_deactivated_by, p_end_date, p_reason,
    v_agent.referrer_id, v_agent.division_id, v_agent.rank_id,
    v_agent.cumulative_personal_revenue,
    to_jsonb(v_agent)
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
