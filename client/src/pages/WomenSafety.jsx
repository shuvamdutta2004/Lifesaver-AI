import { useEmergency } from '../context/EmergencyContext'
import WomenSafetyOverlay from '../components/WomenSafetyOverlay'

export default function WomenSafety() {
  const { triggerSOS, sosActive, emergencyType } = useEmergency()

  const isWomenSafetyActive = sosActive && emergencyType === 'women_safety'

  return (
    <>
      {isWomenSafetyActive
        ? <WomenSafetyOverlay />
        : (
          <div className="flex items-center justify-center min-h-[70vh] px-4">
            <div className="text-center space-y-5 max-w-md">
              <button
                type="button"
                onClick={() => triggerSOS('women_safety')}
                className="mx-auto w-20 h-20 rounded-full bg-women-pink/20 border-2 border-women-pink hover:bg-women-pink/30 transition-all duration-200 flex items-center justify-center text-5xl hover:scale-110 active:scale-95"
                aria-label="Activate Women Safety SOS"
              >
                🚺
              </button>

              <h2 className="text-2xl font-bold text-white">Women Safety</h2>
              <p className="text-gray-300">Tap the girl icon to activate Women Safety SOS</p>

              {sosActive && emergencyType && emergencyType !== 'women_safety' && (
                <p className="text-sm text-women-pink bg-women-pink/10 border border-women-pink/40 rounded-lg px-3 py-2">
                  Another SOS is active. Pressing the icon will switch to Women Safety SOS.
                </p>
              )}
            </div>
          </div>
        )
      }
    </>
  )
}
