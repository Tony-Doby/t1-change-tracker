-- ============================================-- FEAT-001: Email sending logs-- ============================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id),
  recipient_email text NOT NULL,
  cc_emails jsonb DEFAULT '[]',
  recipient_agent_id uuid REFERENCES agents(id),
  template_key text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_agent_id, sent_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated to read email_logs"
  ON public.email_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated to insert email_logs"
  ON public.email_logs FOR INSERT TO authenticated WITH CHECK (true);
