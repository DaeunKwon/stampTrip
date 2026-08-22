import { useEffect } from 'react'

/** 확인/취소 팝업. DeleteAccountModal 과 같은 틀. */
export default function ConfirmModal({ icon = '🗑️', title, message, confirmLabel = '확인', danger = false, onConfirm, onClose }) {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="relative w-full max-w-[280px] bg-white rounded-[20px] px-5 pt-6 pb-4 text-center animate-[slideUp_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-4xl mb-2.5">{icon}</p>
        <h3 className="text-[15px] font-extrabold text-gray-900 mb-1.5">{title}</h3>
        {message && <p className="text-xs text-gray-500 leading-relaxed mb-5">{message}</p>}
        <button
          onClick={onConfirm}
          className={`w-full py-3 text-white text-[13px] font-bold rounded-xl shadow-md active:scale-95 transition-transform ${
            danger ? 'bg-red-500 shadow-red-200' : 'bg-primary-500 shadow-primary-200'
          }`}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onClose}
          className="w-full pt-3 pb-1.5 text-xs text-gray-400 underline underline-offset-[3px]"
        >
          취소
        </button>
      </div>
    </div>
  )
}
