import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

// 탭(라우트) 이동 시 스크롤을 맨 위로 되돌린다.
// pathname만 감지하므로 같은 경로에서 state만 바꾸는 경우(상세 팝업 열림 기록 등)에는 스크롤이 유지된다.
// 새 화면이 그려지기 전에 스크롤을 옮겨야 이전 스크롤 위치로 잠깐 보였다가 튀는 현상이 없다.
// (팝업의 useBodyScrollLock 해제가 이전 위치로 되돌린 직후, 같은 커밋 안에서 맨 위로 옮긴다)
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
