import { Link } from 'react-router-dom'
import useStamp from '../hooks/useStamp'
import useFavorite from '../hooks/useFavorite'
import useCourse from '../hooks/useCourse'
import ProfileCard from '../components/ProfileCard'

/** My 탭: 프로필 + 메뉴 허브. 각 메뉴는 한 단계 들어간 상세 화면으로 이동한다. */
export default function Archive() {
  const { stamps } = useStamp()
  const { favorites } = useFavorite()
  const { courses } = useCourse()

  return (
    <div className="pt-6 pb-6">
      <ProfileCard courseCount={courses.length} stampCount={stamps.length} favoriteCount={favorites.length} />

      <MenuGroup title="내 여행">
        <MenuItem to="/my/courses" icon="course" label="내 코스" desc="직접 만든 여행 코스" count={courses.length} />
        <MenuItem to="/my/stamps" icon="stamp" label="스탬프 컬렉션" desc="방문 인증한 관광지" count={stamps.length} />
        <MenuItem to="/my/favorites" icon="heart" label="관심 목록" desc="저장한 행사·축제" count={favorites.length} />
      </MenuGroup>

      <MenuGroup title="설정">
        <MenuItem to="/settings" icon="user" label="계정 설정" plain />
        <MenuItem to="/terms" icon="doc" label="이용약관" plain />
        <MenuItem to="/privacy" icon="lock" label="개인정보처리방침" plain />
      </MenuGroup>

      <div className="mt-7 text-center text-[10.5px] text-gray-400 leading-relaxed">
        <span className="font-semibold text-gray-500">스탬프여행</span> v{__APP_VERSION__}
        <br />관광 정보 · 한국관광공사 TourAPI
        <br />지도 · 카카오맵
      </div>
    </div>
  )
}

// 하단 탭바와 같은 선 아이콘(24 그리드 · 1.8 두께). 코스·계정은 탭바의 코스·My 와 같은 그림이다.
const MENU_ICONS = {
  course: <><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /><path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" /></>,
  // 도장: 손잡이 + 받침 + 찍힌 자국
  stamp: <><path d="M9.5 12.5c.6-1.6-1-2.9-1-5a3.5 3.5 0 0 1 7 0c0 2.1-1.6 3.4-1 5" /><path d="M6 17.5v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3z" /><path d="M5 20.5h14" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />,
  user: <><circle cx="12" cy="8" r="3.7" /><path d="M4.6 20c.8-3.7 3.7-5.7 7.4-5.7s6.6 2 7.4 5.7" /></>,
  doc: <><path d="M7 3.5h7l4 4V19.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" /><path d="M14 3.5v4h4M9 12.5h6M9 16h6" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><circle cx="12" cy="15.5" r="1" /></>,
}

function MenuGroup({ title, children }) {
  return (
    <section className="mx-4 mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 tracking-wide">{title}</p>
      {children}
    </section>
  )
}

function MenuItem({ to, icon, label, desc, count, plain = false }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 first-of-type:border-t-0 active:bg-gray-50"
    >
      <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 ${plain ? 'bg-gray-100 text-gray-500' : 'bg-primary-50 text-primary-500'}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {MENU_ICONS[icon]}
        </svg>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        {desc && <span className="block text-[11px] text-gray-400 mt-px">{desc}</span>}
      </span>
      {count !== undefined && <span className="text-xs text-gray-500 tabular-nums">{count}</span>}
      <span className="text-gray-300 text-base">›</span>
    </Link>
  )
}
