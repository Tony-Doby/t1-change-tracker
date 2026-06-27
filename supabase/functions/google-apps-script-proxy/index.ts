import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SB_URL = Deno.env.get('SB_URL')
const SB_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_ROLE_KEY')
const APPS_SCRIPT_WEB_APP_URL = Deno.env.get('APPS_SCRIPT_WEB_APP_URL')
const APPS_SCRIPT_TOKEN = Deno.env.get('APPS_SCRIPT_TOKEN')

const ALLOWED_ACTIONS = new Set([
  'scanFolders',
  'setPermissions',
  'createFolder',
  'createFolderTree',
  'copyFolder',
  'listItems',
  'moveItem',
  'removePermission',
  'deleteItem',
  'detectDriveTypes',
])

interface AppsScriptPayload {
  action: string
  params?: Record<string, unknown>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    if (!SB_URL || !SB_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'Supabase configuration missing' }, 500)
    }

    if (!APPS_SCRIPT_WEB_APP_URL) {
      return jsonResponse({ error: 'APPS_SCRIPT_WEB_APP_URL not configured' }, 500)
    }

    const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

    // Authenticate caller
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401)
    }
    const userId = userData.user.id

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return jsonResponse({ error: 'Unable to verify user role' }, 500)
    }
    if (profile.role !== 'admin') {
      return jsonResponse({ error: 'Admin access required' }, 403)
    }

    // Validate payload
    let payload: AppsScriptPayload
    try {
      payload = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    const { action, params = {} } = payload
    if (!action || typeof action !== 'string') {
      return jsonResponse({ error: 'Missing or invalid action' }, 400)
    }
    if (!ALLOWED_ACTIONS.has(action)) {
      return jsonResponse({ error: `Action "${action}" is not allowed` }, 400)
    }

    // Forward to Google Apps Script Web App
    const requestBody: Record<string, unknown> = { action, params }
    if (APPS_SCRIPT_TOKEN) {
      requestBody.authToken = APPS_SCRIPT_TOKEN
    }

    const appsScriptRes = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    let appsScriptData: Record<string, unknown> = {}
    const rawText = await appsScriptRes.text()
    try {
      appsScriptData = JSON.parse(rawText)
    } catch {
      appsScriptData = { raw: rawText }
    }

    const success =
      appsScriptRes.ok &&
      (appsScriptData.success === true || appsScriptData.success === undefined)

    const errorMessage =
      success ? null : (appsScriptData.error as string | undefined) ?? `Apps Script HTTP ${appsScriptRes.status}`

    // Audit log
    const { error: logError } = await supabase.from('apps_script_logs').insert({
      action,
      params,
      result: appsScriptData,
      success,
      error_message: errorMessage,
      initiated_by: userId,
    })

    if (logError) {
      console.error('Failed to write apps_script_logs:', logError)
    }

    return jsonResponse(
      {
        success,
        data: appsScriptData.data ?? appsScriptData,
        error: errorMessage,
      },
      success ? 200 : 502
    )
  } catch (err: unknown) {
    const message = (err as Error).message ?? 'Unknown error'
    console.error('google-apps-script-proxy error:', err)
    return jsonResponse({ error: message }, 500)
  }
})
