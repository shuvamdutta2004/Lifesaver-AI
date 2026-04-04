/**
 * services/overpass.js
 * 
 * Hackathon-optimized Overpass API service for OpenStreetMap.
 * Fetches nearby emergency infrastructure within a given radius.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Fetches nearby emergency resources from OSM Overpass API.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters (default 2000)
 */
export async function fetchNearbyEmergencyResources(lat, lng, radius = 2000) {
  // Overpass QL Query
  // [out:json] -> Output format
  // node(around:radius, lat, lng) -> Find nodes around coordinates
  // way(around:radius, lat, lng) -> Find ways (larger buildings) around coordinates
  // Combining results with ( ... ); out center; -> Return centers for ways
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      way["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="police"](around:${radius},${lat},${lng});
      way["amenity"="police"](around:${radius},${lat},${lng});
      node["amenity"="fire_station"](around:${radius},${lat},${lng});
      way["amenity"="fire_station"](around:${radius},${lat},${lng});
      node["emergency"="fire_station"](around:${radius},${lat},${lng});
      way["emergency"="fire_station"](around:${radius},${lat},${lng});
      node["amenity"="shelter"](around:${radius},${lat},${lng});
      way["amenity"="shelter"](around:${radius},${lat},${lng});
      node["social_facility"="shelter"](around:${radius},${lat},${lng});
      way["social_facility"="shelter"](around:${radius},${lat},${lng});
    );
    out center;
  `;

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) throw new Error('Overpass API error');

    const data = await response.json();

    // Map raw OSM elements to clean structured output
    return (data.elements || []).map(el => {
      const amenity = el.tags?.amenity;
      const emergency = el.tags?.emergency;
      const socialFacility = el.tags?.social_facility;

      let type = 'shelter';
      if (amenity === 'hospital') type = 'hospital';
      else if (amenity === 'police') type = 'police';
      else if (amenity === 'fire_station' || emergency === 'fire_station') type = 'fire_station';
      else if (amenity === 'shelter' || socialFacility === 'shelter') type = 'shelter';

      return {
        id: el.id,
        type: type,
        name: el.tags.name || el.tags.operator || `Nearby ${type.replace('_', ' ')}`,
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon,
        address: el.tags['addr:street'] ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}` : 'Address unknown'
      };
    });
  } catch (error) {
    console.error('[Overpass] Error fetching resources:', error);
    throw error;
  }
}
