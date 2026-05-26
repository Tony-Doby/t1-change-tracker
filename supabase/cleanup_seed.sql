-- ============================================
-- T1 Change Tracker - Cleanup Seed Data
-- Xóa toàn bộ data mẫu + các records liên quan đến seed agents
-- Chạy trong Supabase SQL Editor
-- ============================================

-- Tạo bảng tạm chứa danh sách seed agents
DROP TABLE IF EXISTS temp_seed_agents;
CREATE TEMP TABLE temp_seed_agents (id UUID PRIMARY KEY);
INSERT INTO temp_seed_agents (id) VALUES
  ('a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000003'),
  ('a0000000-0000-0000-0000-000000000004'),
  ('a0000000-0000-0000-0000-000000000005'),
  ('a0000000-0000-0000-0000-000000000006'),
  ('a0000000-0000-0000-0000-000000000007'),
  ('a0000000-0000-0000-0000-000000000008'),
  ('a0000000-0000-0000-0000-000000000009'),
  ('a0000000-0000-0000-0000-000000000010'),
  ('a0000000-0000-0000-0000-000000000011'),
  ('a0000000-0000-0000-0000-000000000012'),
  ('a0000000-0000-0000-0000-000000000013');

-- 1. Xóa M1 transition tasks liên quan đến seed agents
DELETE FROM public.m1_transition_tasks
WHERE departed_agent_id IN (SELECT id FROM temp_seed_agents)
   OR m1_agent_id      IN (SELECT id FROM temp_seed_agents)
   OR temp_t1_id       IN (SELECT id FROM temp_seed_agents);

-- 2. Xóa Activity logs liên quan đến seed agents
DELETE FROM public.activity_logs
WHERE agent_id        IN (SELECT id FROM temp_seed_agents)
   OR related_agent_id IN (SELECT id FROM temp_seed_agents)
   OR old_t1_id       IN (SELECT id FROM temp_seed_agents)
   OR new_t1_id       IN (SELECT id FROM temp_seed_agents);

-- 3. Xóa User bookmarks liên quan đến seed agents
DELETE FROM public.user_bookmarks
WHERE agent_id IN (SELECT id FROM temp_seed_agents);

-- 4. Xóa Request notifications liên quan đến seed agents
DELETE FROM public.request_notifications
WHERE recipient_agent_id IN (SELECT id FROM temp_seed_agents);

-- 5. Xóa T1 changes liên quan đến seed agents
DELETE FROM public.t1_changes
WHERE agent_id  IN (SELECT id FROM temp_seed_agents)
   OR old_t1_id IN (SELECT id FROM temp_seed_agents)
   OR new_t1_id IN (SELECT id FROM temp_seed_agents);

-- 6. Xóa T1 requests liên quan đến seed agents
-- (request_comments và request_notifications có ON DELETE CASCADE)
DELETE FROM public.t1_requests
WHERE agent_id           IN (SELECT id FROM temp_seed_agents)
   OR old_t1_id         IN (SELECT id FROM temp_seed_agents)
   OR proposed_new_t1_id IN (SELECT id FROM temp_seed_agents);

-- 7. Xóa Holidays seed
DELETE FROM public.holidays
WHERE id IN (
  'f4000000-0000-0000-0000-000000000001',
  'f4000000-0000-0000-0000-000000000002',
  'f4000000-0000-0000-0000-000000000003',
  'f4000000-0000-0000-0000-000000000004',
  'f4000000-0000-0000-0000-000000000005'
);

-- 8. Xóa Agents seed (cuối cùng, sau khi đã xóa hết references)
DELETE FROM public.agents
WHERE id IN (SELECT id FROM temp_seed_agents);

-- Dọn bảng tạm
DROP TABLE IF EXISTS temp_seed_agents;

-- ============================================
-- Kết thúc cleanup
-- ============================================
