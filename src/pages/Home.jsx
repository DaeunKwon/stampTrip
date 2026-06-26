import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BenefitCard from '../components/BenefitCard'
import CourseCard from '../components/CourseCard'
import { getAreaBasedList } from '../api/tourApi'
import { MOCK_COURSES } from './Course'

function SkeletonCard() {
  return <div className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
}

export default function Home() {
  const [benefits, setBenefits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAreaBasedList({ contentTypeId: '15', numOfRows: 4 })
      .then(body => setBenefits(Array.isArray(body.items?.item) ? body.items.item : []))
      .catch(() => setBenefits([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-4 pt-6 pb-4">
      {/* 헤더 */}
      <header className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">도장여행 🗺️</h1>
        <p className="text-sm text-gray-500 mt-1">여행 혜택 · 코스 추천 · 방문 스탬프</p>
      </header>

      {/* 혜택 섹션 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">이달의 혜택</h2>
          <Link to="/benefits" className="text-xs text-primary-500 font-medium">전체보기 →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : benefits.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((b, i) => <BenefitCard key={b.contentid ?? i} benefit={b} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-10 text-center">
            <p className="text-3xl mb-2">🎁</p>
            <p className="text-sm text-gray-400">API 키를 설정하면 혜택 정보가 표시됩니다</p>
            <p className="text-xs text-gray-300 mt-1">.env 파일에 VITE_TOUR_API_KEY를 입력하세요</p>
          </div>
        )}
      </section>

      {/* 추천 코스 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">추천 코스</h2>
          <Link to="/course" className="text-xs text-primary-500 font-medium">전체보기 →</Link>
        </div>
        <div className="flex flex-col gap-3">
          {MOCK_COURSES.slice(0, 2).map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  )
}
