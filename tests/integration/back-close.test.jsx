import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import ConfirmModal from '../../src/components/ConfirmModal'
import DeleteAccountModal from '../../src/components/DeleteAccountModal'
import { closeTopPopup } from '../../src/native/backButton'

describe('Android 뒤로 가기로 팝업 닫기', () => {
  it('팝업이 떠 있으면 뒤로 가기가 그 팝업을 닫고, 사라진 뒤에는 더 닫을 것이 없다', () => {
    const onClose = vi.fn()
    const { unmount } = render(<ConfirmModal title="삭제할까요?" message="" onConfirm={() => {}} onClose={onClose} />)
    expect(closeTopPopup()).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()
    expect(closeTopPopup()).toBe(false)
  })

  it('처리 중(busy)인 팝업은 뒤로 가기를 눌러도 닫히지 않고, 화면 이동·앱 종료로도 넘어가지 않는다', () => {
    const onClose = vi.fn()
    render(<DeleteAccountModal stampCount={0} favoriteCount={0} busy onConfirm={() => {}} onClose={onClose} />)
    expect(closeTopPopup()).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
  })
})
