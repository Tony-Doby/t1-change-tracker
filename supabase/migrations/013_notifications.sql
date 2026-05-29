-- ============================================
-- FEAT-003: In-app Notifications
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('request_new','comment_new','b2_alert','m1_expired','request_completed','request_cancelled','agent_deactivated','agent_restored')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admin/Operator can insert notifications for anyone
CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admin/Operator can delete old notifications
CREATE POLICY "notifications_delete_admin"
  ON public.notifications FOR DELETE TO authenticated
  USING (public.get_my_role() IN ('admin','operator'));
