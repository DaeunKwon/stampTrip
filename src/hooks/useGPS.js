import { useState, useEffect } from 'react'
import { calcDistance } from '../api/kakaoMap'
import { isNativeApp } from '../native/platform'

/**
 * 위치 감시 시작. 네이티브 앱은 Capacitor Geolocation 플러그인(권한 요청 포함),
 * 브라우저는 navigator.geolocation 을 쓴다. 해제 함수를 반환한다.
 */
function startWatch(onPosition, onError) {
  const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }

  if (isNativeApp) {
    let watchId = null
    let stopped = false
    import('@capacitor/geolocation').then(async ({ Geolocation }) => {
      try {
        const { location } = await Geolocation.requestPermissions()
        if (location === 'denied') throw new Error('위치 권한이 거부되었습니다. 설정에서 허용해 주세요.')
        if (stopped) return
        watchId = await Geolocation.watchPosition(options, (pos, err) => {
          if (err) onError(err)
          else if (pos) onPosition(pos)
        })
      } catch (err) {
        onError(err)
      }
    })
    return () => {
      stopped = true
      if (watchId) import('@capacitor/geolocation').then(({ Geolocation }) => Geolocation.clearWatch({ id: watchId }))
    }
  }

  if (!navigator.geolocation) {
    onError(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'))
    return () => {}
  }
  const watchId = navigator.geolocation.watchPosition(onPosition, onError, options)
  return () => navigator.geolocation.clearWatch(watchId)
}

export default function useGPS() {
  const [position, setPosition] = useState(null) // { lat, lng, accuracy }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return startWatch(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy })
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
  }, [])

  /** 현재 위치에서 대상 좌표까지 거리(m)를 반환합니다. 위치 미확보 시 null. */
  function getDistanceTo(targetLat, targetLng) {
    if (!position) return null
    return calcDistance(position.lat, position.lng, targetLat, targetLng)
  }

  return { position, error, loading, getDistanceTo }
}
