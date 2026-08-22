import { Link } from 'react-router-dom'
import useCourse from '../hooks/useCourse'
import useStamp from '../hooks/useStamp'
import SubHeader from '../components/SubHeader'
import { courseDistance, formatCourseTotal } from '../components/CourseSheet'

export function formatCourseDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 코스의 스팟 중 스탬프를 찍은 개수 */
export function visitedCount(course, isStamped) {
  return course.spots.filter(s => isStamped(s.contentid)).length
}

/** My 탭 › 내 코스 목록 */
export default function MyCourses() {
  const { courses } = useCourse()
  const { isStamped } = useStamp()

  return (
    <div className="pt-6">
      <SubHeader title="내 코스" subtitle={`${courses.length}개`} fallback="/archive" />

      <div className="px-4 mt-5">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-6xl mb-5">🧭</p>
            <p className="text-gray-600 font-medium">아직 만든 코스가 없어요</p>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              코스 탭에서 행사를 고르고<br />'주변 코스 스팟 보기'에서 가고 싶은 곳을 체크해 보세요
            </p>
            <Link
              to="/course"
              className="mt-6 px-6 py-3 rounded-full bg-primary-500 text-white text-sm font-bold shadow-md shadow-primary-200 active:scale-95 transition-transform"
            >
              코스 탭으로 가기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {courses.map(course => {
              const done = visitedCount(course, isStamped)
              const total = course.spots.length
              const complete = total > 0 && done === total
              return (
                <Link
                  key={course.id}
                  to={`/my/courses/${course.id}`}
                  className="block bg-white border border-gray-200 rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-gray-900 truncate">{course.name}</p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{formatCourseDate(course.createdAt)}</span>
                  </div>
                  <p className="text-[11.5px] text-gray-500 mt-1 truncate">
                    <span className="text-primary-600">★</span> {course.event.title}
                    {course.spots.map(s => ` → ${s.title}`).join('')}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-primary-100 overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-primary-600 tabular-nums flex-shrink-0">
                      {complete ? '완주 🎉' : `${done}/${total} 방문`}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-gray-400 mt-1.5">{total}곳 · {formatCourseTotal(courseDistance(course.event, course.spots))}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
