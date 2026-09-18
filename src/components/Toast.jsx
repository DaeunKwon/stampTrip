import { createContext, useContext, useState, useRef, useCallback } from 'react'

const ToastContext = createContext(() => {})

/**
 * 잠깐 떴다 사라지는 토스트. useToast()로 어디서든 호출한다.
 * 기본은 화면 상단. showToast(msg, { bottom: true }) 면 하단(탭바 위)에 조금 더 투명하게 띄운다 (앱 종료 안내용).
 */
export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const [bottom, setBottom] = useState(false)
  const timerRef = useRef(null)

  const showToast = useCallback((msg, { bottom = false } = {}) => {
    setMessage(msg)
    setBottom(bottom)
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 1800)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className={`fixed left-1/2 -translate-x-1/2 z-[100] text-white text-xs font-medium px-4 py-2.5 rounded-full whitespace-nowrap pointer-events-none transition-all duration-300 ${
          bottom ? 'bottom-24 bg-gray-900/70' : 'top-4 bg-gray-900/90'
        } ${
          visible ? 'opacity-100 translate-y-0' : `opacity-0 ${bottom ? 'translate-y-2' : '-translate-y-2'}`
        }`}
      >
        {message}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
