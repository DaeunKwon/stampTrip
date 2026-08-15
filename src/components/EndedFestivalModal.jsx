import { useEffect } from 'react'

/**
 * 관심 목록에서 기간이 종료된 행사를 클릭했을 때 뜨는 안내 팝업.
 * 그 자리에서 관심 해제까지 유도한다 (B안 목업 확정).
 */
export default function EndedFestivalModal({ item, onRemove, onClose }) {
  // ESC 닫기 + 배경 스크롤 방지 (DetailModal과 동일 패턴)
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/45" />

      <div
        className="relative w-full max-w-[280px] bg-white rounded-[20px] px-5 pt-6 pb-4 text-center animate-[slideUp_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-4xl mb-2.5">📅</p>
        <h3 className="text-[15px] font-extrabold text-gray-900 mb-1.5">종료된 행사입니다</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-5">
          <span className="font-semibold text-gray-600">{item.title}</span>의<br />
          행사 기간이 지나 정보가 정확하지 않을 수 있어요
        </p>
        <button
          onClick={onRemove}
          className="w-full py-3 bg-primary-500 text-white text-[13px] font-bold rounded-xl shadow-md shadow-primary-200 active:scale-95 transition-transform"
        >
          관심 목록에서 해제
        </button>
        <button
          onClick={onClose}
          className="w-full pt-3 pb-1.5 text-xs text-gray-400 underline underline-offset-[3px]"
        >
          그대로 두기
        </button>
      </div>
    </div>
  )
}
