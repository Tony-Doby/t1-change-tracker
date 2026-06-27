-- ============================================
-- BUG-039: drive_templates dùng cây nested `root`, không phải `levels` phẳng
-- ============================================
-- Code (src/types/index.ts, src/hooks/queries/useDriveTemplates.ts) lưu template
-- dạng cây nested { name, permissions, children } vào cột `root`, nhưng bảng cũ
-- (020_drive_manager.sql) chỉ có cột `levels`. Insert/update `root` bị PostgREST
-- từ chối → không lưu được template.
--
-- ⚠️ Phải chạy TAY trong Supabase SQL Editor (migration local không tự sync).

-- 1) Thêm cột root.
ALTER TABLE public.drive_templates
  ADD COLUMN IF NOT EXISTS root JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2) Cột levels không còn được code dùng. Bỏ NOT NULL để không chặn insert.
ALTER TABLE public.drive_templates
  ALTER COLUMN levels DROP NOT NULL;

-- 3) (Tùy chọn) Sau khi xác nhận không còn dữ liệu cần giữ (SELECT count(*) ...),
--    có thể drop hẳn cột levels:
-- ALTER TABLE public.drive_templates DROP COLUMN levels;
