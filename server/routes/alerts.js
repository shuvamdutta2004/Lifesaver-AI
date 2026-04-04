// ============================================================
// routes/alerts.js — POST /api/alerts/broadcast
//                   GET  /api/alerts/live
//
// Broadcasts emergency alerts to nearby users.
// Uses Supabase 'alerts' table for persistence and real-time.
// ============================================================

import express        from 'express'
import supabaseAdmin  from '../lib/supabase.js'

const router  = express.Router()
const alerts  = []   // In-memory fallback for demo mode

// ── POST /api/alerts/broadcast ───────────────────────────────
// Body: { type, lat, lng, message, userId, sosEventId }
router.post('/broadcast', async (req, res, next) => {
  try {
    const { type, lat, lng, message, userId, sosEventId } = req.body

    const alertData = {
      type:         type || 'MEDICAL',
      lat:          lat  || null,
      lng:          lng  || null,
      message:      message || `Emergency SOS triggered near (${lat?.toFixed(3)}, ${lng?.toFixed(3)})`,
      active:       true,
      sos_event_id: sosEventId || null,
    }

    // ── Write via Prisma (direct DB access) ───────────────────
    try {
      const alert = await prisma.alert.create({
        data: {
          type:         type || 'MEDICAL',
          lat:          lat  || null,
          lng:          lng  || null,
          message:      message || `Emergency SOS triggered near (${lat?.toFixed(3)}, ${lng?.toFixed(3)})`,
          active:       true,
          sosEventId:   sosEventId || null,
        },
      })
      
      console.info(`[ALERT] Broadcast via Prisma: ${alert.id}`)
      return res.json({ success: true, alert, mode: 'prisma' })

    } catch (dbError) {
      console.error('[ALERT] Database broadcast error:', dbError.message)
      // Fall through to demo mode below
    }

    // DEMO FALLBACK
    const demoAlert = { id: `alert-${Date.now()}`, ...alertData, timestamp: new Date().toISOString() }
    alerts.push(demoAlert)
    console.info(`[ALERT] Demo broadcast: ${demoAlert.message}`)
    return res.json({ success: true, alert: demoAlert, mode: 'demo' })

  } catch (err) {
    next(err)
  }
})

// ── GET /api/alerts/live ──────────────────────────────────────
router.get('/live', async (req, res) => {
  try {
    // ── Fetch via Prisma ──────────────────────────────────────
    try {
      const alertsData = await prisma.alert.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      return res.json({ alerts: alertsData, count: alertsData.length, mode: 'prisma' })
    } catch (dbError) {
      console.warn('[ALERT/live] Database fetch failed:', dbError.message)
    }

    // DEMO FALLBACK
    const activeAlerts = alerts.filter((a) => a.active).slice(-10).reverse()
    return res.json({ alerts: activeAlerts, count: activeAlerts.length, mode: 'demo' })

  } catch (err) {
    return res.json({ alerts: [], count: 0, error: err.message })
  }
})

export default router
