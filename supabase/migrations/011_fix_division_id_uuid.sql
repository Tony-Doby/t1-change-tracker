-- ============================================
-- BUG-009: Fix agents.division_id INTEGER → UUID
-- ============================================
-- Root cause: migration 001 created division_id as INTEGER.
-- migration 008 created divisions.id as UUID but did not ALTER agents.division_id.
-- The trigger recompute_division_on_referrer_change assigns UUID into an INTEGER
-- column → cast error.
-- Fix: migrate column to UUID, recompute all agent divisions, recreate trigger.
-- ============================================

-- 1. Drop trigger that references division_id (will be recreated after column fix)
DROP TRIGGER IF EXISTS trg_recompute_division ON public.agents;

-- 2. Add new UUID column
ALTER TABLE public.agents ADD COLUMN division_uuid UUID REFERENCES public.divisions(id);

-- 3. Compute division for all existing agents:
--    - If agent is head_agent_id of an active division → assign that division
--    - Otherwise → assign the default division ("Khác")
UPDATE public.agents a
SET division_uuid = COALESCE(
  (SELECT d.id FROM public.divisions d WHERE d.head_agent_id = a.id AND d.is_active = true LIMIT 1),
  (SELECT d.id FROM public.divisions d WHERE d.is_default = true LIMIT 1)
);

-- 4. Drop old INTEGER column
ALTER TABLE public.agents DROP COLUMN IF EXISTS division_id;

-- 5. Rename UUID column to division_id
ALTER TABLE public.agents RENAME COLUMN division_uuid TO division_id;

-- 6. Add index
CREATE INDEX IF NOT EXISTS idx_agents_division_id ON public.agents(division_id);

-- 7. Recreate trigger (same logic, now division_id is UUID)
CREATE OR REPLACE FUNCTION public.recompute_division_on_referrer_change()
RETURNS TRIGGER AS $$
DECLARE
  v_division_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.referrer_id IS DISTINCT FROM OLD.referrer_id THEN
    -- Walk up T1 tree to find the first head_agent_id
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

CREATE TRIGGER trg_recompute_division
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  WHEN (pg_trigger_depth() < 1)
  EXECUTE FUNCTION public.recompute_division_on_referrer_change();
