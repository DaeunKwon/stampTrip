import { calcDday, ddayColorClass } from './BenefitCard'
import useLclsName from '../hooks/useLclsName'
import useFavorite from '../hooks/useFavorite'
import { useToast } from './Toast'

/** 홈 가로 슬라이드용 행사 카드 — 사진 위에 제목·지역·분류를 얹은 큰 카드. 동작(상세 팝업·하트)은 BenefitCard 와 같다. */
export default function EventSlideCard({ benefit, onClick }) {
  const { title, addr1, firstimage, eventenddate } = benefit
  const catName = useLclsName(benefit)
  const dday = calcDday(eventenddate)
  const { toggleFavorite, isFavorite } = useFavorite()
  const showToast = useToast()
  const fav = isFavorite(benefit.contentid)
  // "서울특별시 중구 세종대로 110" → "서울특별시 중구"
  const region = addr1?.split(' ').slice(0, 2).join(' ')

  // 하트 클릭 시 카드 클릭(상세 팝업)과 분리
  function handleFavClick(e) {
    e.stopPropagation()
    const added = toggleFavorite({
      contentid: benefit.contentid,
      title,
      addr1,
      firstimage: firstimage ?? '',
      eventenddate,
    })
    showToast(added ? '관심 목록에 추가했습니다' : '관심 목록에서 해제했습니다')
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      className="relative shrink-0 snap-start w-64 h-44 rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
    >
      {firstimage ? (
        <img src={firstimage} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-700" />
      )}
      {dday !== null && dday >= 0 && (
        <span className={`absolute top-2 left-2 text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full ${ddayColorClass(dday)}`}>
          {dday === 0 ? 'D-day' : `D-${dday}`}
        </span>
      )}
      <button
        type="button"
        onClick={handleFavClick}
        aria-label={fav ? '관심 해제' : '관심 추가'}
        className={`absolute top-1.5 right-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-full bg-white/90 shadow text-[15px] leading-none active:scale-90 transition-transform ${
          fav ? 'text-primary-500' : 'text-gray-300'
        }`}
      >
        ♥
      </button>
      <div className="absolute inset-x-0 bottom-0 px-3.5 pt-9 pb-3 bg-gradient-to-t from-black/75 to-transparent">
        <h3 className="text-[15px] font-bold text-white leading-snug line-clamp-2">{title}</h3>
        <p className="text-[11px] text-gray-200 mt-1 truncate">
          {region}
          {catName && catName !== '...' && (
            <>
              {region && ' · '}
              <span>{catName}</span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
