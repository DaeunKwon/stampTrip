import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// 탭(라우트) 이동 시 스크롤을 맨 위로 되돌린다.
// pathname만 감지하므로 같은 경로에서 state만 바꾸는 경우(상세 팝업 열림 기록 등)에는 스크롤이 유지된다.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
