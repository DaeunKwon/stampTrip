import { useState, useEffect } from 'react'
import { getTrendingSpots } from '../api/trending'

const HOME_COUNT = 5

function ImageFallback() {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-gray-300 fill-none" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 16 5-5 4 4 3-3 6 6" />
      </svg>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
      {Array.from({ length: HOME_COUNT }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-3">
          <div className="w-5 h-4 rounded bg-gray-100 animate-pulse mt-1" />
          <div className="w-14 h-14 rounded-xl bg-gray-100 animate-pulse" />
          <div className="flex-1 flex flex-col gap-2 pt-1">
            <div className="h-3.5 w-24 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 홈 "요즘 뜨는 명소" — 순위 · 사진 · 이름 · 지역 · 한 줄 설명 (B안)
 * 항목을 누르면 onSelect(contentId) 로 행사 카드와 같은 상세 팝업을 연다.
 * 데이터가 없으면(배치 미실행·Supabase 미설정) 섹션 자체를 그리지 않는다.
 */
export default function TrendingSection({ onSelect }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrendingSpots()
      .then(list => setItems(list.slice(0, HOME_COUNT)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && items.length === 0) return null

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-base font-bold text-gray-800">요즘 뜨는 명소</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">한국관광공사 방문 예보 기준 · 오늘 갱신</p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
          KT 통신 데이터로 관광지별 방문자 수를 예측한 자료예요. 평소보다 사람이 늘 것으로 예보된 곳을 골랐어요.
        </p>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {items.map((spot, i) => (
            <div
              key={spot.contentId ?? spot.name}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(spot.contentId)}
              onKeyDown={e => e.key === 'Enter' && onSelect?.(spot.contentId)}
              className="flex items-start gap-3 px-3 py-3 cursor-pointer active:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <span
                className={`w-5 shrink-0 text-center text-[15px] font-extrabold tabular-nums mt-1 ${
                  i < 3 ? 'text-primary-500' : 'text-gray-400'
                }`}
              >
                {i + 1}
              </span>
              <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden">
                {spot.firstimage ? (
                  <img src={spot.firstimage} alt={spot.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <ImageFallback />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <h3 className="text-sm font-bold text-gray-900 truncate">{spot.name}</h3>
                <p className="text-[11.5px] text-gray-500">{spot.areaNm} {spot.signguNm}</p>
                {spot.description && (
                  <p className="text-[11.5px] text-gray-700 leading-snug line-clamp-2">{spot.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
