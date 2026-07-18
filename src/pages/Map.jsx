import { useEffect, useRef, useState, useCallback } from 'react'
import useGPS from '../hooks/useGPS'
import useStamp from '../hooks/useStamp'
import { loadKakaoMap, calcDistance, createSpotMarkerImage, createLocationMarkerImage } from '../api/kakaoMap'
import { getLocationBasedList } from '../api/tourApi'

export const STAMP_RADIUS = 100 // meters

export default function Map() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  const [spots, setSpots] = useState([])
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(null)

  const { position, loading: gpsLoading, error: gpsError } = useGPS()
  const { stamps, stamp, isStamped } = useStamp()

  // 카카오맵 초기화
  useEffect(() => {
    loadKakaoMap()
      .then(maps => {
        const el = mapContainerRef.current
        if (!el) return
        const center = new maps.LatLng(37.5665, 126.9780)
        mapRef.current = new maps.Map(el, { center, level: 5 })
        setMapReady(true)
      })
      .catch(err => setMapError(err.message))
  }, [])

  // GPS 위치 기반 주변 관광지 조회
  useEffect(() => {
    if (!position) return
    getLocationBasedList({
      mapX: position.lng,
      mapY: position.lat,
      radius: 2000,
    })
      .then(items => setSpots(items))
      .catch(() => {})
  }, [position?.lat, position?.lng])

  // 지도 마커 갱신
  useEffect(() => {
    if (!mapReady || !position || !mapRef.current) return
    const maps = window.kakao.maps

    // 기존 마커 제거
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const map = mapRef.current
    const center = new maps.LatLng(position.lat, position.lng)
    map.setCenter(center)

    // 내 위치 (파란 점, 관광지 마커와 구분)
    const myMarker = new maps.Marker({
      map,
      position: center,
      title: '내 위치',
      image: createLocationMarkerImage(maps),
      zIndex: 10,
    })
    markersRef.current.push(myMarker)

    // 관광지 마커 — 반경 내: 진하게 / 밖: 옅게. 활성 여부와 무관하게 클릭하면 정보를 볼 수 있다.
    const spotImage = createSpotMarkerImage(maps)
    spots.forEach(spot => {
      const dist = calcDistance(position.lat, position.lng, Number(spot.mapy), Number(spot.mapx))
      const active = dist <= STAMP_RADIUS

      const pos = new maps.LatLng(Number(spot.mapy), Number(spot.mapx))
      const marker = new maps.Marker({
        map,
        position: pos,
        title: spot.title,
        image: spotImage,
        opacity: active ? 1 : 0.4,
      })
      maps.event.addListener(marker, 'click', () => setSelectedSpot(spot))
      markersRef.current.push(marker)
    })
  }, [mapReady, position, spots])

  // 선택된 관광지가 없으면 반경 내 관광지를 자동으로 보여준다 (걸어서 진입했을 때)
  const autoSpot = !selectedSpot && position
    ? spots.find(spot => calcDistance(position.lat, position.lng, Number(spot.mapy), Number(spot.mapx)) <= STAMP_RADIUS) ?? null
    : null
  const displaySpot = selectedSpot ?? autoSpot
  const displaySpotDistance = displaySpot && position
    ? calcDistance(position.lat, position.lng, Number(displaySpot.mapy), Number(displaySpot.mapx))
    : null
  const isDisplaySpotActive = displaySpotDistance !== null && displaySpotDistance <= STAMP_RADIUS

  const handleStamp = useCallback(() => {
    if (!displaySpot || !isDisplaySpotActive) return
    stamp({
      contentId: displaySpot.contentid,
      title: displaySpot.title,
      addr1: displaySpot.addr1,
      firstimage: displaySpot.firstimage ?? '',
    })
  }, [displaySpot, isDisplaySpotActive, stamp])

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* 지도 컨테이너 */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* 오류 오버레이 */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center px-6">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="font-bold text-gray-700 mb-1">지도를 불러올 수 없습니다</p>
            <p className="text-xs text-gray-500">{mapError}</p>
            <p className="text-xs text-gray-400 mt-2">.env 파일에 VITE_KAKAO_MAP_KEY를 입력하세요</p>
          </div>
        </div>
      )}

      {/* 상단 상태바 */}
      <div className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur rounded-2xl shadow-lg px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {gpsLoading
              ? '📡 위치 확인 중...'
              : gpsError
                ? `⚠️ ${gpsError}`
                : `📍 ${position?.lat.toFixed(4)}, ${position?.lng.toFixed(4)}`
            }
          </p>
          <span className="text-xs text-primary-500 font-medium">🗺️ {stamps.length}개 수집</span>
        </div>
        {!gpsLoading && !gpsError && (
          <p className="text-xs text-gray-400 mt-0.5">반경 {STAMP_RADIUS}m 내 관광지 인증 가능</p>
        )}
      </div>

      {/* 스탬프 패널 */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        {displaySpot ? (
          <div className="bg-white rounded-2xl shadow-xl px-4 py-4">
            {isDisplaySpotActive ? (
              <>
                <p className="text-xs text-primary-500 font-medium mb-0.5">📍 근처 관광지 발견!</p>
                <p className="font-bold text-gray-800 text-base mb-3">{displaySpot.title}</p>
                {isStamped(displaySpot.contentid) ? (
                  <div className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl text-sm text-center border border-gray-100">
                    ✓ 이미 인증된 장소입니다
                  </div>
                ) : (
                  <button
                    onClick={handleStamp}
                    className="w-full py-3.5 bg-primary-500 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-200 active:scale-95 transition-transform"
                  >
                    🗺️ 스탬프 찍기
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-gray-400 font-medium mb-0.5">📍 선택한 관광지</p>
                <p className="font-bold text-gray-800 text-base mb-1">{displaySpot.title}</p>
                <p className="text-xs text-gray-400 mb-3">
                  현재 위치에서 {Math.round(displaySpotDistance)}m · 반경 {STAMP_RADIUS}m 밖
                </p>
                <div className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl text-sm text-center border border-gray-100">
                  🔒 가까이 가면 인증할 수 있어요
                </div>
              </>
            )}
          </div>
        ) : position && (
          <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-3 text-center shadow">
            <p className="text-xs text-gray-500">관광지에 가까이 가면 스탬프 버튼이 나타납니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
