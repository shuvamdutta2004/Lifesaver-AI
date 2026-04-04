import { useEffect } from 'react'

/**
 * useKeyboardSOS
 * Triggers SOS on keyboard shortcut: Ctrl + Shift + S
 */
export function useKeyboardSOS({ onTrigger, enabled = true }) {
  useEffect(() => {
    if (!enabled) return

    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        onTrigger?.()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, onTrigger])
}
