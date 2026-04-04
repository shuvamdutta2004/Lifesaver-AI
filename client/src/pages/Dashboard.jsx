import { useNavigate } from 'react-router-dom'
import { useEmergency } from '../context/EmergencyContext'
import MapView        from '../components/MapView'
import AlertBanner    from '../components/AlertBanner'
import AIChatPanel    from '../components/AIChatPanel'
import NearbyHelpers  from '../components/NearbyHelpers'
import SOSButton      from '../components/SOSButton'

export default function Dashboard() {
  const { sosActive, locationError, resolveEmergency, isResolved } = useEmergency()
  const navigate = useNavigate()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Emergency Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time response & guidance</p>
        </div>
        {sosActive && !isResolved && (
          <button
            onClick={async () => { await resolveEmergency(); navigate('/') }}
            className="px-4 py-2 bg-safe-green/15 border border-safe-green/40 text-safe-green text-sm font-bold rounded-xl hover:bg-safe-green/25 transition-all active:scale-95"
          >
            ✓ Mark Resolved
          </button>
        )}
      </div>

      {/* Location error toast */}
      {locationError && (
        <div className="px-4 py-3 bg-warning-amber/10 border border-warning-amber/30 rounded-xl text-warning-amber text-sm">
          ⚠️ {locationError}
        </div>
      )}

      {/* Resolved banner */}
      {isResolved && (
        <div className="px-4 py-4 bg-safe-green/10 border border-safe-green/30 rounded-xl text-safe-green text-sm font-semibold animate-fade-in text-center">
          ✅ Emergency resolved. Stay safe!
        </div>
      )}

      {/* Alert banner (shown only when SOS active) */}
      {sosActive && <AlertBanner />}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">

        {/* Left: Map */}
        <div className="space-y-4">
          <div className="h-[420px] sm:h-[480px]">
            <MapView />
          </div>
          {/* Compact AI chat on larger screens below map */}
          <div className="block lg:hidden">
            <AIChatPanel compact />
          </div>
          <NearbyHelpers />
        </div>

        {/* Right: AI chat + SOS button */}
        <div className="space-y-4">
          {!sosActive && (
            <div className="glass-card p-6 flex flex-col items-center gap-4">
              <p className="text-sm text-gray-400">Trigger emergency SOS</p>
              <SOSButton size="small" />
            </div>
          )}
          <div className="hidden lg:block h-[480px]">
            <AIChatPanel />
          </div>
        </div>
      </div>
    </main>
  )
}
