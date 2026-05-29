-- FEAT-013: M1 Transition Email Tracking
-- Đánh dấu đã gửi email và số lần gửi (hỗ trợ resend)

ALTER TABLE public.m1_transition_tasks
ADD COLUMN IF NOT EXISTS email_sent_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;

-- Index để query nhanh các task chưa gửi email hoặc cần nhắc lại
CREATE INDEX IF NOT EXISTS idx_m1_tasks_email_count
  ON public.m1_transition_tasks(email_sent_count, deadline_date);
