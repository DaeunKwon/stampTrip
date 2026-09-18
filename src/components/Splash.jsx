import { useLayoutEffect } from 'react'
import AppIcon from './AppIcon'
import { intro } from '../utils/intro'
import { isNativeApp } from '../native/platform'

/**
 * 세션 복원 중 잠깐 보이는 화면. 네이티브 스플래시와 같은 바탕(다크모드 기기는 짙은 남색) 가운데에
 * 아이콘이 크게 떠오르고, 비로그인이면 로그인 화면이 이 아이콘을 제자리로 줄이며 이어받는다.
 */
export default function Splash() {
  useLayoutEffect(() => {
    if (intro.startedAt === null) intro.startedAt = performance.now()
    return () => { intro.splashEndedAt = performance.now() }
  }, [])

  return (
    <div className={`max-w-md mx-auto min-h-screen bg-white flex items-center justify-center ${isNativeApp ? 'dark:bg-[#111827]' : ''}`}>
      <div role="img" aria-label="스탬프여행" className="intro-splash-icon">
        <AppIcon className="w-16 h-16" />
      </div>
    </div>
  )
}
