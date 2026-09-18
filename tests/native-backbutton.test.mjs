// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { resolveBackAction, EXIT_CONFIRM_MS, registerBackClose, closeTopPopup } from '../src/native/backButton'

describe('resolveBackAction — Android 뒤로 가기 동작', () => {
  it('다른 화면은 돌아갈 히스토리가 있으면 뒤로 간다', () => {
    expect(resolveBackAction('/map', true)).toBe('back')
    expect(resolveBackAction('/my/courses/3', true)).toBe('back')
  })
  it('홈·로그인·온보딩에서는 히스토리가 있어도 처음엔 종료 안내만 띄운다', () => {
    expect(resolveBackAction('/', true, 1000, null)).toBe('hint')
    expect(resolveBackAction('/login', true, 1000, null)).toBe('hint')
    expect(resolveBackAction('/onboarding', false, 1000, null)).toBe('hint')
  })
  it('돌아갈 히스토리가 없으면 어느 화면이든 종료 안내를 띄운다', () => {
    expect(resolveBackAction('/map', false, 1000, null)).toBe('hint')
  })
  it('안내 후 제한 시간 안에 한 번 더 누르면 종료한다', () => {
    expect(resolveBackAction('/', true, 1000 + EXIT_CONFIRM_MS, 1000)).toBe('exit')
    expect(resolveBackAction('/map', false, 1500, 1000)).toBe('exit')
  })
  it('제한 시간이 지난 뒤 누르면 다시 안내부터 한다', () => {
    expect(resolveBackAction('/', true, 1001 + EXIT_CONFIRM_MS, 1000)).toBe('hint')
  })
})

describe('registerBackClose / closeTopPopup — 뒤로 가기로 팝업 닫기', () => {
  it('떠 있는 팝업이 없으면 false 를 돌려줘 화면 이동·종료 판정으로 넘어간다', () => {
    expect(closeTopPopup()).toBe(false)
  })
  it('겹쳐 뜬 팝업은 나중에 뜬 것부터 하나씩 닫는다', () => {
    const closed = []
    const offA = registerBackClose(() => { closed.push('A'); offA() })
    const offB = registerBackClose(() => { closed.push('B'); offB() })
    expect(closeTopPopup()).toBe(true)
    expect(closeTopPopup()).toBe(true)
    expect(closed).toEqual(['B', 'A'])
    expect(closeTopPopup()).toBe(false)
  })
})
