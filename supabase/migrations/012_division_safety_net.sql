-- ============================================
-- FEAT-008: Division Safety Net
-- Lớp 2: get_agent_division(agent_id) RPC
-- Lớp 3: recompute_all_divisions() RPC + UI button
-- ============================================

-- --------------------------------------------
-- 1. get_agent_division(p_agent_id)
--    Computes the correct division for an agent according to business rules:
--    1. Agent is head_agent_id of an active division? -> return that division
--    2. Agent has referrer_id? -> walk up T1 tree -> first head_agent_id -> return that division
--    3. Fallback -> default division ("Khác")
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_agent_division(p_agent_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_division_id UUID;
BEGIN
  -- Rule 1: Agent is head of an active division
  SELECT id INTO v_division_id
  FROM public.divisions
  WHERE head_agent_id = p_agent_id AND is_active = true
  LIMIT 1;

  IF v_division_id IS NOT NULL THEN
    RETURN v_division_id;
  END IF;

  -- Rule 2: Walk up T1 tree to find the first head_agent_id
  WITH RECURSIVE upline AS (
    SELECT id, referrer_id FROM public.agents WHERE id = p_agent_id
    UNION ALL
    SELECT a.id, a.referrer_id
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
    RETURN v_division_id;
  END IF;

  -- Rule 3: Fallback to default division
  SELECT id INTO v_division_id
  FROM public.divisions
  WHERE is_default = true
  LIMIT 1;

  RETURN v_division_id;
END;
$$;

-- --------------------------------------------
-- 2. recompute_all_divisions()
--    Force recompute division_id for ALL agents.
--    Returns the number of agents whose division_id was actually changed.
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_all_divisions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_agent RECORD;
  v_division_id UUID;
BEGIN
  FOR v_agent IN
    SELECT id FROM public.agents WHERE deleted_at IS NULL
  LOOP
    v_division_id := public.get_agent_division(v_agent.id);

    UPDATE public.agents
    SET division_id = v_division_id
    WHERE id = v_agent.id
      AND (division_id IS DISTINCT FROM v_division_id);

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;
