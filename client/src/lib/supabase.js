// ============================================================
// client/src/lib/supabase.js — Supabase Browser Client
//
// Uses the PUBLISHABLE (anon) key — safe to expose in frontend.
// Respects Row Level Security (RLS) rules.
//
// TODO: Add your Supabase Project URL to client/.env as:
//   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.warn('[Supabase] ⚠️  VITE_SUPABASE_URL not set in client/.env')
}

// Browser client — for real-time subscriptions on the frontend
const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnon)
  : null

export default supabase

// ── Real-time: subscribe to new SOS events ──────────────────
// Call this from Dashboard.jsx to show incoming SOSes live
// Example usage:
//   import supabase from '../lib/supabase'
//   const channel = supabase
//     .channel('sos-events')
//     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_events' },
//       (payload) => console.log('New SOS:', payload.new)
//     )
//     .subscribe()
