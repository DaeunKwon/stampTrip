import { useLayoutEffect } from 'react'
import { intro } from '../utils/intro'
import { isNativeApp } from '../native/platform'

/**
 * 세션 복원 중 잠깐 보이는 빈 화면. 네이티브 스플래시와 같은 바탕(다크모드 기기는 짙은 남색)만 깔아 둔다.
 * 비로그인이면 이어서 뜨는 로그인 화면이 아이콘·문구를 제자리에서 등장시킨다 (여기서 아이콘을 보여주면 위치가 튄다).
 */
export default function Splash() {
  useLayoutEffect(() => () => { intro.splashEndedAt = performance.now() }, [])

  return (
    <div
      role="status"
      aria-label="스탬프여행 불러오는 중"
      className={`max-w-md mx-auto min-h-screen bg-white ${isNativeApp ? 'dark:bg-[#111827]' : ''}`}
    />
  )
}
