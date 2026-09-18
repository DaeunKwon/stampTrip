import { useState, useEffect, useRef } from 'react'
import { getTrendingSpots } from '../api/trending'
import { REGIONS } from '../data/regions'
import useBackClose from '../hooks/useBackClose'

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

// 배치가 region 을 달기 전에 저장된 행은 시도 이름으로 지역을 가린다
const REGION_BY_AREA_NM = {
  서울특별시: '서울', 인천광역시: '인천', 대전광역시: '대전', 대구광역시: '대구', 광주광역시: '광주', 부산광역시: '부산',
  강원특별자치도: '강원', 경기도: '경기', 전북특별자치도: '전북', 전라남도: '전남', 제주특별자치도: '제주',
}

/** 전국: 전국 순위(rank) 순 · 지역: 그 지역 안 순위(regionRank) 순, 없으면 점수순 */
export function pickTrending(all, region) {
  if (region === '전국') {
    return all.filter(s => s.rank != null).sort((a, b) => a.rank - b.rank).slice(0, HOME_COUNT)
  }
  return all
    .filter(s => (s.region ?? REGION_BY_AREA_NM[s.areaNm]) === region)
    .sort((a, b) => (a.regionRank ?? Infinity) - (b.regionRank ?? Infinity) || (b.score ?? 0) - (a.score ?? 0))
    .slice(0, HOME_COUNT)
}

/** 제목 줄 오른쪽의 지역 선택 버튼 — 누르면 바로 아래로 목록이 펼쳐진다 */
function RegionSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Android 뒤로 가기로 목록 닫기
  useBackClose(() => setOpen(false), { active: open })

  // 바깥을 누르거나 ESC 를 누르면 닫는다
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = value !== '전국'
  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={`지역 선택: ${value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 pl-3 pr-2.5 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors ${
          filtered ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-gray-200 text-gray-700'
        }`}
      >
        {value}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`w-3.5 h-3.5 fill-none transition-transform ${open ? 'rotate-180' : ''} ${filtered ? 'stroke-primary-500' : 'stroke-gray-400'}`}
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="지역"
          className="absolute right-0 top-full mt-1.5 z-10 w-32 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5"
        >
          {REGIONS.map(r => (
            <li key={r.label} role="option" aria-selected={r.label === value}>
              <button
                type="button"
                onClick={() => { onChange(r.label); setOpen(false) }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[13px] ${
                  r.label === value ? 'bg-primary-50 text-primary-600 font-bold' : 'text-gray-700 font-medium active:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * 홈 "요즘 뜨는 명소" — 순위 · 사진 · 이름 · 지역 · 한 줄 설명 (B안) + 지역 선택
 * 항목을 누르면 onSelect(contentId) 로 행사 카드와 같은 상세 팝업을 연다.
 * 데이터가 없으면(배치 미실행·Supabase 미설정) 섹션 자체를 그리지 않는다.
 */
export default function TrendingSection({ onSelect }) {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState('전국')

  useEffect(() => {
    getTrendingSpots()
      .then(setAll)
      .catch(() => setAll([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && all.length === 0) return null
  const items = pickTrending(all, region)

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">요즘 뜨는 명소</h2>
        {!loading && <RegionSelect value={region} onChange={setRegion} />}
      </div>

      {loading ? (
        <Skeleton />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-4 py-7 text-center">
          <p className="text-[13px] text-gray-500">이번 주 {region}에서 뜨는 명소가 아직 없어요</p>
          <p className="text-[11.5px] text-gray-400 mt-1">다른 지역을 선택해보세요</p>
        </div>
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

      <p className="text-[11px] text-gray-400 mt-2.5 px-0.5 leading-relaxed">
        한국관광공사 방문 예보 기준 · 오늘 갱신
        <br />
        KT 통신 데이터로 관광지별 방문자 수를 예측한 자료예요. 평소보다 사람이 늘 것으로 예보된 곳을 골랐어요.
      </p>
    </section>
  )
}
