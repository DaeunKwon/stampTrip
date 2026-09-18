// Android 물리(제스처) 뒤로 가기 처리.
// @capacitor/app 은 backButton 리스너가 없으면 WebView 히스토리가 있을 때만 뒤로 가고, 없으면 아무 것도 하지 않아
// 첫 화면에서 뒤로 가기를 눌러도 앱이 닫히지 않는다. 리스너를 달아 더 돌아갈 곳이 없으면 앱을 종료한다.
import { App } from '@capacitor/app'
import { nativePlatform } from './platform'

/** 뒤로 가기를 누르면 이전 화면 대신 앱 종료로 이어지는 화면 (앱의 첫 화면들) */
const EXIT_PATHS = ['/', '/login', '/onboarding']

/** 종료 안내 후 이 시간 안에 한 번 더 눌러야 종료한다 (토스트가 떠 있는 시간과 비슷하게) */
export const EXIT_CONFIRM_MS = 2000

/**
 * 'back' | 'hint' | 'exit' — 현재 경로·WebView 히스토리 유무·직전 종료 안내 시각으로 뒤로 가기 동작을 정한다.
 * 종료할 자리에서 처음 누르면 'hint'(안내만), EXIT_CONFIRM_MS 안에 다시 누르면 'exit'.
 */
export function resolveBackAction(pathname, canGoBack, now = 0, lastHintAt = null) {
  if (!EXIT_PATHS.includes(pathname) && canGoBack) return 'back'
  return lastHintAt != null && now - lastHintAt <= EXIT_CONFIRM_MS ? 'exit' : 'hint'
}

/** Android 앱에서만 리스너를 단다. onExitHint: 종료 안내를 띄울 콜백. 해제 함수를 돌려준다. */
export function listenBackButton(onExitHint) {
  if (nativePlatform !== 'android') return () => {}
  let lastHintAt = null
  const handle = App.addListener('backButton', ({ canGoBack }) => {
    const now = Date.now()
    const action = resolveBackAction(window.location.pathname, canGoBack, now, lastHintAt)
    if (action === 'back') {
      lastHintAt = null
      window.history.back()
    } else if (action === 'exit') {
      App.exitApp()
    } else {
      lastHintAt = now
      onExitHint()
    }
  })
  return () => { handle.then(h => h.remove()) }
}
