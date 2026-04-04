import { useEffect, useState, useCallback, useRef } from 'react'
import { useEmergency } from '../context/EmergencyContext'

export default function VoiceTrigger() {
  const { triggerSOS, sosActive } = useEmergency()
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      // Auto-restart if SOS is not active
      if (!sosActive) {
        setTimeout(() => {
          try { recognition.start() } catch (err) {}
        }, 1000)
      }
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('')
        .toLowerCase()

      if (transcript.includes('help me') || transcript.includes('emergency') || transcript.includes('save me')) {
        console.info('[VoiceTrigger] 🚨 SOS detected via voice!')
        triggerSOS('women_safety') // Default to general safety for voice triggers
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (err) {
      console.error('[VoiceTrigger] Start error:', err)
    }
  }, [sosActive, triggerSOS])

  useEffect(() => {
    initRecognition()
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [initRecognition])

  if (sosActive) return null

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <div className={`group relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full border transition-all ${isListening ? 'bg-purple-500/25 border-purple-400 shadow-purple-500/60 shadow-xl' : 'bg-white/10 border-white/20 shadow-lg shadow-black/30'}`}>
        <span className="text-3xl md:text-4xl">🎙️</span>
        {isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/50 animate-ping" />
        )}
        
        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-1 bg-black/80 border border-white/10 rounded-lg text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Voice: Say "Help Me"
        </div>
      </div>
    </div>
  )
}
