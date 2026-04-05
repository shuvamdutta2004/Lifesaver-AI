import { useState, useEffect } from 'react'
import safezonesData from '../data/safezones.json'
import mistakesData from '../data/mistakesToAvoid.json'
import { EMERGENCY_INSTRUCTIONS } from '../data/emergencyInstructions'

export default function DisasterPanel({ type }) {
  const { shelters = [], evacuationRoutes = [] } = safezonesData
  const instructions = EMERGENCY_INSTRUCTIONS[type] || {}
  const mistakes = mistakesData[type] || []
  
  // Timer state for time-bound sections
  const [activeSection, setActiveSection] = useState('now')
  const [elapsed, setElapsed] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* TIME-BOUND ACTION SECTIONS */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span>⏱️</span> Critical Actions - First 2 Minutes
        </h3>
        
        {/* Section tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveSection('now')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'now' 
                ? 'bg-danger-red/30 text-danger-red border border-danger-red' 
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            DO NOW
            <div className="text-[10px] font-normal mt-1">{formatTime(0)}</div>
          </button>
          <button
            onClick={() => setActiveSection('next_60s')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'next_60s' 
                ? 'bg-warning-amber/30 text-warning-amber border border-warning-amber' 
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            NEXT 60s
            <div className="text-[10px] font-normal mt-1">+1:00</div>
          </button>
          <button
            onClick={() => setActiveSection('next_2min')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'next_2min' 
                ? 'bg-flood-blue/30 text-flood-blue border border-flood-blue' 
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            NEXT 2min
            <div className="text-[10px] font-normal mt-1">+2:00</div>
          </button>
        </div>

        {/* Active section content */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          {instructions[activeSection]?.map((step, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                {idx + 1}
              </div>
              <p className="text-sm text-gray-300 pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT NOT TO DO - HIGH CONTRAST WARNING */}
      {mistakes.length > 0 && (
        <div className="bg-danger-red/10 border-2 border-danger-red rounded-lg p-4 animate-fade-in">
          <h3 className="text-sm font-bold text-danger-red mb-3 flex items-center gap-2">
            <span>⛔</span> CRITICAL: What NOT To Do
          </h3>
          <div className="space-y-2">
            {mistakes.map((mistake, idx) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-danger-red/90">
                <span className="flex-shrink-0 font-bold">✕</span>
                <span>{mistake}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
