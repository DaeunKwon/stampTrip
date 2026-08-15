import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useStamp from '../hooks/useStamp'
import useFavorite from '../hooks/useFavorite'
import StampBadge from '../components/StampBadge'
import BenefitCard, { calcDday } from '../components/BenefitCard'
import DetailModal from '../components/DetailModal'
import EndedFestivalModal from '../components/EndedFestivalModal'
import Pagination from '../components/Pagination'
import { useToast } from '../components/Toast'
import { STAMP_RADIUS } from './Map'

// 행사 기간이 지났는지 (종료일이 없으면 상시 정보로 보고 종료 아님)
function isEnded(item) {
  const dday = calcDday(item.eventenddate)
  return dday !== null && dday < 0
}

const FAVORITES_PER_PAGE = 6

const TABS = [
  { key: 'stamp', label: '🗺️ 스탬프' },
  { key: 'fav',   label: '🧡 관심 목록' },
]

export default function Archive() {
  const location = useLocation()
  const navigate = useNavigate()
  const { stamps, unstamp, clear } = useStamp()
  const { favorites, toggleFavorite } = useFavorite()
  const showToast = useToast()
  const [tab, setTab] = useState('stamp')
  // 주변 코스 스팟 화면에서 뒤로 돌아오면 보던 상세 팝업을 복원한다 (코스/홈과 동일 패턴)
  const [selectedId, setSelectedId] = useState(location.state?.modalId ?? null)
  // 종료된 행사를 클릭하면 상세 대신 종료 안내 팝업을 띄운다
  const [endedItem, setEndedItem] = useState(null)
  const [page, setPage] = useState(1)

  // 진행 중인 행사를 앞에, 종료된 행사를 뒤에 배치한다
  const sortedFavorites = [...favorites].sort((a, b) => isEnded(a) - isEnded(b))

  // 관심 해제로 마지막 페이지가 비면 앞 페이지로 당긴다
  const totalPages = Math.ceil(sortedFavorites.length / FAVORITES_PER_PAGE)
  const safePage = Math.min(page, Math.max(totalPages, 1))
  const pagedFavorites = sortedFavorites.slice(
    (safePage - 1) * FAVORITES_PER_PAGE,
    safePage * FAVORITES_PER_PAGE,
  )

  function openDetail(id) {
    setSelectedId(id)
    navigate(location.pathname, { replace: true, state: { modalId: id } })
  }
  function closeDetail() {
    setSelectedId(null)
    navigate(location.pathname, { replace: true, state: null })
  }

  function handleClear() {
    if (window.confirm('모든 스탬프를 삭제할까요? 되돌릴 수 없습니다.')) {
      clear()
    }
  }

  return (
    <div className="pt-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between px-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">마이 페이지</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            스탬프 {stamps.length}개 수집 · 관심 {favorites.length}개
          </p>
        </div>
        {tab === 'stamp' && stamps.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-red-400 border border-red-200 px-3 py-1.5 rounded-full"
          >
            초기화
          </button>
        )}
      </div>

      {/* 구분 탭 */}
      <div className="flex border-b-[1.5px] border-gray-200 mt-4 mb-5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 pb-2.5 pt-1.5 text-sm font-semibold relative transition-colors ${
              tab === t.key ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute left-0 right-0 -bottom-[1.5px] h-[2.5px] bg-primary-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === 'stamp' ? (
        <div className="px-4">
          {stamps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-6xl mb-5">🗺️</p>
              <p className="text-gray-600 font-medium">여행을 시작해보세요!</p>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                지도 탭에서 관광지 반경 {STAMP_RADIUS}m 내에<br />들어가면 스탬프를 찍을 수 있습니다
              </p>
            </div>
          ) : (
            <>
              {/* 스탬프 그리드 */}
              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-700 mb-4">스탬프 컬렉션</h2>
                <div className="grid grid-cols-3 gap-x-2 gap-y-5">
                  {stamps.map(spot => (
                    <div key={spot.contentId} className="flex flex-col items-center gap-1">
                      <StampBadge
                        spot={{ title: spot.title, firstimage: spot.firstimage }}
                        stamped
                        size="md"
                      />
                      <button
                        onClick={() => unstamp(spot.contentId)}
                        className="text-[10px] text-gray-300 underline underline-offset-2"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* 방문 타임라인 */}
              <section>
                <h2 className="text-sm font-bold text-gray-700 mb-3">방문 기록</h2>
                <div className="flex flex-col gap-2.5">
                  {[...stamps].reverse().map(spot => (
                    <div
                      key={spot.contentId}
                      className="flex gap-3 items-center bg-white rounded-xl p-3.5 shadow-sm border border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">
                        📍
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 line-clamp-1">{spot.title}</p>
                        {spot.addr1 && (
                          <p className="text-xs text-gray-500 line-clamp-1">{spot.addr1}</p>
                        )}
                        <p className="text-xs text-primary-400 mt-0.5">
                          {new Date(spot.stampedAt).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        ✓
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="px-4">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-6xl mb-5">🧡</p>
              <p className="text-gray-600 font-medium">아직 관심 목록이 없습니다</p>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                코스 탭에서 하트를 눌러<br />행사를 저장해 보세요
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {pagedFavorites.map(item => (
                  <BenefitCard
                    key={item.contentid}
                    benefit={item}
                    onClick={() =>
                      isEnded(item) ? setEndedItem(item) : openDetail(item.contentid)
                    }
                  />
                ))}
              </div>
              <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      )}

      {selectedId && (
        <DetailModal contentId={selectedId} onClose={closeDetail} />
      )}

      {endedItem && (
        <EndedFestivalModal
          item={endedItem}
          onRemove={() => {
            toggleFavorite(endedItem)
            showToast('관심 목록에서 해제했습니다')
            setEndedItem(null)
          }}
          onClose={() => setEndedItem(null)}
        />
      )}
    </div>
  )
}
