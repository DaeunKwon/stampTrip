import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useCourse from '../hooks/useCourse'
import useStamp from '../hooks/useStamp'
import { useToast } from '../components/Toast'
import CourseMap from '../components/CourseMap'
import SubHeader from '../components/SubHeader'
import { courseDistance, formatCourseTotal } from '../components/CourseSheet'
import { formatCourseDate, visitedCount } from './MyCourses'

/** My 탭 › 내 코스 › 코스 상세: 지도 + 순서별 스팟 + 방문 진행 */
export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { courses, deleteCourse } = useCourse()
  const { isStamped } = useStamp()

  const course = courses.find(c => String(c.id) === id)
  const allIds = useMemo(() => course?.spots.map(s => s.contentid) ?? [], [course])

  if (!course) {
    return (
      <div className="pt-6">
        <SubHeader title="내 코스" fallback="/my/courses" />
        <div className="text-center py-24 text-sm text-gray-500">코스를 찾을 수 없어요</div>
      </div>
    )
  }

  const done = visitedCount(course, isStamped)
  const total = course.spots.length
  const complete = total > 0 && done === total

  // 스팟을 누르면 지도 탭이 그 위치를 중심으로 열린다 (가까이 가면 스탬프를 찍을 수 있다)
  function goMap(spot) {
    navigate('/map', {
      state: {
        focusSpot: {
          contentid: spot.contentid,
          title: spot.title,
          mapx: spot.mapx,
          mapy: spot.mapy,
          addr1: spot.addr1,
          firstimage: spot.firstimage ?? '',
        },
      },
    })
  }

  function handleDelete() {
    if (!window.confirm('이 코스를 삭제할까요? 찍은 스탬프는 그대로 남아요.')) return
    deleteCourse(course.id)
    showToast('코스를 삭제했어요')
    navigate('/my/courses', { replace: true })
  }

  return (
    <div className="pt-6 pb-6">
      <SubHeader
        title={course.name}
        subtitle={`${formatCourseDate(course.createdAt)} 만듦 · ${total}곳 · ${formatCourseTotal(courseDistance(course.event, course.spots))}`}
        fallback="/my/courses"
        right={
          <button onClick={handleDelete} className="text-[11px] text-red-400 border border-red-200 px-2.5 py-1 rounded-full flex-shrink-0">
            삭제
          </button>
        }
      />

      <div className="mx-4 mt-4">
        <CourseMap event={course.event} spots={course.spots} selected={allIds} onSpotClick={cid => {
          const spot = course.spots.find(s => s.contentid === cid)
          if (spot) goMap(spot)
        }} />
      </div>

      {/* 진행률 */}
      <div className="mx-4 mt-3.5 px-3.5 py-3 bg-primary-50 border border-primary-100 rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary-700 font-semibold">{complete ? '🎉 코스를 완주했어요!' : '방문 진행'}</span>
          <span className="text-primary-600 font-bold tabular-nums">{done}/{total}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        {!complete && (
          <p className="text-[10.5px] text-primary-600/80 mt-1.5">스팟을 누르면 지도 탭에서 위치를 확인하고, 가까이 가면 스탬프를 찍을 수 있어요</p>
        )}
      </div>

      {/* 순서별 스팟 */}
      <div className="px-4 mt-4 flex flex-col">
        <div className="flex items-center gap-3 py-1.5">
          <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">★</span>
          <span className="text-sm font-semibold text-gray-800 truncate">
            {course.event.title} <span className="text-[11px] text-gray-400 font-normal">출발</span>
          </span>
        </div>
        {course.spots.map((spot, i) => {
          const visited = isStamped(spot.contentid)
          return (
            <div key={spot.contentid} className="flex gap-3">
              <div className="flex flex-col items-center w-6 flex-shrink-0">
                <span className="w-0.5 h-3 bg-primary-100" />
                <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
                  visited ? 'bg-primary-500 text-white' : 'bg-white border-2 border-primary-400 text-primary-600'
                }`}>
                  {i + 1}
                </span>
                {i < course.spots.length - 1 && <span className="flex-1 w-0.5 bg-primary-100" />}
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => goMap(spot)}
                onKeyDown={e => e.key === 'Enter' && goMap(spot)}
                className="flex-1 min-w-0 mt-3 mb-1 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
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
                <span className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  visited ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {visited ? '✓ 방문' : '미방문'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
