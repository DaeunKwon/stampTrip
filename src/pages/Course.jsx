import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseCard from '../components/CourseCard'
import SpotCard from '../components/SpotCard'
import useStamp from '../hooks/useStamp'

export const MOCK_COURSES = [
  {
    id: 1,
    title: '서울 역사 한바퀴',
    duration: '1일',
    distance: '약 5km',
    spots: [
      { contentid: '126508', title: '경복궁',       addr1: '서울 종로구 사직로 161', firstimage: '' },
      { contentid: '264337', title: '북촌한옥마을', addr1: '서울 종로구 계동길 37',   firstimage: '' },
      { contentid: '264545', title: '창덕궁',       addr1: '서울 종로구 율곡로 99',   firstimage: '' },
    ],
  },
  {
    id: 2,
    title: '부산 해안 드라이브',
    duration: '2일',
    distance: '약 12km',
    spots: [
      { contentid: '125452', title: '해운대해수욕장', addr1: '부산 해운대구 우동',   firstimage: '' },
      { contentid: '126425', title: '광안리해수욕장', addr1: '부산 수영구 광안해변로', firstimage: '' },
      { contentid: '126473', title: '태종대',         addr1: '부산 영도구 전망로 24', firstimage: '' },
    ],
  },
  {
    id: 3,
    title: '제주 자연 탐방',
    duration: '3일',
    distance: '약 20km',
    spots: [
      { contentid: '127405', title: '한라산',       addr1: '제주 서귀포시 토평동 산15-1', firstimage: '' },
      { contentid: '127427', title: '성산일출봉', addr1: '제주 서귀포시 성산읍',        firstimage: '' },
      { contentid: '264270', title: '만장굴',       addr1: '제주 제주시 구좌읍 만장굴길', firstimage: '' },
    ],
  },
  {
    id: 4,
    title: '경주 천년 문화 투어',
    duration: '1일',
    distance: '약 8km',
    spots: [
      { contentid: '126280', title: '불국사',     addr1: '경북 경주시 불국로 385',     firstimage: '' },
      { contentid: '126098', title: '석굴암',     addr1: '경북 경주시 불국로 873-243', firstimage: '' },
      { contentid: '127493', title: '첨성대',     addr1: '경북 경주시 인왕동 839-1',   firstimage: '' },
    ],
  },
]

const FILTERS = [
  { key: 'all',  label: '전체' },
  { key: '1',    label: '1일' },
  { key: '2',    label: '2일' },
  { key: '3',    label: '3일' },
]

export default function Course() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const { isStamped } = useStamp()
  const navigate = useNavigate()

  const filtered = filter === 'all'
    ? MOCK_COURSES
    : MOCK_COURSES.filter(c => c.duration.startsWith(filter))

  if (selected) {
    const total = selected.spots.length
    const done = selected.spots.filter(s => isStamped(s.contentid)).length

    return (
      <div className="pt-6">
        {/* 코스 상세 헤더 */}
        <div className="flex items-center gap-3 px-4 mb-1">
          <button onClick={() => setSelected(null)} className="text-gray-400 text-xl p-1">←</button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 line-clamp-1">{selected.title}</h1>
        </div>
        <div className="flex gap-3 px-4 mb-5 text-sm text-gray-500">
          <span>⏱ {selected.duration}</span>
          <span>·</span>
          <span>🚶 {selected.distance}</span>
          <span>·</span>
          <span className="text-primary-500 font-medium">{done}/{total} 인증</span>
        </div>

        {/* 코스 타임라인 */}
        <div className="px-4 flex flex-col gap-0">
          {selected.spots.map((spot, i) => (
            <div key={spot.contentid} className="flex gap-3 items-stretch">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 ${
                  isStamped(spot.contentid)
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}>
                  {isStamped(spot.contentid) ? '✓' : i + 1}
                </div>
                {i < selected.spots.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-4" />
                )}
              </div>
              <div className="flex-1 pb-3">
                <SpotCard spot={spot} showStamp stamped={isStamped(spot.contentid)} />
              </div>
            </div>
          ))}
        </div>

        {done === total && (
          <div className="mx-4 mt-4 p-4 bg-primary-50 rounded-2xl text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold text-primary-600">코스 완주! 모든 스탬프를 모았습니다</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pt-6">
      <div className="px-4 mb-4">
        <h1 className="text-xl font-bold text-gray-900">명소 코스 추천</h1>
        <p className="text-xs text-gray-500 mt-0.5">동선 최적화 1~3일 테마 코스</p>
      </div>

      <div className="flex gap-2 px-4 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-3">
        {filtered.map(course => (
          <CourseCard key={course.id} course={course} onClick={() => setSelected(course)} />
        ))}
      </div>
    </div>
  )
}
