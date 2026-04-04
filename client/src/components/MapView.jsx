import { useEffect, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEmergency, EMERGENCY_TYPES } from "../context/EmergencyContext";
import hospitalsData from "../data/hospitals.json";
import helpersData from "../data/helpers.json";
import safezonesData from "../data/safezones.json";
import { fetchNearbyEmergencyResources } from "../services/overpass";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const ROUTE_MODE_OPTIONS = [
  { id: "fastest", label: "Fastest" },
  { id: "balanced", label: "Balanced" },
  { id: "safest", label: "Safest" },
];

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function preferredTypeForEmergency(emergencyType) {
  const typeMap = {
    medical: "hospital",
    women_safety: "police",
    fire: "fire_station",
    flood: "shelter",
    earthquake: "shelter",
  };
  return typeMap[emergencyType] || "hospital";
}

function profileForEmergency(emergencyType) {
  if (emergencyType === "flood" || emergencyType === "earthquake") {
    return "foot-walking";
  }
  return "driving-car";
}

// ── Custom marker icons ──────────────────────────────────────
const makeIcon = (emoji, size = 32) =>
  L.divIcon({
    html: `<div style="
      font-size:${size}px;line-height:1;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    ">${emoji}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const ICONS = {
  user: makeIcon("📍", 38),
  hospital: makeIcon("🏥", 28),
  helper: makeIcon("🙋", 26),
  shelter: makeIcon("⛺", 26),
  police: makeIcon("👮", 26),
  fire_station: makeIcon("🚒", 26),
};

// ── Auto-pan to location helper ──────────────────────────────
function PanToLocation({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location)
      map.flyTo([location.lat, location.lng], 15, { duration: 1.5 });
  }, [location, map]);
  return null;
}

// ────────────────────────────────────────────────────────────
export default function MapView({ showShelters = false }) {
  const { userLocation, emergencyType, sosActive, responders, nearbyPlaces } =
    useEmergency();
  const [ready, setReady] = useState(false);
  const [routeTo, setRouteTo] = useState(null);

  const demoResponders = [
    {
      id: "d1",
      name: "Arun Kumar",
      distance: "0.8 km",
      eta: "4 min",
      type: "helper",
      role: "Volunteer",
    },
    {
      id: "d2",
      name: "City Hospital (Ambulance)",
      distance: "1.2 km",
      eta: "6 min",
      type: "hospital",
      role: "Hospital Team",
    },
  ];
  const activeResponders = responders.length > 0 ? responders : demoResponders;

  // Overpass state
  const [overpassResources, setOverpassResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeMode, setRouteMode] = useState("balanced");
  const [routePath, setRoutePath] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [filters, setFilters] = useState({
    hospital: true,
    police: true,
    fire_station: true,
    shelter: true,
  });

  // Default center: Chennai
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [13.0827, 80.2707];

  const eType = emergencyType ? EMERGENCY_TYPES[emergencyType] : null;
  const overpassTypes = new Set(overpassResources.map((r) => r.type));

  // Fetch from Overpass API when SOS is active or location changes
  useEffect(() => {
    if (sosActive && userLocation) {
      const loadResources = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const resources = await fetchNearbyEmergencyResources(
            userLocation.lat,
            userLocation.lng,
          );
          setOverpassResources(resources);
        } catch (err) {
          setError("Failed to fetch real-time resources. Using fallbacks.");
        } finally {
          setIsLoading(false);
        }
      };
      loadResources();
    }
  }, [sosActive, userLocation, emergencyType]);

  useEffect(() => {
    // ... rest of existing ready logic
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!sosActive || !userLocation) return;

    let cancelled = false;

    const buildCandidatePool = () => {
      const preferredType = preferredTypeForEmergency(emergencyType);

      const fromOverpass = overpassResources.map((r) => ({
        id: `overpass-${r.type}-${r.id}`,
        name: r.name,
        type: r.type,
        lat: r.lat,
        lng: r.lon,
        available: true,
      }));

      const fromNearby = Object.entries(nearbyPlaces || {}).flatMap(
        ([type, places]) =>
          Array.isArray(places)
            ? places.map((p) => ({
                id: `nearby-${type}-${p.id}`,
                name: p.name,
                type,
                lat: p.lat,
                lng: p.lng,
                available: p.open_now !== false,
                open_now: p.open_now,
              }))
            : [],
      );

      const shelterCandidates =
        preferredType === "shelter"
          ? safezonesData.shelters.map((s) => ({
              id: `safezone-${s.id}`,
              name: s.name,
              type: "shelter",
              lat: s.lat,
              lng: s.lng,
              available: s.current_occupancy < s.capacity,
            }))
          : [];

      const merged = [...fromOverpass, ...fromNearby, ...shelterCandidates].filter(
        (c) => Number.isFinite(c.lat) && Number.isFinite(c.lng),
      );

      const uniqueById = Array.from(new Map(merged.map((c) => [c.id, c])).values());

      const preferred = uniqueById.filter((c) => c.type === preferredType);
      const finalPool = preferred.length > 0 ? preferred : uniqueById;

      return finalPool
        .map((c) => ({
          ...c,
          linearDist: haversineMeters(userLocation.lat, userLocation.lng, c.lat, c.lng),
        }))
        .sort((a, b) => {
          const availabilityA = a.available === false ? 1 : 0;
          const availabilityB = b.available === false ? 1 : 0;
          if (availabilityA !== availabilityB) return availabilityA - availabilityB;
          return a.linearDist - b.linearDist;
        })
        .slice(0, 10);
    };

    const chooseBestRoute = async () => {
      setIsRouting(true);
      const candidates = buildCandidatePool();

      if (candidates.length === 0) {
        setIsRouting(false);
        return;
      }

      const routed = await Promise.all(
        candidates.map(async (candidate) => {
          try {
            const { data } = await axios.get(`${API_BASE}/api/directions`, {
              params: {
                originLat: userLocation.lat,
                originLng: userLocation.lng,
                destinationLat: candidate.lat,
                destinationLng: candidate.lng,
                emergencyType,
                destinationType: candidate.type,
                availability: candidate.available,
                mode: routeMode,
                profile: profileForEmergency(emergencyType),
              },
              timeout: 12000,
            });

            if (!data?.route) return null;
            return {
              candidate,
              route: data.route,
              meta: data.meta,
            };
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;

      const validRoutes = routed.filter(Boolean);

      if (validRoutes.length === 0) {
        const fallback = candidates[0];
        setRouteTo(fallback);
        setRoutePath([
          [userLocation.lat, userLocation.lng],
          [fallback.lat, fallback.lng],
        ]);
        setRouteInfo({ provider: "linear", mode: routeMode, fallback: true });
        setIsRouting(false);
        return;
      }

      const best = validRoutes.sort((a, b) => {
        if (routeMode === "fastest") return a.route.duration - b.route.duration;
        if (routeMode === "safest") return b.route.safetyScore - a.route.safetyScore;
        return b.route.score - a.route.score;
      })[0];

      setRouteTo(best.candidate);
      setRoutePath(best.route.coordinates || []);
      setRouteInfo({
        provider: best.meta?.provider || "unknown",
        mode: routeMode,
        fallback: Boolean(best.meta?.fallback),
        etaMinutes: best.route.etaMinutes,
        safetyScore: best.route.safetyScore,
        distanceKm: (best.route.distance / 1000).toFixed(1),
      });
      setIsRouting(false);
    };

    chooseBestRoute();
    return () => {
      cancelled = true;
    };
  }, [
    emergencyType,
    nearbyPlaces,
    overpassResources,
    routeMode,
    sosActive,
    userLocation,
  ]);

  if (!ready) {
    return (
      <div className="w-full h-full min-h-[300px] bg-bg-card rounded-2xl flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden relative">
      {/* Emergency type overlay badge */}
      {eType && (
        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/10"
            style={{ color: eType.color }}
          >
            <span>{eType.icon}</span>
            <span>{eType.label} Emergency</span>
          </div>

          {isLoading && (
            <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full animate-pulse w-fit">
              📡 SCANNING NEARBY...
            </div>
          )}

          {routeInfo && (
            <div className="px-3 py-1 bg-black/70 text-white text-[10px] font-bold rounded-full w-fit border border-white/10">
              {routeInfo.mode.toUpperCase()} • {routeInfo.provider.toUpperCase()} • ETA {routeInfo.etaMinutes || "--"}m • SAFE {routeInfo.safetyScore || "--"}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1">
        {ROUTE_MODE_OPTIONS.map((m) => (
          <button
            key={m.id}
            onClick={() => setRouteMode(m.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${routeMode === m.id ? "bg-blue-500 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"}`}
          >
            {m.label}
          </button>
        ))}
        {isRouting && (
          <span className="px-2 text-[9px] text-blue-300 font-bold animate-pulse">
            ROUTING...
          </span>
        )}
      </div>

      {/* Filter Toggles */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
        {Object.keys(filters).map((type) => (
          <button
            key={type}
            onClick={() => setFilters((f) => ({ ...f, [type]: !f[type] }))}
            className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${filters[type] ? "bg-white/90 text-black" : "bg-black/40 text-gray-500 border border-white/5"}`}
          >
            {type.replace("_", " ")}
          </button>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: "100%", minHeight: "300px", width: "100%" }}
        zoomControl={false}
      >
        {/* Dark tile layer (CartoDB Dark Matter) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Auto-pan to user */}
        {userLocation && <PanToLocation location={userLocation} />}

        {/* User pin */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={200}
              pathOptions={{
                color: "#ff1744",
                fillColor: "#ff1744",
                fillOpacity: 0.08,
                weight: 1,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={ICONS.user}
            >
              <Popup>
                <div className="text-sm font-semibold">📍 You are here</div>
                <div className="text-xs text-gray-500">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Overpass Resources Markers */}
        {overpassResources
          .filter((r) => filters[r.type])
          .map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lon]}
              icon={ICONS[p.type] || ICONS.user}
            >
              <Popup className="emergency-popup">
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>
                    {ICONS[p.type]?.options?.html?.match(
                      /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27ff]/g,
                    )?.[0] || "📍"}
                  </span>
                  {p.name}
                </div>
                <div className="text-[10px] text-gray-400 my-1">
                  {p.address}
                </div>
                <button
                  onClick={() => {
                    setRouteTo({ lat: p.lat, lng: p.lon, name: p.name });
                    setRoutePath([
                      [userLocation?.lat || center[0], userLocation?.lng || center[1]],
                      [p.lat, p.lon],
                    ]);
                    setRouteInfo({ provider: "manual", mode: routeMode, fallback: true });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded transition-colors mt-1"
                >
                  ROUTE TO {p.type.replace("_", " ").toUpperCase()}
                </button>
              </Popup>
            </Marker>
          ))}

        {/* Nearby Safety Places from backend as per-type fallback */}
        {Object.entries(nearbyPlaces || {}).map(([type, places]) => {
          if (!filters[type] || overpassTypes.has(type) || !Array.isArray(places)) {
            return null;
          }

          return places.map((p) => (
            <Marker
              key={`fallback-${type}-${p.id}`}
              position={[p.lat, p.lng]}
              icon={ICONS[type] || ICONS.user}
            >
              <Popup>
                <div className="text-sm font-semibold">
                  {p.emoji || "📍"} {p.name}
                </div>
                <div className="text-xs text-gray-400 font-mono mb-2">
                  {p.label || type.replace("_", " ")} • {p.distance || "nearby"}
                </div>
                <button
                  onClick={() => {
                    setRouteTo(p);
                    setRoutePath([
                      [userLocation?.lat || center[0], userLocation?.lng || center[1]],
                      [p.lat, p.lng],
                    ]);
                    setRouteInfo({ provider: "manual", mode: routeMode, fallback: true });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
                >
                  NAVIGATE HERE
                </button>
              </Popup>
            </Marker>
          ));
        })}

        {/* Routing Line */}
        {routeTo && userLocation && (
          <Polyline
            positions={
              routePath.length > 1
                ? routePath
                : [
                    [userLocation.lat, userLocation.lng],
                    [routeTo.lat, routeTo.lon || routeTo.lng],
                  ]
            }
            pathOptions={{
              color: "#2196f3",
              weight: 4,
              dashArray: "8, 8",
              opacity: 0.8,
              lineJoin: "round",
            }}
          />
        )}

        {/* Hospital markers (static fallback) */}
        {(!nearbyPlaces.hospital || nearbyPlaces.hospital.length === 0) &&
          hospitalsData.map((h) => (
            <Marker key={h.id} position={[h.lat, h.lng]} icon={ICONS.hospital}>
              <Popup>
                <div className="text-sm font-semibold">{h.name}</div>
                <div className="text-xs">📞 {h.phone}</div>
                <div className="text-xs text-green-600">
                  {h.distance} • {h.beds} beds
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Simulated helper markers (appear after SOS) */}
        {sosActive &&
          activeResponders.map((r) => (
            <Marker
              key={r.id}
              position={[
                (userLocation?.lat || 13.0827) +
                  0.005 * Math.sin(parseInt(r.id.slice(-5), 36) || 0),
                (userLocation?.lng || 80.2707) +
                  0.005 * Math.cos(parseInt(r.id.slice(-5), 36) || 0),
              ]}
              icon={ICONS.helper}
            >
              <Popup>
                <div className="text-sm font-semibold">🙋 {r.name}</div>
                <div className="text-xs">
                  {r.role || "Volunteer"} • {r.distance}
                </div>
                <div className="text-xs text-blue-600">ETA: {r.eta}</div>
              </Popup>
            </Marker>
          ))}

        {/* Shelter markers for disaster mode */}
        {showShelters &&
          safezonesData.shelters.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={ICONS.shelter}>
              <Popup>
                <div className="text-sm font-semibold">⛺ {s.name}</div>
                <div className="text-xs">
                  Capacity: {s.capacity} • Occupied: {s.current_occupancy}
                </div>
                <div className="text-xs">{s.distance}</div>
              </Popup>
            </Marker>
          ))}

        {/* Safe zone circles for disaster mode */}
        {showShelters &&
          safezonesData.safezones.map((sz) => (
            <Circle
              key={sz.id}
              center={[sz.lat, sz.lng]}
              radius={300}
              pathOptions={{
                color: "#00e676",
                fillColor: "#00e676",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
          ))}
      </MapContainer>
    </div>
  );
}
