import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake, makeUser, TEST_USER_ID } from '../mocks/supabase'

describe('계정 설정', () => {
  it('연결 계정(마스킹 이메일)과 닉네임을 보여주고 닉네임을 바꿀 수 있다', async () => {
    const user = userEvent.setup()
    fake.signIn({ user: makeUser({ provider: 'google', email: 'daeun@gmail.com', name: '다은' }), profile: { nickname: '테스터' } })
    renderApp({ route: '/settings' })
    expect(await screen.findByRole('heading', { name: '계정 설정' })).toBeInTheDocument()
    expect(screen.getByText('da***@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '테스터 ›' }))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '새')
    expect(screen.getByText('닉네임은 2자 이상이어야 해요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
    await user.type(input, '이름{Enter}')
    expect(await screen.findByText('닉네임을 변경했어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새이름 ›' })).toBeInTheDocument()
    expect(fake.rows('profiles')[0].nickname).toBe('새이름')
  })

  it('닉네임 저장 실패 시 토스트를 띄우고 편집 상태를 유지한다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    fake.failNext('profiles', { code: '23514', message: 'check' }, 'update')
    renderApp({ route: '/settings' })
    await user.click(await screen.findByRole('button', { name: '테스터 ›' }))
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), '바꿈')
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByText('저장에 실패했어요. 다시 시도해 주세요')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('바꿈')
  })

  it('로그아웃하면 세션을 지우고 로그인 화면으로 간다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    renderApp({ route: '/settings' })
    await user.click(await screen.findByRole('button', { name: /로그아웃/ }))
    expect(await screen.findByRole('button', { name: /카카오로 시작하기/ })).toBeInTheDocument()
    expect(fake.client.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('회원 탈퇴는 보유 기록 수를 보여주며 확인받고, RPC 로 삭제 후 로그인 화면으로 간다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    fake.seed('stamps', [{ user_id: TEST_USER_ID, content_id: '1', title: 'a' }, { user_id: TEST_USER_ID, content_id: '2', title: 'b' }])
    fake.seed('favorites', [{ user_id: TEST_USER_ID, content_id: '3', title: 'c' }])
    fake.seed('courses', [{ user_id: TEST_USER_ID, name: 'x', spots: [] }])
    renderApp({ route: '/settings' })
    await user.click(await screen.findByRole('button', { name: /회원 탈퇴/ }))
    expect(await screen.findByText('정말 탈퇴할까요?')).toBeInTheDocument()
    expect(screen.getByText(/내 코스 1개, 스탬프 2개, 관심 목록 1개가/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '계속 사용할게요' }))
    await waitFor(() => expect(screen.queryByText('정말 탈퇴할까요?')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /회원 탈퇴/ }))
    await user.click(await screen.findByRole('button', { name: '탈퇴하기' }))
    expect(await screen.findByRole('button', { name: /카카오로 시작하기/ })).toBeInTheDocument()
    expect(fake.client.rpc).toHaveBeenCalledWith('delete_my_account')
    // cascade: 본인 데이터가 모두 사라진다
    expect(fake.rows('profiles')).toHaveLength(0)
    expect(fake.rows('stamps')).toHaveLength(0)
    expect(fake.rows('courses')).toHaveLength(0)
  })

  it('탈퇴 RPC 가 실패하면 토스트를 띄우고 로그인 상태를 유지한다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    fake.failNext('rpc', { message: 'permission denied' }, 'delete_my_account')
    renderApp({ route: '/settings' })
    await user.click(await screen.findByRole('button', { name: /회원 탈퇴/ }))
    await user.click(await screen.findByRole('button', { name: '탈퇴하기' }))
    expect(await screen.findByText('탈퇴 처리에 실패했어요. 다시 시도해 주세요')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '계정 설정' })).toBeInTheDocument()
    expect(fake.rows('profiles')).toHaveLength(1)
  })
})
