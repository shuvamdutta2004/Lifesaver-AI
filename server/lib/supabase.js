// ============================================================
// server/lib/supabase.js — Supabase Admin Client (Server-side)
//
// Uses SERVICE ROLE KEY — bypasses Row Level Security.
// NEVER expose this key to the frontend.
//
// TODO: Add your Supabase Project URL to server/.env as:
//   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.SUPABASE_URL
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.warn('[Supabase] ⚠️  SUPABASE_URL not set — DB calls will fail')
}

// Admin client — server-side only, full access
const supabaseAdmin = supabaseUrl
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    })
  : null

export default supabaseAdmin

// ── Helper: check if DB is reachable ────────────────────────
export async function isDatabaseReady() {
  if (!supabaseAdmin) return false
  try {
    const { error } = await supabaseAdmin.from('sos_events').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
