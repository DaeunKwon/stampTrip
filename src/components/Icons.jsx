// 탭바(Navbar)와 같은 결의 아이콘 — 24 그리드 · 둥근 끝. 크기와 색은 className 으로 정한다.

/** 사람 실루엣 (My 탭 아이콘의 면 버전) — 기본 아바타에 쓴다. */
export function UserIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <circle cx="12" cy="8" r="3.7" />
      <path d="M4.6 20c.8-3.7 3.7-5.7 7.4-5.7s6.6 2 7.4 5.7z" />
    </svg>
  )
}

/** 원 안 느낌표 — 불러오기 실패 안내. */
export function AlertIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.8v5" />
      <path d="M12 16.2v.01" strokeWidth="2.4" />
    </svg>
  )
}

/** 깃발 — 코스 완주 표시. */
export function FlagIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 21V4" />
      <path d="M6 5h11.5l-2.4 3.8 2.4 3.8H6z" fill="currentColor" />
    </svg>
  )
}

/** 왼쪽 화살표 — 한 단계 들어간 화면의 뒤로가기(SubHeader). */
export function BackIcon({ className = 'w-[22px] h-[22px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  )
}
