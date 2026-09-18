import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import EventSlideCard from '../components/EventSlideCard'
import StampPassport from '../components/StampPassport'
import AppIcon from '../components/AppIcon'
import DetailModal from '../components/DetailModal'
import TrendingSection from '../components/TrendingSection'
import { getOngoingFestivals } from '../api/tourApi'

const HOME_COUNT = 5
// 가로 슬라이드: 화면 좌우 여백(px-4)까지 넓혀 카드가 가장자리에서 잘려 보이게 한다
const SLIDER = 'flex gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-pl-4 scrollbar-hide -mx-4 px-4 pb-1.5'

function SkeletonCard() {
  return <div className="bg-gray-100 rounded-2xl w-64 h-44 shrink-0 animate-pulse" />
}

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  // 주변 코스 스팟 화면에서 뒤로 돌아오면 보던 상세 팝업을 복원한다
  const [selectedId, setSelectedId] = useState(location.state?.modalId ?? null)

  // 팝업 열림 상태를 히스토리 엔트리에 남겨 depth+1 화면 진입 후에도 복원 가능하게 한다
  function openDetail(id) {
    setSelectedId(id)
    navigate(location.pathname, { replace: true, state: { modalId: id } })
  }
  function closeDetail() {
    setSelectedId(null)
    navigate(location.pathname, { replace: true, state: null })
  }

  useEffect(() => {
    // 코스 탭과 같은 목록(진행 중, 종료 임박 순)의 상위 5개 → "전체보기" 로 넘어가도 순서가 이어진다
    getOngoingFestivals()
      .then(items => setEvents(items.slice(0, HOME_COUNT)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-4 pt-6 pb-4">
      {/* 헤더 */}
      <header className="mb-4 flex items-center gap-2.5">
        <AppIcon className="w-8 h-8" />
        <h1 className="text-xl font-bold text-gray-900">스탬프여행</h1>
      </header>

      {/* 내 스탬프 현황 */}
      <section className="mb-7">
        <StampPassport />
      </section>

      {/* 행사/축제 섹션 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-800 mb-3">진행중인 행사/축제</h2>
        {loading ? (
          <div className={SLIDER}>
            {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : events.length > 0 ? (
          <div className={SLIDER}>
            {events.map((b, i) => (
              <EventSlideCard
                key={b.contentid ?? i}
                benefit={b}
                onClick={() => openDetail(b.contentid)}
              />
            ))}
            {/* 슬라이드 끝: 코스 탭(전체 목록)으로 이동 */}
            <Link
              to="/course"
              className="shrink-0 snap-start w-24 h-44 flex flex-col items-center justify-center gap-2 text-[13px] font-bold text-gray-700"
            >
              <span aria-hidden="true" className="w-[52px] h-[52px] rounded-full bg-primary-500 text-white text-xl flex items-center justify-center shadow-lg shadow-primary-500/35 active:scale-95 transition-transform">
                →
              </span>
              전체보기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-10 text-center">
            <p className="text-sm text-gray-400">진행중인 행사/축제가 없습니다.</p>
          </div>
        )}
      </section>

      {/* 요즘 뜨는 명소 — 행사 카드와 같은 상세 팝업으로 연결 */}
      <TrendingSection onSelect={openDetail} />

      {selectedId && (
        <DetailModal contentId={selectedId} onClose={closeDetail} />
      )}
    </div>
  )
}
