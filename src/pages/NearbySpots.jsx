import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getLocationBasedList } from '../api/tourApi'
import useCourse from '../hooks/useCourse'
import { useToast } from '../components/Toast'
import CourseMap from '../components/CourseMap'
import SubHeader from '../components/SubHeader'
import CourseSheet from '../components/CourseSheet'

// locationBasedList2의 dist(m) → "980m" / "1.2km"
export function formatDist(dist) {
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
  const showToast = useToast()
  const { addCourse } = useCourse()
  const { contentId, title, mapx, mapy } = state ?? {}
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  // 선택한 명소 contentid — 배열 순서가 곧 코스 순서
  const [selected, setSelected] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const event = useMemo(() => ({ contentId, title, mapx, mapy }), [contentId, title, mapx, mapy])

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

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedSpots = selected.map(id => spots.find(s => s.contentid === id)).filter(Boolean)

  async function handleSave({ name, order }) {
    if (saving) return
    setSaving(true)
    try {
      await addCourse({
        name,
        event,
        spots: order.map(s => ({
          contentid: s.contentid,
          title: s.title,
          addr1: s.addr1 ?? '',
          firstimage: s.firstimage ?? '',
          mapx: s.mapx,
          mapy: s.mapy,
        })),
      })
      showToast('코스를 저장했어요')
      navigate('/my/courses', { replace: true })
    } catch {
      showToast('저장에 실패했어요. 다시 시도해 주세요')
      setSaving(false)
    }
  }

  return (
    <div className="pt-6 pb-24">
      <SubHeader title="주변 코스 스팟" subtitle={`${title} 주변 명소 추천`} />

      {/* 기준 행사 안내 */}
      <div className="mx-4 mt-3.5 px-3.5 py-2.5 bg-primary-50 border border-primary-100 rounded-xl text-xs text-primary-700 leading-relaxed">
        📍 <span className="font-bold text-primary-600">{title}</span>에서{' '}
        <span className="font-bold text-primary-600">반경 1km 이내</span>의 관광 명소입니다.
        <br />
        ✅ 가고 싶은 곳을 체크해서 나만의 코스를 만들어 보세요.
      </div>

      {/* 지도: ★ 행사 + 번호 마커, 선택하면 경로가 그려진다 */}
      {!loading && spots.length > 0 && (
        <div className="mx-4 mt-3.5">
          <CourseMap event={event} spots={spots} selected={selected} onSpotClick={toggle} />
          <p className="mt-1.5 text-[10.5px] text-gray-400 text-right">★ 행사 위치 · 숫자는 아래 목록 순번</p>
        </div>
      )}

      <div className="px-4 mt-4">
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : spots.length > 0 ? (
          <>
            <div className="flex items-baseline justify-between mb-2.5">
              <h2 className="text-sm font-bold text-gray-800">주변 명소 {spots.length}곳</h2>
              <span className="text-[11px] text-gray-400">가까운 순</span>
            </div>
            <div className="flex flex-col gap-3">
              {spots.map((spot, i) => {
                const on = selected.includes(spot.contentid)
                return (
                  <div key={spot.contentid ?? i} className="flex gap-3">
                    <div className="flex flex-col items-center w-6 flex-shrink-0">
                      <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                        on ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-primary-400 text-primary-600'
                      }`}>
                        {i + 1}
                      </span>
                      {i < spots.length - 1 && <span className="flex-1 w-0.5 bg-primary-100 mt-1" />}
                    </div>
                    <div
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      onClick={() => toggle(spot.contentid)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(spot.contentid) } }}
                      className={`flex-1 min-w-0 rounded-2xl border shadow-sm pl-4 pr-3.5 py-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-[transform,border-color,background-color] select-none ${
                        on ? 'bg-primary-50/60 border-primary-300' : 'bg-white border-gray-100'
                      }`}
                    >
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center overflow-hidden">
                        {spot.firstimage ? (
                          <img src={spot.firstimage} alt={spot.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-lg">📍</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 mb-0.5">{spot.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{spot.addr1 || '주소 정보 없음'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {formatDist(spot.dist) && (
                          <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">
                            {formatDist(spot.dist)}
                          </span>
                        )}
                        <span className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-[12px] font-extrabold transition-colors ${
                          on ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-gray-300 text-transparent'
                        }`}>
                          ✓
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🧭</p>
            <p className="text-gray-500 font-medium">주변 1km 내 명소가 없습니다</p>
          </div>
        )}
      </div>

      {/* 하단 고정 바 (탭바 바로 위) */}
      {!loading && spots.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-4 py-3 bg-gray-50/90 backdrop-blur border-t border-gray-200 flex items-center gap-3">
          <div className="flex-1 min-w-0 text-[13px] text-gray-700">
            <span className="font-extrabold text-primary-600">{selected.length}곳</span> 선택됨
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            disabled={selected.length === 0}
            className="flex-shrink-0 px-5 py-3 rounded-full bg-primary-500 text-white text-sm font-bold shadow-md shadow-primary-200 active:scale-95 transition-transform disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            코스 만들기
          </button>
        </div>
      )}

      {sheetOpen && (
        <CourseSheet
          event={event}
          spots={selectedSpots}
          saving={saving}
          onClose={() => setSheetOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
