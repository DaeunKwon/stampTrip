import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import useGPS from '../hooks/useGPS'
import useStamp from '../hooks/useStamp'
import { loadKakaoMap, calcDistance, createSpotMarkerImage, createLocationMarkerImage, createFocusMarkerImage } from '../api/kakaoMap'
import { getLocationBasedList } from '../api/tourApi'
import StampCeremony from '../components/StampCeremony'

export const STAMP_RADIUS = 3000 // meters (테스트용 임시 확대 — 원래 200m)
const RECENTER_THRESHOLD = 50 // meters — 지도 중심이 내 위치에서 이만큼 벗어나면 "내 위치로 이동" 버튼 표시

export default function Map() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  // 주변 코스 스팟 리스트에서 명소를 클릭해 들어온 경우 그 좌표를 중심으로 지도를 연다
  const focusSpot = useLocation().state?.focusSpot ?? null

  const [spots, setSpots] = useState([])
  // 명소를 선택해 들어온 경우 진입 즉시 그 명소를 선택 상태로 두어 하단 정보 카드를 띄운다
  const [selectedSpot, setSelectedSpot] = useState(focusSpot)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [mapCenter, setMapCenter] = useState(null)
  const [showFocusChip, setShowFocusChip] = useState(Boolean(focusSpot))
  // 방문 인증 도장 연출 상태: { title, count } (연출 중이 아니면 null)
  const [ceremony, setCeremony] = useState(null)
  // 닫기 버튼을 한 번이라도 누르면 true — 이후 이 지도 탭 방문 동안 자동 팝업(autoSpot)을 다시 띄우지 않는다
  const [autoDismissed, setAutoDismissed] = useState(false)
  const [shaking, setShaking] = useState(false)

  const hasCenteredRef = useRef(false)
  // 지도 중심이 확정(GPS 수신/오류 확정/명소 좌표)된 뒤의 최초 관광지 조회를 정확히 한 번만 실행하기 위한 가드
  const initialFetchDoneRef = useRef(false)

  const { position, loading: gpsLoading, error: gpsError } = useGPS()
  const { stamps, stamp, isStamped } = useStamp()

  // 카카오맵 초기화
  useEffect(() => {
    loadKakaoMap()
      .then(maps => {
        const el = mapContainerRef.current
        if (!el) return
        const center = focusSpot
          ? new maps.LatLng(Number(focusSpot.mapy), Number(focusSpot.mapx))
          : new maps.LatLng(37.5665, 126.9780)
        mapRef.current = new maps.Map(el, { center, level: 5 })
        // 명소 좌표로 열린 경우 GPS 수신 후에도 내 위치로 재센터링하지 않는다
        if (focusSpot) hasCenteredRef.current = true
        setMapReady(true)
      })
      .catch(err => setMapError(err.message))
    // focusSpot은 마운트 시점의 라우터 상태로 고정된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 「○○ 위치로 이동했습니다」 안내 칩은 2.5초 후 사라진다
  useEffect(() => {
    if (!focusSpot) return
    const timer = setTimeout(() => setShowFocusChip(false), 2500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 최초 GPS 위치를 받으면 지도 중심을 한 번만 옮긴다 (이후엔 사용자가 옮긴 지도 위치를 유지)
  useEffect(() => {
    if (!mapReady || !position || hasCenteredRef.current || !mapRef.current) return
    const maps = window.kakao.maps
    mapRef.current.setCenter(new maps.LatLng(position.lat, position.lng))
    hasCenteredRef.current = true
  }, [mapReady, position])

  // 현재 지도 중심 기준으로 뷰포트 범위의 관광지를 조회한다.
  // idle 리스너뿐 아니라 "지도 중심이 확정된 시점" effect에서도 직접 호출하므로,
  // 카카오맵 이벤트 트리거에 기대지 않고 항상 같은 함수를 그대로 실행한다.
  const fetchByViewport = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const bounds = map.getBounds()
    const center = map.getCenter()
    const ne = bounds.getNorthEast()
    const radius = Math.min(
      Math.round(calcDistance(center.getLat(), center.getLng(), ne.getLat(), ne.getLng())),
      20000,
    )
    setMapCenter({ lat: center.getLat(), lng: center.getLng() })
    getLocationBasedList({ mapX: center.getLng(), mapY: center.getLat(), radius })
      // 음식(lclsSystm1 'FD') 분류는 지도에 노출하지 않는다
      .then(items => setSpots(items.filter(item => item.lclsSystm1 !== 'FD')))
      .catch(() => {})
  }, [])

  // 지도 화면 범위(뷰포트)가 바뀔 때마다(드래그/줌 후 idle) 그 범위의 관광지를 재조회
  // (최초 진입 시 즉시 조회하지 않는다 — 아직 지도 중심이 내 위치로 확정되기 전일 수 있기 때문. 아래 별도 effect가 담당)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const maps = window.kakao.maps
    const map = mapRef.current
    maps.event.addListener(map, 'idle', fetchByViewport)
    return () => maps.event.removeListener(map, 'idle', fetchByViewport)
  }, [mapReady, fetchByViewport])

  // 지도 중심이 확정된 시점(GPS 위치 수신, GPS 오류 확정, 또는 명소 좌표로 진입)에 최초 1회 관광지를 조회한다.
  // 카카오맵 SDK가 이미 캐시돼 재진입 시 mapReady가 GPS 위치보다 먼저 true가 되더라도,
  // 이 effect가 실제 중심이 정해질 때까지 기다렸다가 fetchByViewport를 직접 호출하므로
  // 잘못된 기본 중심(서울시청)으로 조회하는 일이 없다.
  useEffect(() => {
    if (!mapReady || !mapRef.current || initialFetchDoneRef.current) return
    if (!position && !gpsError && !focusSpot) return
    initialFetchDoneRef.current = true
    fetchByViewport()
  }, [mapReady, position, gpsError, focusSpot, fetchByViewport])

  // 지도 마커 갱신
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const maps = window.kakao.maps

    // 기존 마커 제거
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const map = mapRef.current

    // 내 위치 (파란 점, 관광지 마커와 구분)
    if (position) {
      const myMarker = new maps.Marker({
        map,
        position: new maps.LatLng(position.lat, position.lng),
        title: '내 위치',
        image: createLocationMarkerImage(maps),
        zIndex: 10,
      })
      markersRef.current.push(myMarker)
    }

    // 관광지 마커 — 화면 범위 내 관광지는 모두 표시하고, 내 위치 반경 내: 진하게 / 밖: 옅게.
    // 활성 여부와 무관하게 클릭하면 정보를 볼 수 있다.
    // 주변 코스 스팟에서 선택해 들어온 명소는 큰 전용 마커 + 이름 라벨로 강조한다.
    const spotImage = createSpotMarkerImage(maps)
    const focusImage = focusSpot ? createFocusMarkerImage(maps) : null
    spots.forEach(spot => {
      const isFocus = focusSpot?.contentid === spot.contentid
      const active = position
        ? calcDistance(position.lat, position.lng, Number(spot.mapy), Number(spot.mapx)) <= STAMP_RADIUS
        : false

      const pos = new maps.LatLng(Number(spot.mapy), Number(spot.mapx))
      const marker = new maps.Marker({
        map,
        position: pos,
        title: spot.title,
        image: isFocus ? focusImage : spotImage,
        opacity: isFocus || active ? 1 : 0.4,
        zIndex: isFocus ? 5 : 0,
      })
      maps.event.addListener(marker, 'click', () => setSelectedSpot(spot))
      markersRef.current.push(marker)

      if (isFocus) {
        const safeTitle = String(spot.title).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        const label = new maps.CustomOverlay({
          map,
          position: pos,
          yAnchor: 1,
          zIndex: 5,
          content: `<div style="transform:translateY(-56px);background:#fff;border:1px solid #f3f4f6;border-radius:9999px;padding:5px 11px;font-size:12px;font-weight:700;color:#1f2937;box-shadow:0 2px 6px rgba(0,0,0,.15);white-space:nowrap;">${safeTitle}</div>`,
        })
        markersRef.current.push(label)
      }
    })
  }, [mapReady, position, spots, focusSpot])

  // 선택된 관광지가 없으면 반경 내 관광지를 자동으로 보여준다 (걸어서 진입했을 때). 단, 닫기 버튼을 누른 적이 있으면 다시 띄우지 않는다.
  const autoSpot = !selectedSpot && !autoDismissed && position
    ? spots.find(spot =>
        calcDistance(position.lat, position.lng, Number(spot.mapy), Number(spot.mapx)) <= STAMP_RADIUS,
      ) ?? null
    : null
  const displaySpot = selectedSpot ?? autoSpot
  const displaySpotDistance = displaySpot && position
    ? calcDistance(position.lat, position.lng, Number(displaySpot.mapy), Number(displaySpot.mapx))
    : null
  const isDisplaySpotActive = displaySpotDistance !== null && displaySpotDistance <= STAMP_RADIUS

  const handleClosePopup = useCallback(() => {
    setAutoDismissed(true)
    setSelectedSpot(null)
  }, [])

  const handleStamp = useCallback(() => {
    if (!displaySpot || !isDisplaySpotActive) return
    stamp({
      contentId: displaySpot.contentid,
      title: displaySpot.title,
      addr1: displaySpot.addr1,
      firstimage: displaySpot.firstimage ?? '',
    })
    setCeremony({ title: displaySpot.title, count: stamps.length + 1 })
  }, [displaySpot, isDisplaySpotActive, stamp, stamps.length])

  // 인장 착지 순간 지도 화면을 미세하게 흔든다
  const handleStampImpact = useCallback(() => {
    setShaking(true)
    setTimeout(() => setShaking(false), 300)
  }, [])

  // 지도 중심이 내 위치에서 일정 거리 이상 벗어났는지
  const showRecenter = position && mapCenter
    ? calcDistance(mapCenter.lat, mapCenter.lng, position.lat, position.lng) > RECENTER_THRESHOLD
    : false

  const handleRecenter = useCallback(() => {
    if (!position || !mapRef.current) return
    const maps = window.kakao.maps
    mapRef.current.panTo(new maps.LatLng(position.lat, position.lng))
  }, [position])

  return (
    <div className={`relative h-[calc(100vh-4rem)] ${shaking ? 'stamp-shake' : ''}`}>
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

      {/* 주변 코스 스팟에서 넘어온 경우 이동 안내 칩 (2.5초 후 페이드아웃) */}
      {focusSpot && (
        <div
          className={`absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur rounded-full shadow-lg px-4 py-2 text-xs text-gray-600 whitespace-nowrap pointer-events-none transition-opacity duration-500 ${
            showFocusChip ? 'opacity-100' : 'opacity-0'
          }`}
        >
          📍 <span className="font-bold text-primary-600">{focusSpot.title}</span> 위치로 이동했습니다
        </div>
      )}

      {/* 내 위치로 이동 버튼 (지도 중심이 내 위치에서 벗어났을 때만 표시) */}
      {showRecenter && (
        <button
          onClick={handleRecenter}
          aria-label="내 위치로 이동"
          className="absolute top-24 right-3 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-lg active:scale-95 transition-transform"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <circle cx="12" cy="12" r="7" fill="none" stroke="#f97316" strokeWidth="2" />
            <circle cx="12" cy="12" r="2.6" fill="#f97316" />
            <line x1="12" y1="0.5" x2="12" y2="4" stroke="#f97316" strokeWidth="2" />
            <line x1="12" y1="20" x2="12" y2="23.5" stroke="#f97316" strokeWidth="2" />
            <line x1="0.5" y1="12" x2="4" y2="12" stroke="#f97316" strokeWidth="2" />
            <line x1="20" y1="12" x2="23.5" y2="12" stroke="#f97316" strokeWidth="2" />
          </svg>
        </button>
      )}

      {/* 스탬프 패널 */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        {displaySpot ? (
          <div className="relative bg-white rounded-2xl shadow-xl px-4 py-4">
            <button
              onClick={handleClosePopup}
              aria-label="팝업 닫기"
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
            {isDisplaySpotActive ? (
              <>
                <p className="text-xs text-primary-500 font-medium mb-0.5">📍 근처 관광지 발견!</p>
                <p className="font-bold text-gray-800 text-base mb-3 pr-8">{displaySpot.title}</p>
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
                <p className="font-bold text-gray-800 text-base mb-1 pr-8">{displaySpot.title}</p>
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

      {/* 방문 인증 도장 연출 */}
      {ceremony && (
        <StampCeremony
          title={ceremony.title}
          count={ceremony.count}
          onImpact={handleStampImpact}
          onDone={() => setCeremony(null)}
        />
      )}
    </div>
  )
}
