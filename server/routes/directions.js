import express from 'express'
import axios from 'axios'

const router = express.Router()

const ORS_BASE_URL = (process.env.ORS_BASE_URL || 'https://api.openrouteservice.org').replace(/\/$/, '')
const OSRM_BASE_URL = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '')
const SNAP_RADIUS_METERS = Number(process.env.ROUTE_SNAP_RADIUS_METERS || 3000)

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function profileToOsrm(profile) {
  if (profile === 'foot-walking') return 'foot'
  if (profile === 'cycling-regular') return 'bike'
  return 'driving'
}

function preferredDestinationType(emergencyType) {
  const map = {
    medical: 'hospital',
    women_safety: 'police',
    fire: 'fire_station',
    flood: 'shelter',
    earthquake: 'shelter',
  }
  return map[emergencyType] || 'hospital'
}

function normalizeOrsRoutes(payload) {
  const features = payload?.features || []
  return features
    .map((f) => {
      const segment = f?.properties?.segments?.[0]
      const coords = f?.geometry?.coordinates || []
      const normalizedCoords = coords
        .filter((c) => Array.isArray(c) && c.length >= 2)
        .map((c) => [c[1], c[0]])

      if (!segment || normalizedCoords.length < 2) return null
      return {
        source: 'ors',
        distance: Number(segment.distance || 0),
        duration: Number(segment.duration || 0),
        coordinates: normalizedCoords,
      }
    })
    .filter(Boolean)
}

function normalizeOsrmRoutes(payload) {
  const routes = payload?.routes || []
  return routes
    .map((r) => {
      const coords = r?.geometry?.coordinates || []
      const normalizedCoords = coords
        .filter((c) => Array.isArray(c) && c.length >= 2)
        .map((c) => [c[1], c[0]])

      if (normalizedCoords.length < 2) return null
      return {
        source: 'osrm',
        distance: Number(r.distance || 0),
        duration: Number(r.duration || 0),
        coordinates: normalizedCoords,
      }
    })
    .filter(Boolean)
}

function safetyScore(route, { emergencyType, destinationType, availability }) {
  const durationMin = route.duration / 60
  const distanceKm = route.distance / 1000
  const preferredType = preferredDestinationType(emergencyType)

  let score = 100
  score -= Math.min(45, durationMin * 0.8)
  score -= Math.min(30, distanceKm * 1.2)

  if (destinationType && destinationType === preferredType) score += 14
  if (availability === false) score -= 38
  if (route.source === 'ors') score += 4

  return Math.max(0, Math.min(100, Math.round(score)))
}

function rankingScore(route, mode, ctx) {
  const sScore = safetyScore(route, ctx)
  const durationMin = route.duration / 60
  const distanceKm = route.distance / 1000

  if (mode === 'fastest') {
    return -durationMin
  }

  if (mode === 'safest') {
    return sScore
  }

  return sScore * 0.6 - durationMin * 0.3 - distanceKm * 0.1
}

function summarize(route, mode, ctx) {
  const safety = safetyScore(route, ctx)
  const etaMinutes = Math.max(1, Math.round(route.duration / 60))
  return {
    ...route,
    safetyScore: safety,
    etaMinutes,
    mode,
    score: Number(rankingScore(route, mode, ctx).toFixed(3)),
  }
}

function parseAvailability(input) {
  if (typeof input === 'boolean') return input
  if (typeof input === 'number') return input > 0
  if (typeof input !== 'string') return true

  const v = input.toLowerCase().trim()
  if (v === 'false' || v === '0' || v === 'no') return false
  return true
}

router.get('/', async (req, res) => {
  const originLat = toNumber(req.query.originLat)
  const originLng = toNumber(req.query.originLng)
  const destinationLat = toNumber(req.query.destinationLat)
  const destinationLng = toNumber(req.query.destinationLng)

  const mode = (req.query.mode || 'balanced').toString()
  const emergencyType = (req.query.emergencyType || 'general').toString()
  const destinationType = (req.query.destinationType || 'unknown').toString()
  const profile = (req.query.profile || 'driving-car').toString()
  const availability = parseAvailability(req.query.availability)

  if ([originLat, originLng, destinationLat, destinationLng].some((v) => v === null)) {
    return res.status(400).json({ error: 'originLat, originLng, destinationLat and destinationLng are required' })
  }

  const ctx = { emergencyType, destinationType, availability }
  const selectedMode = ['fastest', 'safest', 'balanced'].includes(mode) ? mode : 'balanced'

  let normalizedRoutes = []
  let provider = 'none'
  let fallback = false
  const orsKey = (process.env.ORS_API_KEY || '').trim()

  if (orsKey && !orsKey.includes('YOUR_')) {
    try {
      const body = {
        coordinates: [
          [originLng, originLat],
          [destinationLng, destinationLat],
        ],
        instructions: false,
        radiuses: [SNAP_RADIUS_METERS, SNAP_RADIUS_METERS],
        alternative_routes: {
          target_count: 3,
          share_factor: 0.6,
          weight_factor: 1.6,
        },
      }

      const { data } = await axios.post(
        `${ORS_BASE_URL}/v2/directions/${profile}/geojson`,
        body,
        {
          headers: {
            Authorization: orsKey,
            'Content-Type': 'application/json',
          },
          params: {
            api_key: orsKey,
          },
          timeout: 10000,
        },
      )

      normalizedRoutes = normalizeOrsRoutes(data)
      provider = 'ors'
    } catch (err) {
      console.warn('[Directions] ORS request failed:', err.response?.data || err.message)
    }
  }

  if (normalizedRoutes.length === 0) {
    try {
      const osrmProfile = profileToOsrm(profile)
      const url = `${OSRM_BASE_URL}/route/v1/${osrmProfile}/${originLng},${originLat};${destinationLng},${destinationLat}`
      const { data } = await axios.get(url, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          alternatives: 'true',
          steps: 'false',
          radiuses: `${SNAP_RADIUS_METERS};${SNAP_RADIUS_METERS}`,
        },
        timeout: 10000,
      })

      normalizedRoutes = normalizeOsrmRoutes(data)
      provider = 'osrm'
      fallback = true
    } catch (err) {
      console.warn('[Directions] OSRM request failed:', err.response?.data || err.message)
    }
  }

  if (normalizedRoutes.length === 0) {
    const dx = (originLat - destinationLat) * 111000
    const dy = (originLng - destinationLng) * 111000
    const linearDistance = Math.sqrt(dx * dx + dy * dy)
    const linearDuration = (linearDistance / 13000) * 3600

    normalizedRoutes = [
      {
        source: 'linear',
        distance: linearDistance,
        duration: linearDuration,
        coordinates: [
          [originLat, originLng],
          [destinationLat, destinationLng],
        ],
      },
    ]
    provider = 'linear'
    fallback = true
  }

  const alternatives = normalizedRoutes.map((r) => summarize(r, selectedMode, ctx))
  const selected = [...alternatives].sort((a, b) => b.score - a.score)[0]

  return res.json({
    route: selected,
    alternatives,
    meta: {
      provider,
      fallback,
      mode: selectedMode,
      emergencyType,
      destinationType,
      availability,
    },
  })
})

export default router
