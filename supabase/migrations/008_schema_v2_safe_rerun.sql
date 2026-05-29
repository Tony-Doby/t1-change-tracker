-- ============================================
-- FEAT-006: Safe rerun — Drop existing policies first
-- Run this BEFORE 008_schema_v2_agents.sql if you hit "policy already exists" errors
-- ============================================

DROP POLICY IF EXISTS divisions_admin ON public.divisions;
DROP POLICY IF EXISTS divisions_read ON public.divisions;
DROP POLICY IF EXISTS division_head_history_admin ON public.division_head_history;
DROP POLICY IF EXISTS division_head_history_read ON public.division_head_history;
DROP POLICY IF EXISTS rank_profiles_admin ON public.rank_profiles;
DROP POLICY IF EXISTS rank_profiles_read ON public.rank_profiles;
DROP POLICY IF EXISTS ranks_admin ON public.ranks;
DROP POLICY IF EXISTS ranks_read ON public.ranks;
DROP POLICY IF EXISTS agent_referrer_log_admin ON public.agent_referrer_log;
DROP POLICY IF EXISTS agent_referrer_log_read ON public.agent_referrer_log;
DROP POLICY IF EXISTS agent_info_history_log_admin ON public.agent_info_history_log;
DROP POLICY IF EXISTS agent_info_history_log_read ON public.agent_info_history_log;
DROP POLICY IF EXISTS agent_timeline_events_admin ON public.agent_timeline_events;
DROP POLICY IF EXISTS agent_timeline_events_read ON public.agent_timeline_events;

-- Also drop triggers if they exist (the original migration already does this, but safe to repeat)
DROP TRIGGER IF EXISTS trg_sync_agent_t1_fields ON public.agents;
DROP TRIGGER IF EXISTS trg_agents_updated_at ON public.agents;
DROP TRIGGER IF EXISTS trg_recompute_division ON public.agents;

-- Also drop functions if you want a completely clean rerun (optional)
-- DROP FUNCTION IF EXISTS public.sync_agent_t1_fields();
-- DROP FUNCTION IF EXISTS public.set_updated_at();
-- DROP FUNCTION IF EXISTS public.recompute_division_on_referrer_change();

SELECT 'Policies dropped. Now run 008_schema_v2_agents.sql' AS status;
