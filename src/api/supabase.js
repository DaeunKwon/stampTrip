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
)
