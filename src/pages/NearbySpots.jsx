import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getLocationBasedList } from '../api/tourApi'

// locationBasedList2의 dist(m) → "980m" / "1.2km"
function formatDist(dist) {
  const n = Number(dist)
  if (!Number.isFinite(n)) return ''
  return n >= 1000 ? `${(n / 1000).toFixed(1)}km` : `${Math.round(n)}m`
}

function SkeletonRow() {
  return <div className="bg-gray-100 rounded-2xl h-16 animate-pulse" />
}

export default function NearbySpots() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { contentId, title, mapx, mapy } = state ?? {}
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)

  // URL 직접 진입 등 기준 행사 정보가 없으면 코스 탭으로 돌려보낸다
  useEffect(() => {
    if (!mapx || !mapy) navigate('/course', { replace: true })
  }, [mapx, mapy, navigate])

  useEffect(() => {
    if (!mapx || !mapy) return
    setLoading(true)
    getLocationBasedList({ mapX: mapx, mapY: mapy, radius: 1000 })
      .then(items => {
        const filtered = items
          // 지도 탭과 동일하게 음식(FD) 분류 제외 + 기준이 된 행사 자신 제외
          .filter(item => item.lclsSystm1 !== 'FD' && item.contentid !== contentId)
          .sort((a, b) => Number(a.dist ?? 0) - Number(b.dist ?? 0))
        setSpots(filtered)
      })
      .catch(() => setSpots([]))
      .finally(() => setLoading(false))
  }, [contentId, mapx, mapy])

  return (
    <div className="pt-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4">
        <button onClick={() => navigate(-1)} aria-label="뒤로" className="text-gray-400 text-xl p-1">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">주변 코스 스팟</h1>
          <p className="text-xs text-gray-500 mt-0.5">{title} 주변 명소 추천</p>
        </div>
      </div>

      {/* 기준 행사 안내 */}
      <div className="mx-4 mt-3.5 mb-4 px-3.5 py-2.5 bg-primary-50 border border-primary-100 rounded-xl text-xs text-primary-700 leading-relaxed">
        📍 <span className="font-bold text-primary-600">{title}</span>에서{' '}
        <span className="font-bold text-primary-600">반경 1km 이내</span>의 관광 명소입니다.
        함께 둘러보며 코스를 완성해 보세요.
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : spots.length > 0 ? (
          <div className="flex flex-col gap-2.5 pb-4">
            {spots.map((spot, i) => (
              <div
                key={spot.contentid ?? i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-800 mb-0.5">{spot.title}</h3>
                  <p className="text-xs text-gray-500 truncate">{spot.addr1 || '주소 정보 없음'}</p>
                </div>
                {formatDist(spot.dist) && (
                  <span className="flex-shrink-0 text-[11px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                    {formatDist(spot.dist)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🧭</p>
            <p className="text-gray-500 font-medium">주변 1km 내 명소가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
