import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/',         icon: '🏠', label: '홈'     },
  { to: '/benefits', icon: '🎁', label: '혜택'   },
  { to: '/course',   icon: '🗺️', label: '코스'   },
  { to: '/map',      icon: '📍', label: '지도'   },
  { to: '/archive',  icon: '📚', label: '아카이브' },
]

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50 safe-bottom">
      <ul className="flex h-16">
        {TABS.map(({ to, icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary-500' : 'text-gray-400'
                }`
              }
            >
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
