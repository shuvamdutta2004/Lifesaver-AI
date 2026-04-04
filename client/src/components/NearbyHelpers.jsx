import { useEmergency } from "../context/EmergencyContext";

export default function NearbyHelpers() {
  const { responders, sosActive, nearbyPlaces } = useEmergency();

  if (!sosActive) return null;

  // Simulated responders for demo if none found
  const demoResponders = [
    {
      id: "d1",
      name: "Arun Kumar",
      distance: "0.8 km",
      eta: "4 min",
      type: "helper",
      phone: "9876543210",
    },
    {
      id: "d2",
      name: "City Hospital (Ambulance)",
      distance: "1.2 km",
      eta: "6 min",
      type: "hospital",
      phone: "108",
    },
  ];

  const activeResponders = responders.length > 0 ? responders : demoResponders;
  const facilityGroups = Object.entries(nearbyPlaces || {}).filter(
    ([, places]) => Array.isArray(places),
  );

  return (
    <div className="space-y-4 animate-slide-up pb-10">
      {/* ── Section: Active Responders ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
            Nearby Responders
          </h3>
          <span className="px-2 py-0.5 bg-safe-green/20 text-safe-green text-[10px] font-bold rounded-full border border-safe-green/30">
            {activeResponders.length} ACTIVE
          </span>
        </div>

        {activeResponders.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 p-4 bg-bg-card border border-white/5 rounded-2xl hover:border-safe-green/30 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-full bg-safe-green/10 flex items-center justify-center text-lg flex-shrink-0">
              {r.type === "hospital" ? "🏥" : "🙋"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-100 truncate">
                {r.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400">
                  📍 {r.distance}
                </span>
                <span className="text-[10px] text-safe-green font-bold">
                  ETA {r.eta}
                </span>
              </div>
            </div>
            <a
              href={`tel:${r.phone}`}
              className="px-3 py-1.5 bg-safe-green/15 hover:bg-safe-green/25 text-safe-green text-[10px] font-bold rounded-lg border border-safe-green/30 transition-all active:scale-90"
            >
              CALL
            </a>
          </div>
        ))}
      </div>

      {/* ── Section: Nearby Safety Facilities ────────────────── */}
      <div className="pt-2">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
          Nearby Safety Facilities
        </h3>

        <div className="space-y-6">
          {/* Loop through each category */}
          {facilityGroups.map(([type, places]) => {
            if (places.length === 0) return null;

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2 opacity-50">
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <span className="text-[9px] font-black uppercase text-gray-400">
                    {type.replace("_", " ")}s
                  </span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>

                {places.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-xl flex-shrink-0">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-200 truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                        📍 {p.distance}{" "}
                        {p.vicinity
                          ? `• ${p.vicinity.substring(0, 25)}...`
                          : ""}
                      </p>
                    </div>
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="text-[10px] text-flood-blue font-bold hover:underline"
                      >
                        CALL
                      </a>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Fallback if no facilities at all */}
          {facilityGroups.every(([, places]) => places.length === 0) && (
            <div className="px-4 py-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
              <p className="text-xs text-gray-500 italic">
                Scanning OpenStreetMap for nearby emergency resources...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
