import { useEffect, useRef } from 'react'
import { registerBackClose } from '../native/backButton'

/**
 * 팝업/시트가 떠 있는 동안 Android 뒤로 가기를 누르면 화면 이동 대신 이 팝업을 닫게 한다.
 * blocked 가 true 인 동안(저장·로딩 중 등 닫으면 안 될 때)은 뒤로 가기를 눌러도 아무 일도 하지 않는다.
 * active 가 false 면 등록하지 않는다 (열고 닫히는 드롭다운처럼 항상 마운트돼 있는 경우).
 */
export default function useBackClose(onClose, { blocked = false, active = true } = {}) {
  const latest = useRef({ onClose, blocked })
  latest.current = { onClose, blocked }

  useEffect(() => {
    if (!active) return
    return registerBackClose(() => { if (!latest.current.blocked) latest.current.onClose() })
  }, [active])
}
