-- ============================================
-- CLEAN ALL AGENT DATA (keep schema)
-- Run in Supabase SQL Editor when you need to wipe all agent/request data
-- but keep tables, RLS policies, and functions intact.
-- ============================================

-- 1. Xóa bảng con trước (do Foreign Key constraints)
DELETE FROM public.m1_transition_tasks;
DELETE FROM public.request_comments;
DELETE FROM public.request_notifications;
DELETE FROM public.activity_logs;
DELETE FROM public.user_bookmarks;
DELETE FROM public.t1_changes;
DELETE FROM public.t1_requests;

-- 2. Xóa agents: bỏ self-referencing FK trước để tránh lỗi
UPDATE public.agents SET current_t1_id = NULL, introducing_agent_id = NULL;
DELETE FROM public.agents;

-- 3. Reset sequences (nếu có ID tự tăng)
ALTER SEQUENCE IF EXISTS public.agents_id_seq RESTART WITH 1;
