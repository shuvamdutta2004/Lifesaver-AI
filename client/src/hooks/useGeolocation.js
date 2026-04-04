import { useState, useEffect, useCallback } from 'react'

/**
 * useGeolocation
 * Provides current user location with watch support.
 *
 * Returns { location, error, loading, refresh }
 * location = { lat: number, lng: number } | null
 */
export function useGeolocation(watch = false) {
  const [location, setLocation] = useState(null)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  // Default fallback city (Chennai) used for demo when permission denied
  const DEMO_LOCATION = { lat: 13.0827, lng: 80.2707 }

  const handleSuccess = (pos) => {
    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    setError(null)
    setLoading(false)
  }

  const handleError = () => {
    setLocation(DEMO_LOCATION)
    setError('Using default location (Chennai) — location permission denied')
    setLoading(false)
  }

  const refresh = useCallback(() => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
    })
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(DEMO_LOCATION)
      setError('Geolocation not supported by this browser')
      setLoading(false)
      return
    }

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 8000,
      })
      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 8000,
      })
    }
  }, [watch])

  return { location, error, loading, refresh }
}
