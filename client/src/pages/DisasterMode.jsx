import { useState } from 'react'
import { useEmergency, EMERGENCY_TYPES } from '../context/EmergencyContext'
import MapView       from '../components/MapView'
import DisasterPanel from '../components/DisasterPanel'
import AIChatPanel   from '../components/AIChatPanel'

const DISASTER_TYPES = ['fire', 'flood', 'earthquake']

export default function DisasterMode() {
  const { setEmergencyType, emergencyType } = useEmergency()
  const [activeType, setActiveType] = useState(emergencyType || 'flood')

  const handleTypeChange = (type) => {
    setActiveType(type)
    setEmergencyType(type)
  }

  const eType = EMERGENCY_TYPES[activeType]

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black">⛑️ Disaster Mode</h1>
        <p className="text-gray-500 text-sm">Safe zones, shelters & evacuation</p>
      </div>

      {/* Type selector */}
      <div className="flex gap-3">
        {DISASTER_TYPES.map((type) => {
          const t = EMERGENCY_TYPES[type]
          return (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                activeType === type
                  ? `${t.bg} ${t.border}`
                  : 'bg-bg-card border-white/10 text-gray-400 hover:text-white'
              }`}
              style={activeType === type ? { color: t.color } : {}}
            >
              {t.icon} {t.label}
            </button>
          )
        })}
      </div>

      {/* Active type banner */}
      <div
        className="px-4 py-3 rounded-xl border text-sm font-medium"
        style={{ background: `${eType?.color}12`, borderColor: `${eType?.color}40`, color: eType?.color }}
      >
        {eType?.icon} <strong>{eType?.label} Mode Active</strong> — Green zones on map are safe areas
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6">

        {/* Left: Map with shelters */}
        <div className="space-y-6">
          <div className="h-[400px]">
            <MapView showShelters />
          </div>
          <DisasterPanel type={activeType} />
        </div>

        {/* Right: AI Chat for disaster guidance */}
        <div className="h-[520px]">
          <AIChatPanel />
        </div>
      </div>
    </main>
  )
}
