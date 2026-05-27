-- ============================================
-- Fix RLS: Allow operator to INSERT into
-- t1_changes, activity_logs, m1_transition_tasks
-- ============================================

-- t1_changes: operator can insert (when completing requests)
DROP POLICY IF EXISTS "t1_changes_operator_insert" ON public.t1_changes;
CREATE POLICY "t1_changes_operator_insert"
  ON public.t1_changes FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'operator'));

-- activity_logs: operator can insert
DROP POLICY IF EXISTS "activity_logs_operator_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_operator_insert"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'operator'));

-- m1_transition_tasks: operator can insert
DROP POLICY IF EXISTS "m1_transition_operator_insert" ON public.m1_transition_tasks;
CREATE POLICY "m1_transition_operator_insert"
  ON public.m1_transition_tasks FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'operator'));
