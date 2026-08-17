export const PROVIDER_LABEL = { kakao: '카카오', google: 'Google' }

/** 소셜 로그인 버튼·아바타 옆에 붙는 동그란 K / G 아이콘 */
export function ProviderIcon({ provider, size = 'w-5 h-5 text-[11px]' }) {
  if (provider === 'kakao') {
    return (
      <span className={`${size} rounded-full bg-[#191919] text-[#FEE500] font-extrabold inline-flex items-center justify-center`}>
        K
      </span>
    )
  }
  return (
    <span className={`${size} rounded-full bg-white border border-gray-200 text-[#4285F4] font-extrabold inline-flex items-center justify-center`}>
      G
    </span>
  )
}

/** "카카오" / "Google" 알약 뱃지 (마이 탭 · 계정 설정) */
export function ProviderBadge({ provider }) {
  const label = PROVIDER_LABEL[provider]
  if (!label) return null
  const style = provider === 'kakao'
    ? 'bg-[#FEE500] text-[#191919]'
    : 'bg-white text-[#4285F4] border border-gray-200'
  return (
    <span className={`text-[9.5px] font-bold rounded-full px-1.5 py-0.5 ${style}`}>{label}</span>
  )
}
