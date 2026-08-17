import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../api/supabase'

const AuthContext = createContext(null)

/** Supabase auth.users 의 user 객체에서 앱이 쓰는 최소 정보만 뽑는다. */
function pickUserInfo(user) {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    // Supabase는 로그인에 쓴 provider를 app_metadata.provider 에 넣어준다 ('kakao' | 'google')
    provider: user.app_metadata?.provider ?? 'unknown',
    email: user.email ?? meta.email ?? null,
    // 카카오: name/preferred_username/avatar_url, 구글: full_name/name/picture — 있는 것부터 사용
    socialName: meta.name ?? meta.full_name ?? meta.preferred_username ?? '',
    socialAvatar: meta.avatar_url ?? meta.picture ?? null,
    createdAt: user.created_at,
  }
}

/**
 * 로그인 세션 + 프로필(닉네임) 상태를 앱 전체에 제공한다.
 * - session/user: Supabase 세션 (없으면 비로그인)
 * - profile: public.profiles 행 (없으면 첫 가입 → 닉네임 설정 필요)
 * - loading: 앱 시작 직후 세션/프로필 판정이 끝나기 전 (스플래시 표시용)
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // 소셜 인증 후 돌아왔을 때 세션 생성에 실패한 이유 (로그인 화면에서 토스트로 안내)
  const [initError, setInitError] = useState(null)

  const loadProfile = useCallback(async userId => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, created_at')
      .eq('id', userId)
      .maybeSingle()
    return data ?? null
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let cancelled = false

    // 최초 1회: URL 에 실려온 토큰 처리 + 저장된 세션 복원 → 프로필 조회
    // initialize() 는 소셜 인증 후 돌아왔을 때 URL 파싱/세션 저장 결과를 돌려주므로, 실패를 여기서 잡아 알린다
    supabase.auth.initialize().then(async ({ error }) => {
      if (cancelled) return
      if (error) setInitError(error.message)
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setSession(session)
      if (session?.user) setProfile(await loadProfile(session.user.id))
      if (!cancelled) setLoading(false)
    })

    // 이후: 로그인/로그아웃/토큰 갱신 시 세션 동기화
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (cancelled) return
      setSession(nextSession)
      if (event === 'SIGNED_OUT' || !nextSession?.user) {
        setProfile(null)
        return
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setProfile(await loadProfile(nextSession.user.id))
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInWith = useCallback(async provider => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  /** 첫 가입: profiles 행 생성 */
  const createProfile = useCallback(async ({ nickname, avatarUrl }) => {
    const userId = session?.user?.id
    if (!userId) throw new Error('로그인이 필요합니다')
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, nickname, avatar_url: avatarUrl ?? null })
      .select('id, nickname, avatar_url, created_at')
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }, [session])

  const updateNickname = useCallback(async nickname => {
    const userId = session?.user?.id
    if (!userId) throw new Error('로그인이 필요합니다')
    const { data, error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('id', userId)
      .select('id, nickname, avatar_url, created_at')
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }, [session])

  /** 회원 탈퇴: RPC로 auth.users 삭제(cascade) 후 로그아웃 */
  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_my_account')
    if (error) throw error
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const value = useMemo(() => ({
    isConfigured: isSupabaseConfigured,
    loading,
    initError,
    clearInitError: () => setInitError(null),
    session,
    user: pickUserInfo(session?.user),
    profile,
    signInWithKakao: () => signInWith('kakao'),
    signInWithGoogle: () => signInWith('google'),
    signOut,
    createProfile,
    updateNickname,
    deleteAccount,
  }), [loading, initError, session, profile, signInWith, signOut, createProfile, updateNickname, deleteAccount])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다')
  return ctx
}
