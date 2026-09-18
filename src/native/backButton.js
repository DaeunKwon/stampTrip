// Android 물리(제스처) 뒤로 가기 처리.
// @capacitor/app 은 backButton 리스너가 없으면 WebView 히스토리가 있을 때만 뒤로 가고, 없으면 아무 것도 하지 않아
// 첫 화면에서 뒤로 가기를 눌러도 앱이 닫히지 않는다. 리스너를 달아 더 돌아갈 곳이 없으면 앱을 종료한다.
// 팝업/시트가 떠 있을 때는 그것부터 닫는다.
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

// 떠 있는 팝업/시트의 닫기 함수 스택 (나중에 뜬 것이 위). useBackClose 훅이 넣고 뺀다.
const closeHandlers = []

/** 뒤로 가기로 닫을 팝업을 등록한다. 해제 함수를 돌려준다. */
export function registerBackClose(handler) {
  closeHandlers.push(handler)
  return () => {
    const i = closeHandlers.lastIndexOf(handler)
    if (i !== -1) closeHandlers.splice(i, 1)
  }
}

/** 맨 위 팝업을 닫는다. 떠 있는 팝업이 없으면 false */
export function closeTopPopup() {
  const top = closeHandlers[closeHandlers.length - 1]
  if (!top) return false
  top()
  return true
}

/** Android 앱에서만 리스너를 단다. onExitHint: 종료 안내를 띄울 콜백. 해제 함수를 돌려준다. */
export function listenBackButton(onExitHint) {
  if (nativePlatform !== 'android') return () => {}
  let lastHintAt = null
  const handle = App.addListener('backButton', ({ canGoBack }) => {
    // 팝업/시트가 떠 있으면 화면 이동·종료 대신 그것부터 닫는다
    if (closeTopPopup()) return
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
