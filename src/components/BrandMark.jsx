/** 앱 로고 + 이름 + 태그라인. 로그인/스플래시 화면 중앙에 쓴다. */
export default function BrandMark({ tagline = true }) {
  return (
    <div className="text-center">
      <div className="w-[72px] h-[72px] mx-auto mb-3.5 rounded-[22px] bg-primary-50 border border-primary-100 flex items-center justify-center text-4xl">
        📍
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">스탬프트립</h1>
      {tagline && (
        <p className="text-xs text-gray-500 mt-1.5">여행지에서 도장 찍고, 기록을 남겨요</p>
      )}
    </div>
  )
}
