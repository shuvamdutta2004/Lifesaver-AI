import { useEffect, useRef } from 'react'

/**
 * useVoiceTrigger
 * Listens for spoken trigger phrases and calls onTrigger() when matched.
 *
 * Trigger phrases (case-insensitive): "help me", "sos", "emergency", "bachao"
 *
 * Returns { supported: boolean }
 *
 * NOTE: SpeechRecognition is NOT supported on Firefox and some mobile browsers.
 *       The hook gracefully does nothing when unsupported.
 */
export function useVoiceTrigger({ onTrigger, enabled = true }) {
  const recognitionRef = useRef(null)

  const TRIGGER_PHRASES = ['help me', 'sos', 'emergency', 'bachao', 'help']

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition || !enabled) return

    const recognition = new SpeechRecognition()
    recognition.continuous  = true
    recognition.lang        = 'en-IN'
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim()

      console.info('[Voice] Heard:', transcript)

      const matched = TRIGGER_PHRASES.some((phrase) =>
        transcript.includes(phrase)
      )

      if (matched) {
        recognition.stop()
        onTrigger?.()
      }
    }

    recognition.onerror = (event) => {
      // Silently restart on network/no-speech errors
      if (['network', 'no-speech', 'aborted'].includes(event.error)) {
        try { recognition.start() } catch {}
      }
    }

    recognition.onend = () => {
      // Auto-restart to keep listening
      if (enabled) {
        try { recognition.start() } catch {}
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      console.warn('[Voice] Could not start recognition:', err)
    }

    return () => {
      try { recognition.stop() } catch {}
    }
  }, [enabled, onTrigger])

  return {
    supported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  }
}
