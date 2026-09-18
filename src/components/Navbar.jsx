import { NavLink } from 'react-router-dom'

// 아이콘만 쓰는 탭바 — 평소엔 선, 선택되면 면을 채운다. 메뉴명은 aria-label 로만 남긴다.
// fill: 선택 시 currentColor 로 채울 도형 / hole: 채운 면 위에 흰색으로 뚫을 도형(문, 핀 구멍)
const TABS = [
  {
    to: '/', label: '홈',
    fill: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />,
    hole: <path d="M9.8 20v-5.2h4.4V20" />,
  },
  {
    to: '/course', label: '코스',
    fill: <><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /></>,
    line: <path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" />,
  },
  {
    to: '/map', label: '지도',
    fill: <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />,
    hole: <circle cx="12" cy="10" r="2.3" />,
  },
  {
    to: '/archive', label: 'My',
    fill: <><circle cx="12" cy="8" r="3.7" /><path d="M4.6 20c.8-3.7 3.7-5.7 7.4-5.7s6.6 2 7.4 5.7z" /></>,
  },
]

function TabIcon({ tab, active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-[26px] h-[26px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={active && tab.line ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g fill={active ? 'currentColor' : 'none'}>{tab.fill}</g>
      {tab.line}
      {tab.hole && <g fill={active ? '#fff' : 'none'} stroke={active ? '#fff' : 'currentColor'}>{tab.hole}</g>}
    </svg>
  )
}

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50 safe-bottom">
      <ul className="flex h-16">
        {TABS.map(tab => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              aria-label={tab.label}
              className={({ isActive }) =>
                `flex items-center justify-center h-full transition-colors ${
                  isActive ? 'text-primary-500' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => <TabIcon tab={tab} active={isActive} />}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
