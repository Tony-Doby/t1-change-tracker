-- ============================================
-- FEAT-007: Safe rerun — Drop existing policies first
-- Run this BEFORE 009_agent_deactivation.sql if you hit "policy already exists" errors
-- ============================================

DROP POLICY IF EXISTS agent_deactivation_snapshots_admin ON public.agent_deactivation_snapshots;
DROP POLICY IF EXISTS agent_deactivation_snapshots_read ON public.agent_deactivation_snapshots;

SELECT 'Policies dropped. Now run 009_agent_deactivation.sql' AS status;
