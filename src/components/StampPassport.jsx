import { Link } from 'react-router-dom'
import useStamp from '../hooks/useStamp'

/** 홈 상단 "내 스탬프 현황" — 여권 카드 + 잉크 도장. 누르면 스탬프 컬렉션으로, 도장이 아직 없으면 찍으러 갈 수 있게 지도 탭으로 간다. */
export default function StampPassport() {
  const { stamps } = useStamp()
  const count = stamps.length
  const latest = stamps[count - 1]

  return (
    <Link
      to={count > 0 ? '/my/stamps' : '/map'}
      className="flex items-center justify-between bg-slate-900 text-white rounded-[20px] px-5 py-8 active:scale-[0.99] transition-transform"
    >
      <div className="min-w-0">
        <p className="text-xl font-extrabold leading-tight mb-2.5 whitespace-nowrap">
          {count > 0 ? '여행이 쌓이고 있어요' : '첫 도장을 찍어보세요'}
        </p>
        <p className="text-[11.5px] text-slate-300 leading-relaxed">
          {latest?.title && <span className="block truncate">최근 · {latest.title}</span>}
          {count > 0 ? '다음은 어디로 떠나볼까요?' : '도장을 찍으러 가볼까요?'}
        </p>
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
