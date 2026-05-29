import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SB_URL = Deno.env.get('SB_URL')
const SB_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_ROLE_KEY')

interface SendEmailPayload {
  to: string
  cc?: string[]
  from: string
  subject: string
  html: string
  template_key: string
  agent_id: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload: SendEmailPayload = await req.json()
    const { to, cc, from, subject, html, template_key, agent_id } = payload

    if (!to || !from || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Call Resend API
    const resendBody: Record<string, unknown> = {
      from,
      to: [to],
      subject,
      html,
    }
    if (cc && cc.length > 0) {
      resendBody.cc = cc
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendBody),
    })

    const resendData = await resendRes.json().catch(() => null)
    const success = resendRes.ok

    // Save log to DB
    if (SB_URL && SB_SERVICE_ROLE_KEY) {
      const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)
      const authHeader = req.headers.get('authorization')
      let userId: string | null = null
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data } = await supabase.auth.getUser(token)
        userId = data.user?.id ?? null
      }

      await supabase.from('email_logs').insert({
        sent_by: userId,
        recipient_email: to,
        cc_emails: cc ?? [],
        recipient_agent_id: agent_id,
        template_key,
        subject,
        body: html,
        status: success ? 'sent' : 'failed',
        error_message: success ? null : (resendData?.message ?? `HTTP ${resendRes.status}`),
      })
    }

    return new Response(
      JSON.stringify({
        success,
        messageId: resendData?.id ?? null,
        error: success ? null : (resendData?.message ?? `Resend HTTP ${resendRes.status}`),
      }),
      {
        status: success ? 200 : 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
