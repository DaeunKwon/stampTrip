import { useState, useEffect } from 'react'
import BenefitCard from '../components/BenefitCard'
import DetailModal from '../components/DetailModal'
import Pagination from '../components/Pagination'
import { getFestivalList } from '../api/tourApi'

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
  { code: '37', label: '전북' },
  { code: '38', label: '전남' },
  { code: '39', label: '제주' },
]

function SkeletonCard() {
  return <div className="bg-gray-100 rounded-2xl h-52 animate-pulse" />
}

export default function Course() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [areaCode, setAreaCode] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    // searchFestival2는 응답의 areacode 필드가 항상 빈 값이라 서버 areaCode 필터가 0건만 반환한다.
    // 전국 데이터를 받아 addr1 접두어로 지역을 직접 걸러낸다.
    getFestivalList({ eventStartDate: today, numOfRows: 200, arrange: 'C' })
      .then(items => {
        const areaLabel = AREA_CODES.find(a => a.code === areaCode)?.label
        const filtered = areaCode
          ? items.filter(item => item.addr1?.startsWith(areaLabel))
          : items
        // 종료 예정일(eventenddate)이 임박한 순, 종료일이 같으면 시작일이 빠른 순으로 정렬
        const sorted = [...filtered].sort((a, b) =>
          (a.eventenddate ?? '').localeCompare(b.eventenddate ?? '') ||
          (a.eventstartdate ?? '').localeCompare(b.eventstartdate ?? '')
        )
        setItems(sorted)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [areaCode])

  useEffect(() => {
    setPage(1)
  }, [areaCode])

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)
  const pagedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="pt-6">
      <div className="px-4 mb-4">
        <h1 className="text-xl font-bold text-gray-900">행사·축제 정보</h1>
        <p className="text-xs text-gray-500 mt-0.5">전국 행사 · 축제 · 공연 정보</p>
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
            <p className="text-5xl mb-3">🎪</p>
            <p className="text-gray-500 font-medium">정보가 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">다른 지역을 선택해보세요</p>
          </div>
        )}
      </div>

      {selectedId && (
        <DetailModal contentId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
