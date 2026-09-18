import { useEffect } from 'react'
import { useToast } from './Toast'
import { listenBackButton } from '../native/backButton'

// Android 물리 뒤로 가기: 더 돌아갈 화면이 없으면 안내 토스트를 띄우고, 한 번 더 누르면 앱을 종료한다.
// (그 외 플랫폼에서는 no-op)
export default function BackButtonHandler() {
  const showToast = useToast()

  useEffect(() => listenBackButton(() => showToast('한 번 더 누르면 종료됩니다')), [showToast])

  return null
}
