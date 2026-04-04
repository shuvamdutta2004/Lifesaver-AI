// ============================================================
// routes/nearby.js — GET /api/nearby
//
// Fetches live data from Supabase (hospitals, helpers).
// FALLBACK: Returns simulated Chennai data if DB not linked.
// ============================================================

import express        from 'express'
import prisma         from '../lib/db.js'

const router = express.Router()

// ── GET /api/nearby ──────────────────────────────────────────
// Query: ?lat=13.08&lng=80.27&type=all&limit=5
router.get('/', async (req, res) => {
  const { type = 'all', limit = 5 } = req.query

  try {
    const result = {}

    // 1. Fetch Helpers (Volunteers)
    if (type === 'all' || type === 'helpers') {
      result.helpers = await prisma.helper.findMany({
        where: { available: true },
        take: parseInt(limit),
      })
    }

    // 2. Fetch Hospitals
    if (type === 'all' || type === 'hospitals') {
      result.hospitals = await prisma.hospital.findMany({
        take: parseInt(limit),
      })
    }

    return res.json({ ...result, mode: 'prisma' })

  } catch (err) {
    console.error('[Nearby] Fetch failed:', err.message)
    return res.status(500).json({ 
      error: 'Failed to fetch nearby data',
      helpers: [],
      hospitals: [],
      mode: 'error' 
    })
  }
})

export default router
