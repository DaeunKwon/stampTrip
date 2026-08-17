import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import Splash from '../components/Splash'

/**
 * 로그인 필수 라우트 가드.
 * - 세션 판정 전: 스플래시
 * - 비로그인: /login 으로 (원래 가려던 경로를 state.from 에 보관)
 * - 로그인했지만 프로필(닉네임) 없음: /onboarding 으로 (allowNoProfile 이면 통과)
 */
export default function RequireAuth({ children, allowNoProfile = false }) {
  const { loading, session, profile } = useAuth()
  const location = useLocation()

  if (loading) return <Splash />

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (!profile && !allowNoProfile) {
    return <Navigate to="/onboarding" replace state={location.state} />
  }

  // 프로필이 이미 있으면 온보딩은 건너뛴다
  if (profile && allowNoProfile) {
    return <Navigate to="/" replace />
  }

  return children
}
