-- Chạy file này TRƯỚC khi chạy 001_initial_schema.sql nếu lần trước bị lỗi giữa chừng
DROP TABLE IF EXISTS public.request_notifications CASCADE;
DROP TABLE IF EXISTS public.request_comments CASCADE;
DROP TABLE IF EXISTS public.t1_changes CASCADE;
DROP TABLE IF EXISTS public.m1_transition_tasks CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.user_bookmarks CASCADE;
DROP TABLE IF EXISTS public.t1_requests CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.check_eligibility CASCADE;
DROP FUNCTION IF EXISTS public.process_expired_m1_transitions CASCADE;
DROP FUNCTION IF EXISTS public.get_t1_capacity CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role CASCADE;
