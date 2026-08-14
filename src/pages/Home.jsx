import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BenefitCard from '../components/BenefitCard'
import CourseCard from '../components/CourseCard'
import DetailModal from '../components/DetailModal'
import { getAreaBasedList } from '../api/tourApi'
import { MOCK_COURSES } from '../data/courses'

function SkeletonCard() {
  return <div className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
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
    getAreaBasedList({ contentTypeId: '15', numOfRows: 4, arrange: 'C' })
      .then(items => setEvents(items))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-4 pt-6 pb-4">
      {/* 헤더 */}
      <header className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">스탬프여행 🗺️</h1>
        <p className="text-sm text-gray-500 mt-1">여행 코스 추천 · 행사 정보 · 방문 스탬프</p>
      </header>

      {/* 행사/축제 섹션 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">진행중인 행사/축제</h2>
          <Link to="/course" className="text-xs text-primary-500 font-medium">전체보기 →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {events.map((b, i) => (
              <BenefitCard
                key={b.contentid ?? i}
                benefit={b}
                onClick={() => openDetail(b.contentid)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-10 text-center">
            <p className="text-3xl mb-2">🎁</p>
            <p className="text-sm text-gray-400">API 키를 설정하면 행사 정보가 표시됩니다</p>
            <p className="text-xs text-gray-300 mt-1">.env 파일에 VITE_TOUR_API_KEY를 입력하세요</p>
          </div>
        )}
      </section>

      {/* 추천 코스 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">추천 코스</h2>
        </div>
        <div className="flex flex-col gap-3">
          {MOCK_COURSES.slice(0, 2).map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {selectedId && (
        <DetailModal contentId={selectedId} onClose={closeDetail} />
      )}
    </div>
  )
}
