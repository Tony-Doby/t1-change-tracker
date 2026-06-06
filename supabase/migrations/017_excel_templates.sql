-- Migration 017: Excel Templates + Generation Logs for FEAT-019
-- Run manually in Supabase SQL Editor

-- Bảng metadata template
CREATE TABLE IF NOT EXISTS public.excel_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  storage_path text NOT NULL,                 -- file export template
  import_template_path text,                  -- file import mẫu
  template_header_row integer NOT NULL DEFAULT 0, -- row chứa tên trường trong export template (0-based)
  import_header_row integer NOT NULL DEFAULT 0,   -- row chứa tên trường trong import mẫu (0-based)
  fields jsonb DEFAULT '[]',                  -- tên trường từ export template header row
  import_headers jsonb DEFAULT '[]',          -- headers đã detect từ file import mẫu
  column_mapping jsonb DEFAULT '{}',          -- mapping: { fieldName -> {type, value} }
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_excel_templates_created_by ON public.excel_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_excel_templates_name ON public.excel_templates(name);

ALTER TABLE public.excel_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated to read excel_templates" ON public.excel_templates;
CREATE POLICY "Allow all authenticated to read excel_templates"
  ON public.excel_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin to insert excel_templates" ON public.excel_templates;
CREATE POLICY "Allow admin to insert excel_templates"
  ON public.excel_templates FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Allow admin to update excel_templates" ON public.excel_templates;
CREATE POLICY "Allow admin to update excel_templates"
  ON public.excel_templates FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Allow admin to delete excel_templates" ON public.excel_templates;
CREATE POLICY "Allow admin to delete excel_templates"
  ON public.excel_templates FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Bảng lịch sử generate
CREATE TABLE IF NOT EXISTS public.excel_generation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.excel_templates(id) ON DELETE SET NULL,
  original_file_name text NOT NULL,
  original_storage_path text NOT NULL,
  generated_file_name text NOT NULL,
  generated_storage_path text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  matched_placeholders jsonb DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_excel_generation_logs_created_by ON public.excel_generation_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_excel_generation_logs_template ON public.excel_generation_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_excel_generation_logs_created_at ON public.excel_generation_logs(created_at DESC);

ALTER TABLE public.excel_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated to read own excel_generation_logs" ON public.excel_generation_logs;
CREATE POLICY "Allow all authenticated to read own excel_generation_logs"
  ON public.excel_generation_logs FOR SELECT TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Allow all authenticated to insert excel_generation_logs" ON public.excel_generation_logs;
CREATE POLICY "Allow all authenticated to insert excel_generation_logs"
  ON public.excel_generation_logs FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Allow admin to delete excel_generation_logs" ON public.excel_generation_logs;
CREATE POLICY "Allow admin to delete excel_generation_logs"
  ON public.excel_generation_logs FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
