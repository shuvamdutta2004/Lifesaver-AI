import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load safezones data from JSON file
const safezonesPath = path.join(__dirname, '../data/safezones.json')
const safezonesData = JSON.parse(fs.readFileSync(safezonesPath, 'utf8'))

/**
 * GET /api/escape
 * 
 * Find optimal escape routes based on emergency type and location
 * 
 * Query params:
 *   lat: User latitude
 *   lng: User longitude
 *   type: Emergency type (fire | flood | women_safety | medical | earthquake)
 *   radius: Search radius in km (default 5)
 */
router.get('/', (req, res) => {
  try {
    const { lat, lng, type = 'fire', radius = 5 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' })
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const searchRadius = parseFloat(radius)

    // Define danger zones by emergency type
    const dangerZones = getDangerZones(type, userLat, userLng)
    const safeZones = getSafeZonesByType(type, userLat, userLng, searchRadius)

    // Rank safe zones by safety and distance
    const rankedSafeZones = safeZones
      .map(zone => ({
        ...zone,
        distance: haversineDistance(userLat, userLng, zone.lat, zone.lng),
        safetyScore: calculateSafetyScore(zone, type),
      }))
      .sort((a, b) => b.safetyScore - a.safetyScore || a.distance - b.distance)

    // Select primary escape destination (safest + closest)
    const primaryEscape = rankedSafeZones[0] || null

    // Calculate escape bearing (direction to safe zone)
    const bearing = primaryEscape 
      ? calculateBearing(userLat, userLng, primaryEscape.lat, primaryEscape.lng)
      : null

    res.json({
      success: true,
      type,
      userLocation: { lat: userLat, lng: userLng },
      dangerZones,
      primaryEscape: primaryEscape ? {
        id: primaryEscape.id,
        name: primaryEscape.name,
        lat: primaryEscape.lat,
        lng: primaryEscape.lng,
        distance: primaryEscape.distance,
        bearing,
        capacity: primaryEscape.capacity,
        current_occupancy: primaryEscape.current_occupancy,
        supplies: primaryEscape.supplies || [],
      } : null,
      alternateEscapes: rankedSafeZones.slice(1, 3).map(zone => ({
        id: zone.id,
        name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        distance: zone.distance,
        bearing: calculateBearing(userLat, userLng, zone.lat, zone.lng),
      })),
      recommendations: getRecommendations(type, primaryEscape),
    })
  } catch (err) {
    console.error('Escape route error:', err)
    res.status(500).json({ error: 'Failed to calculate escape route', details: err.message })
  }
})

/**
 * Define danger zones based on emergency type
 */
function getDangerZones(type, centerLat, centerLng) {
  const dangerRadiusKm = {
    fire: 0.5,
    flood: 1.0,
    women_safety: 0.2,
    medical: 0,
    earthquake: 1.5,
  }[type] || 0.5

  // Create a simple circular danger zone centered on user location
  return [
    {
      type: 'primary',
      center: { lat: centerLat, lng: centerLng },
      radiusKm: dangerRadiusKm,
      description: `Danger zone - ${dangerRadiusKm}km radius from incident`,
      color: '#EF4444', // red
    },
  ]
}

/**
 * Get safe zones appropriate for the emergency type
 */
function getSafeZonesByType(type, userLat, userLng, radiusKm) {
  const safezones = safezonesData.shelters || []

  return safezones.filter(zone => {
    const dist = haversineDistance(userLat, userLng, zone.lat, zone.lng)
    const suitableForType = {
      fire: zone.type !== 'hospital', // Avoid hospitals during fire
      flood: zone.elevation > 50, // Prefer elevated areas
      women_safety: zone.type === 'police_station' || zone.type === 'shelter', // Police stations or shelters
      medical: zone.type === 'hospital', // Hospitals for medical
      earthquake: zone.type !== 'hospital' && zone.structure === 'reinforced', // Solid structures
    }[type] !== false

    return dist <= radiusKm && suitableForType
  })
}

/**
 * Calculate safety score for a zone based on emergency type
 */
function calculateSafetyScore(zone, type) {
  let score = 50 // Base score

  // Occupancy: prefer less crowded
  const occupancyRatio = zone.current_occupancy / zone.capacity
  if (occupancyRatio < 0.5) score += 20
  else if (occupancyRatio < 0.8) score += 10

  // Supplies: prefer well-stocked
  if (zone.supplies && zone.supplies.length > 0) {
    score += Math.min(zone.supplies.length * 5, 20)
  }

  // Type-specific scoring
  if (type === 'fire') {
    // Fire: prefer outdoor, away from flammable structures
    if (zone.type === 'park' || zone.type === 'open_ground') score += 30
    if (zone.elevation > 0) score += 10
  } else if (type === 'flood') {
    // Flood: prefer elevated areas
    if (zone.elevation > 50) score += 40
    if (zone.type === 'school' || zone.type === 'government_building') score += 15
  } else if (type === 'women_safety') {
    // Women safety: prefer police stations and guarded shelters
    if (zone.type === 'police_station') score += 50
    if (zone.security > 7) score += 20
  } else if (type === 'medical') {
    // Medical: hospital essential
    if (zone.type === 'hospital') score += 100
  } else if (type === 'earthquake') {
    // Earthquake: prefer reinforced structures
    if (zone.structure === 'reinforced') score += 30
    if (zone.type === 'government_building') score += 15
  }

  return score
}

/**
 * Get contextual recommendations based on emergency type
 */
function getRecommendations(type, primaryEscape) {
  const recommendations = {
    fire: [
      'Move AWAY from the fire',
      'Use stairs, never elevators',
      'Feel doors before opening (checking for heat)',
      'Stay low to avoid smoke',
      'Help others if it is safe to do so',
    ],
    flood: [
      'Move to HIGHER GROUND immediately',
      'Do NOT walk through floodwater',
      'Turn off electricity at main switch if safe',
      'Take important documents and medicines',
      'Monitor water levels and official updates',
    ],
    women_safety: [
      'Move to well-lit, crowded public area',
      'Call 100 (Police) or 1091 (Women Helpline)',
      'Try to remember details of threat (appearance, vehicle)',
      'Stay in public area until help arrives',
      'Contact trusted person to share location',
    ],
    medical: [
      'Call 108 (ambulance) immediately',
      'Keep person still and comfortable',
      'Monitor breathing and pulse',
      'Begin CPR if trained and person not breathing',
      'Prepare medical history for ambulance crew',
    ],
    earthquake: [
      'DROP-COVER-HOLD if still shaking',
      'Move to open ground away from buildings',
      'Watch for aftershocks and falling debris',
      'Check for gas leaks and electrical hazards',
      'Locate meeting point for family reunification',
    ],
  }[type] || []

  return recommendations
}

/**
 * Haversine formula: calculate distance between two lat/lng points
 * Returns distance in km
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate bearing (direction in degrees) from point A to point B
 * Returns degrees (0-360): 0=North, 90=East, 180=South, 270=West
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const lat1Rad = (lat1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180

  const y = Math.sin(dLng) * Math.cos(lat2Rad)
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

  let bearing = (Math.atan2(y, x) * 180) / Math.PI
  bearing = (bearing + 360) % 360 // Normalize to 0-360
  return bearing
}

export default router
