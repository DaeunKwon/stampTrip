import { Link } from 'react-router-dom'
import useCourse from '../hooks/useCourse'
import useStamp from '../hooks/useStamp'
import { visitedCount } from '../pages/MyCourses'

// 3개까지는 전부, 4개부터는 최근 3개 + "모두 보기"
const HOME_MAX = 3

function Chevron({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

/**
 * 홈 "내 코스" — 여권 카드 아래 세로 목록(최근에 만든 순).
 * 조회가 끝나기 전에는 자리만 잡아 둔다 (빈 상태 안내가 잠깐 비치지 않도록).
 */
export default function HomeCourses() {
  const { courses } = useCourse()
  const { loaded, isStamped } = useStamp()
  const many = courses.length > HOME_MAX
  const shown = many ? courses.slice(0, HOME_MAX) : courses

  return (
    <section className="mb-7">
      <h2 className="text-base font-bold text-gray-800 mb-3">
        내 코스
        {courses.length > 0 && <span className="ml-1.5 text-[13px] text-primary-500">{courses.length}</span>}
      </h2>
      {!loaded ? (
        <div aria-hidden="true" className="h-[62px] rounded-2xl bg-gray-100 animate-pulse" />
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border-[1.5px] border-dashed border-gray-300 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-gray-600">아직 만든 코스가 없어요</p>
          <p className="text-xs text-gray-400 mt-1">행사를 고르고 나만의 코스를 짜보세요</p>
          <Link
            to="/course"
            className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-full bg-primary-500 text-white text-[12.5px] font-bold active:scale-95 transition-transform"
          >
            코스 짜러 가기
            <Chevron className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {shown.map(course => {
              const done = visitedCount(course, isStamped)
              const total = course.spots.length
              return (
                <Link
                  key={course.id}
                  to={`/my/courses/${course.id}`}
                  className="flex items-center gap-2.5 px-4 py-3 active:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{course.name}</p>
                    <p className="text-[11.5px] text-gray-500 mt-0.5 truncate">
                      <span className="text-primary-600">★</span> {course.event.title}
                      {course.spots.map(s => ` → ${s.title}`).join('')}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-primary-600 tabular-nums flex-shrink-0">
                    {total > 0 && done === total ? '완주' : `${done}/${total} 방문`}
                  </span>
                  <Chevron className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
          {many && (
            <Link
              to="/my/courses"
              className="flex items-center justify-center gap-1 mt-2.5 py-3 rounded-full bg-primary-50 text-primary-600 text-[13px] font-bold active:scale-[0.98] transition-transform"
            >
              코스 {courses.length}개 모두 보기
              <Chevron className="w-3.5 h-3.5" />
            </Link>
          )}
        </>
      )}
    </section>
  )
}
