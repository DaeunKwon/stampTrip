import { useNavigate } from 'react-router-dom'

/** 한 단계 들어간 화면(depth+1) 공통 헤더: 뒤로가기 + 제목 (+ 부제, 오른쪽 액션) */
export default function SubHeader({ title, subtitle, right, fallback = -1 }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-3 px-4">
      <button onClick={() => navigate(fallback)} aria-label="뒤로" className="text-gray-400 text-xl p-1 -ml-1">←</button>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
