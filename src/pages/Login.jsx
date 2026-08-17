import { useState, useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/Toast'
import BrandMark from '../components/BrandMark'
import Splash from '../components/Splash'
import { ProviderIcon } from '../components/Provider'

const PROVIDERS = [
  { key: 'kakao',  label: '카카오로 시작하기', pending: '카카오 로그인 중…' },
  { key: 'google', label: 'Google로 시작하기', pending: 'Google 로그인 중…' },
]

export default function Login() {
  const { loading, session, isConfigured, initError, clearInitError, signInWithKakao, signInWithGoogle } = useAuth()
  const showToast = useToast()
  const location = useLocation()
  const [pending, setPending] = useState(null) // 'kakao' | 'google' | null

  // 소셜 인증 후 앱으로 돌아왔을 때 URL(해시 또는 쿼리)에 error 가 실려오면 안내
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const query = new URLSearchParams(window.location.search)
    const desc = hash.get('error_description') || query.get('error_description')
    if (hash.get('error') || query.get('error')) {
      showToast(desc ? `로그인 실패: ${desc}` : '로그인에 실패했어요. 다시 시도해 주세요')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [showToast])

  // Supabase 가 URL 의 토큰을 세션으로 바꾸는 데 실패한 경우 (Redirect URL 미등록, 만료 등)
  useEffect(() => {
    if (!initError) return
    showToast(`로그인 처리 실패: ${initError}`)
    clearInitError()
  }, [initError, showToast, clearInitError])

  // 소셜 인증 창(사파리 시트·구글 팝업 등)을 사용자가 그냥 닫고 돌아오면 이 페이지가 살아 있는 채로 다시 보인다.
  // 그때 "로그인 중…" 상태가 남지 않도록, 페이지가 다시 보이는 순간과 일정 시간 경과 후 pending 을 되돌린다.
  useEffect(() => {
    if (!pending) return
    const reset = () => setPending(null)
    const onVisible = () => { if (document.visibilityState === 'visible') reset() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', reset)
    window.addEventListener('focus', reset)
    const timer = setTimeout(reset, 15000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', reset)
      window.removeEventListener('focus', reset)
      clearTimeout(timer)
    }
  }, [pending])

  if (loading) return <Splash />
  // 이미 로그인돼 있으면 원래 가려던 곳(없으면 홈)으로. 프로필 유무는 RequireAuth 가 판단한다
  if (session) return <Navigate to={location.state?.from || '/'} replace />

  async function handleSignIn(key) {
    if (!isConfigured) {
      showToast('Supabase 환경변수 설정이 필요해요 (docs/SUPABASE_SETUP.md)')
      return
    }
    setPending(key)
    try {
      await (key === 'kakao' ? signInWithKakao() : signInWithGoogle())
      // 성공 시 브라우저가 소셜 인증 페이지로 이동하므로 여기 이후는 실행되지 않는다
    } catch {
      showToast('로그인에 실패했어요. 다시 시도해 주세요')
      setPending(null)
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-center px-6 pb-10">
      <div className="mb-12">
        <BrandMark />
      </div>

      <div className="flex flex-col gap-2.5">
        {PROVIDERS.map(({ key, label, pending: pendingLabel }) => {
          const isPending = pending === key
          const disabled = pending !== null
          const base = 'w-full py-3.5 rounded-xl text-[13.5px] font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:active:scale-100 disabled:opacity-60'
          const style = key === 'kakao'
            ? 'bg-[#FEE500] text-[#191919]'
            : 'bg-white text-gray-900 border border-gray-200'
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => handleSignIn(key)}
              className={`${base} ${style}`}
            >
              {isPending ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
              ) : (
                <ProviderIcon provider={key} />
              )}
              {isPending ? pendingLabel : label}
            </button>
          )
        })}
      </div>

      <p className="text-center text-[10.5px] text-gray-400 leading-relaxed mt-5">
        시작하면{' '}
        <Link to="/terms" className="text-primary-600 font-semibold">이용약관</Link>
        {' '}및{' '}
        <Link to="/privacy" className="text-primary-600 font-semibold">개인정보처리방침</Link>
        에<br />동의하는 것으로 간주됩니다
      </p>

      {!isConfigured && (
        <p className="text-center text-[11px] text-red-400 mt-6 leading-relaxed">
          Supabase 환경변수(VITE_SUPABASE_URL / ANON_KEY)가 없어<br />
          로그인이 동작하지 않아요. <span className="font-semibold">docs/SUPABASE_SETUP.md</span> 참고
        </p>
      )}
    </div>
  )
}
