import SubHeader from '../components/SubHeader'

/** 이용약관 / 개인정보처리방침 공통 레이아웃 (로그인 전에도 볼 수 있는 공개 페이지) */
export default function LegalLayout({ title, updated, children }) {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-12">
      <div className="pt-6">
        <SubHeader title={title} subtitle={`시행일 ${updated}`} />
      </div>
      <div className="px-4 mt-5 text-[13px] leading-relaxed text-gray-700 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5 [&_p]:mb-2">
        {children}
      </div>
    </div>
  )
}
