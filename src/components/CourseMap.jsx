import { useEffect, useRef, useState } from 'react'
import { loadKakaoMap, createFocusMarkerImage } from '../api/kakaoMap'

/**
 * 기준 행사(★) + 번호 마커 + 선택 경로를 보여주는 작은 지도.
 * - spots 의 순서가 곧 마커 번호 (1부터)
 * - selected: 선택된 contentid 배열 (배열 순서 = 경로 순서). 선택된 마커는 주황으로 채워지고 ★ 에서 출발하는 점선으로 이어진다
 * - onSpotClick(contentid): 마커 탭
 */
export default function CourseMap({ event, spots, selected = [], onSpotClick, className = 'h-[210px]' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])        // 마커/오버레이 (spots 바뀔 때 전부 교체)
  const badgesRef = useRef(new Map())   // contentid → 번호 배지 DOM (선택 상태만 갱신)
  const polylineRef = useRef(null)
  const onSpotClickRef = useRef(onSpotClick)
  onSpotClickRef.current = onSpotClick
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  const eventLat = Number(event?.mapy)
  const eventLng = Number(event?.mapx)

  useEffect(() => {
    let cancelled = false
    loadKakaoMap()
      .then(maps => {
        const el = containerRef.current
        if (cancelled || !el) return
        const center = Number.isFinite(eventLat) && Number.isFinite(eventLng)
          ? new maps.LatLng(eventLat, eventLng)
          : new maps.LatLng(37.5665, 126.9780)
        mapRef.current = new maps.Map(el, { center, level: 5 })
        setReady(true)
      })
      .catch(err => setError(err.message))
    return () => { cancelled = true }
    // 지도는 마운트 시 한 번만 만든다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 행사 마커 + 번호 마커 생성, 전체가 보이도록 범위 맞춤
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const maps = window.kakao.maps
    const map = mapRef.current

    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []
    badgesRef.current = new Map()

    const bounds = new maps.LatLngBounds()

    if (Number.isFinite(eventLat) && Number.isFinite(eventLng)) {
      const pos = new maps.LatLng(eventLat, eventLng)
      overlaysRef.current.push(new maps.Marker({
        map, position: pos, title: event?.title, image: createFocusMarkerImage(maps), zIndex: 5,
      }))
      bounds.extend(pos)
    }

    spots.forEach((spot, i) => {
      const lat = Number(spot.mapy), lng = Number(spot.mapx)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
      const pos = new maps.LatLng(lat, lng)
      const badge = document.createElement('button')
      badge.type = 'button'
      badge.textContent = String(i + 1)
      badge.setAttribute('aria-label', `${i + 1}. ${spot.title}`)
      badge.style.cssText = 'width:26px;height:26px;border-radius:9999px;border:2px solid #fb923c;background:#fff;color:#ea580c;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:pointer;transition:background .15s,color .15s;'
      badge.addEventListener('click', e => { e.stopPropagation(); onSpotClickRef.current?.(spot.contentid) })
      badgesRef.current.set(spot.contentid, badge)
      overlaysRef.current.push(new maps.CustomOverlay({ map, position: pos, content: badge, yAnchor: 0.5, zIndex: 3 }))
      bounds.extend(pos)
    })

    if (!bounds.isEmpty()) map.setBounds(bounds, 28, 28, 28, 28)
  }, [ready, spots, event?.title, eventLat, eventLng])

  // 선택 상태 → 배지 색 + 경로 점선
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const maps = window.kakao.maps
    badgesRef.current.forEach((badge, id) => {
      const on = selected.includes(id)
      badge.style.background = on ? '#f97316' : '#fff'
      badge.style.color = on ? '#fff' : '#ea580c'
      badge.style.borderColor = on ? '#fff' : '#fb923c'
    })

    polylineRef.current?.setMap(null)
    polylineRef.current = null
    const path = []
    if (Number.isFinite(eventLat) && Number.isFinite(eventLng)) path.push(new maps.LatLng(eventLat, eventLng))
    selected.forEach(id => {
      const spot = spots.find(s => s.contentid === id)
      if (spot) path.push(new maps.LatLng(Number(spot.mapy), Number(spot.mapx)))
    })
    if (path.length >= 2) {
      polylineRef.current = new maps.Polyline({
        map: mapRef.current, path,
        strokeWeight: 3, strokeColor: '#f97316', strokeOpacity: 0.9, strokeStyle: 'shortdash',
      })
    }
  }, [ready, selected, spots, eventLat, eventLng])

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-100 ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 px-4 text-center">
          지도를 불러올 수 없습니다<br />{error}
        </div>
      )}
    </div>
  )
}
