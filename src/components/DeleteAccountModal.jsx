import { useEffect } from 'react'

/** 회원 탈퇴 확인 팝업. EndedFestivalModal 과 같은 틀. */
export default function DeleteAccountModal({ courseCount = 0, stampCount, favoriteCount, busy, onConfirm, onClose }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, busy])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => !busy && onClose()}>
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="relative w-full max-w-[280px] bg-white rounded-[20px] px-5 pt-6 pb-4 text-center animate-[slideUp_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-4xl mb-2.5">😢</p>
        <h3 className="text-[15px] font-extrabold text-gray-900 mb-1.5">정말 탈퇴할까요?</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-5">
          내 코스 {courseCount}개, 스탬프 {stampCount}개, 관심 목록 {favoriteCount}개가<br />
          모두 삭제되고 되돌릴 수 없어요
        </p>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="w-full py-3 bg-red-500 text-white text-[13px] font-bold rounded-xl shadow-md shadow-red-200 active:scale-95 transition-transform disabled:opacity-60"
        >
          {busy ? '탈퇴 처리 중…' : '탈퇴하기'}
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          className="w-full pt-3 pb-1.5 text-xs text-gray-400 underline underline-offset-[3px]"
        >
          계속 사용할게요
        </button>
      </div>
    </div>
  )
}
