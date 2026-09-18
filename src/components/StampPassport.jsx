import { Link } from 'react-router-dom'
import useStamp from '../hooks/useStamp'

/** 홈 상단 "내 스탬프 현황" — 여권 카드 + 잉크 도장. 누르면 스탬프를 찍으러 갈 수 있게 지도 탭으로 간다. */
export default function StampPassport() {
  const { stamps } = useStamp()
  const count = stamps.length
  const latest = stamps[count - 1]

  return (
    <Link
      to="/map"
      className="flex items-center justify-between bg-slate-900 text-white rounded-[20px] px-5 py-8 active:scale-[0.99] transition-transform"
    >
      <div className="min-w-0">
        <p className="text-xl font-extrabold leading-tight whitespace-nowrap">
          {count > 0 ? '여행이 쌓이고 있어요' : '첫 스탬프를 찍어보세요'}
        </p>
        {latest?.title && (
          <p className="text-[11.5px] text-slate-300 leading-relaxed mt-2.5 truncate">최근 방문지 · {latest.title}</p>
        )}
        {/* 카드 전체가 링크라 버튼 모양만 낸다 — 누를 수 있다는 표시 */}
        <span className="inline-flex items-center gap-1 mt-3.5 px-3.5 py-2 rounded-full bg-primary-500 text-[12.5px] font-bold">
          스탬프 찍으러 가기
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </div>
      <div
        aria-hidden="true"
        className="shrink-0 w-[100px] h-[100px] ml-3 mr-1.5 rounded-full border-[3px] border-primary-400 outline-dashed outline-[1.5px] outline-offset-4 outline-primary-400 flex flex-col items-center justify-center -rotate-[14deg] text-primary-200 text-[11px] font-extrabold leading-tight"
      >
        <span className="text-[26px] text-white leading-none">{count}</span>
        STAMPS
      </div>
    </Link>
  )
}
