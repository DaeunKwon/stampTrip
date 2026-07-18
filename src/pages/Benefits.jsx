import { useState, useEffect } from 'react'
import BenefitCard from '../components/BenefitCard'
import DetailModal from '../components/DetailModal'
import Pagination from '../components/Pagination'
import { getAreaBasedList, getFestivalList } from '../api/tourApi'

const ITEMS_PER_PAGE = 6

const AREA_CODES = [
  { code: '',   label: '전국' },
  { code: '1',  label: '서울' },
  { code: '2',  label: '인천' },
  { code: '3',  label: '대전' },
  { code: '4',  label: '대구' },
  { code: '5',  label: '광주' },
  { code: '6',  label: '부산' },
  { code: '32', label: '강원' },
  { code: '31', label: '경기' },
  { code: '37', label: '전남' },
  { code: '38', label: '경북' },
  { code: '39', label: '제주' },
]

const TABS = [
  { key: 'benefit', label: '혜택/할인' },
  { key: 'event',   label: '행사/축제' },
]

function SkeletonCard() {
  return <div className="bg-gray-100 rounded-2xl h-52 animate-pulse" />
}

export default function Benefits() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('benefit')
  const [areaCode, setAreaCode] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const req = tab === 'event'
      ? getFestivalList({ areaCode, eventStartDate: today, numOfRows: 60, arrange: 'C' })
      : getAreaBasedList({ areaCode, contentTypeId: '15', numOfRows: 60, arrange: 'C' })

    req
      .then(items => setItems(items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [tab, areaCode])

  useEffect(() => {
    setPage(1)
  }, [tab, areaCode])

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)
  const pagedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="pt-6">
      <div className="px-4 mb-4">
        <h1 className="text-xl font-bold text-gray-900">혜택 통합 보드</h1>
        <p className="text-xs text-gray-500 mt-0.5">전국 할인 · 행사 · 프로모션 정보</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 px-4 mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 지역 필터 */}
      <div className="flex gap-2 px-4 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {AREA_CODES.map(area => (
          <button
            key={area.code}
            onClick={() => setAreaCode(area.code)}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors flex-shrink-0 ${
              areaCode === area.code
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {area.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {pagedItems.map((item, i) => (
                <BenefitCard
                  key={item.contentid ?? i}
                  benefit={item}
                  onClick={() => setSelectedId(item.contentid)}
                />
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🎁</p>
            <p className="text-gray-500 font-medium">정보가 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">다른 지역이나 탭을 선택해보세요</p>
          </div>
        )}
      </div>

      {selectedId && (
        <DetailModal contentId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
