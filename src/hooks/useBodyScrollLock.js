import { useEffect } from 'react'

/**
 * 팝업/시트가 떠 있는 동안 뒤 페이지 스크롤을 잠근다.
 *
 * body 에 overflow:hidden 만 주는 방식은 iOS Safari 에서 안 먹는다.
 * - 손가락 스크롤이 그대로 문서로 넘어가고,
 * - 키패드가 뜰 때 Safari 가 입력칸을 보이게 하려고 문서를 임의로 스크롤해 버린 뒤
 *   키패드를 내려도 그 위치에 남아, fixed 팝업과 실제 화면이 어긋나 팝업 안 스크롤이 먹통이 된다.
 * 그래서 body 자체를 position:fixed 로 고정해 문서가 아예 스크롤 불가능하게 만들고,
 * 닫힐 때 원래 스크롤 위치로 되돌린다.
 */
export default function useBodyScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return
    const body = document.body
    const scrollY = window.scrollY
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    return () => {
      Object.assign(body.style, prev)
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}
