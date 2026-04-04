import { useEmergency, EMERGENCY_TYPES } from '../context/EmergencyContext'
import { EMERGENCY_INSTRUCTIONS, HELPLINES } from '../data/emergencyInstructions'

export default function AlertBanner() {
  const { emergencyType, sosActive, sosTimestamp } = useEmergency()

  if (!sosActive || !emergencyType) return null

  const eType = EMERGENCY_TYPES[emergencyType]
  const instructions = EMERGENCY_INSTRUCTIONS[emergencyType]

  const elapsed = sosTimestamp
    ? Math.floor((Date.now() - new Date(sosTimestamp).getTime()) / 1000)
    : 0

  return (
    <div
      className="w-full rounded-2xl p-5 border animate-slide-up"
      style={{
        background: `${eType.color}12`,
        borderColor: `${eType.color}40`,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${eType.color}25` }}
          >
            {eType.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: eType.color, color: '#000' }}
              >
                {eType.label}
              </span>
              <span className="text-xs text-gray-500">EMERGENCY</span>
            </div>
            <p className="text-sm font-semibold mt-1" style={{ color: eType.color }}>
              {instructions?.banner}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500">Active for</p>
          <p className="text-lg font-black tabular-nums" style={{ color: eType.color }}>
            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
            {String(elapsed % 60).padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* Immediate actions */}
      <div className="space-y-2 mb-4">
        {instructions?.immediate?.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ background: `${eType.color}30`, color: eType.color }}
            >
              {i + 1}
            </span>
            <span className="text-sm text-gray-200">{step}</span>
          </div>
        ))}
      </div>

      {/* Helpline quick-dials */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
        {emergencyType === 'medical'      && <HelplineBtn label="Ambulance" number={HELPLINES.ambulance} />}
        {emergencyType === 'fire'         && <HelplineBtn label="Fire Dept" number={HELPLINES.fire}      />}
        {emergencyType === 'women_safety' && <HelplineBtn label="Women Helpline" number={HELPLINES.women} />}
        {(emergencyType === 'flood' || emergencyType === 'earthquake') && (
          <HelplineBtn label="Disaster Helpline" number={HELPLINES.disaster} />
        )}
        <HelplineBtn label="Police 100" number={HELPLINES.police} />
        <HelplineBtn label="National Emergency" number="112" />
      </div>
    </div>
  )
}

function HelplineBtn({ label, number }) {
  return (
    <a
      href={`tel:${number}`}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-white transition-all active:scale-95"
    >
      📞 {label} ({number})
    </a>
  )
}
