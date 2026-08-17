import { useNavigate } from 'react-router-dom'

/** 이용약관 / 개인정보처리방침 공통 레이아웃 (로그인 전에도 볼 수 있는 공개 페이지) */
export default function LegalLayout({ title, updated, children }) {
  const navigate = useNavigate()
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-12">
      <div className="pt-4 px-4">
        <button onClick={() => navigate(-1)} className="h-8 flex items-center gap-1.5 text-gray-500 text-sm">
          <span className="text-base leading-none">‹</span>
          <span className="text-xs font-semibold text-gray-600">뒤로</span>
        </button>
        <h1 className="mt-3 text-lg font-extrabold text-gray-900">{title}</h1>
        <p className="text-[11px] text-gray-400 mt-1">시행일 {updated}</p>
      </div>
      <div className="px-4 mt-5 text-[13px] leading-relaxed text-gray-700 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5 [&_p]:mb-2">
        {children}
      </div>
    </div>
  )
}
