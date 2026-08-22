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
        <MenuItem to="/my/courses" icon="🧭" label="내 코스" desc="직접 만든 여행 코스" count={courses.length} />
        <MenuItem to="/my/stamps" icon="🗺️" label="스탬프 컬렉션" desc="방문 인증한 관광지" count={stamps.length} />
        <MenuItem to="/my/favorites" icon="🧡" label="관심 목록" desc="저장한 행사·축제" count={favorites.length} />
      </MenuGroup>

      <MenuGroup title="설정">
        <MenuItem to="/settings" icon="👤" label="계정 설정" plain />
        <MenuItem to="/terms" icon="📄" label="이용약관" plain />
        <MenuItem to="/privacy" icon="🔒" label="개인정보처리방침" plain />
      </MenuGroup>

      <div className="mt-7 text-center text-[10.5px] text-gray-400 leading-relaxed">
        <span className="font-semibold text-gray-500">스탬프여행</span> v{__APP_VERSION__}
        <br />관광 정보 · 한국관광공사 TourAPI
        <br />지도 · 카카오맵
      </div>
    </div>
  )
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
      <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-[15px] flex-shrink-0 ${plain ? 'bg-gray-100' : 'bg-primary-50'}`}>
        {icon}
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
