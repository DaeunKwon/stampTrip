import { createClient } from '@supabase/supabase-js'

// 대시보드에서 REST 엔드포인트(…/rest/v1/)를 복사해 넣는 실수가 잦아, 프로젝트 루트 URL 로 정리한다
const url = (import.meta.env.VITE_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/(rest|auth|storage|realtime|functions)\/v1\/?$/, '')
  .replace(/\/+$/, '')
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

/** 환경변수가 비어 있으면 로그인 화면에서 안내만 띄우고, 실제 호출은 하지 않는다. */
export const isSupabaseConfigured = Boolean(url && anonKey)

// 값이 없어도 createClient가 throw하지 않도록 더미 URL을 넣어 앱 자체는 뜨게 한다
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      // implicit: 토큰이 URL 해시로 직접 돌아온다. PKCE 는 로그인을 시작한 브라우저 컨텍스트에만
      // code_verifier 가 저장돼서, 홈 화면 PWA·카카오톡 인앱 브라우저처럼 인증 후 다른 컨텍스트로
      // 돌아오는 경우 세션 생성에 조용히 실패한다. SPA 이므로 implicit 으로 그 문제를 피한다.
      flowType: 'implicit',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
