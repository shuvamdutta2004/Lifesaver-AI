// ============================================================
// routes/sos.js — POST /api/sos
//
// PRIMARY STORE:   PostgreSQL via Prisma (Supabase)
// SECONDARY STORE: Firebase Realtime DB (optional, for live cross-tab updates)
//
// TODO: Set DATABASE_URL in server/.env (Supabase connection string)
// TODO (optional): Set FIREBASE_DATABASE_URL for real-time broadcast
// ============================================================

import express        from 'express'
import prisma         from '../lib/db.js'
import supabaseAdmin  from '../lib/supabase.js'
import { enqueueMedicalBroadcast } from '../lib/medicalBroadcast.js'

const router = express.Router()

// Map frontend string types → Prisma enum
const TYPE_MAP = {
  medical:      'MEDICAL',
  women_safety: 'WOMEN_SAFETY',
  fire:         'FIRE',
  flood:        'FLOOD',
  earthquake:   'EARTHQUAKE',
}

// ── POST /api/sos ────────────────────────────────────────────
// Body: { type, lat, lng, userId? }
// Response: { success, eventId, event }
router.post('/', async (req, res, next) => {
  try {
    const { type, lat, lng, userId } = req.body

    if (!type) return res.status(400).json({ error: 'type is required' })

    const prismaType = TYPE_MAP[type]
    if (!prismaType) {
      return res.status(400).json({ error: `Invalid emergency type: ${type}` })
    }

    // ── Write via Prisma (direct DB access) ───────────────────
    try {
      const event = await prisma.sosEvent.create({
        data: {
          type:    prismaType,
          lat:     lat  ?? null,
          lng:     lng  ?? null,
          status:  'ACTIVE',
          source:  'web-pwa',
          userId:  userId ?? null,
        },
      })

      console.info(`[SOS] ✅ Database event: ${event.id} | type=${type}`)

      if (prismaType === 'MEDICAL' && lat != null && lng != null) {
        const queued = enqueueMedicalBroadcast({
          sosEventId: event.id,
          lat: Number(lat),
          lng: Number(lng),
        })
        console.info(`[SOS] 📣 Medical broadcast ${queued.queued ? 'queued' : 'skipped'} for ${event.id}`)
      }

      return res.json({ success: true, eventId: event.id, event, mode: 'prisma' })

    } catch (dbError) {
      console.error('[SOS] Database insert error:', dbError.message)
      // If DB fails, we'll try falling back to demo mode below
    }

    // ── Demo mode fallback (no DB connected) ──────────────────
    console.warn('[SOS] Running in demo mode — add SUPABASE_URL to server/.env')

    if (prismaType === 'MEDICAL' && lat != null && lng != null) {
      const demoEventId = `demo-${Date.now()}`
      const queued = enqueueMedicalBroadcast({
        sosEventId: demoEventId,
        lat: Number(lat),
        lng: Number(lng),
      })
      console.info(`[SOS] 📣 Demo medical broadcast ${queued.queued ? 'queued' : 'skipped'} for ${demoEventId}`)
      return res.json({ success: true, eventId: demoEventId, mode: 'demo' })
    }

    return res.json({ success: true, eventId: `demo-${Date.now()}`, mode: 'demo' })

  } catch (err) {
    next(err)
  }
})

// ── GET /api/sos/active ──────────────────────────────────────
router.get('/active', async (req, res, next) => {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('sos_events')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(10)
      if (!error) return res.json({ events: data, count: data.length, mode: 'supabase' })
    }
    // Demo fallback
    return res.json({
      events: [{ id: 'demo-1', type: 'MEDICAL', lat: 13.0860, lng: 80.2730, status: 'ACTIVE', created_at: new Date().toISOString() }],
      mode: 'demo',
    })
  } catch (err) { next(err) }
})

// ── PATCH /api/sos/:id/resolve ───────────────────────────────
router.patch('/:id/resolve', async (req, res, next) => {
  try {
    if (!supabaseAdmin) return res.json({ success: true, mode: 'demo' })
    const { data, error } = await supabaseAdmin
      .from('sos_events')
      .update({ status: 'RESOLVED', resolved_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single()
    if (error) return next(new Error(error.message))
    return res.json({ success: true, event: data })
  } catch (err) { next(err) }
})

export default router
