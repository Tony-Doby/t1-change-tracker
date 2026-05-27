-- ============================================
-- Fix: Allow temp_t1_id to be null
-- When an agent has no old T1, their M1s have no temp T2
-- ============================================

ALTER TABLE public.m1_transition_tasks
ALTER COLUMN temp_t1_id DROP NOT NULL;
