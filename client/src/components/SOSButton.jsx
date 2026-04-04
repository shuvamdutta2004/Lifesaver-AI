import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmergency } from '../context/EmergencyContext'
import { useVoiceTrigger } from '../hooks/useVoiceTrigger'
import { useKeyboardSOS } from '../hooks/useKeyboardSOS'
import SOSConfirmModal from './SOSConfirmModal'

export default function SOSButton({ size = 'large' }) {
  const { sosActive, triggerSOS, emergencyType } = useEmergency()
  const [showModal,    setShowModal]    = useState(false)
  const [voiceActive,  setVoiceActive]  = useState(false)
  const navigate = useNavigate()

  const handleSOSTrigger = useCallback(() => {
    if (!sosActive) setShowModal(true)
  }, [sosActive])

  const handleConfirm = useCallback(async (type) => {
    setShowModal(false)
    navigate('/dashboard')
    await triggerSOS(type)
  }, [triggerSOS, navigate])

  // Voice trigger
  const { supported: voiceSupported } = useVoiceTrigger({
    onTrigger: handleSOSTrigger,
    enabled: !sosActive,
  })

  // Keyboard shortcut
  useKeyboardSOS({ onTrigger: handleSOSTrigger, enabled: !sosActive })

  const isLarge = size === 'large'

  return (
    <>
      <div className="flex flex-col items-center gap-4">

        {/* Main SOS button */}
        <button
          onClick={handleSOSTrigger}
          disabled={sosActive}
          aria-label="Trigger SOS Emergency"
          className={`
            relative rounded-full font-black uppercase tracking-widest
            transition-all duration-200 select-none
            ${isLarge ? 'w-44 h-44 text-2xl' : 'w-24 h-24 text-sm'}
            ${sosActive
              ? 'bg-sos-red-dark cursor-default opacity-80'
              : 'bg-sos-red hover:bg-red-500 active:scale-95 cursor-pointer sos-ring'
            }
          `}
        >
          {/* Outer ping rings */}
          {!sosActive && (
            <>
              <span className="absolute inset-0 rounded-full bg-sos-red/30 animate-ping" />
              <span className="absolute inset-[-8px] rounded-full border-2 border-sos-red/20 animate-ping-slow" />
            </>
          )}

          {/* Button content */}
          <span className="relative flex flex-col items-center justify-center gap-1">
            <span className={isLarge ? 'text-5xl' : 'text-2xl'}>🆘</span>
            <span className={`text-white font-black ${isLarge ? 'text-xl' : 'text-xs'}`}>
              {sosActive ? 'ACTIVE' : 'SOS'}
            </span>
          </span>
        </button>

        {/* Sub-triggers row */}
        <div className="flex items-center gap-3 mt-2">
          {/* Voice indicator */}
          {voiceSupported && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                voiceActive
                  ? 'border-sos-red/60 bg-sos-red/10 text-sos-red'
                  : 'border-white/10 text-gray-500'
              }`}
            >
              <span>🎙️</span>
              <span>Say "Help me"</span>
            </div>
          )}

          {/* Keyboard hint */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-gray-500">
            <kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl</kbd>
            <kbd className="bg-white/10 px-1 rounded text-[10px]">⇧</kbd>
            <kbd className="bg-white/10 px-1 rounded text-[10px]">S</kbd>
          </div>
        </div>

        {sosActive && (
          <p className="text-sos-red text-sm font-semibold animate-pulse">
            ● Emergency active — finding helpers…
          </p>
        )}
      </div>

      {/* Confirm modal */}
      {showModal && (
        <SOSConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}
