import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useFavorite from '../hooks/useFavorite'
import BenefitCard, { calcDday } from '../components/BenefitCard'
import DetailModal from '../components/DetailModal'
import EndedFestivalModal from '../components/EndedFestivalModal'
import Pagination from '../components/Pagination'
import SubHeader from '../components/SubHeader'
import { useToast } from '../components/Toast'

// 행사 기간이 지났는지 (종료일이 없으면 상시 정보로 보고 종료 아님)
function isEnded(item) {
  const dday = calcDday(item.eventenddate)
  return dday !== null && dday < 0
}

const FAVORITES_PER_PAGE = 6

/** My 탭 › 관심 목록 */
export default function MyFavorites() {
  const location = useLocation()
  const navigate = useNavigate()
  const { favorites, toggleFavorite } = useFavorite()
  const showToast = useToast()
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

  function handlePageChange(nextPage) {
    setPage(nextPage)
    window.scrollTo(0, 0)
  }

  function openDetail(id) {
    setSelectedId(id)
    navigate(location.pathname, { replace: true, state: { modalId: id } })
  }
  function closeDetail() {
    setSelectedId(null)
    navigate(location.pathname, { replace: true, state: null })
  }

  return (
    <div className="pt-6">
      <SubHeader title="관심 목록" subtitle={`${favorites.length}개 저장`} fallback="/archive" />

      <div className="px-4 mt-5">
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
            <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>

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
