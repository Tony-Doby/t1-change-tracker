-- ============================================
-- FEAT-034: Drive Manager — Templates & Saved Trees
-- ============================================

-- Templates for creating folder trees with permissions.
CREATE TABLE IF NOT EXISTS public.drive_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drive_templates_created_by ON public.drive_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_drive_templates_name ON public.drive_templates(name);

ALTER TABLE public.drive_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drive_templates_admin_all" ON public.drive_templates;
CREATE POLICY "drive_templates_admin_all" ON public.drive_templates FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Saved Drive trees from scanFolders results.
CREATE TABLE IF NOT EXISTS public.drive_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  root_url TEXT NOT NULL,
  root_folder_id TEXT NOT NULL,
  depth INTEGER NOT NULL,
  tree_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_shared_drive BOOLEAN,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drive_trees_created_by ON public.drive_trees(created_by);
CREATE INDEX IF NOT EXISTS idx_drive_trees_root_folder_id ON public.drive_trees(root_folder_id);

ALTER TABLE public.drive_trees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drive_trees_admin_all" ON public.drive_trees;
CREATE POLICY "drive_trees_admin_all" ON public.drive_trees FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Trigger to auto-update updated_at on drive_templates.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS drive_templates_updated_at ON public.drive_templates;
CREATE TRIGGER drive_templates_updated_at
  BEFORE UPDATE ON public.drive_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update apps_script_logs CHECK constraint to include new actions.
ALTER TABLE public.apps_script_logs DROP CONSTRAINT IF EXISTS apps_script_logs_action_check;
ALTER TABLE public.apps_script_logs ADD CONSTRAINT apps_script_logs_action_check
  CHECK (action IN (
    'scanFolders',
    'setPermissions',
    'createFolder',
    'createFolderTree',
    'copyFolder',
    'listItems',
    'moveItem',
    'removePermission',
    'deleteItem',
    'detectDriveTypes'
  ));
