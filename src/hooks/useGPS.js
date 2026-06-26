import { useState, useEffect } from 'react'
import { calcDistance } from '../api/kakaoMap'

export default function useGPS() {
  const [position, setPosition] = useState(null) // { lat, lng, accuracy }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 정보를 지원하지 않습니다.')
      setLoading(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy })
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  /** 현재 위치에서 대상 좌표까지 거리(m)를 반환합니다. 위치 미확보 시 null. */
  function getDistanceTo(targetLat, targetLng) {
    if (!position) return null
    return calcDistance(position.lat, position.lng, targetLat, targetLng)
  }

  return { position, error, loading, getDistanceTo }
}
