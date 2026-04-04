import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmergency, EMERGENCY_TYPES } from '../context/EmergencyContext'

export default function WomenSafetyOverlay() {
  const { reset } = useEmergency()
  const navigate = useNavigate()

  const [isFakeCalling, setIsFakeCalling] = useState(false)
  const [fakeCallStep, setFakeCallStep] = useState(0)

  const handleFakeCall = () => {
    setIsFakeCalling(true)
    setFakeCallStep(1) // Ringing
    
    // Simulate ringing for 3 seconds, then "answering"
    setTimeout(() => {
      setFakeCallStep(2) // Active call
      const msg = new SpeechSynthesisUtterance("Hey, I'm almost there. I'm at the corner of the street. Where exactly are you?")
      msg.rate = 0.9
      msg.pitch = 1
      window.speechSynthesis.speak(msg)
    }, 3000)
  }

  const handleResolve = () => {
    window.speechSynthesis.cancel()
    reset()
    navigate('/')
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-500 ${isFakeCalling ? 'bg-black' : 'women-safety-bg'}`}>
      <div className="min-h-full w-full flex flex-col items-center justify-start md:justify-center p-6 text-center">
      {isFakeCalling ? (
        <div className="animate-fade-in w-full max-w-sm py-4 md:py-0">
          <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white">👤</div>
          <h2 className="text-2xl font-bold text-white mb-1">{fakeCallStep === 1 ? 'Ringing...' : 'Dad (Mobile)'}</h2>
          <p className="text-safe-green text-sm mb-12">{fakeCallStep === 1 ? 'Calling private number' : '00:04 • Active'}</p>
          
          <div className="grid grid-cols-3 gap-8 mb-16">
            {['Mute', 'Keypad', 'Speaker', 'Add Call', 'Video', 'Contacts'].map(opt => (
              <div key={opt} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-xl">⚪</div>
                <span className="text-[10px] text-gray-400">{opt}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => { setIsFakeCalling(false); window.speechSynthesis.cancel(); }}
            className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto shadow-lg shadow-red-900/40"
          >
            ❌
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center py-4 md:py-0">
          {/* Pulsing icon */}
          <div className="relative mb-6">
            <div className="w-28 h-28 bg-women-pink/20 rounded-full flex items-center justify-center text-6xl">
              🚺
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-women-pink/40 animate-ping" />
          </div>

          <h1 className="text-4xl font-black text-women-pink mb-2">SOS ACTIVE</h1>
          <p className="text-xl font-semibold text-white mb-1">Women Safety Alert</p>
          <p className="text-gray-300 text-sm mb-8 max-w-sm">
            Your location has been broadcast to nearby registered volunteers and authorities.
          </p>

          {/* Action buttons */}
          <div className="flex gap-4 mb-8">
            <button 
              onClick={handleFakeCall}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl flex flex-col items-center gap-1 hover:bg-white/20 transition-all"
            >
              <span className="text-2xl">📞</span>
              <span className="text-[10px] font-bold">FAKE CALL</span>
            </button>
            <button className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl flex flex-col items-center gap-1 opacity-50 cursor-not-allowed">
              <span className="text-2xl">📸</span>
              <span className="text-[10px] font-bold">RECORD VIDEO</span>
            </button>
          </div>

          {/* Status cards */}
          <div className="w-full max-w-sm space-y-3 mb-8">
            {[
              { icon: '📡', label: 'Live location sharing — ACTIVE', ok: true  },
              { icon: '👮', label: 'Nearest Police (1.2km) — alerted', ok: true  },
              { icon: '🙋', label: '3 Volunteers nearby — responding', ok: true  },
              { icon: '🛡️', label: 'Safe route locked in Map', ok: true },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-xs text-left text-gray-300">{item.label}</span>
                <span className="text-safe-green text-xs font-bold">✓</span>
              </div>
            ))}
          </div>

          {/* Helplines */}
          <div className="flex gap-3 mb-6 flex-wrap justify-center">
            <a href="tel:100"  className="px-5 py-3 bg-women-pink rounded-xl font-bold text-sm text-white active:scale-95 transition-all shadow-lg shadow-women-pink/30">📞 Call Police</a>
            <a href="tel:1091" className="px-5 py-3 bg-white/10 border border-women-pink/40 rounded-xl font-bold text-sm text-women-pink active:scale-95 transition-all">📞 Helpline 1091</a>
          </div>

          <button
            onClick={handleResolve}
            className="text-xs text-gray-600 hover:text-gray-400 underline mt-2"
          >
            Mark as safe — cancel alert
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
