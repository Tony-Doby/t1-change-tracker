-- ============================================
-- FEAT-025: Email Activities for M1 Transition
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.m1_transition_tasks(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('copy_content', 'send')),
  content_preview TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_activities_task_id ON public.email_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_email_activities_created_at ON public.email_activities(created_at);

ALTER TABLE public.email_activities ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "email_activities_admin" ON public.email_activities;
CREATE POLICY "email_activities_admin" ON public.email_activities FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "email_activities_read" ON public.email_activities;
CREATE POLICY "email_activities_read" ON public.email_activities FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "email_activities_insert" ON public.email_activities;
CREATE POLICY "email_activities_insert" ON public.email_activities FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger: auto-update count on m1_transition_tasks
CREATE OR REPLACE FUNCTION public.handle_email_activity_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.m1_transition_tasks
  SET email_sent_count = COALESCE(email_sent_count, 0) + 1,
      last_email_sent_at = NOW()
  WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_m1_email_count ON public.email_activities;
CREATE TRIGGER trg_update_m1_email_count
AFTER INSERT ON public.email_activities
FOR EACH ROW EXECUTE FUNCTION public.handle_email_activity_insert();
