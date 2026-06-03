-- ============================================
-- Phase 4: Backend-Frontend Alignment
-- 1. RPC get_dashboard_stats (single call for 4 counts)
-- 2. pg_cron job for proactive M1 transition expiry
-- ============================================

-- 1. Dashboard stats RPC (replaces 4 separate count queries)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_agents INTEGER;
  v_total_requests INTEGER;
  v_pending INTEGER;
  v_completed INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_agents
  FROM public.agents
  WHERE deleted_at IS NULL;

  SELECT COUNT(*) INTO v_total_requests
  FROM public.t1_requests
  WHERE deleted_at IS NULL;

  SELECT COUNT(*) INTO v_pending
  FROM public.t1_requests
  WHERE deleted_at IS NULL
    AND status IN ('step1', 'step2', 'step3', 'step4', 'step5');

  SELECT COUNT(*) INTO v_completed
  FROM public.t1_requests
  WHERE deleted_at IS NULL
    AND status = 'completed';

  RETURN jsonb_build_object(
    'total_agents', v_total_agents,
    'total_requests', v_total_requests,
    'pending', v_pending,
    'completed', v_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. pg_cron job: run process_expired_m1_transitions every day at 00:05
-- NOTE: pg_cron extension must be enabled in Supabase first (Dashboard > Extensions)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule if already exists to avoid duplicates
    PERFORM cron.unschedule('m1_transition_daily_cleanup');
    PERFORM cron.schedule(
      'm1_transition_daily_cleanup',
      '5 0 * * *',
      'SELECT public.process_expired_m1_transitions()'
    );
  END IF;
END $$;
