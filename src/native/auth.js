// 네이티브 앱(iOS/Android WebView)의 소셜 로그인.
// WebView 안에서는 Google 이 OAuth 를 차단(disallowed_useragent)하고 카카오도 앱 전환이 어색해서,
// 시스템 브라우저(iOS SFSafariViewController / Android Custom Tab)에서 인증하고 딥링크로 돌아온다.
// 흐름: signInWithOAuth(skipBrowserRedirect) 로 URL 만 받음 → Browser.open → 인증 완료 후 Supabase 가
//       stamptrip://auth/callback#access_token=…&refresh_token=… 로 302 → appUrlOpen 이벤트 → setSession
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { AUTH_DEEP_LINK } from './platform'

/** 딥링크 URL 의 해시/쿼리에서 Supabase 토큰 또는 오류를 뽑는다. 우리 딥링크가 아니면 null. */
export function parseAuthDeepLink(url) {
  if (!url?.startsWith(AUTH_DEEP_LINK)) return null
  const rest = url.slice(AUTH_DEEP_LINK.length)
  const params = new URLSearchParams()
  for (const part of rest.split(/[#?]/)) {
    if (!part) continue
    for (const [k, v] of new URLSearchParams(part)) params.set(k, v)
  }
  const error = params.get('error_description') || params.get('error')
  if (error) return { error }
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return { error: '인증 토큰이 없습니다' }
  return { access_token, refresh_token }
}

/** 시스템 브라우저에서 소셜 인증을 시작한다. 결과는 listenAuthDeepLink 로 받는다. */
export async function openNativeOAuth(supabase, provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: AUTH_DEEP_LINK,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw error
  await Browser.open({ url: data.url, presentationStyle: 'popover' })
}

/**
 * 앱이 딥링크로 열릴 때 토큰을 세션으로 바꾼다. 해제 함수를 돌려준다.
 * onResult({ error }) 또는 onResult({ ok: true })
 */
export function listenAuthDeepLink(supabase, onResult) {
  const handle = App.addListener('appUrlOpen', async ({ url }) => {
    const parsed = parseAuthDeepLink(url)
    if (!parsed) return
    // 인증 브라우저 시트를 닫는다 (Android Custom Tab 은 자동으로 닫히므로 실패해도 무시)
    Browser.close().catch(() => {})
    if (parsed.error) {
      onResult({ error: parsed.error })
      return
    }
    const { error } = await supabase.auth.setSession(parsed)
    onResult(error ? { error: error.message } : { ok: true })
  })
  return () => { handle.then(h => h.remove()) }
}
