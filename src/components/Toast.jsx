import { createContext, useContext, useState, useRef, useCallback } from 'react'

const ToastContext = createContext(() => {})

/** 앱 상단에 잠깐 떴다 사라지는 토스트. useToast()로 어디서든 호출한다. */
export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const showToast = useCallback(msg => {
    setMessage(msg)
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 1800)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/90 text-white text-xs font-medium px-4 py-2.5 rounded-full whitespace-nowrap pointer-events-none transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
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
