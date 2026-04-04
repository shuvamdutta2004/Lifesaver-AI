import safezonesData from '../data/safezones.json'

export default function DisasterPanel({ type }) {
  const { shelters = [], evacuationRoutes = [] } = safezonesData

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Evacuation routes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span>🛣️</span> Evacuation Routes
        </h3>
        <div className="space-y-2">
          {evacuationRoutes.map((route) => (
            <div
              key={route.id}
              className="p-4 bg-bg-card border border-white/5 rounded-xl"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{route.name}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    route.safetyLevel === 'high'
                      ? 'bg-safe-green/20 text-safe-green'
                      : 'bg-warning-amber/20 text-warning-amber'
                  }`}
                >
                  {route.safetyLevel} safety
                </span>
              </div>
              <p className="text-xs text-gray-400">{route.description}</p>
              <p className="text-xs text-gray-500 mt-1">📏 {route.distance} • ➡️ {route.direction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shelters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span>⛺</span> Emergency Shelters
        </h3>
        <div className="space-y-2">
          {shelters.map((s) => {
            const occupancyPct = Math.round((s.current_occupancy / s.capacity) * 100)
            return (
              <div
                key={s.id}
                className="p-4 bg-bg-card border border-white/5 rounded-xl"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.distance}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    occupancyPct < 70 ? 'bg-safe-green/20 text-safe-green' : 'bg-warning-amber/20 text-warning-amber'
                  }`}>
                    {100 - occupancyPct}% free
                  </span>
                </div>

                {/* Capacity bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-flood-blue transition-all"
                    style={{ width: `${occupancyPct}%` }}
                  />
                </div>

                {/* Supplies */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.supplies.map((sup) => (
                    <span key={sup} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-400">
                      {sup}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
