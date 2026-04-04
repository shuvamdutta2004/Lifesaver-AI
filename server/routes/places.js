// ============================================================
// routes/places.js — GET /api/places
//
// Server-side proxy to Google Places Nearby Search API.
// Keeps the Maps API key hidden from the frontend.
//
// Query: ?lat=13.08&lng=80.27&type=police&radius=2000&limit=10
// Types: police | hospital | fire_station | pharmacy | shelter
// ============================================================

import express from 'express'
import axios   from 'axios'

const router = express.Router()

const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'

// Type display config
const TYPE_CONFIG = {
  police:       { label: 'Police Station',  emoji: '👮' },
  hospital:     { label: 'Hospital',        emoji: '🏥' },
  fire_station: { label: 'Fire Station',    emoji: '🚒' },
  pharmacy:     { label: 'Pharmacy',        emoji: '💊' },
  shelter:      { label: 'Shelter',         emoji: '⛺' },
}

// Haversine distance (meters)
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(meters) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`
}

// ── GET /api/places ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      lat,
      lng,
      type    = 'police',
      radius  = 3000,
      limit   = 8,
    } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' })
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('[Places] Google Maps API key not set — returning empty')
      return res.json({ places: [], mode: 'none' })
    }

    const params = {
      location: `${lat},${lng}`,
      radius,
      type,
      key: process.env.GOOGLE_MAPS_API_KEY,
    }

    const { data } = await axios.get(PLACES_API_URL, { params, timeout: 10000 })

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      const errorMsg = data.status === 'REQUEST_DENIED'
        ? 'REQUEST_DENIED: Please check your Google Maps API key and ensure "Places API" is enabled in Google Cloud Console.'
        : `Google Places error: ${data.status} ${data.error_message || ''}`
      console.warn(`[Places] ${errorMsg}`)
      return res.json({ places: [], mode: 'error', error: data.status, message: errorMsg })
    }

    const results = (data.results || [])
      .slice(0, parseInt(limit))
      .map((place) => {
        const placeLat = place.geometry?.location?.lat
        const placeLng = place.geometry?.location?.lng
        const distMeters = haversineMeters(
          parseFloat(lat), parseFloat(lng),
          placeLat, placeLng
        )
        return {
          id:         place.place_id,
          name:       place.name,
          type,
          label:      TYPE_CONFIG[type]?.label || type,
          emoji:      TYPE_CONFIG[type]?.emoji || '📍',
          lat:        placeLat,
          lng:        placeLng,
          vicinity:   place.vicinity || '',
          rating:     place.rating || null,
          open_now:   place.opening_hours?.open_now ?? null,
          distance:   formatDistance(distMeters),
          distMeters,
        }
      })
      .sort((a, b) => a.distMeters - b.distMeters)

    console.info(`[Places] ✅ Found ${results.length} ${type} near ${lat},${lng}`)
    return res.json({ places: results, type, mode: 'google', count: results.length })

  } catch (err) {
    console.error('[Places] Error:', err.message)
    return res.json({ places: [], mode: 'error' })
  }
})

// ── GET /api/places/all — fetch all safety types at once ─────
router.get('/all', async (req, res) => {
  const { lat, lng } = req.query
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' })

  try {
    const baseLat = parseFloat(lat)
    const baseLng = parseFloat(lng)
    const types = ['police', 'hospital', 'fire_station', 'shelter']
    const results = {}

    await Promise.all(
      types.map(async (type) => {
        try {
          if (!process.env.GOOGLE_MAPS_API_KEY) {
            results[type] = getDemoData(type, baseLat, baseLng).places
            return
          }
          const { data } = await axios.get(PLACES_API_URL, {
            params: { location: `${lat},${lng}`, radius: 3000, type, key: process.env.GOOGLE_MAPS_API_KEY },
            timeout: 10000,
          })
          
          if (data.status !== 'OK') {
            console.warn(`[Places/all] ${type} fetch failed:`, data.status)
            results[type] = getDemoData(type, baseLat, baseLng).places
            return
          }

          results[type] = (data.results || []).slice(0, 5).map((place) => {
            const pLat = place.geometry?.location?.lat
            const pLng = place.geometry?.location?.lng
            const distMeters = haversineMeters(parseFloat(lat), parseFloat(lng), pLat, pLng)
            return {
              id: place.place_id, name: place.name, type,
              label: TYPE_CONFIG[type]?.label, emoji: TYPE_CONFIG[type]?.emoji,
              lat: pLat, lng: pLng, vicinity: place.vicinity || '',
              distance: formatDistance(distMeters), distMeters,
              open_now: place.opening_hours?.open_now ?? null,
            }
          }).sort((a, b) => a.distMeters - b.distMeters)
        } catch (err) {
          console.error(`[Places/all] ${type} error:`, err.message)
          results[type] = getDemoData(type, baseLat, baseLng).places
        }
      })
    )

    return res.json({ ...results, mode: process.env.GOOGLE_MAPS_API_KEY ? 'google' : 'demo' })
  } catch (err) {
    console.error('[Places/all] Error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch places' })
  }
})

// ── Demo fallback data ────────────────────────────────────────
function getDemoData(type, lat, lng) {
  const demos = {
    police: [
      { id: 'p1', name: 'Adyar Police Station',     lat: lat + 0.008, lng: lng - 0.005, vicinity: 'Adyar, Chennai',       distance: '0.9 km', distMeters: 900 },
      { id: 'p2', name: 'Kotturpuram Police Station', lat: lat - 0.010, lng: lng + 0.007, vicinity: 'Kotturpuram, Chennai', distance: '1.3 km', distMeters: 1300 },
    ],
    hospital: [
      { id: 'h1', name: 'Government General Hospital', lat: lat + 0.005, lng: lng + 0.003, vicinity: 'Park Town, Chennai', distance: '0.6 km', distMeters: 600 },
      { id: 'h2', name: 'Apollo Hospital',           lat: lat - 0.012, lng: lng - 0.008, vicinity: 'Greams Road, Chennai', distance: '1.5 km', distMeters: 1500 },
    ],
    fire_station: [
      { id: 'f1', name: 'Adyar Fire Station', lat: lat + 0.006, lng: lng + 0.004, vicinity: 'Adyar, Chennai', distance: '0.7 km', distMeters: 700 },
    ],
    pharmacy: [
      { id: 'ph1', name: 'Apollo Pharmacy', lat: lat + 0.002, lng: lng + 0.001, vicinity: 'Nearby', distance: '0.3 km', distMeters: 300 },
    ],
    shelter: [
      { id: 's1', name: 'Community Relief Shelter', lat: lat - 0.004, lng: lng + 0.003, vicinity: 'Ward Community Hall', distance: '0.6 km', distMeters: 600 },
      { id: 's2', name: 'Govt School Temporary Shelter', lat: lat + 0.009, lng: lng - 0.004, vicinity: 'School Campus', distance: '1.1 km', distMeters: 1100 },
    ],
  }
  const cfg = TYPE_CONFIG[type] || { label: type, emoji: '📍' }
  const places = (demos[type] || []).map((d) => ({ ...d, type, label: cfg.label, emoji: cfg.emoji }))
  return { places, type, mode: 'demo', count: places.length }
}

export default router
