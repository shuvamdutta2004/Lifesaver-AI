import { EMERGENCY_TYPES } from '../context/EmergencyContext'

/**
 * SOSConfirmModal
 * Shown immediately after SOS tap.
 * User selects emergency type, then confirms.
 */
export default function SOSConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-card border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-sos-red/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🚨</span>
          </div>
          <h2 className="text-xl font-bold">What's your emergency?</h2>
          <p className="text-gray-400 text-sm mt-1">Select type to get the right help</p>
        </div>

        {/* Emergency type grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Object.values(EMERGENCY_TYPES).map((type) => (
            <button
              key={type.id}
              onClick={() => onConfirm(type.id)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-2xl border
                ${type.bg} ${type.border}
                hover:brightness-125 active:scale-95 transition-all cursor-pointer
              `}
            >
              <span className="text-3xl">{type.icon}</span>
              <span className="text-sm font-semibold">{type.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
        >
          Cancel — False Alarm
        </button>
      </div>
    </div>
  )
}
