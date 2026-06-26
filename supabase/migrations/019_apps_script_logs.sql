-- ============================================
-- FEAT-030: Google Apps Script Admin Panel — Drive Operations
-- ============================================

CREATE TABLE IF NOT EXISTS public.apps_script_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL CHECK (action IN (
    'scanFolders',
    'setPermissions',
    'createFolder',
    'copyFolder',
    'listItems',
    'moveItem',
    'removePermission',
    'deleteItem'
  )),
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  initiated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_script_logs_action ON public.apps_script_logs(action);
CREATE INDEX IF NOT EXISTS idx_apps_script_logs_success ON public.apps_script_logs(success);
CREATE INDEX IF NOT EXISTS idx_apps_script_logs_created_at ON public.apps_script_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_apps_script_logs_initiated_by ON public.apps_script_logs(initiated_by);

ALTER TABLE public.apps_script_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write audit logs via client queries.
-- Edge Functions using the service role key bypass RLS entirely.
DROP POLICY IF EXISTS "apps_script_logs_admin_all" ON public.apps_script_logs;
CREATE POLICY "apps_script_logs_admin_all" ON public.apps_script_logs FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');
