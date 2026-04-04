import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { ref, push, set } from "firebase/database";
import { db } from "../firebase";
import axios from "axios";
import { fetchNearbyEmergencyResources } from "../services/overpass";

// ── Emergency type definitions ─────────────────────────────────
export const EMERGENCY_TYPES = {
  medical: {
    id: "medical",
    label: "Medical",
    icon: "🏥",
    color: "#00c853",
    bg: "bg-medical-green/10",
    border: "border-medical-green/40",
  },
  women_safety: {
    id: "women_safety",
    label: "Women Safety",
    icon: "🚺",
    color: "#e91e8c",
    bg: "bg-women-pink/10",
    border: "border-women-pink/40",
  },
  fire: {
    id: "fire",
    label: "Fire",
    icon: "🔥",
    color: "#ff6d00",
    bg: "bg-fire-orange/10",
    border: "border-fire-orange/40",
  },
  flood: {
    id: "flood",
    label: "Flood",
    icon: "🌊",
    color: "#0288d1",
    bg: "bg-flood-blue/10",
    border: "border-flood-blue/40",
  },
  earthquake: {
    id: "earthquake",
    label: "Earthquake",
    icon: "🌍",
    color: "#8d6e63",
    bg: "bg-quake-brown/10",
    border: "border-quake-brown/40",
  },
};

const EmergencyContext = createContext(null);

const EMPTY_NEARBY_PLACES = {
  police: [],
  hospital: [],
  fire_station: [],
  shelter: [],
};

function normalizeNearbyPlaces(payload) {
  if (!payload || typeof payload !== "object") {
    return { ...EMPTY_NEARBY_PLACES };
  }

  return {
    police: Array.isArray(payload.police) ? payload.police : [],
    hospital: Array.isArray(payload.hospital) ? payload.hospital : [],
    fire_station: Array.isArray(payload.fire_station)
      ? payload.fire_station
      : [],
    shelter: Array.isArray(payload.shelter) ? payload.shelter : [],
  };
}

function mergeNearbyPlaces(prev, next) {
  const normalizedPrev = normalizeNearbyPlaces(prev);
  const normalizedNext = normalizeNearbyPlaces(next);

  return {
    police:
      normalizedNext.police.length > 0
        ? normalizedNext.police
        : normalizedPrev.police,
    hospital:
      normalizedNext.hospital.length > 0
        ? normalizedNext.hospital
        : normalizedPrev.hospital,
    fire_station:
      normalizedNext.fire_station.length > 0
        ? normalizedNext.fire_station
        : normalizedPrev.fire_station,
    shelter:
      normalizedNext.shelter.length > 0
        ? normalizedNext.shelter
        : normalizedPrev.shelter,
  };
}

export function EmergencyProvider({ children }) {
  // ── State ────────────────────────────────────────────────────
  const [sosActive, setSosActive] = useState(false);
  const [emergencyType, setEmergencyType] = useState(null); // one of EMERGENCY_TYPES keys
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [locationError, setLocationError] = useState(null);
  const [sosEventId, setSosEventId] = useState(null); // Firebase event key
  const [responders, setResponders] = useState([]); // nearby helpers
  const [sosTimestamp, setSosTimestamp] = useState(null);
  const [isResolved, setIsResolved] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState(EMPTY_NEARBY_PLACES);
  const watchIdRef = useRef(null);

  // ── Fetch browser geolocation ────────────────────────────────
  const fetchLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = "Geolocation is not supported by this browser.";
        setLocationError(err);
        reject(err);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setLocationError(null);
          resolve(loc);
        },
        (err) => {
          // Fallback: default to Chennai for demo
          const fallback = { lat: 13.0827, lng: 80.2707 };
          setUserLocation(fallback);
          setLocationError(
            "Location permission denied – using default city (Chennai)",
          );
          resolve(fallback);
        },
        { timeout: 8000, enableHighAccuracy: true },
      );
    });
  }, []);

  // ── Fetch nearby safety facilities ───────────────────────────
  const fetchNearbyPlaces = useCallback(async (loc) => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/places/all`,
        {
          params: { lat: loc.lat, lng: loc.lng },
        },
      );
      const normalized = normalizeNearbyPlaces(data);
      setNearbyPlaces((prev) => mergeNearbyPlaces(prev, normalized));
      return normalized;
    } catch (err) {
      console.warn("[EmergencyContext] Failed to fetch nearby places:", err);
      return null;
    }
  }, []);

  // ── Trigger SOS ─────────────────────────────────────────────
  const triggerSOS = useCallback(
    async (type) => {
      setSosActive(true);
      setEmergencyType(type);
      setSosTimestamp(new Date().toISOString());
      setIsResolved(false);

      // Get location first
      const loc = await fetchLocation();

      // TODO: Replace with your actual Firebase Realtime DB write
      // ==========================================================
      // HOW TO CONNECT FIREBASE:
      //   db is imported from firebase.js
      //   When db is available (Firebase config provided), this writes a real event.
      //   Otherwise, it falls back to a local-only state update.
      // ==========================================================
      if (db) {
        try {
          const eventsRef = ref(db, "sos_events");
          const newEvent = await push(eventsRef, {
            type,
            lat: loc.lat,
            lng: loc.lng,
            timestamp: new Date().toISOString(),
            status: "active",
            // userId:  auth.currentUser?.uid   // uncomment after Firebase auth setup
          });
          setSosEventId(newEvent.key);
        } catch (err) {
          console.warn("[SOS] Firebase write failed, demo mode:", err);
        }
      }

      // ── Simulate server-side alert broadcast & SOS creation ─────
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || ""}/api/sos`,
          { type, lat: loc.lat, lng: loc.lng },
        );
        if (data.success) {
          setSosEventId(data.eventId);
        }
      } catch (err) {
        console.warn("[SOS] Backend SOS creation failed:", err.message);
      }

      // ── Fetch real nearby helpers from backend ─────────────────
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || ""}/api/nearby`,
          {
            params: { lat: loc.lat, lng: loc.lng, type: "helpers", limit: 5 },
          },
        );
        if (data.helpers) {
          // Map backend helpers to frontend responder format
          const fetchedResponders = data.helpers.map((h) => ({
            id: h.id,
            name: h.name,
            distance: h.distance || "nearby",
            eta: h.eta || "calc...",
            type: "helper",
            phone: h.phone,
          }));
          setResponders(fetchedResponders);
        }
      } catch (err) {
        console.warn("[SOS] Failed to fetch real responders:", err.message);
      }

      // Fetch nearby safety facilities (Overpass + Google Fallback)
      try {
        const overpassRes = await fetchNearbyEmergencyResources(
          loc.lat,
          loc.lng,
        );
        if (overpassRes && overpassRes.length > 0) {
          const grouped = {
            hospital: [],
            police: [],
            fire_station: [],
            shelter: [],
          };
          overpassRes.forEach((r) => {
            if (grouped[r.type])
              grouped[r.type].push({
                id: r.id,
                name: r.name,
                lat: r.lat,
                lng: r.lon,
                distance: "nearby", // Overpass doesn't give distance directly, but MapView calculates it or we can add it
                vicinity: r.address,
                emoji:
                  r.type === "hospital"
                    ? "🏥"
                    : r.type === "police"
                      ? "👮"
                      : r.type === "fire_station"
                        ? "🚒"
                        : "⛺",
              });
          });
          setNearbyPlaces((prev) =>
            normalizeNearbyPlaces({ ...prev, ...grouped }),
          );
        }
      } catch (err) {
        console.warn("[Overpass] Real-time fetch failed:", err);
      }

      fetchNearbyPlaces(loc);

      // Start real-time tracking
      if (navigator.geolocation && !watchIdRef.current) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          null,
          { enableHighAccuracy: true },
        );
      }
    },
    [fetchLocation, fetchNearbyPlaces],
  );

  // ── Resolve SOS ─────────────────────────────────────────────
  const resolveEmergency = useCallback(async () => {
    setIsResolved(true);
    setSosActive(false);

    if (db && sosEventId) {
      try {
        await set(ref(db, `sos_events/${sosEventId}/status`), "resolved");
      } catch {}
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [sosEventId]);

  // ── Reset all state ──────────────────────────────────────────
  const reset = useCallback(() => {
    setSosActive(false);
    setEmergencyType(null);
    setResponders([]);
    setSosEventId(null);
    setSosTimestamp(null);
    setIsResolved(false);
    setNearbyPlaces(EMPTY_NEARBY_PLACES);
  }, []);

  return (
    <EmergencyContext.Provider
      value={{
        // State
        sosActive,
        emergencyType,
        userLocation,
        locationError,
        sosEventId,
        responders,
        sosTimestamp,
        isResolved,
        nearbyPlaces,
        // Actions
        triggerSOS,
        resolveEmergency,
        reset,
        setEmergencyType,
        fetchLocation,
        setSosActive,
        fetchNearbyPlaces,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
}

// ── Custom hook for easy consumption ────────────────────────
export function useEmergency() {
  const ctx = useContext(EmergencyContext);
  if (!ctx)
    throw new Error("useEmergency must be used inside <EmergencyProvider>");
  return ctx;
}
