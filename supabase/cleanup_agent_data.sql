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
DELETE FROM public.email_logs;

-- 2. Xóa bảng log/history có FK đến agents (schema v2)
DELETE FROM public.agent_referrer_log;
DELETE FROM public.agent_info_history_log;
DELETE FROM public.agent_timeline_events;
DELETE FROM public.division_head_history;

-- 3. Xóa agents: bỏ các FK trỏ đến agents trước để tránh lỗi
UPDATE public.agents SET current_t1_id = NULL, introducing_agent_id = NULL, referrer_id = NULL;
UPDATE public.divisions SET head_agent_id = NULL;
DELETE FROM public.agents;

-- 4. Reset sequences (nếu có ID tự tăng)
ALTER SEQUENCE IF EXISTS public.agents_id_seq RESTART WITH 1;
