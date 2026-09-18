import { Link } from 'react-router-dom'
import useStamp from '../hooks/useStamp'

/**
 * 홈 상단 "내 스탬프 현황" — 여권 카드 + 잉크 도장. 누르면 스탬프를 찍으러 갈 수 있게 지도 탭으로 간다.
 * 스탬프 조회가 끝나기 전에는 문구·개수 자리를 비워 둔다 (0개로 오판해 "첫 스탬프" 문구가 잠깐 비치지 않도록).
 */
export default function StampPassport() {
  const { loaded, stamps } = useStamp()
  const count = stamps.length
  const latest = stamps[count - 1]

  return (
    <Link
      to="/map"
      className="flex items-center justify-between bg-slate-900 text-white rounded-[20px] px-5 py-8 active:scale-[0.99] transition-transform"
    >
      <div className="min-w-0">
        {loaded ? (
          <p className="text-xl font-extrabold leading-tight whitespace-nowrap">
            {count > 0 ? '여행이 쌓이고 있어요' : '첫 스탬프를 찍어보세요'}
          </p>
        ) : (
          <span aria-hidden="true" className="block w-40 h-[25px] rounded-md bg-white/10 animate-pulse" />
        )}
        {latest?.title && (
          <p className="text-[11.5px] text-slate-300 leading-relaxed mt-2.5 truncate">최근 방문지 · {latest.title}</p>
        )}
        {/* 카드 전체가 링크라 버튼 모양만 낸다 — 누를 수 있다는 표시 */}
        <span className="relative overflow-hidden inline-flex items-center gap-1 mt-3.5 px-3.5 py-2 rounded-full bg-primary-500 text-[12.5px] font-bold">
          스탬프 찍으러 가기
          <svg viewBox="0 0 24 24" aria-hidden="true" className="passport-arrow w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span aria-hidden="true" className="passport-shine" />
        </span>
      </div>
      <div
        aria-hidden="true"
        className="relative shrink-0 w-[100px] h-[100px] ml-3 mr-1.5 rounded-full border-[3px] border-primary-400 flex flex-col items-center justify-center -rotate-[14deg] text-primary-200 text-[11px] font-extrabold leading-tight"
      >
        {/* 바깥 점선 고리 — 아주 천천히 돈다 (움직임은 index.css 의 passport-*) */}
        <span className="passport-ring absolute -inset-2 rounded-full border-[1.5px] border-dashed border-primary-400" />
        <span className="text-[26px] text-white leading-none">{loaded ? count : '·'}</span>
        STAMPS
      </div>
    </Link>
  )
}
