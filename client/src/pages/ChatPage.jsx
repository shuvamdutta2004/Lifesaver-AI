import EmergencyChat from '../components/EmergencyChat'
import { useEmergency, EMERGENCY_TYPES } from '../context/EmergencyContext'

export default function ChatPage() {
  const { emergencyType, setEmergencyType, sosActive } = useEmergency()
  const eType = emergencyType ? EMERGENCY_TYPES[emergencyType] : null

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black">🤖 Emergency AI Assistant</h1>
        <p className="text-gray-500 text-sm">Powered by OpenAI gpt-4o-mini — get instant first-aid guidance</p>
      </div>

      {/* Context selector */}
      {!sosActive && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Select emergency context (optional):</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEmergencyType(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                !emergencyType
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'border-white/10 text-gray-500 hover:text-white'
              }`}
            >
              General
            </button>
            {Object.values(EMERGENCY_TYPES).map((type) => (
              <button
                key={type.id}
                onClick={() => setEmergencyType(type.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  emergencyType === type.id
                    ? `${type.bg} ${type.border}`
                    : 'border-white/10 text-gray-500 hover:text-white'
                }`}
                style={emergencyType === type.id ? { color: type.color } : {}}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full height chat */}
      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <EmergencyChat />
      </div>

      {/* Info footer */}
      <p className="text-center text-xs text-gray-600">
        LifeSaver AI uses OpenAI GPT-4o-mini. Responses are for guidance only. Always call emergency services.
      </p>
    </main>
  )
}
