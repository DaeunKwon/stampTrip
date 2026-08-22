import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import Avatar from './Avatar'
import { ProviderBadge } from './Provider'

function joinedLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월부터 함께`
}

/** 마이 탭 상단: 프로필 카드 + 스탬프/관심 카운트 */
export default function ProfileCard({ stampCount, favoriteCount }) {
  const { user, profile } = useAuth()

  return (
    <div className="px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My 탭</h1>
        <Link
          to="/settings"
          aria-label="계정 설정"
          className="w-9 h-9 -mr-2 flex items-center justify-center text-gray-400 text-lg active:scale-95 transition-transform"
        >
          ⚙️
        </Link>
      </div>

      <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-3.5 flex items-center gap-3">
        <Avatar url={profile?.avatar_url ?? user?.socialAvatar} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-gray-900 truncate">{profile?.nickname}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
            <ProviderBadge provider={user?.provider} />
            {joinedLabel(profile?.created_at ?? user?.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex gap-2">
        <StatCard value={stampCount} label="스탬프" />
        <StatCard value={favoriteCount} label="관심 목록" />
      </div>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 text-center">
      <p className="text-base font-extrabold text-primary-600 tabular-nums">{value}</p>
      <p className="text-[10.5px] text-gray-500">{label}</p>
    </div>
  )
}
